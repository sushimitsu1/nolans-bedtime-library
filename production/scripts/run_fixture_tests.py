from __future__ import annotations

import json
import shutil
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw

from common import FINAL_NAMES, FINAL_SIZE, write_json
from compose_page import (
    FULL_BLEED_BOX,
    INTEGRATED_BADGE_BOX,
    INTEGRATED_PANEL_BOX,
    SAFE_ZONE_TOP,
    compose,
)
from validate_assets import validate_assets
from validate_story import validate_story
from validate_text import validate_text


def fixture_story() -> dict:
    pages = []
    for number in range(1, 16):
        if number == 1:
            text = "Milo rolled into the sunny garden. He was ready for a gentle day."
        elif number == 4:
            text = "But a little wagon was stuck beside the path. Milo stopped to look."
        elif number == 10:
            text = "Together, the friends helped pull the wagon onto the safe path."
        elif number == 15:
            text = "That night, Milo rested under the moon. Goodnight, sleepy garden."
        else:
            text = f"On page {number}, Milo carefully completed a new garden task."
        pages.append({
            "number": number,
            "text": text,
            "illustrationScene": f"Unique garden event {number}",
            "requiredCharacters": ["Milo"],
            "timeOfDay": "day" if number < 14 else "evening",
            "continuityNotes": f"Keep Milo's blue paint unchanged in scene {number}.",
        })
    return {
        "title": "Milo's Fixture Story",
        "slug": "milo-fixture-story",
        "category": "Construction Vehicles",
        "description": "A temporary validator fixture.",
        "characterBible": {"Milo": "Small blue garden tractor."},
        "settingBible": {"garden": "Warm, friendly garden."},
        "continuityRules": ["Milo remains blue."],
        "pages": pages,
    }


def assert_contains(errors: list[str], phrase: str) -> None:
    if not any(phrase in error for error in errors):
        raise AssertionError(f"Expected '{phrase}' in {errors}")


def make_images(final_dir: Path, slug: str) -> None:
    final_dir.mkdir(parents=True)
    source_root = final_dir.parent / "staging" / slug / "illustrations"
    source_root.mkdir(parents=True, exist_ok=True)
    records = []
    for index, name in enumerate(FINAL_NAMES):
        image = Image.new("RGB", FINAL_SIZE, (40 + index * 7, 80 + index * 5, 120 + index * 3))
        draw = ImageDraw.Draw(image)
        draw.rectangle((30 + index * 17, 60, 500 + index * 9, 700), fill=(220, 180 - index * 4, 40 + index * 6))
        image.save(final_dir / name, "WEBP", quality=90)
        source = source_root / name
        image.save(source, "WEBP", quality=90)
        records.append({"file": name, "sourceIllustration": str(source), "compositionType": "single_scene"})
    write_json(final_dir / "provenance.json", {"storySlug": slug, "assets": records})


