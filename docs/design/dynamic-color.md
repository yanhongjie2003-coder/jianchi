# Material You 动态取色设计

Android 12 起的系统取色思路:给定一个种子色,生成一整套**明暗、饱和度分层**的色调面板,
让 UI 的所有颜色都从这套面板里取,而不是各自写死十六进制。

## 我们的做法(纯前端实现,约 40 行)

```
种子色 #C14A10
   │ hexToHsl()
   ▼
H=14°, S=56%, L=38%
   │ 规则表(hsl(h, S*x, L*y) 的几十种组合)
   ▼
--primary           hsl(h, S, 38)      主按钮、强调
--on-primary        #ffffff
--primary-container hsl(h, S*0.85, 90) 主色容器(浅)
--surface           hsl(h, S*0.28, 96.5) 页面底色(带一点品牌色调的白)
--surface-container hsl(h, S*0.30, 93) 卡片底
--inverse-surface   hsl(h, S*0.30, 19) Snackbar(深)
...
   │ document.documentElement.style.setProperty()
   ▼
CSS 变量全量替换 → 全应用瞬间换色
```

## 关键决策

1. **抑制过饱和**:`S = clamp(S, 18, 68)`。种子色饱和度过高时(如纯红),派生出的
   container 色会刺眼,压一档更像系统原生效果。
2. **所有表面色都带一点品牌色调**:不是 `#fafafa` 而是带 3% 品牌色调的近白,
   这是 Material You"色彩和谐"观感的关键。
3. **深色模式是同一套公式的另一组参数**:`t = dark` 分支里 L 值反转(80 代替 38),
   不需要维护两份色板。
4. **tertiary 用 `h+55`**:次强调色 = 色相环上偏移 55°,和主色天然和谐。

## 为什么存种子色而不是存整套颜色

`state` 里只存 `seed: "#c14a10"`。换主题 = 换一个 7 位字符串,
色板永远由公式重算——数据、导入导出、主题三者解耦。
