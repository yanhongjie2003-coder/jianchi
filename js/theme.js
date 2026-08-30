/* ============================================================
 * 简持 · 动态取色
 * Material You:种子色经 HSL 数学生成 M3 tonal 色板,深浅模式切换
 * ============================================================ */
"use strict";

/* ============================ 动态取色（M3 tonal 色板生成） ============================ */
function hexToHsl(hex){
  const n = hex.replace("#","");
  const r=parseInt(n.slice(0,2),16)/255, g=parseInt(n.slice(2,4),16)/255, b=parseInt(n.slice(4,6),16)/255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b); let h=0,s=0; const l=(mx+mn)/2;
  if(mx!==mn){ const d=mx-mn; s=l>.5? d/(2-mx-mn) : d/(mx+mn);
    h = mx===r ? (g-b)/d+(g<b?6:0) : mx===g ? (b-r)/d+2 : (r-g)/d+4; h*=60; }
  return [h,s*100,l*100];
}
const hsl=(h,s,l)=>{ s=Math.max(0,Math.min(100,s)); l=Math.max(0,Math.min(100,l)); return `hsl(${((h%360)+360)%360} ${s}% ${l}%)`; };
function applyTheme(seedHex, dark){
  const [h,s0] = hexToHsl(seedHex);
  const S = Math.max(18, Math.min(s0, 68));           // 抑制过饱和
  const t = dark;
  const R = document.documentElement.style;
  const set=(k,v)=>R.setProperty(k,v);
  set("--primary",            t? hsl(h,S+8,80) : hsl(h,S,38));
  set("--on-primary",         t? hsl(h,S*0.8,18) : "#ffffff");
  set("--primary-container",  t? hsl(h,S*0.8,28) : hsl(h,S*0.85,90));
  set("--on-primary-container",t? hsl(h,S*0.7,90) : hsl(h,S*0.95,14));
  set("--secondary-container",t? hsl(h,S*0.45,26) : hsl(h,S*0.55,89));
  set("--on-secondary-container",t? hsl(h,S*0.5,90) : hsl(h,S*0.85,16));
  set("--tertiary",           t? hsl(h+55,S,78) : hsl(h+55,S*0.75,33));
  set("--on-tertiary",        t? hsl(h+55,S*0.8,16) : "#ffffff");
  set("--tertiary-container", t? hsl(h+55,S*0.5,26) : hsl(h+55,S*0.6,88));
  set("--on-tertiary-container",t? hsl(h+55,S*0.5,90) : hsl(h+55,S*0.85,15));
  set("--surface",            t? hsl(h,S*0.18,8)  : hsl(h,S*0.28,96.5));
  set("--surface-dim",        t? hsl(h,S*0.18,5)  : hsl(h,S*0.2,82));
  set("--surface-container-low",  t? hsl(h,S*0.2,11) : hsl(h,S*0.32,98.5));
  set("--surface-container",      t? hsl(h,S*0.2,14) : hsl(h,S*0.3,93));
  set("--surface-container-high", t? hsl(h,S*0.22,18) : hsl(h,S*0.28,90.5));
  set("--surface-container-highest",t? hsl(h,S*0.22,22) : hsl(h,S*0.26,88));
  set("--on-surface",         t? hsl(h,S*0.25,92) : hsl(h,S*0.3,13));
  set("--on-surface-variant", t? hsl(h,S*0.15,76) : hsl(h,S*0.18,34));
  set("--outline",            t? hsl(h,S*0.1,58)  : hsl(h,S*0.12,50));
  set("--outline-variant",    t? hsl(h,S*0.12,32) : hsl(h,S*0.2,82));
  set("--inverse-surface",    t? hsl(h,S*0.25,91) : hsl(h,S*0.3,19));
  set("--inverse-on-surface", t? hsl(h,S*0.3,14)  : hsl(h,S*0.3,95));
  const meta = document.querySelector('meta[name="theme-color"]');
  if(meta) meta.content = t? hsl(h,S*0.2,8) : hsl(h,S*0.28,96.5);
}
