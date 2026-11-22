# 第 06–10 章跨源与计算边界复审（2026-11-22）

## 评审范围
复审的是主分支已合并的第 06–10 章，保留此前 PR #2 的较完整内容和 SVG；不覆盖它们。这份记录核对的是概念与教学算例，不等同于市场实证或实时交易建议。

| 章节 | 独立核对点 | 通过条件 |
|---|---|---|
| 06 宏观 | PMI 的 50 是扩散指数扩张/收缩界线；Fisher 准确实际回报 | 名义 5%、通胀 2% → 实际 (1.05/1.02)-1 = 2.941176% |
| 07 行业 | 价量成本与固定成本组合 | (售价50−单位变动成本20)×1000−固定成本15000 = 15000元；这不是自由现金流 |
| 08 DCF | FCFF→EV 对象、显式预测期和永续终值、WACC>g | FCFF=[100,110,120,130,140]百万元、WACC=10%、g=3% → EV≈1726.79百万元；终值约74.07% |
| 09 相对估值 | PB稳定增长模型及负成长/超额留存限制 | PB=(ROE−g)/(Ke−g)，需要Ke>g，若ROE<g且只允许内部再投资则推导的非负分红政策不成立 |
| 10 估值倍数 | EV/EBITDA 与股权价值口径、DDM限制 | 当EV≤0或EBITDA≤0，普通正倍数比较无法按通常方式解释；Gordon模型Ke>g且Ke>0 |

## 本次代码改进
- 为DCF设定正WACC的可解释域；避免负的资本成本进入通常的教学模型。
- 为稳定增长PB设置ROE≥g条件，避免正向稳定增长与负留存不一致的示例输出。
- 为EV/EBITDA拒绝非正企业价值，避免将非正EV直接作为正常正倍数比较对象。
- 为DDM要求正股权资本成本，并由浏览器回归验证模型边界。
- 以上规则限定此仓库计算器的**教学模型适用域**，不否认特殊金融情景中可能出现负EV或负收益率。

## 主要来源
- [国家统计局 PMI 指标定义](https://www.stats.gov.cn/zs/tjws/tjzb/202301/t20230101_1903972.html)
- [IMF 货币政策传导](https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/monetary-policy)
- [CFA Institute 2026 行业分析](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/industry-and-competitive-analysis)
- [CFA Institute 2026 自由现金流估值](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/free-cash-flow-valuation)
- [Damodaran 资本成本权重](https://pages.stern.nyu.edu/adamodar/New_Home_Page/lectures/capstr.html)
- [Damodaran PB 与 ROE](https://pages.stern.nyu.edu/adamodar/New_Home_Page/lectures/pbv.html)
- [Damodaran Financial Definitions](https://pages.stern.nyu.edu/~adamodar/New_Home_Page/definitions.html)

## 验收边界
运行 `python3 scripts/validate_site.py` 进行静态检查，GitHub Actions 的浏览器 QA 覆盖 1440px、390px、360px、MathML、SVG 图片和计算器。每次改变公式及边界条件都应同步补充实际输入测试。浏览器检查和静态检查必须以当前提交对应的绿色工作流为准，不能引用其他分支的成功作为证据。
