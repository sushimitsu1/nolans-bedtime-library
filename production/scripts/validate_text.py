from __future__ import annotations

import argparse
from pathlib import Path

from common import load_json


def validate_text(story: dict, narration: list, manifest: dict) -> list[str]:
    errors = []
    pages = story.get("pages", [])
    expected_text = [page.get("text") for page in pages]
    if len(narration) != len(pages):
        errors.append(f"narration count {len(narration)} does not equal page count {len(pages)}")
    for index, text in enumerate(expected_text):
        if index >= len(narration) or narration[index] != text:
            errors.append(f"narration entry {index + 1} does not exactly match story.json")

    records = {record.get("pageBadge"): record for record in manifest.get("pages", []) if record.get("pageBadge") is not None}
    for page in pages:
        number = page.get("number")
        record = records.get(number)
        if not record:
            errors.append(f"missing composition-manifest record for Page {number}")
            continue
        if record.get("text") != page.get("text"):
            errors.append(f"visible text for Page {number} was not generated from story.json")
        if record.get("pageBadge") != number:
            errors.append(f"page badge for Page {number} is incorrect")
        if record.get("panel") is not True:
            errors.append(f"Page {number} is missing the approved text panel")
    cover = next((record for record in manifest.get("pages", []) if record.get("file") == "cover.webp"), None)
    if not cover:
        errors.append("missing composition-manifest record for cover.webp")
    elif cover.get("text") is not None or cover.get("pageBadge") is not None or cover.get("panel") is not False:
        errors.append("cover must not have story text, a panel, or a page badge")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate exact narration, visible text, and page badges.")
    parser.add_argument("story")
    parser.add_argument("narration")
    parser.add_argument("manifest")
    args = parser.parse_args()
    errors = validate_text(load_json(args.story), load_json(args.narration), load_json(args.manifest))
    if errors:
        print("TEXT VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("TEXT VALIDATION PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
