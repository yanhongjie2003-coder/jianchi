/* ============================================================
 * 简持 · 领域逻辑
 * 打卡判定、连续天数、完成率、能量等级、统计页选中月份
 * ============================================================ */
"use strict";

/* ============================ 领域逻辑 ============================ */
const TODAY=()=>todayStr();
function isDayDone(g,date){
  if(g.freq.type==="daily") return g.perDay>1 ? (g.counts[date]||0)>=g.perDay : g.history.includes(date);
  if(g.freq.type==="weekly"){
    const mon=mondayOf(date);
    let c=0; for(let i=0;i<7;i++){ const d=addDays(mon,i); if(d>date) break; if(g.history.includes(d)) c++; }
    return c>=g.freq.times;
  }
  const [y,m]=date.split("-").map(Number);
  let c=0; g.history.forEach(d=>{ if(d.startsWith(`${y}-${String(m).padStart(2,"0")}`) && d<=date) c++; });
  return c>=g.freq.times;
}
function hasCheckedOn(g,date){                                  // 当天是否已打过卡（每周/每月目标每天最多记 1 次）
  if(g.freq.type==="daily") return isDayDone(g,date);
  return g.history.includes(date);
}
function currentStreak(g){
  const t=TODAY(); let streak=0; let start = isDayDone(g,t) ? 0 : 1;      // 今天未打卡不打断连续
  for(let i=start;;i++){ const d=addDays(t,-i); if(isDayDone(g,d)) streak++; else break; if(i>730) break; }
  return streak;
}
function bestStreak(g){
  const days=[...new Set(g.history)].sort();
  let best=0,cur=0,prev=null;
  const unit = g.freq.type==="daily" ? 1 : null;
  if(g.freq.type!=="daily") return Math.max(best,currentStreak(g));
  for(const d of days){ cur = (prev && addDays(prev,1)===d) ? cur+1 : 1; best=Math.max(best,cur); prev=d; }
  return Math.max(best,currentStreak(g));
}
function dayRatio(date){                                        // 当日整体完成比（0~1）
  const list=state.goals; if(!list.length) return 0;
  let sum=0;
  list.forEach(g=>{
    if(g.freq.type==="daily") sum += isDayDone(g,date)?1 : (g.perDay>1? Math.min(1,(g.counts[date]||0)/g.perDay) : 0);
    else sum += isDayDone(g,date)?1:0;
  });
  return sum/list.length;
}
function monthRate(yy,mm){                                      // 某月完成率；缺省为当月（当月算到今天，历史月算整月）
  const t=TODATE0(); const y=yy??t[0], m=mm??t[1];
  const days=daysOfMonth(y,m); let total=0,done=0;
  for(let i=1;i<=days;i++){
    state.goals.forEach(g=>{ total++; if(isDayDone(g,`${y}-${String(m).padStart(2,"0")}-${String(i).padStart(2,"0")}`)) done++; });
  }
  return total? Math.round(done/total*100):0;
}
function daysOfMonth(y,m){                                      // 参与统计的天数
  const t=TODATE0(); const dim=new Date(y,m,0).getDate();
  return (y===t[0]&&m===t[1]) ? t[2] : dim;
}
function TODATE0(){ const d=new Date(); return [d.getFullYear(), d.getMonth()+1, d.getDate()]; }
const totalCheckins=()=>state.goals.reduce((n,g)=>n+g.history.length,0);
const maxBestStreak=()=>state.goals.reduce((n,g)=>Math.max(n,bestStreak(g)),0);
const levelOf=(e)=>Math.min(50, 1+Math.floor(e/120));
const LEVEL_NAMES=["初来乍到","小有起色","渐入佳境","稳步前行","持之以恒","自律成习","习惯成自然","简持大师"];
