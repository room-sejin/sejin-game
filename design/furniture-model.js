(function(root){
 'use strict';
 // Room props cut out of assets/rooms/house-decorated-concept-v1.png (source pack: 그래픽-자료/04-소품/sejin-room-props-v1).
 // box = [x0,y0,x1,y1] in pixels on the 1024×1536 house canvas, so each piece lands exactly where it was drawn.
 // List order is front → back (first item is drawn on top), as in the pack's manifest.
 const CANVAS=[1024,1536];
 const CATEGORIES=[['furniture','가구'],['wall','벽 장식'],['plant','식물·조명'],['floor','러그·소품']];
 const PROPS=[
  ['bedSet','침대 세트','furniture','up','up-01-bed-set-v1.png',[57,345,502,598]],
  ['nightstand','협탁 세트','furniture','up','up-02-nightstand-set-v1.png',[469,339,565,545]],
  ['flowerRug','꽃 러그','floor','up','up-03-flower-rug-v1.png',[518,541,708,599]],
  ['yarnCorner','뜨개 바구니 세트','floor','up','up-04-yarn-basket-set-v1.png',[654,435,925,594]],
  ['curtains','꽃무늬 커튼','wall','up','up-05-curtains-v1.png',[543,182,829,480]],
  ['starLights','별 조명','plant','up','up-06-star-lights-v1.png',[424,41,572,257]],
  ['hangingPlantUp','걸이 화분','plant','up','up-07-hanging-plant-v1.png',[120,149,237,345]],
  ['ovalFrame','타원 꽃 액자','wall','up','up-08-oval-frame-v1.png',[43,270,96,372]],
  ['tulipFrame','튤립 액자','wall','up','up-09-tulip-frame-v1.png',[252,217,329,308]],
  ['cherryTapestry','체리 벽걸이','wall','up','up-10-cherry-tapestry-v1.png',[345,178,415,280]],
  ['photos','사진 벽 장식','wall','up','up-11-photos-v1.png',[335,271,478,379]],
  ['wallShelf','벽 선반','wall','up','up-12-wall-shelf-v1.png',[832,235,993,430]],
  ['mirror','타원 거울','wall','up','up-13-mirror-v1.png',[928,375,995,557]],
  ['catCushion','고양이 쿠션','floor','down','dn-01-cat-cushion-v1.png',[105,1089,250,1200]],
  ['yarnBasket','뜨개 바구니','floor','down','dn-02-yarn-basket-v1.png',[774,1095,929,1222]],
  ['rugSet','러그·티테이블 세트','floor','down','dn-03-rug-set-v1.png',[82,1149,949,1459]],
  ['sofaDesk','소파·책상 세트','furniture','down','dn-04-sofa-desk-set-v1.png',[264,861,947,1162]],
  ['bookshelf','책장 세트','furniture','down','dn-05-bookshelf-set-v1.png',[0,729,269,1211]],
  ['hangingPlantDown','걸이 화분','plant','down','dn-06-hanging-plant-v1.png',[268,734,345,865]],
  ['bunting','삼각 가랜드','wall','down','dn-07-bunting-v1.png',[345,731,623,805]],
  ['frames','액자 4개','wall','down','dn-08-frames-v1.png',[349,756,673,914]],
  ['pegboard','타공판','wall','down','dn-09-pegboard-v1.png',[680,750,839,920]],
  ['flowerOrnament','꽃 걸이 장식','wall','down','dn-10-flower-ornament-v1.png',[847,840,884,897]],
 ];
 const catalog={};
 PROPS.forEach(([type,name,category,level,file,box],i)=>{
  const [x0,y0,x1,y1]=box,[W,H]=CANVAS;
  catalog[type]={name,category,level,file:'props/'+file,box,
   w:(x1-x0)/W*100,h:(y1-y0)/H*100,x:(x0+x1)/2/W*100,y:(y0+y1)/2/H*100,z:PROPS.length-i};
 });
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 // Kept for free-move tools; preset props are not clamped so they stay exactly on their drawn spot.
 function move(item,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return item;
  const c=catalog[item.type];
  item.x=clamp(x,c.w/2+1,99-c.w/2);item.y=clamp(y,c.h/2+9,99-c.h/2);return item;
 }
 function create(type,id){const c=catalog[type];if(!c)throw new Error('Unknown furniture');return {id,type,x:c.x,y:c.y};}
 const api={catalog,categories:CATEGORIES,move,create};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.SejinFurniture=api;
})(typeof window==='undefined'?globalThis:window);
