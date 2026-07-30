from __future__ import annotations

import argparse

from narration_lock import validate_narration_manifest


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate exact narration text, locked voice provenance, audio, and review."
    )
    parser.add_argument("manifest", help="narration-manifest.json path")
    parser.add_argument("--story", required=True, help="Story directory or story.json")
    parser.add_argument("--config", default="config/narration-voices.json")
    parser.add_argument(
        "--technical-only",
        action="store_true",
        help="Run technical checks without requiring a passed human listening review",
    )
    args = parser.parse_args()
    errors = validate_narration_manifest(
        args.manifest,
        args.config,
        args.story,
        require_human_review=not args.technical_only,
    )
    if errors:
        print("NARRATION VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("NARRATION VALIDATION PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
