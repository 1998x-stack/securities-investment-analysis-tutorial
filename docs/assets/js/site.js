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
  const types = new Set(["var95", "kelly", "prospect"]);
  function run(form) {
    let result = NaN, unit = "", note = "输入不在此教学模型的有效范围内。";
    const finite = (...keys) => keys.every(k => Number.isFinite(n(form, k)));
    switch (form.dataset.calc) {
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
