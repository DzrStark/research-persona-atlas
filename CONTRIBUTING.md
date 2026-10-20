# 贡献指南

先阅读 README.md 与 [模型设计说明](docs/model-decisions.md)。修改应保持科研兴趣、实际行为、理想方向与现实约束彼此独立。

- 新题目应描述具体行为，明确对应维度，说明资源取舍，避免把低分写成人格缺陷。
- 人格参数、阈值和路径边都是设计假设；修改需给出理由与反例，不能声称已有实证支持。
- 每条发展边应包含行为、维度、障碍、行动及适用前提。
- 修改计分或路径需加入真正覆盖新行为的单元测试。
- 提交前运行 npm run check、npm test、npm run build，并测试桌面和窄屏完整流程。
- 翻译需保留实际/理想的区分；新增图片、字体或数据须说明来源与许可。
- 不在 issue 中粘贴个人原始作答、敏感背景或浏览器存储内容。

## 本地开发与发布

可以直接打开 index.html，也可以运行 `python -m http.server 4173 --bind 127.0.0.1` 后访问 http://127.0.0.1:4173 。

开发环境使用 Node.js 22+：

```sh
npm ci
npm run check
npm test
npm run build
npm run verify:build
```

构建产物位于 dist。推送 main 后，GitHub Actions 会执行检查并发布 GitHub Pages；正式网址配置在 config.js。

修改 assets/personas 中的人物插画后，运行 `node scripts/sync-share-illustrations.cjs`，同步 PNG 分享使用的内嵌版本；测试会检查两者一致。
