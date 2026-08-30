/* ============================================================
 * 简持 · 数据层
 * localStorage 读写、演示种子数据、应用状态 state
 * ============================================================ */
"use strict";

/* ============================ 状态与演示数据 ============================ */
const STORE_KEY="shiguang.v1";
function seedState(){
  const today=todayStr();
  const rnd=mulberry32(20260830);
  const mk=(name,icon,freq,perDay,streakNow,longestAt,created,missRate)=>{
    const hist=[]; let counts={}, daySlot={};
    for(let i=1;i<=90;i++){
      const d=addDays(today,-i);
      let hit=rnd()>missRate;
      if(hit){
        hist.push(d);
        const roll=rnd();                       // 演示数据:部分日期带早/夜时段
        if(roll<.14) daySlot[d]="early"; else if(roll<.22) daySlot[d]="night";
        if(perDay>1) counts[d]=perDay;
      }
    }
    // 造出「当前连续 streakNow 天」（截止昨天）+ 更早的一断最长连击
    for(let i=1;i<=streakNow;i++){ const d=addDays(today,-i); if(!hist.includes(d)) hist.push(d); if(perDay>1) counts[d]=perDay; }
    for(let i=streakNow+3;i<=streakNow+2+longestAt;i++){ const d=addDays(today,-i); if(!hist.includes(d)) hist.push(d); if(perDay>1) counts[d]=perDay; }
    // 在两段连击之间以及长连击之后，强制挖出断点，保证连击数字精确
    [streakNow+1,streakNow+2,streakNow+3+longestAt].forEach(i=>{
      const d=addDays(today,-i), k=hist.indexOf(d); if(k>-1) hist.splice(k,1); delete counts[d]; delete daySlot[d];
    });
    return { id:"g"+Math.random().toString(36).slice(2,8), name, icon, freq, perDay, createdAt:created, history:hist, counts, daySlot, earlyFlags:{} };
  };
  const run=mk("晨跑 3 公里","run",{type:"daily"},1,12,21,"2026-07-12",.18);
  const read=mk("阅读 30 分钟","book",{type:"daily"},1,5,14,"2026-07-20",.2);
  const water=mk("喝水 8 杯","drop",{type:"daily"},8,3,9,"2026-07-25",.15);
  const meditate=mk("冥想 10 分钟","lotus",{type:"weekly",times:4},1,2,3,"2026-08-01",.35);
  meditate.history=meditate.history.filter(d=>d<mondayOf(today));   // 本周清空
  meditate.history.push(addDays(today,-2),addDays(today,-3));       // 本周已完成 2 次
  water.counts[today]=5;                                   // 今天进行中 5/8
  return {
    v:1, seed:"#c14a10", dark:null, reduceMotion:false,
    energy:620, flags:{},
    profile:{ name:"拾光者", avatar:"auto" },
    goals:[run,read,water,meditate],
  };
}
let state;
try{ state=JSON.parse(localStorage.getItem(STORE_KEY)) || seedState(); if(!state.goals) throw 0; }
catch(e){ state=seedState(); }
const save=()=>{ try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch(e){} };
