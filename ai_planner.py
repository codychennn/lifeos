import database

INTEREST_CATEGORIES_MAP = {
    "shopping": ["購物", "商圈", "名牌", "outlet", "百貨", "美妝", "市集", "烏節路", "明洞", "秋葉原", "銀座", "香榭麗舍"],
    "food": ["美食", "米其林", "牛排", "拉麵", "肉骨茶", "壽司", "夜市", "酒吧", "甜點", "海鮮"],
    "attraction": ["地標", "鐵塔", "金字塔", "宮殿", "城堡", "博物館", "神社", "寺廟", "大峽谷", "公園", "神殿"],
    "entertainment": ["主題樂園", "迪士尼", "環球影城", "nba", "觀賽", "劇院", "表演", "大秀", "水舞", "賽車"],
    "hotel": ["飯店", "酒店", "奢華", "渡假村", "villa", "溫泉", "SPA", "金沙"],
    "nature": ["國家公園", "峽谷", "湖泊", "雪山", "極光", "海灘", "火山", "森林", "瀑布"]
}

COUNTRY_NAME_MAP = {
    "SG": "新加坡",
    "JP": "日本",
    "KR": "韓國",
    "TH": "泰國",
    "FR": "法國",
    "UK": "英國",
    "IT": "義大利",
    "CH": "瑞士",
    "US": "美國",
    "AU": "澳洲",
    "ES": "西班牙",
    "DE": "德國",
    "NL": "荷蘭",
    "CA": "加拿大",
    "NZ": "紐西蘭",
    "VN": "越南",
    "ID": "印尼",
    "MY": "馬來西亞",
    "PH": "菲律賓",
    "AT": "奧地利",
    "CZ": "捷克",
    "TW": "台灣",
    "HK": "香港",
    "MO": "澳門",
    "TR": "土耳其",
    "EG": "埃及",
    "AE": "杜拜",
    "IS": "冰島",
    "FI": "芬蘭",
    "GR": "希臘"
}

def generate_recommendations(country_code: str = "US", city_name: str = None, spot_title: str = None):
    results = {
        "recommended_spots": [],
        "recommended_activities": [],
        "related_tours": []
    }
    country_name = COUNTRY_NAME_MAP.get(country_code.upper(), "美國")
    spots = database.search_global_spots(country=country_name, limit=6)
    results["recommended_spots"] = spots
    return results

def ai_generate_itinerary(
    country_code: str,
    duration_days: int,
    budget_level: str,
    travelers_count: int,
    interests: list,
    departure_city: str = "台北",
    travel_month: int = 10,
    travel_style: str = "購物美食",
    pace_level: str = "普通適中"
):
    country_name = COUNTRY_NAME_MAP.get(country_code.upper(), country_code)
    
    # Query 11,272 global spots database for matching country
    matched_spots = database.search_global_spots(country=country_name, limit=100)
    if not matched_spots or len(matched_spots) < 3:
        matched_spots = database.search_global_spots(q="", limit=100)  # Fallback

    # Filter by interest keywords if provided
    filtered = []
    if interests:
        for s in matched_spots:
            title = s.get("title", "")
            cat = s.get("category", "")
            for intr in interests:
                kws = INTEREST_CATEGORIES_MAP.get(intr, [intr])
                if any(kw in title or kw in cat for kw in kws):
                    filtered.append(s)
                    break
    if filtered:
        matched_spots = filtered

    total_spots = len(matched_spots)
    spot_idx = 0

    season_name = "秋季黃金旅遊季"
    if travel_month in [12, 1, 2]:
        season_name = "冬季雪景節慶季"
    elif travel_month in [3, 4, 5]:
        season_name = "春季暖陽賞花季"
    elif travel_month in [6, 7, 8]:
        season_name = "夏季渡假酷暑季"

    daily_itinerary = []
    for day in range(1, duration_days + 1):
        m_spot = matched_spots[spot_idx % total_spots] if total_spots else {}
        spot_idx += 1
        a_spot = matched_spots[spot_idx % total_spots] if total_spots else {}
        spot_idx += 1
        e_spot = matched_spots[spot_idx % total_spots] if total_spots else {}
        spot_idx += 1

        daily_itinerary.append({
            "day_number": day,
            "morning": {
                "activity": m_spot.get("title", f"前往【{country_name}】熱門城市地標散策"),
                "location": m_spot.get("city", country_name),
                "rating": m_spot.get("rating", 4.8),
                "review_count": m_spot.get("review_count", 520),
                "estimated_cost": 800 if budget_level == "luxury" else 500
            },
            "afternoon": {
                "activity": a_spot.get("title", f"【{country_name}】精選購物商圈與在地知名美食體驗"),
                "location": a_spot.get("city", country_name),
                "rating": a_spot.get("rating", 4.9),
                "review_count": a_spot.get("review_count", 1280),
                "estimated_cost": 2500 if budget_level == "luxury" else 1200
            },
            "evening": {
                "activity": e_spot.get("title", f"【{country_name}】夜間美景觀賞與米其林/特色晚餐"),
                "location": e_spot.get("city", country_name),
                "rating": e_spot.get("rating", 4.7),
                "review_count": e_spot.get("review_count", 890),
                "estimated_cost": 4500 if budget_level == "luxury" else 2200
            }
        })

    est_per_person_day = 6500 if budget_level == "luxury" else (4000 if budget_level == "standard" else 2500)
    total_budget = est_per_person_day * duration_days * travelers_count

    return {
        "country": country_name,
        "country_code": country_code,
        "departure_city": departure_city,
        "travel_month": travel_month,
        "season_name": season_name,
        "travel_style": travel_style,
        "pace_level": pace_level,
        "duration_days": duration_days,
        "travelers_count": travelers_count,
        "interests": interests,
        "daily_itinerary": daily_itinerary,
        "estimated_budget": {
            "per_person": est_per_person_day * duration_days,
            "total_budget": total_budget,
            "flight_cost": 25000 * travelers_count,
            "hotel_cost": 6000 * (duration_days - 1),
            "food_cost": 2200 * duration_days * travelers_count,
            "entertainment_cost": 12000 * travelers_count
        }
    }
