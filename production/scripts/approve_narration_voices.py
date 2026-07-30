from __future__ import annotations

import argparse

from narration_lock import NarrationError, approve_voices


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Lock two human-reviewed, previously auditioned provider voice IDs."
    )
    parser.add_argument("--primary", required=True, help="Exact auditioned primary voice ID")
    parser.add_argument("--backup", required=True, help="Exact auditioned backup voice ID")
    parser.add_argument(
        "--manifest",
        default="voice-auditions/audition-manifest.json",
        help="Audition manifest used for the human decision",
    )
    parser.add_argument("--config", default="config/narration-voices.json")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Explicitly replace an already approved primary or backup",
    )
    args = parser.parse_args()
    try:
        config = approve_voices(
            args.config,
            args.manifest,
            args.primary,
            args.backup,
            replace=args.replace,
        )
        print("LOCKED NARRATION VOICES")
        print(
            f"- primary: {config['primary']['display_name']} "
            f"({config['primary']['voice_id']})"
        )
        print(
            f"- backup: {config['backup']['display_name']} "
            f"({config['backup']['voice_id']})"
        )
        print(f"- provider: {config['provider']}")
        print("- allowlist contains exactly these two IDs")
        return 0
    except (NarrationError, OSError, ValueError) as error:
        print(f"VOICE APPROVAL FAILED: {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
