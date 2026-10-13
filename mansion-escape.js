(()=>{
'use strict';
// 대저택의 비밀: 방 8개 × 단계 5개 = 40단계 방탈출. 정답·순서는 design/mansion-escape-plan-20261005.json 설계를 따른다.
// 그림(배경)은 한 장짜리 방 그림이고, 정확한 숫자·개수·기호가 필요한 도판은 전부 코드(SVG/HTML)로 그린다.
const $=s=>document.querySelector(s),sfx=n=>{try{window.SejinSfx&&SejinSfx.play(n);}catch(e){}};
const shuffle=a=>{const r=a.slice();for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;};
const shuffleNot=(a,same)=>{let r=shuffle(a),n=0;while(same(r)&&n++<20)r=shuffle(a);return r;};
let AC=null;const beep=(f,d,t)=>{try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;g.gain.value=.12;o.connect(g);g.connect(AC.destination);const at=AC.currentTime+(t||0);o.start(at);o.stop(at+d);}catch(e){}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

// ---------- 저장 (sejin-mansion-escape-v2): 새로고침해도 방·퍼즐·인벤토리·기억 조각이 남는다 ----------
const K='sejin-mansion-escape-v2',RK='sejin-mansion-rewarded-v1';   // RK: 보상은 초기화해도 다시 받지 않는다
const fresh=()=>({version:2,room:'library',completedPuzzleIds:[],inventory:[],readNotes:[],endingSeen:false});
let st;try{const s=JSON.parse(localStorage.getItem(K));st=s&&s.version===2?Object.assign(fresh(),s):fresh();}catch(e){st=fresh();}
const save=()=>{try{localStorage.setItem(K,JSON.stringify(st));}catch(e){}};
const rewarded=()=>{try{return JSON.parse(localStorage.getItem(RK))||{};}catch(e){return {};}};
const markRewarded=id=>{const r=rewarded();r[id]=1;try{localStorage.setItem(RK,JSON.stringify(r));}catch(e){}};
const has=i=>st.inventory.includes(i),done=id=>st.completedPuzzleIds.includes(id);
const give=i=>{if(!has(i))st.inventory.push(i);};

// ---------- 퍼즐 공통 도구 ----------
const PIECE={해:'🌞',꽃:'🌸',잎:'🍃',달:'🌙',나비:'🦋',리본:'🎀',종:'🔔'};
const svg=(w,h,inner)=>`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${inner}</svg>`;
const clueBox=h=>h?`<div class="clue">${h}</div>`:'';

// 순서대로 누르기: items를 answer 순서로 누른다. 틀리면 이 퍼즐만 처음부터.
function pickSeq(c,{items,answer,once=true,shuf=true,clue,badMsg,onPick}){
 let picks=[];const list=shuf?shuffle(items):items,by=Object.fromEntries(items.map(i=>[i.id,i]));
 c.body.innerHTML=clueBox(clue)+'<div class="slots" id="sl"></div><div class="row" id="ch"></div>';
 const draw=()=>{
  $('#sl').innerHTML=answer.map((_,k)=>picks[k]!==undefined?`<div class="slot f">${by[picks[k]].html}</div>`:`<div class="slot">${k+1}</div>`).join('');
  $('#ch').innerHTML=list.map(i=>`<button type="button" class="chip" data-id="${i.id}"${once&&picks.includes(i.id)?' disabled':''}>${i.html}</button>`).join('');
  $('#ch').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{
   const id=b.dataset.id;picks.push(id);sfx('pop');if(onPick)onPick(id);
   if(id!==answer[picks.length-1]){picks=[];c.bad(badMsg||'앗, 순서가 달라요. 처음부터 다시 해 봐요.');draw();return;}
   draw();if(picks.length===answer.length)c.solve();});};
 draw();
}
// 짝 맞추기: 물건을 눌러 고른 뒤 맞는 자리를 누른다. map = {물건id: 자리id}
function matchPairs(c,{items,targets,map,clue,tHtml}){
 let sel=null;const placed={};const list=shuffle(items),by=Object.fromEntries(items.map(i=>[i.id,i]));
 c.body.innerHTML=clueBox(clue)+'<div class="slots" id="tg"></div><div class="row" id="it"></div>';
 const used=()=>Object.values(placed);
 const draw=()=>{
  $('#tg').innerHTML=targets.map(t=>`<button type="button" class="slot t${placed[t.id]?' f':''}" data-t="${t.id}">${t.html}${placed[t.id]?`<div>${by[placed[t.id]].html}</div>`:''}</button>`).join('');
  $('#it').innerHTML=list.map(i=>`<button type="button" class="chip${sel===i.id?' sel':''}" data-i="${i.id}"${used().includes(i.id)?' disabled':''}>${i.html}</button>`).join('');
  $('#it').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{sel=sel===b.dataset.i?null:b.dataset.i;sfx('pop');draw();});
  $('#tg').querySelectorAll('.slot').forEach(b=>b.onclick=()=>{
   const t=b.dataset.t;if(placed[t])return;
   if(!sel){c.say('먼저 아래에서 놓을 물건을 눌러요.');return;}
   if(map[sel]===t){placed[t]=sel;sel=null;sfx('ok');c.say('');draw();if(Object.keys(placed).length===targets.length)c.solve();}
   else{sfx('wrong');sel=null;c.bad('여기에는 맞지 않아요. 모양과 그림을 다시 비교해 봐요.');draw();}});};
 draw();
}
// 자리 바꾸기: 두 개를 차례로 눌러 서로 바꾼다. answer 순서가 되면 풀림.
function orderSwap(c,{items,answer,clue,cols}){
 const by=Object.fromEntries(items.map(i=>[i.id,i]));let arr=shuffleNot(items.map(i=>i.id),a=>a.every((v,i)=>v===answer[i])),sel=-1;
 c.body.innerHTML=clueBox(clue)+'<div class="row" id="sw"></div><p class="msg">두 칸을 차례로 눌러 자리를 바꿔요.</p>';
 const draw=()=>{$('#sw').innerHTML=arr.map((id,i)=>`<button type="button" class="chip${sel===i?' sel':''}" data-i="${i}">${by[id].html}</button>`).join('');
  $('#sw').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;sfx('pop');
   if(sel<0){sel=i;draw();return;}if(sel===i){sel=-1;draw();return;}
   [arr[sel],arr[i]]=[arr[i],arr[sel]];sel=-1;draw();if(arr.every((v,k)=>v===answer[k]))c.solve();});};
 draw();
}
// 숫자 암호: 자리마다 라벨을 붙일 수 있다.
function codeEntry(c,{answer,clue,labels}){
 let v='';const n=answer.length;
 c.body.innerHTML=clueBox(clue)+'<div class="code" id="cd"></div><div class="keypad" id="kp"></div><div class="row"><button type="button" class="btn" id="kc">지우기</button><button type="button" class="btn main" id="ko">열기</button></div>';
 const draw=()=>{$('#cd').innerHTML=Array.from({length:n},(_,i)=>`<div><span>${v[i]||''}</span></div>`).join('');if(labels)$('#cd').innerHTML=Array.from({length:n},(_,i)=>`<div style="flex-direction:column;width:52px"><small>${labels[i]}</small><span>${v[i]||'·'}</span></div>`).join('');};
 $('#kp').innerHTML='123456789'.split('').concat(['','0','']).map(d=>d===''?'<span></span>':`<button type="button" class="chip" data-d="${d}">${d}</button>`).join('');
 $('#kp').querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{if(v.length<n){v+=b.dataset.d;sfx('pop');draw();}});
 $('#kc').onclick=()=>{v='';draw();};
 $('#ko').onclick=()=>{if(v===answer)c.solve();else{v='';draw();c.bad('딸깍… 열리지 않아요. 단서를 다시 확인해 봐요.');}};
 draw();
}
// 숫자 올리기/내리기 여러 칸. fields: [{label,answer,html,max}]
function steppers(c,{fields,clue,okLabel}){
 const val=fields.map(()=>0);
 c.body.innerHTML=clueBox(clue)+'<div id="st"></div><div class="row"><button type="button" class="btn main" id="ok">'+(okLabel||'확인')+'</button></div>';
 const draw=()=>{$('#st').innerHTML=fields.map((f,i)=>`<div class="stp"><span class="lab">${f.label}</span><button type="button" class="chip" data-i="${i}" data-d="-1" aria-label="${esc(f.label)} 줄이기">−</button><span class="v">${val[i]}</span><button type="button" class="chip" data-i="${i}" data-d="1" aria-label="${esc(f.label)} 늘리기">＋</button></div>`).join('');
  $('#st').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,f=fields[i];val[i]=Math.max(0,Math.min(f.max||9,val[i]+(+b.dataset.d)));sfx('pop');draw();});};
 $('#ok').onclick=()=>{if(fields.every((f,i)=>val[i]===f.answer))c.solve();else c.bad('수가 맞지 않아요. 그림을 천천히 다시 세어 봐요.');};
 draw();
}
// 하나 고르기
function choose(c,{options,answer,clue,wrong}){
 const list=shuffle(options);
 c.body.innerHTML=clueBox(clue)+'<div class="row" id="op"></div>';
 $('#op').innerHTML=list.map(o=>`<button type="button" class="chip" data-id="${o.id}">${o.html}</button>`).join('');
 $('#op').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{sfx('pop');if(b.dataset.id===answer)c.solve();else{b.classList.add('shake');c.bad(wrong||'딱 맞지 않아요. 다른 걸 골라 봐요.');}});
}

