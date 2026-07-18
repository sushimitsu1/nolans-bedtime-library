from __future__ import annotations

import argparse
from pathlib import Path

from common import load_json, write_json


def main() -> int:
    parser = argparse.ArgumentParser(description="Select one approved, unstarted Nolan story.")
    parser.add_argument("--slug", help="Select this slug; otherwise choose the first eligible record.")
    parser.add_argument("--inventory", default="production/story-inventory.json")
    parser.add_argument("--queue", default="production/production-queue.json")
    args = parser.parse_args()

    inventory = load_json(args.inventory)
    queue = load_json(args.queue)
    if queue.get("activeStory") or queue.get("queue"):
        raise SystemExit("Another story is already active; validate and finish it before selecting another.")

    eligible = [record for record in inventory["stories"] if record["status"] == "not_started" and not record["published"]]
    if args.slug:
        eligible = [record for record in eligible if record["slug"] == args.slug]
    if not eligible:
        raise SystemExit("No matching not_started story is available.")

    selected = eligible[0]
    selected["status"] = "selected"
    queue["activeStory"] = selected["slug"]
    queue["queue"] = [{"slug": selected["slug"], "status": "selected"}]
    write_json(args.inventory, inventory)
    write_json(args.queue, queue)
    Path("production/stories", selected["slug"]).mkdir(parents=True, exist_ok=True)
    Path("production/staging", selected["slug"], "illustrations").mkdir(parents=True, exist_ok=True)
    Path("production/staging", selected["slug"], "final").mkdir(parents=True, exist_ok=True)
    print(f"Selected {selected['slug']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
