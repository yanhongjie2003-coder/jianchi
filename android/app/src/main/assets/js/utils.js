/* ============================================================
 * 简持 · 工具函数
 * DOM 选择器、HTML 转义、SVG 图标库、日期计算、可复现随机数
 * ============================================================ */
"use strict";

/* ============================ 图标（SVG，Material Symbols 风格描边） ============================ */
const P = (d)=>`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
const ICONS = {
  home: P("M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z"),
  stats: P("M4 20V11M10 20V4M16 20v-6M2 20h20"),
  trophy: P("M8 4h8v4a4 4 0 0 1-8 0Zm0 1H5a3 3 0 0 0 3 4m8-4h3a3 3 0 0 1-3 4m-4 2v4m-4 4h8m-4-4v4"),
  person: P("M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"),
  plus: P("M12 5v14M5 12h14"),
  check: P("M5 13l4 4L19 7"),
  flame: P("M12 3c1.2 3 5 5.2 5 9a5 5 0 0 1-10 0c0-2 1-3.4 2-5 .4 1.8 1.6 2.6 1.6 2.6S10.8 6 12 3Z"),
  drop: P("M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z"),
  book: P("M12 6c-2-1.4-4.8-2-8-2v14c3.2 0 6 .6 8 2 2-1.4 4.8-2 8-2V4c-3.2 0-6 .6-8 2Zm0 0v14"),
  run: P("M14 6a1.6 1.6 0 1 0 0-3.2A1.6 1.6 0 0 0 14 6Zm-3 4 3-2 2 3 3 1m-8-2-2 5 3 2v4m2-6 2 2 1 4M7 10l2-2"),
  lotus: P("M12 4c2 2.5 2 5.5 0 8-2-2.5-2-5.5 0-8Zm-6 3c3 .6 5 2.6 6 5-3 .4-5.4-1-6-5Zm12 0c-.6 4-3 5.4-6 5 1-2.4 3-4.4 6-5ZM5 14c2 4 12 4 14 0-1 5-4 7-7 7s-6-2-7-7Z"),
  music: P("M9 18V6l10-2v11M9 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm10-3a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"),
  plant: P("M12 21v-8m0 0c0-4-2.5-6-7-6 0 4.5 2.5 6 7 6Zm0 2c0-3.4 2-5 6-5 0 3.8-2 5-6 5Z"),
  moon: P("M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z"),
  pen: P("M4 20l1-4L17 4l3 3L8 19l-4 1Zm12-13 3 3"),
  star: P("m12 3 2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8Z"),
  crown: P("m4 17 2-9 4.5 4L12 5l1.5 7L18 8l2 9Zm1 3h14"),
  gem: P("M7 4h10l4 5-9 12L3 9Zm-4 5h18M12 21 8 9m4 12 4-12"),
  bolt: P("M13 2 4 14h6l-1 8 9-12h-6Z"),
  sunrise: P("M12 3v4m-7 6 1.5 1.5M5 21h14M8 21a4 4 0 0 1 8 0M3 13h2m14 0h2M4.5 6.5 6 8m13.5-1.5L18 8"),
  target: P("M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"),
  calendar: P("M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Zm3-3v4m8-4v4M4 11h16"),
  medal: P("M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-3 .8L7 22l5-3 5 3-2-7.2"),
  undo: P("M4 9h10a5 5 0 0 1 0 10h-3M4 9l4-4M4 9l4 4"),
  download: P("M12 3v12m0 0-4-4m4 4 4-4M4 21h16"),
  refresh: P("M20 12a8 8 0 1 1-2.3-5.7M20 3v5h-5"),
  palette: P("M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2a2 2 0 0 0-1.5 3.3c.4.5.5 1.7-2.5 2.7ZM7.5 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm4-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm4.5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"),
  moonDark: P("M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z"),
  ticket: P("M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4a2 2 0 0 0 0-4Zm10-2v12"),
};
const ico = (name, size=24)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

/* ============================ 工具 ============================ */
const esc=(s)=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const todayStr=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const addDays=(iso,n)=>{ const d=new Date(iso+"T00:00:00"); d.setDate(d.getDate()+n); return todayStr(d); };
const dowMon=(iso)=>{ const d=new Date(iso+"T00:00:00").getDay(); return (d+6)%7; };        // 周一=0
const mondayOf=(iso)=>addDays(iso,-dowMon(iso));
