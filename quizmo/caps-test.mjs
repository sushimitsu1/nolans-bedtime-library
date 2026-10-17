// Node-only bounds AND minimum reasoning requirements. Run: node quizmo/caps-test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({window:{}});
for(const name of ['visuals','cogat','generators'])vm.runInContext(fs.readFileSync(`quizmo/${name}.js`,'utf8'),context);
const {JasperQuizmoGen:G,QuizmoCogat:C,QuizmoVisuals:V}=context.window;
let seed=0x718293;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const banned=/\b(hectare|granary|circumference|reservoir|diminish|recede|kilolitre|centilitre|orchestra|conductor|editor|binding|descent|decline|stethoscope|astronomer|dusk|nightfall|hefty|cymbal|gong|murmur|mutter|owlet|rind|husk)\b/i;
const nums=s=>(s.match(/\d+/g)||[]).map(Number);
function vocabulary(text,tag){assert(!banned.test(text),tag);for(const word of text.match(/[A-Za-z]+/g)||[])assert(word.length<=9,`${tag}: long word ${word}`);}
function carryCount(a,b){let carry=0,count=0;for(let p=1;p<=100;p*=10){carry=Number(Math.floor(a/p)%10+Math.floor(b/p)%10+carry>=10);count+=carry;}return count;}
function borrowCount(a,b){let borrow=0,count=0;for(let p=1;p<=100;p*=10){borrow=Number(Math.floor(a/p)%10-borrow<Math.floor(b/p)%10);count+=borrow;}return count;}
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
 const floor=(vs,min)=>assert(vs.every(n=>n>=min),`${tag}: floor ${min}, got ${vs}`);
 assert(!/type 1 or 2|enter 1 or 2/i.test(p),tag);
 assert(!/=\s*([1-9]\d{2,})\s*\+\s*([1-9]\d{2,})/.test(p),tag);
 if(l>=3&&G.mathIds.includes(id))assert(!/^\s*\d+\s*[×÷]\s*\d+\s*=\s*\?\s*$/.test(p),`${tag}: bare fact`);
 if(t.choices){assert(t.correct>=0&&t.correct<t.choices.length,tag);assert.equal(new Set(t.choices).size,t.choices.length,tag);}
 if(id==='addition'){
   cap(a,1000);cap(t.operands,999);
   if(op==='three-addends'){assert(l>=2&&l<=4,tag);cap(t.operands,50);floor(t.operands,l===2?15:25);floor(a,l===4?110:l===3?90:60);}
   else if(op==='make-100')assert(l>=2&&l<=3,tag);
   else {
     const [x,y]=t.addends;cap([x,y],l<=2?99:999);cap([x+y],1000);
     floor([x],[25,45,150,250,350,450,350,400][l-1]);floor([y],[25,35,35,45,65,75,200,250][l-1]);
     floor([x+y],[60,90,190,300,420,520,700,800][l-1]);
     assert(carryCount(x,y)>=(l>=5?2:1),tag);
     if(l>=7){floor([x,y],200);assert(['sum','missing-addend','sum-then-use'].includes(op),tag);}
   }
 }
 if(id==='subtraction'){
   const [x,y]=t.subtrahends;cap([x,y,...a],l<=2?99:1000);assert.equal(borrowCount(x,y),1,tag);
   if(l>=3)floor([x],[0,0,140,240,340,440,640,740][l-1]);
   if(l>=5){floor([x,y],100);if(op==='how-many-more')floor(ns,100);}
   if(l>=6)floor([y],l===6?200:300);
 }
 if(id==='times'){
   const max=l<=2?5:l===3?6:l<=6?10:12;cap(t.factors,max);
   if(l>=3)assert(op!=='product',tag);
   if(l>=4)assert(t.factors.every(n=>![1,2,10].includes(n)),`${tag}: reflex factor`);
   if(l>=4&&l<=5){floor(t.factors,6);cap(t.factors,9);}
   if(l>=6){assert(op!=='missing-factor',tag);assert(t.steps>=2,tag);floor(a,l===6?42:l===7?55:60);}
   if(l>=7)assert(t.factors.some(n=>n===11||n===12)||op==='two-boxes',tag);
 }
 if(id==='division'){
   cap([t.dividend],l<=3?50:t.remainder?50:100);
   if(l<=6){cap([t.divisor,t.dividend/t.divisor],10);if(l>=4)floor([t.divisor,t.dividend/t.divisor],l===4?4:6);}
   if(t.remainder){assert(l>=7,tag);cap([t.divisor],6);floor([t.dividend],l===7?18:25);floor([a[0]],l===7?4:5);assert.equal(a.length,2,tag);assert(a[1]>0&&a[1]<t.divisor,tag);}
   else {assert.equal(a.length,1,tag);assert(!t.labels?.includes('Remainder'),tag);}
   if(l>=6){assert(['reserve-groups','quotient-remainder'].includes(op),tag);assert(t.steps>=2,tag);}
   if(op==='reserve-groups'){cap([t.stock],100);floor([t.saved],l>=7?8:5);floor(a,l>=7?7:6);}
 }
 if(id==='place'){
   cap([...t.operands,...a],l<=5?999:9999);floor([t.operands[0]],[120,200,300,400,500,1200,3500,6500][l-1]);
   if(l>=3&&op==='expanded')floor(a,10);
   if(l>=6)assert(t.steps>=2,tag);
   if(op==='expanded-pair'){assert.equal(a.length,2,tag);floor([a[0]],100);floor([a[1]],20);}
   if(op==='compare')assert(t.choices.includes('<')&&t.choices.includes('>')&&t.choices.includes('='),tag);
 }
 if(id==='fractions'){
   const allowed=l===1?[2,4]:l<=4?[2,3,4]:[2,3,4,5,6,8];
   assert(t.denominators.every(d=>allowed.includes(d)),tag);cap([t.total||0],l<=2?12:24);
   if(l<=2){assert(['fraction-of-set','fraction-whole','shaded'].includes(op),tag);assert.equal(t.operands[0],1,tag);}
   if(op==='compare')assert(l>=4&&t.choices,tag);
   if(op.startsWith('equivalent'))assert(l>=5,tag);
   if(l>=6){assert(!['shaded','fraction-whole'].includes(op),tag);if(t.total)floor(a,8);}
   if(l>=7&&t.total){assert.equal(op,'fraction-then-use',tag);assert(t.steps>=3,tag);}
   for(const c of t.choices||[])for(const m of c.matchAll(/\d+\/(\d+)/g))assert(allowed.includes(Number(m[1])),tag);
   if(['fraction-of-set','fraction-then-use'].includes(op)){lanterns(t,tag);assert.match(t.hintVisual,/data-groups=/,tag);}
   if(op==='shaded'){const pairs=t.choices.map(c=>c.split('/').map(Number));for(let i=0;i<pairs.length;i++)for(let j=i+1;j<pairs.length;j++)assert(pairs[i][0]*pairs[j][1]!==pairs[j][0]*pairs[i][1],`${tag}: equivalent choices`);}
 }
 if(id==='missing'){
   cap([...ns,...a],100);
   if(l<=3)assert(t.steps===1,tag);
   if(l>=5){assert(['two-sides','multiply-add','subtract-product'].includes(op)&&t.steps===2,tag);const product=op==='multiply-add'?ns[0]*a[0]:ns[1]*ns[2];floor([product],[0,0,0,16,20,30,42,56][l-1]);}
 }
 if(id==='words'){
   if(t.money){cap([t.paid,t.cost,...a],2000);assert(t.paid>t.cost,tag);if(l>=3)assert(t.cost%100!==0,tag);if(l>=7){assert([25,75].includes(t.cost%100),tag);floor(a,125);floor([t.cost],600);}}
   else {cap([...ns,...a],100);if(l<=2)assert(['join','left'].includes(op),tag);}
   if(l>=3)assert(t.steps>=2,tag);
   if(['pack-use','pack-extra'].includes(op)){floor([ns[0]],[0,0,3,4,5,6,7,8][l-1]);floor([ns[1]],[0,0,4,5,6,6,7,7][l-1]);floor(a,[0,0,12,18,24,30,35,42][l-1]);}
   if(op==='share-reserve')floor(a,l>=7?7:l>=5?6:4);
 }
 if(id==='measure'){
   if(t.sides)cap(t.sides,12);
   if(t.area){cap([t.area],40);assert.equal((t.visual.match(/class="quizmo-area-square"/g)||[]).length,t.area,tag);floor([t.area],[0,4,9,20,30,30,24,28][l-1]);if(l>=7)assert(op==='lshape-area'&&t.steps===2,tag);}
   if(l>=7)assert(['tell-time','elapsed-time','missing-side','lshape-area'].includes(op),tag);
   if(op==='missing-side'){floor(a,l===6?6:l===7?7:9);assert(t.steps===2,tag);}
   if(op==='tell-time'){
     floor([a[0]],1);cap([a[0]],12);cap([a[1]],55);assert(a[1]%t.step===0,tag);assert.deepEqual(Array.from(t.labels),['Hour','Minutes']);
     assert.equal(t.step,l===1?60:l<=4?30:l<=6?15:5,tag);if(l>=7)assert(a[1]%15!==0,tag);
   }
   if(op==='convert-length'){floor([ns[0]],l<=2?1:l<=4?2:3);floor([ns[1]],[5,25,25,35,45,55,55,55][l-1]);}
   if(op==='convert-add'){assert(l===6&&t.steps===2,tag);assert(ns[1]+ns[2]>=100,tag);}
 }
 if(op==='elapsed-time'){
   const step=l<=2?60:l<=4?30:l<=6?15:5;assert.equal(t.step,step,tag);assert.equal(a[0]%step,0,tag);
   if(l>=3)assert(Math.floor(t.end/60)>Math.floor(t.start/60)||l===3,tag);
   if(l===4)floor(a,90);
   if(l>=5&&l<=6){assert.equal(t.start%60,45,tag);floor(a,id==='words'?75:90);}
   if(l>=7){assert(t.start%15!==0&&t.end%15!==0&&a[0]%15!==0,tag);floor(a,l===7?45:65);}
 }
 if(C.games.some(g=>g[0]===id)){
   const words=[p,t.hint,...t.choices.map(c=>c.replace(/<[^>]*>/g,''))].join(' ');assert(!banned.test(words),tag);
   for(const word of words.match(/[A-Za-z]+/g)||[])assert(word.length<=9,`${tag}: long word ${word}`);
   if(id==='links'||id==='groups')assert.equal(t.band,l<=2?1:l<=5?2:3,tag);
   if(id==='series'){cap([...ns,...t.choices.map(Number)],100);if(l<=2)assert(['plus','minus'].includes(op),tag);if(l>=6)assert(['interleaved','alternating-growing'].includes(op),tag);if(l>=7)assert.equal(op,'interleaved',tag);}
   if(id==='puzzles'){cap([...ns,...t.choices.map(Number)],60);assert.equal(t.steps,l<=2?1:l===3?2:op==='machine'?2:3,tag);if(l>=7)assert(['two-symbols','balance'].includes(op),tag);}
   if(id==='figures'){if(op==='paper')assert.match(t.visual,new RegExp(`${l===8?2:1} fold lines`),tag);else {const data=JSON.parse(t.sig.slice('figures:matrix:'.length));assert.equal(data[2].length,l<=2?1:2,tag);assert.equal(data[3],l>=7,tag);}}
 }
}
// Audit every authored family, not just the items picked by the random test run.
for(const rel of C.audit.relations){
 assert(rel.pairs.length>=4);const map=new Map(rel.pairs.map(p=>[p[0],p[1]]));assert.equal(map.size,rel.pairs.length);
 for(const [a,b,...wrong] of rel.pairs){assert.equal(wrong.length,3);assert.equal(new Set([b,...wrong]).size,4);assert(wrong.every(w=>w!==map.get(a)));vocabulary([a,b,...wrong,rel.hint].join(' '),`Full links audit: ${a} / ${b}`);}
}
for(const f of C.audit.features){
 assert(f.members.length>=4);assert.equal(new Set([...f.members,...f.outsiders]).size,f.members.length+f.outsiders.length);assert.equal(f.outsiders.length,3);
 vocabulary([...f.members,...f.outsiders,f.hint].join(' '),`Full groups audit: ${f.name}`);
 for(const row of C.deck('groups',f.band===1?1:f.band===2?4:8,rng).filter(row=>row.feature===f.name)){assert(row[0].split(', ').every(w=>f.members.includes(w)));assert(f.members.includes(row[1]));assert(row.slice(2,5).every(w=>!f.members.includes(w)));}
}
for(const game of C.games)for(const word of game.join(' ').match(/[A-Za-z]+/g)||[])assert(word.length<=9);
for(const sizes of Object.values(C.bankSizes))for(const size of sizes)assert(size>=15);
for(const id of [...G.mathIds,...C.games.map(g=>g[0])]){
 for(let l=1;l<=8;l++)for(let trial=0;trial<200;trial++)for(const t of G.level(id,l,[],{rng}))check(t,l);
 console.log(`PASS caps + floors ${id}: 200 levels × 8 tiers × 5 tasks`);
}
// Exhaustive countable-set layout check, including layouts not sampled this run.
for(const d of [2,3,4,5,6,8])for(let total=d;total<=24;total+=d)if(total>=4)for(let n=1;n<d;n++)lanterns({operands:[n,d,total],visual:V.fractions({mode:'quantity',n,d,total})},`${n}/${d} of ${total}`);
for(const [n,d,total,rows,cols] of [[4,5,20,2,10],[2,3,12,2,6],[3,4,12,2,6]]){const visual=V.fractions({mode:'quantity',n,d,total});assert.match(visual,new RegExp(`data-rows="${rows}" data-cols="${cols}"`));}
console.log('PASS 24,000 levels / 120,000 tasks: explicit floors, caps, bank audit and non-revealing lantern arrangements');
