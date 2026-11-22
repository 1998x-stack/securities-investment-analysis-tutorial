#!/usr/bin/env python3
"""Deterministic offline capstone research primitives.

Run from the repository root:
    python3 examples/capstone_lab.py
Tests:
    python3 -m unittest discover -s examples -p 'test_capstone*.py' -v

All records, signals and returns are synthetic teaching examples. No market-data
download, brokerage connection, model API or trading credential is used.
"""
from math import isfinite, sqrt


def point_in_time(records, decision_date):
    """Latest visible record per (ticker, metric), never using future availability."""
    visible = [r for r in records if r["available_at"] <= decision_date]
    if not visible:
        raise ValueError("no records available at decision time")
    latest = {}
    for row in visible:
        key = (row["ticker"], row["metric"])
        order = (row["period_end"], row["available_at"])
        if key not in latest or order > latest[key][0]:
            latest[key] = (order, row)
    return [entry[1] for entry in latest.values()]


def aggregate_sentiment(items, as_of, half_life_days=5.0):
    """Confidence/relevance/recency-weighted classifier score in [-1, 1].

    Future documents are excluded; duplicate document IDs count once.
    """
    if not isfinite(half_life_days) or half_life_days <= 0:
        raise ValueError("half-life must be positive")
    seen, numerator, denominator, used = set(), 0.0, 0.0, 0
    for item in items:
        doc_id = item["doc_id"]
        if doc_id in seen:
            continue
        seen.add(doc_id)
        age = (as_of - item["published_at"]).days
        if age < 0:
            continue
        score = item["score"]
        confidence = item["confidence"]
        relevance = item.get("relevance", 1.0)
        if not isfinite(score) or not -1 <= score <= 1:
            raise ValueError("sentiment score must be in [-1, 1]")
        if not isfinite(confidence) or not 0 <= confidence <= 1:
            raise ValueError("confidence must be in [0, 1]")
        if not isfinite(relevance) or not 0 <= relevance <= 1:
            raise ValueError("relevance must be in [0, 1]")
        weight = confidence * relevance * (2 ** (-age / half_life_days))
        if weight:
            numerator += weight * score
            denominator += weight
            used += 1
    return {"score": numerator / denominator if denominator else 0.0,
            "weight": denominator, "coverage": used}


def currency_adjusted_return(asset_return, fx_return, hedge_ratio=0.0,
                             hedge_cost_bps=0.0):
    """Simplified home-currency return with residual FX exposure.

    R_home ~= (1 + R_asset) * (1 + (1-h) * R_fx) - 1 - hedge_cost.
    FX return is the change in home-currency value of one foreign-currency unit.
    Forward points, carry, collateral, basis and hedge rebalancing are excluded.
    """
    values = (asset_return, fx_return, hedge_ratio, hedge_cost_bps)
    if not all(isfinite(x) for x in values):
        raise ValueError("finite inputs required")
    if asset_return <= -1 or fx_return <= -1:
        raise ValueError("returns cannot be below -100%")
    if not 0 <= hedge_ratio <= 1 or hedge_cost_bps < 0:
        raise ValueError("invalid hedge ratio or cost")
    residual_fx = (1 - hedge_ratio) * fx_return
    gross = (1 + asset_return) * (1 + residual_fx) - 1
    return gross - hedge_ratio * hedge_cost_bps / 10000


def portfolio_risk_contributions(weights, covariance):
    """Euler volatility contributions for a fully invested long-only portfolio."""
    n = len(weights)
    if n == 0 or len(covariance) != n or any(len(row) != n for row in covariance):
        raise ValueError("weights and covariance dimensions must match")
    if any(not isfinite(w) or w < 0 for w in weights) or abs(sum(weights) - 1) > 1e-8:
        raise ValueError("weights must be nonnegative and sum to one")
    if any(not isfinite(covariance[i][j]) for i in range(n) for j in range(n)):
        raise ValueError("finite covariance matrix required")
    if any(abs(covariance[i][j] - covariance[j][i]) > 1e-8
           for i in range(n) for j in range(n)):
        raise ValueError("covariance matrix must be symmetric")
    sigma_w = [sum(covariance[i][j] * weights[j] for j in range(n))
               for i in range(n)]
    variance = sum(weights[i] * sigma_w[i] for i in range(n))
    if variance <= 0:
        raise ValueError("portfolio variance must be positive")
    volatility = sqrt(variance)
    contributions = [weights[i] * sigma_w[i] / volatility for i in range(n)]
    return {"volatility": volatility,
            "contributions": contributions,
            "shares": [x / volatility for x in contributions]}


