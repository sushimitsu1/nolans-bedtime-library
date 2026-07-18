# Production workflow

1. Select one approved `not_started` record; set it to `selected` and add it to the queue.
2. Write and review `story.json`; move through `writing` only after schema and story validation pass.
3. Create `production/staging/<slug>/character-reference.webp` and `continuity.json`. Compare every later illustration with both.
4. Generate `illustrations/cover.webp` separately.
5. Generate `illustrations/page-01.webp` through `page-09.webp` individually without text or badges. Inspect each and regenerate only failures.
6. Compose Pages 1-9 into `final/` using `compose_page.py`.
7. Repeat generation, inspection, selective repair, and composition for Pages 10-15.
8. Record every output in `final/provenance.json`, including its same-story source illustration and `compositionType: single_scene`.
9. Create `narration.json` with one exact story-text string per page and `final/composition-manifest.json` from compositor output.
10. Run `validate_story.py`, `validate_assets.py`, and `validate_text.py`. Move to `ready_to_publish` only after all pass.

Stop only for a genuine blocker that cannot be corrected safely. Do not continue to another story while the queue contains an active record.
