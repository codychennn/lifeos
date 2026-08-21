import os
from dotenv import load_dotenv

# Load environment variables from .env file if available
load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Database Configuration
DB_PATH = os.path.join(BASE_DIR, "personal_assistant.db")

# Flask Web Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "personal_assistant_secret_key_2026")
PORT = int(os.getenv("PORT", 5000))
HOST = os.getenv("HOST", "127.0.0.1")

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# Crawler & RSS Feeds Configuration (Includes Flight & Hotel Target Sources)
DEAL_RSS_FEEDS = [
    {
        "name": "PTT 省錢板 (Lifeismoney)",
        "url": "https://www.ptt.cc/atom/Lifeismoney.xml"
    },
    {
        "name": "PTT 日本旅遊板 (Japan_Travel)",
        "url": "https://www.ptt.cc/atom/Japan_Travel.xml"
    },
    {
        "name": "長榮航空促銷 (EVA Air)",
        "url": "https://news.google.com/rss/search?q=%E9%95%B7%E6%A6%AE%E8%88%AA%E7%A9%BA+%E6%A9%9F%E7%A5%A8+%E7%89%B9%E5%83%B9+%E4%BF%83%E9%8A%B7&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    },
    {
        "name": "阿拉斯加航空特價 (Alaska Airlines)",
        "url": "https://news.google.com/rss/search?q=Alaska+Airlines+%E6%A9%9F%E7%A5%A8+%E7%89%B9%E5%83%B9+%E5%93%A9%E7%A8%8B&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    },
    {
        "name": "Skyscanner 便宜機票追蹤",
        "url": "https://news.google.com/rss/search?q=Skyscanner+%E6%A9%9F%E7%A5%A8+%E7%89%B9%E5%83%B9+%E4%BF%83%E9%8A%B7&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    },
    {
        "name": "Trip.com 優惠促銷",
        "url": "https://news.google.com/rss/search?q=Trip.com+%E6%A9%9F%E7%A5%A8+%E9%A3%AF%E5%BA%97+%E5%84%AA%E6%83%A0&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    },
    {
        "name": "Agoda 飯店折扣碼",
        "url": "https://news.google.com/rss/search?q=Agoda+%E9%A3%AF%E5%BA%97+%E6%8A%98%E6%89%A3%E7%A2%BC+%E4%BF%83%E9%8A%B7&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    },
    {
        "name": "機票促銷情報 (Flight Deals)",
        "url": "https://news.google.com/rss/search?q=%E6%A9%9F%E7%A5%A8%E7%89%B9%E5%83%B9+%E6%B8%A5%E9%A0%AD%E7%A5%A8+%E8%88%AA%E7%A9%BA%E4%BF%83%E9%8A%B7&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    }
]

DEAL_KEYWORDS = [
    "特價", "優惠", "折扣", "機票", "飯店", "住宿", "促銷", "買一送一", "0元", "便宜", "省錢", "免運",
    "長榮", "長榮航空", "EVA Air", "阿拉斯加", "阿拉斯加航空", "Alaska", "Skyscanner", "Trip.com", "Agoda",
    "哩程", "閃購", "早鳥", "票價", "機加酒", "折扣碼", "清艙"
]

# Stock News & Sentiment Analysis Configuration (Separated by US & TW markets)
US_STOCK_FEEDS = [
    {
        "name": "The Wall Street Journal (WSJ 華爾街日報)",
        "url": "https://feeds.a.dj.com/rss/RSSMarketsMain.xml"
    },
    {
        "name": "WSJ Markets - US Stock News",
        "url": "https://news.google.com/rss/search?q=site:wsj.com+US+stock+market+finance&hl=en-US&gl=US&ceid=US:en"
    },
    {
        "name": "CNBC Markets (美股頭條)",
        "url": "https://search.cnbc.com/rs/search/combinedradios/search.xml?partnerId=2000&keywords=US%20Stock%20Market"
    },
    {
        "name": "Google 新聞 - 美股焦點 (NVDA / TSLA / AAPL)",
        "url": "https://news.google.com/rss/search?q=%E7%BE%8E%E8%82%A1+%E8%BC%9D%E9%81%94+Tesla+%E8%98%8B%E6%9E%9C+%E8%B2%A1%E5%A0%B1+%E5%A4%A7%E6%B7%B9&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    },
    {
        "name": "Yahoo Finance US Top Stories",
        "url": "https://news.google.com/rss/search?q=site:finance.yahoo.com+US+stocks+earnings+market&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    }
]

TW_STOCK_FEEDS = [
    {
        "name": "鉅亨網 - 台股頭條",
        "url": "https://news.cnyes.com/news/rss/tw_stock"
    },
    {
        "name": "Google 新聞 - 台股與台積電 (2330 / 2317)",
        "url": "https://news.google.com/rss/search?q=%E5%8F%B0%E8%82%A1+%E5%8F%B0%E7%A9%8D%E9%9B%BB+%E9%B4%BB%E6%B5%B7+%E8%B2%A1%E5%A0%B1+%E5%A4%A7%E6%B7%B9&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    },
    {
        "name": "經濟日報 - 證券焦點",
        "url": "https://news.google.com/rss/search?q=%E7%B6%93%E6%BF%9F%E6%97%A5%E5%A0%B1+%E5%8F%B0%E8%82%A1+%E5%8A%A0%E6%AC%8A%E6%8C%87%E6%95%B8&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
    }
]

# Combined fallback
NEWS_RSS_FEEDS = US_STOCK_FEEDS + TW_STOCK_FEEDS

# Jewish Business & News Configuration (猶太人智庫與重點新聞)
JEWISH_NEWS_FEEDS = [
    {
        "name": "Jerusalem Post - Business & Innovation",
        "url": "https://news.google.com/rss/search?q=Jerusalem+Post+Business+Tech+Economy&hl=en-US&gl=US&ceid=US:en"
    },
    {
        "name": "Times of Israel - Tech & Finance",
        "url": "https://news.google.com/rss/search?q=Times+of+Israel+Tech+Startups+Finance&hl=en-US&gl=US&ceid=US:en"
    },
    {
        "name": "Jewish Business News",
        "url": "https://news.google.com/rss/search?q=Jewish+Business+News+Economy+Investment&hl=en-US&gl=US&ceid=US:en"
    }
]

# Sentiment Lexicon & Keywords
BULLISH_KEYWORDS = [
    "大漲", "飆漲", "創新高", "財報亮眼", "營收暴增", "看好", "利多", "買超", 
    "擴產", "獲利大增", "翻倍", "漲停", "強勁", "目標價上調", "優於預期"
]

BEARISH_KEYWORDS = [
    "大跌", "暴跌", "創新低", "虧損", "利空", "賣超", "裁員", "違約", 
    "警訊", "跌停", "衰退", "降評", "下修", "震撼彈", "慘澹", "低於預期"
]

# Real-Time Crawler Schedule Intervals (User High-Frequency Scanning Directive)
TRAVEL_DEALS_INTERVAL_MINUTES = 30   # 旅遊特價與機票航班：每 30 分鐘超快速全網掃描一次
FINANCE_NEWS_INTERVAL_MINUTES = 30   # 各類財經新聞與美股/台股情緒：每 30 分鐘即時掃描更新一次
JEWISH_NEWS_INTERVAL_MINUTES = 30    # 猶太重點新聞與商道翻譯：每 30 分鐘即時更新一次
DAILY_SUMMARY_HOUR = 21              # 21:00 定時推送每日財務與行情摘要

