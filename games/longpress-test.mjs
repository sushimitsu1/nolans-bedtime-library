// Run: node games/longpress-test.mjs [chromium|webkit]
// Long press (1.2 s) then drag, and long press then release, on the drag games and Quizmo, under phone emulation.
// Checks that pieces still move/tap, that nothing stays selected, no context menu fires, and no piece is left stuck.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let playwright;
for(const name of ['playwright','/tmp/pw/node_modules/playwright/index.mjs','/usr/local/lib/pnpm/5/node_modules/playwright-core/index.mjs'])try{playwright=await import(name);break;}catch{}
assert(playwright,'Install playwright to run the long-press test.');
const engine=process.argv[2]||'chromium';
const server=http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const url=`http://127.0.0.1:${server.address().port}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let browser;const results=[];
try{
  const device=playwright.devices['iPhone 13'];
  browser=engine==='webkit'?await playwright.webkit.launch():await playwright.chromium.launch({executablePath:process.env.CHROME_PATH||undefined,args:['--no-sandbox']});
  const context=await browser.newContext({...device,serviceWorkers:'block'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.spoken=[];window.menus=0;
    speechSynthesis.speak=u=>{spoken.push(u.text);setTimeout(()=>u.onend?.(),0);};
    localStorage.setItem('nolan-games-v1',JSON.stringify({points:0,narration:true,effects:false,rewards:false,levels:{rollo:2,bex:2}}));
    addEventListener('contextmenu',e=>{if(!e.defaultPrevented)menus++;});
  });
  const cdp=engine==='chromium'?await context.newCDPSession(page):null;
  const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
  const centre=async sel=>{await page.locator(sel).first().evaluate(el=>{const r=el.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)el.scrollIntoView({block:"center",behavior:"instant"});});const b=await page.locator(sel).first().boundingBox();assert(b,`missing ${sel}`);return {x:b.x+b.width/2,y:b.y+b.height/2};};
  // Real touch on Chromium (CDP); WebKit has no touch-move API in Playwright, so it uses a held mouse there.
  async function hold(sel,ms=1200){const p=await centre(sel);if(cdp){await touch('touchStart',p.x,p.y);await sleep(ms);await touch('touchEnd',p.x,p.y);}else{await page.mouse.move(p.x,p.y);await page.mouse.down();await sleep(ms);await page.mouse.up();}}
  async function holdDrag(from,to,ms=1200){const a=await centre(from),b=await centre(to);if(cdp){await touch('touchStart',a.x,a.y);await sleep(ms);for(let i=1;i<=12;i++){await touch('touchMove',a.x+(b.x-a.x)*i/12,a.y+(b.y-a.y)*i/12);await sleep(16);}await touch('touchEnd',b.x,b.y);}else{await page.mouse.move(a.x,a.y);await page.mouse.down();await sleep(ms);await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();}}
  async function tap(sel){if(engine==='webkit'){const p=await centre(sel);await page.touchscreen.tap(p.x,p.y);}else{const p=await centre(sel);await touch('touchStart',p.x,p.y);await touch('touchEnd',p.x,p.y);}await sleep(60);}
  const clean=async label=>{const s=await page.evaluate(()=>({sel:String(getSelection()),collapsed:getSelection().isCollapsed,menus,stuck:[...document.querySelectorAll('#gamesView .dragging,#gamesView [data-drag][style*="translate"]')].length,...(()=>{const cs=getComputedStyle(document.querySelector('#gamesView button,#quizmoView button')||document.body);return {callout:cs.getPropertyValue('-webkit-touch-callout')||cs.webkitTouchCallout||'',us:cs.userSelect||cs.getPropertyValue('-webkit-user-select')};})()}));
    assert.equal(s.sel,'',`${label}: text selected "${s.sel}"`);assert(s.collapsed,`${label}: selection not collapsed`);assert.equal(s.menus,0,`${label}: context menu opened`);assert.equal(s.stuck,0,`${label}: piece left stuck`);
    const guarded=await page.evaluate(()=>{const b=document.querySelector('#gamesView button,#quizmoView button');return ['selectstart','contextmenu','dragstart'].every(t=>{const e=new MouseEvent(t,{bubbles:true,cancelable:true});b.dispatchEvent(e);return e.defaultPrevented;});});
    assert(guarded,`${label}: selectstart/contextmenu/dragstart not blocked`);
    if(s.callout)assert.equal(s.callout,'none',`${label}: touch callout enabled`);assert.equal(s.us,'none',`${label}: user-select enabled`);return s;};
  const zoneText=()=>page.locator('#gamesView [data-slot]').first().innerText();
  await page.goto(url);await tap('#gamesTab');
  for(const id of ['rollo','dax','bex','zumi','otto','kip']){
    await tap(`#gamesView [data-action="open"][data-id="${id}"]`);await page.waitForSelector("#gamesView .journey-piece:not(:disabled)",{timeout:5000}).catch(async e=>{console.log(await page.locator("#gamesView").innerHTML());throw e;});
    // 1) long press then drag onto the drop zone
    let before=await page.evaluate(()=>[document.querySelector('#gamesView .vehicle-board').innerText,spoken.length]);
    await holdDrag('#gamesView .journey-piece:not(:disabled)','#gamesView [data-slot]');await sleep(150);
    let after=await page.evaluate(()=>[document.querySelector('#gamesView .vehicle-board').innerText,spoken.length]);
    assert(after[0]!==before[0]||after[1]>before[1],`${id}: long press + drag did nothing`);await clean(`${id} drag`);
    // 2) long press then release selects the piece (a tap), then tapping the zone places it
    if(!await page.locator('#gamesView .journey-piece:not(:disabled)').count()){results.push(`${id}: drag ok (no pieces left for tap check)`);await tap('#gamesView [data-action="home"]');continue;}
    await hold('#gamesView .journey-piece:not(:disabled)');await sleep(100);
    const pressed=await page.locator('#gamesView .journey-piece[aria-pressed="true"]').count();
    assert.equal(pressed,1,`${id}: long press + release did not count as a tap`);await clean(`${id} hold`);
    before=await page.evaluate(()=>[document.querySelector('#gamesView .vehicle-board').innerText,spoken.length]);
    await tap('#gamesView [data-slot]');await sleep(150);
    after=await page.evaluate(()=>[document.querySelector('#gamesView .vehicle-board').innerText,spoken.length]);
    assert(after[0]!==before[0]||after[1]>before[1],`${id}: tap on zone after held select did nothing`);await clean(`${id} tap`);
    results.push(`${id}: long-press drag ok, long-press tap ok`);
    await tap('#gamesView [data-action="home"]');
  }
  // A cancelled long-press drag (iOS pointercancel) must not leave a piece stuck; the next tap still works.
  if(cdp){await tap('#gamesView [data-action="open"][data-id="rollo"]');const a=await centre('#gamesView .journey-piece:not(:disabled)');await touch('touchStart',a.x,a.y);await sleep(1200);await touch('touchMove',a.x+40,a.y-60);await sleep(30);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await sleep(80);await clean('cancelled drag');
    await hold('#gamesView .journey-piece:not(:disabled)',300);assert.equal(await page.locator('#gamesView .journey-piece[aria-pressed="true"]').count(),1,'tap after cancel ignored');results.push('cancelled long-press drag: piece reset, next tap ok');await tap('#gamesView [data-action="home"]');}
  // Rollo strict: the cargo count goes up from a long-press drag.
  await tap('#gamesView [data-action="open"][data-id="rollo"]');const z0=await zoneText();await holdDrag('#gamesView .journey-piece:not(:disabled)','#gamesView [data-slot]');await sleep(150);const z1=await zoneText();
  assert.notEqual(z1,z0,'rollo: count unchanged after long-press drag');results.push(`rollo strict: "${z0.replace(/\s+/g,' ')}" -> "${z1.replace(/\s+/g,' ')}"`);await clean('rollo strict');
  await tap('#gamesView [data-action="home"]');
  // A tap-choice game: long press then release still answers.
  await tap('#gamesView [data-action="open"][data-id="lulu"]');await page.waitForSelector('#gamesView .game-token');
  if(await page.locator('#gamesView .game-token').count()){const n=await page.evaluate(()=>spoken.length);await hold('#gamesView .game-token');await sleep(150);assert(await page.evaluate(()=>spoken.length)>n,'tap game: long-press release ignored');await clean('tap game');results.push('tap-choice game: long-press tap ok');}
  // Quizmo: long press then release on a choice / keypad key.
  await tap('#gamesView [data-action="home"]');await tap('#quizmoTab');await page.waitForSelector('#quizmoView [data-q-action="open"]');await tap('#quizmoView [data-q-action="open"]');
  await page.waitForSelector('#quizmoView [data-q-action="key"], #quizmoView [data-q-action="choice"]');
  const q0=await page.locator('#quizmoView').innerText();
  await hold('#quizmoView [data-q-action="key"], #quizmoView [data-q-action="choice"]');await sleep(150);
  assert.notEqual(await page.locator('#quizmoView').innerText(),q0,'quizmo: long-press release ignored');await clean('quizmo');results.push('quizmo: long-press tap ok');
  // Reader text stays selectable.
  assert(await page.evaluate(()=>{const e=new Event('selectstart',{bubbles:true,cancelable:true});document.getElementById('readerView').dispatchEvent(e);return !e.defaultPrevented;}),'reader selection blocked');
  const readerSel=await page.evaluate(()=>getComputedStyle(document.querySelector('#readerView, .reader, body')).webkitUserSelect||getComputedStyle(document.body).userSelect);
  assert.notEqual(readerSel,'none','reader text should stay selectable');results.push(`reader user-select: ${readerSel}`);
  assert.deepEqual(errors,[]);
  console.log(`${engine} long-press test passed\n - `+results.join('\n - '));
}finally{await browser?.close();server.close();}
