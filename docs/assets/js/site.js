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
        invalid = !valid(wacc, growth) || wacc <= growth || wacc <= -1 || growth <= -1;
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
        invalid = !valid(roe, ke, growth) || ke <= growth || ke <= -1;
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
        invalid = !valid(equity, debt, cash, ebitda) || equity < 0 || debt < 0 || cash < 0 || ebitda <= 0;
        if (!invalid) {
          const enterprise = equity + debt - cash;
          result = fmt(enterprise / ebitda) + "×";
          explanation = "企业价值EV=" + fmt(enterprise) + " 百万元；简化假设优先与少数股东权益为零。";
        }
        break;
      }
      case "ddm": {
        const dividend = get("dividend"), ke = get("ke") / 100, growth = get("growth") / 100;
        invalid = !valid(dividend, ke, growth) || dividend < 0 || ke <= growth || ke <= -1;
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
