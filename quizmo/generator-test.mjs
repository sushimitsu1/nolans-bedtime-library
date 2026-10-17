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
          assert(t.answers.length>0);
          for(const a of t.answers)assert(Number.isSafeInteger(a)&&a>=0,`${id} L${l}: bad answer ${a}`);
          assert(Number.isFinite(t.magnitude)&&t.magnitude>0);
          sum+=t.magnitude;
          verifyMath(t);
        }else{
          assert.equal(t.choices.length,4);assert.equal(new Set(t.choices.map(V.normalizeSvg)).size,4,`${id} L${l}: visually unique choices`);
          assert(Number.isInteger(t.correct)&&t.correct>=0&&t.correct<4);positions.add(t.correct);
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
  if(math.has(id)){
    const m=means[id];assert(m[7]>m[3]&&m[3]>m[0],`${id}: L8 > L4 > L1, ${m}`);
    for(let i=1;i<8;i++)assert(m[i]>=m[i-1]*.92,`${id}: difficulty fell at L${i+1}: ${m}`);
  }else assert.equal(positions.size,4,`${id}: all correct positions used`);
  console.log(`PASS ${id}: 8 × 200 levels + replays${math.has(id)?`; mean magnitudes ${means[id].map(Math.round).join(', ')}`:''}`);
}
// Independent arithmetic checks use the visible prompt, not the factory's answer calculation.
function verifyMath(t){
  const p=t.prompt,n=(p.match(/\d+/g)||[]).map(Number),a=t.answers;
  const kind=t.source||t.kind;
  if(kind==='addition')assert.equal(a[0],n.reduce((s,v)=>s+v,0));
  if(kind==='subtraction')assert.equal(a[0],n[0]-n[1]);
  if(kind==='times')assert.equal(a[0],n[0]*n[1]);
  if(kind==='division'){assert.equal(a[0]*n[1]+a[1],n[0]);assert(a[1]<n[1]);}
  if(kind==='missing'){
    if(t.operation==='missing-factor')assert.equal(a[0]*n[0],n[1]);
    if(t.operation==='missing-subtrahend')assert.equal(n[0]-a[0],n[1]);
    if(t.operation==='multiply-add')assert.equal(n[0]*a[0]+n[1],n[2]);
    if(t.operation==='divide-add')assert.equal(a[0]/n[0]+n[1],n[2]);
    if(t.operation==='two-sides')assert.equal(n[0]*a[0]+n[1],n[2]+n[3]);
  }
  if(kind==='place'){
    if(t.operation==='round')assert.equal(a[0],Math.round(n[0]/n[1])*n[1]);
    if(t.operation==='more')assert.equal(a[0],n[1]+n[0]);
    if(t.operation==='less')assert.equal(a[0],n[1]-n[0]);
    if(t.operation==='digit-value')assert.equal(a[0],Math.floor(n[0]/n[1])%10*n[1]);
    if(t.operation==='expanded')assert.equal(a[0],n[0]-n.slice(1).reduce((s,v)=>s+v,0));
    if(t.operation==='value-ratio')assert.equal(a[0],n[1]/n[2]);
  }
  if(kind==='words'){
    if(t.operation==='tickets')assert.equal(a[0],n[3]-(n[0]+n[1])*n[2]);
    if(t.operation==='share-reserve')assert.equal(a[0],(n[0]-n[1])/n[2]);
    const values=p.startsWith('The trail')?n.slice(1):n;
    if(t.operation==='pack-use')assert.equal(a[0],values[0]*values[1]-values[2]);
    if(t.operation==='pack-extra')assert.equal(a[0],values[0]*values[1]+values[2]);
  }
  if(kind==='fractions'){
    if(t.operation==='fraction-of-set')assert.equal(a[0],n[0]*n[2]/n[1]);
    if(t.operation==='equivalent')assert.equal(n[0]*n[2],a[0]*n[1]);
    if(t.operation==='like-add')assert.equal(a[0],n[0]+n[2]);
    if(t.operation==='compare'){const fs=[...p.matchAll(/(\d+)\/(\d+)/g)].map(m=>m.slice(1).map(Number));assert.equal(a[0],fs[0][0]*fs[1][1]>fs[1][0]*fs[0][1]?1:2);}
    if(t.operation==='mixed-sum'){
      const parts=[...p.matchAll(/(\d+)\/(\d+)/g)].map(m=>m.slice(1).map(Number)),den=parts[0][1],sum=parts.reduce((sum,[num,d])=>{assert.equal(d,den);return sum+num;},0);
      assert.equal(a[0],Math.floor(sum/den));assert.equal(a[1],sum%den);
    }
    if(['fraction-steps','fraction-remaining'].includes(t.operation)){
      const fractions=[...p.matchAll(/(\d+)\/(\d+)/g)].map(m=>m.slice(1).map(Number)),total=Number(p.match(/of (\d+) lanterns/)[1]);
      const lit=total*fractions[0][0]/fractions[0][1],red=lit*fractions[1][0]/fractions[1][1];
      assert(Number.isInteger(lit)&&Number.isInteger(red));
      assert.equal(a[0],t.operation==='fraction-steps'?red:lit-red);
    }
  }
  if(kind==='measure'){
    if(t.operation==='elapsed-time'){
      const start=(n[0]%12)*60+n[1],end=(n[2]%12)*60+n[3];assert.equal(a[0],(end-start+720)%720);
    }
    if(t.operation.startsWith('convert-'))assert.equal(a[0],n[0]*(t.operation==='convert-length'?100:t.operation==='convert-mass'?1000:60)+n[1]);
    if(t.operation==='change')assert.equal(a[0],n[0]*100-(n[1]*100+n[2]));
    if(t.operation==='area')assert.equal(a[0],n[0]*n[1]);
    if(t.operation==='perimeter')assert.equal(a[0],2*(n[0]+n[1]));
    if(t.operation==='missing-side')assert.equal(a[0],n[0]/2-n[1]);
    if(t.operation==='lshape-area')assert.equal(a[0],n[0]*n[1]-n[2]*n[3]);
  }
}
function verifySeries(t){
  const ns=t.prompt.match(/\d+/g).map(Number),a=Number(t.choices[t.correct]),last=ns.at(-1),diff=ns.slice(1).map((n,i)=>n-ns[i]);let expected;
  if(t.operation==='alternating')expected=last+diff[(ns.length-1)%2];
  if(t.operation==='growing'||t.operation==='squares')expected=last+diff.at(-1)+(diff[1]-diff[0]);
  if(t.operation==='double-add')expected=last*2+(ns[1]-ns[0]*2);
  if(t.operation==='interleaved')expected=ns.at(-2)+(ns.at(-2)-ns.at(-4));
  if(t.operation==='alternating-multiply')expected=(ns.length-1)%2?last+(ns[2]-ns[1]):last*2;
  assert.equal(a,expected,`Independent series rule: ${t.prompt}`);
}
// Targeted curriculum fixtures: exact operations, correct labels, meaningful SVG scenes.
for(const [id,l,mode] of [['subtraction',8,'zeros'],['fractions',5,'quantity'],['fractions',8,'steps'],['fractions',8,'whole-add'],['fractions',8,'remaining'],['measure',8,'lshape'],['measure',1,'time'],['missing',8,'divide-add']]){
  const t=G.question(id,l,{mode,rng});verifyMath(t);assert.match(t.visual,/<svg/);
  if(id==='fractions'&&l===5){const [n,d,total]=t.prompt.match(/\d+/g).map(Number);assert(n>1&&d>=6&&total>=54);}
}
for(const l of [1,2])for(let i=0;i<200;i++){
  const t=G.question('missing',l,{mode:'multiply',rng});
  const [factor,total]=t.prompt.match(/\d+/g).map(Number);
  assert(factor<=12&&t.answers[0]<=12&&total<=144);verifyMath(t);
}
for(const mode of ['steps','remaining','whole-add','equivalent','compare'])for(const l of [7,8])for(let i=0;i<50;i++){
  const t=G.question('fractions',l,{mode,rng});verifyMath(t);assert(!/Whole groups plus a fraction/.test(t.prompt));
}
// The chart must contain every operand, all its blocks, and only unknown result cells.
for(const id of ['addition','subtraction'])for(const level of [1,4,8])for(let i=0;i<30;i++){
  const t=G.question(id,level,{rng,mode:id==='addition'?'three':'zeros'}),operands=t.prompt.match(/\d+/g).map(Number);
  const pictured=[...t.visual.matchAll(/class="quizmo-operand-row" data-value="(\d+)"/g)].map(m=>Number(m[1]));
  assert.deepEqual(pictured,operands);
  const expectedBlocks=operands.reduce((sum,n)=>sum+String(n).split('').reduce((s,d)=>s+Number(d),0),0);
  assert.equal((t.visual.match(/class="quizmo-base-block"/g)||[]).length,expectedBlocks);
  const total=t.visual.slice(t.visual.indexOf('class="quizmo-total-row"'));
  assert([...total.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].every(m=>m[1]==='='||m[1]==='?'));
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
