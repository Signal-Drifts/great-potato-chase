const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../maze.js');
const runs=require('../runs.js');
function memoryStorage(initial={}){const entries=new Map(Object.entries(initial));return{getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,String(v))};}
function route(level){
 const distance=core.distances(level.safeGrid||level.grid,level.target),p={...level.start},result=[];
 while(p.x!==level.target.x||p.y!==level.target.y){const next=Object.entries(core.directions).find(([d,[dx,dy]])=>core.canMove(level.safeGrid||level.grid,p.x,p.y,d)&&distance[p.y+dy][p.x+dx]===distance[p.y][p.x]-1);assert(next);const[d,[dx,dy]]=next;result.push(d);p.x+=dx;p.y+=dy;}return result.slice(0,-3);
}
function routeCount(level,grid=level.grid){
 let count=0;const visited=new Set();
 function walk(x,y){if(x===level.target.x&&y===level.target.y){count++;return;}const k=y*level.size+x;visited.add(k);for(const[dx,dy]of Object.values(core.directions)){const nx=x+dx,ny=y+dy;if(grid[ny]?.[nx]===0&&!visited.has(ny*level.size+nx))walk(nx,ny);}visited.delete(k);}
 walk(level.start.x,level.start.y);return count;
}
test('five candidate routes, four cactus blockers, one safe route, and increasing difficulty in every level',()=>{
 let priorSize=0,priorFloor=0,priorSolution=0;const locations=new Set();
 core.levels.forEach((_,i)=>{const l=core.createLevel(i),distance=core.distances(l.grid,l.start),floors=l.grid.flat().filter(c=>c===0).length;
  assert.equal(routeCount(l),5);assert.equal(routeCount(l,l.safeGrid),1);assert.equal(l.hazards.length,4);assert(l.solutionLength>priorSolution);priorSolution=l.solutionLength;locations.add(`${l.target.x},${l.target.y}`);assert(l.size>priorSize&&floors>priorFloor);
  for(let y=0;y<l.size;y++)for(let x=0;x<l.size;x++){if(l.grid[y][x]===0)assert(distance[y][x]>=0);if(x===0||y===0||x===l.size-1||y===l.size-1)assert.equal(l.grid[y][x],1);}
  assert(route(l).length*.15<30);assert.deepEqual(core.createLevel(i),l);priorSize=l.size;priorFloor=floors;
 });assert.equal(locations.size,5);
});
function harness(storage=memoryStorage(),search=''){
 let now=0,nextFrame,rendered;const handlers={},elements={},sounds=[];let musicStarts=0,muted=false,musicActive=false;
 const doc={activeElement:null,hidden:false,getElementById:id=>el(id),querySelectorAll:s=>s==='.step'?Array.from({length:5},(_,i)=>el(`step-${i}`)):[],addEventListener(){}};
 function el(id){return elements[id]??={id,textContent:'',hidden:false,disabled:false,clientWidth:500,width:500,height:500,dataset:{},attrs:{},listeners:{},classList:{toggle(){},add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},focus(){doc.activeElement=this;},getContext(){return{};}};}
 class MockImage{constructor(){this.complete=true;this.naturalWidth=1024;this.naturalHeight=1536;}addEventListener(){}}
 class MockAudio {constructor(){this.state='running';this.currentTime=0;this.destination={};}createOscillator(){return{frequency:{value:0},type:'',connect(){},start(){sounds.push({frequency:this.frequency.value,type:this.type});},stop(){}};}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}}
 const context={window:{location:{search},GrokRuns:runs.createSelector(storage),GrokAudio:{unlock(){musicStarts++;},setActive(value){musicActive=Boolean(value);},tone(frequency,length,type){sounds.push({frequency,type});},toggleMute(){muted=!muted;return muted;}},AudioContext:MockAudio,PotatoMaze:core,PotatoArt:{draw(_ctx,_canvas,state,actor,bot){rendered={...state,actorSource:actor?.src,botSource:bot?.src,player:{...state.player}};}},devicePixelRatio:1,addEventListener:(k,fn)=>handlers[k]=fn},document:doc,Image:MockImage,performance:{now:()=>now},requestAnimationFrame:fn=>(nextFrame=fn,1)};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8'),context);
 const key=(type,value,repeat=false)=>handlers[type]({key:value,code:value,repeat,preventDefault(){},stopPropagation(){}});
 const advance=ms=>{now+=ms;const cb=nextFrame;nextFrame=null;if(cb)cb(now);};
 const map={up:'ArrowUp',right:'ArrowRight',down:'ArrowDown',left:'ArrowLeft'};
 function rawStep(d){key('keydown',map[d]);advance(145);key('keyup',map[d]);}
 function step(d){const before={...rendered.player};key('keydown',map[d]);for(let i=0;i<35;i++){advance(145);if(rendered.player.x!==before.x||rendered.player.y!==before.y)break;}key('keyup',map[d]);}
 return{el,key,advance,step,rawStep,sounds,doc,musicStarts:()=>musicStarts,musicActive:()=>musicActive,blur:()=>handlers.blur(),click:id=>el(id).listeners.click(),rendered:()=>rendered};
}
test('five near-captures trigger Poteto resets and end with Tibo crying',()=>{
 const game=harness();game.key('keydown','Enter');game.advance(10000);assert.equal(game.el('time').textContent,30);assert.equal(game.doc.activeElement.id,'arena');
 for(let i=0;i<5;i++){
  assert.equal(game.el('level').textContent,String(i+1).padStart(2,'0'));
  for(const d of route(core.createLevel(i)))game.step(d);
  assert.equal(game.el('found').textContent,i+1);assert.equal(game.el('overlay').hidden,false);
  if(i<4){assert.equal(game.el('overlay').dataset.phase,'resetting');game.advance(3300);assert.equal(game.el('overlay').hidden,true);assert.equal(game.el('time').textContent,core.levels[i+1].timeLimit);game.key('keydown','ArrowDown',true);game.advance(10000);assert.equal(game.el('time').textContent,core.levels[i+1].timeLimit);}
 }
 game.advance(3300);assert.equal(game.el('overlay').dataset.phase,'won');assert.equal(game.el('overlay-title').textContent,'Poteto wins');game.click('start');assert.equal(game.el('found').textContent,0);assert.equal(game.el('lives').attrs['aria-label'],'3 lives');
});
test('walls block Tibo; pause freezes time; timeouts and retry preserve the rules',()=>{
 const game=harness();game.click('start');game.rawStep('left');game.advance(5000);assert.equal(game.el('time').textContent,30);assert.equal(game.rendered().player.x,1);
 for(let attempt=0;attempt<3;attempt++){
  game.step(route(core.createLevel(0))[0]);game.key('keydown','p');const time=game.el('time').textContent;game.advance(10000);assert.equal(game.el('time').textContent,time);
  game.key('keydown','p');game.advance(46000);assert.equal(game.el('lives').attrs['aria-label'],`${2-attempt} lives`);assert.equal(game.el('time').textContent,0);
  if(attempt<2){game.click('start');assert.equal(game.el('time').textContent,30);assert.equal(game.rendered().player.x,1);}
 }
 assert.equal(game.el('overlay').dataset.phase,'lost');assert.equal(game.el('start').attrs['aria-label'],'Restart game');
});
test('Grok stays visible at a distance and Tibo has no marker beneath his feet',()=>{
 const translated=[],arcs=[],gradient={addColorStop(){}},canvas={width:600};
 const ctx=new Proxy({translate:(x,y)=>translated.push([x,y]),arc:(...args)=>arcs.push(args),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(target,key)=>key in target?target[key]:(()=>{})});
 const window={PotatoMaze:core};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../renderer.js'),'utf8'),{window});
 const maze=core.createLevel(0),tile=canvas.width/maze.size,player={...maze.start};
 assert(Math.abs(player.x-maze.target.x)>2);
 window.PotatoArt.draw(ctx,canvas,{maze,player,visited:new Set(),time:0},{complete:true,naturalWidth:1024,naturalHeight:1536});
 const targetX=(maze.target.x+.5)*tile,targetY=(maze.target.y+.5)*tile;
 assert(translated.some(([x,y])=>x===targetX&&y===targetY),'Visible fry must be drawn even at the far side of the maze');
 const playerX=(player.x+.5)*tile,playerY=(player.y+.5)*tile;
 assert(!arcs.some(([x,y,r])=>x===playerX&&y===playerY&&r>tile*.2),'No circle beneath Poteto');
});

