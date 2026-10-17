/* Original reasoning practice, authored for Quizmo; no real test items. No DOM. */
(() => {
  'use strict';
  const V=window.QuizmoVisuals;
  const games=[['links','Word Pair Rockets','Discover links between words.'],['groups','Belonging Buddies','Find a precise shared feature.'],['series','Number Comets','Find rules in number rows.'],['puzzles','Balance Beacons','Solve machines and shape puzzles.'],['figures','Shape Scouts','Track changes and unfold punched paper.']];
  // Audited relation families: each target has one valid partner and three
  // domain-related, non-matching choices. Bands never fall back to an easier pool.
  const relation=(band,name,hint,rows)=>({band,name,hint,pairs:rows.trim().split('\n').map(s=>s.split('|'))});
  const relations=[
    relation(1,'opposite','Use the opposite of the first word.',`
hot|cold|warm|wet|dry
wet|dry|cold|damp|hot
full|empty|open|large|heavy
open|closed|wide|empty|full
up|down|over|high|near
fast|slow|quick|loud|late
big|small|wide|long|heavy
clean|dirty|neat|dry|new
`),
    relation(1,'animal-group','Match each thing to its group.',`
cat|pet|bird|fish|bug
robin|bird|fish|bug|tree
trout|fish|bird|bug|tree
ant|bug|fish|bird|flower
rose|flower|tree|bird|bug
oak|tree|flower|bird|pet
`),
    relation(1,'young-adult','The young animal grows into which adult?',`
kitten|cat|dog|cow|sheep
puppy|dog|cat|pig|horse
lamb|sheep|cow|horse|pig
calf|cow|sheep|pig|dog
piglet|pig|cow|sheep|horse
foal|horse|cow|dog|pig
`),
    relation(2,'part-whole','Find the whole that has this part.',`
page|book|shelf|reader|pen
sleeve|shirt|shoe|sock|hat
petal|flower|leaf|seed|soil
fin|fish|bird|cat|bee
beak|bird|fish|dog|worm
pedal|bike|sled|kite|train
spout|teapot|plate|book|shoe
`),
    relation(2,'animal-home','Match each animal to its usual home.',`
bee|hive|web|den|stable
spider|web|hive|den|kennel
fox|den|hive|web|stable
horse|stable|kennel|hive|web
dog|kennel|stable|hive|web
bird|nest|web|hive|kennel
`),
    relation(2,'cover','Name the main cover on each animal.',`
cat|fur|scales|feathers|shell
bird|feathers|fur|scales|shell
fish|scales|fur|feathers|wool
turtle|shell|fur|feathers|wool
sheep|wool|scales|shell|feathers
`),
    relation(3,'tool-job','Keep the same tool and job link.',`
ruler|measure length|show time|unlock|sweep
clock|show time|measure length|unlock|sweep
key|unlock|sweep|cut|weigh
broom|sweep|unlock|weigh|cut
scale|weigh|show time|unlock|sweep
scissors|cut|weigh|show time|sweep
`),
    relation(3,'stronger','Make the same quality stronger, not its opposite.',`
warm|hot|cold|cool|wet
cool|cold|warm|hot|wet
small|tiny|big|wide|tall
big|huge|small|short|thin
wet|soaked|dry|warm|cold
hungry|starving|full|sleepy|thirsty
`),
    relation(3,'skip-one','Move two steps forward in each list.',`
Monday|Wednesday|Tuesday|Thursday|Sunday
Tuesday|Thursday|Wednesday|Friday|Monday
Friday|Sunday|Saturday|Monday|Thursday
one|three|two|four|zero
two|four|three|five|one
March|May|April|June|February
April|June|May|July|March
`),
    relation(3,'whole-part','Find an actual part, rather than a home, user or job.',`
bird|wing|nest|sky|worm
fish|fin|pond|water|swim
tree|branch|forest|soil|shade
book|page|author|reader|shelf
shirt|sleeve|hat|closet|hanger
teapot|spout|tea|cup|pour
`),
    relation(3,'worker-tool','Match each worker to the right tool for that job.',`
baker|oven|bread|bakery|flour
painter|brush|picture|artist|museum
farmer|tractor|food|farm|seed
doctor|medicine|patient|clinic|health
builder|hammer|house|bricks|wall
singer|mic|song|stage|tune
`),
    relation(3,'worker-place','Find the usual place where each person does that job.',`
chef|kitchen|meal|pan|recipe
teacher|school|lesson|books|pupil
librarian|library|books|reader|bookmark
farmer|farm|food|tractor|seed
baker|bakery|bread|oven|flour
actor|stage|story|costume|film
`)
  ];
  const links=relations.flatMap(rel=>rel.pairs.flatMap((first,i)=>rel.pairs.filter((_,j)=>j!==i).map(target=>Object.assign([first[0],first[1],target[0],target[1],...target.slice(2),rel.hint],{band:rel.band,relation:rel.name}))));
  // Feature membership is explicit. The three examples and answer all satisfy
  // this exact feature; all three alternatives fail it. No vague 'related' sets.
  const feature=(band,name,members,outsiders,hint)=>({band,name,members:members.split('|'),outsiders:outsiders.split('|'),hint});
  const features=[
    feature(1,'tree-fruit','apple|pear|plum|peach','carrot|bean|potato','All are fruits that grow on trees.'),
    feature(1,'headwear','hat|cap|helmet|crown','boot|sock|glove','All are worn on the head.'),
    feature(1,'footwear','boot|shoe|sandal|slipper','hat|glove|sleeve','All are worn on the feet.'),
    feature(1,'upper-clothes','shirt|coat|vest|jacket','boot|sock|hat','All cover the chest.'),
    feature(1,'seats','chair|stool|bench|sofa','shelf|cupboard|desk','All are made for sitting on.'),
    feature(1,'colors','red|blue|yellow|green','bright|dark|paint','All name colors.'),
    feature(1,'birds','duck|hen|sparrow|robin','bat|bee|butterfly','All are birds.'),
    feature(1,'wild-cats','lion|tiger|leopard|cheetah','wolf|bear|fox','All are kinds of wild cats.'),
    feature(1,'farm','cow|pig|goat|sheep','lion|tiger|wolf','All are common farm animals.'),
    feature(1,'trees','oak|pine|maple|birch','rose|grass|daisy','All are trees.'),
    feature(1,'flowers','rose|daisy|tulip|lily','oak|pine|grass','All are flowers.'),
    feature(1,'water-travel','boat|raft|ship|canoe','car|plane|train','All travel on water.'),
    feature(1,'wheels','bike|scooter|wagon|car','boat|raft|sled','All roll on wheels.'),
    feature(1,'days','Monday|Tuesday|Friday|Sunday','April|winter|night','All name days of the week.'),
    feature(1,'months','March|April|June|July','Sunday|winter|year','All name months.'),
    feature(1,'seasons','spring|summer|autumn|winter','rain|month|snow','All name seasons.'),
    feature(1,'young','kitten|puppy|lamb|calf','cat|dog|cow','All name young animals.'),
    feature(1,'head-parts','eye|nose|mouth|ear','knee|finger|toe','All are parts of your head.'),
    feature(1,'flat-shapes','circle|square|oval|triangle','cube|ball|cone','All are flat shapes.'),
    feature(2,'dairy','milk|cheese|yogurt|butter','egg|juice|beans','All are foods made from milk.'),
    feature(2,'grains','bread|rice|pasta|oats','milk|egg|apple','All are grain foods.'),
    feature(2,'insects','bee|ant|fly|beetle','spider|worm|snail','All are insects with six legs.'),
    feature(2,'plant-parts','root|stem|leaf|flower','soil|water|pot','All are parts of a plant.'),
    feature(2,'bike-parts','wheel|seat|pedal|chain','helmet|road|garage','All are parts of a bike itself.'),
    feature(2,'book-parts','cover|page|chapter|title','bookmark|reader|bookshelf','All are parts of a book itself.'),
    feature(2,'room-parts','wall|floor|ceiling|door','garden|car|road','All are built parts of a room.'),
    feature(2,'heat-cook','bake|boil|fry|roast','slice|peel|stir','All use heat to cook food.'),
    feature(2,'animal-covers','fur|scales|feathers|shell','leg|tail|ear','All are outer covers of animals.'),
    feature(2,'measure-tools','ruler|clock|scale|tape measure','pencil|shelf|book','All are tools for measuring.'),
    feature(2,'coins','penny|nickel|dime|quarter','wallet|price|bill','All name coins.'),
    feature(2,'length','inch|foot|metre|cm','gram|litre|minute','All are units of length.'),
    feature(3,'tree-fruit-subset','apple|peach|pear|plum','grape|melon|pumpkin','All are fruits that grow on trees, not vines or bushes.'),
    feature(3,'underground','carrot|potato|beet|radish','pea|corn|lettuce','The part we eat grows under the soil.'),
    feature(3,'leaves','lettuce|cabbage|spinach|kale','carrot|potato|bean','The part we eat is the leaves.'),
    feature(3,'water-milk','whale|dolphin|seal|walrus','shark|trout|tuna','All live in water but feed milk to their young.'),
    feature(3,'flat-straight','triangle|square|rectangle|diamond','circle|cube|ball','All are flat shapes made with straight sides.'),
    feature(3,'flat-faces','cube|box|brick|die','ball|cone|tube','All are solid shapes with only flat faces.'),
    feature(3,'ball-end','football|baseball|snowball|meatball','footprint|snowman|meatloaf','All end with the word ball; they need not be sports.'),
    feature(3,'book-start','bookcase|bookmark|bookshop|bookstore','notebook|textbook|storybook','All start with book rather than end with it.'),
    feature(3,'book-end','notebook|cookbook|textbook|storybook','bookcase|bookmark|bookshop','All end with book rather than start with it.'),
    feature(3,'rain-start','raincoat|rainbow|raindrop|rainfall','snowball|sunshine|windmill','All start with the word rain.'),
    feature(3,'snow-start','snowman|snowball|snowflake|snowstorm','raincoat|sunbeam|windmill','All start with the word snow.'),
    feature(3,'ful-end','helpful|hopeful|thankful|careful','helper|hopeless|thanks','All end in ful, which means full of.'),
    feature(3,'less-end','fearless|harmless|careless|hopeless','careful|helpful|fearful','All end in less, which means without.'),
    feature(3,'re-again','reread|replay|repaint|rewrite','ready|rest|rescue','All start with re meaning again, not just the same letters.'),
    feature(3,'un-not','unhappy|unkind|unfair|unsafe','under|uncle|until','All start with un meaning not, not just the same letters.'),
    feature(3,'past-actions','walked|jumped|played|looked','walking|jumps|player','All name actions that already happened.'),
    feature(3,'ing-actions','running|jumping|swimming|walking','runner|jumped|swimmer','All name actions going on, and end in ing.'),
    feature(3,'needs-answer','question|problem|riddle|puzzle','answer|solution|clue','All are things to solve, rather than things that help solve them.'),
    feature(3,'sense-actions','listen|watch|smell|taste','eye|nose|sound','All are actions using your senses, rather than parts or things sensed.')
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
      const types=l<=2?['plus','minus']:l===3?['alternating']:l===4?['growing','alternating']:l===5?['growing','alternating-growing']:l===6?['interleaved','alternating-growing']:['interleaved'];
      const type=types.includes(opts.mode)?opts.mode:pick(types,r),start=int(l<=2?3:8,l===1?15:l===2?25:24,r),a=int(l===1?2:3,l===1?3:5,r),b=a+int(1,2,r);
      let ns=[start];
      if(type==='plus')for(let i=0;i<5;i++)ns.push(ns.at(-1)+a);
      if(type==='minus'){ns=[int(l===1?25:45,l===1?45:75,r)];for(let i=0;i<5;i++)ns.push(ns.at(-1)-a);}
      if(type==='alternating')for(let i=0;i<5;i++)ns.push(ns.at(-1)+(i%2?b:a));
      if(type==='growing')for(let i=0;i<5;i++)ns.push(ns.at(-1)+a+i);
      if(type==='alternating-growing')for(let i=0;i<5;i++)ns.push(ns.at(-1)+(i%2?b:a)+Math.floor(i/2));
      if(type==='interleaved'){const odd=int(l>=7?55:35,75,r),down=l>=7?-1:1;ns=Array.from({length:7},(_,i)=>i%2?odd+Math.floor(i/2)*b*down:start+Math.floor(i/2)*a);}
      answer=ns.pop();const last=ns.at(-1);wrong=[last+a,last+b,last*2,answer-a,answer+1,answer+2].filter(n=>n<=100);
      prompt=`${ns.join(', ')}, ?`;signature=`series:${type}:${ns.join(',')}`;operation=type;
      hint=type==='alternating'?'Two jumps take turns. Which jump is next?':type==='growing'?'Find the jumps. Each new jump grows by one.':type==='alternating-growing'?'Two jump sizes take turns. Each pair of jumps grows by one.':type==='interleaved'?'Read every other number as its own row. Track both rules.':'Find the same jump at every step.';
      visual=V.svg('Number row: find the next step',ns.map((n,i)=>V.rect(10+i*98,90,90,80,i%2?'#fff3d8':'#bad7e7')+V.text(55+i*98,130,n,20)).join(''));
    }
    if(id==='puzzles') {
      const a=int(l<=2?2:l<=4?3:4,l<=2?3:l<=4?4:6,r),b=int(l<=2?2:4,l<=2?5:9,r),z=int(l<=4?3:5,9,r),types=l<=3?['machine']:l===4?['machine','inverse']:l===5?['inverse','balance']:l===6?['inverse','two-symbols']:['two-symbols','balance'],type=types.includes(opts.mode)?opts.mode:pick(types,r);operation=type;
      if(type==='machine'||type==='inverse'){
        const u=int(1,3,r),v=u+int(1,3,r),f=n=>l===1?n+a:l===2?n*2:n*a+b;
        let input=int(l<=2?7:6,l<=2?14:Math.floor((55-b)/a),r);if(input===u||input===v)input=v+1;
        prompt=type==='machine'?`${u} → ${f(u)}, ${v} → ${f(v)}. ${input} → ?`:`${u} → ${f(u)}, ${v} → ${f(v)}. ? → ${f(input)}`;
        answer=type==='machine'?f(input):input;wrong=type==='machine'?[input,input+a,input*2,f(input)+a]:[input+1,input+a,input-1];
        hint=l===1?'Find the same add step in both pairs.':l===2?'Find the same times step in both pairs.':'Find the times step and the add step. Undo them in reverse to find an input.';
        visual=V.machine({input:type==='machine'?input:'?',op:`${u} → ${f(u)}`,op2:`${v} → ${f(v)}`,output:type==='machine'?'?':f(input)});signature=`puzzles:${type}:${l<=2?l:'two-steps'},${u},${v},${a},${b},${input}`;
      }else if(type==='two-symbols'){
        const t=int(l>=7?5:3,9,r),s2=int(l>=7?5:3,8,r);
        prompt=`△ + △ = ${2*t}. △ + □ = ${t+s2}. ${a} × □ + △ = ?`;answer=a*s2+t;wrong=[a*t+s2,a*s2,a*(t+s2)];hint='Find both shape values, then use them in the last rule.';
        visual=V.machine({input:'△, □',op:`2△ = ${2*t}`,op2:`△ + □ = ${t+s2}`,output:'?'});signature=`puzzles:two-symbols:${t},${s2},${a}`;
      }else{
        const x=int(l>=7?7:5,Math.floor((55-b)/a),r);
        prompt=`${a} × ★ + ${b} = ${a*x+b}. ★ + ${z} = ?`;answer=x+z;wrong=[x,x+b,x+z+a];hint='Undo the add and times steps to find one star. Then use the last step.';
        visual=V.machine({input:'★',op:`× ${a}`,op2:`then + ${b}`,output:a*x+b});signature=`puzzles:balance:${a},${b},${x},${z}`;
      }
    }
    if(id==='figures') {
      const paper=l>=7&&r()<.5;
      if(paper){const folds=l===8?2:1,x=int(12,38,r),y=int(12,38,r),pts=folds===1?[[x,y],[100-x,y]]:[[x,y],[100-x,y],[x,100-y],[100-x,100-y]];
        prompt=`${folds===1?'Fold right onto left':'Fold right onto left, then bottom onto top'}. Punch at (${x}, ${y}) on the folded paper. Which shows the open paper?`;
        visual=V.paper([[x,y]],folds);answer=V.paper(pts);wrong=folds===1?[V.paper([[x,y],[x,100-y]]),V.paper([[x,y],[100-x,100-y]]),V.paper([[x,y]])]:[V.paper([[x,y],[100-x,y]]),V.paper([[x,y],[x,100-y]]),V.paper([[x,y],[100-x,y],[x,100-y],[100-x,100-y-8]])];hint='Unfold one crease at a time. A hole flips to the same spot on the other side of each crease.';signature=`figures:paper:${folds}:${x},${y}`;operation='paper';
      }else{
        const shapeIndex=int(0,7,r),fills=['outline','solid','striped'],count=int(1,2,r),angle=pick([0,90,180,270],r),size=pick([18,23],r),position=pick([-10,0,10],r),f=int(0,2,r),a={shape:V.shapes[shapeIndex],fill:fills[f],count,angle,size,position};
        const attrs= l<=2?['shape']:l<=4?['shape','fill']:l<=6?pick([['fill','count'],['angle','size'],['shape','position']],r):pick([['fill','count'],['angle','size'],['shape','fill']],r);
        // Rotations must look different: circles and quarter-turned squares cannot test direction.
        if(attrs.includes('angle'))a.shape=pick(['triangle','pentagon','arrow'],r);
        const change=s=>{const t={...s};for(const key of attrs){if(key==='shape')t.shape=V.shapes[(V.shapes.indexOf(s.shape)+1)%8];if(key==='fill')t.fill=fills[(fills.indexOf(s.fill)+1)%3];if(key==='count')t.count=s.count+1;if(key==='angle')t.angle=(s.angle+90)%360;if(key==='size')t.size=s.size===18?23:18;if(key==='position')t.position=s.position===10?-10:s.position+10;}return t;};
        if(attrs.includes('count'))a.size=18; // Four shapes still fit without changing their size.
        // Repeat an observable conversion. An unseen shape-to-shape alphabet would be ambiguous.
        const c={...a,shape:attrs.includes('shape')?a.shape:attrs.includes('angle')?pick(['triangle','pentagon','arrow'],r):V.shapes[(shapeIndex+3)%8],fill:attrs.includes('fill')?a.fill:fills[(f+1)%3],count:3-count};
        if(attrs.includes('angle'))c.angle=(a.angle+90)%360;
        const b=change(a),target=l>=7?change(change(c)):change(c);
        const cells=l>=7?[a,b,change(b),c,change(c),null]:[a,b,c,null];visual=V.matrix(cells,l>=7?3:2);
        prompt=l>=7?'Which picture finishes the bottom row? Follow the changes across the top row.':'Which picture finishes the bottom row? It changes the same way as the top row.';
        answer=V.shapeChoice(target);const keys=attrs.length===1?['shape','fill','count']:attrs.length===2?[...attrs,attrs.includes('count')?'shape':'count']:attrs;
        wrong=keys.map(key=>{const s={...target};if(key==='shape')s.shape=V.shapes[(V.shapes.indexOf(s.shape)+7)%8];if(key==='fill')s.fill=fills[(fills.indexOf(s.fill)+2)%3];if(key==='count')s.count=s.count===1?2:s.count-1;if(key==='angle')s.angle=(s.angle+270)%360;if(key==='size')s.size=s.size===18?23:18;if(key==='position')s.position=s.position===-10?10:s.position-10;return V.shapeChoice(s);});
        hint='Look at each step. Track the same one or two changes in each row.';signature=`figures:matrix:${JSON.stringify([a,c,attrs,l>=7])}`;operation='matrix';
      }
    }
    if(!signature)throw Error(`Unknown CogAT game ${id}`);
    // Prefer errors from a missed step. Fill any accidental collisions with nearby values.
    const unique=[],seen=new Set([V.normalizeSvg(answer)]);
    for(const option of wrong.filter(n=>typeof n!=='number'||n<=(id==='puzzles'?60:100))){
      const key=V.normalizeSvg(option);
      if(!seen.has(key)&&(!(typeof option==='number')||Number.isInteger(option)&&option>=0)){unique.push(option);seen.add(key);}
    }
    if(typeof answer==='number'){for(let delta=1;unique.length<3;delta++){const n=answer+delta<=(id==='puzzles'?60:100)?answer+delta:answer-delta;if(n>=0&&!unique.includes(n))unique.push(n);}}
    const choices=[answer,...unique.slice(0,3)].map(String);
    for(let i=choices.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
    return {kind:id,operation,prompt,visual,choices,correct:choices.indexOf(String(answer)),hint,sig:signature,band:band(l),steps:id==='puzzles'?(l<=2?1:['two-symbols','balance','inverse'].includes(operation)?3:2):1};
  }
  window.QuizmoCogat={games,question,deck,audit:{relations,features},bankSizes:Object.fromEntries(['links','groups'].map(id=>[id,Array.from({length:8},(_,i)=>pool(id==='links'?links:groups,i+1).length)]))};
})();
