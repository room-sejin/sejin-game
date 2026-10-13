/* 대저택의 비밀 — 레이튼 교수식 두뇌 퍼즐판. mansion-escape.js(엔진) 뒤에 불러와 40단계의 퍼즐을 어려운 것으로 바꿔 끼운다.
   각 퍼즐은 힌트 3단계(점점 구체적)가 있고, 논리 퍼즐의 정답은 개발 중에 전수 계산으로 '정답이 하나뿐'임을 확인했다. */
(()=>{
'use strict';
const X=window.MX;if(!X)return;
const {$,sfx,beep,shuffle,svg,clueBox,pickSeq,matchPairs,orderSwap,codeEntry,steppers,choose,chipIcon,coverHtml}=X;
const R=Object.fromEntries(X.ROOMS.map(r=>[r.id,r]));
const setP=(id,def)=>{const r=R[id.split('-')[0]],i=r.puzzles.findIndex(p=>p.id===id);r.puzzles[i]=Object.assign({},r.puzzles[i],def);};
const li=a=>a.map(t=>`<li>${t}</li>`).join('');

// ---------- 공통 도구 ----------
function numQ(c,{clue,answer,unit,bad}){
 c.body.innerHTML=clueBox(clue)+`<div class="row"><input id="nq" inputmode="numeric" autocomplete="off" aria-label="답" style="width:130px;font:inherit;font-size:22px;font-weight:bold;text-align:center;border:3px solid #8a6f60;border-radius:12px;padding:8px;background:#fff"><span style="font-weight:bold">${unit||''}</span><button type="button" class="btn main" id="nqk">확인</button></div>`;
 const go=()=>{const v=$('#nq').value.trim();if(v==='')return;if(+v===answer)c.solve();else c.bad(bad||'답이 달라요. 천천히 다시 생각해 봐요.');};
 $('#nqk').onclick=go;$('#nq').onkeydown=e=>{if(e.key==='Enter')go();};
}
// 칸에 하나씩 채우고 [확인] — 논리 퍼즐용 (틀려도 바로 사라지지 않고, 마지막에 한 번에 검사)
function arrange(c,{clue,list,items,answer,labels}){
 const by=Object.fromEntries(items.map(i=>[i.id,i])),pool=shuffle(items.map(i=>i.id));let slots=Array(answer.length).fill(null);
 c.body.innerHTML=clueBox(clue)+(list?`<ul class="lg">${li(list)}</ul>`:'')+'<div class="slots" id="as"></div><div class="row" id="ap"></div><div class="row"><button type="button" class="btn" id="ar">↺ 비우기</button><button type="button" class="btn main" id="ac">확인</button></div>';
 const draw=()=>{
  $('#as').innerHTML=slots.map((id,i)=>id?`<button type="button" class="slot f" data-i="${i}" aria-label="${i+1}번째 칸 비우기">${by[id].html}</button>`:`<div class="slot">${labels?labels[i]:i+1}</div>`).join('');
  $('#ap').innerHTML=pool.map(id=>`<button type="button" class="chip" data-id="${id}"${slots.includes(id)?' disabled':''}>${by[id].html}</button>`).join('');
  $('#as').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{slots[+b.dataset.i]=null;sfx('pop');draw();});
  $('#ap').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const k=slots.indexOf(null);if(k<0)return;slots[k]=b.dataset.id;sfx('pop');draw();});};
 $('#ar').onclick=()=>{slots=Array(answer.length).fill(null);draw();};
 $('#ac').onclick=()=>{if(slots.includes(null)){c.say('칸을 모두 채워야 확인할 수 있어요.');return;}if(slots.every((v,i)=>v===answer[i]))c.solve();else c.bad('조건 중 어긋나는 것이 있어요. 단서를 하나씩 다시 대조해 봐요.');};
 draw();
}
function mastermind(c,{clue,rows,answer}){
 const t=`<table style="margin:4px auto 8px;border-collapse:collapse;font-size:14px">`+rows.map(([g,a,b])=>`<tr><td style="padding:3px 10px;font-weight:bold;font-size:18px;letter-spacing:3px">${g}</td><td style="padding:3px 6px;text-align:left">${a===0&&b===0?'<b>모두 틀렸어요</b>':(a?`숫자와 자리가 모두 맞는 것 <b>${a}개</b>`:'')+(a&&b?' · ':'')+(b?`숫자만 맞고 자리는 다른 것 <b>${b}개</b>`:'')}</td></tr>`).join('')+'</table>';
 codeEntry(c,{answer,clue:clue+t});
}
const clockSvg=(h,m,{flip,size=130}={})=>{
 const hh=(h%12)*30+m*.5,mm=m*6,pt=(a,r)=>{const t=(a-90)*Math.PI/180;return [65+Math.cos(t)*r,65+Math.sin(t)*r];},nums=[12,1,2,3,4,5,6,7,8,9,10,11].map((n,i)=>{const [x,y]=pt(i*30,50);return `<text x="${x}" y="${y+4}" text-anchor="middle" font-size="12" font-weight="bold" fill="#5b4a42">${n}</text>`;}).join('');
 const [hx,hy]=pt(hh,32),[mx,my]=pt(mm,48);
 return `<span style="display:inline-block;${flip?'transform:scaleX(-1)':''}">${svg(size,size,`<g transform="scale(${size/130})"><circle cx="65" cy="65" r="60" fill="#fffdf8" stroke="#8a6f60" stroke-width="5"/>${nums}<line x1="65" y1="65" x2="${hx}" y2="${hy}" stroke="#5b4a42" stroke-width="6" stroke-linecap="round"/><line x1="65" y1="65" x2="${mx}" y2="${my}" stroke="#8a6f60" stroke-width="3.5" stroke-linecap="round"/><circle cx="65" cy="65" r="5" fill="#8a6f60"/></g>`)}</span>`;
};
const textChoice=(c,{clue,options,answer,bad})=>choose(c,{clue,answer,options:options.map(([id,t])=>({id,html:`<div style="min-width:96px;font-size:14px;line-height:1.4">${t}</div>`})),wrong:bad});

// ---------- 서재 ----------
setP('library-1',{hints:['수수께끼의 답을 그림으로 떠올려 보세요. “둥근 빛”은 하루의 어느 때일까요?','엉뚱한 책(해바라기·구름·혜성·나뭇잎)은 수수께끼의 답과 비슷하지만 같지 않아요.','손톱 모양 = 초승달. 달 그림이 있는 책이 3번 칸이에요.']});
setP('library-2',{
 title:'책장 줄 세우기',hints:['확실한 단서부터 정하세요. 5번 단서가 가장 확실해요.','보라가 맨 오른쪽이면, 노랑은 그 바로 왼쪽(4번째)이에요.','남은 1~3번째에 빨강·파랑·초록. 초록은 끝이 아니니 2번째, 파랑은 가운데가 아니니…'],
 nb:'책 순서(왼쪽부터): 빨강 → 파랑 → 초록 → 노랑 → 보라. 책을 꽂자 비밀 서랍이 열렸어요.',
 clue:'책상 받침에 책 다섯 권을 왼쪽부터 꽂아야 해요. 다음 단서를 모두 만족하는 순서를 찾아요.',
 build(c){const B=[['빨강','#e58c9c'],['파랑','#8fc3e0'],['초록','#7fb88a'],['노랑','#e3b84d'],['보라','#c9b3e6']];
  arrange(c,{clue:this.clue,list:['빨강 책은 파랑 책보다 <b>왼쪽</b>에 있어요. (멀리 떨어져 있어도 돼요)','초록 책은 <b>맨 왼쪽도, 맨 오른쪽도 아니에요</b>.','노랑 책과 보라 책은 <b>바로 붙어</b> 있어요.','파랑 책은 <b>가운데가 아니에요</b>.','보라 책은 <b>맨 오른쪽</b>에 있어요.'],items:B.map(([n,col])=>({id:n,html:`<div style="width:34px;height:60px;border-radius:5px;background:${col};border:3px solid #8a6f60;margin:auto"></div><small>${n}</small>`})),answer:B.map(b=>b[0]),labels:['왼쪽','','','','오른쪽']});}});
