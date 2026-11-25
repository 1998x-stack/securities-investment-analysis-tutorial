/**
 * Shared, dependency-free learning labs.
 * Examples are deterministic synthetic teaching calculations, not financial predictions.
 */
(() => {
  "use strict";
  const number = (form, name) => Number(form.querySelector('[name="' + name + '"]').value);
  const fmt = (v, n = 2) => Number.isFinite(v)
    ? v.toLocaleString("zh-CN", { minimumFractionDigits: n, maximumFractionDigits: n })
    : "不可计算";
  const valid = (...values) => values.every(Number.isFinite);

  function calculate(form) {
    const get = (name) => number(form, name);
    const type = form.dataset.calc;
    let result = "";
    let explanation = "";
    let invalid = false;

    switch (type) {
      case "compound": {
        const p = get("p"), r = get("r") / 100, t = get("t");
        invalid = !valid(p, r, t) || p < 0 || r <= -1 || t < 0;
        if (!invalid) {
          const future = p * Math.pow(1 + r, t);
          result = fmt(future) + " 元";
          explanation = "恒定收益率情景；收益 " + fmt(future - p) + " 元。忽略税费及投资风险。";
        }
        break;
      }
      case "bond": {
        const face = get("face"), c = get("coupon") / 100, y = get("yield") / 100;
        const years = get("years");
        invalid = !valid(face, c, y, years) || face < 0 || c < 0 || y <= -1 || years < 1 || years > 100 || !Number.isInteger(years);
        if (!invalid) {
          let price = face / Math.pow(1 + y, years);
          for (let k = 1; k <= years; k++) price += face * c / Math.pow(1 + y, k);
          result = fmt(price) + " 元";
          explanation = "按年末付息、到期还本计算；不含违约、买卖价差、税费和提前赎回。";
        }
        break;
      }
      case "auction": {
        const buy = get("buy"), sell = get("sell");
        invalid = !valid(buy, sell) || buy < 0 || sell < 0;
        if (!invalid) {
          result = fmt(Math.min(buy, sell)) + " 股";
          explanation = "只计算单一候选价的最大匹配量；真实集合竞价还需遍历候选价格并遵循交易所规则。";
        }
        break;
      }
      case "cash": {
        const a = get("open"), b = get("oper"), c = get("invest"), d = get("finance");
        invalid = !valid(a, b, c, d);
        if (!invalid) {
          result = fmt(a + b + c + d) + " 万元";
          explanation = "假设汇率等其他现金等价物调节项为零。";
        }
        break;
      }
      case "dupont": {
        const margin = get("margin"), turnover = get("turn"), leverage = get("lev");
        invalid = !valid(margin, turnover, leverage) || turnover < 0 || leverage <= 0;
        if (!invalid) {
          result = fmt(margin * turnover * leverage) + "%";
          explanation = "净利率(%) × 资产周转率 × 权益乘数；分子分母必须采用一致口径。";
        }
        break;
      }
      case "fisher": {
        const nominal = get("nominal") / 100, inflation = get("inflation") / 100;
        invalid = !valid(nominal, inflation) || nominal <= -1 || inflation <= -1;
        if (!invalid) {
          const real = ((1 + nominal) / (1 + inflation) - 1) * 100;
          result = fmt(real) + "%";
          explanation = "精确实际回报 " + fmt(real) + "%；名义回报减通胀的近似值为 " + fmt((nominal - inflation) * 100) + "%。";
        }
        break;
      }
      case "unit": {
        const price = get("price"), variable = get("variable"), quantity = get("volume"), fixed = get("fixed");
        invalid = !valid(price, variable, quantity, fixed) || price < 0 || variable < 0 || quantity < 0 || fixed < 0;
        if (!invalid) {
          const contribution = price - variable;
          result = fmt(contribution * quantity - fixed) + " 元";
          explanation = "单位贡献毛利 " + fmt(contribution) + " 元；" +
            (contribution > 0 ? "盈亏平衡销量约 " + Math.ceil(fixed / contribution).toLocaleString("zh-CN") + " 件。" : "单位贡献毛利非正，增加销量本身不能覆盖固定成本。");
        }
        break;
      }
      case "dcf": {
        const wacc = get("wacc") / 100, growth = get("growth") / 100;
        invalid = !valid(wacc, growth) || wacc <= growth || wacc <= 0 || growth <= -1;
        if (!invalid) {
          const fcf = [100, 110, 120, 130, 140]; // 百万元；固定虚构现金流
          let explicitPV = 0;
          fcf.forEach((v, i) => { explicitPV += v / Math.pow(1 + wacc, i + 1); });
          const terminalPV = fcf.at(-1) * (1 + growth) / (wacc - growth) / Math.pow(1 + wacc, fcf.length);
          const ev = explicitPV + terminalPV;
          result = fmt(ev) + " 百万元";
          explanation = "显性现金流现值 " + fmt(explicitPV) + "；终值现值 " + fmt(terminalPV) +
            "；终值占比 " + fmt(100 * terminalPV / ev) + "%。";
        }
        break;
      }
      case "pb": {
        const roe = get("roe") / 100, ke = get("ke") / 100, growth = get("growth") / 100;
        invalid = !valid(roe, ke, growth) || ke <= growth || ke <= 0 || roe < growth;
        if (!invalid) {
          const priceBook = (roe - growth) / (ke - growth);
          result = fmt(priceBook) + "×";
          explanation = "仅在稳定ROE、账面权益为正、增长与留存政策一致、Ke>g等条件下使用。";
        }
        break;
      }
      case "peg": {
        const pe = get("pe"), rate = get("rate");
        invalid = !valid(pe, rate) || pe < 0 || rate <= 0;
        if (!invalid) {
          result = fmt(pe / rate);
          explanation = "增长率输入百分数值，例如15%输入15；PEG为经验比较指标，不是价值公式。";
        }
        break;
      }
      case "ev": {
        const equity = get("equity"), debt = get("debt"), cash = get("cash"), ebitda = get("ebitda");
        invalid = !valid(equity, debt, cash, ebitda) || equity < 0 || debt < 0 || cash < 0 || ebitda <= 0 || equity + debt <= cash;
        if (!invalid) {
          const enterprise = equity + debt - cash;
          result = fmt(enterprise / ebitda) + "×";
          explanation = "企业价值EV=" + fmt(enterprise) + " 百万元；简化假设优先与少数股东权益为零。";
        }
        break;
      }
      case "ddm": {
        const dividend = get("dividend"), ke = get("ke") / 100, growth = get("growth") / 100;
        invalid = !valid(dividend, ke, growth) || dividend < 0 || ke <= growth || ke <= 0;
        if (!invalid) {
          result = fmt(dividend / (ke - growth)) + " 元/股";
          explanation = "稳定分红Gordon模型：下一年D1/(Ke−g)；须验证股利可持续性且Ke>g。";
        }
        break;
      }
      default: {
        return;
      }
    }
    const output = form.querySelector("output");
    if (output) output.textContent = invalid ? "参数不满足模型条件" : result;
    const detail = form.querySelector("[data-explain]");
    if (detail) detail.textContent = invalid
      ? "请输入有限数字并检查非负数量、期限和折现率大于永续增长率等模型限制。"
      : explanation;
  }

  document.querySelectorAll("form[data-calc]").forEach((form) => {
    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("input", () => calculate(form));
    calculate(form);
  });

  const search = document.querySelector("[data-course-search]");
  if (search) {
    search.addEventListener("input", () => {
      const query = search.value.trim().toLocaleLowerCase();
      let count = 0;
      document.querySelectorAll("[data-chapter]").forEach((entry) => {
        entry.hidden = !entry.textContent.toLocaleLowerCase().includes(query);
        if (!entry.hidden) count++;
      });
      document.querySelectorAll("[data-stage]").forEach((stage) => {
        stage.hidden = ![...stage.querySelectorAll("[data-chapter]")].some((entry) => !entry.hidden);
      });
      const out = document.querySelector("[data-results]");
      if (out) out.textContent = query ? "找到 " + count + " 篇" : "";
    });
  }
})();


