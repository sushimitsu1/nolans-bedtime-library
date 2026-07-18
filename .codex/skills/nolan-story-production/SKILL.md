---
name: nolan-story-production
description: Run the repository-based Nolan bedtime-story pipeline from approved inventory selection through writing, continuity-controlled artwork, deterministic page composition, narration, validation, app integration, publishing, and deployment verification. Use for producing, reviewing, repairing, validating, integrating, or publishing Nolan library stories.
---

# Nolan Story Production

Work on one story at a time. Read [format-and-schema.md](references/format-and-schema.md) before writing and [workflow.md](references/workflow.md) before producing assets. Read [publishing.md](references/publishing.md) only when integrating or publishing.

1. Run `production/scripts/select_story.py` to select one `not_started` inventory record; stop if another story is active.
2. Create `production/stories/<slug>/story.json` and validate it before artwork. Use exact page text as the only source for visible text and narration.
3. Create and inspect a character reference plus continuity record.
4. Generate the cover separately, then Pages 1-9 as individual full 4:3, illustration-only images. Reserve the bottom 25-30% as a low-detail text-safe zone and keep every required subject and action above it.
5. Inspect every image and record required-subject bounds; regenerate only failures. Compose passing images with the default full-bleed integrated layout in `compose_page.py`, then complete the required batch visual review.
6. Generate, inspect, selectively repair, compose, and batch-review Pages 10-15 the same way.
7. Generate `narration.json` by copying story text exactly; never OCR or paraphrase new stories.
8. Run story, asset, and text validators. Do not select another story until all pass.
9. Follow [publishing.md](references/publishing.md), validate app changes, smoke-test only Pages 1 and 15, commit once, push once, and verify deployment.

The separated illustration-and-text layout is an explicit repair fallback for existing artwork only; never use it automatically for a new story. Never ask the image generator to add text, page numbers, badges, or a cream panel. Never use old artwork as a substitute, infer missing pages, request multi-page images, modify unrelated stories, or bypass a failed validation.
