/* Math task factories and shared five-question planning. Safe in node:vm. */
(() => {
  'use strict';
  const V=window.QuizmoVisuals;
  const mathIds=['addition','subtraction','times','division','place','fractions','words','missing','measure','speed'];
  const random=opts=>opts?.rng||Math.random;
  const int=(lo,hi,r)=>lo+Math.floor(r()*(hi-lo+1));
  const choose=(a,r)=>a[int(0,a.length-1,r)];
  const sig=(id,op,nums)=>`${id}:${op}:${nums.slice().sort((a,b)=>String(a).localeCompare(String(b),undefined,{numeric:true})).join(',')}`;
  function question(id,level,opts={}) {
    const l=Math.max(1,Math.min(8,level)), r=random(opts), mode=opts.mode;
    if(!mathIds.includes(id))return window.QuizmoCogat.question(id,l,opts);
    if(id==='speed') {const t=question(opts.source||choose(mathIds.slice(0,-1),r),l,opts);return {...t,source:t.kind,kind:'speed',sig:`speed:${t.sig}`};}
    const make=(op,nums,prompt,answers,hint,visual,extra={})=>({kind:id,operation:op,prompt,answers,hint,visual,sig:sig(id,op,nums),magnitude:Math.max(...nums.filter(Number.isFinite),...answers),...extra});
    if(id==='addition') {
      const lo=[100,200,400,1000,2000,3000,4000,6000][l-1], hi=[499,799,999,2499,3999,5999,7999,9999][l-1];
      const a=int(lo,hi,r), b=int(lo,hi,r), three=l>=3&&(mode==='three'||r()<.45), c=three?int(lo,hi,r):0, ns=three?[a,b,c]:[a,b];
      return make(three?'three-addends':'sum',ns,`${ns.join(' + ')} = ?`,[a+b+c],'Line up the places. Add each column; regroup every ten as one in the next column.',V.arithmetic({values:ns,operation:'addition'}));
    }
    if(id==='subtraction') {
      const lo=[300,500,800,2000,3000,5000,7000,10000][l-1], hi=[999,1499,1999,3999,5999,7999,9999,19999][l-1];
      const zeros=l>=4&&(mode==='zeros'||r()<.55), a=zeros?int(Math.ceil(lo/1000),Math.floor(hi/1000),r)*1000+int(0,8,r):int(lo,hi,r);
      const b=int(Math.floor(a*.28),Math.floor(a*.79),r);
      return make(zeros?'across-zero':'difference',[a,b],`${a} − ${b} = ?`,[a-b],'Start at the ones. If a place is empty, trade from the next nonzero place, one column at a time.',V.arithmetic({values:[a,b],operation:'subtraction'}));
    }
    if(id==='times') {
      let a,b;
      if(l<=2){a=int(l===1?3:8,l===1?12:18,r);b=int(l===1?3:6,12,r);}
      else if(l<=5){a=int([0,0,13,24,45][l-1], [0,0,29,59,99][l-1],r);b=int(l+1,9,r);}
      else if(l<=7){a=int(l===6?110:240,l===6?239:399,r);b=int(6,9,r);}
      else {a=int(23,99,r);b=int(14,99,r);}
      return make(l===8?'two-by-two':'product',[a,b],`${a} × ${b} = ?`,[a*b],'Split a factor into tens and ones. Multiply each part, then add the partial products.',V.times({a,b}));
    }
    if(id==='division') {
      const d=int(l===1?4:5,Math.min(12,l+7),r), q=int([8,10,13,19,26,38,49,65][l-1],[12,18,25,35,49,63,85,110][l-1],r), rem=int(1,d-1,r), total=d*q+rem;
      return make('quotient-remainder',[total,d],`${total} ÷ ${d}: quotient and remainder?`,[q,rem],'Use chunks of the divisor, such as ten groups. The leftover must be smaller than the divisor.',V.division({total,d}),{labels:['Quotient','Remainder']});
    }
    if(id==='place') {
      const n=int([1234,2500,5000,10000,22000,35000,50000,70000][l-1],[3999,5999,9999,24999,39999,54999,74999,99999][l-1],r), types=l===1?['digit','expanded']:l<=3?['digit','round','expanded','shift']:['round','shift','compare','expanded'];
      const type=mode||choose(types,r), power=choose(l<=2?[10,100,1000]:[100,1000,10000],r), digit=Math.floor(n/power)%10;
      if(type==='round'){const unit=choose(l<3?[10,100]:[100,1000],r);return make('round',[n,unit],`Round ${n} to the nearest ${unit}.`,[Math.round(n/unit)*unit],'Find the two neighboring multiples. A halfway value rounds up.',V.place({n}));}
      if(type==='shift'){const k=l<4?1000:choose([1000,10000],r), less=r()<.5&&n>k;return make(less?'less':'more',[n,k],`What is ${k} ${less?'less':'more'} than ${n}?`,[n+(less?-k:k)],'Change the matching place-value column. Regroup if the column crosses ten or zero.',V.place({n}));}
      if(type==='compare'){const p=choose([10,100],r), factor=choose([10,100],r), d=int(2,9,r);return make('value-ratio',[d*p,d*p*factor],`A ${d} is worth ${d*p*factor} in one number and ${d*p} in another. How many times as much?`,[factor],'Compare the place values by division. Each move left multiplies a digit’s value by ten.',V.place({n:d*p*factor}));}
      if(type==='expanded'){const parts=String(n).split('').map((d,i)=>Number(d)*10**(String(n).length-i-1)), index=parts.findIndex(x=>x===Math.floor(n/power)%10*power);const valid=index<0?1:index;const shown=parts.map((x,i)=>i===valid?'?':x).join(' + ');return make('expanded',[n,power],`${n} = ${shown}`, [parts[valid]],'Read each digit with its place. Expanded form adds the values of all the places.',V.place({n}));}
      return make('digit-value',[n,power],`In ${n}, what is the value of the ${power}s digit?`,[digit*power],'Find the named column. Multiply its digit by the value of one block in that column.',V.place({n}));
    }
    if(id==='fractions') {
      const d=choose(l<=2?[3,4,5]:l<=4?[4,5,6]:l<=6?[6,7,8,9,10,12]:l===7?[10,12,14,16]:[16,18,20,24],r);
      const n=int(2,d-1,r),k=int(3+l,6+2*l,r),total=d*k;
      const type=mode||choose(l<=2?['quantity','quantity','equivalent']:l<=4?['quantity','equivalent','add']:l<=6?['quantity','equivalent','compare','add']:l===7?['steps','equivalent','compare','whole-add']:['steps','remaining','compare','equivalent','whole-add'],r);
      if(type==='equivalent'){
        const mul=int(l<3?2:l===8?4:3,l<3?4:l<5?6:8,r);
        return make('equivalent',[n,d,d*mul],`${n}/${d} = ?/${d*mul}. Find the numerator.`,[n*mul],'Find how many times bigger the denominator is. Multiply the numerator by the same factor.',V.fractions({n,d,n2:n*mul,d2:d*mul,label2:`?/${d*mul}`}),{labels:['Numerator']});
      }
      if(type==='compare'){
        const d2=d+int(1,5,r);let n2=Math.max(1,Math.min(d2-1,Math.round(n*d2/d)+int(-1,1,r)));
        if(n*d2===n2*d)n2+=n2<d2-1?1:-1;
        return make('compare',[n,d,n2,d2],`Greater fraction: ${n}/${d} (1) or ${n2}/${d2} (2)? Enter 1 or 2.`,[n*d2>n2*d?1:2],'Compare cross products: each numerator times the other denominator. Which is larger?',V.fractions({n,d,n2,d2}),{labels:['Choice 1 or 2'],magnitude:Math.max(n*d2,n2*d)});
      }
      if(type==='whole-add'){
        const a=int(Math.ceil(d/3),d-1,r),b=int(Math.ceil(d/3),d-1,r),c=int(Math.ceil(d/3),d-1,r),sum=a+b+c;
        return make('mixed-sum',[a,b,c,d],`${a}/${d} + ${b}/${d} + ${c}/${d} = ? + ?/${d}.`,[Math.floor(sum/d),sum%d],`Add the numerators. Each ${d} parts makes a whole; put the leftover parts above ${d}.`,V.fractions({n:a,d,n2:b,n3:c}),{labels:['Whole parts','Numerator'],magnitude:d*sum});
      }
      if(type==='steps'||type==='remaining'||type==='mixed'){
        const den=choose(l===7?[6,8,10]:[8,10,12],r),num=int(2,den-1,r),redDen=choose([2,3,4],r);
        const units=int(l===7?2:3,Math.floor(160/(den*redDen)),r),amount=den*redDen*units,lit=num*redDen*units,red=num*units;
        const remaining=type==='remaining';
        return make(remaining?'fraction-remaining':'fraction-steps',[num,den,amount,1,redDen],`${num}/${den} of ${amount} lanterns are lit. 1/${redDen} of the lit ones are red. How many ${remaining?'lit ones are not red':'are red'}?`,[remaining?lit-red:red],remaining?'Find how many are lit, then how many of those are red. Subtract red from lit.':'Find the lit group first. Then divide that group into equal parts to find the red ones.',V.fractions({mode:'quantity',d:den,total:amount}));
      }
      if(type==='add'){
        const a=int(l>=5?Math.ceil(d/2):1,d-1,r),b=int(l>=5?Math.ceil(d/2):1,d-1,r);
        return make('like-add',[a,b,d],`${a}/${d} + ${b}/${d} = ?/${d}. Find the numerator.`,[a+b],'The pieces stay the same size. Add the counts of pieces and keep the denominator.',V.fractions({n:a,d,n2:b,d2:d}),{labels:['Numerator'],magnitude:d*(a+b)});
      }
      return make('fraction-of-set',[n,d,total],`What is ${n}/${d} of ${total} lanterns?`,[n*k],'Find one equal group by dividing by the denominator. Then multiply by the numerator.',V.fractions({mode:'quantity',d,total}));
    }
    if(id==='words') {
      const bags=int(5+l*2,10+l*3,r), each=int(5+l,10+2*l,r), extra=int(8,12+l*8,r), type=mode||choose(l<=2?['left','extra']:['left','extra','tickets','share'],r), total=bags*each;
      if(type==='tickets'){const cost=int(2+l,7+l,r), given=(bags+each)*cost+extra;return make('tickets',[bags,each,cost,given],`${bags} children and ${each} adults buy $${cost} tickets. They pay $${given}. Change in dollars?`,[extra],'Add the people, then multiply by the ticket price. Subtract that cost from the payment.',V.words({items:[`${bags} children`,`${each} adults`,`$${cost} each`]}));}
      if(type==='share'){const friends=int(3,8,r), reserve=int(2,10+l,r), amount=friends*total+reserve;return make('share-reserve',[amount,reserve,friends],`${amount} beads: save ${reserve}, then share the rest among ${friends} teams. Beads per team?`,[total],'Subtract the saved beads first. Divide what remains into equal team shares.',V.words({items:[`${amount} beads`,`Save ${reserve}`,`${friends} teams`]}));}
      const left=type==='left', answer=left?total-extra:total+extra;
      return make(left?'pack-use':'pack-extra',[bags,each,extra],`${l>=6?`The trail is ${int(3,15,r)} km. `:''}${bags} bags hold ${each} snacks each. ${left?`Hikers eat ${extra}`:`Add ${extra} loose snacks`}. How many ${left?'remain':'now'}?`,[answer],'First find bags × snacks per bag. Then use only the extra detail needed to change that total.',V.words({items:[`${bags} bags`,`${each} per bag`,`${left?'Use':'Add'} ${extra}`]}));
    }
    if(id==='missing') {
      let x=int([12,20,30,45,65,90,120,180][l-1],[60,90,130,180,240,330,440,650][l-1],r);const a=int(4,12,r), b=int(8,30+l*6,r), type=mode||choose(l<=2?['multiply','subtract']:l<=4?['subtract','multiply-add']:['multiply-add','divide-add','two-sides'],r);
      if(type==='multiply'&&l<=2)x=int(l===1?3:6,12,r);
      if(type==='multiply')return make('missing-factor',[a,x*a],`? × ${a} = ${x*a}`,[x],'Undo multiplication by dividing the total by the known factor.',V.machine({op:`× ${a}`,output:x*a}));
      if(type==='subtract')return make('missing-subtrahend',[x+b,b],`${x+b} − ? = ${b}`,[x],'The starting number is the missing part plus the amount left. Subtract the amount left.',V.machine({input:x+b,op:'− ?',output:b}));
      if(type==='divide-add')return make('divide-add',[a,b,x+b],`(? ÷ ${a}) + ${b} = ${x+b}`,[x*a],'Undo the addition first. Then undo division by multiplying.',V.machine({op:`÷ ${a}`,op2:`then + ${b}`,output:x+b}));
      if(type==='two-sides'){const c=int(2,7,r);return make('two-sides',[a,b,x,c],`${a} × ? + ${b} = ${a*x-c} + ${b+c}`,[x],'Simplify the right side first. Undo the addition on the left, then divide.',V.machine({op:`× ${a}`,op2:`then + ${b}`,output:`${a*x-c} + ${b+c}`}));}
      return make('multiply-add',[a,b,a*x+b],`${a} × ? + ${b} = ${a*x+b}`,[x],'Undo the last step first: subtract the extra amount, then divide by the multiplier.',V.machine({op:`× ${a}`,op2:`then + ${b}`,output:a*x+b}));
    }
    if(id==='measure') {
      const type=mode||choose(l<=2?['time','money','rectangle','convert']:l<=4?['time','money','rectangle','convert','perimeter']:['time','money','lshape','convert','missing-side'],r);
      if(type==='time'){const start=int(7,10,r)*60+choose([25,35,40,45,50,55],r), duration=int(3+l*2,8+l*4,r)*5,end=start+duration;
        const fmt=t=>`${Math.floor(t/60)%12||12}:${String(t%60).padStart(2,'0')}`;
        return make('elapsed-time',[start,duration],`${fmt(start)} to ${fmt(end)}: how many minutes?`,[duration],'Count to the next hour, then through whole hours, then the final minutes.',V.measure({mode:'time',start,end}),{magnitude:duration});}
      if(type==='money'){const paid=choose(l<=2?[500]:l<=4?[500,1000]:[1000,2000],r),cost=int(Math.floor(paid*.25),paid-26,r);return make('change',[paid,cost],`Pay $${paid/100} for a $${Math.floor(cost/100)}.${String(cost%100).padStart(2,'0')} kit. Change in cents?`,[paid-cost],'Convert the bill to cents. Subtract the cost, or count up to the bill amount.',V.measure({mode:'money',paid,cost}));}
      if(type==='convert'){const unit=choose(['length','mass','time'],r),a=int(1+l,3+2*l,r),base=unit==='length'?100:unit==='mass'?1000:60,b=int(1,base-1,r),major=unit==='length'?'m':unit==='mass'?'kg':'hours',minor=unit==='length'?'cm':unit==='mass'?'g':'minutes';return make(`convert-${unit}`,[a,b,base],`${a} ${major} ${b} ${minor} = how many ${minor}?`,[a*base+b],'Convert the larger units first, then add the smaller units.',V.measure({unit,title:`${a} ${major} + ${b} ${minor}`,key:`1 ${unit==='time'?'hour':major} = ${base} ${minor}`}));}
      const w=int(5+l*2,10+l*4,r),h=int(3+l,7+l*2,r);
      if(type==='lshape'){const cutW=int(2,w-2,r),cutH=int(2,h-2,r);return make('lshape-area',[w,h,cutW,cutH],`A ${w} × ${h} cm rectangle loses a ${cutW} × ${cutH} cm corner. Area left in square cm?`,[w*h-cutW*cutH],'Find the whole rectangle’s area. Subtract the area of the cut-out corner.',V.measure({mode:'lshape',w,h,cutW,cutH}));}
      if(type==='missing-side')return make('missing-side',[w,h,2*(w+h)],`Rectangle perimeter: ${2*(w+h)} cm. Length: ${w} cm. Width in cm?`,[h],'Halve the perimeter to find length plus width. Then subtract the known length.',V.measure({mode:'rectangle',w,h,hide:true,caption:`Perimeter ${2*(w+h)} cm` }));
      const per=type==='perimeter';return make(per?'perimeter':'area',[w,h],`Rectangle ${w} cm by ${h} cm. ${per?'Perimeter in cm':'Area in square cm'}?`,[per?2*(w+h):w*h],per?'Add length and width, then double for both pairs of sides.':'Multiply the rows by the squares in each row.',V.measure({mode:'rectangle',w,h}));
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
        task=question(id,l,bank?{...opts,bankItem:bank[bankIndex++%bank.length]}:opts);
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
