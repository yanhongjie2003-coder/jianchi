/* ============================================================
 * 简持 · 交互与启动
 * 视图切换、打卡与撤销、创建/编辑/资料抽屉、导入导出、彩带、启动入口
 * ============================================================ */
"use strict";

$("#heatGrid").onclick=e=>{
  const cell=e.target.closest(".heat");
  if(!cell||!cell.dataset.date) return;
  heatSel = heatSel===cell.dataset.date ? null : cell.dataset.date;
  $$("#heatGrid .heat").forEach(x=>x.classList.toggle("sel",!!x.dataset.date&&x.dataset.date===heatSel));
  renderHeatDetail();
};

/* ============================ 交互 ============================ */
/* 视图切换 */
$$(".nav-item").forEach(b=>b.onclick=()=>{
  $$(".nav-item").forEach(x=>x.classList.remove("active")); b.classList.add("active");
  $$(".view").forEach(v=>v.classList.remove("active"));
  $("#view-"+b.dataset.view).classList.add("active");
  const r={home:renderHome,stats:renderStats,awards:renderAwards,me:renderMe}[b.dataset.view]; r();
});
/* 统计页年月切换 */
$("#monthPrev").onclick=()=>{ let [y,m]=curStatsYM(); m--; if(m<1){ m=12; y--; } statsSel=[y,m]; renderStats(); };
$("#monthNext").onclick=()=>{ let [y,m]=curStatsYM(); const t=TODATE0(); m++; if(m>12){ m=1; y++; }
  if(y>t[0]||(y===t[0]&&m>t[1])) return; statsSel=[y,m]; renderStats(); };

/* 打卡 */
let lastCheck=null;
function doCheck(btn,undoable=true){
  const g=state.goals.find(x=>x.id===btn.dataset.goal); if(!g) return;
  const t=TODAY();
  if(isDayDone(g,t)) return;
  if(g.freq.type!=="daily"&&g.history.includes(t)) return;      // 每周/每月目标每天只记 1 次打卡
  let doneNow=false, line="";
  if(g.freq.type==="daily"&&g.perDay>1){
    const c=(g.counts[t]||0)+1; g.counts[t]=c;
    if(!g.history.includes(t)) g.history.push(t);
    doneNow=c>=g.perDay;
    line= doneNow? `${g.name} 今日 ${g.perDay} 次达成 · +10 能量` : `${g.name} ${c}/${g.perDay} · 加油！`;
    if(!doneNow){ state.energy+=2; save(); renderHome(); confettiFrom(btn,36); toast(line); return; }
  }else{
    g.history.push(t); doneNow=true;
    if(g.freq.type==="weekly") line=`${g.name} 本周进度推进 · +10 能量`;
    else if(g.freq.type==="monthly") line=`${g.name} 本月进度推进 · +10 能量`;
    else line=`🔥 ${g.name} 连续 ${currentStreak(g)} 天 · +10 能量`;
  }
  state.energy+=10; save(); lastCheck={goalId:g.id,date:t};
  renderAll();
  const fresh=$(`.check-btn[data-goal="${g.id}"]`);
  confettiFrom(fresh||btn,120);
  const freshBadges=refreshBadges().filter(id=>!["first"].includes(id));
  showCelebrate(ico(g.icon,40), line, freshBadges.length? `🎉 解锁徽章：${freshBadges.map(id=>BADGES.find(b=>b.id===id).name).join("、")}` : "又向目标迈进了一步", undoable);
}
function undoCheck(){
  if(!lastCheck) return;
  const g=state.goals.find(x=>x.id===lastCheck.goalId); const t=lastCheck.date;
  if(g&&g.history.includes(t)){
    g.history=g.history.filter(d=>d!==t); delete g.counts[t];
    state.energy=Math.max(0,state.energy-10);
  }
  lastCheck=null; save();
  $("#celeMask").classList.remove("show"); renderAll(); toast("已撤销本次打卡");
}
function reopenCheck(goalId){                   // 点击已打卡卡片：重新提供撤销入口
  const g=state.goals.find(x=>x.id===goalId); if(!g) return;
  const t=TODAY();
  if(!hasCheckedOn(g,t)) return;
  lastCheck={goalId:g.id,date:t};
  const line = g.freq.type==="daily"&&g.perDay>1 ? `${g.name} 今日 ${g.perDay} 次已达成`
    : g.freq.type==="daily" ? `🔥 ${g.name} 连续 ${currentStreak(g)} 天`
    : g.freq.type==="weekly" ? `${g.name} 本周进度 +1` : `${g.name} 本月进度 +1`;
  showCelebrate(ico(g.icon,40), line, "今日已打卡，误点可撤销", true, "今日已打卡");
}
function showCelebrate(iconSvg,line,sub,undoable=true,title="打卡成功！"){
  $("#celeTitle").textContent=title;
  $("#celeIcon").innerHTML=iconSvg;
  $("#celeLine").textContent=line;
  $("#celeSub").textContent=sub||"又向目标迈进了一步";
  $("#celeUndo").style.display=undoable?"":"none";
  $("#celeMask").classList.add("show");
}
$("#celeOk").onclick=()=>$("#celeMask").classList.remove("show");
$("#celeUndo").onclick=undoCheck;
$("#celeMask").onclick=e=>{ if(e.target===$("#celeMask")) $("#celeMask").classList.remove("show"); };
document.addEventListener("keydown",e=>{ if(e.key==="Escape"){ $("#celeMask").classList.remove("show"); closeSheet(); closeProfileSheet(); } });

