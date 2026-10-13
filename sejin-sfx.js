/* 간단한 효과음 (파일 없이 WebAudio로 만든 소리). 첫 터치 뒤에만 소리가 나고, localStorage 'sejin-mute-v1'='1' 이면 꺼짐.
   SejinSfx.play('pop'|'ok'|'chime'|'win'|'wrong') */
(()=>{
 'use strict';
 let ctx=null;
 const VK='sejin-sfx-vol-v1';
 const getVol=()=>{try{if(localStorage.getItem('sejin-mute-v1')==='1')return 0;const v=localStorage.getItem(VK);return v==null?50:Math.max(0,Math.min(100,+v||0));}catch(e){return 50;}};
 const gain=()=>getVol()/50;
 const muted=()=>{try{return localStorage.getItem('sejin-mute-v1')==='1';}catch(e){return false;}};
 const AC=()=>{if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;try{ctx=new C();}catch(e){return null;}}if(ctx.state==='suspended')ctx.resume();return ctx;};
 function tone(f,t0,dur,type='sine',vol=.12){vol*=gain();const c=AC();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;
  const t=c.currentTime+t0;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.02);}
 const SETS={
  pop:()=>{tone(620,0,.09,'triangle');},
  hop:()=>{tone(520,0,.1,'sine',.04);},
  ok:()=>{tone(660,0,.1,'triangle');tone(880,.09,.14,'triangle');},
  wrong:()=>{tone(220,0,.16,'sawtooth',.07);tone(180,.1,.18,'sawtooth',.06);},
  chime:()=>{[784,988,1175,1568].forEach((f,i)=>tone(f,i*.08,.35,'sine',.1));},
  win:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,i*.11,.3,'triangle',.12));tone(1319,.5,.5,'sine',.1);},
 };
// 파일 효과음: FILES에 이름을 적고 assets/sfx/sfx-<이름>-v1.mp3 를 넣으면 그 소리를 우선 쓰고, 못 불러오면 위 합성음으로 대체. (라이선스 확인된 소리만 넣을 것 — NEXT_WINDOW.md 효과음 규칙)
 const FILES=['pop','ok','chime','win','wrong','hop'],LOUD={hop:.8},base=(document.currentScript&&document.currentScript.src||'').replace(/[^/]*$/,''),aud={};
 FILES.forEach(n=>{const a=new Audio(base+'assets/sfx/sfx-'+n+'-v1.mp3');a.preload='auto';a.addEventListener('canplaythrough',()=>{aud[n]=a;});a.addEventListener('error',()=>{delete aud[n];});});
 function playFile(n){const a=aud[n];if(!a)return false;try{const c=a.cloneNode();c.volume=Math.min(1,.6*gain()*(LOUD[n]||1));c.play().catch(()=>{});return true;}catch(e){return false;}}
 window.SejinSfx={play(n){if(muted())return;try{if(playFile(n))return;(SETS[n]||SETS.pop)();}catch(e){}},getVol,setVol(v){try{localStorage.setItem(VK,String(v));localStorage.setItem('sejin-mute-v1',v>0?'0':'1');}catch(e){}},setMute(v){try{localStorage.setItem('sejin-mute-v1',v?'1':'0');if(!v&&getVol()===0)localStorage.setItem(VK,'50');}catch(e){}}};
})();// 배경음(sejin-bgm.js)을 이 파일과 같은 곳에서 불러온다(효과음이 있는 모든 화면에 BGM).
(()=>{if(window.SejinBgm||window.__bgmLoading)return;window.__bgmLoading=true;const s=document.createElement('script');s.src=((document.currentScript&&document.currentScript.src)||'').replace(/[^/]*$/,'')+'sejin-bgm.js';document.head.append(s);})();
