'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');
// knit.html?doll=<id> plays that doll's stage (runner.js STAGES; order and names in sejin-places.js DOLLS).
const DOLL=new URLSearchParams(location.search).get('doll')||'sejin';
const runner=new Runner(Math.random,DOLL),sprite=new Image();
// 직접 만든 배치(runner-layouts.js 또는 이 브라우저의 편집기 저장본)가 있으면 무작위 대신 그 배치로 나온다. ?layout=off 로 끄기.
(()=>{const q=new URLSearchParams(location.search);if(q.get('layout')==='off'||q.get('edit'))return;let L=null;try{const t=q.get('layout')==='reference'?null:localStorage.getItem('sejin-runner-layout-'+runner.stageId);if(t){const o=JSON.parse(t);if(o&&o.items&&o.items.length)L=o.items;}}catch(e){}
 if(!L&&window.RUNNER_LAYOUTS&&window.RUNNER_LAYOUTS[runner.stageId]&&window.RUNNER_LAYOUTS[runner.stageId].items&&window.RUNNER_LAYOUTS[runner.stageId].items.length)L=window.RUNNER_LAYOUTS[runner.stageId].items;
 if(L)runner.layout=L.slice().sort((a,b)=>a.at-b.at);})();
const $=s=>document.querySelector(s);
const DOLLS=window.SejinPlaces?.DOLLS||[{id:'sejin',name:'세진이 인형'}];
const doll=DOLLS.find(d=>d.id===runner.stageId)||DOLLS[0],dollIndex=DOLLS.indexOf(doll);
const josa=(w,a,b)=>{const c=w.charCodeAt(w.length-1)-0xAC00;return w+(c>=0&&c<11172&&c%28?a:b);};
// A stage opens once the doll before it has been finished (checked against the room's save).
const prevDoll=dollIndex>0?DOLLS[dollIndex-1]:null,saved=window.SejinSave?.load()||{};
// Dolls finished = what the room saved + runs finished since (not yet applied by the room), so the next stage opens right away.
const dollsDone=()=>({...(saved.dolls||{}),...(window.SejinSave?.pendingView?.(window.SejinPlaces?.dollById).dolls||{})});
const stageLocked=!!prevDoll&&!dollsDone()[prevDoll.id]&&!window.SejinSave?.testMode;
const overlay=$('#overlay'),start=$('#start'),state=$('#state'),progressText=$('#progress'),dollFill=$('#dollFill'),trophy=$('#trophy');
const menu=$('#menu'),settings=$('#settings'),toRoom=$('#toRoom');
let ready=false,last=0,viewHeight=540,viewWidth=960,paused=false,shown='',menuOpen=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
// Energy: every doll run costs COST (the 세진이 practice stage and test mode are free).
const COST=runner.stageId==='sejin'||window.SejinSave?.testMode?0:(window.SejinSave?.ENERGY.RUN_COST||15);
let energy=window.SejinSave?window.SejinSave.energyNow():100;
// Making a doll also costs 실뭉치 (DOLLS[].makeCost; the 세진이 practice stage and test mode are free). Thread gathered inside a run stays in the run.
const YCOST=runner.stageId==='sejin'||window.SejinSave?.testMode?0:(window.SejinPlaces?.dollById(runner.stageId)?.makeCost||0);
const yarnHave=()=>Math.max(0,((window.SejinSave?.load()||{}).yarn??120)+(window.SejinSave?.pendingView?.(window.SejinPlaces?.dollById).yarn||0));
function showTired(){
 overlay.hidden=false;trophy.hidden=true;$('#eyebrow').textContent='SLEEPY…';
 $('#title').textContent='에너지가 부족해요';
 $('#message').innerHTML='지금 에너지 <b>'+energy+'</b> · 한 판에 필요한 에너지 <b>'+COST+'</b><br>방에서 별사탕·우유·꿀 에너지 음료를 먹거나 낮잠을 재워 주세요.<br>에너지는 2분마다 1씩 저절로 차요.';
 start.textContent='에너지 부족';start.disabled=true;toRoom.textContent='간식 먹으러 가기';toRoom.href='design/raising-mockup.html#shop';toRoom.hidden=false;
}
sprite.onload=()=>{if(stageLocked)return;ready=true;start.disabled=false;start.textContent='뜨개 시작';if(COST&&energy<COST)showTired();};
// Yarn stages: gather the doll's thread (NEED) in ONE run and reach the end to make it; otherwise try again.
// Thread left over (or from a run that did not make the doll) becomes 실뭉치 in the room.
const NEED=doll.yarn||0,made=!!dollsDone()[doll.id];
// The 작업실 list in the room is the stage screen, so there is no second one here; after a clear the next stage is linked.
const stageHref=d=>'knit.html'+(DOLLS.indexOf(d)?'?doll='+d.id:'');
// Stage intro: doll name, place and the extra controls of the harder stages.
if(runner.stageId!=='sejin'){
 const stars='★'.repeat(dollIndex+1);
 $('#title').textContent='오늘은 '+josa(doll.name,'을','를')+' 떠 볼까?';
 $('#message').innerHTML=(doll.stage||'')+' 스테이지 '+stars+'<br>'+
  '한 판 안에 실 <b>'+NEED+'개</b>를 모으고 끝까지 가면 완성! 모자라면 다시 도전해요.<br>'+(made?'(이미 완성한 인형이에요. 또 완성하면 개수가 늘어요.)<br>':'')+
  '<b>점프</b> 스페이스·↑·화면 터치 (공중에서 한 번 더 = 더블 점프)<br><b>숙이기</b> ↓·Shift 또는 숙이기 버튼 (누르고 있으면 계속)<br>위에 매달린 것은 숙여서, 바닥 구멍은 점프로 지나가요.'+
  (COST?'<br><small>에너지 '+COST+' 사용 · 지금 에너지 '+energy+(YCOST?' · 실뭉치 '+YCOST+'개 사용':'')+'</small>':'')+'<br><small>이 판에서 모은 실은 이 판에서만 써요 (가방에 들어오지 않아요).</small>';
 document.title='방구석 세진이 · '+doll.name;
 // The progress in the HUD is the way to the end of the stage, not the doll.
 const label=$('.goal>span:last-child');if(label&&label.firstChild)label.firstChild.textContent='도착까지';
}
if(stageLocked){$('#title').textContent=josa(prevDoll.name,'을','를')+' 먼저 완성해 주세요';$('#message').innerHTML=josa(doll.name,'은','는')+' 앞 인형을 완성하면 뜰 수 있어요.<br>작업실에서 '+josa(prevDoll.name,'을','를')+' 먼저 떠 보세요.';start.textContent='아직 잠겨 있어요';$('#toRoom').hidden=false;}
sprite.onerror=()=>{$('#message').textContent='캐릭터 이미지를 불러오지 못했어요. assets 폴더가 함께 있는지 확인해 주세요.';start.textContent='이미지를 찾을 수 없어요';};
sprite.src='assets/runner-bg/run-sheet-v1.png';
const duckImg=new Image();duckImg.src='assets/character/basic-duck-v4-cut.png';
// 숙이기 = 엎드려 기어가기: 들어가기 1장 → 기어가기 4프레임 반복 → 일어나기 1장 (assets/runner2/sejin-crawl-*-v2.png). 6장 다 불러와지면 사용, 아니면 위 한 장 그림.
const crawl={names:['in','1','2','3','4','out'],im:{},box:null};
crawl.names.forEach(n=>{const i=new Image();i.src='assets/runner/common/sejin-crawl-'+n+'-v2.png';crawl.im[n]=i;});
function crawlBox(){if(crawl.box)return crawl.box;if(!crawl.names.every(n=>crawl.im[n].complete&&crawl.im[n].naturalWidth))return null;
 try{let l=1e9,t=1e9,r=0,b=0;for(const n of crawl.names){const im=crawl.im[n],w=im.naturalWidth,h=im.naturalHeight,c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);const d=g.getImageData(0,0,w,h).data;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>60){if(x<l)l=x;if(x>r)r=x;if(y<t)t=y;if(y>b)b=y;}}
  crawl.box=[l,t,r-l+1,b-t+1];}catch(e){crawl.box=[0,0,crawl.im.in.naturalWidth,crawl.im.in.naturalHeight];}return crawl.box;}
