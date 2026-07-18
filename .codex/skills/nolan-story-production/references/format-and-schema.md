# Format and source contract

- Audience: ages 3-5; gentle, reassuring, and suitable for bedtime.
- Book: one cover plus exactly 15 pages, each 1448 x 1086 (true 4:3 landscape). Covers are full-page images. Story pages reserve the upper 1448 x 815 region for illustration and the lower 1448 x 271 region for deterministic cream text composition; those regions must never overlap.
- Art: warm polished 3D children's illustration; consistent proportions, colors, features, and accessories; no human-like arms or hands. Generate wide landscape, illustration-only story art suitable for the upper region. Keep characters, faces, vehicles, animals, objects, and important actions away from the lower edge, with safe visual space below them.
- Output: one single-scene image per request. Reject collages, grids, contact sheets, split screens, and multi-panel art.
- Generated story artwork must contain no words, page numbers, badges, cream panels, logos, or watermarks. The deterministic compositor adds exact story text and the page badge only after artwork passes inspection.
- Story: beginning, small problem, safe solution, and calm bedtime ending; one clear event and 1-3 short sentences per page.

Use `production/schemas/story.schema.json`. Store each book at `production/stories/<slug>/story.json`. Its `pages[].text` values are authoritative for page composition, narration, and validation. Do not use OCR for new stories.

Use the staging layout and provenance contract in `production/schemas/asset-provenance.schema.json`. The final filenames are `cover.webp` and `page-01.webp` through `page-15.webp`.
