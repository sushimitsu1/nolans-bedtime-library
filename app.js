const stories = [
{
  id: 'ra-ratata',
  title: 'Ra the Ratata and the Rocky Road',
  category: 'Construction Vehicles',
  description: 'Ra uses his noisy breaker and teamwork to clear the road to a new playground.',
  keywords: ['ra','ratata','excavator','breaker','jackhammer','hydraulic','rock','road','construction','playground','teamwork'],
  cover: 'assets/books/ra-ratata/cover.png',
  pages: Array.from({length:15},(_,i)=>`assets/books/ra-ratata/page-${String(i+1).padStart(2,'0')}.png`)
},
{
  id: 'po-police-pickup',
  title: 'Po the Police Pickup and the Lost Little Duck',
  category: 'Emergency Vehicles',
  description: 'Po and his emergency-vehicle friends help Pip the duckling find Mama Duck at Sunny Park.',
  keywords: ['po','police','pickup','truck','duck','duckling','pip','mama duck','park','ambulance','helicopter','rescue','teamwork','emergency'],
  cover: 'assets/books/po-police-pickup/cover.png',
  pages: Array.from({length:15},(_,i)=>`assets/books/po-police-pickup/page-${String(i+1).padStart(2,'0')}.png`)
}
];

const $ = id => document.getElementById(id);
let selectedCategory = 'all';
let activeStory = null;
let currentPage = 0; // -1 cover, 0-14 pages
let touchStartX = null;

function showView(view){
  $('libraryView').classList.toggle('active', view==='library');
  $('readerView').classList.toggle('active', view==='reader');
  window.scrollTo(0,0);
}

function renderLibrary(){
  const q = $('searchInput').value.trim().toLowerCase();
  const filtered = stories.filter(s => {
    const categoryMatch = selectedCategory==='all' || s.category===selectedCategory;
    const haystack = [s.title,s.category,s.description,...s.keywords].join(' ').toLowerCase();
    return categoryMatch && (!q || haystack.includes(q));
  });
  $('storyGrid').innerHTML = filtered.map(s => `
    <article class="story-card">
      <div class="cover-wrap"><img src="${s.cover}" alt="Cover of ${s.title}"></div>
      <div class="story-info">
        <span class="story-category">${s.category}</span>
        <h3>${s.title}</h3><p>${s.description}</p>
        <div class="story-meta"><span>📖 15 pages</span><span>🌙 About 5 min</span></div>
        <button class="read-button" data-story="${s.id}">${getProgressLabel(s)}</button>
      </div>
    </article>`).join('');
  $('storyCount').textContent = `${filtered.length} ${filtered.length===1?'story':'stories'}`;
  $('emptyState').hidden = filtered.length>0;
  document.querySelectorAll('.read-button').forEach(b=>b.addEventListener('click',()=>openStory(b.dataset.story)));
}

function getProgressLabel(story){
  const saved = Number(localStorage.getItem(`progress:${story.id}`));
  return Number.isFinite(saved) && saved>0 && saved<story.pages.length ? `Continue from page ${saved+1}` : 'Read tonight';
}

function openStory(id){
  activeStory = stories.find(s=>s.id===id);
  const saved = Number(localStorage.getItem(`progress:${id}`));
  currentPage = Number.isFinite(saved) && saved>=0 && saved<activeStory.pages.length ? saved : -1;
  $('readerTitle').textContent = activeStory.title;
  showView('reader');
  renderPage();
  setTimeout(()=>$('bookStage').focus(),100);
}

function renderPage(){
  if(!activeStory) return;
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
  preloadNearby();
}

function nextPage(){
  if(!activeStory)return;
  if(currentPage<activeStory.pages.length-1){currentPage++;renderPage();}
  else {localStorage.removeItem(`progress:${activeStory.id}`);showView('library');renderLibrary();}
}
function prevPage(){if(currentPage>-1){currentPage--;renderPage();}}
function preloadNearby(){
  [-1,1].forEach(delta=>{const p=currentPage+delta;if(p>=0&&p<activeStory.pages.length){const img=new Image();img.src=activeStory.pages[p];}});
}

$('searchInput').addEventListener('input',renderLibrary);
document.querySelectorAll('.category-tab').forEach(tab=>tab.addEventListener('click',()=>{
  selectedCategory=tab.dataset.category;
  document.querySelectorAll('.category-tab').forEach(t=>t.classList.toggle('selected',t===tab));
  $('resultsTitle').textContent=selectedCategory==='all'?'Available stories':selectedCategory;
  renderLibrary();
}));
$('homeButton').addEventListener('click',()=>{showView('library');renderLibrary();});
$('backButton').addEventListener('click',()=>{showView('library');renderLibrary();});
$('restartButton').addEventListener('click',()=>{currentPage=-1;renderPage();});
$('nextButton').addEventListener('click',nextPage);$('nextOverlay').addEventListener('click',nextPage);
$('prevButton').addEventListener('click',prevPage);$('prevOverlay').addEventListener('click',prevPage);
$('fullscreenButton').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{}});
document.addEventListener('keydown',e=>{if(!$('readerView').classList.contains('active'))return;if(['ArrowRight',' ','Enter'].includes(e.key)){e.preventDefault();nextPage();}if(['ArrowLeft','Backspace'].includes(e.key)){e.preventDefault();prevPage();}if(e.key==='Escape'&&!document.fullscreenElement){showView('library');renderLibrary();}});
$('bookStage').addEventListener('touchstart',e=>touchStartX=e.changedTouches[0].clientX,{passive:true});
$('bookStage').addEventListener('touchend',e=>{if(touchStartX===null)return;const dx=e.changedTouches[0].clientX-touchStartX;if(Math.abs(dx)>55)(dx<0?nextPage:prevPage)();touchStartX=null;},{passive:true});

if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
renderLibrary();
