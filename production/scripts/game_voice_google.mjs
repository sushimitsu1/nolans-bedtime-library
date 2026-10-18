#!/usr/bin/env node
// Pre-render every spoken game line with the story narrator's Google voice (en-US-Chirp3-HD-Sulafat).
//
//   node production/scripts/game_voice_phrases.mjs              (re-crawl the games, refresh production/game-voice/clips.json)
//   GOOGLE_TTS_API_KEY=... node production/scripts/game_voice_google.mjs [--dry-run]
//
// Games speak sentence by sentence (games/voice.js splits each line on . ! ?), so a clip is one sentence.
// production/game-voice/overrides.json respells lines Chirp3 would misread, points letter sounds at
// hand-cut clips, or joins two clips into one file. Output: assets/game-voice/<hash>.mp3 (mono 96 kbps)
// and assets/game-voice/manifest.json { voiceId, clips: { "<sentence>": "<file>" } }. Existing files are kept.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const VOICE='en-US-Chirp3-HD-Sulafat',LANG='en-US',DRY=process.argv.includes('--dry-run');
const outDir=path.join(root,'assets/game-voice');
const clips=JSON.parse(fs.readFileSync(path.join(root,'production/game-voice/clips.json'),'utf8'));
const overrides=JSON.parse(fs.readFileSync(path.join(root,'production/game-voice/overrides.json'),'utf8'));
const sha=t=>crypto.createHash('sha256').update(VOICE+'\n'+t).digest('hex').slice(0,12);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
// Single letters are read by name; lower case "a." would otherwise be read as the article.
const sayText=t=>overrides[t]?.say||t.replace(/^(Letter )?([a-z])(\.?)$/,(_,p='',x,d)=>p+x.toUpperCase()+d);
async function synth(text){
  for(let attempt=1;;attempt++){
    const r=await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(process.env.GOOGLE_TTS_API_KEY)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input:{text},voice:{languageCode:LANG,name:VOICE},audioConfig:{audioEncoding:'MP3'}})}).catch(e=>({ok:false,status:0,text:async()=>e.message}));
    if(r.ok)return Buffer.from((await r.json()).audioContent,'base64');
    if((r.status===429||r.status>=500||r.status===0)&&attempt<8){await sleep(Math.min(60000,2000*2**attempt));continue;}
    throw new Error(`Google TTS HTTP ${r.status}: ${(await r.text()).slice(0,200)}`);
  }
}
function ff(args){execFileSync('ffmpeg',['-loglevel','error','-y',...args]);}
function mono96(buf,dest){const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gv-'));try{fs.writeFileSync(path.join(tmp,'in.mp3'),buf);ff(['-i',path.join(tmp,'in.mp3'),'-ac','1','-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',dest]);}finally{fs.rmSync(tmp,{recursive:true,force:true});}}
const manifest={version:1,voiceId:VOICE,generated:new Date().toISOString().slice(0,10),clips:{}};
const todo=new Map();
for(const text of clips){const o=overrides[text];
  if(o?.file){manifest.clips[text]=o.file;continue;}
  if(o?.join)continue;
  const s=sayText(text),file=sha(s)+'.mp3';manifest.clips[text]=file;todo.set(file,s);}
// Join parts are synthesised (or hand-cut) first, then concatenated into one file.
const joins=clips.filter(t=>overrides[t]?.join);
for(const t of joins)for(const part of overrides[t].join)if(!overrides[part]?.file)todo.set(sha(sayText(part))+'.mp3',sayText(part));
const pending=[...todo].filter(([f])=>!fs.existsSync(path.join(outDir,f)));
console.log(`${clips.length} lines -> ${todo.size} synthesised files; ${pending.length} to render, ${pending.reduce((a,[,s])=>a+s.length,0)} characters`);
if(DRY)process.exit(0);
if(pending.length&&!process.env.GOOGLE_TTS_API_KEY){console.error('GOOGLE_TTS_API_KEY is not set.');process.exit(64);}
fs.mkdirSync(outDir,{recursive:true});
let next=0;await Promise.all(Array.from({length:4},async()=>{while(next<pending.length){const [file,s]=pending[next++];mono96(await synth(s),path.join(outDir,file));process.stdout.write('.');}}));
for(const t of joins){
  const parts=overrides[t].join.map(p=>path.join(outDir,overrides[p]?.file||sha(sayText(p))+'.mp3'));
  const file='join-'+sha(t)+'.mp3';
  ff([...parts.flatMap(p=>['-i',p]),'-filter_complex',`${parts.map((_,i)=>`[${i}:a]`).join('')}concat=n=${parts.length}:v=0:a=1[a]`,'-map','[a]','-ac','1','-codec:a','libmp3lame','-b:a','96k','-map_metadata','-1',path.join(outDir,file)]);
  manifest.clips[t]=file;
}
manifest.clips=Object.fromEntries(Object.keys(manifest.clips).sort().map(k=>[k,manifest.clips[k]]));
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,1)+'\n');
const missing=Object.values(manifest.clips).filter(f=>!fs.existsSync(path.join(outDir,f)));
console.log(`\nmanifest: ${Object.keys(manifest.clips).length} lines, ${new Set(Object.values(manifest.clips)).size} files; missing ${missing.length}`);
if(missing.length)process.exit(1);