test('touching cactus monsters costs a life and respawns Tibo, with a trap sound',()=>{
 const game=harness(),level=core.createLevel(0);game.click('start');
 const trapPath=core.pathBetween(level.grid,level.start,level.hazards[0]);
 for(let attempt=0;attempt<3;attempt++){
  for(let i=1;i<trapPath.length;i++){
   const prev=trapPath[i-1],next=trapPath[i];const d=Object.entries(core.directions).find(([,delta])=>prev.x+delta[0]===next.x&&prev.y+delta[1]===next.y)[0];
   game.step(d);if(game.el('lives').attrs['aria-label']!==`${3-attempt} lives`)break;
  }
  assert.equal(game.el('lives').attrs['aria-label'],`${2-attempt} lives`);
  if(attempt<2){game.advance(700);assert.deepEqual(game.rendered().player,level.start);}
 }
 assert.equal(game.el('overlay').dataset.phase,'lost');assert(game.sounds.some(s=>s.frequency===85&&s.type==='sawtooth'));
});
test('footsteps and wall bumps sound, and timed gates really block then allow passage',()=>{
 const game=harness(),level=core.createLevel(0);game.click('start');game.rawStep('left');assert(game.sounds.some(s=>s.frequency===65));
 const positions=core.pathBetween(level.safeGrid,level.start,level.target),gate=level.gates[0];
 const gateIndex=positions.findIndex(p=>p.x===gate.x&&p.y===gate.y);
 for(let i=1;i<gateIndex;i++){
  const prev=positions[i-1],next=positions[i],d=Object.entries(core.directions).find(([,v])=>prev.x+v[0]===next.x&&prev.y+v[1]===next.y)[0];game.step(d);
 }
 assert(game.sounds.some(s=>s.frequency===100||s.frequency===135));
 while(core.isGateOpen(gate,game.rendered().elapsed))game.advance(100);
 const before={...game.rendered().player},direction=Object.entries(core.directions).find(([,v])=>before.x+v[0]===gate.x&&before.y+v[1]===gate.y)[0];
 game.rawStep(direction);assert.deepEqual(game.rendered().player,before);assert.equal(game.el('lives').attrs['aria-label'],'3 lives');
 while(!core.isGateOpen(gate,game.rendered().elapsed))game.advance(100);
 game.rawStep(direction);assert.deepEqual(game.rendered().player,{x:gate.x,y:gate.y});
});

