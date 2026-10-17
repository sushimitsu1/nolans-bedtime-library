/* Bounded curriculum: number size, regrouping and reasoning rise together. No DOM. */
(() => {
  'use strict';
  const V=window.QuizmoVisuals;
  const mathIds=['addition','subtraction','times','division','place','fractions','words','missing','measure','speed'];
  const random=opts=>opts?.rng||Math.random;
  const int=(lo,hi,r)=>lo+Math.floor(r()*(hi-lo+1));
  const choose=(a,r)=>a[int(0,a.length-1,r)];
  const sample=(draw,accept)=>{for(let i=0;i<1000;i++){const v=draw();if(accept(v))return v;}throw Error('Curriculum range has no suitable draw');};
  const sig=(id,op,nums)=>`${id}:${op}:${(['sum','three-addends','product'].includes(op)?nums.slice().sort((a,b)=>a-b):nums).join(',')}`;
  const carries=(a,b)=>{let carry=0,count=0;for(let p=1;p<=100;p*=10){carry=(Math.floor(a/p)%10+Math.floor(b/p)%10+carry)>=10?1:0;count+=carry;}return count;};
  const fmt=t=>`${Math.floor(t/60)%12||12}:${String(t%60).padStart(2,'0')}`;
  function timeTask(l,r,words=false){
    const hour=int(1,8,r),step=l<=2?60:l<=4?30:l<=6?15:5;
    if(l<=2)return {start:hour*60,duration:int(1,words?1:3,r)*60,step};
    if(l<=4)return {start:hour*60+choose([0,30],r),duration:l===3?choose([30,90],r):90,step};
    if(l<=6)return {start:hour*60+45,duration:words?choose([75,90],r):l===5?choose([90,150],r):choose([105,135,165],r),step};
    return sample(()=>{const start=hour*60+choose([5,10,20,25,35,40,50,55],r),end=(hour+int(1,l===8&&!words?2:1,r))*60+choose([5,10,20,25,35,40,50,55],r);return {start,duration:end-start,step};},t=>t.duration>=(l===7?45:65)&&t.duration<=(words?95:145)&&t.duration%15!==0);
  }
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
      const type=select(l===1?['sum','missing']:l<=3?['sum','missing','three','pair']:l===4?['sum','missing','three']:l<=6?['sum','missing','estimate','two-step']:['sum','missing','two-step']);
      if(type==='three'){
        const ns=sample(()=>Array.from({length:3},()=>int(l===2?15:25,50,r)),ns=>ns.reduce((a,b)=>a+b)>= (l===4?110:l===3?90:60));
        return make('three-addends',ns,`${ns.join(' + ')} = ?`,[ns.reduce((a,b)=>a+b)],'Make a ten with two parts, then add the third.',V.arithmetic({values:ns,operation:'addition'}),{steps:2});
      }
      if(type==='pair'){
        const x=int(24,76,r),y=100-x;
        return choice(make('make-100',[x,y],`Which pair makes 100? One part is ${x}.`,[],'Use the ones and tens to complete 100.',V.machine({input:x,op:'+ ?',output:100})),`${x} + ${y}`,[`${x} + ${y+10}`,`${x+1} + ${y}`,`${x} + ${y-10}`]);
      }
      const [a,b]=sample(()=>{const a=int([25,45,150,250,350,450,350,400][l-1],[79,89,399,499,599,699,649,699][l-1],r);return [a,int([25,35,35,45,65,75,200,250][l-1],Math.min(l<=2?99:l<=6?99:499,999-a),r)];},([a,b])=>carries(a,b)>=(l>=5?2:1)&&a+b>=[60,90,190,300,420,520,700,800][l-1]);
      const extra={addends:[a,b],regroups:carries(a,b)};
      if(type==='two-step'){
        const c=int(16,l>=7?49:35,r);return make('sum-then-use',[a,b,c],`${a} red beads and ${b} blue beads. Use ${c} beads. How many remain?`,[a+b-c],'Add both colors first, then take away the used beads.',V.arithmetic({values:[a,b],operation:'addition'}),{...extra,steps:2});
      }
      if(type==='estimate'){
        const estimate=Math.round(a/10)*10+Math.round(b/10)*10;
        return choice(make('estimate',[a,b,10],`Round each number to the nearest 10. About how much is ${a} + ${b}?`,[],'Round both parts before adding.',V.arithmetic({values:[a,b],operation:'addition'}),{...extra,steps:2}),estimate,[estimate-20,estimate+20,estimate+10]);
      }
      if(type==='missing')return make('missing-addend',[a,b],`${a} + ? = ${a+b}`,[b],'Find the missing part by counting up or subtracting.',V.machine({input:a,op:'+ ?',output:a+b}),extra);
      return make('sum',[a,b],`${a} + ${b} = ?`,[a+b],'Add by place. Regroup each ten into the next place.',V.arithmetic({values:[a,b],operation:'addition'}),extra);
    }
    if(id==='subtraction'){
      const at=int(4,9,r),bt=int(1,at-1,r),ao=int(0,7,r),bo=int(ao+1,9,r),hundreds=l<=2?0:int([0,0,1,2,3,4,6,7][l-1],[0,0,3,5,6,7,8,9][l-1],r);
      const bh=hundreds?int([0,0,0,0,1,2,3,3][l-1],hundreds-1,r):0,a=hundreds*100+at*10+ao,b=bh*100+bt*10+bo,type=select(['difference','compare','missing']),extra={subtrahends:[a,b],borrows:1};
      if(type==='compare')return make('how-many-more',[a,b],`Mia has ${a} beads. Leo has ${b}. How many more does Mia have?`,[a-b],'Find the gap. Trade one ten for ten ones.',V.arithmetic({values:[a,b],operation:'subtraction'}),extra);
      if(type==='missing')return make('missing-subtrahend',[a,b],`${a} − ? = ${a-b}`,[b],'The total has a part removed and a part left. Find the removed part.',V.machine({input:a,op:'− ?',output:a-b}),extra);
      return make('difference',[a,b],`${a} − ${b} = ?`,[a-b],'Trade one ten for ten ones, then subtract by place.',V.arithmetic({values:[a,b],operation:'subtraction'}),extra);
    }
    if(id==='times'){
      const cap=l<=2?5:l===3?6:l<=6?9:12;
      const type=select(l===1?['product','missing','rows','array']:l===2?['missing','rows','array','neighbor']:l<=5?['missing','array','rows']:l===6?['neighbor','boxes','array']:['eleven','neighbor','boxes','array']);
      if(type==='boxes'){
        const [a,b,c,d]=sample(()=>[int(l>=8?5:3,6,r),int(6,9,r),int(3,5,r),int(6,9,r)],ns=>ns[0]*ns[1]+ns[2]*ns[3]>=(l===6?45:l===7?55:65));
        return make('two-boxes',[a,b,c,d],`${a} boxes of ${b} crayons and ${c} boxes of ${d}. How many crayons?`,[a*b+c*d],'Find the total in each kind of box, then add.',V.words({items:[`${a} boxes of ${b}`,`${c} boxes of ${d}`]}),{factors:[a,b,c,d],steps:3});
      }
      if(type==='neighbor'){
        const a=choose(l===2?[3,4,5]:l>=7?[11,12]:[6,7,8,9],r),b=int(l===2?2:l>=8?7:6,l===2?4:8,r);
        return make('neighbor-fact',[a,b,a,b+1],`${a} × ${b} = ${a*b}. What is ${a} × ${b+1}?`,[a*(b+1)],'There is one extra in each row. Add the number of rows to the known total.',V.times({a,b:b+1}),{factors:[a,b,a,b+1],steps:2});
      }
      if(type==='eleven'){
        const a=choose(l===7?[11]:[11,12],r),b=int(l===7?6:7,9,r);
        return make('large-fact-groups',[a,b],`${a} rows have ${b} chairs each. How many chairs?`,[a*b],'Split the rows into ten rows and the rows left over.',V.times({a,b}),{factors:[a,b],steps:2});
      }
      let a=int(l<=2?2:l===3?3:6,l<=2?(type==='rows'?4:5):l===3?5:8,r),b=int(l<=2?2:l===3?3:l===8?7:6,cap===12?9:cap,r);
      if(type==='array')a=l>=7?12:int(l<=2?3:l===3?4:l===6?8:7,l<=2?5:l===3?6:9,r);
      if(type==='missing')return make('missing-factor',[a,b],`? × ${b} = ${a*b}`,[a],'Find the number of equal rows from the total and each row size.',V.machine({op:`× ${b}`,output:a*b}),{factors:[a,b]});
      if(type==='product')return make('product',[a,b],`${a} × ${b} = ?`,[a*b],'Count equal groups.',V.times({a,b}),{factors:[a,b]});
      const rows=type==='rows',answer=(rows?a+1:a-1)*b;
      return make(rows?'chair-rows':'array',[a,b],rows?`${a} rows have ${b} chairs each. Add one more row. How many chairs now?`:`The array has ${a} rows of ${b}. Take away one row. How many squares remain?`,[answer],rows?'Find the first total, then add a whole row.':'Find the full array, then remove one row.',V.times({a,b}),{factors:[a,b,rows?a+1:a-1,b],steps:2});
    }
    if(id==='division'){
      const type=select(l<=5?['sharing','grouping','missing']:l===6?['reserve']:['remainder','reserve']);
      if(type==='remainder'){
        const [d,q,rem,total]=sample(()=>{const d=int(3,6,r),q=int(l===7?4:5,l===7?7:8,r),rem=int(1,d-1,r);return [d,q,rem,d*q+rem];},ns=>ns[3]<=50&&ns[3]>=(l===7?18:25));
        return make('quotient-remainder',[total,d],`${total} ÷ ${d}: quotient and remainder?`,[q,rem],'Make as many full equal groups as possible. Count the leftover.',V.division({total,d,remainder:true}),{labels:['Quotient','Remainder'],dividend:total,divisor:d,remainder:true,steps:2});
      }
      const d=int(l<=2?2:l===3?3:l===4?4:6,l<=2?5:l===3?6:9,r),q=int(l===1?2:l===2?3:l===3?4:l===4?5:l<=6?6:7,Math.min(l<=3?Math.floor(50/d):9,l===1?8:9),r),total=d*q;
      if(type==='reserve'){
        const saved=int(l>=7?8:5,Math.min(17,100-total),r),stock=total+saved;
        return make('reserve-groups',[stock,saved,d],`${stock} shells: save ${saved}. Put the rest in bags of ${d}. How many bags?`,[q],'Take away the saved shells, then split the rest into equal bags.',V.words({items:[`${stock} shells`,`Save ${saved}`,`${d} per bag`]}),{dividend:total,divisor:d,stock,saved,steps:2});
      }
      if(type==='missing')return make('missing-dividend',[d,q],`? ÷ ${d} = ${q}`,[total],'Multiply the group count by the size of each group.',V.division({total:'?',d}),{dividend:total,divisor:d});
      return make(type,[total,d],type==='grouping'?`${total} shells go in bags of ${d}. How many full bags?`:`Share ${total} shells equally among ${d} friends. How many each?`,[q],'Find equal groups using a times fact.',V.division({total,d}),{labels:['Answer'],dividend:total,divisor:d});
    }
    if(id==='place'){
      const n=sample(()=>int([120,200,300,400,500,1200,3500,6500][l-1],[399,499,599,749,899,2999,5999,9699][l-1],r),n=>l<5||Math.floor(n/10)%10>=2&&Math.floor(n/100)%10>=2),type=select(l<=2?['expanded','shift','digit','compare']:l<=4?['expanded','shift','round','compare']:['two-shifts','expanded-pair','round','compare']);
      if(type==='compare'){
        if(l>=6){const add=choose([100,110,90],r),other=n+add+choose([-10,0,10],r),correct=n+add>other?'Left':n+add<other?'Right':'Equal';return choice(make('compare-shift',[n,add,other],`Which is bigger: ${n} + ${add} (Left), or ${other} (Right)?`,[],'Work out the left side, then compare by place.',V.place({n}),{steps:2}),correct,['Left','Right','Equal']);}
        const other=n+choose([-100,-10,-1,1,10,100],r);return choice(make('compare',[n,other],`${n} ? ${other}. Choose the sign.`,[],'Compare the highest place first, then the next.',V.place({n})),n>other?'>':'<',['<','>','=']);
      }
      if(type==='round'){const unit=l<=3?10:100,rounded=Math.round(n/unit)*unit;return make(l>=6?'round-then-shift':'round',[n,unit,...(l>=6?[100]:[])],l>=6?`Round ${n} to the nearest 100, then add 100.`:`Round ${n} to the nearest ${unit}.`,[rounded+(l>=6?100:0)],'Find the closer hundred or ten, then follow any final step.',V.place({n}),{steps:l>=6?2:1});}
      if(type==='two-shifts'){
        const a=100,b=choose([20,30,40,50,60,70,80,90],r);return make('two-shifts',[n,a,b],`Start at ${n}. Add ${a}, then take away ${b}. What number?`,[n+a-b],'Change the hundreds, then change the tens.',V.place({n}),{steps:2});
      }
      if(type==='shift'){const k=l<=2?10:100,less=r()<.5;return make(less?'less':'more',[n,k],`What is ${k} ${less?'less':'more'} than ${n}?`,[n+(less?-k:k)],'Change the named place. Regroup when needed.',V.place({n}));}
      if(type==='digit'){const power=choose([10,100],r);return make('digit-value',[n,power],`In ${n}, what is the value of the ${power}s digit?`,[Math.floor(n/power)%10*power],'Match the digit with the size of its place.',V.place({n}));}
      const parts=String(n).split('').map((d,i)=>Number(d)*10**(String(n).length-i-1));
      if(type==='expanded-pair')return make('expanded-pair',[n],`${n} = ${parts.length===4?`${parts[0]} + `:''}? + ? + ${parts.at(-1)}. Fill hundreds, then tens.`,[parts.at(-3),parts.at(-2)],'Split the middle two digits into their place values.',V.place({n}),{labels:['Hundreds','Tens'],steps:2});
      const index=choose(parts.map((v,i)=>i).filter(i=>l<=2||i<parts.length-1&&parts[i]>0),r);
      return make('expanded',[n,index],`${n} = ${['?',...parts.filter((_,i)=>i!==index)].join(' + ')}`,[parts[index]],'Find the missing place value.',V.place({n}));
    }
    if(id==='fractions'){
      const ds=l===1?[2,4]:l===2?[2,3,4]:l<=4?[3,4]:l===5?[3,4,5,6]:[4,5,6,8],d=choose(ds,r),type=select(l<=2?['quantity','shaded','whole']:l===3?['quantity','shaded','whole']:l===4?['quantity','shaded','compare']:l===5?['quantity','compare','equivalent']:l===6?['quantity','compare','equivalent']:['quantity','compare','equivalent']);
      const n=l<=2?1:int(l<=4?2:l>=7?Math.ceil(12/Math.floor(24/d)):l===6?Math.ceil(8/Math.floor(24/d)):2,d-1,r);
      if(type==='shaded'){
        const styles=['flag','window','tile','ribbon','mat','panel'],style=int(0,5,r),mask=choose(Array.from({length:1<<d},(_,i)=>i).filter(m=>Array.from({length:d},(_,i)=>(m>>i)&1).reduce((a,b)=>a+b)===n),r);
        const candidates=(l===1?[2,4]:[2,3,4]).flatMap(den=>Array.from({length:den},(_,i)=>`${i+1}/${den}`)).filter(f=>{const [a,b]=f.split('/').map(Number);return a*d!==n*b;}).filter((f,i,all)=>{const [a,b]=f.split('/').map(Number);return all.findIndex(g=>{const [c,e]=g.split('/').map(Number);return a*e===c*b;})===i;});
        return choice(make('shaded',[n,d,style,mask],`What fraction of the ${styles[style]} is shaded?`,[],'Count the equal parts, then count the shaded parts.',V.fractions({n,d,shaded:true,style,mask}),{denominators:[d],pictureStyle:style,shadeMask:mask}),`${n}/${d}`,candidates);
      }
      if(type==='compare'){
        const [den,num,den2,num2]=sample(()=>{const den=choose(ds.filter(x=>x>=3),r),num=int(2,den-1,r),den2=choose(ds.filter(x=>x>=3&&x!==den),r),num2=Math.max(1,Math.min(den2-1,Math.round(num*den2/den)));return [den,num,den2,num2];},([a,b,c,e])=>Math.abs(b/a-e/c)<=.22);
        const left=`${num}/${den}`,right=`${num2}/${den2}`,answer=num*den2===num2*den?'Equal':num*den2>num2*den?left:right;
        return choice(make('compare',[num,den,num2,den2],`Which is greater: ${left} or ${right}?`,[],'The whole bars are the same size. Compare their shaded amounts.',V.fractions({n:num,d:den,n2:num2,d2:den2}),{denominators:[den,den2]}),answer,[left,right,'Equal'].filter(x=>x!==answer));
      }
      if(type==='equivalent'){
        const base=choose(l===5?[2,3,4]:[3,4],r),num=int(l>=6?2:1,base-1,r),den=base*2;
        if(l>=7)return make('equivalent-denominator',[num,base,num*2],`${num}/${base} = ${num*2}/?. Find the denominator.`,[den],'Find the change in the top number. Make the same change below.',V.fractions({n:num,d:base,n2:num*2,d2:den,label2:`${num*2}/?`}),{labels:['Denominator'],denominators:[base,den],steps:2});
        return make('equivalent',[num,base,den],`${num}/${base} = ?/${den}. Find the numerator.`,[num*2],'Split each old part in two, then count the new pieces.',V.fractions({n:num,d:base,n2:0,d2:den,label2:`?/${den}`}),{labels:['Numerator'],denominators:[base,den]});
      }
      const [num,k]=sample(()=>[n,int(l<=2?1:Math.max(2,Math.ceil(12/d)),Math.floor((l<=2?12:24)/d),r)],([num,k])=>d*k>=4&&(l<6||num*k>=(l>=7?12:8)));
      const total=d*k;
      if(type==='whole')return make('fraction-whole',[1,d,k],`1/${d} of a set is ${k} lanterns. How many lanterns altogether?`,[total],'Make the whole set from that many equal parts.',V.machine({input:k,op:`${d} equal parts`,output:'?'}),{total,denominators:[d]});
      const used=l>=7?int(2,Math.min(5,num*k-8),r):0;
      return make(used?'fraction-then-use':'fraction-of-set',[num,d,total,...(used?[used]:[])],used?`${num}/${d} of ${total} lanterns are lit. ${used} go out. How many stay lit?`:`What is ${num}/${d} of ${total} lanterns?`,[num*k-used],'Find one equal part, then the lit amount. Use the last step if any go out.',V.fractions({mode:'quantity',n:num,d,total,answer:num*k-used}),{total,denominators:[d],hintVisual:V.fractions({mode:'quantity',n:num,d,total,grouped:true}),steps:l>=7?3:num===1?1:2});
    }
    if(id==='words'){
      const type=select(l<=2?['join','left','money']:['pack','pack-extra','money','time','share']);
      if(type==='money'){
        const paid=choose(l<=2?[500,1000]:l<=5?[1000]:[1000,2000],r),dollars=int(l<=2?1:l<=4?3:l<=6?5:paid===1000?6:12,paid/100-(l>=6?2:1),r),cents=l===1?0:l===2?50:choose(l>=7?[25,75]:[25,50,75],r),cost=dollars*100+cents;
        return make('change',[paid,cost],`Pay $${paid/100} for a $${(cost/100).toFixed(2)} book. Change in cents?`,[paid-cost],'Count up to the next dollar, then to the amount paid.',V.measure({mode:'money',paid,cost}),{money:true,paid,cost,steps:l<=2?1:2});
      }
      if(type==='time'){
        const t=timeTask(l,r,true),end=t.start+t.duration;
        return make('elapsed-time',[t.start,t.duration],`Play starts at ${fmt(t.start)} and ends at ${fmt(end)}. How many minutes?`,[t.duration],'Count to the next hour, then count the rest.',V.measure({mode:'time',start:t.start,end}),{...t,end,steps:2});
      }
      if(type==='join'||type==='left'){
        const a=int(l===1?12:25,l===1?29:49,r),b=int(l===1?12:25,l===1?29:49,r);
        return make(type,[a,b],type==='join'?`Mia has ${a} shells and finds ${b} more. How many now?`:`Leo has ${a+b} shells and gives away ${b}. How many remain?`,[type==='join'?a+b:a],type==='join'?'Join both parts.':'Take away the part given away.',V.words({items:[`${type==='join'?a:a+b} shells`,`${b} ${type==='join'?'found':'given'}`]}));
      }
      const [a,b,extra]=sample(()=>[int([0,0,3,4,5,6,7,8][l-1],l>=7?9:7,r),int([0,0,4,5,6,6,7,7][l-1],l>=5?9:7,r),int(l>=6?7:3,l>=6?15:10,r)],([a,b,e])=>a*b+(type==='pack-extra'?e:-e)>=[0,0,12,18,24,30,35,42][l-1]&&a*b+e<=100);
      if(type==='share')return make('share-reserve',[a*b+extra,extra,a],`${a*b+extra} beads: save ${extra}, then share the rest among ${a} teams. How many per team?`,[b],'Take out the saved beads, then share the rest equally.',V.words({items:[`${a*b+extra} beads`,`Save ${extra}`,`${a} teams`]}),{steps:2});
      const add=type==='pack-extra';return make(add?'pack-extra':'pack-use',[a,b,extra],`${a} bags hold ${b} apples each. ${add?`Add ${extra} apples`:`Eat ${extra} apples`}. How many now?`,[a*b+(add?extra:-extra)],'Find the total in the bags, then add or take away.',V.words({items:[`${a} bags`,`${b} per bag`,`${add?'Add':'Eat'} ${extra}`]}),{steps:2});
    }
    if(id==='missing'){
      const type=select(l<=3?['add','subtract','multiply']:l===4?['multiply','two-sides']:['two-sides','multiply-add','subtract-product']);
      const a=int([2,3,3,4,4,5,6,7][l-1],l<=2?5:l===3?6:9,r),x=int([3,3,4,4,5,6,7,8][l-1],l<=2?5:9,r),product=a*x,b=int(l<=3?3:7,Math.min(19,100-product,l<=3?19:product-8),r);
      if(type==='two-sides')return make('two-sides',[b,a,x],`? + ${b} = ${a} × ${x}`,[product-b],'Work out the product, then find the missing part.',V.machine({op:`+ ${b}`,output:`${a} × ${x}`}),{steps:2});
      if(type==='multiply-add')return make('multiply-add',[a,b,product+b],`${a} × ? + ${b} = ${product+b}`,[x],'Undo the add step, then undo the times step.',V.machine({op:`× ${a}`,op2:`then + ${b}`,output:product+b}),{steps:2});
      if(type==='subtract-product'){
        const start=int(product+8,Math.min(100,product+30),r);return make('subtract-product',[start,a,x],`${start} − ? = ${a} × ${x}`,[start-product],'Find the product, then the missing part of the starting number.',V.machine({input:start,op:'− ?',output:`${a} × ${x}`}),{steps:2});
      }
      if(type==='multiply')return make('missing-factor',[a,product],`? × ${a} = ${product}`,[x],'Find the missing times fact.',V.machine({op:`× ${a}`,output:product}));
      const total=int(l===1?30:l===2?50:65,l===1?59:l===2?79:100,r),part=int(12,total-12,r);
      return make(type==='add'?'missing-addend':'missing-subtrahend',[total,part],type==='add'?`${part} + ? = ${total}`:`${total} − ? = ${part}`,[total-part],'Think of the total as two parts. Find the missing part.',V.machine({input:type==='add'?part:total,op:type==='add'?'+ ?':'− ?',output:type==='add'?total:part}));
    }
    if(id==='measure'){
      const type=select(l===1?['clock','time','convert']:l===2?['clock','time','convert','area']:l<=5?['clock','time','convert','perimeter','area']:l===6?['clock','time','convert','missing-side','area']:['clock','time','missing-side','lshape']);
      if(type==='clock'){
        const hour=int(1,12,r),minutes=choose(l===1?[0]:l<=4?[0,30]:l<=6?[15,45]:[5,10,20,25,35,40,50,55],r),step=l===1?60:l<=4?30:l<=6?15:5;
        return make('tell-time',[hour,minutes],'What time does the clock show?',[hour,minutes],'Read the short hand, then count the long hand in minute steps.',V.measure({mode:'clock',time:hour*60+minutes}),{labels:['Hour','Minutes'],hour,minutes,step});
      }
      if(type==='time'){
        const t=timeTask(l,r),end=t.start+t.duration;return make('elapsed-time',[t.start,t.duration],`${fmt(t.start)} to ${fmt(end)}: how many minutes?`,[t.duration],'Count to the next hour, then the remaining hours and minutes.',V.measure({mode:'time',start:t.start,end}),{...t,end,steps:l<=2?1:2});
      }
      if(type==='convert'){
        const a=int(l<=2?1:l<=4?2:3,l<=2?2:l<=4?4:5,r),b=int([5,25,25,35,45,55,55,55][l-1],l===1?45:95,r),extra=l>=6?100-b+int(15,45,r):0;
        return make(extra?'convert-add':'convert-length',[a,b,...(extra?[extra]:[])],extra?`${a} m ${b} cm plus ${extra} cm. How many cm altogether?`:`${a} m ${b} cm = how many cm?`,[a*100+b+extra],'Change metres to centimetres, then add all the centimetres.',V.measure({unit:'length',title:`${a} m + ${b} cm`,key:'1 m = 100 cm'}),{steps:extra?2:1});
      }
      const w=int(l===2?2:l<=3?3:l===4?5:l===5?6:l===6?6:7,l===2?4:l<=3?5:l<=5?8:8,r),h=int(l===2?2:l<=3?3:l===4?4:5,Math.min(l===2?3:l<=3?4:5,Math.floor(40/w)),r);
      if(type==='perimeter')return make('perimeter',[w,h],`A rectangle is ${w} cm by ${h} cm. Perimeter in cm?`,[2*(w+h)],'Add both pairs of equal sides.',V.measure({mode:'rectangle',w,h}),{sides:[w,h],steps:2});
      if(type==='missing-side'){
        const length=int(l===6?7:9,12,r),width=int(l===6?6:l===7?7:9,12,r),perimeter=2*(length+width);
        return make('missing-side',[perimeter,length],`Rectangle perimeter: ${perimeter} cm. Length: ${length} cm. Width in cm?`,[width],'Halve the perimeter to find length plus width, then subtract the length.',V.measure({mode:'rectangle',w:length,h:width,hide:true,caption:`Perimeter ${perimeter} cm`}),{sides:[length,width],steps:2});
      }
      const [cutW,cutH]=type==='lshape'?sample(()=>[int(l===8?2:1,3,r),int(l===8?2:1,3,r)],([a,b])=>w*h-a*b>=(l===8?28:24)):[0,0],area=w*h-cutW*cutH;
      return make(type==='lshape'?'lshape-area':'area',[w,h,cutW,cutH],type==='lshape'?'Count the squares in this L-shape. Area in square units?':'Count the squares in the grid. Area in square units?',[area],'Find full rows first, then add the shorter rows.',V.measure({mode:'grid',w,h,cutW,cutH}),{sides:[w,h],area,steps:type==='lshape'?2:1});
    }
    throw Error(`Unknown game ${id}`);
  }
  function level(id,l,recent=[],opts={}) {
    const history=Array.isArray(recent)?recent.filter(s=>typeof s==='string').slice(-30):[], used=new Set(), content=new Set(),tasks=[];
    const contentKey=task=>id==='figures'?V.normalizeSvg(task.visual):task.prompt;
    // A local shuffled deck makes fixed-bank planning pure and samples without replacement.
    const bank=['links','groups'].includes(id)?window.QuizmoCogat.deck(id,l,random(opts)):null;
    let bankIndex=0;
    for(let slot=0;slot<5;slot++){
      let task;
      for(let attempt=0;attempt<240;attempt++){
        const taskOpts=id==='fractions'&&l<=2?{...opts,mode:slot===0?choose(['quantity','whole'],random(opts)):'shaded'}:opts;
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