// ---------- 방별 퍼즐 ----------
const sym={해:'☀️',꽃:'🌸',달:'🌙',별:'⭐'};
const colorOf={해:'#e8b84d',꽃:'#8fc3e0',달:'#e58c9c',별:'#7fb88a'};   // 표지 색은 일부러 그림과 어긋나게 — 색이 아니라 그림을 봐야 한다
const coverBtn=n=>`<div style="width:54px;height:70px;border-radius:6px;background:${colorOf[n]};border:3px solid #8a6f60;display:grid;place-items:center;font-size:26px">${sym[n]}</div>`;
const coverHtml=n=>`<div style="text-align:center">${coverBtn(n)}<small>${n} 책</small></div>`;

// 찢어진 설계도 조각
const EDGE_OK=[0,7,-5,9,-7,5,0],EDGE_B=[0,-6,8,-4,6,-8,0];
const pieceSvg=(side,edge,lineY)=>{const x0=side==='L'?0:20,pts=[];const W=70;
 if(side==='L'){pts.push('0,0');edge.forEach((e,i)=>pts.push((W+e)+','+(i*100/(edge.length-1))));pts.push('0,100');}
 else{pts.push('90,0');edge.forEach((e,i)=>pts.push((20+e)+','+(i*100/(edge.length-1))));pts.push('90,100');}
 // line must meet at the edge at the same y on both pieces
 const line=side==='L'?`M10,95 L${W},${lineY}`:`M20,${lineY} L85,10`;
 return svg(90,100,`<polygon points="${pts.join(' ')}" fill="#e8f0fb" stroke="#5b8fb5" stroke-width="3"/><path d="${line}" stroke="#3b6f98" stroke-width="3" fill="none"/>`);};


