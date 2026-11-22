#!/usr/bin/env python3
"""Browser QA for the course's first ten canonical chapters and landing page.
Needs: pip install playwright; python -m playwright install chromium.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"qa"/"browser"
OUT.mkdir(parents=True,exist_ok=True)
FILES=["index.html"]+[f"lessons/{i:02d}.html" for i in range(1,11)]
SIZES=[(1440,900),(390,844),(360,780)]
EXPECTED={"01.html":"16,288.95","02.html":"972.77","03.html":"3,000.00","04.html":"30.00","05.html":"17.28","06.html":"2.94","07.html":"15,000.00","08.html":"1,726.79","09.html":"1.00","10.html":"8.00"}
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
