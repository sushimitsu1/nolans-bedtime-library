/* Game voice: plays pre-rendered Sulafat clips (assets/game-voice) sentence by sentence through Web Audio,
   so later lines (after a tap unlocked audio) still play on iOS Safari. Falls back to the browser voice
   only for a sentence that has no clip or fails to load. */
(() => {
  'use strict';
  const ROOT='assets/game-voice/';
  const split=text=>String(text).trim().replace(/\s+/g,' ').replace(/([.!?])\s+(?=\S)/g,'$1\u0000').split('\u0000').map(s=>s.trim()).filter(Boolean);
  let clips=null, ctx=null, gain=null, run=0, source=null, timer=0;
  const buffers=new Map(), log=[], misses=[];
  const ready=fetch(ROOT+'manifest.json').then(r=>r.ok?r.json():null).then(m=>{clips=m&&m.clips||{};}).catch(()=>{clips={};});
  function context(){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
    if(!ctx){
      try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{/* Older Safari: ringer switch rules apply. */}
      ctx=new AC();gain=ctx.createGain();gain.gain.value=1;gain.connect(ctx.destination);
    }
    if(ctx.state!=='running')ctx.resume().catch(()=>{});
    return ctx;
  }
  // iOS only starts audio inside a user gesture: resume (and prime) the context on the first touches.
  const unlock=()=>{const c=context();if(!c)return;try{const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0);}catch{}if(c.state==='running'){['touchend','pointerup','keydown'].forEach(t=>document.removeEventListener(t,unlock,true));}};
  ['touchend','pointerup','keydown'].forEach(t=>document.addEventListener(t,unlock,true));
  function load(file){
    if(!buffers.has(file)){
      const c=context();
      const p=fetch(ROOT+file).then(r=>{if(!r.ok)throw new Error(r.status);return r.arrayBuffer();})
        .then(data=>new Promise((resolve,reject)=>{const out=c.decodeAudioData(data,resolve,reject);if(out&&out.then)out.then(resolve,reject);}))
        .catch(error=>{buffers.delete(file);throw error;});
      buffers.set(file,p);
      if(buffers.size>120)buffers.delete(buffers.keys().next().value);
    }
    return buffers.get(file);
  }
  function cancel(){
    run++;clearTimeout(timer);
    if(source){try{source.onended=null;source.stop();}catch{}source=null;}
    if(window.speechSynthesis)try{speechSynthesis.cancel();}catch{}
  }
  function synth(text,rate,done){
    if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){done();return;}
    const u=new SpeechSynthesisUtterance(text);u.rate=rate||.78;u.volume=.65;u.onend=u.onerror=done;speechSynthesis.speak(u);
  }
  function speak(message){
    api.calls++;cancel();const id=run;
    const parts=(Array.isArray(message)?message:[message]).flat().filter(Boolean).map(p=>typeof p==='string'?{text:p}:p);
    const queue=[];
    const go=()=>{
      if(id!==run)return;
      for(const p of parts){const list=split(p.text);list.forEach((text,i)=>queue.push({text,rate:p.rate,pause:i===list.length-1?p.pause||0:0,file:clips[text]}));}
      const c=clips&&Object.keys(clips).length?context():null;
      if(c)queue.forEach(q=>{if(q.file)q.loading=load(q.file);q.loading?.catch(()=>{});});
      next(0);
    };
    function next(i){
      if(id!==run||i>=queue.length)return;
      const q=queue[i],after=()=>{if(id!==run)return;if(q.pause)timer=setTimeout(()=>next(i+1),q.pause);else next(i+1);};
      const fallback=reason=>{if(id!==run)return;misses.push({text:q.text,reason});log.push({text:q.text,via:'speech'});synth(q.text,q.rate,after);};
      if(!q.loading){fallback('no clip');return;}
      q.loading.then(buffer=>{
        if(id!==run)return;const c=context();
        const s=c.createBufferSource();s.buffer=buffer;s.connect(gain);source=s;
        s.onended=()=>{if(source===s)source=null;after();};
        log.push({text:q.text,via:'clip',file:q.file});s.start(0);
      },()=>fallback('load failed'));
    }
    if(clips)go();else ready.then(go);
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  const api={speak,cancel,split,ready,log,misses,calls:0,has:text=>split(text).every(s=>clips&&clips[s])};
  window.NolanVoice=api;
})();
