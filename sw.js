const CACHE='nolan-library-v129';
const CORE=['mobile.css','mobile.js','ui-smoke-test.mjs','ui-smoke-helpers.mjs','assets/fonts/nunito-regular.ttf','assets/fonts/nunito-extrabold.ttf','assets/fonts/OFL.txt','redesign.css','quizmo/visuals.js','quizmo/generators.js','quizmo/generator-test.mjs','quizmo/caps-test.mjs','quizmo/cogat.js','quizmo/cogat-smoke-test.mjs','quizmo/quizmo.js','quizmo/quizmo.css','quizmo/smoke-test.mjs','quizmo/points-smoke-test.mjs','quizmo/reset-smoke-test.mjs','./','index.html','styles.css','app.js','config/narration-voices.json','manifest.webmanifest','assets/icons/icon-192.png','assets/icons/icon-512.png','videos/videos.js','videos/videos.css','games/games.js','games/games.css','games/games-1-5.js','games/journeys.js','games/phonics.js','games/art/lulu.svg','games/art/sunny.svg','games/art/rhymo.svg','games/art/bo.svg','games/art/fam.svg','games/art/tap-tap.svg','games/smoke-test.mjs','games/art/rollo.svg','games/art/dax.svg','games/art/bex.svg','games/art/zumi.svg','games/art/otto.svg','games/art/kip.svg','games/journeys.css','assets/narration/manifest.json','narration-smoke-test.mjs',];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const request=e.request, url=new URL(request.url);
  // Media is streamed directly: never read or write a cached video or partial response.
  if(request.method!=='GET' || request.headers.has('Range') || /\.(mp4|webm|m4v)$/i.test(url.pathname) || (url.pathname.includes('/videos/') && !/\.(js|css)$/.test(url.pathname))) return;
  // The narration manifest is network-first so newly narrated stories appear; page MP3s fall through
  // to the cache-first rule below and are cached the first time they are played.
  if(url.origin===self.location.origin && (url.pathname.endsWith('/videos.json') || url.pathname.endsWith('/assets/narration/manifest.json'))){
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
