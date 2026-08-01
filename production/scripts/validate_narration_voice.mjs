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

function rejectSource(pattern,message){
  if(pattern.test(source)) errors.push(message);
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
const pureFunctions=sourceSlice('function prepareSpeechText','function clearNarratorPreference');
const context={};
try{
  vm.runInNewContext(
    `${constants}\n${pureFunctions}\nthis.testApi={prepareSpeechText,filterBrowserVoices,chooseNarrationVoice};`,
    context
  );
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
    ['CRUUUNCH. RATATATA!','crunch. rat-a-tat-a!']
  ]);
  for(const [visible,spoken] of cases){
    if(api.prepareSpeechText(visible)!==spoken) errors.push(`pronunciation mismatch for ${visible}`);
  }
  const voices=[
    {name:'System Default',voiceURI:'system-default',lang:'en-GB',default:true},
    {name:'Microsoft Aria Online',voiceURI:'microsoft-aria',lang:'en-US'},
    {name:'Natural US Voice',voiceURI:'natural-us',lang:'en-US'},
    {name:'Saved Voice',voiceURI:'saved-voice',lang:'en-CA'},
    {name:'French Voice',voiceURI:'french-voice',lang:'fr-FR'},
    {name:'Mock Voice',voiceURI:'mock:test',lang:'en-US'}
  ];
  if(api.filterBrowserVoices(voices).some(voice=>voice.voiceURI==='mock:test')) errors.push('mock voice was not filtered');
  if(api.chooseNarrationVoice(voices)?.voiceURI!=='microsoft-aria') errors.push('automatic voice selection did not prefer Aria');
  if(api.chooseNarrationVoice(voices,{voiceURI:'saved-voice',wasUserSelected:true})?.voiceURI!=='saved-voice') errors.push('saved user voice was not preserved');
  if(api.chooseNarrationVoice([{name:'Default',voiceURI:'default',lang:'fr-FR',default:true}])?.voiceURI!=='default') errors.push('browser default fallback failed');
}

requireSource(/speechSynthesis\.getVoices\(\)/,'browser availability lookup must use getVoices()');
requireSource(/addEventListener\(['"]voiceschanged['"]/,'voiceschanged listener is required for late browser voice availability');
requireSource(/narratorVoiceURI: ['"]nolan:narratorVoiceURI['"]/,'selected narrator storage key is required');
requireSource(/narratorVoiceWasUserSelected/,'user-selected narrator persistence is required');
requireSource(/select\.replaceChildren\(\.\.\.options\)/,'narrator dropdown must be populated from available voices');
requireSource(/function chooseNarratorFromSelector[\s\S]*setSelectedNarrationVoice\(voice,\{wasUserSelected:true\}\)/,'manual narrator selection must persist');
requireSource(/function resetNarrator\(\)[\s\S]*clearNarratorPreference\(\)[\s\S]*selectNarrationVoiceFromAvailable\(\)/,'Reset narrator must restore automatic selection');
requireSource(/Promise\.race\([\s\S]*setTimeout\(\(\)=>resolve\(null\),3000\)/,'late or missing voices must resolve gracefully');
requireSource(/setNarrationState\(['"]No narrator voices available['"]\)/,'missing voices must produce a visible status');
requireSource(/new SpeechSynthesisUtterance\(prepareSpeechText\(packageSpeechText \|\| text\)\)/,'exact page narration must be used for speech');
requireSource(/utterance\.voice=voice/,'every utterance must receive the selected voice');
requireSource(/if\(speechSupported\) selectNarrationVoiceFromAvailable\(\)/,'voice discovery must run on fresh page load');

rejectSource(/lockedBrowserVoiceId/,'obsolete approval-only browser voice lock remains');
rejectSource(/loadNarrationVoiceConfig/,'runtime still depends on the obsolete locked voice config');
rejectSource(/Narrator selection is locked/,'narrator dropdown is still locked');
rejectSource(/Locked narrator unavailable/,'read-aloud still fails through the obsolete lock status');

if(errors.length){
  console.error('NARRATION VOICE VALIDATION FAILED');
  errors.forEach(error=>console.error(`- ${error}`));
  process.exit(1);
}

console.log('NARRATION VOICE VALIDATION PASSED');
