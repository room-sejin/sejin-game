(function(root){
  'use strict';
  // Obstacle shapes. vx: extra speed toward Sejin on top of the floor scroll (the yarn ball rolls in).
  // from: progress (0..1) at which the kind starts to appear. double: needs a double jump to clear.
  const KINDS={
    ball:{w:48,h:44,vx:90},
    cone:{w:42,h:60},
    strand:{w:80,h:20},
    awl:{w:52,h:66,from:.08},
    scissors:{w:52,h:118,from:.3,double:true},
    triangle:{w:84,h:112,from:.3,double:true},
    ruler:{w:200,h:36,from:.3,double:true},
  };
  const COLORS=['#8fc3e0','#f2a7b5','#f5d58a','#a9cfa4','#c9b3e6'];
  const JUMP=720,DOUBLE_JUMP=640,GRAVITY=1800,SPAWN_X=1020,GAP=.9;
  // Later stages add Cookie-Run style pieces (never in the 세진이 stage):
  //  hang     – hangs from above down to `bottom` px over the ground; only ducking (숙이기) passes under it.
  //  pit      – a gap in the floor; falling in costs a heart and bounces Sejin back up.
  //  platform – a raised ledge at height y; Sejin lands on it from above and can run along it.
  //  coins    – little yarn balls to pick up (they become 실뭉치 in the room).
  const BODY=96,DUCK_BODY=44,DUCK_MIN=1.2,BOUNCE=760,LEDGE=[120,215];
  const EXTRA={hang:{w:[80,130],bottom:64},pit:{w:[110,170]},platform:{w:[340,480]}};
  const LOW=['cone','strand','awl'];
  // One stage per doll, easiest first. extras: chance per spawn of each special piece (the rest are
  // obstacles); from: progress at which a piece may appear; interval: seconds between spawns [base, random].
  const STAGES={
    sejin:{goal:250,speed:260},
    // trail: seconds between rows of yarn along the way, so every run offers about the same amount of thread.
    friend:{goal:300,speed:280,extras:{platform:.34,hang:.2},from:{hang:.08,platform:.05},tiers:2,interval:[1.4,.75],trail:1.5},
    shopkeeper:{goal:340,speed:316,extras:{platform:.34,hang:.22,pit:.16},from:{pit:.1,platform:.05},tiers:2,interval:[1.35,.7],trail:1.5},
    parkfriend:{goal:380,speed:338,extras:{platform:.34,hang:.22,pit:.22},from:{hang:.1,pit:.12,platform:.04},tiers:2,interval:[1.3,.65],trail:1.5},
    angel:{goal:430,speed:362,extras:{platform:.34,hang:.24,pit:.26},from:{hang:.1,pit:.12,platform:.04},tiers:2,interval:[1.05,.55],gap:.8,trail:1.5},
  };
  class Runner {
    constructor(random=Math.random,stage='sejin'){this.random=random;this.stageId=STAGES[stage]?stage:'sejin';this.stage=STAGES[this.stageId];this.goal=this.stage.goal;this.reset();this.status='ready';}
    reset(){this.status='running';this.x=140;this.y=0;this.vy=0;this.jumps=0;this.doubleTime=0;this.distance=0;this.elapsed=0;this.speed=this.stage.speed;this.obstacles=[];this.nextSpawn=3;this.health=3;this.invulnerable=0;this.hitTime=0;
      this.li=0;this.coins=[];this.coinCount=0;this.nextTrail=1;this.trailArch=false;this.support=null;this.duckHeld=false;this.duckTime=0;this.ducking=false;this.bounceTime=0;}
    get progress(){return Math.min(1,this.distance/this.goal);}
    get grounded(){return this.vy===0&&(this.y===0||!!this.support);}
    // First press jumps from the floor (or a ledge), a second press in the air jumps again.
    jump(){if(this.status!=='running'||this.jumps>=2)return false;this.vy=this.jumps===0?JUMP:DOUBLE_JUMP;this.jumps++;if(this.jumps===2)this.doubleTime=.4;this.support=null;this.duckTime=0;this.ducking=false;return true;}
    // Duck (숙이기, later stages): run bent low while held; a short tap still lasts DUCK_MIN seconds.
    duck(on=true){if(this.status!=='running'||!this.stage.extras)return false;if(on){this.duckHeld=true;this.duckTime=Math.max(this.duckTime,DUCK_MIN);}else this.duckHeld=false;return true;}
    // Seconds until an obstacle's front reaches Sejin, and until its back has passed.
    arrive(o){return (o.x-(this.x+30))/(this.speed+(o.vx||0));}
    clear(o){return (o.x+o.w-(this.x-28))/(this.speed+(o.vx||0));}
    over(p){return this.x+20>p.x&&this.x-20<p.x+p.w;}
    fits(o,gap=this.stage.gap||GAP){return this.obstacles.every(p=>this.arrive(o)-this.clear(p)>=gap);}
    between([a,b]){return a+this.random()*(b-a);}
    spawnObstacle(kinds){
      const names=(kinds||Object.keys(KINDS)).filter(k=>(KINDS[k].from||0)<=this.progress&&!(k==='strand'&&this.stage.extras));   // 실가닥은 인형 스테이지에서 뺌
      const start=Math.floor(this.random()*names.length)%names.length;
      // Keep a landing gap after every obstacle; fast balls must not catch up with long ones.
      for(let i=0;i<names.length;i++){const kind=names[(start+i)%names.length],o={kind,x:SPAWN_X,...KINDS[kind]};
        if(this.fits(o)){o.color=COLORS[Math.floor(this.random()*COLORS.length)%COLORS.length];this.place(o);return true;}}
      return false;
    }
    spawn(){
      const ex=this.stage.extras;if(!ex)return this.spawnObstacle();
      let r=this.random();
      for(const [piece,chance] of Object.entries(ex)){if(r<chance){if(this.progress>=((this.stage.from||{})[piece]||0))return this['add_'+piece]();break;}r-=chance;}
      return this.spawnObstacle();
    }
    add_hang(){const o={kind:'hang',x:SPAWN_X,w:Math.round(this.between(EXTRA.hang.w)),h:0,bottom:EXTRA.hang.bottom,color:COLORS[Math.floor(this.random()*5)%5]};if(!this.fits(o))return false;this.place(o);return true;}
    add_pit(){const o={kind:'pit',x:SPAWN_X,w:100,h:0};if(!this.fits(o))return false;this.place(o);return true;}
    // Where a yarn ball can be picked up at x: on the path Sejin takes there. Over a floor obstacle it floats
    // on the jump arc above it, over a pit at mid-jump, under a hang low enough to take while ducking.
    // Elsewhere it keeps the height it was given (floor row or arch). Rolling balls are ignored (they move on).
    yarnHeight(x,y){
      for(const o of this.obstacles){if(o.kind==='platform'||o.vx||o.oy||x<o.x-26||x>o.x+o.w+26)continue;
        if(o.kind==='hang')return Math.min(y,24);
        if(o.kind==='pit')return Math.max(y,80);
        return Math.max(y,o.h+(o.double?30:34));}
      return y;
    }
    // Put a hazard in, then move yarn already waiting there onto the path around it.
    // 구멍은 블록 바닥(폭 100px 칸)에 맞게 100px 격자에 붙인다(블록이 구멍 가장자리에서 잘리지 않게)
    snapPit(o){const wx=o.x+this.distance*50,sx=Math.round(wx/100)*100;o.x=sx-this.distance*50;o.w=Math.max(100,Math.round(o.w/100)*100);}
    place(o){if(o.kind==='pit')this.snapPit(o);this.obstacles.push(o);for(const c of this.coins)if(!c.ledge)c.y=this.yarnHeight(c.x,c.base);}
    // Yarn trail: a row of 4 on the floor, or an arch that needs a jump (never an arch where a hang is coming,
    // since jumping there would hit it). Uses its own timer, so hazards stay exactly as they are.
    add_trail(){const hang=this.obstacles.some(o=>o.kind==='hang'&&o.x+o.w>SPAWN_X-60),arch=!hang&&this.trailArch;this.trailArch=!this.trailArch;
      for(let i=0;i<4;i++){const x=SPAWN_X+i*44,base=arch?50+Math.sin(i/3*Math.PI)*70:26;this.coins.push({x,base,y:this.yarnHeight(x,base),color:COLORS[(i+(arch?2:0))%5]});}}
    // A ledge with yarn on top; under its middle there may be a pit or a low obstacle (take the high road or jump).
    add_platform(){
      const p={kind:'platform',x:SPAWN_X,w:Math.round(this.between(EXTRA.platform.w)),h:0,y:LEDGE[0]};if(!this.fits(p))return false;
      this.obstacles.push(p);
      for(let x=p.x+30;x<p.x+p.w-20;x+=46)this.coins.push({x,y:p.y+28,ledge:true,color:COLORS[Math.floor(x/46)%5]});
      if(this.stage.tiers>1&&p.w>=340){const q={kind:'platform',x:p.x+150,w:p.w-120,h:0,y:LEDGE[1]};this.obstacles.push(q);for(let x=q.x+30;x<q.x+q.w-20;x+=46)this.coins.push({x,y:q.y+28,ledge:true,color:'#f5d58a'});}
      const under=this.random();
      if(this.stage.extras.pit&&under<.4)this.place({kind:'pit',x:p.x+p.w/2-50,w:100,h:0});
      else if(under<.75){const LW=LOW.filter(k=>k!=='strand'),kind=LW[Math.floor(this.random()*LW.length)%LW.length];this.place({kind,x:p.x+p.w/2-KINDS[kind].w/2,...KINDS[kind],color:COLORS[Math.floor(this.random()*5)%5]});}
      return true;
    }
    // 직접 만든 배치(레이아웃): items = [{k,at,w?,y?,bottom?,v?}], at = 몇 m 지점(그 지점의 왼쪽 끝이 화면 x=0)에 놓을지. 있으면 무작위 대신 이 배치대로 나온다.
    addItem(it){const x=it.at*50-this.distance*50,k=it.k,color=COLORS[Math.floor(this.random()*5)%5];
      if(KINDS[k]){const sc=it.s||1,b=KINDS[k];this.place({kind:k,x,seed:it.at,...b,w:Math.round(b.w*sc),h:Math.round(b.h*sc),sc,oy:k==='ball'?0:(it.oy||0),color,v:it.v});}
      else if(k==='obj'){const s=it.s||1,w=Math.round((it.ar||1)*(it.h0||80)*s),h=Math.round((it.h0||80)*s);this.place({kind:'obj',x,w,h,oy:it.oy||0,img:it.img,deco:it.hit===false,double:h>=105,step:!!it.step&&it.hit!==false,y:(it.oy||0)+h,color});}
      else if(k==='hang'){this.place({kind:'hang',x,seed:it.at,w:it.w||100,h:0,bottom:it.bottom||EXTRA.hang.bottom,sc:it.s||1,color,v:it.v});}
      else if(k==='pit'){this.place({kind:'pit',x,w:it.w||130,h:0,wl:it.wl});}
      else if(k==='platform'){const p={kind:'platform',x,w:it.w||380,h:0,y:it.y||LEDGE[0],sb:it.sb};this.obstacles.push(p);for(let cx=p.x+30;cx<p.x+p.w-20;cx+=46)this.coins.push({x:cx,y:p.y+28,ledge:true,color:COLORS[Math.floor(cx/46)%5]});}}
    spawnLayout(){const L=this.layout;while(this.li<L.length&&L[this.li].at*50-this.distance*50<=SPAWN_X)this.addItem(L[this.li++]);}
    hurt(){if(this.invulnerable>0)return;this.health--;this.invulnerable=1.1;this.hitTime=.32;if(this.health===0)this.status='over';}
    update(dt){if(this.status!=='running')return;dt=Math.min(dt,.04);this.elapsed+=dt;this.distance+=this.speed*dt/50;this.invulnerable=Math.max(0,this.invulnerable-dt);this.hitTime=Math.max(0,this.hitTime-dt);this.doubleTime=Math.max(0,this.doubleTime-dt);
      this.duckTime=Math.max(0,this.duckTime-dt);this.bounceTime=Math.max(0,this.bounceTime-dt);
      if(this.support&&!this.over(this.support))this.support=null;   // ran off the end of a ledge
      if(this.support){this.vy=0;this.y=this.support.y;}
      else{
        const prevY=this.y;this.vy-=GRAVITY*dt;let y=this.y+this.vy*dt;
        if(this.vy<=0)for(const p of this.obstacles)if((p.kind==='platform'||p.step)&&this.over(p)&&prevY>=p.y-.5&&y<=p.y){y=p.y;this.vy=0;this.jumps=0;this.support=p;break;}
        if(!this.support&&y<=0){
          const pit=this.obstacles.find(p=>p.kind==='pit'&&this.x-8>p.x&&this.x+8<p.x+p.w);
          // Falling into a pit: lose a heart once, then a soft bounce carries Sejin over it.
          if(pit){if(!pit.contacted){pit.contacted=true;this.hurt();}y=0;this.vy=BOUNCE;this.jumps=1;this.bounceTime=.5;}
          else{y=0;this.vy=0;this.jumps=0;}
        }
        this.y=Math.max(0,y);
      }
      this.ducking=!!this.stage.extras&&this.grounded&&(this.duckHeld||this.duckTime>0);
      // No new obstacles in the final stretch, so the doll is finished on a clear floor.
      if(this.layout){this.spawnLayout();}else{const [base0,spread0]=this.stage.interval||[1.9,.9],sp=this.spacing||1,base=base0*sp,spread=spread0*sp;   // spacing<1: 좁은 화면(폰)에서 같은 시간에 더 자주
      this.nextSpawn-=dt;if(this.nextSpawn<=0){if(this.goal-this.distance<=18)this.nextSpawn=base+this.random()*spread;else this.nextSpawn=this.spawn()?base+this.random()*spread:.2;}}
      if(this.stage.trail){this.nextTrail-=dt;if(this.nextTrail<=0){this.nextTrail=this.stage.trail;if(this.goal-this.distance>12)this.add_trail();}}
      for(const o of this.obstacles){const roll=(o.vx||0)*dt;o.x-=this.speed*dt+roll;o.rolled=(o.rolled||0)+roll;
        if(o.kind==='platform'||o.kind==='pit'||o.deco||o.contacted||!(o.x<this.x+30&&o.x+o.w>this.x-28))continue;
        const hit=o.kind==='hang'?this.y+(this.ducking?DUCK_BODY:BODY)>o.bottom+7:o.oy?(this.y<o.oy+o.h-7&&this.y+BODY>o.oy+4):this.y<o.h-7;   // oy: 발판 위에 올려 둔 소품(그 높이에서만 부딪힘)
        if(hit){o.contacted=true;if(this.invulnerable===0){this.health--;this.invulnerable=1.1;this.hitTime=.32;if(this.health===0){this.status='over';break;}}}}
      this.obstacles=this.obstacles.filter(o=>o.x+o.w>-10);
      for(const c of this.coins){c.x-=this.speed*dt;if(!c.got&&Math.abs(c.x-this.x)<26&&c.y>=this.y-12&&c.y<=this.y+(this.ducking?DUCK_BODY:BODY)){c.got=true;this.coinCount++;}}
      this.coins=this.coins.filter(c=>c.x>-20&&!c.got);
      if(this.status==='running'&&this.distance>=this.goal){this.distance=this.goal;this.status='clear';}
    }
  }
  Runner.KINDS=KINDS;Runner.STAGES=STAGES;Runner.EXTRA=EXTRA;Runner.BODY=BODY;Runner.DUCK_BODY=DUCK_BODY;Runner.DUCK_MIN=DUCK_MIN;
  root.Runner=Runner;if(typeof module!=='undefined')module.exports=Runner;
})(typeof globalThis!=='undefined'?globalThis:this);
