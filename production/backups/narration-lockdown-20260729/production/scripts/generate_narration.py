from __future__ import annotations

import argparse

from common import load_json, write_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Copy exact story text into a narration array.")
    parser.add_argument("story")
    parser.add_argument("output")
    args = parser.parse_args()
    story = load_json(args.story)
    pages = story.get("pages", [])
    if len(pages) != 15 or [page.get("number") for page in pages] != list(range(1, 16)):
        raise SystemExit("Story must have pages 1-15 before narration can be generated.")
    write_json(args.output, [page["text"] for page in pages])
    print(f"Wrote 15 exact narration entries to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
