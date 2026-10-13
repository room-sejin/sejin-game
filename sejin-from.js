/* 돌아가기 링크 정리:
   ?back=<주소> → 'village.html' 로 가는 링크를 그 주소(천사 마을 장소 화면)로 바꾼다.
   ?from=village → 'place.html?place=…' 로 가는 링크를 천사 마을 지도로 바꾼다. */
(()=>{
 const q=new URLSearchParams(location.search),back=q.get('back'),from=q.get('from');
 if(back&&/^[\w.\-?=&%]+$/.test(back)&&!/^(https?:)?\/\//.test(back)){
  document.querySelectorAll('a[href="village.html"]').forEach(a=>{a.href=back;a.textContent=a.classList.contains('back')?'‹ 돌아가기':'돌아가기';});
 }
 if(from==='village'){
  document.querySelectorAll('a[href^="place.html"]').forEach(a=>{a.href='village.html';a.textContent=a.classList.contains('back')?'‹ 천사 마을로':'천사 마을로';});
 }
})();