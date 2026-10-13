/* 천사 마을 데이터와 저장 (village.html 지도 + vplace.html 장소 안/앞 화면이 함께 쓴다).
   저장 sejin-village-v1: {pieces:{장소id:찾은 조각 수}, solved:{장소id:시각}}. 테스트 모드(?test=on)는 모든 곳이 열린 것으로 본다.
   순서: 연못 → 구름 실 가게 → 선물 가게 → 보랏빛 집. 별 광장은 항상 열려 있고 안내자가 있다. */
(()=>{
 'use strict';
 const KEY='sejin-village-v1';
 const TEST=()=>!!(window.SejinSave&&SejinSave.testMode);
 const vget=()=>{try{const v=JSON.parse(localStorage.getItem(KEY))||{};v.pieces=v.pieces||{};v.solved=v.solved||{};return v;}catch(e){return {pieces:{},solved:{}};}};
 const vset=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));}catch(e){}};
 // x,y,w,h = 지도 그림 위 건물 영역(%) · at = 세진이가 서는 자리 · need = 퍼즐 조각 수 · after = 앞서 열려야 하는 곳
 const SPOTS=[
  {id:'plaza',x:38,y:40,w:22,h:17,name:'별 광장',icon:'⭐',at:[50,49],guide:true,res:{name:'별빛 안내자',emoji:'⭐'}},
  {id:'pond',x:40,y:14,w:23,h:15,name:'작은 연못',icon:'💧',at:[47,34],need:4,after:null,open:'연잎 사이로 길이 열렸어! 구름처럼 폭신한 연잎이야.',res:{name:'연잎 지기',emoji:'🐸'},game:{href:'cloudclimb.html',label:'☁️ 구름 오르기',menu:'☁️ 더 높은 곳으로 올라가기'},greet:['더 높은 곳으로 올라가 보고 싶지 않나요? 여기보다 더 높은 곳이 있대요… 맨 위에는 별나라가 있대요!','저 하늘 끝에는 별나라가 있대요. 구름을 밟고 같이 올라가 볼래요?'],tint:['#bfe8f5','#9fd9e6']},
  {id:'cloudshop',x:66,y:10,w:29,h:29,name:'구름 실 가게',icon:'🧶',at:[73,39],need:6,after:'pond',open:'날개 달린 실뭉치 간판 아래 문이 열렸어!',res:{name:'구름 실 장수',emoji:'☁️'},game:{href:'scarf.html',label:'🧣 목도리 뜨기'},tint:['#ffe3ec','#f7cddd']},
  {id:'giftshop',x:71,y:45,w:26,h:24,name:'선물 가게',icon:'🎁',at:[68,66],need:6,after:'cloudshop',open:'리본이 스르르 풀리면서 문이 열렸어!',res:{name:'리본 천사',emoji:'🎀'},game:{href:'wrap.html',label:'🎁 선물 포장',menu:'🎁 가게 봐 주기'},greet:['어머, 세진 씨! 다들 바빠서 정신이 하나도 없는데… 마침 잘 왔어요! 저 대신 가게 좀 봐 줄래요?','손님이 너무 많아서 손이 모자라요. 잘됐다, 세진 씨가 나 대신 가게 좀 봐 주세요!'],tint:['#ffeacc','#f9d3b0']},
  {id:'house',x:6,y:12,w:27,h:30,name:'보랏빛 집',icon:'🏠',at:[27,40],need:9,after:'giftshop',open:'등나무 사이로 대문이 열렸어!',res:{name:'등나무 천사',emoji:'🪻'},game:{href:'mansion.html',label:'🗝️ 저택 퍼즐'},tint:['#e7dbf7','#cdb9ee']},
 ];
 const byId=Object.fromEntries(SPOTS.map(s=>[s.id,s]));
 const isSolved=id=>TEST()||!!vget().solved[id];
 const canSeek=s=>TEST()||!s.after||isSolved(s.after);
 const nextPlace=()=>SPOTS.find(s=>!s.guide&&!isSolved(s.id));
 const isAngel=()=>{try{return TEST()||(localStorage.getItem('sejin-angel-v1')==='1'&&localStorage.getItem('sejin-form-v1')!=='normal');}catch(e){return false;}};
 window.SejinVillage={SPOTS,byId,vget,vset,isSolved,canSeek,nextPlace,isAngel,TEST,MAP:'assets/character/angel-village-map-v2.jpg'};
})();