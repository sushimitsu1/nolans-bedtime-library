from __future__ import annotations

import argparse
from pathlib import Path

from common import load_json


EXPECTED_ILLUSTRATION_BOX = [0, 0, 1448, 815]
EXPECTED_TEXT_AREA_BOX = [0, 815, 1448, 1086]


def boxes_overlap(left: list[int], right: list[int]) -> bool:
    return left[0] < right[2] and left[2] > right[0] and left[1] < right[3] and left[3] > right[1]


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
        if record.get("layout") != "separate_illustration_and_text":
            errors.append(f"Page {number} does not use the separate illustration-and-text layout")
        illustration_box = record.get("illustrationBox")
        text_area_box = record.get("textAreaBox")
        if illustration_box != EXPECTED_ILLUSTRATION_BOX:
            errors.append(f"Page {number} has an incorrect illustration area")
        if text_area_box != EXPECTED_TEXT_AREA_BOX:
            errors.append(f"Page {number} has an incorrect text area")
        if isinstance(illustration_box, list) and isinstance(text_area_box, list) and boxes_overlap(illustration_box, text_area_box):
            errors.append(f"Page {number} illustration and text areas overlap")
        if record.get("overlap") is not False:
            errors.append(f"Page {number} is not certified as non-overlapping")
        if record.get("textFits") is not True:
            errors.append(f"Page {number} text does not fit the approved text area")
    cover = next((record for record in manifest.get("pages", []) if record.get("file") == "cover.webp"), None)
    if not cover:
        errors.append("missing composition-manifest record for cover.webp")
    elif cover.get("text") is not None or cover.get("pageBadge") is not None or cover.get("panel") is not False:
        errors.append("cover must not have story text, a panel, or a page badge")
    elif cover.get("layout") != "full_page_cover" or cover.get("textAreaBox") is not None:
        errors.append("cover must use the full-page cover layout without a text area")
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
