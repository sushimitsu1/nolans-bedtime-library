/* Curriculum helpers shared by all ten activities. No answer is revealed until help is needed. */
(() => {
  const G=window.NolanGames;
  const shuffle=a=>a.map(x=>({x,r:Math.random()})).sort((a,b)=>a.r-b.r).map(a=>a.x);
  const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
  const pictures=(n,icon='🍎')=>`<span class="picture-set" aria-label="${n} pictures">${Array.from({length:n},()=>`<span>${icon}</span>`).join('')}</span>`;
  const choices=(items)=>`<div class="game-choices">${items.map(x=>G.token(x.value??x,x.icon??x,x.label??String(x))).join('')}</div>`;
  const numbers=(answer,max,count=4)=>shuffle([answer,...shuffle(range(0,max).filter(n=>n!==answer)).slice(0,count-1)]);
  function register(config){G.register({...config,
    start(level){const s={level,round:0,selected:null};s.task=config.task(s);return s;},
    answer:s=>s.task.answer,
    scene:s=>`⭐ ${s.round} / ${2+s.level} · Level ${s.level}`,
    prompt:s=>s.task.prompt,
    board:s=>config.board?config.board(s):`<div class="game-cue">${s.task.cue}</div>${s.task.board??choices(s.task.choices)}`,
    choose(s,value){
      if(config.interact){const result=config.interact(s,value);if(result)return result;}
      else if(String(value)!==String(s.task.answer))return {hint:s.task.answer,message:'Let’s look again. '+s.task.prompt};
      s.round++;s.selected=null;
      if(s.round>=2+s.level)return {points:3,done:true};
      s.task=config.task(s);return {points:3,advance:true,message:'You did it! '+s.task.prompt};
    }
  });}
  const art=slug=>`assets/books/${slug}/page-01.webp`;
  G.curriculum={shuffle,range,pictures,choices,numbers,register,art};
  register({id:'hazel',title:'Hazel’s Count to Twenty',friend:'Hazel',icon:'🎃',art:art('hazel-the-little-tractor-and-the-moonlight-harvest'),task(s){const max=Math.min(20,6+s.level*2),n=Math.max(3,max-2+s.round%3);return {answer:n,prompt:'Count the pumpkins. Tap the number that tells how many.',cue:pictures(n,'🎃'),choices:numbers(n,20,Math.min(8,s.level+2))};}});
  register({id:'coby',title:'Coby’s Picture Addition',friend:'Coby',icon:'➕',art:art('coby-the-little-trolley-and-the-city-of-sleepy-lights'),task(s){const total=Math.min(10,s.level+2+s.round%2),a=1+(s.round+s.level)% (total-1),b=total-a;return {answer:total,prompt:`${a} apples and ${b} apples. How many altogether?`,cue:`${pictures(a)} + ${pictures(b)} = ?`,choices:numbers(total,10,s.level<3?3:5)};}});
  register({id:'cora',title:'Cora’s Take-Away Builder',friend:'Cora',icon:'➖',art:art('cora-crane-truck-wobbly-sign'),task(s){const n=Math.min(10,s.level+3),take=1+(s.round+s.level)%n;return {answer:n-take,prompt:`There are ${n} blocks. Take away ${take}. How many stay?`,cue:`${pictures(n-take,'🧱')}<span class="taken">${pictures(take,'🧱')}</span>`,choices:numbers(n-take,10,s.level<3?3:5)};}});
  register({id:'bramble',title:'Bramble’s Number Track',friend:'Bramble',icon:'🔢',art:art('bramble-the-little-book-train-and-the-sleepy-story-town'),task(s){const n=Math.min(20,4+s.level*2)-s.round%3;return {answer:n,prompt:`Find number ${n}. Tap its numeral.`,cue:`👂 ${pictures(n,'⭐')}`,choices:numbers(n,20,Math.min(10,s.level+2))};}});
  register({id:'aster',title:'Aster’s Number Staircase',friend:'Aster',icon:'🪜',art:art('aster-the-little-fox-and-the-whispering-weather-festival'),task(s){const descending=s.level>=5,step=s.level>=7?2:1,start=descending?20-s.round:Math.min(12,s.level+s.round),seq=range(0,s.level>=3?4:2).map(i=>start+(descending?-1:1)*step*i),index=s.level>=3?1+s.round%(seq.length-2):seq.length-1,n=seq[index];return {answer:n,prompt:`Follow the numbers ${descending?'backward':'forward'}${step===2?', counting by twos':''}. Which number goes in the gap?`,cue:seq.map((x,i)=>i===index?'❓':x).join(' → '),choices:numbers(n,20,Math.min(8,s.level+2))};}});
})();
