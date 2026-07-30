from __future__ import annotations

import argparse

from narration_lock import AUDITION_TEXT, NarrationError, generate_auditions


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate locked narration auditions from an explicit candidate list."
    )
    parser.add_argument("--candidates", required=True, help="Explicit candidate-list JSON")
    parser.add_argument("--output-dir", default="voice-auditions")
    parser.add_argument("--config", default="config/narration-voices.json")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Explicitly replace the same audition outputs",
    )
    args = parser.parse_args()
    try:
        manifest = generate_auditions(
            args.candidates,
            args.output_dir,
            args.config,
            overwrite=args.overwrite,
        )
        print(f"Audition text SHA-256 is locked for: {AUDITION_TEXT}")
        print(f"Generated audition manifest: {manifest}")
        print("No candidate was approved. Listen to every file before running approval.")
        return 0
    except (NarrationError, OSError, ValueError) as error:
        print(f"AUDITION GENERATION FAILED: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