let crawlWas=false,crawlT0=0,crawlOut=0;
function crawlFrame(){const box=crawlBox();if(!box)return null;const now=performance.now()/1000,d=runner.ducking;
 if(d&&!crawlWas)crawlT0=now;if(!d&&crawlWas)crawlOut=now+.14;crawlWas=d;
 if(d){const t=now-crawlT0;return t<.1?'in':String(1+Math.floor((t-.1)*12)%4);}
 return now<crawlOut?'out':null;}
// Selected mint workshop artwork. Keep the procedural scene as a loading/error fallback.
const workshop=new Image();
workshop.src='assets/runner-bg/runner-bg-mint-concept-v1.png';
const workshopB=new Image();
workshopB.src='assets/runner-bg/runner-bg-mint-panel-b-v1.png';
// Two artworks alternate as separate panels (never mirrored) with plain wall stretches of
// varying width in between, so the room keeps going instead of reflecting back on itself.
// Source coordinates are in the 1536×1024 artwork.
// wallPatch: plain striped wall between the garland pompoms and the shelf, 4 stripe periods (≈83.5 px) wide.
const WS={split:740,rail:586,wallPatch:[454,136,334,90],railPatch:[470,586,370,154],pad:70,feather:36,
 // The right curtain and rod knob mirrored to finish the window's cut-off left side
 // (curtain slice stops before the shelf ends at x≈454).
 curtain:[[335,85,140,30],[335,115,115,450]]};
let panelArt=null,panelArtB=null;
function buildPanelArt(source=workshop,finishCurtain=true){
 const W=workshop.naturalWidth,H=workshop.naturalHeight,c=document.createElement('canvas');c.width=W+WS.pad;c.height=H;const g=c.getContext('2d');
 // Normalize companion art to the original geometry, even if export dimensions differ.
 g.drawImage(source,0,0,source.naturalWidth,source.naturalHeight,WS.pad,0,W,H);
 // Mirror about the window centre (x=205): source x maps to 410-x.
 if(finishCurtain)for(const [cx,cy,cw,ch] of WS.curtain){g.save();g.translate(WS.pad+(410-cx),0);g.scale(-1,1);g.drawImage(workshop,cx,cy,cw,ch,0,cy,cw,ch);g.restore();}
 // Soft left/right edges blend each panel into the plain wall around it.
 g.globalCompositeOperation='destination-out';
 const f=WS.feather,edge=(x0,x1)=>{const gr=g.createLinearGradient(x0,0,x1,0);gr.addColorStop(0,'#000');gr.addColorStop(1,'#0000');g.fillStyle=gr;g.fillRect(Math.min(x0,x1),0,Math.abs(x1-x0),H);};
 edge(0,f);edge(c.width,c.width-f);
 return c;
}
const panelHash=i=>{const s=Math.sin(i*91.7+13.1)*43758.5453;return s-Math.floor(s);};
const panelStarts=[0];
function panelStart(i){while(panelStarts.length<=i){const k=panelStarts.length-1;panelStarts.push(panelStarts[k]+workshop.naturalWidth+WS.pad+(.15+.2*panelHash(k))*workshop.naturalWidth);}return panelStarts[i];}
function drawWorkshop(floor){
 if(window.RunnerArt?.workBackground(runner.distance*50,floor)){window.RunnerArt.workFloor(runner.distance*50,floor);return true;}
 if(!workshop.complete||!workshop.naturalWidth)return false;
 if(!panelArt)panelArt=buildPanelArt();
 if(!panelArtB&&workshopB.complete&&workshopB.naturalWidth)panelArtB=buildPanelArt(workshopB,false);
 const H=workshop.naturalHeight,wallHeight=Math.min(floor,620),top=floor-wallHeight,s=wallHeight/WS.split;
 const travel=runner.distance*50,railY=top+WS.rail*s,floorH=viewHeight-floor;
 // Continuous plain room underneath: striped wall, wainscot rail and floor boards.
 const [wx,wy,ww,wh]=WS.wallPatch,tw=ww*s,th=wh*s;
 for(let x=-(travel%tw);x<viewWidth;x+=tw)for(let y=railY-th;y>-th;y-=th)ctx.drawImage(workshop,wx,wy,ww,wh,x,y,tw+.5,th+.5);
 const [rx,ry,rw,rh]=WS.railPatch,rtw=rw*s;
 for(let x=-(travel%rtw);x<viewWidth;x+=rtw)ctx.drawImage(workshop,rx,ry,rw,rh,x,railY,rtw+.5,rh*s+.5);
 const fw=workshop.naturalWidth*s;
 for(let x=-(travel%fw);x<viewWidth;x+=fw)ctx.drawImage(workshop,0,WS.split,workshop.naturalWidth,H-WS.split,x,floor,fw+.5,floorH);
 // Artwork panels at their own spots along the room.
 const pw=panelArt.width*s;
 let i=0;while(panelStart(i+1)*s-travel<0)i++;
 for(;panelStart(i)*s-travel<viewWidth;i++){
  const x=panelStart(i)*s-travel;
  const art=i%2&&panelArtB?panelArtB:panelArt;
  ctx.drawImage(art,0,0,art.width,WS.split,x,top,pw,wallHeight);
  // Keep the original floor continuous beneath both panels, with no per-panel seam.
 }
 if(window.RunnerArt)window.RunnerArt.workFloor(travel,floor);
 return true;
}
function resize(){const box=canvas.getBoundingClientRect();viewWidth=box.width/box.height>1.2?960:640;runner.spacing=viewWidth<800&&runner.stageId!=='sejin'?.7:1;viewHeight=viewWidth*box.height/box.width;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);}
new ResizeObserver(resize).observe(canvas);
let endMode=false;
function begin(){if(!ready||stageLocked)return;endMode=false;
 if(COST&&energy<COST){showTired();return;}
 if(YCOST&&yarnHave()<YCOST){overlay.hidden=false;trophy.hidden=true;$('#eyebrow').textContent='NEED YARN';$('#title').textContent='실뭉치가 모자라요';$('#message').innerHTML='인형을 뜨려면 실뭉치 <b>'+YCOST+'개</b>가 필요해요 (지금 '+yarnHave()+'개).<br>실 가게에 소품을 팔거나 미니게임, 친구와 대화로 모아 보세요.';toRoom.hidden=false;return;}
 if(COST){window.SejinSave.pushResult({game:'energy',use:COST});energy-=COST;}
 if(YCOST)window.SejinSave.pushResult({game:'spend',cost:YCOST});
 runner.reset();cd=reduced?1:3;popups=[];prevCoins=0;paused=false;shown='';menuOpen=false;menu.hidden=true;overlay.hidden=true;trophy.hidden=true;toRoom.hidden=true;$('#announcement').textContent='뜨개 시작. 화면 또는 스페이스바로 실을 뛰어넘으세요.';canvas.focus({preventScroll:true});last=0;}
