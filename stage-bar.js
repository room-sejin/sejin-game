/* Stage picker shared by the place games (공원 틀린 그림 · 광장 리본 · 친구네 집 퍼즐) and the 뜨개 달리기 (knit.html).
   Progress: SejinSave.stages (game → {stageNo: best stars 1..3}). A stage opens when the one before has been cleared
   (test mode opens all).
   - StageBar.mount(el,{game,names,subs?,current,onPick,autoOpen}) draws a small header ("🗺 스테이지 선택" + where you are)
     and, with autoOpen, the full stage-select screen right away. Returns {current, refresh(), open()}.
   - StageBar.select({title,items,current,onPick}) shows the full-screen select map for any list of
     items [{no,name,sub,stars,locked}] (used by knit.html for the doll stages).
   - StageBar.splash(no,name,sub) shows a short "STAGE n" title card between stages.
   - StageBar.clear(game,no,stars) saves a clear → {first, prev}. */
(()=>{
 'use strict';
 const css=`.sb-head{display:flex;align-items:center;gap:10px;margin:0 0 10px}
.sb-head button{flex:none;border:2px solid #fff;background:#8fc3e0;color:#fff;font:inherit;font-size:13px;font-weight:bold;padding:8px 14px;border-radius:14px;box-shadow:0 3px 0 #6fa6c4;cursor:pointer}
.sb-head .where{flex:1;min-width:0;font-size:13px;font-weight:bold;color:#5b4a42;line-height:1.35}.sb-head .where small{display:block;font-weight:normal;color:#8b766b;font-size:11px}
.sb-head .dots{display:flex;gap:4px}.sb-head .dots i{width:9px;height:9px;border-radius:50%;background:#e9d8c8}.sb-head .dots i.on{background:#f5c04a}.sb-head .dots i.cur{box-shadow:0 0 0 2px #8fc3e0}
.sb-screen{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;align-items:center;background:linear-gradient(#fdeef1,#e8f3f7 55%,#eef7ea);padding:18px 16px 22px;overflow:auto;font-family:"Pretendard","Apple SD Gothic Neo","Malgun Gothic",system-ui,sans-serif;color:#5b4a42}
.sb-screen h2{margin:6px 0 0;font-size:22px}.sb-screen p.sub{margin:4px 0 14px;font-size:12.5px;color:#8b766b}
.sb-top{display:flex;align-items:center;gap:12px;margin:2px 0 4px}.sb-top i{width:54px;aspect-ratio:.806;background:url(assets/character/base-v1.png) 51% 58.5%/150.9% 128.1% no-repeat;animation:sbhop 1.6s ease-in-out infinite;flex:none}
.sb-top h2{margin:0}
.sb-list{display:grid;gap:12px;width:min(100%,460px);padding:6px 2px 4px}
.sb-card{position:relative;display:flex;align-items:center;gap:14px;width:100%;border:3px solid #8a6f60;border-radius:20px;background:#fffdf8;color:inherit;font:inherit;text-align:left;padding:12px 14px;box-shadow:0 5px 0 #e0d2c2;cursor:pointer;transition:transform .15s}
.sb-card:hover:not(.locked),.sb-card:focus-visible{transform:translateY(-2px)}
.sb-card .no{flex:none;display:grid;place-items:center;width:52px;height:52px;border-radius:16px;background:#e3f0f7;border:3px solid #8a6f60;font-size:23px;font-weight:bold;transform:rotate(-4deg)}
.sb-card:nth-child(even) .no{transform:rotate(4deg)}
.sb-card .tx{flex:1;min-width:0}.sb-card .tx b{display:block;font-size:16px}.sb-card .tx small{display:block;color:#8b766b;font-size:12px;line-height:1.35;margin-top:2px}
.sb-card .st{flex:none;text-align:right;color:#f5c04a;letter-spacing:1px;font-size:16px;white-space:nowrap}.sb-card .go{flex:none;color:#8fc3e0;font-size:26px;font-weight:bold}
.sb-card.done{background:#fffaf0}.sb-card.done .no{background:#fff0bd}
.sb-card.cur{background:#f1faf6;box-shadow:0 5px 0 #b8dccf,0 0 0 4px #bfe3d6}.sb-card.cur .no{background:#cdebdf}
.sb-card.locked{cursor:default;background:#f4eee8;border-color:#bfb2a6;box-shadow:0 4px 0 #ddd2c7;opacity:.85}.sb-card.locked .no{background:#e8e0d8;border-color:#bfb2a6;color:#b3a396}
.sb-card .new{position:absolute;right:-6px;top:-10px;background:#f2a7b5;color:#fff;font-size:11px;font-weight:bold;padding:2px 9px;border-radius:10px;border:2px solid #fff;transform:rotate(5deg)}
@keyframes sbhop{50%{transform:translateY(-6px)}}.sb-actions{display:flex;gap:8px;margin-top:6px}
.sb-actions button{border:0;font:inherit;font-weight:bold;font-size:14px;padding:11px 20px;border-radius:14px;background:#fff;color:#5b4a42;box-shadow:0 3px 0 #e9d8c8;cursor:pointer}
.sb-actions .gostart{background:#8fc3e0;color:#fff;box-shadow:0 3px 0 #6fa6c4}
@keyframes sbpulse{50%{transform:scale(1.1)}}@keyframes sbhop{50%{transform:translateX(-50%) translateY(-6px)}}
.sb-splash{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:#fff8;pointer-events:none;text-align:center;color:#5b4a42;font-family:"Pretendard","Malgun Gothic",system-ui,sans-serif}
.sb-splash div{background:#fffaf0;border:3px solid #f5d58a;border-radius:24px;padding:18px 34px;box-shadow:0 10px 30px #88756733}
.sb-splash em{display:block;font-style:normal;font-size:12px;letter-spacing:3px;color:#8b766b}.sb-splash b{display:block;font-size:26px;margin:2px 0}.sb-splash small{color:#8b766b}
@media (prefers-reduced-motion:reduce){.sb-node.cur .dot,.sb-node .me{animation:none}}`;
 const stars=n=>'★'.repeat(n)+'☆'.repeat(3-n);
 const addCss=()=>{if(!document.getElementById('stagebarStyle')){const s=document.createElement('style');s.id='stagebarStyle';s.textContent=css;document.head.append(s);}};
 // The full-screen select map: nodes in rows of 3, every other row runs backwards like a snake.
 function select(opt){
  addCss();document.querySelectorAll('.sb-screen').forEach(e=>e.remove());
  const el=document.createElement('div');el.className='sb-screen';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','스테이지 선택');
  const items=opt.items,cur=opt.current||1;
  el.innerHTML=`<div class="sb-top"><i></i><h2>${opt.title||'스테이지 선택'}</h2></div><p class="sub">${opt.sub||'가고 싶은 스테이지를 눌러요. 앞 스테이지를 클리어하면 다음이 열려요.'}</p><div class="sb-list">`+
   items.map(it=>`<button class="sb-card${it.stars?' done':''}${it.locked?' locked':''}${it.no===cur?' cur':''}" data-n="${it.no}"${it.locked?' disabled':''} aria-label="${it.no}번 ${it.name}${it.locked?' 잠김':''}">${it.no===cur&&!it.stars&&!it.locked?'<span class="new">도전!</span>':''}<span class="no">${it.locked?'🔒':it.no}</span><span class="tx"><b>${it.name}</b><small>${it.locked?'앞 스테이지를 먼저 클리어해요':(it.sub||'')}</small></span>${it.stars?`<span class="st">${stars(it.stars)}</span>`:it.locked?'':'<span class="go">›</span>'}</button>`).join('')+
   `</div><div class="sb-actions">${opt.onClose?'<button id="sbX">닫기</button>':''}</div>`;  document.body.append(el);
  const close=()=>el.remove(),pick=n=>{close();opt.onPick(n);};
  el.querySelectorAll('.sb-card:not(.locked)').forEach(b=>b.onclick=()=>pick(+b.dataset.n));
  const x=el.querySelector('#sbX');if(x)x.onclick=()=>{close();opt.onClose();};
  const first=el.querySelector('.sb-card.cur')||el.querySelector('.sb-card:not(.locked)');if(first)first.focus({preventScroll:true});
  return {close};
 }
 function splash(no,name,sub){
  addCss();const d=document.createElement('div');d.className='sb-splash';d.innerHTML=`<div><em>STAGE ${no}</em><b>${name}</b>${sub?`<small>${sub}</small>`:''}</div>`;document.body.append(d);
  const still=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(d.animate&&!still)d.animate([{opacity:0},{opacity:1,offset:.18},{opacity:1,offset:.75},{opacity:0}],{duration:1300}).onfinish=()=>d.remove();else setTimeout(()=>d.remove(),600);
 }
 function mount(el,opt){
  addCss();
  const api={current:opt.current||1,
   items(){
    const done=(SejinSave.stages.get()[opt.game])||{},test=SejinSave.testMode;
    return opt.names.map((nm,i)=>{const no=i+1;return {no,name:nm,sub:opt.subs?opt.subs[i]:'',stars:done[no]||0,locked:!(test||no===1||!!done[no-1])};});
   },
   open(){select({title:opt.title,items:api.items(),current:api.current,onPick:n=>{api.current=n;api.refresh();opt.onPick(n);}});},
   refresh(){
    const it=api.items(),cur=it[api.current-1]||it[0];
    el.className='sb-head';
    el.innerHTML=`<button type="button" id="sbOpen">🗺 스테이지 선택</button><div class="where">${api.current}/${it.length} · ${cur.name}<small>${cur.stars?stars(cur.stars)+' 클리어':'아직 클리어 전'}</small></div><div class="dots" aria-hidden="true">${it.map(x=>`<i class="${x.stars?'on':''}${x.no===api.current?' cur':''}"></i>`).join('')}</div>`;
    el.querySelector('#sbOpen').onclick=api.open;
   }};
  api.refresh();
  if(opt.autoOpen)api.open();
  return api;
 }
 // Save a clear; keeps the best stars. Returns whether this is the first clear of the stage.
 function clear(game,no,starCount){
  const s=SejinSave.stages.get(),g=s[game]=s[game]||{},prev=g[no]||0;
  if(starCount>prev)g[no]=starCount;SejinSave.stages.set(s);return {first:!prev,prev};
 }
 window.StageBar={mount,select,splash,clear,stars};
})();
