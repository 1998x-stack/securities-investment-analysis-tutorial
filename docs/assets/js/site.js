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


/* Chapters 16–20: risk, behavioral value, strategy mix and factor research labs. */
(() => {
  "use strict";
  const value = (form, key) => Number(form.querySelector('[name="' + key + '"]').value);
  const fmt = (x, digits = 2) => Number.isFinite(x)
    ? x.toLocaleString("zh-CN", {minimumFractionDigits: digits, maximumFractionDigits: digits})
    : "不可计算";
  const finite = (...xs) => xs.every(Number.isFinite);
  const forms = new Set(["risk", "prospect", "styleblend", "qsharpe", "factor"]);
  function calculate(form) {
    const get = key => value(form, key);
    let output = "", explanation = "", invalid = false;
    switch (form.dataset.calc) {
      case "risk": {
        const V=get("notional"), vol=get("vol")/100, conf=get("confidence"), h=get("horizon");
        invalid = !finite(V,vol,conf,h) || V<=0 || vol<0 || vol>1 ||
          ![95,99].includes(conf) || !Number.isInteger(h) || h<1 || h>252;
        if (!invalid) {
          const alpha=conf/100;
          const z=conf===95 ? 1.6448536269514722 : 2.3263478740408408;
          const density=Math.exp(-z*z/2)/Math.sqrt(2*Math.PI);
          const scale=V*vol*Math.sqrt(h);
          const VaR=scale*z, ES=scale*density/(1-alpha);
          output="VaR "+fmt(VaR)+" 元";
          explanation="ES "+fmt(ES)+" 元；零均值正态、独立同分布与平方根时间缩放假设。不是最大可能损失。";
        }
        break;
      }
      case "prospect": {
        const gain=get("gain"), loss=get("loss"), a=get("alpha"), b=get("beta"), lambda=get("lambda");
        invalid=!finite(gain,loss,a,b,lambda) || gain<=0 || loss<=0 || a<=0 || a>1.5 ||
          b<=0 || b>1.5 || lambda<1 || lambda>10;
        if (!invalid) {
          const vg=Math.pow(gain,a), vl=-lambda*Math.pow(loss,b);
          output="损失/收益价值比 "+fmt(Math.abs(vl)/vg);
          explanation="v(+"+fmt(gain,0)+")="+fmt(vg)+"；v(−"+fmt(loss,0)+")=−"+fmt(Math.abs(vl))+
            "。分段价值函数示意，不包含概率加权。";
        }
        break;
      }
      case "styleblend": {
        const wv=get("wv"),wg=get("wg"),wm=get("wm"),rv=get("rv"),rg=get("rg"),rm=get("rm"),
          turnover=get("turnover"),cost=get("cost");
        invalid=!finite(wv,wg,wm,rv,rg,rm,turnover,cost) || wv<0 || wg<0 || wm<0 ||
          Math.abs(wv+wg+wm-100)>0.001 || turnover<0 || cost<0;
        if (!invalid) {
          const gross=(wv*rv+wg*rg+wm*rm)/100, expense=turnover*cost/10000, net=gross-expense;
          output="净情景收益 "+fmt(net)+"%";
          explanation="毛情景收益 "+fmt(gross)+"%；交易成本 "+fmt(expense)+" 个百分点。假设收益可线性加权、成本按单边换手估算。";
        }
        break;
      }
      case "qsharpe": {
        const mean=get("mean"),vol=get("vol"),days=get("days"),turnover=get("turnover"),cost=get("cost");
        invalid=!finite(mean,vol,days,turnover,cost) || vol<=0 || days<200 || days>260 ||
          !Number.isInteger(days) || turnover<0 || cost<0;
        if (!invalid) {
          const gross=mean*days, expense=turnover*cost/10000, net=gross-expense;
          const annualVol=vol*Math.sqrt(days), sharpe=net/annualVol;
          output=fmt(sharpe);
          explanation="成本后年化算术超额收益 "+fmt(net)+"%；年化波动率 "+fmt(annualVol)+
            "%。不含复利、融资、税费及序列相关修正。";
        }
        break;
      }
      case "factor": {
        const zv=get("zv"),zq=get("zq"),zm=get("zm"),zc=get("zc"),
          wv=get("wv"),wq=get("wq"),wm=get("wm"),wc=get("wc");
        invalid=!finite(zv,zq,zm,zc,wv,wq,wm,wc) ||
          [wv,wq,wm,wc].some(x=>x<0) || Math.abs(wv+wq+wm+wc-100)>0.001 ||
          [zv,zq,zm,zc].some(x=>Math.abs(x)>10);
        if (!invalid) {
          const score=(zv*wv+zq*wq+zm*wm+zc*wc)/100;
          output=fmt(score);
          explanation="综合Z分数 "+fmt(score)+"；它是统一方向后的横截面评分，不是未来收益率。";
        }
        break;
      }
    }
    const out=form.querySelector("output"), note=form.querySelector("[data-explain]");
    if (out) out.textContent=invalid ? "参数不满足模型条件" : output;
    if (note) note.textContent=invalid ? "请检查输入范围、单位与权重和。" : explanation;
  }
  document.querySelectorAll("form[data-calc]").forEach(form=>{
    if(!forms.has(form.dataset.calc)) return;
    form.addEventListener("submit",event=>event.preventDefault());
    form.addEventListener("input",()=>calculate(form));
    calculate(form);
  });
})();


