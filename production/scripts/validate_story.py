from __future__ import annotations

import argparse
import re
from pathlib import Path

from common import load_json, normalized


REQUIRED_ROOT = ["title", "slug", "category", "description", "characterBible", "settingBible", "continuityRules", "pages"]
REQUIRED_PAGE = ["number", "text", "illustrationScene", "requiredCharacters", "timeOfDay", "continuityNotes"]
PROBLEM_WORDS = {"but", "problem", "missing", "lost", "stuck", "cracked", "muddy", "wobbly", "couldn't", "cannot", "need"}
SOLUTION_WORDS = {"help", "together", "fixed", "safe", "solved", "found", "ready", "smooth", "shared"}
ENDING_WORDS = {"goodnight", "night", "sleep", "sleepy", "rested", "dream", "yawn", "moon", "bedtime"}
BEGINNING_WORDS = {"morning", "once", "woke", "rolled", "began", "sunny", "early", "evening", "lived"}
CATEGORIES = {"Emergency Vehicles", "Construction Vehicles", "Monster Trucks", "Race Cars"}


def tokens(value: str) -> set[str]:
    return set(normalized(value).split())


def shingles(value: str, width: int = 5) -> set[tuple[str, ...]]:
    words = normalized(value).split()
    return {tuple(words[index:index + width]) for index in range(max(0, len(words) - width + 1))}


def validate_story(story: dict, recent_root: Path | None = None, source: Path | None = None) -> list[str]:
    errors = []
    for key in REQUIRED_ROOT:
        if key not in story:
            errors.append(f"missing required story field: {key}")
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", story.get("slug", "")):
        errors.append("slug must be lowercase hyphen-case")
    if story.get("category") not in CATEGORIES:
        errors.append("category is not an approved app category")
    if not isinstance(story.get("characterBible"), dict) or not story.get("characterBible"):
        errors.append("characterBible must be a non-empty object")
    if not isinstance(story.get("settingBible"), dict) or not story.get("settingBible"):
        errors.append("settingBible must be a non-empty object")
    if not isinstance(story.get("continuityRules"), list) or not story.get("continuityRules"):
        errors.append("continuityRules must be a non-empty list")
    pages = story.get("pages", [])
    if len(pages) != 15:
        errors.append(f"expected exactly 15 pages, found {len(pages)}")
    numbers = [page.get("number") for page in pages]
    if numbers != list(range(1, 16)):
        errors.append(f"page numbers must be exactly 1-15 in order, found {numbers}")

    seen_text = {}
    seen_events = {}
    uses_speech_text = any("speechText" in page for page in pages)
    for index, page in enumerate(pages, 1):
        for key in REQUIRED_PAGE:
            value = page.get(key)
            if value is None or value == "" or value == []:
                errors.append(f"page {index}: missing or empty {key}")
        if uses_speech_text and not page.get("speechText"):
            errors.append(f"page {index}: missing or empty speechText")
        text = page.get("text", "")
        key = normalized(text)
        if key in seen_text:
            errors.append(f"duplicate page text on pages {seen_text[key]} and {index}")
        elif key:
            seen_text[key] = index
        sentences = [part for part in re.split(r"[.!?]+", text) if part.strip()]
        if not 1 <= len(sentences) <= 3:
            errors.append(f"page {index}: use 1-3 short sentences")
        if any(len(normalized(sentence).split()) > 24 for sentence in sentences):
            errors.append(f"page {index}: sentence exceeds 24 words for ages 3-5")
        event = normalized(page.get("illustrationScene", ""))
        if event in seen_events:
            errors.append(f"duplicated story event on pages {seen_events[event]} and {index}")
        elif event:
            seen_events[event] = index

    combined = [tokens(page.get("text", "")) for page in pages]
    if pages and not (set().union(*combined[:2]) & BEGINNING_WORDS):
        errors.append("Pages 1-2 need a clear beginning that introduces the story")
    if pages and not any(words & PROBLEM_WORDS for words in combined[1:9]):
        errors.append("story needs a clear small problem in Pages 2-9")
    if pages and not any(words & SOLUTION_WORDS for words in combined[6:14]):
        errors.append("story needs a clear safe solution in Pages 7-14")
    if pages and not (tokens(pages[-1].get("text", "")) & ENDING_WORDS):
        errors.append("Page 15 needs a calm bedtime ending")

    if recent_root and recent_root.exists():
        current = shingles(" ".join(page.get("text", "") for page in pages))
        for candidate in recent_root.glob("*/story.json"):
            if source and candidate.resolve() == source.resolve():
                continue
            other_story = load_json(candidate)
            other = shingles(" ".join(page.get("text", "") for page in other_story.get("pages", [])))
            union = current | other
            if union and len(current & other) / len(union) > 0.45:
                errors.append(f"excessive similarity to recent story: {other_story.get('slug', candidate.parent.name)}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate one structured Nolan story.")
    parser.add_argument("story")
    parser.add_argument("--recent-root", default="production/stories")
    args = parser.parse_args()
    source = Path(args.story)
    errors = validate_story(load_json(source), Path(args.recent_root), source)
    if errors:
        print("STORY VALIDATION FAILED")
        for error in errors:
            print(f"- {error}")
        return 1
    print("STORY VALIDATION PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
