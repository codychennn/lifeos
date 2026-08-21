import sys
import requests
import feedparser
from bs4 import BeautifulSoup
import database
from config import DEAL_RSS_FEEDS, DEAL_KEYWORDS

# Ensure UTF-8 output handling
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def fetch_and_process_deals():
    """
    Crawls RSS feeds for flight, hotel, and shopping deals matching target keywords.
    Saves new deal items to SQLite database.
    Returns list of newly added deal dictionaries.
    """
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    new_deals = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    for feed_info in DEAL_RSS_FEEDS:
        source_name = feed_info["name"]
        feed_url = feed_info["url"]
        
        try:
            try:
                resp = requests.get(feed_url, headers=headers, timeout=10)
            except requests.exceptions.SSLError:
                resp = requests.get(feed_url, headers=headers, timeout=10, verify=False)

            if resp.status_code == 200:
                feed = feedparser.parse(resp.content)
            else:
                feed = feedparser.parse(feed_url)
                
            for entry in feed.entries:
                title = entry.get("title", "")
                link = entry.get("link", "")
                summary = entry.get("summary", "") or entry.get("description", "")
                
                soup = BeautifulSoup(summary, "html.parser")
                clean_summary = soup.get_text()
                full_text = f"{title} {clean_summary}"
                
                matched_kw = None
                for kw in DEAL_KEYWORDS:
                    if kw in full_text:
                        matched_kw = kw
                        break
                        
                if matched_kw:
                    deal_id = database.save_deal_alert(
                        title=title,
                        link=link,
                        source=source_name,
                        matched_keyword=matched_kw
                    )
                    if deal_id:
                        new_deals.append({
                            "id": deal_id,
                            "title": title,
                            "link": link,
                            "source": source_name,
                            "matched_keyword": matched_kw
                        })
        except Exception as e:
            print(f"[Deal Crawler Error] Failed fetching feed {source_name}: {e}")
            
    return new_deals

if __name__ == "__main__":
    database.init_db()
    print("Testing Deal Crawler...")
    deals = fetch_and_process_deals()
    print(f"Found {len(deals)} new deal alerts.")
    for d in deals[:5]:
        print(f"- [{d['source']}] ({d['matched_keyword']}) {d['title']}")