/* 创建/编辑目标弹层 */
const sheet=$("#createSheet"), scrim=$("#scrim");
let editTarget=null, deleteArmed=false;
function resetSheetMode(){
  editTarget=null; deleteArmed=false;
  $("#sheetTitle").textContent="创建新目标 ✨";
  $("#createBtn").textContent="创建目标 🚀";
  const del=$("#delGoalBtn"); del.style.display="none"; del.textContent="删除目标";
  $("#goalNameInput").value="";
  selIcon="target";
  $$("#iconRow .icon-opt").forEach(x=>x.classList.toggle("sel",x.dataset.ico===selIcon));
  $("#stepVal").textContent=5; $("#cntVal").textContent=1;
  applyFreq(0);
}
function openSheet(){ resetSheetMode(); sheet.classList.add("show"); scrim.classList.add("show"); setTimeout(()=>$("#goalNameInput").focus({preventScroll:true}),350); }
function openEditSheet(goalId){                       // 点击目标卡片：编辑模式（预填）
  const g=state.goals.find(x=>x.id===goalId); if(!g) return;
  resetSheetMode(); editTarget=goalId;
  $("#sheetTitle").textContent="编辑目标 ✏️";
  $("#createBtn").textContent="保存修改";
  $("#delGoalBtn").style.display="flex";
  $("#goalNameInput").value=g.name;
  selIcon=ICONS[g.icon]?g.icon:"target";
  $$("#iconRow .icon-opt").forEach(x=>x.classList.toggle("sel",x.dataset.ico===selIcon));
  $("#stepVal").textContent=(g.freq&&g.freq.times)||5;
  $("#cntVal").textContent=g.perDay||1;
  applyFreq(g.freq.type==="weekly"?1:g.freq.type==="monthly"?2:0);
  sheet.classList.add("show"); scrim.classList.add("show");
}
function closeSheet(){ sheet.classList.remove("show"); scrim.classList.remove("show"); resetSheetMode(); }
$("#fabBtn").innerHTML=ico("plus",28);
$("#fabBtn").onclick=openSheet;
scrim.onclick=()=>{ closeSheet(); closeProfileSheet(); };
let selIcon="target", freqIdx=0;
const FREQ_META=[
  {label:"每天完成",max:1,tpl:()=>"📅 每天都打卡，养成稳定节奏"},
  {label:"每周完成",max:7,tpl:v=>`📅 每周任意 ${v} 天完成即达标，灵活不焦虑`},
  {label:"每月完成",max:31,tpl:v=>`📅 本月累计 ${v} 次即达标，适合低频目标`},
];
function applyFreq(idx){
  freqIdx=idx;
  $$("#freqSeg button").forEach((x,i)=>x.classList.toggle("sel",i===idx));
  const m=FREQ_META[idx];
  $("#freqStepper").style.display=idx===0?"none":"flex";
  $("#dailyCountRow").style.display=idx===0?"flex":"none";
  $("#stepLabel").textContent=m.label;
  if(idx>0) $("#stepVal").textContent=Math.min(Math.max(+$("#stepVal").textContent,1),m.max);
  $("#freqHint").textContent=m.tpl($("#stepVal").textContent);
}
$("#iconRow").innerHTML=["target","book","drop","run","lotus","music","plant","moon"].map(n=>
  `<button class="icon-opt ${n===selIcon?"sel":""}" data-ico="${n}" aria-label="图标">${ico(n,24)}</button>`).join("");