/* Lessons 21–25: source-defined factor proxy, sector PB, split, cost and order economics. */
(() => {
  "use strict";
  const types=new Set(["porproxy","sectorpb","split","netreturn","execution"]);
  const number=(f,name)=>Number(f.querySelector('[name="'+name+'"]').value);
  const fmt=(x,d=2)=>x.toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
  function refresh(form) {
    const get=name=>number(form,name);
    let value=NaN,unit="",explain="请检查输入值的有效范围。";
    switch(form.dataset.calc) {
      case "porproxy": {
        const p=get("price"),v=get("fair");
        if(Number.isFinite(p)&&Number.isFinite(v)&&p>0&&v>=0) {
          value=(p-v)/p*100;unit="%";
          explain="简化(P−V)/P，不是原研究的完整POR价值带。估值参照错误时，偏离值没有预测能力。";
        }break;
      }
      case "sectorpb": {
        const roe=get("roe"),g=get("growth"),ke=get("ke");
        if([roe,g,ke].every(Number.isFinite)&&roe>=0&&roe<=100&&g>=0&&g<=roe&&ke>g&&ke<=100) {
          value=(roe-g)/(ke-g);unit=" 倍";
          explain="稳态分红/清洁盈余模型；要求Ke>g、ROE≥g，不等于观察PB或目标价。";
        }break;
      }
      case "split": {
        const before=get("before"),after=get("after"),ratio=get("ratio");
        if([before,after,ratio].every(Number.isFinite)&&before>0&&after>0&&ratio>0&&ratio<=1000) {
          const adjusted=before/ratio;
          value=(after/adjusted-1)*100;unit="%";
          explain="拆股前价格调整后为 "+fmt(adjusted)+" 元。只模拟拆股，不包含股息再投或真实成交。";
        }break;
      }
      case "netreturn": {
        const gross=get("gross"),turn=get("turnover"),cost=get("cost");
        if([gross,turn,cost].every(Number.isFinite)&&turn>=0&&cost>=0) {
          const fee=turn*cost/10000;
          value=gross-fee;unit="%";
          explain="毛收益 "+fmt(gross)+"%，单边换手成本约 "+fmt(fee)+" 个百分点。实际市场冲击可能非线性。";
        }break;
      }
      case "execution": {
        const n=get("notional"),fee=get("fee"),spread=get("spread"),slippage=get("slippage");
        if([n,fee,spread,slippage].every(Number.isFinite)&&n>0&&fee>=0&&spread>=0&&slippage>=0) {
          const bp=fee+spread+slippage;
          value=n*bp/10000;unit=" 元";
          explain="合计 "+fmt(bp)+" bp，仍需核查实际税费、滑点与市场冲击是否重复计量。";
        }break;
      }
    }
    const out=form.querySelector("output"),detail=form.querySelector("[data-explain]");
    if(out) out.textContent=Number.isFinite(value)
      ? (value<0?"−":"")+fmt(Math.abs(value))+unit : "参数不满足模型条件";
    if(detail) detail.textContent=explain;
  }
  document.querySelectorAll("form[data-calc]").forEach(form=>{
    if(!types.has(form.dataset.calc))return;
    form.addEventListener("submit",event=>event.preventDefault());
    form.addEventListener("input",()=>refresh(form));
    refresh(form);
  });
})();


