(()=>{"use strict";const get=(f,k)=>Number(f.querySelector('[name="'+k+'"]').value),fmt=(v,d=2)=>Number.isFinite(v)?v.toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d}):"不可计算";function run(f){let x=NaN,ex="";switch(f.dataset.calc){case"compound":{const p=get(f,"p"),r=get(f,"r")/100,t=get(f,"t");x=p*(1+r)**t;ex="假定收益率逐年恒定，不计税费；收益 "+fmt(x-p)+" 元。";break}case"bond":{const F=get(f,"face"),c=get(f,"coupon")/100,y=get(f,"yield")/100,n=Math.round(get(f,"years"));x=0;for(let t=1;t<=n;t++)x+=F*c/(1+y)**t;x+=F/(1+y)**n;ex="固定年付息、期末兑付本金；未考虑违约、流动性与税费。";break}case"auction":{const b=get(f,"buy"),s=get(f,"sell");x=Math.min(b,s);ex="仅演示某一候选价格的可成交量。真实集合竞价需比较所有候选价，并执行交易所确定价格的规则。";break}case"cash":{x=get(f,"open")+get(f,"oper")+get(f,"invest")+get(f,"finance");ex="单位：万元；假设汇率变动等其他调整为0。";break}case"dupont":{x=get(f,"margin")*get(f,"turn")*get(f,"lev");ex="净利率(%) × 资产周转率 × 权益乘数；需要统一分子分母及平均余额口径。";break}}f.querySelector("output").textContent=fmt(x)+(f.dataset.calc==="dupont"?"%":f.dataset.calc==="auction"?" 股":f.dataset.calc==="cash"?" 万元":" 元");f.querySelector("[data-explain]").textContent=ex}document.querySelectorAll('form[data-calc="compound"],form[data-calc="bond"],form[data-calc="auction"],form[data-calc="cash"],form[data-calc="dupont"]').forEach(f=>{f.addEventListener("submit",e=>e.preventDefault());f.addEventListener("input",()=>run(f));run(f)});const input=document.querySelector("[data-course-search]");if(input)input.addEventListener("input",()=>{const q=input.value.trim().toLowerCase();let shown=0;document.querySelectorAll("[data-chapter]").forEach(el=>{el.hidden=!el.textContent.toLowerCase().includes(q);if(!el.hidden)shown++});document.querySelectorAll("[data-stage]").forEach(s=>s.hidden=![...s.querySelectorAll("[data-chapter]")].some(c=>!c.hidden));document.querySelector("[data-results]").textContent=q?"找到 "+shown+" 篇":""})})();

