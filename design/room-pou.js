/* 방 화면의 '키우기' 기본 요소 (Pou 같은 돌봄 게임에서 가져온 것):
   - 왼쪽 도구 막대: 🍪 간식(서랍에서 골라 세진이에게 끌어다 주기) · 🧼 비누(세진이를 문질러 씻기기) · 💡 불 끄기(재우기)
   - 생각 말풍선: 세진이가 지금 가장 바라는 것(배고픔·더러움·졸림·심심함)을 머리 위 그림으로 알려 주고, 누르면 그 돌봄으로 연결
   - 오늘의 선물: 하루 한 번 접속 보상(연속 출석일이 늘수록 커짐)
   방 본체(raising-mockup.html)의 전역 값(needs·bag·yarn·render·say·act·useItem 등)을 그대로 쓴다. */
(()=>{
 'use strict';
 if(typeof room==='undefined'||typeof needs==='undefined')return;
 const css=`.pou-dock{position:absolute;left:10px;top:auto;bottom:calc(28% + 15px);z-index:7;display:flex;flex-direction:column;gap:9px}
.pou-dock button{width:42px;height:42px;border-radius:50%;border:2px solid #fff;background:#fffd;font-size:20px;line-height:1;cursor:pointer;box-shadow:0 3px 0 #e9d8c8,0 4px 10px #4a3a5a22;padding:0;touch-action:none;position:relative}
.pou-dock button small{display:none;position:absolute;left:50%;bottom:-15px;transform:translateX(-50%);font-size:9px;font-weight:bold;color:#5b4a42;background:#ffffffd9;border-radius:8px;padding:0 5px;white-space:nowrap}
.pou-dock button.sleeping small{display:block}.pou-dock button svg{width:24px;height:24px;display:block;margin:auto}.pou-shop{display:block;margin:8px auto 0;border:0;background:#fff;border-radius:12px;padding:8px 14px;font:inherit;font-weight:bold;font-size:12px;color:#5b4a42;box-shadow:0 2px 0 #e9d8c8;cursor:pointer}
.pou-dock button.pulse{animation:poup 1s ease-in-out infinite}.pou-dock button.on{background:#e8f4fb;border-color:#8fc3e0}
@keyframes poup{50%{transform:scale(1.14)}}
.pou-tray{position:absolute;left:8px;right:8px;top:8px;z-index:9;background:#fffdf8f2;border-radius:18px;padding:10px;box-shadow:0 6px 20px #4a3a5a44;border:3px solid #fff}
.pou-tray[hidden]{display:none}
.pou-tray h4{margin:0 0 6px;font-size:13px;color:#5b4a42;display:flex;justify-content:space-between;align-items:center}.pou-tray h4 button{border:0;background:none;font-size:16px;cursor:pointer;color:#8b766b}
.pou-tray .row{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 6px}
.pou-item{flex:none;width:66px;text-align:center;font-size:11px;font-weight:bold;color:#5b4a42;touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none}
.pou-item i{display:grid;place-items:center;width:54px;height:54px;margin:0 auto 3px;border-radius:50%;background:#fffaf4;border:3px solid #fff;box-shadow:0 3px 0 #e9d8c8;font-style:normal;font-size:28px}
.pou-item small{display:block;font-weight:normal;color:#8b766b;font-size:10px}
.pou-ghost{position:fixed;z-index:80;pointer-events:none;font-size:40px;line-height:1;filter:drop-shadow(0 6px 6px #0004);transform:translate(-50%,-50%)}
.pou-thought{position:absolute;z-index:6;width:44px;height:44px;border-radius:50%;background:#fff;border:3px solid #fff;box-shadow:0 3px 0 #e9d8c8,0 4px 12px #4a3a5a22;display:grid;place-items:center;font-size:22px;cursor:pointer;padding:0;animation:poub 1.4s ease-in-out infinite}
.pou-thought::after{content:"";position:absolute;left:50%;bottom:-9px;margin-left:-6px;border:6px solid transparent;border-bottom:0;border-top-color:#fff}
.pou-thought[hidden]{display:none}
@keyframes poub{50%{transform:translateY(-6px)}}
.pou-bubble{position:absolute;z-index:8;pointer-events:none;font-size:22px;animation:pouup 1.1s ease-out forwards}
@keyframes pouup{from{opacity:1;transform:translateY(0) scale(.7)}to{opacity:0;transform:translateY(-46px) scale(1.2)}}
.pou-gift{position:fixed;inset:0;z-index:95;display:grid;place-items:center;background:#4a3a5a66;padding:14px}
.pou-gift>div{background:#fffaf0;border-radius:24px;padding:20px 20px 16px;max-width:340px;width:100%;text-align:center;box-shadow:0 12px 40px #0005;color:#5b4a42}
.pou-gift h3{margin:4px 0;font-size:20px}.pou-gift p{margin:6px 0 12px;font-size:14px;line-height:1.6}
.pou-gift .days{display:flex;gap:5px;justify-content:center;margin:8px 0 12px}.pou-gift .days i{width:30px;height:30px;border-radius:50%;background:#e9d8c8;display:grid;place-items:center;font-size:12px;font-style:normal;font-weight:bold;color:#fff}.pou-gift .days i.on{background:#f5c04a}
.pou-gift button{border:0;font:inherit;font-weight:bold;font-size:15px;padding:12px 26px;border-radius:14px;background:#8fc3e0;color:#fff;box-shadow:0 3px 0 #6fa6c4;cursor:pointer}`;
 const st=document.createElement('style');st.textContent=css;document.head.append(st);
 const sejinImg=()=>$('#sejin .pose-img')||$('#sejin');
 const rel=()=>{const r=room.getBoundingClientRect(),s=sejinImg().getBoundingClientRect();return {r,s,cx:s.left+s.width/2-r.left,top:s.top-r.top,w:s.width,h:s.height};};
 const overSejin=(x,y)=>{const s=sejinImg().getBoundingClientRect();return x>=s.left-12&&x<=s.right+12&&y>=s.top-12&&y<=s.bottom+12;};
 const floatEmoji=(e,x,y)=>{if(still)return;const b=document.createElement('span');b.className='pou-bubble';b.textContent=e;b.style.left=x+'px';b.style.top=y+'px';room.append(b);setTimeout(()=>b.remove(),1100);};
 const persist=()=>{try{save();}catch(e){}};
 // ---------- dock ----------
 const dock=document.createElement('div');dock.className='pou-dock';
 dock.innerHTML='<button type="button" data-t="food" aria-label="간식 서랍">🍪<small>간식</small></button><button type="button" data-t="soap" aria-label="비누로 씻기기" title="비누로 씻기기"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="9" width="13" height="9" rx="3.5" fill="#bfe3f5" stroke="#8a6f60" stroke-width="1.5"/><path d="M6.5 12h6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="18" cy="8" r="3" fill="#fff" stroke="#8fc3e0" stroke-width="1.3"/><circle cx="20" cy="14" r="1.8" fill="#fff" stroke="#8fc3e0" stroke-width="1.2"/></svg><small>씻기</small></button><button type="button" data-t="light" aria-label="불 끄기 · 재우기">💡<small>재우기</small></button>';
 room.append(dock);
 // ---------- 간식 서랍 ----------
 const tray=document.createElement('div');tray.className='pou-tray';tray.hidden=true;room.append(tray);
 const FOOD_EMO={cookie:'🍪',milk:'🥛',candy:'🍬',drink:'🍯'};   // 방 아이템에 이모지가 없는 간식용
 const foods=()=>[{id:'_rice',name:'따뜻한 밥',emoji:'🍚',spr:'items/snack-rice-v1.png',note:'기본 · 무료'}].concat(Object.entries(bag).filter(([id,c])=>c>0&&ITEMS[id]&&!ITEMS[id].keep&&!ITEMS[id].deco&&ITEMS[id].use&&(ITEMS[id].use.배부름||ITEMS[id].use.에너지||ITEMS[id].use.기분)).map(([id,c])=>({id,spr:ITEMS[id].spr,name:ITEMS[id].name,emoji:ITEMS[id].emoji||FOOD_EMO[id]||'🍪',note:'×'+c})));
 function openTray(){
  if(night){say('쿨… 쿨…');return;}
  tray.hidden=false;dock.querySelector('[data-t=food]').classList.add('on');
  tray.innerHTML='<h4>🍪 간식 서랍 <small style="font-weight:normal;color:#8b766b">세진이에게 끌어다 주거나 눌러요</small><button type="button" aria-label="닫기">✕</button></h4><div class="row"></div>';
  tray.querySelector('h4 button').onclick=closeTray;
  const row=tray.querySelector('.row');
  const shopBtn=document.createElement('button');shopBtn.type='button';shopBtn.className='pou-shop';shopBtn.textContent='🛒 간식 사러 가기';shopBtn.onclick=()=>{closeTray();tab('shop');};tray.append(shopBtn);
  foods().forEach(f=>{const el=document.createElement('div');el.className='pou-item';el.innerHTML=`<i>${f.spr?`<img src="../assets/${f.spr}" alt="" style="width:36px;height:36px;object-fit:contain">`:f.emoji}</i>${f.name}<small>${f.note}</small>`;row.append(el);bindDrag(el,f.emoji,pt=>{if(pt.hit||pt.tap)eat(f);},f.spr);});
 }
 function closeTray(){tray.hidden=true;dock.querySelector('[data-t=food]').classList.remove('on');}
 function eat(f){
  if(f.id==='_rice'){act('food');}
  else{useItem(f.id);}
  const {cx,top}=rel();floatEmoji(f.emoji,cx,top+10);persist();
  if(!tray.hidden)openTray();   // refresh counts
 }
 // 끌기: 아이콘을 누른 채 움직이면 따라오고, 세진이 위에서 놓으면 hit. 거의 안 움직이면 tap.
 function bindDrag(el,emoji,done,spr){
  el.addEventListener('pointerdown',e=>{
   e.preventDefault();const g=document.createElement('div');g.className='pou-ghost';if(spr){g.innerHTML='<img src="../assets/'+spr+'" alt="" style="width:48px;height:48px;object-fit:contain">';}else g.textContent=emoji;document.body.append(g);
   const sx=e.clientX,sy=e.clientY;let moved=false;const mv=ev=>{if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>8)moved=true;g.style.left=ev.clientX+'px';g.style.top=ev.clientY+'px';g.style.display=moved?'block':'none';};
   mv(e);
   const up=ev=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);g.remove();
    if(!moved)done({tap:true});else done({hit:overSejin(ev.clientX,ev.clientY)});};
   addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);
  });
 }
 // ---------- 비누로 씻기기 ----------
 let scrubbing=false;
 function scrubStart(e){
  if(night){say('쿨… 쿨…');return;}
  if(needs.청결>=100){say('이미 반짝반짝해! 고마워.');return;}
  e.preventDefault();scrubbing=true;closeTray();
  const g=document.createElement('div');g.className='pou-ghost';g.textContent='🧼';document.body.append(g);
  let acc=0,lx=e.clientX,ly=e.clientY,gained=0,moved=false;const sx=e.clientX,sy=e.clientY;
  g.style.left=e.clientX+'px';g.style.top=e.clientY+'px';
  const mv=ev=>{
   if(Math.hypot(ev.clientX-sx,ev.clientY-sy)>8)moved=true;
   g.style.left=ev.clientX+'px';g.style.top=ev.clientY+'px';
   if(!moved||!overSejin(ev.clientX,ev.clientY)){lx=ev.clientX;ly=ev.clientY;return;}
   acc+=Math.hypot(ev.clientX-lx,ev.clientY-ly);lx=ev.clientX;ly=ev.clientY;
   // 문지른 거리 45px마다 거품 한 번 · 청결 +2 (한 번에 최대 +40)
   while(acc>=45&&gained<40&&needs.청결<100){acc-=45;gained+=2;up('청결',2);const r=room.getBoundingClientRect();floatEmoji(['🫧','✨','🫧'][gained/2%3|0],ev.clientX-r.left+(Math.random()*30-15),ev.clientY-r.top-10);render();}
  };
  const end=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',end);removeEventListener('pointercancel',end);g.remove();scrubbing=false;
   if(!moved){say('비누를 끌어서 세진이를 문질러 주세요.');return;}
   if(gained){xp+=3;say(needs.청결>=90?'뽀득뽀득! 완전 깨끗해졌다.':'시원해… 조금만 더 씻겨 줘.');gain('청결 +'+gained);note('세진이를 비누로 씻겼다.');render();persist();}
   else say('여기야, 여기! 세진이 위를 문질러 줘.');};
  addEventListener('pointermove',mv);addEventListener('pointerup',end);addEventListener('pointercancel',end);
 }
 // ---------- 도구 버튼 ----------
 dock.querySelector('[data-t=food]').onclick=()=>{tray.hidden?openTray():closeTray();};
 dock.querySelector('[data-t=soap]').addEventListener('pointerdown',scrubStart);
 dock.querySelector('[data-t=light]').onclick=()=>{closeTray();act('sleep');};
 // ---------- 생각 말풍선 ----------
 const th=document.createElement('button');th.type='button';th.className='pou-thought';th.hidden=true;room.append(th);
 const WANT={배부름:['🍪','배고파…'],청결:['🫧','씻고 싶어…'],에너지:['😴','졸려…'],기분:['🧶','심심해…']};
 let wantKey=null;
 function thought(){
  const entries=Object.entries(needs).filter(([k])=>WANT[k]).sort((a,b)=>a[1]-b[1]);
  const [k,v]=entries[0];
  if(night||v>=35){th.hidden=true;wantKey=null;dock.querySelectorAll('.pulse').forEach(b=>b.classList.remove('pulse'));return;}
  wantKey=k;th.hidden=false;th.textContent=WANT[k][0];
  try{const {cx,top}=rel();th.style.left=(cx-22+Math.min(46,rel().w*.28))+'px';th.style.top=Math.max(4,top-54)+'px';}catch(e){}
  dock.querySelectorAll('.pulse').forEach(b=>b.classList.remove('pulse'));
  const t={배부름:'food',청결:'soap',에너지:'light'}[k];if(t)dock.querySelector(`[data-t=${t}]`).classList.add('pulse');
 }
 th.onclick=()=>{
  if(!wantKey)return;say(WANT[wantKey][1]);
  if(wantKey==='배부름')openTray();
  else if(wantKey==='청결')say('비누(🧼)를 끌어서 문질러 줘…');
  else if(wantKey==='에너지')say('불(💡)을 끄고 재워 줘…');
  else if(wantKey==='기분')say('뜨개하기나 나가기로 같이 놀자…');
 };
 const renderBefore=render;render=function(){renderBefore();thought();};
 setInterval(thought,1500);setTimeout(thought,800);addEventListener('resize',thought);
 // ---------- 오늘의 선물 (하루 한 번) ----------
 const DKEY='sejin-daily-v1';
 const dget=()=>{try{return JSON.parse(localStorage.getItem(DKEY))||{};}catch(e){return {};}};
 function daily(){
  if(SejinSave.testMode)return;   // 개발·테스트 중에는 띄우지 않는다 (저장을 지우며 시험하면 매번 떴음)
  const d=dget(),today=SejinSave.today();if(d.day===today)return;
  const yest=SejinSave.today(new Date(Date.now()-864e5));
  const streak=d.day===yest?Math.min(99,(d.streak||0)+1):1,reward=5+Math.min(streak-1,6)*2;
  try{localStorage.setItem(DKEY,JSON.stringify({day:today,streak}));}catch(e){}
  yarn+=reward;note(`오늘의 선물로 실뭉치 ${reward}개를 받았다.`);render();persist();
  const o=document.createElement('div');o.className='pou-gift';
  const week=(streak-1)%7+1;
  o.innerHTML=`<div><div style="font-size:44px">🎁</div><h3>오늘의 선물</h3><p>${streak>1?`연속 <b>${streak}일째</b> 놀러 왔어요!`:'오늘도 놀러 와 줘서 고마워요!'}<br>실뭉치 <b>+${reward}개</b></p><div class="days">${Array.from({length:7},(_,i)=>`<i class="${i<week?'on':''}">${i+1}</i>`).join('')}</div><button type="button">고마워요!</button></div>`;
  document.body.append(o);o.querySelector('button').onclick=()=>o.remove();
 }
 // 첫 플레이 안내가 열려 있으면 닫힌 뒤에 보여 준다
 const waitDaily=()=>{const m=document.querySelector('.mdl');if(m&&!m.hidden){setTimeout(waitDaily,800);return;}daily();};
 setTimeout(waitDaily,1800);
 window.SejinRoomPou={openTray,thought,daily};
})();
