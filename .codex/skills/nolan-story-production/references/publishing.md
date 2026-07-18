# Integration and publishing

The inspected repository tracks only `origin/main`; use `main` as the publishing branch unless repository configuration later proves otherwise.

1. Copy validated final assets directly to `assets/books/<slug>/`; do not create an internal handoff ZIP.
2. Capture an app baseline with `validate_app.mjs --write-baseline` before editing.
3. Update `app.js` once per batch, with exactly 15 page paths and narration copied byte-for-byte from `story.json`.
4. Increment the `sw.js` cache version once per batch.
5. Run the story, asset, text, and app validators. Run only targeted static checks unless one fails.
6. Smoke-test Page 1 and Page 15 for each new story. Use browser control only if static checks or this smoke test fails.
7. Commit once and push once when the repository workflow permits it. Verify the deployed page returns a successful response.
8. Mark inventory records `published` only after deployment verification. An optional archive may be created afterward.

Do not alter unrelated story records or assets. App validation must show the expected library-count increase and unchanged hashes for every unrelated record.