$$("#iconRow .icon-opt").forEach(b=>b.onclick=()=>{
  selIcon=b.dataset.ico; $$("#iconRow .icon-opt").forEach(x=>x.classList.remove("sel")); b.classList.add("sel");
});
$$("#freqSeg button").forEach(b=>b.onclick=()=>applyFreq(["daily","weekly","monthly"].indexOf(b.dataset.freq)));
$("#stepMinus").onclick=()=>{ const m=FREQ_META[freqIdx]; const el=$("#stepVal"); el.textContent=Math.max(1,+el.textContent-1); $("#freqHint").textContent=m.tpl(el.textContent); };
$("#stepPlus").onclick =()=>{ const m=FREQ_META[freqIdx]; const el=$("#stepVal"); el.textContent=Math.min(m.max,+el.textContent+1); $("#freqHint").textContent=m.tpl(el.textContent); };
$("#cntMinus").onclick=()=>{ const el=$("#cntVal"); el.textContent=Math.max(1,+el.textContent-1); };
$("#cntPlus").onclick =()=>{ const el=$("#cntVal"); el.textContent=Math.min(20,+el.textContent+1); };
applyFreq(0);
$("#createBtn").onclick=()=>{
  const name=$("#goalNameInput").value.trim();
  if(!name){ toast("先给目标起个名字吧"); $("#goalNameInput").focus({preventScroll:true}); return; }
  const perDay=freqIdx===0? +$("#cntVal").textContent : 1;
  const freq= freqIdx===0? {type:"daily"} : freqIdx===1? {type:"weekly",times:+$("#stepVal").textContent} : {type:"monthly",times:+$("#stepVal").textContent};
  if(editTarget){                                      // 编辑模式：原位更新，保留历史与连续
    const g=state.goals.find(x=>x.id===editTarget);
    if(g){ g.name=name; g.icon=selIcon; g.freq=freq; g.perDay=perDay; save(); }
    closeSheet(); renderAll(); if(g) toast(`「${name}」已保存修改`);
    return;
  }
  state.goals.push({ id:"g"+Math.random().toString(36).slice(2,8), name, icon:selIcon, freq, perDay,
    createdAt:TODAY(), history:[], counts:{}, earlyFlags:{} });
  save(); refreshBadges(); closeSheet(); $("#goalNameInput").value="";
  $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view==="home"));
  $$(".view").forEach(v=>v.classList.remove("active")); $("#view-home").classList.add("active");
  renderAll(); toast(`「${name}」已创建，从今天开始加油 💪`);
};
$("#delGoalBtn").onclick=e=>{
  if(!editTarget) return;
  if(!deleteArmed){ deleteArmed=true; e.target.textContent="再点一次确认删除"; return; }
  const g=state.goals.find(x=>x.id===editTarget);
  state.goals=state.goals.filter(x=>x.id!==editTarget);
  save(); closeSheet(); renderAll(); toast(`已删除「${g?g.name:"目标"}」`);
};

