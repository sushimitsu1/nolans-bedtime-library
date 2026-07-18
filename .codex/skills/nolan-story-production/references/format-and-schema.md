# Format and source contract

- Audience: ages 3-5; gentle, reassuring, and suitable for bedtime.
- Book: one cover plus exactly 15 pages, each 1448 x 1086 (true 4:3 landscape).
- Art: warm polished 3D children's illustration; consistent proportions, colors, features, and accessories; no human-like arms or hands.
- Output: one single-scene image per request. Reject collages, grids, contact sheets, split screens, and multi-panel art.
- Story: beginning, small problem, safe solution, and calm bedtime ending; one clear event and 1-3 short sentences per page.

Use `production/schemas/story.schema.json`. Store each book at `production/stories/<slug>/story.json`. Its `pages[].text` values are authoritative for page composition, narration, and validation. Do not use OCR for new stories.

Use the staging layout and provenance contract in `production/schemas/asset-provenance.schema.json`. The final filenames are `cover.webp` and `page-01.webp` through `page-15.webp`.