setP('library-3',{hints:['판을 움직여 보며 구멍으로 🌼가 몇 개 보이는지 세어 보세요.','구멍 네 개의 간격은 가로·세로로 2칸씩이에요.','판을 한 칸씩 움직이면 네 개가 한꺼번에 🌼 위로 올라오는 자리가 딱 하나 있어요.']});
setP('library-4',{
 title:'잠긴 상자의 암호',hints:['738이 “모두 틀림”이니 7, 3, 8은 암호에 없어요.','682에서 하나만 맞는데, 7·3·8이 없으니 6, 2 중에서… 8은 이미 제외예요. 이 중 자리까지 맞은 숫자가 있어요.','206은 숫자가 둘 맞지만 자리가 틀려요. 2와 0, 또는 2와 6, 또는 0과 6 중 둘이에요. 614와 780의 단서와 겹쳐 보세요.'],
 nb:'상자의 암호는 0·4·2 였어요. 안에서 찢어진 시계 설계도 두 조각이 나왔어요.',
 clue:'상자의 자물쇠는 <b>서로 다른 숫자 3개</b>예요. 열쇠 주인이 남긴 시도 기록을 보고 암호를 추리해요.',
 build(c){mastermind(c,{clue:this.clue,rows:[['682',1,0],['614',0,1],['206',0,2],['738',0,0],['780',0,1]],answer:'042'});}});
setP('library-5',{
 title:'찢어진 설계도 맞추기',hints:['빈칸 옆의 조각만 움직일 수 있어요. 한 번에 한 칸씩.','맨 윗줄 1, 2, 3부터 제자리에 놓으면 아래 두 줄만 다시 생각하면 돼요.','마지막 두 줄은 한 바퀴 돌리듯 조각을 돌려 가며 맞춰요.'],
 nb:'시계 설계도를 완성했어요. 시계방 열쇠를 얻었어요.',
 clue:'찢어진 설계도 조각 8장을 빈칸에 밀어서 <b>1부터 8까지 순서대로</b> 맞춰요. 조각을 눌러 빈칸으로 밀어요.',
 build(c){slidePuzzle(c,this.clue);}});

// ---------- 시계방 ----------
setP('clock-1',{
 title:'톱니바퀴의 비밀',hints:['A가 지나간 톱니 수는 6바퀴 × 12개 = 72개예요.','맞물린 톱니는 같은 개수만큼 지나가요. B(36개)는 72개가 지나가면 몇 바퀴일까요? B와 같은 축의 C는 B와 같은 바퀴 수를 돌아요.','C(18개)가 도는 바퀴 수 × 18개 = D(6개)가 지나가는 톱니 수예요.'],
 nb:'시계 톱니바퀴: A를 6바퀴 돌리면 D는 6바퀴 돌아요. 태엽 손잡이가 움직이기 시작해요.',
 clue:'톱니바퀴 A(<b>12</b>개)가 B(<b>36</b>개)와 맞물려 돌아가요. B와 <b>같은 축</b>에 붙은 C(<b>18</b>개)는 D(<b>6</b>개)와 맞물려 있어요.<br>A를 <b>6바퀴</b> 돌리면 D는 몇 바퀴 돌까요?',
 build(c){numQ(c,{clue:this.clue,answer:6,unit:'바퀴'});}});
setP('clock-2',{
 title:'거울 속 시계',hints:['거울에 비친 시계는 좌우가 뒤집혀요. 시침과 분침의 위치를 12시 기준 반대편으로 옮겨 생각해요.','12시 방향을 기준으로 뒤집으면, 거울 속 시각 + 실제 시각 = 12시예요.','거울 속이 8시 25분이면 실제는 12:00 − 8:25 = ?'],
 nb:'거울 속 시계: 실제 시각은 3시 35분이에요.',
 clue:'거울에 비친 시계예요. 실제로 시계가 가리키는 시각은 몇 시 몇 분일까요?',
 build(c){c.body.innerHTML='';choose(c,{clue:this.clue+`<div style="text-align:center;margin-top:6px">${clockSvg(3,35,{flip:true,size:150})}<br><small>거울에 비친 모습</small></div>`,answer:'335',options:[{id:'335',html:'3시 35분'},{id:'425',html:'4시 25분'},{id:'825',html:'8시 25분'},{id:'335x',html:'3시 25분'},{id:'925',html:'9시 25분'}],wrong:'거울 속 시계는 숫자 배치가 뒤집혀 있어요. 한 번 더 뒤집어 읽어야 해요.'});}});
setP('clock-3',{
 title:'시침과 분침 사이',hints:['시침은 1시간에 30° 움직이고, 분침은 1분에 6° 움직여요.','2시 30분이면 분침은 6 방향(180°). 시침은 2시 방향(60°)에서 30분 동안 15° 더 움직였어요.','시침 75°, 분침 180° → 작은 각은 180° − 75°.'],
 nb:'2시 30분의 시침·분침 각도는 105°. 시계 문자판이 반응해요.',
 clue:`2시 30분일 때 시침과 분침 사이의 <b>작은 각도</b>는 몇 도일까요? (시침도 30분 동안 조금 움직인 것을 잊지 마세요!)<div style="text-align:center;margin-top:6px">${clockSvg(2,30,{size:140})}</div>`,
 build(c){numQ(c,{clue:this.clue,answer:105,unit:'도'});}});
setP('clock-4',{
 title:'시계가 겹치는 순간',hints:['분침은 1분에 6°, 시침은 1분에 0.5°씩 움직여요. 분침이 시침을 따라잡는 속도는 1분에 5.5°예요.','4시 정각에 시침은 분침보다 120° 앞에 있어요.','120° ÷ 5.5° = 21.8…분. 그러면 약 21분 49초예요.'],
 nb:'4시 이후 처음 시침과 분침이 겹치는 때는 4시 21분 49초 무렵이에요.',
 clue:'4시 정각 이후, 시침과 분침이 <b>처음으로 겹치는</b> 시각은 언제일까요?',
 build(c){textChoice(c,{clue:this.clue,answer:'b',options:[['a','4시 20분 00초'],['b','4시 21분 49초'],['c','4시 22분 30초'],['d','4시 24분 00초']],bad:'시침도 계속 움직인다는 점을 생각해 봐요.'});}});
setP('clock-5',{
 title:'종소리의 길이',hints:['종이 4번 칠 때, 소리와 소리 사이의 간격은 몇 번일까요?','4번 치면 간격은 3번이에요. 6초 ÷ 3 = 한 간격의 시간.','8번 치면 간격은 7번이에요.'],
 nb:'종 간격은 2초. 8번 울리는 데 14초. 서랍이 열렸어요.',
 clue:'벽시계는 시각만큼 종을 쳐요. <b>4시</b>를 알릴 때 첫 소리부터 마지막 소리까지 <b>6초</b>가 걸렸어요. 같은 속도로 <b>8시</b>를 알리면 몇 초가 걸릴까요?',
 build(c){numQ(c,{clue:this.clue,answer:14,unit:'초'});}});

