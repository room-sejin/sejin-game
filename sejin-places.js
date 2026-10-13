/* Places on the outing map and the doll (character) list, shared by the room page and place.html.
   Places open by making dolls, not by level:
   - unlock: id of the doll that opens the place when it is finished for the first time.
     A place without `unlock` is open from the start (집 · 이벤트 광장 · 공방).
   - hit: tap area over the building on the map [left, top, right, bottom] in the 360×320 frame.
   - x, y: name tag on the map picture (360×320 frame of assets/maps/map-workshop-event-v3.jpg); wx, wy: where Sejin stands.
   - scene: background of the place page (null → soft colour until a picture is made).
   - stand: where Sejin stands in that picture (x = centre %, b = bottom %, w = width %).
   - games: minigames started from the place page (one card each); href null = not made yet (button says 곧 열려요).
     Plans for each game: design/sejin-place-minigames-v1.md.
   DOLLS: dolls made in the home 작업실, one 뜨개 달리기 stage each, in order of difficulty. The first is open from
   the start; each next one opens when the one before has been finished. `art` = standing picture (null until
   drawn); `example` = planned, name and look not decided yet.
   Friendship level (Lv) stays as Sejin's closeness only: Lv.1→2 needs 60 xp, then +20 per level. */
(()=>{
 'use strict';
 const DOLLS=[
  // Order = difficulty: each doll's stage (knit.html?doll=id, rules in runner.js STAGES) opens after the one before is finished.
  {id:'sejin',name:'세진이 인형',stage:'집 작업실',hint:'첫 세진이 인형을 완성하면 열려요',art:'character/base-v1.png',about:'하늘색 후드를 쓴 수줍은 곰. 방에서 함께 지내는 첫 번째 친구예요.'},
  // yarn: thread needed to knit the doll, gathered in ONE run of its stage (yarn along the way, on arches and
  // ledges). Reach the end with at least this much and the doll is made; otherwise try the stage again.
  // Leftover thread (and all thread from a failed run) becomes 실뭉치.
  {id:'friend',name:'친구 인형',stage:'친구네 집 거실',yarn:50,makeCost:10,hint:'작업실에서 친구 인형을 완성하면 열려요',art:null,card:'friends/npc-dog.png',example:true,about:'세진이의 첫 인형 친구. 만들면 친구네 집에 놀러 갈 수 있어요.'},
  {id:'shopkeeper',name:'실 가게 사장님',stage:'실 가게',yarn:100,makeCost:15,hint:'작업실에서 실 가게 사장님 인형을 완성하면 열려요',art:null,card:'friends/npc-hamster.png',example:true,about:'알록달록 실을 파는 다정한 사장님. 만들면 실 가게가 문을 열어요.'},
  {id:'parkfriend',name:'공원 친구',stage:'공원',yarn:115,makeCost:20,hint:'작업실에서 공원 친구 인형을 완성하면 열려요',art:null,card:'friends/npc-rabbit.png',example:true,about:'공원에서 만나는 새 친구(디자인 준비 중). 만들면 공원에 갈 수 있어요.'},
  {id:'angel',name:'천사 세진이',stage:'천사 구름길',yarn:135,makeCost:30,hint:'작업실에서 천사 세진이를 완성하면 열려요',art:null,card:'friends/npc-angel.png',example:true,about:'세진이가 날개를 달고 변신한 수호천사 모습이에요(다른 친구가 아니라 세진이 자신). 가장 어려운 도안이에요. 만들면 천사 마을로 가는 산책로가 열려요.'},
 ];
 const PLACES=[
  {id:'home',hit:[157,195,279,273],name:'세진이네 집',desc:'포근한 내 방으로 돌아가요.',color:'var(--pink)',x:216,y:196,wx:214,wy:282,home:true},
  {id:'walk',hit:[92,16,200,94],name:'산책로',desc:'숲 너머 천사 마을로 이어지는 길목이에요.',color:'var(--sage)',x:122,y:42,wx:184,wy:90,unlock:'angel',
   scene:'character/angel-trail-lobby-v1.jpg',stand:{x:50,b:12,w:17},tint:'#dcefd6',
   gather:{key:'walk',spots:[{id:'tree',at:[90,36],icon:'🌳',short:'나무'},{id:'bush',at:[14,62],icon:'🌿',short:'풀숲'}]},
   // 천사 세진이 is Sejin transformed (not another character). On this path Sejin earns the change: give ribbons to the three
   // friends (see place.html wing card), then transforms into the angel form and may enter the 천사 마을 (village.html).
   transform:{needs:[['pattern','공방 · 뜨개 도안 채우기','workshop','🧵','세진이 얼굴 도안까지 완성'],['merge','실 가게 · 실타래 합치기','shop','🧶','세진이 인형까지 만들기'],['spot','공원 · 틀린 그림 찾기','park','🔍','4단계까지 모두 클리어'],['ribbon','이벤트 광장 · 장터 그림 잇기','plaza','🧺','4단계까지 모두 클리어'],['friend','친구네 집 · 친구 부탁 퍼즐','friend','🧩','5단계까지 모두 클리어']]},
   lines:['…여기가 천사 마을로 가는 길이구나.','저 문 너머에 마을이 있대.','날개가 있으면 갈 수 있을까?'],
   angelLines:['날개가 돋았어… 이게 내 수호천사 모습이야.','날개로 날면 천사 마을까지 금방 갈 수 있을까?','바람이 간질간질해. 조금 두근거려.'],
   greet:'이 길 끝에 천사 마을이 있어. 그런데 문이 닫혀 있네…',
   angelGreet:'문이 스르르 열렸어. 이제 천사 마을로 갈 수 있어!',
   games:[]},
  {id:'plaza',hit:[146,125,246,173],name:'이벤트 광장',desc:'우체통에 온 소식을 보고 작은 장터를 구경해요.',color:'var(--butter)',x:166,y:126,wx:190,wy:160,
   scene:'rooms/event-plaza-clean-v2.jpg',stand:{x:36,b:24,w:17},
   greet:'우체통에 편지가 왔을까? 장터도 열렸네!',
   spots:[{x:2,y:30,w:18,h:30,label:'우체통 열기',href:'mailbox.html',icon:'💌'}],
   games:[{name:'장터 그림 잇기',about:'같은 그림 두 개를 이어서 없애요. 12개 장터마다 판이 커지고, 뒤쪽 장터에는 제한 시간이 있어요. 리본도 얻을 수 있어요.',href:'market.html',icon:'🧺',short:'그림 잇기',menu:'🧺 장터 그림 잇기 시작',at:[80,50]}]},
  {id:'park',hit:[200,49,333,97],name:'공원',desc:'연못과 피크닉 자리에서 바람 쐬기 · 기분 회복',color:'var(--sky)',x:262,y:60,wx:300,wy:102,unlock:'parkfriend',
   scene:'spot/park-lobby-v1.jpg',stand:{x:30,b:14,w:17},tint:'#dcecf2',
   gather:{key:'park',spots:[{id:'tree',at:[14,36],icon:'🌳',short:'나무'},{id:'bush',at:[7,78],icon:'🌿',short:'풀숲'}]},
   npc:{id:'rabbit',name:'토끼 친구',art:'friends/npc-rabbit.png',likes:['c-bouquet','c-wreath'],x:58,b:12,w:17,talk:[
    {w:'n',t:'어, 세진이다! 여기 피크닉 자리 비어 있어.'},
    {w:'s',t:'…나도 앉아도 돼?'},
    {w:'n',t:'물론이지! 뭐 하고 놀까?',choices:[['틀린 그림 찾기 하자!','좋아! 눈 크게 뜨고 찾아보자. 나 이런 거 잘해!'],['그냥 앉아서 쉬자','그것도 좋다. 바람이 시원해서 졸려…']]}],
    chat:['연못에 연잎이 떠 있어.','저 다리는 건너면 기분이 좋아져.','꽃 향기 나지?']},greet:'바람이 시원해… 여기 잠깐 앉아 있자.',
   games:[{name:'공원 틀린 그림 찾기',about:'두 장의 그림에서 달라진 곳을 찾아요. 10개 스테이지 · 풍경이 계속 바뀌어요.',href:'spot.html',icon:'🔍',short:'틀린 그림',menu:'🔍 틀린 그림 찾기 시작',at:[80,72]}]},
  {id:'shop',hit:[254,103,349,190],name:'실 가게',desc:'새로운 색 실과 도안을 구경해요.',color:'var(--pink)',x:304,y:106,wx:292,wy:194,unlock:'shopkeeper',
   scene:'maps/yarnshop-lobby-v1.jpg',stand:{x:32,b:13,w:17},tint:'#f8e3e7',
   npc:{id:'hamster',name:'햄스터 사장님',art:'friends/npc-hamster.png',likes:['c-bookmark','c-pen'],x:62,b:13,w:19,talk:[
    {w:'n',t:'어서 오세요! 오늘은 새 실이 잔뜩 들어왔답니다.'},
    {w:'s',t:'와, 색이 정말 많다…'},
    {w:'n',t:'마음에 드는 색 있어요? 실타래를 합치다 보면 더 큰 실타래가 된답니다.',choices:[['실타래 합치기 해 볼래요','좋아요! 바구니가 넘치기 전에 조심하세요.'],['구경만 할게요','천천히 보세요. 사고 싶은 게 생기면 말해 줘요.']]}],
    chat:['이 분홍 실은 제가 제일 좋아하는 색이에요.','뜨개질은 마음이 편해져요.','실 뭉치는 굴러다니니까 조심!']},greet:'와, 실 색깔이 이렇게 많다니…!',
   games:[{name:'실타래 합치기',about:'같은 실타래끼리 닿으면 더 큰 실타래가 돼요. 바구니가 넘치기 전에 세진이 인형까지 만들어 봐요.',href:'merge.html',icon:'🧶',short:'실타래 합치기',menu:'🧶 실타래 합치기 시작',at:[88,80]}]},
  // 공방 (outside) is separate from the home 작업실: the 작업실 makes dolls (뜨개 달리기),
  // the 공방 is where Sejin learns new patterns (도안). A finished pattern opens a new doll in the 작업실.
  {id:'workshop',hit:[11,195,125,271],name:'공방',desc:'공방 선생님께 새 뜨개 도안을 배워요.',color:'var(--sky)',x:66,y:196,wx:134,wy:290,
   scene:'maps/workshop-lobby-v1.jpg',craft:{at:[84,80],icon:'🛠️',short:'소품 만들기'},stand:{x:50,b:16,w:17},tint:'#e3eef6',greet:'새 도안을 배우러 왔어. 오늘은 뭘 배울까?',
   games:[{name:'뜨개 도안 채우기',about:'번호에 맞는 실 색으로 도안 칸을 채워 그림을 완성해요. 도안 6개 · 처음 완성하면 실뭉치를 받아요.',href:'pattern.html',icon:'🧵',short:'도안 채우기',at:[53,45]}]},
  {id:'friend',hit:[11,95,135,173],name:'친구네 집',desc:'인형 친구를 만나러 가요.',color:'var(--lav)',x:54,y:98,wx:70,wy:176,unlock:'friend',
   scene:'friends/friend-house-lobby-v1.jpg',stand:{x:34,b:16,w:17},
   npc:{id:'dog',name:'강아지 친구',art:'friends/npc-dog.png',likes:['c-tart','c-tea'],x:64,b:16,w:20,talk:[
    {w:'n',t:'왔구나, 세진아! 기다리고 있었어.'},
    {w:'s',t:'…안녕. 놀러 왔어.'},
    {w:'n',t:'뜨개 재료를 같이 모으면서 놀고 싶은데, 어때?',choices:[['응, 같이 놀자!','신난다! 같은 재료 3개를 맞추면 돼.'],['조금 어려울 것 같아…','괜찮아, 천천히 해도 돼. 나도 같이 할게.']]}],
    chat:['이 카디건은 세진이 덕분에 생겼어.','차 마실래?','오늘 날씨 좋다.']},
   greet:'똑똑… 놀러 왔어.',
   games:[{name:'친구랑 놀기',about:'강아지 친구와 이야기하며 놀아요. 같은 뜨개 재료 3개를 맞춰 없애는 퍼즐로, 놀이는 매번 랜덤으로 달라지고 친구네 집에서만 얻는 아이템도 나와요.',href:'friend.html',icon:'🐶',short:'친구랑 놀기',menu:'🐶 친구랑 놀기',at:[84,76]}]},
 ];
 const LEVEL_XP=lv=>60+20*(lv-1);
 function levelInfo(xp){let lv=1,rest=xp;while(rest>=LEVEL_XP(lv)){rest-=LEVEL_XP(lv);lv++;}return {lv,rest,need:LEVEL_XP(lv)};}
 const dollById=id=>DOLLS.find(d=>d.id===id);
 // dolls = {dollId: how many finished} from the save.
 const isOpen=(p,dolls)=>!p.unlock||!!(dolls&&dolls[p.unlock])||!!(window.SejinSave&&window.SejinSave.testMode); // test mode opens every place
 const obj=w=>{const c=w.charCodeAt(w.length-1)-0xAC00;return w+(c>=0&&c<11172&&c%28?'을':'를');};
 const needText=p=>p.unlock?obj(dollById(p.unlock).name)+' 만들면 열려요':'';
 const stageName=lv=>lv<4?'낯가림':lv<7?'친해지는 중':lv<10?'단짝':'수호천사의 친구';
 // Friends = the characters who live in a place (with what they like); the 친구들 tab of the room lists them.
 const FRIENDS=PLACES.filter(p=>p.npc).map(p=>({...p.npc,place:p.id,placeName:p.name}));
 // 천사 마을 인형 도감: 천사 마을에서 퍼즐을 풀면 '도안이 등록'되고, 원하면 실뭉치로 만들어 도감을 채운다(꼭 만들 필요 없음, 장소 해금과 무관).
// 만든 인형은 나중에 방에서 함께 지내는 캐릭터가 될 수 있다(포즈 그림이 생기면). place = 천사 마을 장소 id.
const VILLAGE_DOLLS=[
 {id:'v-pond',place:'pond',name:'연잎 지기 인형',emoji:'🐸',cost:30,art:null,card:'dolls/doll-card-lilypad-v2.png',hint:'천사 마을 작은 연못의 퍼즐을 풀어 이곳을 열면 만들 수 있어요',about:'연못을 지키는 포근한 개구리 천사. 연잎 위에서 낮잠 자는 걸 좋아해요.'},
 {id:'v-cloudshop',place:'cloudshop',name:'구름 실 장수 인형',emoji:'☁️',cost:30,art:null,card:'dolls/doll-card-cloudyarn-v2.png',hint:'천사 마을 구름 실 가게의 퍼즐을 풀어 이곳을 열면 만들 수 있어요',about:'구름 실을 파는 다정한 장수. 목도리를 아주 잘 떠요.'},
 {id:'v-giftshop',place:'giftshop',name:'리본 천사 인형',emoji:'🎀',cost:35,art:null,card:'dolls/doll-card-ribbon-v2.png',hint:'천사 마을 선물 가게의 퍼즐을 풀어 이곳을 열면 만들 수 있어요',about:'선물을 예쁘게 포장해 주는 리본 천사. 가끔 가게를 맡기고 놀러 나가요.'},
 {id:'v-house',place:'house',name:'등나무 천사 인형',emoji:'🪻',cost:40,art:null,card:'dolls/doll-card-wisteria-v2.png',hint:'천사 마을 보랏빛 집의 퍼즐을 풀어 이곳을 열면 만들 수 있어요',about:'보랏빛 집에 사는 등나무 천사. 별 이야기를 들려줘요.'},
 {id:'v-plaza',place:'plaza',name:'별빛 안내자 인형',emoji:'⭐',cost:50,art:null,card:'dolls/doll-card-guide-v2.png',hint:'천사 마을의 네 곳을 모두 열면 만들 수 있어요',about:'별 광장을 지키는 안내자. 마을의 모든 곳을 깨워 준 친구에게 도안을 선물해요.'},
];window.SejinPlaces={PLACES,DOLLS,VILLAGE_DOLLS,FRIENDS,LEVEL_XP,levelInfo,isOpen,needText,stageName,dollById,byId:id=>PLACES.find(p=>p.id===id)};
})();
