'use strict';
const root='../assets/',r2=n=>root+'runner2/'+n+'.png';
const maps={
 work:{name:'세진이 작업실',walls:['runner-bg/runner-bg-mint-concept-v1.png','runner-bg/runner-bg-mint-panel-b-v1.png'],baseline:740,crop:true,g:'work-ground-slab-v25',p:'work-platform-full-v25',gb:[64,277,2044,317],pb:[84,289,2003,201]},
 home:{name:'친구집',walls:['runner2/home-wall-only-a-v2.png','runner2/home-wall-only-b-v2.png'],baseline:676,g:'home-ground-slab-v25',p:'home-platform-full-v25',gb:[48,259,2077,221],pb:[42,301,2088,216]},
 shop:{name:'실가게',walls:['runner2/shop-background-only-v31.png'],baseline:532,g:'shop-ground-slab-v32',p:'shop-platform-full-v32'},
 park:{name:'공원 산책로',walls:[1,2,3,4].map(n=>'runner2/park-bg-'+n+'-v14.jpg'),baseline:705,g:'park-ground-slab-v27',p:'park-platform-full-v27',gb:[29,245,2115,293],pb:[115,256,1943,225]},
 angel:{name:'천사 구름길',walls:['runner2/angel-wall-only-a-v2.png','runner2/angel-wall-only-b-v2.png'],baseline:660,g:'angel-ground-slab-v27',p:'angel-platform-full-v27',gb:[13,251,2144,262],pb:[181,258,1812,272]}
};
const cv=document.getElementById('scene'),cx=cv.getContext('2d'),pos=document.getElementById('offset'),gap=document.getElementById('gap'),platformToggle=document.getElementById('platforms'),choice=document.getElementById('wallChoice'),statusText=document.getElementById('status'),cache=new Map();
let selected=maps[location.hash.slice(1)]?location.hash.slice(1):'work',active=null,request=0;
function load(src){if(!cache.has(src))cache.set(src,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error(src));im.src=src;}));return cache.get(src);}
function bounds(im){const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const d=x.getImageData(0,0,c.width,c.height).data;let l=c.width,t=c.height,r=0,b=0;for(let y=0;y<c.height;y++)for(let k=0;k<c.width;k++)if(d[(y*c.width+k)*4+3]>160){l=Math.min(l,k);r=Math.max(r,k);t=Math.min(t,y);b=Math.max(b,y);}return[l,t,r-l+1,b-t+1];}
function ledge(im,b,x,y,w){const h=34,cap=Math.min(50,b[2]*.08),cw=cap*h/b[3];cx.drawImage(im,b[0],b[1],cap,b[3],x,y,cw,h);cx.drawImage(im,b[0]+cap,b[1],b[2]-2*cap,b[3],x+cw-.3,y,w-2*cw+.6,h);cx.drawImage(im,b[0]+b[2]-cap,b[1],cap,b[3],x+w-cw,y,cw,h);}
function draw(){if(!active)return;const {cfg,wall,blended,ground,platform,g,p}=active,s=+pos.value,floor=418,h=122,scale=floor/cfg.baseline,wallW=wall.width*scale,step=(wall.width-100)*scale;
 cx.clearRect(0,0,960,540);cx.fillStyle='#fff1e7';cx.fillRect(0,0,960,540);
 for(let q=Math.max(0,Math.floor(s/step)-1);q*step-s<960;q++){
  const im=q===0?wall:blended;
  if(cfg.crop){cx.drawImage(im,0,0,wall.width,cfg.baseline,q*step-s,0,wallW+.5,floor);}
  else cx.drawImage(im,q*step-s,0,wallW+.5,wall.height*scale);
 }
 const palettes={work:['#efe6d4','#e8decd'],home:['#f4eefb','#e9e0f2'],shop:['#fff0e7','#f2ded8'],park:['#f1efd5','#e4e9cb'],angel:['#bce6f7','#d4effa']};
 drawCleanLowerBackground(cx,floor,palettes[selected]);
 drawFinishedFloor(cx,active.tile,s,floor,gap.checked);
 if(platformToggle.checked)for(let q=Math.floor(s/1250)-1;q*1250-s<960;q++){ledge(platform,p,q*1250+610-s,305,210);ledge(platform,p,q*1250+950-s,270,170);}
}
async function select(id,wallIndex=0){const ticket=++request,cfg=maps[id];selected=id;active=null;statusText.textContent='이미지를 불러오는 중입니다.';document.getElementById('mapTitle').textContent=cfg.name;
 for(const b of document.querySelectorAll('#maps button'))b.setAttribute('aria-pressed',b.dataset.map===id);
 choice.replaceChildren(...cfg.walls.map((src,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=cfg.walls.length===1?'새 배경':'배경 '+(i+1);return opt;}));choice.value=wallIndex;choice.disabled=cfg.walls.length===1;
 for(const [type,name]of [['ground',cfg.g],['platform',cfg.p]]){document.getElementById(type+'Image').src=r2(name);document.getElementById(type+'Link').href=r2(name);}
 try{const [wall,ground,platform]=await Promise.all([load(root+cfg.walls[wallIndex]),load(r2(cfg.g)),load(r2(cfg.p))]);if(ticket!==request)return;const blended=document.createElement('canvas');blended.width=wall.width;blended.height=wall.height;const bg=blended.getContext('2d');bg.drawImage(wall,0,0);bg.globalCompositeOperation='destination-out';const fade=bg.createLinearGradient(0,0,100,0);fade.addColorStop(0,'#000');fade.addColorStop(1,'#0000');bg.fillStyle=fade;bg.fillRect(0,0,100,wall.height);const g=cfg.gb||bounds(ground);active={cfg,wall,blended,ground,platform,g,p:cfg.pb||bounds(platform),tile:makeFloorTile(ground,g)};statusText.textContent=cfg.name+' · 좌우 위치와 구멍 마감을 확인할 수 있습니다.';draw();}catch(e){if(ticket===request){cx.clearRect(0,0,960,540);statusText.textContent='이미지를 불러오지 못했습니다. 다시 맵을 선택해 주세요.';}}
}
for(const[id,cfg]of Object.entries(maps)){const b=document.createElement('button');b.textContent=cfg.name;b.dataset.map=id;b.onclick=()=>{history.replaceState(null,'','#'+id);select(id);};document.getElementById('maps').append(b);}
pos.oninput=draw;gap.onchange=draw;platformToggle.onchange=draw;choice.onchange=()=>select(selected,+choice.value);select(selected);
