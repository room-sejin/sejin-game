/* Whole-room seasonal and event themes. Prop model remains for interaction studies. */
(()=>{
 'use strict';
 // Theme pictures without Sejin drawn in; Sejin is then shown as a separate character (sejin-character.js).
 // The others still contain Sejin (baked) until character-free versions are made.
 const CHARACTER_FREE={basic:'rooms/house-basic-nochar-v1.png'};
 // 이벤트 방 4컨셉 × 3시안 (ChatGPT 2026-10-07): 기본 방과 같은 침대·소파·러그 구도라 세진이 위치도 기본 좌표를 그대로 쓴다.
 const EVENTS=[['christmas','크리스마스','🎄'],['spring','봄맞이 벚꽃','🌸'],['halloween','할로윈','🎃'],['birthday','생일 파티','🎂']],VARIANTS=[['a','기본'],['b','풍성'],['c','색 변형']];
 EVENTS.forEach(([k])=>VARIANTS.forEach(([v])=>{CHARACTER_FREE[k+'-'+v]='rooms/house-'+k+'-'+v+'-nochar-v1.png';}));
 const themes=[
 ['basic','기본','decorated-concept','season',39,77],
 // 크리스마스 등 다른 테마는 다시 만들 예정이라 일단 뺌 (사용자 결정). 그림 파일(sejin-house-christmas-*)은 assets에 보관.
 ].concat(EVENTS.flatMap(([k,n,e])=>VARIANTS.map(([v,vn])=>[k+'-'+v,n+' '+vn,'',k,39,77]))).map(([id,name,file,group,x,y])=>({id,name,file:CHARACTER_FREE[id]||'rooms/house-'+file+'-v1.png',group,x,y,baked:!CHARACTER_FREE[id]}));
 let selected=null,pending=null,request=0,error='';
 const scene=document.createElement('img');scene.className='room-theme-scene';scene.draggable=false;scene.alt='';room.prepend(scene);
 // The chosen theme is saved (SejinSave.decor) and comes back after a reload; `quiet` skips the speech bubble then.
 function choose(id,quiet){
  const theme=themes.find(t=>t.id===id);if(!theme)return;
  const ticket=++request;pending=id;error='';if(sheetKind==='decor')fillSheet();
  const img=new Image();
  img.onload=()=>{if(ticket!==request)return;selected=id;pending=null;scene.src=img.src;scene.alt=theme.name+' 테마로 꾸며진 세진이 방';room.classList.add('whole-room-theme');room.dataset.theme=id;
   room.style.setProperty('--theme-sejin-x',theme.x+'%');room.style.setProperty('--theme-sejin-y',theme.y+'%');
   room.classList.toggle('baked-sejin',theme.baked);window.dispatchEvent(new CustomEvent('sejin-theme',{detail:theme}));
   window.SejinSave?.decor.set({theme:id});
   if(!quiet)say(theme.name+' 분위기로 방을 꾸몄어요.');if(sheetKind==='decor')fillSheet();};
  img.onerror=()=>{if(ticket!==request)return;pending=null;error='방 그림을 불러오지 못했어요. 다시 선택해 주세요.';if(sheetKind==='decor')fillSheet();};
  img.src='../assets/'+theme.file;
 }
 const previousFill=fillSheet;
 window.SejinThemes={list:themes,events:EVENTS,variants:VARIANTS,choose,current:()=>selected};
 fillSheet=()=>{if(sheetKind!=='decor'||true){previousFill();return;}   // one theme only: keep the colour picker
  $('#sheetTitle').innerHTML='방 꾸미기<small>계절이나 이벤트를 고르면 방 전체가 바뀌어요.</small>';
  const tabs=group=>themes.filter(t=>t.group===group).map(t=>'<button role="tab" id="theme-'+t.id+'" aria-controls="theme-preview" data-theme="'+t.id+'" aria-selected="'+(t.id===selected)+'">'+t.name+'</button>').join('');
  const current=themes.find(t=>t.id===selected);
  $('#sheetBody').innerHTML='<div class="sec">계절</div><div class="theme-tabs" role="tablist" aria-label="계절 테마">'+tabs('season')+'</div><div class="sec">이벤트</div><div class="theme-tabs" role="tablist" aria-label="이벤트 테마">'+tabs('event')+'</div>'+
   '<div class="theme-status" role="status">'+(error||(pending?'방을 꾸미고 있어요…':current?current.name+' 테마 적용 중':'테마를 선택해 주세요.'))+'</div>'+
   (current?'<div id="theme-preview" role="tabpanel" aria-labelledby="theme-'+current.id+'"><img class="theme-preview" src="../assets/'+current.file+'" alt="'+current.name+' 방 전체 미리보기"></div>':'');
  $('#sheetBody').querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>choose(b.dataset.theme));
 };
 const savedTheme=window.SejinSave?.decor.get().theme;
 choose(themes.some(t=>t.id===savedTheme)?savedTheme:'basic',true);
})();
