/* Shared, resolution-independent teaching illustrations. No DOM dependencies. */
(() => {
  'use strict';
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=(x,y,s,size=18,fill='#17324d')=>`<text ${String(s).length>35&&size<=20?'class="quizmo-small-note"':''} x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="middle" dominant-baseline="middle">${esc(s)}</text>`;
  const rect=(x,y,w,h,fill='#bad7e7',rx=6)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="#357ca5" stroke-width="1.5"/>`;
  let svgInstance=0;
  // Instance IDs only affect paint-server references, never task identity.
  const normalizeSvg=value=>String(value).replace(/qv-\d+-/g,'qv-instance-');
  function svg(label,body,w=600,h=280,meta={}){
    const prefix=`qv-${++svgInstance}-`;
    const artwork=body.replace(/url\(#([a-zA-Z]\w*)\)/g,(_,name)=>`url(#${prefix}${name})`);
    return `<svg class="quizmo-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" data-wide-view-box="0 0 ${w} ${h}" ${meta.portrait?`data-portrait-view-box="${meta.portrait}" ${meta.total!==undefined?`data-lantern-total="${meta.total}"`:""}`:""} ${meta.blocks?`data-blocks="${meta.blocks}"`:""} ${meta.rows?`data-rows="${meta.rows}" data-cols="${meta.cols}"`:""} role="img" aria-label="${esc(label)}"><defs><linearGradient id="${prefix}lanternGlow" x2="0" y2="1"><stop stop-color="#fff5b8"/><stop offset=".5" stop-color="#f2a93b"/><stop offset="1" stop-color="#d58a16"/></linearGradient><radialGradient id="${prefix}halo"><stop stop-color="#f2a93b" stop-opacity=".13"/><stop offset="1" stop-color="#f2a93b" stop-opacity="0"/></radialGradient><pattern id="${prefix}qStripes" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="7" height="7" fill="#fff9ed"/><path d="M0 0V7" stroke="#357ca5" stroke-width="3"/></pattern><linearGradient id="${prefix}billPaper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf3db"/><stop offset=".55" stop-color="#d7e5c8"/><stop offset="1" stop-color="#b7cfae"/></linearGradient><radialGradient id="${prefix}silverCoin" cx=".28" cy=".22" r=".85"><stop stop-color="#fff"/><stop offset=".35" stop-color="#e6ecee"/><stop offset=".72" stop-color="#b5c1c5"/><stop offset="1" stop-color="#7f9098"/></radialGradient><radialGradient id="${prefix}copperCoin" cx=".28" cy=".22" r=".85"><stop stop-color="#ffe8bc"/><stop offset=".4" stop-color="#e5ad76"/><stop offset=".75" stop-color="#bd7848"/><stop offset="1" stop-color="#894c30"/></radialGradient><linearGradient id="${prefix}woodRuler" x2="0" y2="1"><stop stop-color="#fff0ca"/><stop offset=".18" stop-color="#efd09a"/><stop offset=".82" stop-color="#e6b976"/><stop offset="1" stop-color="#c9904b"/></linearGradient></defs><g font-family="system-ui,sans-serif">${artwork}</g></svg>`;
  }
  function lantern(x,y,s=1){return `<g class="quizmo-lantern" transform="translate(${x} ${y}) scale(${s})"><ellipse cy="25" rx="28" ry="43" fill="url(#halo)"/><path d="M-9 0V-9Q0-23 9-9V0" fill="none" stroke="#264a61" stroke-width="2"/><ellipse cy="24" rx="23" ry="28" fill="url(#lanternGlow)" stroke="#d58a16" stroke-width="2"/><path d="M-12 0Q-24 24-12 49M0 0V49M12 0Q24 24 12 49" fill="none" stroke="#fff9ed" stroke-opacity=".65" stroke-width="1.5"/><path d="M-21 15H21M-23 29H23M-19 41H19" stroke="#d58a16" fill="none"/><rect x="-12" y="-3" width="24" height="6" rx="2" fill="#c65b34"/><rect x="-11" y="48" width="22" height="5" rx="2" fill="#c65b34"/><path d="M0 53V65M-4 59V69M4 59V69" stroke="#c65b34" stroke-width="2"/></g>`;}
  function lanternLayout(total,denominator,answer,finalAnswer=answer){
    // Prefer a complete rectangle, then a countable staggered last row. Never label groups.
    const candidates=Array.from({length:11},(_,i)=>({cols:i+2,rows:Math.ceil(total/(i+2))})).filter(x=>x.cols<=total&&x.rows<=6);
    const avoid=[denominator,answer,finalAnswer],safe=candidates.filter(x=>!avoid.includes(x.rows)&&!avoid.includes(x.cols));
    const pool=safe.length?safe:candidates;
    pool.sort((a,b)=>(total%a.cols?100:0)-(total%b.cols?100:0)+Math.abs(a.cols-a.rows*1.8)-Math.abs(b.cols-b.rows*1.8));
    return pool[0];
  }
  function fractions(d){
    if(d.mode==='quantity'){
      const layout=lanternLayout(d.total,d.d,(d.n||1)*d.total/d.d,d.answer);
      function scene(width,height){
        const cols=d.grouped?d.d:layout.cols,rows=Math.ceil(d.total/cols),top=32;
        const cellW=(width-24)/cols,cellH=(height-top-12)/rows,scale=Math.min(1.2,cellW/64,cellH/96);
        let body=text(width/2,15,d.grouped?`${d.d} equal groups`:`${d.total} lanterns`,20);
        if(d.grouped){
          const per=d.total/d.d,gw=(width-24)/d.d;
          for(let g=0;g<d.d;g++){
            body+=`<g class="quizmo-lantern-group" data-groups="${d.d}" data-count="${per}">`+rect(12+g*gw,top,gw-4,height-top-8,'#fff3d8');
            const size=Math.min(1.1,(gw-8)/60,(height-top-16)/(per*96));
            for(let i=0;i<per;i++)body+=lantern(12+(g+.5)*gw,top+(i+.5)*(height-top-8)/per-25*size,size);
            body+='</g>';
          }
        }else for(let i=0;i<d.total;i++)body+=lantern(12+(i%cols+.5)*cellW,top+(Math.floor(i/cols)+.5)*cellH-25*scale,scale);
        return body;
      }
      return svg(d.grouped?'Lanterns split into equal groups for a hint':'Lanterns in simple rows, ready to split into equal groups',`<g class="quizmo-wide-art">${scene(600,320)}</g><g class="quizmo-portrait-art">${scene(400,240)}</g>`,600,320,{portrait:'0 0 400 240',total:d.total,rows:d.grouped?d.total/d.d:layout.rows,cols:d.grouped?d.d:layout.cols});
    }
    if(d.shaded){
      const style=d.style||0,mask=d.mask??((1<<d.n)-1),part=(i,body)=>`<g class="quizmo-fraction-part" data-lit="${(mask>>i)&1}">${body}</g>`,color=i=>(mask>>i)&1?'#f2a93b':'#fff9ed';
      let body='';
      for(let i=0;i<d.d;i++){
        if(style===3||style===5){
          const a=-Math.PI/2+i*2*Math.PI/d.d,b=a+2*Math.PI/d.d,r=110,cx=300,cy=140;
          const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r,x2=cx+Math.cos(b)*r,y2=cy+Math.sin(b)*r;
          body+=part(i,`<path d="M${cx} ${cy}L${x} ${y}A${r} ${r} 0 ${d.d===2?0:0} 1 ${x2} ${y2}Z" fill="${color(i)}" stroke="#357ca5" stroke-width="2"/>`);
        }else{
          const cols=style===2?1:(style===1||style===4)&&d.d===4?2:d.d,rows=Math.ceil(d.d/cols),width=style===0?480:200,height=style===0?130:200;
          body+=part(i,rect(300-width/2+(i%cols)*width/cols,140-height/2+Math.floor(i/cols)*height/rows,width/cols,height/rows,color(i),0));
        }
      }
      if(style===4)body=`<g transform="rotate(35 300 140)">${body}</g>`;
      if(style===5)body+='<circle cx="300" cy="140" r="48" fill="#edf6fa" stroke="#357ca5" stroke-width="2"/>';
      return svg('One whole split into equal parts; gold parts are shaded',body,600,280);
    }
    const items=[{n:d.n,d:d.d,label:`${d.n}/${d.d}`},{n:d.n2??d.n,d:d.d2??d.d,label:d.label2??`${d.n2??d.n}/${d.d2??d.d}`}];
    if(d.n3!==undefined)items.push({n:d.n3,d:d.d3??d.d,label:`${d.n3}/${d.d3??d.d}`});
    const body=items.map((item,row)=>{
      const y=items.length===3?55+row*105:75+row*155;
      let bar=text(64,y+27,item.label,23);
      for(let i=0;i<item.d;i++)bar+=rect(125+i*446/item.d,y,Math.max(.5,446/item.d-2),54,i<item.n?'#f2a93b':'#fff9ed',2);
      return bar;
    }).join('');
    return svg('Fraction bars with equal-length wholes divided into labeled equal parts',body,600,380);
  }
  function place(d){return blocks({mode:'place',n:d.n});}
  // Base-ten blocks: tall ten-rods, ones cubes in columns of five, hundred flats.
  const blockColors=[['#6db3df','#1f5f8b'],['#84cf98','#2f7a45'],['#f6c46a','#a8701a']];
  function rod(x,y,c,taken,extra=''){
    let b=`<g class="quizmo-rod"${taken?' data-taken="1"':''}${extra}><g${taken?' opacity=".3"':''}><rect x="${x}" y="${y}" width="22" height="100" rx="3" fill="${c[0]}" stroke="${c[1]}" stroke-width="2"/>`;
    for(let i=1;i<10;i++)b+=`<path d="M${x} ${y+i*10}h22" stroke="${c[1]}" stroke-width="1"/>`;
    b+=`<path d="M${x+5} ${y+4}v92" stroke="#fff" stroke-opacity=".45" stroke-width="3"/></g>`;
    if(taken)b+=`<path d="M${x-3} ${y+10}L${x+25} ${y+90}M${x+25} ${y+10}L${x-3} ${y+90}" stroke="#c65b34" stroke-width="4" stroke-linecap="round"/>`;
    return b+'</g>';
  }
  function cube(x,y,c,taken,extra=''){
    let b=`<g class="quizmo-cube"${taken?' data-taken="1"':''}${extra}><g${taken?' opacity=".3"':''}><rect x="${x}" y="${y}" width="18" height="18" rx="3" fill="${c[0]}" stroke="${c[1]}" stroke-width="2"/><path d="M${x+4} ${y+4}h7" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/></g>`;
    if(taken)b+=`<path d="M${x-1} ${y-1}L${x+19} ${y+19}M${x+19} ${y-1}L${x-1} ${y+19}" stroke="#c65b34" stroke-width="3" stroke-linecap="round"/>`;
    return b+'</g>';
  }
  function flat(x,y,c){let b=`<g class="quizmo-flat"><rect x="${x}" y="${y}" width="100" height="100" rx="3" fill="${c[0]}" stroke="${c[1]}" stroke-width="2"/>`;for(let i=1;i<10;i++)b+=`<path d="M${x+i*10} ${y}v100M${x} ${y+i*10}h100" stroke="${c[1]}" stroke-width=".8"/>`;return b+'</g>';}
  // Cubes fill columns of five, so ten ones read like a ten-frame.
  function cubes(x,y,count,c,taken=()=>false,extra=()=>''){let b='';for(let k=0;k<count;k++)b+=cube(x+Math.floor(k/5)*22,y+(k%5)*20+1,c,taken(k),extra(k));return {body:b,width:count?Math.ceil(count/5)*22-4:0};}
  function group(n,x,y,c,opt={}){
    const hundreds=opt.hundreds?Math.floor(n/100):0,tens=Math.floor((n-hundreds*100)/10),ones=n%10,takeT=opt.takeTens||0,takeO=opt.takeOnes||0;
    let b=`<g class="quizmo-block-group" data-value="${n}">`,cx=x;
    for(let i=0;i<hundreds;i++){b+=flat(cx,y,c);cx+=108;}
    if(hundreds&&(tens||ones))cx+=8;
    for(let i=0;i<tens;i++){b+=rod(cx,y,c,i>=tens-takeT);cx+=30;}
    if(tens&&ones)cx+=10;
    const cs=cubes(cx,y,ones,c,k=>k>=ones-takeO);b+=cs.body;cx+=cs.width;
    return {body:b+'</g>',width:Math.max(0,cx-x)};
  }
  const capW=(c,content)=>Math.max(content+20,String(c).length*11+24,150);
  function blocks(d){
    if(d.mode==='subtraction'){
      const {a,b}=d,T=Math.floor(a/10),O=a%10,bt=Math.floor(b/10),bo=b%10,borrow=O<bo,traded=borrow&&d.traded;
      const c=blockColors[0];
      if(!traded){
        const g=group(a,10,44,c,borrow?{}:{takeTens:bt,takeOnes:bo});
        const caption=d.caption||(borrow?'Not enough ones':`${a} take away ${b}`),w=capW(caption,g.width);
        return svg(borrow?`${a} as base-ten blocks; not enough ones to take ${bo}`:`${a} as base-ten blocks with ${b} crossed out`,text(w/2,18,caption,22)+`<g transform="translate(${(w-20-g.width)/2} 0)">${g.body}</g>`,w,154,{blocks:1});
      }
      // One rod becomes ten loose cubes; take the ones from the loose cubes first.
      let body=`<g class="quizmo-block-group" data-value="${a}" data-traded="1">`,x=10;
      for(let i=0;i<T-1;i++){body+=rod(x,44,c,i>=T-1-bt);x+=30;}
      if(T>1)x+=10;
      if(O){const cs=cubes(x,44,O,c,()=>true);body+=cs.body;x+=cs.width+14;}
      const need=bo-O,box=x;
      const cs=cubes(x+6,44,10,c,k=>k>=10-need,k=>` style="--i:${k}" data-traded-cube="1"`);
      body+=`<rect x="${box}" y="38" width="${cs.width+12}" height="110" rx="10" fill="none" stroke="#d58a16" stroke-width="2.5" stroke-dasharray="6 5"/>`+cs.body+'</g>';x+=cs.width+22;
      const caption=d.caption||'1 ten → 10 ones',w=capW(caption,x-10);
      return svg(`${a} after trading one ten for ten ones, with ${b} crossed out`,text(w/2,18,caption,22)+`<g transform="translate(${(w-x-10)/2} 0)">${body}</g>`,w,154,{blocks:1});
    }
    if(d.mode==='addition'){
      const vs=d.values,ones=vs.reduce((s,n)=>s+n%10,0);
      if(d.merged&&ones>=10){
        let body='',x=10;
        vs.forEach((n,i)=>{for(let t=0;t<Math.floor(n/10);t++){body+=`<g class="quizmo-block-group" data-value="${n}">`+rod(x,44,blockColors[i])+'</g>';x+=30;}});
        x+=10;const ring=x;let k=0;
        vs.forEach((n,i)=>{for(let j=0;j<n%10;j++,k++)body+=cube(x+Math.floor(k/5)*22,44+(k%5)*20+1,blockColors[i]);});
        const width=Math.ceil(k/5)*22-4;
        body+=`<rect x="${ring-6}" y="38" width="${2*22-4+12}" height="110" rx="10" fill="none" stroke="#d58a16" stroke-width="2.5" stroke-dasharray="6 5"/>`;
        x+=width;const w=capW('Make a new ten',x-10);
        return svg('All the blocks pushed together; ten ones circled to make a new ten',text(w/2,18,'Make a new ten',22)+`<g transform="translate(${(w-x-10)/2} 0)">${body}</g>`,w,154,{blocks:1});
      }
      const rowH=118;let body='',maxW=0;
      const gs=vs.map((n,i)=>group(n,62,10+i*rowH,blockColors[i]));
      gs.forEach((g,i)=>{body+=text(28,60+i*rowH,i?`+${vs[i]}`:vs[i],26)+g.body;maxW=Math.max(maxW,g.width);});
      const w=Math.max(62+maxW+12,240);
      return svg(`Base-ten blocks for ${vs.join(' plus ')}, one row per number`,body,w,vs.length*rowH,{blocks:vs.length});
    }
    if(d.mode==='place'){
      const g=group(d.n,10,10,blockColors[0],{hundreds:true}),w=Math.max(g.width+20,240);
      return svg(`${d.n} built from base-ten blocks`,`<g transform="translate(${(w-20-g.width)/2} 0)">${g.body}</g>`,w,120,{blocks:1});
    }
    const g=group(d.n,10,44,blockColors[0]),cap=d.caption||`${d.n} in all`,w=capW(cap,g.width);
    return svg(`${d.n} as base-ten blocks`,text(w/2,18,cap,22)+`<g transform="translate(${(w-20-g.width)/2} 0)">${g.body}</g>`,w,154,{blocks:1});
  }
  // Kept for any older callers: arithmetic now draws blocks, never a grid.
  function arithmetic(d){return blocks({mode:'addition',values:d.values});}
  function times(d){
    let body='';
    if(d.a<=12&&d.b<=12){
      const cell=Math.min(48,480/d.b,285/d.a),x0=300-d.b*cell/2,y0=60+(285-d.a*cell)/2;
      for(let row=0;row<d.a;row++)for(let col=0;col<d.b;col++)body+=rect(x0+col*cell,y0+row*cell,cell-4,cell-4,Math.floor(col/5)%2?'#f2a93b':'#bad7e7',5);
      body+=text(300,23,`${d.a} rows × ${d.b} in each row`,20);
    }else{
      const parts=d.b>12?[Math.floor(d.b/10)*10,d.b%10].filter(Boolean):[d.b],tens=Math.floor(d.a/10)*10,ones=d.a%10,h=parts.length===2?115:240;
      parts.forEach((part,i)=>{const y=65+i*133;body+=rect(45,y,365,h,'#bad7e7')+rect(414,y,132,h,'#f2a93b')+text(227,y+h/2,`${tens} × ${part}`,28)+text(480,y+h/2,`${ones} × ${part}`,25);});
      body+=text(300,25,`${d.a} × ${d.b} · split into friendly parts`,20)+text(300,355,'Add the areas of the parts',18);
    }
    return svg('Multiplication array or split area model labeled with factors',body,600,380);
  }
  function division(d){
    let body=rect(215,15,170,45,'#fff3d8')+text(300,38,`${d.total} to share`,22);
    const columns=Math.min(6,d.d),cw=510/columns,rows=Math.ceil(d.d/columns);
    for(let i=0;i<d.d;i++){
      const x=45+(i%columns)*cw,y=(rows===1?155:99)+Math.floor(i/columns)*115;
      body+=rect(x,y,cw-10,60,'#bad7e7')+`<circle cx="${x+14}" cy="${y+62}" r="6" fill="#17324d"/><circle cx="${x+cw-25}" cy="${y+62}" r="6" fill="#17324d"/>`+text(x+(cw-10)/2,y+30,String(i+1),23);
    }
    if(d.remainder)body+=rect(185,325,230,40,'#fff3d8')+text(300,345,'Leftover tray: ?',18);
    return svg(d.remainder?'Empty railway cars for equal sharing and a separate leftover tray':'Empty railway cars for equal sharing',body,600,380);
  }
  function words(d){
    let body=text(300,25,'Adventure supplies',22);
    d.items.forEach((label,i)=>{
      const x=35+i*180;
      body+=rect(x,98,160,210,'#bad7e7',12)+`<path d="M${x+30} 98V66Q${x+80} 24 ${x+130} 66v32" fill="none" stroke="#357ca5" stroke-width="8"/><path d="M${x} 199h160M${x+80} 98v210" stroke="#357ca5" stroke-width="3"/>`+rect(x+9,179,142,80,'#fff9ed')+text(x+80,202,label.split(' ')[0],27)+text(x+80,237,label.split(' ').slice(1).join(' '),22);
    });
    return svg('Supply crates and bags labeled with the given quantities',body,600,380);
  }
  function machine(d){
    return svg('Number machine with an unknown input and rule boxes',rect(16,140,100,80,'#fff9ed')+text(66,180,d.input??'?',28)+`<path d="M120 180h45m-12-10 12 10-12 10M333 180h43m-12-10 12 10-12 10" fill="none" stroke="#357ca5" stroke-width="5"/>`+rect(173,65,155,240,'#bad7e7',18)+text(250,145,d.op||'Find the rule',22)+text(250,220,d.op2||'Keep it balanced',18)+rect(390,140,190,80,'#fff3d8')+text(485,180,d.output??'?',25)+text(300,350,'Undo each step in reverse order',18),600,380);
  }
  function clock(x,y,time,label,showTime=true){const m=time%60,h=Math.floor(time/60)%12,hand=(angle,len,w)=>`<path d="M${x} ${y}l${Math.sin(angle)*len} ${-Math.cos(angle)*len}" stroke="#17324d" stroke-width="${w}" stroke-linecap="round"/>`;let b=`<circle cx="${x}" cy="${y}" r="89" fill="#fff9ed" stroke="#357ca5" stroke-width="5"/>`;
    for(let i=0;i<60;i++){const a=i*Math.PI/30;b+=`<path d="M${x+Math.sin(a)*82} ${y-Math.cos(a)*82}l${-Math.sin(a)*(i%5?4:8)} ${Math.cos(a)*(i%5?4:8)}" stroke="#264a61" stroke-width="${i%5?1:2}"/>`;}
    for(let i=1;i<=12;i++){const a=i*Math.PI/6;b+=text(x+Math.sin(a)*70,y-Math.cos(a)*70,i,19).replace('<text ',`<text class="quizmo-clock-number ${i%3?'minor':'major'}" `);}
    return b+hand((h+m/60)*Math.PI/6,43,6)+hand(m*Math.PI/30,64,3)+`<circle cx="${x}" cy="${y}" r="5" fill="#c65b34"/>`+text(x,y+117,`${label}${showTime?` ${Math.floor(time/60)%12||12}:${String(m).padStart(2,'0')}`:''}`,20);}
  function measure(d){
    if(d.mode==='clock')return svg('Clock with hour and minute hands; read the time',clock(300,150,d.time,'',false),600,280);
    if(d.mode==='grid'){
      const size=64,width=d.w*size+48,height=d.h*size+48,left=24,top=24;
      let body='';
      for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++)if(!(x>=d.w-d.cutW&&y<d.cutH))body+=rect(left+x*size,top+y*size,size,size,'#f2cf80',0).replace('<rect ','<rect class="quizmo-area-square" ');
      return svg('Each grid square is one square unit. Count the area.',body,width,height);
    }
    if(d.mode==='time')return svg('Start and end analog clocks with exact minute and hour hands',clock(155,130,d.start,'Start')+clock(445,245,d.end,'End')+'<path d="M270 155L325 210m-16-3 16 3-2-16" fill="none" stroke="#357ca5" stroke-width="3"/>',600,380);
    if(d.mode==='money'){
      const dollars=d.paid/100,price=`$${Math.floor(d.cost/100)}.${String(d.cost%100).padStart(2,'0')}`;
      let body=text(206,18,'Amount paid',21);
      body+=`<g class="quizmo-dollar-bill"><rect x="35" y="39" width="342" height="175" rx="7" fill="url(#billPaper)" stroke="#4e7055" stroke-width="2.5"/><rect x="43" y="47" width="326" height="159" rx="3" fill="none" stroke="#688265" stroke-width="1"/><rect x="49" y="53" width="314" height="147" rx="2" fill="none" stroke="#688265" stroke-width="3" stroke-dasharray="1 3"/>`;
      for(let x=107;x<310;x+=8)body+=`<path d="M${x} 56q4 7 8 0M${x} 198q4-7 8 0" fill="none" stroke="#6c8768" stroke-width="1"/>`;
      for(const [x,y] of [[70,75],[342,75],[70,183],[342,183]])body+=text(x,y,dollars,28,'#38563f');
      body+=`<ellipse cx="206" cy="127" rx="47" ry="60" fill="#bfcead" stroke="#5d795b" stroke-width="2"/><ellipse cx="206" cy="127" rx="42" ry="55" fill="none" stroke="#75916e" stroke-width="1"/><path d="M192 107q-1-20 17-21 16 0 16 17l-5 7 4 9-7 4-2 12 7 9 12 8q-24 17-48 0l15-10v-11q-10-8-9-24Z" fill="#71916c" stroke="#4f7054" stroke-width="1.5"/>`;
      for(const x of [110,302])body+=`<ellipse cx="${x}" cy="128" rx="31" ry="40" fill="none" stroke="#819674" stroke-width="1"/><ellipse cx="${x}" cy="128" rx="26" ry="35" fill="none" stroke="#819674" stroke-width="1"/>`+text(x,128,`$${dollars}`,24,'#49664b');
      body+=text(206,190,'DOLLARS',15,'#49664b')+'</g>';
      body+=`<path d="M419 126Q385 91 399 51Q415 19 453 52" fill="none" stroke="#a07e51" stroke-width="3"/><g class="quizmo-price-tag"><path d="M425 73H564V194H425L396 133Z" fill="#fff0cf" stroke="#b98127" stroke-width="2.5"/><path d="M432 81H555V186H432L406 133Z" fill="none" stroke="#e7c77f"/><circle cx="419" cy="133" r="6" fill="#fff9ed" stroke="#b98127" stroke-width="2"/>`+text(492,104,'PRICE',19,'#866020')+text(492,145,price,30,'#17324d')+'</g>';
      body+=text(300,245,'Coin values',22);
      for(const [index,coin] of [[25,44,'Quarter'],[10,32.5,'Dime'],[5,38.5,'Nickel'],[1,34.5,'Penny']].entries()){
        const [value,r,name]=coin,x=128+index*113,y=312,copper=value===1,edge=copper?'#8b5338':'#7c8d94';
        body+=`<g class="quizmo-coin" data-cents="${value}"><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${copper?'copperCoin':'silverCoin'})" stroke="${edge}" stroke-width="1.6"/><circle cx="${x}" cy="${y}" r="${r-3}" fill="none" stroke="${copper?'#f6c99b':'#f4f8fa'}" stroke-width="1.8"/><circle cx="${x}" cy="${y}" r="${r-6}" fill="none" stroke="${edge}" stroke-width=".8"/>`;
        if(value===25||value===10)for(let i=0;i<48;i++){const a=i*Math.PI/24;body+=`<path d="M${x+Math.sin(a)*(r-1)} ${y-Math.cos(a)*(r-1)}l${-Math.sin(a)*3} ${Math.cos(a)*3}" stroke="${edge}" stroke-width=".8"/>`;}
        body+=`<path d="M${x-10} ${y-14}q-2-12 10-14 13 1 12 12l-4 6-5 2v4l9 5h-26l10-7Z" fill="${copper?'#b77b50':'#a0afb4'}" stroke="${edge}" stroke-width=".7"/>`+text(x,y+17,`${value}¢`,23,copper?'#6d3d28':'#425967')+text(x,378,name,21)+'</g>';
      }
      return svg('Green dollar bill showing the amount paid, a price tag with the cost, and silver and copper coin values; change is unknown',body+text(300,414,'Count up from the price to the amount paid',20),600,430);
    }
    if(d.mode==='rectangle'||d.mode==='lshape'){
      let b='';for(let x=45;x<=555;x+=20)b+=`<path d="M${x} 35v300" stroke="#bad7e7" stroke-width=".7"/>`;for(let y=35;y<=335;y+=20)b+=`<path d="M45 ${y}H555" stroke="#bad7e7" stroke-width=".7"/>`;
      b+=d.mode==='lshape'?`<path d="M150 85H450V285H310V185H150Z" fill="#f2a93b66" stroke="#357ca5" stroke-width="3"/>` :rect(150,85,300,200,'#f2a93b66',0);
      b+=text(300,64,`${d.w} cm`,21)+text(505,185,d.hide?'? cm':`${d.h} cm`,21);if(d.mode==='lshape')b+=text(230,205,`${d.cutW} cm`,17)+text(350,235,`${d.cutH} cm`,17);return svg('Labeled length diagram on a light grid; drawing is not to scale',b+text(300,356,d.caption||'Not drawn to scale',16),600,380);
    }
    if(d.unit==='mass')return svg('Metric mass conversion with a balance scale and labeled weights',
      text(300,30,d.title,23)+'<path d="M300 105V295M210 305H390M160 125H440M160 125L115 235H205ZM440 125L395 235H485Z" fill="#bad7e7" stroke="#357ca5" stroke-width="5" stroke-linejoin="round"/>'+rect(137,180,46,45,'#f2a93b')+text(160,203,'kg',18)+rect(412,195,56,30,'#fff3d8')+text(440,211,'g',18)+text(300,355,d.key,22),600,380);
    if(d.unit==='time')return svg('Hours and minutes conversion with an analog clock',clock(155,200,60,'1 hour',false)+text(432,125,d.title,21)+text(432,200,d.key,19)+text(432,280,'Convert, then add',18),600,380);
    let body=text(300,43,d.title||'Match the units before calculating',23);
    body+=`<rect x="35" y="130" width="530" height="126" rx="6" fill="url(#woodRuler)" stroke="#ad7c3e" stroke-width="2"/><path d="M42 137H558M42 247H558" stroke="#fff4d7" stroke-width="3"/><path d="M50 229Q160 222 265 231T550 229M70 239Q200 231 360 240T550 236" fill="none" stroke="#ba8c50" stroke-width="1" opacity=".35"/>`;
    for(let i=0;i<=20;i++)body+=`<path d="M${45+i*25} 139v${i%5?17:34}" stroke="#6e5736" stroke-width="${i%5?1.5:2.2}"/>`+(i%5?'':text(45+i*25,195,i,24,'#59482e'));
    body+=text(533,232,'cm',23,'#6e5736')+rect(145,288,310,57,'#e5eff4',10)+text(300,317,d.key||'1 m = 100 cm',26);
    return svg('Wooden centimetre ruler with engraved ticks and a labeled metric conversion',body,600,380);

  }
  // Small countable sets and real measuring marks for the first-grade curriculum.
  function sharing(d){
    let b=text(300,22,`${d.total} shells`,23);
    for(let i=0;i<d.total;i++){
      const x=100+(i%10)*44,y=65+Math.floor(i/10)*48;
      b+=`<path class="quizmo-sharing-item" d="M${x-14} ${y+12}Q${x-20} ${y-18} ${x} ${y-18}Q${x+20} ${y-18} ${x+14} ${y+12}Z" fill="#f2cf80" stroke="#b98127" stroke-width="2"/><path d="M${x} ${y+9}v-24m-3 24-7-20m13 20 7-20" stroke="#b98127" fill="none"/>`;
    }
    const cw=500/d.d;
    for(let i=0;i<d.d;i++)b+=rect(50+i*cw,180,cw-8,76,'#e5eff4',12)+text(50+(i+.5)*cw-4,218,`Bag ${i+1}`,23);
    return svg('Countable shells and empty bags for fair sharing',b,600,280);
  }
  function skip({a,b}){
    const ns=Array.from({length:a},(_,i)=>(i+1)*b).concat('?'),cols=Math.min(5,ns.length),rows=Math.ceil(ns.length/cols),cw=560/cols;
    const body=ns.map((n,i)=>{
      const x=20+(i%cols)*cw,y=25+Math.floor(i/cols)*110;
      return rect(x+2,y+5,cw-12,86,'#d9e6eb',12)+rect(x,y,cw-12,86,i===a?'#fff0cc':'#bad7e7',12)+text(x+(cw-12)/2,y+43,n,32);
    }).join('');
    return svg('Equal jumps on a number path, read left to right then the next row',body,600,rows*110+20);
  }
  function coins({coins,cost}){
    const names={1:'Penny',5:'Nickel',10:'Dime',25:'Quarter'},radii={1:51,5:59,10:53,25:64},cols=coins.length===4?2:Math.min(coins.length,3),width=cols*180+40,top=cost===undefined?0:40,rows=Math.ceil(coins.length/cols);
    let b=cost===undefined?'':text(width/2,22,`Cost: ${cost} cents`,26);
    coins.forEach((c,i)=>{
      const x=20+(i%cols+.5)*180,y=top+74+Math.floor(i/cols)*170,r=radii[c],copper=c===1,edge=copper?'#8b5338':'#7c8d94';
      b+=`<g class="quizmo-coin" data-cents="${c}"><ellipse cx="${x}" cy="${y+r+3}" rx="${r*.85}" ry="7" fill="#17324d" opacity=".10"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#${copper?'copperCoin':'silverCoin'})" stroke="${edge}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r-5}" fill="none" stroke="#fff9ed" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${r-9}" fill="none" stroke="${edge}" stroke-width="1"/>`;
      if(c===10||c===25)for(let j=0;j<40;j++){const a=j*Math.PI/20;b+=`<path d="M${x+Math.sin(a)*(r-1)} ${y-Math.cos(a)*(r-1)}l${-Math.sin(a)*4} ${Math.cos(a)*4}" stroke="${edge}" stroke-width="1"/>`;}
      b+=`<path d="M${x-10} ${y-18}q-2-15 10-17 15 1 13 15l-5 7-5 2v5l11 5h-29l10-8Z" fill="${copper?'#b77b50':'#a0afb4'}" stroke="${edge}"/>`+text(x,y+25,`${c}¢`,30,copper?'#6d3d28':'#425967')+text(x,y+84,names[c],24)+'</g>';
    });
    return svg('Coins to count, with their values in cents',b,width,top+rows*170+10);
  }
  function ruler({start,end}){
    let b=rect(30,140,540,100,'url(#woodRuler)',3)+rect(45+start*34,60,(end-start)*34,45,'#f2a93b',2);
    for(let i=0;i<=15;i++)b+=`<path d="M${45+i*34} 140v25" stroke="#6e5736" stroke-width="2"/>`+text(45+i*34,192,i,23);
    b+=text(545,222,'cm',23)+`<path d="M${45+start*34} 105v34M${45+end*34} 105v34" stroke="#357ca5" stroke-width="2" stroke-dasharray="5 4"/>`;
    return svg('Ribbon aligned with a centimetre ruler, with every mark labeled',b,600,270);
  }
  function lengths({a,b}){
    function scene(portrait){
      const scale=(portrait?280:460)/Math.max(a,b),left=portrait?80:72,height=portrait?90:58,ys=portrait?[45,215]:[46,156];
      const ribbon=(n,y,fill)=>rect(left+4,y+5,n*scale,height,'#d9e6eb',4)+rect(left,y,n*scale,height,fill,4)+`<path d="M${left+8} ${y+10}h${n*scale-16}M${left+8} ${y+height-10}h${n*scale-16}" stroke="#fff9ed" stroke-width="2" stroke-dasharray="5 5"/>`;
      return text(39,ys[0]+height/2,'A',30)+ribbon(a,ys[0],'#f2a93b')+text(39,ys[1]+height/2,'B',30)+ribbon(b,ys[1],'#bad7e7')+`<path d="M${left} 22V${ys[1]+height+20}" stroke="#17324d" stroke-width="2"/>`;
    }
    return svg('Two ribbons starting at the same line',`<g class="quizmo-wide-art">${scene(false)}</g><g class="quizmo-portrait-art">${scene(true)}</g>`,570,260,{portrait:'0 0 400 340'});
  }
  function partOptions({d,correct,salt=0}){
    function scene(portrait){
      let b='';
      for(let i=0;i<4;i++){
        const x=portrait?40:30+(i%2)*290,y=portrait?15+i*120:20+Math.floor(i/2)*135,isEqual=i===correct,count=isEqual?d:((i+salt)%2?d:d===4?3:d+1),width=portrait?320:210;
        b+=text(x+width/2,y+13,String.fromCharCode(65+i),24);
        let offset=0;
        for(let j=0;j<count;j++){
          const w=!isEqual&&count===d?(j===0?width/(d*2):width*(1-1/(d*2))/(d-1)):width/count;
          b+=`<g class="quizmo-equal-part" data-option="${i}" data-width="${w}">`+rect(x+offset,y+37,w,65,j%2?'#bad7e7':'#f2cf80',0)+'</g>';offset+=w;
        }
      }
      return b;
    }
    return svg('Four labeled shapes, with exactly one split into the requested equal parts',`<g class="quizmo-wide-art">${scene(false)}</g><g class="quizmo-portrait-art">${scene(true)}</g>`,600,280,{portrait:'0 0 400 490'});
  }
  const shapes=['circle','square','triangle','star','diamond','pentagon','hexagon','arrow'];
  function shape(s,x=60,y=60){const r=s.size||23,n=shapes.indexOf(s.shape),fill=s.fill==='striped'?'url(#qStripes)':s.fill==='outline'?'#fff9ed':(s.color||'#357ca5');let path;
    if(n===0)path=`<circle r="${r}"/>`;
    else if(n===1)path=`<rect x="${-r}" y="${-r}" width="${2*r}" height="${2*r}" rx="3"/>`;
    else if(n===7)path=`<path d="M${-r} ${-.45*r}H0V${-r}L${r} 0 0 ${r}V${.45*r}H${-r}Z"/>`;
    else {const count=n===2?3:n===3?10:n===4?4:n===5?5:6;path=`<polygon points="${Array.from({length:count},(_,i)=>{const a=i*2*Math.PI/count-Math.PI/2,rad=n===3&&i%2?r*.45:r;return `${Math.cos(a)*rad},${Math.sin(a)*rad}`;}).join(' ')}"/>`;}
    return `<g class="quizmo-figure-shape" transform="translate(${x} ${y}) rotate(${s.angle||0})" fill="${fill}" stroke="#17324d" stroke-width="2.5" stroke-linejoin="round">${path}</g>`;
  }
  function cell(s,x=0,y=0,w=140,h=110){
    const frame=rect(x+4,y+4,w-8,h-8,'#fff9ed',8);
    if(!s)return `<g class="quizmo-matrix-cell">${frame.replace('stroke-width="1.5"','stroke-width="2" stroke-dasharray="6 5"')}${text(x+w/2,y+h/2,'?',36)}</g>`;
    // Fit each count to its cell, preserving the small/large size ratio.
    // All generated rotations are quarter turns; every glyph fits inside ±size.
    const cols=Math.min(2,s.count),rows=Math.ceil(s.count/cols);
    const scale=Math.min(.60*(h-8)/46,(w-16)/(cols*46+(cols-1)*8),(h-14)/(rows*46+(rows-1)*8+20));
    let body=`<g class="quizmo-matrix-cell">${frame}<g transform="translate(${x+w/2} ${y+h/2}) scale(${scale})">`;
    for(let i=0;i<s.count;i++){
      const row=Math.floor(i/cols),inRow=Math.min(cols,s.count-row*cols);
      body+=shape(s,(i%cols-(inRow-1)/2)*54,(row-(rows-1)/2)*54+(s.position||0));
    }
    return body+'</g></g>';
  }
  function shapeChoice(s){return svg(`${s.count} ${s.fill} ${s.shape}, rotation ${s.angle||0} degrees, size ${s.size}, position ${s.position||0}`,cell(s),140,110);}
  function matrix(cells,cols=2){const w=cols*150,h=Math.ceil(cells.length/cols)*115;const describe=s=>s?`${s.count} ${s.fill} ${s.shape}, rotation ${s.angle} degrees, size ${s.size}, vertical offset ${s.position}`:'missing cell';return svg(`Shape matrix with ${cols} columns: ${cells.map(describe).join('; ')}`,cells.map((s,i)=>cell(s,(i%cols)*150,Math.floor(i/cols)*115,150,115)).join(''),w,h);}
  function paper(points,folds=0){let b=rect(25,20,190,190,'#fff9ed',0);if(folds){b+=`<path d="M120 20V210${folds===2?'M25 115H215':''}" stroke="#c65b34" stroke-width="2" stroke-dasharray="7 5"/><path d="M192 53Q160 10 137 53l12-5m-12 5 1-13" stroke="#357ca5" stroke-width="3" fill="none"/>`;if(folds===2)b+=`<path d="M55 181Q12 151 55 129l-5 12m5-12-13 1" stroke="#357ca5" stroke-width="3" fill="none"/>`;b+=`<path d="M25 20H120V${folds===2?115:210}H25Z" fill="#bad7e755"/>`;}
    points.forEach(([x,y])=>{b+=`<circle cx="${25+x*1.9}" cy="${20+y*1.9}" r="6" fill="#17324d"/>`;});return svg(folds?`${folds} fold lines with arrows; punch at ${points.map(p=>p.join(', ')).join('; ')}`:`Opened paper with holes at ${points.map(p=>p.join(', ')).join('; ')}`,b,240,230);}
  window.QuizmoVisuals={blocks,sharing,skip,coins,ruler,lengths,partOptions,normalizeSvg,svg,text,rect,place,arithmetic,lanternLayout,fractions,times,division,words,machine,measure,shapeChoice,matrix,paper,shapes};
})();
