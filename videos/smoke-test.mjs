import {checkNavigation} from '../ui-smoke-helpers.mjs';
// Run: node videos/smoke-test.mjs. Uses installed Puppeteer or Playwright and Chrome.
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
  const tap=async selector=>{await page.evaluate(selector=>{const b=document.querySelector(selector);if(!b||b.disabled)throw Error('Missing target '+selector);const r=b.getBoundingClientRect();if(r.width<52||r.height<52)throw Error('Small target '+selector);for(const type of ['pointerdown','pointerup'])b.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,pointerType:'touch',isPrimary:true,button:0,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));},selector);};
  const catalog=JSON.parse(await fs.readFile(path.join(root,'videos.json'),'utf8'));
  const ra=catalog.videos.find(video=>video.title==='Ra the Ratata and the Rocky Road');
  assert(ra,'Ra video must exist in videos.json');
  await tap('#videosTab');
  await page.waitForSelector('.video-card');
  assert(await page.evaluate(()=>document.querySelector('#videosView').classList.contains('active')));
  assert.equal(await page.evaluate(()=>document.querySelector('#videosTab').getAttribute('aria-selected')),'true');
  assert.equal(await page.evaluate(()=>document.querySelector('#storiesTab').getAttribute('aria-selected')),'false');
  assert.equal(await page.evaluate(()=>!!document.querySelector('.videos-empty')),false);
  const cardIndex=await page.evaluate(title=>[...document.querySelectorAll('.video-card')].findIndex(card=>card.textContent.includes(title)),ra.title);
  assert(cardIndex>=0,'Real Ra card renders');
  const cardSelector=`.video-card:nth-child(${cardIndex+1})`;
  await page.waitForFunction(selector=>{const img=document.querySelector(selector+' img');return img?.complete&&img.naturalWidth>0;},{},cardSelector);
  for(const viewport of [{width:1366,height:768},{width:1280,height:720},{width:900,height:500}]){
    if(puppeteer)await page.setViewport(viewport);else await page.setViewportSize(viewport);
    await tap(cardSelector);
    await page.waitForFunction(()=>!document.querySelector('.video-player').hidden);
    assert.equal(await page.evaluate(()=>document.querySelector('.video-player video').getAttribute('src')),ra.src);
    const layout=await page.evaluate(selector=>{
      const video=document.querySelector('.video-player video');
      const r=video.getBoundingClientRect();
      const thumbnail=document.querySelector(selector+' img');
      const t=thumbnail.getBoundingClientRect();
      return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,
        viewportWidth:innerWidth,viewportHeight:innerHeight,fit:getComputedStyle(video).objectFit,
        thumbnailFit:getComputedStyle(thumbnail).objectFit,thumbnailRatio:t.width/t.height,
        bodyOverflow:getComputedStyle(document.body).overflow,htmlOverflow:getComputedStyle(document.documentElement).overflow};
    },cardSelector);
    assert(layout.width>0&&layout.height>0);
    assert(layout.x>=0&&layout.y>=0&&layout.right<=layout.viewportWidth&&layout.bottom<=layout.viewportHeight,JSON.stringify(layout));
    assert(Math.abs(layout.width/layout.height-16/9)<0.01,'Player is 16:9');
    assert(layout.height<=viewport.height*0.8,'Player height is at most 80vh');
    assert(Math.abs((layout.x+layout.width/2)-viewport.width/2)<1,'Player is horizontally centered');
    assert.equal(layout.fit,'contain');assert.equal(layout.thumbnailFit,'contain');
    assert(Math.abs(layout.thumbnailRatio-16/9)<0.01,'Thumbnail is 16:9');
    assert.equal(layout.bodyOverflow,'hidden');assert.equal(layout.htmlOverflow,'hidden');
    await tap('[data-video-action="play"]');
    await tap('[data-video-action="pause"]');
    await tap('.video-close');
    assert(await page.evaluate(()=>document.querySelector('.video-player').hidden&&!document.querySelector('.video-player video').hasAttribute('src')&&!document.body.classList.contains('video-open')&&!document.documentElement.classList.contains('video-open')));
    console.log(`PASS Ra card/player: ${viewport.width}x${viewport.height}, contained 16:9 video, thumbnail, scroll lock, touch controls and close`);
  }
  await page.mouse.click(...await page.evaluate(()=>{const r=document.querySelector('#storiesTab').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];}));
  await page.mouse.click(...await page.evaluate(()=>{const r=document.querySelector('#videosTab').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];}));
  assert(await page.evaluate(()=>document.querySelector('#videosView').classList.contains('active')));
  assert.deepEqual(errors,[]);
  console.log('PASS Videos tab: real catalog card, mouse navigation, no browser errors');

}catch(error){console.error(error);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
