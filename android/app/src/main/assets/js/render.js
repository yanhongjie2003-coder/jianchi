/* ============================================================
 * 简持 · 页面渲染
 * 首页 / 统计 / 成就 / 我的 四视图渲染,热力图当日明细
 * ============================================================ */
"use strict";

/* ============================ 渲染 ============================ */
const SHAPES=["run","book","drop","lotus","music","plant","moon","pen"];
function renderHome(){
  const t=TODAY();
  const wd="日一二三四五六"[new Date(t+"T00:00:00").getDay()];
  $("#dateLine").textContent=`${Number(t.slice(5,7))}月${Number(t.slice(8))}日 星期${wd} · 今天也要加油呀`;
  $("#energyChip").innerHTML=ico("bolt",17)+` ${state.energy}`;
  const done=state.goals.filter(g=>hasCheckedOn(g,t)).length;
  const pct=state.goals.length?Math.round(done/state.goals.length*100):0;
  $("#heroPct").textContent=pct+"%";
  $("#goalCount").textContent=`${done} / ${state.goals.length}`;
  $("#heroDesc").textContent= !state.goals.length? "点击下方 ＋ 创建第一个目标 ✨" : pct===100?"🎊 全部完成！今天圆满了": pct>=50?"过半啦，冲鸭 💪": pct>0?"好的开始，继续保持":"完成第一个目标，点燃今天 🔥";
  $("#heroRing").style.strokeDashoffset=213.6*(1-pct/100);
  $("#goalList").innerHTML=state.goals.map((g,i)=>{
    const isTodayDone=isDayDone(g,t);                 // 目标已达成（卡片完成样式）
    const isChecked=hasCheckedOn(g,t);                // 今天已打过卡（按钮✓态，每周/每月同日防重）
    let meta,frac;
    if(g.freq.type==="daily"&&g.perDay>1){
      const c=g.counts[t]||0; frac=c/g.perDay;
      meta= isTodayDone? `每天 · 已完成 ${c}/${g.perDay}` : `每天 · 已完成 <b>${c}</b>/${g.perDay}`;
    }else if(g.freq.type==="daily"){
      frac=isTodayDone?1:0; meta=`每天 · <span class="streak-chip">${ico("flame",13)} 连续 ${currentStreak(g)} 天</span>`;
    }else if(g.freq.type==="weekly"){
      const mon=mondayOf(t); let c=0; for(let j=0;j<7;j++){ const d=addDays(mon,j); if(d>t)break; if(g.history.includes(d))c++; }
      frac=Math.min(1,c/g.freq.times); meta=`每周 ${g.freq.times} 次 · 本周 <b>${c}</b>/${g.freq.times}`;
    }else{
      const [y,m]=t.split("-"); const mm=`${y}-${m}`;
      const c=g.history.filter(d=>d.startsWith(mm)&&d<=t).length;
      frac=Math.min(1,c/g.freq.times); meta=`每月 ${g.freq.times} 次 · 本月 <b>${c}</b>/${g.freq.times}`;
    }
    const btnTxt = g.freq.type==="daily"&&g.perDay>1&&!isChecked ? `+${1}` : "";
    return `<div class="goal-card ${isTodayDone?"done":""}" data-shape="${SHAPES.indexOf(g.icon)%4}" style="animation-delay:${i*60}ms">
      <button class="goal-info-btn" data-goal="${g.id}" aria-label="编辑 ${esc(g.name)}">
        <span class="goal-shape">${ico(g.icon,26)}</span>
        <span class="goal-info">
          <span class="goal-name">${esc(g.name)}</span>
          <span class="goal-meta">${meta}</span>
          <span class="mini-progress"><i style="width:${Math.round(frac*100)}%"></i></span>
        </span>
      </button>
      <button class="check-btn ${isChecked?"checked":""}" data-goal="${g.id}" aria-label="${isChecked?g.name+" 已完成":g.name+" 打卡"}">
        ${isChecked? ico("check",26) : (btnTxt? `<b style="font-size:17px">＋1</b><span>共 ${g.perDay}</span>` : `<span style="font-size:13px;font-weight:800">打卡</span>`)}
      </button>
    </div>`;
  }).join("");
  $$("#goalList .check-btn").forEach(b=>b.onclick=()=>{ b.classList.contains("checked") ? reopenCheck(b.dataset.goal) : doCheck(b); });
  $$("#goalList .goal-info-btn").forEach(b=>b.onclick=()=>openEditSheet(b.dataset.goal));
  if(!state.goals.length) $("#goalList").innerHTML=`<div class="empty-hint">还没有目标，点右下角 ＋ 创建一个吧 🌱</div>`;
}
let statsSel=null;                                              // 统计页选中的年月 [y,m]，null=当月
const curStatsYM=()=>{ if(statsSel) return statsSel; const t=TODATE0(); return [t[0],t[1]]; };
function renderStats(){
  const t=TODAY(); const [y,m,d]=TODATE0();
  const [sy,sm]=curStatsYM(); const smax=daysOfMonth(sy,sm);
  $("#monthChip").textContent=`${sy} 年 ${sm} 月`;
  $("#monthPrev").disabled = sy<=2000&&sm===1;
  $("#monthNext").disabled = sy===y&&sm===m;
  $("#statRow").innerHTML=`
    <div class="stat-box"><b style="color:var(--primary)">${state.goals.reduce((n,g)=>Math.max(n,currentStreak(g)),0)}</b><span>最长当前连续</span></div>
    <div class="stat-box"><b style="color:var(--tertiary)">${state.goals.reduce((n,g)=>Math.max(n,bestStreak(g)),0)}</b><span>历史最长连续</span></div>
    <div class="stat-box"><b style="color:var(--good)">${monthRate(sy,sm)}%</b><span>${sm} 月完成率</span></div>`;
  const mon=mondayOf(t);
  let hits=0;
  $("#weekStrip").innerHTML=Array.from({length:7},(_,i)=>{
    const d2=addDays(mon,i); const future=d2>t; const r=dayRatio(d2);
    const hit=!future&&r>=0.5; if(hit)hits++;
    const cls="d"+(hit?" hit":"")+(d2===t?" today":"");
    return `<div class="day-cell"><div class="${cls}">${hit?"✓":future?"·":r>0?Math.round(r*100)+"":"–"}</div><div class="lbl">${"一二三四五六日"[i]}</div></div>`;
  }).join("");
  $("#weekSummary").textContent = t<addDays(mon,6) ? `已打卡 ${hits} 天` : `共打卡 ${hits} 天`;
  $("#heatTitle").textContent=`${sm} 月热力图`;
  if(heatSel && !heatSel.startsWith(`${sy}-${String(sm).padStart(2,"0")}-`)) heatSel=null;
  const first=new Date(sy,sm-1,1); const pad=(first.getDay()+6)%7; const dim=new Date(sy,sm,0).getDate();
  $("#heatGrid").innerHTML="&nbsp;".repeat(0)+Array(pad).fill("<div></div>").join("")+Array.from({length:dim},(_,i)=>{
    const d2=`${sy}-${String(sm).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`;
    if(d2>t) return `<div class="heat off"></div>`;
    const r=dayRatio(d2); const lv=r>=.99?"l3":r>=.5?"l2":r>0?"l1":"";
    return `<div class="heat ${lv} ${d2===t?"today":""}" data-date="${d2}" role="img" aria-label="${sm}月${i+1}日完成${Math.round(r*100)}%"></div>`;
  }).join("");
  $$("#heatGrid .heat").forEach(x=>x.classList.toggle("sel",!!x.dataset.date&&x.dataset.date===heatSel));
  renderHeatDetail();
  $("#perGoalMonth").textContent=`${sm} 月`;
  $("#perGoalList").innerHTML=state.goals.map(g=>{
    let done=0; for(let i=1;i<=smax;i++){ if(isDayDone(g,`${sy}-${String(sm).padStart(2,"0")}-${String(i).padStart(2,"0")}`)) done++; }
    const rate=smax?Math.round(done/smax*100):0;
    return `<div class="per-goal"><span style="color:var(--primary)">${ico(g.icon,20)}</span><span class="nm">${esc(g.name)}</span><span class="pc">${rate}%</span></div>`;
  }).join("") || `<div class="empty-hint" style="padding:18px">暂无目标</div>`;
}
function renderAwards(){
  const lv=levelOf(state.energy), next=lv*120;
  $("#levelIcon").innerHTML=ico("star",38);
  $("#levelName").textContent=`Lv.${lv} ${LEVEL_NAMES[Math.min(lv-1,LEVEL_NAMES.length-1)]}`;
  const toNext=next-state.energy;
  $("#levelNext").textContent=`再获得 ${toNext} 能量升级 Lv.${lv+1}`;
  $("#levelBar").style.width=Math.round((state.energy-(lv-1)*120)/120*100)+"%";
  const unlocked=BADGES.filter(b=>unlockedIds.includes(b.id));
  $("#badgeCount").textContent=`已解锁 ${unlocked.length} / ${BADGES.length}`;
  $("#badgeGrid").innerHTML=BADGES.map(b=>{
    const on=unlockedIds.includes(b.id);
    const cnt=b.count?Math.max(0,Math.floor(b.count())):(on?1:0);
    const showCnt=on&&cnt>1;
    return `<div class="badge ${on?"":"locked"}" role="img" aria-label="${b.name}${on?`已解锁${showCnt?`,已获得 ${cnt} 次`:""}`:"未解锁"}">
      <div class="b">${ico(b.icon,26)}${showCnt?`<i class="badge-count">${cnt>99?"99+":cnt}</i>`:""}</div><span>${b.name}</span></div>`;
  }).join("");
  $("#highlightIcon").innerHTML=`<div style="width:72px;height:72px;border-radius:50%;background:var(--secondary-container);color:var(--on-secondary-container);display:flex;align-items:center;justify-content:center">${ico("medal",34)}</div>`;
  const best=Math.max(0,...state.goals.map(g=>currentStreak(g)));
  $("#highlightTitle").textContent=best>0?`当前最长连续 ${best} 天！`:"从今天开始连续的第一天";
}
function renderMe(){
  const lv=levelOf(state.energy);
  const prof=state.profile||{};
  const autoChar=(prof.name||"拾光者").charAt(0);
  $("#meAvatar").textContent=(prof.avatar&&prof.avatar!=="auto")?prof.avatar:autoChar;
  $("#meName").textContent=prof.name||"拾光者";
  $("#meLevel").textContent=`Lv.${lv} · 能量 ${state.energy} · 累计打卡 ${totalCheckins()} 次`;
  $("#profilePencil").innerHTML=ico("pen",18);
  $("#darkToggle").checked= state.dark===null ? window.matchMedia("(prefers-color-scheme: dark)").matches : state.dark;
  $("#motionToggle").checked= state.reduceMotion;
  $("#seedRow").innerHTML=["#c14a10","#3b7d4f","#3b6fd4","#7c5ce0","#d43b8e"].map(c=>
    `<button class="seed-dot ${c===state.seed?"sel":""}" data-seed="${c}" style="background:${c}" aria-label="主题色 ${c}"></button>`).join("");
  $$("#seedRow .seed-dot").forEach(b=>b.onclick=()=>{ state.seed=b.dataset.seed; save(); refreshTheme(); renderMe(); toast("主题色已更新"); });
}
function renderAll(){ renderHome(); renderStats(); renderAwards(); renderMe(); }

