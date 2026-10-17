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
  const current=()=>page.evaluate(()=>window.JasperQuizmo.current());
  const retry=async()=>{const t=await current();await tap(t.choices?`[data-choice="${(t.correct+1)%t.choices.length}"]`:'[data-q-action="check"]');};
  const answer=async()=>{const t=await current();if(t.choices)return tap(`[data-choice="${t.correct}"]`);for(let i=0;i<t.answers.length;i++){await tap(`[data-field="${i}"]`);for(const d of String(t.answers[i]))await tap(`[data-key="${d}"]`);}await tap('[data-q-action="check"]');};
  const sentinel='{"points":137,"levels":{"lulu":4}}';
  await page.evaluate(value=>localStorage.setItem('nolan-games-v1',value),sentinel);
  await tap('#quizmoTab');
  assert.equal(await page.$eval('#quizmoTab',e=>e.textContent),"🧮 Quizmo");
  assert.equal(await page.$eval('#storiesTab',e=>e.getAttribute('aria-selected')),'false');
  assert.equal(await page.$$eval('section[aria-label="Math Adventures"] .quizmo-card',els=>els.length),10);
  const ids=await page.$$eval('section[aria-label="Math Adventures"] [data-game]',els=>els.map(e=>e.dataset.game));
  // Exercise every game and level at laptop sizes, including retry hints and
  // maximum operands/lantern sets. Reload afterwards to preserve progression checks.
  for(const viewport of [{width:1280,height:800},{width:1366,height:768},{width:1280,height:720},{width:1280,height:600},{width:1024,height:560},{width:900,height:500},{width:844,height:390}]) {
    if(puppeteer)await page.setViewport(viewport);else await page.setViewportSize(viewport);
    for(let level=1;level<=8;level++) {
      await page.evaluate(({ids,level})=>{
        localStorage.setItem('jasper-quizmo',JSON.stringify({levels:Object.fromEntries(ids.map(id=>[id,level]))}));
      },{ids,level});
      await page.reload({waitUntil:'domcontentloaded'});

      await tap('#quizmoTab');
      for(const id of ids) {
        await tap(`[data-game="${id}"]`);
        await retry();
        const layout=await page.evaluate(()=>{
          const selectors=['.quizmo-game-heading h1','[data-q-action="restart"]','.quizmo-board h2','.quizmo-question>p','.quizmo-inputs','.quizmo-feedback','.quizmo-illustration','[data-clock]',...Array.from({length:10},(_,n)=>`[data-key="${n}"]`),'[data-key="clear"]','[data-key="erase"]','[data-q-action="check"]','[data-choice]'];
          const boxes=selectors.flatMap(selector=>[...document.querySelectorAll('#quizmoView '+selector)].map(el=>{
            const r=el.getBoundingClientRect();
            return {selector,x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
          }));
          const board=document.querySelector('.quizmo-board').getBoundingClientRect();
          const question=document.querySelector('.quizmo-question').getBoundingClientRect();
          const pad=document.querySelector('.quizmo-pad,.cogat-choices').getBoundingClientRect();
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
        assert.equal(layout.boxes.filter(b=>b.selector.startsWith('[data-key')).length,(await current()).choices?0:12,`${label}: correct answer controls`);
        await tap('[data-q-action="home"]');
      }
    }
    console.log(`PASS Quizmo layout: 10 games × 8 levels at ${viewport.width}x${viewport.height}, retry hints, full touch pad, no scrolling`);
  }
  // The question shows one ungrouped set; a wrong try may reveal equal groups.
  await page.evaluate(()=>localStorage.setItem('jasper-quizmo',JSON.stringify({levels:{fractions:5}})));
  await page.reload({waitUntil:'domcontentloaded'});await tap('#quizmoTab');
  await page.evaluate(()=>{const G=window.JasperQuizmoGen,original=G.level;G.level=(id,l,recent)=>id==='fractions'?Array.from({length:5},()=>G.question(id,l,{mode:'quantity'})):original(id,l,recent);});
  await tap('[data-game="fractions"]');
  assert.equal(await page.$$eval('.quizmo-visual [data-groups]',es=>es.length),0);
  await retry();assert((await page.$$eval('.quizmo-visual [data-groups]',es=>es.length))>0);
  for(const viewport of [{width:1366,height:768},{width:900,height:500},{width:844,height:390},{width:390,height:844},{width:375,height:667}]){
    if(puppeteer)await page.setViewport(viewport);else await page.setViewportSize(viewport);
    for(const [den,total] of [[3,12],[4,16],[6,18],[8,24]]){
      const geometry=await page.evaluate(({den,total})=>{
        document.querySelector('.quizmo-question h2').textContent=`What is 3/${den} of ${total} lanterns?`;
        document.querySelector('.quizmo-visual').innerHTML=window.QuizmoVisuals.fractions({mode:'quantity',d:den,total});window.JasperQuizmo.layout();
        const items=[...document.querySelectorAll('.quizmo-visual .quizmo-lantern')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0),errors=[];
        for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j];if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>.1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>.1)errors.push('Touching lanterns');}
        return {count:items.length,errors,minWidth:Math.min(...items.map(r=>r.width)),groups:document.querySelectorAll('.quizmo-visual [data-groups]').length};
      },{den,total});
      assert.deepEqual(geometry.errors,[]);assert.equal(geometry.count,total);assert.equal(geometry.groups,0);
      if(viewport.width===390)assert(geometry.minWidth>=15,`Countable phone lanterns: ${geometry.minWidth}`);
    }
  }
  await tap('[data-q-action="home"]');
  console.log('PASS lanterns: 12–24 ungrouped lanterns, no overlaps, countable phone art and grouped hint only after retry');
  // Long questions and full hints also fit the stacked phone layout without panel overlap.
  for(const viewport of [{width:390,height:844},{width:375,height:667}]){
    if(puppeteer)await page.setViewport(viewport);else await page.setViewportSize(viewport);
    for(let level=1;level<=8;level++){
      await page.evaluate(({ids,level})=>localStorage.setItem('jasper-quizmo',JSON.stringify({levels:Object.fromEntries(ids.map(id=>[id,level]))})),{ids,level});
      await page.reload({waitUntil:'domcontentloaded'});await tap('#quizmoTab');
      for(const id of ids){
        await tap(`[data-game="${id}"]`);await retry();
        const fit=await page.evaluate(()=>{
          const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
          return {question:box('.quizmo-question'),controls:box('.quizmo-controls,.cogat-choices'),bar:box('.mobile-tabs'),parts:['.quizmo-question h2','.quizmo-feedback',...(document.querySelector('.quizmo-inputs')?['.quizmo-inputs']:[])].map(box),width:document.documentElement.scrollWidth,scroll:document.documentElement.scrollHeight};
        });
        const label=`${id} L${level} phone ${viewport.width}x${viewport.height}`;
        assert(fit.width<=viewport.width,label+' horizontal overflow');
        assert(fit.question.bottom<=fit.controls.y,label+' overlapping panels');
        if(viewport.width===390){assert(fit.scroll<=viewport.height,label+' scroll '+JSON.stringify(fit));assert(fit.controls.bottom<=fit.bar.y,label+' answer hidden under tabs');}
        else await page.evaluate(()=>{document.querySelector('.quizmo-controls,.cogat-choices').scrollIntoView({block:'end'});window.scrollBy(0,document.querySelector('.mobile-tabs').getBoundingClientRect().height+8);});
        const usable=await page.evaluate(()=>{
          const top=document.querySelector('.quizmo-tools').getBoundingClientRect().bottom,bottom=document.querySelector('.mobile-tabs').getBoundingClientRect().top;
          return [...document.querySelectorAll('.quizmo-pad button,.quizmo-check,[data-choice]')].every(e=>{const r=e.getBoundingClientRect();return r.width>=56&&r.height>=56&&r.left>=0&&r.right<=innerWidth&&r.top>=top&&r.bottom<=bottom&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('button')===e;});
        });
        assert(usable,label+' controls cannot be reached');
        const t=await current();
        if(!t.choices){
          for(const digit of String(t.answers[0]))await tap(`[data-key="${digit}"]`);
          assert.equal(await page.$eval('[data-input="0"]',e=>e.textContent),String(t.answers[0]));await tap('[data-key="clear"]');
        }
        const readable=await page.$$eval('.quizmo-illustration text',es=>es.filter(e=>e.getBoundingClientRect().width>0).every(e=>parseFloat(getComputedStyle(e).fontSize)*e.ownerSVGElement.getScreenCTM().a>=10.95));
        assert(readable,label+' SVG label below 11px');
        for(const part of fit.parts)assert(part.y>=fit.question.y&&part.bottom<=fit.question.bottom+1,label+' clipped question '+JSON.stringify(fit));
        await tap('[data-q-action="home"]');
      }
    }
    console.log(`PASS phone: 10 games × 8 levels at ${viewport.width}x${viewport.height}, complete hints, no panel overlap, 56px controls, no scrolling at 390×844, 11px SVG labels`);
  }
  // Force the alternative controls too: opening-format checks must not hide choice regressions.
  for(const viewport of [{width:1366,height:768},{width:844,height:390},{width:390,height:844},{width:375,height:667}]){
    if(puppeteer)await page.setViewport(viewport);else await page.setViewportSize(viewport);
    await page.evaluate(()=>{const G=window.JasperQuizmoGen;window.quizmoOriginalLevel=G.level;G.level=(id,l,recent)=>window.quizmoFixture?[window.quizmoFixture,...window.quizmoOriginalLevel(id,l,recent).slice(1)]:window.quizmoOriginalLevel(id,l,recent);});
    for(const [id,level,mode] of [['addition',3,'pair'],['addition',5,'estimate'],['place',8,'compare'],['fractions',3,'shaded'],['fractions',8,'compare']]){
      await page.evaluate(({id,level,mode})=>window.quizmoFixture=window.JasperQuizmoGen.question(id,level,{mode}),{id,level,mode});
      await tap(`[data-game="${id}"]`);
      const t=await current();assert(t.choices&&Number.isInteger(t.correct));assert.equal(await page.$('.quizmo-pad'),null);
      const before=await page.evaluate(()=>localStorage.getItem('jasper-quizmo'));await retry();
      assert.equal(await page.evaluate(()=>localStorage.getItem('jasper-quizmo')),before,'Wrong math choice must not earn points');
      const fit=await page.evaluate(()=>{const bar=document.querySelector('.mobile-tabs'),bottom=getComputedStyle(bar).display==='none'?innerHeight:bar.getBoundingClientRect().top;return {scroll:document.documentElement.scrollHeight,bottom,boxes:[...document.querySelectorAll('.quizmo-question h2,.quizmo-feedback,[data-choice]')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,button:e.tagName==='BUTTON'};})};});
      assert(fit.scroll<=viewport.height,`${id} ${mode}: choice page scrolls at ${viewport.width}`);
      for(const b of fit.boxes){assert(b.x>=0&&b.y>=0&&b.right<=viewport.width+1&&b.bottom<=fit.bottom+1);if(b.button)assert(b.w>=56&&b.h>=56);}
      await answer();assert.equal((await current()).slot,1,'Correct math choice advances one slot');await tap('[data-q-action="home"]');
    }
    for(const [level,mode,count] of [[3,'sharing',1],[8,'remainder',2]]){
      await page.evaluate(({level,mode})=>window.quizmoFixture=window.JasperQuizmoGen.question('division',level,{mode}),{level,mode});await tap('[data-game="division"]');
      assert.equal(await page.$$eval('[data-field]',es=>es.length),count);assert.equal((await page.$eval('.quizmo-inputs',e=>e.textContent)).includes('Remainder'),count===2);await tap('[data-q-action="home"]');
    }
    await page.evaluate(()=>{window.JasperQuizmoGen.level=window.quizmoOriginalLevel;delete window.quizmoFixture;});
  }
  console.log('PASS math choices: comparisons, pair sums, estimates and fractions; correct hook, wrong-answer points, single advancement, four viewports and conditional remainder fields');
  if(puppeteer)await page.setViewport({width:1366,height:768});else await page.setViewportSize({width:1366,height:768});
  await page.evaluate(()=>localStorage.removeItem('jasper-quizmo'));
  await page.reload({waitUntil:'domcontentloaded'});
  await tap('#quizmoTab');
  for(const id of ids) {
    for(let level=1;level<=8;level++) {
      await tap(`[data-game="${id}"]`);
      assert.equal(await page.$eval('#quizmoView [data-level]',e=>Number(e.dataset.level)),level);
      if(level===1) {
        await retry();
        assert.match(await page.$eval('.quizmo-feedback',e=>e.textContent),/Try again/);
        assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('jasper-quizmo')||'{"score":0}').score),(ids.indexOf(id)*400));
      }
      for(let q=0;q<5;q++) {
        await answer();
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
  await page.evaluate(()=>{const G=window.JasperQuizmoGen,original=G.level;G.level=(id,l,recent)=>id==='addition'?Array.from({length:5},()=>G.question(id,l,{mode:'sum'})):original(id,l,recent);});
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
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('jasper-quizmo')).score),4000);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nolan-games-v1')),sentinel);
  await page.reload({waitUntil:'domcontentloaded'});
  await tap('#quizmoTab');
  await tap('[data-game="addition"]');
  assert.equal(await page.$eval('[data-level]',e=>Number(e.dataset.level)),8);
  assert.equal(await page.evaluate(()=>localStorage.getItem('nolan-games-v1')),sentinel);
  // Restart after answering Q1: retain the active level, stars and earned points.
  await answer();
  assert.match(await page.$eval('.quizmo-game-heading p',e=>e.textContent),/Question 2/);
  const beforeRestart=await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('jasper-quizmo'));delete p.recent;return p;});
  const oldSig=await page.evaluate(()=>window.JasperQuizmo.current().sig);
  await tap('[data-q-action="restart"]');
  assert.match(await page.$eval('.quizmo-game-heading p',e=>e.textContent),/Level 8.*Question 1/);
  if(!(await current()).choices)assert.equal(await page.$eval('[data-input="0"]',e=>e.textContent),'?');
  assert.deepEqual(await page.evaluate(()=>{const p=JSON.parse(localStorage.getItem('jasper-quizmo'));delete p.recent;return p;}),beforeRestart);
  assert.notEqual(await page.evaluate(()=>window.JasperQuizmo.current().sig),oldSig);
  console.log('PASS math Restart level: Q2 → Q1, input cleared, stars/levels/points preserved');
  assert.deepEqual(errors,[]);
  console.log('PASS Quizmo: 10 games × 8 levels, 400 pad/choice answers, hints, progression, timer, mouse, cancellation and isolated storage');
}catch(error){console.error(error);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
