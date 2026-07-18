from __future__ import annotations

import argparse
from collections import defaultdict
from pathlib import Path

from PIL import Image

from common import FINAL_NAMES, FINAL_SIZE, difference_hash, hamming_distance, load_json, sha256


def validate_assets(story_slug: str, assets_dir: Path) -> list[str]:
    errors = []
    images = {path.name: path for path in assets_dir.glob("*.webp")}
    expected = set(FINAL_NAMES)
    if set(images) != expected:
        missing = sorted(expected - set(images))
        extra = sorted(set(images) - expected)
        if missing:
            errors.append(f"missing images: {', '.join(missing)}")
        if extra:
            errors.append(f"unexpected images: {', '.join(extra)}")

    hashes = defaultdict(list)
    perceptual = {}
    for name, path in images.items():
        if path.stat().st_size == 0:
            errors.append(f"zero-byte image: {name}")
            continue
        try:
            with Image.open(path) as image:
                image.load()
                if image.size != FINAL_SIZE:
                    errors.append(f"{name}: expected {FINAL_SIZE[0]}x{FINAL_SIZE[1]}, found {image.width}x{image.height}")
                perceptual[name] = difference_hash(image)
        except Exception as exc:
            errors.append(f"cannot open {name}: {exc}")
            continue
        hashes[sha256(path)].append(name)

    for names in hashes.values():
        if len(names) > 1:
            errors.append(f"duplicate file hash: {', '.join(sorted(names))}")
    names = sorted(perceptual)
    for index, left in enumerate(names):
        for right in names[index + 1:]:
            if hamming_distance(perceptual[left], perceptual[right]) <= 2:
                errors.append(f"duplicate perceptual-image hash: {left}, {right}")

    provenance_path = assets_dir / "provenance.json"
    if not provenance_path.exists():
        errors.append("missing provenance.json; origin and single-scene validation are required")
    else:
        provenance = load_json(provenance_path)
        if provenance.get("storySlug") != story_slug:
            errors.append("provenance storySlug does not match story")
        records = provenance.get("assets", [])
        by_file = {record.get("file"): record for record in records}
        if set(by_file) != expected:
            errors.append("provenance must contain exactly cover.webp and page-01.webp through page-15.webp")
        for name in expected & set(by_file):
            record = by_file[name]
            source = Path(record.get("sourceIllustration", ""))
            normalized_parts = [part.casefold() for part in source.parts]
            required_sequence = ["staging", story_slug.casefold(), "illustrations"]
            joined = "/".join(normalized_parts)
            if "/".join(required_sequence) not in joined:
                errors.append(f"{name}: source illustration is not from same-story staging directory {story_slug}")
            if "assets/books" in joined:
                errors.append(f"{name}: old app artwork cannot be used as a source illustration")
            if record.get("compositionType") != "single_scene":
                errors.append(f"{name}: collage/grid/contact-sheet/multi-panel output is forbidden")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate final Nolan story images.")
    parser.add_argument("story")
    parser.add_argument("assets_dir")
    args = parser.parse_args()
    story = load_json(args.story)
    errors = validate_assets(story["slug"], Path(args.assets_dir))
    if errors:
        print("ASSET VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("ASSET VALIDATION PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
