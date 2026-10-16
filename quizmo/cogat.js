/* Original practice authored for Quizmo; no real test items. */
(() => {
  const games = [
    ['links','Word Pair Rockets','Match pictures and words by their relationships.'],
    ['groups','Belonging Buddies','Sort words by shared features.'],
    ['series','Number Comets','Discover growing and changing number patterns.'],
    ['puzzles','Balance Beacons','Find number rules and balance equal amounts.'],
    ['figures','Shape Stargazers','Complete shape matrices and unfold punched paper.']
  ];
  // One relationship per level, with three independently authored examples.
  const links = [
    [['🐶','puppy','🐱','kitten','calf','chick'],['🐮','calf','🐑','lamb','puppy','kitten'],['🐔','chick','🦆','duckling','lamb','calf']],
    [['👁️','see','👂','hear','run','taste'],['🦵','walk','👄','talk','see','hear'],['👃','smell','👅','taste','walk','see']],
    [['bird','nest','bee','hive','pond','den'],['fish','pond','fox','den','nest','hive'],['horse','stable','spider','web','pond','nest']],
    [['snow','cold','fire','hot','wet','soft'],['rock','hard','pillow','soft','hot','loud'],['feather','light','boulder','heavy','soft','cold']],
    [['brush','paint','scissors','cut','eat','sweep'],['broom','sweep','spoon','eat','cut','paint'],['pencil','write','key','unlock','sweep','eat']],
    [['seed','plant','egg','chick','leaf','nest'],['flour','bread','clay','pot','seed','wool'],['wool','hat','wood','chair','egg','flour']],
    [['wheel','bike','page','book','road','pencil'],['petal','flower','branch','tree','seed','grass'],['toe','foot','finger','hand','arm','leg']],
    [['whisper','quiet','shout','loud','slow','small'],['stroll','slow','dash','fast','quiet','cold'],['pebble','small','mountain','large','soft','fast']]
  ];
  const groups = [
    [['apple, pear, plum','Which belongs?','peach','shoe','drum'],['cat, dog, rabbit','Which belongs?','hamster','boat','cup'],['bus, car, van','Which belongs?','truck','cake','leaf']],
    [['red, blue, green','Which belongs?','yellow','circle','seven'],['circle, square, triangle','Which belongs?','oval','purple','eight'],['one, two, three','Which belongs?','four','pink','star']],
    [['spoon, fork, sock, plate','Which does not belong?','sock','fork','plate'],['hat, coat, scarf, bowl','Which does not belong?','bowl','hat','scarf'],['bed, chair, desk, peach','Which does not belong?','peach','bed','desk']],
    [['robin, owl, sparrow','Which belongs?','eagle','bat','bee'],['ant, beetle, moth','Which belongs?','fly','worm','bird'],['salmon, trout, tuna','Which belongs?','cod','whale','crab']],
    [['roll, spin, jump','Which belongs?','skip','round','wheel'],['tiny, little, small','Which belongs?','mini','tall','wide'],['glad, joyful, happy','Which belongs?','cheerful','sleepy','angry']],
    [['cube, ball, cone, circle','Which flat shape does not belong?','circle','cube','cone'],['ice, snow, frost, steam','Which is not frozen water?','steam','snow','ice'],['oak, pine, birch, rose','Which is not a tree?','rose','oak','pine']],
    [['duck, frog, turtle','Which also lives near ponds?','newt','camel','hen'],['bell, drum, flute','Which also makes music?','harp','brush','spoon'],['peel, rind, shell','Which also covers food?','husk','root','juice']],
    [['minute, hour, day, metre','Which measures something different?','metre','hour','day'],['pair, couple, two, dozen','Which does not mean two?','dozen','pair','couple'],['triangle, square, hexagon, oval','Which has no straight sides?','oval','square','hexagon']]
  ];
  const shape=(count,color='blue',angle=0,size=12)=>`<svg viewBox="0 0 120 70" role="img" aria-label="${count} ${color} triangles rotated ${angle} degrees, size ${size}">${Array.from({length:count},(_,i)=>`<path d="M 0 -${size} L ${size} ${size} L -${size} ${size} Z" fill="${color==='blue'?'#357ca5':'#c65b34'}" transform="translate(${20+i*27} 35) rotate(${angle})"/>`).join('')}</svg>`;
  const paper=(points)=>`<svg viewBox="0 0 100 100" role="img" aria-label="Holes at ${points.map(p=>p.join(',')).join('; ')}"><rect x="5" y="5" width="90" height="90" fill="#fff9ed" stroke="#357ca5"/><path d="M50 5V95 M5 50H95" stroke="#bad7e7" stroke-dasharray="4"/>${points.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="#264a61"/>`).join('')}</svg>`;
  function question(id,l,q) {
    let prompt,hint,choices,visual='';
    if(id==='links') { const [a,b,c,...options]=links[l-1][q];prompt=`${a} is to ${b} as ${c} is to ?`;choices=options;hint=`Think about how ${a} and ${b} go together. Use that same link.`; }
    if(id==='groups') { const [words,ask,...options]=groups[l-1][q];prompt=ask;visual=`<p class="cogat-words">${words}</p>`;choices=options;hint=['Think about the kind of thing each word names.','Look for a shared meaning or feature.'][l>4?1:0]; }
    if(id==='series') {
      const start=2+q, step=2+q; let nums;
      if(l===1)nums=Array.from({length:5},(_,i)=>start+i*2);
      if(l===2)nums=Array.from({length:5},(_,i)=>start+i*5);
      if(l===3)nums=Array.from({length:5},(_,i)=>30+q*3-i*3);
      if(l===4)nums=Array.from({length:5},(_,i)=>start*2**i);
      if(l===5||l===6){nums=[start];for(let i=0;i<5;i++)nums.push(nums.at(-1)+(i%2?(l===5?step+2:-1):step));}
      if(l===7){nums=[start];for(let i=0;i<4;i++)nums.push(nums.at(-1)+step+i);}
      if(l===8){nums=[start];for(let i=0;i<4;i++)nums.push(nums.at(-1)*2+1);}
      const answer=nums.pop();prompt=`${nums.join(', ')}, ?`;choices=[answer,answer+2,answer-1,answer+5];hint=['Add 2 each time.','Add 5 each time.','Subtract 3 each time.','Double each number.','Two different jumps take turns.','A forward jump and a backward jump take turns.','The jump grows by 1 each time.','Double, then add 1. Repeat both steps.'][l-1];
    }
    if(id==='puzzles') {
      const x=2+q, a=3+q, b=5+q;let f;
      if(l<=2)f=n=>n+(l===1?2:5);
      else if(l===3)f=n=>n-2;
      else if(l===4)f=n=>n*2;
      else if(l===5)f=n=>n*3;
      else if(l===6)f=n=>n*2+1;
      else if(l===7)f=n=>n*2-1;
      if(l<8){prompt=`${a} → ${f(a)}    ${b} → ${f(b)}    ${b+2} → ?`;const v=f(b+2);choices=[v,v+2,v-2,v+4];hint='Use the same number rule for all three arrows.';}
      else {prompt=`⚖️ Each star has the same value. ★ + ★ + ${x} = ${12+x}. What is ★ + ${q+1}?`;choices=[7+q,6+q,9+q,12+q];hint=`Remove ${x} from both sides. Split what is left between two stars, then add ${q+1}.`;}
    }
    if(id==='figures') {
      prompt='Complete the bottom row. Use the same change as the top row.';
      if(l<=6){const n=1+q%2, color=l===2||l===5?'rust':'blue', angle=l>=3?90:0, size=l===4||l===6?8:12;
        const transform=(c)=>shape(c,color,angle,size);
        visual=`<div class="cogat-matrix">${shape(n)}<b>→</b>${transform(l===1||l===5||l===6?n+1:n)}${shape(n+1)}<b>→</b><strong>?</strong></div>`;
        const count=l===1||l===5||l===6?n+2:n+1;
        choices=[transform(count),shape(count,color,angle===90?0:90,size),shape(count,color==='blue'?'rust':'blue',angle,size),transform(count===3?1:count+1)];hint='Compare count, color, direction and size. Repeat every change.';
      }else{const x=20+q*5,y=25;prompt=l===7?'Fold right half onto left. Punch at the dot shown. Which paper appears when opened?':'Fold right onto left, then bottom onto top. Punch at the dot. Which paper appears when opened?';visual=`<div class="cogat-fold">${paper([[x,y]])}<span>Folded corner: top left<br>Dot is away from every fold.</span></div>`;const correct=l===7?[[x,y],[100-x,y]]:[[x,y],[100-x,y],[x,100-y],[100-x,100-y]];choices=[paper(correct),paper([[x,y]]),paper([[x,y],[x,100-y]]),paper([[x,y],[100-x,100-y]])];hint='Each fold makes a mirror copy of the hole when you open it.';}
    }
    // Rotate the correct answer's position; content is deterministic for review.
    const correct=(l+q)%choices.length;const answer=choices[0];choices=choices.slice();choices.splice(0,1);choices.splice(correct,0,answer);
    return {prompt,visual,hint,choices,correct};
  }
  window.QuizmoCogat={games,question};
})();
