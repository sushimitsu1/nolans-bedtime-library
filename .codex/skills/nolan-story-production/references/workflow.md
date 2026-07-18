# Production workflow

1. Select one approved `not_started` record; set it to `selected` and add it to the queue.
2. Write and review `story.json`; move through `writing` only after schema and story validation pass.
3. Create `production/staging/<slug>/character-reference.webp` and `continuity.json`. Compare every later illustration with both.
4. Generate `illustrations/cover.webp` separately.
5. Generate `illustrations/page-01.webp` through `page-09.webp` individually at 1448 x 1086 or a compatible larger 4:3 resolution. Make the scene full-bleed, reserve the bottom 25-30% for low-detail scenery, and keep all required characters, faces, eyes, vehicle features, animals, objects, and action above y=760. Include no text, badges, page numbers, cream panel, collage, grid, contact sheet, split screen, or multiple scenes.
6. Inspect each raw image, record labeled `requiredSubjectBoxes` in `visual-review.json`, and regenerate any safe-zone failure. Compose Pages 1-9 with `compose_page.py --visual-review ...`; its default full-bleed layout adds the fixed inset rounded panel and badge. Never pass `--repair-fallback` for a newly generated story.
7. Visually review the composed Pages 1-9 and mark all six final checks `passed`: subject placement, safe-zone compliance, panel integration, consistent panel size, consistent badge placement, and no blocked story action. Repair failures before continuing.
8. Repeat generation, raw inspection, selective repair, default composition, and the same required batch visual review for Pages 10-15.
9. Record every output in `final/provenance.json`, including its same-story source illustration and `compositionType: single_scene`.
10. Create `narration.json` with one exact story-text string per page and `final/composition-manifest.json` from compositor output.
11. Run `validate_story.py`, `validate_assets.py`, and `validate_text.py --visual-review production/staging/<slug>/visual-review.json`. Confirm every new page is full-bleed, has the exact integrated panel and badge boxes, contains no outer frame or letterboxing, keeps required-subject bounds above the safe zone, preserves exact story text, and passes both batch reviews. Move to `ready_to_publish` only after all pass.

For an existing-art repair only, pass `--repair-fallback` explicitly. The fallback contains the old artwork without crop or stretch above a separate cream text area; it must never be selected automatically.

Stop only for a genuine blocker that cannot be corrected safely. Do not continue to another story while the queue contains an active record.
