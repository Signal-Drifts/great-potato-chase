(() => {
  'use strict';
  const $=id=>document.getElementById(id),core=window.PotatoMaze;
  const arena=$('arena'),canvas=$('maze'),ctx=canvas.getContext('2d');
  const overlay=$('overlay'),steps=[...document.querySelectorAll('.step')],keys=new Set();
  const portrait=new Image();portrait.src='tibo.png';
  const botPortrait=new Image();botPortrait.src='grok.png';
  const STEP_TIME=.135,TRANSITION_TIME=3.1;
  const startingLevel=core.startLevel(window.location?.search||'');
  let levelDuration=core.levels[startingLevel].timeLimit;
  let variant=window.GrokRuns.nextVariant(),hasStartedRun=false;
  let levelIndex=startingLevel,found=0,lives=3,remaining=levelDuration,maze,player,previous,visited;
  let phase='intro',paused=false,awaitingMove=true,last=performance.now(),budget=0;
  let transitionElapsed=0,movedAt=-1000,lastDirection='right',sound=true;
  let hurtElapsed=0,footsteps=0,lastBump=-1000,resetClicked=false;
  const focusGame=()=>arena.focus({preventScroll:true});
  const announce=text=>$('announcements').textContent=text;
  function syncAudio(){window.GrokAudio.setActive(phase==='playing'&&!paused&&!awaitingMove&&!document.hidden);}
  function beep(frequency,length=.12,wave='triangle',volume=.055) {
    if(sound)window.GrokAudio.tone(frequency,length,wave,volume);
  }
  function updateHUD() {
    $('level').textContent=String(levelIndex+1).padStart(2,'0');
    $('lives').textContent='♥'.repeat(lives)+'♡'.repeat(3-lives);$('lives').setAttribute('aria-label',`${lives} lives`);
    $('time').textContent=Math.ceil(Math.max(0,remaining));$('timer-pill').classList.toggle('danger',remaining<=10);
    steps.forEach((el,i)=>{el.classList.toggle('done',i<startingLevel+found);el.classList.toggle('active',i===levelIndex&&i>=startingLevel+found);});
  }
  function draw(now) {
    const progress=Math.min(1,(now-movedAt)/(STEP_TIME*1000));
    window.PotatoArt.draw(ctx,canvas,{maze,player,previous,progress,visited,time:now/1000,
      moving:phase==='playing'&&!paused&&progress<1,celebrate:phase==='won',elapsed:levelDuration-remaining,hurt:phase==='hit',crying:phase==='resetting'},portrait,botPortrait);
  }
  function resize() {
    const width=Math.max(1,arena.clientWidth),ratio=Math.min(window.devicePixelRatio||1,3);
    canvas.width=Math.round(width*ratio);canvas.height=canvas.width;draw(performance.now());
  }
  function showOverlay(title,type,symbol='▶',label='Play') {
    overlay.hidden=false;overlay.dataset.phase=type;
    overlay.classList.toggle('resetting',type==='resetting');overlay.classList.toggle('pranked',type==='won');
    $('overlay-title').textContent=title;$('start').textContent=symbol;$('start').setAttribute('aria-label',label);
  }
  function prepareLevel() {
    maze=core.createLevel(levelIndex,variant);player={...maze.start};previous={...player};visited=new Set([`${player.x},${player.y}`]);
    levelDuration=maze.timeLimit;remaining=levelDuration;budget=STEP_TIME;keys.clear();awaitingMove=true;paused=false;phase='playing';movedAt=-1000;hurtElapsed=0;footsteps=0;
    overlay.hidden=true;overlay.dataset.pressState='idle';overlay.classList.remove('resetting','pranked');
    updateHUD();announce(`Level ${levelIndex+1}. Five routes, four cactus traps, one safe route. ${levelDuration} seconds. Grok is visible. Move to start.`);resize();focusGame();last=performance.now();syncAudio();
  }
  function reset() {
    if(hasStartedRun)variant=window.GrokRuns.nextVariant();
    hasStartedRun=true;window.GrokAudio.unlock();levelIndex=startingLevel;found=0;lives=3;$('host').classList.remove('pressing');prepareLevel();beep(520);
  }
  function primaryAction() {
    if(paused)togglePause();
    else if(phase==='timeout')prepareLevel();
    else if(['intro','won','lost'].includes(phase))reset();
  }
  function completeLevel() {
    found++;keys.clear();updateHUD();transitionElapsed=0;phase='resetting';syncAudio();resetClicked=false;overlay.dataset.pressState='pressing';
    $('host').classList.add('pressing');showOverlay('RESET!','resetting');
    announce('Tibo is three blocks from Grok. Poteto presses Reset. Tibo starts crying.');
    beep(180,.22,'sawtooth',.045);
  }
  function finishGame() {
    phase='won';syncAudio();showOverlay('Poteto wins','won','↻','Play again');
    announce(`${found} resets. Tibo never captured Grok Bot. Poteto wins.`);
  }
  function timeout() {
    remaining=0;lives--;keys.clear();updateHUD();phase=lives?'timeout':'lost';syncAudio();
    showOverlay(lives?'⏱':'♡ ♡ ♡',phase,'↻',lives?'Retry level':'Restart game');
    announce(lives?`Time is up. ${lives} tries left. Retry this maze.`:'No tries left. Restart to play again.');beep(160,.3);
  }
  function bump(now,gate=false) {
    if(now-lastBump>180){beep(gate?175:65,.055,'sine',.03);lastBump=now;}
  }
  function hitTrap(hazard,now) {
    lives--;keys.clear();updateHUD();previous={...player};player={x:hazard.x,y:hazard.y};movedAt=now;
    beep(85,.24,'sawtooth',.055);
    if(lives===0){phase='lost';showOverlay('♡ ♡ ♡','lost','↻','Restart game');announce('A cactus caught Tibo. No lives left.');}
    else{phase='hit';hurtElapsed=0;announce(`A cactus caught Tibo. ${lives} lives left.`);}
    syncAudio();
  }
  function move(direction,now) {
    if(!core.canMove(maze.grid,player.x,player.y,direction)){bump(now);return false;}
    const[dx,dy]=core.directions[direction],nx=player.x+dx,ny=player.y+dy;
    const hazard=maze.hazards.find(p=>p.x===nx&&p.y===ny);
    if(hazard){hitTrap(hazard,now);return false;}
    const gate=maze.gates.find(p=>p.x===nx&&p.y===ny);
    if(gate&&!core.isGateOpen(gate,levelDuration-remaining)){bump(now,true);return false;}
    previous={...player};player.x=nx;player.y=ny;movedAt=now;awaitingMove=false;syncAudio();
    visited.add(`${player.x},${player.y}`);beep(100+(footsteps++%2)*35,.035,'triangle',.025);
    const distance=core.resetDistance(maze,player);
    if(distance>=0&&distance<=3)completeLevel();return true;
  }
  function tick(now) {
    const elapsed=Math.max(0,(now-last)/1000);last=now;
    if(phase==='hit') {
      hurtElapsed+=elapsed;
      if(hurtElapsed>=.65){player={...maze.start};previous={...player};movedAt=-1000;phase='playing';keys.clear();budget=STEP_TIME;}
    }else if(phase==='resetting') {
      transitionElapsed+=elapsed;
      if(!resetClicked&&transitionElapsed>=.55){resetClicked=true;beep(80,.05,'square',.05);}
      if(transitionElapsed>=.85)overlay.dataset.pressState='down';
      if(transitionElapsed>=TRANSITION_TIME){$('host').classList.remove('pressing');if(levelIndex===core.levels.length-1)finishGame();else{levelIndex++;prepareLevel();}}
    }else if(phase==='playing'&&!paused) {
      if(!awaitingMove){remaining-=elapsed;if(remaining<=0)timeout();else updateHUD();}
      if(phase==='playing') {
        budget=Math.min(STEP_TIME,budget+Math.min(elapsed,.1));
        if(keys.size&&budget>=STEP_TIME){move(keys.has(lastDirection)?lastDirection:[...keys].at(-1),now);budget=0;}
      }
    }
    syncAudio();draw(now);requestAnimationFrame(tick);
  }
  function togglePause() {
    if(phase!=='playing')return;
    paused=!paused;keys.clear();syncAudio();
    if(paused) {
      showOverlay('Ⅱ','paused','▶','Resume');
      announce('Paused. Press P or Enter to resume.');
    }else {
      overlay.hidden=true;
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
    else if(key==='m'&&!e.repeat){e.preventDefault();sound=!window.GrokAudio.toggleMute();announce(sound?'Sound on.':'Muted.');}
    else if(key==='r'&&!e.repeat){e.preventDefault();reset();}
    else if(e.code==='Space')e.preventDefault();
  },{capture:true});
  window.addEventListener('keyup',e=>keys.delete(directionOf(e)),{capture:true});
  $('start').addEventListener('click',primaryAction);
  let drag=null,touchDirection=null;
  arena.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;focusGame();
    if(e.pointerType==='mouse')return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY};arena.setPointerCapture(e.pointerId);
  });
  arena.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)<12)return;
    const direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
    if(touchDirection!==direction){if(touchDirection)keys.delete(touchDirection);touchDirection=direction;pressDirection(direction);}
  });
  function endDrag(){if(touchDirection)keys.delete(touchDirection);touchDirection=null;drag=null;}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])arena.addEventListener(event,endDrag);
  window.addEventListener('blur',()=>{keys.clear();if(phase==='playing'&&!paused)togglePause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing'&&!paused)togglePause();});
  window.addEventListener('resize',resize);portrait.addEventListener('load',()=>draw(performance.now()));botPortrait.addEventListener('load',()=>draw(performance.now()));
  maze=core.createLevel(startingLevel,variant);player={...maze.start};previous={...player};visited=new Set();updateHUD();showOverlay(`${String(startingLevel+1).padStart(2,'0')} / 05`,'intro','▶',`Play level ${startingLevel+1}`);resize();requestAnimationFrame(tick);
})();