start.addEventListener('click',begin);
// 결과 화면 버튼(다시 뜨기·다음 스테이지·방으로)은 두 번 눌러야 넘어간다: 첫 번째는 '한 번 더!' 표시만.
let armedBtn=null,armTimer=0;
function disarm(){if(armedBtn){armedBtn.textContent=armedBtn.dataset.orig;armedBtn.classList.remove('armed');armedBtn=null;}clearTimeout(armTimer);}
overlay.addEventListener('click',e=>{const b=endMode&&e.target.closest('#start,#nextStage,#toRoom');if(!b)return;
 if(armedBtn===b){disarm();return;}
 e.preventDefault();e.stopImmediatePropagation();disarm();
 b.dataset.orig=b.textContent;b.textContent='한 번 더 눌러요!';b.classList.add('armed');armedBtn=b;armTimer=setTimeout(disarm,2500);window.SejinSfx&&SejinSfx.play('pop');
},true);

canvas.addEventListener('pointerdown',e=>{if(e.isPrimary&&e.button===0){e.preventDefault();runner.jump();}});
// Settings menu: pauses the run; resume, restart or go back to the room.
function openMenu(){if(runner.status!=='running'||menuOpen)return;menuOpen=true;menu.hidden=false;state.textContent='잠깐 멈춤';$('#menuInfo').textContent='완성도 '+Math.floor(runner.progress*100)+'% · 하트 '+runner.health+'개';$('#resume').focus({preventScroll:true});}
function closeMenu(){if(!menuOpen)return;menuOpen=false;menu.hidden=true;last=0;canvas.focus({preventScroll:true});}
settings.addEventListener('click',openMenu);$('#resume').addEventListener('click',closeMenu);$('#menuClose').addEventListener('click',closeMenu);$('#restart').addEventListener('click',begin);
const DUCK_KEYS=['ArrowDown','ShiftLeft','ShiftRight','KeyS'];
document.addEventListener('keydown',e=>{
 if(e.code==='Escape'){if(menuOpen)closeMenu();else openMenu();return;}
 if(DUCK_KEYS.includes(e.code)&&runner.stage.extras&&!menuOpen){e.preventDefault();if(!e.repeat)runner.duck(true);return;}
 if(e.code==='ArrowUp'&&runner.status==='running'&&!menuOpen){e.preventDefault();if(!e.repeat)runner.jump();return;}
 if(e.code!=='Space'||e.repeat||menuOpen||e.target.tagName==='BUTTON'||e.target.tagName==='A')return;e.preventDefault();if(runner.status==='running')runner.jump();else if(!stageLocked){if(endMode)start.click();else begin();}});
document.addEventListener('keyup',e=>{if(DUCK_KEYS.includes(e.code))runner.duck(false);});
// Harder stages: big on-screen 점프 / 숙이기 buttons (hold 숙이기) and a yarn counter in the HUD.
let pad=null,yarnChip=null;
if(runner.stage.extras){
 pad=document.createElement('div');pad.className='pad';pad.hidden=true;
 pad.innerHTML='<button class="pad-btn jump" type="button" aria-label="점프">점프</button><button class="pad-btn duck" type="button" aria-label="숙이기, 누르고 있으면 계속">숙이기</button>';
 $('.game-shell').append(pad);
 const [jb,db]=pad.querySelectorAll('button');
 jb.addEventListener('pointerdown',e=>{e.preventDefault();runner.jump();});
 db.addEventListener('pointerdown',e=>{e.preventDefault();db.setPointerCapture(e.pointerId);runner.duck(true);db.classList.add('on');});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])db.addEventListener(ev,()=>{runner.duck(false);db.classList.remove('on');});
 yarnChip=document.createElement('span');yarnChip.className='yarn-chip';yarnChip.innerHTML='<i></i><b>0</b>';$('.hud-right').prepend(yarnChip);
}
document.addEventListener('visibilitychange',()=>{paused=document.hidden;last=0;});

// ---- Workroom drawing helpers ----
const INK='#8a6f60',SHADE='rgba(95,65,55,.24)';
function rr(g,x,y,w,h,r,fill,stroke,lw=1.5){g.beginPath();g.roundRect(x,y,w,h,r);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}}
function circle(g,x,y,r,fill,stroke,lw=1.5){g.beginPath();g.arc(x,y,r,0,Math.PI*2);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}}
function yarnBall(g,cx,cy,r,color,angle=0){
 g.save();g.translate(cx,cy);g.rotate(angle);circle(g,0,0,r,color);
 g.save();g.clip();g.strokeStyle=SHADE;g.lineWidth=Math.max(1,r/11);
 for(let i=-3;i<=3;i++){g.beginPath();g.ellipse(0,i*r*.3,r*1.2,r*.3,0,0,Math.PI*2);g.stroke();}
 g.rotate(1.15);for(let i=-1;i<=1;i++){g.beginPath();g.ellipse(0,i*r*.45,r*1.2,r*.28,0,0,Math.PI*2);g.stroke();}
 g.restore();g.restore();
 g.beginPath();g.arc(cx-r*.28,cy-r*.3,r*.45,Math.PI*1.05,Math.PI*1.55);g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=Math.max(1.5,r/7);g.stroke();
 circle(g,cx,cy,r,null,INK,Math.max(1.5,r/10));
}
function cone(g,x,base,w,h,color){
 const cx=x+w/2,top=base-h+10,tw=w*.42;
 rr(g,cx-6,base-h,12,14,3,'#f4e6cc',INK);
 g.beginPath();g.moveTo(x,base);g.lineTo(cx-tw/2,top);g.lineTo(cx+tw/2,top);g.lineTo(x+w,base);g.closePath();g.fillStyle=color;g.fill();
 g.save();g.clip();g.strokeStyle=SHADE;g.lineWidth=1.2;g.beginPath();for(let y=top+4;y<base;y+=5){g.moveTo(x-4,y+2);g.lineTo(x+w+4,y-2);}g.stroke();
 g.fillStyle='rgba(255,255,255,.28)';g.beginPath();g.moveTo(x+w*.16,base);g.lineTo(cx-tw/2+2,top);g.lineTo(cx-tw/2+7,top);g.lineTo(x+w*.3,base);g.fill();g.restore();
 g.beginPath();g.moveTo(x,base);g.lineTo(cx-tw/2,top);g.lineTo(cx+tw/2,top);g.lineTo(x+w,base);g.closePath();g.strokeStyle=INK;g.lineWidth=1.8;g.stroke();
 rr(g,x-2,base-4,w+4,5,2,'#f4e6cc',INK,1.2);
}
function spool(g,x,base,color,s=1){rr(g,x-8*s,base-3*s,16*s,3*s,1.5,'#d9bf9c',INK,1);rr(g,x-8*s,base-20*s,16*s,3*s,1.5,'#d9bf9c',INK,1);rr(g,x-6*s,base-17*s,12*s,14*s,2,color,INK,1);g.strokeStyle=SHADE;g.lineWidth=1;g.beginPath();for(let y=base-15*s;y<base-4*s;y+=3*s){g.moveTo(x-6*s,y);g.lineTo(x+6*s,y+1);}g.stroke();}
function sparkle(g,x,y,r){g.beginPath();g.moveTo(x,y-r*2);g.quadraticCurveTo(x,y,x+r*2,y);g.quadraticCurveTo(x,y,x,y+r*2);g.quadraticCurveTo(x,y,x-r*2,y);g.quadraticCurveTo(x,y,x,y-r*2);g.fillStyle='#f5d58a';g.fill();g.strokeStyle=INK;g.lineWidth=.8;g.stroke();}
function makeTile(w,h,paint){const c=document.createElement('canvas');c.width=w*2;c.height=h*2;const g=c.getContext('2d');g.scale(2,2);g.lineJoin='round';g.lineCap='round';paint(g);return c;}

