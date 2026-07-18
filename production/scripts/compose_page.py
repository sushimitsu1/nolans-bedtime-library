from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from common import FINAL_SIZE, load_json, write_json


CREAM = "#FFF4D6"
DARK = "#27334A"
BLUE = "#5B9BD5"
FULL_BLEED_BOX = (0, 0, 1448, 1086)
SAFE_ZONE_TOP = 760
INTEGRATED_PANEL_BOX = (62, 790, 1386, 1034)
INTEGRATED_BADGE_BOX = (1278, 928, 1374, 1024)
REPAIR_ILLUSTRATION_SIZE = (1448, 815)
REPAIR_ILLUSTRATION_BOX = (0, 0, 1448, 815)
REPAIR_TEXT_AREA_BOX = (0, 815, 1448, 1086)
MIN_FONT_SIZE = 30


def find_font(size: int):
    candidates = [
        Path(__file__).resolve().parents[2] / "assets" / "fonts" / "Nunito-Bold.ttf",
        Path("C:/Windows/Fonts/arialbd.ttf"),
        Path("C:/Windows/Fonts/Arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)
    return ImageFont.load_default(size=size)


def contain(source: Image.Image, target_size: tuple[int, int]) -> Image.Image:
    source = source.convert("RGB")
    scale = min(target_size[0] / source.width, target_size[1] / source.height)
    fitted = source.resize((round(source.width * scale), round(source.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", target_size, CREAM)
    canvas.paste(fitted, ((target_size[0] - fitted.width) // 2, (target_size[1] - fitted.height) // 2))
    return canvas


def full_bleed(source: Image.Image) -> Image.Image:
    source_ratio = source.width / source.height
    target_ratio = FINAL_SIZE[0] / FINAL_SIZE[1]
    if abs(source_ratio - target_ratio) > 0.005:
        raise ValueError(
            f"Integrated pages require a 4:3 source without cropping or letterboxing; "
            f"found {source.width}x{source.height}. Use --repair-fallback only for existing artwork."
        )
    return source.convert("RGB").resize(FINAL_SIZE, Image.Resampling.LANCZOS)


def validate_required_subject_boxes(subject_boxes: list[dict] | None) -> list[dict]:
    if not subject_boxes:
        raise ValueError("Integrated pages require reviewed bounds for every required subject and story action.")
    validated = []
    for subject in subject_boxes:
        label = subject.get("label") if isinstance(subject, dict) else None
        box = subject.get("box") if isinstance(subject, dict) else None
        if not label or not isinstance(box, list) or len(box) != 4 or not all(isinstance(value, (int, float)) for value in box):
            raise ValueError("Each required subject must have a label and a four-number box in final 1448x1086 coordinates.")
        left, top, right, bottom = box
        if left < 0 or top < 0 or right > FINAL_SIZE[0] or bottom > FINAL_SIZE[1] or left >= right or top >= bottom:
            raise ValueError(f"Required subject '{label}' has invalid bounds {box}.")
        if bottom > SAFE_ZONE_TOP:
            raise ValueError(
                f"Required subject '{label}' enters the text-safe zone at y={SAFE_ZONE_TOP}; "
                "regenerate or reframe the raw illustration before composition."
            )
        validated.append({"label": label, "box": [round(value) for value in box]})
    return validated


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font, max_width: int) -> list[str]:
    lines = []
    for paragraph in text.splitlines() or [text]:
        words = paragraph.split()
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if current and draw.textbbox((0, 0), candidate, font=font)[2] > max_width:
                lines.append(current)
                current = word
            else:
                current = candidate
        if current:
            lines.append(current)
    return lines


def compose(
    source_path: Path,
    output_path: Path,
    text: str | None,
    page_number: int | None,
    layout: str = "integrated",
    required_subject_boxes: list[dict] | None = None,
) -> dict:
    with Image.open(source_path) as source:
        if page_number is None:
            canvas = contain(source, FINAL_SIZE)
        elif layout == "integrated":
            reviewed_subject_boxes = validate_required_subject_boxes(required_subject_boxes)
            canvas = full_bleed(source)
        elif layout == "repair_fallback":
            reviewed_subject_boxes = []
            canvas = Image.new("RGB", FINAL_SIZE, CREAM)
            canvas.paste(contain(source, REPAIR_ILLUSTRATION_SIZE), (0, 0))
        else:
            raise ValueError(f"Unknown page layout: {layout}")
    if page_number is None:
        panel = False
        record = {
            "file": output_path.name,
            "sourceIllustration": str(source_path),
            "text": None,
            "pageBadge": None,
            "panel": False,
            "layout": "full_page_cover",
            "illustrationBox": list((0, 0, *FINAL_SIZE)),
            "textAreaBox": None,
            "overlap": False,
            "textFits": True,
        }
    else:
        panel = True
        draw = ImageDraw.Draw(canvas)
        if layout == "integrated":
            panel_box = INTEGRATED_PANEL_BOX
            draw.rounded_rectangle(panel_box, radius=38, fill=CREAM)
            font_size = 48
            text_x = 98
            text_width = 1160
            text_height = 184
            badge_center = (1326, 976)
            badge_radius = 48
            badge_font_size = 42
        else:
            panel_box = REPAIR_TEXT_AREA_BOX
            draw.rectangle(panel_box, fill=CREAM)
            font_size = 44
            text_x = 72
            text_width = 1160
            text_height = 205
            badge_center = (1360, 1018)
            badge_radius = 44
            badge_font_size = 38
        while font_size >= MIN_FONT_SIZE:
            font = find_font(font_size)
            lines = wrap_text(draw, text or "", font, text_width)
            line_height = font_size + 8
            if lines and len(lines) * line_height <= text_height:
                break
            font_size -= 2
        if not lines or len(lines) * line_height > text_height:
            raise ValueError(
                f"Page text does not fit the approved {layout} panel "
                f"at the minimum approved {MIN_FONT_SIZE}px font size."
            )
        y = panel_box[1] + (panel_box[3] - panel_box[1] - len(lines) * line_height) // 2
        for line in lines:
            draw.text((text_x, y), line, font=font, fill=DARK)
            y += line_height
        draw.ellipse(
            (
                badge_center[0] - badge_radius,
                badge_center[1] - badge_radius,
                badge_center[0] + badge_radius,
                badge_center[1] + badge_radius,
            ),
            fill="white",
            outline=BLUE,
            width=7,
        )
        badge_font = find_font(badge_font_size)
        label = str(page_number)
        box = draw.textbbox((0, 0), label, font=badge_font)
        draw.text(
            (
                badge_center[0] - (box[2] - box[0]) / 2,
                badge_center[1] - (box[3] - box[1]) / 2 - box[1],
            ),
            label,
            font=badge_font,
            fill=DARK,
        )
        if layout == "integrated":
            record = {
                "file": output_path.name,
                "sourceIllustration": str(source_path),
                "text": text,
                "pageBadge": page_number,
                "panel": panel,
                "layout": "integrated_full_bleed",
                "illustrationBox": list(FULL_BLEED_BOX),
                "textAreaBox": list(INTEGRATED_PANEL_BOX),
                "panelBox": list(INTEGRATED_PANEL_BOX),
                "badgeBox": list(INTEGRATED_BADGE_BOX),
                "safeZoneTop": SAFE_ZONE_TOP,
                "requiredSubjectBoxes": reviewed_subject_boxes,
                "requiredArtworkOverlap": False,
                "fullBleed": True,
                "letterboxed": False,
                "outerFrame": False,
                "textFits": True,
                "fontSize": font_size,
            }
        else:
            record = {
                "file": output_path.name,
                "sourceIllustration": str(source_path),
                "text": text,
                "pageBadge": page_number,
                "panel": panel,
                "layout": "separate_illustration_and_text",
                "illustrationBox": list(REPAIR_ILLUSTRATION_BOX),
                "textAreaBox": list(REPAIR_TEXT_AREA_BOX),
                "overlap": False,
                "textFits": True,
                "fontSize": font_size,
            }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, "WEBP", quality=92, method=6)
    return record


def main() -> int:
    parser = argparse.ArgumentParser(description="Deterministically compose one Nolan page or cover.")
    parser.add_argument("story")
    parser.add_argument("source")
    parser.add_argument("output")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--page", type=int, choices=range(1, 16))
    group.add_argument("--cover", action="store_true")
    parser.add_argument("--manifest", help="Append or replace this output's record in a composition manifest.")
    parser.add_argument("--visual-review", help="JSON review containing requiredSubjectBoxes for integrated pages.")
    parser.add_argument(
        "--repair-fallback",
        action="store_true",
        help="Explicitly use the separated illustration-and-text repair layout for existing artwork.",
    )
    args = parser.parse_args()

    story = load_json(args.story)
    page = None if args.cover else next((value for value in story.get("pages", []) if value.get("number") == args.page), None)
    if not args.cover and not page:
        raise SystemExit(f"Page {args.page} is missing from story.json; refusing to guess text.")
    subject_boxes = None
    layout = "repair_fallback" if args.repair_fallback else "integrated"
    if not args.cover and layout == "integrated":
        if not args.visual_review:
            raise SystemExit("Integrated composition requires --visual-review with required subject bounds.")
        review = load_json(Path(args.visual_review))
        review_page = next((item for item in review.get("pages", []) if item.get("number") == args.page), None)
        if not review_page:
            raise SystemExit(f"Visual review is missing Page {args.page}.")
        subject_boxes = review_page.get("requiredSubjectBoxes")
        labels = {item.get("label") for item in subject_boxes or [] if isinstance(item, dict)}
        missing_characters = sorted(set(page.get("requiredCharacters", [])) - labels)
        if missing_characters:
            raise SystemExit(f"Visual review is missing required characters: {', '.join(missing_characters)}")
    record = compose(
        Path(args.source),
        Path(args.output),
        None if args.cover else page["text"],
        None if args.cover else args.page,
        layout=layout,
        required_subject_boxes=subject_boxes,
    )
    if args.manifest:
        manifest_path = Path(args.manifest)
        manifest = load_json(manifest_path) if manifest_path.exists() else {"storySlug": story["slug"], "pages": []}
        manifest["pages"] = [item for item in manifest["pages"] if item.get("file") != record["file"]]
        manifest["pages"].append(record)
        manifest["pages"].sort(key=lambda item: (item["pageBadge"] is not None, item["pageBadge"] or 0))
        write_json(manifest_path, manifest)
    print(f"Composed {args.output} at {FINAL_SIZE[0]}x{FINAL_SIZE[1]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
