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
const pureFunctions=sourceSlice('function prepareSpeechText','async function loadNarrationVoiceConfig');
const context={narrationVoiceConfig:null};
try{
  vm.runInNewContext(
    `${constants}\n${pureFunctions}\nthis.testApi={prepareSpeechText,lockedBrowserVoiceId,chooseNarrationVoice};`,
    context
  );
}catch(error){
  errors.push(`locked speech helper extraction failed: ${error.message}`);
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
  const ordinary='The green balloon rolled past the coffee shop and bookkeeper.';
  if(api.prepareSpeechText(ordinary)!==ordinary) errors.push('ordinary repeated-letter words were changed');

  const locked={
    selection_mode:'locked',
    provider:'browser-speech-synthesis',
    primary:{voice_id:'provider:exact-primary',status:'approved'},
    backup:{voice_id:'provider:exact-backup',status:'approved'},
    allowed_voice_ids:['provider:exact-primary','provider:exact-backup'],
    allow_provider_default:false,
    allow_random_selection:false,
    allow_unlisted_voice:false
  };
  const voices=[
    {name:'Default Voice',voiceURI:'provider:default',lang:'en-US',default:true},
    {name:'Approved Primary',voiceURI:'provider:exact-primary',lang:'en-US'},
    {name:'Approved Backup',voiceURI:'provider:exact-backup',lang:'en-US'}
  ];
  if(api.lockedBrowserVoiceId(locked)!=='provider:exact-primary'){
    errors.push('approved exact primary ID was not accepted');
  }
  if(api.chooseNarrationVoice(voices,locked)?.voiceURI!=='provider:exact-primary'){
    errors.push('the exact approved primary browser voice was not selected');
  }
  if(api.chooseNarrationVoice(voices.filter(voice=>voice.voiceURI!=='provider:exact-primary'),locked)!==null){
    errors.push('a missing primary voice triggered a substitution');
  }
  for(const mutation of [
    {...locked,provider:'another-provider'},
    {...locked,allow_provider_default:true},
    {...locked,allow_random_selection:true},
    {...locked,allow_unlisted_voice:true},
    {...locked,allowed_voice_ids:['provider:exact-backup']}
  ]){
    if(api.chooseNarrationVoice(voices,mutation)!==null){
      errors.push('an invalid lock configuration selected a browser voice');
    }
  }
}

requireSource(/fetch\(['"]config\/narration-voices\.json['"],\{cache:['"]no-store['"]\}\)/,'runtime must load the locked machine-readable voice config');
requireSource(/speechSynthesis\.getVoices\(\)/,'browser availability lookup must use getVoices()');
requireSource(/voice\?\.voiceURI===exactVoiceId/,'browser voice lookup must compare the exact provider voice ID');
requireSource(/addEventListener\(['"]voiceschanged['"]/,'voiceschanged listener is required for late browser voice availability');
requireSource(/selectedNarrationVoice && narrationVoiceLocked/,'voiceschanged must not replace the active story voice');
requireSource(/setNarrationState\(['"]Preparing voice…['"]\)[\s\S]*await initializeNarrationVoice\(\)/,'page playback must wait for locked voice initialization');
requireSource(/setNarrationState\(['"]Locked narrator unavailable['"]\)/,'a missing locked voice must fail visibly');
requireSource(/utterance\.voice=voice/,'every browser utterance must receive the exact selected voice');
requireSource(/function chooseNarratorFromSelector[\s\S]*Narrator selection is locked/,'manual browser narrator substitution must be disabled');
requireSource(/new SpeechSynthesisUtterance\(prepareSpeechText\(packageSpeechText \|\| text\)\)/,'only exact package playback text may be pronunciation-normalized');
requireSource(/loadNarrationVoiceConfig\(\)\.then\(selectNarrationVoiceFromAvailable\)/,'locked narration config must load during startup');

rejectSource(/VOICE_QUALITY_INDICATORS/,'display-name quality inference is prohibited');
rejectSource(/findAriaVoice/,'display-name Aria selection is prohibited');
rejectSource(/voice\.default/,'browser default voice fallback is prohibited');
rejectSource(/narratorVoiceWasUserSelected/,'saved manual narrator substitutions are prohibited');
rejectSource(/narratorPreference/,'dynamic saved narrator preferences are prohibited');
rejectSource(/Math\.random[\s\S]{0,120}(?:voice|narrat)/i,'random narration voice selection is prohibited');

if(errors.length){
  console.error('NARRATION VOICE VALIDATION FAILED');
  errors.forEach(error=>console.error(`- ${error}`));
  process.exit(1);
}

console.log('NARRATION VOICE VALIDATION PASSED');