/* 热力图点选：查看某日各目标打卡详情 */
let heatSel=null;

function renderHeatDetail(){
  const el=$("#heatDetail");
  if(!heatSel){ el.hidden=true; el.innerHTML=""; return; }
  const wd="日一二三四五六"[new Date(heatSel+"T00:00:00").getDay()];
  const rows=state.goals.map(g=>{
    let ok=false, txt="未打卡";
    if(g.counts&&g.counts[heatSel]>0){ ok=true; txt=g.counts[heatSel]>=g.perDay?"已完成":`进行中 ${g.counts[heatSel]}/${g.perDay}`; }
    else if((g.history||[]).includes(heatSel)){ ok=true; txt="已完成"; }
    return `<div class="per-goal"><span style="color:${ok?"var(--good)":"var(--outline)"};font-weight:900">${ok?"✓":"·"}</span><span class="nm">${esc(g.name)}</span><span class="pc" style="color:${ok?"var(--good)":"var(--on-surface-variant)"}">${txt}</span></div>`;
  }).join("") || `<div style="padding:8px 2px;font-size:13px;color:var(--on-surface-variant)">暂无目标</div>`;
  const done=state.goals.filter(g=>(g.counts&&g.counts[heatSel]>0)||(g.history||[]).includes(heatSel)).length;
  const summary = !state.goals.length ? "暂无目标" : done ? `打卡 ${done} 项` : "这一天没有打卡记录";
  el.innerHTML=`<div class="hd-title">${Number(heatSel.slice(5,7))}月${Number(heatSel.slice(8))}日 星期${wd} · ${summary}</div>${rows}`;
  el.hidden=false;
}