// ---------- 온실 ----------
setP('garden-1',{
 title:'뒤바뀐 씨앗 봉투',hints:['세 봉투의 표찰은 전부 틀렸어요. 그러니 “잎” 봉투에는 잎이 들어 있지 않아요.','봉투 하나를 열어서 안을 보면, 나머지 두 봉투는 두 가지 경우뿐이에요.','열어 본 봉투 안의 씨앗이 정해지면, 나머지는 “표찰과 달라야 한다”는 조건만으로 하나로 정해져요.'],
 nb:'씨앗 봉투의 진짜 내용물을 알아냈어요. 물주기 표가 나왔어요.',
 clue:'씨앗 봉투 세 개의 표찰이 <b>전부 잘못</b> 붙어 있어요. 봉투를 하나만 열어 안을 본 뒤, 세 봉투에 진짜 이름표를 붙여 주세요.',
 build(c){seedBags(c,this.clue);}});
setP('garden-2',{
 title:'물통 두 개',hints:['3컵 통에 먼저 가득 채워서 5컵 통에 옮겨 보세요.','5컵 통이 가득 차기 직전의 상태를 이용해요.','5컵 통을 가득 채운 뒤 3컵 통에 부으면, 5컵 통에는 정확히 2컵이 남아요. 그걸 이용해요.'],
 nb:'물통으로 정확히 4컵을 만들었어요. 화분에 물을 줄 수 있어요.',
 clue:'3컵짜리 물통과 5컵짜리 물통이 있어요. 눈금은 없어요. 물통 하나에 <b>정확히 4컵</b>을 담아 보세요. (물은 얼마든지 쓸 수 있어요)',
 build(c){jugs(c,this.clue);}});
setP('garden-3',{
 title:'자라는 키',hints:['차이를 구해 보세요: 6−2, 12−6, 20−12…','차이가 4, 6, 8, 10으로 2씩 커져요.','다음 차이는 12예요. 30 + 12 = ?'],
 nb:'세 번째 화분의 다음 키는 42cm. 꽃무늬가 돋아났어요.',
 clue:'온실 화분의 새싹 키를 매달 쟀어요: <b>2, 6, 12, 20, 30</b> cm. 다음 달에는 몇 cm가 될까요? (규칙이 있어요)',
 build(c){numQ(c,{clue:this.clue,answer:42,unit:'cm'});}});
setP('garden-4',{
 title:'온실의 등불 퍼즐',hints:['한 칸을 누르면 그 칸과 위·아래·양옆이 함께 바뀌어요.','같은 칸을 두 번 누르면 원래대로 돌아와요. 그러니 각 칸은 한 번만 누를지 말지만 정하면 돼요.','네 모서리와 가운데, 이렇게 5칸만 누르면 모두 꺼져요.'],
 nb:'모든 등불을 껐더니 창에 그림자가 생겼어요: ○ → ★ → ☾',
 clue:'아홉 개의 등불이 모두 켜져 있어요. 한 칸을 누르면 <b>그 칸과 위·아래·양옆</b> 등불이 함께 바뀌어요. 모두 꺼 주세요.',
 build(c){lightsOut(c,this.clue);}});
setP('garden-5',{
 title:'씨앗 수납장의 다이얼',hints:['세 번의 시도 기록을 하나씩 소거해 가세요. 시도 1은 “맞은 자리 1개”예요.','시도 2와 3은 “맞은 자리 0개” — 그 자리에 오는 기호는 정답이 아니에요.','첫 번째 자리가 ○이면 ★, ☾ 중에서… 시도 2에서 ★○☾의 어느 자리가 가능한지 확인해요.'],
 nb:'수납장이 열렸어요. 정답 다이얼: ★ ○ ☾',
 clue:'수납장 다이얼은 ○ ★ ☾ <b>세 기호를 한 번씩</b> 써요. 이전 사람의 시도 기록으로 정답을 추리해 맞춰요.<table style="margin:6px auto;font-size:14px"><tr><td>○ ★ ☾</td><td>→ 맞은 자리 <b>1</b>개</td></tr><tr><td>☾ ★ ○</td><td>→ 맞은 자리 <b>0</b>개</td></tr><tr><td>★ ☾ ○</td><td>→ 맞은 자리 <b>0</b>개</td></tr></table>',
 build(c){dials(c,this.clue);}});

// ---------- 달빛 방 ----------
setP('moon-1',{hints:['곡선이 끊기지 않고 이어지는 조각끼리 붙여요.','가운데 조각(🔭)부터 놓고 주변을 채워요.','왼쪽 위 모서리는 🌙, 오른쪽 아래는 🌌예요.'],
 title:'달 엽서 복원',clue:'엽서 아홉 장을 3×3으로 맞춰 하나의 지도로 만들어요. 금빛 <b>곡선이 끊기지 않고</b> 이어져야 하고, 아홉 그림이 한 번씩 나와요. (두 장을 차례로 눌러 서로 바꿔요)',
 build(c){postcards9(c,this.clue);}});
setP('moon-2',{
 title:'다른 별자리 하나',hints:['네 개는 같은 별자리를 돌려 놓은 것이에요. 돌려서 겹쳐지지 않는 것이 거울에 비친 것이에요.','가장 긴 선이 어디에서 시작하는지, 꺾이는 방향이 시계방향인지 보세요.','선을 따라 별을 하나씩 짚으며 꺾이는 방향(오른쪽/왼쪽)을 비교해요.'],
 nb:'엽서 지도의 별자리 중 거울에 비친 것(다른 하나)을 찾았어요.',
 clue:'망원경에 별자리 다섯 개가 보여요. 네 개는 <b>같은 별자리를 돌려 놓은 것</b>이고, 하나만 <b>거울에 비친(뒤집힌)</b> 별자리예요. 다른 하나를 찾아요.',
 build(c){mirrorOdd(c,this.clue);}});
setP('moon-5',{
 title:'달 상자의 저울',hints:['여덟 개를 3개·3개·2개로 나눠요. 처음엔 3개씩 저울에 올려 보세요.','저울이 한쪽으로 기울면 그쪽 3개 안에 있어요. 평형이면 올리지 않은 2개 안에 있어요.','남은 후보가 3개 이하일 때 한 번만 더 재면 확실히 알 수 있어요.'],
 nb:'달 조각 중 가장 무거운 것을 두 번의 계량으로 찾았어요. 꽃다락 열쇠를 얻었어요.',
 clue:'똑같이 생긴 달 조각 8개 중 <b>하나만 조금 더 무거워요</b>. 저울을 <b>딱 두 번만</b> 써서 무거운 조각을 찾아요. (조각을 눌러 왼쪽/오른쪽 접시에 올려요)',
 build(c){weigh(c,this.clue);}});

// ---------- 꽃다락 ----------
setP('flower-1',{
 title:'압화 스도쿠',hints:['가로줄·세로줄·굵은 2×2 칸 안에 네 가지 꽃이 한 번씩 들어가요.','맨 윗줄에서 비어 있는 두 칸은 🪻🌷 중 하나씩이에요. 세로줄을 보면 정해져요.','🌼는 이미 각 줄에 있는지 확인하며 하나씩 채워요.'],
 nb:'압화 판의 꽃 배치를 맞췄어요. 꽃말 카드가 나왔어요.',
 clue:'압화 판 4×4의 빈칸에 꽃을 채워요. <b>가로줄, 세로줄, 굵은 2×2 칸마다 네 가지 꽃(🌼 🪻 🌷 🌹)이 한 번씩</b>만 들어가야 해요. 빈칸을 눌러 꽃을 바꿔요.',
 build(c){sudoku4(c,this.clue);}});
