/* Color-only variations of the approved basic room: never move its pixels. */
(function(root){
 'use strict';
 const parts=[
  {id:'wall',name:'벽지',color:'#d6ebd2',boxes:[[0,0,1024,604],[0,730,850,1150]],h:[75,165],s:.045,l:[.79,.98]},
  {id:'roof',name:'지붕',color:'#e87777',boxes:[[0,0,1024,270]],h:[345,15],s:.22,l:[.32,.89]},
  {id:'bed',name:'침대 침구',color:'#9ec7e4',boxes:[[78,350,456,573]],h:[185,235],s:.13,l:[.48,.97]},
  {id:'sofa',name:'소파',color:'#eda0ad',boxes:[[291,920,684,1147]],h:[330,15],s:.12,l:[.48,.96]},
  {id:'cushion',name:'바닥 방석',color:'#efcf84',boxes:[[273,1190,548,1314]],h:[36,64],s:.20,l:[.55,.97]}
 ];
 const colors=[
  {id:'original',name:'기본색',hex:null},
  {id:'apricot',name:'살구',hex:'#edbd9d'},
  {id:'lavender',name:'라벤더',hex:'#c9b8e5'},
  {id:'sage',name:'세이지',hex:'#adc9a2'},
  {id:'sky',name:'하늘',hex:'#a9cde5'},
  {id:'butter',name:'버터',hex:'#ecd18f'},
  {id:'rose',name:'로즈',hex:'#e7a5b7'}
 ];
 function hsl(r,g,b){
  r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;
  if(!d)return [0,0,l];
  let h=max===r?(g-b)/d+(g<b?6:0):max===g?(b-r)/d+2:(r-g)/d+4;
  return [h*60,d/(1-Math.abs(2*l-1)),l];
 }
 function rgb(h,s,l){
  const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
  const v=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return v.map(n=>Math.round((n+m)*255));
 }
 function inside(part,x,y){return part.boxes.some(([a,b,c,d])=>x>=a&&x<=c&&y>=b&&y<=d);}
 function matches(part,x,y,pixel){
  if(!inside(part,x,y))return false;
  const [h,s,l]=pixel,[a,b]=part.h;
  return (a>b?h>=a||h<=b:h>=a&&h<=b)&&s>=part.s&&l>=part.l[0]&&l<=part.l[1];
 }
 const api={parts,colors,hsl,rgb,matches};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 root.SejinRoomColors=api;
 const choices=Object.fromEntries(parts.map(p=>[p.id,'original']));
 // Chosen colours are saved (SejinSave.decor.colors) and restored on load; unknown values are ignored.
 const savedColors=(root.SejinSave&&root.SejinSave.decor.get().colors)||{};
 parts.forEach(p=>{if(colors.some(c=>c.id===savedColors[p.id]))choices[p.id]=savedColors[p.id];});
 const keep=()=>root.SejinSave&&root.SejinSave.decor.set({colors:{...choices}});
 const layer=document.createElement('canvas');layer.className='room-color-layer';layer.width=1024;layer.height=1536;layer.hidden=true;layer.setAttribute('aria-hidden','true');room.append(layer);
 const g=layer.getContext('2d');let source=null,masks=null,basic=false,issue='';
 const base=new Image();
 base.onload=async()=>{
  try{
   g.drawImage(base,0,0,1024,1536);source=g.getImageData(0,0,1024,1536);
   // Existing transparent prop silhouettes keep wall recoloring off plants and furniture.
   const protection=document.createElement('canvas');protection.width=1024;protection.height=1536;
   const pg=protection.getContext('2d');
   await Promise.all(Object.values(root.SejinFurniture.catalog).map(p=>new Promise(resolve=>{
    const img=new Image();img.onload=()=>{const [x0,y0,x1,y1]=p.box;pg.drawImage(img,x0,y0,x1-x0,y1-y0);resolve();};img.onerror=resolve;img.src='../assets/'+p.file;
   })));
   pg.fillRect(582,209,204,246);
   const protectedPixels=pg.getImageData(0,0,1024,1536).data;
   masks=parts.map(p=>{const hits=[];for(const [x0,y0,x1,y1] of p.boxes){
    for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
     const i=(y*1024+x)*4,v=hsl(source.data[i],source.data[i+1],source.data[i+2]);
     if(p.id==='wall'&&protectedPixels[i+3]>12)continue;
     if(matches(p,x,y,v))hits.push([i,v[1],v[2]]);
    }
   }return hits;});
   basic=room.dataset.theme==='basic';render();if(sheetKind==='decor')fillSheet();
  }catch(e){issue='색상 미리보기를 불러오지 못했어요. 게임 미리보기 주소에서 다시 열어 주세요.';layer.hidden=true;if(sheetKind==='decor')fillSheet();}
 };
 base.onerror=()=>{issue='기본 방 이미지를 불러오지 못했어요.';if(sheetKind==='decor')fillSheet();};
 base.src='../assets/rooms/house-basic-nochar-v1.png';
 function render(){
  if(!source||!masks)return;
  const output=new ImageData(new Uint8ClampedArray(source.data),1024,1536);
  parts.forEach((p,n)=>{
   const selected=colors.find(c=>c.id===choices[p.id]);if(!selected.hex)return;
   const hex=selected.hex.slice(1),[targetHue,targetSat,targetLight]=hsl(parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16));
   for(const [i,s,l] of masks[n]){
    // Preserve paper highlights, pencil shadows and every original pixel position.
    const sat=Math.min(.65,s*.55+targetSat*.45),light=Math.max(0,Math.min(1,l+(targetLight-.78)*.18));
    const converted=rgb(targetHue,sat,light);
    output.data[i]=converted[0];output.data[i+1]=converted[1];output.data[i+2]=converted[2];
   }
  });
  g.putImageData(output,0,0);layer.hidden=!basic||Object.values(choices).every(c=>c==='original');
  const preview=document.querySelector('.room-color-preview');
  if(preview)preview.getContext('2d').drawImage(layer,0,0,preview.width,preview.height);
 }
 window.addEventListener('sejin-theme',e=>{basic=e.detail.id==='basic';layer.hidden=!basic||!source||Object.values(choices).every(c=>c==='original');});
 let activePart=parts[0].id,roomTab='basic',tabTouched=false,evPick=null,tabTouchedEv=false;
 const oldFill=fillSheet;
 fillSheet=()=>{
  oldFill();if(sheetKind!=='decor')return;
  const host=document.createElement('section');host.className='room-color-settings';
  if(!tabTouched&&room.dataset.theme!=='basic'&&roomTab==='basic')roomTab='event';   // 이벤트 방이 적용 중이면 이벤트 탭을 보여 준다
  $('#sheetTitle').innerHTML='방 꾸미기<small>기본 방은 부분을 고르고 색을 눌러요.</small>';
  // Top tabs = room concepts: 기본 (this colour picker) and 이벤트 (example cards only until the event rooms are made).
  const tabsTop='<div class="room-tabs" role="tablist"><button type="button" role="tab" data-rtab="basic" aria-selected="'+(roomTab==='basic')+'">기본</button><button type="button" role="tab" data-rtab="event" aria-selected="'+(roomTab==='event')+'">이벤트</button></div>';
  const bindTop=()=>host.querySelectorAll('[data-rtab]').forEach(b=>b.onclick=()=>{tabTouched=true;roomTab=b.dataset.rtab;if(roomTab==='basic'&&window.SejinThemes&&window.SejinThemes.current()!=='basic'){window.SejinThemes.choose('basic');}fillSheet();});
  if(roomTab==='event'){
   $('#sheetTitle').innerHTML='방 꾸미기<small>방 분위기를 고르는 곳이에요.</small>';
   const T=window.SejinThemes;const cur=T&&T.current();
   if(T){if(!evPick||(!tabTouchedEv&&cur&&cur!=='basic'))evPick=(cur&&cur!=='basic')?cur:'christmas-a';tabTouchedEv=true;}
   const [pk,pv]=(evPick||'christmas-a').split('-'),applied=cur===evPick;
   host.innerHTML=tabsTop+(T?'<div class="part-tabs" role="tablist" style="margin-top:8px">'+T.events.map(([k,n,e])=>'<button type="button" role="tab" data-evc="'+k+'" aria-selected="'+(k===pk)+'"><img src="../assets/sejin-ui-event-'+k+'-v1.png" alt="" style="width:18px;height:18px;vertical-align:-3px;object-fit:contain" data-e="'+e+'" onerror="this.outerHTML=this.dataset.e"> '+n+'</button>').join('')+'</div>'+
    '<img class="room-event-preview" src="../assets/rooms/house-'+pk+'-'+pv+'-nochar-v1.png" alt="'+pk+' 방 큰 미리보기" style="width:100%;max-width:340px;aspect-ratio:2/3;object-fit:cover;display:block;margin:8px auto;border-radius:14px;border:2px solid #fff">'+
    '<div class="part-swatches">'+T.variants.map(([v,vn])=>'<button type="button" data-evv="'+v+'" aria-pressed="'+(v===pv)+'" aria-label="'+vn+' 방"><span style="font-size:18px">'+({a:'1',b:'2',c:'3'})[v]+'</span></button>').join('')+'</div>'+
    '<button type="button" class="color-reset" data-evapply style="margin-top:10px;width:100%" '+(applied?'disabled':'')+'>'+(applied?'지금 이 방으로 꾸며져 있어요':'이 방으로 꾸미기')+'</button>':'<p>준비 중이에요.</p>');
   host.querySelectorAll('[data-evc]').forEach(b=>b.onclick=()=>{evPick=b.dataset.evc+'-'+pv;fillSheet();});
   host.querySelectorAll('[data-evv]').forEach(b=>b.onclick=()=>{evPick=pk+'-'+b.dataset.evv;fillSheet();});
   const ap=host.querySelector('[data-evapply]');if(ap)ap.onclick=()=>{T.choose(evPick);};
   const oldPreview=$('#sheetBody .theme-preview');if(oldPreview)oldPreview.hidden=true;
   $('#sheetBody').append(host);bindTop();return;
  }
  // Preview first (bigger), then tabs for the part (벽지·지붕·침구·소파·방석), then the colours of the chosen part.
  const tabHtml=parts.map(p=>'<button type="button" role="tab" data-ptab="'+p.id+'" aria-selected="'+(p.id===activePart)+'">'+p.name+'</button>').join('');
  const part=parts.find(p=>p.id===activePart);
  host.innerHTML=tabsTop+'<h4>부분별 색상</h4><p class="color-help">가구 자리는 그대로, 부분을 고르고 색을 눌러 보세요.</p>'+
   '<canvas class="room-color-preview" width="480" height="720" role="img" aria-label="선택한 부분 색상을 적용한 기본 방 미리보기"></canvas>'+
   (issue?'<p role="status">'+issue+'</p>':!source?'<p role="status">색상을 준비하고 있어요…</p>':'')+
   '<div class="part-tabs" role="tablist">'+tabHtml+'</div>'+
   '<div class="part-swatches">'+colors.map(c=>'<button type="button" data-part="'+part.id+'" data-color="'+c.id+'" aria-label="'+part.name+' '+c.name+'" aria-pressed="'+(choices[part.id]===c.id)+'" '+(!source?'disabled':'')+'><i style="background:'+(c.hex||part.color)+'"></i><span>'+c.name+'</span></button>').join('')+'</div>'+
   '<button type="button" class="color-reset" '+(!source?'disabled':'')+'>모두 기본색으로</button>';
  const oldPreview=$('#sheetBody .theme-preview');if(oldPreview)oldPreview.hidden=true;
  $('#sheetBody').append(host);
  bindTop();
  host.querySelectorAll('[data-ptab]').forEach(b=>b.onclick=()=>{activePart=b.dataset.ptab;fillSheet();});
  host.querySelectorAll('[data-part]').forEach(button=>button.onclick=()=>{
   choices[button.dataset.part]=button.dataset.color;
   host.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   basic=true;render();keep();
  });
  host.querySelector('.color-reset').onclick=()=>{
   parts.forEach(p=>choices[p.id]='original');keep();
   host.querySelectorAll('[data-part]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color==='original')));render();
  };  render();
 };
})(typeof window==='undefined'?globalThis:window);
