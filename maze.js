(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PotatoMaze=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const levels=[
 {size:23,routes:5,seed:2107,rotation:0,mirror:false,bandHeight:3,gateCount:1,startGap:1},
 {size:27,routes:5,seed:3109,rotation:1,mirror:false,bandHeight:5,gateCount:1,startGap:2},
 {size:31,routes:5,seed:4111,rotation:2,mirror:false,bandHeight:5,gateCount:2,startGap:0},
 {size:35,routes:5,seed:5119,rotation:3,mirror:false,bandHeight:7,gateCount:2,startGap:3},
 {size:39,routes:5,seed:6134,rotation:2,mirror:true,bandHeight:9,gateCount:3,startGap:0}
];
const directions={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
function canMove(grid,x,y,direction){const d=directions[direction];return !!d&&grid[y+d[1]]?.[x+d[0]]===0;}
function distances(grid,start){
 const result=grid.map(row=>row.map(()=>-1)),queue=[{...start}];result[start.y][start.x]=0;
 for(let i=0;i<queue.length;i++){const p=queue[i];for(const[dx,dy]of Object.values(directions)){const x=p.x+dx,y=p.y+dy;if(grid[y]?.[x]===0&&result[y][x]===-1){result[y][x]=result[p.y][p.x]+1;queue.push({x,y});}}}return result;
}
function pathBetween(grid,start,target){
 const d=distances(grid,target),p={...start},out=[{...p}];if(d[p.y][p.x]<0)return[];
 while(p.x!==target.x||p.y!==target.y){const next=Object.values(directions).find(([dx,dy])=>grid[p.y+dy]?.[p.x+dx]===0&&d[p.y+dy][p.x+dx]===d[p.y][p.x]-1);p.x+=next[0];p.y+=next[1];out.push({...p});}return out;
}
function isGateOpen(gate,elapsed){return((elapsed+gate.phase)%gate.period)<gate.openFor;}
function resetDistance(level,position){
 const map=level.targetDistances||distances(level.safeGrid,level.target);
 return map[position.y]?.[position.x]??-1;
}
function createLevel(index){
 const config=levels[index];if(!config)throw new RangeError('Level must be 0–4.');const{size}=config;
 let seed=config.seed;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const grid=Array.from({length:size},()=>Array(size).fill(1));
 const bases=Array.from({length:5},(_,i)=>1+2*Math.round(i*(size-5)/8));
 const bands=bases.map((base,i)=>({base,height:Math.min(config.bandHeight,i===4?size-1-base:bases[i+1]-base-1)}));
 const branches=[];
 for(const band of bands){
  const{base,height}=band,stack=[{x:3,y:base}];grid[base][3]=0;
  while(stack.length){
   const p=stack.at(-1),nexts=Object.values(directions).map(([dx,dy])=>({x:p.x+dx*2,y:p.y+dy*2,dx,dy})).filter(n=>n.x>=3&&n.x<=size-4&&n.y>=base&&n.y<base+height&&grid[n.y][n.x]===1);
   if(!nexts.length){stack.pop();continue;}const n=nexts[Math.floor(random()*nexts.length)];grid[p.y+n.dy][p.x+n.dx]=0;grid[n.y][n.x]=0;stack.push(n);
  }
  const rows=Math.ceil(height/2),entry={x:3,y:base+2*Math.floor(random()*rows)},exit={x:size-4,y:base+2*Math.floor(random()*rows)};
  const path=pathBetween(grid,entry,exit);grid[entry.y][2]=0;grid[exit.y][size-3]=0;branches.push({entry,exit,path});
 }
 for(let y=1;y<size-1;y++){grid[y][1]=0;grid[y][size-2]=0;}
 const gap=config.startGap,middle=bands[gap].base+bands[gap].height;
 const start={x:1,y:middle},target={x:size-2,y:middle};
 // Exactly five parallel candidate routes. The longest, differently shaped
 // branch is safe; one cactus blocks each of the other four branches.
 const lengths=branches.map(b=>Math.abs(middle-b.entry.y)+b.path.length+Math.abs(middle-b.exit.y));
 const safeBranch=lengths.indexOf(Math.max(...lengths));const hazards=[];
 branches.forEach((b,i)=>{if(i===safeBranch)return;const at=Math.max(1,Math.min(b.path.length-2,Math.floor(b.path.length*(.32+index*.08))));hazards.push({...b.path[at]});});
 const safePath=branches[safeBranch].path,gates=[];
 for(let i=0;i<config.gateCount;i++){
  const at=Math.max(1,Math.min(safePath.length-2,Math.floor((i+1)*safePath.length/(config.gateCount+1))));
  gates.push({...safePath[at],period:3.1+index*.1,openFor:1.8-index*.15,phase:i*.7+index*.2});
 }
 // Extra dead-end branches never connect two existing paths.
 for(let n=0;n<8+index*14;n++){
  const choices=[];for(let y=1;y<size-1;y++)for(let x=2;x<size-2;x++)if(grid[y][x]===1&&Object.values(directions).filter(([dx,dy])=>grid[y+dy]?.[x+dx]===0).length===1)choices.push({x,y});
  if(!choices.length)break;const p=choices[Math.floor(random()*choices.length)];grid[p.y][p.x]=0;
 }
 function transform(p){let x=config.mirror?size-1-p.x:p.x,y=p.y;for(let i=0;i<config.rotation;i++)[x,y]=[size-1-y,x];return{...p,x,y};}
 const transformed=grid.map(row=>row.map(()=>1));
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const p=transform({x,y});transformed[p.y][p.x]=grid[y][x];}
 const finalHazards=hazards.map(transform),safeGrid=transformed.map(row=>[...row]);finalHazards.forEach(p=>safeGrid[p.y][p.x]=1);
 const finalStart=transform(start),finalTarget=transform(target),distance=distances(safeGrid,finalStart);
 return{...config,levelIndex:index,grid:transformed,safeGrid,start:finalStart,target:finalTarget,hazards:finalHazards,gates:gates.map(transform),targetDistances:distances(safeGrid,finalTarget),solutionLength:distance[finalTarget.y][finalTarget.x]};
}
return{levels,directions,canMove,distances,pathBetween,isGateOpen,resetDistance,createLevel};
});
