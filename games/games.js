/* Shared touch-first games. Story data and story storage remain independent. */
(() => {
  'use strict';
  const root = document.getElementById('gamesView');
  const key = 'nolan-games-v1';
  const defaults = {points:0, narration:true, effects:true, rewards:true, easy:false, memory:false};
  let prefs;
  try { prefs = {...defaults, ...JSON.parse(localStorage.getItem(key) || '{}')}; } catch { prefs = {...defaults}; }
  prefs.points = Number.isSafeInteger(prefs.points) && prefs.points >= 0 ? prefs.points : 0;
  let active = null, state = null, audio = null, down = null;
  const games = [];
  const save = () => { try { localStorage.setItem(key, JSON.stringify(prefs)); } catch { /* Play still works if storage is unavailable. */ } };
  function say(message) {
    if (!prefs.narration || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message); utterance.rate = .78; utterance.volume = .65;
    speechSynthesis.speak(utterance);
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
        const oscillator=audio.createOscillator(); oscillator.frequency.value=kind==='town'?440:660; oscillator.type='sine';oscillator.connect(gain);oscillator.start();oscillator.stop(now+.8);
      }
    } catch { /* Visual cues always remain available. */ }
  }
  function award(points) { prefs.points += points; save(); sound(); }
  function button(icon, label, action, extra='') { return `<button type="button" aria-label="${label}" data-action="${action}" ${extra}>${icon}</button>`; }
  function token(value, icon, label=value, extra='') { return button(icon, label, 'choice', `class="game-token" data-value="${value}" ${extra}`); }
  function tools() {return `<div class="game-tools">${button('🏠','Games home','home')}${button('🔊','Repeat instruction or sound','repeat')}${button(prefs.narration||prefs.effects?'🔈':'🔇','Toggle sound','sound')}${button('🌙','Finish peacefully','finish')}</div>`;}
  function home() {
    leave(); active=null; state=null;
    root.innerHTML=`<div class="game-tools">${button('⚙️','Game parent controls','parent')}</div><div id="gameParent" class="game-parent" hidden></div><h1>Help a sleepy friend</h1><div class="game-grid">${games.map(g=>`<button type="button" class="game-card" data-action="open" data-id="${g.id}" aria-label="${g.title}"><img src="${g.art}" alt="${g.friend}"><span>${g.icon} ${g.title}</span></button>`).join('')}</div>`;
  }
  function parent() {
    const panel=root.querySelector('#gameParent'); if(!panel) return; panel.hidden=!panel.hidden;
    panel.innerHTML=`<h2>Game settings</h2>${['narration','effects','rewards','easy','memory'].map(k=>`<label><input type="checkbox" data-pref="${k}" ${prefs[k]?'checked':''}>${({narration:'Spoken prompts',effects:'Soft sounds',rewards:'Show bedtime stars here',easy:'Easier activity set',memory:'Sleepy Pairs: pictures face down'})[k]}</label>`).join('')}<div class="game-sky" ${prefs.rewards?'':'hidden'}>${'⭐'.repeat(Math.min(40,Math.floor(prefs.points/5))) || '🌌'}<p>${prefs.points} points · ${Math.floor(prefs.points/5)} stars</p></div>`;
  }
  function open(id) {
    active=games.find(g=>g.id===id); if(!active)return;
    state=active.start(prefs);state.done=false;state.hint=null;state.demonstration=true;render();repeat();
  }
  function render() {
    root.innerHTML=`${tools()}<div class="game-board ${state.done?'resting':''}"><div class="game-scene"><img src="${active.art}" alt="${active.friend}"><div class="scene-overlay">${state.done?'🌙 💤':active.scene(state)}</div></div><div class="game-instruction" aria-live="polite">${state.done?'Goodnight, '+active.friend+'.':active.prompt(state)}</div>${state.done?`<div class="game-cue">🌙 💤</div>${button('🏠','Goodbye and return to games','home')}`:active.board(state,prefs)}</div>`;
    if(!state.done && (state.hint!==null || state.demonstration)) {
      const value=state.hint ?? active.answer(state); const target=[...root.querySelectorAll('[data-value]')].find(b=>b.dataset.value===String(value));
      if(target){target.classList.add('hint');if(state.demonstration)target.insertAdjacentHTML('beforeend','<span class="demo-hand" aria-hidden="true">👆</span>');}
    }
  }
  function repeat(){if(active&&!state.done){say(active.prompt(state));if(active.listen)active.listen(state,sound);}}
  function finish(){if(!active || state.done)return;state.done=true;render();say('Thank you for helping. Goodnight, '+active.friend+'.');}
  function choose(value) {
    if(!active||state.done)return;
    state.demonstration=false;
    const result=active.choose(state,value,prefs);
    if(result.points)award(result.points);
    state.hint=result.hint??null;
    if(result.done){award(2);finish();return;}
    render();say(result.message||active.prompt(state));if(result.advance&&active.listen)active.listen(state,sound);
  }
  function leave(){if(window.speechSynthesis)speechSynthesis.cancel();if(audio)audio.suspend();down=null;}
  function dispatch(b){switch(b.dataset.action){case 'open':open(b.dataset.id);break;case 'choice':choose(b.dataset.value);break;case 'home':home();break;case 'repeat':repeat();break;case 'finish':finish();break;case 'sound':prefs.narration=!(prefs.narration||prefs.effects);prefs.effects=prefs.narration;save();leave();render();break;case 'parent':parent();break;}}
  // A tap must end on the same button; scrolling and cancelled touches never choose.
  root.addEventListener('pointerdown',e=>{if(e.isPrimary===false||e.button>0)return;const b=e.target.closest('button');if(b&&!b.disabled)down={b,x:e.clientX,y:e.clientY,id:e.pointerId};});
  root.addEventListener('pointerup',e=>{const tap=down;down=null;if(tap&&tap.id===e.pointerId&&tap.b===e.target.closest('button')&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<24)dispatch(tap.b);});
  root.addEventListener('pointercancel',()=>{down=null;});
  root.addEventListener('change',e=>{const k=e.target.dataset.pref;if(k&&Object.hasOwn(defaults,k)){prefs[k]=e.target.checked;save();parent();parent();}});
  document.getElementById('gamesTab').addEventListener('pointerup',()=>{showView('games');home();});
  document.getElementById('storiesTab').addEventListener('pointerup',()=>{showView('library');renderLibrary();});
  window.NolanGames={register(game){games.push(game);},token,button,leave,sound};
})();
