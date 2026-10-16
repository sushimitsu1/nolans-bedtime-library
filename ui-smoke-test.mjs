import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import puppeteer from '/tmp/shot/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
import {checkNavigation} from './ui-smoke-helpers.mjs';
const root=path.dirname(new URL(import.meta.url).pathname);
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+'/'))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}`);await checkNavigation(page);
 assert.equal(await page.$$eval('.story-card',es=>es.length),100);
 assert.equal(await page.$eval('.story-grid',e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),4);
 assert(await page.$eval('#keepReading',e=>e.hidden),'No progress hides Keep reading');
 await page.click('.read-button');assert.match(await page.$eval('#pageCounter',e=>e.textContent),/Cover/);await page.click('#nextButton');await page.waitForFunction(()=>{const i=document.getElementById('pageImage');return i.complete&&i.naturalWidth>0;});
 const id=await page.evaluate(()=>localStorage.getItem('nolan:lastStory'));
 await page.click('#backButton');assert(!(await page.$eval('#keepReading',e=>e.hidden)));await page.click('#keepReading button');assert.match(await page.$eval('#pageCounter',e=>e.textContent),/1/);
 for(const size of [{width:1366,height:768},{width:1280,height:720},{width:900,height:500}]){
  await page.setViewport(size);
  for(const n of [0,14]){
   await page.evaluate(({id,n})=>{localStorage.setItem(`progress:${id}`,n);openStory(id);},{id,n});
   await page.waitForFunction(()=>{const i=document.getElementById('pageImage');return i.complete&&i.naturalWidth>0;});
   const fit=await page.evaluate(()=>['#pageImage','#backButton','#nextButton','#readPageButton'].map(s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {s,x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height};}));
   for(const r of fit)assert(r.x>=0&&r.y>=0&&r.right<=size.width+1&&r.bottom<=size.height+1,`Reader P${n+1} ${JSON.stringify(size)} ${JSON.stringify(r)}`);
  }
 }
 await page.setViewport({width:1366,height:768});await page.click('#backButton');await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{})));});
 await fs.mkdir('/workspace/ui-audit',{recursive:true});
 const shot=async n=>{await new Promise(r=>setTimeout(r,150));await page.screenshot({path:`/workspace/ui-audit/live-${n}.png`});};
 await shot('stories');await page.click('#keepReading button');await shot('reader');await page.click('#backButton');await page.click('#gamesTab');await shot('games');await page.click('.game-card');await shot('nolan-game');await page.click('[data-action="home"]');await page.click('#videosTab');await page.waitForSelector('.video-card');await shot('videos');await page.click('#quizmoTab');await shot('quizmo-math');await page.click('[data-q-action="cogat"]');await shot('quizmo-cogat');await page.click('[data-q-action="math"]');await page.click('[data-game="addition"]');await shot('quizmo-game');await page.setViewport({width:900,height:500});await shot('quizmo-game-900');
 for(const size of [{width:390,height:844},{width:375,height:667},{width:844,height:390}]){
  await page.setViewport(size);
  await page.click('[data-q-action="home"]');await page.click('#storiesTab');
  const suffix=`${size.width}x${size.height}`;
  const mobileShot=async name=>{await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().top<innerHeight).map(i=>i.decode().catch(()=>{})));});await page.screenshot({path:`/workspace/ui-audit/mobile-${name}-${suffix}.png`});};
  const noOverflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${suffix}`);
  const visible=async selector=>assert(await page.$eval(selector,e=>{const r=e.getBoundingClientRect();const bar=document.querySelector('.mobile-tabs').getBoundingClientRect();return r.width>0&&r.height>0&&r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=bar.top+1;}),`Clipped ${selector} ${suffix}`);
  assert(await page.$eval('.side-menu',e=>getComputedStyle(e).display==='none'));
  assert(await page.$eval('.mobile-tabs',e=>getComputedStyle(e).display!=='none'));
  if(size.width<=700)assert.equal(await page.$eval('.story-grid',e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),2);
  await noOverflow();await mobileShot('stories');
  await page.click('#settingsButton');assert(await page.$eval('#settingsPanel',e=>!e.hidden));await page.waitForSelector('#fullscreenButton');await page.click('#closeSettingsButton');
  await page.click('.read-button');
  for(const n of [0,14]){await page.evaluate(({id,n})=>{localStorage.setItem(`progress:${id}`,n);openStory(id);},{id,n});await page.waitForFunction(()=>{const i=document.getElementById('pageImage');return i.complete&&i.naturalWidth>0;});for(const sel of ['#pageImage','#backButton','#nextButton','#readPageButton'])await visible(sel);await noOverflow();}
  await mobileShot('reader');await page.click('#storiesTab');await page.click('#gamesTab');await noOverflow();if(size.width===390)await mobileShot('games');
  await page.click('.game-card');await noOverflow();await visible('.game-tools button');await page.click('[data-action="home"]');
  await page.click('#videosTab');await page.waitForSelector('.video-card');await noOverflow();if(size.width===390)await mobileShot('videos');
  await page.click('#quizmoTab');await noOverflow();if(size.width===390)await mobileShot('quizmo-hub');
  await page.click('[data-game="addition"]');await noOverflow();await visible('.quizmo-pad');await visible('.quizmo-check');await visible('.restart-level');assert(await page.$eval('.restart-level',e=>e.getBoundingClientRect().height>=52));await mobileShot('quizmo-game');
  await page.click('[data-q-action="home"]');
  for(const game of await page.$$eval('section[aria-label="Math Adventures"] [data-game]',es=>es.map(e=>e.dataset.game))){await page.click(`[data-game="${game}"]`);await noOverflow();await visible('.quizmo-pad');await visible('.quizmo-check');await visible('.restart-level');await page.click('[data-q-action="home"]');}
  await page.click('[data-q-action="cogat"]');
  for(const game of await page.$$eval('section[aria-label="CogAT Practice"] [data-game]',es=>es.map(e=>e.dataset.game))){await page.click(`[data-game="${game}"]`);await noOverflow();await visible('.cogat-choices');await visible('.restart-level');await page.click('[data-q-action="home"]');}
  await page.click('[data-q-action="math"]');await page.click('[data-game="addition"]');
 }
 assert.deepEqual(errors,[]);
 console.log('PASS UI: three landscape sizes, grouped navigation, 100 real stories, Keep reading, cover/Page 1/Page 15, focus mode, mobile portrait/landscape math + CogAT, mobile screenshots');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
