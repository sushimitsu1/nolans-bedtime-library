// Run: node games/voice-test.mjs [chromium|webkit ...]. Every line the games speak must resolve to a Sulafat clip.
import assert from 'node:assert/strict';import fs from 'node:fs/promises';import {existsSync} from 'node:fs';import http from 'node:http';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
let pw;for(const name of ['playwright','playwright-core','/usr/local/lib/pnpm/5/node_modules/playwright-core/index.mjs'])try{pw=await import(name);break;}catch{}
assert(pw,'Install playwright to run the voice test.');
const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/game-voice/manifest.json'),'utf8'));
assert.equal(manifest.voiceId,'en-US-Chirp3-HD-Sulafat');
const files=new Set(Object.values(manifest.clips));for(const f of files)assert(existsSync(path.join(root,'assets/game-voice',f)),`missing clip ${f}`);
const server=http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://x').pathname);const f=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!f.startsWith(root+path.sep))throw Error();const d=await fs.readFile(f);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.mp3':'audio/mpeg','.webp':'image/webp'})[path.extname(f)]||'application/octet-stream');res.end(d);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
const engines=process.argv.slice(2).length?process.argv.slice(2):['chromium','webkit'];
for(const engine of engines){
  const opts=engine==='chromium'?{executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']}:{};
  let browser;try{browser=await pw[engine].launch(opts);}catch(e){console.log(`SKIP ${engine}: ${e.message.split('\n')[0]}`);continue;}
  const ctx=await browser.newContext({reducedMotion:'reduce',serviceWorkers:'block',viewport:{width:1180,height:820}});const page=await ctx.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.addInitScript(()=>{window.__synth=[];if(window.speechSynthesis)speechSynthesis.speak=u=>{__synth.push(u.text);setTimeout(()=>u.onend?.(),0);};});
  await page.goto(url);await page.evaluate(()=>NolanVoice.ready);
  const said={n:0,unresolved:new Set(),misses:[],clips:0,synth:0};
  const wrap=()=>page.evaluate(()=>{window.__said=0;window.__unresolved=new Set();const sp=NolanVoice.speak;NolanVoice.speak=m=>{for(const p of [m].flat(9).filter(Boolean))for(const s of NolanVoice.split(typeof p==='string'?p:p.text)){__said++;if(!NolanVoice.has(s))__unresolved.add(s);}return sp(m);};});
  const collect=async()=>{const r=await page.evaluate(()=>({said:__said,unresolved:[...__unresolved],misses:NolanVoice.misses,clips:NolanVoice.log.filter(l=>l.via==='clip').length,synth:__synth.length}));said.n+=r.said;r.unresolved.forEach(x=>said.unresolved.add(x));said.misses.push(...r.misses);said.clips+=r.clips;said.synth+=r.synth;};
  await wrap();
  await page.click('#gamesTab');await page.waitForSelector('#gamesView .game-card');
  // A real tap first, so the audio context is unlocked the way it is on a phone; then wait for an actual clip to finish.
  await page.click('#gamesView [data-action="open"][data-id="rollo"]');
  await page.waitForFunction(()=>NolanVoice.log.some(l=>l.via==='clip'),{timeout:8000});
  await page.waitForTimeout(2500);
  await collect();
  const ids=['rollo','lulu','dax','sunny','bex','rhymo','zumi','bo','otto','fam','kip','tap-tap'];
  for(let L=1;L<=8;L++){
    await page.evaluate(L=>localStorage.setItem('nolan-games-v1',JSON.stringify({points:0,narration:true,effects:true,rewards:true,levels:Object.fromEntries(['rollo','lulu','dax','sunny','bex','rhymo','zumi','bo','otto','fam','kip','tap-tap'].map(id=>[id,L]))})),L);
    await page.reload();await page.evaluate(()=>NolanVoice.ready);await wrap();await page.click('#gamesTab');await page.waitForSelector('#gamesView .game-card');
    for(const id of ids)await page.evaluate(async([id,L])=>{
      const v=document.getElementById('gamesView'),sleep=ms=>new Promise(r=>setTimeout(r,ms));
      for(let e=0;e<3;e++){
        v.querySelector('[data-action="home"]')?.click();
        if(e===0&&!v.innerHTML.includes(`Stop ${L} of 8`))throw new Error(id+' did not start at level '+L);
        v.querySelector(`[data-action="open"][data-id="${id}"]`).click();
        for(let i=0;i<250;i++){
          const bs=[...v.querySelectorAll('button[data-action]')].filter(b=>!b.disabled&&['piece','place','choice','recount','repeat','depart'].includes(b.dataset.action));
          if(!bs.length){const n=v.querySelector('[data-action="next"]');if(n){n.click();continue;}break;}
          const pieces=bs.filter(b=>b.dataset.action==='piece'),zones=bs.filter(b=>b.dataset.action==='place'),dep=bs.filter(b=>b.dataset.action==='depart');
          let pool=bs;if(dep.length&&Math.random()<.8)pool=dep;else if(pieces.length&&zones.length&&Math.random()<.85)pool=v.querySelector('[data-action="piece"][aria-pressed="true"]')?zones:pieces;
          const b=pool[Math.floor(Math.random()*pool.length)];b.click();if(b.dataset.action==='depart')await sleep(120);
        }
        v.querySelector('[data-action="finish"]')?.click();await sleep(20);
      }
    },[id,L]);
    await page.waitForTimeout(800);await collect();
  }
  const r={said:said.n,unresolved:[...said.unresolved],misses:said.misses,clips:said.clips,synth:said.synth};
  console.log(`${engine}: ${r.said} sentences requested, ${r.clips} clips started, unresolved ${r.unresolved.length}, fallbacks ${r.misses.length}, browser voice ${r.synth}, errors ${errors.length}`);
  assert.deepEqual(r.unresolved,[],`${engine}: sentences without a clip`);
  assert.deepEqual(r.misses,[],`${engine}: clip fallbacks`);assert.equal(r.synth,0,`${engine}: browser voice used`);
  assert(r.clips>50,`${engine}: clips did not play`);assert.deepEqual(errors,[],`${engine}: console errors`);
  await browser.close();
}
server.close();console.log('PASS game voice: every spoken game line resolves to a Sulafat clip');
