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
  const migratedAutomatic=api.chooseNarrationVoice(voices,{voiceURI:'test:basic-us',wasUserSelected:false});
  if(migratedAutomatic?.voiceURI!=='test:aria-online') errors.push('Aria did not replace an old automatically saved fallback');
  const manual=api.chooseNarrationVoice(voices,{voiceURI:'test:basic-us',wasUserSelected:true});
  if(manual?.voiceURI!=='test:basic-us') errors.push('a real manually selected voice was not preserved');
  const missing=api.chooseNarrationVoice(voices,{voiceURI:'test:missing',wasUserSelected:true});
  if(missing?.voiceURI!=='test:aria-online') errors.push('a missing saved voice did not trigger fresh Aria selection');
  const natural=api.chooseNarrationVoice(voices.filter(voice=>!voice.name.includes('Aria')),{wasUserSelected:false});
  if(natural?.voiceURI!=='test:ava-natural') errors.push('natural en-US fallback was not preferred');
  const mockOnly=api.chooseNarrationVoice([{name:'Mock Aria',voiceURI:'mock:aria',lang:'en-US'}],{});
  if(mockOnly!==null || api.filterBrowserVoices(voices).some(voice=>voice.voiceURI.startsWith('mock:'))){
    errors.push('mock voices were treated as real browser voices');
  }
}

const migratedValues=new Map([['nolan:narration-voice-uri','legacy:male']]);
const migrationContext={
  storage:{
    narratorVoiceURI:'nolan:narratorVoiceURI',
    narratorVoiceWasUserSelected:'nolan:narratorVoiceWasUserSelected',
    legacyNarrationVoiceURI:'nolan:narration-voice-uri'
  },
  localStorage:{
    getItem:key=>migratedValues.get(key) ?? null,
    setItem:(key,value)=>migratedValues.set(key,String(value)),
    removeItem:key=>migratedValues.delete(key)
  }
};
try{
  const migrationSource=sourceSlice('function readNarratorPreference','const SPEECH_SOUND_PRONUNCIATIONS');
  vm.runInNewContext(`${migrationSource}\nthis.preference=narratorPreference;`,migrationContext);
  if(migrationContext.preference.voiceURI!=='legacy:male' || migrationContext.preference.wasUserSelected!==false){
    errors.push('legacy narrator preference was not migrated as automatic');
  }
  if(migratedValues.get('nolan:narratorVoiceWasUserSelected')!=='false' || migratedValues.has('nolan:narration-voice-uri')){
    errors.push('legacy narrator storage was not rewritten to the new preference keys');
  }
}catch(error){
  errors.push(`preference migration test failed: ${error.message}`);
}

requireSource(/speechSynthesis\.getVoices\(\)/,'available voices must come from getVoices()');
requireSource(/addEventListener\(['"]voiceschanged['"]/,'voiceschanged listener is required');
requireSource(/voiceschanged['"],\(\)=>\{\s*selectNarrationVoiceFromAvailable\(\)/,'voiceschanged must refresh the actual browser voice list');
requireSource(/selectedNarrationVoice && narrationVoiceLocked/,'voiceschanged must not replace the active story voice');
requireSource(/localStorage\.setItem\(storage\.narratorVoiceURI,voice\.voiceURI\)/,'selected voiceURI must be persisted');
requireSource(/localStorage\.setItem\(storage\.narratorVoiceWasUserSelected,String\(Boolean\(wasUserSelected\)\)\)/,'manual-versus-automatic selection must be persisted');
requireSource(/availableNarrationVoices\.length && narratorPreference\.voiceURI[\s\S]*clearNarratorPreference\(\)/,'a missing saved voice must be removed after the real list loads');
requireSource(/setNarrationState\(['"]Preparing voice…['"]\)[\s\S]*await initializeNarrationVoice\(\)/,'Page 1 must wait in Preparing voice state');
requireSource(/utterance\.lang=voice\.lang \|\| ['"]en-US['"]/,'utterance language must follow the selected voice');
requireSource(/utterance\.voice=voice/,'every utterance must receive the selected voice');
requireSource(/narrationVoiceLocked=true;[\s\S]*utterance\.voice=voice/,'the voice must lock before Page 1 begins');
requireSource(/console\.info\(['"]Available speech synthesis voices['"][\s\S]*localService:Boolean\(voice\.localService\)[\s\S]*default:Boolean\(voice\.default\)/,'the real voice metadata must be logged once for diagnosis');
requireSource(/englishVoices=availableNarrationVoices\.filter\(isEnglishVoice\)[\s\S]*option\.value=voice\.voiceURI/,'the selector must contain actual English browser voices');
requireSource(/Aria not available in this browser/,'the selector must report when Aria is unavailable');
requireSource(/function chooseNarratorFromSelector[\s\S]*stopNarration\(\{disableReadAlong:true\}\)[\s\S]*setSelectedNarrationVoice\(voice,\{wasUserSelected:true\}\)/,'manual narrator changes must cancel speech and mark the preference explicit');
requireSource(/function resetNarrator\(\)[\s\S]*stopNarration\(\{disableReadAlong:true\}\)[\s\S]*clearNarratorPreference\(\);[\s\S]*selectNarrationVoiceFromAvailable\(\);/,'Reset narrator must cancel speech, clear preference, and reload real voices');
requireSource(/narratorDiagnosticText['"]\)\.textContent=[\s\S]*localService:[\s\S]*English voices:[\s\S]*Aria detected:/,'the live diagnostic must expose the required voice metadata');
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
