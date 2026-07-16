const stories = [
{
  id: 'ra-ratata',
  title: 'Ra the Ratata and the Rocky Road',
  category: 'Construction Vehicles',
  description: 'Ra uses his noisy breaker and teamwork to clear the road to a new playground.',
  keywords: ['ra','ratata','excavator','breaker','jackhammer','hydraulic','rock','road','construction','playground','teamwork'],
  cover: 'assets/books/ra-ratata/cover.webp',
  pages: Array.from({length:15},(_,i)=>`assets/books/ra-ratata/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
  id: 'po-police-pickup',
  title: 'Po the Police Pickup and the Lost Little Duck',
  category: 'Emergency Vehicles',
  description: 'Po and his emergency-vehicle friends help Pip the duckling find Mama Duck at Sunny Park.',
  keywords: ['po','police','pickup','truck','duck','duckling','pip','mama duck','park','ambulance','helicopter','rescue','teamwork','emergency'],
  cover: 'assets/books/po-police-pickup/cover.webp',
  pages: Array.from({length:15},(_,i)=>`assets/books/po-police-pickup/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
  id: 'mo-motor-grader',
  title: 'Mo the Motor Grader and the Bumpy Road',
  category: 'Construction Vehicles',
  description: 'Mo and his road-crew friends smooth a bumpy country road so everyone can travel safely.',
  keywords: ['mo','motor grader','grader','bumpy road','road crew','roller','dump truck','apple grove','construction','teamwork'],
  cover: 'assets/books/mo-motor-grader/cover.webp',
  pages: Array.from({length:15},(_,i)=>`assets/books/mo-motor-grader/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
  id: 'dan-dump-truck',
  title: 'Dan the Dump Truck and the Busy Bridge',
  category: 'Construction Vehicles',
  description: 'Dan delivers gravel, beams, and one final load to help his friends finish a little bridge.',
  keywords: ['dan','dump truck','bridge','gravel','stones','crane truck','motor grader','roller','construction','teamwork'],
  cover: 'assets/books/dan-dump-truck/cover.webp',
  pages: Array.from({length:15},(_,i)=>`assets/books/dan-dump-truck/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
  id: 'bella-bulldozer',
  title: 'Bella the Bulldozer and the Muddy Path',
  category: 'Construction Vehicles',
  description: 'Bella and her friends clear and strengthen a muddy woodland path for the animals.',
  keywords: ['bella','bulldozer','mud','muddy path','woodland','animals','dump truck','roller','construction','teamwork'],
  cover: 'assets/books/bella-bulldozer/cover.webp',
  pages: Array.from({length:15},(_,i)=>`assets/books/bella-bulldozer/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
  id: 'grave-digger', title: 'Grave Digger and the Moonlight Mud Track', category: 'Monster Trucks',
  description: 'Grave Digger finds a safe path through a giant muddy puddle so the moonlight ride can begin.',
  keywords: ['grave digger','monster jam','monster truck','moonlight','mud','mud track','night ride','teamwork'],
  cover: 'assets/books/grave-digger/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/grave-digger/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
  id: 'el-toro-loco', title: 'El Toro Loco and the Big Red Jump', category: 'Monster Trucks',
  description: 'El Toro Loco tackles the big red jump and helps repair the track so everyone can keep racing.',
  keywords: ['el toro loco','monster jam','monster truck','bull','red jump','ramp','race','teamwork'],
  cover: 'assets/books/el-toro-loco/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/el-toro-loco/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
  id: 'monster-mutt', title: 'Monster Mutt and the Lost Bone Parade', category: 'Monster Trucks',
  description: 'Monster Mutt follows his nose and works with his friends to rescue the missing Bone Parade float.',
  keywords: ['monster mutt','monster jam','monster truck','dog','bone parade','lost bone','parade','teamwork'],
  cover: 'assets/books/monster-mutt/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/monster-mutt/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
  id: 'megalodon', title: 'Megalodon and the Splashy Shortcut', category: 'Monster Trucks',
  description: 'Megalodon discovers loose bridge boards and helps repair the splashy shortcut before the beach parade.',
  keywords: ['megalodon','monster jam','monster truck','shark','beach','splash','shortcut','bridge','parade'],
  cover: 'assets/books/megalodon/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/megalodon/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'monster-mutt-dalmatian', title: 'Monster Mutt Dalmatian and the Firehouse Race', category: 'Monster Trucks',
description: 'Monster Mutt Dalmatian helps prepare the firehouse track, races safely, and stops to help a friend.',
keywords: ['monster mutt dalmatian','monster jam','monster truck','dalmatian','firehouse','race','fire truck','teamwork'],
cover: 'assets/books/monster-mutt-dalmatian/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/monster-mutt-dalmatian/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'zombie-sleepy-stadium', title: 'Zombie and the Sleepy Stadium', category: 'Monster Trucks',
description: 'Zombie and his friends prepare the quiet stadium for a gentle nighttime roll under the stars.',
keywords: ['zombie','monster truck','sleepy stadium','stadium','nighttime','flags','little fans','teamwork','bedtime'],
cover: 'assets/books/zombie-sleepy-stadium/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/zombie-sleepy-stadium/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'towie-stuck-little-van', title: 'Towie the Tow Truck and the Stuck Little Van', category: 'Construction Vehicles',
description: 'Towie makes a careful plan to help Willow out of the mud and bring her safely home.',
keywords: ['towie','tow truck','willow','little van','stuck','mud','cozy corner','rescue','construction','teamwork'],
cover: 'assets/books/towie-stuck-little-van/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/towie-stuck-little-van/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'cranky-wobbly-sign', title: 'Cranky the Crane Truck and the Wobbly Sign', category: 'Construction Vehicles',
description: 'Cranky and his friends work carefully together to make the bakery sign straight and steady again.',
keywords: ['cranky','crane truck','wobbly sign','bright meadow','bakery','bella','construction','repair','teamwork'],
cover: 'assets/books/cranky-wobbly-sign/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/cranky-wobbly-sign/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'lila-rooftop-balloon', title: 'Lila the Ladder Truck and the Rooftop Balloon', category: 'Emergency Vehicles',
description: 'Lila raises her ladder slowly and safely to rescue a little red balloon from the bakery roof.',
keywords: ['lila','ladder truck','fire truck','rooftop balloon','red balloon','sunnyville','bakery','rescue','emergency','teamwork'],
cover: 'assets/books/lila-rooftop-balloon/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/lila-rooftop-balloon/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'chev-camaro', title: 'Chev the Camaro and the Sleepy Speedway', category: 'Race Cars',
description: 'Chev and his friends make the little speedway smooth and safe for a gentle moonlight roll before bed.',
keywords: ['chev','camaro','race car','race cars','speedway','moonlight','safe driving','teamwork','bedtime'],
cover: 'assets/books/chev-camaro/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/chev-camaro/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'dragon-glowing-cave-trail', title: 'Dragon and the Glowing Cave Trail', category: 'Monster Trucks',
description: 'Dragon and his friends follow a glowing crystal trail, help one another, and find a peaceful cave.',
keywords: ['dragon','monster truck','glowing cave','crystals','blue thunder','earth shaker','trail','teamwork','bedtime'],
cover: 'assets/books/dragon-glowing-cave-trail/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/dragon-glowing-cave-trail/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'max-d-twisty-training-track', title: 'Max-D and the Twisty Training Track', category: 'Monster Trucks',
description: 'Max-D practices careful turns and helps his friends make the twisty training track safe and ready.',
keywords: ['max-d','max d','monster truck','twisty track','training track','practice','flags','turns','teamwork','bedtime'],
cover: 'assets/books/max-d-twisty-training-track/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/max-d-twisty-training-track/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'eddie-buried-water-pipe', title: 'Eddie the Excavator and the Buried Water Pipe', category: 'Construction Vehicles',
description: 'Eddie discovers a leaking buried pipe and works carefully with Rory and the construction crew to fix it.',
keywords: ['eddie','excavator','buried water pipe','rory','repair truck','construction','leak','digging','teamwork','bedtime'],
cover: 'assets/books/eddie-buried-water-pipe/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/eddie-buried-water-pipe/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'freddy-smoky-campfire', title: 'Freddy the Fire Engine and the Smoky Campfire', category: 'Emergency Vehicles',
description: 'Freddy and his friends carefully cool a smoky campfire so Pinecone Park can settle down safely for the night.',
keywords: ['freddy','fire engine','fire truck','smoky campfire','pinecone park','camping','fire safety','emergency','teamwork','bedtime'],
cover: 'assets/books/freddy-smoky-campfire/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/freddy-smoky-campfire/page-${String(i+1).padStart(2,'0')}.webp`)
},
{
id: 'tess-quiet-night-drive', title: 'Tess the Tesla and the Quiet Night Drive', category: 'Race Cars',
description: 'Tess enjoys a peaceful evening drive and helps Ollie find his way home through the softly glowing town.',
keywords: ['tess','tesla','electric car','race cars','quiet night drive','ollie','lantern lane','charging','helping','bedtime'],
cover: 'assets/books/tess-quiet-night-drive/cover.webp', pages: Array.from({length:15},(_,i)=>`assets/books/tess-quiet-night-drive/page-${String(i+1).padStart(2,'0')}.webp`)
}
];

stories.forEach(story=>{ if(!Array.isArray(story.narration)) story.narration=[]; });

const $ = id => document.getElementById(id);
let selectedCategory = 'all';
let activeStory = null;
let currentPage = 0; // -1 cover, 0-14 pages
let touchStartX = null;
let visibleStories = stories;
let timerInterval = null;
const speechSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let narrationUtterance = null;
let narrationActive = false;
let narrationPaused = false;
const storage = {
  favorites: 'nolan:favorites',
  fontSize: 'nolan:font-size',
  highContrast: 'nolan:high-contrast',
  timerMinutes: 'nolan:timer-minutes',
  timerEndsAt: 'nolan:timer-ends-at'
};

function readFavorites(){
  try {
    const saved = JSON.parse(localStorage.getItem(storage.favorites) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter(id=>stories.some(story=>story.id===id)) : []);
  } catch { return new Set(); }
}

let favoriteIds = readFavorites();
let fontSize = localStorage.getItem(storage.fontSize)==='large' ? 'large' : 'normal';
let highContrast = localStorage.getItem(storage.highContrast)==='true';
let timerEndsAt = Number(localStorage.getItem(storage.timerEndsAt)) || 0;

function showView(view){
  if(view!=='reader') stopNarration();
  ['library','reader','finished'].forEach(name=>$(`${name}View`).classList.toggle('active', view===name));
  window.scrollTo(0,0);
}

function getCurrentNarrationText(){
  if(!activeStory || currentPage<0 || !Array.isArray(activeStory.narration)) return '';
  const text=activeStory.narration[currentPage];
  return typeof text==='string' ? text.trim() : '';
}

function setNarrationState(state){
  $('narrationStatus').textContent=state;
}

function updateNarrationControls(){
  const hasText=Boolean(getCurrentNarrationText());
  $('readPageButton').disabled=!speechSupported || !hasText;
  $('pauseNarrationButton').disabled=!speechSupported || !hasText || !narrationActive;
  $('restartNarrationButton').disabled=!speechSupported || !hasText;
  $('stopNarrationButton').disabled=!speechSupported || !narrationActive;
  $('narrationUnsupported').hidden=speechSupported;
  $('narrationUnavailable').hidden=!speechSupported || currentPage<0 || hasText;
}

function preferredNarrationVoice(){
  if(!speechSupported) return null;
  const englishVoices=window.speechSynthesis.getVoices().filter(voice=>/^en([-_]|$)/i.test(voice.lang));
  const naturalPattern=/natural|neural|aria|jenny|samantha|google us english/i;
  return englishVoices.find(voice=>voice.lang.toLowerCase()==='en-us' && naturalPattern.test(voice.name))
    || englishVoices.find(voice=>voice.lang.toLowerCase()==='en-us')
    || englishVoices[0]
    || null;
}

function stopNarration(){
  const hadNarration=narrationActive || narrationUtterance;
  narrationUtterance=null;
  narrationActive=false;
  narrationPaused=false;
  if(speechSupported && hadNarration) window.speechSynthesis.cancel();
  setNarrationState('Ready');
  updateNarrationControls();
}

function readCurrentPage(){
  const text=getCurrentNarrationText();
  if(!speechSupported || !text) return;
  stopNarration();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='en-US';
  utterance.rate=.85;
  utterance.pitch=1;
  utterance.volume=1;
  const voice=preferredNarrationVoice();
  if(voice) utterance.voice=voice;
  narrationUtterance=utterance;
  narrationActive=true;
  narrationPaused=false;
  utterance.onstart=()=>{ if(narrationUtterance===utterance){ setNarrationState('Reading'); updateNarrationControls(); } };
  utterance.onpause=()=>{ if(narrationUtterance===utterance){ narrationPaused=true; setNarrationState('Paused'); updateNarrationControls(); } };
  utterance.onresume=()=>{ if(narrationUtterance===utterance){ narrationPaused=false; setNarrationState('Reading'); updateNarrationControls(); } };
  utterance.onend=()=>{ if(narrationUtterance===utterance){ narrationUtterance=null; narrationActive=false; narrationPaused=false; setNarrationState('Ready'); updateNarrationControls(); } };
  utterance.onerror=()=>{ if(narrationUtterance===utterance){ narrationUtterance=null; narrationActive=false; narrationPaused=false; setNarrationState('Ready'); updateNarrationControls(); } };
  setNarrationState('Reading');
  updateNarrationControls();
  window.speechSynthesis.speak(utterance);
}

function pauseOrResumeNarration(){
  if(!speechSupported || !narrationActive) return;
  if(narrationPaused){
    window.speechSynthesis.resume();
    narrationPaused=false;
    setNarrationState('Reading');
  } else {
    window.speechSynthesis.pause();
    narrationPaused=true;
    setNarrationState('Paused');
  }
  updateNarrationControls();
}

function restartCurrentPageNarration(){
  const storyId=activeStory?.id;
  const page=currentPage;
  if(!speechSupported || !getCurrentNarrationText()) return;
  stopNarration();
  setTimeout(()=>{ if(activeStory?.id===storyId && currentPage===page) readCurrentPage(); },0);
}

function isFavorite(story){ return favoriteIds.has(story.id); }
function saveFavorites(){ localStorage.setItem(storage.favorites,JSON.stringify([...favoriteIds])); }

function toggleFavorite(id){
  if(favoriteIds.has(id)) favoriteIds.delete(id); else favoriteIds.add(id);
  saveFavorites();
  renderLibrary();
}

function renderCategoryCounts(){
  const countFor = category => stories.filter(story=>story.category===category).length;
  [['Emergency Vehicles','emergencyCount'],['Construction Vehicles','constructionCount'],['Monster Trucks','monsterCount'],['Race Cars','raceCarsCount']].forEach(([category,id])=>{
    const count=countFor(category);
    $(id).textContent=`${count} ${count===1?'story':'stories'} available`;
  });
}

function renderLibrary(){
  const q = $('searchInput').value.trim().toLowerCase();
  visibleStories = stories.filter(story => {
    const categoryMatch = selectedCategory==='all' || (selectedCategory==='favorites' ? isFavorite(story) : story.category===selectedCategory);
    const haystack = [story.title,story.category,story.description,...story.keywords].join(' ').toLowerCase();
    return categoryMatch && (!q || haystack.includes(q));
  });
  $('storyGrid').innerHTML = visibleStories.map(story => `
    <article class="story-card">
      <div class="cover-wrap"><img src="${story.cover}" alt="Cover of ${story.title}"></div>
      <div class="story-info">
        <span class="story-category">${story.category}</span>
        <h3>${story.title}</h3><p>${story.description}</p>
        <div class="story-meta"><span>📖 ${story.pages.length} pages</span><span>🌙 About 5 min</span></div>
        <div class="card-actions">
          <button class="favorite-button" type="button" data-favorite="${story.id}" aria-pressed="${isFavorite(story)}">${isFavorite(story)?'★ Favorited':'☆ Favorite'}</button>
          <button class="read-button" type="button" data-story="${story.id}">${getProgressLabel(story)}</button>
        </div>
      </div>
    </article>`).join('');
  $('storyCount').textContent = `${visibleStories.length} ${visibleStories.length===1?'story':'stories'}`;
  $('emptyState').hidden = visibleStories.length>0;
  document.querySelectorAll('.read-button').forEach(button=>button.addEventListener('click',()=>openStory(button.dataset.story)));
  document.querySelectorAll('.favorite-button').forEach(button=>button.addEventListener('click',()=>toggleFavorite(button.dataset.favorite)));
  renderCategoryCounts();
}

function getProgressLabel(story){
  const saved = Number(localStorage.getItem(`progress:${story.id}`));
  return Number.isFinite(saved) && saved>=0 && saved<story.pages.length ? `Continue from page ${saved+1}` : 'Read tonight';
}

function openStory(id){
  stopNarration();
  activeStory = stories.find(story=>story.id===id);
  if(!activeStory) return;
  const saved = Number(localStorage.getItem(`progress:${id}`));
  currentPage = Number.isFinite(saved) && saved>=0 && saved<activeStory.pages.length ? saved : -1;
  $('readerTitle').textContent = activeStory.title;
  showView('reader');
  renderPage();
  setTimeout(()=>$('bookStage').focus(),100);
}

function renderPage(){
  if(!activeStory) return;
  stopNarration();
  const isCover=currentPage===-1;
  const src=isCover?activeStory.cover:activeStory.pages[currentPage];
  $('loadingIndicator').style.display='block';
  $('pageImage').style.opacity='.35';
  $('pageImage').onload=()=>{$('loadingIndicator').style.display='none';$('pageImage').style.opacity='1';};
  $('pageImage').src=src;
  $('pageImage').alt=isCover?`Cover of ${activeStory.title}`:`${activeStory.title}, page ${currentPage+1}`;
  $('pageCounter').textContent=isCover?'Cover':`Page ${currentPage+1} of ${activeStory.pages.length}`;
  $('prevButton').disabled=isCover;
  $('prevOverlay').disabled=isCover;
  const atEnd=currentPage===activeStory.pages.length-1;
  $('nextButton').textContent=atEnd?'Finish ✓':'Next →';
  $('progressFill').style.width=`${isCover?0:((currentPage+1)/activeStory.pages.length)*100}%`;
  if(!isCover) localStorage.setItem(`progress:${activeStory.id}`,currentPage);
  updateNarrationControls();
  preloadNearby();
}

function nextPage(){
  if(!activeStory) return;
  if(currentPage<activeStory.pages.length-1){ currentPage++; renderPage(); }
  else { localStorage.removeItem(`progress:${activeStory.id}`); finishStorytime('story'); }
}

function prevPage(){ if(currentPage>-1){ currentPage--; renderPage(); } }

function preloadNearby(){
  [-1,1].forEach(delta=>{const page=currentPage+delta;if(page>=0&&page<activeStory.pages.length){const image=new Image();image.src=activeStory.pages[page];}});
}

function finishStorytime(reason){
  const finishedByTimer=reason==='timer';
  $('finishedTitle').textContent='Storytime is finished';
  $('finishedMessage').textContent=finishedByTimer
    ? 'The gentle timer is done. You can snuggle, say good night, or keep reading whenever you are ready.'
    : 'That was a lovely story. Thank you for sharing a cozy reading moment together.';
  $('readAgainButton').hidden=!activeStory;
  showView('finished');
}

function applyPreferences(){
  document.documentElement.dataset.fontSize=fontSize;
  document.documentElement.dataset.contrast=highContrast ? 'high' : 'normal';
  $('fontSizeSelect').value=fontSize;
  $('contrastToggle').checked=highContrast;
  $('timerSelect').value=localStorage.getItem(storage.timerMinutes) || '0';
}

function openSettings(){
  $('settingsPanel').hidden=false;
  applyPreferences();
  setTimeout(()=>$('closeSettingsButton').focus(),0);
}

function closeSettings(){
  $('settingsPanel').hidden=true;
  $('settingsButton').focus();
}

function formatTimer(milliseconds){
  const seconds=Math.max(0,Math.ceil(milliseconds/1000));
  return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`;
}

function stopTimer(){
  if(timerInterval) clearInterval(timerInterval);
  timerInterval=null;
  timerEndsAt=0;
  localStorage.removeItem(storage.timerEndsAt);
  $('timerStatus').hidden=true;
}

function updateTimerStatus(){
  if(!timerEndsAt){ $('timerStatus').hidden=true; return; }
  const remaining=timerEndsAt-Date.now();
  if(remaining<=0){ stopTimer(); finishStorytime('timer'); return; }
  $('timerStatus').hidden=false;
  $('timerStatus').textContent=`Timer ${formatTimer(remaining)}`;
}

function startTimer(){
  const minutes=Number($('timerSelect').value);
  localStorage.setItem(storage.timerMinutes,String(minutes));
  stopTimer();
  if(!minutes) return;
  timerEndsAt=Date.now()+minutes*60*1000;
  localStorage.setItem(storage.timerEndsAt,String(timerEndsAt));
  updateTimerStatus();
  timerInterval=setInterval(updateTimerStatus,1000);
  closeSettings();
}

function restoreTimer(){
  if(!timerEndsAt) return;
  updateTimerStatus();
  if(timerEndsAt) timerInterval=setInterval(updateTimerStatus,1000);
}

function resetReadingProgress(){
  if(!window.confirm('Reset reading progress for every story on this device?')) return;
  for(let index=localStorage.length-1;index>=0;index--){
    const key=localStorage.key(index);
    if(key && key.startsWith('progress:')) localStorage.removeItem(key);
  }
  renderLibrary();
}

function resetPreferences(){
  if(!window.confirm('Reset favorites and bedtime settings on this device?')) return;
  stopTimer();
  [storage.favorites,storage.fontSize,storage.highContrast,storage.timerMinutes].forEach(key=>localStorage.removeItem(key));
  favoriteIds=new Set();
  fontSize='normal';
  highContrast=false;
  applyPreferences();
  renderLibrary();
}

$('searchInput').addEventListener('input',renderLibrary);
document.querySelectorAll('.category-tab').forEach(tab=>tab.addEventListener('click',()=>{
  selectedCategory=tab.dataset.category;
  document.querySelectorAll('.category-tab').forEach(item=>item.classList.toggle('selected',item===tab));
  $('resultsTitle').textContent=selectedCategory==='all'?'Available stories':selectedCategory==='favorites'?'Favorite stories':selectedCategory;
  renderLibrary();
}));
$('surpriseButton').addEventListener('click',()=>{
  const choices=visibleStories.length?visibleStories:stories;
  openStory(choices[Math.floor(Math.random()*choices.length)].id);
});
$('homeButton').addEventListener('click',()=>{ showView('library'); renderLibrary(); });
$('backButton').addEventListener('click',()=>{ showView('library'); renderLibrary(); });
$('restartButton').addEventListener('click',()=>{ currentPage=-1; renderPage(); });
$('nextButton').addEventListener('click',nextPage); $('nextOverlay').addEventListener('click',nextPage);
$('prevButton').addEventListener('click',prevPage); $('prevOverlay').addEventListener('click',prevPage);
$('readPageButton').addEventListener('click',readCurrentPage);
$('pauseNarrationButton').addEventListener('click',pauseOrResumeNarration);
$('restartNarrationButton').addEventListener('click',restartCurrentPageNarration);
$('stopNarrationButton').addEventListener('click',stopNarration);
$('finishedLibraryButton').addEventListener('click',()=>{ showView('library'); renderLibrary(); });
$('readAgainButton').addEventListener('click',()=>{ if(activeStory) openStory(activeStory.id); });
$('settingsButton').addEventListener('click',openSettings);
$('closeSettingsButton').addEventListener('click',closeSettings);
document.querySelector('[data-close-settings]').addEventListener('click',closeSettings);
$('timerStatus').addEventListener('click',openSettings);
$('fontSizeSelect').addEventListener('change',event=>{ fontSize=event.target.value; localStorage.setItem(storage.fontSize,fontSize); applyPreferences(); });
$('contrastToggle').addEventListener('change',event=>{ highContrast=event.target.checked; localStorage.setItem(storage.highContrast,String(highContrast)); applyPreferences(); });
$('timerSelect').addEventListener('change',event=>localStorage.setItem(storage.timerMinutes,event.target.value));
$('startTimerButton').addEventListener('click',startTimer);
$('resetProgressButton').addEventListener('click',resetReadingProgress);
$('resetPreferencesButton').addEventListener('click',resetPreferences);
$('fullscreenButton').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{}});
document.addEventListener('keydown',event=>{
  if(!$('settingsPanel').hidden && event.key==='Escape'){ closeSettings(); return; }
  if(!$('readerView').classList.contains('active')) return;
  if(event.target.closest?.('.narration-panel') && event.key!=='Escape') return;
  if(['ArrowRight',' ','Enter'].includes(event.key)){ event.preventDefault(); nextPage(); }
  if(['ArrowLeft','Backspace'].includes(event.key)){ event.preventDefault(); prevPage(); }
  if(event.key==='Escape'&&!document.fullscreenElement){ showView('library'); renderLibrary(); }
});
$('bookStage').addEventListener('touchstart',event=>touchStartX=event.changedTouches[0].clientX,{passive:true});
$('bookStage').addEventListener('touchend',event=>{if(touchStartX===null)return;const distance=event.changedTouches[0].clientX-touchStartX;if(Math.abs(distance)>55)(distance<0?nextPage:prevPage)();touchStartX=null;},{passive:true});

applyPreferences();
renderLibrary();
restoreTimer();
updateNarrationControls();
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
