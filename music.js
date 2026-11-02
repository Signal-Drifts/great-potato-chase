(function(root) {
  'use strict';
  let context,master,musicBus,active=false,muted=false,interval=null,nextNote=0,step=0,cryBuffer=null,cryLoading=null,crySource=null;
  const melody=[62,65,69,72,69,65,67,69,60,64,67,71,67,64,65,67,58,62,65,69,65,62,64,65,57,61,64,67,64,61,60,61];
  const bass=[38,38,36,36,34,34,33,33],duration=60/112/2;
  const frequency=note=>440*Math.pow(2,(note-69)/12);
  function audio() {
    if(!context){
      const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return null;
      context=new Audio();master=context.createGain();master.gain.value=muted?0:.8;master.connect(context.destination);
      musicBus=context.createGain();musicBus.gain.value=0;musicBus.connect(master);
    }
    if(context.state==='suspended'){const resume=context.resume();if(resume&&resume.catch)resume.catch(()=>{});}
    return context;
  }
  function voice(hz,length,wave,volume,when,bus=master) {
    const oscillator=context.createOscillator(),envelope=context.createGain();
    oscillator.type=wave;oscillator.frequency.value=hz;oscillator.connect(envelope);envelope.connect(bus);
    envelope.gain.setValueAtTime(.0001,when);envelope.gain.linearRampToValueAtTime(volume,when+.008);
    envelope.gain.exponentialRampToValueAtTime(.0001,when+length);oscillator.start(when);oscillator.stop(when+length+.02);
  }
  function schedule() {
    if(!context||!active)return;
    if(nextNote<context.currentTime-.5)nextNote=context.currentTime+.04;
    while(nextNote<context.currentTime+.25){
      voice(frequency(melody[step%melody.length]),duration*.78,'triangle',.027,nextNote,musicBus);
      if(step%2===0)voice(frequency(bass[Math.floor(step/4)%bass.length]),duration*1.5,'sine',.04,nextNote,musicBus);
      if(step%4===2)voice(frequency(melody[step%melody.length]+12),.08,'sine',.009,nextNote,musicBus);
      step++;nextNote+=duration;
    }
  }
  function prepareCry(){
    if(cryLoading)return cryLoading;
    if(!context||typeof root.fetch!=='function'||typeof context.decodeAudioData!=='function')return Promise.resolve(null);
    cryLoading=root.fetch('crying.wav').then(response=>{
      if(!response.ok)throw new Error('Crying audio unavailable');return response.arrayBuffer();
    }).then(bytes=>context.decodeAudioData(bytes)).then(buffer=>{cryBuffer=buffer;return buffer;}).catch(()=>null);
    return cryLoading;
  }
  function unlock(){try{audio();return prepareCry();}catch(_){return Promise.resolve(null);}}
  function stopCry(){
    if(!crySource)return;const source=crySource;crySource=null;try{source.stop();}catch(_){}
  }
  function cry(){
    try{
      if(muted||!audio()||!cryBuffer)return false;
      stopCry();const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=cryBuffer;source.connect(gain);gain.connect(master);
      const duration=Math.min(4.3,cryBuffer.duration),now=context.currentTime;
      gain.gain.setValueAtTime(.65,now);gain.gain.setValueAtTime(.65,now+Math.max(0,duration-.1));
      gain.gain.linearRampToValueAtTime(.0001,now+duration);
      crySource=source;source.onended=()=>{if(crySource===source)crySource=null;};
      source.start(now);source.stop(now+duration);return true;
    }catch(_){return false;}
  }
  function setActive(value) {
    value=Boolean(value);
    if(value===active)return;
    try {
      if(value&&!audio())return;
      active=value;
      if(musicBus)musicBus.gain.setValueAtTime(active?1:0,context.currentTime);
      if(interval!==null){root.clearInterval(interval);interval=null;}
      if(active){nextNote=context.currentTime+.035;schedule();interval=root.setInterval(schedule,100);}
    }catch(_){active=false;}
  }
  function tone(hz,length=.12,wave='triangle',volume=.055) {
    try{if(!audio())return;voice(hz,length,wave,volume,context.currentTime);}catch(_){}
  }
  function toggleMute() {
    muted=!muted;if(master)master.gain.setValueAtTime(muted?0:.8,context.currentTime);return muted;
  }
  root.addEventListener('pagehide',()=>{stopCry();setActive(false);if(master)master.gain.setValueAtTime(0,context.currentTime);});
  root.GrokAudio={unlock,setActive,tone,toggleMute,cry,stopCry};
})(window);
