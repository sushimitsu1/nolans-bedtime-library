import assert from 'node:assert/strict';
export async function checkNavigation(page){
  for(const size of [{width:1366,height:768},{width:1280,height:720},{width:900,height:500}]){
    if(page.setViewport)await page.setViewport(size);else await page.setViewportSize(size);
    for(const id of ['storiesTab','gamesTab','quizmoTab']){
      await page.click('#'+id);
      const fit=await page.evaluate(()=>{
        const selectors=['.side-menu button','.view.active .hub-heading','.view.active section:not([hidden]) .quizmo-card','.quizmo-segments button'];
        return selectors.flatMap(s=>[...document.querySelectorAll(s)]).filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {name:e.textContent.trim(),button:e.tagName==='BUTTON',x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};});
      });
      for(const b of fit){assert(b.x>=0&&b.y>=0&&b.right<=size.width+1&&b.bottom<=size.height+1,`${id} ${size.width}x${size.height}: clipped ${JSON.stringify(b)}`);if(b.button)assert(b.w>=52&&b.h>=52,`Small target ${JSON.stringify(b)}`);}
      if(id==='quizmoTab')assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),`${id}: hub scrolls at ${size.width}x${size.height}`);
      assert.equal(await page.$eval('#'+id,e=>e.getAttribute('aria-selected')),'true');
    }
  }
  await page.click('#storiesTab');
  if(page.setViewport)await page.setViewport({width:1366,height:768});else await page.setViewportSize({width:1366,height:768});
}
// Smoke tests run as an already-unlocked family device (the lock itself is covered by family-lock-test.mjs).
export async function unlockFamily(page){
  const {readFileSync}=await import('node:fs');
  const hash=readFileSync(new URL('./family-lock.js',import.meta.url),'utf8').match(/hash: '([0-9a-f]{64})'/)[1];
  const seed=h=>{try{localStorage.setItem('nolan:familyUnlock',h);}catch{}};
  if(page.evaluateOnNewDocument)await page.evaluateOnNewDocument(seed,hash);else await page.addInitScript(seed,hash);
}
