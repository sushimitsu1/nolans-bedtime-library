import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const handlers = {}, stored = new Map();
let online = true, writes = 0;
const cache = {
  put: async (request, response) => { writes++; stored.set(request.url, response); },
  match: async request => stored.get(request.url)?.clone()
};
const context = {
  URL, Error,
  self: {location: {origin: 'https://test'}, addEventListener: (name, fn) => { handlers[name] = fn; }},
  caches: {open: async () => cache, match: request => cache.match(request)},
  fetch: async () => { if (!online) throw Error('offline'); return new Response('{"videos":[]}'); }
};
const source = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
vm.runInNewContext(source, context);
assert(source.includes("'videos/videos.js'"));
assert(source.includes("'videos/videos.css'"));
for (const path of ['/test.mp4','/test.WEBM','/test.m4v','/videos/movie','/other']) {
  let intercepted = false;
  handlers.fetch({request: new Request('https://test'+path, {headers: path==='/other'?{Range:'bytes=0-10'}:{}}), respondWith: () => { intercepted = true; }});
  assert.equal(intercepted, false, path);
}
async function request(path) {
  let response;
  handlers.fetch({request: new Request('https://test'+path), waitUntil: () => {}, respondWith: promise => { response = promise; }});
  return response;
}
assert.equal((await request('/videos.json')).status, 200);
assert.equal(writes, 1);
online = false;
assert.equal((await request('/videos.json')).status, 200);
online = true;
for (const path of ['/videos/videos.js','/videos/videos.css']) assert.equal((await request(path)).status, 200);
assert.equal(writes, 3);
console.log('PASS video/Range cache bypass, list network-first and offline fallback, tab code caching');
