import {checkNavigation} from '../ui-smoke-helpers.mjs';
// Run: node quizmo/smoke-test.mjs. Uses installed Puppeteer or Playwright and Chrome.
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
  const page=await browser.newPage();if(puppeteer)await page.setViewport({width:1366,height:768});else await page.setViewportSize({width:1366,height:768});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}`;
  await page.goto(url,{waitUntil:'domcontentloaded'}).catch(async e=>{if(playwright)await page.goto(url,{waitUntil:'domcontentloaded'});else throw e;});
  await checkNavigation(page);
  const tap=async selector=>{await page.evaluate(selector=>{document.querySelector('#quizmoReward [data-dismiss]')?.click();const b=document.querySelector(selector);if(!b||b.disabled)throw Error('Missing target '+selector);const r=b.getBoundingClientRect();if(r.width<56||r.height<56)throw Error('Small target '+selector);for(const type of ['pointerdown','pointerup'])b.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,pointerType:'touch',isPrimary:true,button:0,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));},selector);};
  const sentinel='{"points":137,"levels":{"willa":4}}';
  await page.evaluate(value=>localStorage.setItem('nolan-games-v1',value),sentinel);
  await tap('#quizmoTab');
  assert.equal(await page.$eval('#quizmoTab',e=>e.textContent),"🧮 Quizmo");
  assert.equal(await page.$eval('#storiesTab',e=>e.getAttribute('aria-selected')),'false');
  assert.equal(await page.$$eval('section[aria-label="Math Adventures"] .quizmo-card',els=>els.length),10);
  const ids=await page.$$eval('section[aria-label="Math Adventures"] [data-game]',els=>els.map(e=>e.dataset.game));
  // Exercise every game and level at laptop sizes, including retry hints and
  // maximum operands/lantern sets. Reload afterwards to preserve progression checks.
  for(const viewport of [{width:1280,height:800},{width:1366,height:768},{width:1280,height:720},{width:1280,height:600},{width:1024,height:560},{width:900,height:500}]) {
    if(puppeteer)await page.setViewport(viewport);else await page.setViewportSize(viewport);
    for(let level=1;level<=8;level++) {
      await page.evaluate(({ids,level})=>{
        localStorage.setItem('jasper-quizmo',JSON.stringify({levels:Object.fromEntries(ids.map(id=>[id,level]))}));
      },{ids,level});
      await page.reload({waitUntil:'domcontentloaded'});
      await page.evaluate(()=>{Math.random=()=>0.999999;});
      await tap('#quizmoTab');
      for(const id of ids) {
        await tap(`[data-game="${id}"]`);
        await tap('[data-q-action="check"]');
        const layout=await page.evaluate(()=>{
          const selectors=['.quizmo-game-heading h1','[data-q-action="restart"]','.quizmo-board h2','.quizmo-question>p','.quizmo-inputs','.quizmo-feedback','.quizmo-set','[data-clock]',...Array.from({length:10},(_,n)=>`[data-key="${n}"]`),'[data-key="clear"]','[data-key="erase"]','[data-q-action="check"]'];
          const boxes=selectors.flatMap(selector=>[...document.querySelectorAll('#quizmoView '+selector)].map(el=>{
            const r=el.getBoundingClientRect();
            return {selector,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
          }));
          const board=document.querySelector('.quizmo-board').getBoundingClientRect();
          const question=document.querySelector('.quizmo-question').getBoundingClientRect();
          const pad=document.querySelector('.quizmo-pad').getBoundingClientRect();
          return {sideBySide:question.right<=pad.left && pad.top<question.bottom && pad.bottom>question.top,scroll:document.documentElement.scrollHeight,viewport:innerHeight,boxes,center:board.x+board.width/2,width:innerWidth};
        });
        const label=`${id} level ${level} at ${viewport.width}x${viewport.height}`;
        assert(layout.sideBySide,`${label}: pad must be beside the question`);
        assert(layout.scroll<=viewport.height,`${label}: document scrolls ${JSON.stringify(layout)}`);
        assert(Math.abs(layout.center-viewport.width/2)<1,`${label}: board is centered`);
        for(const b of layout.boxes) {
          assert(b.width>0&&b.height>0&&b.x>=0&&b.y>=0&&b.right<=viewport.width+0.5&&b.bottom<=viewport.height+0.5,`${label}: clipped ${JSON.stringify(b)}`);
          if(b.selector.startsWith('[data-key')||b.selector==='[data-q-action="check"]')assert(b.width>=56&&b.height>=56,`${label}: small touch key ${JSON.stringify(b)}`);
        }
        assert.equal(layout.boxes.filter(b=>b.selector.startsWith('[data-key')).length,12,`${label}: full pad`);
        await tap('[data-q-action="home"]');
      }
    }
    console.log(`PASS Quizmo layout: 10 games × 8 levels at ${viewport.width}x${viewport.height}, retry hints, full touch pad, no scrolling`);
  }
  await page.evaluate(()=>localStorage.removeItem('jasper-quizmo'));
  await page.reload({waitUntil:'domcontentloaded'});
  await tap('#quizmoTab');
  function solve(prompt) {
    const n=prompt.match(/\d+/g).map(Number);
    if(prompt.includes('quotient'))return [Math.floor(n[0]/n[1]),n[0]%n[1]];
    if(prompt.includes('lanterns'))return [n[2]/n[1]];
    if(prompt.includes('bags'))return [n[0]*n[1]-(prompt.includes('gives away')?n[2]:0)];
    if(prompt.includes('minutes until'))return [60-n[1]];
    if(prompt.includes('snack'))return [n[0]-n[1]];
    if(prompt.includes('metres'))return [n[0]*100+n[1]];
    if(prompt.includes('value of'))return [n[0]*(prompt.includes('tens')?10:100)];
    if(prompt.includes(' = ')&&prompt.includes(' + ? + '))return [n[0]-n[1]-n[2]];
    if(prompt.startsWith('? +'))return [n[1]-n[0]];
    if(prompt.includes('× ?'))return [n[1]/n[0]];
    if(prompt.includes(' + '))return [n[0]+n[1]];
    if(prompt.includes(' − '))return [n[0]-n[1]];
    if(prompt.includes(' × '))return [n[0]*n[1]];
    throw Error('Unknown question '+prompt);
  }
  for(const id of ids) {
    for(let level=1;level<=8;level++) {
      await tap(`[data-game="${id}"]`);
      assert.equal(await page.$eval('#quizmoView [data-level]',e=>Number(e.dataset.level)),level);
      if(level===1) {
        await tap('[data-q-action="check"]');
        assert.match(await page.$eval('.quizmo-feedback',e=>e.textContent),/Try again/);
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('jasper-quizmo')||'{"score":0}').score),(ids.indexOf(id)*240));
      }
      for(let q=0;q<3;q++) {
        const prompt=await page.$eval('#quizmoView h2',e=>e.textContent);
        const answers=solve(prompt);
        for(let i=0;i<answers.length;i++) {
          await tap(`[data-field="${i}"]`);
          for(const digit of String(answers[i]))await tap(`[data-key="${digit}"]`);
        }
        await tap('[data-q-action="check"]');
      }
      assert.match(await page.$eval('#quizmoView h1',e=>e.textContent),/Level complete/);
      const progress=await page.evaluate(()=>JSON.parse(localStorage.getItem('jasper-quizmo')));
      assert.equal(progress.levels[id],Math.min(8,level+1));
      assert.equal(progress.stars[id],level);
      await tap('[data-q-action="home"]');
    }
  }
  // A real mouse tap also opens a game; a cancelled touch does not enter digits.
  await page.evaluate(()=>document.querySelector('#quizmoReward [data-dismiss]')?.click());
  await page.click('[data-game="addition"]');
  await page.evaluate(()=>{const b=document.querySelector('[data-key="9"]');for(const type of ['pointerdown','pointercancel','pointerup'])b.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,pointerType:'touch',isPrimary:true,button:0}));});
  assert.equal(await page.$eval('[data-input="0"]',e=>e.textContent),'?');
  await tap('[data-key="1"]');await tap('[data-key="erase"]');
  assert.equal(await page.$eval('[data-input="0"]',e=>e.textContent),'?');
  await tap('[data-q-action="home"]');
  await tap('[data-game="speed"]');
  await page.evaluate(()=>{const now=Date.now();Date.now=()=>now+180000;});
  await page.waitForFunction(()=>document.querySelector('#quizmoView h1').textContent.includes('Lovely practice'));
  await tap('#storiesTab');
  assert.equal(await page.$eval('#quizmoTab',e=>e.getAttribute('aria-selected')),'false');
  await tap('#quizmoTab');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('jasper-quizmo')).score),2400);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nolan-games-v1')),sentinel);
  await page.reload({waitUntil:'domcontentloaded'});
  await tap('#quizmoTab');
  await tap('[data-game="addition"]');
  assert.equal(await page.$eval('[data-level]',e=>Number(e.dataset.level)),8);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nolan-games-v1')),sentinel);
  // Restart after answering Q1: retain the active level, stars and earned points.
  const prompt=await page.$eval('#quizmoView h2',e=>e.textContent);
  for(const digit of String(solve(prompt)[0]))await tap(`[data-key="${digit}"]`);
  await tap('[data-q-action="check"]');
  assert.match(await page.$eval('.quizmo-game-heading p',e=>e.textContent),/Question 2/);
  const beforeRestart=await page.evaluate(()=>localStorage.getItem('jasper-quizmo'));
  await tap('[data-q-action="restart"]');
  assert.match(await page.$eval('.quizmo-game-heading p',e=>e.textContent),/Level 8.*Question 1/);
  assert.equal(await page.$eval('[data-input="0"]',e=>e.textContent),'?');
  assert.equal(await page.evaluate(()=>localStorage.getItem('jasper-quizmo')),beforeRestart);
  console.log('PASS math Restart level: Q2 → Q1, input cleared, stars/levels/points preserved');
  assert.deepEqual(errors,[]);
  console.log('PASS Quizmo: 10 games × 8 levels, 240 pointer-pad answers, hints, progression, timer, mouse, cancellation and isolated storage');
}catch(error){console.error(error);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
