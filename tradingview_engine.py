import sys
import random
from datetime import datetime
import database
import telegram_notifier

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 追蹤的熱門標的清單 (加密貨幣 + 美股)
WATCHLIST = [
    {"symbol": "BTCUSD", "name": "Bitcoin 比特幣", "type": "CRYPTO", "current_price": 96450, "ma30": 95800, "change_pct": -2.4, "high30": 102000},
    {"symbol": "ETHUSD", "name": "Ethereum 以太坊", "type": "CRYPTO", "current_price": 2780, "ma30": 2850, "change_pct": -4.2, "high30": 3200},
    {"symbol": "SOLUSD", "name": "Solana 索拉納", "type": "CRYPTO", "current_price": 195, "ma30": 198, "change_pct": -5.1, "high30": 235},
    {"symbol": "NVDA", "name": "NVIDIA 輝達", "type": "STOCK", "current_price": 128.5, "ma30": 131.0, "change_pct": -6.2, "high30": 140.8},
    {"symbol": "AAPL", "name": "Apple 蘋果", "type": "STOCK", "current_price": 224.0, "ma30": 222.5, "change_pct": -1.2, "high30": 236.0},
    {"symbol": "TSLA", "name": "Tesla 特斯拉", "type": "STOCK", "current_price": 212.0, "ma30": 218.0, "change_pct": -5.5, "high30": 265.0},
    {"symbol": "SPY", "name": "S&P 500 ETF", "type": "STOCK", "current_price": 558.0, "ma30": 555.0, "change_pct": -0.8, "high30": 570.0},
    {"symbol": "QQQ", "name": "Nasdaq 100 ETF", "type": "STOCK", "current_price": 482.0, "ma30": 488.0, "change_pct": -3.8, "high30": 505.0}
]

def check_ma30_retracement_signals():
    """
    掃描 30 日均線 (MA30) 回檔抄底買點
    當標的價格因重大事件回檔觸及或低於 30 日均線 (Price <= MA30 或跌幅 >= 5%) 時發送 Telegram 通報
    """
    signals = []
    for item in WATCHLIST:
        price = item["current_price"]
        ma30 = item["ma30"]
        high30 = item["high30"]
        
        # 回檔計算
        retracement_pct = round(((high30 - price) / high30) * 100, 1)
        is_below_ma30 = price <= ma30
        is_major_dip = retracement_pct >= 5.0
        
        # 當符合抄底條件
        if is_below_ma30 or is_major_dip:
            sig = {
                "symbol": item["symbol"],
                "name": item["name"],
                "type": item["type"],
                "current_price": price,
                "ma30": ma30,
                "high30": high30,
                "retracement_pct": retracement_pct,
                "signal_level": "🚨 最佳抄底買點" if (is_below_ma30 and is_major_dip) else "⚡ 強勢回檔區",
                "reason": f"價格自高點回檔 {retracement_pct}%，已跌回 30 日均線 ($MA_{{30}}$: ${ma30:,.2f}) 支撐強烈！"
            }
            signals.append(sig)
            
    return signals

def push_ma30_buy_alerts():
    """
    執行 MA30 抄底訊號發送至 Telegram
    """
    signals = check_ma30_retracement_signals()
    if not signals:
        return {"status": "success", "pushed": 0, "message": "目前無觸及 MA30 均線之抄底標的"}

    pushed_count = 0
    for sig in signals:
        msg = (
            f"🚨 *【抄底進場警報 — MA30 均線回檔觸發】*\n\n"
            f"• 標的： *{sig['name']} ({sig['symbol']})*\n"
            f"• 即時價格： *${sig['current_price']:,.2f}*\n"
            f"• 30日均線 ($MA_{{30}}$)： *${sig['ma30']:,.2f}*\n"
            f"• 近30日高點： *${sig['high30']:,.2f}* (自高點回檔 `-{sig['retracement_pct']}%`)\n"
            f"• 訊號等級： *{sig['signal_level']}*\n"
            f"• 專業研判： {sig['reason']}\n\n"
            f"💡 *操作建議*：大盤/重大事件短線利空回檔，價格支撐力道強勁，建議關注分批進場布局！"
        )
        try:
            telegram_notifier.send_push_notification(msg)
            pushed_count += 1
        except Exception as e:
            print(f"[TradingView Engine Push Error] {e}")

    return {"status": "success", "pushed": pushed_count, "signals": signals}

if __name__ == "__main__":
    sigs = check_ma30_retracement_signals()
    print(f"Found {len(sigs)} MA30 buy signals:")
    for s in sigs:
        print(f" - {s['name']} (${s['current_price']}): {s['reason']}")
