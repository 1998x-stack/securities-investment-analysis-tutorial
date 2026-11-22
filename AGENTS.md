# AGENTS.md — Securities Investment Analysis Tutorial

## Goal
Make independently readable, evidence-grounded Chinese long-form lessons. Each article must teach an investment concept from a first-time reader's perspective, not summarize an outline. Do not promise returns or give buy/sell tips.

## Canonical paths
- `docs/index.html` landing; `docs/lessons/NN.html` chapters; `docs/assets/css/site.css` common styles; `docs/assets/js/site.js` interactive enhancements; `docs/assets/svg/` standalone diagrams; `docs/data/evidence.json` evidence ledger.
- Root `index.html`, `NN.html` only redirect old links; never edit as the canonical source.
- Chapters 11–28 are presently legacy HTML, with `docs/lessons/theme.css`, and must be modernized one-by-one without breaking URLs.
- Frontend static, no NPM/CDN required. Do not commit built caches.

## Narrative contract (Olah-style-posts)
Refer to https://github.com/1998x-stack/Olah-style-posts/tree/main/skills/olah-style-paper-posts and its narrative, SVG, MathML and QA references. Apply principles, not copied assets.
1. Begin with a concrete paradox or decision boundary.
2. Establish prerequisites and what each instrument/rule does; avoid “上一章讲过”, fake anecdotes, overgeneralizations.
3. Trace a single causal chain with progressive SVG: situation → mechanism → equation with units → worked numerical example → assumptions and failure modes.
4. Every article explains itself: no prerequisite links standing in for definitions; one H1, semantic H2/H3, independent sources and end-of-chapter checks.
5. Distinguish facts, examples, theoretical models, interpretations, and normative recommendations.

## Financial truth and regulation
- Cross-check exchange rules, eligibility, trading sessions, order types, settlement, fees and tax against jurisdiction-specific official primary documents; mark effective date and postpone an assertion if uncertain.
- On CAS30, distinguish the 2014 standard and the phased application of the 2026 revision: 2027 cross-border adopters, 2029 other onshore listed entities, 2030 non-listed.
- Profit is not cash; point-in-time balance sheet is not period flow; use average denominators for turnover/ROE; parent vs consolidated reports matter.
- All numerical examples should identify inputs, units, assumptions, and internal arithmetic consistency; no invented historical results.
- Avoid “ROE越高越好” without denominator and leverage caveats; avoid fabricated forecast returns or correlation/causation claims.

## Design and accessibility
- Shared CSS warm paper, ink #203035, teal #147f80 for evidence/flow, coral #d06d4d for costs/transformations, violet #7461ba for structural relationships.
- Standalone SVG with xmlns, viewBox, title, desc, arrows with semantic directions, readable labels >=13px and standalone figure captions; figures must work without JS.
- Semantic landmarks, skip-link, visible keyboard focus, alt text, reduced motion, responsive 360/390/1440 layout, print media. Do not conceal overflowing viewport with body overflow-x:hidden.
- Math-heavy equations: native MathML (real fraction and subscripts), in keyboard-scrollable containers, separate from SVG.
- Interactive examples have labeled inputs and a deterministic default; surrounding prose complete with JS disabled.

## Research → implementation → release gates
Audit existing HTML; record source URL/date/relevance in evidence ledger; write claim map and diagram storyboard; draft full article; independently verify formula and diagram; add one executable deterministic example; perform link, SVG XML and structural validation with `python3 scripts/validate_site.py`.
Browser-gate: inspect 1440, 390 and 360px, horizontal overflow, JS errors, focus, contrast, reduced motion, print and figures; run calculator smoke tests. Mark unrun browser checks as NOT VERIFIED, never as passed.
Prefer branch/PR, verify CI diff, deploy and then verify live URL. Every batch lists changed chapters and factual exceptions.

## Valuation contract (Chapters 06–10 and successors)
- Do not infer stock direction from one macro release. Distinguish real GDP growth, CPI inflation, and the PMI 50 diffusion boundary; policy-rate, long-term-yield, risk-premium, and earnings channels can diverge.
- Segment industry research into customer demand, bargaining power, unit economics, capex, invested capital returns, and free cash flow. Never sum different-stage profit margins into a chain profit rate.
- FCFF discounts at WACC to firm value; FCFE and dividends discount at cost of equity to equity value. Bridge EV to equity only once, accounting for debt, cash, minority claims, options and dilution.
- Validate all Gordon stable-growth formulas require discount rate strictly larger than g. Test both the nominal numerator period and terminal discount year. Compute terminal-value share as a sensitivity warning, not a quality signal.
- Never treat EBITDA as free cash flow, a negative P/E as a bargain, PEG as an intrinsic-value identity, or P/B less than one as a safety guarantee.
- Browser QA for refactored chapters must verify at least one deterministic calculation, offline SVG loads, MathML visibility, 360/390/1440 viewports and an invalid-input guard. Update evidence.json for each refactored batch.