setP('flower-2',{
 title:'거짓말하는 꽃',hints:['한 송이만 진실을 말하고 나머지는 거짓이에요.','튤립의 말이 참이라면 데이지와 라벤더가 둘 다 거짓이어야 하는데, 데이지의 말을 따져 보세요.','라벤더가 참이라고 가정하면 나머지 둘의 말이 모두 거짓이 되는지 확인해요.'],
 nb:'진실을 말한 꽃은 라벤더. 데이지와 튤립은 거짓말을 했어요.',
 clue:'꽃 세 송이 중 <b>한 송이만 진실</b>을 말하고, 나머지는 거짓말을 해요.<br>🌼 데이지: “라벤더는 거짓말쟁이야.”<br>🪻 라벤더: “튤립은 거짓말쟁이야.”<br>🌷 튤립: “데이지와 라벤더, 둘 다 거짓말쟁이야.”<br>누가 진실을 말했을까요?',
 build(c){textChoice(c,{clue:this.clue,answer:'lav',options:[['dai','🌼 데이지'],['lav','🪻 라벤더'],['tul','🌷 튤립']],bad:'그 꽃이 진실이라면 나머지 두 꽃의 말이 모두 거짓이 되는지 확인해 보세요.'});}});
setP('flower-3',{
 title:'꽃병 줄 세우기',hints:['“데이지는 맨 왼쪽”이 가장 확실해요.','튤립은 수국보다 왼쪽이고, 장미는 4번째 아니면 5번째예요.','라벤더는 튤립 바로 옆이지만 튤립보다 왼쪽이니, 라벤더는 2번째.'],
 nb:'꽃병의 꽃 순서(왼쪽부터): 데이지 → 라벤더 → 튤립 → 장미 → 수국',
 clue:'꽃병 홈 다섯 칸에 꽃을 왼쪽부터 꽂아요. 단서를 모두 만족해야 해요.',
 build(c){const F=[['데이지','🌼'],['라벤더','🪻'],['튤립','🌷'],['장미','🌹'],['수국','💠']];
  arrange(c,{clue:this.clue,list:['데이지는 <b>맨 왼쪽</b>에 있어요.','라벤더는 튤립 <b>바로 옆</b>에 있고, 튤립보다 <b>왼쪽</b>이에요.','수국은 맨 왼쪽이 아니고, 튤립보다 <b>오른쪽</b>이에요.','장미는 <b>4번째나 5번째</b>예요.','장미는 수국보다 <b>왼쪽</b>이에요.'],items:F.map(([n,e])=>({id:n,html:chipIcon(e,n)})),answer:F.map(f=>f[0]),labels:['왼쪽','','','','오른쪽']});}});
setP('flower-4',{
 title:'꽃잎 장수 세기',hints:['쪽마다 꽃잎 수를 따로 계산하고 더해요.','1·2쪽: 데이지 3×5 = 15장, 튤립 2×6 = 12장 → 한 쪽에 27장.','3쪽에는 데이지만 있어요: 15장.'],
 nb:'압화 책의 꽃잎은 모두 69장. 서랍 암호의 단서를 얻었어요.',
 clue:'압화 책은 <b>3쪽</b>이에요. 1쪽과 2쪽에는 각각 <b>데이지 3송이</b>(꽃잎 5장씩)와 <b>튤립 2송이</b>(꽃잎 6장씩)가, 3쪽에는 <b>데이지 3송이</b>만 눌려 있어요. 꽃잎은 모두 몇 장일까요?',
 build(c){numQ(c,{clue:this.clue,answer:69,unit:'장'});}});
setP('flower-5',{
 title:'서랍 옮기기 — 여우와 토끼와 당근',hints:['여우와 토끼만 남겨 두면 안 되고, 토끼와 당근만 남겨 두어도 안 돼요.','처음에는 토끼를 먼저 건너편으로 데려가야 해요.','돌아올 때 토끼를 다시 데리고 오는 것이 열쇠예요.'],
 nb:'모두 안전하게 건넜어요. 압화 서랍에서 리본 방 열쇠를 얻었어요.',
 clue:'농부가 🦊 여우, 🐰 토끼, 🥕 당근을 배에 태워 건너편 강둑으로 옮겨요. 배에는 농부와 <b>하나만</b> 탈 수 있어요. 농부가 없을 때 <b>여우와 토끼</b>, 또는 <b>토끼와 당근</b>만 남으면 안 돼요.',
 build(c){river(c,this.clue);}});

// ---------- 리본 방 ----------
setP('ribbon-1',{
 title:'리본 탑 옮기기',hints:['큰 조각 위에 작은 조각만 올릴 수 있어요.','가장 큰 조각을 옮기려면 위의 두 조각을 먼저 비워야 해요.','7번 만에 옮길 수 있어요. 작은 조각을 오른쪽→가운데→… 규칙적으로 움직여 보세요.'],
 nb:'리본 탑을 가운데로 옮겼어요. 상자 위 주문서 조각이 보였어요.',
 clue:'리본 세 개가 왼쪽 기둥에 쌓여 있어요. <b>오른쪽 기둥</b>으로 옮겨요. 한 번에 한 개씩, <b>큰 리본 위에 작은 리본만</b> 올릴 수 있어요. (기둥을 눌러 위의 리본을 들고, 놓을 기둥을 눌러요)',
 build(c){hanoi(c,this.clue);}});
setP('ribbon-2',{
 title:'십자 리본 길이',hints:['한 변 10cm인 정육면체 상자를 한 방향으로 감으면 4면 × 10cm = 40cm예요.','십자로 두르면 방향이 두 번이에요.','매듭에 쓰는 20cm도 더해요.'],
 nb:'상자를 십자로 묶는 리본은 총 100cm.',
 clue:'한 변이 <b>10cm</b>인 정육면체 상자를 리본으로 <b>십자</b>로 한 바퀴씩 두르고(위·아래·옆면을 지나게), 매듭에 <b>20cm</b>를 써요. 리본은 모두 몇 cm 필요할까요?',
 build(c){numQ(c,{clue:this.clue,answer:100,unit:'cm'});}});
setP('ribbon-3',{
 title:'리본 자르기',hints:['리본을 한 번 자르면 두 조각, 두 번 자르면 세 조각…','10조각이 되려면 몇 번 잘라야 할까요?','조각 수보다 한 번 적게 자르면 돼요.'],
 nb:'리본 100cm를 10cm씩 자르면 9번, 9분.',
 clue:'길이 <b>100cm</b> 리본을 <b>10cm씩</b> 자르려고 해요. 한 번 자르는 데 <b>1분</b>이 걸리고, 자르는 동안만 시간이 흘러요. 모두 자르는 데 몇 분이 걸릴까요?',
 build(c){numQ(c,{clue:this.clue,answer:9,unit:'분'});}});
setP('ribbon-4',{
 title:'보관함 암호 추리',hints:['123이 “숫자만 맞고 자리는 다른 것 2개”예요. 1, 2, 3 중 두 개가 암호에 있어요.','456은 “숫자와 자리 모두 맞는 것 1개”예요. 4, 5, 6 중 하나.','347과 015, 419의 기록을 겹쳐 보면 3과 4와 1이 남아요.'],
 nb:'보관함 암호는 4·3·1. 구름 방 열쇠와 작은 태엽을 얻었어요.',
 clue:'보관함 자물쇠는 <b>서로 다른 숫자 3개</b>예요. 리본 장인이 남긴 시도 기록으로 암호를 추리해요.',
 build(c){mastermind(c,{clue:this.clue,rows:[['123',0,2],['456',1,0],['347',0,2],['015',0,1],['419',1,1]],answer:'431'});}});
setP('ribbon-5',{
 title:'리본 마방진',hints:['가로·세로·대각선 합이 모두 15인 3×3 판이에요. 가운데 칸은 항상 5예요.','주어진 8, 7, 2를 이용해 가운데와 모서리를 하나씩 정해요.','맨 윗줄 8 + □ + □ = 15. 7이 있는 줄에서 단서를 찾아요.'],
 nb:'마방진 완성. 상자가 열리고 작은 태엽이 나왔어요.',
 clue:'1부터 9까지의 숫자를 한 번씩 써서, <b>가로·세로·대각선의 합이 모두 15</b>가 되게 3×3 칸을 채워요. 이미 놓인 숫자가 있어요.',
 build(c){magic(c,this.clue);}});

