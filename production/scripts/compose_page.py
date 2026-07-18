from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from common import FINAL_SIZE, load_json, write_json


CREAM = "#FFF4D6"
DARK = "#27334A"
BLUE = "#5B9BD5"
ILLUSTRATION_SIZE = (1448, 815)
ILLUSTRATION_BOX = (0, 0, 1448, 815)
TEXT_AREA_BOX = (0, 815, 1448, 1086)
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


def compose(source_path: Path, output_path: Path, text: str | None, page_number: int | None) -> dict:
    with Image.open(source_path) as source:
        if page_number is None:
            canvas = contain(source, FINAL_SIZE)
        else:
            canvas = Image.new("RGB", FINAL_SIZE, CREAM)
            canvas.paste(contain(source, ILLUSTRATION_SIZE), (0, 0))
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
        draw.rectangle(TEXT_AREA_BOX, fill=CREAM)
        font_size = 44
        text_width = 1160
        text_height = 205
        while font_size >= MIN_FONT_SIZE:
            font = find_font(font_size)
            lines = wrap_text(draw, text or "", font, text_width)
            line_height = font_size + 8
            if lines and len(lines) * line_height <= text_height:
                break
            font_size -= 2
        if not lines or len(lines) * line_height > text_height:
            raise ValueError(
                f"Page text does not fit the separate {TEXT_AREA_BOX[3] - TEXT_AREA_BOX[1]}px text area "
                f"at the minimum approved {MIN_FONT_SIZE}px font size."
            )
        y = TEXT_AREA_BOX[1] + (TEXT_AREA_BOX[3] - TEXT_AREA_BOX[1] - len(lines) * line_height) // 2
        for line in lines:
            draw.text((72, y), line, font=font, fill=DARK)
            y += line_height
        center = (1360, 1018)
        radius = 44
        draw.ellipse(
            (center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius),
            fill="white",
            outline=BLUE,
            width=7,
        )
        badge_font = find_font(38)
        label = str(page_number)
        box = draw.textbbox((0, 0), label, font=badge_font)
        draw.text((center[0] - (box[2] - box[0]) / 2, center[1] - (box[3] - box[1]) / 2 - box[1]), label, font=badge_font, fill=DARK)
        record = {
            "file": output_path.name,
            "sourceIllustration": str(source_path),
            "text": text,
            "pageBadge": page_number,
            "panel": panel,
            "layout": "separate_illustration_and_text",
            "illustrationBox": list(ILLUSTRATION_BOX),
            "textAreaBox": list(TEXT_AREA_BOX),
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
    args = parser.parse_args()

    story = load_json(args.story)
    page = None if args.cover else next((value for value in story.get("pages", []) if value.get("number") == args.page), None)
    if not args.cover and not page:
        raise SystemExit(f"Page {args.page} is missing from story.json; refusing to guess text.")
    record = compose(Path(args.source), Path(args.output), None if args.cover else page["text"], None if args.cover else args.page)
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
