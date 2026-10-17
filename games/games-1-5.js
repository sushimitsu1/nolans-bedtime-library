/* Curriculum helpers shared by the learning activities. No answer is revealed until help is needed. */
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
  G.curriculum={shuffle,range,pictures,choices,numbers,register};
})();
