import fs from 'node:fs';
import vm from 'node:vm';

function extractStories(source){
  const marker='const stories =';
  const start=source.indexOf(marker);
  const arrayStart=source.indexOf('[',start+marker.length);
  let depth=0;
  let quote=null;
  let escaped=false;
  for(let index=arrayStart;index<source.length;index+=1){
    const char=source[index];
    if(quote){
      if(escaped) escaped=false;
      else if(char==='\\') escaped=true;
      else if(char===quote) quote=null;
      continue;
    }
    if(char==='\'' || char==='"' || char==='`'){ quote=char; continue; }
    if(char==='[') depth+=1;
    if(char===']' && --depth===0) return source.slice(arrayStart,index+1);
  }
  throw new Error('Could not extract stories array');
}

const source=fs.readFileSync(process.argv[2] || 'app.js','utf8');
const story=JSON.parse(fs.readFileSync('production/stories/grave-digger/story.json','utf8'));
const baseline=JSON.parse(fs.readFileSync('production/stories/grave-digger/preserved-baseline.json','utf8'));
const context={};
vm.runInNewContext(`stories=${extractStories(source)}`,context,{timeout:1000});
const grave=context.stories.find(record=>record.id==='grave-digger');
const errors=[];
if(!grave) errors.push('Grave Digger app record is missing');
else{
  if(grave.narration.length!==15) errors.push('Grave Digger app narration must contain 15 entries');
  if(JSON.stringify(grave.narration.slice(0,9))!==JSON.stringify(baseline.narrationPages1to9)) errors.push('app narration Pages 1-9 changed');
  if(JSON.stringify(grave.narration)!==JSON.stringify(story.pages.map(page=>page.text))) errors.push('app narration does not exactly equal story source');
  const expectedPages=Array.from({length:15},(_,index)=>`assets/books/grave-digger/page-${String(index+1).padStart(2,'0')}.webp`);
  if(JSON.stringify(grave.pages)!==JSON.stringify(expectedPages)) errors.push('Grave Digger page paths changed');
  if(grave.cover!=='assets/books/grave-digger/cover.webp') errors.push('Grave Digger cover path changed');
}
if(errors.length){
  console.error('GRAVE DIGGER APP VALIDATION FAILED');
  errors.forEach(error=>console.error(`- ${error}`));
  process.exit(1);
}
console.log('GRAVE DIGGER APP VALIDATION PASSED');
