# 学习清单:这个项目练到了什么

> 每一条都能在仓库里找到对应代码。面试讲项目时,按这张清单走。

## HTML / CSS

- [ ] **语义化结构与视图切换**:`index.html` 四个 `<section class="view">` + `aria-label`,不靠路由库实现单页切换
- [ ] **CSS 自定义属性当设计令牌**:`:root` 定义 `--primary` 等令牌,JS 运行时 `setProperty` 覆盖 → 一处换全站
- [ ] **HSL 色彩空间**:为什么取色算法用 HSL 不用 RGB(色相/饱和度/亮度可独立控制),见 `docs/design/dynamic-color.md`
- [ ] **布局基本功**:Flex 卡片、Grid 徽章墙与热力图、`aspect-ratio`、`position:sticky/absolute` 弹层
- [ ] **无障碍**:按钮可访问名(`aria-label`)、`role="img"` 描述性标签、`visibility:hidden` 与读屏、`prefers-reduced-motion`
- [ ] **长文本防御**:`overflow-wrap:anywhere` 处理无空格长单词(testing-report.md B5)

## JavaScript

- [ ] **经典模块化**:`<script>` 加载顺序即依赖顺序;函数声明提升与全局词法作用域(为什么 `const` 跨文件可见)
- [ ] **状态与渲染分离**:`state` 单一数据源 + `renderAll()` 全量重渲染,零状态同步问题
- [ ] **纯函数领域逻辑**:`isDayDone(g, date)` / `dayRatio(date)` —— 统计全部可推导、可测试
- [ ] **localStorage 与版本化**:`shiguang.v1` 键、`JSON.parse` 容错回退种子数据
- [ ] **派生优于存储**:徽章次数不落库、实时计算,天然不会与数据不一致(badges.js)
- [ ] **日期处理**:不用日期库,`addDays`/`mondayOf` 十行搞定,ISO 字符串直接比较大小
- [ ] **事件绑定时机**:innerHTML 重建后重新挂 onclick,闭包捕获 `dataset.goal`

## 产品与测试思维

- [ ] **黑盒 GUI 测试方法**:动作 → 截图 → DOM 快照交叉验证(见 `docs/testing-report.md`)
- [ ] **逻辑漏洞意识**:可无限刷的奖励 = 系统性漏洞(B1),奖励发放必须有防重
- [ ] **数据探针**:`导出 JSON` 验证 UI 背后的真实数据
- [ ] **功能取舍**:补签功能修复成本 > 价值时,删除是正确决策(B2)

## Android / 工程

- [ ] **WebView 壳**:为什么 `file://` 的 localStorage 不可靠,`WebViewAssetLoader` 如何解决
- [ ] **自适应图标**:vector drawable + adaptive-icon,零位图资源
- [ ] **CI/CD**:GitHub Actions 推送自动打包 APK(`.github/workflows/android-build.yml`)
- [ ] **Git 工作流**:提交粒度、README/文档组织、开源协议选择

## 还可以继续练(路线图)

- 用原生 `Web Components` 重构目标卡片(自定义元素 + Shadow DOM)
- 给 `domain.js` 补一套纯函数单元测试(引入 Vitest 或手写断言)
- `IndexedDB` 替换 localStorage,支持打卡时刻(时间戳)→ 夜猫子徽章可落地
- PWA:Service Worker 离线缓存 + 添加到主屏幕
