# AGENTS.md — Securities Investment Analysis Tutorial

## Goal
Make independently readable, evidence-grounded Chinese long-form lessons. Each article must teach an investment concept from a first-time reader's perspective, not summarize an outline. Do not promise returns or give buy/sell tips.

## Canonical paths
- `docs/index.html` landing; `docs/lessons/NN.html` chapters; `docs/assets/css/site.css` common styles; `docs/assets/js/site.js` interactive enhancements; `docs/assets/svg/` standalone diagrams; `docs/data/evidence.json` evidence ledger.
- Root `index.html`, `NN.html` only redirect old links; never edit as the canonical source.
- Chapters 26–28 are presently legacy HTML, with `docs/lessons/theme.css`, and must be modernized one-by-one without breaking URLs.
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

## Chapter 11–15 research contract
- Growth stocks: project cash flow after reinvestment and dilution; do not present PEGR/R–IRR as a proof that standard multistage DCF is obsolete. Attribute author-specific frameworks.
- Fundamentals: document management claims separately from audited filing facts; make investor thesis falsifiable.
- Technical analysis: differentiate OHLC availability, adjusted-price events, indicator warm-up and delayed executable orders. RSI examples using average gains/losses must identify Wilder seeding and zero-loss behavior.
- Portfolio theory: specify the sampling period, volatilities, correlation, portfolio weights and covariance cross term. Efficient-frontier examples should derive from actual weights and assumptions, not illustrative graphics masquerading as calculated results.


## Chapter 16–20 risk, behavioral and quantitative research contract
- **Risk:** Define loss variable, tail, confidence, horizon and valuation convention. VaR is a quantile, not a maximum loss; ES is a tail conditional average. Label the distribution and square-root-of-time assumptions. Basel's 97.5% one-tailed ES belongs to its market-risk IMA framework, not a universal retail rule. Maximum drawdown uses the prior high-water mark; show recovery asymmetry. Stop trigger price is not a guaranteed fill.
- **Behavioral finance:** Attribute prospect theory to Kahneman–Tversky and distinguish its value function from probability weighting. Do not claim a universal loss-aversion coefficient. State sample and scope for disposition-effect/overtrading evidence. Translate bias labels into falsifiable process interventions.
- **Investment strategies:** Treat value, growth and momentum as overlapping exposures. Distinguish cross-sectional from time-series momentum; discuss momentum crash and implementation costs. Present Soros reflexivity as an author-proposed interpretive framework, not a universally validated law. Discuss limits to arbitrage and capacity.
- **Quantitative research:** Use point-in-time data, contemporaneous investable universes, delisting/corporate-action handling and signal-to-order timestamps. Do not use same-close execution for a close-generated signal without a defensible auction model. Report all trials, costs, turnover, capacity, and genuinely untouched out-of-sample periods. PBO is a backtest-selection diagnostic, not a future loss probability.
- **Multi-factor:** Distinguish time-series factor regressions from cross-sectional stock scores. Define factor direction, construction, data lag, neutralization, weighting, rebalancing and transaction cost. Fama–French five factors are MKT/SMB/HML/RMW/CMA; UMD is an additional momentum factor, not part of FF5. Never transplant US factor return series as local-market evidence without a separately validated construction.

## Chapter 21–25 data, research and execution contract
- POR is the name of an author-specific 2026 value-band factor from Kaiyuan Securities; simplified (price−reference_value)/price is NOT its complete reproducible definition. Verify the original source and disclose sample, assumptions, horizon and implementation differences.
- Industry P/B ≈ (ROE−g)/(Ke−g) needs clean-surplus accounting, long-run sustainable ROE, consistent retention/payout, and Ke>g. Never market it as a general identity or target price.
- Vendor documentation and access rights evolve. Keep API credentials out of source control; distinguish point-in-time actual availability, restatements, security survivorship and corporate-action anchors. Do not claim real dataset access without it.
- In quant tutorials, a signal using close[t] must not be executed at close[t] unless a proven order path exists; default to a permitted future execution time and include transaction costs, capacity, warm-up and testing for temporal leakage.
- QMT/PTrade access is broker-authorized and version-specific. Keep all repo examples paper-only. No real order submission, credentials, hidden network calls or blanket claims of regulatory compliance. CSRC securities program trading rules effective 2024-10-08 and SSE/SZSE implementation effective 2025-07-07: reverify subsequent amendments.
- Preserve deterministic sample calculations, 15 independent explanatory diagrams, offline Python examples, at least 7 unit tests and static/Playwright coverage before merging.
