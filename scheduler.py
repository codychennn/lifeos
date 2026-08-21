import sys
import logging
from apscheduler.schedulers.background import BackgroundScheduler

import database
import deal_crawler
import news_analyzer
import jewish_analyzer
import telegram_notifier
from config import TRAVEL_DEALS_INTERVAL_MINUTES, FINANCE_NEWS_INTERVAL_MINUTES, JEWISH_NEWS_INTERVAL_MINUTES, DAILY_SUMMARY_HOUR

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def job_crawl_deals():
    """
    Crawls travel discount deals & flight tickets (Runs every 30 minutes).
    Pushes unsent alerts to Telegram.
    """
    print("[Scheduler ⚡ 30m] Running travel deals & flight ticket crawler job...")
    try:
        new_deals = deal_crawler.fetch_and_process_deals()
        if new_deals:
            print(f"[Scheduler ⚡ 30m] Found {len(new_deals)} new deals & flights.")
            unnotified = database.get_recent_deals(limit=10, unnotified_only=True)
            if unnotified:
                msg_lines = ["✈️ *【最新機票航班與旅遊促銷警示 (30分即時)】* 🔥\n"]
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
    Analyzes stock news sentiment for US & TW markets (Runs every 1 hour).
    Pushes unsent extreme sentiment alerts to Telegram.
    """
    print("[Scheduler ⏱️ 1h] Running stock & financial news sentiment analysis job...")
    try:
        new_alerts = news_analyzer.fetch_and_analyze_stock_news()
        if new_alerts:
            print(f"[Scheduler ⏱️ 1h] Found {len(new_alerts)} new stock sentiment alerts.")
            unnotified = database.get_recent_stock_alerts(limit=10, unnotified_only=True)
            if unnotified:
                msg_lines = ["📈 *【重大美股/台股財經新聞警示 (1小時即時)】* 📉\n"]
                ids_to_mark = []
                for a in unnotified:
                    icon = "🚀" if "樂觀" in a["sentiment"] else "⚠️"
                    msg_lines.append(
                        f"{icon} *[{a['sentiment']}] {a['title']}*\n"
                        f"  {a['summary']}\n"
                        f"  [閱讀全文]({a['link']})"
                    )
                    ids_to_mark.append(a["id"])
                    
                pushed = telegram_notifier.send_push_notification("\n\n".join(msg_lines))
                if pushed:
                    database.mark_stock_alerts_notified(ids_to_mark)
    except Exception as e:
        print(f"[Scheduler Error - News Analyzer] {e}")

def job_crawl_jewish_news():
    """
    Crawls and analyzes Jewish business & tech insights (Runs every 1 hour).
    """
    print("[Scheduler ⏱️ 1h] Running Jewish news & business insights crawler job...")
    try:
        new_items = jewish_analyzer.fetch_and_analyze_jewish_news()
        if new_items:
            print(f"[Scheduler ⏱️ 1h] Found {len(new_items)} new Jewish news items.")
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

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    # 1. Travel Deals & Flight Tickets (Every 30 Minutes)
    scheduler.add_job(job_crawl_deals, 'interval', minutes=TRAVEL_DEALS_INTERVAL_MINUTES, id='deal_job')
    
    # 2. Finance & Stock Market News (Every 1 Hour)
    scheduler.add_job(job_analyze_news, 'interval', minutes=FINANCE_NEWS_INTERVAL_MINUTES, id='news_job')
    
    # 3. Jewish Business News & Insights (Every 1 Hour)
    scheduler.add_job(job_crawl_jewish_news, 'interval', minutes=JEWISH_NEWS_INTERVAL_MINUTES, id='jewish_job')
    
    # Daily summary cron job (21:00)
    scheduler.add_job(job_daily_summary, 'cron', hour=DAILY_SUMMARY_HOUR, minute=0, id='summary_job')
    
    scheduler.start()
    print(f"[Scheduler 🚀] Started: Travel Deals & Flights (Every {TRAVEL_DEALS_INTERVAL_MINUTES}m), Finance News (Every {FINANCE_NEWS_INTERVAL_MINUTES}m), Jewish News (Every {JEWISH_NEWS_INTERVAL_MINUTES}m).")
    
    # Run initial check asynchronously in background thread so Web App starts immediately
    import threading
    t1 = threading.Thread(target=job_crawl_deals, daemon=True)
    t2 = threading.Thread(target=job_analyze_news, daemon=True)
    t3 = threading.Thread(target=job_crawl_jewish_news, daemon=True)
    t1.start()
    t2.start()
    t3.start()
    
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
