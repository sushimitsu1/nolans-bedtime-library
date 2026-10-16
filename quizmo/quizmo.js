/* Jasper's independent, touch-first math practice. */
(() => {
  'use strict';
  const games = [
    ['addition','Moonlight Sums','Add two and three digit numbers.'],
    ['subtraction','Borrowing Bridge','Subtract with regrouping.'],
    ['times','Star Table Trail','Multiply through 12 × 12.'],
    ['division','Remainder Railway','Divide and find what is left over.'],
    ['place','Number Builders','Explore place value and expanded form.'],
    ['fractions','Fraction Lanterns','Find halves, thirds, fourths and eighths of sets.'],
    ['words','Adventure Maths','Solve one and two step word problems.'],
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
  const progress = {score: Number.isSafeInteger(saved?.score) && saved.score >= 0 ? saved.score : 0, levels:{}, stars:{}};
  for (const [id] of games) {
    progress.levels[id] = Math.max(1, Math.min(8, Number.isInteger(saved?.levels?.[id]) ? saved.levels[id] : 1));
    progress.stars[id] = Math.max(0, Math.min(8, Number.isInteger(saved?.stars?.[id]) ? saved.stars[id] : 0));
  }
  const natural = n => Number.isSafeInteger(n) && n >= 0 ? n : 0;
  progress.points = {current:natural(saved?.points?.current ?? saved?.score), lifetime:natural(saved?.points?.lifetime ?? saved?.score), milestones:natural(saved?.points?.milestones)};
  progress.requests = Array.isArray(saved?.requests) ? saved.requests.filter(r=>r && typeof r.name==='string' && typeof r.about==='string').map(r=>({...r,built:!!r.built})) : [];
  progress.runs = saved?.runs && typeof saved.runs==='object' ? saved.runs : {};
  let run, rewardDismissed=false;
  // Points rules (math and CogAT): each of the three correct question slots earns
  // 1 + floor(level / 2). Completion earns 5 * level, plus 10 on first completion.
  // Already beaten levels earn half of question/completion points, floored, min 1.
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
  function grownups() {
    let panel=document.getElementById('quizmoGrownups');if(!panel){panel=document.createElement('section');panel.id='quizmoGrownups';document.getElementById('grownupGameSettings').after(panel);}
    panel.innerHTML=`<h3>Jasper's game requests</h3>${progress.requests.length?progress.requests.map(r=>`<article><p><time>${escape(new Date(r.date).toLocaleDateString())}</time> · <strong>${escape(r.name)}</strong></p><p>${escape(r.about)}</p><label><input type="checkbox" data-built="${escape(r.id)}" ${r.built?'checked':''}> Mark built</label></article>`).join(''):'<p>No game requests yet.</p>'}<p>${progress.points.current} current · ${progress.points.lifetime} lifetime points</p><label>Adjust points (+ or −)<input type="number" step="1" value="10" id="quizmoAdjustment"></label><button type="button" data-adjust>Apply adjustment</button><button type="button" data-reset>Reset points</button>`;
    panel.onchange=e=>{if(e.target.dataset.built){const r=progress.requests.find(r=>r.id===e.target.dataset.built);if(r){r.built=e.target.checked;save();}}};
    panel.onclick=e=>{if(!e.target.hasAttribute('data-adjust')&&!e.target.hasAttribute('data-reset'))return;if(e.target.hasAttribute('data-reset'))progress.points={current:0,lifetime:0,milestones:0};else {const n=Number(panel.querySelector('input[type=number]').value);if(!Number.isSafeInteger(n))return;progress.points.current=Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,progress.points.current+n));if(n>0)progress.points.lifetime=Math.min(Number.MAX_SAFE_INTEGER,progress.points.lifetime+n);}save();grownups();if(!active)home();else if(!done)render();else root.querySelectorAll('.quizmo-points').forEach(e=>e.outerHTML=meter());};
  }
  const save = () => { try { localStorage.setItem('jasper-quizmo', JSON.stringify(progress)); } catch {} };
  const pick = n => Math.floor(Math.random()*n);
  // Every level changes operands or the operation's complexity; questions vary on replay.
  function question(id, l) {
    const a = 12 + pick(20*l), b = 11 + pick(12*l);
    if (id === 'addition') { const x = l > 3 ? 100 + pick(400) : a, y = l > 5 ? 100 + pick(300) : b; return {prompt:`${x} + ${y} = ?`, answers:[x+y], hint:'Add ones, then tens, then hundreds. Carry a ten when needed.'}; }
    if (id === 'subtraction') { const y=11+10*pick(l+1), x=y+19+(l>3?100:0)+10*pick(3+l); return {prompt:`${x} − ${y} = ?`, answers:[x-y], hint:'Trade one ten for ten ones before subtracting the ones.'}; }
    if (id === 'times') { const x=2+pick(Math.min(11,l+3)), y=2+pick(Math.min(11,l+3)); return {prompt:`${x} × ${y} = ?`, answers:[x*y], hint:`Count ${x} equal groups of ${y}.`}; }
    if (id === 'division') { const d=2+pick(Math.min(11,l+2)), q=2+pick(l+3), r=1+pick(d-1); return {prompt:`${d*q+r} ÷ ${d}: quotient and remainder?`, labels:['Quotient','Remainder'], answers:[q,r], hint:`Find the biggest multiple of ${d} that fits. What is left over?`}; }
    if (id === 'place') { const h=1+pick(9), t=1+pick(9), u=1+pick(9), n=h*100+t*10+u; return l%2 ? {prompt:`${n} = ${h*100} + ? + ${u}`, answers:[t*10], hint:'The middle digit counts tens.'} : {prompt:`What is the value of ${l<5?t:h} in ${n}? (${l<5?'tens':'hundreds'} place)`, answers:[l<5?t*10:h*100], hint:`Multiply the digit by ${l<5?10:100}.`}; }
    if (id === 'fractions') { const d=[2,3,4,8][Math.min(3,Math.floor((l-1)/2))], n=1+pick(l+1), total=d*n; return {prompt:`What is 1/${d} of these ${total} lanterns?`, visual:`<div class="quizmo-set" aria-label="${total} lanterns">${'● '.repeat(total)}</div>`, answers:[n], hint:`Share ${total} into ${d} equal groups. How many in one group?`}; }
    if (id === 'words') { const n=3+pick(l+2), each=3+pick(l+3), used=2+pick(n); return {prompt:l<4?`Jasper packs ${n} bags with ${each} apples each. How many apples?`:`Jasper packs ${n} bags with ${each} apples each, then gives away ${used} apples. How many remain?`, answers:[n*each-(l<4?0:used)], hint:l<4?'Multiply bags by apples per bag.':'First multiply, then subtract the apples given away.'}; }
    if (id === 'missing') return l<4 ? {prompt:`? + ${b} = ${a+b}`, answers:[a], hint:'Subtract the known part from the total.'} : {prompt:`${b} × ? = ${b*(l+2)}`, answers:[l+2], hint:'Divide the total by the known factor.'};
    if (id === 'measure') {
      if (l%3===1) { const h=1+pick(10), m=l<4?30:45; return {prompt:`It is ${h}:${m}. How many minutes until ${h+1}:00?`, answers:[60-m], hint:'There are 60 minutes in an hour.'}; }
      if (l%3===2) { const cost=15+pick(60), coins=l<5?100:200; return {prompt:`You pay ${coins} cents for a snack costing ${cost} cents. Change in cents?`, answers:[coins-cost], hint:'Subtract the cost from the amount paid.'}; }
      return {prompt:`${l} metres and ${a} centimetres = how many centimetres?`, answers:[l*100+a], hint:'Each metre is 100 centimetres. Then add the extra centimetres.'};
    }
    return question(['addition','subtraction','times','missing'][pick(4)],l);
  }
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
    const prior=progress.runs[id];
    run=prior && (restart || !prior.complete) ? prior : {level:progress.levels[id],replay:progress.stars[id]>=progress.levels[id],paid:[],complete:false};
    progress.runs[id]=run;

    if(id==='speed') { deadline=Date.now()+60000+progress.levels[id]*5000; timer=setInterval(()=>{ const clock=root.querySelector('[data-clock]'); if(clock)clock.textContent=`${Math.max(0,Math.ceil((deadline-Date.now())/1000))} seconds · take your time`; if(Date.now()>=deadline)finish(false); },250); }
    next();
  }
  function next() { task=isCogat(active[0])?window.QuizmoCogat.question(active[0],run.level,count):question(active[0],run.level); inputs=(task.answers||[]).map(()=>'');field=0;render(); }
  function tools() { return `<div class="quizmo-tools">${button('← Quizmo','home')}<div class="quizmo-game-heading"><h1>${active[1]}</h1><p>Level ${run.level} / 8 · Question ${count+1} / 3</p></div><div class="question-dots" aria-hidden="true">${[0,1,2].map(i=>`<i class="${i<=count?'filled':''}"></i>`).join('')}</div><span class="round-stars">⭐ ${progress.stars[active[0]]}</span>${button('Restart level','restart','class="restart-level"')}${meter()}</div>`; }
  function render() {
    if(isCogat(active[0])) {
      root.innerHTML=`${tools()}<div class="quizmo-board cogat-board" data-level="${run.level}"><div class="quizmo-question"><h2>${task.prompt}</h2>${task.visual||''}<p class="quizmo-feedback" role="status">Tap your choice.</p></div><div class="cogat-choices">${task.choices.map((choice,i)=>button(choice,'choice',`data-choice="${i}"`)).join('')}</div></div>`;
      return;
    }
    root.innerHTML=`${tools()}<div class="quizmo-board" data-level="${run.level}"><div class="quizmo-question">${active[0]==='speed'?'<p data-clock role="timer">Gentle timed round</p>':''}<h2>${task.prompt}</h2>${task.visual||''}<div class="quizmo-inputs">${inputs.map((value,i)=>button(`${task.labels?.[i]||'Answer'}: <span data-input="${i}">${value||'?'}</span>`,'field',`data-field="${i}" aria-pressed="${field===i}"`)).join('')}</div><p class="quizmo-feedback" role="status">Use the number pad, then check.</p></div><div class="quizmo-controls"><div class="quizmo-pad">${[1,2,3,4,5,6,7,8,9,'clear',0,'erase'].map(n=>button(n==='erase'?'⌫':n==='clear'?'Clear':n,'key',`data-key="${n}" aria-label="${n==='erase'?'Erase last digit':n}"`)).join('')}</div>${button('Check answer','check', 'class="quizmo-check"')}</div></div>`;
  }
  function finish(completed) {
    if(done)return; done=true; leave();
    if(completed) { const id=active[0], l=run.level;if(!run.complete){const bonus=run.replay?Math.max(1,Math.floor(5*l/2)):5*l;award(bonus+(progress.stars[id]<l?10:0));run.complete=true;}progress.stars[id]=Math.max(progress.stars[id],l);progress.levels[id]=Math.min(8,l+1);save(); }
    root.innerHTML=`<div class="quizmo-board"><h1>${completed?'⭐ Level complete!':'✨ Lovely practice!'}</h1><p>${completed?'Your next challenge is ready.':'The timer is resting. Every answer was useful practice. Try again whenever you like.'}</p>${meter()}${button('Play next round','again')}${button('← Quizmo','home')}${button('Restart level','restart','class="restart-level"')}</div>`;
  }
  function dispatch(b) {
    const action=b.dataset.qAction;
    if(action==='math'||action==='cogat'){section=action==='math'?'Math Adventures':'CogAT Practice';return home();}
    if(action==='reward')return reward();
    if(action==='restart')return open(active[0],true);
    if(action==='open')return open(b.dataset.game);
    if(action==='home')return home();
    if(action==='again')return open(active[0]);
    if(done||!active)return;
    if(action==='choice') {
      if(Number(b.dataset.choice)!==task.correct){root.querySelector('.quizmo-feedback').textContent=`Nearly there. ${task.hint} Try again.`;return;}
      earned();count++;if(count>=3)finish(true);else next();return;
    }
    if(action==='field'){field=Number(b.dataset.field);root.querySelectorAll('[data-field]').forEach(x=>x.setAttribute('aria-pressed',String(Number(x.dataset.field)===field)));}
    if(action==='key') { const key=b.dataset.key;inputs[field]=key==='clear'?'':key==='erase'?inputs[field].slice(0,-1):(inputs[field]+key).slice(0,6);root.querySelector(`[data-input="${field}"]`).textContent=inputs[field]||'?'; }
    if(action==='check') {
      if(!task.answers.every((n,i)=>inputs[i]!==''&&Number(inputs[i])===n)) {root.querySelector('.quizmo-feedback').textContent=`Nearly there. ${task.hint} Try again.`;return;}
      earned();count++;
      if(count>=3)finish(true);else {next();root.querySelector('.quizmo-feedback').textContent='That’s it! Here is your next challenge.';}
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
  window.JasperQuizmo={leave};
})();
