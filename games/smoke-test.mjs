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
  console.log('Starting browser smoke test');
  browser=puppeteer?await puppeteer.launch(opts):await playwright.chromium.launch(opts);
  const page=await browser.newPage();if(puppeteer)await page.setViewport({width:1200,height:1200});else await page.setViewportSize({width:1200,height:1200});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}`;
  await page.goto(url,{waitUntil:'domcontentloaded'}).catch(async e=>{if(playwright)await page.goto(url,{waitUntil:'domcontentloaded'});else throw e;});
  const tap=async selector=>{await page.evaluate(selector=>{const b=document.querySelector(selector);if(!b||b.disabled)throw Error('Missing target '+selector);const r=b.getBoundingClientRect();if(r.width<88||r.height<88)throw Error('Small target '+selector);for(const type of ['pointerdown','pointerup'])b.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,pointerType:'touch',isPrimary:true,button:0,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));},selector);};
  const choose=v=>tap(`#gamesView [data-value="${v}"]`);
  const open=id=>tap(`#gamesView [data-id="${id}"]`);
  const home=()=>tap('#gamesView [data-action="home"]');
  await tap('#gamesTab');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('.game-card').length),10);
  assert.equal(await page.evaluate(()=>document.querySelector('#libraryView').classList.contains('active')),false);
  await tap('#gamesView [data-action="parent"]');
  await page.evaluate(()=>{for(const k of ['narration','effects']){const b=document.querySelector(`[data-pref="${k}"]`);b.checked=false;b.dispatchEvent(new Event('change',{bubbles:true}));}});
  // Load the curriculum in isolation: verify all eight levels, then use its
  // deterministic tasks to drive real pointer input (choices are shuffled).
  const {default:vm}=await import('node:vm');
  const games=[];
  const context={window:{NolanGames:{register:g=>games.push(g),token:()=>'',button:()=>''}},Math};
  vm.createContext(context);
  for(const file of ['games-1-5.js','games-6-10.js'])vm.runInContext(await fs.readFile(path.join(root,'games',file),'utf8'),context);
  const drag=async(from,to)=>{
    const a=await page.evaluate(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};},from);
    const b=await page.evaluate(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};},to);
    await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up();
  };
  let expected=0;
  for(const game of games){
    for(let level=1;level<=8;level++){
      if(game.id==='willa')console.log('Checking spelling level '+level);
      await open(game.id);
      assert.equal(await page.evaluate(()=>Number(document.querySelector('[data-level]').dataset.level)),level);
      const state=game.start(level);let done=false;
      if(level===1){
        const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points||0);
        if(game.id!=='willa'){
          const wrong=await page.evaluate(answer=>[...document.querySelectorAll('#gamesView [data-value]')].find(b=>b.dataset.value!==String(answer)).dataset.value,state.task.answer);
          await choose(wrong);assert(await page.evaluate(()=>!!document.querySelector('.hint')));
        }
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points||0),before);
      }
      while(!done){
        let result;
        if(game.id==='willa'){
          while(state.task.placed.length<3){
            const i=state.task.placed.length, tile=state.task.tiles.indexOf(state.task.word[i]);
            // Tile order differs across runs; locate by its visible letter.
            const value=await page.evaluate(letter=>[...document.querySelectorAll('[data-drag]')].find(b=>b.textContent.trim()===letter)?.dataset.value,state.task.word[i]);
            assert(value,`Missing ${state.task.word[i]} in ${game.id} level ${level}, slot ${i}`);
            if(i===1)await drag(`[data-value="${value}"]`,`[data-value="slot-${i}"]`);
            else {await choose(value);await choose('slot-'+i);}
            game.choose(state,'tile-'+tile);result=game.choose(state,'slot-'+i);
            if(result.points)break;
          }
        }else {await choose(state.task.answer);result=game.choose(state,String(state.task.answer));}
        expected+=result.points||0;if(result.done){expected+=2;done=true;}
      }
      assert(await page.evaluate(()=>!!document.querySelector('.resting')),game.id+' level '+level);
      const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')));
      assert.equal(stored.levels[game.id],Math.min(8,level+1));assert.equal(stored.points,expected);
      await tap('#gamesView [data-action="finish"]');await home();
    }
    console.log(`PASS ${game.title}: eight levels, gentle retry, points and progression`);
  }
  // Early finish and cancelled input never count as completing a level.
  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('nolan-games-v1'));p.levels.hazel=3;localStorage.setItem('nolan-games-v1',JSON.stringify(p));});
  await page.reload({waitUntil:'domcontentloaded'});await tap('#gamesTab');await open('hazel');
  await page.evaluate(()=>{const b=document.querySelector('[data-value]');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:4}));b.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,pointerId:4}));b.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerId:4}));});
  await tap('#gamesView [data-action="finish"]');await home();await page.reload({waitUntil:'domcontentloaded'});await tap('#gamesTab');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).levels.hazel),3);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points),expected);
  console.log('Checking service-worker cache and offline play');
  await page.evaluate(async()=>{await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('Service worker did not become ready')),30000))]);if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  const cacheVersion=(await fs.readFile(path.join(root,'sw.js'),'utf8')).match(/const CACHE='([^']+)'/)[1];
  const core=await page.evaluate(async version=>{const cache=await caches.open(version);return (await cache.keys()).map(r=>new URL(r.url).pathname);},cacheVersion);
  assert(core.includes('/games/games-6-10.js'));assert(core.includes('/games/smoke-test.mjs'));const expectedArt=(await fs.readFile(path.join(root,'sw.js'),'utf8')).match(/assets\/books\/[^']+/g);assert.equal(expectedArt.length,20);for(const asset of expectedArt)assert(core.includes('/'+asset),asset);
  if(puppeteer)await page.setOfflineMode(true);else await page.context().setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});await tap('#gamesTab');for(const {id} of games){await open(id);await page.waitForFunction(()=>{const img=document.querySelector('.game-scene img');return img?.complete&&img.naturalWidth>0;});assert(await page.evaluate(()=>{const img=document.querySelector('.game-scene img');return img.complete&&img.naturalWidth>0;}),`Offline artwork: ${id}`);await tap('#gamesView [data-action="finish"]');await home();}
  await tap('#storiesTab');assert(await page.evaluate(()=>document.querySelector('#libraryView').classList.contains('active')));
  assert.deepEqual(errors,[]);console.log(`PASS persisted ${expected} points; offline ten games and artwork; Stories tab; no browser errors`);
}catch(error){console.error(error);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
