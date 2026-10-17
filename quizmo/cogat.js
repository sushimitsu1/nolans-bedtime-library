/* Original reasoning practice, authored for Quizmo; no real test items. No DOM. */
(() => {
  'use strict';
  const V=window.QuizmoVisuals;
  const games=[['links','Word Pair Rockets','Discover links between words.'],['groups','Belonging Buddies','Find a precise shared feature.'],['series','Number Comets','Explore changing and interleaved rules.'],['puzzles','Balance Beacons','Solve machines and symbol equations.'],['figures','Shape Stargazers','Track changes and unfold punched paper.']];
  // Each row: A | B | C | answer | three plausible alternatives | strategy.
  const links=`
petal|flower|chapter|book|page|author|library|The first is a part of the second.
wheel|bicycle|key|piano|lock|music|pedal|Look for the whole that contains this part.
brick|wall|stitch|seam|needle|cloth|thread|Small parts join to make a larger structure.
branch|tree|sleeve|shirt|glove|coat rack|button|Find the larger thing this part belongs to.
flock|sheep|swarm|bees|honey|birds|hive|A group name belongs to a kind of animal.
herd|cattle|school|fish|teacher|ocean|fin|Think of animal group names, not places.
saw|carpenter|needle|tailor|cloth|doctor|thread|Match each tool with the worker who uses it to make things.
trowel|gardener|whisk|cook|bowl|waiter|flour|Match a tool with its usual worker.
stethoscope|doctor|telescope|astronomer|star|pilot|lens|Which worker uses this instrument?
potter|vase|baker|loaf|oven|flour|kitchen|Match a maker with a finished product.
author|novel|composer|song|piano|singer|paper|Think about what each person creates.
weaver|cloth|carpenter|table|wood|hammer|workshop|Match a worker with something they make.
seed|sprout|egg|hatchling|nest|shell|feather|Think about the next stage of growth.
lamb|sheep|foal|horse|stable|calf|saddle|The young animal grows into which adult?
cygnet|swan|fawn|deer|antler|elk|forest|Match young animals to their adults.
joey|kangaroo|gosling|goose|duck|nest|wing|Both first words name young animals.
warm|hot|cool|cold|breezy|winter|wet|Keep the same increase in intensity.
whisper|speak|stroll|walk|run|feet|rest|Move from a softer degree to an ordinary degree.
drizzle|downpour|breeze|gale|cloud|rain|air|The second is a stronger degree of the first.
annoyed|furious|pleased|delighted|smile|calm|proud|Strengthen the same feeling.
flour|bread|clay|bowl|soil|wheel|water|A raw material becomes a finished object.
wool|scarf|timber|shelf|tree|saw|forest|Match a material with a product made from it.
sand|glass|milk|cheese|cow|bottle|grass|Think of what the material can become.
grapes|raisins|plums|prunes|jam jar|peaches|vine|Both fruits change in the same way when dried.
heat|melting|cold|freezing|snowman|shivering|winter|Look for a cause and the change it produces.
rain|puddle|wind|wave|sailboat|cloud|air|Match a cause with something it can form.
friction|warmth|practice|skill|game|coach|mistake|What result can repeated action produce?
drought|wilting|exercise|tiring|running|fitness plan|sleep|Match the cause to its immediate effect.
compass|direction|thermometer|temperature|weather|fever|length|Each instrument measures or shows something specific.
scales|mass|stopwatch|time|race|speed|runner|Find the quantity measured by the instrument.
anchor|hold|rudder|steer|boat|float|sail|A tool is paired with its function.
colander|drain|sieve|sift|flour|cook|pour|Use the exact job of each tool.
Monday|Tuesday|April|May|spring|March|June|Move one step forward in the sequence.
breakfast|lunch|morning|afternoon|sunrise|evening|night|Keep the order of the day.
first|third|second|fourth|third place|last|fifth|Move the same number of positions.
acorn|oak|kernel|corn|wheat|seedling|field|Match a seed with the plant it can grow into.
shallow|deep|scarce|plentiful|empty|rare|small|Keep the relationship of opposites.
expand|shrink|arrive|depart|travel|stay|begin|Use opposite actions.
transparent|clear|fragile|breakable|glass|solid|careful|Look for a word with the same meaning.
rapid|swift|silent|quiet|slow|hushed|sound|Match words with nearly the same meaning.
island|water|oasis|desert|sand dune|palm|lake|Think about what surrounds each place.
letter|word|word|sentence|alphabet|paragraph|page|Small units join to make the next larger unit.
minute|hour|centimetre|metre|ruler|length|kilometre|A smaller unit is part of a larger unit.
rehearsal|performance|training|match|team|medal|stadium|Preparation comes before the main event.
question|answer|problem|solution|puzzle|clue|mistake|The second resolves the first.
lock|key|code|password|computer|number|door|What gives access through each barrier?
map|traveler|score|musician|referee|song|instrument|Match a guide with the person who reads it.
blueprint|builder|recipe|chef|meal|menu|waiter|Match instructions with the person who follows them.
beekeeper|honey|silkworm|silk|cocoon|leaf|thread spool|Match a producer with its useful product.
burrow|rabbit|lodge|beaver|dam|river|otter|Match a shelter with the animal that lives there.
aerie|eagle|den|fox|forest|nestling|feather|Match a special home with its animal.
nectar|bee|plankton|whale|ocean|dolphin|seal|The first is food for the second.
calf|whale|pup|seal|flipper|school|tusk|Match the young animal with its adult kind.
nymph|dragonfly|tadpole|frog|pond|toadstool|larva|Match an early life stage to an adult.
spark|blaze|trickle|torrent|riverbank|drop|steam|Move from a small amount to an intense flow.
chilly|icy|dim|dark|lamp|shade|bright|Increase the same quality.
page|book|tile|mosaic|floor brush|paint|frame|A small piece forms part of a larger work.
root|absorb|leaf|photosynthesize|branch|soil|grow roots|Match each plant part with its particular job.
prefix|beginning|suffix|ending|word|middle|letter|Think where each part attaches to a word.
triangle|three|hexagon|six|five|eight|angle|Match each polygon with its number of sides.
leaf|canopy|tile|roof|floor|brick|window|Small pieces form a larger covering.
sketch|portrait|draft|essay|pencil|writer|page|A preliminary version comes before the finished work.
conductor|orchestra|editor|newspaper|reporter|press|article|Match the person in charge with the work they direct.
architect|blueprint|cartographer|map|compass|explorer|globe|Match each designer with a plan they create.
hinge|door|joint|bone|muscle|skin|leg|The first lets the second move at a connection.
camouflage|conceal|beacon|guide|light bulb|hide|harbor|Match each aid with its intended purpose.
evaporate|vapor|condense|liquid|cloud|freeze|heat|Name the state produced by each change.
opaque|light|waterproof|water|raincoat|plastic|dry|The first describes something that blocks the second.
loosen|tighten|scatter|gather|throw|spread|drop|Keep the same relationship of opposite actions.
prologue|story|overture|opera|singer|curtain|applause|An introduction comes before the main work.
kilogram|mass|litre|volume|length|temperature|speed|Match each unit with the quantity it measures.
erosion|rock|rust|iron|water|soil|stone|Match a gradual damaging process with the material it affects.
reservoir|water|granary|grain|barn animal|flour mill|field|Match a storage place with what it stores.
denominator|fraction|divisor|division|quotient|remainder|product|The first names a particular part of the second.
kiln|pottery|oven|bread|flour|kitchen|baker|Match a heating chamber with the product finished inside it.
larva|beetle|fry|fish|bird|frog|pond|Match a young life stage with the adult animal.
generous|stingy|humble|boastful|modest|quiet|proud friend|Keep the same relationship of opposite personal qualities.
scarce|abundant|temporary|permanent|brief|seasonal|scarcity|Use opposites, keeping the same quality.
recede|advance|diminish|increase|vanish|shrink|remain|Reverse the direction of each change.
transparent|opaque|flexible|rigid|bendy|fragile|smooth|Find the opposite property of the material.
`.trim().split('\n').map(s=>s.split('|'));
  // Three examples, a matching fourth, and close alternatives.
  const groups=`
pitcher, flask, jug|bottle|faucet|plate|ladle|All are containers that hold liquids.
centimetre, litre, gram|minute|ruler|clock|scale|All are units used to measure something.
creep, sprint, wander|glide|sleep|path|hiker|All are verbs describing movement.
peel, rind, husk|shell|seed|root|pulp|Each is a protective outer covering of food.
piano, harp, guitar|violin|flute|drum|trumpet|Each makes notes using vibrating strings.
bell, gong, cymbal|triangle|flute|violin|whistle|Each is struck to make a ringing musical sound.
thermometer, ruler, scales|stopwatch|calendar picture|shelf|compass rose|Each is a device for measuring a quantity.
valley, canyon, basin|hollow|summit|ridge|peak|All describe low or sunken land.
summit, crest, peak|ridge|valley|basin|cave|All name high parts of land.
marble, granite, slate|limestone|brick|glass|concrete|All are naturally occurring rocks.
steam, mist, frost|ice|smoke|dust|ash|All are water in different forms.
cone, sphere, cylinder|cube|circle|square|oval|All are solid three-dimensional shapes.
octagon, pentagon, triangle|hexagon|sphere|circle|cylinder|All are polygons made of straight sides.
acre, hectare, square metre|square centimetre|metre|litre|kilogram|All measure area rather than length or volume.
prune, raisin, dried apricot|date|grape|plum|fresh peach|All are commonly eaten as dried fruit.
gander, rooster, stallion|ram|hen|mare|ewe|All name adult male animals.
cygnet, gosling, duckling|chick|swan|goose|hen|All name young birds.
beaver, otter, seal|walrus|salmon|turtle|penguin|All are mammals adapted to life in water.
bat, whale, dolphin|porpoise|shark|trout|pelican|All are mammals despite unusual ways of moving.
copper, iron, aluminum|tin|bronze-colored paint|wood|glass|All are metals.
tulip, daffodil, crocus|hyacinth|oak|fern|moss|All are flowers commonly grown from bulbs.
oak, maple, birch|elm|pine|spruce|fir|All are broad-leaved trees that usually lose leaves in autumn.
pine, fir, spruce|cedar|maple|birch|willow|All are cone-bearing trees.
cotton, wool, silk|linen|nylon|plastic|rubber|All are natural textile fibers.
whisk, grate, knead|simmer|recipe|bowl|flour|All are actions used in preparing food.
observe, compare, measure|predict|laboratory|scientist|beaker|All are actions used in scientific investigation.
novel, biography, atlas|dictionary|chapter|page|author|All are kinds of whole books.
comma, colon, semicolon|apostrophe|paragraph|capital letter|sentence|All are punctuation marks.
unhappy, unsafe, unfair|unusual|universe|under|uncle|All start with a prefix meaning not.
careless, fearless, harmless|hopeless|hopeful|careful|harmful|All end with a suffix meaning without.
triangle, tricycle, tripod|trio|trunk|train|twin|All include the idea of three.
rewind, rewrite, rebuild|reread|ready|river|rescue|All use a prefix meaning again.
whisper, murmur, mutter|mumble|shout|scream|announce|All describe quiet ways of speaking.
scarlet, crimson, ruby|burgundy|navy|emerald|ivory|All name shades of red.
azure, cobalt, navy|sapphire|scarlet|amber|jade|All name shades of blue.
joyful, cheerful, delighted|elated|calm|proud|relieved|All express happiness.
fragile, brittle, delicate|breakable|flexible|hard|heavy|All suggest something easily damaged.
steep, sheer, abrupt|precipitous|flat|gentle|winding|All can describe a sharply rising slope.
pair, couple, duo|twins|trio|dozen|group|All carry the idea of two.
quarter, half, eighth|third|four|eight|dozen|All name fractions of a whole.
cube, square, fourth power|fifth power|multiply by five|sum|difference|All describe raising a number to a power.
bronze, silver, gold|platinum|iron ore|stone|plastic|All are metals used in jewelry and medals.
compost, manure, mulch|leaf mold|gravel|sand|paving|All are organic materials used to help garden soil.
caravel, schooner, sloop|yacht|kayak paddle|submarine hatch|dock|All are kinds of sailing boats.
spoke, rim, hub|tire|pedal|saddle|handlebar|All are parts of a wheel.
spine, cover, pages|binding|bookmark|shelf|reader|All are structural parts of a book.
canal, tunnel, bridge|dam|valley|river|hill|All are structures built by people to manage travel or water.
referee, umpire, judge|official|captain|spectator|coach|All decide whether rules have been followed.
mason, carpenter, plumber|electrician|architect client|tenant|librarian|All are skilled tradespeople who work on buildings.
flour, yeast, water|salt|icing|jam|sprinkles|All are basic ingredients for a plain bread dough.
orbit, rotate, revolve|spin|planet|moon|circle|All are verbs for curved or turning motion.
flask, beaker, test tube|measuring cylinder|microscope|thermometer|balance|All are laboratory containers.
fable, myth, legend|folktale|news report|recipe|instructions|All are traditional kinds of stories.
dawn, sunrise, daybreak|first light|noon|sunset|twilight|All name the beginning of daylight.
dusk, sunset, nightfall|evening|dawn|midday|sunrise|All relate to the approach of night.
echo, reflection, rebound|ricochet|shadow|glow|absorption|All involve something returning after meeting a surface.
insulate, protect, shield|shelter|expose|display|decorate|All can mean keeping something safe from outside effects.
convince, persuade, influence|sway|order|force|obey|All can mean changing someone’s opinion without forcing them.
borrow, rent, hire|lease|buy|own|keep|All involve temporary use of something belonging to another.
forecast, predict, anticipate|foresee|remember|record|describe|All look ahead to something that has not happened yet.
isosceles, equilateral, scalene|right|square|diamond|rectangle|All can name kinds of triangles.
acute, obtuse, right|straight|triangle|rectangle|diagonal|All can name types of angles.
radius, diameter, circumference|arc|diagonal|altitude|vertex|All are terms especially associated with circles.
north, northeast, east|southeast|latitude|longitude|horizon|All name compass directions.
parallel, perpendicular, intersecting|skew|horizontal|vertical|curved|All describe relationships between two lines.
fulcrum, load, lever|effort|gear|axle|pulley|All are terms used to describe how a lever works.
stamen, pistil, sepal|petal|root|trunk|bark|All are parts of a flower.
artery, vein, capillary|aorta|tendon|cartilage|nerve|All are blood vessels.
femur, tibia, humerus|radius|ligament|muscle|tendon|All name bones.
cornea, iris, retina|pupil|eyelash|eyebrow|eyelid|All are features inside or at the front of the eyeball itself.
pronoun, conjunction, preposition|adverb|sentence|paragraph|syllable|All name classes of words by their jobs in sentences.
triangle, square, pentagon|hexagon|hexagonal prism|cone|sphere|All are closed flat shapes made only of straight sides.
kilolitre, millilitre, litre|centilitre|centimetre|kilogram|second|All are metric units of volume.
millennium, decade, century|fortnight|calendar|stopwatch|date|All name spans of time with a fixed length.
perch, nest, roost|aviary|burrow|hive|kennel|All are places especially associated with birds resting or living.
sty, stable, kennel|cattery|burrow|nest|hive|All are shelters built by people for specific domestic animals.
bark, growl, whimper|howl|purr|chirp|hiss|All are sounds dogs commonly make.
sprout, bud, germinate|blossom|wither|prune|harvest|All can name stages or actions of a plant growing.
descent, decline, decrease|reduction|rise|plateau|increase|All suggest movement downward or becoming less.
quadrilateral, pentagon, octagon|hexagon|ellipse|sphere|semicircle|All name polygons by their straight-sided outlines.
`.trim().split('\n').map(s=>s.split('|'));
  const pool=(bank,l)=>l<=2?bank.slice(0,40):l<=5?bank.slice(10):bank.slice(40);
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
    if(id==='links') {const [a,b,c,d,e,f,g,strategy]=bankItem(id,l,r,opts);prompt=`${a} : ${b} :: ${c} : ?`;answer=d;wrong=[e,f,g];hint=strategy;signature=`links:${a}:${b}:${c}`;visual=V.svg('Word analogy: repeat the relationship in the first pair',V.text(150,100,a,28)+V.text(450,100,b,28)+V.text(150,200,c,28)+V.text(450,200,'?',35)+'<path d="M245 100h100m-13-9 13 9-13 9M245 200h100m-13-9 13 9-13 9" fill="none" stroke="#357ca5" stroke-width="3"/>');}
    if(id==='groups'){const [a,b,c,d,e,strategy]=bankItem(id,l,r,opts);prompt=`${a}: which word belongs?`;answer=b;wrong=[c,d,e];hint=strategy;signature=`groups:${a}`;visual=V.svg('Three words share a feature',a.split(', ').map((s,i)=>V.rect(50+i*175,75,155,110,'#fff3d8')+V.text(127+i*175,130,s,s.length>12?15:20)).join(''));}
    if(id==='series') {
      const start=int(2,19+l*3,r),a=int(2,5+l,r),b=int(1,7+l,r),type=opts.mode||pick(l<=2?['alternating','growing']:l<=4?['growing','double-add','alternating']:l<=6?['double-add','interleaved','squares']:['interleaved','squares','alternating-multiply'],r);
      let ns=[start],next;
      if(type==='alternating'){for(let i=0;i<5;i++)ns.push(ns.at(-1)+(i%2?a+b:a));hint='Two jumps take turns. Compare every other jump, then continue the correct one.';}
      if(type==='growing'){for(let i=0;i<5;i++)ns.push(ns.at(-1)+a+i*b);hint='Find the differences first. Look at how the differences themselves change.';}
      if(type==='double-add'){for(let i=0;i<5;i++)ns.push(ns.at(-1)*2+b);hint='Try multiplying, then adjusting. Check both steps on every pair.';}
      if(type==='interleaved'){ns=Array.from({length:7},(_,i)=>i%2?start*3+Math.floor(i/2)*b:start+Math.floor(i/2)*a);hint='Separate the first, third and fifth terms from the second, fourth and sixth terms.';}
      if(type==='squares'){ns=Array.from({length:6},(_,i)=>(a+i)**2+b);hint='The gaps grow evenly. Compare the terms with square numbers, then look for a fixed adjustment.';}
      if(type==='alternating-multiply'){for(let i=0;i<5;i++)ns.push(i%2?ns.at(-1)+b:ns.at(-1)*2);hint='A multiply step and an add step take turns. Check which step comes next.';}
      answer=ns.pop();next=ns.at(-1);wrong=[next+a,next*2,next+b,answer-b,answer+b,answer+1];prompt=`${ns.join(', ')}, ?`;signature=`series:${type}:${ns.join(',')}`;operation=type;visual=V.svg('Number sequence stepping stones',ns.map((n,i)=>V.rect(10+i*98,90,90,80,i%2?'#fff3d8':'#bad7e7')+V.text(55+i*98,130,n,20)).join(''));
    }
    if(id==='puzzles') {
      let x=int(3,12+l*4,r);const a=int(2,Math.min(9,l+3),r),b=int(2,8+l*2,r),z=int(2,10,r),type=opts.mode||pick(l<4?['machine','balance']:['machine','balance','two-symbols','inverse'],r);operation=type;
      if(type==='machine'||type==='inverse') {
        const u=int(2,9,r),v=u+int(2,5,r),f=n=>n*a+b;
        if(x===u||x===v)x=v+int(2,5,r);
        prompt=type==='machine'?`${u} → ${f(u)}, ${v} → ${f(v)}. ${x} → ?`:`${u} → ${f(u)}, ${v} → ${f(v)}. ? → ${f(x)}`;
        answer=type==='machine'?f(x):x;wrong=type==='machine'?[x*a,x+b,x*a-b,f(x)+a]:[f(x)-b,f(x)/a,x+1,x+a];hint='Find a multiply step and an add step that work for both examples. Undo them in reverse to find an input.';visual=V.machine({input:type==='machine'?x:'?',op:`${u} → ${f(u)}`,op2:`${v} → ${f(v)}`,output:type==='machine'?'?':f(x)});signature=`puzzles:${type}:${u},${v},${a},${b},${x}`;
      }else if(type==='two-symbols') {
        prompt=`△ + △ = ${2*x}. △ + □ = ${x+z}. ${a} × □ + △ = ?`;answer=a*z+x;wrong=[a*x+z,a*z,a*(x+z),a*z+x+1];hint='Find the triangle first, then the square. Use those values in the final expression.';visual=V.machine({input:'△, □',op:`2△ = ${2*x}`,op2:`△ + □ = ${x+z}`,output:'?'});signature=`puzzles:two-symbols:${x},${z},${a}`;
      }else {prompt=`${a} × ★ + ${b} = ${a*x+b}. ★ + ${z} = ?`;answer=x+z;wrong=[x,x+b,Math.floor((a*x+b)/a)+z,x+z+a];hint='Subtract the extra amount from both sides. Divide by the number of stars, then do the final addition.';visual=V.machine({input:'★',op:`× ${a}`,op2:`then + ${b}`,output:a*x+b});signature=`puzzles:balance:${a},${b},${x},${z}`;}
    }
    if(id==='figures') {
      const paper=l>=7&&r()<.5;
      if(paper){const folds=l===8?2:1,x=int(12,38,r),y=int(12,38,r),pts=folds===1?[[x,y],[100-x,y]]:[[x,y],[100-x,y],[x,100-y],[100-x,100-y]];
        prompt=`${folds===1?'Fold right onto left':'Fold right onto left, then bottom onto top'}. Punch at (${x}, ${y}) on the folded paper. Which opens correctly?`;
        visual=V.paper([[x,y]],folds);answer=V.paper(pts);wrong=folds===1?[V.paper([[x,y],[x,100-y]]),V.paper([[x,y],[100-x,100-y]]),V.paper([[x,y]])]:[V.paper([[x,y],[100-x,y]]),V.paper([[x,y],[x,100-y]]),V.paper([[x,y],[100-x,y],[x,100-y],[100-x,100-y-8]])];hint='Unfold one crease at a time. A hole reflects the same distance to the other side of each crease.';signature=`figures:paper:${folds}:${x},${y}`;operation='paper';
      }else{
        const shapeIndex=int(0,7,r),fills=['outline','solid','striped'],count=int(1,2,r),angle=pick([0,90,180,270],r),size=pick([18,23],r),position=pick([-10,0,10],r),f=int(0,2,r),a={shape:V.shapes[shapeIndex],fill:fills[f],count,angle,size,position};
        const attrs= l<=2?['shape']:l<=4?['shape','fill']:l<=6?pick([['fill','count'],['angle','size'],['shape','position']],r):['shape','fill','count'];
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
        hint='Compare each cell with its neighbor. Track every change in shape, shading, count, direction, size or position.';signature=`figures:matrix:${JSON.stringify([a,c,attrs,l>=7])}`;operation='matrix';
      }
    }
    if(!signature)throw Error(`Unknown CogAT game ${id}`);
    // Prefer errors from a missed step. Fill any accidental collisions with nearby values.
    const unique=[],seen=new Set([V.normalizeSvg(answer)]);
    for(const option of wrong){
      const key=V.normalizeSvg(option);
      if(!seen.has(key)&&(!(typeof option==='number')||Number.isInteger(option)&&option>=0)){unique.push(option);seen.add(key);}
    }
    if(typeof answer==='number'){for(let delta=1;unique.length<3;delta++){const n=answer+delta;if(!unique.includes(n))unique.push(n);}}
    const choices=[answer,...unique.slice(0,3)].map(String);
    for(let i=choices.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]];}
    return {kind:id,operation,prompt,visual,choices,correct:choices.indexOf(String(answer)),hint,sig:signature};
  }
  window.QuizmoCogat={games,question,deck,bankSizes:Object.fromEntries(['links','groups'].map(id=>[id,Array.from({length:8},(_,i)=>pool(id==='links'?links:groups,i+1).length)]))};
})();
