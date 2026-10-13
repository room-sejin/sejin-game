'use strict';
// Keep the world texture intact; finish only the exposed cut, without a second cap texture.
function makeFloorTile(image,box){
 const tile=document.createElement('canvas');tile.width=600;tile.height=122;
 const ctx=tile.getContext('2d'),cap=70;
 ctx.drawImage(image,box[0]+cap,box[1],box[2]-2*cap,box[3],0,0,600,122);
 return {image:tile,pixels:ctx.getImageData(0,0,600,122).data};
}
function drawFinishedFloor(ctx,tile,offset,floor,showGap){
 const hole=650-offset,spans=showGap?[[-Infinity,hole],[hole+120,Infinity]]:[[-Infinity,Infinity]];
 for(const [a,b] of spans){
  if(b<=0||a>=960)continue;
  ctx.save();ctx.beginPath();ctx.rect(Math.max(0,a),floor,Math.min(960,b)-Math.max(0,a),122);ctx.clip();
  for(let q=Math.floor(offset/600)-1;q*600-offset<960;q++)ctx.drawImage(tile.image,q*600-offset,floor,600,122);
  for(const [edge,inward] of [[a,1],[b,-1]]){
   if(!Number.isFinite(edge)||edge<0||edge>960)continue;
   let top=-1,bottom=122;
   for(let k=0;k<5;k++){
    const column=((Math.floor(edge+offset+inward*(k+.5))%600)+600)%600;
    let columnTop=-1,columnBottom=-1;
    for(let y=0;y<122;y++)if(tile.pixels[(y*600+column)*4+3]>160){if(columnTop<0)columnTop=y;columnBottom=y;}
    top=Math.max(top,columnTop);bottom=Math.min(bottom,columnBottom);
   }
   if(top<0)continue;
   ctx.strokeStyle='#82502d';ctx.lineWidth=3;ctx.lineCap='round';
   ctx.beginPath();ctx.moveTo(edge+inward*1.5,floor+top+1.5);ctx.lineTo(edge+inward*1.5,floor+bottom-1.5);ctx.stroke();
  }
  ctx.restore();
 }
}
function drawCleanLowerBackground(ctx,floor,palette){
 const fill=ctx.createLinearGradient(0,floor,0,540);fill.addColorStop(0,palette[0]);fill.addColorStop(1,palette[1]);
 ctx.fillStyle=fill;ctx.fillRect(0,floor,960,540-floor);
}
