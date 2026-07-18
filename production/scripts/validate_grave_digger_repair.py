from __future__ import annotations

from pathlib import Path

from PIL import Image

from common import load_json, sha256


ROOT = Path(__file__).resolve().parents[2]
STORY_DIR = ROOT / "production" / "stories" / "grave-digger"
STAGING_DIR = ROOT / "production" / "staging" / "grave-digger"
ASSET_DIR = ROOT / "assets" / "books" / "grave-digger"
REPAIR_PAGES = tuple(range(10, 16))
FINAL_SIZE = (1448, 1086)
PANEL_BOX = [62, 790, 1386, 1034]
BADGE_BOX = [1278, 928, 1374, 1024]
FINAL_CHECKS = (
    "subjectPlacement",
    "safeZoneCompliance",
    "panelIntegration",
    "consistentPanelSize",
    "consistentBadgePlacement",
    "noBlockedStoryAction",
)


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def main() -> int:
    errors: list[str] = []
    story = load_json(STORY_DIR / "story.json")
    narration = load_json(STORY_DIR / "narration.json")
    repair = load_json(STORY_DIR / "repair-pages-10-15.json")
    baseline = load_json(STORY_DIR / "preserved-baseline.json")
    review = load_json(STAGING_DIR / "visual-review.json")
    manifest = load_json(STAGING_DIR / "final" / "composition-manifest.json")
    provenance = load_json(STAGING_DIR / "final" / "provenance.json")

    pages = story.get("pages", [])
    if len(pages) != 15 or [page.get("number") for page in pages] != list(range(1, 16)):
        fail(errors, "story source must contain Pages 1-15 in order")
    expected_text = [page.get("text") for page in pages]
    if narration != expected_text:
        fail(errors, "narration must contain exactly 15 entries equal to story text")
    if narration[:9] != baseline.get("narrationPages1to9"):
        fail(errors, "narration Pages 1-9 changed")

    repair_records = repair.get("pages", [])
    if [record.get("number") for record in repair_records] != list(REPAIR_PAGES):
        fail(errors, "repair source must contain exactly Pages 10-15")
    for record in repair_records:
        number = record.get("number")
        if number in REPAIR_PAGES:
            text = expected_text[number - 1]
            if record.get("text") != text or record.get("narrationText") != text:
                fail(errors, f"Page {number} repair text and narration are not identical")

    for name, expected_hash in baseline.get("assets", {}).items():
        path = ASSET_DIR / name
        if not path.exists() or sha256(path) != expected_hash:
            fail(errors, f"protected asset changed: {name}")

    manifest_by_badge = {record.get("pageBadge"): record for record in manifest.get("pages", [])}
    review_by_number = {record.get("number"): record for record in review.get("pages", [])}
    expected_files = {f"page-{number:02d}.webp" for number in REPAIR_PAGES}
    if {record.get("file") for record in manifest.get("pages", [])} != expected_files:
        fail(errors, "composition manifest must contain exactly Pages 10-15")

    final_hashes: set[str] = set()
    raw_hashes: set[str] = set()
    for number in REPAIR_PAGES:
        name = f"page-{number:02d}.webp"
        raw_path = STAGING_DIR / "illustrations" / name
        final_path = STAGING_DIR / "final" / name
        live_path = ASSET_DIR / name
        for label, path in (("raw", raw_path), ("final", final_path), ("live", live_path)):
            if not path.exists():
                fail(errors, f"missing {label} Page {number}")
                continue
            with Image.open(path) as image:
                if image.size != FINAL_SIZE:
                    fail(errors, f"{label} Page {number} is not 1448x1086")
        if final_path.exists() and live_path.exists() and sha256(final_path) != sha256(live_path):
            fail(errors, f"live Page {number} does not equal validated final output")
        if raw_path.exists():
            raw_hashes.add(sha256(raw_path))
        if final_path.exists():
            final_hashes.add(sha256(final_path))

        record = manifest_by_badge.get(number)
        if not record:
            fail(errors, f"missing manifest record for Page {number}")
            continue
        required = {
            "layout": "integrated_full_bleed",
            "illustrationBox": [0, 0, 1448, 1086],
            "panelBox": PANEL_BOX,
            "textAreaBox": PANEL_BOX,
            "badgeBox": BADGE_BOX,
            "safeZoneTop": 760,
            "fullBleed": True,
            "letterboxed": False,
            "outerFrame": False,
            "requiredArtworkOverlap": False,
            "textFits": True,
        }
        for key, value in required.items():
            if record.get(key) != value:
                fail(errors, f"Page {number} failed integrated-layout field {key}")
        if record.get("text") != expected_text[number - 1]:
            fail(errors, f"Page {number} visible text differs from story source")
        boxes = record.get("requiredSubjectBoxes", [])
        if not boxes or any(subject.get("box", [0, 0, 0, 9999])[3] > 760 for subject in boxes):
            fail(errors, f"Page {number} required subject enters the safe zone")
        reviewed = review_by_number.get(number, {})
        if reviewed.get("requiredSubjectBoxes") != boxes:
            fail(errors, f"Page {number} reviewed boxes differ from manifest")
        for check in FINAL_CHECKS:
            if reviewed.get("finalChecks", {}).get(check) != "passed":
                fail(errors, f"Page {number} did not pass {check}")

    if len(raw_hashes) != 6 or len(final_hashes) != 6:
        fail(errors, "Pages 10-15 must be six distinct raw and final images")
    if review.get("rawArtChecks") != {
        "generatedText": "passed",
        "singleScene": "passed",
        "characterStyleContinuity": "passed",
    }:
        fail(errors, "raw-art visual review is incomplete")
    if review.get("transitionChecks", {}).get("page9To10") != "passed":
        fail(errors, "Page 9-to-10 transition review is incomplete")

    provenance_files = {record.get("file") for record in provenance.get("assets", [])}
    if provenance_files != expected_files:
        fail(errors, "provenance must contain exactly the six rebuilt pages")
    if any(record.get("compositionType") != "single_scene" for record in provenance.get("assets", [])):
        fail(errors, "all rebuilt pages must be single-scene compositions")

    if errors:
        print("GRAVE DIGGER REPAIR VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("GRAVE DIGGER REPAIR VALIDATION PASSED")
    print("- protected cover and Pages 1-9: unchanged")
    print("- rebuilt Pages 10-15: six distinct 1448x1086 integrated full-bleed pages")
    print("- narration: 15 exact story-text entries")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
