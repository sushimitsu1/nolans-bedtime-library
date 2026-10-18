/* Shared touch-first games. Story data and story storage remain independent. */
(() => {
  'use strict';
  const root = document.getElementById('gamesView');
  const key = 'nolan-games-v1';
  const defaults = {points:0, narration:true, effects:true, rewards:true, levels:{}};
  let prefs;
  try { prefs = {...defaults, ...JSON.parse(localStorage.getItem(key) || '{}')}; } catch { prefs = {...defaults}; }
  prefs.points = Number.isSafeInteger(prefs.points) && prefs.points >= 0 ? prefs.points : 0;
  prefs.levels = prefs.levels && typeof prefs.levels === 'object' ? prefs.levels : {};
  const retired=['bramble','aster','posy','willa','hazel','coby','cora','saffy','nova','toby'];
  if(retired.some(id=>Object.hasOwn(prefs.levels,id))){
    for(const id of retired)delete prefs.levels[id];
    try { localStorage.setItem(key, JSON.stringify(prefs)); } catch { /* Storage is optional. */ }
  }
  let active = null, state = null, audio = null, down = null;
  const games = [];
  const save = () => { try { localStorage.setItem(key, JSON.stringify(prefs)); } catch { /* Play still works if storage is unavailable. */ } };
  let speechRun=0;
  function say(message) {
    const run=++speechRun;
    if (!prefs.narration || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    speechSynthesis.cancel();
    const parts=(Array.isArray(message)?message:[message]).flat().filter(Boolean);
    function next(i) {
      if(run!==speechRun || i>=parts.length)return;
      const part=typeof parts[i]==='string'?{text:parts[i]}:parts[i];
      const utterance=new SpeechSynthesisUtterance(part.text);utterance.rate=part.rate||.78;utterance.volume=.65;
      utterance.onend=()=>setTimeout(()=>next(i+1),part.pause||0);
      speechSynthesis.speak(utterance);
    }
    next(0);
  }
  function sound(kind = 'chime') {
    if (!prefs.effects) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume();
      const gain = audio.createGain(), now = audio.currentTime;
      gain.connect(audio.destination); gain.gain.setValueAtTime(.035,now); gain.gain.exponentialRampToValueAtTime(.001,now+.8);
      if (kind === 'river' || kind === 'park') {
        const buffer = audio.createBuffer(1, audio.sampleRate*.8, audio.sampleRate), data = buffer.getChannelData(0);
        for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*(kind==='park' ? .5+.5*Math.sin(i/1800) : 1);
        const source=audio.createBufferSource(), filter=audio.createBiquadFilter(); source.buffer=buffer; filter.type='lowpass';filter.frequency.value=kind==='river'?650:1800;source.connect(filter);filter.connect(gain);source.start();source.stop(now+.8);
      } else {
        const oscillator=audio.createOscillator(); oscillator.frequency.value=kind==='town'?440:kind==='bell'?784:kind==='triangle'?587:kind==='drum'?220:660; oscillator.type='sine';oscillator.connect(gain);oscillator.start();oscillator.stop(now+.8);
      }
    } catch { /* Visual cues always remain available. */ }
  }
  function award(points) { prefs.points += points; save(); sound(); }
  function button(icon, label, action, extra='') { return `<button type="button" aria-label="${label}" data-action="${action}" ${extra}>${icon}</button>`; }
  function token(value, icon, label=value, extra='') { return button(icon, label, 'choice', `class="game-token" data-value="${value}" ${extra}`); }
  function tools() {return `<div class="game-tools">${button('← Games Home','Games home','home')}${active?.phonics&&!state?.task?.tiles?'':button('↻','Repeat instruction or sound','repeat')}${button(prefs.narration||prefs.effects?'🔈':'🔇','Toggle sound','sound')}${button('🌙','Finish peacefully','finish')}</div>`;}
  let filter="All";
  const category=g=>g.category||'Letters';
  const stops=(n,total=8)=>`<span class="progress-stops" aria-label="Stop ${n} of ${total}">${Array.from({length:total},(_,i)=>`<i class="${i<n-1?'passed':i===n-1?'current':''}"></i>`).join('')}</span>`;
  function home() {
    leave(); active=null; state=null;
    const order=['rollo','lulu','dax','sunny','bex','rhymo','zumi','bo','otto','fam','kip','tap-tap'];
    root.innerHTML=`<div class="hub-heading"><div><h1>Little journeys, big discoveries</h1><p>Choose a friend. Let’s make something happen.</p></div><span>★ ${Math.floor(prefs.points/5)}</span></div><div class="filter-wrap"><div class="game-filters">${['All','Counting','Patterns','Letters'].map(c=>`<button type="button" data-action="filter" data-filter="${c}" aria-pressed="${filter===c}">${c} <small>${games.filter(g=>c==='All'||category(g)===c).length}</small></button>`).join('')}</div><span class="scroll-cue" aria-hidden="true">›</span></div><div class="game-grid">${order.map(id=>games.find(g=>g.id===id)).filter(g=>g&&(filter==='All'||category(g)===filter)).map(g=>`<button type="button" class="game-card" data-action="open" data-id="${g.id}" aria-label="${g.title}"><img src="${g.art}" alt="${g.friend}"><span class="card-title">${g.shortTitle||g.title.replace(/.*’s /,'').replace('Fam the Word Family Truck','Word Families').replace('Tap-Tap Sound Steps','Sound Steps')}</span><small class="card-friend">with ${g.friend}</small>${stops(level(g.id))}</button>`).join('')}</div>`;
  }
  function parent() {
    const panel=document.getElementById('grownupGameSettings'); if(!panel) return; panel.hidden=false;
    panel.innerHTML=`<h2>Game settings</h2>${['narration','effects','rewards'].map(k=>`<label><input type="checkbox" data-pref="${k}" ${prefs[k]?'checked':''}>${({narration:'Spoken prompts',effects:'Soft sounds',rewards:'Show bedtime stars here',easy:'Easier activity set',memory:'Sleepy Pairs: pictures face down'})[k]}</label>`).join('')}<div class="game-sky" ${prefs.rewards?'':'hidden'}>${'⭐'.repeat(Math.min(40,Math.floor(prefs.points/5))) || '🌌'}<p>${prefs.points} points · ${Math.floor(prefs.points/5)} stars</p></div>`;
  }
  function level(id) { return Math.min(8, Math.max(1, Number.isInteger(prefs.levels[id]) ? prefs.levels[id] : 1)); }
  function open(id) {
    active=games.find(g=>g.id===id); if(!active)return;
    state=active.start(level(id));state.level=level(id);state.done=false;state.hint=null;state.demonstration=false;render();repeat();
  }
  function render() {
    if(active.vehicle){renderVehicle();return;}
    root.innerHTML=`${tools()}<div data-level="${state.level}" data-round="${state.round}" class="game-board ${active.phonics?'phonics-board':''} ${state.done?'resting':''}"><div class="game-scene"><img src="${state.done?active.art.replace('page-01','page-15'):active.art}" alt="${active.friend}"><div class="scene-overlay">${state.done?'🌙 💤':stops(state.round+1,3)}</div></div><div class="game-instruction" aria-live="polite">${state.done?state.completed?'⭐ Level complete! '+(state.level<8?'Next: level '+(state.level+1):'All eight levels mastered. Play again!'):'🌙 Rest time. Play again whenever you like.':active.prompt(state)}</div>${state.done?`<div class="game-cue">🌙 💤</div>${button('▶️','Play next level','next')}${button('🏠','Goodbye and return to games','home')}`:active.board(state,prefs)}</div>`;
    if(!state.done && (state.hint!==null || state.demonstration)) {
      const value=state.hint ?? active.answer(state); const target=[...root.querySelectorAll('[data-value]')].find(b=>b.dataset.value===String(value));
      if(target){target.classList.add('hint');if(state.demonstration)target.insertAdjacentHTML('beforeend','<span class="demo-hand" aria-hidden="true">👆</span>');}
    }
  }
  function repeat(){if(active&&!state.done){say(active.speech?active.speech(state):active.vehicle&&state.level===1?[active.prompt(state),'Tap a piece, then its glowing home. You can drag it too.']:active.prompt(state));if(active.listen)active.listen(state,sound);}}
  function finish(message){if(!active || state.done)return;if(active.vehicle){home();return;}state.done=true;render();say(message||'Thank you for helping. Goodnight, '+active.friend+'.');}
  function choose(value) {
    if(!active||state.done)return;
    state.demonstration=false;
    const spoken=active.choiceSpeech?.(state,value) ?? [...root.querySelectorAll('[data-value]')].find(b=>b.dataset.value===value)?.getAttribute('aria-label');
    const result=active.choose(state,value,prefs);
    if(result.points)award(result.points);
    state.hint=result.hint??null;
    if(result.done){state.completed=true;prefs.levels[active.id]=Math.min(8,state.level+1);award(2);finish(spoken?[spoken,'Wonderful listening! Level complete.']:undefined);return;}
    render();say([spoken,result.message||(active.speech?active.speech(state):active.prompt(state))].flat());if(result.advance&&active.listen)active.listen(state,sound);
  }
  function leave(){speechRun++;if(window.speechSynthesis)speechSynthesis.cancel();if(audio)audio.suspend();down=null;}
  function dispatch(b){switch(b.dataset.action){case 'filter':filter=b.dataset.filter;home();break;case 'next':open(active.id);break;case 'open':open(b.dataset.id);break;case 'piece':selectPiece(b.dataset.value);break;case 'place':placePiece(b.dataset.slot);break;case 'depart':depart();break;case 'recount':say(active.recount(state));break;case 'choice':choose(b.dataset.value);break;case 'home':home();break;case 'repeat':repeat();break;case 'finish':finish();break;case 'sound':prefs.narration=!(prefs.narration||prefs.effects);prefs.effects=prefs.narration;save();leave();render();break;case 'parent':parent();break;}}
  root.addEventListener('click',e=>{if(e.detail===0){const b=e.target.closest('button');if(b)dispatch(b);}});
  document.getElementById('gamesTab').addEventListener('click',e=>{if(e.detail===0){showView('games');home();}});
  document.getElementById('storiesTab').addEventListener('click',e=>{if(e.detail===0){showView('library');renderLibrary();}});
  // A tap must end on the same button; scrolling and cancelled touches never choose.
  // Drag pieces: capture the pointer and cancel the browser's own long-press behaviour (text selection,
  // copy callout, image drag) so a long hold still drags, and a long hold then release still counts as a tap.
  function resetDrag(){if(down){down.b.style.transform='';down.b.classList.remove('dragging');}down=null;}
  root.addEventListener('pointerdown',e=>{if(e.isPrimary===false||e.button>0)return;const b=e.target.closest('button');if(b&&!b.disabled){if(down)resetDrag();down={b,x:e.clientX,y:e.clientY,id:e.pointerId};if(b.dataset.drag){e.preventDefault();if(e.isTrusted)try{b.setPointerCapture(e.pointerId);}catch{}b.classList.add('dragging');}}});
  root.addEventListener('touchstart',e=>{if(e.target instanceof Element&&e.target.closest('button[data-drag]:not(:disabled)'))e.preventDefault();},{passive:false});
  root.addEventListener('lostpointercapture',e=>{if(down?.id===e.pointerId&&down.b===e.target)resetDrag();});
  document.addEventListener('lostpointercapture',e=>{if(down?.id===e.pointerId&&!down.b.isConnected)resetDrag();});
  window.addEventListener('blur',resetDrag);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetDrag();});
  root.addEventListener('pointermove',e=>{if(down?.id===e.pointerId&&down.b.dataset.drag){down.b.style.transform=`translate(${e.clientX-down.x}px,${e.clientY-down.y}px)`;}});
  root.addEventListener('pointerup',e=>{const tap=down;down=null;if(!tap||tap.id!==e.pointerId)return;tap.b.style.transform='';tap.b.classList.remove('dragging');const moved=Math.hypot(e.clientX-tap.x,e.clientY-tap.y);if(tap.b.dataset.drag&&moved>=24){const slot=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]')||[...root.querySelectorAll('[data-slot]')].find(el=>{const r=el.getBoundingClientRect();return e.clientX>=r.left-20&&e.clientX<=r.right+20&&e.clientY>=r.top-20&&e.clientY<=r.bottom+20;});if(slot){if(active.vehicle){selectPiece(tap.b.dataset.value);placePiece(slot.dataset.slot);}else{choose(tap.b.dataset.value);choose(slot.dataset.value);}}return;}if(moved<24&&tap.b===e.target.closest('button'))dispatch(tap.b);});
  root.addEventListener('pointercancel',e=>{if(!down||down.id===e.pointerId)resetDrag();});
  document.getElementById('grownupGameSettings').addEventListener('change',e=>{const k=e.target.dataset.pref;if(k&&Object.hasOwn(defaults,k)){prefs[k]=e.target.checked;save();}});
  parent();
  root.addEventListener('change',e=>{const k=e.target.dataset.pref;if(k&&Object.hasOwn(defaults,k)){prefs[k]=e.target.checked;save();parent();parent();}});
  document.getElementById('gamesTab').addEventListener('pointerup',()=>{showView('games');home();});
  document.getElementById('storiesTab').addEventListener('pointerup',()=>{showView('library');renderLibrary();});
  function celebration(){return `<div class="celebration"><b>★ Wonderful teamwork!</b><p>Three little journeys complete.</p>${button('Play next stop →','Play next level','next')}${button('Games Home','Games home','home')}</div>`;}
  function renderVehicle(){
    root.innerHTML=`${tools()}<div class="vehicle-board ${state.done?'resting':''}" data-level="${state.level}" data-round="${state.round}"><div class="mission-heading"><span>STOP ${state.level} / 8 · MISSION ${state.round+1} / 3</span><h2 aria-live="polite">${active.prompt(state)}</h2>${stops(state.level)}</div><div class="play-world"><div class="vehicle-scene ${active.id}" data-world>${active.scene(state)}</div><div class="cargo-tray">${state.done?celebration():state.ready?button('Let’s go! →','Deliver and continue','depart','class="depart-button"'):active.board(state)}</div></div><p class="play-hint" aria-live="polite">Tap a piece, then its glowing home. Or drag it there.</p></div>`;
  }
  function selectPiece(value){if(state.done||state.moving)return;state.selected=value;root.querySelectorAll('[data-action="piece"]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===value)));sound(active.id==='otto'?['bell','triangle','drum'][Number(value)]||'town':'town');say(root.querySelector(`[data-action="piece"][data-value="${value}"]`)?.getAttribute('aria-label'));}
  function placePiece(slot){
    if(!active?.vehicle||state.done||state.moving)return;
    if(state.selected===null){say('Choose a piece first.');return;}
    const result=active.place(state,state.selected,slot);state.selected=null;
    if(!result.ok){root.querySelector('.play-hint').textContent=result.message;say(result.message);return;}
    sound(result.tone||'town');say(result.message);active.update(state,root);
    root.querySelectorAll('[data-action="piece"]').forEach(b=>b.setAttribute('aria-pressed','false'));
    if(result.ready){const tray=root.querySelector('.cargo-tray');tray.innerHTML=button('Let’s go! →','Deliver and continue','depart','class="depart-button"');root.querySelector('.play-hint').textContent='Ready! Tap Let’s go to send your friend on the journey.';}
  }
  function depart(){
    if(state.moving||state.done)return;state.moving=true;root.querySelector('[data-world]').classList.add('departing');sound();say(active.departSpeech(state));
    if(active.id==='otto')active.playPattern(state,sound);
    const travelingState=state;setTimeout(()=>{if(!active?.vehicle||state!==travelingState||!state?.moving)return;state.round++;award(3);
      if(state.round===3){state.done=true;state.completed=true;prefs.levels[active.id]=Math.min(8,state.level+1);award(2);root.querySelector('.vehicle-board').classList.add('resting');root.querySelector('.cargo-tray').innerHTML=`<div class="celebration"><b>★ Wonderful teamwork!</b><p>Three little journeys complete.</p>${button('Play next stop →','Play next level','next')}${button('Games Home','Games home','home')}</div>`;root.querySelector('.play-hint').textContent='Tap your friend for one more happy sound.';root.querySelector('[data-world]').onclick=()=>sound();say('Wonderful teamwork! You finished this stop.');}
      else{active.mission(state);state.moving=false;render();repeat();}
    },matchMedia('(prefers-reduced-motion: reduce)').matches?80:1100);
  }
  window.NolanGames={register(game){games.push(game);},token,button,leave,sound};
})();
