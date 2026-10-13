/* The author's real knitted dolls: a small banner ([data-promo]) under the map and on place pages,
   and the "작가의 인형 가게" tab ([data-store]) in the room.
   Edit PROMO to change the words, pictures and links. Put the real addresses in `links`;
   while a link is null its button says 준비 중 and goes nowhere (no made-up links).
   Pictures are relative to the site root; replace them with real photos of the dolls later.
   `lineup` status words must stay true: say 판매 중 only for dolls that are really on sale. */
(()=>{
 'use strict';
 const PROMO={
  label:'작가의 손뜨개 인형',
  title:'세진이 인형, 실물로 만나요',
  text:'게임 속 세진이를 한 코 한 코 직접 떠서 만들고 있어요.',
  button:'구경하러 가기',
  image:'assets/character/base-v1.png',
  links:{
   instagram:'https://www.instagram.com/room_sejin/',   // 예: 'https://www.instagram.com/아이디'
   store:'https://roomsejin.com',       // 판매 사이트(카페24) — 메인 주소
   contactEmail:'sejin7283@gmail.com', // 우체통 글을 받을 이메일 (예: 'me@example.com'). 있으면 '운영자에게 보내기'가 메일 앱을 열어요
   feedbackForm:null, // 또는 구글 폼 같은 설문 주소 (이메일 대신)
  },
  lineup:[
   {name:'기본 세진이',status:'제작 중',image:'assets/character/base-v1.png'},
   {name:'천사 세진이',status:'준비 중',image:null},
   {name:'사람 천사 친구들',status:'준비 중',image:null},
  ],
 };
 const bannerUrl=()=>PROMO.links.store||PROMO.links.instagram;
 const css=`.promo{display:flex;align-items:center;gap:12px;margin:12px 14px 16px;padding:12px 14px;border-radius:18px;background:linear-gradient(120deg,#fdeef1,#e8f3f7);border:2px dashed #e7b9c3;color:#5b4a42;text-decoration:none;position:relative}
.promo .promo-pic{flex:none;width:64px;height:64px;border-radius:16px;background:#fffaf4 center/contain no-repeat;border:2px solid #fff;box-shadow:0 2px 0 #e9d8c8}
.promo .promo-txt{flex:1;min-width:0}
.promo .promo-label{display:inline-block;font-size:10px;font-weight:bold;color:#fff;background:#e58c9c;border-radius:8px;padding:1px 7px;margin-bottom:3px}
.promo b{display:block;font-size:14px}.promo p{margin:2px 0 0;font-size:11.5px;color:#8b766b;line-height:1.35}
.promo .promo-btn{flex:none;font-size:12px;font-weight:bold;padding:8px 12px;border-radius:12px;background:#8fc3e0;color:#fff;box-shadow:0 2px 0 #6fa6c4;white-space:nowrap}
.promo.off .promo-btn{background:#d8cbbf;box-shadow:0 2px 0 #c2b3a5}
a.promo:focus-visible,.store-links a:focus-visible{outline:3px solid #8fc3e0;outline-offset:2px}
.store{padding:4px 14px 18px;color:#5b4a42}
.store-hero{background:#fff;border-radius:22px;padding:18px 16px;text-align:center;box-shadow:0 6px 18px #88756714;border:2px solid #fff}
.store-hero .hero-pic{width:132px;height:132px;margin:0 auto 8px;border-radius:50%;background:radial-gradient(circle,#fffdf8 0 60%,#e4f0f4 61%) ;position:relative}
.store-hero .hero-pic span{position:absolute;inset:10px;background:center/contain no-repeat}
.store-hero b{display:block;font-size:17px;color:#4a3a33}.store-hero p{margin:4px 0 0;font-size:13px;color:#6b5a50;line-height:1.45}
.store-links{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
.store-links a,.store-links span{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px 8px;border-radius:14px;font-weight:bold;font-size:14px;text-decoration:none;color:#fff}
.store-links .ig{background:linear-gradient(120deg,#f2a7b5,#c9b3e6);box-shadow:0 3px 0 #b88fb0}
.store-links .shop{background:#8fc3e0;box-shadow:0 3px 0 #6fa6c4}
.store-links .off{background:#d8cbbf;box-shadow:0 3px 0 #c2b3a5;cursor:default}
.store-links small{font-size:10px;font-weight:normal;opacity:.9}
.store h3{font-size:14px;margin:18px 2px 8px}
.lineup{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.lineup div{background:#fff;border-radius:16px;padding:10px 6px;text-align:center;font-size:12px;border:2px solid #fff;box-shadow:0 3px 10px #8875670d}
.lineup i{display:block;width:62%;aspect-ratio:1;margin:0 auto 6px;border-radius:14px;background:#f6efe6 center/contain no-repeat}
.lineup i.none{background:repeating-linear-gradient(-45deg,#fbf6ee 0 6px,#f3eadf 6px 12px);border:2px dashed #dccbb8}
.lineup em{display:inline-block;margin-top:3px;font-style:normal;font-size:10px;font-weight:bold;color:#fff;background:#a9cfa4;border-radius:8px;padding:1px 6px}
.lineup em.wait{background:#cfc2b5}
.store-mail{display:block;margin-top:14px;text-align:center;padding:12px;border-radius:14px;background:#fff;border:2px dashed #e7b9c3;color:#5b4a42;font-weight:bold;font-size:14px;text-decoration:none}
.store-note{margin-top:14px;font-size:11px;color:#8b766b;text-align:center}
.rbn{position:relative;margin:6px 14px 10px;height:76px;border-radius:18px;overflow:hidden;box-shadow:0 3px 0 #e9d8c8;border:2px solid #fff}
.rbn-slide{position:absolute;inset:0;display:flex;align-items:center;gap:10px;padding:8px 12px;text-decoration:none;color:#fff;opacity:0;transition:opacity .5s;pointer-events:none;background-size:cover;background-position:center}
.rbn-slide.on{opacity:1;pointer-events:auto}
.rbn-slide.ig{background-image:linear-gradient(120deg,#f2a7b5,#c9b3e6)}.rbn-slide.shop{background-image:linear-gradient(120deg,#8fc3e0,#a9cfa4)}
.rbn-slide.off{filter:saturate(.7)}
.rbn-slide .pic{flex:none;width:56px;height:56px;border-radius:14px;background:#fffaf4 center/contain no-repeat;border:2px solid #fff8}
.rbn-slide .txt{flex:1;min-width:0;text-shadow:0 1px 3px #0003}.rbn-slide .txt small{display:block;font-size:10px;font-weight:bold;opacity:.95}
.rbn-slide b{display:block;font-size:14px;line-height:1.25}.rbn-slide p{margin:2px 0 0;font-size:11px;line-height:1.3;opacity:.95}
.rbn-slide .go{flex:none;font-size:11px;font-weight:bold;padding:6px 10px;border-radius:10px;background:#fff;color:#7a5a6a;text-shadow:none;white-space:nowrap}
.rbn-slide.bgart{color:#6b4a3a;padding-left:27%;background-size:cover;background-position:left center}.rbn-slide.bgart .txt{text-shadow:none}.rbn-slide.bgart .pic{display:none}.rbn-slide.bgart .go{background:#f2a7b5;color:#fff}.room-sidebar .rbn-slide.bgart{padding:0 8px 0 40%;justify-content:flex-end}.room-sidebar .rbn-slide.bgart .txt{display:none}.rbn-slide.art{padding:0}.rbn-slide.art .txt,.rbn-slide.art .pic,.rbn-slide.art .go{display:none}
.rbn-tag{position:absolute;right:6px;top:4px;z-index:2;font-size:9px;background:#0003;color:#fff;border-radius:6px;padding:0 5px;pointer-events:none}
.rbn-dots{position:absolute;left:0;right:0;bottom:3px;display:flex;justify-content:center;gap:4px;z-index:2;pointer-events:none}.rbn-dots i{width:5px;height:5px;border-radius:50%;background:#fff8}.rbn-dots i.on{background:#fff}
.room-sidebar .rbn-slide .pic,.room-sidebar .rbn-slide p{display:none}.room-sidebar .rbn-slide b{font-size:12.5px}.room-sidebar .rbn-slide .go{padding:5px 8px}
@media (prefers-reduced-motion:reduce){.rbn-slide{transition:none}}`;
 const link=(url,cls,label,sub)=>url?`<a class="${cls}" href="${url}" target="_blank" rel="noopener">${label}</a>`:`<span class="off" aria-disabled="true">${label}<small>준비 중</small></span>`;
 function mount(){
  if(!document.getElementById('promoStyle')){const s=document.createElement('style');s.id='promoStyle';s.textContent=css;document.head.append(s);}
  document.querySelectorAll('[data-promo]').forEach(slot=>{
   const root=slot.dataset.promo||'',url=bannerUrl();
   const el=document.createElement(url?'a':'div');el.className='promo'+(url?'':' off');
   if(url){el.href=url;el.target='_blank';el.rel='noopener';}
   el.innerHTML=`<span class="promo-pic" style="background-image:url('${root+PROMO.image}')" role="img" aria-label="세진이 인형 사진"></span><span class="promo-txt"><span class="promo-label">${PROMO.label}</span><b>${PROMO.title}</b><p>${PROMO.text}</p></span><span class="promo-btn">${url?PROMO.button:'준비 중'}</span>`;
   slot.replaceWith(el);
  });
  // 방 화면 홍보 배너(에너지 아래): 인스타 / 판매 사이트. 지금은 예시 — assets/banner-*.png(가로 4:1, 예: 1200×300)가 들어오면 그 그림이 배너 전체로 자동 표시된다.
  document.querySelectorAll('[data-banner]').forEach(slot=>{
   const root=slot.dataset.banner||'',L=PROMO.links;
   const B0=[{id:'ig',cls:'ig',tag:'인스타그램',title:'@room_sejin 놀러 오세요',text:'새 소식과 손뜨개 인형 사진을 올려요',url:L.instagram,art:'assets/banner-instagram-v1.png',bg:'assets/ui/banner-instagram-background-v1.png',btn:'구경하기'},
            {id:'shop',cls:'shop',tag:'인형 가게',title:'세진이 인형 만나러 가기',text:'한 코 한 코 직접 뜬 실물 인형',url:L.store,art:'assets/banner-store-v1.png',bg:'assets/ui/banner-store-background-v1.png',btn:'가게 가기'}],B=B0.filter(b=>b.url);   // 주소가 아직 없는 배너(판매 사이트)는 숨김
   if(!B.length){slot.remove();return;}
   const wrap=document.createElement('div');wrap.className='rbn';wrap.setAttribute('role','region');wrap.setAttribute('aria-label','작가의 인형 소식');
   wrap.innerHTML='<span class="rbn-tag">예시 배너</span>'+B.map((b,i)=>{const a=document.createElement(b.url?'a':'div');a.className='rbn-slide '+b.cls+(b.url?'':' off')+(i?'':' on');if(b.url){a.href=b.url;a.target='_blank';a.rel='noopener';}
    a.innerHTML=`<span class="pic" style="background-image:url('${root}${PROMO.image}')"></span><span class="txt"><small>${b.tag}</small><b>${b.title}</b><p>${b.text}</p></span><span class="go">${b.url?b.btn:'준비 중'}</span>`;
    return a.outerHTML;}).join('')+'<div class="rbn-dots">'+B.map((_,i)=>`<i${i?'':' class="on"'}></i>`).join('')+'</div>';
   slot.replaceWith(wrap);
   const sl=[...wrap.querySelectorAll('.rbn-slide')];B.forEach((b,i)=>{const im=new Image();im.onload=()=>{sl[i].classList.add('art');sl[i].style.backgroundImage='url('+root+b.art+')';wrap.querySelector('.rbn-tag')?.remove();};im.src=root+b.art;const bi=new Image();bi.onload=()=>{if(sl[i].classList.contains('art'))return;sl[i].classList.add('bgart');sl[i].style.backgroundImage='url('+root+b.bg+')';wrap.querySelector('.rbn-tag')?.remove();};bi.src=root+b.bg;});
   const dots=[...wrap.querySelectorAll('.rbn-dots i')];let k=0,hold=false;
   const show=n=>{k=n%sl.length;sl.forEach((s,i)=>s.classList.toggle('on',i===k));dots.forEach((d,i)=>d.classList.toggle('on',i===k));};
   wrap.addEventListener('pointerenter',()=>hold=true);wrap.addEventListener('pointerleave',()=>hold=false);
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{if(!hold&&!document.hidden)show(k+1);},5000);
   else wrap.addEventListener('click',()=>show(k+1));
  });  document.querySelectorAll('[data-store]').forEach(slot=>{
   const root=slot.dataset.store||'',el=document.createElement('div');el.className='store';
   el.innerHTML=`<div class="store-hero"><div class="hero-pic"><span style="background-image:url('${root+PROMO.image}')" role="img" aria-label="세진이 인형 사진"></span></div><b>${PROMO.title}</b><p>${PROMO.text}</p>
    <div class="store-links">${link(PROMO.links.instagram,'ig','인스타그램')}${link(PROMO.links.store,'shop','판매 사이트')}</div></div>
    <h3>만들고 있는 인형들</h3><div class="lineup">${PROMO.lineup.map(d=>`<div><i${d.image?` style="background-image:url('${root+d.image}')"`:' class="none"'}></i>${d.name}<br><em${d.status==='판매 중'?'':' class="wait"'}>${d.status}</em></div>`).join('')}</div>
    <a class="store-mail" href="${root}mailbox.html?from=room">💌 우체통 · 후기 · 건의 · 문의 남기기</a><p class="store-note">게임 속 실뭉치로는 살 수 없어요. 실제 인형은 인스타그램과 판매 사이트에서 소개해요.</p>`;
   slot.replaceWith(el);
  });
 }
 document.readyState==='loading'?document.addEventListener('DOMContentLoaded',mount):mount();
 window.SejinPromo=PROMO;
})();
