# App Data and Folder Contract

## Story object contract
Each story entry should include at minimum:

```js
{
  id: 'story-id',
  title: 'Story Title',
  category: 'Construction Vehicles',
  description: 'Short parent-facing description.',
  keywords: ['vehicle', 'teamwork', 'bedtime'],
  cover: 'assets/books/story-id/cover.webp',
  pages: Array.from({ length: 15 }, (_, i) =>
    `assets/books/story-id/page-${String(i + 1).padStart(2, '0')}.webp`
  )
}
```

## Categories
Use exactly:
- `Emergency Vehicles`
- `Construction Vehicles`
- `Monster Trucks`

## Service worker
Whenever artwork or static files are replaced but filenames stay the same:
- Increment the cache version in `sw.js`
- Ensure old caches are deleted during activation

## Local storage
Preserve existing keys whenever possible so updates do not erase reading progress or favorites.
