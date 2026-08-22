import sys
import logging
from apscheduler.schedulers.background import BackgroundScheduler

import database
import deal_crawler
import news_analyzer
import jewish_analyzer
import telegram_notifier
from config import (
    TRAVEL_DEALS_INTERVAL_MINUTES, 
    FINANCE_NEWS_INTERVAL_MINUTES, 
    JEWISH_NEWS_INTERVAL_MINUTES, 
    DAILY_SUMMARY_HOUR,
    EMERGENCY_KEYWORDS
)

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def is_emergency_news(title: str, summary: str):
    """
    Checks if news contains Trump or International War / Geopolitical Conflict keywords for immediate real-time push.
    """
    text = f"{title} {summary}"
    for kw in EMERGENCY_KEYWORDS:
        if kw.lower() in text.lower():
            return True
    return False

def job_crawl_deals():
    """
    Crawls travel discount deals & flight tickets (Runs every 12 hours).
    Pushes unsent alerts to Telegram.
    """
    print("[Scheduler ✈️ 12h] Running travel deals & flight ticket crawler job (12-hour cycle)...")
    try:
        new_deals = deal_crawler.fetch_and_process_deals()
        unnotified = database.get_recent_deals(limit=10, unnotified_only=True)
        if unnotified:
            print(f"[Scheduler ✈️ 12h] Found {len(unnotified)} travel deals to push.")
            msg_lines = ["✈️ *【最新機票航班與旅遊促銷彙整 (12小時定時推播)】* 🔥\n"]
            ids_to_mark = []
            for d in unnotified:
                msg_lines.append(f"• [{d['source']}] *{d['title']}*\n  關鍵字: `{d['matched_keyword']}` | [點此連結]({d['link']})")
                ids_to_mark.append(d["id"])
                
            pushed = telegram_notifier.send_push_notification("\n\n".join(msg_lines))
            if pushed:
                database.mark_deals_notified(ids_to_mark)
    except Exception as e:
        print(f"[Scheduler Error - Deal Crawler] {e}")

def job_analyze_news():
    """
    Analyzes stock news sentiment for US & TW markets (Runs every 3 hours).
    Immediately pushes Trump/War emergency news, and batches routine news every 3 hours.
    """
    print("[Scheduler 📈 3h] Running stock & financial news sentiment analysis job (3-hour cycle)...")
    try:
        new_alerts = news_analyzer.fetch_and_analyze_stock_news()
        unnotified = database.get_recent_stock_alerts(limit=20, unnotified_only=True)
        
        if unnotified:
            emergency_items = []
            routine_items = []
            
            for a in unnotified:
                if is_emergency_news(a["title"], a.get("summary", "")):
                    emergency_items.append(a)
                else:
                    routine_items.append(a)
                    
            # 1. Real-Time Emergency Push (Trump or International War / Geopolitics)
            if emergency_items:
                print(f"[Scheduler 🚨 EMERGENCY] Pushing {len(emergency_items)} Trump/War real-time emergency alerts!")
                emerg_lines = ["🚨 *【川普與國際戰爭地緣政治 - 突發即時緊急推播】* 🚨\n"]
                ids_to_mark = []
                for a in emergency_items:
                    icon = "💥" if "悲觀" in a["sentiment"] else "🏛️"
                    emerg_lines.append(
                        f"{icon} *[{a['sentiment']}] {a['title']}*\n"
                        f"  {a['summary']}\n"
                        f"  [閱讀全文]({a['link']})"
                    )
                    ids_to_mark.append(a["id"])
                pushed = telegram_notifier.send_push_notification("\n\n".join(emerg_lines))
                if pushed:
                    database.mark_stock_alerts_notified(ids_to_mark)

            # 2. Routine 3-Hour Batch Push
            if routine_items:
                print(f"[Scheduler ⏱️ 3h Batch] Pushing {len(routine_items)} routine stock sentiment alerts.")
                routine_lines = ["📈 *【美股/台股財經新聞與情緒分析 (3小時定時掃描)】* 📉\n"]
                ids_to_mark = []
                for a in routine_items[:10]:
                    icon = "🚀" if "樂觀" in a["sentiment"] else "⚠️"
                    routine_lines.append(
                        f"{icon} *[{a['sentiment']}] {a['title']}*\n"
                        f"  {a['summary']}\n"
                        f"  [閱讀全文]({a['link']})"
                    )
                    ids_to_mark.append(a["id"])
                pushed = telegram_notifier.send_push_notification("\n\n".join(routine_lines))
                if pushed:
                    database.mark_stock_alerts_notified(ids_to_mark)

    except Exception as e:
        print(f"[Scheduler Error - News Analyzer] {e}")

def job_crawl_jewish_news():
    """
    Crawls and analyzes Jewish business & tech insights (Runs every 3 hours).
    """
    print("[Scheduler ⏱️ 3h] Running Jewish news & business insights crawler job...")
    try:
        new_items = jewish_analyzer.fetch_and_analyze_jewish_news()
        if new_items:
            print(f"[Scheduler ⏱️ 3h] Found {len(new_items)} new Jewish news items.")
    except Exception as e:
        print(f"[Scheduler Error - Jewish Analyzer] {e}")