// A very light handmade paper grain keeps the canvas surfaces from looking flat.
// It is pre-rendered once so the animation loop stays inexpensive.
const textureTile=makeTile(180,180,g=>{
 g.globalAlpha=.16;
 for(let y=7;y<180;y+=13)for(let x=5;x<180;x+=17){
  const n=(x*17+y*31)%23;
  g.fillStyle=n%3===0?'#b99582':n%3===1?'#fffaf0':'#d9c2ad';
  g.fillRect(x+(n%5),y+(n%4),n%2?1.2:2.2,n%2?1:1.5);
 }
 g.globalAlpha=.11;g.strokeStyle='#b8957e';g.lineWidth=1;
 for(let y=18;y<180;y+=28){g.beginPath();g.moveTo(0,y);g.bezierCurveTo(45,y-2,100,y+3,180,y-1);g.stroke();}
});

// Tile A: window with curtains, yarn shelves.
const TILE_W=560,TILE_H=400;
const tileA=makeTile(TILE_W,TILE_H,g=>{
 rr(g,40,70,160,212,[80,80,8,8],'#e2d3bf',INK);rr(g,51,81,138,192,[70,70,4,4],'#d4ebef');
 circle(g,92,140,11,'#fbfdfd');circle(g,106,134,14,'#fbfdfd');circle(g,122,141,10,'#fbfdfd');
 g.fillStyle='#fbf7ec';g.fillRect(117,82,6,190);g.fillRect(51,172,138,6);
 rr(g,28,278,184,12,6,'#dac9b3',INK);
 rr(g,150,252,26,26,[2,2,6,6],'#e3a88a',INK);g.fillStyle='#a9cfa4';for(const [x,y,a] of [[156,244,-.5],[170,242,.5],[163,236,0]]){g.beginPath();g.ellipse(x,y,5,11,a,0,Math.PI*2);g.fill();g.strokeStyle=INK;g.lineWidth=1;g.stroke();}
 yarnBall(g,78,268,10,'#f5d58a');
 g.strokeStyle='#c9ad8f';g.lineWidth=4;g.beginPath();g.moveTo(22,62);g.lineTo(218,62);g.stroke();circle(g,22,62,5,'#c9ad8f');circle(g,218,62,5,'#c9ad8f');
 for(const m of [1,-1]){const X=x=>m>0?x:240-x;g.beginPath();g.moveTo(X(24),64);g.lineTo(X(74),64);g.quadraticCurveTo(X(64),150,X(50),186);g.quadraticCurveTo(X(66),240,X(72),300);g.lineTo(X(24),300);g.closePath();g.fillStyle='#f6cfd4';g.fill();g.strokeStyle=INK;g.lineWidth=1.5;g.stroke();
  g.strokeStyle='rgba(200,140,150,.35)';g.beginPath();g.moveTo(X(38),70);g.lineTo(X(38),290);g.moveTo(X(54),70);g.quadraticCurveTo(X(50),130,X(46),180);g.stroke();circle(g,X(50),186,6,'#e79aa8',INK,1.2);}
 // Guardian-angel props: a halo mobile hanging from the curtain rod.
 g.strokeStyle='#cdb9a2';g.lineWidth=1.2;g.beginPath();g.moveTo(120,62);g.lineTo(120,83);g.stroke();
 g.beginPath();g.ellipse(120,89,15,5,0,0,Math.PI*2);g.strokeStyle=INK;g.lineWidth=5.5;g.stroke();g.strokeStyle='#f5d58a';g.lineWidth=3.5;g.stroke();
 sparkle(g,99,84,5);sparkle(g,142,94,4);sparkle(g,131,76,3);
 const plank=(y)=>{rr(g,270,y,272,10,3,'#dcc4a4',INK);for(const bx of [296,512]){g.beginPath();g.moveTo(bx,y+10);g.lineTo(bx+16,y+10);g.lineTo(bx,y+28);g.closePath();g.fillStyle='#d2b894';g.fill();g.strokeStyle=INK;g.lineWidth=1.2;g.stroke();}};
 cone(g,282,170,34,56,'#8fc3e0');cone(g,322,170,34,50,'#f2a7b5');cone(g,362,170,34,56,'#a9cfa4');
 yarnBall(g,422,154,16,'#f5d58a');yarnBall(g,456,157,13,'#c9b3e6');
 for(const [x,c] of [[490,'#f2a7b5'],[498,'#8fc3e0'],[507,'#f5d58a']]){g.strokeStyle='#c7b09a';g.lineWidth=2.5;g.beginPath();g.moveTo(x,166);g.lineTo(x+(x-498)*.4,112);g.stroke();circle(g,x+(x-498)*.4,110,4,c,INK,1);}
 // An angel feather tucked in with the knitting needles.
 g.strokeStyle='#c7b09a';g.lineWidth=1.5;g.beginPath();g.moveTo(512,166);g.lineTo(521,98);g.stroke();
 g.beginPath();g.moveTo(514,150);g.quadraticCurveTo(533,122,521,94);g.quadraticCurveTo(505,116,514,150);g.fillStyle='#fffdf8';g.fill();g.strokeStyle=INK;g.lineWidth=1.2;g.stroke();
 g.strokeStyle='rgba(143,195,224,.8)';g.lineWidth=1;g.beginPath();for(const y of [110,122,134]){g.moveTo(518,y+4);g.lineTo(525,y);g.moveTo(517,y+4);g.lineTo(511,y);}g.stroke();
 rr(g,480,128,36,42,[4,4,8,8],'rgba(220,236,240,.75)',INK);
 plank(170);
 yarnBall(g,306,244,14,'#f2a7b5');yarnBall(g,334,240,16,'#8fc3e0');yarnBall(g,362,245,13,'#a9cfa4');
 rr(g,284,244,100,36,8,'#e6c9a0',INK);g.strokeStyle='rgba(150,110,80,.35)';g.lineWidth=1.2;g.beginPath();for(let x=294;x<384;x+=10){g.moveTo(x,246);g.lineTo(x,278);}g.moveTo(286,262);g.lineTo(382,262);g.stroke();
 rr(g,404,244,90,12,2,'#a9cfa4',INK);rr(g,410,256,82,12,2,'#f5d58a',INK);rr(g,402,268,92,12,2,'#c9b3e6',INK);
 circle(g,522,266,13,'#f2a7b5',INK);g.strokeStyle='#b9c3c9';g.lineWidth=1.5;g.beginPath();g.moveTo(516,258);g.lineTo(512,246);g.moveTo(526,256);g.lineTo(530,244);g.stroke();circle(g,512,246,2.5,'#8fc3e0');circle(g,530,244,2.5,'#f5d58a');
 plank(280);
});
// Tile B: pegboard with tools, framed doll pattern.
const tileB=makeTile(TILE_W,TILE_H,g=>{
 rr(g,30,70,282,212,12,'#eadcc3',INK);g.fillStyle='#d6c3a4';for(let x=46;x<300;x+=20)for(let y=86;y<272;y+=20){g.beginPath();g.arc(x,y,1.6,0,Math.PI*2);g.fill();}
 const peg=(x,y)=>{g.strokeStyle='#b99c7c';g.lineWidth=3;g.beginPath();g.moveTo(x,y);g.lineTo(x,y+8);g.stroke();};
 peg(70,98);rr(g,58,104,24,82,12,'#8fc3e0',INK);g.strokeStyle=SHADE;g.lineWidth=1.3;g.beginPath();for(let y=110;y<182;y+=7){g.moveTo(60,y);g.lineTo(80,y+5);}g.stroke();rr(g,56,128,28,8,3,'#fbf1e2',INK,1.2);
 // A pair of small knitted angel wings hanging from a peg.
 const wing=(cx,y,s)=>{g.beginPath();g.moveTo(cx+s*2,y);g.bezierCurveTo(cx+s*12,y-6,cx+s*26,y-4,cx+s*26,y+6);g.quadraticCurveTo(cx+s*28,y+14,cx+s*21,y+16);g.quadraticCurveTo(cx+s*24,y+24,cx+s*15,y+27);g.quadraticCurveTo(cx+s*15,y+36,cx+s*7,y+36);g.quadraticCurveTo(cx+s*2,y+34,cx+s*2,y+24);g.closePath();g.fillStyle='#fffdf8';g.fill();g.strokeStyle=INK;g.lineWidth=1.4;g.stroke();
  g.strokeStyle='rgba(143,195,224,.85)';g.lineWidth=1.2;g.beginPath();g.moveTo(cx+s*6,y+8);g.quadraticCurveTo(cx+s*14,y+8,cx+s*20,y+12);g.moveTo(cx+s*6,y+17);g.quadraticCurveTo(cx+s*11,y+19,cx+s*14,y+25);g.stroke();};
 peg(106,98);g.strokeStyle='#cdb9a2';g.lineWidth=1.2;g.beginPath();g.moveTo(106,106);g.lineTo(106,116);g.stroke();wing(106,118,-1);wing(106,118,1);circle(g,106,121,3.5,'#f2a7b5',INK,1);
 peg(150,98);g.strokeStyle='#b9c3c9';g.lineWidth=4;g.beginPath();g.moveTo(146,124);g.lineTo(154,172);g.moveTo(154,124);g.lineTo(146,172);g.stroke();circle(g,142,114,7,null,'#e79aa8',3);circle(g,158,114,7,null,'#e79aa8',3);circle(g,150,132,2,INK);
 peg(214,98);g.strokeStyle='#b99c7c';g.lineWidth=1.2;g.beginPath();g.moveTo(214,106);g.lineTo(214,120);g.stroke();circle(g,214,156,36,'#fbf7ec','#d6b58c',5);
 for(const [a,c] of [[0,'#f2a7b5'],[1.26,'#f5d58a'],[2.51,'#c9b3e6'],[3.77,'#8fc3e0'],[5.03,'#a9cfa4']])circle(g,214+Math.cos(a)*9,156+Math.sin(a)*9,6,c);circle(g,214,156,5,'#fbf1e2');
 g.strokeStyle='#a9cfa4';g.lineWidth=2;g.beginPath();g.moveTo(214,170);g.quadraticCurveTo(220,180,214,188);g.stroke();
 peg(276,98);circle(g,276,122,15,'#f5d58a',INK);circle(g,276,122,5,'#fbf1e2',INK,1);g.fillStyle='#f5d58a';g.beginPath();g.moveTo(283,134);g.bezierCurveTo(300,170,262,190,280,236);g.lineTo(290,236);g.bezierCurveTo(272,190,310,170,291,132);g.fill();g.strokeStyle=INK;g.lineWidth=1.2;g.stroke();
 rr(g,90,236,150,8,3,'#dcc4a4',INK);spool(g,110,236,'#f2a7b5');spool(g,136,236,'#8fc3e0');spool(g,162,236,'#a9cfa4');spool(g,188,236,'#c9b3e6');spool(g,214,236,'#f5d58a');
 rr(g,350,80,172,196,6,'#d9bf9c',INK);rr(g,361,91,150,174,3,'#fffdf7');
 // Framed knitting chart: guardian-angel wings with a little halo, stitch by stitch on grid paper.
 // W = wing, L = lighter feather edge, H = halo.
 const WINGS=['.....HHH.....','LL.........LL','LWWW.....WWWL','LWWWWW.WWWWWL','.WWWWW.WWWWW.','.WWWWW.WWWWW.','..WWWW.WWWW..','...WWW.WWW...','.....W.W.....'];
 const CELL=9,cols=WINGS[0].length,rows=WINGS.length,cx0=436-cols*CELL/2,cy0=112;
 const STITCH={W:'#8fc3e0',L:'#cfe6f2',H:'#f5d58a'};
 WINGS.forEach((row,r)=>[...row].forEach((ch,c)=>{if(!STITCH[ch])return;g.fillStyle=STITCH[ch];g.fillRect(cx0+c*CELL,cy0+r*CELL,CELL,CELL);}));
 g.strokeStyle='rgba(143,195,224,.45)';g.lineWidth=1;g.beginPath();for(let c=0;c<=cols;c++){g.moveTo(cx0+c*CELL,cy0);g.lineTo(cx0+c*CELL,cy0+rows*CELL);}for(let r=0;r<=rows;r++){g.moveTo(cx0,cy0+r*CELL);g.lineTo(cx0+cols*CELL,cy0+r*CELL);}g.stroke();
 g.fillStyle='#9fb7c2';g.font='7px sans-serif';g.textAlign='left';for(const n of [1,5,9])g.fillText(String(n),cx0+cols*CELL+4,cy0+(rows-n)*CELL+7);
 g.fillStyle='#8a6f60';g.font='bold 11px "Malgun Gothic",sans-serif';g.textAlign='center';g.fillText('날개 뜨개 도안',426,238);
 yarnBall(g,486,248,9,'#f2a7b5');g.strokeStyle='#c7b09a';g.lineWidth=2;g.beginPath();g.moveTo(470,258);g.lineTo(500,230);g.moveTo(474,230);g.lineTo(502,256);g.stroke();circle(g,500,230,2.5,'#8fc3e0');circle(g,474,230,2.5,'#f5d58a');
 circle(g,436,86,5,'#e79aa8',INK,1);
});
const COLORS_SPARK=['#f2a7b5','#f5d58a','#8fc3e0','#a9cfa4','#c9b3e6'];
const FLAGS=['#f2a7b5','#f5d58a','#8fc3e0','#a9cfa4','#c9b3e6'];
function drawWall(floor){
 // Wall, floor and floor objects share one scroll speed (the runner's), so the room moves as one scene.
 const base=floor-17,top=base-TILE_H,wallX=runner.distance*50;
 ctx.fillStyle='#f6ede3';ctx.fillRect(0,0,960,base);
 ctx.save();ctx.globalAlpha=.42;for(let x=-(wallX%180);x<960;x+=180)ctx.drawImage(textureTile,x,0,180,180);ctx.restore();
 // A loose strand of yarn and tiny pennants make the upper wall feel like a lived-in studio.
 const garlandY=Math.max(34,Math.min(116,top-44)),goff=wallX%220;
 ctx.strokeStyle='#caa98d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-20,garlandY);ctx.quadraticCurveTo(110,garlandY+20,240,garlandY);ctx.quadraticCurveTo(370,garlandY-20,500,garlandY);ctx.quadraticCurveTo(630,garlandY+20,760,garlandY);ctx.quadraticCurveTo(890,garlandY-20,980,garlandY);ctx.stroke();
 for(let i=-1;i<12;i++){const x=i*90-goff+42,c=FLAGS[(i+20)%FLAGS.length];ctx.strokeStyle='#caa98d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,garlandY+8);ctx.lineTo(x,garlandY+22);ctx.stroke();ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x-7,garlandY+20);ctx.lineTo(x+8,garlandY+20);ctx.lineTo(x,garlandY+33);ctx.closePath();ctx.fill();}
 // Taller (mobile) views get pendant lamps and bunting above the shelves.
 if(top>140){const off=wallX%480;for(let i=-1;i<4;i++){const x=i*480-off+240;ctx.strokeStyle='#cdb9a2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,top-150);ctx.stroke();ctx.fillStyle='#f5d58a';ctx.beginPath();ctx.moveTo(x-34,top-110);ctx.quadraticCurveTo(x,top-190,x+34,top-110);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.5;ctx.stroke();circle(ctx,x,top-108,8,'#fff6d8');}
  const by=top-40,off2=wallX%64;ctx.strokeStyle='#cdb9a2';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,by);ctx.lineTo(960,by);ctx.stroke();for(let i=-1;i<17;i++){const x=i*64-off2,c=FLAGS[((i+Math.floor(wallX/64))%5+5)%5];ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x+8,by);ctx.lineTo(x+40,by);ctx.lineTo(x+24,by+30);ctx.closePath();ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.stroke();}}
 const off=wallX%(TILE_W*2);for(let k=0;k*TILE_W-off<viewWidth;k++)ctx.drawImage(k%2?tileB:tileA,k*TILE_W-off,top,TILE_W,TILE_H);
 ctx.fillStyle='#efe2d1';ctx.fillRect(0,base-70,960,70);ctx.fillStyle='#e2d2bd';ctx.fillRect(0,base-72,960,5);
 ctx.strokeStyle='#e4d4bf';ctx.lineWidth=2;ctx.beginPath();for(let x=-(wallX%60);x<960;x+=60){ctx.moveTo(x,base-62);ctx.lineTo(x,base-4);}ctx.stroke();
}
function drawFloor(floor){
 // The floor scrolls with the runner so the lane, obstacles, and room movement read as one scene.
 const ground=runner.distance*50;
 ctx.fillStyle='#e3cfb6';ctx.fillRect(0,floor-17,960,17);ctx.fillStyle='#efdcc3';ctx.fillRect(0,floor,960,viewHeight-floor);
 // Wooden planks: each row starts at its own offset, boards differ slightly in tone and grain.
 // A per-board hash keeps the pattern stable while it scrolls.
 const ROW=26,PLANK=210,TONES=['#efdcc3','#ecd8bd','#f2e1ca','#e9d4b8'];
 const hash=(a,b)=>{const s=Math.sin(a*127.1+b*311.7)*43758.5453;return s-Math.floor(s);};
 for(let r=0,y=floor;y<viewHeight;r++,y+=ROW){
  const off=hash(r,7)*PLANK;
  for(let k=Math.floor((ground+off)/PLANK);;k++){
   const x=k*PLANK-off-ground;if(x>960)break;
   ctx.fillStyle=TONES[Math.floor(hash(r,k)*TONES.length)];ctx.fillRect(x,y,PLANK,ROW);
   const gy=y+7+hash(k,r)*10,wave=2+hash(k+3,r)*2;
   ctx.strokeStyle='rgba(167,126,94,.13)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+14,gy);ctx.bezierCurveTo(x+70,gy-wave,x+130,gy+wave,x+PLANK-22,gy);ctx.stroke();
   ctx.strokeStyle='rgba(190,160,128,.55)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,y+2);ctx.lineTo(x,y+ROW-2);ctx.stroke();
  }
  if(r){ctx.strokeStyle='rgba(205,180,150,.7)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();}
 }
 ctx.save();ctx.globalAlpha=.3;for(let x=-(ground%180);x<960;x+=180)ctx.drawImage(textureTile,x,floor,180,180);ctx.restore();
}
function line(pts,w,color){ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
// Pincushion ball with awls stuck in it: metal shafts go into the ball, wooden handles stick out.
function awlBall(o,floor){
 const r=22,cx=o.x+o.w/2,cy=floor-r;
 for(const deg of [-150,-95,-40]){const a=deg*Math.PI/180,dx=Math.cos(a),dy=Math.sin(a),p=d=>[cx+dx*d,cy+dy*d];
  line([p(4),p(r+9)],3.5,INK);line([p(4),p(r+9)],2,'#cfd8dd');line([p(r+8),p(r+22)],9,INK);line([p(r+8),p(r+22)],6,'#d9b48a');circle(ctx,...p(r+22),3,'#c9a27e');}
 circle(ctx,cx,cy,r,o.color);ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();ctx.strokeStyle=SHADE;ctx.lineWidth=1.5;
 for(const k of [-.5,0,.5]){ctx.beginPath();ctx.ellipse(cx,cy,r*Math.abs(k)+1,r,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
 circle(ctx,cx,cy,r,null,INK,2);circle(ctx,cx,cy-r+3,3,'#a9cfa4',INK,1);
}
// Tall open scissors standing on their blade tips.
function scissors(o,floor){
 const cx=o.x+o.w/2,py=floor-62;
 for(const [tx,hx] of [[o.x+8,cx+9],[o.x+o.w-8,cx-9]]){line([[tx,floor-1],[cx,py],[hx,floor-86]],9,INK);line([[tx,floor-1],[cx,py],[hx,floor-86]],6,'#dfe6ea');}
 for(const s of [-1,1]){ctx.beginPath();ctx.ellipse(cx+s*13,floor-100,11,14,s*.25,0,Math.PI*2);ctx.strokeStyle=INK;ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle=o.color;ctx.lineWidth=5;ctx.stroke();}
 circle(ctx,cx,py,3.5,'#b9c3c9',INK,1.2);
}
// Standing set square with a cut-out and ruler ticks.
function triangleRuler(o,floor){
 const x=o.x,w=o.w,h=o.h;
 ctx.beginPath();ctx.moveTo(x,floor);ctx.lineTo(x+w,floor);ctx.lineTo(x,floor-h);ctx.closePath();ctx.moveTo(x+14,floor-12);ctx.lineTo(x+14,floor-h+44);ctx.lineTo(x+w-44,floor-12);ctx.closePath();
 ctx.fillStyle=o.color+'cc';ctx.fill('evenodd');ctx.strokeStyle=INK;ctx.lineWidth=2;ctx.stroke();
 ctx.lineWidth=1.2;ctx.beginPath();for(let y=floor-8;y>floor-h+12;y-=8){const l=(floor-y)%40<8?7:4;ctx.moveTo(x,y);ctx.lineTo(x+l,y);}for(let xx=x+8;xx<x+w-12;xx+=8){ctx.moveTo(xx,floor);ctx.lineTo(xx,floor-4);}ctx.stroke();
}
// Long ruler resting on two erasers.
function longRuler(o,floor){
 const x=o.x,w=o.w;
 for(const [ex,c] of [[x+18,'#f2a7b5'],[x+w-50,'#8fc3e0']]){rr(ctx,ex,floor-23,32,23,4,'#fffaf0',INK);rr(ctx,ex+10,floor-23,22,23,[0,4,4,0],c,INK,1.5);}
 rr(ctx,x,floor-37,w,15,3,'#f5d58a',INK,2);
 ctx.strokeStyle=INK;ctx.lineWidth=1.1;ctx.beginPath();for(let i=1;i<w/8;i++){const xx=x+i*8,l=i%5===0?7:4;ctx.moveTo(xx,floor-37);ctx.lineTo(xx,floor-37+l);}ctx.stroke();
 ctx.fillStyle=INK;ctx.font='bold 7px sans-serif';ctx.textAlign='center';for(let i=1;i*40<w-10;i++)ctx.fillText(String(i),x+i*40,floor-24.5);
}
function drawObstacle(o,floor){
 rr(ctx,o.x-4,floor-5,o.w+8,9,5,'#9d887b25');
 if(runner.stageId==='sejin'&&window.RunnerArt&&window.RunnerArt.sejin(o,floor))return;   // runner-art.js: picture obstacles
 if(o.kind==='cone')return cone(ctx,o.x,floor,o.w,o.h,o.color);
 if(o.kind==='awl')return awlBall(o,floor);
 if(o.kind==='scissors')return scissors(o,floor);
 if(o.kind==='triangle')return triangleRuler(o,floor);
 if(o.kind==='ruler')return longRuler(o,floor);
 if(o.kind==='strand'){const l=o.x+6,r=o.x+o.w-6,y=floor-o.h+4,sag=reduced?6:6+Math.sin(runner.elapsed*6+o.x*.02)*2;
  spool(ctx,l,floor,o.color);spool(ctx,r,floor,o.color);
  for(const [w,c] of [[6.5,INK],[4,o.color]]){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(l,y);ctx.quadraticCurveTo((l+r)/2,y+sag*2,r,y);ctx.stroke();}return;}
 const rad=o.h/2,cx=o.x+o.w/2;
 ctx.strokeStyle=o.color;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(cx+rad*.6,floor-rad*.35);ctx.bezierCurveTo(cx+rad+6,floor+2,cx+rad+14,floor-8,cx+rad+26,floor-1);ctx.stroke();
 yarnBall(ctx,cx,floor-rad,rad,o.color,reduced?0:-(o.rolled||0)/rad);
}
const IS_ANGEL=(()=>{try{return localStorage.getItem('sejin-angel-v1')==='1'&&localStorage.getItem('sejin-form-v1')!=='normal';}catch(e){return false;}})();
function drawSejin(floor){
 const running=runner.status==='running';
 // Crops share a fixed scale; per-pose anchors align the hood and ground.
 const frames=[[96,38,376,448],[607,38,344,448],[1084,38,374,448],[114,520,358,448],[608,520,342,448],[1100,520,358,448]];
 const cycle=[0,1,2,3];
 // Standing on a ledge counts as ground: Sejin walks up there instead of keeping the jump pose.
 const pose=runner.y>0&&!runner.support?5:running?cycle[Math.floor(runner.elapsed*9)%4]:4;
 const [sx,sy,sw,sh]=frames[pose];
 const recoil=runner.hitTime/.32;
 // Double jump: a puff ring where the second jump started and one quick forward spin.
 if(runner.doubleTime>0){const t=1-runner.doubleTime/.4;ctx.save();ctx.globalAlpha=1-t;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(runner.x,floor-runner.y+10+t*30,14+t*26,5+t*8,0,0,Math.PI*2);ctx.stroke();
  COLORS_SPARK.forEach((c,i)=>{const a=i/COLORS_SPARK.length*Math.PI*2;circle(ctx,runner.x+Math.cos(a)*(16+t*30),floor-runner.y+10+t*30+Math.sin(a)*(6+t*10),3,c);});ctx.restore();}
 ctx.save();ctx.translate(runner.x-(reduced?0:recoil*9),floor-runner.y);
 ctx.rotate(reduced?0:-recoil*.16);
 if(runner.doubleTime>0&&!reduced){ctx.translate(0,-67);ctx.rotate((1-runner.doubleTime/.4)*Math.PI*2);ctx.translate(0,67);}
 if(runner.invulnerable>0&&running)ctx.globalAlpha=reduced?.72:.62+.38*Math.cos((1.1-runner.invulnerable)*Math.PI*4);
 // 숙이기: Sejin bends low (squashed from the feet up) and keeps running.
 const cf=crawlFrame(),duckOK=!cf&&runner.ducking&&duckImg.complete&&duckImg.naturalWidth;
 if(runner.ducking&&!cf&&!duckOK)ctx.scale(1.14,.46);   // 숙이기 그림이 아직 없으면 예전처럼 납작하게
 if(cf){const [bx,by,bw,bh]=crawl.box,k=96/bh,dw=bw*k,dh=bh*k;ctx.drawImage(crawl.im[cf],bx,by,bw,bh,-dw*.45,-dh,dw,dh);}
 else if(duckOK){const dh=104,dw=dh*duckImg.naturalWidth/duckImg.naturalHeight,t=reduced?0:runner.elapsed*16;ctx.translate(0,-Math.abs(Math.sin(t))*4);ctx.rotate(reduced?0:Math.sin(t)*.05);ctx.drawImage(duckImg,-dw*.5,-dh,dw,dh);}   // 숙이기 그림(투명 컷아웃)
 else ctx.drawImage(sprite,sx,sy,sw,sh,-sw*.15,-134.4,sw*.3,134.4);
 if(IS_ANGEL&&!runner.ducking){ctx.strokeStyle='#f5c04a';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,-139,13,4.5,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#fff6c8';ctx.lineWidth=1;ctx.stroke();}   // 천사로 변신했다면 머리 위 고리
 ctx.restore();
 canvas.dataset.pose=String(pose);
}
// Later doll stages: themed scene from runner-themes.js, plus pits, ledges and yarn to pick up.
function drawStage(T,floor){
 const S=runner.distance*50;T.bg(S,floor);T.floor(S,floor);
 for(const o of runner.obstacles)if(o.kind==='pit'){if(T.pit)T.pit(o,floor);else{ctx.fillStyle='#6d5a55';ctx.fillRect(o.x,floor-17,o.w,viewHeight-floor+17);}}
 for(const o of runner.obstacles)if(o.kind==='platform')T.ledge(o.x,floor-o.y,o.w,o);
 for(const c of runner.coins)yarnBall(ctx,c.x,floor-c.y+(reduced?0:Math.sin(runner.elapsed*5+c.x*.05)*3),9,c.color,reduced?0:runner.elapsed*2);
 const overPit=runner.obstacles.some(o=>o.kind==='pit'&&runner.x>o.x&&runner.x<o.x+o.w);
 const shadowY=runner.support?floor-runner.support.y:overPit?null:floor;
 if(shadowY!==null){ctx.fillStyle='#9d887b25';ctx.beginPath();ctx.ellipse(runner.x,shadowY+3,Math.max(20,43-(runner.y-(runner.support?runner.support.y:0))*.08),8,0,0,Math.PI*2);ctx.fill();}
 for(const o of runner.obstacles){if(o.kind==='pit'||o.kind==='platform')continue;
  if(o.kind==='hang'){T.hang(o,floor);continue;}
  rr(ctx,o.x-4,floor-5,o.w+8,9,5,'#9d887b25');if(T.prop(o,floor)===false)drawObstacle(o,floor);}
 if(ready)drawSejin(floor);
 // Falling into a pit: a soft puff lifts Sejin back up.
 if(runner.bounceTime>0){const t=1-runner.bounceTime/.5;ctx.save();ctx.globalAlpha=1-t;COLORS_SPARK.forEach((c,i)=>{const a=i/COLORS_SPARK.length*Math.PI*2;circle(ctx,runner.x+Math.cos(a)*(14+t*34),floor-runner.y+10+Math.sin(a)*(6+t*14),4,c);});ctx.restore();}
}
function draw(){ctx.setTransform(canvas.width/viewWidth,0,0,canvas.height/viewHeight,0,0);ctx.lineJoin='round';ctx.lineCap='round';const floor=viewHeight-105;
 const theme=runner.stageId!=='sejin'&&window.RunnerThemes&&window.RunnerThemes[runner.stageId];
 if(theme)return drawStage(theme,floor);
 if(!drawWorkshop(floor)){drawWall(floor);drawFloor(floor);}
 ctx.fillStyle='#9d887b25';ctx.beginPath();ctx.ellipse(runner.x,floor+3,Math.max(20,43-runner.y*.08),8,0,0,Math.PI*2);ctx.fill();
 for(const o of runner.obstacles)drawObstacle(o,floor);
 if(ready)drawSejin(floor);
}

// ---- HUD and result cards ----
const STAGES=[[.2,'실 고르는 중'],[.4,'발 뜨는 중'],[.6,'몸통 뜨는 중'],[.8,'후드 뜨는 중'],[1,'얼굴 수놓는 중']];
function showResult(){window.SejinSfx&&SejinSfx.play(runner.status==='clear'?'win':'wrong');
 const pct=Math.floor(runner.progress*100),clear=runner.status==='clear';
 // The room picks this up next time it opens (request progress, doll book).
 // yarn: thread picked up in this run. madeDoll: reached the end with enough thread for the doll.
 const got=runner.coinCount,madeDoll=!!NEED&&clear&&got>=NEED;
 const isClear=NEED?madeDoll:clear,reward=isClear?(made?5:10+dollIndex*5):0;   // a finished doll pays a fixed 실뭉치 reward (first time more)
 window.SejinSave?.pushResult({game:'knit',doll:runner.stageId,clear:isClear,progress:pct,yarn:got,need:NEED,reward});
 overlay.hidden=false;toRoom.hidden=false;if(pad)pad.hidden=true;
 if(NEED){
  const extra=madeDoll?got-NEED:got;trophy.hidden=!madeDoll;{const ra=$('#retryArt');if(ra)ra.hidden=madeDoll;}
  $('#eyebrow').textContent=madeDoll?'SUCCESS!':'TRY AGAIN';
  $('#title').textContent=madeDoll?'성공! '+doll.name+' 완성':clear?'도착! 그런데 실이 '+(NEED-got)+'개 모자라요':'아쉽게 넘어졌어요';
  $('#message').innerHTML='이번 판에 모은 실 <b>'+got+' / '+NEED+'</b><br>'+
   (madeDoll?'한 판 만에 실을 다 모아 인형을 떴어요!':clear?'끝까지 왔지만 실이 부족해요. 아치 모양 실과 발판 위 실도 챙겨 보세요.':'하트를 다 잃었어요. 다시 도전해 볼까요?')+
   (madeDoll?'<br>실뭉치 <b>+'+reward+'개</b>를 받았어요!':'<br>이번 판에 모은 실은 사라져요. 다시 모아서 도전해요.');
  if(COST)$('#message').insertAdjacentHTML('beforeend','<br><small>남은 에너지 '+energy+(energy<COST?' · 다음 판은 간식을 먹고 와요':'')+'</small>');
  start.textContent=madeDoll?'한 번 더 달리기':'다시 도전하기';state.textContent=madeDoll?'완성!':'잠깐 쉬는 중';
  $('#announcement').textContent=(madeDoll?'성공! '+josa(doll.name,'이','가')+' 완성됐어요. ':'실 '+got+'개, '+NEED+'개가 필요해요. 다시 도전하세요. ')+'스페이스바로 다시 시작할 수 있어요.';
 }else{
  $('#eyebrow').textContent=clear?'SUCCESS!':'TRY AGAIN';
  trophy.hidden=!clear;{const ra=$('#retryArt');if(ra)ra.hidden=clear;}
  const next=clear&&DOLLS[dollIndex+1];
  $('#title').textContent=clear?'성공! '+doll.name+' 완성':'아쉽게 인형을 다 못 만들었어요';
  $('#message').innerHTML=clear?'마지막 한 코까지 무사히 떴어요.'+(next?'<br>이제 작업실에서 '+josa(next.name,'을','를')+' 뜰 실을 모을 수 있어요!':'<br>한 번 더 떠볼까요?'):'완성도 '+pct+'%에서 실이 엉켜버렸어요.<br>다시 한번 시작해볼까?';
  start.textContent=clear?'한 번 더 뜨기':'다시 시작하기';state.textContent=clear?'완성!':'잠깐 쉬는 중';
  $('#announcement').textContent=clear?'성공! '+josa(doll.name,'이','가')+' 완성됐어요. 한 번 더 뜨기 버튼이나 스페이스바로 다시 시작하세요.':'실패. 완성도 '+pct+'퍼센트. 다시 시작하기 버튼이나 스페이스바로 재시작하세요.';
 }
 // After a clear the next stage is offered right away (it is open once this doll is finished).
 const nextDoll=DOLLS[dollIndex+1],nextBtn=$('#nextStage'),cleared=NEED?madeDoll:clear;
 if(nextBtn){if(cleared&&nextDoll){nextBtn.hidden=false;nextBtn.href=stageHref(nextDoll);nextBtn.textContent='다음 스테이지: '+nextDoll.name;}else nextBtn.hidden=true;}
 endMode=true;start.focus({preventScroll:true});
}
// 시작 3-2-1 카운트다운과 실 +1 팝업
let cd=0,popups=[],prevCoins=0;
function drawOverlays(dt){
 if(cd>0){const n=Math.ceil(cd),f=1-(cd-Math.floor(cd));ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold '+Math.round(viewHeight*.3)+'px "Malgun Gothic",system-ui,sans-serif';ctx.globalAlpha=.95-f*.4;ctx.lineWidth=10;ctx.strokeStyle='#fff';ctx.fillStyle='#e58c9c';const sc=reduced?1:1.15-f*.25;ctx.translate(viewWidth/2,viewHeight*.38);ctx.scale(sc,sc);ctx.strokeText(n,0,0);ctx.fillText(n,0,0);ctx.restore();}
 for(const p of popups){p.t+=dt;}popups=popups.filter(p=>p.t<.8);
 for(const p of popups){ctx.save();ctx.globalAlpha=1-p.t/.8;ctx.font='bold 22px "Malgun Gothic",system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#fff';ctx.fillStyle='#d9778a';const y=p.y-(reduced?0:p.t*50);ctx.strokeText('+1 실',p.x,y);ctx.fillText('+1 실',p.x,y);ctx.restore();}
}
function frame(now){const dt=last?(now-last)/1000:0;last=now;if(cd>0){cd-=dt;runner.y=0;runner.vy=0;runner.jumps=0;}else if(!paused&&!menuOpen)runner.update(dt);
 if(runner.coinCount>prevCoins&&runner.status==='running'){popups.push({x:runner.x+10,y:viewHeight-105-(runner.y||0)-150,t:0});}prevCoins=runner.coinCount;settings.hidden=runner.status!=='running';
 if(pad)pad.hidden=runner.status!=='running'||menuOpen;
 // Thread counter: "모은 실 / 필요한 실", turns green once there is enough for the doll.
 if(yarnChip){yarnChip.querySelector('b').textContent=runner.coinCount+(NEED?' / '+NEED:'');yarnChip.classList.toggle('full',!!NEED&&runner.coinCount>=NEED);}
 const p=runner.progress;progressText.textContent=Math.floor(p*100)+'%';dollFill.style.setProperty('--p',p);
 const hearts=$('#hearts');hearts.textContent='♥'.repeat(runner.health)+'♡'.repeat(3-runner.health);hearts.setAttribute('aria-label','체력 '+runner.health+' / 3');
 if(runner.status==='running')state.textContent=menuOpen?'잠깐 멈춤':runner.invulnerable>0?'앗, 실이 엉켰어!':STAGES.find(s=>p<s[0])?.[1]||'마무리 중';
 if(runner.status!=='running'&&runner.status!=='ready'&&shown!==runner.status){shown=runner.status;showResult();}
 draw();drawOverlays(Math.min(dt,.1));requestAnimationFrame(frame);}
resize();requestAnimationFrame(frame);
