# 证券投资分析 · 从价格走向证据

28 篇中文独立教程，从 **市场机制 → 公司财务 → 价值判断 → 风险组合 → 数据研究** 构建可复核的证券分析体系。本仓库是教育内容，**不构成任何投资建议**。

- [GitHub Pages 首页](https://1998x-stack.github.io/securities-investment-analysis-tutorial/)
- [仓库内站点首页](docs/index.html)
- [贡献与教学规范](AGENTS.md)

## 内容路线

| 阶段 | 章节 | 核心问题 |
|---|---|---|
| 市场与财务认知 | 01–05 | 买到的是什么、怎样成交、利润与现金有何差别 |
| 宏观、公司与价值 | 06–12 | 利润如何转成现金流，现金流怎样折现 |
| 价格、组合与风险 | 13–18 | 信号何时失效，如何约束尾部风险 |
| 实证与量化工具 | 19–25 | 如何避免数据泄漏、过拟合与成本误判 |
| 前沿与综合研究 | 26–28 | 如何形成可复核的完整研究记录 |

**状态：** 01–10 已完成深度重构；11–28 迁入站点后暂保留原版内容，等待逐篇精修。

## 新目录

```text
docs/
  index.html                    # 正式站点首页
  lessons/01.html ... 28.html   # 正式章节入口
  assets/css/site.css           # 共享设计系统
  assets/js/site.js             # 无依赖计算器与搜索
  assets/svg/*.svg              # 可独立渲染的原创图
  data/courses.json             # 章节元数据
  data/evidence.json            # 外部证据追踪
scripts/validate_site.py        # 站点静态校验
.github/workflows/verify.yml    # PR 质量检查
.github/workflows/pages.yml     # 发布 docs/ 的 Actions
AGENTS.md                       # 编写与审核协议
index.html, 01.html–28.html     # 兼容旧链接的轻量跳转页
```

## 本地预览和校验

```bash
python3 -m http.server 8000
# 打开 http://localhost:8000/docs/index.html
python3 scripts/validate_site.py
```

内容不依赖 CDN，原有 06–28 章单独保留旧版 `theme.css`。

## Pages 启用

在 GitHub **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**，会通过 `.github/workflows/pages.yml` 发布 `docs/`；也可以选择传统的 `main /docs` 分支发布，**两种方式择一**。提交代码不代表站点必然已公开可访问，必须实际验证 Pages 地址与 Actions。

正文事实应引用证监会、上交所、深交所、财政部、SEC 投资者教育等官方一手来源，并记录适用日期。示例数据是人工构造，不代表真实公司业绩或未来回报。叙事思路参考 [Olah-style-posts](https://github.com/1998x-stack/Olah-style-posts)，图和文章独立创作。
