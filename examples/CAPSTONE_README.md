# Offline capstone lab

Run from repository root:

```bash
python3 examples/capstone_lab.py
python3 -m unittest discover -s examples -p 'test_capstone*.py' -v
```

All values and records are synthetic. The examples have no external data downloads,
LLM calls, API keys, market-data entitlements, or brokerage connectivity.

- `aggregate_sentiment`: point-in-time, confidence/relevance/recency weighted classifier scores.
- `currency_adjusted_return`: a simplified residual-FX-exposure illustration; excludes forward points, carry, basis, collateral and rebalancing.
- `portfolio_risk_contributions`: covariance-aware Euler volatility contributions.
- `composite_scores`, `allocate_capped`, `limit_one_way_turnover`: cross-sectional ranks and explicit portfolio constraints.
- `net_return`, `max_drawdown`, `risk_budget_weight`: basic portfolio diagnostics and position sizing.

This is an educational research skeleton, not a complete production backtester, financial advice,
a validated alpha model, or a live trading system.
