// Run: node quizmo/smoke-test.mjs. Uses installed Puppeteer or Playwright and Chrome.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Validate every authored item before starting a browser.
const context={window:{}};
vm.runInNewContext(await fs.readFile(path.join(root,'quizmo/cogat.js'),'utf8'),context);
for(const [id] of context.window.QuizmoCogat.games)for(let level=1;level<=8;level++)for(let q=0;q<3;q++){
  const task=context.window.QuizmoCogat.question(id,level,q);
  assert.equal(new Set(task.choices).size,task.choices.length,`${id} L${level}: unique choices`);
  assert(task.prompt&&task.hint&&task.correct>=0&&task.correct<task.choices.length);
  if(id==='series') {
    const expected=[10+q,22+q,18+3*q,32+16*q,16+6*q,6+4*q,16+5*q,47+16*q][level-1];
    assert.equal(task.choices[task.correct],expected,`series L${level} Q${q+1}`);
  }
}
console.log('PASS static: 120 items, unique options, hints and independently checked series answers');
let puppeteer,playwright;
for(const name of ['puppeteer','puppeteer-core','/tmp/shot/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js']){
  try{puppeteer=(await import(name)).default;break;}catch{}
}
if(!puppeteer){for(const name of ['playwright','/usr/local/lib/pnpm/5/node_modules/playwright-core/index.mjs'])try{playwright=await import(name);break;}catch{}}
assert(puppeteer||playwright,'Install puppeteer or playwright to run the browser smoke test.');
const server=http.createServer(async(req,res)=>{
  try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep))throw Error();const data=await fs.readFile(file);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(data);}catch{res.writeHead(404);res.end();}
});
let url;
try {
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  url=`http://127.0.0.1:${server.address().port}`;
} catch(error) {
  if(error.code!=='EPERM')throw error;
  console.log('Server listen blocked (EPERM); using file:// fallback');
  url=new URL('../index.html',import.meta.url).href;
}
let browser;
try {
  const opts={headless:true,executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--allow-file-access-from-files']};
  browser=puppeteer?await puppeteer.launch(opts):await playwright.chromium.launch(opts);
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const viewport=async size=>puppeteer?page.setViewport(size):page.setViewportSize(size);
  const tap=async selector=>page.evaluate(selector=>{
    const b=document.querySelector(selector);if(!b)throw Error('Missing '+selector);
    b.scrollIntoView({block:'nearest'});const r=b.getBoundingClientRect();
    if(r.width<56||r.height<56)throw Error('Small tap target '+selector);
    const x=r.x+r.width/2,y=r.y+r.height/2;
    if(document.elementFromPoint(x,y)?.closest('button')!==b)throw Error('Obscured '+selector);
    for(const type of ['pointerdown','pointerup'])b.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:7,pointerType:'touch',isPrimary:true,button:0,clientX:x,clientY:y}));
  },selector);
  await viewport({width:1366,height:768});await page.goto(url,{waitUntil:'domcontentloaded'});
  const math={addition:4,subtraction:5,times:3,division:2,place:8,fractions:6,words:7,missing:2,measure:3,speed:4};
  const stars=Object.fromEntries(Object.entries(math).map(([id,n])=>[id,n-1]));
  for(const size of [{width:1366,height:768},{width:1280,height:800},{width:1280,height:720},{width:1280,height:600},{width:1024,height:560},{width:900,height:500}]) {
    await viewport(size);
    await page.evaluate(({math,stars})=>localStorage.setItem('jasper-quizmo',JSON.stringify({score:137,levels:math,stars})),{math,stars});
    await page.reload({waitUntil:'domcontentloaded'});await tap('#quizmoTab');
    assert.equal(await page.$$eval('section[aria-label="Math Adventures"] [data-game]',e=>e.length),10);
    const ids=await page.$$eval('section[aria-label="CogAT Practice"] [data-game]',e=>e.map(x=>x.dataset.game));assert.equal(ids.length,5);
    for(const id of ids)for(let level=1;level<=8;level++) {
      await tap(`[data-game="${id}"]`);
      assert.equal(await page.$eval('[data-level]',e=>Number(e.dataset.level)),level);
      for(let q=0;q<3;q++) {
        const length=await page.$$eval('[data-choice]',e=>e.length);assert(length>=3&&length<=4);
        const correct=(level+q)%length;
        const before=await page.evaluate(()=>localStorage.getItem('jasper-quizmo'));
        await tap(`[data-choice="${(correct+1)%length}"]`);
        assert.match(await page.$eval('.quizmo-feedback',e=>e.textContent),/Nearly there.*Try again/);
        assert.equal(await page.evaluate(()=>localStorage.getItem('jasper-quizmo')),before);
        const fit=await page.evaluate(()=>{
          const question=document.querySelector('.quizmo-question').getBoundingClientRect(),choices=document.querySelector('.cogat-choices').getBoundingClientRect();
          return {scroll:document.documentElement.scrollHeight,height:innerHeight,width:innerWidth,side:question.right<=choices.left,boxes:[...document.querySelectorAll('.quizmo-question h1,.quizmo-question h2,.quizmo-question p,.cogat-matrix,.cogat-fold,[data-choice]')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};})};
        });
        const label=`${id} L${level} Q${q+1} ${size.width}x${size.height}`;
        assert(fit.side,label+' two columns');assert(fit.scroll<=fit.height,label+' scroll '+JSON.stringify(fit));
        for(const b of fit.boxes)assert(b.x>=0&&b.y>=0&&b.right<=fit.width+1&&b.bottom<=fit.height+1,label+' clipped '+JSON.stringify(b));
        await tap(`[data-choice="${correct}"]`);
      }
      assert.match(await page.$eval('#quizmoView h1',e=>e.textContent),/Level complete/);
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('jasper-quizmo')));
      assert.equal(saved.levels[id],Math.min(8,level+1));assert.equal(saved.stars[id],level);
      for(const key of Object.keys(math)){assert.equal(saved.levels[key],math[key]);assert.equal(saved.stars[key],stars[key]);}
      await tap('[data-q-action="home"]');
    }
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('jasper-quizmo')).score),1337);
    await page.reload({waitUntil:'domcontentloaded'});await tap('#quizmoTab');
    await tap('[data-game="figures"]');assert.equal(await page.$eval('[data-level]',e=>e.dataset.level),'8');
    await tap('[data-q-action="home"]');
    // Confirm old math game remains playable with its original saved level.
    await page.click('[data-game="addition"]');assert.equal(await page.$eval('[data-level]',e=>e.dataset.level),'4');
    console.log(`PASS ${size.width}x${size.height}: 5 games × 8 levels × 3 correct taps and retries, fit, storage, math preservation, reload, mouse`);
  }
  assert.deepEqual(errors,[]);
} catch(error) {console.error(error);process.exitCode=1;}
finally {await browser?.close();if(server.listening){server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}}
