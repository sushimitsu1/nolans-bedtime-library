from __future__ import annotations

import argparse
import hashlib
import subprocess
from pathlib import Path

from common import load_json, sha256


CASES = {
    "cora-crane-truck-wobbly-sign": [4, 6, 14],
    "pirates-curse-foggy-lighthouse": [12],
    "thunderroarus-lost-fossil-trail": [3, 15],
}


def text_hash(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def markdown_text(value: str | None) -> str:
    if value is None:
        return "Not present"
    return value.replace("|", "\\|").replace("\n", "<br>")


def git_info(root: Path, relative: Path) -> tuple[str, str]:
    result = subprocess.run(
        [
            "git",
            "-c",
            f"safe.directory={root.as_posix()}",
            "-C",
            str(root),
            "log",
            "-1",
            "--format=%H%x09%cI",
            "--",
            relative.as_posix(),
        ],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    value = result.stdout.strip()
    if not value:
        return "uncommitted", "uncommitted"
    commit, timestamp = value.split("\t", 1)
    return commit, timestamp


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Report known narration text discrepancies without changing source data."
    )
    parser.add_argument(
        "--output",
        default="production/reports/NARRATION-TEXT-DISCREPANCIES.md",
    )
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    output = root / args.output
    lines = [
        "# Narration text discrepancy report",
        "",
        "Generated from repository JSON and Git metadata. No text was rewritten, "
        "normalized, or resolved. Final page text is taken from "
        "`composition-manifest.json`; no OCR was used.",
        "",
    ]
    for slug, page_numbers in CASES.items():
        story_dir = root / "production" / "stories" / slug
        story_path = story_dir / "story.json"
        narration_path = story_dir / "narration.json"
        composition_path = story_dir / "composition-manifest.json"
        story = load_json(story_path)
        narration = load_json(narration_path)
        composition = load_json(composition_path)
        relatives = {
            "story": story_path.relative_to(root),
            "narration": narration_path.relative_to(root),
            "composition": composition_path.relative_to(root),
        }
        history = {name: git_info(root, path) for name, path in relatives.items()}
        for page_number in page_numbers:
            page = next(item for item in story["pages"] if item["number"] == page_number)
            composed = next(
                item for item in composition["pages"] if item.get("pageBadge") == page_number
            )
            final_asset = root / "assets" / "books" / slug / composed["file"]
            final_relative = final_asset.relative_to(root)
            final_history = git_info(root, final_relative)
            visible_text = page["text"]
            speech_text = page.get("speechText")
            narration_text = narration[page_number - 1]
            manifest_text = composed["text"]
            lines.extend(
                [
                    f"## {story['title']} — Page {page_number}",
                    "",
                    "| Source | File and field | Exact text | SHA-256 | Last committed |",
                    "|---|---|---|---|---|",
                    (
                        f"| Story visible text | `{relatives['story'].as_posix()}` "
                        f"`pages[{page_number - 1}].text` | "
                        f"{markdown_text(visible_text)} | `{text_hash(visible_text)}` | "
                        f"`{history['story'][0]}`<br>{history['story'][1]} |"
                    ),
                    (
                        f"| Story narration override | `{relatives['story'].as_posix()}` "
                        f"`pages[{page_number - 1}].speechText` | "
                        f"{markdown_text(speech_text)} | "
                        f"{f'`{text_hash(speech_text)}`' if speech_text is not None else 'Not available'} | "
                        f"`{history['story'][0]}`<br>{history['story'][1]} |"
                    ),
                    (
                        f"| Narration array | `{relatives['narration'].as_posix()}` "
                        f"`[{page_number - 1}]` | {markdown_text(narration_text)} | "
                        f"`{text_hash(narration_text)}` | "
                        f"`{history['narration'][0]}`<br>{history['narration'][1]} |"
                    ),
                    (
                        f"| Final page manifest | `{relatives['composition'].as_posix()}` "
                        f"`pages[file={composed['file']}].text` | "
                        f"{markdown_text(manifest_text)} | `{text_hash(manifest_text)}` | "
                        f"`{history['composition'][0]}`<br>{history['composition'][1]} |"
                    ),
                    "",
                    f"- Final page asset: `{final_relative.as_posix()}`",
                    f"- Asset SHA-256: `{sha256(final_asset)}`",
                    f"- Asset last committed: `{final_history[0]}` at {final_history[1]}",
                    "The final asset's text reference is the composition-manifest value above.",
                    "",
                ]
            )
            committed_times = {
                "story.json": history["story"][1],
                "narration.json": history["narration"][1],
                "composition-manifest.json": history["composition"][1],
                "final page asset": final_history[1],
            }
            newest_timestamp = max(committed_times.values())
            newest = [
                name for name, timestamp in committed_times.items()
                if timestamp == newest_timestamp
            ]
            matching_visible = []
            if narration_text == visible_text:
                matching_visible.append("narration.json")
            if manifest_text == visible_text:
                matching_visible.append("composition manifest")
            lines.append("Assessment:")
            if len(newest) == len(committed_times):
                lines.append(
                    "- Git history gives every source the same latest timestamp, so none "
                    "appears newer."
                )
            else:
                lines.append(
                    f"- By Git commit timestamp only, {', '.join(newest)} appears newest "
                    f"({newest_timestamp})."
                )
            if matching_visible:
                lines.append(
                    f"- The story visible `text` currently matches {', '.join(matching_visible)}."
                )
            if speech_text is not None and speech_text != visible_text:
                lines.append(
                    "- The `speechText` override is the divergent narration-intent field. "
                    "This report makes no judgment that it is approved."
                )
            lines.extend(
                [
                    "- File timestamps and matching values are evidence, not approval; a "
                    "human must choose the final wording.",
                    "",
                ]
            )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
