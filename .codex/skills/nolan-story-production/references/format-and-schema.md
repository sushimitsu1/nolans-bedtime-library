# Format and source contract

- Audience: ages 3-5; gentle, reassuring, and suitable for bedtime.
- Book: one cover plus exactly 15 pages, each 1448 x 1086 (true 4:3 landscape). Covers and story-page illustrations are full-bleed with no outer cream frame, letterboxing, visibly shrunk art, or large unused side margins.
- Art: warm polished 3D children's illustration; consistent proportions, colors, features, and accessories; no human-like arms or hands. Generate every new raw story page at 1448 x 1086 or a compatible larger 4:3 resolution.
- Safe zone: reserve approximately the bottom 25-30% as low-detail road, grass, water, sky reflection, floor, or simple scenery. Keep every character, face, eye, vehicle feature, animal, required object, and story action above y=760 in final-page coordinates. Record every required subject or action as a labeled bounding box before composition.
- Integrated page: the illustration fills the entire canvas. The deterministic compositor adds a consistently sized rounded cream panel inset near the bottom plus a fully visible white circular badge with blue outline. The panel may cover only the reviewed low-detail safe zone and must never cover required artwork.
- Repair fallback: the separated 1448 x 815 illustration plus 1448 x 271 cream text area is allowed only when adapting existing artwork whose important content cannot safely support an inset panel. It is never the default for new stories.
- Output: one single-scene image per generation request. Reject collages, grids, split screens, and multi-panel art. A temporary post-composition 15-page QA contact sheet is allowed only for continuity review and must be deleted before package validation.
- Generated story artwork must contain no words, page numbers, badges, cream panels, logos, or watermarks. The deterministic compositor adds exact story text and the page badge only after artwork passes inspection.
- Story: beginning, small problem, safe solution, and calm bedtime ending; one clear event and 1-3 short sentences per page.

Use `production/schemas/story.schema.json`. Store each book at `production/stories/<slug>/story.json`. Its `pages[].text` values are authoritative for page composition, narration, and validation. Do not use OCR for new stories.

For isolated production, keep bibles, narration, review evidence, manifests, attempt counts, and status under `production/stories/<slug>/`. Keep final files under `assets/books/<slug>/`; their filenames are `cover.webp` and `page-01.webp` through `page-15.webp`. A producer may not write to shared staging or another slug.

Store visual evidence at `production/stories/<slug>/visual-review.json`. Each page record must contain `requiredSubjectBoxes` in final 1448 x 1086 coordinates and final checks for subject placement, safe-zone compliance, panel integration, consistent panel size, consistent badge placement, and unobstructed story action.
