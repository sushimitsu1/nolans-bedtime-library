/* First grade reasoning, gently stretching into second grade. No DOM. */
(() => {
  'use strict';
  const V=window.QuizmoVisuals;
  const mathIds=['addition','subtraction','times','division','place','fractions','words','missing','measure','speed'];
  const random=opts=>opts?.rng||Math.random;
  const int=(lo,hi,r)=>lo+Math.floor(r()*(hi-lo+1));
  const choose=(a,r)=>a[int(0,a.length-1,r)];
  const sample=(draw,accept)=>{for(let i=0;i<1000;i++){const v=draw();if(accept(v))return v;}throw Error('Curriculum range has no suitable draw');};
  const carries=(a,b)=>Number(a%10+b%10>=10);
  const sig=(id,op,nums)=>`${id}:${op}:${(['sum','three-addends','product'].includes(op)?nums.slice().sort((a,b)=>a-b):nums).join(',')}`;
  const fmt=t=>`${Math.floor(t/60)%12||12}:${String(t%60).padStart(2,'0')}`;
  function question(id,level,opts={}) {
    const l=Math.max(1,Math.min(8,level)),r=random(opts),mode=opts.mode;
    if(!mathIds.includes(id))return window.QuizmoCogat.question(id,l,opts);
    if(id==='speed'){const t=question(opts.source||choose(mathIds.slice(0,-1),r),l,opts);return {...t,source:t.kind,kind:'speed',sig:`speed:${t.sig}`};}
    const select=types=>types.includes(mode)?mode:choose(types,r);
    const make=(op,nums,prompt,answers,hint,visual,extra={})=>({kind:id,operation:op,prompt,answers,hint,visual,operands:nums,sig:sig(id,op,nums),magnitude:Math.max(...nums.filter(Number.isFinite),...answers),steps:1,...extra});
    const choice=(task,answer,wrong)=>{
      const options=[...new Set([answer,...wrong].map(String))];
      for(let delta=1;options.length<4&&typeof answer==='number';delta++)if(!options.includes(String(answer+delta)))options.push(String(answer+delta));
      const choices=options.slice(0,4);for(let i=choices.length-1;i>0;i--){const j=int(0,i,r);[choices[i],choices[j]]=[choices[j],choices[i]];}
      return {...task,choices,correct:choices.indexOf(String(answer))};
    };
    if(id==='addition'){
      const type=select(l<=2?['sum','missing','pair','ten','double']:l===8?['sum','missing','compare','three','story']:['sum','missing','compare','story']);
      if(type==='three'){
        const ns=Array.from({length:3},()=>int(2,9,r)),total=ns.reduce((a,b)=>a+b,0);
        return make('three-addends',ns,`${ns[0]} red, ${ns[1]} blue, ${ns[2]} gold beads. How many beads?`,[total],'Join two parts, then add the last part.',V.arithmetic({values:ns,operation:'addition'}),{addends:ns,regroups:0,steps:2});
      }
      const [a,b]=sample(()=>{if(type==='ten'){const a=int(2,8,r);return [a,10-a];}if(type==='double'){const a=int(2,l===1?7:9,r);return [a,a+1];}return l<=2?[int(3,12,r),int(2,9,r)]:[int(l<=4?12:21,[0,0,39,78,79,79,85,85][l-1],r),int(2,l===3?5:l===4?9:48,r)];},([a,b])=>a+b<=(l===1?15:l===2?20:100)&&(l>=6||l<=2||!carries(a,b)));
      const extra={addends:[a,b],regroups:l<=2?0:carries(a,b)};
      if(type==='pair')return choice(make('make-ten',[a,b],`${a} + ? = ${a+b}. Which part is missing?`,[],'Count up from the first part to the whole.',V.machine({input:a,op:'+ ?',output:a+b}),extra),b,[b-1,b+1,a+b]);
      if(type==='compare'){const other=Math.min(100,a+b+choose([-2,-1,0,1,2],r));return choice(make('compare-sum',[a,b,other],`${a} + ${b} ? ${other}. Choose the sign.`,[],'Add the two parts, then compare.',V.arithmetic({values:[a,b],operation:'addition'}),{...extra,steps:2}),a+b>other?'>':a+b<other?'<':'=',['<','>','=']);}
      if(type==='missing'||type==='ten')return make('missing-addend',[a,b],`${a} + ? = ${a+b}`,[b],'Count up to find the missing part.',V.machine({input:a,op:'+ ?',output:a+b}),extra);
      return make('sum',[a,b],(type==='story'||l>=3)?`${a} beads in a box. Add ${b}. How many now?`:`${a} + ${b} = ?`,[a+b],extra.regroups?'Make a new ten, then add the tens.':'Add the ones, then the tens.',V.arithmetic({values:[a,b],operation:'addition'}),extra);
    }
    if(id==='subtraction'){
      const type=select(l<=2?['difference','compare','missing']:['difference','compare','fewer','missing']);
      const [a,b]=sample(()=>l<=2?[int(7,l===1?15:20,r),int(2,12,r)]:[int(l<=4?21:32,l===3?49:l===4?79:99,r),int(2,l<=4?9:65,r)],([a,b])=>a>b&&(!['compare','fewer'].includes(type)||b>=5&&a-b>=3)&&(l<=2||l>=6||a%10>=b%10));
      const extra={subtrahends:[a,b],borrows:l<=2?0:Number(a%10<b%10)};
      if(type==='missing')return make('missing-subtrahend',[a,b],`${a} − ? = ${a-b}`,[b],'Find the part taken away from the whole.',V.machine({input:a,op:'− ?',output:a-b}),extra);
      const prompt=type==='compare'?`Mia has ${a} beads. Leo has ${b}. How many more has Mia?`:type==='fewer'?`Mia has ${a} beads. Leo has ${b}. How many fewer has Leo?`:l>=3?`${a} beads. Take away ${b}. How many stay?`:`${a} − ${b} = ?`;
      return make(type==='difference'?'difference':'how-many-more',[a,b],prompt,[a-b],extra.borrows?'Trade a ten for ones, then find the gap.':'Find the gap between the two amounts.',V.arithmetic({values:[a,b],operation:'subtraction'}),extra);
    }
    if(id==='times'){
      const type=select(l<=2?['groups','repeat','skip']:l<=5?['groups','repeat','skip','missing']:['groups','missing','rows','skip']);
      const b=choose(type==='skip'?[2,5,10]:l<=2?[2,5,10]:l<=4?[2,3,5,10]:[2,3,4,5,10],r),a=int(l<=2?1:2,['skip','rows'].includes(type)?(b===10&&l===8?9:4):l<=2?5:l<8?5:b===10?10:5,r);
      const extra={factors:[a,b]},visual=V.times({a,b});
      if(type==='skip')return make('skip-count',[a,b],`Count by ${b}: ${(Array.from({length:a},(_,i)=>(i+1)*b)).join(', ')}, ?`,[(a+1)*b],'Add one more equal jump.',V.skip({a,b}),{factors:[a,b],steps:1});
      if(type==='repeat')return make('repeated-addition',[a,b],`${l>=3?'Rows show ':''}${Array(a).fill(b).join(' + ')} = ?`,[a*b],'Each row is one equal group.',visual,extra);
      if(type==='missing')return make('missing-factor',[a,b],`? groups of ${b} make ${a*b}. How many groups?`,[a],'Count the equal rows in the picture.',visual,extra);
      if(type==='rows')return make('add-row',[a,b],`${a} rows of ${b}. Add a row. How many in all?`,[(a+1)*b],'Add one more whole row.',visual,{factors:[a+1,b],steps:2});
      return make('product',[a,b],`${a} groups of ${b}. How many in all?`,[a*b],'Count the equal rows or add each row.',visual,extra);
    }
    if(id==='division'){
      const type=select(l===8?['sharing','grouping','half','double','remainder']:['sharing','grouping','half','double']);
      const d=type==='half'?2:int(2,l<=2?3:5,r),q=int(2,Math.floor((type==='remainder'?14:20)/d),r),rem=type==='remainder'?int(1,Math.min(d-1,15-d*q),r):0,total=d*q+rem;
      if(type==='double'){const n=int(2,10,r);return make('double',[n,2],`Double ${n}. How many in two equal groups?`,[n*2],'Add the same amount twice.',V.times({a:2,b:n}),{dividend:n*2,divisor:2});}
      const prompt=type==='remainder'?`${total} shells in groups of ${d}. How many groups and left over?`:type==='half'?`What is half of ${total} shells?`:type==='grouping'?`${total} shells in bags of ${d}. How many bags?`:`Share ${total} shells among ${d} kids. How many each?`;
      return make(type==='remainder'?'quotient-remainder':type,[total,d],prompt,type==='remainder'?[q,rem]:[q],'Make equal groups. Check that each group has the same amount.',V.sharing({total,d,remainder:rem}),{dividend:total,divisor:d,remainder:!!rem,labels:rem?['Groups','Remainder']:['Answer'],steps:rem?2:1});
    }
    if(id==='place'){
      const type=select(['expanded','shift','digit','compare']),n=sample(()=>int([12,20,30,40,50,120,200,300][l-1],[60,110,110,110,110,399,699,899][l-1],r),n=>(type!=='expanded'||!String(n).includes('0'))&&(type!=='digit'||l>=6||n%100>0));
      if(type==='compare'){const other=Math.max(0,Math.min(l<=5?120:999,n+choose([-10,-1,0,1,10],r)));return choice(make('compare',[n,other],`${n} ? ${other}. Choose the sign.`,[],'Compare hundreds, then tens, then ones.',V.place({n})),n>other?'>':n<other?'<':'=',['<','>','=']);}
      if(type==='shift'){const k=l>=6?choose([10,100],r):10,less=r()<.5&&n>=k;return make(less?'less':'more',[n,k],`What is ${k} ${less?'less':'more'} than ${n}?`,[n+(less?-k:k)],'Change the named place.',V.place({n}));}
      if(type==='digit'){const power=choose((l>=6?[1,10,100]:[1,10]).filter(p=>Math.floor(n/p)%10>0),r);return make('digit-value',[n,power],`In ${n}, what is the value of the ${power===1?'ones':(power===10?'tens':'hundreds')} digit?`,[Math.floor(n/power)%10*power],'Use the place of the digit.',V.place({n}),{power});}
      const parts=String(n).split('').map((d,i)=>Number(d)*10**(String(n).length-i-1)),index=int(0,parts.length-1,r);
      return make('expanded',[n,index],`${n} = ${parts.map((v,i)=>i===index?'?':v).join(' + ')}`,[parts[index]],'Find the missing tens, ones, or hundreds.',V.place({n}));
    }
    if(id==='fractions'){
      const type=select(l<=2?['quantity','count','shaded','equal']:l<=5?['quantity','count','shaded','equal','compare']:['quantity','count','shaded','equal','compare']);
      const d=choose(l===1?[2,4]:[2,3,4],r),n=l>=6&&d===4?int(1,3,r):1,style=int(0,5,r),names=['flag','window','tile','pie','mat','ring'];
      if(type==='equal'){
        const target=choose(l<=2?[2,4]:[2,3,4],r),correct=int(0,3,r),salt=int(0,1,r);
        return choice(make('equal-parts',[target,correct,salt],`Which shape shows ${target} equal parts?`,[],'All the parts must be the same size.',V.partOptions({d:target,correct,salt}),{denominators:[target]}),String.fromCharCode(65+correct),['A','B','C','D']);
      }
      if(type==='compare'){const other=choose([3,4],r),left=r()<.5?2:other,right=left===2?other:2;return choice(make('compare',[1,left,1,right],`Which piece is bigger: 1/${left} or 1/${right}?`,[],'The wholes are the same size. Look at one piece.',V.fractions({n:1,d:left,n2:1,d2:right}),{denominators:[left,right]}),`1/2`,[`1/${other}`,'Equal']);}
      if(type==='shaded'||type==='count'){
        const mask=choose(Array.from({length:1<<d},(_,i)=>i).filter(m=>Array.from({length:d},(_,i)=>(m>>i)&1).reduce((a,b)=>a+b)===n),r),visual=V.fractions({n,d,shaded:true,style,mask}),extra={denominators:[d],pictureStyle:style,shadeMask:mask};
        if(type==='count')return make('count-parts',[n,d,style,mask],`How many equal parts make this ${names[style]}?`,[d],'Count all the equal parts in the whole.',visual,extra);
        return choice(make('shaded',[n,d,style,mask],`What part of the ${names[style]} is shaded?`,[],'Count all equal parts, then the gold parts.',visual,extra),`${n}/${d}`,(l<6?['1/2','1/3','1/4']:['1/2','1/3','1/4','3/4']).filter(f=>{const [a,b]=f.split('/').map(Number);return a*d!==n*b;}));
      }
      const den=choose(l>=7?[2,3,4]:[2,4],r),num=l===8&&den===4?int(1,3,r):1,total=den*int(l>=7?Math.ceil(8/den):1,Math.floor((num>1?8:12)/den),r);
      return make('fraction-of-set',[num,den,total],`What is ${num}/${den} of ${total} lanterns?`,[num*total/den],'Split the set into equal parts. Count the parts you need.',V.fractions({mode:'quantity',n:num,d:den,total}),{total,denominators:[den],hintVisual:V.fractions({mode:'quantity',n:num,d:den,total,grouped:true}),steps:num>1?2:1});
    }
    if(id==='words'){
      const type=select(l<=2?['join','left','money']:l<6?['birds','money','time']:['birds','money','change','time']);
      if(type==='money'||type==='change'){
        const coins=sample(()=>Array.from({length:int(2,l<=2?4:6,r)},()=>choose(l<=2?[1,5]:l<=4?[1,5,10]:[1,5,10,25],r)),cs=>cs.reduce((a,b)=>a+b,0)<=(type==='change'?24:100)),sum=coins.reduce((a,b)=>a+b,0);
        if(type==='change'){const paid=sum<10?10:25;return make('change',[paid,sum],`Pay ${paid} cents. It costs ${sum} cents. Change in cents?`,[paid-sum],'Count up from the cost to the coin paid.',V.coins({coins:[paid],cost:sum}),{money:true,paid,cost:sum,coins:[paid]});}
        return make('count-coins',coins,'How many cents are these coins worth?',[sum],'Count the bigger coins first, then add the rest.',V.coins({coins}),{money:true,coins,paid:sum,cost:0});
      }
      if(type==='time'){const start=int(1,8,r)*60,duration=int(1,l<6?2:3,r)*60,end=start+duration;return make('elapsed-hours',[start,duration],`Play starts at ${fmt(start)} and ends at ${fmt(end)}. How many hours?`,[duration/60],'Count whole hour jumps.',V.measure({mode:'time',start,end}),{start,end,duration,step:60});}
      const a=int(l<=2?5:8,l<=2?13:24,r),b=int(2,l<=2?20-a:10,r),c=int(1,Math.min(8,a+b-1),r);
      if(type==='birds')return make('birds',[a,b,c],`${a} birds sit. ${b} come, then ${c} fly off. How many stay?`,[a+b-c],'First add the birds that come, then take away those that go.',V.words({items:[`${a} birds`,`${b} come`,`${c} go`]}),{steps:2});
      return make(type,[a,b],type==='join'?`Mia has ${a} shells and finds ${b}. How many now?`:`Leo has ${a+b} shells and gives ${b} away. How many stay?`,[type==='join'?a+b:a],type==='join'?'Join the two parts.':'Take away the shells given away.',V.words({items:[`${type==='join'?a:a+b} shells`,`${b} ${type==='join'?'found':'given'}`]}));
    }
    if(id==='missing'){
      const a=int(2,l===1?6:l===2?7:l===3?8:l<=5?9:15,r),b=int(3,l===1?9:l===2?10:l<=5?11:25,r),type=select(l<6?['add','subtract']:['add','subtract','balance']);
      if(type==='balance'){const c=int(2,12,r),d=int(3,15,r),x=c+d-a;if(x<=0)return question(id,l,opts);return make('balance-add',[a,c,d],`? + ${a} = ${c} + ${d}`,[x],'Find the right total, then the missing part.',V.machine({input:'?',op:`+ ${a}`,output:`${c} + ${d}`}),{steps:2});}
      if(type==='subtract')return make('missing-subtrahend',[a+b,a],`${a+b} − ? = ${b}`,[a],'Find what was taken away.',V.machine({input:a+b,op:'− ?',output:b}));
      return make('missing-addend',[a,b],`? + ${a} = ${a+b}`,[b],'Count up to the whole.',V.machine({input:'?',op:`+ ${a}`,output:a+b}));
    }
    if(id==='measure'){
      const type=select(l<=5?['clock','length','compare']:['clock','length','compare','area']);
      if(type==='clock'){const hour=int(1,12,r),step=l<=2?60:l<=4?30:l<=6?15:5,minutes=int(0,60/step-1,r)*step;return make('tell-time',[hour,minutes],minutes?'What time does the clock show?':'What hour does the clock show?',minutes?[hour,minutes]:[hour],'Read the short hand for hours, then the long hand.',V.measure({mode:'clock',time:hour*60+minutes}),{labels:minutes?['Hour','Minutes']:['Hour'],hour,minutes,step});}
      if(type==='area'){const w=int(2,5,r),h=int(2,Math.min(5,Math.floor(20/w)),r),area=w*h;return make('area',[w,h],'How many squares cover this shape?',[area],'Count each row, then add the rows.',V.measure({mode:'grid',w,h,cutW:0,cutH:0}),{area,sides:[w,h]});}
      if(type==='length'){const start=l>=6?int(0,5,r):0,end=int(start+1,15,r);return make('ruler',[start,end],'How long is the ribbon in cm?',[end-start],'Read both ends. Count the gap between them.',V.ruler({start,end}),{length:end-start,start,end,steps:start?2:1});}
      const a=int(8,15,r),b=int(5,a-3,r),short=r()<.5;
      if(l<=2)return choice(make('compare-length',[a,b,Number(short)],`Which ribbon is ${short?'shorter':'longer'}?`,[],'Compare the ends of the two ribbons.',V.lengths({a,b}),{lengths:[a,b]}),short?'B':'A',['A','B','Same length']);
      return make('length-gap',[a,b],`Ribbon A is ${a} cm. B is ${b} cm. How much longer is A?`,[a-b],'Find the gap between the two lengths.',V.lengths({a,b}),{lengths:[a,b]});
    }
    throw Error(`Unknown game ${id}`);
  }
  function level(id,l,recent=[],opts={}) {
    const history=Array.isArray(recent)?recent.filter(s=>typeof s==='string').slice(-30):[], used=new Set(), content=new Set(),tasks=[];
    // Clocks and rulers, like shape puzzles, share an instruction across distinct pictures.
    const contentKey=task=>['figures','measure'].includes(id)?task.prompt+'|'+V.normalizeSvg(task.visual):task.prompt;
    // A local shuffled deck makes fixed-bank planning pure and samples without replacement.
    const bank=['links','groups'].includes(id)?window.QuizmoCogat.deck(id,l,random(opts)):null;
    let bankIndex=0;
    for(let slot=0;slot<5;slot++){
      let task;
      for(let attempt=0;attempt<240;attempt++){
        const taskOpts=opts;
        task=question(id,l,bank?{...taskOpts,bankItem:bank[bankIndex++%bank.length]}:taskOpts);
        // Keep the familiar written opening, then mix numeric and tappable tasks.
        if(slot===0&&mathIds.includes(id)&&task.choices)continue;
        const duplicate=used.has(task.sig)||content.has(contentKey(task)), last=tasks.at(-1)?.sig||history.at(-1);
        if(duplicate||last===task.sig)continue;
        if(attempt<200&&history.includes(task.sig))continue;
        if(attempt<4&&['place','fractions','words','missing','measure','speed','series','puzzles','figures'].includes(id)&&tasks.at(-1)?.operation&&task.operation===tasks.at(-1).operation)continue;
        break;
      }
      // Never silently accept an in-level collision, even with a broken RNG.
      if(used.has(task.sig)||content.has(contentKey(task)))throw Error(`Could not generate distinct ${id} questions; RNG must vary`);
      tasks.push(task);used.add(task.sig);content.add(contentKey(task));
    }
    return tasks;
  }
  window.JasperQuizmoGen={question,level,signature:task=>task.sig,mathIds};
})();
