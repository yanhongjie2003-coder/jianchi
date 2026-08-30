# 架构说明

> 目标:不借助任何框架,把一个打卡应用写清楚。本文对应仓库里的实际代码,读完应该能回答"这个应用是怎么跑起来的"。

## 1. 总体结构

```
浏览器(或 Android WebView)
└── index.html                # 语义化骨架:四个 <section class="view"> + 底部导航 + 三个弹层
    ├── css/style.css         # 全部样式;:root 里的设计令牌会被 JS 动态覆盖
    └── js/                   # 七个职责模块,按依赖顺序加载
        ├── utils.js          # 工具:$/$$ 选择器、esc 转义、SVG 图标库、日期计算、mulberry32
        ├── store.js          # 数据层:state、seedState 演示数据、save() 写 localStorage
        ├── theme.js          # Material You 动态取色:种子色 → HSL 数学生成整套 tonal 色板
        ├── domain.js         # 领域逻辑:打卡判定、连续天数、完成率、能量等级
        ├── badges.js         # 成就徽章:15 枚定义(7 类可重复,次数由数据实时派生)
        ├── render.js         # 渲染:renderHome / renderStats / renderAwards / renderMe / renderAll
        └── main.js           # 交互绑定与启动:导航、打卡、弹层、导入导出、彩带
```

加载顺序即依赖顺序:`utils → store → theme → domain → badges → render → main`。
经典 `<script>`(非 module),顶层的 `function` 与 `const` 在全局词法作用域共享,
因此后加载的文件可以直接调用先加载文件里的函数——这是最朴素也最容易讲清楚的模块化方式。

## 2. 数据模型(localStorage 键 `shiguang.v1`)

```jsonc
{
  "v": 1,
  "seed": "#c14a10",          // 主题种子色
  "dark": null,               // null=跟随系统, true/false=手动
  "reduceMotion": false,
  "energy": 620,              // 能量:打卡 +10 / 计数型中间步 +2,等级 = 1 + floor(energy/120)
  "profile": { "name": "拾光者", "avatar": "auto" },  // avatar="auto" 表示渲染名字首字
  "flags": { "earlyBird": true },                    // 一次性成就标记
  "goals": [
    {
      "id": "gabc123",
      "name": "晨跑 3 公里",
      "icon": "run",                               // ICONS 里的 key
      "freq": { "type": "daily" },                 // 或 {type:"weekly",times:4}
      "perDay": 1,                                 // 每日次数(计数型目标 >1)
      "createdAt": "2026-07-12",
      "history": ["2026-08-29", "..."],            // 打卡过的日期(每日一次型)
      "counts": { "2026-08-30": 6 },               // 计数型目标:当日次数
      "earlyFlags": {}
    }
  ]
}
```

设计取舍:**打卡历史只存日期字符串**(`YYYY-MM-DD`),不做事件流。
好处是存储极小、统计都是纯函数;代价是同一目标一天内只有"打卡 / 没打卡 + 次数"两种信息,
没有时刻。对打卡场景足够,也让 `isDayDone(g, date)` 成为整个系统最核心的纯函数。

## 3. 渲染模型:全量重渲染

没有虚拟 DOM、没有响应式。规则很简单:

- **任何数据变化 → `save()` → `renderAll()`**,四个视图整体重建(`innerHTML` 拼接)
- 事件绑定在每次渲染后重新挂(`xxx.onclick = ...`)
- 为什么可以这样:视图小(单屏列表)、无长列表性能压力,换取**零状态同步 bug**

`renderAll()` 的调用时机:启动、打卡/撤销、目标增删改、资料修改、数据导入/清空/重置。

## 4. 关键机制

| 机制 | 位置 | 一句话说明 |
|---|---|---|
| 动态取色 | theme.js | 把种子色转 HSL,按 M3 规则生成 primary / container / surface 等 20+ 令牌,写进 `document.documentElement.style` |
| 打卡判定 | domain.js `isDayDone` | daily 看 history/counts;weekly 看当周已打卡天数 ≥ times;monthly 看当月 |
| 防重复打卡 | main.js `doCheck` | 每日目标达成后按钮变 ✓;每周/每月目标按 `history.includes(today)` 防重(修过可无限刷能量的漏洞) |
| 撤销 | main.js `undoCheck` | 弹窗内或点击已打卡卡片,按 `lastCheck` 回滚一条记录并扣能量 |
| 徽章次数 | badges.js | 可重复徽章的次数是**派生值**(如 `floor(累计打卡/50)`),不落库,不会与数据不一致 |
| 补签(已移除) | — | 早期版本有补签卡,黑盒测试发现会把补签写到错误目标上,重构时移除(见 testing-report.md) |
| Android 壳 | MainActivity.java | `WebViewAssetLoader` 把 `assets/` 映射为 https 域名,localStorage 在 WebView 里才能稳定工作 |

## 5. 一次打卡的生命周期

```
点击 [打卡] → doCheck(btn)
  ├─ isDayDone? → 已完成,直接返回(或打开撤销弹窗)
  ├─ 写数据:history.push(今天) 或 counts[今天]+1
  ├─ energy += 10(计数型中间步 += 2)
  ├─ save() → renderAll()
  ├─ refreshBadges() → 有新徽章?庆祝弹窗提示
  └─ showCelebrate() + confettiFrom() 彩带
```
