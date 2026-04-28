import { useRef, useEffect, useCallback, useState } from 'react';
import { CANVAS_W, CANVAS_H, POWERUP_CONFIG } from '../game/constants';
import type { CharId } from '../game/constants';
import { Player, Platform, Coin, Powerup, Enemy, buildLevel, rectsOverlap } from '../game/entities';
import type { LevelData } from '../game/levels';
import { initAudio, sfxジャンプ, sfxCoin, sfxHit, sfxPowerup, sfxDie, sfxClear, sfxStep } from '../game/sounds';

const PIZZA_CHARS = [
  { id: 'chef',   name: 'シェフ',  color: '#fff8f0', accent: '#e74c3c', hat: '#fff' },
  { id: 'slice',  name: 'スライス', color: '#f39c12', accent: '#e74c3c', hat: '#27ae60' },
  { id: 'cook',   name: '調理',  color: '#ffd1a0', accent: '#c0392b', hat: '#ecf0f1' },
];

const PIZZA_レベルS: LevelData[] = [
  {
    id:1, name:'生地ルーム', bgColors:['#ff6b35','#ff9a5c'] as [string,string],
    width:3200, spawnX:80, spawnY:300, goal:{x:3100,y:200},
    platforms:[
      {x:0,y:400,w:360},{x:430,y:380,w:200},{x:690,y:350,w:180},
      {x:940,y:320,w:200},{x:1200,y:300,w:180,type:'moving'},
      {x:1460,y:270,w:200},{x:1720,y:250,w:180},{x:1980,y:230,w:200,type:'cloud'},
      {x:2240,y:250,w:180},{x:2500,y:230,w:200},{x:2760,y:210,w:180,type:'moving'},
      {x:3000,y:220,w:260},{x:280,y:310,w:120},{x:580,y:280,w:100},
    ],
    coins:[{x:300,y:270},{x:332,y:270},{x:1480,y:230},{x:1512,y:230},{x:2520,y:190},{x:2552,y:190},{x:3020,y:180},{x:3052,y:180}],
    powerups:[{x:598,y:240,type:'speed'},{x:1480,y:220,type:'star'},{x:2250,y:210,type:'double_jump'}],
    enemies:[{x:150,y:368,type:'walk'},{x:460,y:348,type:'walk'},{x:760,y:318,type:'fly'},{x:1020,y:288,type:'jump'},{x:1520,y:238,type:'walk'},{x:1820,y:218,type:'fly'},{x:2120,y:198,type:'jump'},{x:2620,y:198,type:'walk'}],
  },
  {
    id:2, name:'ソース工場', bgColors:['#c0392b','#e74c3c'] as [string,string],
    width:3600, spawnX:80, spawnY:350, goal:{x:3500,y:160},
    platforms:[
      {x:0,y:420,w:280},{x:360,y:390,w:200},{x:630,y:360,w:180,type:'moving'},
      {x:900,y:320,w:200},{x:1170,y:290,w:180},{x:1440,y:260,w:200,type:'cloud'},
      {x:1710,y:230,w:180},{x:1980,y:210,w:200},{x:2250,y:230,w:180,type:'moving'},
      {x:2520,y:210,w:200},{x:2790,y:190,w:180},{x:3060,y:170,w:200,type:'moving'},
      {x:3330,y:180,w:180},{x:3510,y:170,w:180},
    ],
    coins:[{x:380,y:350},{x:650,y:320},{x:682,y:320},{x:1460,y:220},{x:1492,y:220},{x:2540,y:170},{x:3530,y:130},{x:3562,y:130}],
    powerups:[{x:920,y:280,type:'shield'},{x:2000,y:170,type:'double_jump'},{x:3350,y:140,type:'star'}],
    enemies:[{x:200,y:388,type:'walk'},{x:420,y:358,type:'fly'},{x:720,y:328,type:'jump'},{x:1020,y:288,type:'walk'},{x:1320,y:258,type:'fly'},{x:1620,y:198,type:'jump'},{x:1920,y:178,type:'walk'},{x:2320,y:198,type:'fly'},{x:2620,y:158,type:'jump'},{x:2920,y:138,type:'walk'}],
  },
  {
    id:3, name:'チーズの洞窟', bgColors:['#f39c12','#d35400'] as [string,string],
    width:4000, spawnX:80, spawnY:360, goal:{x:3900,y:150},
    platforms:[
      {x:0,y:400,w:240},{x:320,y:370,w:180,type:'moving'},{x:580,y:340,w:200},
      {x:860,y:300,w:180},{x:1120,y:270,w:200,type:'cloud'},{x:1400,y:240,w:180},
      {x:1660,y:210,w:200,type:'moving'},{x:1940,y:230,w:180},{x:2200,y:200,w:200},
      {x:2480,y:180,w:180,type:'cloud'},{x:2740,y:200,w:200,type:'moving'},
      {x:3020,y:170,w:180},{x:3280,y:150,w:200},{x:3560,y:170,w:180,type:'moving'},
      {x:3820,y:160,w:280},
    ],
    coins:[{x:340,y:330},{x:600,y:300},{x:632,y:300},{x:1140,y:230},{x:1172,y:230},{x:2500,y:140},{x:3840,y:120},{x:3872,y:120}],
    powerups:[{x:880,y:260,type:'speed'},{x:1680,y:170,type:'double_jump'},{x:2760,y:160,type:'star'},{x:3840,y:120,type:'shield'}],
    enemies:[{x:140,y:368,type:'walk'},{x:380,y:338,type:'jump'},{x:640,y:308,type:'fly'},{x:920,y:268,type:'walk'},{x:1220,y:238,type:'jump'},{x:1520,y:208,type:'fly'},{x:1820,y:198,type:'walk'},{x:2120,y:168,type:'fly'},{x:2520,y:148,type:'jump'},{x:2820,y:138,type:'walk'},{x:3120,y:118,type:'fly'},{x:3420,y:138,type:'jump'}],
  },
];

