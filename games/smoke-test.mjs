// Run: node games/smoke-test.mjs. Uses installed Puppeteer or Playwright and Chrome.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let puppeteer,playwright;
for(const name of ['puppeteer','puppeteer-core','/tmp/shot/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js']){
  try{puppeteer=(await import(name)).default;break;}catch{}
}
if(!puppeteer){for(const name of ['playwright','/usr/local/lib/pnpm/5/node_modules/playwright-core/index.mjs'])try{playwright=await import(name);break;}catch{}}
assert(puppeteer||playwright,'Install puppeteer or playwright to run the browser smoke test.');
const server=http.createServer(async(req,res)=>{
  try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))throw Error();const data=await fs.readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  const opts={headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']};
  browser=puppeteer?await puppeteer.launch(opts):await playwright.chromium.launch(opts);
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}`;
  await page.goto(url,{waitUntil:'networkidle0'}).catch(async e=>{if(playwright)await page.goto(url,{waitUntil:'networkidle'});else throw e;});
  const tap=async selector=>{await page.evaluate(selector=>{const b=document.querySelector(selector);if(!b||b.disabled)throw Error('Missing target '+selector);const r=b.getBoundingClientRect();if(r.width<88||r.height<88)throw Error('Small target '+selector);for(const type of ['pointerdown','pointerup'])b.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,pointerType:'touch',isPrimary:true,button:0,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));},selector);};
  const choose=v=>tap(`#gamesView [data-value="${v}"]`);
  const open=id=>tap(`#gamesView [data-id="${id}"]`);
  const home=()=>tap('#gamesView [data-action="home"]');
  await tap('#gamesTab');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('.game-card').length),10);
  assert.equal(await page.evaluate(()=>document.querySelector('#libraryView').classList.contains('active')),false);
  await tap('#gamesView [data-action="parent"]');
  await page.evaluate(()=>{for(const k of ['narration','effects']){const b=document.querySelector(`[data-pref="${k}"]`);b.checked=false;b.dispatchEvent(new Event('change',{bubbles:true}));}});
  let expected=0;
  const sessions=[['hazel',Array(10).fill('pumpkin'),16],['coby',['0','1','2'],5],['cora',['0','slot-0','1','slot-1','2','slot-2'],5],['bramble',['N','O','L'],5],['aster',['0','3','1','2'],6],['saffy',['little','big','little'],5],['nova',['moon','star','moon'],5],['toby',['0','dock-0','1','dock-1'],4],['posy',['0','1','2'],5],['willa',['river','park','town'],5]];
  for(const [id,sequence,points] of sessions){
    await open(id);assert.equal(await page.evaluate(()=>!!document.querySelector('.demo-hand')),true);
    // Different answers preserve all points and expose a visual hint.
    if(['coby','bramble','saffy','nova','posy','willa'].includes(id)){
      const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points);
      const wrong=await page.evaluate(answer=>[...document.querySelectorAll('#gamesView [data-value]')].find(b=>b.dataset.value!==answer).dataset.value,sequence[0]);await choose(wrong);
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points),before);
      assert(await page.evaluate(()=>!!document.querySelector('.hint')));
    }
    for(const value of sequence)await choose(value);
    assert(await page.evaluate(()=>!!document.querySelector('.resting')),`${id} did not finish`);
    expected+=points;assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points),expected,id);
    // Finishing twice never awards twice.
    await tap('#gamesView [data-action="finish"]');await home();console.log(`PASS ${id}: ${points} points, calm ending`);
  }
  await open('bramble');for(const letter of ['O','L','A'])await choose(letter);expected+=5;assert(await page.evaluate(()=>!!document.querySelector('.resting')));await home();
  await open('hazel');
  await page.evaluate(()=>{const b=document.querySelector('[data-value="pumpkin"]');b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:3}));b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:4}));b.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:4}));b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:4}));});
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points),expected,'Cancelled touches must not award points');
  await choose('pumpkin');expected++;await tap('#gamesView [data-action="finish"]');await home();
  await open('cora');await choose('slot-1');await choose('0');await choose('slot-1');assert(await page.evaluate(()=>!!document.querySelector('.hint')));await tap('#gamesView [data-action="finish"]');await home();
  await open('aster');await choose('0');await choose('1');assert(await page.evaluate(()=>!!document.querySelector('.hint')));await tap('#gamesView [data-action="finish"]');await home();
  await page.reload();await tap('#gamesTab');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points),expected);
  await tap('#gamesView [data-action="parent"]');assert((await page.evaluate(()=>document.querySelector('.game-sky').textContent)).includes(`${Math.floor(expected/5)} stars`));
  await page.evaluate(()=>{for(const k of ['easy','memory']){const b=document.querySelector(`[data-pref="${k}"]`);b.checked=true;b.dispatchEvent(new Event('change',{bubbles:true}));}});
  await open('hazel');await choose('pumpkin');expected+=3;await tap('#gamesView [data-action="finish"]');await home();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points),expected,'Easier counting set');
  await open('aster');assert((await page.evaluate(()=>document.querySelector('[data-value="1"]').textContent)).includes('🛏️'));await choose('peek');assert((await page.evaluate(()=>document.querySelector('[data-value="1"]').textContent)).includes('🍃'));await tap('#gamesView [data-action="finish"]');await home();
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  const core=await page.evaluate(async()=>{const cache=await caches.open('nolan-library-v95');return (await cache.keys()).map(r=>new URL(r.url).pathname);});
  assert(core.includes('/games/games-6-10.js'));assert(core.includes('/games/smoke-test.mjs'));const expectedArt=(await fs.readFile(path.join(root,'sw.js'),'utf8')).match(/assets\/books\/[^']+/g);assert.equal(expectedArt.length,20);for(const asset of expectedArt)assert(core.includes('/'+asset),asset);
  if(puppeteer)await page.setOfflineMode(true);else await page.context().setOffline(true);
  await page.reload();await tap('#gamesTab');for(const [id] of sessions){await open(id);assert(await page.evaluate(()=>{const img=document.querySelector('.game-scene img');return img.complete&&img.naturalWidth>0;}),`Offline artwork: ${id}`);await tap('#gamesView [data-action="finish"]');await home();}
  await tap('#storiesTab');assert(await page.evaluate(()=>document.querySelector('#libraryView').classList.contains('active')));
  assert.deepEqual(errors,[]);console.log(`PASS persisted ${expected} points; offline ten games and artwork; Stories tab; no browser errors`);
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
