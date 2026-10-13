/* 뜨개 달리기 맵 편집기 — knit.html?doll=<스테이지>&edit=1
   게임 화면(진짜 그림)을 그대로 보면서 구멍·발판·매달린 것·장애물을 직접 놓고, 옮기고, 크기를 바꾼 뒤 저장하면
   그 스테이지가 무작위 대신 이 배치대로 나온다. 저장 = 이 브라우저(localStorage), 모두에게 쓰려면 '내보내기' 글자를 runner-layouts.js에 붙여 넣기.
   위치 단위: at = 미터(m). 그 물건의 왼쪽 끝이 화면 맨 왼쪽에 오는 지점(세진이는 화면 x=140 즉 약 2.8m 앞에 서 있다).
   게임 파일(game.js)의 전역(runner, canvas, viewWidth, viewHeight, paused, cd, overlay, pad)을 그대로 쓴다. */
(()=>{
 'use strict';
 const Q=new URLSearchParams(location.search);
 if(!Q.get('edit'))return;
 const STAGE=runner.stageId,GOAL=runner.goal,KINDS=Runner.KINDS,SPEED=runner.stage.speed,GAPS=(runner.stage.gap||.9);
 const KEY='sejin-runner-layout-'+STAGE;
 const LABEL={cone:'콘 (낮은 것)',awl:'송곳 (낮은 것)',strand:'실가닥 (아주 낮은 것)',scissors:'가위 (키 큰 것 · 더블점프)',triangle:'삼각자 (키 큰 것 · 더블점프)',ruler:'긴 자 (더블점프)',ball:'굴러오는 공',pit:'구멍',hang:'매달린 것 (숙이기)',pl1:'발판 1층',pl2:'발판 2층',blk:'짧은 발판(블록)'};
 const DEF={pit:{k:'pit',w:130},hang:{k:'hang',w:100,bottom:64},pl1:{k:'platform',w:380,y:120},pl2:{k:'platform',w:340,y:215},blk:{k:'platform',w:150,y:120,sb:1}};
 let items=[],dist=0,sel=-1,tool='select',drag=null;
 const $=s=>document.querySelector(s);
 const load=()=>{try{const draft=sessionStorage.getItem('sejin-runner-edit-draft-'+STAGE);if(draft){const o=JSON.parse(draft);if(o&&Array.isArray(o.items)){dist=Math.max(0,Math.min(o.position||0,GOAL));return o.items;}}const t=localStorage.getItem(KEY);if(t){const o=JSON.parse(t);if(o&&o.items)return o.items;}}catch(e){}
  const f=window.RUNNER_LAYOUTS&&window.RUNNER_LAYOUTS[STAGE];return f&&f.items?JSON.parse(JSON.stringify(f.items)):[];};
 items=load();
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({v:1,stage:STAGE,items}));msg('저장했어요! 이 브라우저에서 이 스테이지가 이 배치대로 나와요.');}catch(e){msg('저장하지 못했어요(브라우저 저장 공간).');}};
 const snap=v=>Math.round(v*2)/2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const floorY=()=>viewHeight-105;
 // ---- 화면 상자(캔버스 단위) ----
 const isObj=it=>!!KINDS[it.k]||it.k==='obj';
 const objSize=it=>{const s=it.s||1;return {w:Math.round((it.ar||1)*(it.h0||80)*s),h:Math.round((it.h0||80)*s)};};
 function sizeOf(it){const k=it.k;if(k==='obj')return objSize(it);if(KINDS[k]){const s=it.s||1;return {w:Math.round(KINDS[k].w*s),h:Math.round(KINDS[k].h*s)};}
  if(k==='pit')return {w:it.w||130,h:0};if(k==='hang')return {w:it.w||100,h:0};return {w:it.w||380,h:0};}
 function rectOf(it){const x=it.at*50-dist*50,z=sizeOf(it),f=floorY();
  if(isObj(it))return [x,f-(it.oy||0)-z.h,z.w,z.h];
  if(it.k==='pit')return [x,f-17,z.w,120];
  if(it.k==='hang')return [x,0,z.w,f-(it.bottom||64)];
  return [x,f-(it.y||120)-14,z.w,40];}
 function toObs(it){const x=it.at*50-dist*50,k=it.k;
  if(k==='obj'){const z=objSize(it);return {kind:'obj',x,w:z.w,h:z.h,oy:it.oy||0,img:it.img,deco:it.hit===false,step:!!it.step&&it.hit!==false,y:(it.oy||0)+z.h};}
  if(KINDS[k]){const s=it.s||1,b=KINDS[k];return {kind:k,x,seed:it.at,...b,w:Math.round(b.w*s),h:Math.round(b.h*s),sc:s,oy:k==='ball'?0:(it.oy||0),v:it.v,rolled:0};}
  if(k==='hang')return {kind:'hang',x,seed:it.at,w:it.w||100,h:0,bottom:it.bottom||64,sc:1,v:it.v};
  if(k==='pit')return {kind:'pit',x,w:it.w||130,h:0,wl:it.wl};
  return {kind:'platform',x,w:it.w||380,h:0,y:it.y||120,sb:it.sb};}
 const visible=it=>{const x=it.at*50-dist*50,w=sizeOf(it).w;return x<viewWidth+300&&x+w>-300;};
 // ---- 화면 상태를 매 프레임 편집 상태로 맞춤 ----
 function sync(){runner.status='running';paused=true;cd=0;runner.distance=dist;runner.x=140;runner.y=0;runner.vy=0;runner.invulnerable=0;runner.coins=[];
  runner.obstacles=items.filter(visible).map(toObs);try{overlay.hidden=true;}catch(e){}if(window.pad)pad.hidden=true;}
 // ---- 편집 창 ----
 const st=document.createElement('style');st.textContent=`.ed{margin:14px auto 40px;max-width:1060px;padding:0 12px;font-size:14px;color:#594c43}.ed h2{margin:6px 0 2px;font-size:18px}.ed .sub{margin:0 0 10px;font-size:12px;color:#8b766b}
.ed .row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0}.ed button{border:0;font:inherit;font-weight:bold;font-size:13px;padding:8px 11px;border-radius:11px;background:#fff;color:#594c43;box-shadow:0 2px 0 #e2d6c6;cursor:pointer}.ed button.on{background:#8fc3e0;color:#fff;box-shadow:0 2px 0 #6fa6c4}.ed button.go{background:#f2a7b5;color:#fff;box-shadow:0 2px 0 #c8808f}.ed button.warn{background:#e58c9c;color:#fff;box-shadow:0 2px 0 #c06a7a}
.ed .tag{font-size:12px;color:#8b766b;margin-right:2px}.ed input[type=range]{flex:1;min-width:200px;accent-color:#8fc3e0}.ed textarea{width:100%;min-height:90px;border:2px solid #e2d6c6;border-radius:12px;padding:8px;font:11px/1.4 ui-monospace,monospace;color:#594c43;box-sizing:border-box}
.ed .mini{width:100%;height:34px;background:#fff;border-radius:10px;box-shadow:0 2px 0 #e2d6c6;cursor:pointer;display:block}.ed .info{min-height:1.5em;font-weight:bold}.ed .box{background:#fffaf0;border-radius:14px;padding:10px 12px;margin:8px 0;box-shadow:0 2px 0 #eadfce}
.ed [hidden]{display:none!important}#tools,.tools{display:flex;flex-wrap:wrap;gap:6px}.ed .tl{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;width:78px;min-height:74px;padding:5px 4px}.ed .tl .th{width:60px;height:46px;object-fit:contain}.ed .tl .emo{display:grid;place-items:center;font-size:20px}.ed .tl small{font-size:10px;line-height:1.15;margin-top:2px;text-align:center;word-break:break-all}#objGrid{max-height:230px;overflow:auto;padding:4px}#objTabs button.on{background:#8fc3e0;color:#fff}.ed [hidden]{display:none!important}.ed .dock{position:sticky;top:0;z-index:8;background:#faf6efee;backdrop-filter:blur(4px);padding:4px 0 2px;border-bottom:1px solid #eadfce}.ed .dock .box{margin:4px 0}#edOv{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}.game-shell{position:relative}body.editing canvas#game{cursor:crosshair}`;document.head.append(st);
 document.body.classList.add('editing');
 const shell=$('.game-shell'),ov=document.createElement('canvas');ov.id='edOv';shell.append(ov);
 const panel=document.createElement('section');panel.className='ed';
 panel.innerHTML=`<h2>🛠 달리기 맵 편집 — ${runner.stage&&({friend:'친구 인형',shopkeeper:'실 가게 사장님',parkfriend:'공원 친구',angel:'천사 세진이',sejin:'세진이'})[STAGE]||STAGE}</h2>
<p class="sub">위 화면을 눌러 놓아요. 구멍·발판·매달린 것을 고르면 오른쪽 끝에 ↔ 손잡이가 생겨요 — 끌어서 길이를 바꿔요. 놓은 걸 누르면 선택돼서 끌어 옮기거나 크기를 바꿀 수 있어요. 세진이는 왼쪽 끝에서 오른쪽으로 달려요(눈금: m, 목표 ${GOAL}m).</p>
<div class="row"><span class="tag">무엇을 놓을까?</span><span id="tools"></span></div>
<div class="row"><button id="bm20">⏪ −20m</button><button id="bm5">◀ −5m</button><input type="range" id="pos" min="0" max="${GOAL}" step="0.5" value="0" aria-label="위치"><button id="bp5">▶ +5m</button><button id="bp20">⏩ +20m</button><b id="posv">0m</b></div>
<canvas class="mini" id="mini" aria-label="전체 지도"></canvas>
<div class="box"><div class="info" id="info">선택한 게 없어요.</div><div class="row" id="selrow" hidden>
<span class="tag">크기</span><button id="szm">작게 −</button><button id="szp">크게 ＋</button><span class="tag">위치</span><button id="atm">◀ 0.5m</button><button id="atp">0.5m ▶</button>
<span id="wrow"><span class="tag">폭</span><button id="wdm">좁게</button><button id="wdp">넓게</button></span><span id="hrow"><span class="tag">높이</span><button id="htp">▲</button><button id="htm">▼</button></span><button id="vv">🎨 모양 바꾸기</button><button id="onp">⬆ 발판 위/바닥 바꾸기</button><button class="warn" id="del">삭제</button></div></div>
<div class="row"><button id="auto" class="go">✨ 자동으로 처음 배치 만들기</button><button id="save" class="on">💾 저장</button><button id="play" class="go">▶ 이 배치로 시험 플레이</button><button id="clear" class="warn">전체 지우기</button><button id="reset">저장본 지우고 무작위로</button><button id="guide" class="on">점선·눈금 보기</button></div>
<div class="info" id="msg"></div>
<div class="box"><div class="tag">모두에게 적용하려면: 아래 글자를 복사해서 알려 주세요(runner-layouts.js에 넣어요). 다른 걸 불러오려면 붙여 넣고 '가져오기'.</div><textarea id="json" aria-label="배치 글자"></textarea><div class="row"><button id="exp">내보내기(글자 만들기·복사)</button><button id="imp">가져오기</button></div></div>`;
 shell.after(panel);
 const mapNav=document.createElement('nav');mapNav.className='row';mapNav.setAttribute('aria-label','편집할 맵 선택');
 for(const [id,name] of [['sejin','세진이 작업실'],['friend','친구집'],['shopkeeper','실가게'],['parkfriend','공원 산책로'],['angel','천사 구름길']]){
  const link=document.createElement('a'),params=new URLSearchParams(location.search);params.set('doll',id);params.set('edit','1');
  link.textContent=name;link.href='knit.html?'+params.toString();link.className='secondary';
  link.onclick=()=>{try{sessionStorage.setItem('sejin-runner-edit-draft-'+STAGE,JSON.stringify({items,position:dist}));}catch(e){}};
  link.style.cssText='display:inline-block;padding:10px 14px;border:2px solid #e2d6c6;border-radius:12px;text-decoration:none;background:'+(id===STAGE?'#d7edf7':'white');
  if(id===STAGE)link.setAttribute('aria-current','page');mapNav.append(link);
 }
 panel.querySelector('h2').after(mapNav);
 // ---- 그림으로 고르는 도구 상자 ----
 const SET={sejin:'work',friend:'home',shopkeeper:'shop',parkfriend:'park',angel:'angel'}[STAGE]||'work';
 const cand=(k)=>{const t=k==='platform'?['platform-full-v32','platform-full-v27','platform-full-v25','platform-L-v2']:[k+'-v25',k+'-v2'];return t.map(x=>'assets/runner/'+SET+'/'+SET+'-'+x+'.png');};
 const TOOLS=[['select','✋','선택·이동',null],['ball','공','굴러오는 공',cand('ball')],['cone','콘','콘',cand('cone')],['awl','송곳','송곳',cand('awl')],['scissors','가위','가위(키 큼)',cand('scissors')],['triangle','삼각자','삼각자(키 큼)',cand('triangle')],['ruler','자','긴 자',cand('ruler')],['pit','구멍','구멍',null],['hang','매달림','매달린 것',cand('hang')],['pl1','발판','발판 1층',cand('platform')],['pl2','발판','발판 2층',cand('platform')]];
 const holeIcon='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 40"><rect x="0" y="10" width="18" height="30" fill="#e8a870" stroke="#8a5a3a" stroke-width="2"/><rect x="42" y="10" width="18" height="30" fill="#e8a870" stroke="#8a5a3a" stroke-width="2"/><path d="M18 14v24M42 14v24" stroke="#8a5a3a" stroke-dasharray="3 3"/></svg>');
 const thumb=(c,alt)=>{const im=document.createElement('img');im.alt=alt;im.className='th';let i=0;im.onerror=()=>{i++;if(c&&i<c.length)im.src=c[i];else im.style.visibility='hidden';};im.src=c&&c.length?c[0]:holeIcon;return im;};
 const tb=$('#tools');tb.className='tools';
 TOOLS.forEach(([id,lab,tt,c])=>{const b=document.createElement('button');b.dataset.t=id;b.title=tt;b.className='tl'+(id===tool?' on':'');if(c||id==='pit'){b.append(thumb(c,tt));}else{const em=document.createElement('span');em.className='th emo';em.textContent=lab;b.append(em);}const sp=document.createElement('small');sp.textContent=tt;b.append(sp);tb.append(b);});
 let customObj=null;const objTools=[];
 // 이 맵 전용 소품(꽃 덤불·통나무·책장·찻장·꽃병·실 진열대·보라 기둥·꽃 아치 등)을 도구 상자에 바로 보이게
 const STD=/-(cone|awl|scissors|triangle|ruler|ball|hang|strand|tangle)(-[a-z]+)?-v[0-9]+[.]png$/;
 const specials=((window.RUNNER_IMAGES||{})[SET]||[]).filter(p=>/-v(2[5-9]|3[0-9])[.]png$/.test(p)&&!STD.test(p));
 if(specials.length){const lab=document.createElement('div');lab.className='tag';lab.style.cssText='width:100%;margin-top:4px';lab.textContent='이 맵 전용 소품 (눌러서 놓기 · 부딪히는 물건으로 놓여요)';tb.append(lab);
  specials.forEach(p=>{const b=document.createElement('button');b.className='tl';b.title=p;b.dataset.sp=p;const im=document.createElement('img');im.className='th';im.src='assets/'+p;b.append(im);const sp=document.createElement('small');sp.textContent=p.split('/').pop().replace(SET+'-','').replace(/-v[0-9]+[.]png$/,'');b.append(sp);tb.append(b);});
  tb.addEventListener('click',e=>{const b=e.target.closest('button[data-sp]');if(!b)return;const p=b.dataset.sp,im=new Image();im.onload=()=>{customObj={img:p,ar:im.naturalWidth/im.naturalHeight};tool='obj';[...document.querySelectorAll('#tools .tl,#objGrid .tl')].forEach(x=>x.classList.toggle('on',x===b));msg('위 화면에서 놓을 곳을 눌러요: '+p.split('/').pop());};im.src='assets/'+p;});}
 tb.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.dataset.sp)return;tool=b.dataset.t;customObj=null;[...document.querySelectorAll('#tools .tl,#objGrid .tl')].forEach(x=>x.classList.toggle('on',x===b));});
 // ---- 내 그림 추가: 맵 폴더·선물·아이템·공방 소품 그림을 오브젝트로 ----
 const IM=window.RUNNER_IMAGES||{};
 const GROUPS=[['이 맵 그림',IM[SET]||[]],['공통',IM.common||[]],['선물',IM.gifts||[]],['아이템',IM.items||[]],['공방 소품',IM.craft||[]]].filter(g=>g[1].length);
 const objBox=document.createElement('div');objBox.className='box';objBox.innerHTML='<b>➕ 내 그림을 오브젝트로 추가</b> <span class="tag">그림을 누르고 위 화면의 놓을 곳을 눌러요. 놓은 뒤 크기·위치·부딪힘을 바꿀 수 있어요.</span><div class="row"><label><input type="checkbox" id="hitChk" checked> 부딪히는 물건 (끄면 장식)</label></div><div id="objTabs" class="row"></div><div id="objGrid" class="tools"></div>';
 $('#tools').closest('.row').after(objBox);
 let curGroup=0;const objPrev=new Map();
 function showGroup(i){curGroup=i;[...$('#objTabs').children].forEach((x,k)=>x.classList.toggle('on',k===i));const g=$('#objGrid');g.innerHTML='';GROUPS[i][1].forEach(p=>{const b=document.createElement('button');b.className='tl';b.title=p;b.dataset.p=p;const im=document.createElement('img');im.className='th';im.loading='lazy';im.src='assets/'+p;b.append(im);const sp=document.createElement('small');sp.textContent=p.split('/').pop().replace(/-v[0-9]+[.]png$/,'');b.append(sp);g.append(b);});}
 GROUPS.forEach(([n,l],i)=>{const b=document.createElement('button');b.textContent=n+' '+l.length;b.onclick=()=>showGroup(i);$('#objTabs').append(b);});
 if(GROUPS.length)showGroup(0);else $('#objGrid').textContent='추가할 그림이 없어요(node make-runner-images.cjs).';
 $('#objGrid').addEventListener('click',e=>{const b=e.target.closest('button.tl');if(!b)return;const p=b.dataset.p,im=new Image();im.onload=()=>{customObj={img:p,ar:im.naturalWidth/im.naturalHeight};tool='obj';[...document.querySelectorAll('#tools .tl,#objGrid .tl')].forEach(x=>x.classList.toggle('on',x===b));msg('위 화면에서 놓을 곳을 눌러요: '+p.split('/').pop());};im.src='assets/'+p;});
 const msg=t=>{$('#msg').textContent=t||'';};
 // ---- 위치 ----
 const setDist=v=>{dist=clamp(Math.round(v*2)/2,0,GOAL);$('#pos').value=dist;$('#posv').textContent=dist+'m';};
 setDist(dist);
 $('#pos').oninput=e=>setDist(+e.target.value);
 [['bm20',-20],['bm5',-5],['bp5',5],['bp20',20]].forEach(([id,d])=>$('#'+id).onclick=()=>setDist(dist+d));
 canvas.addEventListener('wheel',e=>{e.preventDefault();setDist(dist+e.deltaY*.05);},{passive:false});
 // ---- 선택 · 조작 ----
 const cur=()=>items[sel];
 function refresh(){const it=cur(),row=$('#selrow');
  if(!it){$('#info').textContent='선택한 게 없어요. 위 화면의 물건을 누르거나, 위에서 종류를 골라 빈 곳을 눌러 놓아요.';row.hidden=true;return;}
  row.hidden=false;const z=sizeOf(it),isK=isObj(it),isP=it.k==='platform',isH=it.k==='hang';
  $('#info').textContent=`${it.v==='bookcase'?'책장 (부딪히는 장애물)':LABEL[isP?(it.sb?'blk':it.y>=180?'pl2':'pl1'):it.k]||it.k} · 위치 ${it.at}m · 폭 ${z.w}${isK?' · 크기 ×'+(it.s||1).toFixed(1)+(it.oy?' · 발판 위('+it.oy+')':''):''}${isP?' · 높이 '+it.y:''}${isH?' · 바닥에서 '+(it.bottom||64):''}`;
  $('#szm').hidden=$('#szp').hidden=!isK;$('#wrow').hidden=isK;$('#hrow').hidden=!(isP||isH);$('#vv').hidden=!isK;$('#onp').hidden=!isK||it.k==='ball';{const isO=it.k==='obj';$('#hitb').hidden=!isO;if(!isO){$('#stepb').hidden=$('#big2').hidden=$('#big3').hidden=true;}if(isO){$('#vv').hidden=true;$('#hitb').textContent=it.hit===false?'🚫 지금 장식 → 부딪히게':'💥 지금 부딪힘 → 장식으로';$('#stepb').hidden=it.hit===false;$('#stepb').textContent=it.step?'🪜 지금 밟기 가능 → 끄기':'🪜 밟고 올라가게(발판처럼)';$('#big2').hidden=$('#big3').hidden=false;$('#info').textContent='내 그림 ('+(it.hit===false?'장식':'부딪힘')+') · 위치 '+it.at+'m · 크기 ×'+(it.s||1).toFixed(1)+(it.oy?' · 발판 위('+it.oy+')':'')+(it.step?' · 밟을 수 있음'+((it.oy||0)+sizeOf(it).h>230?' ⚠ 너무 높아서 못 올라가요':''):'')+' · '+it.img.split('/').pop();}}}
 const resizable=it=>it&&(it.k==='pit'||it.k==='platform'||it.k==='hang');
 function select(i){sel=i;refresh();}
 function change(fn){const it=cur();if(!it)return;fn(it);refresh();}
 $('#szm').onclick=()=>change(it=>{it.s=clamp(Math.round(((it.s||1)-.1)*10)/10,.5,(it.v==='bookcase'||it.k==='obj')?(it.k==='obj'?6:3.5):2.5);});
 $('#szp').onclick=()=>change(it=>{it.s=clamp(Math.round(((it.s||1)+.1)*10)/10,.5,(it.v==='bookcase'||it.k==='obj')?(it.k==='obj'?6:3.5):2.5);});
 $('#atm').onclick=()=>change(it=>{it.at=Math.max(0,snap(it.at-.5));});$('#atp').onclick=()=>change(it=>{it.at=Math.min(GOAL,snap(it.at+.5));});
 $('#wdm').onclick=()=>change(it=>{it.w=clamp((it.w||sizeOf(it).w)-10,60,800);});$('#wdp').onclick=()=>change(it=>{it.w=clamp((it.w||sizeOf(it).w)+10,60,800);});
 $('#htp').onclick=()=>change(it=>{if(it.k==='pit')it.wl=clamp((it.wl===undefined?12:it.wl)-6,-12,70);else if(it.k==='hang')it.bottom=clamp((it.bottom||64)+8,40,150);else it.y=clamp((it.y||120)+20,60,300);});
 $('#htm').onclick=()=>change(it=>{if(it.k==='pit')it.wl=clamp((it.wl===undefined?12:it.wl)+6,-12,70);else if(it.k==='hang')it.bottom=clamp((it.bottom||64)-8,40,150);else it.y=clamp((it.y||120)-20,60,300);});
 $('#vv').onclick=()=>change(it=>{const p=(window.RunnerArt&&RunnerArt.pool)?RunnerArt.pool(STAGE,it.k):[];if(p.length<2){msg('이 장애물은 모양이 하나뿐이에요.');return;}const i=p.indexOf(it.v||'');it.v=p[(i+1)%p.length];msg('모양: '+it.v);});
 // 소품이 올라설 수 있는 높이들: 바닥(0)과, 그 소품의 가운데가 걸쳐 있는 발판들의 높이
 function levelsAt(it){const z=sizeOf(it),c=it.at+z.w/100,out=[0];items.forEach(p=>{if(p.k==='platform'){const pw=(p.w||380)/50;if(c>=p.at&&c<=p.at+pw)out.push(p.y||120);}});return [...new Set(out)].sort((a,b)=>a-b);}
 $('#onp').onclick=()=>change(it=>{const L=levelsAt(it);if(L.length<2){msg('이 아래에 발판이 없어요. 발판 위에 놓으려면 먼저 발판을 놓고, 그 위로 소품을 옮겨 주세요.');it.oy=0;return;}const i=L.indexOf(it.oy||0);it.oy=L[(i+1)%L.length];msg(it.oy?'발판 위에 올렸어요.':'바닥으로 내렸어요.');});
 {const hb=document.createElement('button');hb.id='hitb';hb.hidden=true;$('#del').before(hb);hb.onclick=()=>change(it=>{it.hit=it.hit===false;if(it.hit===false)it.step=false;});
  const sb=document.createElement('button');sb.id='stepb';sb.hidden=true;$('#del').before(sb);sb.onclick=()=>change(it=>{it.step=!it.step;});
  for(const [id,lab,v] of [['big2','큼 ×2',2],['big3','아주 큼 ×3',3]]){const b=document.createElement('button');b.id=id;b.hidden=true;b.textContent=lab;$('#del').before(b);b.onclick=()=>change(it=>{it.s=v;});}}
 $('#del').onclick=()=>{if(sel<0)return;items.splice(sel,1);select(-1);};
 addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test((e.target.tagName||'')))return;
  if((e.key==='Delete'||e.key==='Backspace')&&sel>=0){e.preventDefault();$('#del').onclick();}
  else if(e.key==='ArrowLeft'&&sel>=0){e.preventDefault();change(it=>{it.at=Math.max(0,snap(it.at-(e.shiftKey?5:.5)));});}
  else if(e.key==='ArrowRight'&&sel>=0){e.preventDefault();change(it=>{it.at=Math.min(GOAL,snap(it.at+(e.shiftKey?5:.5)));});}
  else if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setDist(dist+(e.key==='ArrowLeft'?-5:5));}},true);
 // ---- 화면에서 누르기 ----
 function pt(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*viewWidth,y:(e.clientY-r.top)/r.height*viewHeight};}
 function hit(p){for(let i=items.length-1;i>=0;i--){const r=rectOf(items[i]);if(p.x>=r[0]-6&&p.x<=r[0]+r[2]+6&&p.y>=r[1]-6&&p.y<=r[1]+r[3]+6)return i;}return -1;}
 addEventListener('pointerdown',e=>{if(e.target!==canvas)return;e.stopImmediatePropagation();e.preventDefault();
  const p=pt(e);
  // 선택한 구멍·발판·매달린 것은 오른쪽 끝 손잡이를 끌어 길이를 바꾼다
  if(sel>=0&&resizable(items[sel])){const q=rectOf(items[sel]),hx=q[0]+q[2],hy=q[1]+q[3]/2;if(Math.abs(p.x-hx)<16&&Math.abs(p.y-Math.min(hy,floorY()-20))<40){drag={resize:true,x0:q[0]};return;}}
  const h=hit(p);
  if(h>=0){select(h);drag={off:p.x-(items[h].at*50-dist*50)};return;}
  if(tool==='select'){select(-1);return;}
  const d=DEF[tool],it=tool==='obj'&&customObj?{k:'obj',img:customObj.img,ar:customObj.ar,h0:80,s:1,hit:$('#hitChk').checked}:d?{...d}:{k:tool};if(tool==='obj'&&!customObj){msg('먼저 아래에서 그림을 골라요.');return;}it.at=Math.max(0,snap(dist+p.x/50));if(it.k==='pit')it.at=Math.round(it.at/2)*2;if(isObj(it)&&it.k!=='ball'){const L=levelsAt(it),hgt=floorY()-p.y;let best=0;L.forEach(y=>{if(Math.abs(y-hgt)<Math.abs(best-hgt))best=y;});if(Math.abs(best-hgt)<80)it.oy=best;}items.push(it);select(items.length-1);},true);
 addEventListener('pointermove',e=>{if(!drag||sel<0)return;const p=pt(e),it=cur();
  if(drag.resize){it.w=clamp(Math.round((p.x-drag.x0)/(it.k==='pit'?100:10))*(it.k==='pit'?100:10),it.k==='pit'?100:60,800);refresh();return;}it.at=clamp(snap(dist+(p.x-drag.off)/50),0,GOAL);if(it.k==='pit')it.at=Math.round(it.at/2)*2;if(isObj(it)&&it.k!=='ball'){const L=levelsAt(it),hgt=floorY()-p.y;let best=0;L.forEach(y=>{if(Math.abs(y-hgt)<Math.abs(best-hgt))best=y;});it.oy=Math.abs(best-hgt)<80?best:0;}refresh();},true);
 addEventListener('pointerup',()=>{drag=null;},true);
 // ---- 자동 · 저장 · 내보내기 ----
 function autoGen(){const r=new Runner(Math.random,STAGE);r.reset();r.status='running';const seen=new Set(),out=[];let n=0;
  while(r.distance<r.goal-10&&n<60*500){r.invulnerable=9999;r.health=3;r.update(1/60);n++;
   for(const o of r.obstacles){if(seen.has(o))continue;seen.add(o);const it={at:Math.round((r.distance+o.x/50)*2)/2};
    if(o.kind==='platform'){it.k='platform';it.w=o.w;it.y=o.y;}else if(o.kind==='pit'){it.k='pit';it.w=o.w;}else if(o.kind==='hang'){it.k='hang';it.w=o.w;it.bottom=o.bottom;}else it.k=o.kind;out.push(it);}}
  return out;}
 const armed={};function twice(id,text){if(armed[id]){clearTimeout(armed[id].t);armed[id].btn.textContent=armed[id].old;armed[id]=null;return true;}const btn=$(id);armed[id]={btn,old:btn.textContent,t:setTimeout(()=>{if(armed[id]){btn.textContent=armed[id].old;armed[id]=null;}},4000)};btn.textContent='⚠ 한 번 더!';msg(text);return false;}
 $('#auto').onclick=()=>{if(items.length&&!twice('#auto','지금 놓은 것이 모두 사라지고 새로 만들어져요. 한 번 더 누르면 실행'))return;items=autoGen();items.sort((a,b)=>a.at-b.at);select(-1);msg(`처음 배치를 ${items.length}개 만들었어요. 이제 마음대로 고쳐 보세요!`);};
 let guides=true;$('#guide').onclick=()=>{guides=!guides;$('#guide').classList.toggle('on',guides);};
 $('#save').onclick=save;
 $('#play').onclick=()=>{save();location.href='knit.html?doll='+STAGE+'&test=on';};
 $('#clear').onclick=()=>{if(items.length&&!twice('#clear','모두 지워져요. 한 번 더 누르면 실행'))return;items=[];select(-1);};
 $('#reset').onclick=()=>{if(!twice('#reset','저장본을 지우고 무작위로 돌아가요. 한 번 더 누르면 실행'))return;try{localStorage.removeItem(KEY);}catch(e){}msg('저장본을 지웠어요.');};
 $('#exp').onclick=async()=>{const t=JSON.stringify({v:1,stage:STAGE,items:items.slice().sort((a,b)=>a.at-b.at)});$('#json').value=t;$('#json').select();try{await navigator.clipboard.writeText(t);msg('복사했어요! 이 글자를 알려 주세요.');}catch(e){msg('아래 글자를 직접 복사해 주세요.');}};
 $('#imp').onclick=()=>{try{const o=JSON.parse($('#json').value);if(!o||!Array.isArray(o.items))throw 0;items=o.items;select(-1);msg('가져왔어요('+items.length+'개).');}catch(e){msg('글자 형식이 맞지 않아요.');}};
 // ---- 미니 지도 + 겹침 경고 ----
 const mini=$('#mini');let warn=new Set();
 function checkWarn(){warn=new Set();const g=items.map((it,i)=>({it,i,z:sizeOf(it)})).filter(o=>o.it.k!=='platform').sort((a,b)=>a.it.at-b.it.at);
  for(let j=1;j<g.length;j++){const a=g[j-1],b=g[j],gapPx=(b.it.at-(a.it.at+a.z.w/50))*50;if(gapPx<SPEED*GAPS*.75){warn.add(a.i);warn.add(b.i);}}
  items.forEach((it,i)=>{if(it.oy&&levelsAt(it).indexOf(it.oy)<0)warn.add(i);});   // 발판 위로 올렸는데 아래에 발판이 없으면(공중에 뜸) 빨갛게
  if(items.some(i=>i.at<14&&i.k!=='platform'))items.forEach((it,i)=>{if(it.at<14&&it.k!=='platform')warn.add(i);});}
 function drawMini(){const w=mini.clientWidth,h=mini.clientHeight;if(mini.width!==w)mini.width=w;if(mini.height!==h)mini.height=h;const g=mini.getContext('2d');g.clearRect(0,0,w,h);
  g.fillStyle='#f5ecdf';g.fillRect(0,0,w,h);const X=m=>m/GOAL*w;
  items.forEach((it,i)=>{const z=sizeOf(it);g.fillStyle=warn.has(i)?'#e0506a':it.k==='pit'?'#4aa3d8':it.k==='platform'?'#7cc07a':it.k==='hang'?'#b98a5a':'#8a6f60';
   g.fillRect(X(it.at),it.k==='platform'?2:h*.45,Math.max(2,X(z.w/50)),it.k==='platform'?h*.35:h*.45);});
  g.strokeStyle='#f2a7b5';g.lineWidth=2;const vw=viewWidth/50;g.strokeRect(X(dist),1,Math.max(6,X(vw)),h-2);}
 mini.addEventListener('pointerdown',e=>{const r=mini.getBoundingClientRect();setDist((e.clientX-r.left)/r.width*GOAL-viewWidth/100);});
 // ---- 화면 위 표시(윤곽·선택) ----
 function drawHandle(g,kx,ky){if(sel>=0&&resizable(items[sel])&&visible(items[sel])){const q=rectOf(items[sel]),hx=(q[0]+q[2])*kx,hy=Math.min(q[1]+q[3]/2,floorY()-20)*ky;g.setLineDash([]);g.fillStyle='#f2a7b5';g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.arc(hx,hy,8,0,6.3);g.fill();g.stroke();g.fillStyle='#fff';g.font='bold 10px sans-serif';g.fillText('↔',hx-5,hy+3.5);}}
 function drawOv(){const r=canvas.getBoundingClientRect(),sr=shell.getBoundingClientRect();ov.style.left=(r.left-sr.left)+'px';ov.style.top=(r.top-sr.top)+'px';ov.style.width=r.width+'px';ov.style.height=r.height+'px';
  if(ov.width!==Math.round(r.width)||ov.height!==Math.round(r.height)){ov.width=Math.round(r.width);ov.height=Math.round(r.height);}
  const g=ov.getContext('2d'),kx=ov.width/viewWidth,ky=ov.height/viewHeight;g.clearRect(0,0,ov.width,ov.height);if(!guides){if(sel>=0&&items[sel]&&visible(items[sel])){const q=rectOf(items[sel]);g.strokeStyle='#f2a7b5';g.lineWidth=2;g.setLineDash([]);g.strokeRect(q[0]*kx,q[1]*ky,q[2]*kx,q[3]*ky);}drawHandle(g,kx,ky);return;}g.setLineDash([5,4]);
  items.forEach((it,i)=>{if(!visible(it))return;const q=rectOf(it);g.lineWidth=i===sel?3:1.5;g.setLineDash(i===sel?[]:[5,4]);g.strokeStyle=i===sel?'#f2a7b5':warn.has(i)?'#e0506a':'#ffffffcc';g.strokeRect(q[0]*kx,q[1]*ky,q[2]*kx,q[3]*ky);
   if(i===sel||warn.has(i)){g.fillStyle=i===sel?'#f2a7b5':'#e0506a';g.font='bold 12px sans-serif';g.fillText(it.at+'m',q[0]*kx+3,Math.max(12,q[1]*ky-4));}});
  drawHandle(g,kx,ky);
  // 세진이 위치 기준선과 격자 눈금(5m마다)
  g.setLineDash([]);g.lineWidth=1;g.fillStyle='#ffffffaa';g.strokeStyle='#ffffff66';g.font='11px sans-serif';
  for(let m=Math.ceil(dist/5)*5;m*50-dist*50<viewWidth;m+=5){const x=(m*50-dist*50)*kx;g.beginPath();g.moveTo(x,ov.height-16);g.lineTo(x,ov.height);g.stroke();g.fillText(m+'m',x+2,ov.height-4);}}
 (function loop(){sync();checkWarn();drawMini();drawOv();$('#warn')&&0;requestAnimationFrame(loop);})();
 // 위치 슬라이더·전체 지도·선택 정보를 게임 화면 바로 아래로(도구 상자가 길어도 화면과 같이 보이게)
 {const first=panel.firstElementChild,rowEl=$('#pos').closest('.row'),infoBox=$('#info').closest('.box'),mn=$('#mini');const wrap=document.createElement('div');wrap.className='dock';const qa=document.createElement('div');qa.className='row';qa.innerHTML='<button class="go" id="qPlay">▶ 시험 플레이 (게임 화면으로)</button><button class="on" id="qSave">💾 저장</button><button id="qAuto">✨ 자동 배치로 채우기</button><button class="warn" id="qClear">🧹 비우고 직접 만들기</button>';wrap.append(qa,rowEl,mn,infoBox);qa.querySelector('#qPlay').onclick=()=>$('#play').click();qa.querySelector('#qSave').onclick=()=>$('#save').click();qa.querySelector('#qAuto').onclick=()=>$('#auto').click();qa.querySelector('#qClear').onclick=()=>$('#clear').click();panel.insertBefore(wrap,first);}
 // 시작 전 안내 카드·설정 톱니 숨김
 const cs=document.createElement('style');cs.textContent='.game-shell .overlay,#settings,.pad{display:none!important}';document.head.append(cs);
 window.__ed={get sel(){return sel;},get items(){return items;},rectOf,pt,floorY};
 refresh();setDist(dist);
 if(!items.length)msg('아직 비어 있어요. 위에서 종류를 고르고 화면을 눌러 놓거나, "자동으로 처음 배치 만들기"로 시작해 보세요.');
})();
