import sys
import os
import random
import sqlite3
import database

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 全球 30 大最受歡迎旅遊國家與門戶資料
TOP_30_COUNTRIES = [
    {"code": "FR", "name_zh": "法國 巴黎 (Paris)", "iata": "CDG", "flag": "🇫🇷", "airline": "長榮航空 / 法國航空 / 華航", "avg_price": "NT$ 32,000 - 42,000", "tips": "艾菲爾鐵塔、羅浮宮與米其林三星美饌首選"},
    {"code": "ES", "name_zh": "西班牙 巴塞隆納 (Barcelona)", "iata": "BCN", "flag": "🇪🇸", "airline": "阿聯酋航空 / 土耳其航空", "avg_price": "NT$ 29,000 - 38,000", "tips": "聖家堂、高第建築巡禮與 Tapas 美食"},
    {"code": "US_LAX", "name_zh": "美國 洛杉磯 (Los Angeles)", "iata": "LAX", "flag": "🇺🇸", "airline": "星宇航空 / 中華航空 / 長榮航空", "avg_price": "NT$ 26,500 - 34,000", "tips": "好萊塢影城、好萊塢地標與 MLB 觀賽"},
    {"code": "US_NYC", "name_zh": "美國 紐約 (New York)", "iata": "JFK", "flag": "🇺🇸", "airline": "長榮航空 / 中華航空", "avg_price": "NT$ 34,000 - 45,000", "tips": "時代廣場、百老匯音樂劇與自由女神"},
    {"code": "US_SEA", "name_zh": "美國 西雅圖 (Seattle)", "iata": "SEA", "flag": "🇺🇸", "airline": "長榮航空 / 星宇航空 / 達美航空", "avg_price": "NT$ 28,000 - 36,000", "tips": "派克市場、太空針塔與美西公路自駕"},
    {"code": "US_LAS", "name_zh": "美國 拉斯維加斯 (Las Vegas)", "iata": "LAS", "flag": "🇺🇸", "airline": "聯合航空 / 達美航空", "avg_price": "NT$ 31,000 - 41,000", "tips": "不夜城娛樂、大峽谷與高爾夫奢華度假"},
    {"code": "IT", "name_zh": "義大利 羅馬 (Rome)", "iata": "FCO", "flag": "🇮🇹", "airline": "中華航空 / 國泰航空", "avg_price": "NT$ 30,000 - 40,000", "tips": "競技場、梵蒂岡與義式 Gelato 人氣名店"},
    {"code": "TR", "name_zh": "土耳其 伊斯坦堡 (Istanbul)", "iata": "IST", "flag": "🇹🇷", "airline": "土耳其航空 直飛", "avg_price": "NT$ 27,000 - 35,000", "tips": "熱氣球卡帕多奇亞、藍色清真寺與跨歐亞風情"},
    {"code": "MX", "name_zh": "墨西哥 坎昆 (Cancun)", "iata": "CUN", "flag": "🇲🇽", "airline": "聯合航空 / 美國航空", "avg_price": "NT$ 36,000 - 48,000", "tips": "加勒比海全包式渡假村與瑪雅金字塔"},
    {"code": "TH_BKK", "name_zh": "泰國 曼谷 (Bangkok)", "iata": "BKK", "flag": "🇹🇭", "airline": "星宇航空 / 泰國航空 / 獅航", "avg_price": "NT$ 7,500 - 12,000", "tips": "米其林路邊攤、夜市與網美海景 SPA"},
    {"code": "TH_HKT", "name_zh": "泰國 普吉島 (Phuket)", "iata": "HKT", "flag": "🇹🇭", "airline": "亞航 / 泰獅航", "avg_price": "NT$ 8,800 - 14,000", "tips": "跳島皮皮島、懸崖餐廳與奢華海景 Villa"},
    {"code": "GB", "name_zh": "英國 倫敦 (London)", "iata": "LHR", "flag": "🇬🇧", "airline": "長榮航空 / 中華航空 / 國泰", "avg_price": "NT$ 33,000 - 44,000", "tips": "大英博物館、大笨鐘與倫敦眼英式下午茶"},
    {"code": "DE", "name_zh": "德國 慕尼黑 (Munich)", "iata": "MUC", "flag": "🇩🇪", "airline": "長榮航空 直飛", "avg_price": "NT$ 31,000 - 42,000", "tips": "啤酒節、新天鵝堡與自駕高速公路"},
    {"code": "JP_TYO", "name_zh": "日本 東京成田/羽田 (Tokyo)", "iata": "NRT", "flag": "🇯🇵", "airline": "全日空 / 日本航空 / 星宇航空", "avg_price": "NT$ 11,000 - 16,000", "tips": "晴空塔、淺草寺、澀谷 Sky 與頂級燒肉"},
    {"code": "JP_OSA", "name_zh": "日本 大阪/京都 (Osaka/Kyoto)", "iata": "KIX", "flag": "🇯🇵", "airline": "長榮航空 / 華航 / 樂桃", "avg_price": "NT$ 10,500 - 15,500", "tips": "環球影城、道頓堀、清水寺抹茶甜點"},
    {"code": "KR", "name_zh": "韓國 首爾 (Seoul)", "iata": "ICN", "flag": "🇰🇷", "airline": "韓亞航空 / 大韓航空 / 酷航", "avg_price": "NT$ 7,800 - 12,500", "tips": "明洞小吃、聖水洞咖啡廳與韓服體驗"},
    {"code": "VN_SGN", "name_zh": "越南 胡志明市 (Ho Chi Minh)", "iata": "SGN", "flag": "🇻🇳", "airline": "長榮航空 / 星宇航空 / 越捷", "avg_price": "NT$ 7,200 - 11,500", "tips": "粉紅教堂、法式咖啡館與越式河粉"},
    {"code": "SG", "name_zh": "新加坡 (Singapore)", "iata": "SIN", "flag": "🇸🇬", "airline": "新加坡航空 / 星宇航空 / 酷航", "avg_price": "NT$ 9,500 - 15,000", "tips": "濱海灣金沙無邊際泳池、星耀樟宜與海南雞飯"},
    {"code": "MY", "name_zh": "馬來西亞 吉隆坡 (Kuala Lumpur)", "iata": "KUL", "flag": "🇲🇾", "airline": "全亞航 / 馬航 / 巴迪航空", "avg_price": "NT$ 6,800 - 10,500", "tips": "雙峰塔、黑風洞與亞羅街夜市美食"},
    {"code": "ID", "name_zh": "印尼 峇里島 (Bali)", "iata": "DPS", "flag": "🇮🇩", "airline": "中華航空 直飛 / 樟宜轉機", "avg_price": "NT$ 14,000 - 22,000", "tips": "烏布海景鞦韆、懸崖酒吧酒吧與 Spa"},
    {"code": "AU", "name_zh": "澳洲 悉尼 (Sydney)", "iata": "SYD", "flag": "🇦🇺", "airline": "中華航空 / 澳洲航空", "avg_price": "NT$ 24,000 - 33,000", "tips": "悉尼歌劇院、邦代海灘與無尾熊動物園"},
    {"code": "CH", "name_zh": "瑞士 蘇黎世 (Zurich)", "iata": "ZRH", "flag": "🇨🇭", "airline": "瑞士國際航空 / 新航", "avg_price": "NT$ 35,000 - 48,000", "tips": "少女峰冰川火車、策馬特馬特洪峰"},
    {"code": "AT", "name_zh": "奧地利 維也納 (Vienna)", "iata": "VIE", "flag": "🇦🇹", "airline": "長榮航空 / 中華航空 直飛", "avg_price": "NT$ 29,500 - 39,000", "tips": "哈修塔特湖畔絕景、熊布朗宮古典音樂會"},
    {"code": "NL", "name_zh": "荷蘭 阿姆斯特丹 (Amsterdam)", "iata": "AMS", "flag": "🇳🇱", "airline": "中華航空 直飛 / 荷蘭航空", "avg_price": "NT$ 31,000 - 41,000", "tips": "羊角村水鄉、梵谷博物館與鬱金香花海"},
    {"code": "AE", "name_zh": "阿聯酋 杜拜 (Dubai)", "iata": "DXB", "flag": "🇦🇪", "airline": "阿聯酋航空 A380 直飛", "avg_price": "NT$ 28,000 - 38,000", "tips": "哈里發塔高空觀景、沙漠衝沙與七星帆船飯店"},
    {"code": "CA", "name_zh": "加拿大 溫哥華 (Vancouver)", "iata": "YVR", "flag": "🇨🇦", "airline": "長榮航空 / 加拿大航空", "avg_price": "NT$ 30,000 - 42,000", "tips": "史丹利公園、史丹利吊橋與洛磯山脈"},
    {"code": "EG", "name_zh": "埃及 開羅 (Cairo)", "iata": "CAI", "flag": "🇪🇬", "airline": "埃及航空 / 阿聯酋航空", "avg_price": "NT$ 32,000 - 44,000", "tips": "吉薩金字塔、人面獅身像與尼羅河遊輪"},
    {"code": "GR", "name_zh": "希臘 聖托里尼/雅典 (Santorini)", "iata": "JTR", "flag": "🇬🇷", "airline": "酷航 / 酷航轉機", "avg_price": "NT$ 28,000 - 39,000", "tips": "伊亞藍頂教堂夕陽、衛城古蹟與愛琴海"},
    {"code": "PT", "name_zh": "葡萄牙 里斯本 (Lisbon)", "iata": "LIS", "flag": "🇵🇹", "airline": "土耳其航空 / 埃塞俄比亞", "avg_price": "NT$ 28,500 - 38,500", "tips": "黃色電車28號線、貝倫塔蛋塔創始店"},
    {"code": "IS", "name_zh": "冰島 雷克雅維克 (Reykjavik)", "iata": "KEF", "flag": "🇮🇸", "airline": "冰島航空 / 酷航轉機", "avg_price": "NT$ 38,000 - 52,000", "tips": "藍湖溫泉、極光追蹤、金圈瀑布與冰川健行"}
]

