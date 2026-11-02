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
  function cactus(ctx,x,y,tile,time) {
    const scale=tile/34;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(Math.sin(time*3+x)*.05);
    ctx.shadowColor='#2b342b66';ctx.shadowBlur=3;ctx.shadowOffsetY=2;
    ctx.strokeStyle='#286642';ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=7;
    ctx.beginPath();ctx.moveTo(-7,3);ctx.lineTo(-13,3);ctx.lineTo(-13,-6);ctx.moveTo(7,0);ctx.lineTo(12,0);ctx.lineTo(12,-9);ctx.stroke();
    ctx.fillStyle=gradient(ctx,-8,-17,16,34,[[0,'#8bbc69'],[.4,'#4a9753'],[1,'#286240']]);
    rounded(ctx,-8,-17,16,34,7);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    ctx.strokeStyle='#b9d880';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-4,-11);ctx.lineTo(-4,11);ctx.moveTo(4,-11);ctx.lineTo(4,11);ctx.stroke();
    ctx.fillStyle='#ee7364';ctx.beginPath();ctx.moveTo(-7,-8);ctx.lineTo(-1,-5);ctx.lineTo(-7,-3);ctx.moveTo(7,-8);ctx.lineTo(1,-5);ctx.lineTo(7,-3);ctx.fill();
    ctx.fillStyle='#152c25';rounded(ctx,-5,1,10,8,3);ctx.fill();
    ctx.fillStyle='#fff1cb';ctx.beginPath();ctx.moveTo(-4,1);ctx.lineTo(-1,1);ctx.lineTo(-2.5,6);ctx.moveTo(1,1);ctx.lineTo(4,1);ctx.lineTo(2.5,6);ctx.fill();
    ctx.strokeStyle='#e6d69c';ctx.lineWidth=1.2;ctx.beginPath();
    for(const[a,b]of[[-8,-9],[-8,9],[8,-12],[8,11],[-15,-4],[14,-8]]){ctx.moveTo(a,b);ctx.lineTo(a+Math.sign(a)*3,b-2);}ctx.stroke();
    ctx.fillStyle='#d8818b';ctx.beginPath();ctx.arc(1,-18,3,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function gateArt(ctx,x,y,tile,open,time) {
    const w=tile*.85;
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle='#526459';rounded(ctx,-w/2-tile*.06,-tile*.4,tile*.13,tile*.8,tile*.04);ctx.fill();
    rounded(ctx,w/2-tile*.07,-tile*.4,tile*.13,tile*.8,tile*.04);ctx.fill();
    if(!open){
      ctx.strokeStyle='#a88b59';ctx.lineWidth=tile*.09;ctx.beginPath();
      for(let i=0;i<4;i++){const dx=-w*.34+i*w*.225;ctx.moveTo(dx,-tile*.3);ctx.lineTo(dx,tile*.3);}ctx.moveTo(-w/2,-tile*.15);ctx.lineTo(w/2,-tile*.15);ctx.moveTo(-w/2,tile*.15);ctx.lineTo(w/2,tile*.15);ctx.stroke();
    }
    ctx.fillStyle=open?'#b9e0a0':'#edaa73';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=tile*.16;
    ctx.beginPath();ctx.arc(-w/2,-tile*.36,tile*.06,0,Math.PI*2);ctx.arc(w/2,-tile*.36,tile*.06,0,Math.PI*2);ctx.fill();ctx.restore();
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
    const palettes=[
      ['#b9c29a','#9eae7c','#718d62','#687d58','#3d5948','#e9dfc5','#e0d6bc','#c8bda0'],
      ['#e0c28e','#c5a071','#9c7a57','#ad8964','#705a46','#f0dfb9','#e5ceaa','#cfb18c'],
      ['#a9c7b7','#80a99c','#567f79','#60877f','#355b57','#dce6d7','#d1decc','#b3c7bb'],
      ['#c3b7c7','#9f8eaa','#786c86','#897b8d','#595165','#e8d9d1','#ddc9c1','#bda9a4'],
      ['#a4bbb6','#7b9c98','#4f7472','#587e7b','#314f52','#dfd6c1','#d0c5b3','#b4a994']
    ];
    const colors=palettes[maze.levelIndex||0];
    ctx.clearRect(0,0,size,size);
    ctx.fillStyle=gradient(ctx,0,0,size,size,[[0,'#e0d4b5'],[.5,'#c9bd9b'],[1,'#b3ad8d']]);ctx.fillRect(0,0,size,size);
    // Inlaid stone paths, grout, and small deterministic flecks.
    for(let y=0;y<maze.size;y++)for(let x=0;x<maze.size;x++) {
      if(maze.grid[y][x]!==0)continue;
      const px=x*tile,py=y*tile;
      ctx.fillStyle=gradient(ctx,px,py,tile,tile,[[0,hash(x,y)>.5?colors[5]:colors[6]],[1,colors[7]]]);
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
      ctx.fillStyle=gradient(ctx,px,py,0,tile,[[0,colors[3]],[1,colors[4]]]);
      rounded(ctx,px+edge,py+tile*.06,tile-edge*2,tile*.91,tile*.095);ctx.fill();
      ctx.fillStyle=gradient(ctx,px,py,tile,tile,[[0,colors[0]],[.38,colors[1]],[1,colors[2]]]);
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
    for(const gate of maze.gates||[])gateArt(ctx,(gate.x+.5)*tile,(gate.y+.5)*tile,tile,root.PotatoMaze.isGateOpen(gate,state.elapsed||0),time);
    for(const monster of maze.hazards||[])cactus(ctx,(monster.x+.5)*tile,(monster.y+.5)*tile,Math.max(tile,size/24),time);
    // The fry is visible on every frame, at every distance.
    fry(ctx,(maze.target.x+.5)*tile,(maze.target.y+.5)*tile,Math.max(tile,size/19),time);
    const ease=1-Math.pow(1-Math.min(1,progress),3);
    const px=previous.x+(player.x-previous.x)*ease,py=previous.y+(player.y-previous.y)*ease;
    const cx=(px+.5)*tile,cy=(py+.5)*tile;
    if(portrait.complete&&portrait.naturalWidth>0) {
      const height=Math.max(tile*1.85,size/18),width=height*portrait.naturalWidth/portrait.naturalHeight;
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
    if(state.hurt){ctx.fillStyle='#bb493f44';ctx.fillRect(0,0,size,size);}
    const vignette=ctx.createRadialGradient(size*.5,size*.4,size*.2,size*.5,size*.5,size*.72);
    vignette.addColorStop(0,'#173c2e00');vignette.addColorStop(1,'#173c2e38');ctx.fillStyle=vignette;ctx.fillRect(0,0,size,size);
  }
  root.PotatoArt={draw};
})(window);
