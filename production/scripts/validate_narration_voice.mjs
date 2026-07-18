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
const pureFunctions=sourceSlice('function prepareSpeechText','function logNarrationVoicesOnce');
const context={};
try{
  vm.runInNewContext(`${constants}\n${pureFunctions}\nthis.testApi={prepareSpeechText,chooseNarrationVoice,filterBrowserVoices};`,context);
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
    {name:'Basic US English',voiceURI:'test:basic-us',lang:'en-US',default:true},
    {name:'Ava Natural Online',voiceURI:'test:ava-natural',lang:'en-US'},
    {name:'Microsoft Aria Online (Natural)',voiceURI:'test:aria-online',lang:'en-US'},
    {name:'English UK',voiceURI:'test:english-uk',lang:'en-GB'},
    {name:'French Default',voiceURI:'test:french',lang:'fr-FR',default:true},
    {name:'Mock Aria',voiceURI:'mock:aria',lang:'en-US'}
  ];
  const selected=api.chooseNarrationVoice(voices,'test:missing');
  if(selected?.voiceURI!=='test:aria-online') errors.push('Aria was not preferred over other English voices');
  const saved=api.chooseNarrationVoice(voices,'test:basic-us');
  if(saved?.voiceURI!=='test:basic-us') errors.push('available saved voiceURI was not preserved');
  const natural=api.chooseNarrationVoice(voices.filter(voice=>!voice.name.includes('Aria')),'');
  if(natural?.voiceURI!=='test:ava-natural') errors.push('natural en-US fallback was not preferred');
  const mockOnly=api.chooseNarrationVoice([{name:'Mock Aria',voiceURI:'mock:aria',lang:'en-US'}],'');
  if(mockOnly!==null || api.filterBrowserVoices(voices).some(voice=>voice.voiceURI.startsWith('mock:'))){
    errors.push('mock voices were treated as real browser voices');
  }
}

requireSource(/speechSynthesis\.getVoices\(\)/,'available voices must come from getVoices()');
requireSource(/addEventListener\(['"]voiceschanged['"]/,'voiceschanged listener is required');
requireSource(/voiceschanged['"],\(\)=>\{\s*selectNarrationVoiceFromAvailable\(\)/,'voiceschanged must refresh the actual browser voice list');
requireSource(/selectedNarrationVoice && \(narrationVoiceLocked \|\| narrationVoiceChosenByUser\)/,'voiceschanged must not replace a locked or manually selected voice');
requireSource(/localStorage\.setItem\(storage\.narrationVoiceURI,voice\.voiceURI\)/,'selected voiceURI must be persisted');
requireSource(/setNarrationState\(['"]Preparing voice…['"]\)[\s\S]*await initializeNarrationVoice\(\)/,'Page 1 must wait in Preparing voice state');
requireSource(/utterance\.lang=voice\.lang \|\| ['"]en-US['"]/,'utterance language must follow the selected voice');
requireSource(/utterance\.voice=voice/,'every utterance must receive the selected voice');
requireSource(/narrationVoiceLocked=true;[\s\S]*utterance\.voice=voice/,'the voice must lock before Page 1 begins');
requireSource(/console\.info\(['"]Available speech synthesis voices['"][\s\S]*localService:Boolean\(voice\.localService\)[\s\S]*default:Boolean\(voice\.default\)/,'the real voice metadata must be logged once for diagnosis');
requireSource(/englishVoices=availableNarrationVoices\.filter\(isEnglishVoice\)[\s\S]*option\.value=voice\.voiceURI/,'the selector must contain actual English browser voices');
requireSource(/function chooseNarratorFromSelector[\s\S]*stopNarration\(\{disableReadAlong:true\}\)[\s\S]*setSelectedNarrationVoice\(voice\)/,'manual narrator changes must cancel speech without starting it');
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
