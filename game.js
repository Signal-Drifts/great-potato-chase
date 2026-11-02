(() => {
  'use strict';
  const $=id=>document.getElementById(id),core=window.PotatoMaze;
  const arena=$('arena'),canvas=$('maze'),ctx=canvas.getContext('2d');
  const overlay=$('overlay'),steps=[...document.querySelectorAll('.step')],keys=new Set();
  const portrait=new Image();portrait.src='poteto.png';
  const STEP_TIME=.135,TRANSITION_TIME=1.15;
  let levelIndex=0,found=0,lives=3,remaining=45,maze,player,previous,visited;
  let phase='intro',paused=false,awaitingMove=true,last=performance.now(),budget=0;
  let transitionElapsed=0,movedAt=-1000,lastDirection='right',sound=true,audio;
  let hurtElapsed=0,footsteps=0,lastBump=-1000;
  const focusGame=()=>arena.focus({preventScroll:true});
  const announce=text=>$('announcements').textContent=text;
  function beep(frequency,length=.12,wave='triangle',volume=.055) {
    if(!sound)return;
    try {
      audio??=new(window.AudioContext||window.webkitAudioContext)();
      if(audio.state==='suspended')audio.resume();
      const osc=audio.createOscillator(),gain=audio.createGain();
      osc.type=wave;osc.frequency.value=frequency;osc.connect(gain);gain.connect(audio.destination);
      gain.gain.setValueAtTime(volume,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+length);
      osc.start();osc.stop(audio.currentTime+length);
    }catch(_){/* Sound is optional. */}
  }
  function updateHUD() {
    $('level').textContent=String(levelIndex+1).padStart(2,'0');$('found').textContent=found;
    $('lives').textContent='♥'.repeat(lives)+'♡'.repeat(3-lives);$('lives').setAttribute('aria-label',`${lives} lives`);
    $('time').textContent=Math.ceil(Math.max(0,remaining));$('timer-pill').classList.toggle('danger',remaining<=10);
    steps.forEach((el,i)=>{el.classList.toggle('done',i<found);el.classList.toggle('active',i===levelIndex&&i>=found);});
  }
  function draw(now) {
    const progress=Math.min(1,(now-movedAt)/(STEP_TIME*1000));
    window.PotatoArt.draw(ctx,canvas,{maze,player,previous,progress,visited,time:now/1000,
      moving:phase==='playing'&&!paused&&progress<1,celebrate:phase==='won',elapsed:45-remaining,hurt:phase==='hit'},portrait);
  }
  function resize() {
    const width=Math.max(1,arena.clientWidth),ratio=Math.min(window.devicePixelRatio||1,3);
    canvas.width=Math.round(width*ratio);canvas.height=canvas.width;draw(performance.now());
  }
  function showOverlay(title,type,symbol='▶',label='Play') {
    overlay.hidden=false;overlay.dataset.phase=type;
    overlay.classList.toggle('transition',type==='transition');overlay.classList.toggle('surrendered',type==='won');
    $('overlay-title').textContent=title;$('start').textContent=symbol;$('start').setAttribute('aria-label',label);
    $('pause').disabled=type!=='paused';
  }
  function prepareLevel() {
    maze=core.createLevel(levelIndex);player={...maze.start};previous={...player};visited=new Set([`${player.x},${player.y}`]);
    remaining=45;budget=STEP_TIME;keys.clear();awaitingMove=true;paused=false;phase='playing';movedAt=-1000;hurtElapsed=0;footsteps=0;
    overlay.hidden=true;overlay.classList.remove('transition','surrendered');$('pause').disabled=false;
    $('pause').setAttribute('aria-label','Pause');$('pause-icon').innerHTML='<path d="M8 5v14M16 5v14"/>';
    updateHUD();announce(`Level ${levelIndex+1}. Five routes, four cactus traps, one safe route. 45 seconds. The fry is visible. Move to start.`);resize();focusGame();last=performance.now();
  }
  function reset() {
    levelIndex=0;found=0;lives=3;$('host').classList.remove('surrendered');prepareLevel();beep(520);
  }
  function primaryAction() {
    if(paused)togglePause();
    else if(phase==='timeout')prepareLevel();
    else if(['intro','won','lost'].includes(phase))reset();
  }
  function completeLevel() {
    found++;keys.clear();updateHUD();beep(850,.25);
    if(found===5) {
      phase='won';$('host').classList.add('surrendered');
      showOverlay('Tibo surrenders','won','↻','Play again');announce('All five levels complete. Tibo surrenders. Poteto wins!');
    }else {
      phase='transition';transitionElapsed=0;
      showOverlay(`${String(levelIndex+2).padStart(2,'0')} / 05`,'transition');
      announce(`Fry found. Tibo is hiding the next fry in level ${levelIndex+2}.`);
    }
  }
  function timeout() {
    remaining=0;lives--;keys.clear();updateHUD();phase=lives?'timeout':'lost';
    showOverlay(lives?'⏱':'♡ ♡ ♡',phase,'↻',lives?'Retry level':'Restart game');
    announce(lives?`Time is up. ${lives} tries left. Retry this maze.`:'No tries left. Restart to play again.');beep(160,.3);
  }
  function bump(now,gate=false) {
    if(now-lastBump>180){beep(gate?175:65,.055,'sine',.03);lastBump=now;}
  }
  function hitTrap(hazard,now) {
    lives--;keys.clear();updateHUD();previous={...player};player={x:hazard.x,y:hazard.y};movedAt=now;
    beep(85,.24,'sawtooth',.055);
    if(lives===0){phase='lost';showOverlay('♡ ♡ ♡','lost','↻','Restart game');announce('A cactus caught Poteto. No lives left.');}
    else{phase='hit';hurtElapsed=0;announce(`A cactus caught Poteto. ${lives} lives left.`);}
  }
  function move(direction,now) {
    if(!core.canMove(maze.grid,player.x,player.y,direction)){bump(now);return false;}
    const[dx,dy]=core.directions[direction],nx=player.x+dx,ny=player.y+dy;
    const hazard=maze.hazards.find(p=>p.x===nx&&p.y===ny);
    if(hazard){hitTrap(hazard,now);return false;}
    const gate=maze.gates.find(p=>p.x===nx&&p.y===ny);
    if(gate&&!core.isGateOpen(gate,45-remaining)){bump(now,true);return false;}
    previous={...player};player.x=nx;player.y=ny;movedAt=now;awaitingMove=false;
    visited.add(`${player.x},${player.y}`);beep(100+(footsteps++%2)*35,.035,'triangle',.025);
    if(player.x===maze.target.x&&player.y===maze.target.y)completeLevel();return true;
  }
  function tick(now) {
    const elapsed=Math.max(0,(now-last)/1000);last=now;
    if(phase==='hit') {
      hurtElapsed+=elapsed;
      if(hurtElapsed>=.65){player={...maze.start};previous={...player};movedAt=-1000;phase='playing';keys.clear();budget=STEP_TIME;}
    }else if(phase==='transition') {
      transitionElapsed+=elapsed;
      if(transitionElapsed>=TRANSITION_TIME){levelIndex++;prepareLevel();}
    }else if(phase==='playing'&&!paused) {
      if(!awaitingMove){remaining-=elapsed;if(remaining<=0)timeout();else updateHUD();}
      if(phase==='playing') {
        budget=Math.min(STEP_TIME,budget+Math.min(elapsed,.1));
        if(keys.size&&budget>=STEP_TIME){move(keys.has(lastDirection)?lastDirection:[...keys].at(-1),now);budget=0;}
      }
    }
    draw(now);requestAnimationFrame(tick);
  }
  function togglePause() {
    if(phase!=='playing')return;
    paused=!paused;keys.clear();
    if(paused) {
      showOverlay('Ⅱ','paused','▶','Resume');$('pause').setAttribute('aria-label','Resume');
      $('pause-icon').innerHTML='<path d="m8 5 11 7-11 7Z"/>';announce('Paused. Press P or Enter to resume.');
    }else {
      overlay.hidden=true;$('pause').setAttribute('aria-label','Pause');$('pause-icon').innerHTML='<path d="M8 5v14M16 5v14"/>';
      focusGame();last=performance.now();announce('Resumed.');
    }
  }
  function pressDirection(direction,isRepeat=false) {
    if(awaitingMove&&isRepeat)return;
    if(paused)togglePause();if(phase==='intro')reset();if(phase!=='playing')return;
    if(!keys.has(direction))budget=STEP_TIME;keys.add(direction);lastDirection=direction;
  }
  const mapping={arrowup:'up',arrowdown:'down',arrowleft:'left',arrowright:'right',w:'up',a:'left',s:'down',d:'right'};
  const directionOf=e=>mapping[e.key.toLowerCase()]||({KeyW:'up',KeyA:'left',KeyS:'down',KeyD:'right'})[e.code];
  window.addEventListener('keydown',e=>{
    const direction=directionOf(e),key=e.key.toLowerCase();
    if(direction){e.preventDefault();e.stopPropagation();pressDirection(direction,e.repeat);}
    else if(key==='enter'){e.preventDefault();if(!e.repeat)primaryAction();}
    else if((key==='p'||key==='escape')&&!e.repeat){e.preventDefault();togglePause();}
    else if(e.code==='Space')e.preventDefault();
  },{capture:true});
  window.addEventListener('keyup',e=>keys.delete(directionOf(e)),{capture:true});
  $('start').addEventListener('click',primaryAction);$('pause').addEventListener('click',togglePause);$('restart').addEventListener('click',reset);
  $('sound').addEventListener('click',()=>{
    sound=!sound;$('sound').classList.toggle('muted',!sound);$('sound').setAttribute('aria-pressed',String(sound));
    $('sound').setAttribute('aria-label',sound?'Mute sound':'Unmute sound');beep(650);if(phase==='playing'&&!paused)focusGame();
  });
  document.querySelectorAll('[data-dir]').forEach(button=>{
    const direction=button.dataset.dir;
    button.addEventListener('pointerdown',e=>{e.preventDefault();pressDirection(direction);focusGame();button.setPointerCapture(e.pointerId);});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(direction));
  });
  arena.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))focusGame();});
  window.addEventListener('blur',()=>{keys.clear();if(phase==='playing'&&!paused)togglePause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing'&&!paused)togglePause();});
  window.addEventListener('resize',resize);portrait.addEventListener('load',()=>draw(performance.now()));
  maze=core.createLevel(0);player={...maze.start};previous={...player};visited=new Set();updateHUD();resize();requestAnimationFrame(tick);
})();
