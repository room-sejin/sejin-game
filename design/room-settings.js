/* 방 화면의 설정(⚙️)과 처음 플레이 안내(튜토리얼).
   설정: 효과음 켜기/끄기 · 처음 안내 다시 보기 · 진행 데이터 내보내기/가져오기(브라우저를 바꿔도 이어서) · 테스트 모드 · 처음부터 다시 하기.
   저장 데이터는 이 브라우저의 localStorage 중 'sejin-' 으로 시작하는 키들이다. */
(()=>{
 'use strict';
 const $=s=>document.querySelector(s);
 const TKEY='sejin-tutorial-v1';
 const get=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
 const set=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
 const muted=()=>get('sejin-mute-v1')==='1';
 const sfxVolNow=()=>window.SejinSfx?SejinSfx.getVol():(muted()?0:50),bgmVolNow=()=>window.SejinBgm?SejinBgm.getVol():50;
 const css=`.mdl{position:fixed;inset:0;z-index:90;display:grid;place-items:center;background:#4a3a5a66;padding:14px}.mdl[hidden]{display:none}
.mdl .box{background:#fffaf0;border-radius:24px;padding:18px 18px 16px;max-width:380px;width:100%;max-height:90dvh;overflow:auto;box-shadow:0 12px 40px #0005;color:#5b4a42;font-family:inherit}
.mdl h3{margin:0 0 4px;font-size:19px}.mdl .sub{margin:0 0 12px;font-size:12px;color:#8b766b}
.mdl .row{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#fff;border-radius:14px;padding:10px 12px;margin-bottom:8px;box-shadow:0 2px 0 #e9d8c8;font-size:14px;font-weight:bold}
.mdl .row small{display:block;font-weight:normal;color:#8b766b;font-size:11px;margin-top:2px}
.mdl button.b{border:0;font:inherit;font-weight:bold;font-size:13px;padding:9px 14px;border-radius:12px;background:#8fc3e0;color:#fff;box-shadow:0 3px 0 #6fa6c4;cursor:pointer;white-space:nowrap}
.mdl button.b.ghost{background:#fff;color:#5b4a42;box-shadow:0 3px 0 #e9d8c8}.mdl button.b.warn{background:#e58c9c;box-shadow:0 3px 0 #c06a7a}
.mdl textarea{width:100%;min-height:74px;border:2px solid #e9d8c8;border-radius:12px;padding:8px;font:11px/1.4 ui-monospace,monospace;color:#5b4a42;resize:vertical;margin:6px 0}
.mdl .close{display:block;width:100%;margin-top:6px}
.mdl .tut{text-align:center}.mdl .tut .big{font-size:52px;margin:6px 0}.mdl .tut p{margin:6px 0 12px;font-size:14.5px;line-height:1.7}
.mdl .dots{display:flex;gap:6px;justify-content:center;margin:6px 0 12px}.mdl .dots i{width:9px;height:9px;border-radius:50%;background:#e9d8c8}.mdl .dots i.on{background:#f2a7b5}
.mdl .acts{display:flex;gap:8px}.mdl .acts button{flex:1}
.setbtn{margin-left:6px;border:0;background:#fffaf4;border-radius:999px;width:30px;height:30px;font-size:15px;cursor:pointer;box-shadow:0 2px 0 #e9d8c8}`;
 const st=document.createElement('style');st.textContent=css;document.head.append(st);
 const mdl=document.createElement('div');mdl.className='mdl';mdl.hidden=true;document.body.append(mdl);
 const close=()=>{mdl.hidden=true;mdl.innerHTML='';};
 mdl.addEventListener('click',e=>{if(e.target===mdl)close();});
 // ---------- 처음 플레이 안내 ----------
 const STEPS=[
  ['🏠','세진이를 돌봐 주세요','세진이를 쓰다듬고, 왼쪽 도구로 🍪 간식 · 🧼 씻기 · 💡 재우기를 해요. 바닥 쓰레기는 눌러서 쓸어요.'],
  ['🧶','인형을 만들어요','작업실에서 뜨개 달리기를 해서 인형을 완성하면 지도에 새 장소가 열려요. 방 위쪽 🎯 줄이 다음 할 일을 알려 줘요.'],
  ['🗺️','나가서 친구를 만나요','지도에서 친구를 눌러 이야기하고 게임을 해요. 친구의 ❗ 부탁을 들어주면 선물을 받아요.'],
 ];
 function tutorial(i=0){
  const [ic,t,p]=STEPS[i],last=i===STEPS.length-1;
  mdl.innerHTML=`<div class="box tut"><div class="big">${ic}</div><h3>${t}</h3><p>${p}</p><div class="dots">${STEPS.map((_,k)=>`<i class="${k===i?'on':''}"></i>`).join('')}</div><div class="acts">${i?'<button class="b ghost" id="tp">이전</button>':'<button class="b ghost" id="tx">건너뛰기</button>'}<button class="b" id="tn">${last?'시작하기!':'다음'}</button></div></div>`;
  mdl.hidden=false;
  const done=()=>{set(TKEY,'1');close();};
  if(i)$('#tp').onclick=()=>tutorial(i-1);else $('#tx').onclick=done;
  $('#tn').onclick=()=>last?done():tutorial(i+1);
 }
 // ---------- 설정 ----------
 const keys=()=>{const r=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('sejin-'))r.push(k);}}catch(e){}return r;};
 const exportData=()=>{const o={};keys().forEach(k=>o[k]=get(k));return JSON.stringify({game:'sejin',v:1,at:new Date().toISOString(),data:o});};
 function settings(msg){
  const test=!!(window.SejinSave&&SejinSave.testMode);
  mdl.innerHTML=`<div class="box"><h3>⚙️ 설정</h3><p class="sub">${msg||'이 기기의 브라우저에 저장된 기록을 관리해요.'}</p>
   <div class="row" style="display:block"><span>🔊 효과음<small id="sSfxV">${sfxVolNow()===0?'꺼짐':sfxVolNow()+'%'}</small></span><input type="range" id="sSfx" min="0" max="100" step="5" value="${sfxVolNow()}" aria-label="효과음 크기" style="width:100%;accent-color:#8fc3e0"></div>
   <div class="row" style="display:block"><span>🎵 배경음<small id="sBgmV">${bgmVolNow()===0?'꺼짐':bgmVolNow()+'%'}</small></span><input type="range" id="sBgm" min="0" max="100" step="5" value="${bgmVolNow()}" aria-label="배경음 크기" style="width:100%;accent-color:#f2a7b5"></div>
   <div class="row"><span>처음 안내<small>게임 방법을 다시 볼 수 있어요</small></span><button class="b ghost" id="sTut">다시 보기</button></div>
   <div class="row" style="display:block"><span>기록 내보내기 · 가져오기<small>다른 브라우저나 기기에서 이어서 하려면 아래 글자를 복사해 두었다가 붙여 넣어요</small></span>
    <textarea id="sBox" aria-label="기록 데이터" placeholder="여기에 내보낸 기록을 붙여 넣고 '가져오기'를 눌러요"></textarea>
    <div class="acts"><button class="b" id="sExp">내 기록 보기·복사</button><button class="b ghost" id="sImp">가져오기</button></div></div>
   <div class="row"><span>방문 통계<small>방문 수만 세어요. 누가 왔는지·개인 정보는 모으지 않아요${window.SejinStats&&SejinStats.isOwner()?' · 이 브라우저는 통계에서 제외돼 있어요':''}</small></span>${(window.SejinStats&&(SejinStats.isOwner()||test))?`<button class="b ghost" id="sOwn">${SejinStats.isOwner()?'내 접속 포함하기':'내 접속 제외하기'}</button>`:''}</div>
   <div class="row"><span>테스트 모드<small>${test?'켜짐 — 모든 잠금이 열려 있어요':'꺼짐'}</small></span><button class="b ghost" id="sTest">${test?'끄기':'켜기'}</button></div>
   <div class="row"><span>처음부터 다시 하기<small>모든 기록이 지워져요</small></span><button class="b warn" id="sReset">지우기</button></div>
   <button class="b ghost close" id="sClose">닫기</button></div>`;
  mdl.hidden=false;
  $('#sSfx').oninput=e=>{const v=+e.target.value;window.SejinSfx&&SejinSfx.setVol(v);$('#sSfxV').textContent=v?v+'%':'꺼짐';const b=$('#sfxBtn');if(b)b.textContent=v?'🔊':'🔇';};
  $('#sSfx').onchange=()=>window.SejinSfx&&SejinSfx.play('ok');
  $('#sBgm').oninput=e=>{const v=+e.target.value;window.SejinBgm&&SejinBgm.setVol(v);$('#sBgmV').textContent=v?v+'%':'꺼짐';};
  $('#sTut').onclick=()=>tutorial(0);
  $('#sExp').onclick=async()=>{const box=$('#sBox');box.value=exportData();box.select();try{await navigator.clipboard.writeText(box.value);settings0(box.value,'복사했어요! 이 글자를 안전한 곳에 붙여 두세요.');}catch(e){}};
  $('#sImp').onclick=()=>{
   const v=$('#sBox').value.trim();if(!v){settings('붙여 넣을 기록이 비어 있어요.');return;}
   let o;try{o=JSON.parse(v);if(o.game!=='sejin'||!o.data)throw 0;}catch(e){settings('기록 형식이 맞지 않아요. 내보낸 글자를 그대로 붙여 넣어 주세요.');return;}
   if(!confirm('이 기기의 현재 기록이 가져온 기록으로 바뀌어요. 계속할까요?'))return;
   keys().forEach(k=>{try{localStorage.removeItem(k);}catch(e){}});Object.entries(o.data).forEach(([k,val])=>{if(k.startsWith('sejin-')&&typeof val==='string')set(k,val);});location.reload();};
  if($('#sOwn'))$('#sOwn').onclick=()=>{SejinStats.setOwner(!SejinStats.isOwner());location.reload();};
  $('#sTest').onclick=()=>{if(window.SejinSave)SejinSave.testMode=!test;location.reload();};
  let armed=false;$('#sReset').onclick=()=>{if(!armed){armed=true;$('#sReset').textContent='정말 지울까요?';return;}keys().forEach(k=>{try{localStorage.removeItem(k);}catch(e){}});location.reload();};
  $('#sClose').onclick=close;
 }
 function settings0(text,msg){settings(msg);const box=$('#sBox');if(box){box.value=text;box.select();}}
 // ---------- 버튼 ----------
 const sfx=$('#sfxBtn');const b=document.createElement('button');b.className='setbtn';b.id='setBtn';b.setAttribute('aria-label','설정');b.textContent='⚙️';b.onclick=()=>settings();
 if(sfx)sfx.after(b);else document.body.append(b);
 window.SejinRoomSettings={settings,tutorial};
 // 처음 한 번만 자동으로 안내 (이미 봤거나 테스트 모드면 건너뜀. 방이 먼저 저장을 해 버리므로 저장 기록 유무로는 새 플레이어를 구분하지 않는다)
 if(!get(TKEY)&&!(window.SejinSave&&SejinSave.testMode))setTimeout(()=>tutorial(0),900);
})();
