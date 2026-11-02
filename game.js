(() => {
'use strict';
const $=id=>document.getElementById(id),core=window.PotatoMaze;
const arena=$('arena'),canvas=$('maze'),ctx=canvas.getContext('2d'),overlay=$('overlay'),status=$('keyboard-status'),keys=new Set();
const steps=[...document.querySelectorAll('.step')],portrait=new Image();portrait.src='poteto.png';
const STEP_TIME=.12;
let levelIndex=0,found=0,lives=3,remaining=45,maze,player,visited;
let phase='intro',paused=false,awaitingMove=true,last=0,frame=0,budget=0,sound=true,audio,lastDirection='right';
const focusGame=()=>arena.focus({preventScroll:true});
function beep(frequency,length=.1){if(!sound)return;try{audio??=new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.value=frequency;osc.connect(gain);gain.connect(audio.destination);gain.gain.setValueAtTime(.06,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+length);osc.start();osc.stop(audio.currentTime+length);}catch(_){/* Sound is optional. */}}
function updateHUD(){
 $('level').textContent=levelIndex+1;$('found').textContent=found;$('lives').textContent=lives;$('time').textContent=Math.ceil(Math.max(0,remaining));$('timer-pill').classList.toggle('danger',remaining<=10);
 steps.forEach((el,i)=>{el.classList.toggle('done',i<found);el.classList.toggle('active',i===levelIndex&&found<5);});
}
function scent(){const d=Math.abs(player.x-maze.target.x)+Math.abs(player.y-maze.target.y);$('scent').textContent=d<=2?'Scent — sizzling! The fry is nearby.':d<=5?'Scent — warm. Keep looking!':'Scent — cold. Explore farther.';}
function draw(){
 if(!maze)return;const size=canvas.width,tile=size/maze.size;ctx.clearRect(0,0,size,size);
 for(let y=0;y<maze.size;y++)for(let x=0;x<maze.size;x++){
  const wall=maze.grid[y][x]===1;ctx.fillStyle=wall?'#514476':'#183c32';ctx.fillRect(x*tile,y*tile,Math.ceil(tile),Math.ceil(tile));
  if(wall){ctx.fillStyle='#776494';ctx.fillRect(x*tile,y*tile,Math.ceil(tile),Math.max(1,tile*.09));ctx.fillStyle='#362c52';ctx.fillRect(x*tile,(y+.88)*tile,Math.ceil(tile),tile*.12+1);}
  else if(visited.has(`${x},${y}`)){ctx.fillStyle='#ffe47a80';ctx.beginPath();ctx.arc((x+.5)*tile,(y+.5)*tile,tile*.085,0,Math.PI*2);ctx.fill();}
 }
 const d=Math.abs(player.x-maze.target.x)+Math.abs(player.y-maze.target.y);
 if(d<=2||phase==='cleared'||phase==='won'){const{x,y}=maze.target;ctx.fillStyle='#ffdb5c44';ctx.fillRect(x*tile,y*tile,tile,tile);ctx.font=`${tile*.82}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🍟',(x+.5)*tile,(y+.5)*tile);}
 const cx=(player.x+.5)*tile,cy=(player.y+.5)*tile;ctx.fillStyle='#ffdf6a';ctx.beginPath();ctx.arc(cx,cy,tile*.31,0,Math.PI*2);ctx.fill();
 if(portrait.complete&&portrait.naturalWidth>0){const h=tile*1.65,w=h*portrait.naturalWidth/portrait.naturalHeight;ctx.drawImage(portrait,cx-w/2,cy-h*.78,w,h);}else{ctx.font=`${tile*.85}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🥔',cx,cy);}
}
function resize(){const w=Math.max(1,arena.clientWidth),ratio=Math.min(window.devicePixelRatio||1,3);canvas.width=Math.round(w*ratio);canvas.height=canvas.width;draw();}
function showOverlay(title,message,button,hint='Press Enter to continue'){$('headline').textContent=title;$('message').textContent=message;$('start').textContent=button;$('overlay-hint').textContent=hint;overlay.hidden=false;$('pause').disabled=true;}
function prepareLevel(){
 maze=core.createLevel(levelIndex);player={...maze.start};visited=new Set([`${player.x},${player.y}`]);remaining=45;keys.clear();budget=STEP_TIME;awaitingMove=true;paused=false;phase='playing';overlay.hidden=true;$('pause').disabled=false;$('pause').textContent='Pause';
 $('challenge').textContent=`Level ${levelIndex+1} — ${maze.name}. I hid one fry in here!`;status.textContent='Ready — make your first move to start your 45 seconds.';updateHUD();scent();resize();focusGame();cancelAnimationFrame(frame);last=performance.now();frame=requestAnimationFrame(tick);
}
function reset(){levelIndex=0;found=0;lives=3;prepareLevel();beep(550);}
function primaryAction(){if(paused){togglePause();return;}if(phase==='cleared'){levelIndex++;prepareLevel();}else if(phase==='timeout')prepareLevel();else if(['intro','won','lost'].includes(phase))reset();}
function completeLevel(){
 found++;keys.clear();cancelAnimationFrame(frame);updateHUD();
 if(found===5){phase='won';showOverlay('🎉 All five fries found!','You beat every maze and found all of Tibo’s hidden fries. Poteto wins!','Play all five again');status.textContent='Five mazes. Five fries. Poteto wins!';}
 else{phase='cleared';showOverlay(`🍟 Level ${levelIndex+1} complete!`,`Found it with ${Math.ceil(remaining)} seconds left. The next maze is bigger, with more turns and dead ends. You get a fresh 45 seconds.`,`Play Level ${levelIndex+2}`);status.textContent='Fry found! Take a breath before the next maze.';}
 beep(880,.25);draw();
}
function timeout(){remaining=0;lives--;keys.clear();cancelAnimationFrame(frame);updateHUD();phase=lives>0?'timeout':'lost';showOverlay('⏱ Time’s up!',lives>0?`You have ${lives} ${lives===1?'try':'tries'} left. Try this same maze again with a fresh 45 seconds.`:`You found ${found} of Tibo’s five fries. Start again and try to beat all five mazes.`,lives>0?'Retry this level':'Restart Level 1');status.textContent=lives>0?'Retry keeps your completed levels.':'Out of tries. Start a new game.';beep(160,.25);}
function move(direction){if(!core.canMove(maze.grid,player.x,player.y,direction))return false;const[dx,dy]=core.directions[direction];player.x+=dx;player.y+=dy;awaitingMove=false;visited.add(`${player.x},${player.y}`);status.textContent='Find the hidden fry before the timer reaches zero.';scent();draw();if(player.x===maze.target.x&&player.y===maze.target.y)completeLevel();return true;}
function tick(now){
 if(phase!=='playing'||paused)return;const elapsed=Math.max(0,(now-last)/1000);last=now;
 if(!awaitingMove){remaining-=elapsed;if(remaining<=0){timeout();return;}updateHUD();}
 budget=Math.min(STEP_TIME,budget+Math.min(elapsed,.1));
 if(keys.size&&budget>=STEP_TIME){const direction=keys.has(lastDirection)?lastDirection:[...keys].at(-1);move(direction);budget=0;}
 if(phase==='playing')frame=requestAnimationFrame(tick);
}
function togglePause(){
 if(phase!=='playing')return;paused=!paused;keys.clear();cancelAnimationFrame(frame);
 if(paused){showOverlay('Maze paused','Your timer is paused. Resume when you’re ready to keep searching.','Resume');$('pause').disabled=false;$('pause').textContent='Resume';status.textContent='Paused — press P, Enter, or Resume.';}
 else{overlay.hidden=true;$('pause').disabled=false;$('pause').textContent='Pause';status.textContent=awaitingMove?'Ready — make your first move to start your 45 seconds.':'Find the hidden fry before the timer reaches zero.';focusGame();last=performance.now();frame=requestAnimationFrame(tick);}
}
function pressDirection(direction){if(paused)togglePause();if(phase==='intro')reset();if(phase!=='playing')return;if(!keys.has(direction))budget=STEP_TIME;keys.add(direction);lastDirection=direction;}
const mapping={arrowup:'up',arrowdown:'down',arrowleft:'left',arrowright:'right',w:'up',a:'left',s:'down',d:'right'};
const directionOf=e=>mapping[e.key.toLowerCase()]||({KeyW:'up',KeyA:'left',KeyS:'down',KeyD:'right'})[e.code];
window.addEventListener('keydown',e=>{const direction=directionOf(e),key=e.key.toLowerCase();if(direction){e.preventDefault();e.stopPropagation();pressDirection(direction);}else if(key==='enter'){e.preventDefault();if(!e.repeat)primaryAction();}else if((key==='p'||key==='escape')&&!e.repeat){e.preventDefault();togglePause();}else if(e.code==='Space')e.preventDefault();},{capture:true});
window.addEventListener('keyup',e=>keys.delete(directionOf(e)),{capture:true});
$('start').addEventListener('click',primaryAction);$('pause').addEventListener('click',togglePause);$('restart').addEventListener('click',reset);
$('sound').addEventListener('click',()=>{sound=!sound;$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(sound));beep(660);if(phase==='playing'&&!paused)focusGame();});
document.querySelectorAll('[data-dir]').forEach(button=>{const direction=button.dataset.dir;button.addEventListener('pointerdown',e=>{e.preventDefault();pressDirection(direction);focusGame();button.setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>keys.delete(direction));});
arena.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))focusGame();});
window.addEventListener('blur',()=>{keys.clear();if(phase==='playing'&&!paused)togglePause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing'&&!paused)togglePause();});
window.addEventListener('resize',resize);portrait.addEventListener('load',draw);
maze=core.createLevel(0);player={...maze.start};visited=new Set(['1,1']);resize();
})();
