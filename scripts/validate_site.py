#!/usr/bin/env python3
"""Static structural, local-link, source-ledger and SVG checks for the course."""
from pathlib import Path
from html.parser import HTMLParser
import json, sys, xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/"docs"

class Scan(HTMLParser):
    def __init__(self):
        super().__init__(); self.refs=[]; self.h1=0; self.errors=[]
    def handle_starttag(self,tag,attrs):
        d=dict(attrs)
        if tag=="h1": self.h1+=1
        if tag=="img" and not d.get("alt"): self.errors.append("img without alt")
        if any(k.lower().startswith("on") for k in d): self.errors.append("inline event handler")
        for key in ("href","src"):
            if key in d:self.refs.append(d[key])

def main():
    errors=[]
    pages=list(BASE.rglob("*.html"))
    catalog=json.loads((BASE/"data/courses.json").read_text(encoding="utf8"))
    canonical={f"{i:02d}.html" for i in range(1,29)}
    for chapter in catalog["chapters"]:
        if not (BASE/"lessons"/chapter["file"]).is_file():
            errors.append("missing lesson "+chapter["file"])
    for page in pages:
        content=page.read_text(encoding="utf8")
        scan=Scan();scan.feed(content)
        errors.extend(f"{page}: {problem}" for problem in scan.errors)
        if page==BASE/"index.html" or page.name in canonical:
            if scan.h1!=1:errors.append(f"{page}: expected exactly one H1; got {scan.h1}")
            if "<main" not in content:errors.append(f"{page}: missing main landmark")
            if "javascript:void(0)" in content:errors.append(f"{page}: inert JavaScript link")
        for ref in scan.refs:
            if ref.startswith(("https:","http:","mailto:","tel:","data:","#")):continue
            if ref.startswith("javascript:"):
                errors.append(f"{page}: javascript link");continue
            local=(page.parent/ref.split("#")[0].split("?")[0]).resolve()
            if not local.is_relative_to(BASE.resolve()) or not local.is_file():
                errors.append(f"{page}: broken local link {ref}")
    svgs=list((BASE/"assets/svg").glob("*.svg"))
    for path in svgs:
        try:
            root=ET.parse(path).getroot(); ns="{http://www.w3.org/2000/svg}"
            if "viewBox" not in root.attrib or root.find(ns+"title") is None or root.find(ns+"desc") is None:
                errors.append(f"{path}: missing SVG viewBox/title/desc")
        except Exception as exc:errors.append(f"{path}: SVG parse: {exc}")
    ledger=json.loads((BASE/"data/evidence.json").read_text(encoding="utf8"))
    for n in range(1,29):
        key=f"{n:02d}"
        if not ledger["chapters"].get(key,{}).get("sources"):
            errors.append(f"evidence ledger has no sources for chapter {key}")
    for n in (26,27,28):
        key=f"{n:02d}"
        chapter=ledger["chapters"].get(key,{})
        claims=chapter.get("claims",[])
        rows=chapter.get("claim_evidence",[])
        source_urls={item[1] for item in chapter.get("sources",[]) if len(item)>1}
        if len(rows)!=len(claims):
            errors.append(f"evidence ledger {key}: claim_evidence count does not match claims")
        html=(BASE/"lessons"/f"{key}.html").read_text(encoding="utf8")
        for item in rows:
            url=item.get("source_url","")
            if url and url not in source_urls:
                errors.append(f"evidence ledger {key}: source_url not present in sources: {url}")
            if url and url not in html:
                errors.append(f"lesson {key}: evidence source not linked in HTML: {url}")
            for support in item.get("supporting_sources",[]):
                if support not in source_urls or support not in html:
                    errors.append(f"evidence ledger {key}: invalid supporting source: {support}")
            if item.get("status")=="verified" and not url:
                errors.append(f"evidence ledger {key}: verified claim has no primary source URL")
    if not (ROOT/"examples"/"capstone_lab.py").read_text(encoding="utf8").count("def brinson_fachler_attribution"):
        errors.append("capstone lab missing Brinson-Fachler attribution")
    for n in range(21,29):
        page=BASE/"lessons"/f"{n:02d}.html"
        content=page.read_text(encoding="utf8")
        if content.count("<figure ")<3:errors.append(f"{page}: fewer than three explanatory figures")
        if 'data-calc="' not in content:errors.append(f"{page}: missing interactive calculation")
        if "<math " not in content:errors.append(f"{page}: missing semantic MathML")
        if "theme.css" in content:errors.append(f"{page}: legacy stylesheet still loaded")
    for name in ("capstone_lab.py","test_capstone_lab.py"):
        if not (ROOT/"examples"/name).is_file():errors.append("missing examples/"+name)
    print("Scanned",len(pages),"HTML pages and",len(svgs),"SVG files")
    for error in errors:print("FAIL:",error)
    if errors:sys.exit(1)
    print("PASS static checks; browser QA remains separate")
if __name__=="__main__":main()