// 달 장면(엽서 조각 / 별자리)
const SCENE=`<rect width="200" height="200" fill="#26324f"/><path d="M0,120 C60,60 140,170 200,90" stroke="#f5d58a" stroke-width="5" fill="none"/><path d="M60,25 a30,30 0 1,0 25,52 a24,24 0 1,1 -25,-52z" fill="#fff3c2"/><circle cx="150" cy="150" r="5" fill="#fff"/><circle cx="170" cy="130" r="4" fill="#fff"/><circle cx="130" cy="175" r="4" fill="#fff"/><circle cx="35" cy="150" r="3" fill="#ffd"/><circle cx="170" cy="30" r="3" fill="#ffd"/>`;
const tileSvg=i=>{const x=(i%2)*100,y=Math.floor(i/2)*100;return `<svg width="86" height="86" viewBox="${x} ${y} 100 100" aria-hidden="true" style="border-radius:6px">${SCENE}</svg>`;};
const constel=(pts,four)=>svg(96,96,`<rect width="96" height="96" fill="#26324f" rx="8"/><path d="M20,24 a12,12 0 1,0 10,21 a10,10 0 1,1 -10,-21z" fill="#fff3c2"/>`+pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#fff"/>`).join('')+(four?'<circle cx="80" cy="20" r="4" fill="#fff"/>':'')+(pts.length===3?`<path d="M${pts.map(p=>p.join(',')).join(' L')} Z" stroke="#9fb7e0" stroke-width="1" fill="none"/>`:''));

const daisy=svg(70,70,'<g transform="translate(35,35)">'+[0,72,144,216,288].map(a=>`<ellipse cx="0" cy="-17" rx="8" ry="14" fill="#fff" stroke="#c8b8a8" transform="rotate(${a})"/>`).join('')+'<circle r="7" fill="#f2c94c"/></g>');
const lavender=svg(70,70,'<path d="M35,66 V20" stroke="#6a9a62" stroke-width="3"/>'+[14,28,42,56].map((y,i)=>`<ellipse cx="${i%2?42:28}" cy="${y-6}" rx="7" ry="9" fill="#b39ad8" stroke="#8c74b8"/>`).join(''));
const tulip=svg(70,70,'<path d="M35,66 V38" stroke="#6a9a62" stroke-width="3"/>'+['M35,12 C26,18 26,38 35,40 Z','M35,12 C44,18 44,38 35,40 Z','M35,10 C30,22 30,38 35,40 C40,38 40,22 35,10 Z'].map((d,i)=>`<path d="${d}" fill="${['#e58c9c','#e58c9c','#f2a7b5'][i]}" stroke="#b86a7a"/>`).join(''));

const boxSvg=(w,h,fill)=>svg(90,80,`<rect x="${(90-w)/2}" y="${(80-h)/2}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="#8a6f60" stroke-width="3"/><path d="M45,${(80-h)/2} v${h}" stroke="#fff8" stroke-width="3"/>`);
const ruler=(vals)=>{const W=7*40;return svg(W+20,150,`<rect x="10" y="108" width="${W}" height="30" rx="4" fill="#fff8e0" stroke="#8a6f60" stroke-width="2"/>`+Array.from({length:8},(_,i)=>`<path d="M${10+i*40},108 v14" stroke="#8a6f60" stroke-width="2"/><text x="${10+i*40}" y="134" font-size="12" text-anchor="middle" fill="#8a6f60">${i}</text>`).join('')+vals.map((v,i)=>`<rect x="10" y="${12+i*30}" width="${v[0]*40}" height="20" rx="6" fill="${v[1]}" stroke="#8a6f60" stroke-width="2"/>`).join(''));};

const dot=(c,t)=>`<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:${c};border:2px solid #fff;box-shadow:0 0 0 1px #8a6f60;vertical-align:-2px"></span> ${t}`;
const chipIcon=(ic,t)=>`<div class="big">${ic}</div><small>${t}</small>`;

const ROOMS=[
{id:'library',name:'서재',icon:'📚',x:15,y:47,piece:'해',memo:'처음 네가 찾아온 날, 우리는 창가에서 아침 햇빛을 나눠 가졌지. 해가 뜨고 꽃이 피고 달과 별이 나올 때까지, 나는 그날을 책 사이에 남겨두었어.',
 note:'꽃 도안 책갈피에 적힌 ‘빛은 아침에서 밤으로’가 모든 기록의 시작이에요. 저택 주인은 친구들의 선물을 잊지 않으려고 기억의 방을 만들었어요.',
 puzzles:[
 {id:'library-1',icon:'🔖',title:'그림 책갈피',hint:'색이 아니라 표지 그림을 비교하세요.',nb:'책갈피 순서: ☀️해 → 🌸꽃 → 🌙달 → ⭐별',
  clue:'꽃 도안 책갈피에는 그림 대신 <b>네 줄의 수수께끼</b>가 적혀 있어요. 수수께끼의 답이 그려진 책을 골라 같은 번호 칸에 놓아요. 책장에는 <b>엉뚱한 책도 섞여</b> 있어요. (표지 색은 그림과 달라요!)',
  build(c){const names=['해','꽃','달','별'],riddle={해:'아침을 여는 둥근 빛',꽃:'봄날 활짝 피어나는 것',달:'밤하늘에 걸린 손톱 모양',별:'소원을 빌게 되는 반짝임'};
   const deco=[['해바라기','🌻','#e3b84d'],['구름','☁️','#8fc3e0'],['혜성','☄️','#c9b3e6'],['나뭇잎','🍃','#e58c9c']];
   const decoHtml=d=>`<div style="text-align:center"><div style="width:54px;height:70px;border-radius:6px;background:${d[2]};border:3px solid #8a6f60;display:grid;place-items:center;font-size:26px">${d[1]}</div><small>${d[0]} 책</small></div>`;
   matchPairs(c,{clue:this.clue,items:names.map(n=>({id:n,html:coverHtml(n)})).concat(deco.map(d=>({id:'x-'+d[0],html:decoHtml(d)}))),targets:names.map((n,i)=>({id:n,html:`<div class="big" style="opacity:.5">❔</div><small>${i+1}. ${riddle[n]}</small>`})),map:Object.fromEntries(names.map(n=>[n,n]))});}},
 {id:'library-2',icon:'📚',title:'책장 순서',hint:'책갈피는 하루가 흐르는 순서예요.',nb:'비밀 서랍에서 투명 판과 일기를 얻었어요.',
  clue:'책갈피의 <b>칸 번호 순서대로</b> 책을 책상 받침에 꽂아요. 어떤 책이 몇 번이었는지는 📒 기록장에서 확인할 수 있어요. 받침에는 네 권만 들어가고, <b>책장에는 여섯 권</b>이 놓여 있어요.',
  build(c){const names=['해','꽃','달','별'];const deco={'해바라기':'🌻','구름':'☁️'};
   pickSeq(c,{clue:this.clue,items:names.map(n=>({id:n,html:coverHtml(n)})).concat(Object.entries(deco).map(([n,e])=>({id:'x-'+n,html:`<div style="text-align:center"><div style="width:54px;height:70px;border-radius:6px;background:#d9c5a8;border:3px solid #8a6f60;display:grid;place-items:center;font-size:26px">${e}</div><small>${n} 책</small></div>`}))),answer:names});}},
 {id:'library-3',icon:'📖',title:'일기 겹쳐 읽기',hint:'종이를 뒤집지 말고 꽃 네 개 위치를 맞춰보세요.',nb:'일기에서 읽은 숫자: 2 · 4 · 1 · 3 (왼쪽 위부터 읽어요)',
  clue:'투명 판의 <b>구멍 네 개</b>가 일기의 🌼 꽃 네 개 위에 오도록 판을 움직여요. 구멍으로 보이는 숫자를 읽어요.',build:diaryPuzzle},
 {id:'library-4',icon:'📦',title:'잠긴 상자',hint:'겹친 일기에서 보인 숫자를 왼쪽부터 읽어요.',nb:'상자에서 찢어진 시계 설계도 두 조각을 얻었어요.',
  clue:'상자의 4자리 암호는 <b>일기에서 읽은 숫자</b>예요. (📒 기록장에 적혀 있어요)',build(c){codeEntry(c,{answer:'2413',clue:this.clue});}},
 {id:'library-5',icon:'🧩',title:'찢어진 설계도',hint:'숫자보다 종이의 찢긴 선이 먼저 맞아야 해요.',nb:'시계 설계도를 완성했어요.',
  clue:'왼쪽 조각의 <b>찢긴 모양</b>과 <b>파란 선</b>이 이어지는 오른쪽 조각을 찾아요.',
  build(c){const left=`<div style="text-align:center;margin-bottom:6px">${pieceSvg('L',EDGE_OK,40)}<div><small>왼쪽 조각</small></div></div>`;
   const opt=(id,e,y)=>({id,html:pieceSvg('R',e,y)});
   c.body.innerHTML='';choose(c,{clue:this.clue+'<div style="text-align:center">'+left+'</div>',options:[opt('ok',EDGE_OK,40),opt('a',EDGE_B,40),opt('b',EDGE_OK,70)],answer:'ok',wrong:'찢긴 모양이나 선이 이어지지 않아요.'});}},
 ]},
{id:'clock',name:'시계방',icon:'🕰️',x:31,y:47,piece:'꽃',memo:'오후 세 시에 네가 문을 두드렸고, 십오 분 뒤 우리는 차를 마셨어. 이 시계는 그때를 기억해. 멈춘 시간은 작별이 아니라 다시 만날 약속이야.',
 note:'‘우리가 처음 만난 오후 3시 15분. 그때 멈춘 시계가 마지막 선물을 지킨다.’ 주인은 이별을 막으려 시간을 멈춘 게 아니라 기억을 남겼어요.',
 puzzles:[
 {id:'clock-1',icon:'📐',title:'설계도 맞추기',hint:'설계도와 작업대의 홈 모양을 비교해요.',nb:'톱니 순서: 작은 → 중간 → 큰 자리',
  clue:'서재에서 가져온 설계도를 작업대에 올렸어요. 설계도에는 톱니 자리가 <b>작은 것 → 중간 → 큰 것</b> 순서로 그려져 있어요. 작업대의 홈을 같은 순서로 눌러 표시해요.',
  build(c){const g=(id,r,t)=>({id,html:`<div>${svg(60,60,`<circle cx="30" cy="30" r="${r}" fill="#fff8e0" stroke="#8a6f60" stroke-width="3" stroke-dasharray="4 3"/>`)}<small>${t}</small></div>`});
   pickSeq(c,{clue:this.clue,items:[g('s',9,'홈'),g('m',17,'홈'),g('l',26,'홈')],answer:['s','m','l']});}},
 {id:'clock-2',icon:'⚙️',title:'톱니 연결',hint:'큰 톱니를 가장 넓은 홈에 놓아요.',nb:'태엽 손잡이가 나왔어요.',
  clue:'톱니 세 개를 크기에 맞는 홈에 놓아요. 맞물리면 손잡이가 움직여요.',
  build(c){const gear=(id,r,t)=>({id,html:`<div>${svg(60,60,`<circle cx="30" cy="30" r="${r}" fill="#d9b45e" stroke="#8a6f60" stroke-width="3"/><circle cx="30" cy="30" r="3" fill="#8a6f60"/>`)}<small>${t}</small></div>`});
   const hole=(id,r,t)=>({id,html:`<div>${svg(60,60,`<circle cx="30" cy="30" r="${r}" fill="#fff8e0" stroke="#8a6f60" stroke-width="3" stroke-dasharray="4 3"/>`)}<small>${t}</small></div>`});
   matchPairs(c,{clue:this.clue,items:[gear('s',9,'작은 톱니'),gear('m',17,'중간 톱니'),gear('l',26,'큰 톱니')],targets:[hole('s',9,'작은 홈'),hole('m',17,'중간 홈'),hole('l',26,'큰 홈')],map:{s:'s',m:'m',l:'l'}});}},
 {id:'clock-3',icon:'📜',title:'만난 시간',hint:'‘세 시’와 ‘15분’은 서로 다른 기록에서 얻어요.',nb:'만난 시간: 오후 3시 15분',
  clue:'벽의 편지: “<b>오후 세 시</b>에 네가 문을 두드렸어.”<br>차 기록: “문을 연 <b>15분 뒤</b> 차를 마셨다.”<br>두 기록을 합쳐 <b>시계가 가리킬 시각</b>(시와 분)을 골라요.',
  build(c){let h=null,m=null;c.body.innerHTML=clueBox(this.clue)+'<div class="row" id="h"></div><div class="row" id="m"></div><div class="row"><button type="button" class="btn main" id="ok">정했어요</button></div>';
   const draw=()=>{$('#h').innerHTML=[2,3,4].map(v=>`<button type="button" class="chip${h===v?' sel':''}" data-v="${v}">오후 ${v}시</button>`).join('');$('#m').innerHTML=[10,15,20].map(v=>`<button type="button" class="chip${m===v?' sel':''}" data-v="${v}">${v}분</button>`).join('');
    $('#h').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{h=+b.dataset.v;sfx('pop');draw();});$('#m').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{m=+b.dataset.v;sfx('pop');draw();});};
   draw();$('#ok').onclick=()=>{if(h===3&&m===15)c.solve();else c.bad('두 기록을 다시 읽어 봐요. 세 시에 문을 두드렸고 15분 뒤 차를 마셨어요.');};}},
 {id:'clock-4',icon:'🕰️',title:'시계 되살리기',hint:'분침의 숫자 3은 15분이에요.',nb:'시계 울림 순서: 길게 · 짧게 · 짧게',
  clue:'시계를 <b>3시 15분</b>에 맞추고 태엽을 돌려요. 시침은 3, 분침은 숫자 3을 가리켜야 해요.',
  build(c){let H=9,M=40;c.body.innerHTML=clueBox(this.clue)+`<div class="face"><b style="left:50%;top:6px;transform:translateX(-50%)">12</b><b style="right:10px;top:50%;transform:translateY(-50%)">3</b><b style="left:50%;bottom:6px;transform:translateX(-50%)">6</b><b style="left:10px;top:50%;transform:translateY(-50%)">9</b><i class="hh" id="hh"></i><i class="mm" id="mm"></i><span class="dot"></span></div><div class="row"><button class="chip" data-d="h-1">시 −</button><b id="hv" style="min-width:60px;text-align:center"></b><button class="chip" data-d="h1">시 ＋</button></div><div class="row"><button class="chip" data-d="m-5">분 −</button><b id="mv" style="min-width:60px;text-align:center"></b><button class="chip" data-d="m5">분 ＋</button></div><div class="row"><button class="btn main" id="ok">🔧 태엽 돌리기</button></div>`;
   const draw=()=>{$('#hv').textContent=H+'시';$('#mv').textContent=M+'분';$('#hh').style.transform=`rotate(${(H%12)*30+M*.5}deg)`;$('#mm').style.transform=`rotate(${M*6}deg)`;};
   c.body.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const k=b.dataset.d[0],v=+b.dataset.d.slice(1);sfx('pop');if(k==='h')H=((H-1+v+12)%12)+1;else M=(M+v+60)%60;draw();});
   draw();$('#ok').onclick=()=>{if(H===3&&M===15){beep(520,.7);c.solve();}else c.bad('딸깍… 아직 맞는 시각이 아니에요.');};}},
 {id:'clock-5',icon:'🔔',title:'소리 서랍',hint:'긴 막대 한 번, 짧은 막대 두 번이에요.',nb:'소리 서랍이 열렸어요.',
  clue:'시계가 울렸어요: <b>▬ ● ●</b> (길게 · 짧게 · 짧게)<br>서랍의 버튼을 같은 순서로 눌러요.<br><button type="button" class="chip" id="hear">🔊 울림 다시 듣기</button>',
  build(c){pickSeq(c,{clue:this.clue,items:[{id:'L',html:'<div class="big">▬</div><small>길게</small>'},{id:'S',html:'<div class="big">●</div><small>짧게</small>'}],answer:['L','S','S'],once:false,shuf:false});
   $('#hear').onclick=()=>{beep(520,.7);beep(520,.22,.9);beep(520,.22,1.3);};}},
 ]},
{id:'garden',name:'온실',icon:'🪴',x:69,y:47,piece:'잎',memo:'네가 보내준 씨앗을 심었어. 자꾸 서두르던 나에게 너는 작은 것부터 돌보라고 했지. 한 코씩 뜨는 일도 꽃을 키우는 일과 닮았더라.',
 note:'‘작은 씨앗도 돌봄을 받으면 자란다. 선물의 첫 실도 그랬다.’ 친구가 보내온 씨앗은 주인이 다시 누군가를 기다리게 했어요.',
 puzzles:[
 {id:'garden-1',icon:'🌱',title:'씨앗 분류',hint:'씨앗 봉투의 그림과 화분 표찰을 맞춰요.',nb:'물주기 표를 찾았어요.',
  clue:'씨앗 봉투의 그림과 화분 표찰의 그림이 같은 곳에 놓아요.',
  build(c){const s=(id,e,n)=>({id,html:chipIcon(e,n+' 씨앗')}),t=(id,e,n)=>({id,html:`<div class="big" style="opacity:.55">${e}</div><small>${n} 화분</small>`});
   matchPairs(c,{clue:this.clue,items:[s('leaf','🍃','잎'),s('flower','🌸','꽃'),s('fruit','🍓','열매')],targets:[t('leaf','🍃','잎'),t('flower','🌸','꽃'),t('fruit','🍓','열매')],map:{leaf:'leaf',flower:'flower',fruit:'fruit'}});}},
 {id:'garden-2',icon:'💧',title:'물 양 읽기',hint:'잎, 꽃, 열매 순서로 읽어요.',nb:'물 양: 잎 1컵 · 꽃 3컵 · 열매 2컵',
  clue:'물주기 표예요. 💧 하나가 물 <b>1컵</b>이에요.<br>🍃 잎: 💧<br>🌸 꽃: 💧💧💧<br>🍓 열매: 💧💧<br>화분마다 몇 컵인지 맞춰요.',
  build(c){steppers(c,{clue:this.clue,fields:[{label:'🍃 잎 (컵)',answer:1},{label:'🌸 꽃 (컵)',answer:3},{label:'🍓 열매 (컵)',answer:2}]});}},
 {id:'garden-3',icon:'🚿',title:'온실 물주기',hint:'물을 많이 주는 것이 정답은 아니에요.',nb:'세 화분에 꽃무늬가 돋아났어요.',
  clue:'화분을 눌러 <b>물 1컵</b>씩 부어요. 정해진 양이 되면 멈춰요. 넘치면 그 화분만 비워져요.<br>물 양: 🍃 1컵 · 🌸 3컵 · 🍓 2컵',
  build(c){const T={leaf:1,flower:3,fruit:2},N={leaf:'🍃 잎',flower:'🌸 꽃',fruit:'🍓 열매'},cur={leaf:0,flower:0,fruit:0};
   c.body.innerHTML=clueBox(this.clue)+'<div class="row" id="pots" style="align-items:flex-end;gap:18px"></div>';
   const draw=()=>{$('#pots').innerHTML=Object.keys(T).map(k=>`<div class="pot"><div class="cup">${Array.from({length:5},(_,i)=>`<i class="${i<cur[k]?'':'e'}"></i>`).join('')}</div><button type="button" class="chip" data-k="${k}">${N[k]}<br>💧 붓기 (${cur[k]}컵)</button><button type="button" class="chip" data-e="${k}" style="min-height:34px;font-size:12px">비우기</button></div>`).join('');
    $('#pots').querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;cur[k]++;sfx('pop');if(cur[k]>T[k]){cur[k]=0;c.bad('앗, 넘쳤어요! 그 화분만 비웠어요.');}else c.say('');draw();if(Object.keys(T).every(x=>cur[x]===T[x]))c.solve();});
    $('#pots').querySelectorAll('[data-e]').forEach(b=>b.onclick=()=>{cur[b.dataset.e]=0;draw();});};
   draw();}},
 {id:'garden-4',icon:'🪟',title:'유리 그림자',hint:'순서대로 화분을 옮긴 뒤 그림자를 봐요.',nb:'창의 그림자 순서: ○ → ★ → ☾',
  clue:'물 준 화분을 창가 홈에 <b>잎 → 꽃 → 열매</b> 순서로 올려요. 그러면 유리창에 그림자가 생겨요.',
  build(c){pickSeq(c,{clue:this.clue,items:[{id:'leaf',html:chipIcon('🍃','잎 화분')},{id:'flower',html:chipIcon('🌸','꽃 화분')},{id:'fruit',html:chipIcon('🍓','열매 화분')}],answer:['leaf','flower','fruit']});
   const solve=c.solve;c.solve=()=>{c.say('유리창에 그림자가 생겼어요: ○ → ★ → ☾');solve();};}},
 {id:'garden-5',icon:'🗄️',title:'씨앗 수납장',hint:'창의 그림자를 왼쪽부터 그대로 옮겨요.',nb:'수납장이 열렸어요.',
  clue:'수납장의 다이얼 세 개를 <b>창의 그림자(○ → ★ → ☾)</b> 순서대로 맞춰요. 다이얼을 누르면 기호가 바뀌어요.',
  build(c){const S=['○','★','☾'];const v=[1,2,0];c.body.innerHTML=clueBox(this.clue)+'<div class="row" id="dl"></div><div class="row"><button class="btn main" id="ok">열기</button></div>';
   const draw=()=>{$('#dl').innerHTML=v.map((x,i)=>`<button type="button" class="chip big" data-i="${i}" style="width:72px;height:72px">${S[x]}</button>`).join('');$('#dl').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;v[i]=(v[i]+1)%3;sfx('pop');draw();});};
   draw();$('#ok').onclick=()=>{if(v[0]===0&&v[1]===1&&v[2]===2)c.solve();else c.bad('딸깍… 그림자와 순서가 달라요.');};}},
 ]},
{id:'moon',name:'달빛 방',icon:'🌙',x:15,y:14,piece:'달',memo:'네 편지가 도착하는 밤마다 같은 달을 바라봤어. 달이 차오를수록 네 여행도 끝에 가까워지겠지. 멀리 있어도 우리는 같은 하늘 아래 있구나.',
 note:'‘멀리 있는 친구도 같은 달을 본다.’ 네 장의 달 엽서에는 여행 중에도 연결되어 있던 두 친구의 밤이 남아 있어요.',
 puzzles:[
 {id:'moon-1',icon:'✉️',title:'달 엽서 복원',hint:'엽서 사이의 곡선이 끊기지 않게 맞춰요.',nb:'엽서 지도: 초승달 옆에 별 세 개가 삼각형으로 떠 있어요.',
  clue:'엽서 네 장을 2×2로 맞춰 하나의 그림으로 만들어요. 금빛 <b>곡선</b>이 끊기지 않고 이어져야 해요.',
  build(c){orderSwap(c,{clue:this.clue,items:[0,1,2,3].map(i=>({id:String(i),html:tileSvg(i)})),answer:['0','1','2','3']});
   const g=$('#sw');g.style.display='grid';g.style.gridTemplateColumns='repeat(2,auto)';g.style.justifyContent='center';}},
 {id:'moon-2',icon:'🔭',title:'망원경 관찰',hint:'지도와 같은 별 세 개 모양을 찾아요.',nb:'달 변화 순서를 알려 주는 원판을 찾았어요.',
  clue:'복원한 엽서 지도에는 <b>초승달 옆에 별 세 개</b>가 삼각형 모양이에요: '+constel([[56,50],[78,30],[72,74]],false)+'<br>망원경에 보이는 네 하늘 중 같은 모양을 골라요.',
  build(c){choose(c,{clue:this.clue,answer:'ok',options:[{id:'ok',html:constel([[56,50],[78,30],[72,74]],false)},{id:'m',html:constel([[56,50],[78,70],[72,26]],false)},{id:'f',html:constel([[56,50],[78,30],[72,74]],true)},{id:'l',html:constel([[50,22],[70,40],[86,64]],false)}],wrong:'엽서 지도의 별 모양과 달라요.'});}},
 {id:'moon-3',icon:'🌗',title:'달 변화 원판',hint:'밝은 부분이 점점 넓어져요.',nb:'거울 카드를 얻었어요.',
  clue:'원판에는 달이 <b>여덟 개</b> 있어요. 달은 새로 뜬 뒤 <b>밝은 부분이 점점 늘어 보름이 되는</b> 쪽과, 보름 뒤 <b>점점 줄어 사라지는</b> 쪽이 있어요. 엽서의 별 지도가 그려진 밤은 <b>차오르는 동안</b>이었어요. 차오르는 순서대로 네 개만 골라 놓아요. (밝은 쪽이 오른쪽에서 시작해요)',
  build(c){pickSeq(c,{clue:this.clue,items:[{id:'1',html:chipIcon('🌒','초승달')},{id:'2',html:chipIcon('🌓','반달')},{id:'3',html:chipIcon('🌔','볼록달')},{id:'4',html:chipIcon('🌕','보름달')},{id:'5',html:chipIcon('🌖','기우는 볼록달')},{id:'6',html:chipIcon('🌗','기우는 반달')},{id:'7',html:chipIcon('🌘','그믐달')},{id:'8',html:chipIcon('🌑','새 달')}],answer:['1','2','3','4']});}},
 {id:'moon-4',icon:'🪞',title:'거울 카드',hint:'카드 자체를 회전하지 말고 거울에 넣어봐요.',nb:'거울에서 읽은 숫자: 6 · 2 · 8',
  clue:'카드는 거꾸로(좌우 반전) 인쇄되어 있어요. 카드를 <b>거울에 비추어</b> 정상 방향으로 읽어요. 읽은 숫자를 고르세요.',
  build(c){let mir=false;c.body.innerHTML=clueBox(this.clue)+'<div class="mirror"><div class="pane"><span style="display:inline-block;transform:scaleX(-1)">628</span></div><div class="pane glass" id="gl"><span style="color:#aab">?</span></div></div><div class="row"><button class="btn" id="mi">🪞 거울에 비추기</button></div><div class="row" id="op"></div>';
   $('#mi').onclick=()=>{mir=true;sfx('pop');$('#gl').innerHTML='<span style="display:inline-block;transform:scaleX(-1)"><span style="display:inline-block;transform:scaleX(-1)">628</span></span>';};
   const O=[['628','628'],['826','826'],['682','682']];$('#op').innerHTML=shuffle(O).map(o=>`<button type="button" class="chip" data-v="${o[0]}">${o[0]}</button>`).join('');
   $('#op').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{if(!mir){c.say('먼저 카드를 거울에 비춰 읽어 봐요.');return;}if(b.dataset.v==='628')c.solve();else{b.classList.add('shake');c.bad('거울에 비친 모양을 왼쪽부터 다시 읽어 봐요.');}});}},
 {id:'moon-5',icon:'🎁',title:'달 상자',hint:'거울에서 읽은 순서를 유지해요.',nb:'마지막 엽서를 얻었어요.',
  clue:'달 상자의 암호는 <b>거울 카드에서 읽은 숫자</b>예요. (📒 기록장에 적혀 있어요)',build(c){codeEntry(c,{answer:'628',clue:this.clue});}},
 ]},
{id:'flower',name:'꽃다락',icon:'🌷',x:31,y:14,piece:'나비',memo:'고맙다는 말을 늦게 배워서 꽃 사이에 눌러두었어. 고마움, 기다림, 다시 만남. 이번에는 네가 돌아오면 꼭 소리 내어 말할게.',
 note:'‘말하지 못한 고마움은 꽃 사이에 눌러 두었다.’ 꽃다락의 편지는 사라진 친구가 아니라 긴 여행을 떠난 친구의 안부였어요.',
 puzzles:[
 {id:'flower-1',icon:'🌼',title:'압화 짝 찾기',hint:'색 외에 잎 모양도 확인해요.',nb:'꽃말 카드: 데이지=감사, 라벤더=기다림, 튤립=다시 만남',
  clue:'압화(눌러 말린 꽃) 세 개를 식물 그림 카드에 맞춰요.<br>• 둥근 얼굴에 흰 꽃잎이 퍼져요<br>• 긴 줄기에 작은 보라 꽃이 층층이 달려요<br>• 컵 모양 꽃잎에 곧은 줄기예요',
  build(c){const p=(id,html,n)=>({id,html:`<div>${html}<small>${n}</small></div>`});
   matchPairs(c,{clue:this.clue,items:[p('daisy',daisy,'압화 A'),p('lav',lavender,'압화 B'),p('tulip',tulip,'압화 C')],targets:[{id:'lav',html:'<small>길쭉한 줄기에<br>작은 보라 꽃</small><b>라벤더</b>'},{id:'tulip',html:'<small>컵 모양<br>꽃잎</small><b>튤립</b>'},{id:'daisy',html:'<small>둥근 얼굴에<br>흰 꽃잎</small><b>데이지</b>'}],map:{daisy:'daisy',lav:'lav',tulip:'tulip'}});}},
 {id:'flower-2',icon:'💌',title:'꽃말 문장',hint:'문장의 앞에서 뒤로 읽어요.',nb:'꽃말 순서: 감사 → 기다림 → 다시 만남',
  clue:'엽서: “<b>먼저 고맙고, 오래 기다려, 다시 만나자.</b>”<br>꽃말 카드가 다섯 장 있어요. 엽서 문장에 나오는 <b>세 가지</b>만 문장의 순서대로 놓아요. (나머지 카드는 이 엽서와 상관없어요)',
  build(c){pickSeq(c,{clue:this.clue,items:[{id:'a',html:chipIcon('🌼','감사')},{id:'b',html:chipIcon('🪻','기다림')},{id:'c',html:chipIcon('🌷','다시 만남')},{id:'d',html:chipIcon('🍀','행운')},{id:'e',html:chipIcon('🌹','사랑')}],answer:['a','b','c']});}},
 {id:'flower-3',icon:'🏺',title:'꽃병 배치',hint:'카드 뒷면의 꽃 이름을 함께 확인해요.',nb:'꽃병 홈 순서: 데이지 → 라벤더 → 튤립',
  clue:'카드 뒷면: <b>감사=🌼데이지 · 기다림=🪻라벤더 · 다시 만남=🌷튤립</b><br>꽃병의 홈 ①②③에 <b>꽃말 문장 순서</b>대로 꽃을 꽂아요.',
  build(c){pickSeq(c,{clue:this.clue,items:[{id:'daisy',html:chipIcon('🌼','데이지')},{id:'lav',html:chipIcon('🪻','라벤더')},{id:'tulip',html:chipIcon('🌷','튤립')}],answer:['daisy','lav','tulip']});}},
 {id:'flower-4',icon:'🔢',title:'꽃잎 세기',hint:'확대 도판의 표시된 꽃잎·송이만 세요.',nb:'꽃잎 수: 데이지 5 · 라벤더 4 · 튤립 3',
  clue:`압화 도판이에요. 표시된 꽃잎·송이를 세어요.<div class="row">${daisy}${lavender}${tulip}</div><small>데이지: 흰 꽃잎 개수 · 라벤더: 보라 꽃송이 개수 · 튤립: 꽃잎 개수</small>`,
  build(c){steppers(c,{clue:this.clue,fields:[{label:'🌼 데이지 꽃잎',answer:5},{label:'🪻 라벤더 송이',answer:4},{label:'🌷 튤립 꽃잎',answer:3}]});}},
 {id:'flower-5',icon:'🗃️',title:'압화 서랍',hint:'방금 꽃병에 놓은 순서가 숫자 순서예요.',nb:'서랍에서 포장 주문서와 리본 방 열쇠를 얻었어요.',
  clue:'서랍 암호는 꽃병에 꽂은 순서(🌼→🪻→🌷)대로 <b>꽃잎·송이 수</b>를 읽은 세 자리예요.',build(c){codeEntry(c,{answer:'543',clue:this.clue,labels:['🌼','🪻','🌷']});}},
 ]},
{id:'ribbon',name:'리본 방',icon:'🎀',x:69,y:14,piece:'리본',memo:'작은 선물이라도 네 손에 꼭 맞으면 좋겠어. 너무 큰 상자도, 지나치게 긴 리본도 필요 없더라. 네가 좋아할 색을 묶으면서 마지막 코를 마무리했어.',
 note:'‘화려한 포장보다 마음에 맞는 크기가 중요했다.’ 주인은 여행에서 돌아올 친구에게 작은 뜨개 천사를 선물하려 했어요.',
 puzzles:[
 {id:'ribbon-1',icon:'📃',title:'주문서 복원',hint:'그림과 테두리 두 가지가 함께 이어져야 해요.',nb:'주문서: “손바닥에 올라갈 크기의 정사각형 상자와, 리본 세 가지를 묶어 주세요.”',
  clue:'꽃다락에서 얻은 주문서 세 조각이에요. 문장이 <b>이어지도록</b> 순서를 맞춰요.',
  build(c){const p=(id,t,e)=>({id,html:`<div style="min-width:120px;max-width:150px;font-size:13px;line-height:1.5;border:2px dashed #c9a27e;border-radius:6px;background:#fff8e0;padding:8px;text-align:left">${t}<div style="text-align:${e};color:#c9a27e">${e==='right'?'〰〰':'〰'}</div></div>`});
   orderSwap(c,{clue:this.clue,items:[p('1','손바닥에 올라갈 크기의','right'),p('2','정사각형 상자와,','right'),p('3','리본 세 가지를 묶어 주세요.','left')],answer:['1','2','3']});}},
 {id:'ribbon-2',icon:'📦',title:'맞는 상자',hint:'무늬보다 크기와 모양을 확인해요.',nb:'상자: 작은 정사각 상자',
  clue:'주문서에는 <b>“손바닥에 올라갈 크기, 정사각형”</b>이라고 적혀 있어요. 눈금 자 옆에 놓인 상자 다섯 개 중에서 골라요. (손바닥은 약 <b>44칸</b> 폭이에요)',
  build(c){choose(c,{clue:this.clue,answer:'ok',options:[{id:'ok',html:boxSvg(44,44,'#f2a7b5')+'<small>44×44</small>'},{id:'a',html:boxSvg(44,34,'#8fc3e0')+'<small>44×34</small>'},{id:'big',html:boxSvg(78,70,'#a9dccb')+'<small>78×70</small>'},{id:'rect',html:boxSvg(70,34,'#c9b3e6')+'<small>70×34</small>'},{id:'b',html:boxSvg(34,34,'#f5d58a')+'<small>34×34</small>'}]});}},
 {id:'ribbon-3',icon:'📏',title:'리본 재기',hint:'시작점 0에서 끝까지 칸을 세요.',nb:'리본 길이: 분홍 4 · 민트 2 · 보라 3',
  clue:'눈금판에 리본이 놓여 있어요. 0에서 끝까지 몇 칸인지 세요.<div class="row">'+ruler([[4,'#f2a7b5'],[2,'#a9dccb'],[3,'#c9b3e6']])+'</div><small>위에서부터 분홍 · 민트 · 보라</small>',
  build(c){steppers(c,{clue:this.clue,fields:[{label:'🎀 분홍 (칸)',answer:4},{label:'🎀 민트 (칸)',answer:2},{label:'🎀 보라 (칸)',answer:3}]});}},
 {id:'ribbon-4',icon:'🎁',title:'포장 매듭',hint:'길이 4, 3, 2가 색의 순서를 정해요.',nb:'묶은 순서: 분홍(4) → 보라(3) → 민트(2) → 보관함 암호 432',
  clue:'리본을 <b>긴 것부터 짧은 것 순서</b>로 포장 받침에 올려 매듭을 묶어요. (분홍 4칸 · 민트 2칸 · 보라 3칸)',
  build(c){pickSeq(c,{clue:this.clue,items:[{id:'pink',html:dot('#f2a7b5','분홍')},{id:'mint',html:dot('#a9dccb','민트')},{id:'purple',html:dot('#c9b3e6','보라')}],answer:['pink','purple','mint']});}},
 {id:'ribbon-5',icon:'🗃️',title:'포장 보관함',hint:'원래 놓인 색 순서가 아니라 묶은 순서예요.',nb:'보관함에서 작은 태엽과 구름 방 열쇠를 얻었어요.',
  clue:'보관함 암호는 리본을 <b>묶은 순서대로 읽은 길이</b>예요. (📒 기록장에 적혀 있어요)',build(c){codeEntry(c,{answer:'432',clue:this.clue});}},
 ]},
{id:'cloud',name:'구름 방',icon:'☁️',x:85,y:14,piece:'종',memo:'오늘 돌아온다는 마지막 편지를 받았어! 오르골이 우리의 노래를 기억하고 있더라. 잠근 방들은 슬픔을 숨긴 곳이 아니라 네가 오기 전까지 놀라움을 지켜준 곳이었어.',
 note:'‘기억의 노래가 들리면 문을 열어도 괜찮다.’ 마지막 편지에는 친구가 오늘 돌아온다는 소식이 있어요. 봉인된 것은 슬픔이 아닌 서프라이즈였어요.',
 puzzles:[
 {id:'cloud-1',icon:'🎶',title:'오르골 태엽',hint:'낡은 시계 태엽과 다른 작은 홈이에요.',nb:'오르골이 움직여요. 세 가지 소리가 나요.',
  clue:'리본 방에서 받은 <b>작은 태엽</b>을 오르골 옆 홈에 넣어요. 시계방의 큰 톱니나 다른 부품과 헷갈리지 않게요.',
  build(c){choose(c,{clue:this.clue,answer:'ok',options:[{id:'ok',html:svg(60,60,'<path d="M30,10 a20,20 0 1,0 0.1,0 M30,18 a12,12 0 1,1 -0.1,0" fill="none" stroke="#8a6f60" stroke-width="3"/><circle cx="30" cy="30" r="4" fill="#d9b45e"/>')+'<small>작은 태엽</small>'},{id:'gear',html:svg(60,60,'<circle cx="30" cy="30" r="26" fill="#d9b45e" stroke="#8a6f60" stroke-width="3"/><circle cx="30" cy="30" r="5" fill="#8a6f60"/>')+'<small>큰 톱니</small>'},{id:'bolt',html:svg(60,60,'<rect x="22" y="8" width="16" height="44" rx="4" fill="#bbb" stroke="#8a6f60" stroke-width="3"/>')+'<small>나사</small>'}]});}},
 {id:'cloud-2',icon:'🔔',title:'종소리 재현',hint:'소리 없이도 점멸하는 기호로 풀 수 있어요.',nb:'오르골 순서: ⭐ 별 → ☁️ 구름 → 🌙 달 → ⭐ 별',
  clue:'오르골이 세 가지 종소리를 순서대로 알려 줘요. <b>[오르골 켜기]</b>를 누르고 기호를 외워요. 같은 순서로 종을 눌러요.<br><button type="button" class="chip" id="play">▶ 오르골 켜기</button><div class="memo" id="seq" style="text-align:center;font-size:22px;min-height:44px"></div>',
  build(c){const F={star:520,cloud:620,moon:760},E={star:'⭐',cloud:'☁️',moon:'🌙'},N={star:'별',cloud:'구름',moon:'달'},A=['star','cloud','moon','star'];
   pickSeq(c,{clue:this.clue,items:Object.keys(F).map(k=>({id:k,html:chipIcon(E[k],N[k]+' 종')})),answer:A,once:false,shuf:false,onPick:id=>beep(F[id],.35)});
   $('#play').onclick=async()=>{const s=$('#seq');s.textContent='';for(let i=0;i<A.length;i++){beep(F[A[i]],.4);s.textContent+=(i?' → ':'')+E[A[i]]+N[A[i]];await sleep(650);}};
   }},
 {id:'cloud-3',icon:'🌈',title:'빛 연결',hint:'빛과 같은 색 홈부터 맞춰요.',nb:'저울 돌 두 개를 얻었어요.',
  clue:'프리즘 세 개를 <b>같은 색 광선 홈</b>에 넣어 가운데 흰 빛을 만들어요.',
  build(c){const P=(id,col,n)=>({id,html:`<div>${svg(54,54,`<polygon points="27,6 50,48 4,48" fill="${col}" stroke="#8a6f60" stroke-width="3" opacity=".9"/>`)}<small>${n} 프리즘</small></div>`}),T=(id,col,n)=>({id,html:`<div>${svg(54,18,`<rect x="2" y="4" width="50" height="10" rx="5" fill="${col}"/>`)}<small>${n} 광선</small></div>`});
   matchPairs(c,{clue:this.clue,items:[P('mint','#a9dccb','민트'),P('pink','#f2a7b5','분홍'),P('purple','#c9b3e6','보라')],targets:[T('purple','#c9b3e6','보라'),T('mint','#a9dccb','민트'),T('pink','#f2a7b5','분홍')],map:{mint:'mint',pink:'pink',purple:'purple'}});}},
 {id:'cloud-4',icon:'⚖️',title:'저울의 빈칸',hint:'두 식을 나란히 놓고 달 하나만큼의 차이를 찾아 봐요.',nb:'저울 돌: ⭐=3, 🌙=5 → 서랍 암호 ⭐🌙⭐ = 3·5·3',
  clue:'저울 도판이에요. 접시 양쪽의 무게가 같아요.<br><b>⭐ + 🌙 = 8</b><br><b>🌙 + 🌙 + ⭐ = 13</b><br>⭐과 🌙은 각각 얼마일까요? (두 저울을 비교해 봐요)',
  build(c){steppers(c,{clue:this.clue,fields:[{label:'⭐ 별 = ',answer:3},{label:'🌙 달 = ',answer:5}]});}},
 {id:'cloud-5',icon:'🗄️',title:'기억 서랍',hint:'세 자리 기호에 계산한 수를 넣어요.',nb:'기억 서랍에서 별 상자 방 열쇠를 얻었어요.',
  clue:'서랍의 기호는 <b>⭐ · 🌙 · ⭐</b> 순서예요. 각 기호의 수를 넣어요. (📒 기록장 참고)',build(c){codeEntry(c,{answer:'353',clue:this.clue,labels:['⭐','🌙','⭐']});}},
 ]},
{id:'star',name:'별 상자 방',icon:'⭐',x:85,y:47,piece:null,memo:'어서 와. 네가 다녀온 길과 내가 기다린 시간이 이 작은 천사의 날개에 함께 들어 있어. 이 저택의 비밀은 거창하지 않아. 너에게 건네고 싶던 마음을 한 코씩 모아두었을 뿐이야.',
 note:'‘이 방은 친구가 돌아오는 날 열려고 준비한 선물의 마지막 자리.’ 일곱 조각을 모으면 주인의 마음과 뜨개 천사의 탄생 이야기가 하나로 이어져요.',
 puzzles:[
 {id:'star-1',icon:'🔮',title:'기억 조각 모으기',hint:'빠진 조각이 있으면 그 방의 완료 기록으로 돌아갈 수 있어요.',nb:'일곱 기억 조각을 장치에 모았어요.',
  clue:'앞의 일곱 방에서 얻은 기억 조각을 <b>같은 모양 홈</b>에 놓아요.',
  build(c){const names=Object.keys(PIECE);const own=names.filter(n=>has('mem-'+n));
   if(own.length<names.length){c.body.innerHTML=clueBox(this.clue)+`<p class="msg">아직 못 찾은 조각이 있어요. 중앙홀로 돌아가 앞의 방을 모두 풀어 봐요. (${own.length}/7)</p>`;return;}
   matchPairs(c,{clue:this.clue,items:names.map(n=>({id:n,html:chipIcon(PIECE[n],n)})),targets:names.map(n=>({id:n,html:`<div class="big" style="opacity:.35">${PIECE[n]}</div><small>${n} 홈</small>`})),map:Object.fromEntries(names.map(n=>[n,n]))});}},
 {id:'star-2',icon:'📜',title:'편지의 순서',hint:'이미 걸어온 방의 순서가 이야기 순서예요.',nb:'마지막 편지: “빛을 따라 돌아와. 아침의 해, 자란 잎, 함께 본 달, 묶은 리본을 차례로 켜 줘.”',
  clue:'일곱 장의 메모를 <b>내가 방을 지나온 순서</b>대로 정리해요. (서재에서 시작했어요)',
  build(c){const r=ROOMS.slice(0,7);pickSeq(c,{clue:this.clue,items:r.map(x=>({id:x.id,html:chipIcon(x.icon,x.name)})),answer:r.map(x=>x.id)});}},
 {id:'star-3',icon:'💡',title:'기억의 네 불빛',hint:'문장 속 네 가지 물건을 찾아요.',nb:'네 불빛이 켜졌어요: 해 → 잎 → 달 → 리본',
  clue:'마지막 편지: “<b>아침의 해, 자란 잎, 함께 본 달, 묶은 리본</b>을 차례로 켜 줘.”<br>일곱 조각 중에서 편지의 순서대로 누르세요.',
  build(c){pickSeq(c,{clue:this.clue,items:Object.keys(PIECE).map(n=>({id:n,html:chipIcon(PIECE[n],n)})),answer:['해','잎','달','리본']});}},
 {id:'star-4',icon:'🗝️',title:'마지막 열쇠',hint:'별 홈과 손잡이 홈이 동시에 이어져야 해요.',nb:'별 상자 열쇠를 완성했어요.',
  clue:'열쇠의 앞 조각은 <b>별 모양 홈</b>과 <b>손잡이 홈</b>이 모두 열려 있어요. 이어서 하나로 맞는 뒷 조각을 고르세요.<div class="row">'+svg(80,60,'<path d="M0,12 H50 L58,20 L50,28 L58,36 L50,44 H0 Z" fill="#f5d58a" stroke="#8a6f60" stroke-width="3"/><path d="M14,30 l3,-8 3,8 -8,-5 10,0z" fill="#fff" stroke="#8a6f60"/>')+'</div>',
  build(c){const back=(id,d)=>({id,html:svg(80,60,`<path d="${d}" fill="#f5d58a" stroke="#8a6f60" stroke-width="3"/>`)});
   choose(c,{clue:this.clue,answer:'ok',options:[back('ok','M80,12 H30 L22,20 L30,28 L22,36 L30,44 H80 Z'),back('a','M80,12 H30 L38,20 L30,28 L38,36 L30,44 H80 Z'),back('b','M80,12 H30 L22,24 L30,36 L22,44 H80 Z')],wrong:'홈 모양이 맞지 않아요.'});}},
 {id:'star-5',icon:'🎁',title:'선물의 비밀',hint:'얻은 열쇠를 상자에 올려요.',nb:'별 상자를 열었어요.',
  clue:'완성한 열쇠를 <b>별 상자</b>에 올려요.',
  build(c){c.body.innerHTML=clueBox(this.clue)+'<div class="row"><button type="button" class="chip" id="chest" style="padding:10px"><img src="assets/mansion/mansion-chest-closed-v1.png" alt="닫힌 별 상자" style="width:min(220px,60vw);display:block"></button></div><div class="row"><button type="button" class="btn main" id="ok">🗝️ 열쇠로 열기</button></div>';
   $('#ok').onclick=()=>{$('#chest img').src='assets/mansion/mansion-chest-open-v1.png';c.solve();};$('#chest').onclick=$('#ok').onclick;}},
 ]},
];

