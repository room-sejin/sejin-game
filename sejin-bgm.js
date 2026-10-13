/* 배경음(BGM) — 파일 없이 WebAudio로 만드는 부드러운 오르골·패드 반주. 화면(게임)마다 빠르기·음계·악기 분위기를 달리한다.
   첫 터치/키 입력 뒤에 시작(브라우저 규칙), 탭이 숨겨지면 멈춤. 설정(방 ⚙️)의 '배경음' 켜기/끄기·크기: localStorage 'sejin-bgm-v1' = 'off' | 'low' | 'mid'(기본).
   효과음(sejin-sfx.js)과 별개. 새 소리 파일이 생기면 PRESETS 대신 파일을 재생하도록 바꿔도 된다. */
(()=>{
 'use strict';
 if(window.SejinBgm)return;
 const page=(location.pathname.split('/').pop()||'index.html').replace('.html','');
 const Q=new URLSearchParams(location.search);
 // 음계(도 기준 반음 간격): 5음 음계가 가장 안 거슬린다
 const PENTA=[0,2,4,7,9],LYD=[0,2,4,6,7,9,11],MINP=[0,3,5,7,10],DORIAN=[0,2,3,5,7,9,10];
 // 프리셋: bpm · 으뜸음(MIDI) · 코드 진행(음계 칸 번호 기준 으뜸/3도/5도 대신 반음으로) · 음계 · 악기 · 밝기
 const P={
  room:   {bpm:80, root:60,scale:PENTA,chords:[[0,4,7],[-3,0,4],[-7,-3,0],[-5,-1,2]],inst:'box',pad:.5,dense:.55},
  walk:   {bpm:92, root:62,scale:PENTA,chords:[[0,4,7],[5,9,12],[-3,0,4],[7,11,14]],inst:'marimba',pad:.35,dense:.6},
  sejin:  {bpm:112,root:60,scale:PENTA,chords:[[0,4,7],[-3,0,4],[-7,-3,0],[-5,-1,2]],inst:'marimba',pad:.3,dense:.7},
  friend: {bpm:108,root:65,scale:PENTA,chords:[[0,4,7],[-5,-1,2],[-3,0,4],[-7,-3,0]],inst:'box',pad:.35,dense:.7},
  shop:   {bpm:116,root:67,scale:PENTA,chords:[[0,4,7],[5,9,12],[0,4,7],[-5,-1,2]],inst:'marimba',pad:.25,dense:.75},
  park:   {bpm:120,root:62,scale:PENTA,chords:[[0,4,7],[7,11,14],[-3,0,4],[5,9,12]],inst:'pluck',pad:.3,dense:.75},
  angel:  {bpm:96, root:64,scale:LYD,  chords:[[0,4,7],[2,6,9],[-5,-1,2],[0,4,7]],inst:'bell',pad:.6,dense:.45},
  merge:  {bpm:100,root:64,scale:PENTA,chords:[[0,4,7],[-3,0,4],[5,9,12],[-5,-1,2]],inst:'marimba',pad:.3,dense:.65},
  calm:   {bpm:68, root:57,scale:PENTA,chords:[[0,4,7],[-5,-1,2],[-3,0,4],[-7,-3,0]],inst:'box',pad:.6,dense:.35},
  soft:   {bpm:76, root:62,scale:PENTA,chords:[[0,4,7],[-3,0,4],[5,9,12],[-5,-1,2]],inst:'box',pad:.5,dense:.45},
  puzzle: {bpm:84, root:59,scale:DORIAN,chords:[[0,3,7],[-2,2,5],[-4,0,3],[-2,2,5]],inst:'pluck',pad:.4,dense:.45},
  sky:    {bpm:88, root:67,scale:LYD,  chords:[[0,4,7],[-3,0,4],[2,6,9],[-5,-1,2]],inst:'bell',pad:.55,dense:.5},
 };
 const BY_PAGE={index:'room',raising:'room','raising-mockup':'room',place:'walk',village:'sky',vplace:'sky',friend:'friend',merge:'merge',pattern:'calm',jigsaw:'soft',spot:'puzzle',ribbon:'soft',cloudclimb:'sky',wrap:'shop',mansion:'puzzle',mailbox:'calm',market:'walk',lily:'soft'};
 const STAGE={sejin:'sejin',friend:'friend',shopkeeper:'shop',parkfriend:'park',angel:'angel'};
 const presetName=()=>page==='knit'?(STAGE[Q.get('doll')||'sejin']||'sejin'):BY_PAGE[page]||'room';
 if(page==='scarf'||page.startsWith('pattern-'))return;   // 목도리 뜨기는 리듬 게임이라 자체 박자를 쓴다(곡 파일이 오면 거기서 재생)

 const getVol=()=>{try{const v=localStorage.getItem('sejin-bgm-v1');if(v==null)return 50;if(v==='off')return 0;if(v==='low')return 25;if(v==='mid')return 50;return Math.max(0,Math.min(100,+v||0));}catch(e){return 50;}};
 const get=()=>getVol()?'on':'off';
 const level=()=>getVol()/100*.14;   // 50% = .07
 let ctx=null,master=null,timer=0,step=0,started=false,seed=0,p=null,nextT=0,melodyPos=2;
 const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const hz=m=>440*Math.pow(2,(m-69)/12);
 function env(g,t,a,d,vol){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+d);}
 function note(m,t,dur,vol,kind){
  const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=kind==='bell'?5200:3200;
  o.type=kind==='marimba'?'sine':kind==='pluck'?'triangle':kind==='bell'?'sine':'triangle';o.frequency.value=hz(m);
  env(g,t,.005,dur,vol);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05);
  if(kind==='bell'){const o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='sine';o2.frequency.value=hz(m)*2.76;env(g2,t,.003,dur*.5,vol*.25);o2.connect(g2);g2.connect(master);o2.start(t);o2.stop(t+dur*.5+.05);}
  if(kind==='box'){const o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='sine';o2.frequency.value=hz(m)*2;env(g2,t,.003,dur*.4,vol*.3);o2.connect(g2);g2.connect(master);o2.start(t);o2.stop(t+dur*.4+.05);}
 }
 function pad(ms,t,dur,vol){ms.forEach(m=>{[-4,4].forEach(d=>{const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=900;o.type='sine';o.frequency.value=hz(m-12);o.detune.value=d;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+dur*.4);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.05);});});}
 // 한 박(8분음표) 단위로 예약: 한 마디=8칸, 코드는 마디마다 바뀐다
 function tick(){
  const spb=60/p.bpm/2;
  while(nextT<ctx.currentTime+.4){
   const bar=Math.floor(step/8)%p.chords.length,pos=step%8,ch=p.chords[bar],t=nextT;
   if(pos===0){pad(ch.map(c=>p.root+c),t,spb*8,.05*p.pad);note(p.root+ch[0]-24,t,spb*3,.16,'pluck');}
   // 아르페지오(반주): 코드 음을 오르내림
   if(pos%2===0&&(pos===0||rnd()<.6+p.dense*.3)){note(p.root+ch[(pos/2)%3]+(pos>=4?12:0),t,spb*2.4,.1,p.inst);}
   // 멜로디: 음계 안에서 한 칸씩 걷듯이 움직이고, 가끔 쉰다
   if(pos%1===0&&rnd()<p.dense*.45){melodyPos=Math.max(0,Math.min(p.scale.length*2-1,melodyPos+Math.floor(rnd()*5)-2));const deg=p.scale[melodyPos%p.scale.length]+12*Math.floor(melodyPos/p.scale.length);note(p.root+12+deg,t,spb*(rnd()<.3?4:2),.09,p.inst);}
   nextT+=spb;step++;
  }
 }
 function start(){
  if(started||get()==='off')return;
  const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  try{ctx=ctx||new C();}catch(e){return;}if(ctx.state==='suspended')ctx.resume();
  p=P[presetName()]||P.room;seed=(page.length*7919+(Q.get('doll')||'').length*131+p.bpm)>>>0;
  master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);master.gain.linearRampToValueAtTime(level(),ctx.currentTime+2.5);
  nextT=ctx.currentTime+.1;step=0;started=true;timer=setInterval(tick,120);
 }
 function stop(){if(!started)return;clearInterval(timer);started=false;try{master.gain.cancelScheduledValues(ctx.currentTime);master.gain.linearRampToValueAtTime(0,ctx.currentTime+.4);const m=master;setTimeout(()=>{try{m.disconnect();}catch(e){}},600);}catch(e){}}
 const EV=['pointerdown','mousedown','touchstart','click','keydown'];
 const first=()=>{EV.forEach(e=>removeEventListener(e,first,true));start();};
 EV.forEach(e=>addEventListener(e,first,true));
 document.addEventListener('visibilitychange',()=>{if(!ctx)return;if(document.hidden){clearInterval(timer);ctx.suspend&&ctx.suspend();}else if(started){ctx.resume&&ctx.resume();nextT=ctx.currentTime+.1;timer=setInterval(tick,120);}});
 window.SejinBgm={state:()=>({started,ctx:ctx&&ctx.state,preset:presetName(),step}),get,getVol,setVol(v){try{localStorage.setItem('sejin-bgm-v1',String(v));}catch(e){}if(!v)stop();else if(started){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.linearRampToValueAtTime(level(),ctx.currentTime+.2);}else start();}};
})();
