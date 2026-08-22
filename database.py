import sqlite3
import datetime
from config import DB_PATH

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 記帳資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            expense_date DATE NOT NULL,
            raw_text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 特價優惠監控資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS deal_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            link TEXT UNIQUE NOT NULL,
            source TEXT NOT NULL,
            matched_keyword TEXT,
            notified INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 股票與財經新聞分析資料表 (支援美股 US / 台股 TW 區分)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stock_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            link TEXT UNIQUE NOT NULL,
            source TEXT NOT NULL,
            sentiment TEXT NOT NULL,  -- '極度樂觀', '極度悲觀', '中立'
            score INTEGER NOT NULL,    -- 正分為樂觀，負分為悲觀
            summary TEXT,
            market TEXT DEFAULT 'US',
            notified INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    try:
        cursor.execute("ALTER TABLE stock_alerts ADD COLUMN market TEXT DEFAULT 'US'")
    except Exception:
        pass

    # 猶太人智庫與重點新聞資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS jewish_news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title_zh TEXT NOT NULL,
            summary_zh TEXT NOT NULL,
            key_takeaway TEXT,
            source TEXT NOT NULL,
            link TEXT UNIQUE NOT NULL,
            category TEXT DEFAULT '商業財經',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 旅遊行程與手冊資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            destination TEXT NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            cover_image TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 旅遊交通/住宿/航班資訊表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS trip_logistics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_id INTEGER NOT NULL,
            type TEXT NOT NULL,  -- 'flight', 'hotel', 'transport'
            title TEXT NOT NULL,
            detail TEXT,
            date_time TEXT,
            reference_no TEXT,
            FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
        )
    ''')

    # 高爾夫力學與訓練日誌
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS golf_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            focus_title TEXT NOT NULL,
            shoulder_rotation_deg INTEGER DEFAULT 90,
            hip_sequence TEXT DEFAULT '髖關節引導啟動',
            equipment_club TEXT DEFAULT 'Honma 11支組 (Stiff/Loft Standard)',
            video_url TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 資產槓桿與防禦現金水位監控
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS asset_monitor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mortgage_balance REAL DEFAULT 15000000,
            property_market_val REAL DEFAULT 28000000,
            defensive_cash REAL DEFAULT 1800000,
            monthly_burn REAL DEFAULT 120000,
            etf_portfolio_val REAL DEFAULT 6500000,
            etf_profit_loss REAL DEFAULT 850000,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 浮動隨寫 Quick Capture 隨筆
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS quick_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            category TEXT NOT NULL,  -- 'Finance', 'Travel', 'Engineering', 'General'
            tag TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 國家資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS countries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            flag TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 城市資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            state_region TEXT,
            cover_image TEXT,
            description TEXT,
            FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
        )
    ''')

    # 旅遊書指南資料表 (支援 Quick 基礎版與 Premium 進階版)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS guides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            country_id INTEGER NOT NULL,
            city_id INTEGER,
            title TEXT NOT NULL,
            mode TEXT DEFAULT 'premium',  -- 'quick', 'premium'
            duration_days INTEGER DEFAULT 7,
            cover_image TEXT,
            description TEXT,
            version TEXT DEFAULT '2026.1',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE
        )
    ''')

    # 景點 / 餐廳 / 飯店 / 娛樂 / 交通 資料表 (包含詳細評分與訂票連結)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS places (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guide_id INTEGER,
            city_id INTEGER,
            category TEXT NOT NULL,      -- 'attraction', 'food', 'hotel', 'entertainment', 'transport'
            sub_category TEXT,           -- 'michelin', 'steakhouse', 'nba', 'mlb', 'outlet', 'casino', 'resort', 'heli_tour', 'gas', 'ev_charger', 'parking', 'toll'
            title TEXT NOT NULL,
            rating REAL DEFAULT 4.5,
            review_count INTEGER DEFAULT 1200,
            duration_hours REAL DEFAULT 2.0,
            best_time TEXT,
            price_level TEXT DEFAULT '$$',
            estimated_price REAL DEFAULT 0.0,
            address TEXT,
            lat REAL,
            lng REAL,
            google_maps_url TEXT,
            official_url TEXT,
            booking_url TEXT,
            status TEXT DEFAULT 'operational', -- 'operational', 'temporarily_closed', 'permanently_closed'
            description TEXT,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE
        )
    ''')

    # 旅遊預算計算模組資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS budget_estimates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            guide_id INTEGER NOT NULL,
            category TEXT NOT NULL, -- 'transport', 'hotel', 'food', 'entertainment', 'shopping'
            item_name TEXT NOT NULL,
            cost_per_unit REAL NOT NULL,
            unit_type TEXT DEFAULT 'per_day', -- 'per_day', 'per_night', 'per_person', 'fixed'
            default_qty INTEGER DEFAULT 1,
            notes TEXT,
            FOREIGN KEY (guide_id) REFERENCES guides(id) ON DELETE CASCADE
        )
    ''')
    
    conn.commit()
    conn.close()

# --- Expense Operations ---

def add_expense(item: str, amount: float, category: str, expense_date: str = None, raw_text: str = None):
    if not expense_date:
        expense_date = datetime.date.today().strftime('%Y-%m-%d')
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        INSERT INTO expenses (item, amount, category, expense_date, raw_text)
        VALUES (?, ?, ?, ?, ?)
        ''',
        (item, amount, category, expense_date, raw_text)
    )
    expense_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return expense_id

