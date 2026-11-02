(function(root) {
  'use strict';
  let context,master,started=false,muted=false,interval=null,nextNote=0,step=0;
  const melody=[62,65,69,72,69,65,67,69,60,64,67,71,67,64,65,67,58,62,65,69,65,62,64,65,57,61,64,67,64,61,60,61];
  const bass=[38,38,36,36,34,34,33,33];
  const duration=60/112/2;
  const frequency=note=>440*Math.pow(2,(note-69)/12);
  function audio() {
    if(!context){
      const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return null;
      context=new Audio();master=context.createGain();master.gain.value=muted?0:.8;master.connect(context.destination);
    }
    if(context.state==='suspended'){const resume=context.resume();if(resume&&resume.catch)resume.catch(()=>{});}
    return context;
  }
  function voice(hz,length,wave,volume,when) {
    const oscillator=context.createOscillator(),envelope=context.createGain();
    oscillator.type=wave;oscillator.frequency.value=hz;oscillator.connect(envelope);envelope.connect(master);
    envelope.gain.setValueAtTime(.0001,when);envelope.gain.linearRampToValueAtTime(volume,when+.008);
    envelope.gain.exponentialRampToValueAtTime(.0001,when+length);oscillator.start(when);oscillator.stop(when+length+.02);
  }
  function schedule() {
    if(!context||!started)return;
    if(nextNote<context.currentTime-.5)nextNote=context.currentTime+.04;
    while(nextNote<context.currentTime+.25){
      voice(frequency(melody[step%melody.length]),duration*.78,'triangle',.027,nextNote);
      if(step%2===0)voice(frequency(bass[Math.floor(step/4)%bass.length]),duration*1.5,'sine',.04,nextNote);
      if(step%4===2)voice(frequency(melody[step%melody.length]+12),.08,'sine',.009,nextNote);
      step++;nextNote+=duration;
    }
  }
  function start() {
    try {
      if(!audio())return;
      if(started)return;started=true;nextNote=context.currentTime+.035;schedule();
      interval=root.setInterval(schedule,100);
    }catch(_){/* Browsers without audio still support the game. */}
  }
  function tone(hz,length=.12,wave='triangle',volume=.055) {
    try {if(!audio())return;voice(hz,length,wave,volume,context.currentTime);}catch(_){}
  }
  function toggleMute() {
    muted=!muted;
    if(master)master.gain.setValueAtTime(muted?0:.8,context.currentTime);
    return muted;
  }
  root.addEventListener('pagehide',()=>{if(interval!==null)root.clearInterval(interval);interval=null;});
  root.GrokAudio={start,tone,toggleMute};
})(window);
