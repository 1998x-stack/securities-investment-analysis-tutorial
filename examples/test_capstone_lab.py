"""Offline tests for capstone research calculations and guardrails."""
import unittest
from datetime import date
from capstone_lab import (
    point_in_time, aggregate_sentiment, currency_adjusted_return,
    portfolio_risk_contributions, cross_sectional_ranks, composite_scores,
    allocate_capped, limit_one_way_turnover, net_return, max_drawdown,
    risk_budget_weight,
)

class CapstoneTests(unittest.TestCase):
    def test_point_in_time_restatement(self):
        rows=[
            {"ticker":"A","metric":"profit","period_end":date(2026,9,30),
             "available_at":date(2026,10,20),"value":80},
            {"ticker":"A","metric":"profit","period_end":date(2026,9,30),
             "available_at":date(2026,11,5),"value":75},
            {"ticker":"B","metric":"profit","period_end":date(2026,9,30),
             "available_at":date(2026,10,25),"value":50},
        ]
        visible=point_in_time(rows,date(2026,10,31))
        self.assertEqual({x["ticker"]:x["value"] for x in visible},{"A":80,"B":50})
        with self.assertRaises(ValueError):point_in_time(rows,date(2026,10,1))

    def test_sentiment_weighting_and_future_exclusion(self):
        items=[
            {"doc_id":"a","published_at":date(2026,11,20),"score":0.7,"confidence":0.9},
            {"doc_id":"b","published_at":date(2026,11,18),"score":-0.5,"confidence":0.8},
            {"doc_id":"c","published_at":date(2026,11,15),"score":0.2,"confidence":0.7},
            {"doc_id":"future","published_at":date(2026,11,22),"score":-1.0,"confidence":1.0},
            {"doc_id":"a","published_at":date(2026,11,20),"score":-1.0,"confidence":1.0},
        ]
        result=aggregate_sentiment(items,date(2026,11,20),5)
        self.assertEqual(result["coverage"],3)
        self.assertAlmostEqual(result["score"],0.2138,places=3)
        with self.assertRaises(ValueError):aggregate_sentiment(items,date(2026,11,20),0)

    def test_currency_return_and_partial_hedge(self):
        self.assertAlmostEqual(currency_adjusted_return(0.08,-0.05),0.026)
        self.assertAlmostEqual(currency_adjusted_return(0.08,-0.05,0.5,10),0.0525)
        with self.assertRaises(ValueError):currency_adjusted_return(0.08,-0.05,1.2,0)

    def test_covariance_risk_contributions_sum(self):
        weights=[0.6,0.4]
        cov=[[0.04,0.005],[0.005,0.01]]
        result=portfolio_risk_contributions(weights,cov)
        self.assertAlmostEqual(sum(result["contributions"]),result["volatility"])
        self.assertAlmostEqual(sum(result["shares"]),1.0)
        with self.assertRaises(ValueError):portfolio_risk_contributions([0.5,0.4],cov)
        # Positive portfolio variance alone does not make an indefinite matrix valid.
        with self.assertRaises(ValueError):
            portfolio_risk_contributions([0.5,0.5],[[1.0,2.0],[2.0,1.0]])
        # Singular positive-semidefinite covariance is valid when portfolio variance is positive.
        singular=portfolio_risk_contributions([0.5,0.5],[[0.04,0.0],[0.0,0.0]])
        self.assertGreater(singular["volatility"],0)

    def test_cross_sectional_rank_and_composite(self):
        ranks=cross_sectional_ranks({"A":1,"B":2,"C":2,"D":4})
        self.assertEqual(ranks["A"],0.0)
        self.assertEqual(ranks["B"],ranks["C"])
        self.assertEqual(ranks["D"],1.0)
        rows=[{"ticker":"A","growth":1,"vol":0.3},
              {"ticker":"B","growth":2,"vol":0.2},
              {"ticker":"C","growth":3,"vol":0.1}]
        score=composite_scores(rows,{"growth":(0.5,True),"vol":(0.5,False)})
        self.assertGreater(score["C"],score["A"])
        with self.assertRaises(ValueError):composite_scores(rows,{"growth":(0.2,True)})

    def test_allocation_and_turnover_caps(self):
        scores={"A":0.9,"B":0.8,"C":0.7,"D":0.6,"E":0.5,"F":0.4}
        sectors={"A":"Tech","B":"Tech","C":"Health","D":"Health","E":"Energy","F":"Energy"}
        result=allocate_capped(scores,sectors,0.25,0.4)
        self.assertTrue(all(w<=0.25+1e-9 for w in result["weights"].values()))
        for sector in set(sectors.values()):
            self.assertLessEqual(sum(result["weights"][t] for t in sectors if sectors[t]==sector),0.4+1e-9)
        self.assertLessEqual(sum(result["weights"].values()),1.0+1e-9)
        current={"A":0.5,"B":0.5}
        target={"A":0.0,"B":1.0}
        limited=limit_one_way_turnover(current,target,0.1)
        self.assertAlmostEqual(0.5*(abs(limited["A"]-0.5)+abs(limited["B"]-0.5)),0.1)
        self.assertAlmostEqual(sum(limited.values()),1.0)
        with self.assertRaises(ValueError):
            limit_one_way_turnover({"A":0.5},{"A":0.4},0.1)

    def test_cost_and_drawdown(self):
        self.assertAlmostEqual(net_return(0.08,1.0,20),0.078)
        self.assertAlmostEqual(max_drawdown([0.1,-0.2,0.05]),-0.2)
        with self.assertRaises(ValueError):max_drawdown([0.1,-1.0])

    def test_brinson_fachler_attribution_reconciles(self):
        result=brinson_fachler_attribution(
            {"Tech":0.60,"Health":0.40},
            {"Tech":0.50,"Health":0.50},
            {"Tech":0.12,"Health":0.05},
            {"Tech":0.10,"Health":0.04},
        )
        self.assertAlmostEqual(result["totals"]["total"],result["active_return"])
        self.assertAlmostEqual(result["reconciliation_error"],0.0)
        self.assertAlmostEqual(
            result["totals"]["allocation"]+result["totals"]["selection"]+
            result["totals"]["interaction"],result["active_return"])
        with self.assertRaises(ValueError):
            brinson_fachler_attribution(
                {"Tech":0.6,"Health":0.3},{"Tech":0.5,"Health":0.5},
                {"Tech":0.12,"Health":0.05},{"Tech":0.10,"Health":0.04})

    def test_risk_budget_position_size(self):
        self.assertAlmostEqual(risk_budget_weight(30,25,0.8,5,1,0.5),0.96)
        self.assertAlmostEqual(risk_budget_weight(30,25,0.8,5,1.5,0.2),1.3)
        with self.assertRaises(ValueError):risk_budget_weight(30,0,0.8,5,1,0.5)

if __name__=="__main__":unittest.main()