type Screen = 'menu'|'playing'|'level_complete'|'gameover';
interface LE{name:string;score:number;coins:number;date:string;}
function getB():LE[]{try{return JSON.parse(localStorage.getItem('pizzaBoard')||'[]');}catch{return[];}}
function saveB(e:LE){const b=getB();b.push(e);b.sort((a,b)=>b.score-a.score);localStorage.setItem('pizzaBoard',JSON.stringify(b.slice(0,10)));}

function rr(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

function draw(ctx:CanvasRenderingContext2D, players:Player[], platforms:Platform[], coins:Coin[], powerups:Powerup[], enemies:Enemy[], camX:number, lvl:LevelData, level:number, total:number){
  // Background
  const g=ctx.createLinearGradient(0,0,0,CANVAS_H);
  g.addColorStop(0,lvl.bgColors[0]);g.addColorStop(1,lvl.bgColors[1]);
  ctx.fillStyle=g;ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
  // floating ingredients bg
  ctx.globalAlpha=0.08;
  ctx.font='22px Arial';
  const items=['🍕','🧀','🍅','🌶','🍄'];
  for(let i=0;i<12;i++){
    const px=((i*170-camX*0.1)%CANVAS_W+CANVAS_W)%CANVAS_W;
    ctx.fillText(items[i%items.length],px,(i*80+40)%CANVAS_H);
  }
  ctx.globalAlpha=1;

  ctx.save();ctx.translate(-camX,0);

  // Platforms
  platforms.forEach(p=>{
    if(p.type==='cloud'){
      ctx.fillStyle='#fff8dc';rr(ctx,p.x,p.y,p.w,p.h,8);ctx.fill();
      ctx.font='10px Arial';ctx.textAlign='center';ctx.fillText('🍕',p.x+p.w/2,p.y+p.h*0.7);
    } else if(p.type==='moving'){
      ctx.fillStyle='#8B4513';rr(ctx,p.x,p.y,p.w,p.h,4);ctx.fill();
      ctx.strokeStyle='#D2691E';ctx.lineWidth=2;rr(ctx,p.x,p.y,p.w,p.h,4);ctx.stroke();
    } else {
      const pg=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h);
      pg.addColorStop(0,'#D2691E');pg.addColorStop(1,'#8B4513');
      ctx.fillStyle=pg;rr(ctx,p.x,p.y,p.w,p.h,4);ctx.fill();
      ctx.strokeStyle='#A0522D';ctx.lineWidth=1;ctx.strokeRect(p.x,p.y,p.w,p.h);
    }
  });

  // Coins (ingredients)
  coins.forEach(c=>{
    if(c.collected)return;
    const sc=Math.abs(Math.cos(c.animFrame*Math.PI/3));
    ctx.save();ctx.translate(c.x+8,c.y+8);ctx.scale(sc,1);
    ctx.font='16px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('🍅',0,0);ctx.restore();
  });

  // Powerups
  powerups.forEach(pu=>{
    if(pu.collected)return;
    const emojis:Record<string,string>={star:'⭐',shield:'🍕',speed:'🌶',double_jump:'🍄',coin_magnet:'🧲'};
    ctx.font='18px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(emojis[pu.type]||'⭐',pu.x+11+pu.bobOffset,pu.y+11+pu.bobOffset*0.5);
  });

  // Enemies (food enemies)
  enemies.forEach(e=>{
    if(!e.alive)return;
    const cx=e.x+e.w/2,cy=e.y+e.h/2;
    ctx.save();ctx.translate(cx,cy);if(e.facing===1)ctx.scale(-1,1);
    const ecols={walk:'#e74c3c',fly:'#8e44ad',jump:'#e67e22'}[e.type];
    ctx.fillStyle=ecols;ctx.beginPath();ctx.ellipse(0,2,13,12,0,0,Math.PI*2);ctx.fill();
    // angry eyes
    ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(-4,-2,4,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#111';ctx.beginPath();ctx.ellipse(-3,-2,2,2,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-5);ctx.lineTo(-1,-3);ctx.stroke();
    const step=Math.sin(e.animFrame*Math.PI/2)*3;
    ctx.fillStyle=ecols;
    ctx.beginPath();ctx.ellipse(-4,12+step,3,3,-0.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(4,12-step,3,3,0.2,0,Math.PI*2);ctx.fill();
    if(e.type==='fly'){ctx.fillStyle='#ce93d8aa';ctx.beginPath();ctx.ellipse(-10,-3,9,5,-0.4,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(10,-3,9,5,0.4,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  });

  // Players (chef)
  players.forEach(p=>{
    if(!p.alive)return;
    const char=PIZZA_CHARS.find(c=>c.id===p.charId)||PIZZA_CHARS[0];
    const cx=p.x+p.w/2,cy=p.y+p.h/2;
    ctx.save();ctx.translate(cx,cy);if(p.facing===-1)ctx.scale(-1,1);
    if(p.isInvincible)ctx.globalAlpha=0.5+0.5*Math.sin(Date.now()/80);
    if(p.hasPowerup('star')){ctx.shadowColor='#FFD700';ctx.shadowBlur=18;}
    const bob=p.onGround&&(p.animFrame===1||p.animFrame===3)?1:0;
    // Chef hat
    ctx.fillStyle=char.hat;
    ctx.fillRect(-8,-18+bob,16,10);
    ctx.beginPath();ctx.ellipse(0,-8+bob,12,4,0,0,Math.PI*2);ctx.fill();
    // Body (apron)
    ctx.fillStyle=char.color;ctx.beginPath();ctx.ellipse(0,3+bob,11,13,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(2,5+bob,6,9,0.1,0,Math.PI*2);ctx.fill();
    // Face
    ctx.fillStyle='#f4c5a0';ctx.beginPath();ctx.ellipse(-1,-3+bob,8,9,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#333';ctx.beginPath();ctx.ellipse(-3,-3+bob,2.5,3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-4,-4+bob,1,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.ellipse(3,0+bob,3,2,0,0,Math.PI*2);ctx.fill();
    const arm=p.onGround?Math.sin(p.animFrame*Math.PI/2)*4:0;
    ctx.fillStyle=char.color;ctx.beginPath();ctx.ellipse(-13,2+arm+bob,4,3,-0.4,0,Math.PI*2);ctx.fill();
    const step=p.onGround?Math.sin(p.animFrame*Math.PI/2)*3:0;
    ctx.beginPath();ctx.ellipse(-4,15+step+bob,3,4,-0.2,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(4,15-step+bob,3,4,0.2,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
    if(p.index===1){ctx.fillStyle='#f39c12';ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillText('P2',cx,p.y-6);}
  });

  // Goal (pizza box)
  const gx=lvl.goal.x,gy=lvl.goal.y;
  ctx.strokeStyle='#aaa';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(gx+12,gy+60);ctx.lineTo(gx+12,gy);ctx.stroke();
  ctx.fillStyle='#f39c12';ctx.beginPath();ctx.moveTo(gx+12,gy);ctx.lineTo(gx+42,gy+12);ctx.lineTo(gx+12,gy+24);ctx.closePath();ctx.fill();
  ctx.font='14px Arial';ctx.textAlign='center';ctx.fillText('🍕',gx+22,gy+18);
  ctx.fillStyle='#8B4513';ctx.beginPath();ctx.ellipse(gx+12,gy+62,10,4,0,0,Math.PI*2);ctx.fill();

  ctx.restore();

  // HUD
  players.forEach((p,i)=>{
    const ox=i===0?10:CANVAS_W-180;
    ctx.fillStyle='rgba(80,20,0,0.6)';rr(ctx,ox,8,165,48,8);ctx.fill();
    ctx.fillStyle='#f39c12';ctx.font='bold 13px monospace';
    ctx.fillText(`P${i+1} ${PIZZA_CHARS.find(c=>c.id===p.charId)?.name||'シェフ'}`,ox+10,26);
    ctx.fillStyle='#e74c3c';ctx.font='bold 12px monospace';ctx.fillText(`🍅 ${p.coins}`,ox+10,43);
    ctx.fillStyle='#fff';ctx.fillText(`${p.score}pt`,ox+65,43);
  });
  ctx.fillStyle='rgba(80,20,0,0.6)';rr(ctx,CANVAS_W/2-60,8,120,28,8);ctx.fill();
  ctx.fillStyle='#f39c12';ctx.font='bold 13px monospace';ctx.textAlign='center';
  ctx.fillText(`レベル ${level} / ${total}`,CANVAS_W/2,26);ctx.textAlign='left';
}

export default function Index() {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const [screen,setScreen]=useState<Screen>('menu');
  const [p1Char,setP1Char]=useState('chef');
  const [currentLevel,setCurrentLevel]=useState(1);
  const [soundOn,setSoundOn]=useState(true);
  const screenRef=useRef<Screen>('menu');
  const keysRef=useRef<Set<string>>(new Set());
  const playersRef=useRef<Player[]>([]);
  const platformsRef=useRef<Platform[]>([]);
  const coinsRef=useRef<Coin[]>([]);
  const powerupsRef=useRef<Powerup[]>([]);
  const enemiesRef=useRef<Enemy[]>([]);
  const camXRef=useRef(0);
  const levelRef=useRef(1);
  const soundRef=useRef(true);
  const animRef=useRef(0);
  const levelDataRef=useRef(PIZZA_レベルS[0]);

  useEffect(()=>{screenRef.current=screen;},[screen]);
  useEffect(()=>{soundRef.current=soundOn;},[soundOn]);
  const sfx=useCallback((fn:()=>void)=>{if(soundRef.current)fn();},[]);

  const loadLevel=useCallback((idx:number,char:string)=>{
    const data=PIZZA_レベルS[idx];levelDataRef.current=data;
    const{platforms,coins,powerups,enemies}=buildLevel(data);
    platformsRef.current=platforms;coinsRef.current=coins;powerupsRef.current=powerups;enemiesRef.current=enemies;camXRef.current=0;
    playersRef.current=[new Player(data.spawnX,data.spawnY,char as CharId,0)];
  },[]);

  const startGame=useCallback((lvl=1)=>{
    initAudio();levelRef.current=lvl;setCurrentLevel(lvl);
    loadLevel(lvl-1,p1Char);setScreen('playing');
  },[loadLevel,p1Char]);

  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{
      keysRef.current.add(e.key);
      if(['ArrowUp',' '].includes(e.key)){e.preventDefault();const p=playersRef.current[0];if(p&&(p.onGround||p.jumpsLeft>0)){p.jump();sfx(sfxジャンプ);}}
      if(e.key==='Enter'){
        if(screenRef.current==='level_complete'){const n=levelRef.current+1;if(n<=PIZZA_レベルS.length)startGame(n);else setScreen('menu');}
        if(screenRef.current==='gameover')startGame(levelRef.current);
      }
    };
    const up=(e:KeyboardEvent)=>keysRef.current.delete(e.key);
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};
  },[sfx,startGame]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    canvas.width=CANVAS_W;canvas.height=CANVAS_H;
    const ctx=canvas.getContext('2d')!;let stepT=0;
    const loop=()=>{
      animRef.current=requestAnimationFrame(loop);
      const s=screenRef.current;const lvl=levelDataRef.current;
      if(s!=='playing'){
        draw(ctx,playersRef.current,platformsRef.current,coinsRef.current,powerupsRef.current,enemiesRef.current,camXRef.current,lvl,levelRef.current,PIZZA_レベルS.length);
        if(s==='level_complete'||s==='gameover'){
          ctx.fillStyle='rgba(0,0,0,0.72)';ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
          ctx.textAlign='center';
          if(s==='level_complete'){
            ctx.fillStyle='#f39c12';ctx.font='bold 36px monospace';ctx.fillText('🍕 CLEAR!',CANVAS_W/2,CANVAS_H/2-50);
            ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText(`スコア: ${playersRef.current[0]?.score||0}`,CANVAS_W/2,CANVAS_H/2);
            ctx.fillStyle='#ffd700';ctx.font='14px monospace';ctx.fillText('ENTERで次のレベル',CANVAS_W/2,CANVAS_H/2+40);
          } else {
            ctx.fillStyle='#e74c3c';ctx.font='bold 34px monospace';ctx.fillText('ゲームオーバー',CANVAS_W/2,CANVAS_H/2-40);
            ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText(`スコア: ${playersRef.current[0]?.score||0}`,CANVAS_W/2,CANVAS_H/2+5);
            ctx.fillStyle='#f39c12';ctx.font='14px monospace';ctx.fillText('ENTERで再挑戦',CANVAS_W/2,CANVAS_H/2+45);
          }
          ctx.textAlign='left';
        }
        return;
      }
      const keys=keysRef.current;const players=playersRef.current;const platforms=platformsRef.current;
      platforms.forEach(p=>p.update());
      players.forEach(p=>{
        if(!p.alive)return;
        p.update(keys,platforms,1);
        coinsRef.current.forEach(c=>{
          if(c.collected)return;
          if(rectsOverlap({x:p.x,y:p.y,w:p.w,h:p.h},{x:c.x,y:c.y,w:c.w,h:c.h})||(p.hasPowerup('coin_magnet')&&Math.hypot(p.x-c.x,p.y-c.y)<80)){c.collected=true;p.coins++;p.score+=10;sfx(sfxCoin);}
        });
        powerupsRef.current.forEach(pu=>{
          if(pu.collected)return;
          if(rectsOverlap({x:p.x,y:p.y,w:p.w,h:p.h},{x:pu.x,y:pu.y,w:pu.w,h:pu.h})){pu.collected=true;p.activePowerups.push({type:pu.type,expiresAt:Date.now()+POWERUP_CONFIG[pu.type].duration});sfx(sfxPowerup);}
        });
        enemiesRef.current.forEach(e=>{
          if(!e.alive)return;
          if(!rectsOverlap({x:p.x,y:p.y,w:p.w,h:p.h},{x:e.x,y:e.y,w:e.w,h:e.h}))return;
          if((p.vy>0&&p.y+p.h<e.y+e.h*0.4)||p.hasPowerup('star')){e.alive=false;p.vy=-8;p.score+=50;sfx(sfxHit);}
          else if(!p.isInvincible){if(p.hasPowerup('shield')){p.activePowerups=p.activePowerups.filter(ap=>ap.type!=='shield');p.invincibleUntil=Date.now()+1500;}else{p.alive=false;sfx(sfxDie);}}
        });
        if(p.onGround&&(keys.has('ArrowLeft')||keys.has('ArrowRight'))){stepT++;if(stepT%18===0)sfx(sfxStep);}
        if(rectsOverlap({x:p.x,y:p.y,w:p.w,h:p.h},{x:lvl.goal.x,y:lvl.goal.y,w:30,h:60})){p.score+=200;sfx(sfxClear);saveB({name:`Chef`,score:p.score,coins:p.coins,date:new Date().toLocaleDateString()});setScreen('level_complete');return;}
      });
      if(players.every(p=>!p.alive)){setScreen('gameover');return;}
      coinsRef.current.forEach(c=>c.update());powerupsRef.current.forEach(pu=>pu.update());enemiesRef.current.forEach(e=>e.update(platforms));
      const p1=players[0];if(p1){const t=p1.x-CANVAS_W/3;camXRef.current+=(t-camXRef.current)*0.1;camXRef.current=Math.max(0,Math.min(camXRef.current,lvl.width-CANVAS_W));}
      draw(ctx,players,platforms,coinsRef.current,powerupsRef.current,enemiesRef.current,camXRef.current,lvl,levelRef.current,PIZZA_レベルS.length);
    };
    animRef.current=requestAnimationFrame(loop);
    return()=>cancelAnimationFrame(animRef.current);
  },[sfx]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#3d0000] via-[#7a1500] to-[#3d0000] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-4">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-yellow-300 via-red-400 to-orange-400 bg-clip-text text-transparent">🍕 ピザ工場</h1>
        <p className="text-orange-400/60 text-sm mt-1">Collect tomatoes · Dodge food enemies · Deliver pizzas!</p>
      </div>
      <div className="flex flex-col items-center gap-4 select-none">
        <canvas ref={canvasRef} className="rounded-xl shadow-2xl border-2 border-orange-700" style={{maxWidth:'100%',imageRendering:'pixelated'}}/>
        {screen==='menu'&&(
          <div className="flex flex-col items-center gap-4 w-full max-w-sm">
            <div className="flex justify-center gap-2">
              {PIZZA_CHARS.map(c=>(
                <button key={c.id} onClick={()=>setP1Char(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition-all ${p1Char===c.id?'border-yellow-400 scale-110':'border-gray-600'}`}
                  style={{background:c.accent+'22',color:c.accent}}>{c.name}</button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={()=>startGame(1)} className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl text-lg font-bold hover:scale-105 transition-transform shadow-lg">🍕 調理!</button>
              <button onClick={()=>setSoundOn(s=>!s)} className="px-4 py-3 bg-gray-700 text-white rounded-xl text-sm hover:bg-gray-600">{soundOn?'🔊':'🔇'}</button>
            </div>
            <p className="text-gray-500 text-xs">←→ 移動 · ↑ ジャンプ · Collect 🍅 tomatoes · Reach the 🍕</p>
          </div>
        )}
        {screen==='playing'&&(
          <div className="flex flex-col gap-2 md:hidden w-full max-w-xs">
            <div className="flex justify-center"><button onTouchStart={(e)=>{e.preventDefault();playersRef.current[0]?.jump();sfx(sfxジャンプ);}} className="w-14 h-14 bg-orange-700 rounded-xl text-2xl font-bold text-white active:bg-orange-500 flex items-center justify-center">↑</button></div>
            <div className="flex justify-center gap-3">
              <button onTouchStart={(e)=>{e.preventDefault();keysRef.current.add('ArrowLeft');}} onTouchEnd={(e)=>{e.preventDefault();keysRef.current.delete('ArrowLeft');}} className="w-14 h-14 bg-orange-700 rounded-xl text-2xl font-bold text-white active:bg-orange-500 flex items-center justify-center">←</button>
              <button onTouchStart={(e)=>{e.preventDefault();keysRef.current.add('ArrowRight');}} onTouchEnd={(e)=>{e.preventDefault();keysRef.current.delete('ArrowRight');}} className="w-14 h-14 bg-orange-700 rounded-xl text-2xl font-bold text-white active:bg-orange-500 flex items-center justify-center">→</button>
            </div>
          </div>
        )}
        {screen==='level_complete'&&<button onClick={()=>{const n=currentLevel+1;if(n<=PIZZA_レベルS.length)startGame(n);else setScreen('menu');}} className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:scale-105">{currentLevel<PIZZA_レベルS.length?'次のレベル →':'🏠 Menu'}</button>}
        {screen==='gameover'&&<div className="flex gap-3"><button onClick={()=>startGame(currentLevel)} className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:scale-105">もう一度</button><button onClick={()=>setScreen('menu')} className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-600">メニュー</button></div>}
      </div>
    </div>
  );
}