def job_daily_summary():
    """
    Pushes daily digest at designated hour (e.g. 21:00).
    """
    print("[Scheduler] Running daily summary job...")
    try:
        stats = database.get_expense_stats()
        today_total = stats["today_total"]
        month_total = stats["month_total"]
        categories = stats["category_summary"]
        
        cat_text = "\n".join([f"  • {c['category']}: ${c['total']:,.0f}" for c in categories]) if categories else "  尚無分類紀錄"
        
        digest_msg = (
            f"🌙 *【Personal Assistant 每日定時摘要報告】*\n"
            f"─────────────────\n"
            f"📊 *本日財務狀況：*\n"
            f"• 今日消費： `${today_total:,.0f}` 元\n"
            f"• 本月累計： `${month_total:,.0f}` 元\n\n"
            f"🏷️ *本月支出分類：*\n{cat_text}\n\n"
            f"💡 提醒：您可以直接回覆文字如 `晚餐 180` 快速記帳！"
        )
        telegram_notifier.send_push_notification(digest_msg)
    except Exception as e:
        print(f"[Scheduler Error - Daily Summary] {e}")

def job_monitor_flight_alerts():
    """
    Monitors flight price alerts and pushes Telegram notification when target price is met or when an Error Fare is detected (Runs every 4 hours).
    """
    print("[Scheduler ✈️ 4h] Running Smart Flight Search price alert monitor job...")
    try:
        import flight_engine
        alerts = database.get_flight_alerts(active_only=True)
        for alert in alerts:
            results = flight_engine.search_smart_flights(
                origin=alert['origin'],
                destination=alert['destination'],
                depart_date=alert.get('depart_date'),
                return_date=alert.get('return_date')
            )
            if results:
                lowest = results[0]
                price = lowest['price_roundtrip']
                if price <= alert['target_price']:
                    msg = (
                        f"✈️ *【智能機票降價警報觸發！】*\n\n"
                        f"• 航線：`{alert['origin']}` ➔ `{alert['destination']}`\n"
                        f"• 目前全網最低價： *NT$ {price:,.0f}*\n"
                        f"• 您的目標設定價： *NT$ {alert['target_price']:,.0f}*\n"
                        f"• 推薦航司： {lowest['airline']}\n"
                        f"• 行李規範： {lowest['baggage_desc']}\n"
                        f"• 節省金額： *省下 NT$ {alert['target_price'] - price:,.0f}*\n\n"
                        f"👉 [立即一鍵開票預訂]({lowest['booking_link']})"
                    )
                    telegram_notifier.send_push_notification(msg)
                    database.mark_flight_alert_triggered(alert['id'])
    except Exception as e:
        print(f"[Scheduler Error - Flight Alerts] {e}")

def job_check_ma30_signals():
    """
    Monitors 30-day Moving Average (MA30) dip signals for Crypto & US Stocks (Runs every 1 hour).
    """
    print("[Scheduler 📈 1h] Checking TradingView Crypto & Stock 30-day MA30 buy signals...")
    try:
        import tradingview_engine
        tradingview_engine.push_ma30_buy_alerts()
    except Exception as e:
        print(f"[Scheduler Error - MA30 Signals] {e}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    # 1. Travel Deals & Flight Tickets (Every 12 Hours = 720 Minutes)
    scheduler.add_job(job_crawl_deals, 'interval', minutes=TRAVEL_DEALS_INTERVAL_MINUTES, id='deal_job')
    
    # 2. Finance & Stock Market News (Every 3 Hours = 180 Minutes)
    scheduler.add_job(job_analyze_news, 'interval', minutes=FINANCE_NEWS_INTERVAL_MINUTES, id='news_job')
    
    # 3. Jewish Business News & Insights (Every 3 Hours = 180 Minutes)
    scheduler.add_job(job_crawl_jewish_news, 'interval', minutes=JEWISH_NEWS_INTERVAL_MINUTES, id='jewish_job')
    
    # 4. Smart Flight Price Alerts (Every 4 Hours = 240 Minutes)
    scheduler.add_job(job_monitor_flight_alerts, 'interval', minutes=240, id='flight_job')

    # 5. TradingView MA30 Retracement Buy Signals (Every 1 Hour = 60 Minutes)
    scheduler.add_job(job_check_ma30_signals, 'interval', minutes=60, id='ma30_job')

    # Daily summary cron job (21:00)
    scheduler.add_job(job_daily_summary, 'cron', hour=DAILY_SUMMARY_HOUR, minute=0, id='summary_job')
    
    scheduler.start()
    print(f"[Scheduler 🚀] Started: Travel Deals (Every {TRAVEL_DEALS_INTERVAL_MINUTES//60}h), Finance News (Every {FINANCE_NEWS_INTERVAL_MINUTES//60}h), Jewish News (Every {JEWISH_NEWS_INTERVAL_MINUTES//60}h), Flight Alerts (Every 4h), TradingView MA30 Radar (Every 1h). Emergency Trump/War news pushed in real-time!")
    
    return scheduler

if __name__ == "__main__":
    database.init_db()
    sched = start_scheduler()
    print("Scheduler running. Press Ctrl+C to stop.")
    import time
    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        sched.shutdown()
