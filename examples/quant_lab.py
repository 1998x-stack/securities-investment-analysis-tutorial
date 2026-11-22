#!/usr/bin/env python3
"""Deterministic OFFLINE research experiments. No brokerage connection.
Run: python3 examples/quant_lab.py
Test: python3 -m unittest discover -s examples -p 'test_*.py' -v
All records and prices are artificial. Not financial advice.
"""
from dataclasses import dataclass
from datetime import date
from math import isfinite

def point_in_time(records, decision_date: date):
    eligible=[r for r in records if r["available_at"]<=decision_date]
    if not eligible: raise ValueError("no available version")
    return max(eligible,key=lambda r:(r["fiscal_end"],r["available_at"]))

def adjusted_close(raw, factor):
    """Rebase split-adjustment factors to the most recent observation."""
    if not raw or len(raw)!=len(factor): raise ValueError("unaligned arrays")
    if any(not isfinite(x) or x<=0 for x in raw+factor):
        raise ValueError("positive finite prices and factors needed")
    return [p*f/factor[-1] for p,f in zip(raw,factor)]

def rolling_mean(values,window):
    if window<1: raise ValueError("window")
    return [sum(values[i+1-window:i+1])/window if i+1>=window else None
            for i in range(len(values))]

def next_open_backtest(closes,next_opens,window=3,fee_bps=10,slippage_bps=10):
    """Close[t] signal is executed at next_opens[t] = Open[t+1], never Close[t]."""
    if len(closes)!=len(next_opens) or len(closes)<window or window<2:
        raise ValueError("aligned history required")
    if any(not isfinite(x) or x<=0 for x in closes+next_opens):
        raise ValueError("invalid prices")
    if not isfinite(fee_bps) or not isfinite(slippage_bps) or min(fee_bps,slippage_bps)<0:
        raise ValueError("cost")
    cash,qty=1000.,0
    fills=[]
    for t,avg in enumerate(rolling_mean(closes,window)):
        if avg is None: continue
        bullish=closes[t]>avg
        price=next_opens[t]
        if bullish and qty==0:
            fill=price*(1+(fee_bps+slippage_bps)/10000)
            if cash>=fill:
                cash-=fill;qty=1;fills.append((t+1,"BUY",round(fill,4)))
        elif not bullish and qty:
            fill=price*(1-(fee_bps+slippage_bps)/10000)
            cash+=fill;qty=0;fills.append((t+1,"SELL",round(fill,4)))
    return {"cash":round(cash,4),"shares":qty,"nav":round(cash+qty*next_opens[-1],4),"fills":fills}

@dataclass
class Order:
    client_id:str
    requested:int
    filled:int=0
    state:str="ACK"

    @property
    def leaves(self): return self.requested-self.filled

class PaperBroker:
    """In-memory PAPER-ONLY broker state; never sends an external order."""
    def __init__(self): self.orders={}
    def submit(self,client_id,qty,risk_approved=False):
        if client_id in self.orders:
            old=self.orders[client_id]
            if old.requested!=qty: raise ValueError("duplicate ID with changed qty")
            return old
        if not risk_approved or not (1<=qty<=100000):
            raise ValueError("risk gate rejected")
        self.orders[client_id]=Order(client_id,qty)
        return self.orders[client_id]
    def fill(self,client_id,qty):
        o=self.orders[client_id]
        if o.state in ("FILLED","CANCELED") or qty<=0 or qty>o.leaves:
            raise ValueError("invalid fill")
        o.filled+=qty
        o.state="FILLED" if o.leaves==0 else "PARTIAL"
        return o
    def cancel(self,client_id):
        o=self.orders[client_id]
        if o.state!="FILLED": o.state="CANCELED"
        return o

if __name__=="__main__":
    assert adjusted_close([100.,50.],[1.,2.])==[50.,50.]
    prices=[100.,101.,103.,102.,99.,102.,105.]
    next_opens=[100.3,101.4,103.3,101.8,99.5,102.5,105.2]
    print("Toy next-open backtest:",next_open_backtest(prices,next_opens))
    paper=PaperBroker()
    paper.submit("PAPER-001",100,risk_approved=True)
    paper.fill("PAPER-001",40)
    paper.fill("PAPER-001",60)
    print("Paper broker final:",paper.orders["PAPER-001"])
