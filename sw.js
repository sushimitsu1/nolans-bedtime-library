const CACHE='nolan-library-v97';
const CORE=['./','index.html','styles.css','app.js','config/narration-voices.json','manifest.webmanifest','assets/icons/icon-192.png','assets/icons/icon-512.png','videos/videos.js','videos/videos.css','games/games.js','games/games.css','games/games-1-5.js','games/games-6-10.js','games/smoke-test.mjs','assets/books/hazel-the-little-tractor-and-the-moonlight-harvest/page-01.webp','assets/books/hazel-the-little-tractor-and-the-moonlight-harvest/page-15.webp','assets/books/coby-the-little-trolley-and-the-city-of-sleepy-lights/page-01.webp','assets/books/coby-the-little-trolley-and-the-city-of-sleepy-lights/page-15.webp','assets/books/cora-crane-truck-wobbly-sign/page-01.webp','assets/books/cora-crane-truck-wobbly-sign/page-15.webp','assets/books/bramble-the-little-book-train-and-the-sleepy-story-town/page-01.webp','assets/books/bramble-the-little-book-train-and-the-sleepy-story-town/page-15.webp','assets/books/aster-the-little-fox-and-the-whispering-weather-festival/page-01.webp','assets/books/aster-the-little-fox-and-the-whispering-weather-festival/page-15.webp','assets/books/saffy-the-little-triceratops-and-the-rainy-evening-song/page-01.webp','assets/books/saffy-the-little-triceratops-and-the-rainy-evening-song/page-15.webp','assets/books/nova-night-bus-missing-star-sticker/page-01.webp','assets/books/nova-night-bus-missing-star-sticker/page-15.webp','assets/books/toby-the-little-tugboat-and-the-sunset-island-lullaby/page-01.webp','assets/books/toby-the-little-tugboat-and-the-sunset-island-lullaby/page-15.webp','assets/books/posy-the-baker-bear-and-the-moon-rolls/page-01.webp','assets/books/posy-the-baker-bear-and-the-moon-rolls/page-15.webp','assets/books/willa-the-little-plane-and-the-quiet-sky/page-01.webp','assets/books/willa-the-little-plane-and-the-quiet-sky/page-15.webp'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const request=e.request, url=new URL(request.url);
  // Media is streamed directly: never read or write a cached video or partial response.
  if(request.method!=='GET' || request.headers.has('Range') || /\.(mp4|webm|m4v)$/i.test(url.pathname) || (url.pathname.includes('/videos/') && !/\.(js|css)$/.test(url.pathname))) return;
  if(url.origin===self.location.origin && url.pathname.endsWith('/videos.json')){
    e.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await fetch(request,{cache:'no-store'});
        if(!response.ok) throw new Error('Video list unavailable');
        await cache.put(request,response.clone());
        return response;
      }catch(error){const hit=await cache.match(request);if(hit)return hit;throw error;}
    })());
    return;
  }
  e.respondWith(caches.match(request).then(hit=>hit||fetch(request).then(r=>{
    if(r.ok && r.status!==206){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(request,copy)));}
    return r;
  })));
});
