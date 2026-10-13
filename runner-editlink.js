/* 게임 화면 ↔ 맵 편집 화면 오가기 (테스트 모드/내 컴퓨터에서만 보임).
   게임 화면 구석의 '🛠 맵 편집' 버튼 → knit.html?doll=<스테이지>&edit=1&test=on . 편집 화면의 '▶ 시험 플레이'는 그 반대 방향. */
(()=>{
 const q=new URLSearchParams(location.search);if(q.get('edit'))return;
 const local=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
 let test=false;try{test=!!(window.SejinSave&&SejinSave.testMode);}catch(e){}
 if(!local&&!test)return;
 const doll=q.get('doll')||'sejin';
 const a=document.createElement('a');a.href='knit.html?doll='+encodeURIComponent(doll)+'&edit=1&test=on';a.textContent='🛠 맵 편집';
 a.style.cssText='position:fixed;right:12px;bottom:12px;z-index:60;background:#8fc3e0;color:#fff;font:bold 14px "Malgun Gothic",sans-serif;padding:10px 14px;border-radius:14px;box-shadow:0 3px 0 #6fa6c4;text-decoration:none';
 document.body.append(a);
})();
