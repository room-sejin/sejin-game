/* Sejin as a separate character layer over whole-image room backgrounds.
   - IDLE: free-time images that rotate while Sejin is not using furniture. Add the upcoming
     3–4 idle images here (transparent PNG, same style as character/base-v1.png).
   - SPOTS: furniture poses. Tapping the bed / sofa / rug in the room moves Sejin there;
     tapping the standing spot on the floor (shown while Sejin is on furniture) brings Sejin back.
   - Clothes: an item may carry one transparent PNG per pose in `layers` (same canvas size as that
     pose image), so an outfit lines up on every pose without extra positioning. The old
     code-drawn accessories (`svg`) only fit the standing pose and are shown there alone.
   Themes whose picture already contains Sejin set room.baked-sejin; then this layer hides. */
(()=>{
 'use strict';
 const A='../assets/';
 const IDLE=[
  {id:'stand',name:'서 있기',file:'character/base-v1.png',iw:1222,ih:1287,x:55,b:3,w:27},
 ];
 const SPOTS={
  bed:{id:'bed',name:'침대',file:'character/interact-bed-curled-v3.png',iw:1536,ih:1024,x:27,b:67,w:32,hit:[6,23,40,15],label:'침대에 눕히기',line:'…조금만 누워 있을래.',diary:'침대에 누워 포근하게 쉬었다.'},
  sofa:{id:'sofa',name:'소파',file:'character/interact-sofa-read-v1.png',iw:1222,ih:1287,x:47,b:26.5,w:27,hit:[29,60,37,15],label:'소파에서 책 읽기',line:'이 책 재밌다…',diary:'소파에서 책을 읽었다.'},
  rug:{id:'rug',name:'러그',file:'character/interact-rug-knit-v1.png',iw:1222,ih:1287,x:35,b:14,w:27,hit:[8,79,37,14],label:'러그에서 뜨개하기',line:'목도리 뜨는 중이야!',diary:'러그에 앉아 목도리를 떴다.'},
 };
 // Themes whose furniture sits elsewhere than in the basic room move the matching spots.
 const THEME_SPOTS={
  christmas:{sofa:{x:66,b:17,w:26,hit:[50,67,34,16]}},
 };
 // 방 테마별 세진이 포즈 그림 (ChatGPT 2026-10-07): 이벤트 방 12개 × 누움/소파/러그, 기본 방 누움은 basic-bed-v4. 캔버스 크기는 기존 포즈와 같아 위치·크기는 그대로.
 const BASE_FILES=Object.fromEntries(Object.entries(SPOTS).map(([k,p])=>[k,p.file]));
 const THEME_FILES={basic:{bed:'character/basic-bed-v4.png'}};
 ['christmas','spring','halloween','birthday'].forEach(k=>['a','b','c'].forEach(v=>{THEME_FILES[k+'-'+v]={bed:'rooms/event-'+k+'-'+v+'-bed-v6.png',sofa:'rooms/event-'+k+'-'+v+'-sofa-v1.png',rug:'rooms/event-'+k+'-'+v+'-rug-v1.png'};}));
 const BASE_SPOTS=Object.fromEntries(Object.entries(SPOTS).map(([k,p])=>[k,{x:p.x,b:p.b,w:p.w,hit:p.hit}]));
 const POSES=[...IDLE,...Object.values(SPOTS)],poseById=Object.fromEntries(POSES.map(p=>[p.id,p]));
 const ROTATE_MS=7000;
 // Crop of character/base-v1.png that the old code-drawn accessories were positioned against.
 const CROP={x:210,y:165,w:810,h:1005,W:1222,H:1287};
 const SLOTS=[['head','머리'],['neck','목 · 가슴'],['outfit','옷 (전신)']];
 if(!('outfit' in wearing))wearing.outfit=null;
 let current=IDLE[0].id,idleIndex=0,baked=false,previewPose=null,closetSlot='head';

 const sejin=$('#sejin'),bubble=$('#bubble');
 sejin.innerHTML='<img class="pose-img" alt="" draggable="false"><span class="look"></span>';
 const poseImg=sejin.querySelector('.pose-img'),look=sejin.querySelector('.look');
 // Invisible anchors keep the existing wear() sparkle aimed at the head and neck.
 const ANCHORS='<span class="acc anchor" id="accHead" style="left:45%;top:18%;width:10%"></span><span class="acc anchor" id="accNeck" style="left:45%;top:56%;width:10%"></span>';

 function hasArt(c,poseId){return !!((c.layers&&c.layers[poseId])||(poseId==='stand'&&c.svg));}
 function lookHTML(poseId){
  return SLOTS.map(([slot])=>{const c=CLOTHES[wearing[slot]];if(!c)return '';
   if(c.layers&&c.layers[poseId])return `<img class="wear-layer" src="${A+c.layers[poseId]}" alt="">`;
   if(poseId==='stand'&&c.svg){const [l,t,w]=c.pos;
    return `<span class="acc" style="left:${(CROP.x+l/100*CROP.w)/CROP.W*100}%;top:${(CROP.y+t/100*CROP.h)/CROP.H*100}%;width:${w/100*CROP.w/CROP.W*100}%">${c.svg}</span>`;}
   return '';}).join('');
 }
 dress=()=>{look.innerHTML=ANCHORS+lookHTML(current);};

 function placeBubble(p){
  const h=p.w*(p.ih/p.iw)*(2/3);   // pose height in % of the 2:3 room
  bubble.style.left=Math.max(30,Math.min(70,p.x))+'%';bubble.style.bottom=Math.min(88,p.b+h*.92)+'%';
 }
 function setPose(id){
  const p=poseById[id];current=id;
  const swap=()=>{poseImg.src=A+p.file;poseImg.alt=p.name+' 포즈의 세진이';Object.assign(sejin.style,{left:p.x+'%',bottom:p.b+'%',width:p.w+'%'});
   sejin.dataset.pose=id;dress();placeBubble(p);floorSpot.hidden=!SPOTS[id];
   room.querySelectorAll('.spot').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.spot===id)));};
  if(still||!poseImg.getAttribute('src'))swap();
  else{sejin.classList.add('fading');setTimeout(()=>{swap();sejin.classList.remove('fading');},220);}
 }
 const idle=()=>setPose(IDLE[idleIndex].id);

 // Tap zones on the bed, sofa and rug (percent of the 2:3 room).
 const scene=room.querySelector('.room-theme-scene');
 Object.values(SPOTS).forEach(p=>{const b=document.createElement('button');b.className='spot';b.dataset.spot=p.id;b.setAttribute('aria-label',p.label);b.setAttribute('aria-pressed','false');
  const [l,t,w,h]=p.hit;Object.assign(b.style,{left:l+'%',top:t+'%',width:w+'%',height:h+'%'});
  b.onclick=()=>useSpot(p.id);(scene||room.firstChild).after(b);});
 // Standing spot on the floor: while Sejin is on furniture, tapping here makes Sejin get up.
 const stand=IDLE[0],floorSpot=document.createElement('button');
 floorSpot.className='spot floor-spot';floorSpot.setAttribute('aria-label','바닥에 세우기');floorSpot.hidden=true;
 Object.assign(floorSpot.style,{left:(stand.x-12)+'%',bottom:(stand.b)+'%',width:'24%',height:'9%'});
 floorSpot.onclick=()=>{if(night){say('쿨… 쿨… (자는 중이에요)');return;}idle();say('다시 일어났어!');};
 [...room.querySelectorAll('.spot')].pop().after(floorSpot);
 function useSpot(id){
  const p=SPOTS[id];
  if(baked){say('이 테마 그림에는 세진이가 그려져 있어요.');return;}
  if(night&&id!=='bed'){say('쿨… 쿨… (자는 중이에요)');return;}
  if(current===id){say(p.line);return;}
  setPose(id);say(p.line);note(p.diary);up('기분',4);render();
 }
 // Going to sleep uses the bed; waking up returns to the idle rotation.
 const actBefore=act;act=a=>{actBefore(a);if(a==='sleep'&&!baked){night?setPose('bed'):idle();}};
 // Idle rotation (only while free, awake, and no sheet open).
 setInterval(()=>{if(baked||night||IDLE.length<2||!sheet.hidden||!IDLE.some(p=>p.id===current))return;idleIndex=(idleIndex+1)%IDLE.length;idle();},ROTATE_MS);
 // Theme pictures that already include Sejin hide this layer (see furniture-ui.js).
 function layoutSpots(themeId){
  const over=THEME_SPOTS[themeId]||{};
  Object.entries(SPOTS).forEach(([k,p])=>{Object.assign(p,BASE_SPOTS[k],over[k]);p.file=(THEME_FILES[themeId]&&THEME_FILES[themeId][k])||BASE_FILES[k];
   const b=room.querySelector('.spot[data-spot="'+k+'"]'),[l,t,w,h]=p.hit;Object.assign(b.style,{left:l+'%',top:t+'%',width:w+'%',height:h+'%'});});
 }
 window.addEventListener('sejin-theme',e=>{baked=!!e.detail.baked;room.classList.toggle('baked-sejin',baked);layoutSpots(e.detail.id);if(!baked)setPose(current);});

 // ---- Closet: preview the look on every pose, slots for image-based outfits ----
 const prevFill=fillSheet;
 fillSheet=()=>{
  if(sheetKind!=='closet'){prevFill();return;}
  const pv=previewPose||current,p=poseById[pv],missing=SLOTS.map(([s])=>CLOTHES[wearing[s]]).filter(c=>c&&!hasArt(c,pv));
  const cover=c=>POSES.filter(q=>hasArt(c,q.id)).length+'/'+POSES.length;
  const thumb=c=>c.svg||(c.layers?`<img src="${A+Object.values(c.layers)[0]}" alt="">`:'');
  const items=Object.entries(CLOTHES).filter(([,c])=>c.slot===closetSlot);
  const card=([id,c])=>{const own=ownedClothes.has(id),on=wearing[c.slot]===id;
   return `<button class="cloth" data-wear="${id}" aria-pressed="${on}">${thumb(c)}${c.name}<small>${on?'입는 중':own?'입기':c.price+' 실뭉치'}</small><small class="cover">포즈 그림 ${cover(c)}</small></button>`;};
  $('#sheetTitle').innerHTML='세진이 옷장<small>포즈를 골라 옷이 어떻게 보이는지 미리 볼 수 있어요.</small>';
  $('#sheetBody').innerHTML=
   `<div class="look-stage"><span class="stage-sejin" style="aspect-ratio:${p.iw}/${p.ih}"><img src="${A+p.file}" alt="${p.name} 포즈 미리보기"><span class="look">${lookHTML(pv)}</span></span></div>`+
   `<div class="pose-chips" role="group" aria-label="미리 볼 포즈">${POSES.map(q=>`<button data-preview-pose="${q.id}" aria-pressed="${q.id===pv}">${q.name}${q.id===current?' ·지금':''}</button>`).join('')}</div>`+
   (missing.length?`<p class="miss-note">${missing.map(c=>c.name).join(', ')} — ${p.name} 포즈용 옷 그림은 준비 중이에요.</p>`:'')+
   `<div class="decor-cats" role="tablist">${SLOTS.map(([k,n])=>`<button role="tab" data-slot="${k}" aria-selected="${k===closetSlot}">${n}${wearing[k]?'<small>입는 중</small>':''}</button>`).join('')}</div>`+
   (items.length?`<div class="closet">${items.map(card).join('')}</div>`:'<p class="empty">아직 이 칸의 옷이 없어요.<br>포즈별 옷 그림이 준비되면 여기에 들어와요.</p>')+
   '<p class="furniture-note">새 옷 그림은 포즈 그림과 같은 크기의 투명 PNG로 포즈마다 한 장씩 만들면 그대로 겹쳐져요. 지금 옷은 코드로 그린 임시 그림이라 서 있는 포즈에만 보여요.</p>';
  const B=$('#sheetBody');
  B.querySelectorAll('[data-preview-pose]').forEach(b=>b.onclick=()=>{previewPose=b.dataset.previewPose;fillSheet();});
  B.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>{closetSlot=b.dataset.slot;fillSheet();});
  B.querySelectorAll('[data-wear]').forEach(b=>b.onclick=()=>wear(b.dataset.wear));
 };
 // Each time a sheet opens, the closet preview starts from Sejin's current pose.
 const openBefore=openSheet;openSheet=kind=>{previewPose=null;openBefore(kind);};

 night?setPose('bed'):idle();   // a saved game can start while Sejin is asleep
 window.SejinCharacter={IDLE,SPOTS,POSES,setPose,idle};
})();