def init_viral_spots_db():
    conn = database.get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS viral_spots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_code TEXT NOT NULL,
            city TEXT NOT NULL,
            spot_name TEXT NOT NULL,
            category TEXT NOT NULL,          -- 美食必吃 / 絕景拍照 / 網美咖啡 / 米其林必比登 / 歷史文化
            platform_tag TEXT NOT NULL,      -- #IG爆爆款 / #小紅書熱搜 / #抖音同款美食 / #米其林推薦
            rating REAL DEFAULT 4.8,
            price_level TEXT DEFAULT '$$',
            address_desc TEXT,
            summary TEXT NOT NULL,
            photo_url TEXT
        )
    ''')
    
    # 檢查現有資料筆數
    cursor.execute("SELECT COUNT(*) as count FROM viral_spots")
    count = cursor.fetchone()['count']
    
    if count < 1000:
        print(f"Current viral spots: {count}. Generating 50,000+ viral travel entries...")
        
        # 爆紅景點範本庫
        templates = [
            ("IG爆紅絕景視角", "絕景拍照", "#IG爆紅", 4.9, "$$$", "世界頂級打卡地標，攝影師爭相朝聖"),
            ("小紅書熱搜美食店", "美食必吃", "#小紅書熱搜", 4.8, "$$", "排隊 2 小時以上的爆款名店"),
            ("抖音同款隱藏版咖啡館", "網美咖啡", "#抖音同款美食", 4.7, "$$", "沉浸式氛圍，極具社群擴散效應"),
            ("米其林必比登推薦小吃", "米其林必比登", "#米其林推薦", 4.9, "$", "在地數十年老字號，極致CP值傳統風味"),
            ("奢華高空景觀酒吧", "絕景拍照", "#IG爆紅", 4.8, "$$$$", "俯瞰整座城市天際線的夢幻夜景"),
            ("秘境文青街區體驗", "歷史文化", "#小紅書熱搜", 4.7, "$$", "文創手作小店與復古建築巡禮")
        ]
        
        insert_data = []
        # 為 30 國產出豐富高質感景點與美食
        for idx in range(1, 50001):
            c = TOP_30_COUNTRIES[(idx - 1) % len(TOP_30_COUNTRIES)]
            tpl = templates[idx % len(templates)]
            
            spot_name = f"{c['name_zh'].split()[1]} {tpl[0]} #{idx}"
            summary = f"{c['flag']} {c['name_zh']} 最受全球旅客喜愛的 {tpl[1]}！{tpl[5]}。"
            
            insert_data.append((
                c['code'],
                c['name_zh'].split()[1],
                spot_name,
                tpl[1],
                tpl[2],
                round(4.5 + (idx % 5) * 0.1, 1),
                tpl[4],
                f"{c['name_zh'].split()[1]} 核心地標區 L{idx % 100 + 1}",
                summary,
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500"
            ))
            
            if len(insert_data) >= 5000:
                cursor.executemany('''
                    INSERT INTO viral_spots 
                    (country_code, city, spot_name, category, platform_tag, rating, price_level, address_desc, summary, photo_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', insert_data)
                conn.commit()
                insert_data = []
                
        if insert_data:
            cursor.executemany('''
                INSERT INTO viral_spots 
                (country_code, city, spot_name, category, platform_tag, rating, price_level, address_desc, summary, photo_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', insert_data)
            conn.commit()
            
        cursor.execute("SELECT COUNT(*) as count FROM viral_spots")
        new_count = cursor.fetchone()['count']
        print(f"Successfully populated database with {new_count:,} viral spots across 30 countries!")
    else:
        print(f"Viral spots DB ready with {count:,} entries.")

    conn.close()

def search_viral_spots(query="", country_code="", category="", platform_tag="", page=1, limit=30):
    conn = database.get_db_connection()
    cursor = conn.cursor()
    
    sql = "SELECT * FROM viral_spots WHERE 1=1"
    params = []
    
    if query:
        sql += " AND (spot_name LIKE ? OR summary LIKE ? OR city LIKE ?)"
        params.extend([f"%{query}%", f"%{query}%", f"%{query}%"])
    if country_code and country_code != "ALL":
        sql += " AND country_code = ?"
        params.append(country_code)
    if category and category != "ALL":
        sql += " AND category = ?"
        params.append(category)
    if platform_tag and platform_tag != "ALL":
        sql += " AND platform_tag = ?"
        params.append(platform_tag)
        
    offset = (page - 1) * limit
    sql += " ORDER BY rating DESC, id ASC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    
    # 統計總數
    count_sql = "SELECT COUNT(*) as total FROM viral_spots WHERE 1=1"
    count_params = params[:-2]
    cursor.execute(count_sql, count_params)
    total = cursor.fetchone()['total']
    
    conn.close()
    return {
        "spots": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "limit": limit
    }

if __name__ == "__main__":
    init_viral_spots_db()
