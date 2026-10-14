# Add a video

1. Put an MP4 (recommended), WebM, or M4V in `videos/`, or use an HTTPS streaming file URL. Video files are streamed and never cached for offline use.
2. Put a landscape thumbnail outside `videos/`, for example `assets/video-thumbnails/moon-trip.webp`.
3. Add an entry to the root `videos.json`:

```json
{"videos":[{"id":"moon-trip","title":"Moon Trip","src":"videos/moon-trip.mp4","thumbnail":"assets/video-thumbnails/moon-trip.webp"}]}
```

Use a unique id and the story title. Keep the JSON valid. The list starts empty; the Videos tab shows a friendly visual until entries are added. The list refreshes from the network with a cached fallback, but playback requires a connection. The host should serve the correct video MIME type and support Range requests for seeking. Check playback on a touch device and mouse before publishing.

Run `node videos/smoke-test.mjs` for the empty-state check, and the existing app/assets validators and games smoke test before publishing app changes.