// ---------- 구름 방 ----------
setP('cloud-1',{
 title:'오르골의 규칙',hints:['같은 기호가 몇 번씩 나오는지 세어 보세요.','⭐ 1번, ☁️ 1번, 🌙 1번, 그다음 ⭐ 2번, ☁️ 2번, 🌙 2번…','다음은 ⭐ 3번 ☁️ 3번 🌙 3번이에요. 지금 마지막까지 나온 것을 보고 이어지는 기호를 찾아요.'],
 nb:'오르골의 노래는 1·1·1, 2·2·2… 규칙. 태엽이 맞물려요.',
 clue:'오르골이 노래를 시작했어요: <div class="big" style="letter-spacing:2px;font-size:20px;text-align:center;margin:6px 0">⭐ ☁️ 🌙 ⭐ ⭐ ☁️ ☁️ 🌙 🌙 ⭐ ⭐ ⭐ ☁️ ☁️ ☁️ ?</div>물음표에는 어떤 기호가 올까요?',
 build(c){textChoice(c,{clue:this.clue,answer:'moon',options:[['star','⭐ 별'],['cloud','☁️ 구름'],['moon','🌙 달']],bad:'각 기호가 연달아 나오는 횟수를 세어 보세요.'});}});
setP('cloud-2',{
 title:'종의 순서',hints:['“별 바로 뒤에 구름”은 둘이 붙어 있다는 뜻이에요.','달은 첫 번째가 아니고, 종은 달보다 앞이에요. 종도 첫 번째가 아니에요.','첫 번째는 별뿐이에요. 별, 구름, 그리고…'],
 nb:'종소리 순서: 별 → 구름 → 종 → 달.',
 clue:'네 개의 종을 차례로 울려야 오르골이 열려요. 순서를 추리해요.',
 build(c){arrange(c,{clue:this.clue,list:['구름 종은 별 종 <b>바로 뒤</b>에 울려요.','달 종은 <b>첫 번째가 아니에요</b>.','종 모양 종(🔔)은 달 종보다 <b>앞</b>이에요.','별 종은 <b>마지막이 아니에요</b>.','🔔 종은 <b>첫 번째가 아니에요</b>.'],items:[{id:'star',html:chipIcon('⭐','별 종')},{id:'cloud',html:chipIcon('☁️','구름 종')},{id:'moon',html:chipIcon('🌙','달 종')},{id:'bell',html:chipIcon('🔔','종 모양 종')}],answer:['star','cloud','bell','moon'],labels:['1번째','2번째','3번째','4번째']});}});
setP('cloud-3',{
 title:'거꾸로 읽는 수',hints:['네 자리 수에 4를 곱하면 네 자리 수가 나와요. 그러니 첫 자리 A는 1 또는 2예요.','4×D의 일의 자리가 A예요. A가 짝수여야 하니 A는 2예요.','D는 8이에요(4×8=32). 이제 B와 C를 찾아요.'],
 nb:'ABCD × 4 = DCBA 인 수는 2178 (2178×4=8712).',
 clue:'네 자리 수 <b>ABCD</b>에 <b>4</b>를 곱하면 숫자를 거꾸로 쓴 <b>DCBA</b>가 돼요. (예: 1234 × 4 ≠ 4321 이지만, 딱 하나의 수가 그래요!) ABCD는 얼마일까요? (A는 0이 아니에요)',
 build(c){numQ(c,{clue:this.clue,answer:2178});}});
setP('cloud-5',{
 title:'정직한 종',hints:['한 종만 진실이에요. 세 종의 말은 서로 모순돼요.','“거짓말쟁이는 정확히 2명”이 진실이라면 거짓말쟁이는 나머지 둘이에요.','그러면 “정확히 1명”과 “3명 모두”의 말이 거짓인지 확인해요.'],
 nb:'파란 종만 진실을 말했어요. 기억 서랍이 열리고 별 상자 방 열쇠를 얻었어요.',
 clue:'세 개의 종이 말해요. (진실만 말하는 종과 거짓만 말하는 종이 있어요)<br>🔴 빨간 종: “우리 셋 중 거짓말쟁이는 <b>정확히 1명</b>이야.”<br>🔵 파란 종: “우리 셋 중 거짓말쟁이는 <b>정확히 2명</b>이야.”<br>🟢 초록 종: “우리 셋은 <b>모두</b> 거짓말쟁이야.”<br>진실을 말하는 종은 누구일까요?',
 build(c){textChoice(c,{clue:this.clue,answer:'blue',options:[['red','🔴 빨간 종'],['blue','🔵 파란 종'],['green','🟢 초록 종']],bad:'그 종이 진실이라면 다른 두 종의 말이 거짓이 되는지 확인해 보세요.'});}});

// ---------- 별 상자 방 ----------
setP('star-1',{
 title:'일곱 기억 조각의 수수께끼',hints:['앞의 일곱 방을 떠올려 보세요. 각 방에서 얻은 조각을 📒 기록장에서 확인할 수 있어요.','“아침의 시작”은 서재에서 얻은 조각이에요.','종소리를 담은 방은 구름 방이에요.'],
 nb:'일곱 기억 조각을 장치에 모았어요.',
 clue:'기억 조각 일곱 개를 <b>수수께끼에 맞는 홈</b>에 놓아요. 홈에는 조각의 이름 대신 설명이 적혀 있어요.',
 build(c){const names=['해','꽃','잎','달','나비','리본','종'],P=X.st.inventory;
  const riddle={해:'서재에서 얻은, 아침을 여는 조각',꽃:'시계방에서 얻은, 멈춘 시간 속에 핀 조각',잎:'온실에서 자란 초록 조각',달:'밤하늘에서 얻은, 차오르는 조각',나비:'꽃다락에서 날아온 조각',리본:'매듭을 묶던 리본 방의 조각',종:'구름 방 오르골 옆의 소리 조각'};
  const own=names.filter(n=>P.includes('mem-'+n));
  if(own.length<names.length){c.body.innerHTML=clueBox(this.clue)+`<p class="msg">아직 못 찾은 조각이 있어요. 중앙홀로 돌아가 앞의 방을 모두 풀어 봐요. (${own.length}/7)</p>`;return;}
  const em={해:'🌞',꽃:'🌸',잎:'🍃',달:'🌙',나비:'🦋',리본:'🎀',종:'🔔'};
  matchPairs(c,{clue:this.clue,items:names.map(n=>({id:n,html:chipIcon(em[n],n)})),targets:shuffle(names).map(n=>({id:n,html:`<div class="big" style="opacity:.35">❔</div><small style="max-width:92px;line-height:1.3">${riddle[n]}</small>`})),map:Object.fromEntries(names.map(n=>[n,n]))});}});
setP('star-2',{
 title:'편지의 순서 — 방을 걸은 길',hints:['서재에서 시작했어요. 시계방은 서재 바로 다음이에요.','구름 방은 마지막, 달빛 방은 온실 바로 다음이에요.','꽃다락은 달빛 방 뒤에, 리본 방은 꽃다락 바로 뒤에 있어요.'],
 nb:'일곱 장의 편지 순서: 서재 → 시계방 → 온실 → 달빛 방 → 꽃다락 → 리본 방 → 구름 방. 마지막 편지: “빛을 따라 돌아와. 아침의 해, 자란 잎, 함께 본 달, 묶은 리본을 차례로 켜 줘.”',
 clue:'일곱 장의 편지를 <b>내가 방을 지나온 순서</b>대로 정리해요. 기억나는 것을 단서로 순서를 추리해요.',
 build(c){const r=X.ROOMS.slice(0,7);arrange(c,{clue:this.clue,list:['서재가 <b>가장 처음</b>이에요.','시계방은 서재 <b>바로 다음</b>이에요.','달빛 방은 온실 <b>바로 다음</b>이에요.','구름 방이 <b>가장 마지막</b>이에요.','리본 방은 꽃다락 <b>바로 다음</b>이고, 꽃다락은 달빛 방보다 <b>뒤</b>예요.'],items:r.map(x=>({id:x.id,html:chipIcon(x.icon,x.name)})),answer:r.map(x=>x.id),labels:['1','2','3','4','5','6','7']});}});
