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
  const page=await browser.newPage();if(puppeteer)await page.setViewport({width:1200,height:1200});else await page.setViewportSize({width:1200,height:1200});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${server.address().port}`;
  await page.goto(url,{waitUntil:'domcontentloaded'}).catch(async e=>{if(playwright)await page.goto(url,{waitUntil:'domcontentloaded'});else throw e;});
  const tap=async selector=>{await page.evaluate(selector=>{const b=document.querySelector(selector);if(!b||b.disabled)throw Error('Missing target '+selector);const r=b.getBoundingClientRect();if(r.width<88||r.height<88)throw Error('Small target '+selector);for(const type of ['pointerdown','pointerup'])b.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,pointerType:'touch',isPrimary:true,button:0,clientX:r.x+r.width/2,clientY:r.y+r.height/2}));},selector);};
  await tap('#videosTab');
  await page.waitForFunction(()=>document.querySelector('#videosView h1')?.textContent==='Videos coming soon');
  assert(await page.evaluate(()=>document.querySelector('#videosView').classList.contains('active')));
  assert.equal(await page.evaluate(()=>document.querySelector('#videosTab').getAttribute('aria-selected')),'true');
  assert.equal(await page.evaluate(()=>document.querySelector('#storiesTab').getAttribute('aria-selected')),'false');
  assert(await page.evaluate(()=>document.querySelector('.videos-friend').getBoundingClientRect().height>80));
  await page.mouse.click(...await page.evaluate(()=>{const r=document.querySelector('#storiesTab').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];}));
  await page.mouse.click(...await page.evaluate(()=>{const r=document.querySelector('#videosTab').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2];}));
  assert(await page.evaluate(()=>document.querySelector('#videosView').classList.contains('active')));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    const original=window.fetch;
    window.fetch=(url,...args)=>url==='videos.json'?Promise.resolve(new Response(JSON.stringify({videos:[{id:'test',title:'Cozy Test',src:'videos/test.mp4',thumbnail:'assets/icons/icon-192.png'}]}),{status:200})):original(url,...args);
  });
  await tap('#videosTab');
  await page.waitForSelector('.video-card');
  await tap('.video-card');
  assert(await page.evaluate(()=>!document.querySelector('.video-player').hidden));
  await tap('[data-video-action="pause"]');
  await tap('.video-close');
  assert(await page.evaluate(()=>document.querySelector('.video-player').hidden&&!document.querySelector('.video-player video').hasAttribute('src')));
  assert.deepEqual(errors,[]);
  console.log('PASS Videos tab: touch, mouse, visual empty state, fixture card/player/close, no browser errors');

}catch(error){console.error(error);process.exitCode=1;}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