/* Lessons 26–28: evidence-weighted sentiment, currency hedging and capstone sizing. */
(() => {
  "use strict";
  const supported = new Set(["sentiment","fxhedge","risk3","allocation"]);
  const fmt = (v, d=2) => v.toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d});
  const num = (form, name) => Number(form.querySelector('[name="'+name+'"]').value);
  function update(form) {
    const get = name => num(form,name);
    let valid = true, result = "", note = "";
    switch (form.dataset.calc) {
      case "sentiment": {
        const half=get("half");
        const docs=[1,2,3].map(i=>({s:get("s"+i),c:get("c"+i),a:get("a"+i)}));
        valid=Number.isFinite(half)&&half>0&&docs.every(x=>
          Number.isFinite(x.s)&&x.s>=-1&&x.s<=1&&
          Number.isFinite(x.c)&&x.c>=0&&x.c<=1&&
          Number.isFinite(x.a)&&x.a>=0);
        if(valid){
          let numerator=0,denominator=0;
          for(const x of docs){
            const w=x.c*Math.pow(2,-x.a/half);
            numerator+=w*x.s;denominator+=w;
          }
          if(denominator<=0)valid=false;
          else{
            result=fmt(numerator/denominator);
            note="置信度×时间衰减加权平均；未处理重复新闻和公司相关性，实际研究还需加入这些维度。该分数不是未来收益预测。";
          }
        }break;
      }
      case "fxhedge": {
        const asset=get("asset"),fx=get("fx"),hedge=get("hedge"),cost=get("cost");
        valid=[asset,fx,hedge,cost].every(Number.isFinite)&&asset>-100&&fx>-100&&hedge>=0&&hedge<=100&&cost>=0;
        if(valid){
          const h=hedge/100;
          const gross=(1+asset/100)*(1+(1-h)*fx/100)-1;
          const net=gross-h*cost/10000;
          result=fmt(net*100)+"%";
          note="剩余外汇敞口的简化收益代理，扣除按对冲名义金额近似的成本；未包含远期点、carry、基差、保证金和展期。";
        }break;
      }
      case "risk3": {
        const w=[get("w1"),get("w2"),get("w3")];
        const v=[get("v1"),get("v2"),get("v3")].map(x=>x/100);
        const r12=get("r12"),r13=get("r13"),r23=get("r23");
        valid=w.every(Number.isFinite)&&v.every(x=>Number.isFinite(x)&&x>0)&&
          [r12,r13,r23].every(x=>Number.isFinite(x)&&x>=-1&&x<=1)&&
          Math.abs(w.reduce((a,b)=>a+b,0)-100)<1e-6;
        const determinant=1+2*r12*r13*r23-r12*r12-r13*r13-r23*r23;
        if(determinant < -1e-9)valid=false;
        if(valid){
          const ww=w.map(x=>x/100);
          const corr=[[1,r12,r13],[r12,1,r23],[r13,r23,1]];
          const cov=corr.map((row,i)=>row.map((rho,j)=>rho*v[i]*v[j]));
          const sigmaW=cov.map(row=>row.reduce((sum,c,j)=>sum+c*ww[j],0));
          const variance=ww.reduce((sum,wi,i)=>sum+wi*sigmaW[i],0);
          if(variance<=0)valid=false;
          else{
            const vol=Math.sqrt(variance);
            const shares=ww.map((wi,i)=>wi*sigmaW[i]/variance*100);
            result="组合波动率 "+fmt(vol*100)+"%；风险贡献 "+shares.map(x=>fmt(x,1)+"%").join(" / ");
            note="风险贡献顺序为股票 / 债券 / 黄金。相关性改变会改变贡献；历史协方差不是未来保证。";
          }
        }break;
      }
      case "allocation": {
        const risk=get("risk"),vol=get("vol"),signal=get("signal"),max=get("max");
        const current=get("current"),change=get("change"),capital=get("capital");
        valid=[risk,vol,signal,max,current,change,capital].every(Number.isFinite)&&
          risk>=0&&vol>0&&signal>=0&&signal<=1&&max>0&&current>=0&&current<=max&&change>=0&&capital>0;
        if(valid){
          const raw=Math.min(max,risk/vol*signal);
          const delta=Math.max(-change,Math.min(change,raw-current));
          const target=current+delta;
          result="目标权重 "+fmt(target)+"% · 名义金额 "+fmt(capital*target/100)+" 元";
          note="按单名风险预算近似后，再限制单名上限和本期权重变化；不含协方差、行业限额、流动性与真实订单规则。";
        }break;
      }
    }
    const output=form.querySelector("output"), explanation=form.querySelector("[data-explain]");
    if(output)output.textContent=valid?result:"参数不满足模型条件";
    if(explanation)explanation.textContent=valid?note:"请检查数值范围、权重和、相关矩阵半正定条件与单位。";
  }
  document.querySelectorAll("form[data-calc]").forEach(form=>{
    if(!supported.has(form.dataset.calc))return;
    form.addEventListener("submit",event=>event.preventDefault());
    form.addEventListener("input",()=>update(form));
    update(form);
  });
})();
