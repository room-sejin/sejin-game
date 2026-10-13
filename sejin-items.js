/* Things Sejin can carry besides snacks: materials found outside, ribbons, and small crafts made in the 공방.
   One catalog shared by the room (bag, 친구들 tab) and the place pages (gathering, crafting, selling, gifts).
   Pictures: `spr` = file in assets/ (placeholder, from the prop sheet); `emoji` is used until real item pictures
   are made (ask ChatGPT for them later and put the file name in `spr`).
   Rules: materials come from gathering (공원·산책로) and from friends' thank-you gifts; crafts are made in the 공방 from
   materials (+ a ribbon); everything can be sold in the 실 가게 (`sell` = 실뭉치) or given to a friend (`likes`). */
(()=>{
 'use strict';
 const MATERIALS=[
  {id:'m-leaf',name:'나뭇잎',emoji:'🍃',spr:'items/prop-3.png',sell:2,where:'공원 · 산책로'},
  {id:'m-flower',name:'들꽃',emoji:'🌼',spr:'items/prop-2.png',sell:2,where:'공원'},
  {id:'m-purple',name:'보라꽃',emoji:'🪻',spr:'items/prop-7.png',sell:3,where:'공원 · 산책로'},
  {id:'m-berry',name:'딸기',emoji:'🍓',spr:'items/prop-5.png',sell:3,where:'공원'},
  {id:'m-feather',name:'별빛 깃털',emoji:'🪶',spr:null,sell:6,where:'산책로 · 친구의 답례'},
 ];
 const RIBBONS=[
  {id:'ribbon-pink',name:'분홍 리본',emoji:'🎀',color:'#f2a7b5',spr:'items/prop-9.png',sell:6,where:'광장 리본 찾기'},
  {id:'ribbon-blue',name:'파란 리본',emoji:'🎀',color:'#8fc3e0',spr:'items/prop-10.png',sell:6,where:'광장 리본 찾기'},
  {id:'ribbon-purple',name:'보라 리본',emoji:'🎀',color:'#c9b3e6',spr:'items/prop-11.png',sell:6,where:'광장 리본 찾기'},
  {id:'ribbon-green',name:'초록 리본',emoji:'🎀',color:'#a9cfa4',spr:'items/prop-12.png',sell:6,where:'광장 리본 찾기'},
 ];
 // 친구네 집에서 놀아야만 얻는 아이템 (그림은 이모지 임시 — 사용자가 나중에 정할 예정, 쓰임새(제작 재료 등)도 미정).
 const HOUSE=[
  {id:'f-pawprint',name:'발자국 도장',emoji:'🐾',spr:'friends/friend-item-pawstamp-v1.png',sell:5,where:'친구네 집에서 놀기'},
  {id:'f-yarnball',name:'털뭉치 공',emoji:'🎾',spr:'friends/friend-item-playball-v1.png',sell:5,where:'친구네 집에서 놀기'},
  {id:'f-cookie',name:'손뜨개 쿠키',emoji:'🍪',spr:'friends/friend-item-pawcookie-v1.png',sell:8,where:'친구네 집에서 놀기'},
 ]; // 천사 마을에서만 얻는 아이템 (게임·퍼즐을 깨면 받음 — 공방 레시피 없음, 선물·판매 가능). 그림은 이모지 임시.
 const ANGEL=[
  {id:'v-star-key',name:'별나라 열쇠',emoji:'🗝️',sell:30,kind:'craft',where:'작은 연못 · 구름 오르기 별나라 도착'},
  {id:'v-cloud-scarf',name:'구름 실 목도리',emoji:'🧣',sell:40,kind:'craft',where:'구름 실 가게 · 목도리 뜨기(쉬움)'},
  {id:'v-gift-box',name:'천사의 선물 상자',emoji:'🎁',sell:36,kind:'craft',where:'선물 가게 · 선물 포장'},
  {id:'v-old-book',name:'오래된 고서',emoji:'📖',sell:18,kind:'material',where:'보랏빛 저택 · 서재'},
  {id:'v-clock-gear',name:'별빛 시계태엽',emoji:'⚙️',sell:18,kind:'material',where:'보랏빛 저택 · 시계방'},
  {id:'v-glow-plant',name:'빛나는 온실 화분',emoji:'🪴',sell:18,kind:'material',where:'보랏빛 저택 · 온실'},
  {id:'v-stardust',name:'별가루 병',emoji:'✨',sell:60,kind:'craft',where:'보랏빛 저택 · 별 상자'},
 ]; // Yarn from 실타래 합치기: one item per size that was made by merging (id y-<step>). Not sold in the 실 가게 — they are craft material only.
 const YARNS=[
  {id:'y-1',name:'작은 실뭉치',emoji:'🧶',color:'#f5d58a'},{id:'y-2',name:'실뭉치',emoji:'🧶',color:'#8fc3e0'},
  {id:'y-3',name:'폼폼',emoji:'🟣',color:'#a9cfa4'},{id:'y-4',name:'털실 볼',emoji:'🧶',color:'#c9b3e6'},
  {id:'y-5',name:'큰 털실',emoji:'🧶',color:'#f4b183'},{id:'y-6',name:'콘사',emoji:'🧵',color:'#9ed8cf'},
  {id:'y-7',name:'실 바구니',emoji:'🧺',color:'#e6c9a0'},{id:'y-8',name:'목도리 뭉치',emoji:'🧣',color:'#e58c9c'},
  {id:'y-9',name:'세진이 인형 실',emoji:'🧸',color:'#cfe6f2'},
 ].map(x=>({...x,spr:null,sell:0,noSell:true,where:'실타래 합치기'})); // needs: {itemId: count}. A ribbon in the recipe is what gives the ribbons their use.
 const CRAFTS=[
  {id:'c-bouquet',name:'들꽃 다발',emoji:'💐',sell:14,needs:{'m-flower':2,'ribbon-pink':1}},
  {id:'c-tart',name:'딸기 타르트',emoji:'🥧',sell:16,needs:{'m-berry':3,'m-leaf':1}},
  {id:'c-bookmark',name:'나뭇잎 책갈피',emoji:'🔖',sell:12,needs:{'m-leaf':2,'ribbon-green':1}},
  {id:'c-tea',name:'꽃차',emoji:'🍵',sell:14,needs:{'m-flower':1,'m-purple':1,'m-leaf':1}},
  {id:'c-pen',name:'깃털 펜',emoji:'🖋️',sell:24,needs:{'m-feather':2,'ribbon-blue':1}},
  {id:'c-wreath',name:'보라꽃 화관',emoji:'👑',sell:22,needs:{'m-purple':3,'m-flower':1,'ribbon-purple':1}},
  {id:'c-yflower',name:'뜨개 꽃',emoji:'🌸',sell:18,needs:{'y-1':3,'m-flower':1}},
  {id:'c-ykeyring',name:'폼폼 열쇠고리',emoji:'🔑',sell:20,needs:{'y-3':1,'ribbon-pink':1}},
  {id:'c-ystrawberry',name:'딸기 뜨개 인형',emoji:'🍓',sell:26,needs:{'y-2':2,'m-berry':2}},
  {id:'c-ywreath',name:'털실 화관',emoji:'🌿',sell:30,needs:{'y-4':1,'m-purple':2,'ribbon-purple':1}},
  {id:'c-ystar',name:'별빛 뜨개 별',emoji:'⭐',sell:36,needs:{'y-5':1,'m-feather':1}},
  {id:'c-yscarf',name:'미니 목도리',emoji:'🧣',sell:40,needs:{'y-6':1,'ribbon-blue':1}},
  {id:'c-ybasket',name:'뜨개 바구니',emoji:'🧺',sell:55,needs:{'y-7':1,'m-leaf':2,'m-flower':2}},
  {id:'c-ydoll',name:'미니 세진이 인형',emoji:'🧸',sell:90,needs:{'y-9':1,'ribbon-blue':1}},
 ];
 // 게임 보상으로만 얻는 특별한 소품(공방 레시피 없음, 선물·판매 가능): 목도리 뜨기를 완성하면 받는 무지개 목도리.
 const SPECIAL=[{id:'s-rainbow-scarf',name:'무지개 목도리',emoji:'🌈',spr:null,sell:70,where:'천사 마을 · 목도리 뜨기 완성'}];
 // Item pictures (Codex 2026-10-06, design/icon-completion-manifest-20261006.json). Items with their own spr keep it; the rest get one here.
 const SPR={"m-leaf":"items/prop-3.png","m-flower":"items/prop-2.png","m-purple":"items/prop-7.png","m-berry":"items/prop-5.png","m-feather":"items/item-starfeather-v1.png","f-pawprint":"friends/friend-item-pawstamp-v1.png","f-yarnball":"friends/friend-item-playball-v1.png","f-cookie":"friends/friend-item-pawcookie-v1.png","y-1":"merge/merge-2.png","y-2":"merge/merge-3.png","y-3":"merge/merge-4.png","y-4":"merge/merge-5.png","y-5":"merge/merge-6.png","y-6":"merge/merge-7.png","y-7":"merge/merge-8.png","y-8":"merge/merge-9.png","y-9":"merge/merge-10.png","ribbon-pink":"items/prop-9.png","ribbon-blue":"items/prop-10.png","ribbon-purple":"items/prop-11.png","ribbon-green":"items/prop-12.png","c-bouquet":"craft/craft-bouquet-v1.png","c-tart":"craft/craft-tart-v1.png","c-bookmark":"craft/craft-bookmark-v1.png","c-tea":"craft/craft-tea-v1.png","c-pen":"craft/craft-pen-v1.png","c-wreath":"craft/craft-wreath-v1.png","c-yflower":"craft/craft-yflower-v1.png","c-ykeyring":"craft/craft-ykeyring-v1.png","c-ystrawberry":"craft/craft-ystrawberry-v1.png","c-ywreath":"craft/craft-ywreath-v1.png","c-ystar":"craft/craft-ystar-v1.png","c-yscarf":"craft/craft-yscarf-v1.png","c-ybasket":"craft/craft-ybasket-v1.png","c-ydoll":"merge/merge-10.png","s-rainbow-scarf":"items/item-rainbowscarf-v1.png","v-star-key":"items/item-starkey-v1.png","v-cloud-scarf":"items/item-cloudscarf-v1.png","v-gift-box":"items/item-angelgift-v1.png","v-old-book":"items/item-oldbook-v1.png","v-clock-gear":"items/item-clockgear-v1.png","v-glow-plant":"items/item-glowplant-v1.png","v-stardust":"items/item-stardust-v1.png"};
 const ALL0=[].concat(MATERIALS.map(x=>({...x,kind:'material'})),HOUSE.map(x=>({...x,kind:'material'})),YARNS.map(x=>({...x,kind:'yarn'})),RIBBONS.map(x=>({...x,kind:'ribbon'})),CRAFTS.map(x=>({...x,kind:'craft'})),SPECIAL.map(x=>({...x,kind:'craft',special:true})),ANGEL.map(x=>({...x,angel:true})));
 const ALL=ALL0.map(x=>({...x,spr:x.spr||SPR[x.id]||null}));
 // img(id,px): the item's picture as an <img> (falls back to its emoji) for places that build HTML strings.
 const base=()=>(typeof location!=="undefined"&&location.pathname.indexOf("/design/")>=0)?"../":"";
 const img=(id,px)=>{const x=typeof id==="string"?byId[id]:(id&&id.spr?id:(id&&byId[id.id])||id);if(!x)return "";const p=px||24;return x.spr?"<img src=\""+base()+"assets/"+x.spr+"\" alt=\""+x.name+"\" style=\"width:"+p+"px;height:"+p+"px;object-fit:contain;vertical-align:middle\">":x.emoji;};
 const byId=Object.fromEntries(ALL.map(x=>[x.id,x]));
 // What gathering gives: places → pool of materials (picked at random, 1-2 per try, a few tries per day).
 const GATHER={park:{tree:{pool:['m-leaf','m-berry','m-leaf'],perDay:2},bush:{pool:['m-flower','m-purple','m-flower','m-berry'],perDay:2}},
  walk:{tree:{pool:['m-leaf','m-feather','m-leaf'],perDay:2},bush:{pool:['m-purple','m-flower','m-leaf'],perDay:2}}};   // per place → per spot (나무 / 풀숲): what it gives and how many tries a day
 // How much one gift raises a friend's love (liked craft / any other craft / material or ribbon).
 const LOVE={liked:5,craft:2,other:1};
 // Items as the room's bag expects them: a "keep" item is neither eaten nor placed.
 const asRoomItems=()=>Object.fromEntries(ALL.map(x=>[x.id,{name:x.name,desc:x.kind==='craft'?'선물하거나 실 가게에 팔 수 있어요':x.kind==='yarn'?'공방에서 소품을 만드는 실 · 팔 수 없어요':x.kind==='ribbon'?'공방 재료 · 선물 · 판매':'공방 재료 · 선물 · 판매',price:x.sell,color:x.color||'#e9d8c8',emoji:x.emoji,spr:x.spr,keep:true}]));
 const api={img,MATERIALS,HOUSE,YARNS,RIBBONS,CRAFTS,SPECIAL,ANGEL,ALL,byId,GATHER,LOVE,asRoomItems,sellPrice:id=>(byId[id]||{}).sell||0,
  canCraft:(r,bag)=>Object.entries(r.needs).every(([k,n])=>(bag[k]||0)>=n)};
 if(typeof window!=='undefined')window.SejinItems=api;if(typeof module!=='undefined')module.exports=api;
})();
