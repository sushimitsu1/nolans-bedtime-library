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
    return `<svg class="quizmo-illustration" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" data-wide-view-box="0 0 ${w} ${h}" ${meta.portrait?`data-portrait-view-box="${meta.portrait}" data-lantern-total="${meta.total}"`:""} ${meta.rows?`data-rows="${meta.rows}" data-cols="${meta.cols}"`:""} role="img" aria-label="${esc(label)}"><defs><linearGradient id="${prefix}lanternGlow" x2="0" y2="1"><stop stop-color="#fff5b8"/><stop offset=".5" stop-color="#f2a93b"/><stop offset="1" stop-color="#d58a16"/></linearGradient><radialGradient id="${prefix}halo"><stop stop-color="#f2a93b" stop-opacity=".13"/><stop offset="1" stop-color="#f2a93b" stop-opacity="0"/></radialGradient><pattern id="${prefix}qStripes" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="7" height="7" fill="#fff9ed"/><path d="M0 0V7" stroke="#357ca5" stroke-width="3"/></pattern><linearGradient id="${prefix}billPaper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#edf3db"/><stop offset=".55" stop-color="#d7e5c8"/><stop offset="1" stop-color="#b7cfae"/></linearGradient><radialGradient id="${prefix}silverCoin" cx=".28" cy=".22" r=".85"><stop stop-color="#fff"/><stop offset=".35" stop-color="#e6ecee"/><stop offset=".72" stop-color="#b5c1c5"/><stop offset="1" stop-color="#7f9098"/></radialGradient><radialGradient id="${prefix}copperCoin" cx=".28" cy=".22" r=".85"><stop stop-color="#ffe8bc"/><stop offset=".4" stop-color="#e5ad76"/><stop offset=".75" stop-color="#bd7848"/><stop offset="1" stop-color="#894c30"/></radialGradient><linearGradient id="${prefix}woodRuler" x2="0" y2="1"><stop stop-color="#fff0ca"/><stop offset=".18" stop-color="#efd09a"/><stop offset=".82" stop-color="#e6b976"/><stop offset="1" stop-color="#c9904b"/></linearGradient></defs><g font-family="system-ui,sans-serif">${artwork}</g></svg>`;
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
  function place(d){
    const digits=String(d.n).split(''), names=['TTh','Th','H','T','O'].slice(-digits.length);
    let b=text(300,23,d.title||'Build by place value',20);const cw=540/digits.length;
    digits.forEach((v,i)=>{const x=30+i*cw;b+=rect(x,48,cw-5,300,'#fff9ed')+text(x+cw/2,71,names[i],14)+text(x+cw/2,121,v,36);const unit=digits.length-i-1;
      for(let k=0;k<Number(v);k++){const bx=x+12+(k%3)*(cw-24)/3,by=165+Math.floor(k/3)*48;
        if(unit>=3)b+=`<path d="M${bx} ${by+7}l12-7 12 7v16l-12 7-12-7Z M${bx} ${by+7}l12 7 12-7 M${bx+12} ${by+14}v16" fill="#357ca5" stroke="#17324d"/>`;
        else if(unit===2)b+=rect(bx,by,22,22,'#bad7e7',1)+`<path d="M${bx+7} ${by}v22m7-22v22M${bx} ${by+7}h22m-22 7h22" stroke="#357ca5" stroke-width=".7"/>`;
        else if(unit===1)b+=rect(bx+6,by,6,27,'#f2a93b',1)+`<path d="M${bx+6} ${by+9}h6m-6 9h6" stroke="#d58a16"/>`;
        else b+=rect(bx+5,by+5,12,12,'#f2a93b',2);
      }
    });return svg('Place-value chart with grouped base-ten blocks',b,600,380);
  }
  function arithmetic(d){
    const values=d.values,columns=Math.max(...values.map(n=>String(n).length))+(d.operation==='addition'?1:0),names=['TTh','Th','H','T','O'].slice(-columns),cw=520/columns,rowHeight=values.length===3?78:108,header=42;
    let body=rect(48,6,526,header-8,'#e5eff4',6);
    names.forEach((name,i)=>{body+=text(48+cw*(i+.5),23,name,25);});
    values.forEach((value,row)=>{
      body+=`<g class="quizmo-operand-row" data-value="${value}">`;
      const y=header+row*rowHeight,digits=String(value).padStart(columns,'0');
      if(row)body+=text(25,y+rowHeight/2,d.operation==='subtraction'?'−':'+',31);
      for(let col=0;col<columns;col++){
        const digit=Number(digits[col]),x=48+col*cw,place=columns-col-1;
        body+=`<g class="quizmo-operand-cell" data-digit="${digit}" data-place="${place}">`+rect(x,y,cw-5,rowHeight-6,row%2?'#edf5f9':'#fff9ed',5)+text(x+cw/2,y+19,digit,30);
        const stepX=Math.min(23,(cw-20)/3),stepY=values.length===3?12:19,scale=values.length===3?.72:.95;
        for(let k=0;k<digit;k++){
          const bx=x+cw/2+(k%3-1)*stepX,by=y+37+Math.floor(k/3)*stepY;
          let block;
          if(place>=3)block=`<path d="M-7-3L0-7 7-3V5L0 9-7 5Z M-7-3L0 1 7-3 M0 1V9" fill="#357ca5" stroke="#17324d" stroke-width="1"/>`;
          else if(place===2)block=rect(-7,-6,14,14,'#bad7e7',0)+'<path d="M-2-6V8M3-6V8M-7-1H7M-7 4H7" stroke="#357ca5" stroke-width=".6"/>';
          else if(place===1)block=rect(-3,-6,6,16,'#f2a93b',1)+'<path d="M-3-2H3M-3 3H3M-3 7H3" stroke="#d58a16" stroke-width=".6"/>';
          else block=rect(-5,-4,10,10,'#f2a93b',1);
          body+=`<g class="quizmo-base-block" transform="translate(${bx} ${by}) scale(${scale})">${block}</g>`;
        }
        body+='</g>';
      }
      body+='</g>';
    });
    const totalY=header+values.length*rowHeight;
    body+=`<g class="quizmo-total-row"><path d="M48 ${totalY-2}H571" stroke="#17324d" stroke-width="3"/>`+text(25,totalY+31,'=',29);
    for(let col=0;col<columns;col++)body+=rect(48+col*cw,totalY+9,cw-5,52,'#fff1d6',5)+text(48+cw*(col+.5),totalY+35,'?',31);
    return svg(`Place-value calculation: ${values.join(d.operation==='subtraction'?' minus ':' plus ')}; result cells are unknown`,body+'</g>',600,totalY+72);
  }
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
      const size=Math.min(54,500/d.w,290/d.h),left=(600-d.w*size)/2,top=(340-d.h*size)/2;
      let body='';
      for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++)if(!(x>=d.w-d.cutW&&y<d.cutH))body+=rect(left+x*size,top+y*size,size,size,'#f2cf80',0).replace('<rect ','<rect class="quizmo-area-square" ');
      return svg('Each grid square is one square unit. Count the area.',body,600,340);
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
  window.QuizmoVisuals={normalizeSvg,svg,text,rect,place,arithmetic,lanternLayout,fractions,times,division,words,machine,measure,shapeChoice,matrix,paper,shapes};
})();
