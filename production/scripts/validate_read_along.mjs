import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const appPath = path.resolve(process.argv[2] || 'app.js');
const source = fs.readFileSync(appPath, 'utf8');
const errors = [];

function requireMatch(pattern, message) {
  if (!pattern.test(source)) errors.push(message);
}

requireMatch(/let readAlongEnabled = false;/, 'read-along must start disabled after load or refresh');
requireMatch(/let readAlongStoryId = null;/, 'read-along must be scoped to one story');
requireMatch(/let narrationGeneration = 0;/, 'narration callbacks need a generation guard');
requireMatch(/async function readCurrentPage\(\{enableReadAlong=true\}=\{\}\)[\s\S]*readAlongEnabled=true;[\s\S]*readAlongStoryId=activeStory\.id;/, 'Read Page must enable read-along for the active story');
requireMatch(/function stopNarration\(\{disableReadAlong=false\}=\{\}\)[\s\S]*if\(disableReadAlong\)[\s\S]*readAlongEnabled=false;[\s\S]*readAlongStoryId=null;/, 'Stop must be able to disable read-along');
requireMatch(/function nextPage\(\)[\s\S]*const autoRead=readAlongEnabled && readAlongStoryId===activeStory\.id;[\s\S]*renderPage\(\{autoRead\}\);/, 'forward navigation must preserve active story-scoped read-along');
requireMatch(/function renderPage\(\{autoRead=false\}=\{\}\)[\s\S]*stopNarration\(\);/, 'rendering a page must cancel old speech');
requireMatch(/const finishRender=\(\)=>\{[\s\S]*if\(autoRead\) setTimeout\([\s\S]*readCurrentPage\(\{enableReadAlong:false\}\)/, 'the rendered page must reuse the existing page reader');
requireMatch(/pageImage['"]\)\.onload=finishRender;/, 'automatic reading must wait for the page image to finish rendering');
requireMatch(/narrationGeneration===generation && narrationUtterance===utterance/, 'speech callbacks must reject stale narration');
requireMatch(/await initializeNarrationVoice\(\)[\s\S]*new SpeechSynthesisUtterance\(prepareSpeechText\(text\)\)/, 'speech must wait for a selected voice and prepare playback-only text');
requireMatch(/utterance\.voice=voice;/, 'every utterance must explicitly use the locked session voice');
requireMatch(/showView\(view\)[\s\S]*view!==['"]reader['"]\) stopNarration\(\{disableReadAlong:true\}\)/, 'leaving the reader must stop speech and reset read-along');
requireMatch(/function openStory\(id\)[\s\S]*stopNarration\(\{disableReadAlong:true\}\)/, 'opening a story must reset the previous story read-along state');
requireMatch(/stopNarrationButton['"]\)\.addEventListener\(['"]click['"],\(\)=>stopNarration\(\{disableReadAlong:true\}\)\)/, 'the Stop button must disable read-along');
requireMatch(/stopNarrationButton['"]\)\.disabled=!speechSupported \|\| \(!narrationActive && !narrationPreparing && !readAlongEnabled\)/, 'Stop must remain available while narration is preparing or read-along is enabled');
requireMatch(/nextButton['"]\)\.addEventListener\(['"]click['"],nextPage\)/, 'Next button must use the shared forward-navigation path');
requireMatch(/nextOverlay['"]\)\.addEventListener\(['"]click['"],nextPage\)/, 'forward page edge must use the shared forward-navigation path');
requireMatch(/\['ArrowRight',' ','Enter'\][\s\S]*nextPage\(\)/, 'right-arrow navigation must use the shared forward-navigation path');
requireMatch(/distance<0\?nextPage:prevPage/, 'forward swipe must use the shared forward-navigation path');
requireMatch(/function nextPage\(\)[\s\S]*currentPage<activeStory\.pages\.length-1[\s\S]*else \{ localStorage\.removeItem[\s\S]*finishStorytime\(['"]story['"]\); \}/, 'Page 15 must finish normally without looping or automatic page turns');

if (errors.length) {
  console.error('READ-ALONG VALIDATION FAILED');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log('READ-ALONG VALIDATION PASSED');
