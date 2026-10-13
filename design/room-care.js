/* Care feedback in the room.
   - 밥 주기: a bowl pops up in front of Sejin, three bites (squash + crumbs + 냠), then the bowl is empty.
   - 재우기 (낮잠): Sejin sleeps for SLEEP_MS; energy rises by NAP_GAIN little by little and Sejin wakes up by
     itself. While asleep the button shows a countdown; pressing it again does not wake Sejin early.
     After a nap Sejin is not sleepy for NAP_COOLDOWN (napReadyAt, saved by the room) — snacks refill energy. */
(()=>{
 'use strict';
 const SLEEP_MS=5000,NAP_GAIN=40,NAP_COOLDOWN=30*60*1000,BITES=3,BITE_MS=460;
 const INK='#8a6f60';
 const BOWL=`<svg viewBox="0 0 64 54" aria-hidden="true"><g stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">
  <path class="steam" d="M22 12c-4-4 4-6 0-10M32 10c-4-4 4-6 0-10M42 12c-4-4 4-6 0-10" fill="none" stroke="#cdb9a2"/>
  <path class="rice" d="M12 30c0-12 40-12 40 0z" fill="#fffaf0"/>
  <path class="berry" d="M29 20c0-5 6-5 6 0 0 4-3 6-3 6s-3-2-3-6z" fill="#f2a7b5"/><path class="berry" d="M30 17l2 2 2-2" fill="none" stroke="#7fb07a"/>
  <path d="M6 30h52c0 13-11 21-26 21S6 43 6 30z" fill="#f2a7b5"/><path d="M11 36h42" stroke="#fff" stroke-width="3"/>
 </g></svg>`;
 const CRUMBS=['#fffaf0','#f5d58a','#f2a7b5'];
 let feeding=false;

 function sejinBox(){
  const img=$('#sejin .pose-img')||$('#sejin'),r=room.getBoundingClientRect(),s=img.getBoundingClientRect();
  return {img,x:s.left+s.width/2-r.left,top:s.top-r.top,h:s.height};
 }
 function float(text,x,y){
  const t=document.createElement('span');t.className='munch';t.textContent=text;room.append(t);
  t.animate([{opacity:0,transform:`translate(${x}px,${y}px) translate(-50%,-50%) scale(.6)`},{opacity:1,transform:`translate(${x}px,${y-14}px) translate(-50%,-50%) scale(1.1)`,offset:.3},{opacity:0,transform:`translate(${x}px,${y-34}px) translate(-50%,-50%)`}],{duration:700,easing:'ease-out',fill:'forwards'}).onfinish=()=>t.remove();
 }
 function crumbs(x,y){
  for(let i=0;i<5;i++){const c=document.createElement('i'),a=Math.PI*(.15+.7*Math.random()),d=18+Math.random()*16;
   c.className='crumb';c.style.background=CRUMBS[i%CRUMBS.length];c.style.border='1px solid '+INK;room.append(c);
   c.animate([{transform:`translate(${x}px,${y}px)`},{transform:`translate(${x+Math.cos(a)*d*(Math.random()<.5?-1:1)}px,${y+Math.sin(a)*d}px) scale(.4)`,opacity:0}],{duration:520,easing:'cubic-bezier(.2,.7,.4,1)',fill:'forwards'}).onfinish=()=>c.remove();}
 }
 function feedFx(){
  gain('배부름 +25');
  if(still||feeding)return;
  feeding=true;
  const {img,x,top,h}=sejinBox(),bx=x,by=top+h*.66,bw=Math.max(56,h*.5);
  const bowl=document.createElement('div');bowl.className='food-bowl';bowl.innerHTML=BOWL;
  Object.assign(bowl.style,{width:bw+'px',margin:`${-bw*.42}px 0 0 ${-bw/2}px`});room.append(bowl);
  const at=(dy=0,s=1)=>`translate(${bx}px,${by+dy}px) scale(${s})`;
  bowl.animate([{transform:at(-40,.3),opacity:0},{transform:at(4,1.12),opacity:1,offset:.7},{transform:at()}],{duration:360,easing:'ease-out',fill:'forwards'});
  img.style.transformOrigin='50% 100%';
  const food=bowl.querySelectorAll('.rice,.berry');
  for(let i=0;i<BITES;i++)setTimeout(()=>{
   img.animate([{transform:'scale(1)'},{transform:'scale(1.07,.9)'},{transform:'scale(.97,1.05)'},{transform:'scale(1)'}],{duration:300,easing:'ease-out'});
   crumbs(bx,by-bw*.2);float(i<BITES-1?'냠':'냠냠!',bx+(i%2?1:-1)*bw*.55,top+h*.3);
   const left=1-(i+1)/BITES;food.forEach(f=>{f.style.transformOrigin='32px 30px';f.style.transform=`scale(${left})`;f.style.transition='transform .2s';});
  },420+i*BITE_MS);
  setTimeout(()=>{
   bowl.animate([{transform:at(),opacity:1},{transform:at(18,.7),opacity:0}],{duration:320,fill:'forwards'}).onfinish=()=>bowl.remove();
   img.animate([{transform:'translateY(0)'},{transform:'translateY(-10px)'},{transform:'translateY(0)'}],{duration:340,easing:'ease-out'});
   burst(x,top+h*.25);feeding=false;
  },420+BITES*BITE_MS+120);
 }

 // ---- Sleep with auto wake-up ----
 const lightBtn=()=>document.querySelector('.pou-dock [data-t="light"]'),dummy={classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){},innerHTML:'',dataset:{}};   // 재우기 = 방 왼쪽 💡 아이콘
 let sleepTimer=null,waking=false;
 function startSleep(){
  const from=needs.에너지,to=Math.min(100,from+NAP_GAIN),t0=performance.now();
  {const b=lightBtn()||dummy;b.dataset.html=b.innerHTML;b.classList.add('sleeping');b.setAttribute('aria-disabled','true');}
  clearInterval(sleepTimer);
  const tick=()=>{const k=Math.min(1,(performance.now()-t0)/SLEEP_MS);
   needs.에너지=Math.round(from+(to-from)*k);
   {const b=lightBtn();if(b)b.innerHTML='😴<small>'+Math.max(1,Math.ceil((1-k)*SLEEP_MS/1000))+'초</small>';}
   render();if(k>=1)wake();};
  sleepTimer=setInterval(tick,250);tick();
 }
 function wake(){
  clearInterval(sleepTimer);sleepTimer=null;
  {const b=lightBtn();if(b){b.classList.remove('sleeping');b.removeAttribute('aria-disabled');if(b.dataset.html)b.innerHTML=b.dataset.html;}}
  waking=true;act('sleep');waking=false;   // the usual wake-up: 대사, 서 있는 모습
  gain('에너지 +'+NAP_GAIN);
 }
 const actBefore=act;
 act=a=>{
  if(a==='sleep'){
   if(night&&!waking){say('쿨… 쿨… 조금만 더 잘게.');return;}
   if(!night&&Date.now()<napReadyAt){const m=Math.ceil((napReadyAt-Date.now())/60000);say(`아직 안 졸려… ${m}분 뒤에 낮잠 잘래. 간식 먹을까?`);return;}
   if(!night)napReadyAt=Date.now()+NAP_COOLDOWN;
   actBefore(a);if(night)startSleep();return;
  }
  const wasNight=night;actBefore(a);
  if(a==='food'&&!wasNight)feedFx();
 };
 // A save made while Sejin was asleep: finish that nap.
 if(night)startSleep();
})();
