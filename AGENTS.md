# Nolan Bedtime Library

- Produce books for ages 3-5 as one cover plus exactly 15 story pages.
- Final images must be 1448 x 1086 (true 4:3 landscape) in a warm, polished 3D children's-illustration style.
- Keep characters friendly and consistent. Do not add human-like arms or hands.
- Generate one illustration at a time. Never request or accept collages, grids, contact sheets, or multi-panel images.
- Produce only one story at a time and validate each stage before continuing.
- Treat `production/stories/<slug>/story.json` as the single source of truth for visible text, narration, and validation.
- Never modify unrelated stories, substitute old artwork, or guess missing pages.
- Regenerate only failed artwork; preserve assets that passed validation.
- Use targeted static checks first. Do not run full-project tests unless targeted checks fail.
- Avoid browser automation unless static checks or the Page 1/Page 15 smoke test fails.
- Do not publish until story, asset, text, narration, and app validation all pass.
