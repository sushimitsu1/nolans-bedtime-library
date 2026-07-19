# Batch publishing

Begin only after every selected producer has ended in `ready_to_publish` or `needs_review`. The publisher is the only phase allowed to modify `app.js`, `sw.js`, shared inventory, shared queue state, or deployment metadata.

1. Use `batch_workflow.py eligible <repo-root> <slug>...` to admit `ready_to_publish` packages and exclude `needs_review` packages without blocking valid stories.
2. Validate exactly one cover and Pages 1-15 for each admitted story: names, opening, 1448 x 1086 dimensions, unique hashes, integrated full-bleed layout, exact manifest text, badges 1-15, safe-zone evidence, and narration equality. Reject packages containing a QA contact sheet.
3. Generate all accepted app narration arrays directly from their `story.json` page texts. Do not copy app snippets or rewrite narration.
4. Capture an app baseline, then update `app.js` once for all admitted stories. Confirm unrelated story hashes and records are unchanged.
5. Increment the single cache version in `sw.js` exactly once with `batch_workflow.py bump-cache sw.js`; never bump per story.
6. Run targeted validators. Smoke-test each admitted library card, cover, Pages 1, 5, 9, 10, and 15, narration continuation, and navigation. Run full-project tests only after a targeted failure; avoid extended browser automation.
7. Commit the batch integration once, push once, and verify deployment once. Mark admitted inventory records `published` only after live verification; leave excluded records `needs_review`.

Do not create internal ZIPs, publish individually, or alter unrelated records and assets.
