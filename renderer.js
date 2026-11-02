(function(root) {
  'use strict';
  const hash=(x,y,n=0)=>{const v=Math.sin(x*127.1+y*311.7+n*74.7)*43758.5453;return v-Math.floor(v);};
  function rounded(ctx,x,y,w,h,r) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
  }
  function gradient(ctx,x,y,w,h,stops) {
    const g=ctx.createLinearGradient(x,y,x+w,y+h);
    stops.forEach(([offset,color])=>g.addColorStop(offset,color));return g;
  }
  function fry(ctx,x,y,tile,time) {
    const scale=tile/38,bob=Math.sin(time*3)*2*scale;
    ctx.save();ctx.translate(x,y+bob);
    const halo=ctx.createRadialGradient(0,0,0,0,0,tile*1.05);
    halo.addColorStop(0,'#fff5ae99');halo.addColorStop(1,'#fff5ae00');ctx.fillStyle=halo;
    ctx.fillRect(-tile*1.1,-tile*1.1,tile*2.2,tile*2.2);
    ctx.scale(scale,scale);ctx.lineWidth=1;
    for(let i=0;i<6;i++) {
      ctx.save();ctx.translate(-12+i*4,-3);ctx.rotate((i-2.5)*.065);
      ctx.fillStyle=gradient(ctx,0,-19,5,24,[[0,'#fff1a3'],[.45,'#ffc44b'],[1,'#d38521']]);
      rounded(ctx,0,-19-(i%3)*2,4.8,27,1.1);ctx.fill();
      ctx.fillStyle='#fff5ba';ctx.fillRect(.7,-17-(i%3)*2,1,17);ctx.restore();
    }
    ctx.fillStyle=gradient(ctx,-15,0,30,23,[[0,'#ff7960'],[.5,'#df493d'],[1,'#a62a2b']]);
    ctx.beginPath();ctx.moveTo(-15,-1);ctx.quadraticCurveTo(0,6,15,-1);ctx.lineTo(11,20);ctx.quadraticCurveTo(0,25,-11,20);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#ffb097';ctx.beginPath();ctx.moveTo(-12,4);ctx.lineTo(-9,18);ctx.stroke();
    ctx.fillStyle='#ffe9a0';ctx.beginPath();ctx.ellipse(0,12,5,6,-.15,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d3a24e';ctx.beginPath();ctx.arc(-1,11,1,0,Math.PI*2);ctx.arc(2,14,.7,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function draw(ctx,canvas,state,portrait) {
    const {maze,player,visited,time=0,moving=false,previous=player,progress=1,celebrate=false}=state;
    if(!maze)return;
    const size=canvas.width,tile=size/maze.size;
    ctx.clearRect(0,0,size,size);
    ctx.fillStyle=gradient(ctx,0,0,size,size,[[0,'#e0d4b5'],[.5,'#c9bd9b'],[1,'#b3ad8d']]);ctx.fillRect(0,0,size,size);
    // Inlaid stone paths, grout, and small deterministic flecks.
    for(let y=0;y<maze.size;y++)for(let x=0;x<maze.size;x++) {
      if(maze.grid[y][x]!==0)continue;
      const px=x*tile,py=y*tile;
      ctx.fillStyle=gradient(ctx,px,py,tile,tile,[[0,hash(x,y)>.5?'#e9dfc5':'#e0d6bc'],[1,'#c8bda0']]);
      rounded(ctx,px+tile*.035,py+tile*.035,tile*.93,tile*.93,tile*.07);ctx.fill();
      ctx.strokeStyle='#f3ead566';ctx.lineWidth=Math.max(1,tile*.025);ctx.stroke();
      for(let j=0;j<3;j++){ctx.fillStyle='#a39a7b55';ctx.fillRect(px+hash(x,y,j+1)*tile*.8,py+hash(y,x,j+7)*tile*.8,tile*.035,tile*.022);}
      if(visited.has(`${x},${y}`)&&!(player.x===x&&player.y===y)) {
        ctx.fillStyle='#6a806a88';ctx.beginPath();ctx.ellipse(px+tile*.43,py+tile*.5,tile*.035,tile*.065,-.35,0,Math.PI*2);ctx.ellipse(px+tile*.57,py+tile*.58,tile*.035,tile*.065,-.35,0,Math.PI*2);ctx.fill();
      }
    }
    // Raised limestone hedges with cast shadows and planted tops.
    for(let y=0;y<maze.size;y++)for(let x=0;x<maze.size;x++) {
      if(maze.grid[y][x]!==1)continue;
      const px=x*tile,py=y*tile,edge=tile*.055;
      ctx.fillStyle='#243f3440';rounded(ctx,px+tile*.12,py+tile*.14,tile*.96,tile*.96,tile*.09);ctx.fill();
      ctx.fillStyle=gradient(ctx,px,py,0,tile,[[0,'#687d58'],[1,'#3d5948']]);
      rounded(ctx,px+edge,py+tile*.06,tile-edge*2,tile*.91,tile*.095);ctx.fill();
      ctx.fillStyle=gradient(ctx,px,py,tile,tile,[[0,'#b9c29a'],[.38,'#9eae7c'],[1,'#718d62']]);
      rounded(ctx,px+edge,py-tile*.015,tile-edge*2,tile*.77,tile*.095);ctx.fill();
      ctx.strokeStyle='#e4e5ba66';ctx.lineWidth=Math.max(1,tile*.025);ctx.stroke();
      ctx.fillStyle='#536e4e88';ctx.fillRect(px+tile*.3,py+tile*.16,tile*.025,tile*.35);
      for(let j=0;j<4;j++) {
        const lx=px+( .2+hash(x,y,j+18)*.62)*tile,ly=py+(.12+hash(y,x,j+22)*.39)*tile;
        ctx.save();ctx.translate(lx,ly);ctx.rotate(hash(x,y,j+32)*3);
        ctx.fillStyle=j%2?'#597b50':'#7e9f64';ctx.beginPath();ctx.ellipse(0,0,tile*.11,tile*.045,0,0,Math.PI*2);ctx.fill();ctx.restore();
      }
      if(hash(x,y,54)>.87){ctx.fillStyle=hash(x,y,12)>.5?'#e7b3aa':'#edd68d';ctx.beginPath();ctx.arc(px+tile*.65,py+tile*.38,tile*.048,0,Math.PI*2);ctx.fill();}
    }
    // The fry is visible on every frame, at every distance.
    fry(ctx,(maze.target.x+.5)*tile,(maze.target.y+.5)*tile,Math.max(tile,size/19),time);
    const ease=1-Math.pow(1-Math.min(1,progress),3);
    const px=previous.x+(player.x-previous.x)*ease,py=previous.y+(player.y-previous.y)*ease;
    const cx=(px+.5)*tile,cy=(py+.5)*tile;
    if(portrait.complete&&portrait.naturalWidth>0) {
      const height=tile*1.85,width=height*portrait.naturalWidth/portrait.naturalHeight;
      const bob=moving?Math.sin(time*23)*tile*.035:0;
      ctx.save();ctx.translate(cx,cy+bob);ctx.rotate(moving?Math.sin(time*18)*.035:0);
      ctx.shadowColor='#142f3455';ctx.shadowBlur=tile*.07;ctx.shadowOffsetY=tile*.03;
      ctx.drawImage(portrait,-width/2,-height*.77,width,height);ctx.restore();
    }
    if(celebrate)for(let i=0;i<18;i++) {
      const a=time*(.4+i*.025)+i*2.399,r=size*(.12+(i%5)*.05);
      ctx.fillStyle=['#f8d477','#f19d87','#92b9a1'][i%3];
      ctx.fillRect(size*.5+Math.cos(a)*r,size*.5+Math.sin(a)*r,tile*.13,tile*.2);
    }
    const vignette=ctx.createRadialGradient(size*.5,size*.4,size*.2,size*.5,size*.5,size*.72);
    vignette.addColorStop(0,'#173c2e00');vignette.addColorStop(1,'#173c2e38');ctx.fillStyle=vignette;ctx.fillRect(0,0,size,size);
  }
  root.PotatoArt={draw};
})(window);
