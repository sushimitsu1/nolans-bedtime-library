from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from common import FINAL_SIZE, load_json, write_json


CREAM = "#FFF4D6"
DARK = "#27334A"
BLUE = "#5B9BD5"


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


def contain(source: Image.Image) -> Image.Image:
    source = source.convert("RGB")
    scale = min(FINAL_SIZE[0] / source.width, FINAL_SIZE[1] / source.height)
    fitted = source.resize((round(source.width * scale), round(source.height * scale)), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", FINAL_SIZE, CREAM)
    canvas.paste(fitted, ((FINAL_SIZE[0] - fitted.width) // 2, (FINAL_SIZE[1] - fitted.height) // 2))
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
        canvas = contain(source)
    if page_number is None:
        panel = False
    else:
        panel = True
        draw = ImageDraw.Draw(canvas)
        panel_box = (62, 790, 1386, 1034)
        draw.rounded_rectangle(panel_box, radius=38, fill=CREAM)
        font_size = 48
        while font_size >= 32:
            font = find_font(font_size)
            lines = wrap_text(draw, text or "", font, 1160)
            line_height = font_size + 10
            if len(lines) * line_height <= 184:
                break
            font_size -= 2
        if len(lines) * line_height > 184:
            raise ValueError("Page text does not fit the approved panel; shorten story.json text instead of shrinking it further.")
        y = panel_box[1] + (panel_box[3] - panel_box[1] - len(lines) * line_height) // 2
        for line in lines:
            draw.text((98, y), line, font=font, fill=DARK)
            y += line_height
        center = (1326, 976)
        draw.ellipse((1278, 928, 1374, 1024), fill="white", outline=BLUE, width=7)
        badge_font = find_font(42)
        label = str(page_number)
        box = draw.textbbox((0, 0), label, font=badge_font)
        draw.text((center[0] - (box[2] - box[0]) / 2, center[1] - (box[3] - box[1]) / 2 - box[1]), label, font=badge_font, fill=DARK)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, "WEBP", quality=92, method=6)
    return {"file": output_path.name, "sourceIllustration": str(source_path), "text": text, "pageBadge": page_number, "panel": panel}


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
