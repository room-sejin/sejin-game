/* 친구 부탁(퀘스트): each friend asks for one crafted item (made in the 공방 from gathered materials), once a day.
   Flow: talk to the friend → [📜 부탁 듣기] → gather / craft → bring it back → [🎁 전달하기] → reward.
   Marker: the friend's place shows ❗ (new or ready to hand over) or ❓ (accepted, still gathering) on the map and over the friend.
   State (sejin-quests-v1): {friendId:{id (craft id), state:'active'|'done', day:'yyyy-mm-dd'}}. Needs sejin-items.js and sejin-save.js. */
(()=>{
 'use strict';
 const KEY='sejin-quests-v1';
 const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {};}};
 const write=s=>{try{localStorage.setItem(KEY,JSON.stringify(s));}catch(e){}};
 // What each friend may ask for (craft ids from sejin-items.js).
 const POOL={
  dog:['c-tart','c-tea','c-yflower','c-ystrawberry','c-ykeyring','c-bouquet'],
  hamster:['c-bookmark','c-pen','c-yscarf','c-ykeyring','c-ystar','c-yflower'],
  rabbit:['c-bouquet','c-wreath','c-ywreath','c-yflower','c-ybasket','c-tea'],
 };
 // Lines the friend says when asking / when satisfied.
 const ASK={
  dog:['저기, 세진아. {item}이(가) 필요한데 만들어 줄 수 있을까?','{item}을(를) 선물하고 싶은 사람이 있어. 부탁해도 될까?'],
  hamster:['세진 씨, 가게에 둘 {item}이(가) 하나 필요해요. 공방에서 만들어 주실래요?','손님이 {item}을(를) 찾으시는데 재고가 없어요. 부탁드려도 될까요?'],
  rabbit:['세진아, 나 {item}이(가) 갖고 싶어. 만들어 줄 수 있어?','소풍 때 쓸 {item}이(가) 필요해! 도와줄래?'],
 };
 const THANKS={dog:['와, 정말 예쁘다! 고마워, 세진아!','딱 이거였어! 역시 믿을 수 있어!'],hamster:['어머, 솜씨가 훌륭하세요! 고맙습니다.','이거면 손님이 좋아하겠어요. 감사해요!'],rabbit:['우와, 완전 마음에 들어! 고마워!','헤헤, 소중히 쓸게. 최고야!']};
 const josaObj=w=>{const c=w.charCodeAt(w.length-1)-0xAC00;return c>=0&&c<11172&&c%28?'을':'를';};
 const fill=(t,name)=>{const c=name.charCodeAt(name.length-1)-0xAC00,b=c>=0&&c<11172&&c%28;return t.replace('{item}이(가)',name+(b?'이':'가')).replace('{item}을(를)',name+(b?'을':'를')).replace('{item}',name);};
 const today=()=>window.SejinSave?SejinSave.today():new Date().toISOString().slice(0,10);
 const IT=()=>window.SejinItems;
 function craftOf(id){return IT().byId[id];}
 function get(friend){return read()[friend]||null;}
 // 'none' (already done today) | 'new' (can ask) | 'active' (accepted, items missing) | 'ready' (items in the bag)
 function status(friend,have){
  const q=get(friend);
  if(!q||q.state==='done'&&q.day!==today())return POOL[friend]?'new':'none';
  if(q.state==='done')return 'none';
  const c=craftOf(q.id);return c&&have&&have(q.id)>=1?'ready':'active';
 }
 // Accept: picks a random craft (never the same as last time when possible) and saves it as active.
 function offer(friend){
  const prev=get(friend),pool=(POOL[friend]||[]).filter(id=>IT().byId[id]);
  const choices=pool.filter(id=>!prev||id!==prev.id);const id=(choices.length?choices:pool)[Math.floor(Math.random()*(choices.length||pool.length))];
  return {id,name:craftOf(id).name,emoji:craftOf(id).emoji};
 }
 function accept(friend,id){const s=read();s[friend]={id,state:'active',day:today()};write(s);}
 function complete(friend){const s=read();if(s[friend]){s[friend].state='done';s[friend].day=today();}write(s);}
 // Reward for handing in: yarn about 1.4× the item's selling price + 4.
 const rewardOf=id=>Math.round(craftOf(id).sell*1.4)+4;
 // Thank-you gift besides the yarn: the 친구네 집 friend gives something only that house gives; the shop friend gives yarn; the park friend gives park plants.
 const BONUS={dog:()=>SejinItems.HOUSE.map(x=>x.id),hamster:()=>['y-1','y-2','y-3'],rabbit:()=>['m-flower','m-purple','m-berry']};
 function bonusOf(friend){const ids=(BONUS[friend]||BONUS.dog)().filter(id=>IT().byId[id]);if(!ids.length)return null;const id=ids[Math.floor(Math.random()*ids.length)];return {id,name:IT().byId[id].name,emoji:IT().byId[id].emoji};}
 function askLine(friend,id){const L=ASK[friend]||ASK.dog;return fill(L[Math.floor(Math.random()*L.length)],craftOf(id).name);}
 function thanksLine(friend){const L=THANKS[friend]||THANKS.dog;return L[Math.floor(Math.random()*L.length)];}
 function marker(friend,have){const s=status(friend,have);return s==='new'||s==='ready'?'!':s==='active'?'?':'';}
 const api={get,status,offer,accept,complete,rewardOf,bonusOf,askLine,thanksLine,marker,POOL};
 if(typeof window!=='undefined')window.SejinQuests=api;if(typeof module!=='undefined')module.exports=api;
})();
