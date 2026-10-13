/* 포장 작업대: 재료를 놓고 상자를 왼쪽에서 오른쪽으로 완성한다. */
(()=>{
 'use strict';
 const $=s=>document.querySelector(s), colors=['pink','blue','green','purple','yellow'];
 const gifts=['cookie','ring','candle','bouquet','storybook','strawberry','bear','plant','yarn','heart-brooch','mini-bunny','knit-pouch','tea-set','folded-scarf','flower-wand'];
 const sizes=['s','m','l'], reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 let selected=null, commit=null, allowed=null, activeStep=0, drag=null, suppressClick=0, give=null, customerId=1;
 const style=document.createElement('style');
 style.textContent=`
 .page{max-width:740px}.counter{min-height:190px;background:#fff8ec url('assets/wrap/wrap-bg-v1.jpg') center 46%/cover}.ticket{background:#fffffff0;max-width:440px}.cust{width:120px;position:relative;z-index:1}.cust img{width:100%;height:135px;object-fit:contain}.cust .emotion{position:absolute;right:0;top:0;font-size:26px}.bench{height:225px;display:block;background:linear-gradient(#fcebd5,#efcfaa);border-color:#fff4e4;overflow:hidden;touch-action:pan-y}.bench:before{content:'';position:absolute;left:0;right:0;top:160px;border-top:3px solid #bb916c}.stations{position:absolute;inset:14px 8px auto;display:flex;justify-content:space-around;font-size:12px;font-weight:bold}.stations span{padding:7px 10px;background:#fff9ed;border-radius:12px;color:#937661}.stations .active{background:#d4edda;color:#507759;outline:2px solid #8bb89c}.package{position:absolute;top:82px;left:8%;width:112px;height:92px;transition:left .65s ease-in-out,transform .3s;display:grid;place-items:center;filter:drop-shadow(0 5px 2px #80553626)}.package .box-image{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.package .gift-image{position:relative;width:65%;height:65%;object-fit:contain;z-index:1}.package.wrapped{border:3px solid #a07a5e;border-radius:9px;background-size:110px;box-shadow:inset 0 -14px 0 #855f4220,inset -15px 0 0 #855f4215}.package.wrapped:before{content:'';position:absolute;left:0;right:0;top:17%;border-top:2px solid #a07a5e88}.package .ribbon-image{position:absolute;inset:-8% -8%;width:116%;height:116%;object-fit:fill;z-index:2}.package.pop{animation:wrap-pop .4s}.drop-hint{position:absolute;bottom:12px;left:10px;right:10px;text-align:center;font-size:12px;color:#82654e}.bench.target{outline:3px dashed #78a893;outline-offset:-8px}.opts button{touch-action:none}.opts button img{width:54px;height:54px;object-fit:contain;display:block;margin:0 auto 5px}.opts button .paper-swatch{background-size:60px;width:45px;height:45px}.drag-ghost{position:fixed;width:78px;height:78px;object-fit:contain;z-index:50;pointer-events:none;filter:drop-shadow(0 5px 4px #644b4444);transform:translate(-50%,-50%)}.delivered-gift{position:absolute;bottom:14px;left:104px;width:130px;height:130px;z-index:4}.delivered-gift .package{position:relative;left:0!important;top:0;width:130px!important;height:130px!important}.receive-label{position:absolute;left:6px;bottom:0;background:#fff8ee;border-radius:9px;padding:2px 7px;font-size:11px}.work-confirm{border:0;border-radius:12px;padding:10px 14px;font:inherit;background:#d9efdc;color:#527557;cursor:pointer}@keyframes wrap-pop{50%{transform:scale(1.13) rotate(-2deg)}}@media(max-width:420px){.cust{width:82px}.cust img{height:112px}.ticket{font-size:12px;padding:9px}.counter{padding:8px;gap:6px;min-height:160px}.bench{height:205px}.package{width:88px;height:75px;top:85px}.stations span{padding:6px;font-size:11px}.delivered-gift{left:66px}}@media(prefers-reduced-motion:reduce){.package{transition:none}.package.pop{animation:none}}
 `;document.head.append(style);
 const BOTGAP={"wrap/wrap2-box-s-open-front-v1.png":0.053,"wrap/wrap2-box-s-pink-wrapped-front-v1.png":0.053,"wrap/wrap2-ribbon-s-pink-front-v1.png":0.05,"wrap/wrap2-box-s-blue-wrapped-front-v1.png":0.052,"wrap/wrap2-ribbon-s-blue-front-v1.png":0.053,"wrap/wrap2-box-s-green-wrapped-front-v1.png":0.051,"wrap/wrap2-ribbon-s-green-front-v1.png":0.054,"wrap/wrap2-box-s-purple-wrapped-front-v1.png":0.05,"wrap/wrap2-ribbon-s-purple-front-v1.png":0.057,"wrap/wrap2-box-s-yellow-wrapped-front-v1.png":0.051,"wrap/wrap2-ribbon-s-yellow-front-v1.png":0.056,"wrap/wrap2-box-m-open-front-v1.png":0.065,"wrap/wrap2-box-m-pink-wrapped-front-v1.png":0.067,"wrap/wrap2-ribbon-m-pink-front-v1.png":0.069,"wrap/wrap2-box-m-blue-wrapped-front-v1.png":0.066,"wrap/wrap2-ribbon-m-blue-front-v1.png":0.067,"wrap/wrap2-box-m-green-wrapped-front-v1.png":0.065,"wrap/wrap2-ribbon-m-green-front-v1.png":0.068,"wrap/wrap2-box-m-purple-wrapped-front-v1.png":0.065,"wrap/wrap2-ribbon-m-purple-front-v1.png":0.066,"wrap/wrap2-box-m-yellow-wrapped-front-v1.png":0.067,"wrap/wrap2-ribbon-m-yellow-front-v1.png":0.067,"wrap/wrap2-box-l-open-front-v1.png":0.084,"wrap/wrap2-box-l-pink-wrapped-front-v1.png":0.087,"wrap/wrap2-ribbon-l-pink-front-v1.png":0.091,"wrap/wrap2-box-l-blue-wrapped-front-v1.png":0.086,"wrap/wrap2-ribbon-l-blue-front-v1.png":0.088,"wrap/wrap2-box-l-green-wrapped-front-v1.png":0.086,"wrap/wrap2-ribbon-l-green-front-v1.png":0.081,"wrap/wrap2-box-l-purple-wrapped-front-v1.png":0.086,"wrap/wrap2-ribbon-l-purple-front-v1.png":0.088,"wrap/wrap2-box-l-yellow-wrapped-front-v1.png":0.086,"wrap/wrap2-ribbon-l-yellow-front-v1.png":0.079,"wrap/wrap2-paper-pink-roll-front-v1.png":0.185,"wrap/wrap2-ribbon-pink-roll-front-v1.png":0.156,"wrap/wrap2-paper-blue-roll-front-v1.png":0.175,"wrap/wrap2-ribbon-blue-roll-front-v1.png":0.205,"wrap/wrap2-paper-green-roll-front-v1.png":0.187,"wrap/wrap2-ribbon-green-roll-front-v1.png":0.164,"wrap/wrap2-paper-purple-roll-front-v1.png":0.192,"wrap/wrap2-ribbon-purple-roll-front-v1.png":0.167,"wrap/wrap2-paper-yellow-roll-front-v1.png":0.14,"wrap/wrap2-ribbon-yellow-roll-front-v1.png":0.184,"wrap/wrap2-gift-cookie-front-v1.png":0.102,"wrap/wrap2-gift-ring-front-v1.png":0.187,"wrap/wrap2-gift-candle-front-v1.png":0.108,"wrap/wrap2-gift-bouquet-front-v1.png":0.061,"wrap/wrap2-gift-storybook-front-v1.png":0.118,"wrap/wrap2-gift-strawberry-front-v1.png":0.22,"wrap/wrap2-gift-bear-front-v1.png":0.093,"wrap/wrap2-gift-plant-front-v1.png":0.094,"wrap/wrap2-gift-yarn-front-v1.png":0.096,"wrap/wrap2-ribbon-blue-roll-front-v3.png":0.128,"wrap/wrap2-ribbon-red-roll-front-v4.png":0.163,"wrap/wrap2-gift-heart-brooch-front-v1.png":0.202,"wrap/wrap2-gift-mini-bunny-front-v1.png":0.062,"wrap/wrap2-gift-knit-pouch-front-v1.png":0.168,"wrap/wrap2-gift-tea-set-front-v1.png":0.309,"wrap/wrap2-gift-folded-scarf-front-v1.png":0.346,"wrap/wrap2-gift-flower-wand-front-v1.png":0.389};   // 파일별 그림 아래 투명 여백 비율(선반 바닥판에 물건을 맞추는 데 사용)
 function giftArt(g){const i=(window.WrapGifts||[]).indexOf(g);return 'assets/wrap/wrap2-gift-'+gifts[i>=0?i:0]+'-front-v1.png';}
 function boxArt(s,open,paper){return open?'assets/wrap/wrap2-box-'+sizes[s]+'-open-front-v1.png':'assets/wrap/wrap2-box-'+sizes[s]+'-'+colors[paper]+'-wrapped-front-v1.png';}
 function ribbonOverlay(s,i){return 'assets/wrap/wrap2-ribbon-'+sizes[s]+'-'+colors[i]+'-front-v1.png';}
 function ribbonRoll(i){return i===0?'assets/wrap/wrap2-ribbon-red-roll-front-v4.png':i===1?'assets/wrap/wrap2-ribbon-blue-roll-front-v3.png':'assets/wrap/wrap2-ribbon-'+colors[i]+'-roll-front-v1.png';}
 function render(mk,step){
  activeStep=step;
  const bench=$('#bench');let p=bench.querySelector('.package');
  if(!bench.querySelector('.stations'))bench.innerHTML='<div class="stations"><span>선물 · 상자</span><span>포장지</span><span>리본 · 완성</span></div><div class="drop-hint"></div>';
  const station=step<=1?0:step===2?1:2;
  bench.querySelectorAll('.stations span').forEach((s,i)=>s.classList.toggle('active',i===station));
  bench.querySelector('.drop-hint').textContent=step===4?'완성 상자를 손님에게 끌어 주거나 전달 버튼을 눌러요':'재료를 작업대로 끌어 놓아요 · 누른 뒤 작업대를 눌러도 돼요';
  if(!mk.g){p?.remove();$('#counter').querySelector('.delivered-gift')?.remove();return;}
  if(!p){p=document.createElement('div');p.className='package';bench.append(p);enableDeliveryDrag(p);}
  // 상자 크기: 작은/중간/큰 상자가 눈에 띄게 다르고, 선물도 크기에 따라 다르게 보여서 맞는 크기인지 한눈에 보인다.
  const bw=bench.clientWidth||600,C=Math.min(bw*.44,280),gp=C*(mk.size===null?[.34,.5,.7]:[.34,.52,.74])[mk.g.s||0];   // 모든 상자 그림은 같은 정사각 캔버스 — 크기 차이는 그림 자체(작은 38% · 중간 65% · 큰 89%)
  p.style.width=C+'px';p.style.height=C+'px';p.style.top=(162-C*.945)+'px';p.style.left=(bw*[.2,.2,.5,.8,.8][step]-C/2)+'px';
  p.classList.toggle('wrapped',mk.paper!==null);
  p.style.backgroundImage='';
  p.innerHTML=mk.paper!==null?`<img class="box-image" src="${boxArt(mk.size,false,mk.paper)}" alt="포장된 상자">`:`${mk.size!==null?`<img class="box-image" src="${boxArt(mk.size,true)}" alt="열린 상자">`:''}<img class="gift-image" src="${giftArt(mk.g)}" alt="${mk.g.n}" style="width:${gp}px;height:${gp}px">`;
  if(mk.rib!==null&&mk.size!==null&&mk.paper!==null)p.innerHTML+=`<img class="box-image ribbon-image" src="${ribbonOverlay(mk.size,mk.rib)}" alt="${colors[mk.rib]} 리본">`;
  p.classList.remove('pop');void p.offsetWidth;p.classList.add('pop');
 }
 function apply(v){if(!allowed?.())return;selected=null;$('#bench').classList.remove('target');$('#msg').textContent='';commit(v);}
 function bind(opts,fn,isAllowed,step){
  commit=fn;allowed=isAllowed;activeStep=step;selected=null;
  const title=$('#ttl');if(step===2)title.textContent='포장지를 상자에 끌어 놓아 감싸 주세요';if(step===3)title.textContent='리본을 상자에 끌어 놓아 묶어 주세요';
  opts.querySelectorAll('button').forEach(b=>{
   const v=+b.dataset.v;
   let src=step===0?giftArt(window.WrapGifts[v]):step===1?boxArt(v,true):step===2?`assets/wrap/wrap2-paper-${colors[v]}-roll-front-v1.png`:ribbonRoll(v);
   const GS={get:i=>(window.WrapGifts[i]||{}).s||0},SC=[.55,.66,.76],SB=[1.5,1.15,1];b.style.setProperty('--sc',step===0?SC[GS.get(v)]:step===1?SB[v]:1);b.dataset.slot=[...opts.children].indexOf(b);{const f=src.split('assets/').pop(),sc=parseFloat(b.style.getPropertyValue('--sc'))||1;b.style.setProperty('--gap',((BOTGAP[f]||0)*sc).toFixed(3));}
   if(step===1&&window.WrapState&&WrapState.mk&&WrapState.mk.g){const gs=WrapState.mk.g.s||0,ratio=[.34,.52,.74][gs];b.querySelector('.cmp')?.remove();b.insertAdjacentHTML('beforeend',`<img class="cmp" src="${giftArt(WrapState.mk.g)}" alt="" draggable="false" style="--r:${ratio.toFixed(2)}">`);}
   const old=b.querySelector('.e,i');if(old)old.outerHTML=`<img src="${src}" alt="" draggable="false">`;b.ondragstart=e=>e.preventDefault();
   b.onclick=()=>{if(Date.now()<suppressClick||!isAllowed())return;selected=v;opts.querySelectorAll('button').forEach(x=>x.classList.toggle('sel',x===b));$('#bench').classList.add('target');$('#msg').textContent='작업대를 누르면 선택한 재료를 놓아요';};
   b.addEventListener('pointerdown',e=>{if(!isAllowed()||e.button!==0)return;b.setPointerCapture(e.pointerId);drag={pointer:e.pointerId,v,x:e.clientX,y:e.clientY,src,moved:false};});
  });
 }
 document.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;
  if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<7)return;
  e.preventDefault();drag.moved=true;
  if(!drag.ghost){drag.ghost=drag.type==='delivery'?drag.source.cloneNode(true):document.createElement('img');drag.ghost.classList.remove('pop');drag.ghost.classList.add('drag-ghost');drag.ghost.style.position='fixed';drag.ghost.style.transition='none';if(drag.type!=='delivery')drag.ghost.src=drag.src;document.body.append(drag.ghost);$('#bench').classList.add('target');}
  drag.ghost.style.left=e.clientX+'px';drag.ghost.style.top=e.clientY+'px';
 },{passive:false});
 function end(e){if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=null;d.ghost?.remove();$('#bench').classList.remove('target');if(!d.moved)return;suppressClick=Date.now()+350;const r=$(d.type==='delivery'?'#counter':'#bench').getBoundingClientRect();if(e.type!=='pointercancel'&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom){if(d.type==='delivery'){if(allowed?.())give?.();}else apply(d.v);}}
 document.addEventListener('pointerup',end);document.addEventListener('pointercancel',end);
 $('#bench').onclick=()=>{if(selected!==null&&Date.now()>=suppressClick)apply(selected);};
 $('#bench').tabIndex=0;$('#bench').setAttribute('role','button');$('#bench').setAttribute('aria-label','선택한 재료를 포장 작업대에 놓기');$('#bench').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(selected!==null)apply(selected);}};
 function enableDeliveryDrag(p){p.style.touchAction='none';p.addEventListener('pointerdown',e=>{if(activeStep!==4||!allowed?.()||e.button!==0)return;e.preventDefault();p.setPointerCapture(e.pointerId);drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false,type:'delivery',source:p};});}
 function customer(index){customerId=index%9+1;$('#counter').querySelector('.delivered-gift')?.remove();$('#cust').innerHTML=`<img src="assets/wrap/wrap-cust${customerId}-v1.png" alt="선물을 주문한 손님">`;}
 async function deliver(){
  const p=$('#bench .package');if(!p)return;
  const from=(window.WrapUI.deliverySource?.()||p).getBoundingClientRect(),to=$('#cust').getBoundingClientRect(),clone=p.cloneNode(true);clone.classList.remove('pop');Object.assign(clone.style,{position:'fixed',left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px',zIndex:'40',transition:'none'});document.body.append(clone);p.style.visibility='hidden';
  if(!reduced){const a=clone.animate([{transform:'translate(0,0) scale(1)'},{transform:`translate(${to.right-from.left-25}px,${to.bottom-from.top-40}px) scale(.65)`}],{duration:750,easing:'ease-in-out',fill:'forwards'});await a.finished;}
  clone.remove();const held=document.createElement('div');held.className='delivered-gift';const gift=p.cloneNode(true);gift.style.visibility='visible';gift.classList.remove('pop');held.append(gift);$('#counter').append(held);
 }
 // 기다리는 시간이 길어질수록 손님 기분이 나빠진다 (표정·말풍선·흔들림). level 0=보통, 1=조금 급함, 2=화남, 3=폭발
 const ms=document.createElement('style');ms.textContent='.cust.mad{animation:cust-mad .35s infinite alternate}@keyframes cust-mad{to{transform:translateX(3px) rotate(1.5deg)}}.cust .emotion.mood{font-size:30px}@media(prefers-reduced-motion:reduce){.cust.mad{animation:none}}';document.head.append(ms);
 function mood(level,info){
  const c=$('#cust');if(!c)return;c.classList.toggle('mad',level>=2);let em=c.querySelector('.emotion.mood');
  if(level===0){em?.remove();}
  else{if(!em){em=document.createElement('span');em.className='emotion mood';c.append(em);}em.textContent=info.e;}
  const img=c.querySelector('img');if(img){img.onerror=()=>{img.onerror=null;img.src='assets/wrap/wrap-cust'+customerId+'-v1.png';};img.src='assets/wrap/wrap-cust'+customerId+(level>=2?'-sad':'')+'-v1.png';}
  if(info&&!reduced||info){const r=document.createElement('div');r.className='react';r.textContent=info.e+' '+info.t;$('#counter').append(r);setTimeout(()=>r.remove(),1700);}
 } function react(face){$('#cust .emotion.mood')?.remove();const img=$('#cust img'),mood=face==='😞'||face==='😠'||face==='😡'?'sad':face==='😍'||face==='😊'?'happy':null;if(img&&mood){img.onerror=()=>{img.onerror=null;img.src=`assets/wrap/wrap-cust${customerId}-v1.png`;};img.src=`assets/wrap/wrap-cust${customerId}-${mood}-v1.png`;img.alt=mood==='happy'?'선물을 받고 기뻐하는 손님':'주문과 달라 아쉬워하는 손님';}$('#cust').insertAdjacentHTML('beforeend',`<span class="emotion">${face}</span><span class="receive-label">선물 받았어요!</span>`);}
 window.WrapUI={mood,render,bind,customer,deliver,react,enableDeliveryDrag,setDelivery:fn=>{give=fn;}};
 $('#bench').innerHTML='<div class="stations"><span>선물 · 상자</span><span>포장지</span><span>리본 · 완성</span></div><div class="drop-hint">선물을 담고, 포장하고, 리본을 묶어요</div>';
 $('.top h1 small').textContent='재료를 끌어 놓아 선물을 완성해 드려요';
})();
