---
name: nolan-story-production
description: Plan, produce, validate, integrate, and publish Nolan bedtime-story batches, including isolated parallel story worktrees, deterministic full-bleed composition, exact narration, retry-limited QA, shared-file protection, and one-time batch deployment. Use for creating, reviewing, repairing, validating, coordinating, or publishing Nolan library stories.
---

# Nolan Story Production

Use three explicit phases. Read [format-and-schema.md](references/format-and-schema.md) before planning, [workflow.md](references/workflow.md) before production, and [publishing.md](references/publishing.md) before publishing. Use `scripts/batch_workflow.py` for isolation checks, package eligibility, narration derivation, cache bumping, and QA cleanup.

1. **Plan once.** Select exactly five `not_started` records. Write and validate all five `story.json` files plus character and setting bibles. Generate no artwork and change neither `app.js` nor `sw.js`. Commit the approved structured stories once.
2. **Produce in isolation.** Give each story to one agent or Codex thread in its own worktree. That producer may change only `production/stories/<slug>/` and `assets/books/<slug>/`. It must never change shared inventory, queue, app, service worker, or another story. Use the cover as the default character reference; create a separate reference only for complex multi-character continuity.
3. **Publish once.** After every producer finishes, admit only packages marked `ready_to_publish`; exclude `needs_review`. Validate each accepted package, derive app narration from `story.json`, update `app.js` once, bump `sw.js` once, run targeted smoke checks, commit once, push once, and verify deployment once.

For each story, generate the cover, Pages 1-9, then Pages 10-15 as separate full-bleed 4:3 illustrations. Inspect failures only and allow at most one additional generation attempt per failed page. Never regenerate a passing page. After the retry, preserve all assets and mark only that package `needs_review`; other producers continue.

Create a temporary 15-page QA contact sheet only after all pages exist. Use it for one continuity review, then inspect Pages 1, 5, 9, 10, and 15 individually and delete the contact sheet. Contact sheets are QA artifacts only and must never enter final assets, package validation, commits, or deployment.

The integrated full-bleed compositor remains the default. Never ask image generation to render text, badges, panels, collages, grids, or multi-panel images. Never use the repair fallback for a new story. Never OCR or rewrite narration; visible page text and narration come exactly from `story.json`.