function diaryPuzzle(c){
 const N=5,flower=[[1,1],[3,1],[1,3],[3,3]],digits=[2,4,1,3],ox=3,oy=2;   // 일기 칸 (정답: 판 위치 +0,+0)
 // 일기: 5×5 칸. 🌼가 있는 칸 4개(왼쪽 위부터 읽는 순서 2·4·1·3), 나머지는 가짜 숫자.
 const book=Array.from({length:N},(_,y)=>Array.from({length:N},(_,x)=>{const k=flower.findIndex(f=>f[0]===x&&f[1]===y);return k>=0?{f:1,d:digits[k]}:{f:0,d:[7,5,9,6,8,0,3][(x*3+y*5)%7]};}));
 // 투명 판: 구멍 네 개의 모양(상대 위치) = 꽃 네 개와 같은 모양. 판은 처음에 어긋나 있다.
 const holes=flower.map(f=>[f[0]-1,f[1]-1]);let px=2,py=2;
 c.body.innerHTML=clueBox(this.clue)+'<div class="grid" id="gd" style="grid-template-columns:repeat(5,52px)"></div><div class="row"><button class="chip" data-m="0,-1" aria-label="위">▲</button><button class="chip" data-m="-1,0" aria-label="왼쪽">◀</button><button class="chip" data-m="1,0" aria-label="오른쪽">▶</button><button class="chip" data-m="0,1" aria-label="아래">▼</button></div><p class="msg">화살표로 투명 판을 움직여요. 구멍에 🌼가 모두 보이면 숫자를 읽을 수 있어요.</p>';
 const draw=()=>{
  let html='',ok=true;
  const holeAt=(x,y)=>holes.some(h=>h[0]+px===x&&h[1]+py===y);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const h=holeAt(x,y),b=book[y][x];html+=`<div class="cell ${h?'hole':'cover'}" style="width:52px;height:52px">${h?`<span style="font-size:20px">${b.f?'🌼':''}</span><span style="position:absolute;bottom:1px;font-size:14px">${b.d}</span>`:''}</div>`;}
  holes.forEach(hh=>{const x=hh[0]+px,y=hh[1]+py;if(!(x>=0&&x<N&&y>=0&&y<N&&book[y][x].f))ok=false;});
  $('#gd').innerHTML=html;
  if(ok){c.say('🌼 네 개가 모두 보여요! 숫자는 2 · 4 · 1 · 3');setTimeout(()=>c.solve(),500);}
 };
 c.body.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const [dx,dy]=b.dataset.m.split(',').map(Number);px=Math.max(-1,Math.min(3,px+dx));py=Math.max(-1,Math.min(3,py+dy));sfx('pop');draw();});
 draw();
}

