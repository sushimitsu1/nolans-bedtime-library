from __future__ import annotations

import argparse

from narration_lock import NarrationError, SUPPORTED_REVIEW_STATUSES, record_review


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Record the required human listening result for generated narration."
    )
    parser.add_argument("manifest", help="narration-manifest.json path")
    parser.add_argument("--story", required=True, help="Story directory or story.json")
    parser.add_argument("--status", required=True, choices=sorted(SUPPORTED_REVIEW_STATUSES))
    parser.add_argument("--reviewer")
    parser.add_argument("--notes")
    parser.add_argument("--config", default="config/narration-voices.json")
    args = parser.parse_args()
    try:
        record_review(
            args.manifest,
            args.config,
            args.story,
            status=args.status,
            reviewer=args.reviewer,
            notes=args.notes,
        )
        print(f"Recorded human listening review: {args.status}")
        return 0
    except (NarrationError, OSError, ValueError) as error:
        print(f"NARRATION REVIEW FAILED: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
