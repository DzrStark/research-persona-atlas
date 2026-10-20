# 视觉与传播体验验收

本轮在 `design/persona-social-experience` 分支完成。截图来自本机无头 Chrome 的实际网页渲染；结果样例使用稳步构建者与赛道竞速者的设计原型作答，不是任何人的私人测试数据。

## 视觉证据

| 内容 | 截图 |
| --- | --- |
| 首页优化前，1440 × 1000 | [查看](../assets/screenshots/home-before.png) |
| 首页优化后，1440 × 1000 | [查看](../assets/screenshots/home-after.png) |
| 双画像结果页，1440 × 1000 | [查看](../assets/screenshots/result-desktop.png) |
| 默认社交卡，1080 × 1350 | [查看](../assets/screenshots/social-card.png) |
| 手机首页，390 × 844 | [查看](../assets/screenshots/home-mobile.png) |
| 手机双画像，390 × 844 | [查看](../assets/screenshots/result-mobile.png) |
| 16 型人格手册 | [查看](../assets/screenshots/library-desktop.png) |
| 静态社交封面，1200 × 630 | [查看](../assets/social-cover.png) |

## 修改文件

- `index.html`、`styles.css`：人物首页、CTA、暖冷双画像、渐进阅读、手机布局、图谱反馈。
- `app.js`：总览与完整解读分层，发展路线放在维度分析后；原有答题和计分调用保持不变。
- `presentation.js`：复用人物内容的缩略卡和确定性差距总结，不修改评分结果。
- `portraits.html`、`portrait-library.js`：16 型画廊，保留下拉、上一位/下一位和深链接。
- `share.js`：默认 4:5 社交卡、完整报告选择、复制不含私人结果的首页链接，保留 PNG 下载与系统分享。
- `assets/logo.svg`、`assets/social-cover.svg`、`assets/social-cover.png`、`assets/screenshots/`：双画像标识、传播封面、真实页面截图。
- `README.md`、`README.en.md`：封面、在线入口、结果和手机截图、新分享模式。
- `tests/flow.test.cjs`、`tests/portrait-library.test.cjs`、`tests/share.test.cjs`、`tests/presentation.test.cjs`、`scripts/verify-build.cjs`：针对展示、分享和发布资源的回归验证。

## 验证结果

- `npm run check`：语法、资源引用、ESLint、TypeScript checkJs 通过。
- `npm test`：33 项通过。覆盖 36 题双回答、恢复与清空、16 型、路径、全部五章、不确定结果、固定尺寸社交卡与长图。
- `npm run build`、`npm run verify:build`：通过。生产子路径初始化正常，社交封面尺寸与元信息已验证。
- 真实 Chrome：通过完整 36 题交互及优先方向选择、刷新恢复、两张五章解读默认折叠与展开、社交 PNG 生成和下载、完整报告生成、画廊/下拉/前后切换。
- 响应式：检查 320、360、390、768、1440 像素宽度无页面水平溢出；390 像素宽度下可生成社交卡。图谱保留自身的横向滚动。
- 与本轮基线 `cece001` 比较，题库和人格向量、评分、路径、存储、建议库、完整解读及项目依赖文件没有改动。

## 验证边界

手机截图是 Chrome 设备尺寸模拟，并非实体 iPhone/Android 验收。Safari、微信内浏览器与原生系统分享面板仍需在对应设备实测，桌面 Chrome 已验证 PNG 文件下载。

本分支不直接覆盖 main。GitHub Pages 正式站和新增 OG 图片的正式网址需要 PR 审查合并后随自动部署更新；平台是否立即刷新分享缩略图还取决于其缓存。这里提供静态站点封面，不生成个人结果的服务端预览。
