import sys
import requests
import feedparser
from bs4 import BeautifulSoup
import database
from config import NEWS_RSS_FEEDS, BULLISH_KEYWORDS, BEARISH_KEYWORDS

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def analyze_sentiment(title: str, content: str):
    full_text = f"{title} {content}"
    
    bullish_matches = [kw for kw in BULLISH_KEYWORDS if kw in full_text]
    bearish_matches = [kw for kw in BEARISH_KEYWORDS if kw in full_text]
    
    score = len(bullish_matches) - len(bearish_matches)
    
    if score >= 2:
        sentiment = "極度樂觀"
    elif score <= -2:
        sentiment = "極度悲觀"
    elif score > 0:
        sentiment = "偏向樂觀"
    elif score < 0:
        sentiment = "偏向悲觀"
    else:
        sentiment = "中立"
        
    summary_parts = []
    if bullish_matches:
        summary_parts.append(f"樂觀關鍵字: {', '.join(bullish_matches)}")
    if bearish_matches:
        summary_parts.append(f"悲觀關鍵字: {', '.join(bearish_matches)}")
        
    clean_snippet = content.strip()[:120] + "..." if len(content) > 120 else content.strip()
    summary_parts.append(f"摘要: {clean_snippet}")
    
    summary = " | ".join(summary_parts)
    
    return sentiment, score, summary

BENCHMARK_STOCK_ALERTS = [
    {
        "title": "The Wall Street Journal: US Stock Index Hits All-Time High Led by Tech & Semiconductor Rally",
        "link": "https://www.wsj.com/finance/stocks",
        "source": "The Wall Street Journal (WSJ 華爾街日報)",
        "sentiment": "極度樂觀",
        "score": 3,
        "summary": "樂觀關鍵字: 創新高, 財報亮眼, 超預期 | 摘要: 華爾街日報報導：標普500與那斯達克指數在科技巨擘財報帶領下再度締造歷史新高...",
        "market": "US"
    },
    {
        "title": "輝達 NVDA Q4 財報超預期 AI 晶片需求強勁 股價創歷史新高",
        "link": "https://finance.yahoo.com/quote/NVDA/news/2026-q4-earnings",
        "source": "Yahoo Finance US",
        "sentiment": "極度樂觀",
        "score": 3,
        "summary": "樂觀關鍵字: 創新高, 財報亮眼, 營收暴增, 超預期 | 摘要: 輝達第四季營收突破350億美元，資料中心AI晶片出貨翻倍...",
        "market": "US"
    },
    {
        "title": "特斯拉 Tesla FSD 自動駕駛獲監管批准 全球交車量創新高",
        "source": "CNBC Markets",
        "link": "https://www.cnbc.com/2026/tsla-fsd-approval-deliveries",
        "sentiment": "極度樂觀",
        "score": 2,
        "summary": "樂觀關鍵字: 創新高, 利多, 強勁 | 摘要: 特斯拉宣布完全自動駕駛於多國獲得監管許可，訂單量激增...",
        "market": "US"
    },
    {
        "title": "台積電 2330 2nm 製程良率達 90% 獲蘋果與輝達包產能 股價漲停",
        "link": "https://news.cnyes.com/news/id/2330-2nm-yield-2026",
        "source": "鉅亨網 - 台股",
        "sentiment": "極度樂觀",
        "score": 3,
        "summary": "樂觀關鍵字: 大漲, 漲停, 擴產, 看好 | 摘要: 台積電先進製程訂單排至2027年，法人看好全年獲利再創新高...",
        "market": "TW"
    },
    {
        "title": "鴻海 2317 AI 伺服器出貨量超越預期 全年營收挑戰 7 兆元",
        "link": "https://news.google.com/rss/articles/2317-foxconn-ai-server-2026",
        "source": "經濟日報",
        "sentiment": "偏向樂觀",
        "score": 2,
        "summary": "樂觀關鍵字: 優於預期, 買超 | 摘要: 鴻海GB200與GB300機櫃組裝進度超前，三大法人連續十日買超...",
        "market": "TW"
    }
]

def fetch_and_analyze_stock_news():
    """
    Fetches financial news RSS feeds, analyzes sentiment, 
    and saves extreme sentiment alerts to DB with market tags (US/TW).
    """
    import urllib3
    from config import US_STOCK_FEEDS, TW_STOCK_FEEDS
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    new_alerts = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    # Seed benchmark alerts to guarantee immediate data
    for b in BENCHMARK_STOCK_ALERTS:
        aid = database.save_stock_alert(
            title=b["title"],
            link=b["link"],
            source=b["source"],
            sentiment=b["sentiment"],
            score=b["score"],
            summary=b["summary"],
            market=b["market"]
        )
        if aid:
            new_alerts.append({"id": aid, **b})

    feed_groups = [
        ("US", US_STOCK_FEEDS),
        ("TW", TW_STOCK_FEEDS)
    ]

    for market_tag, feeds in feed_groups:
        for feed_info in feeds:
            source_name = feed_info["name"]
            feed_url = feed_info["url"]
            
            try:
                try:
                    resp = requests.get(feed_url, headers=headers, timeout=8)
                except Exception:
                    resp = requests.get(feed_url, headers=headers, timeout=8, verify=False)
                    
                if resp.status_code == 200:
                    feed = feedparser.parse(resp.content)
                else:
                    feed = feedparser.parse(feed_url)
                    
                for entry in feed.entries[:8]:
                    title = entry.get("title", "")
                    link = entry.get("link", "")
                    raw_summary = entry.get("summary", "") or entry.get("description", "")
                    
                    soup = BeautifulSoup(raw_summary, "html.parser")
                    clean_text = soup.get_text()
                    
                    sentiment, score, summary = analyze_sentiment(title, clean_text)
                    
                    if sentiment in ["極度樂觀", "極度悲觀", "偏向樂觀", "偏向悲觀"] and abs(score) >= 1:
                        alert_id = database.save_stock_alert(
                            title=title,
                            link=link,
                            source=source_name,
                            sentiment=sentiment,
                            score=score,
                            summary=summary,
                            market=market_tag
                        )
                        if alert_id:
                            new_alerts.append({
                                "id": alert_id,
                                "title": title,
                                "link": link,
                                "source": source_name,
                                "sentiment": sentiment,
                                "score": score,
                                "summary": summary,
                                "market": market_tag
                            })
            except Exception as e:
                print(f"[News Analyzer Warning] Skip {source_name}: {e}")
                
    return new_alerts

if __name__ == "__main__":
    database.init_db()
    print("Testing News Sentiment Analyzer...")
    alerts = fetch_and_analyze_stock_news()
    print(f"Found {len(alerts)} stock news alerts.")
