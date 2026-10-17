// Node-only audit of first-grade caps and minimum reasoning. No browser.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({window:{}});
for(const name of ['visuals','cogat','generators'])vm.runInContext(fs.readFileSync(`quizmo/${name}.js`,'utf8'),context);
const {JasperQuizmoGen:G,QuizmoCogat:C,QuizmoVisuals:V}=context.window;
let seed=0x718293;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const nums=s=>(s.match(/\d+/g)||[]).map(Number);
const banned=/\b(hectare|granary|circumference|reservoir|diminish|recede|orchestra|conductor|stethoscope|astronomer|owlet|rind|husk|librarian|starving)\b/i;
function vocabulary(text,tag){assert(!banned.test(text),tag);for(const word of text.match(/[A-Za-z]+/g)||[])assert(word.length<=8,`${tag}: long word ${word}`);}
function lanterns(t,tag){
 assert(!/data-groups|quizmo-lantern-group/.test(t.visual),`${tag}: grouped initial picture`);
 const rows=Number(t.visual.match(/data-rows="(\d+)"/)[1]),cols=Number(t.visual.match(/data-cols="(\d+)"/)[1]),[n,d,total]=t.operands,answer=n*total/d;
 assert.equal(rows,Math.ceil(total/cols),tag);assert(cols<=12&&rows<=6,tag);
 const avoid=[d,answer,t.answers?.[0]??answer];
 const safe=Array.from({length:11},(_,i)=>i+2).filter(c=>c<=total&&Math.ceil(total/c)<=6).some(c=>!avoid.includes(c)&&!avoid.includes(Math.ceil(total/c)));
 if(safe)assert(!avoid.includes(rows)&&!avoid.includes(cols),`${tag}: ${rows}×${cols} reveals denominator ${d} or fraction amount ${answer}`);
 assert.equal((t.visual.match(/class="quizmo-lantern"/g)||[]).length,total*2,tag);
}
function check(t,l){
 const id=t.source||t.kind,op=t.operation,p=t.prompt,a=t.answers||[],ns=nums(p),tag=`${id} L${l}: ${p}`;
 const cap=(vs,max)=>assert(vs.every(n=>Number.isFinite(n)&&n>=0&&n<=max),`${tag}: cap ${max}, got ${vs}`);
 assert(a.every(n=>n>0),`${tag}: zero answer`);
 if(t.choices)assert.notEqual(t.choices[t.correct],'0',`${tag}: zero choice answer`);
 assert(p.length<=70,`${tag}: ${p.length} characters`);
 assert(t.visual.includes('<svg')&&t.visual.includes('role="img"'),tag);
 assert(!/type 1 or 2|enter 1 or 2/i.test(p),tag);
 if(l>=3&&G.mathIds.includes(id))assert(!/^\s*\d+\s*[+−×÷]\s*\d+\s*=\s*\?\s*$/.test(p),`${tag}: bare fact`);
 if(t.choices){assert(t.correct>=0&&t.correct<t.choices.length,tag);assert.equal(new Set(t.choices).size,t.choices.length,tag);}
 if(id==='addition'){
   cap([...t.operands,...a],100);cap([t.addends.reduce((s,n)=>s+n,0)],l<=2?20:100);
   assert(t.addends.every(n=>n>=2),tag);
   if(op==='three-addends'){assert.equal(l,8,tag);cap(t.addends,9);assert.equal(t.steps,2,tag);}
   else {const [x,y]=t.addends;cap([x,y],l<=2?20:99);if(l>=3&&l<=4)cap([y],9);if(l>=3&&l<=5)assert(x%10+y%10<10,tag);if(l>=5)assert(x>=20,tag);}
   if(l<6)assert.equal(t.regroups,0,tag);
   if(op==='compare-sum')assert(t.choices.includes('<')&&t.choices.includes('>')&&t.choices.includes('='),tag);
 }
 if(id==='subtraction'){
   const [x,y]=t.subtrahends;cap([x,y,...a],l<=2?20:100);assert(x>y&&y>=2,tag);
   if(l>=3&&l<=4)cap([y],9);if(l>=3&&l<=5)assert(x%10>=y%10,tag);
   if(l<6)assert.equal(t.borrows,0,tag);
   if(l>=3)assert(x>=20,tag);
   if(op==='how-many-more')assert(y>=5&&x-y>=3,`${tag}: meaningful comparison`);
 }
 if(id==='times'){
   const f=t.factors;assert(f.every(n=>Number.isInteger(n)&&n>=1),tag);
   assert(f.length===2&&(f.every(n=>n<=5)||(f.includes(10)&&f.every(n=>n<=10))),tag);
   cap(a,f.includes(10)?100:25);
   if(op==='skip-count')assert([2,5,10].includes(t.operands[1]),tag);
   assert(/rows|number path/i.test(t.visual),tag);
 }
 if(id==='division'){
   cap([t.dividend],t.remainder?15:20);assert(t.divisor>=2,tag);
   if(t.remainder){assert.equal(l,8,tag);assert.equal(a.length,2,tag);assert(a[1]>0&&a[1]<t.divisor,tag);}
   else {assert.equal(a.length,1,tag);assert(!t.labels?.includes('Remainder'),tag);assert.equal(t.dividend%t.divisor,0,tag);}
   if(op!=='double')assert.equal((t.visual.match(/class="quizmo-sharing-item"/g)||[]).length,t.dividend,tag);
 }
 if(id==='place'){
   cap([...t.operands,...a],l<=5?120:999);assert(t.operands[0]>=10,tag);
   if(l<6&&['more','less'].includes(op))assert.equal(t.operands[1],10,tag);
   if(op==='compare')assert(t.choices.includes('<')&&t.choices.includes('>')&&t.choices.includes('='),tag);
   assert(!/round|thousand/i.test(p),tag);
   if(op==='expanded')assert(!String(t.operands[0]).includes('0'),`${tag}: zero place in expanded form`);
   if(op==='digit-value')assert(a[0]>0,tag);
   if(l===8&&op==='compare')assert(t.operands.every(n=>n>=100),tag);
 }
 if(id==='fractions'){
   assert(t.denominators.every(d=>[2,3,4].includes(d)),tag);
   for(const c of t.choices||[])for(const m of c.matchAll(/\d+\/(\d+)/g))assert([2,3,4].includes(Number(m[1])),tag);
   if(op==='fraction-of-set'){
     const [n,d,total]=t.operands;cap([total],12);assert((l>=7?[2,3,4]:[2,4]).includes(d),tag);if(l>=7)assert(total>=8,`${tag}: late set too small`);
     if(n>1){assert.equal(l,8,tag);assert.equal(d,4,tag);assert([2,3].includes(n),tag);cap([total],8);}
     lanterns(t,tag);assert.match(t.hintVisual,/data-groups=/,tag);
   }
   if(op==='shaded'||op==='count-parts'){if(l<6)assert.equal(t.operands[0],1,tag);else assert(t.operands[0]===1||t.operands[1]===4,tag);}
   if(op==='compare')assert(l>=3&&t.operands[0]===1&&t.operands[2]===1&&t.denominators.includes(2),tag);
   if(op==='equal-parts')assert(t.choices&&t.choices.length===4,tag);
 }
 if(id==='words'){
   if(t.money){cap([...t.coins,...a,t.paid,t.cost],100);assert(t.coins.every(n=>[1,5,10,25].includes(n)),tag);assert.equal((t.visual.match(/class="quizmo-coin"/g)||[]).length,t.coins.length,tag);if(op==='change'){assert(l>=6,tag);assert([10,25].includes(t.paid),tag);}}
   else if(op==='elapsed-hours'){assert(l>=3,tag);assert.equal(t.duration%60,0,tag);assert.equal(t.start%60,0,tag);assert.equal(t.end%60,0,tag);cap(a,3);}
   else {cap([...ns,...a],l<=2?20:50);if(l<=2)assert(['join','left'].includes(op),tag);else {assert.equal(op,'birds',tag);assert.equal(t.steps,2,tag);cap([ns[0]+ns[1]],50);}}
 }
 if(id==='missing'){
   cap([...ns,...a],l<=5?20:50);assert(ns.every(n=>n>=2),tag);
   if(op==='balance-add'){assert(l>=6,tag);assert.equal(t.steps,2,tag);}else assert.equal(t.steps,1,tag);
   assert(!/[×÷]/.test(p),tag);
 }
 if(id==='measure'){
   if(op==='tell-time'){cap([a[0]],12);assert(a[0]>=1,tag);cap([t.minutes],55);assert.deepEqual(Array.from(t.labels),t.minutes?['Hour','Minutes']:['Hour']);assert.equal(t.step,l<=2?60:l<=4?30:l<=6?15:5,tag);assert.equal(t.minutes%t.step,0,tag);}
   if(op==='ruler'){cap([t.start,t.end,...a],15);assert(t.end>t.start,tag);if(l<6)assert.equal(t.start,0,tag);assert(t.visual.includes('centimetre ruler'),tag);}
   if(t.lengths){cap(t.lengths,15);assert(t.lengths[1]>=5&&t.lengths[0]-t.lengths[1]>=3,tag);}
   if(op==='area'){assert(l>=6,tag);cap([t.area],20);assert(t.area>=4,tag);assert.equal((t.visual.match(/class="quizmo-area-square"/g)||[]).length,t.area,tag);}
 }
 if(C.games.some(g=>g[0]===id)){
   if(id==='links'||id==='groups'){vocabulary([p,t.hint,...t.choices].join(' '),tag);assert.equal(t.band,l<=2?1:l<=5?2:3,tag);}
   if(id==='series'){
     cap([...ns,...t.choices.map(Number)],49);assert(['plus','minus',...(l>=6?['alternating']:[])].includes(op),tag);
     const jumps=ns.slice(1).map((n,i)=>n-ns[i]);assert(jumps.every(n=>[1,2,5,10,-2].includes(n)),tag);if(l<6)assert(jumps.every(n=>n===jumps[0]),tag);
   }
   if(id==='puzzles'){cap([...ns,...t.choices.map(Number)],20);if(l<=5)assert.equal(t.steps,1,tag);else assert(t.steps>=2,tag);}
   if(id==='figures'){assert.equal(op,'matrix',tag);const data=JSON.parse(t.sig.slice('figures:matrix:'.length));assert.equal(data[2].length,l<=5?1:2,tag);assert.equal(data[3],false,tag);}
 }
}
// Audit every authored word and every distractor, including unselected rows.
for(const rel of C.audit.relations){
 if(rel.band===3)assert(['tool-job','whole-part','worker-place'].includes(rel.name),'Late links must use a relationship, not a color fact');
 assert(rel.pairs.length>=4);const map=new Map(rel.pairs.map(p=>[p[0],p[1]]));assert.equal(map.size,rel.pairs.length);
 for(const [a,b,...wrong] of rel.pairs){assert.equal(wrong.length,3);assert.equal(new Set([b,...wrong]).size,4);assert(wrong.every(w=>w!==map.get(a)));vocabulary([a,b,...wrong,rel.hint].join(' '),`Links audit: ${a} / ${b}`);}
}
for(const f of C.audit.features){
 assert.notEqual(f.name,'room-parts','Use a tight named category');
 assert(f.members.length>=4);assert.equal(new Set([...f.members,...f.outsiders]).size,f.members.length+f.outsiders.length);assert.equal(f.outsiders.length,3);
 vocabulary([...f.members,...f.outsiders,f.hint].join(' '),`Groups audit: ${f.name}`);
 for(const row of C.deck('groups',f.band===1?1:f.band===2?4:8,rng).filter(row=>row.feature===f.name)){assert(row[0].split(', ').every(w=>f.members.includes(w)));assert(f.members.includes(row[1]));assert(row.slice(2,5).every(w=>!f.members.includes(w)));
   const examples=row[0].split(', '),candidates=row.slice(1,5),categories=C.audit.features.filter(other=>examples.every(w=>other.members.includes(w))),fits=candidates.filter(word=>categories.some(other=>other.members.includes(word)));
   assert.deepEqual(Array.from(fits),[row[1]],`Exactly one answer fits every triple: ${row[0]}`);
 }
}
for(const sizes of Object.values(C.bankSizes))for(const size of sizes)assert(size>=15);
const modes={addition:['ten','double','sum','missing','pair','compare','three','story'],subtraction:['difference','compare','fewer','missing'],times:['groups','repeat','skip','missing','rows'],division:['sharing','grouping','half','double','remainder'],place:['expanded','shift','digit','compare'],fractions:['quantity','count','shaded','equal','compare'],words:['join','left','money','birds','time','change'],missing:['add','subtract','balance'],measure:['clock','length','compare','area'],series:['plus','minus','alternating'],puzzles:['machine','inverse','two-symbols','balance']};
for(const id of [...G.mathIds,...C.games.map(g=>g[0])]){
 for(let l=1;l<=8;l++){
   for(let trial=0;trial<200;trial++)for(const t of G.level(id,l,[],{rng}))check(t,l);
   for(const mode of modes[id]||[])for(let i=0;i<30;i++)check(G.question(id,l,{mode,rng}),l);
 }
 console.log(`PASS caps + floors ${id}: 200 levels × 8 tiers × 5 tasks, plus mode fixtures`);
}
for(const d of [2,4])for(let total=d;total<=12;total+=d)for(let n=1;n<d;n++)if(n===1||d===4&&total<=8)lanterns({operands:[n,d,total],visual:V.fractions({mode:'quantity',n,d,total})},`${n}/${d} of ${total}`);
console.log('PASS first-grade curriculum: caps, reasoning floors, full word-bank audit and ungrouped lanterns');
