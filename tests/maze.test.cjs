const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const core=require('../maze.js');
function route(level){
 const distance=core.distances(level.grid,level.target),p={...level.start},result=[];
 while(p.x!==level.target.x||p.y!==level.target.y){const next=Object.entries(core.directions).find(([d,[dx,dy]])=>core.canMove(level.grid,p.x,p.y,d)&&distance[p.y+dy][p.x+dx]===distance[p.y][p.x]-1);assert(next);const[d,[dx,dy]]=next;result.push(d);p.x+=dx;p.y+=dy;}return result;
}
function routeCount(level){
 let count=0;const visited=new Set();
 function walk(x,y){if(x===level.target.x&&y===level.target.y){count++;return;}const k=y*level.size+x;visited.add(k);for(const[dx,dy]of Object.values(core.directions)){const nx=x+dx,ny=y+dy;if(level.grid[ny]?.[nx]===0&&!visited.has(ny*level.size+nx))walk(nx,ny);}visited.delete(k);}
 walk(level.start.x,level.start.y);return count;
}
test('levels have exactly 3, 4, 5, 6, and 7 routes, growing layouts, and no disconnected passages',()=>{
 let priorSize=0,priorFloor=0;
 core.levels.forEach((_,i)=>{const l=core.createLevel(i),distance=core.distances(l.grid,l.start),floors=l.grid.flat().filter(c=>c===0).length;
  assert.equal(routeCount(l),i+3);assert(l.size>priorSize&&floors>priorFloor);
  for(let y=0;y<l.size;y++)for(let x=0;x<l.size;x++){if(l.grid[y][x]===0)assert(distance[y][x]>=0);if(x===0||y===0||x===l.size-1||y===l.size-1)assert.equal(l.grid[y][x],1);}
  assert(route(l).length*.15<45);assert.deepEqual(core.createLevel(i),l);priorSize=l.size;priorFloor=floors;
 });
});
function harness(){
 let now=0,nextFrame,rendered;const handlers={},elements={};
 const doc={activeElement:null,hidden:false,getElementById:id=>el(id),querySelectorAll:s=>s==='.step'?Array.from({length:5},(_,i)=>el(`step-${i}`)):[],addEventListener(){}};
 function el(id){return elements[id]??={id,textContent:'',hidden:false,disabled:false,clientWidth:500,width:500,height:500,dataset:{},attrs:{},listeners:{},classList:{toggle(){},add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;},focus(){doc.activeElement=this;},getContext(){return{};}};}
 class MockImage{constructor(){this.complete=true;this.naturalWidth=1024;this.naturalHeight=1536;}addEventListener(){}}
 const context={window:{PotatoMaze:core,PotatoArt:{draw(_ctx,_canvas,state){rendered={...state,player:{...state.player}};}},devicePixelRatio:1,addEventListener:(k,fn)=>handlers[k]=fn},document:doc,Image:MockImage,performance:{now:()=>now},requestAnimationFrame:fn=>(nextFrame=fn,1)};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../game.js'),'utf8'),context);
 const key=(type,value,repeat=false)=>handlers[type]({key:value,code:value,repeat,preventDefault(){},stopPropagation(){}});
 const advance=ms=>{now+=ms;const cb=nextFrame;nextFrame=null;if(cb)cb(now);};
 const map={up:'ArrowUp',right:'ArrowRight',down:'ArrowDown',left:'ArrowLeft'};
 function step(d){key('keydown',map[d]);advance(145);key('keyup',map[d]);}
 return{el,key,advance,step,doc,click:id=>el(id).listeners.click(),rendered:()=>rendered};
}
test('five collected fries advance automatically and make Tibo surrender',()=>{
 const game=harness();game.key('keydown','Enter');game.advance(10000);assert.equal(game.el('time').textContent,45);assert.equal(game.doc.activeElement.id,'arena');
 for(let i=0;i<5;i++){
  assert.equal(game.el('level').textContent,String(i+1).padStart(2,'0'));
  for(const d of route(core.createLevel(i)))game.step(d);
  assert.equal(game.el('found').textContent,i+1);assert.equal(game.el('overlay').hidden,false);
  if(i<4){assert.equal(game.el('overlay').dataset.phase,'transition');game.advance(1200);assert.equal(game.el('overlay').hidden,true);assert.equal(game.el('time').textContent,45);game.key('keydown','ArrowDown',true);game.advance(10000);assert.equal(game.el('time').textContent,45);}
 }
 assert.equal(game.el('overlay').dataset.phase,'won');assert.equal(game.el('overlay-title').textContent,'Tibo surrenders');game.click('start');assert.equal(game.el('found').textContent,0);assert.equal(game.el('lives').attrs['aria-label'],'3 lives');
});
test('walls block Poteto; pause freezes time; timeouts and retry preserve the rules',()=>{
 const game=harness();game.click('start');game.step('left');game.advance(5000);assert.equal(game.el('time').textContent,45);assert.equal(game.rendered().player.x,1);
 for(let attempt=0;attempt<3;attempt++){
  game.step(route(core.createLevel(0))[0]);game.key('keydown','p');const time=game.el('time').textContent;game.advance(10000);assert.equal(game.el('time').textContent,time);
  game.key('keydown','p');game.advance(46000);assert.equal(game.el('lives').attrs['aria-label'],`${2-attempt} lives`);assert.equal(game.el('time').textContent,0);
  if(attempt<2){game.click('start');assert.equal(game.el('time').textContent,45);assert.equal(game.rendered().player.x,1);}
 }
 assert.equal(game.el('overlay').dataset.phase,'lost');assert.equal(game.el('start').attrs['aria-label'],'Restart game');
});
test('the artwork draws the fry even when Poteto is far away, with no marker beneath Poteto',()=>{
 const translated=[],arcs=[],gradient={addColorStop(){}},canvas={width:600};
 const ctx=new Proxy({translate:(x,y)=>translated.push([x,y]),arc:(...args)=>arcs.push(args),createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(target,key)=>key in target?target[key]:(()=>{})});
 const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../renderer.js'),'utf8'),{window});
 const maze=core.createLevel(0),tile=canvas.width/maze.size,player={...maze.start};
 assert(Math.abs(player.x-maze.target.x)>2);
 window.PotatoArt.draw(ctx,canvas,{maze,player,visited:new Set(),time:0},{complete:true,naturalWidth:1024,naturalHeight:1536});
 const targetX=(maze.target.x+.5)*tile,targetY=(maze.target.y+.5)*tile;
 assert(translated.some(([x,y])=>x===targetX&&y===targetY),'Visible fry must be drawn even at the far side of the maze');
 const playerX=(player.x+.5)*tile,playerY=(player.y+.5)*tile;
 assert(!arcs.some(([x,y,r])=>x===playerX&&y===playerY&&r>tile*.2),'No circle beneath Poteto');
});