def cross_sectional_ranks(values, higher_is_better=True):
    """Average percentile ranks in [0, 1]; all ties receive 0.5."""
    if not values or any(not isfinite(v) for v in values.values()):
        raise ValueError("nonempty finite cross-section required")
    oriented = {k: v if higher_is_better else -v for k, v in values.items()}
    ordered = sorted(oriented.items(), key=lambda x: x[1])
    n = len(ordered)
    if n == 1 or ordered[0][1] == ordered[-1][1]:
        return {k: 0.5 for k in oriented}
    result = {}
    i = 0
    while i < n:
        j = i + 1
        while j < n and ordered[j][1] == ordered[i][1]:
            j += 1
        percentile = ((i + j - 1) / 2) / (n - 1)
        for k, _ in ordered[i:j]:
            result[k] = percentile
        i = j
    return result


def composite_scores(rows, factor_weights):
    """Combine already time-aligned cross-sectional ranks with fixed weights.

    factor_weights maps factor -> (weight, higher_is_better); weights sum to 1.
    """
    if not rows or not factor_weights:
        raise ValueError("rows and factor weights required")
    total = sum(weight for weight, _ in factor_weights.values())
    if any(not isfinite(weight) or weight < 0 for weight, _ in factor_weights.values()) or abs(total - 1) > 1e-8:
        raise ValueError("factor weights must be nonnegative and sum to one")
    tickers = [row["ticker"] for row in rows]
    if len(set(tickers)) != len(tickers):
        raise ValueError("duplicate ticker")
    scores = {ticker: 0.0 for ticker in tickers}
    for factor, (weight, direction) in factor_weights.items():
        ranks = cross_sectional_ranks({row["ticker"]: row[factor] for row in rows},
                                      higher_is_better=direction)
        for ticker in tickers:
            scores[ticker] += weight * ranks[ticker]
    return scores


def allocate_capped(scores, sectors, max_weight=0.25, sector_cap=0.40):
    """Greedy rank-ordered long-only allocation; unused capacity remains cash."""
    if not scores or set(scores) != set(sectors):
        raise ValueError("scores and sector map must contain the same securities")
    if not (0 < max_weight <= 1 and 0 < sector_cap <= 1):
        raise ValueError("caps must be in (0, 1]")
    if any(not isfinite(v) for v in scores.values()):
        raise ValueError("finite scores required")
    weights = {ticker: 0.0 for ticker in scores}
    sector_used = {}
    remaining = 1.0
    for ticker, score in sorted(scores.items(), key=lambda x: (-x[1], x[0])):
        if remaining <= 1e-12:
            break
        sector = sectors[ticker]
        room = max(0.0, sector_cap - sector_used.get(sector, 0.0))
        amount = min(max_weight, room, remaining)
        if amount > 0:
            weights[ticker] = amount
            sector_used[sector] = sector_used.get(sector, 0.0) + amount
            remaining -= amount
    return {"weights": weights, "cash": max(0.0, remaining)}


def limit_one_way_turnover(current, target, max_one_way_turnover):
    """Scale all weight changes proportionally to the one-way turnover limit."""
    if not isfinite(max_one_way_turnover) or not 0 <= max_one_way_turnover <= 1:
        raise ValueError("turnover cap must be in [0, 1]")
    keys = set(current) | set(target)
    if any(not isfinite(current.get(k, 0.0)) or not isfinite(target.get(k, 0.0))
           or current.get(k, 0.0) < 0 or target.get(k, 0.0) < 0 for k in keys):
        raise ValueError("long-only finite weights required")
    delta = {k: target.get(k, 0.0) - current.get(k, 0.0) for k in keys}
    turnover = 0.5 * sum(abs(v) for v in delta.values())
    if turnover <= max_one_way_turnover or turnover == 0:
        return {k: target.get(k, 0.0) for k in keys}
    scale = max_one_way_turnover / turnover
    return {k: current.get(k, 0.0) + scale * delta[k] for k in keys}