def main() -> int:
    results = []
    with tempfile.TemporaryDirectory(prefix="nolan-production-tests-") as temporary:
        root = Path(temporary)
        story = fixture_story()

        missing_page = json.loads(json.dumps(story))
        missing_page["pages"].pop()
        assert_contains(validate_story(missing_page), "exactly 15 pages")
        results.append("PASS story validation catches a missing page")

        duplicate_text = json.loads(json.dumps(story))
        duplicate_text["pages"][1]["text"] = duplicate_text["pages"][0]["text"]
        assert_contains(validate_story(duplicate_text), "duplicate page text")
        results.append("PASS duplicate-text validation catches repetition")

        final_dir = root / "assets"
        make_images(final_dir, story["slug"])
        (final_dir / "page-15.webp").unlink()
        assert_contains(validate_assets(story["slug"], final_dir), "missing images")
        results.append("PASS asset validation catches a missing image")

        make_images(root / "copy-test", story["slug"])
        shutil.copyfile(root / "copy-test" / "page-01.webp", root / "copy-test" / "page-02.webp")
        duplicate_errors = validate_assets(story["slug"], root / "copy-test")
        assert_contains(duplicate_errors, "duplicate file hash")
        assert_contains(duplicate_errors, "duplicate perceptual-image hash")
        results.append("PASS duplicate-image validation catches copied artwork")

        source = root / "sample-source.png"
        Image.new("RGB", (1600, 1200), "#8CC8EA").save(source)
        output = root / "sample-page.webp"
        subject_boxes = [{"label": "Milo", "box": [380, 140, 980, 650]}]
        record = compose(source, output, story["pages"][0]["text"], 1, required_subject_boxes=subject_boxes)
        with Image.open(output) as composed:
            assert composed.size == FINAL_SIZE
            assert composed.getpixel((724, 400))[2] > composed.getpixel((724, 400))[0]
            for corner in ((10, 10), (1438, 10), (10, 1075), (1438, 1075)):
                pixel = composed.getpixel(corner)
                assert pixel[2] > pixel[0], f"unexpected outer frame at {corner}: {pixel}"
        assert record["pageBadge"] == 1 and record["text"] == story["pages"][0]["text"]
        assert record["layout"] == "integrated_full_bleed"
        assert record["illustrationBox"] == list(FULL_BLEED_BOX)
        assert record["panelBox"] == list(INTEGRATED_PANEL_BOX)
        assert record["badgeBox"] == list(INTEGRATED_BADGE_BOX)
        assert record["fullBleed"] is True and record["letterboxed"] is False and record["outerFrame"] is False
        assert record["textFits"] is True
        results.append("PASS compliant 4:3 artwork produces a full-bleed integrated page with exact text and dimensions")

        try:
            compose(
                source,
                root / "unsafe-subject-page.webp",
                story["pages"][1]["text"],
                2,
                required_subject_boxes=[{"label": "Milo", "box": [380, 300, 980, SAFE_ZONE_TOP + 40]}],
            )
            raise AssertionError("Expected a subject inside the safe zone to fail composition")
        except ValueError as exc:
            assert "enters the text-safe zone" in str(exc)
        results.append("PASS compositor rejects a required subject inside the text-safe zone")

        repair_source = root / "legacy-square-source.png"
        Image.new("RGB", (800, 800), "#8CC8EA").save(repair_source)
        try:
            compose(repair_source, root / "forbidden-default-fallback.webp", story["pages"][2]["text"], 3, required_subject_boxes=subject_boxes)
            raise AssertionError("Expected non-4:3 legacy artwork to fail the default layout")
        except ValueError as exc:
            assert "require a 4:3 source" in str(exc)
        repair_record = compose(
            repair_source,
            root / "repair-fallback-page.webp",
            story["pages"][2]["text"],
            3,
            layout="repair_fallback",
        )
        assert repair_record["layout"] == "separate_illustration_and_text"
        results.append("PASS separated layout remains available only through explicit repair fallback")

        try:
            compose(source, root / "overflow-page.webp", "word " * 1000, 2, required_subject_boxes=subject_boxes)
            raise AssertionError("Expected oversized page text to fail composition")
        except ValueError as exc:
            assert "does not fit" in str(exc)
        results.append("PASS compositor clearly rejects text that cannot fit")

        integrated_pages = []
        review_pages = []
        for page in story["pages"]:
            boxes = [{"label": "Milo", "box": [380, 140, 980, 650]}]
            integrated_pages.append({
                "file": f"page-{page['number']:02d}.webp",
                "text": page["text"],
                "pageBadge": page["number"],
                "panel": True,
                "layout": "integrated_full_bleed",
                "illustrationBox": list(FULL_BLEED_BOX),
                "textAreaBox": list(INTEGRATED_PANEL_BOX),
                "panelBox": list(INTEGRATED_PANEL_BOX),
                "badgeBox": list(INTEGRATED_BADGE_BOX),
                "safeZoneTop": SAFE_ZONE_TOP,
                "requiredSubjectBoxes": boxes,
                "requiredArtworkOverlap": False,
                "fullBleed": True,
                "letterboxed": False,
                "outerFrame": False,
                "textFits": True,
            })
            review_pages.append({
                "number": page["number"],
                "requiredSubjectBoxes": boxes,
                "finalChecks": {
                    "subjectPlacement": "passed",
                    "safeZoneCompliance": "passed",
                    "panelIntegration": "passed",
                    "consistentPanelSize": "passed",
                    "consistentBadgePlacement": "passed",
                    "noBlockedStoryAction": "passed",
                },
            })
        integrated_manifest = {
            "storySlug": story["slug"],
            "pages": [
                {"file": "cover.webp", "text": None, "pageBadge": None, "panel": False, "layout": "full_page_cover", "textAreaBox": None},
                *integrated_pages,
            ],
        }
        visual_review = {"storySlug": story["slug"], "pages": review_pages}
        assert validate_text(story, [page["text"] for page in story["pages"]], integrated_manifest, visual_review) == []
        results.append("PASS integrated-layout validator accepts consistent panel, badge, safe-zone, and review records")

        narration = [page["text"] for page in story["pages"]]
        narration[4] = "This does not match."
        manifest = {"storySlug": story["slug"], "pages": [
            {"file": "cover.webp", "text": None, "pageBadge": None, "panel": False, "layout": "full_page_cover", "textAreaBox": None},
            *[{"file": f"page-{page['number']:02d}.webp", "text": page["text"], "pageBadge": page["number"], "panel": True, "layout": "separate_illustration_and_text", "illustrationBox": [0, 0, 1448, 815], "textAreaBox": [0, 815, 1448, 1086], "overlap": False, "textFits": True} for page in story["pages"]],
        ]}
        assert_contains(validate_text(story, narration, manifest), "narration entry 5")
        results.append("PASS narration validation catches a text mismatch")

    print("\n".join(results))
    print("PASS temporary test assets removed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
