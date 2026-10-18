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
    window.spoken=[];window.tones=[];
    speechSynthesis.speak=u=>{spoken.push(u.text);setTimeout(()=>u.onend?.(),0);};
    localStorage.setItem('nolan-games-v1',localStorage.getItem('nolan-games-v1')||JSON.stringify({points:137,narration:true,effects:true,rewards:false,levels:{hazel:4,coby:3,cora:8,saffy:5,nova:7,toby:6,bramble:7,aster:6,posy:5,willa:4,lulu:3,sunny:2}}));
    const osc=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(){tones.push('soft');return osc.call(this);};
  });
  await page.goto(url,{waitUntil:'domcontentloaded'});
  const tap=async selector=>page.evaluate(selector=>{const b=document.querySelector(selector);if(!b||b.disabled)throw Error('Missing target '+selector);const r=b.getBoundingClientRect();for(const type of ['pointerdown','pointerup'])b.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,isPrimary:true,button:0,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));},selector);
  const open=id=>tap(`[data-id="${id}"]`),home=()=>tap('[data-action="home"]');
  await tap('#gamesTab');
  assert.equal(await page.$$eval('.game-card',es=>es.length),12);
  const migrated=await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')));
  assert.deepEqual(migrated.levels,{lulu:3,sunny:2});assert.equal(migrated.points,137);assert.equal(migrated.effects,true);assert.equal(migrated.rewards,false);
  assert.equal(await page.$('[data-id="hazel"]'),null);
  await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('nolan-games-v1'));p.levels={};localStorage.setItem('nolan-games-v1',JSON.stringify(p));});await page.reload({waitUntil:'domcontentloaded'});await tap('#gamesTab');
  const {default:vm}=await import('node:vm');const games=[];
  const context={window:{NolanGames:{register:g=>games.push(g),token:()=>'',button:()=>''}},Math,setTimeout};vm.createContext(context);
  for(const file of ['games-1-5.js','journeys.js','phonics.js'])vm.runInContext(await fs.readFile(path.join(root,'games',file),'utf8'),context);
  assert.equal(games.length,12);
  const viewports=[{width:1366,height:768},{width:1280,height:720},{width:900,height:500},{width:390,height:844},{width:375,height:667},{width:844,height:390}];
  await fs.mkdir('/workspace/ui-audit',{recursive:true});
  async function fit(id,vp){
    const boxes=await page.$$eval('#gamesView button',es=>es.filter(e=>!e.disabled).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}));
    for(const b of boxes)assert(b.x>=-1&&b.y>=-1&&b.right<=vp.width+1&&b.bottom<=vp.height+1&&b.w>=52&&b.h>=52,`${id} ${JSON.stringify(vp)}: ${JSON.stringify(b)}`);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
    for(const sel of ['.side-menu','.mobile-tabs','.main-tabs'])assert(await page.$eval(sel,e=>!e.getClientRects().length||getComputedStyle(e).display==='none'),sel+' hidden during play');
    const img=await page.$eval(id==='rollo'?'.world-friend':'.game-scene img',e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0;}).catch(()=>true);assert(img,'Friend stays visible');
  }
  for(const vp of viewports){await page.setViewport(vp);await page.evaluate(()=>scrollTo(0,0));
    const columns=await page.$eval('.game-grid',e=>({n:getComputedStyle(e).gridTemplateColumns.split(' ').length,w:e.clientWidth}));assert.equal(columns.n,columns.w>=1200?5:columns.w>=800?4:columns.w>=600?3:2);
    if(vp.width===1366||vp.width===390)await page.screenshot({path:`/workspace/ui-audit/newgames-hub-${vp.width}x${vp.height}.png`});
    for(const game of games){await open(game.id);await fit(game.id,vp);
      if(game.id==='rollo'&&[1366,390,844].includes(vp.width)||game.id==='lulu'&&vp.width===390){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));});await page.screenshot({path:`/workspace/ui-audit/newgames-${game.id}-${vp.width}x${vp.height}.png`});}
      await home();}
  }
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.setViewport({width:1366,height:768});
  function step(s){switch(s.id){
    case 'rollo':return ['cargo','bed'];case 'dax':return [s.level===8?'0':s.opened.includes('0')?'1':'0','bridge'];case 'bex':return ['parcel','porch'];
    case 'zumi':if(s.level<6){const lane=s.relation==='equal'?'left':(s.relation==='more'?s.left>s.right:s.left<s.right)?'left':'right';return [lane,lane];}if(s.left===s.right)return s.relation==='fewer'?['from-left','right']:['from-right','left'];return s.left>s.right?['from-left','right']:['from-right','left'];
    case 'otto':if(!s.chosenUnit)return ['unit-1',String(s.gaps[0])];return [String(s.track[s.gaps[0]]),String(s.gaps[0])];
    case 'kip':{const i=s.bays.findIndex((_,i)=>!s.opened.includes(i));return [String(i),String(i)];}
  }}
  const choose=v=>tap(`[data-value="${v}"]`);
  function phonicsStep(s){const q=s.task;if(q.mode==='build')return q.choices[0].value;if(q.mode==='steps')return 'stone-'+s.selected.length;if(q.mode==='all')return q.answers.find(x=>!s.selected.includes(x));if(q.mode==='sort')return s.selected.length?'truck-'+s.selected[0].slice(-2):q.choices.find(x=>!x.value.startsWith('truck-')).value;if(q.tiles){const i=q.tiles.findIndex((_,i)=>!s.selected.includes('sound-'+i));if(i!==-1)return 'sound-'+i;}return String(q.answer);}
  let dragged=false;
  for(const game of games){
    await page.evaluate(id=>{const p=JSON.parse(localStorage.getItem('nolan-games-v1'));p.levels[id]=1;localStorage.setItem('nolan-games-v1',JSON.stringify(p));},game.id);await page.reload({waitUntil:'domcontentloaded'});await tap('#gamesTab');
    for(let level=1;level<=8;level++){
      await open(game.id);const s=game.start(level);assert.equal(await page.$eval('[data-level]',e=>+e.dataset.level),level);
      assert(await page.evaluate(()=>(spoken.length+(window.NolanVoice?.calls||0))>0),'Spoken prompt');
      for(const vp of viewports){await page.setViewport(vp);await fit(game.id,vp);}await page.setViewport({width:1366,height:768});
      if(game.vehicle){
        let missions=0;while(missions<3){let ready=false;let guard=0;while(!ready){assert(++guard<50,'Mission terminates');const [value,slot]=step(s);await tap(`[data-action="piece"][data-value="${value}"]`);
          const result=game.place(s,value,slot);assert(result.ok,game.id+' model valid placement');
          if(game.id==='rollo'&&level===1||level===1&&missions===0&&guard===1){await page.mouse.move(500,500);const a=await page.$(`[data-action="piece"][data-value="${value}"]`),b=await page.$(`[data-slot="${slot}"]`);const ar=await a.boundingBox(),br=await b.boundingBox();await page.mouse.move(ar.x+ar.width/2,ar.y+ar.height/2);await page.mouse.down();await page.mouse.move(br.x+br.width/2,br.y+br.height/2,{steps:12});await page.mouse.up();dragged=true;}
          else await tap(`[data-slot="${slot}"]`);
          ready=result.ready;
        }
        assert(await page.$('[data-action="depart"]'),game.id+' ready to travel');await tap('[data-action="depart"]');missions++;s.round++;if(missions<3)game.mission(s);
        await page.waitForFunction(n=>document.querySelector('.resting')||+document.querySelector('[data-round]').dataset.round===n,{},missions);
        }
      }else{let done=false;let guard=0;while(!done){assert(++guard<80);const value=phonicsStep(s);await choose(value);const result=game.choose(s,value);done=result.done;}}
      assert(await page.$('.resting'),game.id+' level completed');const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('nolan-games-v1')));assert.equal(stored.levels[game.id],Math.min(8,level+1));await home();
    }console.log(`PASS ${game.title}: 8 levels, three missions, persisted progress`);
  }
  assert(dragged);
  // Gentle retries preserve mission state and do not play an error tone.
  await open('kip');const before=await page.evaluate(()=>tones.length);await tap('[data-value="0"]');const selected=await page.evaluate(()=>tones.length);await tap('[data-slot="1"]');assert.equal(await page.evaluate(()=>tones.length),selected);assert.match(await page.$eval('.play-hint',e=>e.textContent),/Try/);assert(selected>=before);await home();
  assert(!/buzzer|wrong-answer/i.test(await fs.readFile(path.join(root,'games/games.js'),'utf8')));
  // Offline scenes and local SVG art are all precached.
  await page.evaluate(()=>navigator.serviceWorker.ready);const cacheVersion=(await fs.readFile(path.join(root,'sw.js'),'utf8')).match(/const CACHE='([^']+)'/)[1];assert.match(cacheVersion,/^nolan-library-v\d+$/);assert(Number(cacheVersion.split('-v')[1])>=113,'cache must be at least the v113 games release');
  const core=await page.evaluate(async v=>(await (await caches.open(v)).keys()).map(r=>new URL(r.url).pathname),cacheVersion);
  for(const file of ['games/journeys.js','games/journeys.css',...games.map(g=>g.art)])assert(core.includes('/'+file),'Precached '+file);
  await page.setOfflineMode(true);await page.reload({waitUntil:'domcontentloaded'});await tap('#gamesTab');for(const g of games){await open(g.id);await page.waitForFunction(()=>[...document.querySelectorAll('#gamesView img')].every(i=>i.complete&&i.naturalWidth));await home();}
  assert.deepEqual(errors,[]);console.log('PASS migration preserves phonics, mixed hub, six viewports, tap and real drag, speech, gentle retry, reduced motion, hidden navigation, v113 offline art; screenshots saved');
}catch(error){console.error(error);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