/* 编辑资料弹层（名字 + 头像） */
const profileSheet=$("#profileSheet");
const AVATARS=["auto","🔥","⚡","🌟","🌙","☕","🌱","🏆"];
let selAvatar="auto";
function renderAvatarRow(){                          // 首字选项跟随当前名字
  const autoChar=(state.profile&&state.profile.name||"拾光者").charAt(0);
  $("#avatarRow").innerHTML=AVATARS.map(a=>a==="auto"
    ? `<button class="icon-opt avatar-opt" data-av="auto" aria-label="头像 名字首字">${autoChar}</button>`
    : `<button class="icon-opt avatar-opt" data-av="${a}" aria-label="头像 ${a}">${a}</button>`).join("");
  $$("#avatarRow .avatar-opt").forEach(b=>b.onclick=()=>{
    selAvatar=b.dataset.av;
    $$("#avatarRow .avatar-opt").forEach(x=>x.classList.toggle("sel",x.dataset.av===selAvatar));
  });
}
function closeProfileSheet(){ profileSheet.classList.remove("show"); scrim.classList.remove("show"); $("#profileNameInput").value=""; }
function openProfileSheet(){
  closeSheet();
  selAvatar=(state.profile&&state.profile.avatar)||"auto";
  if(selAvatar!=="auto"&&!AVATARS.includes(selAvatar)) selAvatar="auto";
  $("#profileNameInput").value=(state.profile&&state.profile.name)||"拾光者";
  renderAvatarRow();
  $$("#avatarRow .avatar-opt").forEach(x=>x.classList.toggle("sel",x.dataset.av===selAvatar));
  profileSheet.classList.add("show"); scrim.classList.add("show");
}
$("#profileBtn").onclick=openProfileSheet;
$("#profileSaveBtn").onclick=()=>{
  const name=$("#profileNameInput").value.trim();
  if(!name){ toast("名字不能为空"); $("#profileNameInput").focus({preventScroll:true}); return; }
  state.profile={ name:name.slice(0,12), avatar:selAvatar==="auto"?"auto":selAvatar };
  save(); closeProfileSheet(); renderMe(); toast("资料已保存");
};

/* 设置 */
function refreshTheme(){
  const dark = state.dark===null ? window.matchMedia("(prefers-color-scheme: dark)").matches : state.dark;
  document.body.classList.toggle("reduce-motion", state.reduceMotion);
  applyTheme(state.seed, dark);
}
$("#darkToggle").onchange=e=>{ state.dark=e.target.checked; save(); refreshTheme(); };
$("#motionToggle").onchange=e=>{ state.reduceMotion=e.target.checked; save(); refreshTheme(); toast(state.reduceMotion?"已减少动效":"动效已开启"); };
$("#exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="shiguang-backup.json"; a.click();
  URL.revokeObjectURL(a.href); toast("备份已下载");
};
$("#importBtn").onclick=()=>$("#importFile").click();
$("#importFile").onchange=e=>{
  const f=e.target.files && e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!d||!Array.isArray(d.goals)) throw new Error("format");
      const seen=new Set();
      d.v=1;
      d.seed=typeof d.seed==="string"&&/^#[0-9a-fA-F]{6}$/.test(d.seed)?d.seed:"#c14a10";
      d.dark=typeof d.dark==="boolean"?d.dark:null;
      d.reduceMotion=!!d.reduceMotion;
      d.energy=Math.max(0,Math.round(Number(d.energy))||0);
      d.flags=d.flags&&typeof d.flags==="object"?d.flags:{};
      delete d.makeupCards;
      d.profile = (d.profile&&typeof d.profile==="object") ? {
        name:String(d.profile.name||"拾光者").slice(0,12)||"拾光者",
        avatar:(typeof d.profile.avatar==="string"&&d.profile.avatar&&d.profile.avatar!=="拾")?d.profile.avatar.slice(0,4):"auto",
      } : { name:"拾光者", avatar:"auto" };
      d.goals=d.goals.map(g=>{
        let id=(typeof g.id==="string"&&g.id)?g.id:"g"+Math.random().toString(36).slice(2,8);
        while(seen.has(id)) id="g"+Math.random().toString(36).slice(2,8); seen.add(id);
        const freq=g.freq||{};
        return {
          id, name:String(g.name||"未命名目标").slice(0,40),
          icon:ICONS[g.icon]?g.icon:"target",
          freq: freq.type==="weekly"||freq.type==="monthly" ? {type:freq.type,times:Math.min(31,Math.max(1,Math.round(Number(freq.times))||1))} : {type:"daily"},
          perDay:Math.min(20,Math.max(1,Math.round(Number(g.perDay))||1)),
          createdAt:typeof g.createdAt==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(g.createdAt)?g.createdAt:todayStr(),
          history:Array.isArray(g.history)?g.history.filter(x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)):[],
          counts:g.counts&&typeof g.counts==="object"?g.counts:{},
          earlyFlags:g.earlyFlags&&typeof g.earlyFlags==="object"?g.earlyFlags:{},
        };
      });
      state=d; statsSel=null;
      unlockedIds=BADGES.filter(b=>b.cond()).map(b=>b.id); save(); refreshTheme(); renderAll();
      $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view==="home"));
      $$(".view").forEach(v=>v.classList.remove("active")); $("#view-home").classList.add("active");
      toast(`已导入 ${state.goals.length} 个目标`);
    }catch(err){ toast("导入失败：文件格式不正确"); }
  };
  r.onerror=()=>toast("导入失败：文件读取失败");
  r.readAsText(f); e.target.value="";
};
let clearArmed=false;
$("#clearBtn").onclick=e=>{
  if(!clearArmed){ clearArmed=true; e.target.textContent="再点一次确认"; e.target.style.background="var(--error)"; e.target.style.color="#fff";
    setTimeout(()=>{ clearArmed=false; const b=$("#clearBtn"); b.textContent="清空"; b.style.background=""; b.style.color=""; },3000); return; }
  state={ v:1, seed:state.seed, dark:state.dark, reduceMotion:state.reduceMotion, energy:0, flags:{},
    profile:state.profile||{ name:"拾光者", avatar:"auto" }, goals:[] };
  statsSel=null; unlockedIds=[]; save(); renderAll();
  const b=$("#clearBtn"); b.textContent="清空"; b.style.background=""; b.style.color=""; clearArmed=false;
  toast("已清空全部数据");
};
let resetArmed=false;
$("#resetBtn").onclick=e=>{
  if(!resetArmed){ resetArmed=true; e.target.textContent="再点一次确认"; e.target.style.background="var(--error)"; e.target.style.color="#fff";
    setTimeout(()=>{ resetArmed=false; const b=$("#resetBtn"); b.textContent="重置"; b.style.background=""; b.style.color=""; },3000); return; }
  localStorage.removeItem(STORE_KEY); state=seedState(); unlockedIds=[]; save(); refreshBadges(); refreshTheme(); renderAll();
  const b=$("#resetBtn"); b.textContent="重置"; b.style.background=""; b.style.color=""; resetArmed=false;
  toast("已重置为演示数据");
};

