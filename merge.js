/* 실타래 합치기 (실 가게): drop yarn into a basket; two of the same step touching merge into the next step.
   The game ends when the pile stays above the line at the top. Rules and physics only — drawing and input
   live in merge.html. Units are the basket's own coordinates (W × H); y grows downward. */
(function(root){
  'use strict';
  // Steps from smallest to the finished doll. score = points for making that step by a merge.
  const STEPS=[
    {name:'실 한 가닥',r:13,color:'#f2a7b5',score:1},
    {name:'작은 실뭉치',r:18,color:'#f5d58a',score:3},
    {name:'실뭉치',r:23,color:'#8fc3e0',score:6},
    {name:'폼폼',r:29,color:'#a9cfa4',score:10},
    {name:'털실 볼',r:35,color:'#c9b3e6',score:15},
    {name:'큰 털실',r:42,color:'#f4b183',score:21},
    {name:'콘사',r:50,color:'#9ed8cf',score:28},
    {name:'실 바구니',r:59,color:'#e6c9a0',score:36},
    {name:'목도리 뭉치',r:69,color:'#e58c9c',score:45},
    {name:'세진이 인형',r:80,color:'#cfe6f2',score:55},
  ];
  const W=330,H=520,LINE=96,DROP_Y=48,GRAVITY=1500,BOUNCE=.15,DRAG=.992,DROP_WAIT=.45,OVER_TIME=1.4,FIRST_STEPS=5;
  class Merge{
    constructor(random=Math.random){this.random=random;this.reset();}
    reset(){this.balls=[];this.score=0;this.status='playing';this.aim=W/2;this.wait=0;this.overTime=0;this.best=0;this.made=[];this.tally={};this.nextId=1;
      this.current=this.pick();this.next=this.pick();}
    // New pieces are only the small steps.
    pick(){return Math.floor(this.random()*FIRST_STEPS)%FIRST_STEPS;}
    setAim(x){const r=STEPS[this.current].r;this.aim=Math.max(r,Math.min(W-r,x));}
    drop(){if(this.status!=='playing'||this.wait>0)return false;
      this.balls.push({id:this.nextId++,step:this.current,x:this.aim,y:DROP_Y,vx:0,vy:0,age:0});
      this.current=this.next;this.next=this.pick();this.setAim(this.aim);this.wait=DROP_WAIT;return true;}
    update(dt){if(this.status!=='playing')return;dt=Math.min(dt,.05);this.wait=Math.max(0,this.wait-dt);
      for(const b of this.balls)b.age+=dt;
      const n=6,h=dt/n;for(let s=0;s<n;s++)this.step(h);
      // Game over: a piece that is not freshly dropped stays above the line (a crowded pile jiggles a little,
      // so only a piece clearly flying — a bounce from a merge — does not count).
      const high=this.balls.some(b=>b.age>1&&b.y-STEPS[b.step].r<LINE&&Math.abs(b.vy)<250);
      this.overTime=high?this.overTime+dt:0;if(this.overTime>=OVER_TIME)this.status='over';
    }
    step(h){
      for(const b of this.balls){b.vy+=GRAVITY*h;b.vx*=DRAG;b.x+=b.vx*h;b.y+=b.vy*h;const r=STEPS[b.step].r;
        if(b.x<r){b.x=r;b.vx=Math.abs(b.vx)*BOUNCE;}if(b.x>W-r){b.x=W-r;b.vx=-Math.abs(b.vx)*BOUNCE;}
        if(b.y>H-r){b.y=H-r;if(b.vy>0)b.vy=-b.vy*BOUNCE;b.vx*=.96;}}
      // Push overlapping pieces apart (heavier = bigger moves less); same steps touching merge.
      const merged=new Set();
      for(let pass=0;pass<6;pass++)for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){
        const a=this.balls[i],b=this.balls[j];if(merged.has(a.id)||merged.has(b.id))continue;
        const ra=STEPS[a.step].r,rb=STEPS[b.step].r,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,overlap=ra+rb-d;if(overlap<=0)continue;
        if(a.step===b.step){merged.add(a.id);merged.add(b.id);continue;}
        const nx=dx/d,ny=dy/d,ma=ra*ra,mb=rb*rb,ta=mb/(ma+mb),tb=ma/(ma+mb);
        a.x-=nx*overlap*ta;a.y-=ny*overlap*ta;b.x+=nx*overlap*tb;b.y+=ny*overlap*tb;
        const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rel<0){const imp=-(1+BOUNCE)*rel/(1/ma+1/mb);a.vx-=imp*nx/ma;a.vy-=imp*ny/ma;b.vx+=imp*nx/mb;b.vy+=imp*ny/mb;}
      }
      if(merged.size)this.mergePairs(merged);
      // Pushing pieces apart (or a bigger merged piece) must never leave one outside the basket.
      for(const b of this.balls){const r=STEPS[b.step].r;b.x=Math.max(r,Math.min(W-r,b.x));if(b.y>H-r){b.y=H-r;if(b.vy>0)b.vy=0;}}
    }
    mergePairs(ids){
      const used=new Set();
      for(const a of this.balls){if(!ids.has(a.id)||used.has(a.id))continue;
        const b=this.balls.find(o=>o!==a&&ids.has(o.id)&&!used.has(o.id)&&o.step===a.step&&Math.hypot(o.x-a.x,o.y-a.y)<STEPS[a.step].r*2+1);if(!b)continue;
        used.add(a.id);used.add(b.id);
        if(a.step===STEPS.length-1){this.score+=STEPS[a.step].score*2;this.made.push({step:a.step+1,x:(a.x+b.x)/2,y:(a.y+b.y)/2});continue;}   // two dolls: both float away as a bonus
        const step=a.step+1;this.score+=STEPS[step].score;this.best=Math.max(this.best,step);
        this.balls.push({id:this.nextId++,step,x:(a.x+b.x)/2,y:(a.y+b.y)/2,vx:(a.vx+b.vx)/2,vy:Math.min(a.vy,b.vy)/2,age:1});
        this.made.push({step,x:(a.x+b.x)/2,y:(a.y+b.y)/2});this.tally[step]=(this.tally[step]||0)+1;   // how many of each size were made (they become craft yarn)
      }
      this.balls=this.balls.filter(b=>!used.has(b.id));
    }
    // 실뭉치 for the room: a small share of the score.
    get reward(){return Math.min(40,Math.floor(this.score/40));}
  }
  const api={STEPS,Merge,W,H,LINE,DROP_Y,FIRST_STEPS};
  root.SejinMerge=api;if(typeof module!=='undefined')module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