test('reset happens exactly three walkable blocks away, not four, and lasts long enough to show crying',()=>{
 const game=harness(),level=core.createLevel(0);game.click('start');const directions=route(level);
 assert.equal(game.rendered().actorSource,'tibo.png');assert.equal(game.rendered().botSource,'grok.png');
 for(const direction of directions.slice(0,-1))game.step(direction);
 assert.equal(core.resetDistance(level,game.rendered().player),4);assert.equal(game.el('overlay').hidden,true);assert.equal(game.el('found').textContent,0);
 game.step(directions.at(-1));assert.equal(core.resetDistance(level,game.rendered().player),3);
 assert.equal(game.el('overlay').dataset.phase,'resetting');assert.equal(game.el('overlay-title').textContent,'RESET!');assert(game.rendered().crying);
 game.advance(1000);assert.equal(game.el('overlay').dataset.phase,'resetting');assert.equal(game.el('overlay').dataset.pressState,'down');assert(game.sounds.some(s=>s.frequency===80));
 game.advance(2200);assert.equal(game.el('level').textContent,'02');assert.equal(game.el('time').textContent,30);assert.equal(game.el('overlay').hidden,true);
});
test('nearby cells across walls do not trigger resets, and Grok eyes visit all four directions',()=>{
 let foundAcrossWall=false;
 for(let i=0;i<5;i++){
  const l=core.createLevel(i);
  for(let y=0;y<l.size;y++)for(let x=0;x<l.size;x++)if(l.safeGrid[y][x]===0&&Math.abs(x-l.target.x)+Math.abs(y-l.target.y)<=3&&core.resetDistance(l,{x,y})>3)foundAcrossWall=true;
 }
 assert(foundAcrossWall,'Use walking distance, not just visual distance through walls');
 const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../renderer.js'),'utf8'),{window});const offset=window.PotatoArt.eyeOffset;
 assert(offset(0).y>0);assert(offset(Math.PI/4).x>0);assert(offset(Math.PI/2).y<0);assert(offset(3*Math.PI/4).x<0);
});

