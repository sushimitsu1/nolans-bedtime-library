(() => {
  const G=window.NolanGames, t=G.token;
  const art=slug=>`assets/books/${slug}/page-01.webp`;
  const choices=items=>`<div class="game-choices">${items.join('')}</div>`;
  G.register({id:'hazel',title:'Hazel’s Count-and-Load',friend:'Hazel',icon:'🎃',art:art('hazel-the-little-tractor-and-the-moonlight-harvest'),
    start:p=>({round:0,count:0,loads:p.easy?[1,2,3]:[2,3,5]}),answer:()=> 'pumpkin',
    prompt:s=>`Help Hazel load ${s.loads[s.round]} pumpkins. Tap one pumpkin at a time.`,
    scene:s=>'🎃'.repeat(s.count)+' 🛒',
    board:s=>`<div class="game-cue" aria-label="Pumpkins to load">${'🎃'.repeat(s.loads[s.round])}</div><div class="game-slots">${Array.from({length:s.loads[s.round]},(_,i)=>`<span class="game-cue">${i<s.count?'🎃':'◯'}</span>`).join('')}</div>${choices([t('pumpkin','🎃','Load a pumpkin')])}`,
    choose(s,v){if(v!=='pumpkin')return {};s.count++;const count=s.count;if(count===s.loads[s.round]){s.round++;s.count=0;return {points:3,done:s.round===s.loads.length,advance:true,message:`${count}. The wagon is ready. Hazel takes it to the barn. ${s.round<s.loads.length?this.prompt(s):''}`};}return {points:1,message:String(count)};}
  });
  const passengers=[{color:'#80b988',badge:'🍃',name:'Marlo',prop:'green blanket'},{color:'#f3d779',badge:'☀️',name:'Cleo',prop:'yellow pillow'},{color:'#93bce8',badge:'📘',name:'Otis',prop:'blue book'}];
  G.register({id:'coby',title:'Coby’s Color Stops',friend:'Coby',icon:'🚋',art:art('coby-the-little-trolley-and-the-city-of-sleepy-lights'),start:()=>({round:0}),answer:s=>String(s.round),prompt:s=>`Take ${passengers[s.round].name} home. Find the door with the ${passengers[s.round].prop} and matching picture.`,scene:s=>'🚋 '+passengers.slice(0,s.round).map(p=>p.badge+' 🏠').join(' '),
    board(s,p){const person=passengers[s.round];const ids=p.easy?[s.round,(s.round+1)%3]:[0,1,2];return `<div class="game-cue" style="background:${person.color}">${person.badge} 💤</div>${choices(ids.map(i=>t(String(i),`🚪 ${passengers[i].badge}`,`${passengers[i].prop} door`,`style="background:${passengers[i].color}"`)))}`;},
    choose(s,v){if(v!==String(s.round))return {hint:String(s.round),message:'Look for the same picture on the door.'};s.round++;return {points:1,done:s.round===3,advance:true};}
  });
  const shapes=['●','■','▲'];
  G.register({id:'cora',title:'Cora’s Shape Builders',friend:'Cora',icon:'🏗️',art:art('cora-crane-truck-wobbly-sign'),start:()=>({placed:[],selected:null}),answer:s=>s.selected===null?String([0,1,2].find(i=>!s.placed.includes(i))):`slot-${s.selected}`,prompt:s=>s.selected===null?'Tap a building shape, then its matching outline.':'Tap the outline with the same shape.',scene:s=>'🏗️ '+s.placed.map(i=>shapes[i]).join(' ')+' 🏠',
    board:s=>`${choices(shapes.map((x,i)=>t(String(i),x,['Circle piece','Square piece','Triangle piece'][i],`${s.placed.includes(i)?'disabled':''} ${s.selected===i?'class="selected"':''}`)))}<div class="game-slots">${shapes.map((x,i)=>t(`slot-${i}`,s.placed.includes(i)?x:['○','□','△'][i],['Circle outline','Square outline','Triangle outline'][i],s.placed.includes(i)?'disabled':'')).join('')}</div>`,
    choose(s,v){if(!v.startsWith('slot-')){const i=Number(v);if(s.placed.includes(i))return {};s.selected=i;return {hint:`slot-${i}`};}if(s.selected===null)return {hint:this.answer(s)};const i=Number(v.slice(5));if(i!==s.selected)return {hint:`slot-${s.selected}`,message:'Find the same shape. Cora can help.'};s.placed.push(i);s.selected=null;return {points:1,done:s.placed.length===3};}
  });
  const letters=['N','O','L','A'];
  G.register({id:'bramble',title:'Bramble’s Letter Carriages',friend:'Bramble',icon:'🚂',art:art('bramble-the-little-book-train-and-the-sleepy-story-town'),start:()=>({round:0}),answer:s=>letters[s.round],prompt:s=>`This letter is ${letters[s.round]}. Tap the same letter at the station.`,scene:s=>'🚂 '+letters.slice(0,s.round).join(' '),board:s=>`<div class="game-cue">🚃 ${letters[s.round]}</div>${choices([letters[s.round],letters[(s.round+1)%4]].sort().map(x=>t(x,x,`Letter ${x}`)))}`,choose(s,v){if(v!==letters[s.round])return {hint:letters[s.round],message:`Look for the same shape, ${letters[s.round]}.`};s.round++;return {points:1,done:s.round===3,advance:true};}});
  const pairs=['🔔','🍃','🍃','🔔'];
  G.register({id:'aster',title:'Aster’s Sleepy Pairs',friend:'Aster',icon:'🦊',art:art('aster-the-little-fox-and-the-whispering-weather-festival'),start:p=>({matched:[],selected:null,peek:!p.memory}),answer:s=>String(s.selected===null?[0,1,2,3].find(i=>!s.matched.includes(i)):[0,1,2,3].find(i=>i!==s.selected&&pairs[i]===pairs[s.selected])),prompt:()=> 'Tap two matching cushions. You can peek whenever you like.',scene:s=>'🦊 🐰 '+s.matched.filter((_,i)=>i%2===0).map(i=>pairs[i]).join(' '),board:s=>`${choices(pairs.map((x,i)=>t(String(i),s.peek||s.selected===i||s.matched.includes(i)?x:'🛏️',`Picture cushion ${i+1}`,s.matched.includes(i)?'disabled':'')))}${G.button('👀','Peek at all pictures','choice','class="game-token" data-value="peek"')}`,
    choose(s,v){if(v==='peek'){s.peek=!s.peek;return {};}const i=Number(v);if(s.matched.includes(i))return {};if(s.selected===null){s.selected=i;return {hint:this.answer(s)};}if(s.selected===i)return {};if(pairs[i]!==pairs[s.selected]){s.peek=true;s.selected=null;return {hint:this.answer(s),message:'Let’s look at the pictures together.'};}s.matched.push(s.selected,i);s.selected=null;return {points:2,done:s.matched.length===4};}
  });
})();
