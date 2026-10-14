/* 방문 통계(Cloudflare Web Analytics) — 개인 정보·쿠키 없이 페이지 방문 수만 센다. 통계는 Cloudflare 계정(소유자)에 로그인해야만 볼 수 있다.
   세지 않는 경우: ① 공개 주소(game.roomsejin.com)가 아닐 때(localhost 등) ② 이 브라우저가 '소유자'로 표시됐을 때(주소 끝에 ?owner=1 을 한 번 열면 켜짐, ?owner=0 이면 해제)
   ③ 테스트 모드(localStorage 'sejin-test-v1' = true)일 때. 그래서 통계에는 다른 사람이 들어와서 한 것만 남는다.
   주소(호스트)·토큰을 바꾸려면 아래 HOST, TOKEN 만 고친다. */
(()=>{
 'use strict';
 const HOST='game.roomsejin.com',TOKEN='170d3192e01f4990820d3eee90021260',OWN='sejin-owner-v1',TEST='sejin-test-v1';
 const ls={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}},del(k){try{localStorage.removeItem(k);}catch(e){}}};
 try{const o=new URLSearchParams(location.search).get('owner');if(o==='1')ls.set(OWN,'1');else if(o==='0')ls.del(OWN);}catch(e){}
 const reason=()=>location.hostname!==HOST?'다른 주소(테스트 서버)':ls.get(OWN)==='1'?'소유자 브라우저':ls.get(TEST)==='true'?'테스트 모드':'';
 window.SejinStats={host:HOST,reason,counting:()=>!reason(),isOwner:()=>ls.get(OWN)==='1',setOwner(on){if(on)ls.set(OWN,'1');else ls.del(OWN);}};
 if(reason())return;
 try{const s=document.createElement('script');s.type='module';s.src='https://static.cloudflareinsights.com/beacon.min.js';s.setAttribute('data-cf-beacon',JSON.stringify({token:TOKEN}));(document.head||document.documentElement).appendChild(s);}catch(e){}
})();