/* Batch 02: deterministic model exercises, intentionally independent of older chapters. */
(()=>{"use strict";
const fmt=(x,d=2)=>Number.isFinite(x)?x.toLocaleString("zh-CN",{minimumFractionDigits:d,maximumFractionDigits:d}):"不可计算";
const kinds=new Set(["perpetuity","valuechain","wacc","dcf","pbmodel","multiples","evmultiple","ddm","exit"]);
function update(f){
 const v=k=>Number(f.querySelector('[name="'+k+'"]').value),kind=f.dataset.calc;
 let result=NaN,unit="",note="";
 const invalid=s=>{note=s;result=NaN;unit=""};
 switch(kind){
 case "perpetuity":
  if(v("rate")<=0||v("cf")<0)invalid("折现率必须为正，现金流不得为负。");
  else{result=v("cf")/(v("rate")/100);unit=" 单位";note="零增长永续现值；风险和增长均不变。";}break;
 case "valuechain":{
  const cost=v("raw")+v("manufacture")+v("channel")+v("service")+v("other");
  if(v("price")<=0||["raw","manufacture","channel","service","other"].some(x=>v(x)<0))invalid("售价必须大于0，各成本不得为负。");
  else{result=(v("price")-cost)/v("price")*100;unit="%";note="全部是构造成本，金额剩余 "+fmt(v("price")-cost)+"，未必代表真实净利润。";}
  break;
 }
 case "wacc":
  if(v("equity")<0||v("equity")>100||v("ke")<0||v("kd")<0||v("tax")<0||v("tax")>100)invalid("股权权重和税率应在0–100%，资本成本应非负。");
  else{result=v("equity")/100*v("ke")+(1-v("equity")/100)*v("kd")*(1-v("tax")/100);unit="%";note="市场价值权重，简化税盾假设。";}break;
 case "dcf":{
  const fcff=v("fcff"),r=v("wacc")/100,g=v("g")/100,years=v("years"),shares=v("shares");
  if(r<=0||r<=g||g<=-1||!Number.isInteger(years)||years<1||years>30||shares<=0||fcff<0||v("debt")<0||v("cash")<0)invalid("需满足 WACC>g，WACC>0，预测年数1–30整数，股数>0。");
  else{let pv=0;for(let t=1;t<=years;t++)pv+=fcff/Math.pow(1+r,t);
    const term=fcff*(1+g)/(r-g)/Math.pow(1+r,years),ev=pv+term;
    result=(ev-v("debt")+v("cash"))/shares;unit=" 元/股";
    note="企业价值 "+fmt(ev)+" 百万元；折现终值占比 "+fmt(ev>0?term/ev*100:0,1)+"%；前 "+years+" 年FCFF均相同。";}
  break;
 }
 case "pbmodel":
  if(v("ke")<=v("g")||v("ke")<=0||v("roe")<v("g"))invalid("稳定增长模型需Ke>g且ROE≥g。");
  else{result=(v("roe")-v("g"))/(v("ke")-v("g"));unit="×";note="稳态简化PB，假设增长、再投资与ROE口径一致。";}break;
 case "multiples":{
  if(v("price")<0||v("eps")<=0||v("book")<=0)invalid("EPS与每股账面权益必须为正。");
  else{const pe=v("price")/v("eps"),pb=v("price")/v("book"),peg=v("growth")>0?pe/v("growth"):NaN;
   f.querySelector("output").textContent="PE "+fmt(pe)+"× · PB "+fmt(pb)+"× · PEG "+(Number.isFinite(peg)?fmt(peg):"不适用");
   f.querySelector("[data-explain]").textContent="PEG分母采用增长率的百分数数字；不等于可保证的估值结论。";return;}
  break;
 }
 case "evmultiple":{
  const ev=v("mcap")+v("debt")-v("cash");
  if(ev<=0||v("ebitda")<=0||v("mcap")<0||v("debt")<0||v("cash")<0)invalid("EV和EBITDA应为正，参数不得为负。");
  else{result=ev/v("ebitda");unit="×";note="EV="+fmt(ev)+" 百万元；需核对现金与债务的调整口径。";}
  break;
 }
 case "ddm":
  if(v("dividend")<0||v("ke")<=v("g")||v("ke")<=0||v("g")<=-100)invalid("Gordon模型要求D1≥0、Ke>g且Ke>0。");
  else{result=v("dividend")/((v("ke")-v("g"))/100);unit=" 元/股";note="D1/(Ke−g)；假设分红和增长长期稳定。";}break;
 case "exit":{
  const years=v("years"),r=v("wacc")/100;
  if(r<=0||!Number.isInteger(years)||years<1||years>30||v("fcff")<0||v("ebitda")<0||v("multiple")<0)invalid("WACC>0，年数为1–30整数，金额与倍数非负。");
  else{let pv=0;for(let t=1;t<=years;t++)pv+=v("fcff")/Math.pow(1+r,t);
   const term=v("ebitda")*v("multiple")/Math.pow(1+r,years);
   result=pv+term;unit=" 百万元";note="显式期现值 "+fmt(pv)+"，退出终值现值 "+fmt(term)+"。";}
  break;
 }
 }
 f.querySelector("output").textContent=Number.isFinite(result)?fmt(result)+unit:"不可计算";
 f.querySelector("[data-explain]").textContent=note;
}
document.querySelectorAll("form[data-calc]").forEach(f=>{
 if(!kinds.has(f.dataset.calc))return;
 f.addEventListener("input",()=>update(f));
 f.addEventListener("submit",e=>e.preventDefault());
 update(f);
});
})();
