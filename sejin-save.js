/* Shared save for the room and the minigames (same site → same localStorage).
   - Room state: one JSON under STATE_KEY, written by the room page only.
   - Game results: a separate queue under RESULTS_KEY. Minigames push a result when a run ends
     (and {game:'energy', use} when a run starts); the room takes the queue once and applies it.
   Every storage call is wrapped: private windows or blocked storage just play without saving. */
(()=>{
 'use strict';
 const STATE_KEY='sejin-save-v1',RESULTS_KEY='sejin-results-v1',TEST_KEY='sejin-test-v1',DECOR_KEY='sejin-decor-v1',PATTERN_KEY='sejin-patterns-v1';
 function read(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):fallback;}catch(e){return fallback;}}
 function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(e){return false;}}
 // Local calendar day, e.g. "2026-09-30" — daily requests reset when this changes.
 function today(d=new Date()){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
 // Energy (에너지): a doll run costs RUN_COST (the 세진이 practice stage is free). It comes back by itself,
 // +1 every REGEN_MS (also while the game is closed), from naps, and from snacks bought with 실뭉치.
 const ENERGY={RUN_COST:15,REGEN_MS:120000,MAX:100};
 // Energy after the time that passed since `regenAt` (state = {needs, regenAt}). Time spent at MAX does not bank.
 function regen(state,now=Date.now()){
  const e=state&&state.needs&&state.needs.에너지!=null?state.needs.에너지:80,at=state&&state.regenAt||now;
  if(e>=ENERGY.MAX)return {energy:e,regenAt:now};
  const ticks=Math.max(0,Math.floor((now-at)/ENERGY.REGEN_MS));
  return {energy:Math.min(ENERGY.MAX,e+ticks),regenAt:at+ticks*ENERGY.REGEN_MS};
 }
 // The five place games that must be cleared before Sejin can turn into the angel (place.html 산책로).
 const CLEAR_NAMES={pattern:'뜨개 도안 채우기',merge:'실타래 합치기',spot:'공원 틀린 그림 찾기',ribbon:'환영 리본 찾기',friend:'친구 부탁 퍼즐'};
 function clearBanner(id,n){
  if(typeof document==='undefined'||!document.body)return;
  const d=document.createElement('div'),total=Object.keys(CLEAR_NAMES).length;d.setAttribute('role','status');
  d.style.cssText='position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:99;max-width:90vw;padding:12px 18px;border-radius:18px;background:#fffaf0;border:3px solid #f5d58a;color:#5b4a42;text-align:center;font:bold 15px/1.45 "Pretendard","Malgun Gothic",system-ui,sans-serif;box-shadow:0 8px 24px #88756744;pointer-events:none';
  d.innerHTML='🎉 <b>'+CLEAR_NAMES[id]+'</b> 클리어!<br><span style="font-weight:normal;font-size:12.5px;color:#8b766b">천사 변신까지 '+n+' / '+total+(n>=total?' · 산책로로 가 보세요!':'')+'</span>';
  document.body.append(d);
  if(d.animate){d.animate([{opacity:0,transform:'translate(-50%,-20px)'},{opacity:1,transform:'translate(-50%,0)',offset:.12},{opacity:1,transform:'translate(-50%,0)',offset:.85},{opacity:0,transform:'translate(-50%,-10px)'}],{duration:4200,fill:'forwards'}).onfinish=()=>d.remove();}
  else setTimeout(()=>d.remove(),4200);
 } window.SejinSave={
  today,ENERGY,regen,
  // Energy right now as the game page sees it: saved energy + regen − runs not yet picked up by the room.
  energyNow(){const used=read(RESULTS_KEY,[]).filter(r=>r.game==='energy').reduce((s,r)=>s+(r.use||0),0);return Math.max(0,regen(read(STATE_KEY,null)).energy-used);},
  load:()=>read(STATE_KEY,null),
  save:state=>write(STATE_KEY,state),
  pushResult(result){const list=read(RESULTS_KEY,[]);list.push(Object.assign({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),at:Date.now()},result));return write(RESULTS_KEY,list.slice(-50));},
  // What the waiting results (not yet applied by the room) will change: 실뭉치 and bag items. Lets a place page show
  // the true totals and check a purchase or a gift before the room has opened. `dollById` (SejinPlaces.dollById) is
  // needed to count the thread left over from a doll run.
  pendingView(dollById){
   let yarn=0;const bag={},dolls={};const add=(id,n)=>{bag[id]=(bag[id]||0)+n;};
   for(const r of read(RESULTS_KEY,[])){
    if(r.game==='merge'||r.game==='pattern'||r.game==='minigame')yarn+=r.yarn||0;
    else if(r.game==='knit'){if(r.clear){yarn+=r.reward||0;dolls[r.doll]=(dolls[r.doll]||0)+1;}}   // thread gathered in a run stays in the run; only a finished doll pays a fixed reward
    else if(r.game==='pickup'){for(const [id,c] of Object.entries(r.items||{}))add(id,c);}
    else if(r.game==='buy'){yarn-=r.cost||0;add(r.item,r.count||1);}
    else if(r.game==='craft'){for(const [k,n] of Object.entries(r.uses||{}))add(k,-n);for(const [k,n] of Object.entries(r.makes||{}))add(k,n);}
    else if(r.game==='sell'){add(r.item,-(r.count||1));yarn+=r.gain||0;}
    else if(r.game==='spend'){yarn-=r.cost||0;}
    else if(r.game==='give'){add(r.item,-(r.count||1));yarn+=r.reward||0;}
   }
   return {yarn,bag,dolls};
  },
  takeResults(){const list=read(RESULTS_KEY,[]);if(list.length)write(RESULTS_KEY,[]);return list;},
  reset(){try{localStorage.removeItem(STATE_KEY);localStorage.removeItem(RESULTS_KEY);localStorage.removeItem(DECOR_KEY);localStorage.removeItem(PATTERN_KEY);}catch(e){}},
  // 뜨개 도안 채우기 progress: {done: {patternId: times finished}} — kept by pattern.html.
  // Which place games have been cleared at least once ({pattern,merge,spot,ribbon,friend}: time). The 산책로 transformation needs all of them.
  clears:{get:()=>read('sejin-clears-v1',{})||{},
   // First clear of a game: saved, and a "클리어!" banner shows how far the angel transformation is (n / 5).
   mark(id){const c=read('sejin-clears-v1',{})||{};if(c[id])return false;c[id]=Date.now();write('sejin-clears-v1',c);clearBanner(id,Object.keys(CLEAR_NAMES).filter(k=>c[k]).length);return true;}},
  // Stage progress of the place games: {game: {stageNo: best stars}} (see stage-bar.js).
  stages:{get:()=>read('sejin-stages-v1',{})||{},set:v=>write('sejin-stages-v1',v)},
  patterns:{get:()=>read(PATTERN_KEY,{done:{}})||{done:{}},set:v=>write(PATTERN_KEY,v)},
  // Charts the player drew in pattern-design.html: a list of patterns in the same shape as SejinPattern.PATTERNS.
  myPatterns:{get:()=>{const v=read('sejin-my-patterns-v1',[]);return Array.isArray(v)?v:[];},set:v=>write('sejin-my-patterns-v1',v)},
  // Room look: {theme: 'basic'|'christmas', colors: {wall:'lavender', …}} — kept by furniture-ui.js and room-colors.js.
  decor:{get:()=>read(DECOR_KEY,{})||{},set:patch=>write(DECOR_KEY,Object.assign(read(DECOR_KEY,{})||{},patch))},
  // Play-test switch (room page ?test=on / ?test=off): opens every doll stage without marking dolls as made.
  // 내 컴퓨터 테스트 서버(localhost·127.0.0.1)에서는 기본으로 켜짐(모든 잠금 해제). ?test=off 로 끄면 저장된 값이 우선, 공개 사이트에서는 기본 꺼짐.
  get testMode(){const v=read(TEST_KEY,null);if(v===null||v===undefined)return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);return v===true;},
  set testMode(on){try{localStorage.setItem(TEST_KEY,on?'true':'false');}catch(e){}},
 };
 // ?test=on / ?test=off works on every page (the same switch the room page has): opens all stages, places, village spots and secret charts.
 try{const tq=new URLSearchParams(location.search).get('test');if(tq==='on')window.SejinSave.testMode=true;if(tq==='off')window.SejinSave.testMode=false;}catch(e){}
})();