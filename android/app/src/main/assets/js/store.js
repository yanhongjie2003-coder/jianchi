/* ============================================================
 * 简持 · 数据层
 * localStorage 读写、默认空数据、应用状态 state、本机备份
 * ============================================================ */
"use strict";

/* ============================ 状态与默认数据 ============================ */
const STORE_KEY="shiguang.v1";       // 当前数据
const BACKUP_KEY="shiguang.backup";  // 本机备份快照(存在软件自己的存储里,不上传)

function defaultState(){             // 默认全空:从创建第一个目标开始
  return {
    v:1, seed:"#c14a10", dark:null, reduceMotion:false,
    energy:0, flags:{},
    profile:{ name:"简友", avatar:"auto" },   // avatar="auto" 表示渲染名字首字
    goals:[],
  };
}
let state;
try{ state=JSON.parse(localStorage.getItem(STORE_KEY)) || defaultState(); if(!state.goals) throw 0; }
catch(e){ state=defaultState(); }
const save=()=>{ try{ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }catch(e){} };

/* ============================ 本机备份 ============================ */
function readBackup(){               // 读取快照;没有或损坏返回 null
  try{ const b=JSON.parse(localStorage.getItem(BACKUP_KEY)); return (b&&b.savedAt&&b.data&&Array.isArray(b.data.goals))?b:null; }
  catch(e){ return null; }
}
function writeBackup(){              // 把当前 state 完整快照
  try{ localStorage.setItem(BACKUP_KEY, JSON.stringify({ savedAt:new Date().toISOString(), data:state })); return true; }
  catch(e){ return false; }          // 失败多为存储空间不足
}
