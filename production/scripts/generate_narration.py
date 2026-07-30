from __future__ import annotations

import argparse
from pathlib import Path

from common import write_json
from narration_lock import NarrationError, resolve_story_source, synthesize_story


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Generate one locked-voice narration audio file per story page. "
            "A .json output preserves the legacy exact-text export behavior."
        )
    )
    parser.add_argument("story", help="Story directory, story.json, or narration.json")
    parser.add_argument(
        "output",
        nargs="?",
        help="Audio output directory; a .json path requests legacy exact-text export",
    )
    parser.add_argument(
        "--config",
        default="config/narration-voices.json",
        help="Locked narration voice configuration",
    )
    parser.add_argument(
        "--use-backup",
        action="store_true",
        help="Explicitly use the approved backup instead of the approved primary",
    )
    parser.add_argument(
        "--voice-id",
        help="Optional exact-ID assertion; must match the selected allowlisted role",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Replace mismatched existing audio instead of failing",
    )
    args = parser.parse_args()
    try:
        if args.output and Path(args.output).suffix.lower() == ".json":
            if args.use_backup or args.voice_id or args.overwrite:
                raise NarrationError("voice/audio flags cannot be used with legacy text-only export")
            _, _, texts, _ = resolve_story_source(args.story)
            write_json(args.output, texts)
            print(f"Wrote 15 exact narration entries to {args.output}")
            return 0
        story_source = Path(args.story)
        if args.output:
            output_dir = Path(args.output)
        else:
            base = story_source if story_source.is_dir() else story_source.parent
            output_dir = base / "narration-audio"
        manifest = synthesize_story(
            args.story,
            output_dir,
            args.config,
            use_backup=args.use_backup,
            overwrite=args.overwrite,
            requested_voice_id=args.voice_id,
        )
        role = "backup" if args.use_backup else "primary"
        print(f"Generated/reused locked {role} narration: {manifest}")
        return 0
    except (NarrationError, OSError, ValueError) as error:
        print(f"NARRATION GENERATION FAILED: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
