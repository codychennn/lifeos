import sys
import threading
import database
import scheduler
import telegram_notifier
from config import TELEGRAM_BOT_TOKEN, PORT, HOST
from app import app

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=" * 60)
    print("🚀 啟動 Personal-Assistant 自動化資訊與記帳整合系統...")
    print("=" * 60)

    # 1. Initialize SQLite Database
    print("[Init] 正在初始化 SQLite 資料庫...")
    database.init_db()
    print("[Init] 資料庫初始化完成！")

    # 2. Start Background Scheduler (Deal crawler, Stock News, Daily digest)
    print("[Scheduler] 啟動背景排程任務...")
    sched = scheduler.start_scheduler()

    # 3. Start Telegram Bot Polling (if token exists) in background thread
    if TELEGRAM_BOT_TOKEN:
        print("[Telegram Bot] 偵測到 Telegram Bot Token，啟動 Bot 監聽線程...")
        bot_thread = threading.Thread(target=telegram_notifier.run_telegram_bot_polling, daemon=True)
        bot_thread.start()
    else:
        print("[Telegram Bot] ⚠️ 未偵測到 TELEGRAM_BOT_TOKEN (請在 .env 或 config.py 中設定即可啟用 Telegram 記帳與推播)。")

    # 4. Start Flask Web Server
    print(f"\n🌐 Web 控制台服務已啟動！請開啟瀏覽器存取: http://{HOST}:{PORT}\n")
    try:
        app.run(host=HOST, port=PORT, debug=False, use_reloader=False)
    except (KeyboardInterrupt, SystemExit):
        print("\n系統正常關閉中...")
        sched.shutdown()

if __name__ == "__main__":
    main()
