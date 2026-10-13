/* Cleaning by touch: trash lies on the floor while the room is messy (low 청결).
   Tapping a piece brings out a broom that sweeps it; broom and trash then disappear and 청결 rises.
   The number of pieces follows 청결, so the room looks tidier as it gets cleaner. */
(()=>{
 'use strict';
 const PER_PIECE=22;   // 청결 gained per swept piece; also the step that decides how many pieces show
 const MAX_PIECES=4;
 // Floor spots (percent of the 2:3 room). The first ones appear first when the room gets messy.
 const SPOTS=[{x:18,b:8},{x:84,b:16},{x:38,b:2},{x:73,b:61}];
 const INK='#8a6f60';
 const TRASH=[
  {name:'구겨진 종이',svg:`<svg viewBox="0 0 40 34"><path d="M8 20c-2-8 5-15 13-14 8-2 15 5 13 13 1 7-6 12-14 11-7 1-13-3-12-10z" fill="#fbfaf6" stroke="${INK}" stroke-width="1.6"/><path d="M14 14l5 4-2 6M24 11l2 6 6 2M19 24l6-3" fill="none" stroke="#c9bdb0" stroke-width="1.3" stroke-linecap="round"/></svg>`},
  {name:'먼지 뭉치',svg:`<svg viewBox="0 0 44 30"><path d="M6 25c-4-6 2-12 8-11 1-6 9-9 14-5 5-3 12 1 11 7 5 1 5 9-1 10z" fill="#ddd4c9" stroke="${INK}" stroke-width="1.5"/><path d="M11 13l-2-3M22 7l0-3M33 12l2-3" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/><circle cx="18" cy="19" r="1.6" fill="${INK}"/><circle cx="26" cy="19" r="1.6" fill="${INK}"/></svg>`},
  {name:'실 부스러기',svg:`<svg viewBox="0 0 44 24"><path d="M3 18c6-12 12 6 18-4s12 8 20-6" fill="none" stroke="#f2a7b5" stroke-width="3.2" stroke-linecap="round"/><path d="M6 21c8-4 14 2 22-2" fill="none" stroke="#8fc3e0" stroke-width="2.6" stroke-linecap="round"/></svg>`},
 ];
 const BROOM=`<svg viewBox="0 0 60 92"><rect x="27" y="0" width="6" height="58" rx="3" fill="#c9a27e" stroke="${INK}" stroke-width="1.5"/><rect x="12" y="54" width="36" height="8" rx="3" fill="#f2a7b5" stroke="${INK}" stroke-width="1.4"/><path d="M14 61h32l8 28H6z" fill="#f5d58a" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M19 65l-4 22M27 65l-2 22M34 65l2 22M42 65l4 22" stroke="#d9b45e" stroke-width="1.4"/></svg>`;
 const swept=new Set();   // spot indexes being swept right now
 const layer=document.createElement('div');layer.className='trash-layer';room.append(layer);

 // 청결 34 → 3 pieces, 56 → 2, 78 → 1, 80 and up → clean floor.
 const wanted=()=>Math.min(MAX_PIECES,Math.max(0,Math.ceil((80-needs.청결)/PER_PIECE)));
 function renderTrash(){
  const n=wanted();
  layer.querySelectorAll('.trash').forEach(t=>{if(+t.dataset.i>=n&&!swept.has(+t.dataset.i))t.remove();});
  for(let i=0;i<n;i++){
   if(layer.querySelector(`[data-i="${i}"]`))continue;
   const s=SPOTS[i],t=TRASH[i%TRASH.length],b=document.createElement('button');
   b.className='trash';b.dataset.i=i;b.innerHTML=t.svg;b.setAttribute('aria-label',t.name+' 치우기');
   Object.assign(b.style,{left:s.x+'%',bottom:s.b+'%'});b.onclick=()=>sweep(b);layer.append(b);
  }
 }
 function puffs(x,b){
  if(still)return;
  for(let k=0;k<7;k++){const p=document.createElement('i');p.className='puff';Object.assign(p.style,{left:x+'%',bottom:b+'%'});layer.append(p);
   const a=Math.PI*(.15+.7*k/6),r=18+Math.random()*16;
   p.animate([{transform:'translate(-50%,0) scale(.6)',opacity:.9},{transform:`translate(calc(-50% + ${Math.cos(a)*r*(k%2?1:-1)}px),${-Math.sin(a)*r}px) scale(1.5)`,opacity:0}],{duration:650,easing:'ease-out',fill:'forwards'}).onfinish=()=>p.remove();}
 }
 function sweep(piece){
  const i=+piece.dataset.i,s=SPOTS[i];swept.add(i);piece.classList.add('sweeping');
  const broom=document.createElement('span');broom.className='broom';broom.innerHTML=BROOM;
  Object.assign(broom.style,{left:s.x+'%',bottom:s.b+'%'});layer.append(broom);
  const done=()=>{broom.remove();piece.remove();swept.delete(i);
   up('청결',PER_PIECE);progressQuest('wash');note('바닥의 쓰레기를 쓸어 담았다. 방이 한결 깨끗해졌다.');
   say(needs.청결>=80?'반짝반짝! 방이 깨끗해졌어.':'쓱쓱… 한 군데 치웠다!');render();};
  if(still){done();return;}
  // Broom pops in, sweeps back and forth over the trash, then both fade away.
  broom.animate([{opacity:0,transform:'translate(-50%,-12%) scale(.7)'},{opacity:1,transform:'translate(-50%,0) scale(1)'}],{duration:180,fill:'forwards'});
  const strokes=broom.animate([
   {transform:'translate(-50%,0) rotate(0deg)'},{transform:'translate(-70%,0) rotate(-16deg)'},{transform:'translate(-30%,0) rotate(16deg)'},
   {transform:'translate(-70%,0) rotate(-16deg)'},{transform:'translate(-30%,0) rotate(16deg)'},{transform:'translate(-50%,0) rotate(0deg)'}],
   {duration:900,delay:180,easing:'ease-in-out',fill:'forwards'});
  setTimeout(()=>puffs(s.x,s.b),380);setTimeout(()=>puffs(s.x,s.b),760);
  piece.animate([{opacity:1,transform:'translateX(-50%) scale(1)'},{opacity:1,transform:'translateX(-20%) scale(.8)',offset:.6},{opacity:0,transform:'translateX(10%) scale(.3)'}],{duration:900,delay:250,fill:'forwards'});
  strokes.onfinish=()=>broom.animate([{opacity:1},{opacity:0,transform:'translate(-50%,-10%) scale(.8)'}],{duration:260,fill:'forwards'}).onfinish=done;
 }
 const renderBefore=render;render=()=>{renderBefore();renderTrash();};
 renderTrash();
})();