// ---------- 화면 ----------
const R=Object.fromEntries(ROOMS.map(r=>[r.id,r]));
const roomIdx=id=>ROOMS.findIndex(r=>r.id===id);
const roomOpen=id=>roomIdx(id)===0||has('key-'+id);
const roomDone=id=>id==='star'?st.endingSeen:(has('key-'+ROOMS[roomIdx(id)+1].id));
const frontier=()=>ROOMS.find(r=>roomOpen(r.id)&&!roomDone(r.id));
let cur=null;

function hall(){
 $('#hall').hidden=false;$('#roomCard').hidden=true;cur=null;
 const f=frontier();
 $('#doors').innerHTML=ROOMS.map((r,i)=>{const o=roomOpen(r.id),d=roomDone(r.id),n=f&&f.id===r.id;
  return `<button type="button" class="hall-door${d?' done':''}${n?' next':''}" style="left:${r.x}%;top:${r.y}%"${o?'':' disabled'} data-r="${r.id}" aria-label="${i+1}번째 방 ${r.name}${o?'':', 잠김'}${d?', 완료':''}"><span>${i+1}. ${r.name}<br>${d?'✅':o?(n?'👉 여기!':'🚪'):'🔒'}</span></button>`;}).join('');
 $('#doors').querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>enter(b.dataset.r));
 $('#hallNote').innerHTML=st.endingSeen?'저택의 비밀을 모두 풀었어요. 문을 눌러 이야기를 다시 볼 수 있어요.':f?`다음 목적지는 <b>${roomIdx(f.id)+1}번 ${f.name}</b>이에요. 문마다 번호가 붙어 있어요. 위층 문도 번호 순서로 열려요.`:'';
 const keys=ROOMS.filter(r=>roomIdx(r.id)>0&&has('key-'+r.id)).map(r=>`<span>🗝️ ${r.name}</span>`).join(''),pcs=Object.keys(PIECE).filter(n=>has('mem-'+n)).map(n=>`<span>${PIECE[n]} ${n}</span>`).join('');
 $('#inv').innerHTML=(keys||pcs)?keys+pcs:'<span style="font-weight:normal;color:var(--sub)">얻은 열쇠와 기억 조각이 여기에 모여요</span>';
}
function enter(id){
 cur=id;st.room=id;save();const r=R[id];
 $('#hall').hidden=true;$('#roomCard').hidden=false;
 $('#roomImg').src='assets/mansion/mansion-escape-'+id+'-v1.jpg';$('#roomImg').alt=r.name+' 배경';$('#roomName').textContent=`${r.icon} ${r.name}`;
 renderRoom();
}
function renderRoom(){
 const r=R[cur];let go=true;
 $('#steps').innerHTML=r.puzzles.map((p,i)=>{const d=done(p.id),open=d||go;const state=d?'ok':(go?'go':'');if(!d)go=false;
  return `<button type="button" class="step ${state}"${open?'':' disabled'} data-p="${p.id}" aria-label="${i+1}단계 ${p.title}${d?', 완료':open?'':', 잠김'}"><i>${d?'✅':open?p.icon:'🔒'}</i>${i+1}. ${p.title}</button>`;}).join('');
 $('#steps').querySelectorAll('.step').forEach(b=>b.onclick=()=>openPuzzle(b.dataset.p));
 // 그림 속 물건 위에 눌러 볼 곳 표시
 go=true;
 $('#hots').innerHTML=r.puzzles.map((p,i)=>{const d=done(p.id),open=d||go,xy=HOT[r.id][i];const cls=d?'ok':(go?'go':'lock');if(!d)go=false;
  return `<button type="button" class="hs ${cls}" style="left:${xy[0]}%;top:${xy[1]}%" data-p="${p.id}" aria-label="${i+1}단계 ${p.title}${d?', 완료':open?'':', 잠김'}">${d?'✓':open?(i+1):'🔒'}</button>`;}).join('');
 $('#hots').querySelectorAll('.hs').forEach(b=>b.onclick=()=>{const p=r.puzzles.find(x=>x.id===b.dataset.p),i=r.puzzles.indexOf(p);if(!done(p.id)&&i>0&&!done(r.puzzles[i-1].id)){sfx('wrong');$('#roomMsg').textContent='앞 단계를 먼저 풀어야 해요. 번호 순서대로 살펴봐요.';return;}openPuzzle(p.id);});
 const left=r.puzzles.filter(p=>!done(p.id)).length;
 $('#roomMsg').innerHTML=roomDone(r.id)?'이 방은 모두 풀었어요. 완료한 단계를 눌러 다시 살펴볼 수 있어요.':left===5?`<b>${r.note}</b>`:`${r.note}`;
}
// 방 그림 위 눌러 볼 곳 (그림 크기 기준 %): 방마다 5단계, 단계 순서대로. 실제 그림 속 물건 위치에서 측정.
const HOT={library:[[11.4,64.5],[48.3,59.4],[29.7,64.5],[78,61.2],[28,79]],clock:[[45.9,59],[63.5,57.5],[34.5,57.5],[9,29.5],[64.6,67.7]],garden:[[41,79],[71,60.3],[51.8,57.5],[56,20],[36,47]],moon:[[47.7,46],[33.8,39.6],[58.7,43],[72.5,30.4],[70.6,46]],flower:[[22.8,71.8],[25.5,34.5],[13.8,61.7],[40.7,73.7],[30.4,57.5]],ribbon:[[86.3,64.5],[53.2,60.3],[55,66.3],[10.4,25.8],[67.3,40.5]],cloud:[[57.3,70],[18.6,21.2],[45.2,70],[79.8,46],[63.9,49.7]],star:[[50,67],[20,71.8],[32.8,21.2],[78.7,59],[50,50]]};
const PROP={library:'diary',clock:'gearboard',garden:'seedtray',moon:'moonwheel',flower:'flowerbook',ribbon:'ribbonboard',cloud:'musicbox',star:'memoryseal'};
let panel=null;
function openPuzzle(pid){
 const r=R[cur],p=r.puzzles.find(x=>x.id===pid),sh=$('#sheet'),box=$('#sheetBox');
 sh.hidden=false;
 box.innerHTML=`<div class="sh-head"><img src="assets/mansion/mansion-prop-${PROP[r.id]}-v1.png" alt="" style="width:46px;height:46px;object-fit:contain" onerror="this.remove()"><h2>${p.icon} ${p.title}</h2><button type="button" class="xbtn" id="pn" aria-label="단서 기록장">📒</button><button type="button" class="xbtn" id="px" aria-label="닫기">✕</button></div><div id="pb"></div><p class="msg" id="pm"></p><div class="row"><button type="button" class="chip" id="ph">💡 힌트</button><button type="button" class="chip" id="pr">↺ 이 퍼즐 다시</button></div><div id="pa"></div>`;
 $('#px').onclick=closePanel;$('#pn').onclick=notebook;let hi=0;$('#ph').onclick=()=>{const H=p.hints;if(H&&H.length){const k=hi%H.length;hi++;$('#pm').textContent='💡 힌트 '+(k+1)+'/'+H.length+': '+H[k];$('#ph').textContent='💡 힌트 ('+Math.min(hi,H.length)+'/'+H.length+')';}else $('#pm').textContent='💡 '+p.hint;};$('#pr').onclick=()=>openPuzzle(pid);
 const reviewing=done(pid);
 const c={body:$('#pb'),say:t=>{$('#pm').textContent=t;},bad:t=>{sfx('wrong');const m=$('#pm');m.textContent=t;m.classList.remove('shake');void m.offsetWidth;m.classList.add('shake');},
  solve(){if(c.finished)return;c.finished=true;sfx('win');solved(r,p,reviewing);}};
 panel=c;
 if(reviewing){$('#pb').innerHTML=`<div class="memo"><b>이미 푼 단계예요</b>${esc(p.nb)}</div>`;$('#pa').innerHTML='<div class="acts"><button type="button" class="btn main" id="pc">닫기</button></div>';$('#pc').onclick=closePanel;return;}
 p.build(c);
}
function closePanel(){$('#sheet').hidden=true;panel=null;if(cur)renderRoom();else hall();}
function solved(r,p,reviewing){
 if(!reviewing){st.completedPuzzleIds.push(p.id);save();}
 const last=r.puzzles.every(x=>done(x.id));
 $('#pm').textContent='';
 $('#pb').insertAdjacentHTML('beforeend',`<div class="memo good"><b>풀었어요! ✨</b>${esc(p.nb)}</div>`);
 $('#pa').innerHTML=`<div class="acts"><button type="button" class="btn main" id="pc">${last?'🗝️ 방을 마무리해요':'계속하기'}</button></div>`;
 $('#ph').hidden=$('#pr').hidden=true;
 $('#pc').onclick=()=>{if(last)finishRoom(r);else closePanel();};
}
function finishRoom(r){
 const first=!has('key-'+(ROOMS[roomIdx(r.id)+1]||{}).id)&&r.id!=='star';
 const next=ROOMS[roomIdx(r.id)+1];
 if(next)give('key-'+next.id);if(r.piece)give('mem-'+r.piece);
 if(!st.readNotes.includes(r.id))st.readNotes.push(r.id);
 const rw=rewarded();
 // 서재·시계방·온실의 천사 마을 전용 아이템(기존 방 보상)은 처음 한 번만
 const ITEM={library:['v-old-book','📖 오래된 고서'],clock:['v-clock-gear','⚙️ 별빛 시계태엽'],garden:['v-glow-plant','🪴 빛나는 온실 화분']}[r.id];
 let extra='';if(ITEM&&!rw['room-'+r.id]){markRewarded('room-'+r.id);try{SejinSave.pushResult({game:'pickup',place:'천사 마을',items:{[ITEM[0]]:1}});}catch(e){}extra=`<br>${ITEM[1]}을(를) 얻었어요!`;}
 if(r.id==='star'){st.endingSeen=true;save();ending();return;}
 save();
 const box=$('#sheetBox');
 box.innerHTML=`<div style="text-align:center;font-size:44px">🗝️</div><h2 style="text-align:center">${r.name}을(를) 모두 풀었어요!</h2><div class="memo"><b>${PIECE[r.piece]||''} ${r.piece} 기억 조각 · ${r.name}의 메모</b>${esc(r.memo)}</div><p class="msg">${next.name}의 열쇠를 얻었어요.${extra}</p><div class="acts"><button type="button" class="btn main" id="go">중앙홀로 가서 문 열기</button></div>`;
 $('#go').onclick=()=>{$('#sheet').hidden=true;panel=null;hall();};
}
function ending(){
 const rw=rewarded();let yarnTxt='',dust='';
 if(!rw['ending']){markRewarded('ending');let first=true;try{const k='sejin-mansion-clear-v1',cc=JSON.parse(localStorage.getItem(k))||{};first=!cc.done;cc.done=1;localStorage.setItem(k,JSON.stringify(cc));}catch(e){}
  const yarn=first?15:5;try{SejinSave.pushResult({game:'minigame',label:'대저택의 비밀',place:'천사 마을',first,yarn});SejinSave.pushResult({game:'pickup',place:'천사 마을',items:{'v-stardust':1}});}catch(e){}
  yarnTxt=`<p class="msg">실뭉치 <b>+${yarn}개</b>는 방에 가면 들어와요.</p>`;dust='<br>✨ <b>별가루 병</b>도 얻었어요!';}
 $('#sheetBox').innerHTML=`<div style="text-align:center;font-size:44px">🧸</div><h2 style="text-align:center">별 상자가 열렸어요!</h2><div class="memo"><b>작은 뜨개 천사의 선물</b>상자 안에는 작은 뜨개 천사와 편지가 들어 있었어요.${dust}</div><div class="memo"><b>마지막 편지</b>${esc(R.star.memo)}</div>${yarnTxt}<div class="acts"><button type="button" class="btn main" id="rd">📜 일곱 개의 이야기 다시 읽기</button><a class="btn ghost" href="village.html" style="text-align:center;text-decoration:none">천사 마을로</a><button type="button" class="btn ghost" id="hh">중앙홀로</button></div>`;
 $('#rd').onclick=story;$('#hh').onclick=()=>{$('#sheet').hidden=true;panel=null;hall();};
}
function story(){
 const list=ROOMS.filter(r=>st.readNotes.includes(r.id));
 $('#sheet').hidden=false;
 $('#sheetBox').innerHTML=`<div class="sh-head"><h2>📜 이야기 기록장</h2><button type="button" class="xbtn" id="x2">✕</button></div>`+(list.length?list.map((r,i)=>`<div class="memo"><b>${i+1}. ${r.name} ${r.piece?PIECE[r.piece]+' '+r.piece+' 조각':''}</b>${esc(r.memo)}</div>`).join(''):'<p class="msg">방을 모두 풀면 메모가 순서대로 쌓여요.</p>');
 $('#x2').onclick=()=>{$('#sheet').hidden=true;if(panel){}};
}
function notebook(){
 const sh=$('#sheet');const was=panel?$('#sheetBox').innerHTML:null;
 const rooms=cur?[R[cur]]:ROOMS.filter(r=>roomOpen(r.id));
 const rows=rooms.flatMap(r=>r.puzzles.filter(p=>done(p.id)).map(p=>`<div class="memo"><b>${r.name} · ${p.title}</b>${esc(p.nb)}</div>`));
 const back=was;
 $('#sheetBox').innerHTML=`<div class="sh-head"><h2>📒 단서 기록장</h2><button type="button" class="xbtn" id="x3">닫기</button></div>`+(rows.join('')||'<p class="msg">퍼즐을 풀면 알아낸 내용이 여기에 적혀요.</p>');
 $('#x3').onclick=()=>{if(back&&cur){const pid=document.querySelector('#sheetBox')&&null;}$('#sheet').hidden=true;panel=null;cur?renderRoom():hall();};
}
$('#toHall').onclick=hall;$('#bStory').onclick=story;
$('#bNote').onclick=()=>{$('#sheet').hidden=false;notebook();};
$('#bReset').onclick=()=>{if(confirm('저택 진행을 처음(서재)부터 다시 할까요?\n이미 받은 보상은 다시 받지 않아요.')){st=fresh();save();hall();}};
{const im=new Image();im.onload=()=>{const e=$('#hallImg');e.src=im.src;e.hidden=false;};im.src='assets/mansion/mansion-hall-v2.jpg';}
hall();
window.__mansion={get st(){return st;},ROOMS,pickSeq};
window.MX={ROOMS,$,sfx,beep,shuffle,svg,clueBox,pickSeq,matchPairs,orderSwap,codeEntry,steppers,choose,chipIcon,coverHtml,esc,get st(){return st;}};
})();
