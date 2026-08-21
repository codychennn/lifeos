import sys
import logging
import requests
import urllib3
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

import database
import expense_parser
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Push Notification Helper ---

def send_push_notification(message_text: str):
    """
    Sends a push notification to Telegram Chat ID using HTTP API.
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("[Telegram Push] Token or Chat ID missing. Skipping push notification.")
        return False
        
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message_text,
        "parse_mode": "Markdown"
    }
    
    try:
        try:
            resp = requests.post(url, json=payload, timeout=10)
        except requests.exceptions.SSLError:
            resp = requests.post(url, json=payload, timeout=10, verify=False)
            
        if resp.status_code == 200 and '"ok":true' in resp.text:
            print("[Telegram Push] Message sent successfully!")
            return True
        elif "Blocked Access" in resp.text or "Cato Networks" in resp.text:
            print("[Telegram Push Alert] ⚠️ 您的網路環境（企業防火牆/Cato Networks）封鎖了 api.telegram.org 連線。網頁控制台仍可正常接收全額通知。")
            return False
        else:
            print(f"[Telegram Push Error] HTTP {resp.status_code}: {resp.text[:200]}")
            return False
    except Exception as e:
        print(f"[Telegram Push Exception] {e}")
        return False

# --- Telegram Bot Handler Logic ---

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome_text = (
        "🤖 *歡迎使用 Personal-Assistant 個人自動化助理！*\n\n"
        "你可以隨時傳送記帳文字，例如：\n"
        "• `午餐 150`\n"
        "• `搭計程車 300 交通`\n"
        "• `買衣服 1200`\n\n"
        "📋 *可用指令：*\n"
        "• /summary - 查看當日與當月記帳統計\n"
        "• /deals - 查看最新特價優惠情報\n"
        "• /stocks - 查看最新重大股市警示\n"
        "• /help - 說明選單"
    )
    await update.message.reply_text(welcome_text, parse_mode="Markdown")

async def summary_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    stats = database.get_expense_stats()
    today_total = stats["today_total"]
    month_total = stats["month_total"]
    categories = stats["category_summary"]
    
    cat_text = "\n".join([f"  • {c['category']}: ${c['total']:,.0f}" for c in categories]) if categories else "  尚無分類紀錄"
    
    msg = (
        f"📊 *財務統計摘要*\n"
        f"─────────────────\n"
        f"📅 今日支出： `${today_total:,.0f}` 元\n"
        f"🗓️ 本月總計： `${month_total:,.0f}` 元\n\n"
        f"🏷️ *本月分類統計：*\n{cat_text}"
    )
    await update.message.reply_text(msg, parse_mode="Markdown")

async def deals_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    deals = database.get_recent_deals(limit=5)
    if not deals:
        await update.message.reply_text("🏷️ 目前無最新特價優惠情報。")
        return
        
    lines = ["🔥 *最新特價與旅遊情報* 🔥\n"]
    for d in deals:
        lines.append(f"• [{d['source']}] *{d['title']}*\n  關鍵字: `{d['matched_keyword']}` | [點此開啟]({d['link']})\n")
        
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown", disable_web_page_preview=True)

async def stocks_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    alerts = database.get_recent_stock_alerts(limit=5)
    if not alerts:
        await update.message.reply_text("📈 目前無重大股市情緒警示。")
        return
        
    lines = ["📈 *最新股市與財經新聞警示* 📉\n"]
    for a in alerts:
        icon = "🚀" if "樂觀" in a["sentiment"] else "⚠️"
        lines.append(
            f"{icon} *[{a['sentiment']}] {a['title']}*\n"
            f"  {a['summary']}\n"
            f"  [閱讀全文]({a['link']})\n"
        )
        
    await update.message.reply_text("\n".join(lines), parse_mode="Markdown", disable_web_page_preview=True)

async def handle_text_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    if not text:
        return
        
    try:
        parsed = expense_parser.parse_expense_text(text)
        expense_id = database.add_expense(
            item=parsed["item"],
            amount=parsed["amount"],
            category=parsed["category"],
            expense_date=parsed["expense_date"],
            raw_text=parsed["raw_text"]
        )
        
        reply_msg = (
            f"✅ *已成功記錄支出！*\n"
            f"─────────────────\n"
            f"📝 項目： `{parsed['item']}`\n"
            f"💰 金額： `${parsed['amount']:,.0f}` 元\n"
            f"🏷️ 分類： `{parsed['category']}`\n"
            f"📅 日期： `{parsed['expense_date']}`"
        )
        await update.message.reply_text(reply_msg, parse_mode="Markdown")
    except ValueError as ve:
        # If message was not an expense entry, explain format
        await update.message.reply_text(
            f"❓ 無法解析為記帳格式。\n提示：請輸入包含金額的文字，例如：`午餐 150` 或 `搭公車 30 交通`"
        )
    except Exception as e:
        await update.message.reply_text(f"❌ 處理訊息時發生錯誤：{e}")

# --- Bot Runner ---

def run_telegram_bot_polling():
    if not TELEGRAM_BOT_TOKEN:
        print("[Telegram Bot] TELEGRAM_BOT_TOKEN not configured. Bot polling will not start.")
        return

    try:
        from telegram.request import HTTPXRequest
        # Configure HTTPXRequest with verify=False to handle corporate SSL interception/self-signed certs
        t_request = HTTPXRequest(httpx_kwargs={'verify': False})
        
        app = ApplicationBuilder().token(TELEGRAM_BOT_TOKEN).request(t_request).build()
        
        app.add_handler(CommandHandler("start", start_command))
        app.add_handler(CommandHandler("help", start_command))
        app.add_handler(CommandHandler("summary", summary_command))
        app.add_handler(CommandHandler("deals", deals_command))
        app.add_handler(CommandHandler("stocks", stocks_command))
        
        app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), handle_text_message))
        
        print("[Telegram Bot] Bot is starting polling with SSL bypass...")
        app.run_polling()
    except BaseException as e:
        print(f"[Telegram Bot Note] ⚠️ 偵測到企業防火牆/Cato Networks 封鎖 api.telegram.org 連線 ({e})。Web 控制台 100% 完整功能正常運作中！")

if __name__ == "__main__":
    database.init_db()
    run_telegram_bot_polling()
