from __future__ import annotations

import argparse
from pathlib import Path

from common import load_json


FULL_BLEED_BOX = [0, 0, 1448, 1086]
INTEGRATED_PANEL_BOX = [62, 790, 1386, 1034]
INTEGRATED_BADGE_BOX = [1278, 928, 1374, 1024]
SAFE_ZONE_TOP = 760
REPAIR_ILLUSTRATION_BOX = [0, 0, 1448, 815]
REPAIR_TEXT_AREA_BOX = [0, 815, 1448, 1086]
FINAL_REVIEW_CHECKS = (
    "subjectPlacement",
    "safeZoneCompliance",
    "panelIntegration",
    "consistentPanelSize",
    "consistentBadgePlacement",
    "noBlockedStoryAction",
)


def boxes_overlap(left: list[int], right: list[int]) -> bool:
    return left[0] < right[2] and left[2] > right[0] and left[1] < right[3] and left[3] > right[1]


def validate_text(story: dict, narration: list, manifest: dict, visual_review: dict | None = None) -> list[str]:
    errors = []
    pages = story.get("pages", [])
    expected_text = [page.get("text") for page in pages]
    if len(narration) != len(pages):
        errors.append(f"narration count {len(narration)} does not equal page count {len(pages)}")
    for index, text in enumerate(expected_text):
        if index >= len(narration) or narration[index] != text:
            errors.append(f"narration entry {index + 1} does not exactly match story.json")

    records = {record.get("pageBadge"): record for record in manifest.get("pages", []) if record.get("pageBadge") is not None}
    review_records = {
        record.get("number"): record
        for record in (visual_review or {}).get("pages", [])
        if record.get("number") is not None
    }
    if visual_review and visual_review.get("storySlug") != story.get("slug"):
        errors.append("visual-review storySlug does not match story")
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
        layout = record.get("layout")
        if layout == "integrated_full_bleed":
            if record.get("illustrationBox") != FULL_BLEED_BOX or record.get("fullBleed") is not True:
                errors.append(f"Page {number} illustration is not full-bleed")
            if record.get("panelBox") != INTEGRATED_PANEL_BOX or record.get("textAreaBox") != INTEGRATED_PANEL_BOX:
                errors.append(f"Page {number} integrated panel dimensions are inconsistent")
            if record.get("badgeBox") != INTEGRATED_BADGE_BOX:
                errors.append(f"Page {number} badge is clipped or misplaced")
            if record.get("safeZoneTop") != SAFE_ZONE_TOP:
                errors.append(f"Page {number} has an incorrect text-safe zone")
            if record.get("letterboxed") is not False:
                errors.append(f"Page {number} illustration is letterboxed or visibly shrunk")
            if record.get("outerFrame") is not False:
                errors.append(f"Page {number} has a forbidden outer cream frame")
            if record.get("requiredArtworkOverlap") is not False:
                errors.append(f"Page {number} panel covers required artwork")
            subject_boxes = record.get("requiredSubjectBoxes")
            if not isinstance(subject_boxes, list) or not subject_boxes:
                errors.append(f"Page {number} is missing required-subject bounds")
            else:
                for subject in subject_boxes:
                    label = subject.get("label", "unnamed subject") if isinstance(subject, dict) else "unnamed subject"
                    box = subject.get("box") if isinstance(subject, dict) else None
                    valid_box = (
                        isinstance(box, list)
                        and len(box) == 4
                        and all(isinstance(value, (int, float)) for value in box)
                        and box[0] >= 0
                        and box[1] >= 0
                        and box[2] <= FULL_BLEED_BOX[2]
                        and box[3] <= SAFE_ZONE_TOP
                        and box[0] < box[2]
                        and box[1] < box[3]
                    )
                    if not valid_box:
                        errors.append(f"Page {number} required subject '{label}' enters the text-safe zone")
                labels = {subject.get("label") for subject in subject_boxes if isinstance(subject, dict)}
                for character in page.get("requiredCharacters", []):
                    if character not in labels:
                        errors.append(f"Page {number} visual review is missing required character {character}")
            review = review_records.get(number)
            if not review:
                errors.append(f"Page {number} is missing the required final visual review")
            else:
                reviewed_boxes = []
                for subject in review.get("requiredSubjectBoxes", []):
                    if (
                        isinstance(subject, dict)
                        and isinstance(subject.get("box"), list)
                        and all(isinstance(value, (int, float)) for value in subject["box"])
                    ):
                        reviewed_boxes.append({"label": subject.get("label"), "box": [round(value) for value in subject["box"]]})
                    else:
                        reviewed_boxes.append(subject)
                if reviewed_boxes != subject_boxes:
                    errors.append(f"Page {number} reviewed subject bounds do not match the composition manifest")
                checks = review.get("finalChecks", {})
                for check in FINAL_REVIEW_CHECKS:
                    if checks.get(check) != "passed":
                        errors.append(f"Page {number} final visual review did not pass {check}")
        elif layout == "separate_illustration_and_text":
            illustration_box = record.get("illustrationBox")
            text_area_box = record.get("textAreaBox")
            if illustration_box != REPAIR_ILLUSTRATION_BOX:
                errors.append(f"Page {number} has an incorrect repair illustration area")
            if text_area_box != REPAIR_TEXT_AREA_BOX:
                errors.append(f"Page {number} has an incorrect repair text area")
            if isinstance(illustration_box, list) and isinstance(text_area_box, list) and boxes_overlap(illustration_box, text_area_box):
                errors.append(f"Page {number} repair illustration and text areas overlap")
            if record.get("overlap") is not False:
                errors.append(f"Page {number} repair layout is not certified as non-overlapping")
        else:
            errors.append(f"Page {number} has an unknown or missing composition layout")
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
    parser.add_argument("--visual-review", help="Required batch visual-review JSON for integrated pages.")
    args = parser.parse_args()
    visual_review = load_json(args.visual_review) if args.visual_review else None
    errors = validate_text(load_json(args.story), load_json(args.narration), load_json(args.manifest), visual_review)
    if errors:
        print("TEXT VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("TEXT VALIDATION PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