test('audio unlocks with Play and removed buttons remain absent from the markup',()=>{
 const game=harness();assert.equal(game.musicStarts(),0);game.key('keydown','Enter');assert.equal(game.musicStarts(),1);assert.equal(game.el('time').textContent,30);
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 for(const id of ['restart','pause','sound'])assert(!html.includes(`id="${id}"`));
 assert(!html.includes('class="pad"'));assert(!html.includes('class="bottom"'));assert(!html.includes('☞'));assert(html.includes('mushroom-button'));
 game.key('keydown','m');game.key('keydown','m');game.key('keydown','r');assert.equal(game.el('time').textContent,30);
});
test('background music schedules only during active play and immediately silences queued notes on stop',()=>{
 let timer,context,intervals=0,cleared=0;const notes=[],gains=[],handlers={};
 class Audio {
  constructor(){this.state='running';this.currentTime=0;this.destination={};context=this;}
  createGain(){const node={gain:{value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};gains.push(node);return node;}
  createOscillator(){return{frequency:{value:0},connect(){},start(time){notes.push({hz:this.frequency.value,time});},stop(){}};}
 }
 const window={AudioContext:Audio,addEventListener(k,fn){handlers[k]=fn;},setInterval(fn){timer=fn;intervals++;return intervals;},clearInterval(){cleared++;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../music.js'),'utf8'),{window});
 window.GrokAudio.unlock();assert.equal(intervals,0);assert.equal(notes.length,0);assert.equal(gains[1].gain.value,0);
 window.GrokAudio.setActive(true);window.GrokAudio.setActive(true);assert.equal(intervals,1);assert.equal(gains[1].gain.value,1);
 const first=notes.length;for(let i=0;i<50;i++){context.currentTime+=.25;timer();}assert(notes.length>first+50);
 window.GrokAudio.setActive(false);assert.equal(cleared,1);assert.equal(gains[1].gain.value,0);const stopped=notes.length;timer();assert.equal(notes.length,stopped);
 window.GrokAudio.setActive(false);assert.equal(cleared,1);window.GrokAudio.setActive(true);assert.equal(intervals,2);
 assert.equal(window.GrokAudio.toggleMute(),true);assert.equal(gains[0].gain.value,0);assert.equal(window.GrokAudio.toggleMute(),false);assert.equal(gains[0].gain.value,.8);
 handlers.pagehide();assert.equal(gains[0].gain.value,0);assert.equal(gains[1].gain.value,0);
});

test('all 15 layouts are distinct, deterministic, and retain five routes with exactly one safe route',()=>{
 const allLayouts=new Set();
 for(let variant=0;variant<3;variant++){
  let previousLength=0;
  for(let i=0;i<5;i++){
   const level=core.createLevel(i,variant);assert.equal(level.variant,variant);assert.equal(routeCount(level),5);assert.equal(routeCount(level,level.safeGrid),1);
   assert.equal(level.hazards.length,4);assert(level.solutionLength>previousLength);previousLength=level.solutionLength;
   assert.deepEqual(core.createLevel(i,variant),level);allLayouts.add(JSON.stringify(level.grid));
   const distances=core.distances(level.grid,level.start);
   for(let y=0;y<level.size;y++)for(let x=0;x<level.size;x++)if(level.grid[y][x]===0)assert(distances[y][x]>=0);
  }
 }
 assert.equal(allLayouts.size,15);
});
test('both new variants can finish all five levels within their assigned limits',()=>{
 for(const variant of [1,2]){
  const game=harness(memoryStorage({[runs.KEY]:String(variant)}));game.click('start');
  for(let level=0;level<5;level++){
   assert.equal(game.rendered().maze.variant,variant);
   for(const direction of route(core.createLevel(level,variant)))game.step(direction);
   assert.equal(game.el('found').textContent,level+1);assert.equal(game.el('overlay').dataset.phase,'resetting');
   assert.equal(game.el('lives').attrs['aria-label'],'3 lives');game.advance(3300);
  }
  assert.equal(game.el('overlay').dataset.phase,'won');
 }
});
test('refresh and full restarts rotate versions, while level retries preserve the current maze',()=>{
 const storage=memoryStorage(),first=harness(storage);
 assert.equal(first.rendered().maze.variant,0);first.click('start');assert.equal(first.rendered().maze.variant,0);
 const original=JSON.stringify(first.rendered().maze.grid);
 first.step(route(first.rendered().maze)[0]);first.advance(31000);assert.equal(first.el('overlay').dataset.phase,'timeout');first.click('start');
 assert.equal(first.rendered().maze.variant,0);assert.equal(JSON.stringify(first.rendered().maze.grid),original);
 first.key('keydown','r');assert.equal(first.rendered().maze.variant,1);assert.notEqual(JSON.stringify(first.rendered().maze.grid),original);
 const refreshed=harness(storage);assert.equal(refreshed.rendered().maze.variant,2);refreshed.click('start');assert.equal(refreshed.rendered().maze.variant,2);
 const thirdPage=harness(storage);assert.equal(thirdPage.rendered().maze.variant,0);
});
test('the version cycle tolerates blocked or corrupt browser storage',()=>{
 const blocked=runs.createSelector({getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}});
 assert.deepEqual([blocked.nextVariant(),blocked.nextVariant(),blocked.nextVariant(),blocked.nextVariant()],[0,1,2,0]);
 const corrupt=runs.createSelector(memoryStorage({[runs.KEY]:'invalid'}));assert.equal(corrupt.nextVariant(),0);assert.equal(corrupt.nextVariant(),1);
});

test('music is silent on idle, pause, blur, timeout, and restart, and resumes only with active play',()=>{
 const game=harness();assert.equal(game.musicActive(),false);game.click('start');assert.equal(game.musicActive(),false);
 game.step(route(game.rendered().maze)[0]);assert.equal(game.musicActive(),true);
 game.key('keydown','p');assert.equal(game.musicActive(),false);game.advance(10000);assert.equal(game.musicActive(),false);
 game.key('keydown','p');assert.equal(game.musicActive(),true);game.blur();assert.equal(game.musicActive(),false);
 game.key('keydown','p');assert.equal(game.musicActive(),true);game.advance(31000);assert.equal(game.musicActive(),false);
 game.click('start');assert.equal(game.musicActive(),false);game.step(route(game.rendered().maze)[0]);assert.equal(game.musicActive(),true);
 game.key('keydown','r');assert.equal(game.musicActive(),false);
});
test('Level 3 deep links start at Level 3 and then use 50 and 60 seconds for Levels 4 and 5',()=>{
 const game=harness(memoryStorage(),'?v=11&level=3');
 assert.equal(game.el('level').textContent,'03');assert.equal(game.el('start').attrs['aria-label'],'Play level 3');assert.equal(game.el('time').textContent,30);assert.equal(game.el('total-levels').textContent,'/ 3');
 game.click('start');
 for(let i=2;i<5;i++){
  assert.equal(game.el('level').textContent,String(i+1).padStart(2,'0'));assert.equal(game.el('time').textContent,[30,30,30,50,60][i]);
  for(const direction of route(core.createLevel(i)))game.step(direction);
  assert.equal(game.el('found').textContent,i-1);assert.equal(game.musicActive(),false);game.advance(3300);
 }
 assert.equal(game.el('overlay').dataset.phase,'won');game.key('keydown','r');assert.equal(game.el('level').textContent,'03');assert.equal(game.el('time').textContent,30);
});
test('longer level retries retain their correct time limits and invalid level links fall back safely',()=>{
 for(const [level,limit]of [[4,50],[5,60]]){
  const game=harness(memoryStorage(),`?level=${level}`);game.click('start');assert.equal(game.el('time').textContent,limit);
  game.step(route(game.rendered().maze)[0]);game.advance((limit+1)*1000);assert.equal(game.el('time').textContent,0);assert.equal(game.musicActive(),false);
  game.click('start');assert.equal(game.el('time').textContent,limit);
 }
 for(const query of ['','?level=0','?level=6','?level=nope','?level=-1','?level=2.5'])assert.equal(core.startLevel(query),0);
 assert.deepEqual(core.levels.map(l=>l.timeLimit),[30,30,30,50,60]);
});
