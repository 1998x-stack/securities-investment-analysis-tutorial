#!/usr/bin/env python3
"""Browser QA for the course's all twenty-eight canonical chapters and landing page.
Needs: pip install playwright; python -m playwright install chromium.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"qa"/"browser"
OUT.mkdir(parents=True,exist_ok=True)
FILES=["index.html"]+[f"lessons/{i:02d}.html" for i in range(1,29)]
SIZES=[(1440,900),(390,844),(360,780)]
EXPECTED={"01.html":"16,288.95","02.html":"972.77","03.html":"3,000.00","04.html":"30.00","05.html":"17.28","06.html":"2.94","07.html":"15,000.00","08.html":"1,726.79","09.html":"1.00","10.html":"8.00","11.html":"249.51","12.html":"15,000.00","13.html":"6.00","14.html":"75.00","15.html":"14.14","16.html":"24,672.80","17.html":"2.25","18.html":"6.80","19.html":"0.78","20.html":"0.64","21.html":"−50.00","22.html":"1.33","23.html":"0.00","24.html":"7.80","25.html":"250.00","26.html":"0.21","27.html":"组合波动率 9.01%","28.html":"目标权重 0.96%"}
def main():
    errors=[];results=[]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,args=["--no-sandbox"])
        try:
            for w,height in SIZES:
                context=browser.new_context(viewport={"width":w,"height":height},device_scale_factor=1,reduced_motion="reduce")
                for name in FILES:
                    url=(ROOT/"docs"/name).as_uri()
                    page=context.new_page()
                    js_errors=[]
                    page.on("pageerror",lambda error:js_errors.append(str(error)))
                    page.goto(url,wait_until="load",timeout=30000)
                    page.wait_for_timeout(120)
                    heading=page.locator("h1").count()
                    if heading!=1:errors.append(f"{name}@{w}: expected one H1; got {heading}")
                    if page.locator("main").count()!=1:errors.append(f"{name}@{w}: missing main")
                    overflow=page.evaluate("document.documentElement.scrollWidth - window.innerWidth")
                    if overflow>1:errors.append(f"{name}@{w}: page width overflow {overflow}px")
                    # Eagerly resolve lazy images before asserting successful decode.
                    page.locator("img").evaluate_all("(xs)=>xs.forEach(img=>{img.loading='eager';img.decoding='sync'})")
                    page.wait_for_function("Array.from(document.images).every(img=>img.complete)",timeout=15000)
                    broken=page.locator("img").evaluate_all("(xs)=>xs.filter(x=>!x.complete||x.naturalWidth===0).map(x=>x.src)")
                    if broken:errors.append(f"{name}@{w}: broken images {broken}")
                    if js_errors:errors.append(f"{name}@{w}: JS errors {js_errors}")
                    math=page.locator("math").count()
                    if math:
                        bad=page.locator("math").evaluate_all("(xs)=>xs.some(x=>x.namespaceURI!=='http://www.w3.org/1998/Math/MathML'||x.getBoundingClientRect().height<=0)")
                        if bad:errors.append(f"{name}@{w}: MathML namespace/layout")
                    if name!="index.html":
                        actual=page.locator("form[data-calc] output").first.inner_text().strip()
                        if EXPECTED[Path(name).name] not in actual:
                            errors.append(f"{name}@{w}: calculator expected {EXPECTED[Path(name).name]} got {actual}")
                        if page.locator("figure figcaption").count()<2:errors.append(f"{name}@{w}: missing figure captions")
                        if Path(name).name=="09.html":
                            second=page.locator("form[data-calc] output").nth(1).inner_text().strip()
                            if "1.29" not in second:errors.append(f"{name}@{w}: PB second calculator {second}")
                        if Path(name).name=="10.html":
                            second=page.locator("form[data-calc] output").nth(1).inner_text().strip()
                            if "40.00" not in second:errors.append(f"{name}@{w}: DDM second calculator {second}")
                        if Path(name).name in ["08.html","09.html","10.html"]:
                            badform=page.locator("form[data-calc=dcf],form[data-calc=pb],form[data-calc=ddm]").first
                            if badform.count():
                                if Path(name).name=="08.html":
                                    badform.locator("[name=growth]").fill("10")
                                else:
                                    badform.locator("[name=growth]").fill("99")
                                invalid_output=badform.locator("output").inner_text().strip()
                                if "参数不满足" not in invalid_output:errors.append(f"{name}@{w}: no invalid-input feedback")
                                if Path(name).name=="08.html":badform.locator("[name=growth]").fill("3")
                                elif Path(name).name=="09.html":badform.locator("[name=growth]").fill("3")
                                else:badform.locator("[name=growth]").fill("3")
                    if w==1440 and name=="lessons/09.html":
                        stable=page.locator('form[data-calc="pb"]')
                        stable.locator('[name="roe"]').fill("1")
                        if "参数不满足" not in stable.locator('output').inner_text():
                            errors.append("09: ROE below sustainable growth must be rejected")
                    if w==1440 and name=="lessons/10.html":
                        evform=page.locator('form[data-calc="ev"]')
                        evform.locator('[name="cash"]').fill("1500")
                        if "参数不满足" not in evform.locator('output').inner_text():
                            errors.append("10: non-positive enterprise value must be rejected")
                    if w==1440 and name=="lessons/11.html":
                        f=page.locator('form[data-calc="grow3"]')
                        f.locator('[name="terminal"]').fill("10")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("11 invalid WACC<=g not rejected")
                    if w==1440 and name=="lessons/13.html":
                        f=page.locator('form[data-calc="ohlc"]')
                        f.locator('[name="high"]').fill("90")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("13 OHLC invalid high not rejected")
                    if w==1440 and name=="lessons/14.html":
                        f=page.locator('form[data-calc="rsi14"]')
                        f.locator('[name="loss"]').fill("-1")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("14 RSI negative loss not rejected")
                    if w==1440 and name=="lessons/15.html":
                        f=page.locator('form[data-calc="tworisk"]')
                        f.locator('[name="rho"]').fill("1.5")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("15 correlation >1 not rejected")
                    if w==1440 and name=="lessons/16.html":
                        f=page.locator('form[data-calc="risk"]')
                        f.locator('[name="confidence"]').fill("90")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("16 invalid confidence not rejected")
                    if w==1440 and name=="lessons/17.html":
                        f=page.locator('form[data-calc="prospect"]')
                        f.locator('[name="lambda"]').fill("0.5")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("17 lambda below 1 not rejected")
                    if w==1440 and name=="lessons/18.html":
                        f=page.locator('form[data-calc="styleblend"]')
                        f.locator('[name="wm"]').fill("20")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("18 weights not summing to 100 rejected")
                    if w==1440 and name=="lessons/19.html":
                        f=page.locator('form[data-calc="qsharpe"]')
                        f.locator('[name="vol"]').fill("0")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("19 zero volatility not rejected")
                    if w==1440 and name=="lessons/20.html":
                        f=page.locator('form[data-calc="factor"]')
                        f.locator('[name="wc"]').fill("10")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("20 factor weights not summing to 100 rejected")
                    if w==1440 and name=="lessons/21.html":
                        f=page.locator('form[data-calc="porproxy"]')
                        f.locator('[name="price"]').fill("0")
                        if "参数不满足" not in f.locator("output").inner_text():errors.append("21 invalid nonpositive price")
                    if w==1440 and name=="lessons/22.html":
                        f=page.locator('form[data-calc="sectorpb"]')
                        f.locator('[name="growth"]').fill("10")
                        if "参数不满足" not in f.locator("output").inner_text():errors.append("22 invalid g>=Ke")
                    if w==1440 and name=="lessons/23.html":
                        f=page.locator('form[data-calc="split"]')
                        f.locator('[name="ratio"]').fill("0")
                        if "参数不满足" not in f.locator("output").inner_text():errors.append("23 invalid zero split ratio")
                    if w==1440 and name=="lessons/24.html":
                        f=page.locator('form[data-calc="netreturn"]')
                        f.locator('[name="turnover"]').fill("-1")
                        if "参数不满足" not in f.locator("output").inner_text():errors.append("24 negative turnover")
                    if w==1440 and name=="lessons/25.html":
                        f=page.locator('form[data-calc="execution"]')
                        f.locator('[name="notional"]').fill("0")
                        if "参数不满足" not in f.locator("output").inner_text():errors.append("25 nonpositive order value")
                    if w==1440 and name=="lessons/26.html":
                        f=page.locator('form[data-calc="sentiment"]')
                        f.locator('[name="c1"]').fill("1.5")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("26 confidence >1 not rejected")
                    if w==1440 and name=="lessons/27.html":
                        f=page.locator('form[data-calc="fxhedge"]')
                        if "5.25%" not in f.locator("output").inner_text():
                            errors.append("27 partial FX hedge default")
                        f.locator('[name="hedge"]').fill("120")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("27 hedge ratio >100 not rejected")
                        risk=page.locator('form[data-calc="risk3"]')
                        risk.locator('[name="r12"]').fill("1.5")
                        if "参数不满足" not in risk.locator("output").inner_text():
                            errors.append("27 invalid correlation not rejected")
                    if w==1440 and name=="lessons/28.html":
                        f=page.locator('form[data-calc="allocation"]')
                        f.locator('[name="vol"]').fill("0")
                        if "参数不满足" not in f.locator("output").inner_text():
                            errors.append("28 zero volatility not rejected")
                    if name=="index.html" and w==1440:
                        inp=page.locator("[data-course-search]")
                        inp.fill("财务比率分析")
                        visible=page.locator("[data-chapter]:visible").count()
                        if visible!=1:errors.append(f"search filter expected 1 match; got {visible}")
                        inp.fill("")
                        page.keyboard.press("Tab")
                    path=OUT/f"{name.replace('/','-').removesuffix('.html')}-{w}.png"
                    page.screenshot(path=str(path),full_page=True,animations="disabled")
                    results.append({"page":name,"width":w,"h1":heading,"overflow_px":overflow,"broken_images":len(broken),"mathml":math,"screenshot":str(path.relative_to(ROOT))})
                    page.close()
                context.close()
            context=browser.new_context(viewport={"width":1120,"height":800})
            page=context.new_page()
            page.goto((ROOT/"docs"/"lessons"/"04.html").as_uri())
            page.emulate_media(media="print")
            page.screenshot(path=str(OUT/"04-print.png"),full_page=True)
            page.close();context.close()
        finally:
            browser.close()
    (OUT/"report.json").write_text(json.dumps({"results":results,"failures":errors},ensure_ascii=False,indent=2),encoding="utf8")
    print(json.dumps({"screenshots":len(results)+1,"failures":errors},ensure_ascii=False,indent=2))
    if errors:sys.exit(1)
if __name__=="__main__":main()