setP('star-3',{
 title:'기억의 네 불빛',hints:['마지막 편지를 다시 읽어 보세요. 📒 기록장에 있어요.','“아침의 해”가 처음이고 “묶은 리본”이 마지막이에요.','잎은 달보다 앞이에요.'],
 nb:'네 불빛이 켜졌어요: 해 → 잎 → 달 → 리본.',
 clue:'마지막 편지의 조건에 맞게 <b>네 개의 불빛</b>(일곱 조각 중 네 개)을 켜는 순서를 정해요. 조건:',
 build(c){const em={해:'🌞',꽃:'🌸',잎:'🍃',달:'🌙',나비:'🦋',리본:'🎀',종:'🔔'};
  arrange(c,{clue:this.clue,list:['편지는 “<b>아침</b>의 …”으로 시작해요. 해가 첫 번째.','편지는 “…<b>묶은</b> …”으로 끝나요. 리본이 마지막(네 번째).','“자란 잎”은 “함께 본 달”보다 <b>앞</b>에 나와요.','네 불빛은 <b>해, 잎, 달, 리본</b> 네 가지예요.'],items:Object.keys(em).map(n=>({id:n,html:chipIcon(em[n],n)})),answer:['해','잎','달','리본'],labels:['1','2','3','4']});}});
setP('star-5',{
 title:'선물의 비밀',hints:['이 저택의 방들이 숨긴 것은 무엇이었나요? 겁주는 것이 아니었어요.','잠긴 문과 메모들은 “누군가를 기다리며” 준비한 것이었어요.','기억, 편지, 뜨개 천사… 모두 같은 마음에서 나왔어요.'],
 nb:'별 상자를 열었어요.',
 clue:'열쇠를 상자에 꽂기 전, 마지막 질문이에요. 이 저택의 잠긴 방들이 지켜 준 것은 무엇이었을까요?',
 build(c){textChoice(c,{clue:this.clue,answer:'gift',options:[['mon','무서운 괴물'],['gift','돌아올 친구를 위한 선물과 마음'],['trea','숨겨 둔 보물 지도'],['ghost','떠도는 유령']],bad:'방마다 남은 메모를 다시 읽어 보세요. 겁주는 이야기가 아니었어요.'});}});
// star-4 : 열쇠 조각 맞추기 — 함정 조각 추가
setP('star-4',{
 title:'마지막 열쇠',hints:['별 모양 홈이 앞 조각의 오른쪽 끝에 있어요. 뒷조각 왼쪽 끝이 그 홈에 꼭 맞아야 해요.','꽂히는 부분의 톱니 개수와 방향도 같아야 해요.','틈이 보이거나 톱니가 겹치는 조각은 맞지 않아요.'],
 clue:'열쇠의 앞 조각은 오른쪽 끝에 <b>톱니 3개</b>(▶▶▶)가 있어요. 뒷 조각 중 <b>톱니가 정확히 맞물리는</b> 것을 골라요.<div class="row">'+svg(110,60,'<path d="M0,12 H70 L80,20 L70,28 L80,36 L70,44 H0 Z" fill="#f5d58a" stroke="#8a6f60" stroke-width="3"/><path d="M14,30 l3,-8 3,8 -8,-5 10,0z" fill="#fff" stroke="#8a6f60"/>')+'</div>',
 build(c){const back=(id,d)=>({id,html:svg(110,60,`<path d="${d}" fill="#f5d58a" stroke="#8a6f60" stroke-width="3"/>`)});
  choose(c,{clue:this.clue,answer:'ok',options:[back('ok','M110,12 H40 L30,20 L40,28 L30,36 L40,44 H110 Z'),back('a','M110,12 H40 L50,20 L40,28 L50,36 L40,44 H110 Z'),back('b','M110,12 H40 L30,24 L40,36 L30,44 H110 Z'),back('c','M110,12 H40 L30,18 L40,26 L30,34 L40,42 L30,50 H110 Z'),back('d','M110,12 H40 L32,20 L40,28 L32,36 L40,44 H110 Z')],wrong:'톱니 개수와 모양이 정확히 맞아야 해요.'});}});

