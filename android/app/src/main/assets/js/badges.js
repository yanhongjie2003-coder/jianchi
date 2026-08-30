/* ============================================================
 * 简持 · 成就徽章
 * 15 枚徽章定义(7 类可重复)、解锁状态计算
 * ============================================================ */
"use strict";

/* 徽章体系 */
const BADGES=[
  { id:"first",  icon:"target",  name:"首目标",     cond:()=>state.goals.length>=1 },
  { id:"streak7",icon:"flame",   name:"连续7天",    cond:()=>state.goals.some(g=>currentStreak(g)>=7),
    count:()=>Math.floor(maxBestStreak()/7) },                                   // 可重复：每满一段 7 连击 +1
  { id:"early",  icon:"sunrise", name:"早起鸟",     cond:()=>state.flags.earlyBird },
  { id:"c50",    icon:"bolt",    name:"50次打卡",   cond:()=>totalCheckins()>=50,
    count:()=>Math.floor(totalCheckins()/50) },                                  // 可重复：每累计 50 次 +1
  { id:"streak30",icon:"flame",  name:"连续30天",   cond:()=>state.goals.some(g=>bestStreak(g)>=30),
    count:()=>Math.floor(maxBestStreak()/30) },                                  // 可重复：每满一段 30 连击 +1
  { id:"c100",   icon:"medal",   name:"百日打卡",   cond:()=>state.goals.some(g=>bestStreak(g)>=100),
    count:()=>Math.floor(maxBestStreak()/100) },                                 // 可重复：每满一百天 +1
  { id:"weekfull",icon:"calendar",name:"完美一周",  cond:()=>{ const mon=mondayOf(addDays(TODAY(),-7)); let ok=true; for(let i=0;i<7;i++) if(dayRatio(addDays(mon,i))<1) ok=false; return ok; },
    count:()=>{                                                                  // 可重复：每个全勤完整周 +1
      if(!state.goals.length) return 0;
      const t=TODAY(); let earliest=t;
      state.goals.forEach(g=>{ if(g.createdAt&&g.createdAt<earliest) earliest=g.createdAt; (g.history||[]).forEach(d=>{ if(d<earliest) earliest=d; }); });
      let base=addDays(earliest,-dowMon(earliest)), n=0;
      while(addDays(base,6)<t){
        let ok=true; for(let i=0;i<7;i++){ if(dayRatio(addDays(base,i))<1){ ok=false; break; } }
        if(ok) n++; base=addDays(base,7);
      }
      return n;
    } },
  { id:"e500",   icon:"star",    name:"能量500",    cond:()=>state.energy>=500,
    count:()=>Math.floor(state.energy/500) },                                    // 可重复：每累计 500 能量 +1
  { id:"e2000",  icon:"star",    name:"能量2000",   cond:()=>state.energy>=2000,
    count:()=>Math.floor(state.energy/2000) },                                   // 可重复：每累计 2000 能量 +1
  { id:"g10",    icon:"plant",   name:"十全十美",   cond:()=>state.goals.length>=10 },
  { id:"month",  icon:"gem",     name:"月度之星",   cond:()=>monthRate()>=95 },
  { id:"owl",    icon:"moonDark",name:"夜猫子",     cond:()=>state.flags.nightOwl },
  { id:"c500",   icon:"bolt",    name:"500次打卡",  cond:()=>totalCheckins()>=500,
    count:()=>Math.floor(totalCheckins()/500) },                                 // 可重复：每累计 500 次 +1
  { id:"allweek",icon:"calendar",name:"全能周",     cond:()=>{ const mon=mondayOf(TODAY()); let ok=true; for(let i=0;i<dowMon(TODAY());i++) if(dayRatio(addDays(mon,i))<1) ok=false; return dowMon(TODAY())>=5&&ok; } },
  { id:"king",   icon:"crown",   name:"习惯之王",   cond:()=>state.goals.length>=3 && state.goals.every(g=>bestStreak(g)>=100) },
];
let unlockedIds=[];
function refreshBadges(){
  const prev=new Set(unlockedIds);
  const now=BADGES.filter(b=>b.cond()).map(b=>b.id);
  const fresh=now.filter(id=>!prev.has(id) && unlockedIds.length && id!=="first");
  unlockedIds=now; save();
  return fresh;
}
