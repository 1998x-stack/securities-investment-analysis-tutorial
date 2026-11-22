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

**状态：** 01–10 已按统一叙事与校验标准深度重构；11–28 已移入新站点、暂保留旧版内容，等待逐篇精修。

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

内容不依赖 CDN，原有 11–28 章单独保留旧版 `theme.css`。

## 本轮新增的研究案例

- 第06章：GDP/CPI/PMI解释、宏观政策传导、实际回报率计算。
- 第07章：行业五力、产业链利润留存、单位经济性与S型生命周期。
- 第08章：FCFF/WACC、显性现金流与终值贡献、二维敏感性。
- 第09章：PE/PEG/PB、盈利低谷反例、稳态合理PB矩阵。
- 第10章：PS、EV/EBITDA、DDM、退出倍数与股权/企业价值口径。

本轮独立SVG新增16张（仓库共27张），原始证据见 `docs/data/evidence.json`。有关经济数据、估值与市场价格的数字均为明确假设，非真实行情。浏览器CI覆盖01–10章的手机、桌面和计算实验。

## Pages 启用

在 GitHub **Settings → Pages → Build and deployment** 中选择 **GitHub Actions**，会通过 `.github/workflows/pages.yml` 发布 `docs/`；也可以选择传统的 `main /docs` 分支发布，**两种方式择一**。提交代码不代表站点必然已公开可访问，必须实际验证 Pages 地址与 Actions。

正文事实应引用证监会、上交所、深交所、财政部、SEC 投资者教育等官方一手来源，并记录适用日期。示例数据是人工构造，不代表真实公司业绩或未来回报。叙事思路参考 [Olah-style-posts](https://github.com/1998x-stack/Olah-style-posts)，图和文章独立创作。
