/* 항상 보이는 상태줄: 레벨 · 실뭉치 · 에너지(스태미나) + 이 게임이 에너지를 얼마나 쓰는지.
   방(raising-mockup)과 장소 화면(place.html)에는 이미 같은 칩이 있어 여기서는 넣지 않는다. 게임 화면마다 맨 위에 얇게 붙는다.
   값은 저장(SejinSave)과 아직 방에 반영되지 않은 결과(pendingView)를 합쳐 계산한다. */
(()=>{
 'use strict';
 if(window.__sejinHud)return;window.__sejinHud=true;
 const page=(location.pathname.split('/').pop()||'index.html').replace('.html','');
 const COST={knit:null,spot:0,market:0,ribbon:0,merge:0,pattern:0,wrap:0,scarf:0,cloudclimb:0,mansion:0,jigsaw:0,friend:0,lily:0,vplace:0};   // null = 아래에서 계산(뜨개 달리기)
 if(!(page in COST))return;
 const css=`body{padding-top:var(--hud-h,30px)!important}
.sejin-hud{position:fixed;left:0;right:0;top:0;height:var(--hud-h,30px);z-index:9999;display:flex;gap:6px;align-items:center;justify-content:center;padding:0 8px;background:#fffaf2f2;border-bottom:1px solid #e9d8c8;font:bold 11.5px/1 "Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;color:#5b4a42;box-shadow:0 2px 8px #8875671a}
.sejin-hud span,.sejin-hud button{background:#fff;border:0;border-radius:10px;padding:4px 9px;font:inherit;box-shadow:0 1px 0 #e9d8c8;white-space:nowrap;color:inherit}
.sejin-hud button{cursor:pointer}.sejin-hud .cost{background:#eaf4fa;color:#4d7a92}.sejin-hud .cost.pay{background:#fde7ea;color:#b4586a}.sejin-hud .low{color:#c0495f}
.wrap,.pagefix{height:calc(100dvh - var(--hud-h,30px))!important}
@media(max-width:380px){.sejin-hud{gap:4px;font-size:10.5px}.sejin-hud span,.sejin-hud button{padding:4px 7px}}`;
 const st=document.createElement('style');st.textContent=css;document.head.append(st);
 const bar=document.createElement('div');bar.className='sejin-hud';bar.setAttribute('role','status');bar.setAttribute('aria-label','레벨, 실뭉치, 에너지');
 bar.innerHTML='<span id="shLv"></span><span id="shYarn"></span><button type="button" id="shEn" aria-label="에너지 안내"></button><span class="cost" id="shCost"></span>';
 document.body.prepend(bar);
 const q=new URLSearchParams(location.search);
 const costInfo=()=>{
  if(page==='knit'){const d=q.get('doll')||'sejin',free=d==='sejin'||window.SejinSave&&SejinSave.testMode;
   if(free)return {t:'이 게임 ⚡ 무료'+(d==='sejin'?' (연습)':' (테스트)'),pay:false};
   const run=(window.SejinSave&&SejinSave.ENERGY&&SejinSave.ENERGY.RUN_COST)||15;const dollY=(window.SejinPlaces&&SejinPlaces.dollById&&SejinPlaces.dollById(d)||{}).makeCost||0;
   return {t:'이 게임 ⚡ −'+run+(dollY?' · 🧶 −'+dollY:''),pay:true};}
  const c=COST[page];return {t:c?'이 게임 ⚡ −'+c:'이 게임 ⚡ 무료',pay:!!c};
 };
 let EN=100;
 function refresh(){
  try{
   const S=window.SejinSave;if(!S)return;
   const save=S.load()||{},xp=save.xp??40,P=window.SejinPlaces;
   const lv=P&&P.levelInfo?P.levelInfo(xp).lv:'';
   const pv=P&&S.pendingView?S.pendingView(P.dollById):{yarn:0};
   const yarn=Math.max(0,(save.yarn??120)+(pv.yarn||0)),en=S.energyNow?S.energyNow():0;EN=(S.ENERGY&&S.ENERGY.MAX)||100;
   $('#shLv').textContent='Lv.'+lv;$('#shYarn').textContent='🧶 실뭉치 '+yarn;
   const e=$('#shEn');e.textContent='⚡ '+en+' / '+EN;e.className=en<15?'low':'';
   const c=costInfo(),cc=$('#shCost');cc.textContent=c.t;cc.className='cost'+(c.pay?' pay':'');
  }catch(e){}
 }
 const $=s=>bar.querySelector(s);
 $('#shEn').onclick=()=>{const c=costInfo();alert('⚡ 에너지는 뜨개 달리기 한 판(인형 만들기)에만 써요 (세진이 연습 판은 무료). 다른 게임과 이야기는 에너지를 쓰지 않아요.\n2분마다 +1, 낮잠·간식으로 채워요.\n\n'+c.t);};
 // 장소 데이터가 없는 페이지에서도 레벨 계산이 되도록 필요하면 불러온다
 const ready=()=>{refresh();setInterval(refresh,1500);addEventListener('storage',refresh);document.addEventListener('visibilitychange',refresh);};
 if(window.SejinPlaces)ready();else{const s=document.createElement('script');s.src='sejin-places.js';s.onload=ready;s.onerror=ready;document.head.append(s);}
 window.SejinHud={refresh,setCost:t=>{const c=$('#shCost');c.textContent=t;}};
})();