def net_return(gross_return, one_way_turnover, cost_bps):
    """Linear teaching approximation; turnover is a fraction, costs are bps."""
    if not all(isfinite(x) for x in (gross_return, one_way_turnover, cost_bps)):
        raise ValueError("finite inputs required")
    if gross_return <= -1 or one_way_turnover < 0 or cost_bps < 0:
        raise ValueError("invalid return, turnover or cost")
    return gross_return - one_way_turnover * cost_bps / 10000


def max_drawdown(returns):
    """Peak-to-trough drawdown from a starting NAV of one."""
    if any(not isfinite(r) or r <= -1 for r in returns):
        raise ValueError("period returns must be finite and greater than -100%")
    nav = peak = 1.0
    worst = 0.0
    for r in returns:
        nav *= 1 + r
        peak = max(peak, nav)
        worst = min(worst, nav / peak - 1)
    return worst


def risk_budget_weight(risk_budget_bps, annual_vol_pct, signal_strength,
                       max_weight_pct, current_weight_pct, max_change_pct):
    """Illustrative single-name sizing; not a substitute for covariance risk."""
    values = (risk_budget_bps, annual_vol_pct, signal_strength,
              max_weight_pct, current_weight_pct, max_change_pct)
    if not all(isfinite(x) for x in values):
        raise ValueError("finite inputs required")
    if (risk_budget_bps < 0 or annual_vol_pct <= 0 or
        not 0 <= signal_strength <= 1 or max_weight_pct <= 0 or
        not 0 <= current_weight_pct <= max_weight_pct or max_change_pct < 0):
        raise ValueError("inputs outside model domain")
    raw = min(max_weight_pct, risk_budget_bps / annual_vol_pct * signal_strength)
    delta = max(-max_change_pct, min(max_change_pct, raw - current_weight_pct))
    return current_weight_pct + delta


def demo():
    from datetime import date
    as_of = date(2026, 11, 20)
    docs = [
        {"doc_id":"a", "published_at":date(2026,11,20), "score":0.7, "confidence":0.9, "relevance":1.0},
        {"doc_id":"b", "published_at":date(2026,11,18), "score":-0.5, "confidence":0.8, "relevance":1.0},
        {"doc_id":"c", "published_at":date(2026,11,15), "score":0.2, "confidence":0.7, "relevance":1.0},
    ]
    sentiment = aggregate_sentiment(docs, as_of, half_life_days=5)
    rows = [
        {"ticker":"A","sector":"Tech","growth":0.18,"cash_quality":1.2,"valuation_yield":0.08,"volatility":0.28},
        {"ticker":"B","sector":"Tech","growth":0.12,"cash_quality":0.9,"valuation_yield":0.10,"volatility":0.22},
        {"ticker":"C","sector":"Health","growth":0.10,"cash_quality":1.4,"valuation_yield":0.06,"volatility":0.18},
        {"ticker":"D","sector":"Health","growth":0.07,"cash_quality":1.1,"valuation_yield":0.09,"volatility":0.16},
        {"ticker":"E","sector":"Industry","growth":0.14,"cash_quality":0.8,"valuation_yield":0.12,"volatility":0.25},
        {"ticker":"F","sector":"Industry","growth":0.05,"cash_quality":1.0,"valuation_yield":0.11,"volatility":0.20},
    ]
    weights = {"growth":(0.25,True),"cash_quality":(0.30,True),
               "valuation_yield":(0.20,True),"volatility":(0.25,False)}
    scores = composite_scores(rows, weights)
    sectors = {row["ticker"]:row["sector"] for row in rows}
    target = allocate_capped(scores, sectors, max_weight=0.25, sector_cap=0.40)
    print("Synthetic sentiment score:", round(sentiment["score"], 4))
    print("Synthetic composite scores:", {k:round(v,3) for k,v in scores.items()})
    print("Capped target weights:", {k:round(v,3) for k,v in target["weights"].items()})
    print("Unallocated cash:", round(target["cash"],3))
    print("Illustrative 8% local return, -5% FX, unhedged:",
          round(currency_adjusted_return(0.08,-0.05),4))


if __name__ == "__main__":
    demo()
