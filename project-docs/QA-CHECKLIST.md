# Pre-Push QA Checklist

## Files
- [ ] `index.html`, `app.js`, `styles.css`, `manifest.webmanifest`, and `sw.js` exist
- [ ] Every story folder contains `cover.webp`
- [ ] Every story folder contains `page-01.webp` through `page-15.webp`
- [ ] No referenced file is missing
- [ ] No referenced file is zero bytes
- [ ] Path casing matches exactly

## App
- [ ] All story cards display a cover
- [ ] Every story opens
- [ ] Previous and Next work
- [ ] Page counter is correct
- [ ] Search finds title and keywords
- [ ] Category filters work
- [ ] Favorites persist after reload
- [ ] Shuffle opens a valid story
- [ ] Parent reset works
- [ ] Layout works on phone and tablet widths

## Cache
- [ ] `sw.js` cache version was incremented when static assets changed
- [ ] Old caches are removed
- [ ] Hard refresh shows current artwork

## Git
- [ ] Review `git status`
- [ ] Review changed file list
- [ ] Commit with a clear message
- [ ] Push to `main`
- [ ] Wait for GitHub Pages deployment
- [ ] Verify live site after deployment