/* Chapters 11–15: self-contained deterministic teaching labs; no market data. */
(() => {
  "use strict";
  const n = (form, key) => Number(form.querySelector('[name="' + key + '"]').value);
  const fmt = (v, d = 2) => Number.isFinite(v) ? v.toLocaleString("zh-CN", {
    minimumFractionDigits: d, maximumFractionDigits: d
  }) : "不可计算";
  const types = new Set(["grow3", "ohlc", "rsi14", "tworisk"]);
  function run(form) {
    let result = NaN, unit = "", note = "输入不在此教学模型的有效范围内。";
    const allFinite = (...keys) => keys.every(k => Number.isFinite(n(form, k)));
    switch (form.dataset.calc) {
      case "grow3": {
        const revenue = n(form, "revenue"), g = n(form, "growth") / 100,
          margin = n(form, "margin") / 100, tax = n(form, "tax") / 100,
          reinvest = n(form, "reinvest") / 100, wacc = n(form, "wacc") / 100,
          stable = n(form, "terminal") / 100, cashRatio = margin * (1 - tax) - reinvest;
        if (!allFinite("revenue", "growth", "margin", "tax", "reinvest", "wacc", "terminal")
          || revenue < 0 || g <= -1 || margin < 0 || margin > 1 || tax < 0 || tax > 1
          || reinvest < 0 || cashRatio <= 0 || wacc <= 0 || wacc <= stable || stable <= -1) {
          note = "要求收入非负、增长率大于−100%、税率及营业利润率在0–100%、净投资非负且FCFF率为正、WACC>稳态增长率且WACC>0。";
          break;
        }
        let explicit = 0;
        for (let year = 1; year <= 3; year++) {
          explicit += revenue * Math.pow(1 + g, year) * cashRatio / Math.pow(1 + wacc, year);
        }
        const fcf3 = revenue * Math.pow(1 + g, 3) * cashRatio;
        const terminalPV = fcf3 * (1 + stable) / (wacc - stable) / Math.pow(1 + wacc, 3);
        result = explicit + terminalPV;
        unit = " 百万元";
        note = "显式期现值 " + fmt(explicit) + "；终值现值 " + fmt(terminalPV)
          + "；折现终值占比 " + fmt(result > 0 ? terminalPV / result * 100 : 0, 1)
          + "%。稳态仍采用同一FCFF/收入比率，此假设须独立验证。";
        break;
      }
      case "ohlc": {
        if (!allFinite("open", "high", "low", "close")) break;
        const o = n(form, "open"), h = n(form, "high"),
          l = n(form, "low"), c = n(form, "close");
        if (o <= 0 || l <= 0 || c <= 0 || h < Math.max(o, c) || l > Math.min(o, c) || h < l) {
          note = "OHLC必须为正，且最高价≥开盘和收盘，最低价≤开盘和收盘。";
          break;
        }
        result = (c - o) / o * 100;
        unit = "%";
        note = "区间振幅 " + fmt((h - l) / o * 100)
          + "%；上影 " + fmt(h - Math.max(o, c))
          + "，下影 " + fmt(Math.min(o, c) - l)
          + "。这是开收到收盘的变化，不是持有期总回报。";
        break;
      }
      case "rsi14": {
        if (!allFinite("gain", "loss")) break;
        const gain = n(form, "gain"), loss = n(form, "loss");
        if (gain < 0 || loss < 0) {
          note = "平滑平均上涨与下跌均为绝对非负数。";
          break;
        }
        result = gain === 0 && loss === 0 ? 50 : loss === 0 ? 100 : 100 * gain / (gain + loss);
        unit = "";
        note = "输入是已按Wilder方法得到的平均上涨/下跌；二者同时为零时本演示约定RSI=50。";
        break;
      }
      case "tworisk": {
        if (!allFinite("weight", "returnA", "returnB", "sigmaA", "sigmaB", "rho")) break;
        const w = n(form, "weight") / 100, a = n(form, "sigmaA"),
          b = n(form, "sigmaB"), rho = n(form, "rho");
        if (w < 0 || w > 1 || a < 0 || b < 0 || rho < -1 || rho > 1) {
          note = "不卖空等权框架要求A权重0–100%、波动率非负、相关系数介于−1与1。";
          break;
        }
        const variance = Math.pow(w * a, 2) + Math.pow((1 - w) * b, 2) + 2 * w * (1 - w) * a * b * rho;
        result = Math.sqrt(Math.max(0, variance));
        unit = "%";
        note = "组合期望收益 " + fmt(w * n(form, "returnA") + (1 - w) * n(form, "returnB"))
          + "%；组合标准差 " + fmt(result)
          + "%。单位均为同频率收益的百分数，且模型不包含尾部损失。";
        break;
      }
    }
    const output = form.querySelector("output");
    if (output) output.textContent = Number.isFinite(result) ? fmt(result) + unit : "参数不满足模型条件";
    const explain = form.querySelector("[data-explain]");
    if (explain) explain.textContent = note;
  }
  document.querySelectorAll("form[data-calc]").forEach(form => {
    if (!types.has(form.dataset.calc)) return;
    form.addEventListener("submit", event => event.preventDefault());
    form.addEventListener("input", () => run(form));
    run(form);
  });
})();

