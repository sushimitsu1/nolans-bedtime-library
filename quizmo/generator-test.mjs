// Run from repo root: node quizmo/generator-test.mjs (no browser or DOM).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({window:{}});
for(const file of ['visuals','cogat','generators'])vm.runInContext(fs.readFileSync(`quizmo/${file}.js`,'utf8'),context);
const {JasperQuizmoGen:G,QuizmoCogat:C,QuizmoVisuals:V}=context.window;
let seed=0x31415926;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const math=new Set(G.mathIds), ids=[...math,...C.games.map(g=>g[0])];
for(const sizes of Object.values(C.bankSizes))for(const n of sizes)assert(n>=15,'At least 15 bank entries per level');
const means={};
for(const id of ids){
  means[id]=[];let positions=new Set();
  for(let l=1;l<=8;l++){
    let sum=0,overlap=0,seen=0,recent=[];
    for(let trial=0;trial<200;trial++){
      const tasks=G.level(id,l,recent,{rng});
      assert.equal(tasks.length,5);
      if(math.has(id))assert(!tasks[0].choices,`${id}: written opening`);
      assert.equal(new Set(tasks.map(t=>t.sig)).size,5,`${id} L${l} unique signatures`);
      if(id==='figures')assert.equal(new Set(tasks.map(t=>V.normalizeSvg(t.visual))).size,5,`figures L${l}: unique visual questions under the shared instruction`);
      else assert.equal(new Set(tasks.map(t=>t.prompt)).size,5,`${id} L${l} unique prompts`);
      const svgIds=tasks.flatMap(t=>[t.visual,...(t.choices||[])]).flatMap(markup=>[...markup.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
      assert.equal(new Set(svgIds).size,svgIds.length,`${id}: paint-server IDs must be unique across the whole round`);
      assert.notEqual(tasks[0].sig,recent.at(-1),`${id}: boundary repeat`);
      for(const [i,t] of tasks.entries()){
        assert(t.prompt&&t.hint&&t.sig,`${id}: complete task`);
        assert(!t.prompt.includes('●'));
        assert.match(t.visual,/<svg/);assert.match(t.visual,/role="img"/);assert.match(t.visual,/aria-label=/);
        assert.equal(G.signature(t),t.sig);
        if(i)assert.notEqual(t.sig,tasks[i-1].sig);
        if(math.has(id)){
          assert(t.answers.length>0 || t.choices?.length>=3);
          if(t.choices){assert.equal(new Set(t.choices).size,t.choices.length);assert(Number.isInteger(t.correct)&&t.correct>=0&&t.correct<t.choices.length);positions.add(t.correct);}
          for(const a of t.answers)assert(Number.isSafeInteger(a)&&a>=0,`${id} L${l}: bad answer ${a}`);
          assert(Number.isFinite(t.magnitude)&&t.magnitude>0);
          sum+=difficultyScore(t);
          verifyMath(t);
        }else{
          assert.equal(t.choices.length,4);assert.equal(new Set(t.choices.map(V.normalizeSvg)).size,4,`${id} L${l}: visually unique choices`);
          assert(Number.isInteger(t.correct)&&t.correct>=0&&t.correct<4);positions.add(t.correct);
          sum+=difficultyScore(t);
          if(id==='series')verifySeries(t);
          if(id==='puzzles'&&['machine','inverse'].includes(t.operation)){
            const n=t.prompt.match(/\d+/g).map(Number),first=n[0],second=n[2];
            if(t.operation==='machine')assert(![first,second].includes(n[4]),'Machine must require a new input');
            else assert(![n[1],n[3]].includes(n[4]),'Inverse machine must require a new output');
          }
        }
      }
      recent=[...recent,...tasks.map(t=>t.sig)].slice(-30);
      const replay=G.level(id,l,recent,{rng});
      overlap+=replay.filter(t=>recent.includes(t.sig)).length;seen+=5;
      recent=[...recent,...replay.map(t=>t.sig)].slice(-30);
    }
    assert(overlap/seen<.10,`${id} L${l} recent overlap ${overlap/seen}`);
    means[id].push(sum/1000);
  }
  {
    const m=means[id];assert(m[7]>m[3]&&m[3]>m[0],`${id}: L8 > L4 > L1, ${m}`);

  }
  if(!math.has(id))assert.equal(positions.size,4,`${id}: all correct positions used`);
  console.log(`PASS ${id}: 8 × 200 levels + replays${math.has(id)?`; mean curriculum difficulty ${means[id].map(Math.round).join(', ')}`:''}`);
}
// Score actual content, without reading the requested level: number size,
// fact range, smaller fraction parts, and extra steps each add work.
function difficultyScore(t){
 const k=t.source||t.kind,o=t.operation,n=t.operands||[],max=Math.max(0,...n),a=t.answers||[],steps=t.steps||1;
 if(k==='addition')return (t.addends?t.addends.reduce((s,n)=>s+n,0):max)/100+(t.regroups||0)*2+steps*2;
 if(k==='subtraction')return max/100+2;
 if(k==='times')return a[0]/15+steps*2+Math.max(...t.factors)/4;
 if(k==='division')return t.dividend/20+t.divisor/2+steps*4+(t.remainder?4:0);
 if(k==='place')return max/500+steps*3;
 if(k==='fractions')return Math.max(...t.denominators)+steps*3+(t.total||0)/24;
 if(k==='words'){
   if(t.money)return t.paid/1000+(t.cost%100===0?1:t.cost%50===0?3:4)+steps*2;
   if(o==='elapsed-time')return 60/t.step+a[0]/120+steps*2;
   return max/50+steps*3;
 }
 if(k==='missing')return max/50+steps*4;
 if(k==='measure'){
   if(o==='tell-time')return 2+60/t.step;
   if(o==='elapsed-time')return 60/t.step+a[0]/120+steps*2;
   if(o.startsWith('convert'))return a[0]/100+steps*2;
   if(o==='perimeter'||o==='missing-side')return Math.max(...t.sides)/4+steps*3;
   return t.area/10+steps*3;
 }
 if(k==='links'||k==='groups')return t.band*3;
 if(k==='series')return ({plus:1,minus:1,alternating:2,growing:2,'alternating-growing':3,interleaved:3})[o];
 if(k==='puzzles')return steps*3;
 if(k==='figures'){if(o==='paper')return Number(t.sig.split(':')[2])*3;const data=JSON.parse(t.sig.slice('figures:matrix:'.length));return data[2].length*(data[3]?2:1);}
 throw Error(k);
}
// Independent arithmetic checks use the visible prompt, not the factory's answer calculation.
function verifyMath(t){
  const p=t.prompt,n=(p.match(/\d+/g)||[]).map(Number),a=t.answers,op=t.operation,kind=t.source||t.kind;
  const picked=t.choices?.[t.correct];
  if(kind==='addition'){
    if(op==='sum'||op==='three-addends')assert.equal(a[0],n.reduce((s,v)=>s+v,0));
    if(op==='missing-addend')assert.equal(n[0]+a[0],n[1]);
    if(op==='make-100')assert.equal(picked.match(/\d+/g).map(Number).reduce((s,v)=>s+v),100);
    if(op==='sum-then-use')assert.equal(a[0],n[0]+n[1]-n[2]);
    if(op==='estimate')assert.equal(Number(picked),Math.round(n[1]/10)*10+Math.round(n[2]/10)*10);
  }
  if(kind==='subtraction')assert.equal(a[0],n[0]-n[1]);
  if(kind==='times'){
    if(op==='missing-factor')assert.equal(a[0]*n[0],n[1]);
    if(op==='product')assert.equal(a[0],n[0]*n[1]);
    if(op==='chair-rows')assert.equal(a[0],(n[0]+1)*n[1]);
    if(op==='array')assert.equal(a[0],(n[0]-1)*n[1]);
    if(op==='two-boxes')assert.equal(a[0],n[0]*n[1]+n[2]*n[3]);
    if(op==='large-fact-groups')assert.equal(a[0],n[0]*n[1]);
    if(op==='neighbor-fact'){assert.equal(n[0]*n[1],n[2]);assert.equal(a[0],n[3]*n[4]);}
    if(op==='double-fact'){assert.equal(n[0]*n[1],n[2]);assert.equal(a[0],n[3]*n[4]);}
  }
  if(kind==='division'){
    if(op==='missing-dividend')assert.equal(a[0]/n[0],n[1]);
    else if(op==='reserve-groups')assert.equal(a[0],(n[0]-n[1])/n[2]);
    else {assert.equal(a[0]*n[1]+(a[1]||0),n[0]);assert((a[1]||0)<n[1]);}
  }
  if(kind==='missing'){
    if(op==='missing-factor')assert.equal(a[0]*n[0],n[1]);
    if(op==='missing-dividend')assert.equal(a[0]/n[0],n[1]);
    if(op==='missing-addend')assert.equal(a[0]+n[0],n[1]);
    if(op==='missing-subtrahend')assert.equal(n[0]-a[0],n[1]);
    if(op==='multiply-add')assert.equal(n[0]*a[0]+n[1],n[2]);
    if(op==='two-sides')assert.equal(a[0]+n[0],n[1]*n[2]);
    if(op==='subtract-product')assert.equal(n[0]-a[0],n[1]*n[2]);
  }
  if(kind==='place'){
    if(op==='round-then-shift')assert.equal(a[0],Math.round(n[0]/100)*100+100);
    if(op==='two-shifts')assert.equal(a[0],n[0]+n[1]-n[2]);
    if(op==='expanded-pair')assert.equal(a[0]+a[1],n[0]-n.slice(1).reduce((s,v)=>s+v,0));
    if(op==='compare-shift')assert.equal(picked,n[0]+n[1]>n[2]?'Left':n[0]+n[1]<n[2]?'Right':'Equal');
    if(op==='round')assert.equal(a[0],Math.round(n[0]/n[1])*n[1]);
    if(op==='more')assert.equal(a[0],n[1]+n[0]);
    if(op==='less')assert.equal(a[0],n[1]-n[0]);
    if(op==='digit-value')assert.equal(a[0],Math.floor(n[0]/n[1])%10*n[1]);
    if(op==='expanded')assert.equal(a[0],n[0]-n.slice(1).reduce((s,v)=>s+v,0));
    if(op==='compare')assert.equal(picked,n[0]>n[1]?'>':n[0]<n[1]?'<':'=');
  }
  if(kind==='words'){
    if(op==='join')assert.equal(a[0],n[0]+n[1]);
    if(op==='left')assert.equal(a[0],n[0]-n[1]);
    if(op==='share-reserve')assert.equal(a[0],(n[0]-n[1])/n[2]);
    if(op==='pack-use')assert.equal(a[0],n[0]*n[1]-n[2]);
    if(op==='pack-extra')assert.equal(a[0],n[0]*n[1]+n[2]);
  }
  if(kind==='fractions'){
    if(op==='fraction-of-set')assert.equal(a[0],n[0]*n[2]/n[1]);
    if(op==='fraction-whole')assert.equal(a[0],n[1]*n[2]);
    if(op==='fraction-then-use')assert.equal(a[0],n[0]*n[2]/n[1]-n[3]);
    if(op==='equivalent-denominator')assert.equal(n[0]*a[0],n[1]*n[2]);
    if(op==='equivalent')assert.equal(n[0]*n[2],a[0]*n[1]);
    if(op==='compare')assert.equal(picked,n[0]*n[3]===n[2]*n[1]?'Equal':n[0]*n[3]>n[2]*n[1]?`${n[0]}/${n[1]}`:`${n[2]}/${n[3]}`);
    if(op==='shaded'){
      const parts=[...t.visual.matchAll(/class="quizmo-fraction-part" data-lit="(\d)"/g)];
      assert.equal(picked,`${parts.filter(m=>m[1]==='1').length}/${parts.length}`);
    }
  }
  if(op==='elapsed-time'){
    const start=(n[0]%12)*60+n[1],end=(n[2]%12)*60+n[3];assert.equal(a[0],(end-start+720)%720);
  }
  if(op==='change')assert.equal(a[0],n[0]*100-(n[1]*100+n[2]));
  if(kind==='measure'){
    if(op==='convert-add')assert.equal(a[0],n[0]*100+n[1]+n[2]);
    if(op==='missing-side')assert.equal(a[0],n[0]/2-n[1]);
    if(op==='convert-length')assert.equal(a[0],n[0]*100+n[1]);
    if(op==='perimeter')assert.equal(a[0],2*(n[0]+n[1]));
    if(op==='area'||op==='lshape-area')assert.equal(a[0],(t.visual.match(/class="quizmo-area-square"/g)||[]).length);
    if(op==='tell-time'){
      assert.equal(a[0],t.hour);assert.equal(a[1],t.minutes);
      assert(!t.visual.includes(`>${t.hour}:${String(t.minutes).padStart(2,'0')}<`),'No digital answer on clock');
    }
  }
}
function verifySeries(t){
  const ns=t.prompt.match(/\d+/g).map(Number),a=Number(t.choices[t.correct]),last=ns.at(-1),diff=ns.slice(1).map((n,i)=>n-ns[i]);let expected;
  if(t.operation==='plus'||t.operation==='minus')expected=last+diff[0];
  if(t.operation==='double')expected=last*2;
  if(t.operation==='alternating-growing')expected=last+diff.at(-2)+1;
  if(t.operation==='alternating')expected=last+diff[(ns.length-1)%2];
  if(t.operation==='growing'||t.operation==='squares')expected=last+diff.at(-1)+(diff[1]-diff[0]);
  if(t.operation==='double-add')expected=last*2+(ns[1]-ns[0]*2);
  if(t.operation==='interleaved')expected=ns.at(-2)+(ns.at(-2)-ns.at(-4));
  if(t.operation==='alternating-multiply')expected=(ns.length-1)%2?last+(ns[2]-ns[1]):last*2;
  assert.equal(a,expected,`Independent series rule: ${t.prompt}`);
}
// Targeted curriculum fixtures: borrowing, ungrouped sets, readable clocks and grid areas.
for(const l of [1,4,8])for(let i=0;i<50;i++){
  for(const id of ['addition','subtraction']){
    const t=G.question(id,l,{rng,mode:id==='addition'?'sum':'difference'});verifyMath(t);
    const operands=t.prompt.match(/\d+/g).map(Number);
    assert.deepEqual([...t.visual.matchAll(/class="quizmo-operand-row" data-value="(\d+)"/g)].map(m=>Number(m[1])),operands);
    const expected=operands.reduce((s,n)=>s+String(n).split('').reduce((s,d)=>s+Number(d),0),0);
    assert.equal((t.visual.match(/class="quizmo-base-block"/g)||[]).length,expected);
    const total=t.visual.slice(t.visual.indexOf('class="quizmo-total-row"'));
    assert([...total.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].every(m=>m[1]==='='||m[1]==='?'));
  }
  for(const mode of ['quantity','shaded','equivalent','compare'])verifyMath(G.question('fractions',l,{mode,rng}));
  for(const mode of ['clock','time','area'])verifyMath(G.question('measure',l,{mode,rng}));
}
for(const paid of [500,1000,2000]){
  const markup=V.measure({mode:'money',paid,cost:732});
  assert(markup.includes('$7.32')&&markup.includes('quizmo-dollar-bill')&&markup.includes('quizmo-price-tag'));
  assert.deepEqual([...markup.matchAll(/class="quizmo-coin" data-cents="(\d+)"/g)].map(m=>Number(m[1])),[25,10,5,1]);
}
// Explicit RNGs make planning reproducible, including fixed-bank shuffles.
for(const id of ids){
  const seeded=()=>{let state=12345;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32;};};
  const normalize=tasks=>JSON.parse(V.normalizeSvg(JSON.stringify(tasks)));
  assert.deepEqual(normalize(G.level(id,4,[],{rng:seeded()})),normalize(G.level(id,4,[],{rng:seeded()})));
}
console.log('PASS 48,000 generated levels: signatures, prompts, recent history, integer answers, unique randomized choices, SVGs, banks, arithmetic and progression');
