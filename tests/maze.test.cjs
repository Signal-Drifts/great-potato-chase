const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../maze.js');
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
  assert(route(l).length*.15<45);assert.deepEqual(core.createLevel(i),l);priorSize=l.size;priorFloor=floors;
 });assert.equal(locations.size,5);
});
function harness(){
 let now=0,nextFrame,rendered;const handlers={},elements={},sounds=[];
 const doc={activeElement:null,hidden:false,getElementById:id=>el(id),querySelectorAll:s=>s==='.step'?Array.from({length:5},(_,i)=>el(`step-${i}`)):[],addEventListener(){}};
 function el(id){return elements[id]??={id,textContent:'',hidden:false,disabled:false,clientWidth:500,width:500,height:500,dataset:{},attrs:{},listeners:{},classList:{toggle(){},add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},focus(){doc.activeElement=this;},getContext(){return{};}};}
 class MockImage{constructor(){this.complete=true;this.naturalWidth=1024;this.naturalHeight=1536;}addEventListener(){}}
 class MockAudio {constructor(){this.state='running';this.currentTime=0;this.destination={};}createOscillator(){return{frequency:{value:0},type:'',connect(){},start(){sounds.push({frequency:this.frequency.value,type:this.type});},stop(){}};}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}}
 const context={window:{AudioContext:MockAudio,PotatoMaze:core,PotatoArt:{draw(_ctx,_canvas,state,actor,bot){rendered={...state,actorSource:actor?.src,botSource:bot?.src,player:{...state.player}};}},devicePixelRatio:1,addEventListener:(k,fn)=>handlers[k]=fn},document:doc,Image:MockImage,performance:{now:()=>now},requestAnimationFrame:fn=>(nextFrame=fn,1)};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8'),context);
 const key=(type,value,repeat=false)=>handlers[type]({key:value,code:value,repeat,preventDefault(){},stopPropagation(){}});
 const advance=ms=>{now+=ms;const cb=nextFrame;nextFrame=null;if(cb)cb(now);};
 const map={up:'ArrowUp',right:'ArrowRight',down:'ArrowDown',left:'ArrowLeft'};
 function rawStep(d){key('keydown',map[d]);advance(145);key('keyup',map[d]);}
 function step(d){const before={...rendered.player};key('keydown',map[d]);for(let i=0;i<35;i++){advance(145);if(rendered.player.x!==before.x||rendered.player.y!==before.y)break;}key('keyup',map[d]);}
 return{el,key,advance,step,rawStep,sounds,doc,click:id=>el(id).listeners.click(),rendered:()=>rendered};
}
test('five near-captures trigger Poteto resets and end with Tibo crying',()=>{
 const game=harness();game.key('keydown','Enter');game.advance(10000);assert.equal(game.el('time').textContent,45);assert.equal(game.doc.activeElement.id,'arena');
 for(let i=0;i<5;i++){
  assert.equal(game.el('level').textContent,String(i+1).padStart(2,'0'));
  for(const d of route(core.createLevel(i)))game.step(d);
  assert.equal(game.el('found').textContent,i+1);assert.equal(game.el('overlay').hidden,false);
  if(i<4){assert.equal(game.el('overlay').dataset.phase,'resetting');game.advance(3300);assert.equal(game.el('overlay').hidden,true);assert.equal(game.el('time').textContent,45);game.key('keydown','ArrowDown',true);game.advance(10000);assert.equal(game.el('time').textContent,45);}
 }
 game.advance(3300);assert.equal(game.el('overlay').dataset.phase,'won');assert.equal(game.el('overlay-title').textContent,'Poteto wins');game.click('start');assert.equal(game.el('found').textContent,0);assert.equal(game.el('lives').attrs['aria-label'],'3 lives');
});
test('walls block Tibo; pause freezes time; timeouts and retry preserve the rules',()=>{
 const game=harness();game.click('start');game.rawStep('left');game.advance(5000);assert.equal(game.el('time').textContent,45);assert.equal(game.rendered().player.x,1);
 for(let attempt=0;attempt<3;attempt++){
  game.step(route(core.createLevel(0))[0]);game.key('keydown','p');const time=game.el('time').textContent;game.advance(10000);assert.equal(game.el('time').textContent,time);
  game.key('keydown','p');game.advance(46000);assert.equal(game.el('lives').attrs['aria-label'],`${2-attempt} lives`);assert.equal(game.el('time').textContent,0);
  if(attempt<2){game.click('start');assert.equal(game.el('time').textContent,45);assert.equal(game.rendered().player.x,1);}
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
 game.advance(1000);assert.equal(game.el('overlay').dataset.phase,'resetting');
 game.advance(2200);assert.equal(game.el('level').textContent,'02');assert.equal(game.el('time').textContent,45);assert.equal(game.el('overlay').hidden,true);
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