/* Chapters 16–28: deterministic risk, position and factor teaching labs; synthetic inputs only. */
(() => {
  "use strict";
  const n = (form, key) => Number(form.querySelector('[name="' + key + '"]').value);
  const fmt = (v, d = 2) => Number.isFinite(v) ? v.toLocaleString("zh-CN", {
    minimumFractionDigits: d, maximumFractionDigits: d
  }) : "不可计算";
  const types = new Set(["var95", "kelly", "prospect", "graham", "zscore", "icir"]);
  function run(form) {
    let result = NaN, unit = "", note = "输入不在此教学模型的有效范围内。";
    const finite = (...keys) => keys.every(k => Number.isFinite(n(form, k)));
    switch (form.dataset.calc) {
      case "icir": {
        if (!finite("mean", "sd")) break;
        const mean = n(form, "mean"), sd = n(form, "sd");
        if (sd <= 0) { note = "IC 标准差须为正数。"; break; }
        result = mean / sd;
        note = "ICIR = IC均值 / IC标准差 = " + fmt(mean, 4) + " / " + fmt(sd, 4) + " = " + fmt(result)
          + "。它衡量预测的稳定性，与单期 IC 的大小不同；样本期与调仓频率变化时结果会变。";
        break;
      }
      case "ictest": {
        if (!finite("mean", "sd", "n")) break;
        const mean = n(form, "mean"), sd = n(form, "sd"), periods = n(form, "n");
        if (sd <= 0) { note = "IC 标准差须为正数。"; break; }
        if (periods < 2) { note = "期数至少为 2。"; break; }
        const icir = mean / sd;
        result = icir * Math.sqrt(periods);
        note = "ICIR = " + fmt(icir, 4) + "；t = ICIR × √N = " + fmt(result)
          + "。参考：单因子阈值 t≈2，多重检验下 Harvey-Liu-Zhu 建议 t≈3。该式假设 IC 序列近似独立同分布。";
        break;
      }
      case "impliedpe": {
        if (!finite("pb", "roe")) break;
        const pbv = n(form, "pb"), roe = n(form, "roe");
        if (pbv <= 0) { note = "市净率 PB 须为正数。"; break; }
        if (roe <= 0) { note = "ROE 须为正数，否则隐含 PE 无意义。"; break; }
        result = pbv / (roe / 100);
        note = "隐含市盈率 PE = PB ÷ (ROE/100) = " + fmt(result)
          + " 倍。等价于 PB = PE × ROE；E/B 与 P/E 必须同口径、同期间。盈利为负或接近零时该式不适用。";
        break;
      }
      case "exrights": {
        if (!finite("prev", "div", "sg", "gp", "gpp")) break;
        const prev = n(form, "prev"), div = n(form, "div"), sg = n(form, "sg"), gp = n(form, "gp"), gpp = n(form, "gpp");
        const denom = 1 + sg + gp;
        if (prev <= 0 || div < 0 || sg < 0 || gp < 0 || gpp < 0) { note = "价格须为正、比例与红利不得为负。"; break; }
        if (denom <= 0) { note = "送股与配股比例之和不得小于 -1。"; break; }
        result = (prev - div + gpp * gp) / denom;
        note = "除权除息参考价 = (前收 − 现金红利 + 配股价×配股比例) ÷ (1 + 送股比例 + 配股比例) = " + fmt(result)
          + " 元。交易所公式的简化形式，未含配股权等特殊处理；仅用于解释为何不复权价格会出现跳空。";
        break;
      }
      case "costdrag": {
        if (!finite("turn", "cost")) break;
        const turn = n(form, "turn"), cost = n(form, "cost");
        if (turn < 0 || cost < 0) { note = "换手次数与成本率不得为负。"; break; }
        result = turn * 2 * cost;
        note = "年化成本率 ≈ 单边换手次数×2×单边成本率 = " + fmt(result)
          + "%。一次完整进出含买入与卖出，故乘 2。未含冲击成本与滑点随规模变化的部分，因此为下限估算。";
        break;
      }
      case "roundtrip": {
        if (!finite("comm", "stamp", "slip")) break;
        const comm = n(form, "comm"), stamp = n(form, "stamp"), slip = n(form, "slip");
        if (comm < 0 || stamp < 0 || slip < 0) { note = "各项费率不得为负。"; break; }
        result = 2 * comm + stamp + 2 * slip;
        note = "往返成本率 ≈ 2×佣金 + 印花税 + 2×滑点 = " + fmt(result)
          + "%。印花税仅卖出时征收故只乘 1；未含冲击成本。费率会随政策与券商变化，请自行核对当前有效值。";
        break;
      }
      case "mlmetrics": {
        if (!finite("tp", "fp", "fn")) break;
        const tp = n(form, "tp"), fp = n(form, "fp"), fn = n(form, "fn");
        if (tp < 0 || fp < 0 || fn < 0) { note = "TP/FP/FN 不得为负。"; break; }
        if (tp + fp <= 0 || tp + fn <= 0) { note = "需要至少一个正例与非零预测值。"; break; }
        const prec = tp / (tp + fp), rec = tp / (tp + fn);
        result = 2 * prec * rec / (prec + rec);
        note = "精确率 = " + fmt(prec * 100) + "%，召回率 = " + fmt(rec * 100)
          + "%，F1 = " + fmt(result * 100) + "%。模型指标不等于策略收益：还需扣除交易成本、滑点与不可成交样本。";
        break;
      }
      case "zscore": {
        if (!finite("value", "mean", "std")) break;
        const value = n(form, "value"), mean = n(form, "mean"), std = n(form, "std");
        if (std <= 0) { note = "标准差须为正数。"; break; }
        result = (value - mean) / std;
        note = "标准化 z = (原始值 − 均值) / 标准差 = " + fmt(result)
          + "。同一 z 在不同截面上可比，前提是均值与标准差在同一样本与同一日期上计算。";
        break;
      }
      case "graham": {
        if (!finite("eps", "bvps", "price")) break;
        const eps = n(form, "eps"), bvps = n(form, "bvps"), price = n(form, "price");
        if (eps <= 0 || bvps <= 0 || price <= 0) { note = "每股收益、每股净资产与股价均须为正数。"; break; }
        result = Math.sqrt(22.5 * eps * bvps);
        unit = " 元";
        const ratio = price / result;
        note = "格雷厄姆数 = √(22.5 × EPS × BVPS) = " + fmt(result) + " 元。当前股价/格雷厄姆数 = "
          + fmt(ratio) + "；按“买入价不高于 2/3”的规则，上界约为 " + fmt(result * 2 / 3)
          + " 元。这是格雷厄姆的筛选规则，不是内在价值本身。";
        break;
      }
      case "prospect": {
        if (!finite("gain", "alpha", "lambda")) break;
        const g = n(form, "gain"), a = n(form, "alpha"), lam = n(form, "lambda");
        if (g <= 0 || a <= 0 || lam <= 0) { note = "收益幅度、alpha 与损失厌恶系数均须为正。"; break; }
        result = Math.pow(g, a);
        note = "收益侧 v = " + fmt(result) + "；同等损失的效用 v = −" + fmt(lam * result)
          + "，损失约为收益的 " + fmt(lam) + " 倍（这是模型中直接设定的系数）。教学公式，不代表真实心理测量。";
        break;
      }
      case "var95": {
        if (!finite("mean", "sigma", "z")) break;
        const mean = n(form, "mean"), sigma = n(form, "sigma"), z = n(form, "z");
        if (sigma < 0 || z <= 0) { note = "波动率须非负，z 值须为正。"; break; }
        result = mean - z * sigma;
        unit = "%";
        note = "参数法分位点：VaR = μ − z·σ = " + fmt(mean) + " − " + fmt(z) + "×" + fmt(sigma)
          + " = " + fmt(result) + "%（单期，单位与输入一致）。它是一条分位线，不是最大亏损，也未计入厚尾。";
        break;
      }
      case "kelly": {
        if (!finite("p", "b")) break;
        const p = n(form, "p") / 100, b = n(form, "b");
        if (p < 0 || p > 1 || b <= 0) { note = "胜率须在 0\u2013100%，净赔率须为正。"; break; }
        result = (b * p - (1 - p)) / b * 100;
        unit = "%";
        note = "最优比例 f* = (b·p − (1−p))/b。半凯利为 " + fmt(result / 2)
          + "%。此结果假设每期独立同分布且胜率已知；现实中须把 f* 当作上限锚而非指令。";
        break;
      }
    }
    const output = form.querySelector("output");
    if (output) output.textContent = Number.isFinite(result) ? fmt(result) + unit : "参数不满足模型条件";
    const explain = form.querySelector("[data-explain]");
    if (explain) explain.textContent = note;
  }
  document.querySelectorAll("form[data-calc]").forEach(form => {
    if (!types.has(form.dataset.calc)) return;
    form.addEventListener("submit", event => event.preventDefault());
    form.addEventListener("input", () => run(form));
    run(form);
  });
})();
