"""Unit tests: no data downloads, no broker API, no hidden dependencies."""
import unittest
from datetime import date
from quant_lab import point_in_time,adjusted_close,rolling_mean,next_open_backtest,PaperBroker

class QuantLabTests(unittest.TestCase):
    def test_pit_restatement(self):
        items=[{"fiscal_end":date(2026,3,31),"available_at":date(2026,4,15),"earn":80},
               {"fiscal_end":date(2026,3,31),"available_at":date(2026,5,5),"earn":75}]
        self.assertEqual(point_in_time(items,date(2026,4,30))["earn"],80)
        self.assertEqual(point_in_time(items,date(2026,5,6))["earn"],75)
        with self.assertRaises(ValueError):point_in_time(items,date(2026,4,1))
    def test_split(self):
        self.assertEqual(adjusted_close([100,50],[1,2]),[50,50])
        with self.assertRaises(ValueError):adjusted_close([100,50],[1])
    def test_warmup(self):
        self.assertEqual(rolling_mean([2,4,6,8],3),[None,None,4,6])
        with self.assertRaises(ValueError):rolling_mean([1,2],0)
    def test_next_open_execution(self):
        x=[100,101,103,102,99,102,105]
        y=[100.3,101.4,103.3,101.8,99.5,102.5,105.2]
        a=next_open_backtest(x,y)
        self.assertEqual(a["fills"][0][0],3)
        self.assertEqual(a["fills"][0][1],"BUY")
        self.assertAlmostEqual(a["fills"][0][2],y[2]*1.002,4)
        b=next_open_backtest(x,y,fee_bps=0,slippage_bps=0)
        self.assertLessEqual(a["nav"],b["nav"])
    def test_bad_prices(self):
        with self.assertRaises(ValueError):next_open_backtest([1,2,0],[1,2,3])
        with self.assertRaises(ValueError):next_open_backtest([1,2,3],[1,2,3],fee_bps=-1)
    def test_order_replay(self):
        b=PaperBroker()
        a=b.submit("abc",100,risk_approved=True)
        self.assertIs(a,b.submit("abc",100,risk_approved=True))
        with self.assertRaises(ValueError):b.submit("abc",200,risk_approved=True)
        b.fill("abc",40);self.assertEqual((a.state,a.leaves),("PARTIAL",60))
        b.fill("abc",60);self.assertEqual((a.state,a.leaves),("FILLED",0))
        with self.assertRaises(ValueError):b.fill("abc",1)
        self.assertEqual(b.cancel("abc").state,"FILLED")
    def test_risk_gate(self):
        b=PaperBroker()
        with self.assertRaises(ValueError):b.submit("bad",5)
        b.submit("abc",10,risk_approved=True);b.cancel("abc")
        with self.assertRaises(ValueError):b.fill("abc",1)
if __name__=="__main__":unittest.main()
