(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.PotatoMaze=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const levels=[{size:9,name:'The Little Hideout',seed:2071},{size:11,name:'Wrong Turn Woods',seed:3083},{size:15,name:'The Twisty Garden',seed:4099},{size:17,name:'Tibo’s Tangled Trails',seed:5113},{size:21,name:'The Ultimate Fry Labyrinth',seed:6121}];
const directions={up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
function canMove(grid,x,y,direction){const d=directions[direction];return !!d&&grid[y+d[1]]?.[x+d[0]]===0;}
function distances(grid,start){
 const result=grid.map(row=>row.map(()=>-1)),queue=[{...start}];result[start.y][start.x]=0;
 for(let head=0;head<queue.length;head++){const p=queue[head];for(const[dx,dy]of Object.values(directions)){const x=p.x+dx,y=p.y+dy;if(grid[y]?.[x]===0&&result[y][x]===-1){result[y][x]=result[p.y][p.x]+1;queue.push({x,y});}}}return result;
}
function createLevel(index){
 const config=levels[index];if(!config)throw new RangeError('Level must be between 0 and 4.');
 const{size}=config;let seed=config.seed;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const grid=Array.from({length:size},()=>Array(size).fill(1)),start={x:1,y:1},stack=[{...start}];grid[1][1]=0;
 while(stack.length){const p=stack[stack.length-1],choices=Object.values(directions).map(([dx,dy])=>({x:p.x+dx*2,y:p.y+dy*2,dx,dy})).filter(n=>n.x>0&&n.y>0&&n.x<size-1&&n.y<size-1&&grid[n.y][n.x]===1);if(!choices.length){stack.pop();continue;}const next=choices[Math.floor(random()*choices.length)];grid[p.y+next.dy][p.x+next.dx]=0;grid[next.y][next.x]=0;stack.push(next);}
 const distance=distances(grid,start);let target={...start},solutionLength=0;
 for(let y=1;y<size;y++)for(let x=1;x<size;x++)if(distance[y][x]>solutionLength){solutionLength=distance[y][x];target={x,y};}
 return{...config,grid,start,target,solutionLength};
}
return{levels,directions,canMove,distances,createLevel};
});