// ======================= 새 퍼즐 도구들 =======================
function slidePuzzle(c,clue){
 let a=[1,2,3,4,5,6,7,8,0],blank=8,moves=0;const nb=i=>[i-3,i+3,i%3?i-1:-1,i%3<2?i+1:-1].filter(j=>j>=0&&j<9);
 for(let n=0,prev=-1;n<70;n++){const o=nb(blank).filter(j=>j!==prev),j=o[Math.floor(Math.random()*o.length)];[a[blank],a[j]]=[a[j],a[blank]];prev=blank;blank=j;}
 c.body.innerHTML=clueBox(clue)+'<div class="tiles" id="tl" style="grid-template-columns:repeat(3,64px)"></div><p class="msg" id="mv"></p>';
 const draw=()=>{$('#tl').innerHTML=a.map((v,i)=>v?`<button type="button" class="tile" data-i="${i}" aria-label="${v}번 조각">${v}</button>`:'<div class="tile blank"></div>').join('');$('#mv').textContent='움직인 횟수 '+moves;
  $('#tl').querySelectorAll('.tile[data-i]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(!nb(i).includes(blank))return;sfx('pop');[a[blank],a[i]]=[a[i],a[blank]];blank=i;moves++;draw();if(a.every((v,k)=>v===(k<8?k+1:0)))c.solve();});};
 draw();
}
function lightsOut(c,clue){
 const s=Array(9).fill(1);c.body.innerHTML=clueBox(clue)+'<div class="tiles" id="lt" style="grid-template-columns:repeat(3,70px)"></div><p class="msg" id="lm"></p>';let n=0;
 const tog=i=>{const r=(i/3)|0,cc=i%3;[[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc])=>{const rr=r+dr,c2=cc+dc;if(rr>=0&&rr<3&&c2>=0&&c2<3)s[rr*3+c2]^=1;});};
 const draw=()=>{$('#lt').innerHTML=s.map((v,i)=>`<button type="button" class="tile" data-i="${i}" aria-label="${i+1}번 등불 ${v?'켜짐':'꺼짐'}" style="width:70px;height:70px;background:${v?'#ffe9a0':'#4a3f58'};box-shadow:${v?'0 0 14px #ffe9a0':'none'};font-size:30px">${v?'💡':''}</button>`).join('');$('#lm').textContent='누른 횟수 '+n;
  $('#lt').querySelectorAll('.tile').forEach(b=>b.onclick=()=>{sfx('pop');tog(+b.dataset.i);n++;draw();if(s.every(v=>!v))c.solve();});};
 draw();
}
function jugs(c,clue){
 const cap=[3,5];let w=[0,0],mv=0;c.body.innerHTML=clueBox(clue)+'<div class="cupwrap" id="cw"></div><div class="row" id="jb"></div><p class="msg" id="jm"></p>';
 const draw=()=>{$('#cw').innerHTML=[0,1].map(i=>`<div><div class="cup" style="width:${i?70:54}px;height:${cap[i]*26+8}px;border:3px solid #8a6f60;border-radius:6px 6px 18px 18px;background:linear-gradient(to top,#8fc3e0 ${w[i]/cap[i]*100}%,#fff ${w[i]/cap[i]*100}%)"></div><div class="lab">${cap[i]}컵 통<br><b style="font-size:18px">${w[i]}</b>컵</div></div>`).join('');
  $('#jm').textContent='움직인 횟수 '+mv;};
 const B=[['3컵 통 채우기',()=>w[0]=3],['5컵 통 채우기',()=>w[1]=5],['3컵 통 비우기',()=>w[0]=0],['5컵 통 비우기',()=>w[1]=0],['3컵 → 5컵 붓기',()=>{const t=Math.min(w[0],5-w[1]);w[0]-=t;w[1]+=t;}],['5컵 → 3컵 붓기',()=>{const t=Math.min(w[1],3-w[0]);w[1]-=t;w[0]+=t;}]];
 $('#jb').innerHTML=B.map((b,i)=>`<button type="button" class="chip" data-i="${i}" style="font-size:12.5px">${b[0]}</button>`).join('');
 $('#jb').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{sfx('pop');B[+b.dataset.i][1]();mv++;draw();if(w[1]===4||w[0]===4)c.solve();});draw();
}
function weigh(c,clue){
 const heavy=Math.floor(Math.random()*8);let side=Array(8).fill(0),uses=0,pick=false;
 c.body.innerHTML=clueBox(clue)+'<div class="scale-row"><div><small>왼쪽 접시</small><div class="pan" id="pl"></div></div><div style="font-size:30px;align-self:center" id="sc">⚖️</div><div><small>오른쪽 접시</small><div class="pan" id="pr"></div></div></div><div class="row" id="po"></div><div class="row"><button type="button" class="btn" id="wc">초기화</button><button type="button" class="btn main" id="wg">저울에 올리기 (<span id="wn">2</span>번 남음)</button><button type="button" class="btn" id="wa" disabled>무거운 조각 고르기</button></div><p class="msg" id="wm"></p>';
 const stone=i=>`<button type="button" class="chip" data-i="${i}" style="min-height:42px;padding:4px 10px">${['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘'][i]} ${i+1}</button>`;
 const draw=()=>{$('#pl').innerHTML=side.map((s,i)=>s===1?stone(i):'').join('');$('#pr').innerHTML=side.map((s,i)=>s===2?stone(i):'').join('');$('#po').innerHTML=side.map((s,i)=>s===0?stone(i):'').join('');$('#wn').textContent=2-uses;$('#wa').disabled=uses<2&&!pick;
  c.body.querySelectorAll('.chip[data-i]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(pick){if(i===heavy)c.solve();else{c.bad('그 조각은 가벼워요. 저울 결과를 다시 정리해 보세요. (처음부터 다시 시작해요)');weigh(c,clue);}return;}side[i]=(side[i]+1)%3;sfx('pop');draw();});};
 $('#wc').onclick=()=>{side=Array(8).fill(0);draw();};
 $('#wg').onclick=()=>{if(pick)return;const L=side.filter(s=>s===1).length,Rr=side.filter(s=>s===2).length;if(!L||L!==Rr){c.bad('양쪽 접시에 같은 개수의 조각을 올려야 해요.');return;}if(uses>=2){c.bad('저울은 두 번만 쓸 수 있어요.');return;}
  uses++;const lh=side[heavy]===1,rh=side[heavy]===2;$('#sc').textContent=lh?'⚖️ ◀ 왼쪽이 무거워요':rh?'⚖️ ▶ 오른쪽이 무거워요':'⚖️ 평형!';$('#wm').textContent=`${uses}번째 결과: ${lh?'왼쪽 접시가 내려갔어요.':rh?'오른쪽 접시가 내려갔어요.':'양쪽이 같아요(무거운 조각은 올리지 않은 쪽).'}`;sfx('ok');side=Array(8).fill(0);draw();if(uses>=2){$('#wa').disabled=false;}};
 $('#wa').onclick=()=>{pick=true;$('#wm').textContent='이제 가장 무거운 조각을 눌러요!';$('#wg').disabled=true;draw();};
 draw();
}
function hanoi(c,clue){
 let peg=[[3,2,1],[],[]],holding=null,mv=0;const col=['#f2a7b5','#c9b3e6','#a9dccb'],w=[40,62,84];
 c.body.innerHTML=clueBox(clue)+'<div class="pegs" id="pg"></div><p class="msg" id="hm"></p>';
 const draw=()=>{$('#pg').innerHTML=peg.map((p,i)=>`<button type="button" class="peg${holding===i?' sel':''}" data-i="${i}" aria-label="${i+1}번 기둥">${p.map(d=>`<div class="disc" style="width:${w[d-1]}px;max-width:92%;background:${col[d-1]}"></div>`).join('')}</button>`).join('');$('#hm').textContent='움직인 횟수 '+mv;
  $('#pg').querySelectorAll('.peg').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;sfx('pop');if(holding===null){if(peg[i].length)holding=i;}else{if(holding===i){holding=null;}else{const d=peg[holding].at(-1),top=peg[i].at(-1);if(top&&top<d){c.bad('큰 리본 위에는 작은 리본만 올릴 수 있어요.');}else{peg[holding].pop();peg[i].push(d);mv++;holding=null;}}}
   draw();if(peg[2].length===3)c.solve();});};
 draw();
}
function sudoku4(c,clue){
 const sol=[[1,2,3,4],[3,4,1,2],[2,1,4,3],[4,3,2,1]],given=[[1,0,0,4],[0,4,1,0],[0,1,4,0],[4,0,0,1]];given[0][1]=2;
 const g=given.map(r=>r.slice()),S=['','🌼','🪻','🌷','🌹'];
 c.body.innerHTML=clueBox(clue)+'<div class="tiles" id="sd" style="grid-template-columns:repeat(4,58px);gap:4px"></div><div class="row"><button type="button" class="btn main" id="sk">확인</button></div>';
 const draw=()=>{$('#sd').innerHTML=g.map((r,y)=>r.map((v,x)=>`<button type="button" class="tile" data-y="${y}" data-x="${x}" style="width:58px;height:58px;font-size:26px;${given[y][x]?'background:#f4ecd9':''};${(x===1?'margin-right:6px;':'')+(y===1?'margin-bottom:6px;':'')}" ${given[y][x]?'disabled':''}>${S[v]}</button>`).join('')).join('');
  $('#sd').querySelectorAll('.tile:not([disabled])').forEach(b=>b.onclick=()=>{const y=+b.dataset.y,x=+b.dataset.x;g[y][x]=(g[y][x]+1)%5;sfx('pop');draw();});};
 $('#sk').onclick=()=>{if(g.flat().includes(0)){c.say('아직 빈칸이 남아 있어요.');return;}if(g.every((r,y)=>r.every((v,x)=>v===sol[y][x])))c.solve();else c.bad('같은 꽃이 한 줄이나 한 칸에 겹쳐 있어요. 다시 확인해 보세요.');};
 draw();
}
function river(c,clue){
 let L=['fox','rabbit','carrot'],Rr=[],boat=0,mv=0;const E={fox:'🦊 여우',rabbit:'🐰 토끼',carrot:'🥕 당근'};
 c.body.innerHTML=clueBox(clue)+'<div class="row" id="rv" style="align-items:flex-start;gap:14px"></div><p class="msg" id="rm"></p>';
 const bad=a=>(a.includes('fox')&&a.includes('rabbit'))||(a.includes('rabbit')&&a.includes('carrot'));
 const draw=()=>{const side=boat===0?L:Rr;
  $('#rv').innerHTML=`<div style="min-width:104px"><b>왼쪽 강둑</b><div id="lb" style="display:grid;gap:6px;margin-top:6px">${L.map(i=>`<button type="button" class="chip" data-m="${i}"${boat===0?'':' disabled'}>${E[i]}</button>`).join('')}</div></div><div style="min-width:90px;text-align:center;align-self:center">🧑‍🌾 농부는<br><b>${boat===0?'왼쪽':'오른쪽'}</b>에 있어요<br><button type="button" class="btn main" id="go" style="margin-top:6px">혼자 건너기</button></div><div style="min-width:104px"><b>오른쪽 강둑</b><div id="rb" style="display:grid;gap:6px;margin-top:6px">${Rr.map(i=>`<button type="button" class="chip" data-m="${i}"${boat===1?'':' disabled'}>${E[i]}</button>`).join('')}</div></div>`;
  $('#rm').textContent='건넌 횟수 '+mv+' · 동물이나 당근을 눌러 함께 건너요';
  const cross=item=>{sfx('pop');mv++;if(boat===0){if(item){L=L.filter(x=>x!==item);Rr.push(item);}boat=1;}else{if(item){Rr=Rr.filter(x=>x!==item);L.push(item);}boat=0;}
   const left=boat===0?Rr:L;  // 농부가 없는 강둑
   if(bad(left)){c.bad('농부가 없는 강둑에서 잡아먹히는 일이 생겼어요! 처음부터 다시 해 보세요.');river(c,clue);return;}
   draw();if(Rr.length===3)c.solve();};
  $('#rv').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>cross(b.dataset.m));$('#go').onclick=()=>cross(null);};
 draw();
}
function magic(c,clue){
 const sol=[8,1,6,3,5,7,4,9,2],given={0:8,5:7,8:2};const v=sol.map((x,i)=>given[i]?given[i]:'');
 c.body.innerHTML=clueBox(clue)+'<div class="tiles" id="mg" style="grid-template-columns:repeat(3,64px)"></div><div class="row"><button type="button" class="btn main" id="mk">확인</button></div>';
 $('#mg').innerHTML=sol.map((x,i)=>given[i]?`<div class="tile" style="background:#f4ecd9">${x}</div>`:`<input class="tile" data-i="${i}" inputmode="numeric" maxlength="1" aria-label="${i+1}번 칸" style="text-align:center;font:inherit;font-size:26px;font-weight:bold">`).join('');
 $('#mk').onclick=()=>{const n=sol.map((x,i)=>given[i]?given[i]:+($(`#mg [data-i="${i}"]`).value||0));if(n.includes(0)){c.say('모든 칸을 채워야 해요.');return;}
  const ok=new Set(n).size===9&&n.every(x=>x>=1&&x<=9)&&[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]].every(l=>l.reduce((s,i)=>s+n[i],0)===15);if(ok)c.solve();else c.bad('합이 15가 아닌 줄이 있거나 숫자가 겹쳤어요.');};
}
function seedBags(c,clue){
 const N=['🍃 잎','🌸 꽃','🍓 열매'],der=[[1,2,0],[2,0,1]][Math.floor(Math.random()*2)];   // 표찰 i 봉투에 실제로 들어 있는 것
 let opened=-1;c.body.innerHTML=clueBox(clue)+'<div class="row" id="sb"></div><p class="msg" id="sm">봉투 하나를 눌러 안을 열어 보세요. (한 번만 열 수 있어요)</p><div id="sa" hidden><p class="msg">세 봉투의 진짜 내용물을 골라 주세요.</p><div id="ss"></div><div class="row"><button type="button" class="btn main" id="sk">확인</button></div></div>';
 $('#sb').innerHTML=N.map((n,i)=>`<button type="button" class="chip" data-i="${i}" style="min-width:96px">📦<br>표찰: ${n}</button>`).join('');
 $('#sb').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{if(opened>=0)return;opened=+b.dataset.i;sfx('ok');b.innerHTML=`📭<br>표찰: ${N[opened]}<br>실제: <b>${N[der[opened]]}</b>`;b.classList.add('sel');$('#sm').textContent='';$('#sa').hidden=false;
  $('#ss').innerHTML=N.map((n,i)=>`<div class="stp"><span class="lab">표찰 ${n}</span><select data-i="${i}" style="font:inherit;font-size:15px;padding:6px;border:2px solid #8a6f60;border-radius:8px"><option value="">고르기</option>${N.map((m,j)=>`<option value="${j}">${m}</option>`).join('')}</select></div>`).join('');});
 $('#sk').onclick=()=>{const sel=[...c.body.querySelectorAll('#ss select')].map(s=>s.value);if(sel.includes('')){c.say('세 봉투 모두 골라 주세요.');return;}if(sel.every((v,i)=>+v===der[i]))c.solve();else c.bad('표찰과 같은 것은 없어요. 열어 본 봉투를 기준으로 다시 추리해 보세요.');};
}
function dials(c,clue){
 const S=['○','★','☾'],v=[0,0,0];c.body.innerHTML=clueBox(clue)+'<div class="row" id="dl"></div><div class="row"><button type="button" class="btn main" id="ok">열기</button></div>';
 const draw=()=>{$('#dl').innerHTML=v.map((x,i)=>`<button type="button" class="chip big" data-i="${i}" style="width:72px;height:72px">${S[x]}</button>`).join('');$('#dl').querySelectorAll('.chip').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;v[i]=(v[i]+1)%3;sfx('pop');draw();});};
 $('#ok').onclick=()=>{if(v[0]===1&&v[1]===0&&v[2]===2)c.solve();else c.bad('딸깍… 열리지 않아요. 시도 기록과 모순이 없는지 확인해 보세요.');};draw();
}
function mirrorOdd(c,clue){
 const base=[[14,18],[48,10],[60,48],[28,62],[78,80]],rot=(p,k)=>{let [x,y]=p;for(let i=0;i<k;i++)[x,y]=[100-y,x];return [x,y];},flipX=p=>[100-p[0],p[1]];
 const draw=(pts,k)=>{const q=pts.map(p=>rot(p,k));return svg(96,96,`<rect width="100" height="100" fill="#26324f" rx="8"/><polyline points="${q.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#9fb7e0" stroke-width="1.5"/>`+q.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3.6" fill="#fff"/>`).join(''));};
 const ks=shuffle([0,1,2,3]),odd=Math.floor(Math.random()*4),opts=[...ks.map(k=>({id:'r'+k,html:draw(base,k)})),{id:'odd',html:draw(base.map(flipX),odd)}];
 choose(c,{clue,answer:'odd',options:opts,wrong:'그 별자리는 돌려 놓은 것이에요. 거울에 비친(뒤집힌) 것을 찾아요.'});
}
function postcards9(c,clue){
 const glyph=['🌙','⭐','☁️','🪐','☄️','🌠','🔭','🦉','🌌'],cell=200/3;
 const scene=`<rect width="200" height="200" fill="#26324f"/>`+glyph.map((g,i)=>`<text x="${(i%3)*cell+cell/2}" y="${Math.floor(i/3)*cell+cell/2+8}" text-anchor="middle" font-size="26">${g}</text>`).join('')+`<path d="M0,40 C50,10 90,70 130,60 S190,120 200,150" stroke="#f5d58a" stroke-width="4" fill="none"/>`;
 const tile=i=>{const x=(i%3)*cell,y=Math.floor(i/3)*cell;return `<svg width="64" height="64" viewBox="${x} ${y} ${cell} ${cell}" aria-hidden="true" style="border-radius:6px">${scene}</svg>`;};
 orderSwap(c,{clue,items:glyph.map((_,i)=>({id:String(i),html:tile(i)})),answer:glyph.map((_,i)=>String(i))});
 const g=$('#sw');g.style.display='grid';g.style.gridTemplateColumns='repeat(3,auto)';g.style.justifyContent='center';
}
})();