/* Snackbar */
let snackTimer=null;
function toast(msg){
  $("#snackMsg").textContent=msg; $("#snackAct").textContent=""; $("#snackAct").style.display="none";
  $("#snackbar").classList.add("show");
  clearTimeout(snackTimer); snackTimer=setTimeout(()=>$("#snackbar").classList.remove("show"),2600);
}

/* ============================ 彩带（从按钮位置喷射） ============================ */
const cvs=$("#confetti"), ctx=cvs.getContext("2d");
let parts=[], raf=null;
function confettiFrom(el,count=120){
  if(state.reduceMotion||window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const rect=el.getBoundingClientRect(), app=$("#app").getBoundingClientRect();
  const cx=rect.left+rect.width/2-app.left, cy=rect.top+rect.height/2-app.top;
  cvs.width=$("#app").clientWidth; cvs.height=$("#app").clientHeight;
  const colors=[getComputedStyle(document.documentElement).getPropertyValue("--primary").trim()||"#c14a10",
    getComputedStyle(document.documentElement).getPropertyValue("--tertiary").trim()||"#d4a017",
    getComputedStyle(document.documentElement).getPropertyValue("--good").trim()||"#3b7d4f","#e0e0e0"];
  for(let i=0;i<count;i++){
    parts.push({ x:cx,y:cy, vx:(Math.random()-.5)*13, vy:Math.random()*-11-4,
      size:Math.random()*7+4, color:colors[i%colors.length], rot:Math.random()*360, vr:(Math.random()-.5)*18, life:1 });
  }
  if(!raf) tick();
}
function tick(){
  ctx.clearRect(0,0,cvs.width,cvs.height);
  parts.forEach(p=>{ p.vy+=.32; p.x+=p.vx; p.y+=p.vy; p.rot+=p.vr; p.life-=.009;
    ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
    ctx.globalAlpha=Math.max(p.life,0); ctx.fillStyle=p.color;
    ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.6); ctx.restore(); });
  parts=parts.filter(p=>p.life>0&&p.y<cvs.height+40);
  if(parts.length) raf=requestAnimationFrame(tick);
  else{ raf=null; ctx.clearRect(0,0,cvs.width,cvs.height); }
}

/* ============================ 启动 ============================ */
$$(".pill").forEach(p=>{ const v=p.dataset.ico; if(v) p.innerHTML=ico(v,22); });
refreshTheme();
unlockedIds=BADGES.filter(b=>b.cond()).map(b=>b.id); save();
renderAll();
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{ if(state.dark===null) refreshTheme(); });
