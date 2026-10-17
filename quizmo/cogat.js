/* Original reasoning practice, authored for Quizmo; no real test items. No DOM. */
(() => {
  'use strict';
  const V=window.QuizmoVisuals;
  const games=[['links','Word Pair Rockets','Discover links between words.'],['groups','Belonging Buddies','Find what belongs together.'],['series','Number Comets','Find rules in number rows.'],['puzzles','Balance Beacons','Solve machines and shape puzzles.'],['figures','Shape Scouts','Find the change in each row.']];
  // Audited relation families: each target has one valid partner and three
  // domain-related, non-matching choices. Bands never fall back to an easier pool.
  const relation=(band,name,hint,rows)=>({band,name,hint,pairs:rows.trim().split('\n').map(s=>s.split('|'))});
  const relations=[
    relation(1,'opposite','Find the opposite word.',`
hot|cold|warm|wet|dry
wet|dry|damp|cold|hot
full|empty|open|large|heavy
open|closed|wide|empty|full
up|down|over|high|near
fast|slow|quick|loud|late
big|small|wide|long|heavy
clean|dirty|neat|dry|new
`),
    relation(1,'baby-adult','Match each baby to its grown animal.',`
kitten|cat|dog|cow|sheep
puppy|dog|cat|pig|horse
lamb|sheep|cow|horse|pig
calf|cow|sheep|pig|dog
piglet|pig|cow|sheep|horse
`),
    relation(2,'part-whole','Find the whole that has this part.',`
page|book|shelf|pen|desk
sleeve|shirt|shoe|sock|hat
petal|flower|soil|pot|vase
fin|fish|bird|cat|bee
beak|bird|fish|dog|worm
pedal|bike|sled|kite|boat
`),
    relation(2,'animal-home','Match each animal to its home.',`
bee|hive|web|den|nest
spider|web|hive|den|nest
fox|den|hive|web|nest
bird|nest|web|hive|den
`),
    relation(3,'tool-job','Match each tool to its job.',`
ruler|measure|sweep|unlock|cut
broom|sweep|measure|unlock|cut
key|unlock|sweep|measure|cut
scissors|cut|unlock|sweep|measure
`),
    relation(3,'whole-part','Find a part of each thing.',`
bird|wing|nest|sky|worm
fish|fin|pond|water|swim
tree|branch|soil|shade|forest
book|page|shelf|desk|reader
shirt|sleeve|hat|closet|hanger
`),
    relation(3,'worker-place','Match each job to its usual place.',`
teacher|school|farm|stage|kitchen
cook|kitchen|school|farm|stage
farmer|farm|school|stage|kitchen
actor|stage|farm|school|kitchen
`)
  ];
  const links=relations.flatMap(rel=>rel.pairs.flatMap((first,i)=>rel.pairs.filter((_,j)=>j!==i).map(target=>Object.assign([first[0],first[1],target[0],target[1],...target.slice(2),rel.hint],{band:rel.band,relation:rel.name}))));
  // Feature membership is explicit. The three examples and answer all satisfy
  // this exact feature; all three alternatives fail it. No vague 'related' sets.
  const feature=(band,name,members,outsiders,hint)=>({band,name,members:members.split('|'),outsiders:outsiders.split('|'),hint});
  const features=[
    feature(1,'seats','chair|stool|bench|sofa','shelf|cup|rug','All are made to sit on.'),
    feature(1,'clothes','shirt|coat|vest|jacket','cup|plate|bowl','All are clothes.'),
    feature(1,'body','arm|leg|hand|foot','hat|shoe|sock','All are parts of your body.'),
    feature(1,'wheels','bike|wagon|car|bus','boat|raft|sled','All roll on wheels.'),
    feature(1,'sky','sun|moon|star|cloud','rock|root|worm','All are things in the sky.'),
    feature(1,'school','pen|pencil|crayon|chalk','fork|spoon|knife','All are used to write or draw.'),
    feature(2,'seats','chair|stool|bench|sofa','shelf|cup|rug','All are made to sit on.'),
    feature(2,'clothes','shirt|coat|vest|jacket','cup|plate|bowl','All are clothes.'),
    feature(2,'body','arm|leg|hand|foot','hat|shoe|sock','All are parts of your body.'),
    feature(2,'wheels','bike|wagon|car|bus','boat|raft|sled','All roll on wheels.'),
    feature(2,'sky','sun|moon|star|cloud','rock|root|worm','All are things in the sky.'),
    feature(2,'school','pen|pencil|crayon|chalk','fork|spoon|knife','All are used to write or draw.'),
    feature(3,'seats','chair|stool|bench|sofa','shelf|cup|rug','All are made to sit on.'),
    feature(3,'clothes','shirt|coat|vest|jacket','cup|plate|bowl','All are clothes.'),
    feature(3,'body','arm|leg|hand|foot','hat|shoe|sock','All are parts of your body.'),
    feature(3,'wheels','bike|wagon|car|bus','boat|raft|sled','All roll on wheels.'),
    feature(3,'sky','sun|moon|star|cloud','rock|root|worm','All are things in the sky.'),
    feature(3,'school','pen|pencil|crayon|chalk','fork|spoon|knife','All are used to write or draw.'),
    feature(1,'fruit','apple|pear|plum|peach','carrot|bean|potato','All are fruits.'),
    feature(1,'headwear','hat|cap|helmet|crown','boot|sock|glove','All are worn on the head.'),
    feature(1,'colors','red|blue|yellow|green','bright|dark|paint','All name colors.'),
    feature(1,'farm','cow|pig|goat|sheep','lion|tiger|wolf','All are farm animals.'),
    feature(1,'water-travel','boat|raft|ship|canoe','car|plane|train','All travel on water.'),
    feature(1,'young','kitten|puppy|lamb|calf','cat|dog|cow','All name young animals.'),
    feature(2,'plant-parts','root|stem|leaf|flower','soil|water|pot','All are parts of a plant.'),
    feature(2,'bike-parts','wheel|seat|pedal|chain','helmet|road|garage','All are parts of a bike.'),
    feature(2,'coins','penny|nickel|dime|quarter','wallet|price|bill','All name coins.'),
    feature(2,'birds','duck|hen|robin|eagle','bat|bee|moth','All are birds.'),
    feature(2,'footwear','boot|shoe|sandal|slipper','hat|glove|sleeve','All are worn on the feet.'),
    feature(2,'flowers','rose|daisy|tulip|lily','oak|pine|grass','All are flowers.'),
    feature(3,'insects','bee|ant|fly|beetle','spider|worm|snail','All are bugs with six legs.'),
    feature(3,'heat-cook','bake|boil|fry|roast','slice|peel|stir','All use heat to cook food.'),
    feature(3,'underground','carrot|potato|beet|radish','pea|corn|lettuce','The part we eat grows under the soil.'),
    feature(3,'trees','oak|pine|maple|birch','rose|grass|daisy','All are trees.'),
    feature(3,'sense-actions','listen|watch|smell|taste','eye|nose|sound','All are things you do to sense things.'),
    feature(3,'weekdays','Monday|Tuesday|Friday|Sunday','March|winter|year','All name days of the week.')
  ];
  const groups=features.flatMap(f=>f.members.map((answer,i)=>Object.assign([[1,2,3].map(k=>f.members[(i+k)%f.members.length]).join(', '),answer,...f.outsiders,f.hint],{band:f.band,feature:f.name})));
  const band=l=>l<=2?1:l<=5?2:3;
  const pool=(bank,l)=>bank.filter(item=>item.band===band(l));
  function deck(id,l,r=Math.random){
    const items=pool(id==='links'?links:groups,l).slice();
    for(let i=items.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[items[i],items[j]]=[items[j],items[i]];}
    return items;
  }
  function bankItem(id,l,r,opts){const items=pool(id==='links'?links:groups,l);return opts.bankItem||items[Math.floor(r()*items.length)];}
  const int=(a,b,r)=>a+Math.floor(r()*(b-a+1));
  const pick=(a,r)=>a[int(0,a.length-1,r)];
  function question(id,l,opts={}) {
    const r=opts.rng||Math.random;
    let prompt,visual='',hint,answer,wrong,signature,operation=id;
    if(id==='links') {const [a,b,c,d,e,f,g,strategy]=bankItem(id,l,r,opts);prompt=`${a} : ${b} :: ${c} : ?`;answer=d;wrong=[e,f,g];hint=strategy;signature=`links:${a}:${b}:${c}`;visual=V.svg('Word pairs: use the same link as the first pair',V.text(150,100,a,28)+V.text(450,100,b,28)+V.text(150,200,c,28)+V.text(450,200,'?',35)+'<path d="M245 100h100m-13-9 13 9-13 9M245 200h100m-13-9 13 9-13 9" fill="none" stroke="#357ca5" stroke-width="3"/>');}
    if(id==='groups'){const [a,b,c,d,e,strategy]=bankItem(id,l,r,opts);prompt=`${a}: which word belongs?`;answer=b;wrong=[c,d,e];hint=strategy;signature=`groups:${a}`;visual=V.svg('Three words share a feature',a.split(', ').map((s,i)=>V.rect(50+i*175,75,155,110,'#fff3d8')+V.text(127+i*175,130,s,s.length>12?15:20)).join(''));}
    if(id==='series') {
      const types=l<=2?['plus','minus']:l<=5?['plus']:['alternating','alternating','alternating','plus','minus'];
      const type=types.includes(opts.mode)?opts.mode:pick(types,r),step=pick(l<=2?[1,2]:l===3?[2,5]:l<=5?[5,10]:[1,2,5,10],r);
      const jumps=type==='alternating'?pick([[1,2],[2,5],[5,-2],[10,-2]],r):[type==='minus'?-2:step];
      const count=type==='alternating'?4:pick([3,4],r);
      const start=type==='minus'?int(2*count+1,48,r):int(0,48-count*Math.max(...jumps),r);
      const ns=[start];for(let i=0;i<count;i++)ns.push(ns.at(-1)+jumps[i%jumps.length]);
      answer=ns.pop();wrong=[answer+1,answer-1,answer+2,ns.at(-1)];
      prompt=`${ns.join(', ')}, ?`;signature=`series:${type}:${ns.join(',')}`;operation=type;
      hint=type==='alternating'?'Two jumps take turns. Which jump comes next?':'Find the same jump each time.';
      visual=V.svg('Number row: find the next step',ns.map((n,i)=>V.rect(25+i*143,90,132,80,i%2?'#fff3d8':'#bad7e7')+V.text(91+i*143,130,n,27)).join(''));
    }
    if(id==='puzzles') {
      const types=l<=5?['machine','inverse']:['two-symbols','balance'],type=types.includes(opts.mode)?opts.mode:pick(types,r);operation=type;
      if(type==='machine'||type==='inverse'){
        const a=int(1,l<=2?4:8,r),u=int(1,5,r),v=u+int(1,3,r),input=pick(Array.from({length:20-a},(_,i)=>i+1).filter(n=>n!==u&&n!==v),r),f=n=>n+a;
        prompt=type==='machine'?`${u} → ${f(u)}, ${v} → ${f(v)}. ${input} → ?`:`${u} → ${f(u)}, ${v} → ${f(v)}. ? → ${f(input)}`;
        answer=type==='machine'?f(input):input;wrong=[answer-1,answer+1,type==='machine'?input:input+a];
        hint='Find the same add step in both pairs.';
        visual=V.machine({input:type==='machine'?input:'?',op:`${u} → ${f(u)}`,op2:`${v} → ${f(v)}`,output:type==='machine'?'?':f(input)});signature=`puzzles:${type}:${u},${v},${a},${input}`;
      }else if(type==='two-symbols'){
        const t=int(1,6,r),v=int(1,6,r),z=int(1,6,r);
        prompt=`△ + △ = ${2*t}. △ + □ = ${t+v}. □ + ${z} = ?`;answer=v+z;wrong=[t+z,v,t+v];hint='Find one triangle, then one square. Use the last sum.';
        visual=V.machine({input:'△, □',op:`△ + △ = ${2*t}`,op2:`△ + □ = ${t+v}`,output:'?'});signature=`puzzles:two-symbols:${t},${v},${z}`;
      }else{
        const a=int(2,8,r),b=int(2,8,r),c=int(1,a+b,r),x=a+b-c,z=int(1,Math.min(8,20-x),r);
        prompt=`★ + ${c} = ${a} + ${b}. ★ + ${z} = ?`;answer=x+z;wrong=[x,a+b,x+z+1];hint='Find the right sum. Find the star, then add the last part.';
        visual=V.machine({input:'★',op:`+ ${c}`,output:`${a} + ${b}`});signature=`puzzles:balance:${a},${b},${c},${z}`;
      }
    }
    if(id==='figures') {
        const shapeIndex=int(0,7,r),fills=['outline','solid','striped'],count=int(1,2,r),angle=pick([0,90,180,270],r),size=pick([18,23],r),position=pick([-10,0,10],r),f=int(0,2,r),a={shape:V.shapes[shapeIndex],fill:fills[f],count,angle,size,position};
        const attrs=l<=5?[pick(['shape','fill','count','angle','size','position'].slice(0,l===1?2:l<=3?3:6),r)]:pick([['fill','count'],['angle','size'],['shape','position']],r);
        // Rotations must look different: circles and quarter-turned squares cannot test direction.
        if(attrs.includes('angle'))a.shape=pick(['triangle','pentagon','arrow'],r);
        const change=s=>{const t={...s};for(const key of attrs){if(key==='shape')t.shape=V.shapes[(V.shapes.indexOf(s.shape)+1)%8];if(key==='fill')t.fill=fills[(fills.indexOf(s.fill)+1)%3];if(key==='count')t.count=s.count+1;if(key==='angle')t.angle=(s.angle+90)%360;if(key==='size')t.size=s.size===18?23:18;if(key==='position')t.position=s.position===10?-10:s.position+10;}return t;};
        if(attrs.includes('count'))a.size=18; // Four shapes still fit without changing their size.
        // Repeat an observable conversion. An unseen shape-to-shape alphabet would be ambiguous.
        const c={...a,shape:attrs.includes('shape')?a.shape:attrs.includes('angle')?pick(['triangle','pentagon','arrow'],r):V.shapes[(shapeIndex+3)%8],fill:attrs.includes('fill')?a.fill:fills[(f+1)%3],count:3-count};
        if(attrs.includes('angle'))c.angle=(a.angle+90)%360;
        const b=change(a),target=change(c);
        const cells=[a,b,c,null];visual=V.matrix(cells,2);
        prompt='Which picture fits? Use the same change as the top row.';
        answer=V.shapeChoice(target);const keys=attrs.length===1?['shape','fill','count']:attrs.length===2?[...attrs,attrs.includes('count')?'shape':'count']:attrs;
        wrong=keys.map(key=>{const s={...target};if(key==='shape')s.shape=V.shapes[(V.shapes.indexOf(s.shape)+7)%8];if(key==='fill')s.fill=fills[(fills.indexOf(s.fill)+2)%3];if(key==='count')s.count=s.count===1?2:s.count-1;if(key==='angle')s.angle=(s.angle+270)%360;if(key==='size')s.size=s.size===18?23:18;if(key==='position')s.position=s.position===-10?10:s.position-10;return V.shapeChoice(s);});
        hint='Look at each step. Track the same one or two changes in each row.';signature=`figures:matrix:${JSON.stringify([a,c,attrs,false])}`;operation='matrix';
    }
    if(!signature)throw Error(`Unknown CogAT game ${id}`);
    // Prefer errors from a missed step. Fill any accidental collisions with nearby values.
    const unique=[],seen=new Set([V.normalizeSvg(answer)]);
    for(const option of wrong.filter(n=>typeof n!=='number'||n<=(id==='puzzles'?20:49))){
      const key=V.normalizeSvg(option);
      if(!seen.has(key)&&(!(typeof option==='number')||Number.isInteger(option)&&option>=0)){unique.push(option);seen.add(key);}
    }
    if(typeof answer==='number'){for(let delta=1;unique.length<3;delta++){const n=answer+delta<=(id==='puzzles'?20:49)?answer+delta:answer-delta;if(n>=0&&!unique.includes(n))unique.push(n);}}
    const choices=[answer,...unique.slice(0,3)].map(String);
    for(let i=choices.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
    return {kind:id,operation,prompt,visual,choices,correct:choices.indexOf(String(answer)),hint,sig:signature,band:band(l),steps:id==='puzzles'?(l<=5?1:operation==='balance'?3:2):1};
  }
  window.QuizmoCogat={games,question,deck,audit:{relations,features},bankSizes:Object.fromEntries(['links','groups'].map(id=>[id,Array.from({length:8},(_,i)=>pool(id==='links'?links:groups,i+1).length)]))};
})();
