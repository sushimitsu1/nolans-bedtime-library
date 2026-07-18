import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import vm from 'node:vm';

const appPath = path.resolve(process.argv[2] || 'app.js');
const source = fs.readFileSync(appPath, 'utf8');
const errors = [];

function requireSource(pattern,message){
  if(!pattern.test(source)) errors.push(message);
}

function sourceSlice(startMarker,endMarker){
  const start=source.indexOf(startMarker);
  const end=source.indexOf(endMarker,start);
  if(start<0 || end<0){
    errors.push(`could not extract ${startMarker}`);
    return '';
  }
  return source.slice(start,end);
}

const constants=sourceSlice('const SPEECH_SOUND_PRONUNCIATIONS','function readFavorites');
const pureFunctions=sourceSlice('function prepareSpeechText','function selectNarrationVoiceFromAvailable');
const context={};
try{
  vm.runInNewContext(`${constants}\n${pureFunctions}\nthis.testApi={prepareSpeechText,chooseNarrationVoice};`,context);
}catch(error){
  errors.push(`speech helper extraction failed: ${error.message}`);
}

const api=context.testApi;
if(api){
  const cases=new Map([
    ['VROOMMM!','vroom!'],
    ['vrooom, VROOOOM.','vroom, vroom.'],
    ['RUMBLEEE; rumbleeee?','rumble; rumble?'],
    ['BEEEEP! beeep.','beep! beep.'],
    ['HONKKK, HOOONK!','honk, honk!'],
    ['ZOOOOM—ZOOMMM!','zoom—zoom!'],
    ['SCREEECH! SPLAAASH! SPLASHHHH!','screech! splash! splash!'],
    ['CRUUUNCH. RATATATA!','crunch. rat-a-tat-a!'],
    ['The flag waved… VROOMMM! He raced ahead.','The flag waved… vroom! He raced ahead.']
  ]);
  for(const [visible,spoken] of cases){
    if(api.prepareSpeechText(visible)!==spoken) errors.push(`pronunciation mismatch for ${visible}`);
  }
  const ordinary='The green balloon rolled past the coffee shop and bookkeeper.';
  if(api.prepareSpeechText(ordinary)!==ordinary) errors.push('ordinary repeated-letter words were changed');

  const voices=[
    {name:'Basic US English',voiceURI:'mock:basic-us',lang:'en-US'},
    {name:'Ava Natural Online',voiceURI:'mock:ava-natural',lang:'en-US'},
    {name:'Premium English UK',voiceURI:'mock:premium-uk',lang:'en-GB'}
  ];
  const selected=api.chooseNarrationVoice(voices,'mock:missing');
  if(selected?.voiceURI!=='mock:ava-natural') errors.push('ranked voice selection did not choose the strongest natural en-US voice');
  const saved=api.chooseNarrationVoice(voices,'mock:basic-us');
  if(saved?.voiceURI!=='mock:basic-us') errors.push('available saved voiceURI was not preserved');
  if(selected) console.log(`SELECTED TEST VOICE: ${selected.name} | ${selected.voiceURI}`);
}

requireSource(/speechSynthesis\.getVoices\(\)/,'available voices must come from getVoices()');
requireSource(/addEventListener\(['"]voiceschanged['"]/,'voiceschanged listener is required');
requireSource(/if\(!selectedNarrationVoice\) selectNarrationVoiceFromAvailable\(\)/,'voiceschanged must not replace a locked voice');
requireSource(/localStorage\.setItem\(storage\.narrationVoiceURI,voice\.voiceURI\)/,'selected voiceURI must be persisted');
requireSource(/setNarrationState\(['"]Preparing voice…['"]\)[\s\S]*await initializeNarrationVoice\(\)/,'Page 1 must wait in Preparing voice state');
requireSource(/utterance\.lang=['"]en-US['"]/,'utterance language must stay en-US');
requireSource(/utterance\.voice=voice/,'every utterance must receive the selected voice');
requireSource(/new SpeechSynthesisUtterance\(prepareSpeechText\(text\)\)/,'only playback text may be pronunciation-normalized');
requireSource(/stopNarration\(\)[\s\S]*await initializeNarrationVoice\(\)[\s\S]*speechSynthesis\.speak\(utterance\)/,'old speech must be cancelled before new speech starts');
requireSource(/function pauseOrResumeNarration\(\)[\s\S]*speechSynthesis\.pause\(\)/,'Pause must reuse the active utterance');
requireSource(/function pauseOrResumeNarration\(\)[\s\S]*speechSynthesis\.resume\(\)/,'Resume must reuse the active utterance');
requireSource(/function restartCurrentPageNarration\(\)[\s\S]*readCurrentPage\(\{enableReadAlong:false\}\)/,'Restart Page must reuse the locked-voice reader');
requireSource(/showView\(view\)[\s\S]*stopNarration\(\{disableReadAlong:true\}\)/,'Library navigation must cancel speech and read-along');

if(errors.length){
  console.error('NARRATION VOICE VALIDATION FAILED');
  errors.forEach(error=>console.error(`- ${error}`));
  process.exit(1);
}

console.log('NARRATION VOICE VALIDATION PASSED');
