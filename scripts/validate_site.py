#!/usr/bin/env python3
"""Check static Pages artifacts without external packages."""
from pathlib import Path
from html.parser import HTMLParser
import json, sys, xml.etree.ElementTree as ET
BASE=Path(__file__).resolve().parents[1]/"docs"
class Scan(HTMLParser):
    def __init__(self): super().__init__(); self.refs=[]; self.h1=0; self.errors=[]
    def handle_starttag(self, tag, attrs):
        d=dict(attrs)
        if tag=="h1": self.h1+=1
        if tag=="img" and not d.get("alt"):self.errors.append("img without alt")
        if any(k.startswith("on") for k in d):self.errors.append("inline event")
        for k in ("href","src"):
            if k in d:self.refs.append(d[k])
def main():
    errors=[]; pages=list(BASE.rglob("*.html")); chapters=json.loads((BASE/"data/courses.json").read_text())["chapters"]
    for c in chapters:
        if not (BASE/"lessons"/c["file"]).exists():errors.append("missing lesson "+c["file"])
    for p in pages:
        html=p.read_text(encoding="utf8");s=Scan();s.feed(html);errors.extend(f"{p}: {e}" for e in s.errors)
        if p==BASE/"index.html" or p.name in [f"{i:02}.html" for i in range(1,16)]:
            if s.h1!=1:errors.append(f"{p}: expected one H1; got {s.h1}")
            if "javascript:void(0)" in html:errors.append(f"{p}: inert JS link")
        for u in s.refs:
            if u.startswith(("https:","http:","mailto:","tel:","data:","#")):continue
            if u.startswith("javascript:"):errors.append(f"{p}: javascript link");continue
            path=(p.parent/u.split("#")[0].split("?")[0]).resolve()
            if not path.is_relative_to(BASE.resolve()) or not path.is_file():errors.append(f"{p}: broken local link {u}")
    icons=list((BASE/"assets/svg").glob("*.svg"))
    for p in icons:
        try:
            x=ET.parse(p).getroot(); ns="{http://www.w3.org/2000/svg}"
            if "viewBox" not in x.attrib or x.find(ns+"title") is None or x.find(ns+"desc") is None:errors.append(f"{p}: SVG metadata")
        except Exception as e:errors.append(f"{p}: {e}")
    ev=json.loads((BASE/"data/evidence.json").read_text(encoding="utf8"))
    for n in [f"{i:02d}" for i in range(1,11)]:
        if not ev["chapters"].get(n,{}).get("sources"):errors.append(f"no sources for {n}")
    print("Scanned",len(pages),"HTML and",len(icons),"SVG")
    for x in errors:print("FAIL:",x)
    if errors:sys.exit(1)
    print("PASS static checks; browser QA remains separate")
if __name__=="__main__":main()
