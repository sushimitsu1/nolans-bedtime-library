/* Listening comes before reading. Each level has three varied, replayable rounds. */
(() => {
  'use strict';
  const G=window.NolanGames,{shuffle}=G.curriculum;
  // Spoken sound approximations avoid asking the synthesizer to read slash notation.
  const sounds={a:'ah',e:'eh',i:'ih',o:'aw',u:'uh',b:'buh',c:'kuh',d:'duh',f:'fff',g:'guh',h:'hhh',j:'juh',l:'lll',m:'mmm',n:'nnn',p:'puh',r:'rrr',s:'sss',t:'tuh',v:'vvv',w:'wuh',z:'zzz',sh:'shhh',ch:'ch, as in cheese',ee:'ee',oo:'oo'};
  const rows=[
    ['cat','🐈','c a t','at'],['hat','🎩','h a t','at'],['bat','🦇','b a t','at'],['rat','🐀','r a t','at'],['mat','▧','m a t','at'],
    ['fan','🪭','f a n','an'],['can','🥫','c a n','an'],['van','🚐','v a n','an'],['pan','🍳','p a n','an'],['man','👨','m a n','an'],
    ['dog','🐕','d o g','og'],['log','🪵','l o g','og'],['frog','🐸','f r o g','og'],
    ['sun','☀️','s u n','un'],['bun','🥯','b u n','un'],['cap','🧢','c a p','ap'],['map','🗺️','m a p','ap'],
    ['hen','🐔','h e n','en'],['pen','🖊️','p e n','en'],['bed','🛏️','b e d','ed'],['red','🔴','r e d','ed'],
    ['pig','🐖','p i g','ig'],['dig','⛏️','d i g','ig'],['bug','🐞','b u g','ug'],['rug','▧','r u g','ug'],
    ['fish','🐟','f i sh','ish'],['dish','🍽️','d i sh','ish'],['ship','🚢','sh i p','ip'],['shop','🏪','sh o p','op'],
    ['chip','🥔','ch i p','ip'],['chick','🐤','ch i c','ick'],['chin','🙂','ch i n','in'],
    ['bee','🐝','b ee','ee'],['tea','🍵','t ee','ee'],['shoe','👟','sh oo','oo'],['key','🔑','c ee','ee'],
    ['dot','⚫','d o t','ot'],['net','🥅','n e t','et'],['flag','🚩','f l a g','ag'],['crab','🦀','c r a b','ab'],['drum','🥁','d r u m','um']
  ];
  const words=rows.map(([word,icon,parts,family])=>({word,icon,parts:parts.split(' '),family}));
  const word=name=>words.find(w=>w.word===name);
  const mat='<svg xmlns="http://www.w3.org/2000/svg" width="52" height="44" viewBox="0 0 52 44" aria-hidden="true"><rect x="5" y="7" width="42" height="30" rx="3" fill="#dfb572"/><path d="M8 14h36M8 22h36M8 30h36" stroke="#ae6673" stroke-width="4"/><path d="M2 10h3m-3 6h3m-3 6h3m-3 6h3m-3 6h3m42-24h3m-3 6h3m-3 6h3m-3 6h3m-3 6h3" stroke="#b9894d" stroke-width="2"/></svg>';
  const pic=w=>({value:w.word,icon:['mat','rug'].includes(w.word)?mat:w.icon,label:w.word,speech:w.word});
  const letter=x=>({value:x,icon:x,label:`Letter ${x}`,speech:sounds[x]||x});
  const pick=(xs,s)=>xs[s.round%xs.length];
  const options=(correct,pool,count)=>shuffle([correct,...shuffle(pool.filter((x,i)=>x.value!==correct.value&&pool.findIndex(y=>y.value===x.value)===i)).slice(0,count-1)]);
  const count=l=>l===1?2:l===2?3:4;
  const blend=(w,gap)=>w.parts.map(x=>({text:sounds[x],pause:gap}));
  const task=(prompt,choices,answer,extra={})=>({prompt,choices,answer,...extra});
  function register(id,title,friend,icon,make){
    G.register({id,title,friend,icon,phonics:true,art:`games/art/${id}.svg`,
      start(level){const s={level,round:0};s.task=make(s);s.selected=[];return s;},
      answer:s=>s.task.answer,scene:s=>`${icon} · Level ${s.level} · ${s.round+1} / 3`,
      prompt:s=>s.task.prompt,speech:s=>s.task.speech||s.task.prompt,
      choiceSpeech(s,v){if(v.startsWith('sound-'))return sounds[s.task.tiles[Number(v.slice(6))]];return s.task.choices.find(c=>c.value===v)?.speech||s.task.choices.find(c=>c.value===v)?.label;},
      board(s){const q=s.task;return `<div class="game-cue">${q.tiles?'':G.button('↻','Repeat instruction or sound','repeat','class="listening-replay"')}${q.cue||icon}${q.mode==='steps'?' '+('🟢'.repeat(s.selected.length)):''}</div>${q.tiles?`<div class="game-slots">${q.tiles.map((x,i)=>G.token('sound-'+i,x,`Hear sound ${i+1}`,`aria-pressed="${s.selected.includes('sound-'+i)}"`)).join('')}</div>`:''}<div class="game-choices">${q.choices.map(c=>G.token(c.value,c.icon,c.label,`aria-pressed="${s.selected.includes(c.value)}"`)).join('')}</div>`;},
      choose(s,v){const q=s.task;
        if(v.startsWith('sound-')&&q.tiles){const i=Number(v.slice(6));if(!s.selected.includes(v))s.selected.push(v);return {message:[{text:sounds[q.tiles[i]],pause:180},...blend(q.word,160),q.word.word+'. Now choose its picture.']};}
        if(q.mode==='build'){
          const w=q.members.find(w=>w.parts[0]===v);if(!w)return {message:'Try a starting sound on the truck.'};
          s.task=task(`You made ${w.word}! Match its picture.`,options(pic(w),words.filter(x=>x.family!==w.family).slice(0,5).map(pic),count(s.level)),w.word,{cue:`🚚 ${w.word}`});
          return {message:[sounds[v],w.word,'Now find its picture.']};
        }
        if(q.mode==='steps'){
          if(v!=='stone-'+s.selected.length)return {hint:'stone-'+s.selected.length,message:'One stone for each sound. Try the glowing stone.'};
          s.selected.push(v);
          if(s.selected.length<q.total)return {message:sounds[q.word.parts[s.selected.length-1]]};
        }else if(q.mode==='all'){
          if(!q.answers.includes(v))return {hint:q.answers.find(x=>!s.selected.includes(x)),message:'Listen to the ending. '+q.prompt};
          if(s.selected.includes(v))return {message:'You found that rhyme. Find another.'};
          s.selected.push(v);if(s.selected.length<q.answers.length)return {message:'Yes, that rhymes. Find the other rhyming picture.'};
        }else if(q.mode==='sort'){
          if(!v.startsWith('truck-')){s.selected=[v];return {message:'Now tap the truck with the matching word ending.'};}
          const chosen=word(s.selected[0]);if(!chosen)return {message:'Tap a picture first, then its truck.'};
          if(v!=='truck-'+chosen.family)return {hint:'truck-'+chosen.family,message:'Listen to '+chosen.word+'. Try its ending again.'};
          q.sorted.push(chosen.word);s.selected=[];
          q.choices=q.choices.filter(c=>c.value!==chosen.word);
          if(q.sorted.length<q.total)return {message:'A good match! Choose another picture.'};
        }else if(v!==q.answer)return {hint:q.answer,message:['Let’s listen again.',q.speech||q.prompt].flat()};
        if(q.tiles&&!q.tiles.every((_,i)=>s.selected.includes('sound-'+i)))return {hint:'sound-'+q.tiles.findIndex((_,i)=>!s.selected.includes('sound-'+i)),message:'Tap each letter tile to hear the sounds first.'};
        s.round++;s.selected=[];if(s.round===3)return {points:3,done:true};s.task=make(s);return {points:3,advance:true,message:['Lovely listening!',s.task.speech||s.task.prompt].flat()};
      }
    });
  }
  register('lulu','Lulu’s Letter Sounds','Lulu','🦉',s=>{
    const l=s.level,pools=[['s','m','t'],['s','m','t','a'],['s','f','m','t'],['b','d','m','n'],['m','n','b','d'],['a','e','i','o','u'],['a','e','i','o','u'],['b','d','m','n','a','i']];
    const pool=pools[l-1],x=pool[(s.round+(l===7?2:0))%pool.length],cs=options(letter(x),pool.map(letter),count(l));
    return task('Listen. Which letter makes this sound?',cs,x,{speech:[{text:'Find the letter for this sound.',rate:l===8?.95:.78},{text:sounds[x],rate:l===8?.95:.68}],cue:'👂 → 🔤'});
  });
  register('sunny','Sunny’s Picture Starts','Sunny','☀️',s=>{
    const l=s.level,w=pick((l>=7?['ship','chick','chin']:l===6?['mat','net','bat']:l>=5?['bat','dog','mat']:['sun','fan','cat']).map(word),s),x=w.parts[0];
    if(l===4)return task(`Hear ${w.word}. Tap its first letter.`,options(letter(x),['s','f','c','m'].map(letter),4),x,{cue:w.icon});
    const pool=(l>=7?['ship','shop','chip','chick','sun','cat']:l>=5?['bat','dog','mat','net','fan','sun']:['sun','fan','cat','dog','hat']).map(word).filter(Boolean).filter(v=>v.parts[0]!==x);
    return task('Which picture starts with this sound?',options(pic(w),pool.map(pic),count(l)),w.word,{speech:['Find a picture starting with',sounds[x]],cue:'👂 → 🖼️'});
  });
  register('rhymo','Rhymo’s Rhyme Train','Rhymo','🚂',s=>{
    const l=s.level,base=pick(['cat','dog','fan'].map(word),s),same=words.filter(w=>w.family===base.family&&w!==base),match=same[0],near=base.word==='dog'?word('dot'):word('cap');
    if(l>=7){const answers=same.slice(0,2).map(w=>w.word);return task(`Find all the pictures that rhyme with ${base.word}.`,shuffle([...same.slice(0,2).map(pic),pic(near),pic(word('sun'))]),answers[0],{mode:'all',answers,cue:'🚂 🎵'});}
    if(l>=5)return task(`Which picture does not rhyme with ${base.word}?`,shuffle([...same.slice(0,2).map(pic),pic(near)]),near.word,{cue:'🚂 🎵'});
    return task(`Which picture rhymes with ${base.word}?`,options(pic(match),[pic(near),pic(word('sun')),pic(word('pig'))],count(l)),match.word,{cue:'🚂 🎵'});
  });
  register('bo','Bo’s Blending Bridge','Bo','🌉',s=>{
    const l=s.level,w=pick((l>=5?['cat','hat','bat']:['sun','dog','cat']).map(word),s),pool=(l>=5?['cat','hat','bat','rat','cap']:['sun','dog','cat','hen','bug']).map(word);
    return task(l>=7?'Tap each letter to hear it. Then choose the picture.':'Listen to the sounds. Which picture makes the word?',options(pic(w),pool.map(pic),count(l)),w.word,{speech:['Blend these sounds.',...blend(w,l<=2?650:l<=4?380:160),'Choose the picture.'],tiles:l>=7?w.parts:null,word:w,cue:'🌉 👂'});
  });
  register('fam','Fam the Word Family Truck','Fam','🚚',s=>{
    const l=s.level,families=l<=3?['at','an','og']:['un','en','ig'],family=pick(families,s),members=words.filter(w=>w.family===family&&w.parts.length===3),w=members[s.round%members.length];
    if(l>=7){const fs=s.round%2?['an','en']:['at','og'],ws=fs.flatMap(f=>words.filter(w=>w.family===f&&w.parts.length===3).slice(0,2));return task('Tap a picture, then its word family truck.',[...shuffle(ws.map(pic)),...fs.map(f=>({value:'truck-'+f,icon:`🚚 -${f}`,label:`${f} family truck`,speech:`Truck for ${f}, as in ${words.find(w=>w.family===f).word}`}))],'',{mode:'sort',sorted:[],total:ws.length,cue:'🚚 ↔ 🚚'});}
    if(l>=5)return task(`Which word is in the ${family} family, like ${members[0].word}?`,options(pic(w),words.filter(v=>v.family!==family).slice(0,8).map(pic),4),w.word,{cue:`🚚 -${family}`});
    return task(`Choose a starting sound for the ${family} family.`,members.map(v=>letter(v.parts[0])),w.parts[0],{mode:'build',family,members,cue:`🚚 _${family}`});
  });
  register('tap-tap','Tap-Tap Sound Steps','Tap-Tap','🪨',s=>{
    const l=s.level,w=pick((l<=2?['bee','tea','shoe']:l===8?['frog','flag','crab']:['sun','cat','dog']).map(word),s);
    if(l>=4&&l<=6){const i=l-4,x=w.parts[i],position=['first','middle','last'][i];return task(`Listen to ${w.word}. Which is its ${position} sound?`,options(letter(x),['s','b','c','a','u','d','o','g','t','n'].map(letter),4),x,{cue:w.icon});}
    if(l===7){const pair=pick([['sun','bun'],['cat','hat'],['dog','log']],s),a=word(pair[0]),b=word(pair[1]);return task(`Change ${a.word}'s first sound to ${sounds[b.parts[0]]}. Which picture is the new word?`,options(pic(b),[pic(a),pic(word('pig')),pic(word('fan'))],4),b.word,{cue:`${a.icon} → ❓`});}
    return task(`Say ${w.word} slowly. Tap one stone for each sound, from left to right.`,w.parts.map((x,i)=>({value:'stone-'+i,icon:'🪨',label:`Sound stone ${i+1}`,speech:sounds[x]})),'stone-0',{mode:'steps',total:w.parts.length,word:w,cue:w.icon,speech:[w.word,'Tap one stone for each sound.',...blend(w,400)]});
  });
})();
