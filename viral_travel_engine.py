import sys
import os
import urllib.parse
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
    {"code": "JP_TYO", "name_zh": "日本 東京成田/羽田 (Tokyo)", "iata": "NRT", "flag": "🇯🇵", "airline": "全日空 / 日本航空 / 星宇航空", "avg_price": "NT$ 11,000 - 16,000", "tips": "晴空塔、淺草寺、澀谷 Sky 與頂級燒肉"},
    {"code": "VN_SGN", "name_zh": "越南 胡志明市 (Ho Chi Minh)", "iata": "SGN", "flag": "🇻🇳", "airline": "長榮航空 / 星宇航空 / 越捷", "avg_price": "NT$ 7,200 - 11,500", "tips": "粉紅教堂、法式咖啡館與越式河粉"},
    {"code": "SG", "name_zh": "新加坡 (Singapore)", "iata": "SIN", "flag": "🇸🇬", "airline": "新加坡航空 / 星宇航空 / 酷航", "avg_price": "NT$ 9,500 - 15,000", "tips": "濱海灣金沙無邊際泳池、星耀樟宜與海南雞飯"},
    {"code": "GB", "name_zh": "英國 倫敦 (London)", "iata": "LHR", "flag": "🇬🇧", "airline": "長榮航空 / 中華航空 / 國泰", "avg_price": "NT$ 33,000 - 44,000", "tips": "大英博物館、大笨鐘與倫敦眼英式下午茶"}
]

def search_viral_spots(query="", country_code="", category="", platform_tag="", page=1, limit=12):
    conn = database.get_db_connection()
    cursor = conn.cursor()
    
    where_sql = " WHERE 1=1"
    params = []
    
    if query:
        where_sql += " AND (spot_name LIKE ? OR summary LIKE ? OR city LIKE ?)"
        params.extend([f"%{query}%", f"%{query}%", f"%{query}%"])
    if country_code and country_code != "ALL":
        where_sql += " AND country_code = ?"
        params.append(country_code)
    if category and category != "ALL":
        where_sql += " AND category = ?"
        params.append(category)
    if platform_tag and platform_tag != "ALL":
        where_sql += " AND platform_tag = ?"
        params.append(platform_tag)
        
    # 1. 查詢筆數與頁數
    count_sql = "SELECT COUNT(*) as total FROM viral_spots" + where_sql
    cursor.execute(count_sql, params)
    total_row = cursor.fetchone()
    total = total_row['total'] if total_row else 0
    
    # 2. 分頁查詢
    offset = (page - 1) * limit
    select_sql = "SELECT * FROM viral_spots" + where_sql + " ORDER BY id ASC LIMIT ? OFFSET ?"
    select_params = list(params) + [limit, offset]
    
    cursor.execute(select_sql, select_params)
    rows = cursor.fetchall()
    
    spots = []
    for r in rows:
        d = dict(r)
        query_target = d.get('google_map_query') or d.get('spot_name')
        d['google_map_url'] = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(query_target)}"
        spots.append(d)
        
    conn.close()
    
    total_pages = (total + limit - 1) // limit if limit > 0 else 1
    return {
        "spots": spots,
        "total": total,
        "page": page,
        "total_pages": total_pages,
        "limit": limit
    }

def add_to_my_travel_list(spot_id):
    conn = database.get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM viral_spots WHERE id = ?", (spot_id,))
    spot = cursor.fetchone()
    if not spot:
        conn.close()
        return {"status": "error", "message": "景點不存在"}
        
    spot_dict = dict(spot)
    query_target = spot_dict.get('google_map_query') or spot_dict.get('spot_name')
    map_url = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(query_target)}"
    
    # 檢查是否已在清單中
    cursor.execute("SELECT id FROM my_travel_list WHERE spot_name = ?", (spot_dict['spot_name'],))
    existing = cursor.fetchone()
    if existing:
        conn.close()
        return {"status": "exists", "message": "該景點/餐廳已在您的旅行清單中！"}
        
    cursor.execute('''
        INSERT INTO my_travel_list (spot_name, country_code, city, category, address_desc, rating, photo_url, google_map_query)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (spot_dict['spot_name'], spot_dict['country_code'], spot_dict['city'], spot_dict['category'], spot_dict['address_desc'], spot_dict['rating'], spot_dict['photo_url'], query_target))
    
    conn.commit()
    conn.close()
    return {"status": "success", "message": f"已成功將 [{spot_dict['spot_name']}] 加入您的旅行清單！"}

def get_my_travel_list():
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM my_travel_list ORDER BY id DESC")
    rows = cursor.fetchall()
    
    items = []
    for r in rows:
        d = dict(r)
        query_target = d.get('google_map_query') or d.get('spot_name')
        d['google_map_url'] = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(query_target)}"
        items.append(d)
        
    conn.close()
    return {"status": "success", "count": len(items), "data": items}

def remove_from_my_travel_list(item_id):
    conn = database.get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM my_travel_list WHERE id = ?", (item_id,))
    conn.commit()
    conn.close()
    return {"status": "success", "message": "已從旅行清單移除"}
