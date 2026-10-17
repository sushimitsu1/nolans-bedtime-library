/* Jasper's independent, touch-first math practice. */
(() => {
  'use strict';
  const games = [
    ['addition','Moonlight Sums','Regroup, find missing parts and reason.'],
    ['subtraction','Borrowing Bridge','Subtract with regrouping.'],
    ['times','Star Table Trail','Use arrays, equal groups and times facts.'],
    ['division','Remainder Railway','Divide and find what is left over.'],
    ['place','Number Builders','Explore place value and expanded form.'],
    ['fractions','Fraction Lanterns','Explore parts, sets and equal fractions.'],
    ['words','Adventure Maths','Solve one and two step adventures.'],
    ['missing','Mystery Numbers','Fill the gap in an equation.'],
    ['measure','Clockwork Corner','Work with time, money and metric units.'],
    ['speed','Starlight Sprint','Try a gentle timed mix of maths.']
  ];
  const mathGames = games.slice();
  games.push(...window.QuizmoCogat.games);
  const isCogat = id => window.QuizmoCogat.games.some(g=>g[0]===id);
  const root = document.getElementById('quizmoView');
  let saved;
  try { saved = JSON.parse(localStorage.getItem('jasper-quizmo') || '{}'); } catch {}
  const progress = {score: Number.isSafeInteger(saved?.score) && saved.score >= 0 ? saved.score : 0, levels:{}, stars:{}, best:{}};
  for (const [id] of games) {
    progress.levels[id] = Math.max(1, Math.min(8, Number.isInteger(saved?.levels?.[id]) ? saved.levels[id] : 1));
    progress.stars[id] = Math.max(0, Math.min(8, Number.isInteger(saved?.stars?.[id]) ? saved.stars[id] : 0));
    progress.best[id] = Math.max(progress.stars[id], Math.max(0, Math.min(8, Number.isInteger(saved?.best?.[id]) ? saved.best[id] : 0)));
  }
  const natural = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
  progress.points = {current:natural(saved?.points?.current ?? saved?.score), lifetime:natural(saved?.points?.lifetime ?? saved?.score), milestones:natural(saved?.points?.milestones)};
  progress.requests = Array.isArray(saved?.requests) ? saved.requests.filter(r=>r && typeof r.name==='string' && typeof r.about==='string').map(r=>({...r,built:!!r.built})) : [];
  progress.runs = saved?.runs && typeof saved.runs==='object' ? saved.runs : {};
  progress.recent={};
  for(const [id] of games) progress.recent[id]=Array.isArray(saved?.recent?.[id])?saved.recent[id].filter(s=>typeof s==='string').slice(-30):[];
  let run, tasks=[], rewardDismissed=false;
  // Points rules (math and CogAT): each of the five correct question slots earns
  // 1 + floor(level / 2). Completion earns 5 * level, plus 10 on first completion.
  // Already beaten levels earn half of question/completion points, floored, min 1.
  // Persisted best tracks the highest completion ever, including before a reset,
  // and migrates from stars. Reset clears stars and the run, but best preserves
  // replay rates and prevents earning the first-completion bonus again.
  // A persisted run pays each slot and completion once; Restart retains that run,
  // its level and replay rate, even after completion or reload. Play next round
  // starts a fresh run. 100 current points buys one request; overflow and lifetime
  // remain. Milestones counts requests redeemed. Legacy score migrates to current/lifetime points and remains compatible.
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const meter = () => `<div class="quizmo-points"><strong>${progress.points.current} points</strong><progress max="100" value="${Math.min(100,progress.points.current)}" aria-label="Points toward a game request"></progress><small>${progress.points.current>=100?'Game request ready!':`${100-progress.points.current} to a game request`}</small>${progress.points.current>=100?button('Request a game!','reward'):''}</div>`;
  function award(n) { const before=progress.points.current;progress.points.current+=n;progress.points.lifetime+=n;save();if(before<100&&progress.points.current>=100){rewardDismissed=false;reward();} }
  function earned() { if(!run.paid.includes(count)){run.paid.push(count);progress.score+=10;award(run.replay?Math.max(1,Math.floor((1+Math.floor(run.level/2))/2)):1+Math.floor(run.level/2));} }
  function reward() {
    if(progress.points.current<100 || document.getElementById('quizmoReward'))return;
    const dialog=document.createElement('dialog');dialog.id='quizmoReward';dialog.className='quizmo-reward';
    dialog.innerHTML=`<form><div class="reward-sparkles" aria-hidden="true">🎉 ✨ ⭐ ✨ 🎉</div><h2>Request a game!</h2><p>You earned a game idea for the grown-ups!</p><label>Game name<input name="name" maxlength="80" required></label><div class="reward-chips">${['Space explorers','Dinosaur puzzles','Ocean adventure'].map(n=>`<button type="button" data-idea="${n}">${n}</button>`).join('')}</div><label>What is it about?<textarea name="about" maxlength="500" required></textarea></label><p>Costs 100 points · Your extra points stay.</p><button type="submit">Send game request</button><button type="button" data-dismiss>Later</button></form>`;
    dialog.addEventListener('click',e=>{if(e.target.dataset.idea){dialog.querySelector('input').value=e.target.dataset.idea;dialog.querySelector('textarea').value=({ 'Space explorers':'Explore planets and find friendly aliens.', 'Dinosaur puzzles':'Solve puzzles with friendly dinosaurs.', 'Ocean adventure':'Discover sea animals and hidden treasure.'})[e.target.dataset.idea];}if(e.target.hasAttribute('data-dismiss'))dialog.close();});
    dialog.addEventListener('close',()=>{rewardDismissed=true;dialog.remove();});
    dialog.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const name=dialog.querySelector('input').value.trim(),about=dialog.querySelector('textarea').value.trim();if(!name||!about||progress.points.current<100)return;progress.requests.push({id:crypto.randomUUID(),date:new Date().toISOString(),name,about,built:false});progress.points.current-=100;progress.points.milestones++;save();dialog.close();grownups();if(!active)home();else if(!done)render();else root.querySelectorAll('.quizmo-points').forEach(e=>e.outerHTML=meter());});
    document.body.append(dialog);dialog.showModal();
  }
  function confirmReset() {
    if(!active || document.getElementById('quizmoResetConfirm'))return;
    const id=active[0], dialog=document.createElement('dialog');
    dialog.id='quizmoResetConfirm';dialog.className='quizmo-reward quizmo-confirm';
    dialog.setAttribute('aria-labelledby','quizmoResetHeading');
    dialog.innerHTML=`<h2 id="quizmoResetHeading">Start this game over from Level 1?</h2><p>Your points and game requests stay safe.</p><button type="button" data-confirm-reset>Yes, start over</button><button type="button" data-cancel-reset autofocus>Cancel</button>`;
    dialog.addEventListener('click',e=>{
      if(e.target.closest('[data-cancel-reset]'))dialog.close();
      if(e.target.closest('[data-confirm-reset]')){
        progress.levels[id]=1;progress.stars[id]=0;delete progress.runs[id];save();
        dialog.close();open(id);
      }
    });
    dialog.addEventListener('close',()=>dialog.remove());
    document.body.append(dialog);dialog.showModal();
  }
  function grownups() {
    let panel=document.getElementById('quizmoGrownups');if(!panel){panel=document.createElement('section');panel.id='quizmoGrownups';document.getElementById('grownupGameSettings').after(panel);}
    panel.innerHTML=`<h3>Jasper's game requests</h3>${progress.requests.length?progress.requests.map(r=>`<article><p><time>${escape(new Date(r.date).toLocaleDateString())}</time> · <strong>${escape(r.name)}</strong></p><p>${escape(r.about)}</p><label><input type="checkbox" data-built="${escape(r.id)}" ${r.built?'checked':''}> Mark built</label></article>`).join(''):'<p>No game requests yet.</p>'}<p>${progress.points.current} current · ${progress.points.lifetime} lifetime points</p><label>Adjust points (+ or −)<input type="number" step="1" value="10" id="quizmoAdjustment"></label><button type="button" data-adjust>Apply adjustment</button><button type="button" data-reset>Reset points</button>`;
    panel.onchange=e=>{if(e.target.dataset.built){const r=progress.requests.find(r=>r.id===e.target.dataset.built);if(r){r.built=e.target.checked;save();}}};
    panel.onclick=e=>{if(!e.target.hasAttribute('data-adjust')&&!e.target.hasAttribute('data-reset'))return;if(e.target.hasAttribute('data-reset'))progress.points={current:0,lifetime:0,milestones:0};else {const n=Number(panel.querySelector('input[type=number]').value);if(!Number.isSafeInteger(n))return;progress.points.current=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,progress.points.current+n));if(n>0)progress.points.lifetime=Math.min(Number.MAX_SAFE_INTEGER,progress.points.lifetime+n);}save();grownups();if(!active)home();else if(!done)render();else root.querySelectorAll('.quizmo-points').forEach(e=>e.outerHTML=meter());};
  }
  const save = () => { try { localStorage.setItem('jasper-quizmo', JSON.stringify(progress)); } catch {} };
  let active, task, inputs, field=0, count=0, done=false, timer, deadline, down;
  const button=(text,action,extra='')=>`<button type="button" data-q-action="${action}" ${extra}>${text}</button>`;
  function leave() { clearInterval(timer); timer=null; down=null; }
  let section="Math Adventures";
  function home() {
    leave(); active=null;
    if(progress.points.current>=100&&!rewardDismissed)setTimeout(()=>{if(!rewardDismissed)reward();},0);
    root.innerHTML=`<div class="hub-heading"><div><h1>Jasper's Quizmo</h1><p>Math + CogAT practice · ages 7–9</p></div><p>⭐ ${Object.values(progress.stars).reduce((a,b)=>a+b,0)} stars </p>${meter()}</div><div class="quizmo-segments">${["Math Adventures","CogAT Practice"].map(t=>button(t,t=== "Math Adventures"?"math":"cogat",`aria-pressed="${section===t}"`)).join('')}</div>${[ ['Math Adventures',mathGames], ['CogAT Practice',window.QuizmoCogat.games] ].map(([title,list])=>`<section aria-label="${title}" ${section===title?'':'hidden'}><h2>${title}</h2>${title==='CogAT Practice'?'<p>Original reasoning games · 8 levels each</p>':''}<div class="quizmo-grid">${list.map(([id,name,skill])=>button(`<i class="quizmo-symbol" aria-hidden="true">${({'addition':'+','subtraction':'−','times':'×','division':'÷','place':'🔢','fractions':'🏮','words':'🗺','missing':'?','measure':'⏰','speed':'ϟ','links':'🚀','groups':'🧩','series':'☄','puzzles':'⚖','figures':'△'})[id]}</i><strong>${name}</strong><span>${skill}</span><div class="level-track" aria-hidden="true"><i style="width:${progress.levels[id]/8*100}%"></i></div><small>Level ${progress.levels[id]} / 8 · ⭐ ${progress.stars[id]}</small>`,'open',`class="quizmo-card" data-game="${id}"`)).join('')}</div></section>`).join('')}`;
  }
  function open(id, restart=false) {
    leave(); active=games.find(g=>g[0]===id); count=0; done=false;
    const stored=progress.runs[id];
    const prior=stored && Number.isInteger(stored.level) && stored.level>=1 && stored.level<=8 && Array.isArray(stored.paid)
      ? {...stored,paid:[...new Set(stored.paid.filter(n=>Number.isInteger(n)&&n>=0&&n<5))],replay:!!stored.replay,complete:!!stored.complete} : null;
    run=prior && (restart || !prior.complete) ? prior : {level:progress.levels[id],replay:progress.best[id]>=progress.levels[id],paid:[],complete:false};
    tasks=window.JasperQuizmoGen.level(id,run.level,progress.recent[id]);
    progress.recent[id]=[...progress.recent[id],...tasks.map(t=>t.sig)].slice(-30);
    // Persist planning/history now. The fresh run becomes durable on its first
    // paid slot, so a reset still clears the previous run until play resumes.
    save();
    progress.runs[id]=run;

    if(id==='speed') { deadline=Date.now()+60000+run.level*5000; timer=setInterval(()=>{ const clock=root.querySelector('[data-clock]'); if(clock)clock.textContent=`${Math.max(0,Math.ceil((deadline-Date.now())/1000))}s · take your time`; if(Date.now()>=deadline)finish(false); },250); }
    window.scrollTo(0,0);next();
  }
  function next() { task=tasks[count]; inputs=(task.answers||[]).map(()=>'');field=0;render(); }
  function tools() { return `<div class="quizmo-tools">${button('← Quizmo','home')}<div class="quizmo-game-heading"><h1>${active[1]}</h1><p>Level ${run.level} / 8 · Question ${count+1} / 5</p>${active[0]==='speed'?'<p data-clock role="timer">Gentle timed round</p>':''}</div><div class="question-dots" aria-hidden="true">${[0,1,2,3,4].map(i=>`<i class="${i<=count?'filled':''}"></i>`).join('')}</div><span class="round-stars">⭐ ${progress.stars[active[0]]}</span>${button('Restart level','restart','class="restart-level"')}${button('Back to Level 1','reset-game','class="reset-game"')}${meter()}</div>`; }
  function layoutVisuals(){
    const portrait=innerWidth<=699,wasScrolling=root.classList.contains('quizmo-scroll'),previousScroll=scrollY;
    root.classList.toggle('quizmo-scroll',portrait&&[...root.querySelectorAll('[data-lantern-total]')].some(svg=>Number(svg.dataset.lanternTotal)>64));
    for(const svg of root.querySelectorAll('.quizmo-illustration')){
      const box=portrait&&svg.dataset.portraitViewBox?svg.dataset.portraitViewBox:svg.dataset.wideViewBox;
      if(box)svg.setAttribute('viewBox',box);
      const scale=svg.getScreenCTM()?.a;
      if(!scale)continue;
      svg.classList.toggle('quizmo-compact-clock',scale<.5);
      svg.classList.toggle('quizmo-compact-svg',scale<.5);
      for(const label of svg.querySelectorAll('text')){
        if(!label.dataset.baseFont)label.dataset.baseFont=label.getAttribute('font-size')||'18';
        label.setAttribute('font-size',String(Math.max(Number(label.dataset.baseFont),11/scale)));
      }
    }
    if(portrait&&!root.classList.contains('quizmo-scroll')){
      const controls=root.querySelector('.quizmo-check,.cogat-choices'),bar=document.querySelector('.mobile-tabs');
      if(controls&&controls.getBoundingClientRect().bottom>(bar?.getBoundingClientRect().top||innerHeight)+1){
        root.classList.add('quizmo-scroll');
        // The larger scroll layout changes the SVG scale; update readable labels once more.
        for(const svg of root.querySelectorAll('.quizmo-illustration')){
          const scale=svg.getScreenCTM()?.a;if(!scale)continue;
          svg.classList.toggle('quizmo-compact-clock',scale<.5);
          svg.classList.toggle('quizmo-compact-svg',scale<.5);
          for(const label of svg.querySelectorAll('text'))label.setAttribute('font-size',String(Math.max(Number(label.dataset.baseFont||18),11/scale)));
        }
      }
    }
    if(wasScrolling&&root.classList.contains('quizmo-scroll')&&scrollY!==previousScroll)window.scrollTo(0,previousScroll);
  }
  window.addEventListener('resize',layoutVisuals);
  // Vertical column problems: the slot under the line is the answer field.
  const bare=p=>/^[\d?]+ [+−] [\d?]+ = [\d?]+(\. Which part is missing\?)?$/.test(p);
  function heading(){
    if(!task.column||!bare(task.prompt))return task.prompt;
    if(task.column.rows.includes(null))return 'What number is missing?';
    return task.column.op==='−'?'Take away. How many are left?':'Add them. How many in all?';
  }
  function slotDigits(value){
    const k=task.column.k,v=String(value||'');
    if(!v)return `<i class="qc-ph" style="grid-column:${k}">?</i>`;
    if(v.length>k)return `<i style="grid-column:1/-1;text-align:right">${v}</i>`;
    return [...v].map((d,j)=>`<i style="grid-column:${k-v.length+1+j}">${d}</i>`).join('');
  }
  function paint(i){const el=root.querySelector(`[data-input="${i}"]`);if(!el)return;if(task.column&&!task.choices)el.innerHTML=slotDigits(inputs[i]);else el.textContent=inputs[i]||'?';}
  function columnHTML(){
    const c=task.column,known=[...c.rows,c.result].filter(v=>v!==null),k=Math.max(...known.map(v=>String(v).length),...(task.answers||[]).map(v=>String(v).length));
    c.k=k;
    const places=['hundreds','tens','ones'].slice(-k);
    const slot=()=>task.choices?`<div class="qc-slot qc-static" style="grid-column:2/span ${k}"><span class="qc-digits" style="--k:${k}"><i class="qc-ph" style="grid-column:${k}">?</i></span></div>`
      :`<div class="quizmo-inputs qc-slot" style="grid-column:2/span ${k}">${button(`<span class="qc-digits" style="--k:${k}" data-input="0">${slotDigits(inputs[0])}</span>`,'field',`data-field="0" aria-pressed="true" aria-label="Answer"`)}</div>`;
    const num=v=>{const t=String(v);return [...t].map((d,j)=>`<span class="qc-d" style="grid-column:${2+k-t.length+j}">${d}</span>`).join('');};
    let h=k>=2?`<span class="qc-op"></span>${places.map((p,i)=>`<span class="qc-place" style="grid-column:${2+i}">${p}</span>`).join('')}`:'';
    c.rows.forEach((v,i)=>{h+=`<span class="qc-op">${i===c.rows.length-1?c.op:''}</span>`+(v===null?slot():num(v));});
    h+=`<span class="qc-line" style="grid-column:1/span ${k+1}"></span><span class="qc-op"></span>`+(c.result===null?slot():num(c.result));
    const label=`${c.rows.map(v=>v??'missing number').join(` ${c.op==='−'?'minus':'plus'} `)} equals ${c.result??'the answer'}`;
    return `<div class="quizmo-column" role="group" aria-label="${label}" data-k="${k}" style="--k:${k}">${h}</div>`;
  }
  function render() {
    if(task.column){
      const trade=task.tradeVisual?button('Trade a ten','trade','class="qc-trade"'):'';
      const answer=task.choices?`<div class="cogat-choices">${task.choices.map((choice,i)=>button(escape(choice),'choice',`data-choice="${i}"`)).join('')}</div>`:`<div class="quizmo-controls"><div class="quizmo-pad">${[1,2,3,4,5,6,7,8,9,'clear',0,'erase'].map(n=>button(n==='erase'?'⌫':n==='clear'?'Clear':n,'key',`data-key="${n}" aria-label="${n==='erase'?'Erase last digit':n}"`)).join('')}</div>${button('Check answer','check', 'class="quizmo-check"')}</div>`;
      root.innerHTML=`${tools()}<div class="quizmo-board${task.choices?' cogat-board':''}" data-level="${run.level}"><div class="quizmo-question quizmo-column-question"><h2>${heading()}</h2><div class="quizmo-work">${columnHTML()}<div class="quizmo-visual">${task.visual}</div></div><div class="quizmo-answer-area">${trade}<p class="quizmo-feedback" role="status">${task.choices?'Tap your choice.':'Use the pad, then check.'}</p></div></div>${answer}</div>`;
      layoutVisuals();return;
    }
    if(task.choices) {
      root.innerHTML=`${tools()}<div class="quizmo-board cogat-board" data-level="${run.level}"><div class="quizmo-question"><h2>${task.prompt}</h2><div class="quizmo-visual">${task.visual||''}</div><p class="quizmo-feedback" role="status">Tap your choice.</p></div><div class="cogat-choices">${task.choices.map((choice,i)=>button(isCogat(active[0])?choice:escape(choice),'choice',`data-choice="${i}"`)).join('')}</div></div>`;
      layoutVisuals();return;
    }
    root.innerHTML=`${tools()}<div class="quizmo-board" data-level="${run.level}"><div class="quizmo-question"><h2>${task.prompt}</h2><div class="quizmo-visual">${task.visual||''}</div><div class="quizmo-answer-area"><div class="quizmo-inputs">${inputs.map((value,i)=>button(`${task.labels?.[i]||'Answer'}: <span data-input="${i}">${value||'?'}</span>`,'field',`data-field="${i}" aria-pressed="${field===i}"`)).join('')}</div><p class="quizmo-feedback" role="status">Use the number pad, then check.</p></div></div><div class="quizmo-controls"><div class="quizmo-pad">${[1,2,3,4,5,6,7,8,9,'clear',0,'erase'].map(n=>button(n==='erase'?'⌫':n==='clear'?'Clear':n,'key',`data-key="${n}" aria-label="${n==='erase'?'Erase last digit':n}"`)).join('')}</div>${button('Check answer','check', 'class="quizmo-check"')}</div></div>`;
    layoutVisuals();
  }
  function finish(completed) {
    if(done)return; done=true; leave();
    if(completed) { const id=active[0], l=run.level;if(!run.complete){const bonus=run.replay?Math.max(1,Math.floor(5*l/2)):5*l;award(bonus+(progress.best[id]<l?10:0));run.complete=true;}progress.best[id]=Math.max(progress.best[id],l);progress.stars[id]=Math.max(progress.stars[id],l);progress.levels[id]=Math.min(8,l+1);save(); }
    root.innerHTML=`<div class="quizmo-board"><h1>${completed?'⭐ Level complete!':'✨ Lovely practice!'}</h1><p>${completed?'Your next challenge is ready.':'The timer is resting. Every answer was useful practice. Try again whenever you like.'}</p>${meter()}${button('Play next round','again')}${button('← Quizmo','home')}${button('Restart level','restart','class="restart-level"')}</div>`;
  }
  function showHint() {
    root.querySelector('.quizmo-feedback').textContent=`Nearly there. ${task.hint} Try again.`;
    if(task.hintVisual){root.querySelector('.quizmo-visual').innerHTML=task.hintVisual;root.querySelector('.qc-trade')?.remove();}
    layoutVisuals();
  }
  function dispatch(b) {
    const action=b.dataset.qAction;
    if(action==='math'||action==='cogat'){section=action==='math'?'Math Adventures':'CogAT Practice';return home();}
    if(action==='reset-game')return confirmReset();
    if(action==='reward')return reward();
    if(action==='trade'){if(task?.tradeVisual){root.querySelector('.quizmo-visual').innerHTML=task.tradeVisual;b.remove();root.querySelector('.quizmo-feedback').textContent='One ten is now 10 ones. Take away, then count what is left.';layoutVisuals();}return;}
    if(action==='restart')return open(active[0],true);
    if(action==='open')return open(b.dataset.game);
    if(action==='home')return home();
    if(action==='again')return open(active[0]);
    if(done||!active)return;
    if(action==='choice') {
      if(Number(b.dataset.choice)!==task.correct){showHint();return;}
      earned();count++;if(count>=5)finish(true);else next();return;
    }
    if(action==='field'){field=Number(b.dataset.field);root.querySelectorAll('[data-field]').forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.field)===field)));}
    if(action==='key') { const key=b.dataset.key;inputs[field]=key==='clear'?'':key==='erase'?inputs[field].slice(0,-1):(inputs[field]+key).slice(0,6);paint(field);if(innerWidth<=699)layoutVisuals(); }
    if(action==='check') {
      if(!task.answers.every((n,i)=>inputs[i]!==''&&Number(inputs[i])===n)) {showHint();return;}
      earned();count++;
      if(count>=5)finish(true);else {next();root.querySelector('.quizmo-feedback').textContent='That’s it! Here is your next challenge.';}
    }
  }
  function bind(target) {
    target.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(b&&e.isPrimary!==false&&e.button===0)down={b,id:e.pointerId,x:e.clientX,y:e.clientY};});
    target.addEventListener('pointerup',e=>{const p=down;down=null;if(p&&p.id===e.pointerId&&p.b===e.target.closest('button')&&Math.hypot(p.x-e.clientX,p.y-e.clientY)<24) {if(target===root)dispatch(p.b);else {showView('quizmo');home();}}});
    target.addEventListener('pointercancel',()=>{down=null;});
    target.addEventListener('click',e=>{if(e.detail===0){const b=e.target.closest('button');if(b){if(target===root)dispatch(b);else {showView('quizmo');home();}}}});
  }
  bind(root);bind(document.getElementById('quizmoTab'));
  grownups();
  document.getElementById('settingsButton').addEventListener('click',grownups);
  window.JasperQuizmo={leave,layout:layoutVisuals,current:()=>active&&!done?{...task,answers:task.answers?.slice(),choices:task.choices?.slice(),slot:count,level:run.level,game:active[0]}:null};
})();
