# Three-phase production workflow

## Phase 1: batch planning

1. Start from a clean, synchronized planner worktree. Select exactly five inventory records whose status is `not_started`; never select `published` or `needs_review`.
2. Record the five slugs in one batch manifest before writing. Prefer category variety when the eligible inventory permits it.
3. Create `production/stories/<slug>/story.json` for all five. Each has exactly 15 distinct pages and uses `pages[].text` as the sole visible-text and narration source.
4. Create character and setting bibles beside each story. Lock colors, shapes, faces, wheels, accessories, supporting characters, locations, lighting progression, and continuity constraints.
5. Run schema, repetition, transition, recent-story similarity, character, and pacing validation across all five. Correct failures before approval.
6. Generate no artwork. Do not change `app.js` or `sw.js`. The planner alone may update shared batch, queue, or inventory records.
7. Commit the five approved structured story packages once. Create one isolated worktree and one production owner per slug from that commit.

## Phase 2: isolated story production

An owner may write only `production/stories/<assigned-slug>/` and `assets/books/<assigned-slug>/`. Run `batch_workflow.py isolation <slug> <changed-path>...` before every producer commit. Any path outside those prefixes is a hard failure. Producers must not change `app.js`, `sw.js`, shared inventory or queue files, batch manifests, another story directory, or another asset directory.

For the assigned story:

1. Read the planner-approved `story.json` and bibles. Do not rewrite approved page text.
2. Generate one cover and inspect it. Use the passing cover as the default character reference. Create a separate reference only when a complex multi-character bible cannot fit clearly on the cover.
3. Generate Pages 1-9 individually with the bottom 25-30% reserved and required subjects above y=760. Compose only passing images with the integrated full-bleed layout and validate the batch.
4. Generate, inspect, compose, and validate Pages 10-15 the same way. Page 9 must transition naturally to Page 10.
5. On a failed image, allow exactly one additional generation attempt. Never regenerate a passing page. If the retry fails, preserve completed work, set `package-status.json` to `needs_review`, record the page and reason, and stop only that producer.
6. Generate `narration.json` directly from the 15 page texts.
7. Produce one temporary `qa-contact-sheet.webp` from the 15 final pages. Review it once for character, setting, lighting, pacing, and Page 9-to-10 continuity. Then inspect Pages 1, 5, 9, 10, and 15 individually.
8. Delete the contact sheet with `batch_workflow.py cleanup-contact-sheet <story-dir>`. Run targeted validators and set `package-status.json` to `ready_to_publish` only after all pass.

Use separate Codex threads or agents only in isolated Git worktrees, one owner and slug per worktree, all starting at the planner commit. Each producer commits only its two allowed prefixes. The publisher verifies changed paths before integration. Reject a conflicting producer change; never let a producer edit shared files to resolve it.

Do not deploy from a producer. Do not create ZIPs, publish per story, rerun passed validation without changed inputs, inspect unrelated books, run full-project tests unless a targeted check fails, or use extended browser automation.

For existing-art repair only, `--repair-fallback` remains explicit. Narration voice playback stays outside this production workflow; do not change narrator behavior.
