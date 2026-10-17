// Pre-made narration audio: Tundra plays MP3s (pause/resume, page turns with read-along, stop, volume),
// a story without audio and a missing MP3 both fall back to the browser voice.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import puppeteer from '/tmp/shot/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
const root=path.dirname(new URL(import.meta.url).pathname);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg'};
const requests=[];
const server=http.createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;requests.push(name);if(name.endsWith('/p3.mp3'))throw Error('simulated missing page');const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+'/'))throw Error();res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
const TUNDRA='tundra-the-snowcat-grooms-the-starry-slope';
try{
 browser=await puppeteer.launch({headless:true,executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--mute-audio']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:1366,height:768});
 await page.evaluateOnNewDocument(()=>{window.__spoken=[];const real=window.speechSynthesis;if(real){real.speak=u=>window.__spoken.push(u.text);}});
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.waitForFunction(()=>narrationAudioManifest!==null);
 const state=()=>page.$eval('#narrationStatus',e=>e.textContent);
 const audio=()=>page.evaluate(()=>({src:narrationAudioElement.src,paused:narrationAudioElement.paused,volume:narrationAudioElement.volume,time:narrationAudioElement.currentTime}));
 const open=async(id,n)=>{await page.evaluate(({id,n})=>{localStorage.setItem(`progress:${id}`,n);openStory(id);},{id,n});await page.waitForFunction(()=>{const i=document.getElementById('pageImage');return i.complete&&i.naturalWidth>0;});};

 await open(TUNDRA,0);
 await page.evaluate(()=>{narrationSettings.volume=.6;});
 await page.click('#readPageButton');
 await page.waitForFunction(()=>narrationAudioActive && !narrationAudioElement.paused && narrationAudioElement.currentTime>0);
 let a=await audio();assert.match(a.src,/^blob:/);assert.equal(a.volume,.6);assert.equal(await state(),'Reading');
 assert(requests.includes(`/assets/narration/${TUNDRA}/p1.mp3`));assert(requests.includes(`/assets/narration/${TUNDRA}/p2.mp3`),'next page preloaded');
 await page.click('#pauseNarrationButton');assert.equal(await state(),'Paused');assert((await audio()).paused);
 await page.click('#pauseNarrationButton');await page.waitForFunction(()=>!narrationAudioElement.paused);assert.equal(await state(),'Reading');
 const firstSrc=(await audio()).src;
 await page.click('#nextButton');
 await page.waitForFunction(first=>narrationAudioActive && narrationAudioElement.src!==first && !narrationAudioElement.paused,{},firstSrc);
 assert.equal(await page.$eval('#pageCounter',e=>e.textContent),'Page 2 of 15');
 await page.waitForFunction(()=>!narrationAudioActive && document.getElementById('narrationStatus').textContent==='Ready',{timeout:15000});
 assert.deepEqual(await page.evaluate(()=>window.__spoken),[],'browser voice unused while audio exists');

 // Page 3's MP3 is missing on the server: read-along falls back to the browser voice for that page only.
 await page.click('#nextButton');
 await page.waitForFunction(()=>window.__spoken.length>0 || document.getElementById('narrationStatus').textContent==='No narrator voices available',{timeout:8000});
 assert((await audio()).paused);

 // Stop works and disables read-along.
 await page.click('#prevButton');await page.click('#readPageButton');await page.waitForFunction(()=>narrationAudioActive && !narrationAudioElement.paused);
 await page.click('#stopNarrationButton');assert.equal(await state(),'Ready');assert((await audio()).paused);assert.equal(await page.evaluate(()=>readAlongEnabled),false);

 // Leaving the reader stops audio.
 await page.click('#readPageButton');await page.waitForFunction(()=>narrationAudioActive && !narrationAudioElement.paused);
 await page.click('#backButton');assert((await audio()).paused);

 // A story without narration audio keeps the browser voice and never requests MP3s.
 // Every story is narrated now, so drop one from the in-page manifest to simulate a story without audio.
 const other=await page.evaluate(t=>{const s=stories.find(s=>s.id!==t && !narrationAudioManifest.stories[s.id]) || stories.find(s=>s.id!==t);delete narrationAudioManifest.stories[s.id];return s.id;},TUNDRA);
 const before=requests.length;await page.evaluate(()=>{window.__spoken=[];});
 await open(other,0);await page.click('#readPageButton');
 await page.waitForFunction(()=>window.__spoken.length>0 || document.getElementById('narrationStatus').textContent==='No narrator voices available',{timeout:8000});
 assert(!requests.slice(before).some(r=>r.endsWith('.mp3')),'no MP3 probes for un-narrated stories');
 assert.equal(await page.$eval('#readPageButton',e=>e.disabled),false);
 assert.deepEqual(errors,[]);
 console.log('PASS narration audio: Tundra MP3 playback, volume, preload, pause/resume, read-along page turn, end state, missing-file fallback, stop, leave reader, browser-voice fallback without probes');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
