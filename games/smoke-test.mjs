import {checkNavigation} from '../ui-smoke-helpers.mjs';
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
  try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))throw Error();const data=await fs.readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  const opts={headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']};
  console.log('Starting browser smoke test');
  browser=puppeteer?await puppeteer.launch(opts):await playwright.chromium.launch(opts);
  const page=await browser.newPage();if(puppeteer)await page.setViewport({width:1366,height:768});else await page.setViewportSize({width:1366,height:768});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}`;
  await page.evaluateOnNewDocument(()=>{
    window.spoken=[];
    window.speechSynthesis.speak=u=>{window.spoken.push(u.text);setTimeout(()=>u.onend?.(),0);};
    localStorage.setItem('nolan-games-v1',localStorage.getItem('nolan-games-v1')||JSON.stringify({points:137,narration:true,effects:false,rewards:false,levels:{hazel:4,coby:3,nova:7,toby:6,bramble:7,aster:6,posy:5,willa:4}}));
  });
  await page.goto(url,{waitUntil:'domcontentloaded'}).catch(async e=>{if(playwright)await page.goto(url,{waitUntil:'domcontentloaded'});else throw e;});
  await checkNavigation(page);
  const tap=async selector=>{await page.evaluate(selector=>{const b=document.querySelector(selector);if(!b||b.disabled)throw Error('Missing target '+selector);const r=b.getBoundingClientRect();if(r.width<(innerWidth<700?48:52)||r.height<48)throw Error('Small target '+selector);for(const type of ['pointerdown','pointerup'])b.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,pointerType:'touch',isPrimary:true,button:0,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));},selector);};
  const choose=v=>tap(`#gamesView [data-value="${v}"]`);
  const open=id=>tap(`#gamesView [data-id="${id}"]`);
  const home=()=>tap('#gamesView [data-action="home"]');
  await tap('#gamesTab');
  assert.equal(await page.evaluate(()=>document.querySelectorAll('.game-card').length),12);
  assert.equal(await page.evaluate(()=>['bramble','aster','posy','willa'].some(id=>document.querySelector(`[data-id="${id}"]`))),false);
  const migrated=await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')));
  assert.deepEqual(migrated.levels,{hazel:4,coby:3,nova:7,toby:6});
  assert.equal(migrated.points,137);assert.equal(migrated.narration,true);assert.equal(migrated.effects,false);assert.equal(migrated.rewards,false);
  const clean=JSON.stringify({points:0,levels:{}});
  await page.evaluate(value=>localStorage.setItem('nolan-games-v1',value),clean);
  await page.reload({waitUntil:'domcontentloaded'});await tap('#gamesTab');
  assert.equal(await page.evaluate(()=>localStorage.getItem('nolan-games-v1')),clean,'Unrelated saves are untouched');
  await fs.mkdir('/workspace/ui-audit',{recursive:true});
  await page.screenshot({path:'/workspace/ui-audit/nolan-phonics-hub.png'});
  assert.equal(await page.evaluate(()=>document.querySelector('#libraryView').classList.contains('active')),false);
  await page.click('#settingsButton');
  await page.evaluate(()=>{for(const k of ['effects']){const b=document.querySelector(`[data-pref="${k}"]`);b.checked=false;b.dispatchEvent(new Event('change',{bubbles:true}));}});
  await page.click('#closeSettingsButton');
  // Load the curriculum in isolation: verify all eight levels, then use its
  // deterministic tasks to drive real pointer input (choices are shuffled).
  const {default:vm}=await import('node:vm');
  const games=[];
  const context={window:{NolanGames:{register:g=>games.push(g),token:()=>'',button:()=>''}},Math};
  vm.createContext(context);
  for(const file of ['games-1-5.js','games-6-10.js','phonics.js'])vm.runInContext(await fs.readFile(path.join(root,'games',file),'utf8'),context);
  const viewports=[{width:1366,height:768},{width:1280,height:720},{width:900,height:500},{width:390,height:844},{width:375,height:667},{width:844,height:390}];
  for(const viewport of viewports){
    if(puppeteer)await page.setViewport(viewport);else await page.setViewportSize(viewport);
    for(const game of games){await open(game.id);
      const boxes=await page.$$eval('#gamesView button',es=>es.filter(e=>!e.disabled).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}));
      for(const r of boxes)assert(r.x>=0&&r.y>=0&&r.right<=viewport.width+1&&r.bottom<=viewport.height+1&&r.w>=48&&r.h>=48,`${game.id} ${JSON.stringify(viewport)} ${JSON.stringify(r)}`);
      assert.equal(await page.$eval('.side-menu',e=>getComputedStyle(e).display),'none');
      if(game.id==='lulu'&&viewport.width===390)await page.screenshot({path:'/workspace/ui-audit/nolan-phonics-game-phone.png'});
      await home();}
  }
  if(puppeteer)await page.setViewport({width:1366,height:768});else await page.setViewportSize({width:1366,height:768});
  function nextChoice(s){const q=s.task;
    if(q.mode==='build')return q.choices[0].value;
    if(q.mode==='steps')return 'stone-'+s.selected.length;
    if(q.mode==='all')return q.answers.find(x=>!s.selected.includes(x));
    if(q.mode==='sort')return s.selected.length?'truck-'+s.selected[0].slice(-2):q.choices.find(x=>!x.value.startsWith('truck-')).value;
    if(q.tiles){const i=q.tiles.findIndex((_,i)=>!s.selected.includes('sound-'+i));if(i!==-1)return 'sound-'+i;}
    return String(q.answer);
  }
  let expected=0;
  for(const game of games){
    for(let level=1;level<=8;level++){

      const autoSpeech=await page.evaluate(()=>spoken.length);
      await open(game.id);
      assert.equal(await page.evaluate(()=>Number(document.querySelector('[data-level]').dataset.level)),level);
      if(game.phonics){
        for(const vp of viewports){
          if(puppeteer)await page.setViewport(vp);else await page.setViewportSize(vp);
          const boxes=await page.$$eval('#gamesView button',es=>es.map(e=>{const r=e.getBoundingClientRect();return {v:e.dataset.value,x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}));
          for(const b of boxes)assert(b.x>=0&&b.y>=0&&b.right<=vp.width+1&&b.bottom<=vp.height-(vp.width<700?64:0)+1&&b.w>=48&&b.h>=48,`${game.id} level ${level}, ${JSON.stringify(vp)}: ${JSON.stringify(b)}`);
        }
        if(puppeteer)await page.setViewport({width:1366,height:768});else await page.setViewportSize({width:1366,height:768});
      }
      const state=game.start(level);let done=false;
      if(game.phonics){
        const prompt=game.speech(state),first=Array.isArray(prompt)?prompt[0]:prompt;
        assert.equal(await page.evaluate(n=>spoken[n],autoSpeech),typeof first==='string'?first:first.text,game.id+' auto-speaks prompt');
        const n=await page.evaluate(()=>spoken.length);await tap('#gamesView [data-action="repeat"]');
        assert.equal(await page.evaluate(n=>spoken[n],n),typeof first==='string'?first:first.text,game.id+' replay speaks prompt');
        assert.equal(await page.$eval('[data-action="repeat"]',e=>e.textContent),'🔊');
        if(state.task.mode==='steps'){
          await choose('stone-1');assert(await page.$('.hint'),'Sound steps gentle retry');
        }
        if(state.task.mode==='sort'){
          await choose('truck-at');assert.equal(await page.evaluate(()=>document.querySelector('.game-board').dataset.round),'0','Truck alone cannot complete a round');
        }
        if(state.task.mode==='all'){
          const wrong=state.task.choices.find(c=>!state.task.answers.includes(c.value)).value;
          await choose(wrong);assert(await page.$('.hint'),'Rhymes gentle retry');
        }
        if(state.task.mode!=='build'&&state.task.mode!=='steps'&&state.task.mode!=='all'&&state.task.mode!=='sort'){
          const wrong=await page.evaluate(answer=>[...document.querySelectorAll('.game-choices [data-value]')].find(c=>c.dataset.value!==answer).dataset.value,state.task.answer);
          await choose(wrong);assert(await page.$('.hint'),game.id+' gentle retry');
        }
      }
      if(level===1){
        const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points||0);
        if(!game.phonics){
          const wrong=await page.evaluate(answer=>[...document.querySelectorAll('#gamesView [data-value]')].find(b=>b.dataset.value!==String(answer)).dataset.value,state.task.answer);
          await choose(wrong);assert(await page.evaluate(()=>!!document.querySelector('.hint')));
        }
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')).points||0),before);
      }
      while(!done){
        let result;
        const value=game.phonics?nextChoice(state):String(state.task.answer);
        const beforeSpeech=await page.evaluate(()=>spoken.length);
        const expectedSpeech=game.phonics?game.choiceSpeech(state,value):null;
        await choose(value);result=game.choose(state,value);
        if(game.phonics&&state.task.mode!=='build'&&value.length===1&&game.id==='fam'&&level<=4){
          const wrong=await page.evaluate(answer=>[...document.querySelectorAll('.game-choices [data-value]')].find(c=>c.dataset.value!==answer).dataset.value,state.task.answer);
          await choose(wrong);assert(await page.$('.hint'),'Word family picture retry');
        }
        if(game.phonics){const heard=await page.evaluate(n=>spoken[n],beforeSpeech);assert.equal(heard,expectedSpeech,game.id+' speaks choice first');}
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
  for(const file of ['redesign.css','assets/fonts/nunito-regular.ttf','assets/fonts/nunito-extrabold.ttf','ui-smoke-helpers.mjs'])assert(core.includes('/'+file),`New offline asset ${file}`);
  assert(core.includes('/games/games-6-10.js'));assert(core.includes('/games/phonics.js'));for(const g of games.filter(g=>g.phonics))assert(core.includes('/'+g.art));assert(core.includes('/games/smoke-test.mjs'));const expectedArt=(await fs.readFile(path.join(root,'sw.js'),'utf8')).match(/assets\/books\/[^']+/g);assert.equal(expectedArt.length,12);for(const asset of expectedArt)assert(core.includes('/'+asset),asset);
  if(puppeteer)await page.setOfflineMode(true);else await page.context().setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});await tap('#gamesTab');for(const {id} of games){await open(id);await page.waitForFunction(()=>{const img=document.querySelector('.game-scene img');return img?.complete&&img.naturalWidth>0;});assert(await page.evaluate(()=>{const img=document.querySelector('.game-scene img');return img.complete&&img.naturalWidth>0;}),`Offline artwork: ${id}`);await tap('#gamesView [data-action="finish"]');await home();}
  await tap('#storiesTab');assert(await page.evaluate(()=>document.querySelector('#libraryView').classList.contains('active')));
  assert.deepEqual(errors,[]);console.log(`PASS persisted ${expected} points; offline twelve games and artwork; Stories tab; no browser errors`);
}catch(error){console.error(error);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
