(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PotatoMaze = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  const levels = [
    {size:15, routes:3, seed:2071}, {size:19, routes:4, seed:3083},
    {size:23, routes:5, seed:4099}, {size:27, routes:6, seed:5113},
    {size:31, routes:7, seed:6121}
  ];
  const directions = {up:[0,-1], right:[1,0], down:[0,1], left:[-1,0]};
  function canMove(grid, x, y, direction) {
    const d = directions[direction];
    return !!d && grid[y+d[1]]?.[x+d[0]] === 0;
  }
  function distances(grid, start) {
    const result = grid.map(row => row.map(() => -1)), queue = [{...start}];
    result[start.y][start.x] = 0;
    for (let head=0; head<queue.length; head++) {
      const p = queue[head];
      for (const [dx,dy] of Object.values(directions)) {
        const x=p.x+dx, y=p.y+dy;
        if (grid[y]?.[x]===0 && result[y][x]===-1) {
          result[y][x]=result[p.y][p.x]+1; queue.push({x,y});
        }
      }
    }
    return result;
  }
  function createLevel(index) {
    const config=levels[index];
    if (!config) throw new RangeError('Level must be between 0 and 4.');
    const {size,routes}=config;
    let seed=config.seed;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const grid=Array.from({length:size},()=>Array(size).fill(1));
    const middle=2*routes+1, start={x:1,y:middle}, target={x:size-2,y:middle};
    function line(x1,y1,x2,y2) {
      const dx=Math.sign(x2-x1),dy=Math.sign(y2-y1);
      while (x1!==x2 || y1!==y2) {grid[y1][x1]=0;x1+=dx;y1+=dy;}
      grid[y2][x2]=0;
    }
    // Separate winding branches connect two vertical spines. Their spacing
    // prevents accidental shortcuts between neighboring branches.
    line(1,1,1,4*routes-1); line(size-2,1,size-2,4*routes-1);
    for (let branch=0;branch<routes;branch++) {
      const top=1+branch*4;
      let y=top+(branch%2)*2,x=1;
      for (let turn=3;turn<=size-4;turn+=4) {
        line(x,y,turn,y); const nextY=y===top?top+2:top;
        line(turn,y,turn,nextY);x=turn;y=nextY;
      }
      line(x,y,size-2,y);
    }
    // Add tree-shaped dead ends only: exactly one existing neighbor avoids
    // introducing an extra route or disconnecting any passage.
    const offshoots=8+index*16;
    for (let n=0;n<offshoots;n++) {
      const choices=[];
      for(let y=1;y<size-1;y++)for(let x=2;x<size-2;x++) {
        if(grid[y][x]!==1)continue;
        const neighbors=Object.values(directions).filter(([dx,dy])=>grid[y+dy]?.[x+dx]===0).length;
        if(neighbors===1)choices.push({x,y});
      }
      if(!choices.length)break;
      const next=choices[Math.floor(random()*choices.length)];grid[next.y][next.x]=0;
    }
    const distance=distances(grid,start);
    return {...config,grid,start,target,solutionLength:distance[target.y][target.x]};
  }
  return {levels,directions,canMove,distances,createLevel};
});
