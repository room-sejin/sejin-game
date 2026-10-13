/* Look of the later doll stages (friend, shopkeeper, parkfriend, angel), drawn in code until pictures exist.
   Loaded after game.js and uses its helpers (ctx, rr, circle, yarnBall, cone, spool, INK, SHADE, viewWidth, viewHeight).
   Rules stay in runner.js; a theme only decides how each rule kind looks:
   cone/awl/strand = low things (one jump), scissors/triangle = tall, ruler = long (double jump),
   ball = rolls in fast, hang = hangs from above (dash under), pit = gap in the floor, platform = ledge.
   Walls, floor and props scroll with the runner (S = distance × 50); only far sky layers move slower. */
(()=>{
 'use strict';
 const W=()=>viewWidth;
 const hash=i=>{const s=Math.sin(i*127.1+31.7)*43758.5453;return s-Math.floor(s);};
 // Repeat a decoration every `step` px of the scrolling scene; draw(x, index).
 function every(S,step,draw,speed=1){const off=S*speed;for(let k=Math.floor(off/step)-1;k*step-off<W()+step;k++)draw(k*step-off,k);}
 function stripes(a,b,w,S,top,bottom){ctx.fillStyle=a;ctx.fillRect(0,top,W(),bottom-top);ctx.fillStyle=b;for(let x=-(S%(2*w));x<W();x+=2*w)ctx.fillRect(x,top,w,bottom-top);}
 function puff(x,y,w,h,fill,stroke=INK,lw=1.6){ // soft cloud / bush: overlapping bumps resting on y (bottom)
  const n=Math.max(2,Math.round(w/Math.max(18,h*.7))),r=Math.min(h*.5,w/(n+1)*.9),shapes=[];
  for(let i=0;i<n;i++){const t=n===1?.5:i/(n-1),cx=x+r+(w-2*r)*t,lift=Math.sin(t*Math.PI)*(h-2*r)*.9;shapes.push([cx,y-r-lift,r*(1+.12*Math.sin(i*2.1))]);}
  const base=()=>{ctx.beginPath();ctx.roundRect(x,y-r*1.2,w,r*1.2,[0,0,r*.5,r*.5]);};
  // Outline first (thick), then fill on top: only the outer edge of the bumps stays visible.
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw*2;for(const [cx,cy,cr] of shapes){ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.stroke();}base();ctx.stroke();}
  ctx.fillStyle=fill;for(const [cx,cy,cr] of shapes){ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.fill();}base();ctx.fill();
 }
 function cloud(x,y,w,h,fill='#fff',stroke=INK){ // floating cloud, (x,y) = top-left
  ctx.beginPath();ctx.roundRect(x,y+h*.35,w,h*.65,h*.32);ctx.fillStyle=fill;ctx.fill();
  for(const [fx,fy,fr] of [[.25,.45,.3],[.5,.3,.36],[.75,.45,.28]]){ctx.beginPath();ctx.arc(x+w*fx,y+h*fy+h*.1,h*fr,0,Math.PI*2);ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.4;ctx.beginPath();ctx.roundRect(x,y+h*.35,w,h*.65,h*.32);ctx.stroke();}
 }
 function face(x,y,s=1,sleepy=false){ctx.strokeStyle=INK;ctx.fillStyle=INK;ctx.lineWidth=1.4;
  if(sleepy){ctx.beginPath();ctx.moveTo(x-7*s,y);ctx.lineTo(x-3*s,y);ctx.moveTo(x+3*s,y);ctx.lineTo(x+7*s,y);ctx.stroke();}
  else{circle(ctx,x-5*s,y,1.7*s,INK);circle(ctx,x+5*s,y,1.7*s,INK);}
  circle(ctx,x-9*s,y+4*s,2.4*s,'#f2a7b588');circle(ctx,x+9*s,y+4*s,2.4*s,'#f2a7b588');}
 function star(x,y,r,fill,rot=0){ctx.beginPath();for(let i=0;i<10;i++){const a=rot-Math.PI/2+i*Math.PI/5,rr_=i%2?r*.48:r;ctx.lineTo(x+Math.cos(a)*rr_,y+Math.sin(a)*rr_);}ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.stroke();}
 function book(x,y,w,h,c){rr(ctx,x,y,w,h,2,c,INK,1.3);ctx.fillStyle='#fffaf0';ctx.fillRect(x+w-5,y+2,3,h-4);}
 function woodFloor(floor,S,tones=['#efdcc3','#ecd8bd','#f2e1ca','#e9d4b8'],lip='#e3cfb6'){
  ctx.fillStyle=lip;ctx.fillRect(0,floor-17,W(),17);const ROW=26,P=210;
  for(let r=0,y=floor;y<viewHeight;r++,y+=ROW){const off=hash(r+7)*P;for(let k=Math.floor((S+off)/P);;k++){const x=k*P-off-S;if(x>W())break;ctx.fillStyle=tones[Math.floor(hash(r*31+k)*tones.length)];ctx.fillRect(x,y,P,ROW);ctx.strokeStyle='rgba(190,160,128,.5)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y+2);ctx.lineTo(x,y+ROW-2);ctx.stroke();}}
 }
 const hangTop=(o,floor)=>floor-o.bottom;   // screen y of a hanging obstacle's lowest edge

 const THEMES={
  // ---- 친구 인형: 친구네 집 거실 (lavender living room) ----
  friend:{
   bg(S,floor){
    stripes('#f3ecf9','#ebe1f5',34,S,0,floor-17);
    const rail=floor-17-58;ctx.fillStyle='#f7f0e6';ctx.fillRect(0,rail,W(),58);ctx.fillStyle='#e6d8c6';ctx.fillRect(0,rail-4,W(),5);
    every(S,520,(x,k)=>{const top=rail-250;
     if(k%3===0){rr(ctx,x+60,top,150,170,[75,75,6,6],'#e2d3bf',INK);rr(ctx,x+70,top+10,130,152,[65,65,3,3],'#d4ebef');cloud(x+95,top+60,60,28,'#fbfdfd',null);
      for(const s of [0,1]){const cx=s?x+205:x+55;ctx.fillStyle='#8fc3e0';ctx.beginPath();ctx.moveTo(cx-18,top-8);ctx.lineTo(cx+18,top-8);ctx.quadraticCurveTo(cx+(s?-4:4),top+90,cx+(s?4:-4),top+182);ctx.lineTo(cx-18+(s?14:0),top+182);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.3;ctx.stroke();}}
     else if(k%3===1){rr(ctx,x+70,top+30,90,110,4,'#d9bf9c',INK);rr(ctx,x+78,top+38,74,94,2,'#fff7f0');circle(ctx,x+115,top+78,20,'#f2a7b5',INK);circle(ctx,x+115,top+78,7,'#f5d58a');
      rr(ctx,x+185,top+60,60,74,4,'#d9bf9c',INK);rr(ctx,x+191,top+66,48,62,2,'#eef7ea');puff(x+198,top+118,34,26,'#a9cfa4');}
     else{rr(ctx,x+50,top+120,200,10,3,'#dcc4a4',INK);book(x+70,top+86,14,34,'#c9b3e6');book(x+86,top+92,12,28,'#8fc3e0');book(x+100,top+88,14,32,'#f2a7b5');
      rr(ctx,x+170,top+96,34,24,[2,2,8,8],'#e3a88a',INK);puff(x+160,top+100,54,36,'#a9cfa4');yarnBall(ctx,x+226,top+108,11,'#f5d58a');}
    });
   },
   floor(S,floor){woodFloor(floor,S);ctx.fillStyle='#c9b3e633';every(S,900,x=>{ctx.beginPath();ctx.ellipse(x+300,floor+40,260,28,0,0,Math.PI*2);ctx.fill();});},
   ledge(x,y,w){rr(ctx,x,y,w,14,4,'#dcc4a4',INK,1.8);for(let bx=x+30;bx<x+w-20;bx+=120){ctx.beginPath();ctx.moveTo(bx,y+14);ctx.lineTo(bx+16,y+14);ctx.lineTo(bx,y+34);ctx.closePath();ctx.fillStyle='#d2b894';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.stroke();}},
   prop(o,floor){const x=o.x,w=o.w,h=o.h,c=o.color;
    if(o.kind==='cone'){rr(ctx,x,floor-h,w,h,16,c,INK,1.8);ctx.strokeStyle='#ffffff99';ctx.setLineDash([3,4]);rr(ctx,x+5,floor-h+5,w-10,h-10,12,null,'#ffffffaa',1.2);ctx.setLineDash([]);circle(ctx,x+w/2,floor-h/2,4,'#fffaf0',INK,1);return;}
    if(o.kind==='awl'){circle(ctx,x+w/2,floor-26,24,c,INK,1.8);rr(ctx,x+w/2-12,floor-56,24,10,4,c,INK);circle(ctx,x+w/2,floor-60,4,'#f5d58a',INK,1);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+w-6,floor-30);ctx.quadraticCurveTo(x+w+8,floor-40,x+w+10,floor-52);ctx.stroke();ctx.strokeStyle=c;ctx.lineWidth=3;ctx.stroke();return;}
    if(o.kind==='strand'){book(x,floor-10,w,10,'#8fc3e0');book(x+6,floor-20,w-12,10,c);return;}
    if(o.kind==='scissors'){rr(ctx,x+w/2-16,floor-8,32,8,3,'#c9a27e',INK);ctx.strokeStyle=INK;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+w/2,floor-8);ctx.lineTo(x+w/2,floor-h+34);ctx.stroke();ctx.strokeStyle='#d9bf9c';ctx.lineWidth=3;ctx.stroke();
     ctx.beginPath();ctx.moveTo(x+4,floor-h+36);ctx.lineTo(x+w-4,floor-h+36);ctx.lineTo(x+w-12,floor-h);ctx.lineTo(x+12,floor-h);ctx.closePath();ctx.fillStyle='#fff3c9';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.8;ctx.stroke();return;}
    if(o.kind==='triangle'){let y=floor;const cs=['#c9b3e6','#8fc3e0','#f2a7b5','#a9cfa4','#f5d58a','#c9b3e6'];for(let i=0;i<6;i++){const bw=w-(i%2?10:0)-i*4,bh=h/6;book(x+(w-bw)/2+(i%2?4:-2),y-bh,bw,bh,cs[i]);y-=bh;}return;}
    if(o.kind==='ruler'){rr(ctx,x,floor-h,w,12,5,'#dcc4a4',INK,1.8);for(const lx of [x+12,x+w-22])rr(ctx,lx,floor-h+12,10,h-12,2,'#c9a27e',INK,1.2);
     rr(ctx,x+40,floor-h-12,20,12,[2,2,5,5],'#fff',INK,1.2);rr(ctx,x+140,floor-h-12,20,12,[2,2,5,5],'#fff',INK,1.2);circle(ctx,x+95,floor-h-6,7,'#f5d58a',INK,1.2);return;}
    return false;},
   hang(o,floor){const b=hangTop(o,floor),cx=o.x+o.w/2;ctx.strokeStyle='#cdb9a2';ctx.lineWidth=1.5;ctx.beginPath();for(const f of [.2,.5,.8]){ctx.moveTo(o.x+o.w*f,0);ctx.lineTo(o.x+o.w*f,b-40);}ctx.stroke();
    rr(ctx,o.x,b-44,o.w,10,4,'#dcc4a4',INK,1.5);for(let i=0;i<4;i++){const px=o.x+10+(o.w-20)*i/3;ctx.strokeStyle='#cdb9a2';ctx.beginPath();ctx.moveTo(px,b-34);ctx.lineTo(px,b-18);ctx.stroke();star(px,b-10,9,['#f5d58a','#f2a7b5','#8fc3e0','#c9b3e6'][i],0);}}
  },
  // ---- 실 가게 사장님: 실 가게 (pink yarn shop) ----
  shopkeeper:{
   bg(S,floor){
    stripes('#fcecf0','#f8e1e7',40,S,0,floor-17);
    every(S,36,(x,k)=>{ctx.fillStyle=k%2?'#fff':'#f2a7b5';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+36,0);ctx.lineTo(x+36,8);ctx.arc(x+18,8,18,0,Math.PI);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.stroke();});
    // Back shelves are faded so they read as scenery, not as obstacles.
    const base=floor-17;ctx.save();ctx.globalAlpha=.55;every(S,440,(x,k)=>{const top=base-260;
     rr(ctx,x+40,top,300,250,6,'#f7dde4',INK);for(const y of [top+80,top+160,top+240]){rr(ctx,x+40,y,300,10,3,'#dcc4a4',INK,1.3);}
     for(let i=0;i<5;i++){cone(ctx,x+54+i*56,top+80,34,52,['#8fc3e0','#f2a7b5','#a9cfa4','#f5d58a','#c9b3e6'][(i+k)%5]);}
     for(let i=0;i<6;i++)yarnBall(ctx,x+68+i*48,top+146,14,['#f2a7b5','#c9b3e6','#8fc3e0','#f5d58a','#a9cfa4'][(i+k*2)%5]);
     for(let i=0;i<4;i++)rr(ctx,x+60+i*70,top+200,50,40,4,['#fff7f0','#fdeef1'][i%2],INK,1.2);
    });ctx.restore();
   },
   floor(S,floor){ctx.fillStyle='#e8cdd4';ctx.fillRect(0,floor-17,W(),17);// Each tile's colour follows its place on the floor (k = tile number), so tiles slide by without blinking.
    const T=40;for(let y=floor,r=0;y<viewHeight;y+=T,r++)for(let k=Math.floor(S/T);k*T-S<W();k++){ctx.fillStyle=(k+r)%2?'#fbf0f3':'#f4dde3';ctx.fillRect(k*T-S,y,T+.5,T);}},
   pit(o,floor){rr(ctx,o.x,floor-17,o.w,viewHeight-floor+17,0,'#6d5a55');ctx.strokeStyle='#c9a27e';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(o.x+3,floor-17);ctx.lineTo(o.x+3,viewHeight);ctx.moveTo(o.x+o.w-3,floor-17);ctx.lineTo(o.x+o.w-3,viewHeight);ctx.stroke();
    ctx.fillStyle='#f5d58a';for(let x=o.x+8;x<o.x+o.w-16;x+=24){ctx.beginPath();ctx.moveTo(x,floor-22);ctx.lineTo(x+12,floor-22);ctx.lineTo(x+6,floor-32);ctx.closePath();ctx.fill();}},
   ledge(x,y,w){rr(ctx,x,y,w,14,4,'#f6c9d3',INK,1.8);rr(ctx,x+6,y+14,w-12,8,[0,0,4,4],'#fff7f0',INK,1.2);},
   prop(o,floor){const x=o.x,w=o.w,h=o.h,c=o.color;
    if(o.kind==='cone')return cone(ctx,x,floor,w,h,c);
    if(o.kind==='strand')return false;   // classic spools with a thread
    if(o.kind==='awl'){yarnBall(ctx,x+14,floor-44,11,'#f2a7b5');yarnBall(ctx,x+32,floor-46,12,'#8fc3e0');yarnBall(ctx,x+24,floor-56,10,c);rr(ctx,x,floor-42,w,42,[4,4,10,10],'#e6c9a0',INK,1.8);ctx.strokeStyle='rgba(150,110,80,.4)';ctx.lineWidth=1.2;ctx.beginPath();for(let xx=x+8;xx<x+w;xx+=8){ctx.moveTo(xx,floor-40);ctx.lineTo(xx,floor-2);}ctx.moveTo(x+2,floor-22);ctx.lineTo(x+w-2,floor-22);ctx.stroke();return;}
    if(o.kind==='scissors'||o.kind==='triangle'){const n=o.kind==='scissors'?3:4,bh=h/n;for(let i=0;i<n;i++){const bw=w-(i%2?6:0);rr(ctx,x+(w-bw)/2,floor-(i+1)*bh,bw,bh-1,4,['#fff7f0','#fdeef1','#f5ecff','#eef7ea'][i],INK,1.5);yarnBall(ctx,x+w/2,floor-i*bh-bh/2,Math.min(bh,bw)*.28,['#8fc3e0','#f2a7b5','#f5d58a','#a9cfa4'][(i+(c.length))%4]);}return;}
    if(o.kind==='ruler'){rr(ctx,x,floor-h,w,h,5,'#f6c9d3',INK,1.8);rr(ctx,x-4,floor-h-6,w+8,8,3,'#dcc4a4',INK,1.4);for(let dx=x+16;dx<x+w-30;dx+=46)rr(ctx,dx,floor-h+10,34,16,3,'#fff7f0',INK,1);return;}
    return false;},
   hang(o,floor){const b=hangTop(o,floor);ctx.strokeStyle='#caa98d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x,4);ctx.lineTo(o.x+o.w,4);ctx.stroke();
    for(let i=0;i<Math.max(3,Math.round(o.w/26));i++){const px=o.x+12+i*26;if(px>o.x+o.w-6)break;const col=['#f2a7b5','#8fc3e0','#f5d58a','#a9cfa4','#c9b3e6'][i%5];
     ctx.strokeStyle=INK;ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(px,4);ctx.lineTo(px,b-10);ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=6;ctx.stroke();ctx.beginPath();ctx.ellipse(px,b-8,7,9,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.3;ctx.stroke();}}
  },
  // ---- 공원 친구: 공원 (park with pond) ----
  parkfriend:{
   bg(S,floor){
    const g=ctx.createLinearGradient(0,0,0,floor);g.addColorStop(0,'#d7eef8');g.addColorStop(1,'#f4fbef');ctx.fillStyle=g;ctx.fillRect(0,0,W(),floor);
    every(S,340,(x,k)=>cloud(x+40,30+hash(k)*50,90+hash(k+2)*40,40,'#fff',null),.25);
    every(S,300,(x,k)=>{ctx.fillStyle='#cfe7c2';ctx.beginPath();ctx.ellipse(x+150,floor-17,210,70+hash(k)*40,0,Math.PI,0);ctx.fill();},.5);
    // (background trees removed at the user's request)

   },
   floor(S,floor){ctx.fillStyle='#e9d9bb';ctx.fillRect(0,floor-17,W(),viewHeight-floor+17);ctx.fillStyle='#a9d69a';ctx.fillRect(0,floor-17,W(),14);ctx.strokeStyle=INK;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(0,floor-3);ctx.lineTo(W(),floor-3);ctx.stroke();
    every(S,40,(x,k)=>{ctx.strokeStyle='#7fb07a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+10,floor-17);ctx.lineTo(x+7,floor-25);ctx.moveTo(x+14,floor-17);ctx.lineTo(x+16,floor-26);ctx.stroke();if(k%4===0)circle(ctx,x+20,floor+20+hash(k)*40,3,'#d6c3a4');});},
   pit(o,floor){const top=floor-10;ctx.fillStyle='#8fc3e0';ctx.beginPath();ctx.roundRect(o.x,top,o.w,viewHeight-top,[14,14,0,0]);ctx.fill();ctx.fillStyle='#b8dcef';ctx.fillRect(o.x+6,top+8,o.w-12,10);
    ctx.strokeStyle='#ffffffaa';ctx.lineWidth=2;for(let i=0;i<3;i++){const y=top+28+i*18;ctx.beginPath();ctx.moveTo(o.x+14+i*10,y);ctx.quadraticCurveTo(o.x+o.w/2,y-6,o.x+o.w-14,y);ctx.stroke();}
    for(const ex of [o.x,o.x+o.w])for(let j=0;j<2;j++){ctx.beginPath();ctx.ellipse(ex,floor-10+j*16,12,9,0,0,Math.PI*2);ctx.fillStyle='#d6d2c8';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.stroke();}},
   ledge(x,y,w){rr(ctx,x,y,w,18,9,'#c9a27e',INK,1.8);ctx.strokeStyle='rgba(120,80,50,.35)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+14,y+9);ctx.lineTo(x+w-14,y+9);ctx.stroke();for(const ex of [x+9,x+w-9]){ctx.beginPath();ctx.ellipse(ex,y+9,6,9,0,0,Math.PI*2);ctx.fillStyle='#e6c9a0';ctx.fill();ctx.strokeStyle=INK;ctx.stroke();}},
   prop(o,floor){const x=o.x,w=o.w,h=o.h,c=o.color;
    if(o.kind==='cone'){puff(x-4,floor,w+8,h*.8,'#a9cfa4');circle(ctx,x+12,floor-h*.5,4,c,INK,1);circle(ctx,x+w-10,floor-h*.4,4,'#fffaf0',INK,1);return;}
    if(o.kind==='awl'){ctx.beginPath();ctx.moveTo(x,floor);ctx.quadraticCurveTo(x-2,floor-h*.7,x+w*.35,floor-h*.8);ctx.quadraticCurveTo(x+w*.7,floor-h,x+w,floor-h*.45);ctx.quadraticCurveTo(x+w+4,floor-4,x+w-4,floor);ctx.closePath();ctx.fillStyle='#d6d2c8';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.8;ctx.stroke();puff(x+6,floor-h*.62,w*.5,14,'#a9cfa4',null);return;}
    if(o.kind==='strand'){ctx.strokeStyle=INK;ctx.lineWidth=1.5;for(let px=x+4;px<x+w;px+=12){rr(ctx,px,floor-h,6,h,2,'#fffaf0',INK,1.2);}rr(ctx,x,floor-h+6,w,4,2,'#fffaf0',INK,1.2);for(let px=x+10;px<x+w;px+=24){circle(ctx,px,floor-h-4,4,c,INK,1);}return;}
    if(o.kind==='ball'){const r=h/2,cx=x+w/2,cy=floor-r,a=reduced?0:-(o.rolled||0)/r;ctx.save();ctx.translate(cx,cy);ctx.rotate(a);const seg=['#f2a7b5','#fffaf0','#8fc3e0','#fffaf0','#f5d58a','#fffaf0'];seg.forEach((s,i)=>{ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,i*Math.PI/3,(i+1)*Math.PI/3);ctx.closePath();ctx.fillStyle=s;ctx.fill();});ctx.restore();circle(ctx,cx,cy,r,null,INK,2);circle(ctx,cx,cy,4,'#fff',INK,1);return;}
    if(o.kind==='scissors'){rr(ctx,x+w/2-5,floor-h,10,h,3,'#c9a27e',INK,1.5);ctx.beginPath();ctx.moveTo(x-6,floor-h+8);ctx.lineTo(x+w-4,floor-h+8);ctx.lineTo(x+w+10,floor-h+22);ctx.lineTo(x+w-4,floor-h+36);ctx.lineTo(x-6,floor-h+36);ctx.closePath();ctx.fillStyle='#fffaf0';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.6;ctx.stroke();circle(ctx,x+10,floor-h+22,4,c);return;}
    if(o.kind==='triangle'){rr(ctx,x+w/2-9,floor-h*.5,18,h*.5,4,'#c9a27e',INK,1.5);puff(x-6,floor-h*.4,w+12,h*.7,'#a9cfa4');circle(ctx,x+w*.3,floor-h*.75,5,c,INK,1);circle(ctx,x+w*.7,floor-h*.65,5,'#f5d58a',INK,1);return;}
    if(o.kind==='ruler'){rr(ctx,x,floor-h,w,10,4,'#c9a27e',INK,1.8);rr(ctx,x+6,floor-h-22,w-12,8,3,'#dcc4a4',INK,1.4);for(const lx of [x+14,x+w-24])rr(ctx,lx,floor-h+10,10,h-10,2,'#8a6f60',INK,1);return;}
    return false;},
   // Willow-like vines hanging from a branch at the top; the leafy ends come down to the hang height.
   hang(o,floor){const b=hangTop(o,floor);rr(ctx,o.x-24,-6,o.w+48,22,10,'#c9a27e',INK,1.8);
    for(let px=o.x+8;px<=o.x+o.w-8;px+=20){ctx.strokeStyle='#7fb07a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(px,14);ctx.quadraticCurveTo(px+(px%40?6:-6),(b+14)/2,px,b-10);ctx.stroke();
     for(let y=40;y<b-16;y+=26){ctx.beginPath();ctx.ellipse(px+5,y,6,3.5,.6,0,Math.PI*2);ctx.fillStyle='#a9cfa4';ctx.fill();}
     ctx.beginPath();ctx.ellipse(px,b-7,7,9,0,0,Math.PI*2);ctx.fillStyle='#a9cfa4';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.stroke();}}
  },
  // ---- 천사 세진이: 구름 길 (the hardest stage) ----
  angel:{
   bg(S,floor){
    const g=ctx.createLinearGradient(0,0,0,floor);g.addColorStop(0,'#fde8f1');g.addColorStop(.5,'#ece6fb');g.addColorStop(1,'#e2f1fb');ctx.fillStyle=g;ctx.fillRect(0,0,W(),floor);
    every(S,120,(x,k)=>{const tw=reduced?1:.6+.4*Math.sin(performance.now()/400+k);ctx.globalAlpha=tw;star(x+hash(k)*100,20+hash(k+9)*(floor*.45),3+hash(k+3)*3,'#fff3c4');ctx.globalAlpha=1;},.2);
    every(S,280,(x,k)=>cloud(x+20,floor*.25+hash(k)*floor*.35,120+hash(k+1)*60,54,'#ffffffcc',null),.45);
    every(S,520,(x,k)=>{const cx=x+260,top=floor-17-230;ctx.strokeStyle='#f5d58a';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(cx,top,34,9,0,0,Math.PI*2);ctx.stroke();
     for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(cx+s*8,top+30);ctx.bezierCurveTo(cx+s*40,top+6,cx+s*70,top+18,cx+s*72,top+38);ctx.quadraticCurveTo(cx+s*60,top+50,cx+s*44,top+48);ctx.quadraticCurveTo(cx+s*30,top+62,cx+s*10,top+52);ctx.closePath();ctx.fillStyle='#fffdf8';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.stroke();}});
   },
   floor(S,floor){ctx.fillStyle='#fdfbff';ctx.fillRect(0,floor-10,W(),viewHeight-floor+10);ctx.fillStyle='#eef0fb';ctx.fillRect(0,floor+30,W(),viewHeight-floor-30);
    every(S,46,(x,k)=>{ctx.beginPath();ctx.arc(x+23,floor-8,20+hash(k)*6,Math.PI,0);ctx.fillStyle='#fdfbff';ctx.fill();ctx.strokeStyle='#d9d4ec';ctx.lineWidth=1.5;ctx.stroke();});},
   pit(o,floor){const g=ctx.createLinearGradient(0,floor-30,0,viewHeight);g.addColorStop(0,'#e9e4fb');g.addColorStop(1,'#cfe6f7');ctx.fillStyle=g;ctx.fillRect(o.x,floor-32,o.w,viewHeight-floor+32);
    star(o.x+o.w*.3,floor+30,4,'#fff3c4');star(o.x+o.w*.7,floor+60,3,'#fff3c4');cloud(o.x+o.w*.2,floor+70,o.w*.6,24,'#ffffffaa',null);},
   ledge(x,y,w){puff(x-6,y+20,w+12,30,'#fff','#bfb6dd',1.4);},
   prop(o,floor){const x=o.x,w=o.w,h=o.h,c=o.color;
    if(o.kind==='cone'||o.kind==='awl'){puff(x-4,floor,w+8,h*.75,'#cfd3dd');face(x+w/2,floor-h*.36,.9,o.kind==='awl');return;}
    if(o.kind==='strand'){ctx.lineWidth=5;['#f2a7b5','#f5d58a','#a9cfa4','#8fc3e0'].forEach((col,i)=>{ctx.strokeStyle=col;ctx.beginPath();ctx.arc(x+w/2,floor,w/2-i*5,Math.PI,0);ctx.stroke();});puff(x-10,floor,26,14,'#fff');puff(x+w-16,floor,26,14,'#fff');return;}
    if(o.kind==='ball'){star(x+w/2,floor-h/2,h/2+4,'#f5d58a',reduced?0:-(o.rolled||0)/(h/2));face(x+w/2,floor-h/2+2,.6);return;}
    if(o.kind==='scissors'){for(let i=0;i<3;i++)puff(x-8,floor-i*h/3,w+16,h/3+14,['#c5c9d6','#d0d4df','#dadde7'][i]);face(x+w/2,floor-h*.78,.8,true);return;}
    if(o.kind==='triangle'){puff(x-6,floor,w+12,h,'#c5c9d6');face(x+w/2,floor-h*.5,1.1);return;}
    if(o.kind==='ruler'){puff(x-6,floor,w+12,h+8,'#cfd3dd');face(x+w*.3,floor-h*.45,.7,true);face(x+w*.7,floor-h*.45,.7);return;}
    return false;},
   // A column of grey storm clouds hanging down, sleepy face at the bottom and a little spark.
   hang(o,floor){const b=hangTop(o,floor),r=16,n=Math.max(3,Math.round(o.w/(r*1.6)));
    const bumps=[...Array(n)].map((_,i)=>[o.x+r+(o.w-2*r)*i/(n-1),b-r-(i%2)*4]),body=()=>{ctx.beginPath();ctx.roundRect(o.x,-20,o.w,b-r+20,[0,0,12,12]);};
    ctx.strokeStyle=INK;ctx.lineWidth=2.6;body();ctx.stroke();for(const [bx,by] of bumps){ctx.beginPath();ctx.arc(bx,by,r,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#b8bccb';body();ctx.fill();for(const [bx,by] of bumps){ctx.beginPath();ctx.arc(bx,by,r,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#c9ccd8';for(let y=30;y<b-50;y+=70)for(let i=0;i<2;i++){ctx.beginPath();ctx.arc(o.x+o.w*(.3+.4*i),y+i*24,14,0,Math.PI*2);ctx.fill();}
    face(o.x+o.w/2,b-24,1,true);
    ctx.strokeStyle='#f5d58a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(o.x+o.w*.3,b-12);ctx.lineTo(o.x+o.w*.38,b-4);ctx.lineTo(o.x+o.w*.3,b-2);ctx.lineTo(o.x+o.w*.4,b+6);ctx.stroke();}
  },
 };
 window.RunnerThemes=THEMES;
})();