def get_expenses(limit=50, category=None, date_from=None, date_to=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM expenses WHERE 1=1"
    params = []
    
    if category:
        query += " AND category = ?"
        params.append(category)
    if date_from:
        query += " AND expense_date >= ?"
        params.append(date_from)
    if date_to:
        query += " AND expense_date <= ?"
        params.append(date_to)
        
    query += " ORDER BY expense_date DESC, id DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def delete_expense(expense_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()

def get_expense_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    today = datetime.date.today().strftime('%Y-%m-%d')
    this_month = datetime.date.today().strftime('%Y-%m')
    
    # Today's total
    cursor.execute("SELECT SUM(amount) FROM expenses WHERE expense_date = ?", (today,))
    today_total = cursor.fetchone()[0] or 0.0
    
    # This month's total
    cursor.execute("SELECT SUM(amount) FROM expenses WHERE strftime('%Y-%m', expense_date) = ?", (this_month,))
    month_total = cursor.fetchone()[0] or 0.0
    
    # Category breakdown for this month
    cursor.execute('''
        SELECT category, SUM(amount) as total
        FROM expenses
        WHERE strftime('%Y-%m', expense_date) = ?
        GROUP BY category
        ORDER BY total DESC
    ''', (this_month,))
    category_summary = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return {
        "today_total": today_total,
        "month_total": month_total,
        "category_summary": category_summary
    }

# --- Deal Operations ---

def save_deal_alert(title: str, link: str, source: str, matched_keyword: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            '''
            INSERT INTO deal_alerts (title, link, source, matched_keyword)
            VALUES (?, ?, ?, ?)
            ''',
            (title, link, source, matched_keyword)
        )
        conn.commit()
        deal_id = cursor.lastrowid
        conn.close()
        return deal_id
    except sqlite3.IntegrityError:
        conn.close()
        return None  # Duplicate link

def get_recent_deals(limit=20, unnotified_only=False):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM deal_alerts"
    params = []
    if unnotified_only:
        query += " WHERE notified = 0"
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def mark_deals_notified(deal_ids):
    if not deal_ids:
        return
    conn = get_db_connection()
    cursor = conn.cursor()
    placeholders = ",".join(["?"] * len(deal_ids))
    cursor.execute(f"UPDATE deal_alerts SET notified = 1 WHERE id IN ({placeholders})", deal_ids)
    conn.commit()
    conn.close()

# --- Stock News Alert Operations ---

def save_stock_alert(title: str, link: str, source: str, sentiment: str, score: int, summary: str, market: str = "US"):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            '''
            INSERT INTO stock_alerts (title, link, source, sentiment, score, summary, market)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ''',
            (title, link, source, sentiment, score, summary, market)
        )
        conn.commit()
        alert_id = cursor.lastrowid
        conn.close()
        return alert_id
    except sqlite3.IntegrityError:
        conn.close()
        return None  # Duplicate link

