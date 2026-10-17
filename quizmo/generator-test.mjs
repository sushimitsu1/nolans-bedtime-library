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
      if(['figures','measure'].includes(id))assert.equal(new Set(tasks.map(t=>t.prompt+'|'+V.normalizeSvg(t.visual))).size,5,`${id} L${l}: unique visual questions under the shared instruction`);
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
          if(id==='puzzles')verifyPuzzle(t);
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
// fact range, inverse facts, comparing two fraction pieces, and extra steps add work.
function difficultyScore(t){
 const k=t.source||t.kind,n=t.operands||[],max=Math.max(0,...n),steps=t.steps||1;
 if(k==='addition')return Math.max(...t.addends)/15+(t.regroups||0)*2+steps;
 if(k==='subtraction')return max/15+(t.borrows||0)*2;
 if(k==='times')return Math.max(...t.factors)/4+(t.answers[0]||0)/20+steps+(['missing-factor','add-row'].includes(t.operation)?3:0);
 if(k==='division')return t.dividend/10+t.divisor/2+steps+(t.remainder?2:0);
 if(k==='place')return max/100+steps;
 if(k==='fractions')return Math.max(...t.denominators)+(t.operands[0]>1?1:0)+steps+(t.operation==='compare'?2:0);
 if(k==='words')return t.money?t.paid/15+steps:t.operation==='elapsed-hours'?t.duration/60+steps:max/10+steps;
 if(k==='missing')return max/10+steps*3;
 if(k==='measure')return t.operation==='tell-time'?2+60/t.step:t.operation==='area'?4+t.area/10:Math.max(...(t.lengths||[t.length]))/15+steps;
 if(k==='links'||k==='groups')return t.band*3;
 if(k==='series'){const ns=t.prompt.match(/\d+/g).map(Number);return Math.abs(ns[1]-ns[0])+(t.operation==='alternating'?10:0);}
 if(k==='puzzles'){const ns=t.prompt.match(/\d+/g).map(Number);return steps*3+Math.max(...ns)/10+(t.operation==='machine'||t.operation==='inverse'?(ns[1]-ns[0])/3:0);}
 if(k==='figures'){const data=JSON.parse(t.sig.slice('figures:matrix:'.length));return data[2].length+(data[2].some(a=>['angle','size','position'].includes(a))?1:0);}
 throw Error(k);
}
// Independent checks read the facts in the prompt or count the drawn objects.
function verifyMath(t){
 const p=t.prompt,n=(p.match(/\d+/g)||[]).map(Number),a=t.answers,op=t.operation,k=t.source||t.kind,picked=t.choices?.[t.correct];
 if(k==='addition'){
   if(op==='sum'||op==='three-addends')assert.equal(a[0],n.reduce((x,y)=>x+y,0));
   if(op==='missing-addend')assert.equal(n[0]+a[0],n[1]);
   if(op==='make-ten')assert.equal(n[0]+Number(picked),n[1]);
   if(op==='compare-sum')assert.equal(picked,n[0]+n[1]>n[2]?'>':n[0]+n[1]<n[2]?'<':'=');
 }
 if(k==='subtraction'){
   if(op==='missing-subtrahend')assert.equal(n[0]-a[0],n[1]);
   else assert.equal(a[0],n[0]-n[1]);
 }
 if(k==='times'){
   if(op==='product')assert.equal(a[0],n[0]*n[1]);
   if(op==='missing-factor')assert.equal(a[0]*n[0],n[1]);
   if(op==='repeated-addition')assert.equal(a[0],n.reduce((x,y)=>x+y,0));
   if(op==='skip-count')assert.equal(a[0],n.at(-1)+n[0]);
   if(op==='add-row')assert.equal(a[0],(n[0]+1)*n[1]);
 }
 if(k==='division'){
   const count=(t.visual.match(/class="quizmo-sharing-item"/g)||[]).length;
   if(op==='double')assert.equal(a[0],2*n[0]);
   else {assert.equal(count,n[0]);assert.equal(a[0]*(op==='half'?2:n[1])+(a[1]||0),n[0]);}
 }
 if(k==='place'){
   if(op==='more')assert.equal(a[0],n[0]+n[1]);
   if(op==='less')assert.equal(a[0],n[1]-n[0]);
   if(op==='digit-value'){const pow=p.includes('hundreds')?100:p.includes('tens')?10:1;assert.equal(a[0],Math.floor(n[0]/pow)%10*pow);}
   if(op==='expanded')assert.equal(a[0],n[0]-n.slice(1).reduce((x,y)=>x+y,0));
   if(op==='compare')assert.equal(picked,n[0]>n[1]?'>':n[0]<n[1]?'<':'=');
 }
 if(k==='fractions'){
   if(op==='fraction-of-set')assert.equal(a[0],n[0]*n[2]/n[1]);
   if(op==='compare')assert.equal(picked,n[1]<n[3]?`1/${n[1]}`:`1/${n[3]}`);
   if(['count-parts','shaded'].includes(op)){
     const parts=[...t.visual.matchAll(/class="quizmo-fraction-part" data-lit="(\d)"/g)],lit=parts.filter(m=>m[1]==='1').length;
     assert.equal(op==='shaded'?picked:a[0],op==='shaded'?`${lit}/${parts.length}`:parts.length);
   }
   if(op==='equal-parts'){
     const groups=Array.from({length:4},(_,i)=>[...t.visual.matchAll(new RegExp(`data-option="${i}" data-width="([^"]+)"`,'g'))].map(m=>Number(m[1])));
     const fits=groups.map((g,i)=>g.length===n[0]&&g.every(w=>Math.abs(w-g[0])<.001)?String.fromCharCode(65+i):null).filter(Boolean);
     assert.deepEqual(fits,[picked]);
   }
 }
 if(k==='words'){
   if(op==='join')assert.equal(a[0],n[0]+n[1]);
   if(op==='left')assert.equal(a[0],n[0]-n[1]);
   if(op==='birds')assert.equal(a[0],n[0]+n[1]-n[2]);
   if(op==='count-coins')assert.equal(a[0],[...t.visual.matchAll(/class="quizmo-coin" data-cents="(\d+)"/g)].reduce((sum,m)=>sum+Number(m[1]),0));
   if(op==='change')assert.equal(a[0],n[0]-n[1]);
   if(op==='elapsed-hours')assert.equal(a[0],((n[2]%12)*60+n[3]-(n[0]%12)*60-n[1]+720)%720/60);
 }
 if(k==='missing'){
   if(op==='missing-addend')assert.equal(a[0]+n[0],n[1]);
   if(op==='missing-subtrahend')assert.equal(n[0]-a[0],n[1]);
   if(op==='balance-add')assert.equal(a[0]+n[0],n[1]+n[2]);
 }
 if(k==='measure'){
   if(op==='tell-time'){assert.deepEqual(Array.from(a),[t.hour,t.minutes]);assert(!t.visual.includes(`>${t.hour}:${String(t.minutes).padStart(2,'0')}<`));}
   if(op==='length-gap')assert.equal(a[0],n[0]-n[1]);
   if(op==='ruler')assert.equal(a[0],t.end-t.start);
   if(op==='area')assert.equal(a[0],(t.visual.match(/class="quizmo-area-square"/g)||[]).length);
   if(op==='compare-length')assert.equal(picked,p.includes('shorter')?'B':'A');
 }
}
function verifyPuzzle(t){
 const n=t.prompt.match(/\d+/g).map(Number),picked=Number(t.choices[t.correct]);
 if(t.operation==='machine'||t.operation==='inverse'){
   assert.equal(n[1]-n[0],n[3]-n[2]);
   assert.equal(picked,t.operation==='machine'?n[4]+n[1]-n[0]:n[4]-(n[1]-n[0]));
 }
 if(t.operation==='two-symbols')assert.equal(picked,n[1]-n[0]/2+n[2]);
 if(t.operation==='balance')assert.equal(picked,n[1]+n[2]-n[0]+n[3]);
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
  for(const mode of ['quantity','shaded','equal','compare'])verifyMath(G.question('fractions',l,{mode,rng}));
  for(const mode of ['clock','length','area'])verifyMath(G.question('measure',l,{mode,rng}));
}
for(const coins of [[1,5,10,25],[25,25,25,25]]){
 const markup=V.coins({coins});assert.deepEqual([...markup.matchAll(/class="quizmo-coin" data-cents="(\d+)"/g)].map(m=>Number(m[1])),coins);
}
// Explicit RNGs make planning reproducible, including fixed-bank shuffles.
for(const id of ids){
  const seeded=()=>{let state=12345;return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/2**32;};};
  const normalize=tasks=>JSON.parse(V.normalizeSvg(JSON.stringify(tasks)));
  assert.deepEqual(normalize(G.level(id,4,[],{rng:seeded()})),normalize(G.level(id,4,[],{rng:seeded()})));
}
console.log('PASS 48,000 generated levels: signatures, prompts, recent history, integer answers, unique randomized choices, SVGs, banks, arithmetic and progression');
