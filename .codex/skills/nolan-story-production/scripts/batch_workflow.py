#!/usr/bin/env python3
"""Deterministic guards for Nolan's three-phase batch workflow."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

from PIL import Image

PAGE_COUNT = 15
FINAL_SIZE = (1448, 1086)
READY = "ready_to_publish"
REVIEW = "needs_review"
CONTACT_SHEET = "qa-contact-sheet.webp"
REQUIRED_CHECKS = {
    "subjectPlacement",
    "safeZoneCompliance",
    "panelIntegration",
    "consistentPanelSize",
    "consistentBadgePlacement",
    "noBlockedStoryAction",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def select_five(inventory: list[dict], requested: list[str] | None = None) -> list[dict]:
    eligible = {item["slug"]: item for item in inventory if item.get("status") == "not_started"}
    slugs = requested if requested is not None else list(eligible)[:5]
    if len(slugs) != 5 or len(set(slugs)) != 5:
        raise ValueError("Batch planning requires exactly five distinct stories.")
    missing = [slug for slug in slugs if slug not in eligible]
    if missing:
        raise ValueError(f"Stories are not eligible not_started records: {', '.join(missing)}")
    return [eligible[slug] for slug in slugs]


def isolation_errors(slug: str, changed_paths: list[str]) -> list[str]:
    prefixes = (f"production/stories/{slug}/", f"assets/books/{slug}/")
    errors = []
    for raw in changed_paths:
        path = raw.replace("\\", "/").lstrip("./")
        if not path.startswith(prefixes):
            errors.append(raw)
    return errors


def story_text(story_dir: Path) -> list[str]:
    pages = load_json(story_dir / "story.json").get("pages", [])
    texts = [page.get("text") for page in pages]
    if len(texts) != PAGE_COUNT or any(not isinstance(text, str) or not text for text in texts):
        raise ValueError("story.json must contain exactly 15 non-empty page texts.")
    return texts


def narration_for(repo_root: Path, slugs: list[str]) -> dict[str, list[str]]:
    return {slug: story_text(repo_root / "production" / "stories" / slug) for slug in slugs}


def _asset_errors(asset_dir: Path) -> list[str]:
    expected = ["cover.webp"] + [f"page-{number:02d}.webp" for number in range(1, 16)]
    errors, hashes = [], {}
    actual = sorted(path.name for path in asset_dir.glob("*.webp")) if asset_dir.exists() else []
    if actual != sorted(expected):
        errors.append("final asset filenames must be exactly one cover and Pages 1-15")
    for name in expected:
        path = asset_dir / name
        if not path.is_file():
            continue
        try:
            with Image.open(path) as image:
                image.load()
                if image.format != "WEBP":
                    errors.append(f"{name} is not encoded as WebP")
                if image.size != FINAL_SIZE:
                    errors.append(f"{name} dimensions are {image.size}, expected {FINAL_SIZE}")
        except Exception as exc:
            errors.append(f"{name} cannot be opened: {exc}")
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in hashes:
            errors.append(f"duplicate asset hash: {name} and {hashes[digest]}")
        hashes[digest] = name
    return errors


def _manifest_errors(story_dir: Path, texts: list[str]) -> list[str]:
    try:
        records = load_json(story_dir / "composition-manifest.json").get("pages", [])
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        return [f"composition manifest unavailable: {exc}"]
    by_file = {record.get("file"): record for record in records}
    errors = []
    for number, text in enumerate(texts, 1):
        name = f"page-{number:02d}.webp"
        record = by_file.get(name, {})
        if record.get("text") != text:
            errors.append(f"{name} manifest text differs from story.json")
        if record.get("pageBadge") != number:
            errors.append(f"{name} badge is not {number}")
        if record.get("layout") != "integrated_full_bleed" or record.get("fullBleed") is not True:
            errors.append(f"{name} is not integrated full-bleed")
    return errors


def _review_errors(story_dir: Path) -> list[str]:
    try:
        records = load_json(story_dir / "visual-review.json").get("pages", [])
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        return [f"visual review unavailable: {exc}"]
    if len(records) != PAGE_COUNT:
        return ["visual review must contain exactly 15 pages"]
    errors = []
    for index, record in enumerate(records, 1):
        if not record.get("requiredSubjectBoxes"):
            errors.append(f"Page {index} lacks required-subject bounds")
        checks = record.get("finalChecks", {})
        if any(checks.get(name) != "passed" for name in REQUIRED_CHECKS):
            errors.append(f"Page {index} visual checks are incomplete")
    return errors


def validate_package(repo_root: Path, slug: str) -> list[str]:
    story_dir = repo_root / "production" / "stories" / slug
    asset_dir = repo_root / "assets" / "books" / slug
    try:
        status = load_json(story_dir / "package-status.json").get("status")
    except (FileNotFoundError, json.JSONDecodeError) as exc:
        return [f"package status unavailable: {exc}"]
    if status != READY:
        return [f"package status is {status!r}, not {READY!r}"]
    errors = []
    if list(story_dir.rglob(CONTACT_SHEET)) or list(asset_dir.rglob(CONTACT_SHEET)):
        errors.append("temporary QA contact sheet still exists")
    try:
        texts = story_text(story_dir)
        if load_json(story_dir / "narration.json") != texts:
            errors.append("narration does not exactly equal story.json page text")
    except (FileNotFoundError, json.JSONDecodeError, ValueError) as exc:
        errors.append(str(exc))
        return errors
    errors.extend(_asset_errors(asset_dir))
    errors.extend(_manifest_errors(story_dir, texts))
    errors.extend(_review_errors(story_dir))
    return errors


def eligible_packages(repo_root: Path, slugs: list[str]) -> dict:
    ready, excluded, invalid = [], [], {}
    for slug in slugs:
        status_path = repo_root / "production" / "stories" / slug / "package-status.json"
        try:
            status = load_json(status_path).get("status")
        except (FileNotFoundError, json.JSONDecodeError) as exc:
            invalid[slug] = [f"package status unavailable: {exc}"]
            continue
        if status == REVIEW:
            excluded.append(slug)
            continue
        errors = validate_package(repo_root, slug)
        if errors:
            invalid[slug] = errors
        else:
            ready.append(slug)
    return {"ready": ready, "excluded": excluded, "invalid": invalid}


def bump_cache_text(source: str) -> tuple[str, str, str]:
    pattern = re.compile(r"(const\s+CACHE\s*=\s*['\"][^'\"]*?-v)(\d+)(['\"]\s*;)")
    match = pattern.search(source)
    if not match or len(pattern.findall(source)) != 1:
        raise ValueError("Expected exactly one numeric CACHE version declaration.")
    before, after = match.group(2), str(int(match.group(2)) + 1)
    updated, count = pattern.subn(lambda item: item.group(1) + after + item.group(3), source, count=1)
    if count != 1:
        raise ValueError("Cache version was not changed exactly once.")
    return updated, before, after


def cleanup_contact_sheet(story_dir: Path) -> int:
    removed = 0
    for path in story_dir.rglob(CONTACT_SHEET):
        path.unlink()
        removed += 1
    return removed


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)
    plan = sub.add_parser("plan")
    plan.add_argument("inventory")
    plan.add_argument("slugs", nargs="*")
    isolate = sub.add_parser("isolation")
    isolate.add_argument("slug")
    isolate.add_argument("paths", nargs="+")
    eligible = sub.add_parser("eligible")
    eligible.add_argument("repo_root")
    eligible.add_argument("slugs", nargs="+")
    narration = sub.add_parser("narration")
    narration.add_argument("repo_root")
    narration.add_argument("slugs", nargs="+")
    bump = sub.add_parser("bump-cache")
    bump.add_argument("file")
    cleanup = sub.add_parser("cleanup-contact-sheet")
    cleanup.add_argument("story_dir")
    args = parser.parse_args()
    if args.command == "plan":
        inventory = load_json(Path(args.inventory))
        records = inventory.get("stories", inventory) if isinstance(inventory, dict) else inventory
        print(json.dumps(select_five(records, args.slugs or None), indent=2))
    elif args.command == "isolation":
        failures = isolation_errors(args.slug, args.paths)
        if failures:
            raise SystemExit("Disallowed producer paths: " + ", ".join(failures))
        print("Isolation scope passed.")
    elif args.command == "eligible":
        result = eligible_packages(Path(args.repo_root), args.slugs)
        print(json.dumps(result, indent=2))
        if result["invalid"]:
            raise SystemExit(1)
    elif args.command == "narration":
        print(json.dumps(narration_for(Path(args.repo_root), args.slugs), indent=2, ensure_ascii=False))
    elif args.command == "bump-cache":
        path = Path(args.file)
        updated, before, after = bump_cache_text(path.read_text(encoding="utf-8"))
        path.write_text(updated, encoding="utf-8")
        print(f"Cache version changed once: {before} -> {after}")
    else:
        print(f"Removed {cleanup_contact_sheet(Path(args.story_dir))} QA contact sheet(s).")


if __name__ == "__main__":
    main()