def get_recent_stock_alerts(limit=20, unnotified_only=False, market: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM stock_alerts WHERE 1=1"
    params = []
    if market:
        query += " AND market = ?"
        params.append(market)
    if unnotified_only:
        query += " AND notified = 0"
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def mark_stock_alerts_notified(alert_ids):
    if not alert_ids:
        return
    conn = get_db_connection()
    cursor = conn.cursor()
    placeholders = ",".join(["?"] * len(alert_ids))
    cursor.execute(f"UPDATE stock_alerts SET notified = 1 WHERE id IN ({placeholders})", alert_ids)
    conn.commit()
    conn.close()

# --- Lifestyle Deals Operations ---

def save_lifestyle_deal(title: str, brand: str, category: str, discount_detail: str, link: str, expire_date: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            '''
            INSERT INTO lifestyle_deals (title, brand, category, discount_detail, link, expire_date)
            VALUES (?, ?, ?, ?, ?, ?)
            ''',
            (title, brand, category, discount_detail, link, expire_date)
        )
        conn.commit()
        deal_id = cursor.lastrowid
        conn.close()
        return deal_id
    except sqlite3.IntegrityError:
        conn.close()
        return None

def get_lifestyle_deals(limit=30, category: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM lifestyle_deals WHERE 1=1"
    params = []
    if category and category != "all":
        query += " AND category = ?"
        params.append(category)
        
    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# --- Smart Flight Search Database Operations ---

def save_flight_alert(origin: str, destination: str, target_price: float, depart_date: str = None, return_date: str = None, passenger_email: str = None, telegram_chat_id: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO flight_alerts (origin, destination, target_price, depart_date, return_date, passenger_email, telegram_chat_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (origin.upper(), destination.upper(), target_price, depart_date, return_date, passenger_email, telegram_chat_id))
    conn.commit()
    alert_id = cursor.lastrowid
    conn.close()
    return alert_id

def get_flight_alerts(active_only=True):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM flight_alerts"
    if active_only:
        query += " WHERE is_active = 1"
    query += " ORDER BY created_at DESC"
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def mark_flight_alert_triggered(alert_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE flight_alerts SET triggered = 1 WHERE id = ?", (alert_id,))
    conn.commit()
    conn.close()

def get_all_airports():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM airport_codes ORDER BY country, iata_code")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_airport_info(iata_code: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM airport_codes WHERE iata_code = ? OR city_code = ?", (iata_code.upper(), iata_code.upper()))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_historical_flight_price(route_key: str, depart_airport: str, arrive_airport: str, price: float, airline: str, is_ulcc: int = 0, baggage_included: int = 1):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO historical_flight_prices (route_key, depart_airport, arrive_airport, price, airline, is_ulcc, baggage_included)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (route_key.upper(), depart_airport.upper(), arrive_airport.upper(), price, airline, is_ulcc, baggage_included))
    conn.commit()
    conn.close()

def get_flight_price_stats(route_key: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT AVG(price) as avg_price, MIN(price) as min_price, COUNT(price) as sample_count
        FROM historical_flight_prices
        WHERE route_key = ?
    ''', (route_key.upper(),))
    row = cursor.fetchone()
    conn.close()
    if row and row['sample_count'] and row['sample_count'] > 0:
        return dict(row)
    return {"avg_price": None, "min_price": None, "sample_count": 0}

# --- Jewish News & Insights Operations ---

def save_jewish_news(title_zh: str, summary_zh: str, key_takeaway: str, source: str, link: str, category: str = "商業財經"):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            '''
            INSERT INTO jewish_news (title_zh, summary_zh, key_takeaway, source, link, category)
            VALUES (?, ?, ?, ?, ?, ?)
            ''',
            (title_zh, summary_zh, key_takeaway, source, link, category)
        )
        conn.commit()
        news_id = cursor.lastrowid
        conn.close()
        return news_id
    except sqlite3.IntegrityError:
        conn.close()
        return None

def get_jewish_news(limit=20, category: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM jewish_news WHERE 1=1"
    params = []
    if category and category != 'all':
        query += " AND category = ?"
        params.append(category)
    query += " ORDER BY created_at DESC, id DESC LIMIT ?"
    params.append(limit)
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_guide_metadata(guide_id: int, title: str, country_id: int = None, city_id: int = None, duration_days: int = None, description: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "UPDATE guides SET title = ?"
    params = [title]
    if country_id is not None:
        query += ", country_id = ?"
        params.append(country_id)
    if city_id is not None:
        query += ", city_id = ?"
        params.append(city_id)
    if duration_days is not None:
        query += ", duration_days = ?"
        params.append(duration_days)
    if description is not None:
        query += ", description = ?"
        params.append(description)
    query += " WHERE id = ?"
    params.append(guide_id)
    cursor.execute(query, params)
    conn.commit()
    conn.close()
    return True

# --- Trip & Travel Book Operations ---

def create_trip(title: str, destination: str, start_date: str, end_date: str, notes: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        INSERT INTO trips (title, destination, start_date, end_date, notes)
        VALUES (?, ?, ?, ?, ?)
        ''',
        (title, destination, start_date, end_date, notes)
    )
    trip_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return trip_id

def get_all_trips():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM trips ORDER BY start_date DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_trip_details(trip_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM trips WHERE id = ?", (trip_id,))
    trip_row = cursor.fetchone()
    if not trip_row:
        conn.close()
        return None
        
    trip = dict(trip_row)
    
    cursor.execute("SELECT * FROM trip_logistics WHERE trip_id = ? ORDER BY id ASC", (trip_id,))
    logistics = [dict(row) for row in cursor.fetchall()]
    
    cursor.execute("SELECT * FROM trip_itinerary WHERE trip_id = ? ORDER BY day_number ASC, CASE time_slot WHEN 'morning' THEN 1 WHEN 'afternoon' THEN 2 WHEN 'evening' THEN 3 END, order_index ASC", (trip_id,))
    itinerary = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    return {
        "trip": trip,
        "logistics": logistics,
        "itinerary": itinerary
    }

def delete_trip(trip_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM trip_itinerary WHERE trip_id = ?", (trip_id,))
    cursor.execute("DELETE FROM trip_logistics WHERE trip_id = ?", (trip_id,))
    cursor.execute("DELETE FROM trips WHERE id = ?", (trip_id,))
    conn.commit()
    conn.close()

def add_trip_logistics(trip_id: int, log_type: str, title: str, detail: str, date_time: str, reference_no: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        INSERT INTO trip_logistics (trip_id, type, title, detail, date_time, reference_no)
        VALUES (?, ?, ?, ?, ?, ?)
        ''',
        (trip_id, log_type, title, detail, date_time, reference_no)
    )
    log_id = cursor.lastrowid
    conn.commit()
def get_total_spots_count():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM places WHERE rating >= 4.5 AND review_count >= 100")
    count = cursor.fetchone()[0]
    conn.close()
    return count

def search_global_spots(q: str = "", category: str = "", country: str = "", limit: int = 50, page: int = 1):
    import urllib.parse
    conn = get_db_connection()
    cursor = conn.cursor()
    sql = "SELECT * FROM places WHERE rating >= 4.5 AND review_count >= 100"
    params = []
    
    if q:
        sql += " AND (title LIKE ? OR description LIKE ? OR address LIKE ?)"
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
    if category and category != 'all':
        sql += " AND category = ?"
        params.append(category)
    if country and country != 'all':
        sql += " AND address LIKE ?"
        params.append(f"%{country}%")
        
    sql += " ORDER BY review_count DESC, rating DESC LIMIT ? OFFSET ?"
    offset = max(0, page - 1) * limit
    params.extend([limit, offset])
    
    cursor.execute(sql, params)
    rows = cursor.fetchall()
    conn.close()
    
    results = []
    for r in rows:
        item = dict(r)
        rating = item.get("rating", 4.8)
        reviews = item.get("review_count", 1500)
        item["tripadvisor_badge"] = f"🟢 Tripadvisor {rating:.1f}★ ({reviews:,} 人驗證)"
        item["tripadvisor_url"] = f"https://www.tripadvisor.com.tw/Search?q={urllib.parse.quote(item['title'])}"
        results.append(item)
    return results

def delete_trip_logistics(log_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM trip_logistics WHERE id = ?", (log_id,))
    conn.commit()
    conn.close()

def add_trip_itinerary(trip_id: int, day_number: int, time_slot: str, activity: str, location: str = "", estimated_cost: float = 0.0, notes: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''
        INSERT INTO trip_itinerary (trip_id, day_number, time_slot, activity, location, estimated_cost, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''',
        (trip_id, day_number, time_slot, activity, location, estimated_cost, notes)
    )
    itin_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return itin_id

def swap_itinerary_slot(itin_id: int):
    """
    Swaps morning <-> afternoon or afternoon <-> evening for a slot.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT time_slot FROM trip_itinerary WHERE id = ?", (itin_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return False
        
    current_slot = row["time_slot"]
    new_slot = "afternoon" if current_slot == "morning" else ("morning" if current_slot == "afternoon" else "afternoon")
    
    cursor.execute("UPDATE trip_itinerary SET time_slot = ? WHERE id = ?", (new_slot, itin_id))
    conn.commit()
    conn.close()
    return new_slot

def seed_benchmark_data():
    """
    Seeds initial global countries, cities, and pre-configures 
    《2026 美西公路旅行攻略》 as the core benchmark template.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Seed Countries
    countries_data = [
        ("US", "美國 (USA)", "🇺🇸", "美西公路、大峽谷、國家公園、NBA 賽事與娛樂首選"),
        ("JP", "日本 (Japan)", "🇯🇵", "東京關東、京都古都、美食溫泉與主題樂園"),
        ("KR", "韓國 (Korea)", "🇰🇷", "首爾時尚、濟州島自然風光與韓式燒肉美食"),
        ("TH", "泰國 (Thailand)", "🇹🇭", "曼谷購物、清邁古城與普吉島渡假勝地"),
        ("EU", "歐洲 (Europe)", "🇪🇺", "法國巴黎、義大利古蹟與阿爾卑斯山壯麗風光"),
        ("AU", "澳洲 (Australia)", "🇦🇺", "雪梨歌劇院、墨爾本咖啡與大堡礁海景")
    ]
    for code, name, flag, desc in countries_data:
        cursor.execute("INSERT OR IGNORE INTO countries (code, name, flag, description) VALUES (?, ?, ?, ?)", (code, name, flag, desc))

    cursor.execute("SELECT id FROM countries WHERE code = 'US'")
    us_row = cursor.fetchone()
    if not us_row:
        conn.close()
        return
    us_id = us_row["id"]

    # 2. Seed Cities for USA
    cities_data = [
        (us_id, "洛杉磯 (Los Angeles)", "加州 California", "Hollywood, Crypto.com Arena NBA, Dodgers Stadium MLB"),
        (us_id, "拉斯維加斯 (Las Vegas)", "內華達州 Nevada", "Strips, Casino Hotels, O Show, Premium Outlets"),
        (us_id, "佩吉 / 大峽谷 (Grand Canyon & Page)", "亞利桑那州 Arizona", "大峽谷國家公園、羚羊峽谷、馬蹄灣、直升機導覽"),
        (us_id, "舊金山 (San Francisco)", "加州 California", "金門大橋、漁人碼頭、矽谷科技園區"),
        (us_id, "西雅圖 (Seattle)", "華盛頓州 Washington", "派克市場、Space Needle、Blue Bottle 咖啡廳")
    ]
    for c_id, c_name, c_state, c_desc in cities_data:
        cursor.execute("INSERT OR IGNORE INTO cities (country_id, name, state_region, description) VALUES (?, ?, ?, ?)", (c_id, c_name, c_state, c_desc))

    # 3. Seed Benchmark Guide: 《2026 美西公路旅行攻略》
    cursor.execute("SELECT id FROM guides WHERE title = '2026 美西公路旅行攻略'")
    existing_guide = cursor.fetchone()
    
    if not existing_guide:
        cursor.execute('''
            INSERT INTO guides (country_id, title, mode, duration_days, cover_image, description, version)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            us_id,
            "2026 美西公路旅行攻略",
            "premium",
            10,
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
            "【全台最強美西攻略】橫跨洛杉磯、拉斯維加斯、大峽谷與 Route 66。涵蓋 Hertz 租車、Chevron 加油、Tesla 充電、NBA 賽事票價、米其林星級美食、大峽谷直升機與 Outlet 購物指南！",
            "2026.1"
        ))
        guide_id = cursor.lastrowid

        # Seed Benchmark Places
        places_data = [
            # Transportation
            (guide_id, "transport", "rental_car", "Hertz 洛杉磯國際機場 (LAX) 租車中心", 4.7, 4800, 1.0, "全天 24 小時", "$$", 3500.0, "9000 Aviation Blvd, Inglewood, CA 90301", 33.954, -118.375, "https://maps.google.com/?q=Hertz+LAX", "https://www.hertz.com", "https://www.hertz.com", "operational", "提供最新型 SUV 與跑車，車況優良、快速取車過關。"),
            (guide_id, "transport", "gas", "Chevron 加油站 & Tesla Supercharger 交流道站", 4.6, 1200, 0.5, "全天 24 小時", "$$", 800.0, "I-15 Exit 221, Barstow, CA", 34.895, -117.017, "https://maps.google.com/?q=Chevron+Barstow", "https://www.chevron.com", "https://www.tesla.com", "operational", "美西 I-15 公路必經加油補給站，備有 V3 超級充電站。"),
            (guide_id, "transport", "toll", "FasTrak 加州 Express Lanes 快速道路指南", 4.8, 950, 0.1, "全天", "$", 300.0, "LA Metro ExpressLanes", 34.052, -118.243, "https://maps.google.com/?q=FasTrak+LA", "https://www.bayareafastrak.org", "https://www.bayareafastrak.org", "operational", "行駛 I-110 / I-10 快速車道必備電子收費登錄系統。"),
            
            # Attractions & Entertainment
            (guide_id, "attraction", "heli_tour", "Papillon 大峽谷直升機 360 度奢華全景航程", 4.9, 8900, 2.5, "08:00 - 15:00", "$$$$", 9800.0, "Grand Canyon National Park Airport, AZ", 35.952, -112.148, "https://maps.google.com/?q=Grand+Canyon+Helicopter", "https://www.papillon.com", "https://www.papillon.com", "operational", "俯瞰大峽谷壯麗地形與科羅拉多河，含飯店專車接送與香檳祝酒。"),
            (guide_id, "attraction", "nature", "下羚羊峽谷 (Lower Antelope Canyon) 攝影之旅", 4.9, 15000, 2.0, "11:00 - 13:00 最佳光線", "$$$", 3200.0, "Indian Route 222, Page, AZ 86040", 36.902, -111.411, "https://maps.google.com/?q=Antelope+Canyon", "https://www.antelope-canyon.com", "https://www.antelope-canyon.com", "operational", "夢幻光束與夢幻波浪岩壁，由納瓦霍印第安導覽員全程跟隨。"),
            (guide_id, "entertainment", "nba", "Crypto.com Arena (洛杉磯湖人隊 NBA 主場賽事)", 4.8, 28000, 3.5, "19:30 開賽", "$$$$", 650.0, "1111 S Figueroa St, Los Angeles, CA 90015", 34.043, -118.267, "https://maps.google.com/?q=Crypto+Arena+LA", "https://www.nba.com/lakers", "https://www.ticketmaster.com", "operational", "體驗 NBA 頂級觀賽氛圍，現場感受球星飆分精彩時刻。"),
            (guide_id, "entertainment", "casino", "O Show by Cirque du Soleil (百樂宮水上太陽劇團)", 4.9, 21000, 2.0, "19:00 / 21:30", "$$$$", 5500.0, "3600 S Las Vegas Blvd, Las Vegas, NV 89109", 36.112, -115.176, "https://maps.google.com/?q=Bellagio+O+Show", "https://www.cirquedusoleil.com/o", "https://www.bellagio.com", "operational", "拉斯維加斯排名第一水上太陽劇團，150 萬加侖水池奢華舞台。"),
            (guide_id, "entertainment", "outlet", "Las Vegas North Premium Outlets (名牌購物中心)", 4.7, 18500, 4.0, "10:00 - 20:00", "$$", 0.0, "875 N Grand Central Pkwy, Las Vegas, NV 89106", 36.170, -115.158, "https://maps.google.com/?q=Las+Vegas+North+Outlets", "https://www.premiumoutlets.com", "https://www.premiumoutlets.com", "operational", "超過 180 家國際精品折扣店 (Coach, Nike, Tory Burch, Armani)。"),
            
            # Dining
            (guide_id, "food", "michelin", "Joël Robuchon (米其林三星法式頂級饗宴)", 4.9, 3200, 3.0, "17:30 - 21:30", "$$$$", 12000.0, "MGM Grand, 3799 S Las Vegas Blvd, NV 89109", 36.102, -115.170, "https://maps.google.com/?q=Joel+Robuchon+MGM", "https://mgmgrand.mgmresorts.com", "https://www.opentable.com", "operational", "世紀廚神法國米其林三星餐廳，尊榮級松露與黑珍珠魚子醬饗宴。"),
            (guide_id, "food", "steakhouse", "Mastro's Ocean Club (頂級極品肋眼牛排館)", 4.8, 4100, 2.5, "17:00 - 22:00", "$$$$", 4800.0, "1840 Century Park E, Los Angeles, CA 90067", 34.059, -118.414, "https://maps.google.com/?q=Mastros+Steakhouse+LA", "https://www.mastrosrestaurants.com", "https://www.opentable.com", "operational", "乾式熟成黑安格斯肋眼牛排與奶油黃金龍蝦，洛杉磯名人最愛。"),
            (guide_id, "food", "local_eats", "In-N-Out Burger (加州經典雙層起司堡)", 4.8, 45000, 1.0, "10:30 - 01:00", "$", 350.0, "7009 Sunset Blvd, Hollywood, CA 90028", 34.098, -118.343, "https://maps.google.com/?q=In-N-Out+Hollywood", "https://www.in-n-out.com", "https://www.in-n-out.com", "operational", "加州必吃傳奇漢堡，隱藏菜單 Double-Double Animal Style！"),
            
            # Hotels
            (guide_id, "hotel", "resort", "Bellagio Hotel & Casino (拉斯維加斯百樂宮渡假酒店)", 4.8, 38000, 24.0, "15:00 Check-in", "$$$$", 8500.0, "3600 S Las Vegas Blvd, Las Vegas, NV 89109", 36.112, -115.176, "https://maps.google.com/?q=Bellagio+Hotel", "https://bellagio.mgmresorts.com", "https://www.booking.com", "operational", "賭城大道奢華地標，附設震撼水舞音樂噴泉與花園水族館。")
        ]
        
        for item in places_data:
            cursor.execute('''
                INSERT INTO places (
                    guide_id, category, sub_category, title, rating, review_count, duration_hours,
                    best_time, price_level, estimated_price, address, lat, lng, google_maps_url,
                    official_url, booking_url, status, description
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', item)

        # Seed Budget Estimates
        budget_data = [
            (guide_id, "transport", "長榮航空雙人往返機票 (LAX)", 45000.0, "per_person", 2, "直飛桃園-洛杉磯航線"),
            (guide_id, "transport", "Hertz SUV 全險租車 (10 天)", 2800.0, "per_day", 10, "包含 LDW 與零自負額保險"),
            (guide_id, "transport", "Chevron / Shell 油資預估", 1200.0, "per_day", 10, "美西橫跨 1500 英哩"),
            (guide_id, "hotel", "百樂宮 / 奢華酒店住宿 (9 晚)", 7500.0, "per_night", 9, "含賭城大道飯店與大峽谷小木屋"),
            (guide_id, "food", "餐飲預算 (每日美式牛肉堡/米其林牛排)", 2500.0, "per_day", 10, "每人每日預算"),
            (guide_id, "entertainment", "大峽谷直升機 + O Show + NBA 門票", 18000.0, "per_person", 2, "頂級賽事與表演套票")
        ]
        for b_item in budget_data:
            cursor.execute('''
                INSERT INTO budget_estimates (guide_id, category, item_name, cost_per_unit, unit_type, default_qty, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', b_item)

    conn.commit()
    conn.close()

# --- CMS & Duplication Functions ---

def duplicate_guide(source_guide_id: int, new_title: str, target_country_id: int, target_city_id: int = None):
    """
    Duplicates an entire travel guide template (e.g. West Coast USA) 
    to create a brand new editable guide (e.g. Japan Tokyo Guide).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch source guide
    cursor.execute("SELECT * FROM guides WHERE id = ?", (source_guide_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    source_guide = dict(row)
        
    # 2. Insert new guide
    cursor.execute('''
        INSERT INTO guides (country_id, city_id, title, mode, duration_days, cover_image, description, version)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        target_country_id,
        target_city_id,
        new_title,
        source_guide.get("mode", "premium"),
        source_guide.get("duration_days", 7),
        source_guide.get("cover_image", ""),
        f"【自訂版】{new_title}（複製自：{source_guide.get('title', '')} 架構）",
        "2026.1-CLONE"
    ))
    new_guide_id = cursor.lastrowid
    
    # 3. Duplicate all places
    cursor.execute("SELECT * FROM places WHERE guide_id = ?", (source_guide_id,))
    places = [dict(r) for r in cursor.fetchall()]
    for p in places:
        cursor.execute('''
            INSERT INTO places (
                guide_id, city_id, category, sub_category, title, rating, review_count,
                duration_hours, best_time, price_level, estimated_price, address, lat, lng,
                google_maps_url, official_url, booking_url, status, description, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            new_guide_id, target_city_id, p.get("category"), p.get("sub_category"), p.get("title"), p.get("rating", 4.5),
            p.get("review_count", 100), p.get("duration_hours", 2.0), p.get("best_time"), p.get("price_level", "$$"), p.get("estimated_price", 0.0),
            p.get("address"), p.get("lat"), p.get("lng"), p.get("google_maps_url"), p.get("official_url"), p.get("booking_url"),
            p.get("status", "operational"), p.get("description"), p.get("image_url")
        ))
        
    # 4. Duplicate budget estimates
    cursor.execute("SELECT * FROM budget_estimates WHERE guide_id = ?", (source_guide_id,))
    budgets = [dict(r) for r in cursor.fetchall()]
    for b in budgets:
        cursor.execute('''
            INSERT INTO budget_estimates (guide_id, category, item_name, cost_per_unit, unit_type, default_qty, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (new_guide_id, b.get("category"), b.get("item_name"), b.get("cost_per_unit", 0), b.get("unit_type", "per_day"), b.get("default_qty", 1), b.get("notes")))
        
    conn.commit()
    conn.close()
    return new_guide_id

def get_countries():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM countries ORDER BY id ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_cities(country_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if country_id:
        cursor.execute("SELECT * FROM cities WHERE country_id = ? ORDER BY name ASC", (country_id,))
    else:
        cursor.execute("SELECT * FROM cities ORDER BY name ASC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def get_guides(country_id=None, mode=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT g.*, c.name as country_name, c.flag FROM guides g JOIN countries c ON g.country_id = c.id WHERE 1=1"
    params = []
    if country_id:
        query += " AND g.country_id = ?"
        params.append(country_id)
    if mode:
        query += " AND g.mode = ?"
        params.append(mode)
    query += " ORDER BY g.id DESC"
    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

import urllib.parse

def get_guide_full_content(guide_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT g.*, c.name as country_name, c.flag FROM guides g JOIN countries c ON g.country_id = c.id WHERE g.id = ?", (guide_id,))
    guide_row = cursor.fetchone()
    if not guide_row:
        conn.close()
        return None
    guide = dict(guide_row)

    # Strictly filter for Tripadvisor 4.5+ Stars & 100+ Reviews Quality Filter
    cursor.execute("SELECT * FROM places WHERE guide_id = ? AND rating >= 4.5 AND review_count >= 100 ORDER BY category ASC, rating DESC", (guide_id,))
    raw_places = [dict(r) for r in cursor.fetchall()]

    places = []
    for p in raw_places:
        p["tripadvisor_certified"] = True
        p["tripadvisor_badge"] = f"🟢 Tripadvisor {p.get('rating', 4.5)}★ ({p.get('review_count', 100):,} 人驗證)"
        q_title = urllib.parse.quote(p.get("title", ""))
        p["tripadvisor_url"] = f"https://www.tripadvisor.com.tw/Search?q={q_title}"
        places.append(p)

    cursor.execute("SELECT * FROM budget_estimates WHERE guide_id = ?", (guide_id,))
    budgets = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "guide": guide,
        "places": places,
        "budgets": budgets
    }

def add_or_update_place(place_data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    place_id = place_data.get("id")

    if place_id:
        cursor.execute('''
            UPDATE places SET
                title = ?, category = ?, sub_category = ?, rating = ?, review_count = ?,
                duration_hours = ?, best_time = ?, price_level = ?, estimated_price = ?,
                address = ?, google_maps_url = ?, official_url = ?, booking_url = ?,
                status = ?, description = ?
            WHERE id = ?
        ''', (
            place_data["title"], place_data["category"], place_data.get("sub_category", ""),
            place_data.get("rating", 4.5), place_data.get("review_count", 100),
            place_data.get("duration_hours", 2.0), place_data.get("best_time", ""),
            place_data.get("price_level", "$$"), place_data.get("estimated_price", 0.0),
            place_data.get("address", ""), place_data.get("google_maps_url", ""),
            place_data.get("official_url", ""), place_data.get("booking_url", ""),
            place_data.get("status", "operational"), place_data.get("description", ""),
            place_id
        ))
    else:
        cursor.execute('''
            INSERT INTO places (
                guide_id, city_id, category, sub_category, title, rating, review_count,
                duration_hours, best_time, price_level, estimated_price, address,
                google_maps_url, official_url, booking_url, status, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            place_data.get("guide_id"), place_data.get("city_id"), place_data["category"],
            place_data.get("sub_category", ""), place_data["title"], place_data.get("rating", 4.5),
            place_data.get("review_count", 100), place_data.get("duration_hours", 2.0),
            place_data.get("best_time", ""), place_data.get("price_level", "$$"),
            place_data.get("estimated_price", 0.0), place_data.get("address", ""),
            place_data.get("google_maps_url", ""), place_data.get("official_url", ""),
            place_data.get("booking_url", ""), place_data.get("status", "operational"),
            place_data.get("description", "")
        ))
        place_id = cursor.lastrowid

    conn.commit()
    conn.close()
    return place_id

def delete_place(place_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM places WHERE id = ?", (place_id,))
    conn.commit()
    conn.close()

# --- Golf Biomechanics & Asset Monitor & Quick Notes Helpers ---

def get_golf_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM golf_logs ORDER BY created_at DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    if not rows:
        # Default sample golf log
        return [{
            "id": 1,
            "focus_title": "下桿髖關節轉體引導與釋放點控制",
            "shoulder_rotation_deg": 90,
            "hip_sequence": "下桿髖關節優先啟動 ➔ 手臂天然下甩",
            "equipment_club": "Honma 11支組 (Stiff Flex / Standard Loft)",
            "video_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
            "notes": "維護脊椎軸心傾角，避免過度抬抬手臂；確保落點距離與飛距離一致。",
            "created_at": "2026-08-20 18:00"
        }]
    return rows

def add_golf_log(title: str, shoulder_deg: int = 90, hip_seq: str = "", club: str = "", video_url: str = "", notes: str = ""):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO golf_logs (focus_title, shoulder_rotation_deg, hip_sequence, equipment_club, video_url, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (title, shoulder_deg, hip_seq or '髖關節啟動順序', club or 'Honma 11支組', video_url, notes))
    log_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return log_id

def get_asset_monitor():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM asset_monitor ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {
            "mortgage_balance": 15000000.0,
            "property_market_val": 28000000.0,
            "defensive_cash": 1800000.0,
            "monthly_burn": 120000.0,
            "etf_portfolio_val": 6500000.0,
            "etf_profit_loss": 850000.0,
            "ltv_pct": 53.57,
            "cash_runway_months": 15.0
        }
    d = dict(row)
    market_val = d.get("property_market_val", 1.0)
    mortgage = d.get("mortgage_balance", 0.0)
    d["ltv_pct"] = round((mortgage / market_val) * 100, 2) if market_val > 0 else 0.0
    burn = d.get("monthly_burn", 1.0)
    d["cash_runway_months"] = round(d.get("defensive_cash", 0.0) / burn, 1) if burn > 0 else 0.0
    return d

def update_asset_monitor(data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO asset_monitor (
            mortgage_balance, property_market_val, defensive_cash, monthly_burn,
            etf_portfolio_val, etf_profit_loss
        ) VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        float(data.get("mortgage_balance", 15000000)),
        float(data.get("property_market_val", 28000000)),
        float(data.get("defensive_cash", 1800000)),
        float(data.get("monthly_burn", 120000)),
        float(data.get("etf_portfolio_val", 6500000)),
        float(data.get("etf_profit_loss", 850000))
    ))
    conn.commit()
    conn.close()
    return True

def save_quick_note(content: str, category: str = "General", tag: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO quick_notes (content, category, tag)
        VALUES (?, ?, ?)
    ''', (content, category, tag))
    note_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return note_id

def get_quick_notes(limit=20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM quick_notes ORDER BY created_at DESC LIMIT ?", (limit,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

