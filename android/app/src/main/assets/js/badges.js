/* ============================================================
 * 简持 · 成就徽章
 * 15 枚徽章定义(9 类可重复)、解锁状态计算
 * 每枚徽章带 desc(解锁条件文案)与 progress(当前进度),供详情弹层展示
 * ============================================================ */
"use strict";

/* 时段打卡统计:goals[].daySlot[日期] = "early" | "night"(当天首次打卡的时刻段) */
const earlyCount=()=>state.goals.reduce((n,g)=>n+Object.values(g.daySlot||{}).filter(v=>v==="early").length,0);
const nightCount=()=>state.goals.reduce((n,g)=>n+Object.values(g.daySlot||{}).filter(v=>v==="night").length,0);

/* 徽章体系 */
const BADGES=[
  { id:"first",  icon:"target",  name:"首目标",     cond:()=>state.goals.length>=1,
    desc:"创建第 1 个目标", progress:()=>`当前 ${state.goals.length} / 1 个` },
  { id:"streak7",icon:"flame",   name:"连续7天",    cond:()=>state.goals.some(g=>currentStreak(g)>=7),
    count:()=>Math.floor(maxBestStreak()/7),                                    // 可重复:每满一段 7 连击 +1
    desc:"任一目标连续打卡满 7 天(可重复,每满 7 天 +1)",
    progress:()=>`历史最长连续 ${maxBestStreak()} 天` },
  { id:"early",  icon:"sunrise", name:"早起鸟",     cond:()=>earlyCount()>=1,
    count:earlyCount,                                                           // 可重复:每个 9 点前打卡日 +1
    desc:"在上午 9 点前完成当天的打卡(按天计,可重复)",
    progress:()=>`已早起打卡 ${earlyCount()} 天` },
  { id:"c50",    icon:"bolt",    name:"50次打卡",   cond:()=>totalCheckins()>=50,
    count:()=>Math.floor(totalCheckins()/50),                                   // 可重复:每累计 50 次 +1
    desc:"累计打卡满 50 次(可重复,每满 50 次 +1)",
    progress:()=>`累计打卡 ${totalCheckins()} 次` },
  { id:"streak30",icon:"flame",  name:"连续30天",   cond:()=>state.goals.some(g=>bestStreak(g)>=30),
    count:()=>Math.floor(maxBestStreak()/30),                                   // 可重复:每满一段 30 连击 +1
    desc:"任一目标连续打卡满 30 天(可重复,每满 30 天 +1)",
    progress:()=>`历史最长连续 ${maxBestStreak()} 天` },
  { id:"c100",   icon:"medal",   name:"百日打卡",   cond:()=>state.goals.some(g=>bestStreak(g)>=100),
    count:()=>Math.floor(maxBestStreak()/100),                                  // 可重复:每满一百天 +1
    desc:"任一目标连续打卡满 100 天(可重复,每满 100 天 +1)",
    progress:()=>`历史最长连续 ${maxBestStreak()} 天` },
  { id:"weekfull",icon:"calendar",name:"完美一周",  cond:()=>{ const mon=mondayOf(addDays(TODAY(),-7)); let ok=true; for(let i=0;i<7;i++) if(dayRatio(addDays(mon,i))<1) ok=false; return ok; },
    count:()=>{                                                                 // 可重复:每个全勤完整周 +1
      if(!state.goals.length) return 0;
      const t=TODAY(); let earliest=t;
      state.goals.forEach(g=>{ if(g.createdAt&&g.createdAt<earliest) earliest=g.createdAt; (g.history||[]).forEach(d=>{ if(d<earliest) earliest=d; }); });
      let base=addDays(earliest,-dowMon(earliest)), n=0;
      while(addDays(base,6)<t){
        let ok=true; for(let i=0;i<7;i++){ if(dayRatio(addDays(base,i))<1){ ok=false; break; } }
        if(ok) n++; base=addDays(base,7);
      }
      return n;
    },
    desc:"一个完整周(周一至周日)7 天全部目标 100% 完成(可重复)",
    progress:()=>`已达成 ${weekfullCount()} 个全勤周` },
  { id:"e500",   icon:"star",    name:"能量500",    cond:()=>state.energy>=500,
    count:()=>Math.floor(state.energy/500),                                     // 可重复:每累计 500 能量 +1
    desc:"累计能量满 500(可重复,每满 500 +1)",
    progress:()=>`当前能量 ${state.energy}` },
  { id:"e2000",  icon:"star",    name:"能量2000",   cond:()=>state.energy>=2000,
    count:()=>Math.floor(state.energy/2000),                                    // 可重复:每累计 2000 能量 +1
    desc:"累计能量满 2000(可重复,每满 2000 +1)",
    progress:()=>`当前能量 ${state.energy}` },
  { id:"g10",    icon:"plant",   name:"十全十美",   cond:()=>state.goals.length>=10,
    desc:"同时拥有 10 个目标", progress:()=>`当前 ${state.goals.length} / 10 个` },
  { id:"month",  icon:"gem",     name:"月度之星",   cond:()=>monthRate()>=95,
    desc:"当月完成率 ≥ 95%(当月按已过天数计算)", progress:()=>`本月完成率 ${monthRate()}%` },
  { id:"owl",    icon:"moonDark",name:"夜猫子",     cond:()=>nightCount()>=1,
    count:nightCount,                                                           // 可重复:每个 22 点后打卡日 +1
    desc:"在晚上 10 点后完成当天的打卡(按天计,可重复)",
    progress:()=>`已夜间打卡 ${nightCount()} 天` },
  { id:"c500",   icon:"bolt",    name:"500次打卡",  cond:()=>totalCheckins()>=500,
    count:()=>Math.floor(totalCheckins()/500),                                  // 可重复:每累计 500 次 +1
    desc:"累计打卡满 500 次(可重复,每满 500 次 +1)",
    progress:()=>`累计打卡 ${totalCheckins()} 次` },
  { id:"allweek",icon:"calendar",name:"全能周",     cond:()=>{ const mon=mondayOf(TODAY()); let ok=true; for(let i=0;i<dowMon(TODAY());i++) if(dayRatio(addDays(mon,i))<1) ok=false; return dowMon(TODAY())>=5&&ok; },
    desc:"本周至少过了 5 天,且已过每天都 100% 完成",
    progress:()=>`本周已过 ${dowMon(TODAY())} 天` },
  { id:"king",   icon:"crown",   name:"习惯之王",   cond:()=>state.goals.length>=3 && state.goals.every(g=>bestStreak(g)>=100),
    desc:"拥有至少 3 个目标,且每个目标连续打卡都满 100 天",
    progress:()=>`当前 ${state.goals.length} 个目标` },
];

/* 完美一周的全勤完整周计数(badges 内部使用) */
function weekfullCount(){
  const b=BADGES.find(x=>x.id==="weekfull");
  return b&&b.count?Math.max(0,Math.floor(b.count())):0;
}

let unlockedIds=[];
function refreshBadges(){
  const prev=new Set(unlockedIds);
  const now=BADGES.filter(b=>b.cond()).map(b=>b.id);
  const fresh=now.filter(id=>!prev.has(id) && unlockedIds.length && id!=="first");
  unlockedIds=now; save();
  return fresh;
}
