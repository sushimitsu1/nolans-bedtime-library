// Crawl every game at every level (random walk, reduced motion) and log each spoken line, then split the
// lines into sentences (as games/voice.js does), add the finite number/letter families, and merge into
// production/game-voice/clips.json.   node production/scripts/game_voice_phrases.mjs [steps=600] [episodes=10]
import fs from 'node:fs/promises';import http from 'node:http';import path from 'node:path';
const {chromium}=await import('/usr/local/lib/pnpm/5/node_modules/playwright-core/index.mjs');
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const STEPS=Number(process.argv[2]||400), EPIS=Number(process.argv[3]||6), OUT=path.join(root,'production/game-voice/clips.json');
const server=http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://x').pathname);const f=path.resolve(root,'.'+(name==='/'?'/index.html':name));let d=await fs.readFile(f);
 if(name==='/games/games.js'){d=String(d).replace('function say(message) {','function say(message) { window.__sayLog&&window.__sayLog(message);').replace("window.NolanGames={","window.__prefs=prefs;window.NolanGames={");}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(f)]||'application/octet-stream');res.end(d);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const ctx=await browser.newContext({reducedMotion:'reduce',serviceWorkers:'block'});const page=await ctx.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__parts=new Map();window.__sayLog=m=>{for(const p of (Array.isArray(m)?m:[m]).flat().filter(Boolean)){const t=typeof p==='string'?p:p.text;window.__parts.set(t,(window.__parts.get(t)||0)+1);}};speechSynthesis.speak=u=>setTimeout(()=>u.onend?.(),0);});
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.evaluate(()=>document.getElementById('gamesTab').click());
const ids=['rollo','lulu','dax','sunny','bex','rhymo','zumi','bo','otto','fam','kip','tap-tap'];
for(const id of ids)for(let L=1;L<=8;L++){
  await page.evaluate(async([id,L,STEPS,EPIS])=>{
    const v=document.getElementById('gamesView');const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    for(let e=0;e<EPIS;e++){
      window.__prefs.levels[id]=L;v.querySelector('[data-action="home"]')?.click();
      v.querySelector(`[data-action="open"][data-id="${id}"]`).click();
      for(let i=0;i<STEPS;i++){
        let bs=[...v.querySelectorAll('button[data-action]')].filter(b=>!b.disabled&&['piece','place','choice','recount','repeat','depart'].includes(b.dataset.action));
        if(Math.random()<.003)bs=[...v.querySelectorAll('[data-action="finish"]')];
        if(!bs.length){const n=v.querySelector('[data-action="next"]');if(n&&Math.random()<.3){window.__prefs.levels[id]=L;n.click();continue;}break;}
        // Bias journeys to alternate piece -> place
        const pieces=bs.filter(b=>b.dataset.action==='piece'),zones=bs.filter(b=>b.dataset.action==='place'),dep=bs.filter(b=>b.dataset.action==='depart');
        let pool=bs;if(dep.length&&Math.random()<.8)pool=dep;else if(pieces.length&&zones.length&&Math.random()<.85)pool=v.querySelector('[data-action="piece"][aria-pressed="true"]')?zones:pieces;
        const b=pool[Math.floor(Math.random()*pool.length)];b.click();
        if(b.dataset.action==='depart')await sleep(120);
      }
      await sleep(5);
    }
  },[id,L,STEPS,EPIS]);
}
const parts=await page.evaluate(()=>Object.keys(Object.fromEntries(window.__parts)));
await browser.close();server.close();
const split=t=>String(t).trim().replace(/\s+/g,' ').replace(/([.!?])\s+(?=\S)/g,'$1\u0000').split('\u0000').map(s=>s.trim()).filter(Boolean);
const set=new Set();try{JSON.parse(await fs.readFile(OUT,'utf8')).forEach(s=>set.add(s));}catch{}
const before=set.size;const add=xs=>xs.forEach(x=>split(x).forEach(s=>set.add(s)));add(parts);
const R=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
add(R(1,20).map(String));add(R(0,20).map(n=>`${n} loaded.`));add(R(1,20).map(n=>`We need ${n}.`));add(R(1,20).map(n=>`${n} delivered!`));
add(R(1,10).map(n=>`${n} blocks altogether.`));add(R(1,10).map(n=>`${n} blocks!`));add(R(1,10).map(n=>`${n} bridge blocks`));
add(R(0,10).map(n=>`${n} delivered.`));add(R(0,10).map(n=>`${n} left.`));add(R(0,10).map(n=>`Deliver ${n} more.`));add(R(0,10).map(n=>`${n} parcels stay in the van.`));add(R(0,10).map(n=>`${n} parcels stay.`));
add(R(0,30).flatMap(n=>[`${n} on the left.`,`${n} on the right.`]));
const L='ABCDEFGHIJKLMNOPQRSTUVWXYZ';add([...L,...L.toLowerCase()].flatMap(x=>[`Letter ${x}`,`${x}.`]));
const list=[...set].sort();await fs.writeFile(OUT,JSON.stringify(list,null,1)+'\n');
console.log(`${parts.length} spoken parts seen; clips.json ${before} -> ${list.length} sentences; page errors ${errors.length}`);
