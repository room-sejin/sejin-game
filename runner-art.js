/* Picture version of the later doll stages (ChatGPT sprite sheets cut into assets/runner/*.png and bg-*.jpg).
   Loaded after runner-themes.js. For every theme it swaps the code-drawn scene for pictures once they have loaded;
   until then (or if a picture is missing) the old code drawing is used. Rules and hit boxes stay in runner.js.
   Sprite sets: home = 친구 인형(lavender living room), shop = 실 가게 사장님, park = 공원 친구, angel = 천사 세진이, work = 세진이 작업실.
   Drawing helpers come from game.js (ctx, viewWidth, viewHeight, reduced, runner). */
(()=>{
 'use strict';
 // Picture backgrounds are OFF for now (placeholder code-drawn scenes are used until new pictures are made). Preview them with knit.html?art=on, switch off with ?art=off.
 const qa=new URLSearchParams(location.search).get('art');try{if(qa==='on')localStorage.removeItem('sejin-runner-art');if(qa==='off')localStorage.setItem('sejin-runner-art','off');}catch(e){}
 const enabled=(()=>{try{return localStorage.getItem('sejin-runner-art')!=='off';}catch(e){return true;}})();   // 기본으로 켜짐(?art=off 로 끌 수 있음)
 if(!enabled||!window.RunnerThemes){window.RunnerArt=null;return;}
 const cache={};
 // 장애물마다 한 번 정하는 '무작위' — 편집기처럼 장애물 객체가 매 프레임 새로 만들어져도 같은 값이 나오게, 위치(seed)가 있으면 그것으로 고정한다(깜빡임 방지)
 const rnd1=o=>{if(o.seed===undefined)return Math.random();const x=Math.sin(o.seed*12.9898+o.kind.length*78.233)*43758.5453;return x-Math.floor(x);};
 const RP=n=>{const m=n.match(/^(?:bg-)?(work|home|shop|park|angel)(?![a-z])/);return 'runner/'+(m?m[1]:'common')+'/'+n;};   // 그림 이름 앞의 맵 이름으로 assets/runner/<맵>/ 폴더를 찾는다
 const img=n=>{let i=cache[n];if(!i){i=cache[n]=new Image();i.src='assets/'+RP(n)+(n.startsWith('bg-')?'.jpg':'.png');}return i.complete&&i.naturalWidth?i:null;};
 const W=()=>viewWidth;
 const hash=i=>{const s=Math.sin(i*127.1+31.7)*43758.5453;return s-Math.floor(s);};

 // Draw a sprite with its bottom-centre at (cx, bottom), height h (width follows the picture, at most maxW).
 function stand(name,cx,bottom,h,maxW,rot){
  const im=img(name);if(!im)return false;let w=h*im.naturalWidth/im.naturalHeight;if(maxW&&w>maxW){h*=maxW/w;w=maxW;}
  // 배경·바닥과 구분되게: 바닥 그림자 + 진한 갈색 윤곽선(그림을 4방향으로 살짝 비껴 어둡게 한 번 깔고 그 위에 그림)
  const u=canvas.width/viewWidth,o=2.2*u;
  ctx.save();ctx.fillStyle='#4a2f2240';ctx.beginPath();ctx.ellipse(cx,bottom+1,Math.min(w*.5,70),6,0,0,Math.PI*2);ctx.fill();ctx.restore();
  const put=()=>{if(rot){ctx.save();ctx.translate(cx,bottom-h/2);ctx.rotate(rot);ctx.drawImage(im,-w/2,-h/2,w,h);ctx.restore();}else ctx.drawImage(im,cx-w/2,bottom-h,w,h);};
  ctx.save();ctx.shadowColor='#4a2f22';ctx.shadowBlur=0;
  for(const [dx,dy] of [[o,0],[-o,0],[0,o],[0,-o]]){ctx.shadowOffsetX=dx;ctx.shadowOffsetY=dy;put();}
  ctx.restore();
  put();
  return true;
 }
 // Wide piece (shelf, log, cloud ledge) stretched to width w: the two ends keep their shape, the middle stretches.
 function slice3(name,x,y,w,h){
  const im=img(name);if(!im)return false;const iw=im.naturalWidth,ih=im.naturalHeight,cap=Math.min(w*.4,iw*.22*h/ih),sc=Math.floor(iw*.22);
  ctx.drawImage(im,0,0,sc,ih,x,y,cap,h);ctx.drawImage(im,sc,0,iw-2*sc,ih,x+cap-.5,y,w-2*cap+1,h);ctx.drawImage(im,iw-sc,0,sc,ih,x+w-cap,y,cap,h);
  return true;
 }
 // Tile a picture along the floor band; alternate tiles are mirrored so no seam shows.
 function tileBand(name,S,y,h,mirror,crop){
  const im=img(name);if(!im)return false;const cx=crop?Math.floor(im.naturalWidth*crop[0]):0,cw=crop?Math.floor(im.naturalWidth*(crop[1]-crop[0])):im.naturalWidth,tw=h*cw/im.naturalHeight;
  for(let k=Math.floor(S/tw);k*tw-S<W();k++){const x=k*tw-S;
   if(mirror&&k%2){ctx.save();ctx.translate(x+tw,0);ctx.scale(-1,1);ctx.drawImage(im,cx,0,cw,im.naturalHeight,0,y,tw+1,h);ctx.restore();}else ctx.drawImage(im,cx,0,cw,im.naturalHeight,x,y,tw+1,h);}
  return true;
 }
 // Far wall picture (cover the area above the floor, scrolls slower than the floor).
 // scale: picture pixels → screen (default fills the wall height); the picture's wall bottom (wallPx) sits on the floor line,
 // and if there is room above, its top row is stretched up (stripes / sky continue).
 function backdrop(name,S,floor,wallPx,speed,scale){
  const im=img(name);if(!im)return false;const h=floor-17,sc=scale||h/wallPx,tw=im.naturalWidth*sc,th=im.naturalHeight*sc,top=h-wallPx*sc,off=S*speed;
  for(let k=Math.floor(off/tw);k*tw-off<W();k++){const x=k*tw-off;
   ctx.save();if(k%2){ctx.translate(x+tw,0);ctx.scale(-1,1);}else ctx.translate(x,0);
   if(top>0)ctx.drawImage(im,0,0,im.naturalWidth,2,0,0,tw+1,top+1);
   ctx.drawImage(im,0,top,tw+1,th);ctx.restore();}
  return true;
 }
 const bandTop=floor=>floor-17,bandH=floor=>viewHeight-(floor-17);
 // Edge pieces beside a pit, drawn at the same scale as the floor tile so heights match.
 function edge(name,tile,floor,x,anchorRight){
  const a=img(name),t=img(tile);if(!a||!t)return false;const k=bandH(floor)/t.naturalHeight,w=a.naturalWidth*k,h=a.naturalHeight*k;
  ctx.drawImage(a,anchorRight?x-w:x,viewHeight-h,w,h);return true;
 }
 // Rope strings from the ceiling down to a hanging picture (stretch the top row of the picture).
 function ropes(name,x,top,w,h){
  const im=img(name);if(!im||top<=0)return;ctx.drawImage(im,0,0,im.naturalWidth,3,x,0,w,top+1);
 }

 // ---- 새 배경: 벽+바닥이 한 장인 가로 그림 A/B(1536×1024)를 번갈아 이어 붙인다 (장면 경계는 살짝 겹쳐 흐리게). 그림이 아직 안 불러와지면 예전 그림/코드 배경 사용.
 const PAN={friend:{a:'runner-bg/runner-friend-a-v2',b:'runner-bg/runner-friend-b-v2',split:738},shopkeeper:{a:'runner-bg/runner-shop-a-v2',b:'runner-bg/runner-shop-b-v2',split:738},parkfriend:{a:'runner-bg/runner-park-a-v2',b:'runner-bg/runner-park-b-v2',split:705},angel:{a:'runner-bg/runner-angel-a-v2',b:'runner-bg/runner-angel-b-v3',split:728}};
 const pcache={},fcache={},FE=70;   // FE: 겹치는 폭(그림 픽셀)
 const pimg=n=>{let i=pcache[n];if(!i){i=pcache[n]=new Image();i.src='assets/'+n+'.jpg';}return i.complete&&i.naturalWidth?i:null;};
 const feathered=(n,im)=>{let c=fcache[n];if(c)return c;c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const g=c.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='destination-out';const gr=g.createLinearGradient(0,0,FE,0);gr.addColorStop(0,'#000');gr.addColorStop(1,'#0000');g.fillStyle=gr;g.fillRect(0,0,FE,c.height);return fcache[n]=c;};
 function panelPass(id,S,y0,y1,srcY,srcH,speed){
  const c=PAN[id],A=pimg(c.a),B=pimg(c.b);if(!A||!B)return false;
  const s=(c.wallScale),pw=A.naturalWidth*s,step=(A.naturalWidth-FE)*s,off=S*speed;
  const fa=feathered(c.a,A),fb=feathered(c.b,B);
  for(let k=Math.max(0,Math.floor(off/step)-1);k*step-off<W();k++){const x=k*step-off,im=k%2?fb:fa;ctx.drawImage(im,0,srcY,im.width,srcH,x,y0,pw+1,y1-y0);}
  return true;
 }
 const panelWall=(id,S,floor)=>{const c=PAN[id];c.wallScale=(floor-17)/c.split;return panelPass(id,S,0,floor-17,0,c.split,1);};
 const panelFloor=(id,S,floor)=>{const c=PAN[id],A=pimg(c.a);if(!A)return false;c.wallScale=(floor-17)/c.split;return panelPass(id,S,floor-17,viewHeight,c.split,A.naturalHeight-c.split,1);};
 // ---- which picture stands for which obstacle: [sprite, height, maxWidth, rolls] ----
 const MAP={
  home:{cone:['home-yarn',62],awl:['home-teapot',64],strand:['home-books2',44],scissors:['home-lamp',122],triangle:['home-books3',104],ruler:['home-table',72,205],ball:['home-yarn',46,0,true]},
  shop:{cone:['shop-cone',66],awl:['shop-basket',58],strand:['shop-crate',44],scissors:['shop-spools',120],triangle:['shop-boxes',112],ruler:['shop-counter2',74,205],ball:['shop-yarn',46,0,true]},
  park:{cone:['park-bush',58],awl:['park-rock',58],strand:['park-fence',50],scissors:['park-tree',130],triangle:['park-sign',104],ruler:['park-log',56,205],ball:['park-ball',46,0,true]},
  angel:{cone:['angel-cloudA',58],awl:['angel-cloudB',62],strand:['angel-rainbow',60],scissors:['angel-towerB',124],triangle:['angel-towerA',112],ruler:['angel-cloudLong',64,205],ball:['angel-star',46,0,true]},
  work:{cone:['work-cone',66],awl:['work-spool',56],strand:['work-tangle',44],scissors:['work-scissors',122],triangle:['work-triangle',114],ruler:['work-ruler',34,205],ball:['work-yarn',46,0,true]},
 };
 function prop(set,o,floor){
  const m=(MAP[set]||{})[o.kind];if(!m)return false;
  const cx=o.x+o.w/2;let rot=0;
  if(m[3]&&!reduced)rot=-(o.rolled||0)/(m[1]/2);
  if(o.kind==='ruler'&&set==='park'){if(o.bench===undefined)o.bench=rnd1(o)<.5;if(o.bench)return stand('park-bench',cx,floor,54,205);}
  return stand(m[0],cx,floor,m[1],m[2]||Math.max(o.w*2.2,90),rot);
 }
 // ---- runner2 v2: 스테이지별 새 벽·바닥 띠·구멍·장애물·매달린 것·발판 (ChatGPT, assets/runner2/<set>-<종류>-v2.png). 그림이 안 불러와지면 예전 그림/코드 대체.
 // 투명 PNG의 윗면(풀/구름 윗선)·아랫면 위치와 내용 영역(bbox)을 알파로 찾아, 윗면이 바닥선(floor-17)에 오게 같은 비율로 그린다.
 const R2={friend:{set:'home',th:1,plain:true},shopkeeper:{set:'shop',th:1,plain:true},parkfriend:{set:'park',th:1,water:true,flat:'park-platform-flower-v3'},angel:{set:'angel',th:.8,sky:true,}};
 const r2c={};
 // 새 원화의 확실한 불투명 영역만 사용한다(생성 PNG의 희미한 여백 제외).
 const TERRAIN={
  work:{g:['work-ground-slab-v25',[64,277,2108,594]],p:['work-platform-full-v25',[84,289,2087,490]]},
  home:{g:['home-ground-slab-v25',[48,259,2125,480]],p:['home-platform-full-v25',[42,301,2130,517]]},
  shop:{g:['shop-ground-slab-v32',[71,234,2101,485]],p:['shop-platform-full-v32',[487,294,1685,428]]},
  park:{g:['park-ground-slab-v27',[29,245,2144,538]],p:['park-platform-full-v27',[115,256,2058,481]]},
  angel:{g:['angel-ground-slab-v27',[13,251,2157,513]],p:['angel-platform-full-v27',[181,258,1993,530]]}
 };
 function terrainPiece(set,kind){const t=TERRAIN[set][kind],im=img(t[0]);return im?{im,b:t[1]}:null;}
 function terrainSlice(g,x,y,w,h){
  const [l,t,r,b]=g.b,bw=r-l,bh=b-t,cap=Math.min(70,bw*.08),cw=Math.min(cap*h/bh,w*.2);
  ctx.drawImage(g.im,l,t,cap,bh,x,y,cw,h);
  ctx.drawImage(g.im,l+cap,t,bw-2*cap,bh,x+cw-.3,y,w-2*cw+.6,h);
  ctx.drawImage(g.im,r-cap,t,cap,bh,x+w-cw,y,cw,h);
 }
 const finishedTiles={};
 function terrainFloor(set,S,floor){
  const g=terrainPiece(set,'g');if(!g)return false;
  const top=floor-17,h=viewHeight-top,tw=600;
  // 텍스처는 고정 폭으로만 이동. 화면에 구멍이 들어와도 늘이거나 재분할하지 않는다.
  const pits=runner.obstacles.filter(o=>o.kind==='pit').sort((a,b)=>a.x-b.x);
  const spans=[];let start=-Infinity;
  for(const p of pits){if(p.x>start)spans.push([start,p.x]);start=Math.max(start,p.x+p.w);}
  spans.push([start,Infinity]);
  let tile=finishedTiles[set];
  if(!tile){const [l,t,r,b]=g.b;tile=finishedTiles[set]=makeFloorTile(g.im,[l,t,r-l,b-t]);}
  drawFinishedFloor(ctx,tile,S,top,false,{width:W(),height:h,spans});
  return true;
 }
 const SCENERY={parkfriend:['park-flower-bush-v28',50,700]};
 function scenery(id,S,floor){
  const cfg=SCENERY[id];if(!cfg)return;const g=gi(cfg[0]);if(!g)return;
  const h=cfg[1],w=h*(g.br-g.bl)/(g.bb-g.bt),step=cfg[2];
  for(let q=Math.floor(S/step);q*step-S<W()+w;q++){
   const x=q*step+step*.55-S;
   if(x+w/2<0||x-w/2>W())continue;
   if(runner.obstacles.some(o=>o.kind==='pit'&&x+w/2>o.x&&x-w/2<o.x+o.w))continue;
   ctx.drawImage(g.im,g.bl,g.bt,g.br-g.bl,g.bb-g.bt,x-w/2,floor-17-h,w,h);
  }
 }
 function gi(n){
  let o=r2c[n];if(o===undefined){const im=new Image();o=r2c[n]={im,ok:false};im.onload=()=>{try{const w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const d=g.getImageData(0,0,w,h).data;
   let l=w,r=0,bl=w,br=0,bt=h,bb=0;const cnt=new Int32Array(h),colOcc=new Uint8Array(w);
   for(let y=0;y<h;y++){let n2=0;for(let x=0;x<w;x++){const a=d[(y*w+x)*4+3];if(a>128){n2++;colOcc[x]=1;if(x<l)l=x;if(x>r)r=x;}if(a>(/-v(?:25|28|29)$/.test(n)?160:60)){if(x<bl)bl=x;if(x>br)br=x;if(y<bt)bt=y;if(y>bb)bb=y;}}cnt[y]=n2;}
   const need=(r-l)*.5;let top=0,bot=h-1;while(top<h&&cnt[top]<need)top++;while(bot>0&&cnt[bot]<need)bot--;
   // 벽 그림: 아래쪽 민무늬 띠가 시작되는 줄(split) — 맨 아래 줄 색과 달라지는 첫 줄
   const rowMean=y=>{let rr=0,gg=0,bb2=0,k=0;for(let x=0;x<w;x+=8){const i=(y*w+x)*4;rr+=d[i];gg+=d[i+1];bb2+=d[i+2];k++;}return [rr/k,gg/k,bb2/k];};
   const ref=rowMean(h-2);let split=h;for(let y=h-3;y>0;y--){const m=rowMean(y);if(Math.abs(m[0]-ref[0])+Math.abs(m[1]-ref[1])+Math.abs(m[2]-ref[2])>16){split=y+1;break;}}
   {const m=rowMean(h-2);o.base='rgb('+Math.round(m[0])+','+Math.round(m[1])+','+Math.round(m[2])+')';}{let bs=0,bl2=0,st=-1;for(let x=l;x<=r+1;x++){const e=x>r||!colOcc[x];if(e){if(st<0)st=x;}else if(st>=0){if(x-st>bl2){bl2=x-st;bs=st;}st=-1;}}o.gl=bs;o.gr=bs+bl2;}o.l=l;o.r=r+1;o.top=top;o.bot=bot+1;o.bl=bl;o.br=br+1;o.bt=bt;o.bb=bb+1;o.split=split;o.ok=bot>top;}catch(e){o.ok=false;}};im.src='assets/'+RP(n)+'.png';}
  return o.ok?o:null;}
 const nm=(set,k)=>set+'-'+k+'-v2';
 const groundName=set=>r2c[set+'-ground-solid-v3']&&r2c[set+'-ground-solid-v3'].ok?set+'-ground-solid-v3':nm(set,'ground');
 // 벽: wall-only a/b를 번갈아 이어 붙임(경계는 70px 겹쳐 흐림). 벽 아래 민무늬 띠는 바닥 띠 아래에 가려지므로 벽 부분(split)만 쓴다.
 const wfe={};
 function wallFeather(n,g){let c=wfe[n];if(c)return c;c=document.createElement('canvas');c.width=g.im.naturalWidth;c.height=g.im.naturalHeight;const q=c.getContext('2d');q.drawImage(g.im,0,0);q.globalCompositeOperation='destination-out';const gr=q.createLinearGradient(0,0,FE,0);gr.addColorStop(0,'#000');gr.addColorStop(1,'#0000');q.fillStyle=gr;q.fillRect(0,0,FE,c.height);return wfe[n]=c;}
 const APPROVED_WALLS={
  work:{files:['runner-bg/runner-bg-mint-concept-v1.png','runner-bg/runner-bg-mint-panel-b-v1.png'],baseline:740,palette:['#efe6d4','#e8decd']},
  home:{files:['runner/home/home-wall-only-a-v2.png','runner/home/home-wall-only-b-v2.png'],baseline:676,palette:['#f4eefb','#e9e0f2']},
  shop:{files:['runner/shop/shop-background-only-v31.png'],baseline:532,palette:['#fff0e7','#f2ded8']},
  park:{files:[1,2,3,4].map(n=>'runner/park/park-bg-'+n+'-v14.jpg'),baseline:705,palette:['#f1efd5','#e4e9cb']},
  angel:{files:['runner/angel/angel-wall-only-a-v2.png','runner/angel/angel-wall-only-b-v2.png'],baseline:660,palette:['#bce6f7','#d4effa']}
 };
 const approvedImages={},approvedFades={};
 function approvedImage(file){let im=approvedImages[file];if(!im){im=approvedImages[file]=new Image();im.src='assets/'+file;}return im.complete&&im.naturalWidth?im:null;}
 function approvedWall(set,S,floor){
  const config=APPROVED_WALLS[set],images=config.files.map(approvedImage);if(images.some(im=>!im))return false;
  const top=floor-17,scale=top/config.baseline,step=(images[0].naturalWidth-100)*scale;
  for(let k=Math.max(0,Math.floor(S/step)-1);k*step-S<W();k++){
   const index=k%images.length,im=images[index],file=config.files[index];let art=im;
   if(k>0){art=approvedFades[file];if(!art){art=document.createElement('canvas');art.width=im.naturalWidth;art.height=im.naturalHeight;const c=art.getContext('2d');c.drawImage(im,0,0);c.globalCompositeOperation='destination-out';const fade=c.createLinearGradient(0,0,100,0);fade.addColorStop(0,'#000');fade.addColorStop(1,'#0000');c.fillStyle=fade;c.fillRect(0,0,100,art.height);approvedFades[file]=art;}}
   ctx.drawImage(art,0,0,im.naturalWidth,config.baseline,k*step-S,0,im.naturalWidth*scale+.5,top);
  }
  drawCleanLowerBackground(ctx,top,config.palette,W(),viewHeight);
  return true;
 }
 const wallSt={},c0=id=>R2[id].set+'-ground-solid-v3';
 // 통 배경(풍경+아래 흙까지 한 장): <set>-bg-1~4-v14.jpg 를 번갈아 이어 붙임(경계 70px 흐림). 있으면 이것을 그대로 쓴다.
 const bgc={};function bgImg(n){let o=bgc[n];if(!o){const im=new Image();o=bgc[n]={im,ok:false,f:null};im.onload=()=>{o.ok=true;};im.src='assets/'+RP(n)+'.jpg';}return o.ok?o:null;}
 function bgFeather(o){if(o.f)return o.f;const im=o.im,c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const q=c.getContext('2d');q.drawImage(im,0,0);q.globalCompositeOperation='destination-out';const gr=q.createLinearGradient(0,0,FE,0);gr.addColorStop(0,'#000');gr.addColorStop(1,'#0000');q.fillStyle=gr;q.fillRect(0,0,FE,c.height);return o.f=c;}
 function bgFull(id,S,floor){const set=R2[id].set,L=[1,2,3,4].map(i=>bgImg(set+'-bg-'+i+'-v14'));if(L.some(x=>!x))return false;
  const A=L[0].im,sc=(floor-17)/705,pw=A.naturalWidth*sc,step=(A.naturalWidth-FE)*sc,off=S,n=L.length;
  for(let k=Math.max(0,Math.floor(off/step)-1);k*step-off<W();k++){const o=L[k%n];ctx.drawImage(k===0?o.im:bgFeather(o),0,0,pw/sc,o.im.naturalHeight,k*step-off,0,pw+1,o.im.naturalHeight*sc);}
  return true;}
function wall3(id,S,floor){
  if(approvedWall(R2[id].set,S,floor))return true;
  if(id==='shopkeeper'){
   const im=img('shop-wall-reference-v29');
   if(im){
    const sy=100,sh=450,sc=(floor-17)/sh,tw=im.naturalWidth*sc,step=(im.naturalWidth-FE)*sc;
    ctx.fillStyle='#d1ead5';ctx.fillRect(0,0,W(),viewHeight);
    for(let q=Math.max(0,Math.floor(S/step)-1);q*step-S<W();q++)ctx.drawImage(q===0?im:feathered('shop-reference-v29',im),0,sy,im.naturalWidth,sh,q*step-S,0,tw+.5,floor-17);
    return true;
   }
  }
  if(bgFull(id,S,floor)){return true;}
  const set=R2[id].set,A=gi(nm(set,'wall-only-a')),B=gi(nm(set,'wall-only-b'));if(!A||!B)return false;
  const wallH=floor-17,sc=wallH/A.split,pw=A.im.naturalWidth*sc,step=(A.im.naturalWidth-FE)*sc,off=S;
  const fa=wallFeather('a'+set,A),fb=wallFeather('b'+set,B);
  for(let k=Math.max(0,Math.floor(off/step)-1);k*step-off<W();k++){ctx.drawImage(k%2?fb:fa,0,0,fa.width,A.split,k*step-off,0,pw+1,wallH);}
  if(gi(set+'-ground-slab-v21')||gi(set+'-ground-block-finished-v20')){const top=floor-17,H=viewHeight-top,bh=A.im.naturalHeight-A.split;ctx.fillStyle=A.base;ctx.fillRect(0,top,W(),H);}   // 바닥 영역(구멍 속)은 벽 아래색 단색
  wallSt[id]={fa,fb,A,pw,step,off};
  return true;}
 // 블록 바닥: <set>-ground-block-map-v13 한 장이 100px 칸 하나. 칸마다 자기 윤곽이 있어 구멍 가장자리가 항상 깔끔하다.
 function slabFloor(id,S,floor){
  const set=R2[id].set,g=gi(set+'-ground-slab-v21');if(!g)return false;
  const top=floor-17,H=viewHeight-top,bw=g.br-g.bl,bh=g.bb-g.bt,k=H/bh,cap=Math.min(70,bw*.08),cw=cap*k,mw=(bw-2*cap)*k;
  const pits=runner.obstacles.filter(o=>o.kind==='pit').sort((a,b)=>a.x-b.x),segs=[];let cx=-1e5;
  for(const p of pits){if(p.x>cx)segs.push([cx,p.x]);cx=Math.max(cx,p.x+p.w);}segs.push([cx,1e5]);
  for(const [a,b] of segs){if(b<-50||a>W()+50)continue;const A=Math.max(a,-60),B=Math.min(b,W()+60);if(B<=A)continue;
   ctx.save();ctx.beginPath();ctx.rect(A,top-2,B-A,H+2);ctx.clip();
   // 블록 통째로 이어 붙이기(블록마다 자기 윤곽 유지): 구멍 사이 구간은 블록 개수를 정수로 맞춰 양끝이 윤곽으로 끝남
   const bwid=bw*k,minw=bwid*.5;   // 블록 경계는 세상(스크롤)에 고정된 격자 → 구멍이 새로 나타나도 기존 블록이 밀리거나 늘어나지 않음(물렁거림 방지). 구멍 쪽 끝 블록만 구멍 가장자리에 맞춰 늘고 줄어듦.
   const pts=[a];const q0=Math.ceil((Math.max(a,A-bwid)+S)/bwid);for(let q=q0;q*bwid-S<B+bwid;q++){const x=q*bwid-S;if(x>a+minw&&x<b-minw)pts.push(x);}pts.push(b);
   for(let i=0;i<pts.length-1;i++){const x0=pts[i],x1=pts[i+1];if(x1<A-bwid*2||x0>B+bwid*2)continue;ctx.drawImage(g.im,g.bl,g.bt,bw,bh,x0,top,x1-x0+.6,H);}
   ctx.restore();}
  return true;}
 function blockFloor(id,S,floor){
  if(slabFloor(id,S,floor))return true;
  const set=R2[id].set,fin=gi(set+'-ground-block-finished-v20'),fill=fin?null:gi(set+'-ground-fill-v19'),rect=fin||fill||gi(set+'-ground-block-rect-v18'),col=rect?null:gi(set+'-column-v15'),b=rect||col||gi(set+'-ground-block-map-v13');if(!b)return false;
  const top=floor-17,bw=b.br-b.bl,bh=b.bb-b.bt,tw=100,sc=tw/bw,h=(col||rect)?viewHeight-top:tw*bh/bw;   // column: 긴 기둥 그림은 위쪽(풀+흙)만 바닥 높이만큼 쓴다
  if(0){const f=gi(set+'-pit-fill-v3');if(f){const H=viewHeight-top,fw=f.im.naturalWidth*(H/f.im.naturalHeight),off=S*.3;for(let q=Math.floor(off/fw);q*fw-off<W();q++)ctx.drawImage(f.im,q*fw-off,top,fw+1,H);}}
  const pits=runner.obstacles.filter(o=>o.kind==='pit');
  for(let q=Math.floor(S/tw)-1;q*tw-S<W();q++){const x=q*tw-S;if(pits.some(p=>x>=p.x-2&&x+tw<=p.x+p.w+2))continue;
   if(fin){const hh=viewHeight-top;ctx.drawImage(b.im,b.bl,b.bt,bw,bh,x,top,tw+.6,hh);}else if(fill){const sh=Math.min(b.im.naturalHeight,h/sc);ctx.drawImage(b.im,0,0,b.im.naturalWidth,sh,x,top,tw+.6,h);}else if(rect)ctx.drawImage(b.im,0,0,b.im.naturalWidth,b.im.naturalHeight,x,top,tw+.6,h);else if(col){const sh=Math.min(bh,700);ctx.drawImage(b.im,b.bl,b.bt,bw,sh,x,top,tw+.6,h);}else ctx.drawImage(b.im,b.bl,b.bt,bw,bh,x,top-(0),tw+.6,h);}
  return true;}
 function floor2(id,S,floor){
  if(blockFloor(id,S,floor))return true;
  gi(c0(id));const c=R2[id],g=gi(groundName(R2[id].set));if(!g)return false;
  const top=floor-17,H=viewHeight-top,k=H*c.th/(g.bot-g.top),tw=g.im.naturalWidth*k,y=top-g.top*k,ih=g.im.naturalHeight*k;
  if(c.sky){const f=gi(nm(c.set,'pit-fill').replace('-v2','-v3'));if(!f)return false;const fw=f.im.naturalWidth*(H/f.im.naturalHeight),off=S*.3;for(let q=Math.floor(off/fw);q*fw-off<W();q++)ctx.drawImage(f.im,q*fw-off,top,fw+1,H);}
  // 구멍 주변은 구멍 전용 그림(ground-hole)이 바닥을 대신하므로 그 구간은 비우고, 바닥 띠는 구멍 조각이 끝나는 바로 그 지점에서 처음부터 시작해 이어 붙인다(그림 가장자리가 같아 이음새가 안 보임).
  const hole=gi(c.set+'-ground-hole-v3'),tile=(x,w,mir)=>{if(mir){ctx.save();ctx.translate(x+w,0);ctx.scale(-1,1);ctx.drawImage(g.im,0,y,w+1,ih);ctx.restore();}else ctx.drawImage(g.im,x,y,w+1,ih);};
  const spans=[];
  if(hole&&hole.gr-hole.gl>40){const EX=c.ext||HOLE_EXT,full=Math.min(EX,(hole.r-hole.gr)*k);for(const o of runner.obstacles)if(o.kind==='pit'){const L=pitLens(o,full);spans.push([o.x-L.l,o.x+o.w+L.r]);}}
  spans.sort((p,q)=>p[0]-q[0]);const merged=[];for(const sp of spans){const m=merged[merged.length-1];if(m&&sp[0]<=m[1])m[1]=Math.max(m[1],sp[1]);else merged.push(sp.slice());}
  const X0=-tw,X1=W()+tw,segs=[];let cx=X0,la=false;
  for(const m of merged){if(m[0]>cx)segs.push([cx,m[0],la,true]);cx=Math.max(cx,m[1]);la=true;}
  if(cx<X1)segs.push([cx,X1,la,false]);
  for(const [a0,b0,l,r] of segs){const len=b0-a0;ctx.save();ctx.beginPath();ctx.rect(a0-1.5,0,len+3,viewHeight);ctx.clip();
   if(l&&r){const n=Math.max(1,Math.round(len/tw)),tt=len/n;for(let i=0;i<n;i++)tile(a0+i*tt,tt,i%2===1);}   // 양쪽이 구멍: 타일 수를 정수로 맞춰 양끝이 모두 맞게(살짝 늘림)
   else if(l){for(let i=0;a0+i*tw<b0;i++)tile(a0+i*tw,tw,i%2===1);}
   else if(r){for(let i=0;b0-i*tw>a0;i++)tile(b0-(i+1)*tw,tw,i%2===1);}
   else{for(let q=Math.floor(S/tw);q*tw-S<b0;q++){const x=q*tw-S;if(x+tw<a0)continue;tile(x,tw,q%2===1);}}   // 구멍이 없는 구간: 예전처럼 화면 이동에 맞춰
   ctx.restore();}
  return true;}
 const HOLE_EXT=99999,esc={};
 // 이웃한 구멍과 가까우면 벽 조각이 서로 겹치지 않게, 구멍 사이 거리의 절반까지만 쓴다
 function pitLens(ob,full){let nl=-1e9,nr=1e9;for(const p of runner.obstacles){if(p===ob||p.kind!=='pit')continue;if(p.x+p.w<=ob.x+1)nl=Math.max(nl,p.x+p.w);else if(p.x>=ob.x+ob.w-1)nr=Math.min(nr,p.x);}
  return {l:Math.max(0,Math.min(full,(ob.x-nl)/2)),r:Math.max(0,Math.min(full,(nr-(ob.x+ob.w))/2))};}
 function mirrorOf(key,src){let c=esc[key];if(c)return c;c=esc[key]=document.createElement('canvas');c.width=src.width;c.height=src.height;const q=c.getContext('2d');q.translate(src.width,0);q.scale(-1,1);q.drawImage(src,0,0);return c;}
 function edgeSoft(key,g,sx,sw,k,farLeft,fwIn){let c=esc[key];if(c)return c;c=esc[key]=document.createElement('canvas');c.width=Math.max(1,Math.ceil(sw*k));c.height=Math.ceil(g.im.naturalHeight*k);const q=c.getContext('2d');q.drawImage(g.im,sx,0,sw,g.im.naturalHeight,0,0,c.width,c.height);
  const fw=fwIn!=null?Math.min(fwIn,c.width*.5):key.indexOf('H')>0?3:Math.min(14,c.width*.4),gr=farLeft?q.createLinearGradient(0,0,fw,0):q.createLinearGradient(c.width,0,c.width-fw,0);gr.addColorStop(0,'#0000');gr.addColorStop(1,'#000');q.globalCompositeOperation='destination-in';q.fillStyle=gr;q.fillRect(0,0,c.width,c.height);return c;}
 function pit2(id,ob,floor){
  const blk=terrainPiece(R2[id].set,'g')||gi(R2[id].set+'-ground-slab-v21')||gi(R2[id].set+'-ground-block-finished-v20')||gi(R2[id].set+'-ground-block-map-v13');
  if(blk)return true;   // 블록 바닥: 구멍은 블록만 빼고 뒤 배경이 그대로 보이게(물·하늘 채움 없음)
  if(0){const c=R2[id],top=floor-17,H=viewHeight-top,f=gi(c.set+'-pit-fill-v3');if(!f)return false;
   const sw=Math.min(f.im.naturalWidth,ob.w*f.im.naturalHeight/H);
   if(c.water){const wl=ob.wl===undefined?12:ob.wl,wt=top+1+wl,A=3.2,ph=performance.now()/500,wv=x=>wt-3.5-Math.abs(Math.sin(x*.06+ph))*A-Math.sin(x*.17-ph*1.3)*.8;
    ctx.save();ctx.beginPath();ctx.moveTo(ob.x,viewHeight);for(let x=ob.x;x<=ob.x+ob.w;x+=4)ctx.lineTo(x,wv(x));ctx.lineTo(ob.x+ob.w,viewHeight);ctx.closePath();ctx.clip();ctx.drawImage(f.im,0,0,sw,f.im.naturalHeight,ob.x,wt-12,ob.w,viewHeight-wt+12);ctx.restore();
    ctx.save();ctx.strokeStyle='#ffffffbb';ctx.lineWidth=2;ctx.beginPath();for(let x=ob.x;x<=ob.x+ob.w;x+=4){x===ob.x?ctx.moveTo(x,wv(x)):ctx.lineTo(x,wv(x));}ctx.stroke();ctx.restore();}
   else if(c.plain){}
   else{ctx.save();ctx.beginPath();ctx.rect(ob.x,top,ob.w,H);ctx.clip();ctx.drawImage(f.im,0,0,sw,f.im.naturalHeight,ob.x,top,ob.w,H);ctx.restore();}
   return true;}
  gi(c0(id));const c=R2[id],g=gi(groundName(R2[id].set)),f=gi(c.set+'-pit-fill-v3'),eL=gi(nm(c.set,'edge-left')),eR=gi(nm(c.set,'edge-right'));if(!g||!f||!eL||!eR)return false;
  const top=floor-17,H=viewHeight-top,k=H*c.th/(g.bot-g.top);
  const sw=Math.min(f.im.naturalWidth,ob.w*f.im.naturalHeight/H);
  if(c.water){const bx=ob.x-12,bw=ob.w+24;   // 물을 구멍보다 양옆 12px 더 넓게 깔아 벽 조각 뒤로 살짝 겹치게(틈 없애기)   // 물: 윗면을 바닥선보다 조금 낮추고 물결로 만들어 일자선이 안 보이게. 물 위 빈 곳은 멀리 보이는 둑 색으로 채움
   const wl=ob.wl===undefined?12:ob.wl,wt=top+1+wl,A=3.2,ph=performance.now()/500,wv=x=>wt-3.5-Math.abs(Math.sin(x*.06+ph))*A-Math.sin(x*.17-ph*1.3)*.8;   // 물 윗면(wl: 바닥선에서 아래로 몇 px, 클수록 물이 낮음)
   if(wl>3){const W0=gi(nm(c.set,'wall-only-a')),gr=ctx.createLinearGradient(0,top-2,0,wt+4);gr.addColorStop(0,W0?W0.base:'#cfe9c7');gr.addColorStop(1,'rgba(90,185,200,0)');ctx.fillStyle=gr;ctx.fillRect(bx,top-2,bw,wt-top+8);}   // 물 위쪽 빈 곳: 멀리 있는 둑 색에서 물색으로 번지게
   ctx.save();ctx.beginPath();ctx.moveTo(bx,viewHeight);for(let x=bx;x<=bx+bw;x+=4)ctx.lineTo(x,wv(x));ctx.lineTo(bx+bw,viewHeight);ctx.closePath();ctx.clip();
   ctx.drawImage(f.im,0,0,sw,f.im.naturalHeight,bx,wt-12,bw,viewHeight-wt+12);ctx.restore();
   ctx.save();ctx.strokeStyle='#ffffffbb';ctx.lineWidth=2;ctx.beginPath();for(let x=bx;x<=bx+bw;x+=4){x===bx?ctx.moveTo(x,wv(x)):ctx.lineTo(x,wv(x));}ctx.stroke();ctx.restore();
  }else if(c.plain){ctx.clearRect(ob.x,top,ob.w,H);   // 실내: 구멍 속을 채우지 않고 완전히 비움(투명)
  }else{ctx.save();ctx.beginPath();ctx.rect(ob.x,top,ob.w,H);ctx.clip();ctx.drawImage(f.im,0,0,sw,f.im.naturalHeight,ob.x,top,ob.w,H);ctx.restore();}
  const hole=gi(c.set+'-ground-hole-v3');
  if(hole&&hole.gr-hole.gl>40){   // 바닥과 같은 그림에서 오린 구멍 모서리(바닥 띠와 풀·흙 모양이 똑같음): 구멍 양쪽 끝 ~150px만 잘라 구멍 가장자리에 붙인다
   const EX=c.ext||HOLE_EXT,full=Math.min(EX,(hole.r-hole.gr)*k),L=pitLens(ob,full);   // 양쪽 벽이 똑같게: 깔끔한 오른쪽 조각을 좌우로 뒤집어 왼쪽에도 씀
   if(L.r>2){const rc=edgeSoft(id+'HR'+Math.round(k*100)+'_'+Math.round(L.r),hole,hole.gr,L.r/k,k,false,.5);ctx.drawImage(rc,ob.x+ob.w-1,top-hole.top*k);}
   if(L.l>2){const lr=edgeSoft(id+'HR'+Math.round(k*100)+'_'+Math.round(L.l),hole,hole.gr,L.l/k,k,false,.5),lc=mirrorOf(id+'HLm'+Math.round(k*100)+'_'+Math.round(L.l),lr);ctx.drawImage(lc,ob.x+1-lc.width,top-hole.top*k);}
   return true;}
  // 구멍 쪽 끝 ~46px만 쓰고(풀이 튀어나온 모서리), 바닥 띠와 닿는 쪽 끝은 짧게 흐려 이어 붙인다
  const kl=H*c.th/(eL.bot-eL.top),kr=H*c.th/(eR.bot-eR.top);   // 벽 조각마다 풀+흙 두께가 바닥 띠와 똑같아지게 비율을 따로 맞춤
  const cw=Math.min(46/kl,eL.r-eL.l),cr=Math.min(46/kr,eR.r-eR.l);
  const lc=edgeSoft(id+'L'+Math.round(kl*100),eL,eL.r-cw,cw,kl,true),rc=edgeSoft(id+'R'+Math.round(kr*100),eR,eR.l,cr,kr,false);
  ctx.drawImage(lc,ob.x+3-lc.width,top-eL.top*kl);ctx.drawImage(rc,ob.x+ob.w-3,top-eR.top*kr);
  return true;}
 // 그림의 내용 영역(bbox)만 잘라 그린다. 배경과 구분되게 바닥 그림자 + 진한 갈색 윤곽선.
 function blit(g,cx,bottom,w,h,rot,lift){lift=lift||0;const sb=bottom;bottom-=lift;
  const sx=g.bl,sy=g.bt,sw=g.br-g.bl,sh=g.bb-g.bt,u=canvas.width/viewWidth,o=2*u;
  const put=()=>{if(rot){ctx.save();ctx.translate(cx,bottom-h/2);ctx.rotate(rot);ctx.drawImage(g.im,sx,sy,sw,sh,-w/2,-h/2,w,h);ctx.restore();}else ctx.drawImage(g.im,sx,sy,sw,sh,cx-w/2,bottom-h,w,h);};
  ctx.save();ctx.fillStyle='#4a2f2230';ctx.globalAlpha=Math.max(.3,1-lift/18);ctx.beginPath();ctx.ellipse(cx,sb+1,Math.min(w*.5,80)*(1-lift/60),6,0,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.save();ctx.shadowColor='#4a2f22';ctx.shadowBlur=0;for(const [dx,dy] of [[o,0],[-o,0],[0,o],[0,-o]]){ctx.shadowOffsetX=dx;ctx.shadowOffsetY=dy;put();}ctx.restore();
  put();}
 const H3={cone:62,awl:68,strand:34,scissors:122,triangle:114,ruler:40,ball:46};
 const FRESH={work:['cone','awl','strand','scissors','triangle','ruler','ball','hang'],home:['cone','awl','scissors','triangle','ruler','ball','hang'],shop:['cone','awl','scissors','triangle']};
 function freshProp(set,o,floor){
  const kind=o.kind==='strand'?'tangle':o.kind;
  let name=set+'-'+kind+'-v25';
  if(set==='home'&&o.v==='bookcase'){
   const book=gi('home-bookcase-v25');if(!book)return false;
   blit(book,o.x+o.w/2,floor,o.w,o.h,0,0);return true;
  }
  if(set==='park'&&o.kind==='ruler')name='park-flower-log-v29';
  else if(set==='angel'&&(o.kind==='triangle'||o.kind==='scissors'))name='angel-lilac-column-v29';
  else if(!(FRESH[set]||[]).includes(o.kind))return false;
  if(set==='work'&&o.kind==='cone')name='work-cone-'+['blue','pink','yellow'][Math.abs(Math.floor((o.x+runner.distance*50)/350))%3]+'-v25';
  const g=gi(name);if(!g)return false;
  let h=(H3[o.kind]||o.h)*(o.sc||1),w=h*(g.br-g.bl)/(g.bb-g.bt);const maxW=o.kind==='ruler'?o.w*1.12:Math.max(o.w*1.7,60)*(o.sc||1);
  if(w>maxW){h*=maxW/w;w=maxW;}
  blit(g,o.x+o.w/2,floor,w,h,o.kind==='ball'&&!reduced?-(o.rolled||0)/(h/2):0,0);return true;
 }
 // 같은 종류 장애물이라도 새 그림(v2)과 예전 assets/runner 그림 여러 개 중 하나를 장애물마다 한 번 골라 섞어 쓴다(다양하게 보이게)
 const ALT={home:{cone:['home-pillow'],ruler:['home-shelf']},shop:{cone:['shop-yarn'],awl:['shop-crate'],ruler:['shop-counter']},park:{awl:['park-bush'],cone:['park-rock'],scissors:['park-sign'],ruler:['park-bench']},angel:{awl:['angel-star'],cone:['angel-cloudB']}};
 const ALTH={'home-pillow':56,'home-shelf':60,'shop-yarn':56,'shop-crate':58,'shop-counter':70,'park-bench':54,'park-bush':58,'park-rock':54,'park-sign':104,'angel-star':54,'angel-cloudB':58};
 function pool(id,kind){const set=R2[id].set,m=((MAP[set]||{})[kind]),alt=(ALT[set]||{})[kind]||[];const p=['v2'];if(m)p.push('old:'+m[0]);alt.forEach(a=>p.push('old:'+a));return p;}
 // 내가 편집기에서 추가한 그림 오브젝트(선물 등): 그림 이름은 assets/ 아래 경로
 const objImg={};function objDraw(o,floor){let im=objImg[o.img];if(!im){im=objImg[o.img]=new Image();im.src='assets/'+o.img;}if(!(im.complete&&im.naturalWidth))return true;const b=floor-(o.oy||0);ctx.save();ctx.fillStyle='#4a2f2230';ctx.beginPath();ctx.ellipse(o.x+o.w/2,b+1,Math.min(o.w*.5,80),6,0,0,Math.PI*2);ctx.fill();ctx.restore();ctx.drawImage(im,o.x,b-o.h,o.w,o.h);return true;}
 function prop3(id,o,floor){
  if(o.kind==='obj')return objDraw(o,floor+(o.oy||0));
  if(freshProp(R2[id].set,o,floor))return true;
  if(o.kind!=='ball'){if(o.v===undefined){const p=pool(id,o.kind);o.v=p[Math.floor(rnd1(o)*p.length)];}
   if(o.v!=='v2'&&o.v.indexOf('old:')===0){const SC=o.sc||1,nmOld=o.v.slice(4),mm=(MAP[R2[id].set]||{})[o.kind],isMap=mm&&mm[0]===nmOld,h=(isMap?mm[1]:(ALTH[nmOld]||o.h))*SC,mw=(isMap?(mm[2]||Math.max(o.w*2.2,90)):Math.max(o.w*2.2,90))*SC;
    if(img(nmOld)){const cx=o.x+o.w/2;if(!reduced&&R2[id].set==='angel'&&(o.kind==='cone'||o.kind==='awl'||o.kind==='ruler')){const t=performance.now()/1000,ph=o.ph!==undefined?o.ph:(o.ph=rnd1(o)*6.28);ctx.save();ctx.translate(0,-(7+Math.sin(t*2.6+ph)*4));stand(nmOld,cx,floor,h,mw,0);ctx.restore();}else stand(nmOld,cx,floor,h,mw,0);return true;}}}
  const g=gi(nm(R2[id].set,o.kind));if(!g)return false;
  const SC=o.sc||1;let h=(H3[o.kind]||o.h)*SC,w=h*(g.br-g.bl)/(g.bb-g.bt);const maxW=(o.kind==='ruler'?o.w*1.12:Math.max(o.w*1.7,60*SC));if(w>maxW){h*=maxW/w;w=maxW;}
  const cx=o.x+o.w/2;let rot=0;if(o.kind==='ball'&&!reduced)rot=-(o.rolled||0)/(h/2);
  // 가만히 놓여 있지 않게: 천사(구름 종류)는 살짝 떠서 위아래로 둥실, 다른 스테이지는 숨 쉬듯 아주 조금 늘었다 줄었다(공은 굴러가므로 제외)
  let lift=0;if(o.kind!=='ball'&&!reduced){const t=performance.now()/1000,ph=o.ph!==undefined?o.ph:(o.ph=rnd1(o)*6.28);
   if(R2[id].set==='angel'&&(o.kind==='cone'||o.kind==='awl'||o.kind==='ruler')){lift=7+Math.sin(t*2.6+ph)*4;}}   // 구름 종류만 살짝 둥실, 나머지는 가만히
  blit(g,cx,floor,w,h,rot,lift);return true;}
 function hang3(id,ob,floor){
  const set=R2[id].set,g=(FRESH[set]||[]).includes('hang')&&gi(set+'-hang-v25')||gi(nm(set,'hang'));if(!g)return false;
  const b=floor-ob.bottom,bw=g.br-g.bl,bh=g.bb-g.bt;let w=Math.max(ob.w*1.5,90)*(ob.sc||1),h=w*bh/bw;if(h>b+6){h=b+6;w=h*bw/bh;}
  const cx=ob.x+ob.w/2,top=b-h;if(top>0)ctx.drawImage(g.im,g.bl,g.bt,bw,3,cx-w/2,0,w,top+1);   // 위쪽 줄기를 화면 위 끝까지 늘림
  ctx.drawImage(g.im,g.bl,g.bt,bw,bh,cx-w/2,top,w,h);return true;}
// 꽃 핀 풀 발판(한 장짜리): 양끝 둥근 부분은 그대로, 가운데만 늘려 폭에 맞춘다
 function ledge3(id,x,y,w,ob){
  const fresh=terrainPiece(R2[id].set,'p');if(fresh){terrainSlice(fresh,x,y-4,w,40);return true;}
  // 짧은 발판(블록): <set>-short-block-v5 한 장을 양끝 둥근 채로 폭에 맞춰 늘림
  if(ob&&ob.sb&&!R2[id].flat){const sbk=gi(R2[id].set+'-short-block-v5');if(sbk){const bw=sbk.br-sbk.bl,bh=sbk.bb-sbk.bt,h=Math.max(30,Math.min(46,w*.3)),k=h/bh,cap=Math.min(bh*.55,bw*.25),cw=cap*k,top=y-3;
   if(w<cw*2+8){ctx.drawImage(sbk.im,sbk.bl,sbk.bt,bw,bh,x,top,w,h);return true;}
   ctx.drawImage(sbk.im,sbk.bl,sbk.bt,cap,bh,x,top,cw,h);ctx.drawImage(sbk.im,sbk.bl+cap,sbk.bt,bw-2*cap,bh,x+cw-.5,top,w-2*cw+1,h);ctx.drawImage(sbk.im,sbk.br-cap,sbk.bt,cap,bh,x+w-cw,top,cw,h);return true;}}
  const fl=R2[id].flat&&gi(R2[id].flat);
  if(fl){const bw=fl.br-fl.bl,bh=fl.bb-fl.bt,h=54,k=h/bh,cap=Math.min(bh*.9,bw*.2),cw=cap*k,top=y-9;
   if(w<cw*2+10){ctx.drawImage(fl.im,fl.bl,fl.bt,bw,bh,x,top,w,h);return true;}
   ctx.drawImage(fl.im,fl.bl,fl.bt,cap,bh,x,top,cw,h);ctx.drawImage(fl.im,fl.bl+cap,fl.bt,bw-2*cap,bh,x+cw-.5,top,w-2*cw+1,h);ctx.drawImage(fl.im,fl.br-cap,fl.bt,cap,bh,x+w-cw,top,cw,h);return true;}
  const s=R2[id].set,L=gi(nm(s,'platform-L')),M=gi(nm(s,'platform-M')),R=gi(nm(s,'platform-R'));if(!L||!M||!R)return false;
  const h=44,k=h/(M.bb-M.bt),lw=(L.br-L.bl)*k,rw=(R.br-R.bl)*k,top=y-4;
  if(w<lw+rw+20){const q=w/(lw+rw+20);ctx.drawImage(M.im,M.bl,M.bt,M.br-M.bl,M.bb-M.bt,x,top,w,h*q+h*(1-q));return true;}
  const mw=(M.br-M.bl)*k;ctx.save();ctx.beginPath();ctx.rect(x+lw-1,top-4,w-lw-rw+2,h+8);ctx.clip();
  for(let q=x+lw;q<x+w-rw;q+=mw)ctx.drawImage(M.im,M.bl,M.bt,M.br-M.bl,M.bb-M.bt,q,top,mw+1,h);ctx.restore();
  ctx.drawImage(L.im,L.bl,L.bt,L.br-L.bl,L.bb-L.bt,x,top,lw,h);ctx.drawImage(R.im,R.bl,R.bt,R.br-R.bl,R.bb-R.bt,x+w-rw,top,rw,h);return true;}
 const T=window.RunnerThemes;
 function wrap(id,set,bgName,wallPx,tile,opts){
  const old=T[id];if(!old)return;
  const o=Object.assign({mirrorFloor:false,ledge:['home-shelf',34],hang:null,pit:null},opts||{});
  T[id]=Object.assign({},old,{
   bg(S,floor){if(R2[id]&&wall3(id,S,floor))return;if(PAN[id]&&panelWall(id,S,floor))return;if(!backdrop(bgName,S,floor,wallPx,1,o.scale))old.bg(S,floor);},
   floor(S,floor){scenery(id,S,floor);if(R2[id]&&terrainFloor(R2[id].set,S,floor))return;if(R2[id]&&floor2(id,S,floor))return;if(PAN[id]&&panelFloor(id,S,floor))return;if(!tileBand(tile,S,bandTop(floor),bandH(floor),o.mirrorFloor,o.crop))old.floor(S,floor);},
   prop(ob,floor){if(R2[id]&&prop3(id,ob,floor-(ob.oy||0)))return true;const r=prop(set,ob,floor-(ob.oy||0));return r===false?old.prop(ob,floor):r;},
   ledge(x,y,w,ob){if(R2[id]&&ledge3(id,x,y,w,ob))return;if(!slice3(o.ledge[0],x,y-4,w,o.ledge[1]))old.ledge(x,y,w);},
   hang(ob,floor){if(R2[id]&&hang3(id,ob,floor))return;if(!(o.hang&&o.hang(ob,floor)))old.hang(ob,floor);},
   pit(ob,floor){if(R2[id]&&pit2(id,ob,floor))return;if(!(o.pit&&o.pit(ob,floor)))(old.pit?old.pit(ob,floor):(ctx.fillStyle='#6d5a55',ctx.fillRect(ob.x,floor-17,ob.w,viewHeight-floor+17)));},
  });
 }
 // Hanging pieces
 const hangMobile=(ob,floor)=>{const im=img('home-mobile');if(!im)return false;const b=floor-ob.bottom,w=ob.w*1.25,h=w*im.naturalHeight/im.naturalWidth,x=ob.x+ob.w/2-w/2,top=b-h;
  ctx.strokeStyle='#b98a5a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+w*.25,0);ctx.lineTo(x+w*.25,top+8);ctx.moveTo(x+w*.75,0);ctx.lineTo(x+w*.75,top+8);ctx.stroke();ctx.drawImage(im,x,top,w,h);return true;};
 const hangRopeSprite=name=>(ob,floor)=>{const im=img(name);if(!im)return false;const b=floor-ob.bottom,w=ob.w*1.5,h=w*im.naturalHeight/im.naturalWidth,x=ob.x+ob.w/2-w/2,top=b-h;ropes(name,x,top,w,h);ctx.drawImage(im,x,top,w,h);return true;};
 const hangStorm=(ob,floor)=>{const im=img('angel-hang');if(!im)return false;const b=floor-ob.bottom,h=Math.max(b,200),w=h*im.naturalWidth/im.naturalHeight,x=ob.x+ob.w/2-w/2,top=b-h;ropes('angel-hang',x,top,w,h);ctx.drawImage(im,x,top,w,h);return true;};
 const hangWillow=(ob,floor)=>{const im=img('park-willow');if(!im)return false;const b=floor-ob.bottom,w=ob.w*1.8,x=ob.x+ob.w/2-w/2;ctx.drawImage(im,x,-6,w,b+6);return true;};
 // Pits: edge pieces on both sides and something to see in the gap
 const pitShop=(ob,floor)=>{if(!img('shop-tile'))return false;ctx.fillStyle='#5e4a44';ctx.fillRect(ob.x,floor-17,ob.w,viewHeight-floor+17);ctx.fillStyle='#f5d58a';
  for(let x=ob.x+10;x<ob.x+ob.w-16;x+=26){ctx.beginPath();ctx.moveTo(x,floor-20);ctx.lineTo(x+12,floor-20);ctx.lineTo(x+6,floor-30);ctx.closePath();ctx.fill();}
  edge('shop-tileEdgeL','shop-tile',floor,ob.x-6,true);edge('shop-tileEdgeR','shop-tile',floor,ob.x+ob.w+6,false);return true;};
 const pitPark=(ob,floor)=>{if(!img('park-grass'))return false;const top=floor-8;ctx.fillStyle='#45a4e0';ctx.fillRect(ob.x,top,ob.w,viewHeight-top);ctx.fillStyle='#8ccdf2';ctx.fillRect(ob.x,top,ob.w,7);
  ctx.strokeStyle='#ffffffaa';ctx.lineWidth=2;for(let i=0;i<3;i++){const y=top+26+i*18;ctx.beginPath();ctx.moveTo(ob.x+8+i*8,y);ctx.quadraticCurveTo(ob.x+ob.w/2,y-6,ob.x+ob.w-8,y);ctx.stroke();}
  edge('park-waterL','park-grass',floor,ob.x-2,true);edge('park-waterR','park-grass',floor,ob.x+ob.w+2,false);return true;};
 const pitAngel=(ob,floor)=>{if(!img('angel-groundA'))return false;const g=ctx.createLinearGradient(0,floor-30,0,viewHeight);g.addColorStop(0,'#e9e4fb');g.addColorStop(1,'#cfe6f7');ctx.fillStyle=g;ctx.fillRect(ob.x,floor-32,ob.w,viewHeight-floor+32);
  edge('angel-groundB','angel-groundA',floor,ob.x+4,true);edge('angel-groundC','angel-groundA',floor,ob.x+ob.w-4,false);return true;};
 wrap('friend','home','bg-home',182,'home-plank',{scale:1.7,ledge:['home-shelf',36],hang:hangMobile});
 wrap('shopkeeper','shop','bg-shop',178,'shop-tile',{ledge:['shop-tile',30],hang:hangRopeSprite('shop-hang'),pit:pitShop});
 wrap('parkfriend','park','bg-park',184,'park-grass',{scale:1.9,mirrorFloor:true,ledge:['park-log',36],hang:null,pit:pitPark});
 wrap('angel','angel','bg-angel',210,'angel-groundA',{scale:1.7,mirrorFloor:true,crop:[.16,.78],ledge:['angel-platform',44],hang:hangStorm,pit:pitAngel});

 // The 세진이 stage keeps its mint workshop background; only the obstacles become pictures (game.js drawObstacle asks here).
 window.RunnerArt={workBackground:(S,floor)=>approvedWall('work',S,floor),workFloor:(S,floor)=>terrainFloor('work',S,floor),sejin:(o,floor)=>freshProp('work',o,floor)||prop('work',o,floor)!==false,pool:(id,kind)=>R2[id]?pool(id,kind):[]};
 Object.entries(FRESH).forEach(([set,kinds])=>kinds.forEach(k=>gi(set+'-'+(k==='strand'?'tangle':k)+'-v25')));
 Object.values(TERRAIN).forEach(c=>{img(c.g[0]);img(c.p[0]);});
 Object.values(SCENERY).forEach(c=>gi(c[0]));
 gi('home-bookcase-v25');
 ['shop-wall-reference-v29'].forEach(img);
 Object.values(APPROVED_WALLS).forEach(c=>c.files.forEach(approvedImage));
 ['shop-yarn-display-v29','park-flower-log-v29','angel-lilac-column-v29','work-cone-blue-v25','work-cone-pink-v25','work-cone-yellow-v25'].forEach(gi);
 // Start loading everything right away.
 Object.values(R2).forEach(c=>{['ground','edge-left','edge-right','wall-only-a','wall-only-b','cone','awl','strand','scissors','triangle','ruler','ball','hang','platform-L','platform-M','platform-R'].forEach(k=>gi(nm(c.set,k)));gi(c.set+'-pit-fill-v3');gi(c.set+'-ground-solid-v3');gi(c.set+'-ground-block-map-v13');gi(c.set+'-column-v15');gi(c.set+'-ground-block-rect-v18');gi(c.set+'-ground-fill-v19');gi(c.set+'-ground-slab-v21');gi(c.set+'-ground-block-finished-v20');gi(c.set+'-short-block-v5');[1,2,3,4].forEach(i=>bgImg(c.set+'-bg-'+i+'-v14'));if(c.flat)gi(c.flat);});
 ['home-yarn','home-teapot','home-books2','home-lamp','home-books3','home-table','home-mobile','home-shelf','home-plank','shop-cone','shop-basket','shop-crate','shop-spools','shop-boxes','shop-counter2','shop-yarn','shop-hang','shop-tile','shop-tileEdgeL','shop-tileEdgeR',
  'park-bush','park-rock','park-fence','park-tree','park-sign','park-log','park-bench','park-ball','park-willow','park-grass','park-waterL','park-waterR','angel-cloudA','angel-cloudB','angel-rainbow','angel-towerA','angel-towerB','angel-cloudLong','angel-star','angel-hang','angel-platform','angel-groundA','angel-groundB','angel-groundC',
  'work-cone','work-spool','work-tangle','work-scissors','work-triangle','work-ruler','work-yarn','bg-home','bg-shop','bg-park','bg-angel'].forEach(img);
})();
