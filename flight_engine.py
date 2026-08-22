import sys
import math
import random
from datetime import datetime, timedelta
import database

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 預設同航線 60 天平均價格庫 (用作 Z-Score 統計模型比較基準)
ROUTE_BENCHMARK_MEANS = {
    "TPE-TYO": {"mean": 13500, "std": 2200},
    "TPE-LON": {"mean": 36000, "std": 4500},
    "TPE-LAX": {"mean": 38000, "std": 5000},
    "TPE-BKK": {"mean": 11000, "std": 1800},
    "TPE-SIN": {"mean": 12500, "std": 2000},
    "TPE-OSA": {"mean": 14000, "std": 2100},
    "LON-TYO": {"mean": 42000, "std": 6000}
}

# 中轉樞紐與自轉機緩衝
TRANSFER_HUBS = [
    {"code": "BKK", "name": "曼谷蘇凡納布 (BKK)", "min_buffer_hours": 3.5, "shuttle_notes": "需清關自提行李，重新至 4F 櫃檯 Check-in"},
    {"code": "KUL", "name": "吉隆坡 KLIA (KUL)", "min_buffer_hours": 3.0, "shuttle_notes": "KLIA1 與 KLIA2 電車轉接，行李需自行托運"},
    {"code": "SIN", "name": "新加坡樟宜 (SIN)", "min_buffer_hours": 3.0, "shuttle_notes": "T1-T4 轉機，自動通關快速，需自提行李"},
    {"code": "DXB", "name": "杜拜國際 (DXB)", "min_buffer_hours": 4.0, "shuttle_notes": "中東航點樞紐，入境需辦理轉機過境簽證"},
    {"code": "IST", "name": "伊斯坦堡 (IST)", "min_buffer_hours": 4.0, "shuttle_notes": "歐亞樞紐，航廈廣大建議保留 3.5 小時以上"}
]

def expand_airports(code: str):
    """
    擴展 150-300km 鄰近替代機場 (如 LON -> LHR, LGW, STN, LTN)
    """
    airports = database.get_airport_info(code)
    if airports:
        city_code = airports[0]['city_code']
        cluster = database.get_airport_info(city_code)
        return cluster if cluster else airports
    return [{"iata_code": code.upper(), "name_zh": code.upper(), "shuttle_cost_twd": 0, "shuttle_time_mins": 0}]

def calculate_z_score(route_key: str, price: float):
    """
    計算價格 Z-Score，判斷是否為快閃特價 (Z <= -1.5) 或 疑似 Bug 票 (Z <= -2.0)
    """
    bench = ROUTE_BENCHMARK_MEANS.get(route_key, {"mean": price * 1.4, "std": price * 0.2})
    mean = bench["mean"]
    std = bench["std"]
    
    z_score = (price - mean) / std if std > 0 else 0
    discount_pct = round(((mean - price) / mean) * 100) if mean > 0 else 0
    
    is_bug_fare = z_score <= -2.0 or discount_pct >= 50
    is_flash_sale = z_score <= -1.5 or discount_pct >= 30
    
    return {
        "z_score": round(z_score, 2),
        "mean_price": mean,
        "discount_pct": max(0, discount_pct),
        "is_bug_fare": is_bug_fare,
        "is_flash_sale": is_flash_sale
    }

def search_smart_flights(origin="TPE", destination="TYO", depart_date=None, return_date=None, expand_nearby=True, allow_self_transfer=True, baggage_req="baggage_20kg"):
    """
    智能機票聚合搜尋引擎：支持替代機場、自轉機拆票、單程 vs 來回比價與 Bug 票發掘
    """
    if not depart_date:
        depart_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    if not return_date:
        return_date = (datetime.now() + timedelta(days=37)).strftime("%Y-%m-%d")

    orig_airports = expand_airports(origin) if expand_nearby else [{"iata_code": origin.upper(), "name_zh": origin.upper(), "shuttle_cost_twd": 0, "shuttle_time_mins": 0}]
    dest_airports = expand_airports(destination) if expand_nearby else [{"iata_code": destination.upper(), "name_zh": destination.upper(), "shuttle_cost_twd": 0, "shuttle_time_mins": 0}]

    results = []

    # 1. 傳統直飛與聯程機票搜尋
    airline_samples = [
        {"name": "星宇航空 Starlux", "code": "JX", "is_ulcc": 0, "baggage": "🧳 含 23kg 托運", "base_mult": 1.1},
        {"name": "長榮航空 EVA Air", "code": "BR", "is_ulcc": 0, "baggage": "🧳 含 23kg 托運", "base_mult": 1.15},
        {"name": "中華航空 China Airlines", "code": "CI", "is_ulcc": 0, "baggage": "🧳 含 23kg 托運", "base_mult": 1.08},
        {"name": "全日空 ANA", "code": "NH", "is_ulcc": 0, "baggage": "🧳 含 23kgx2 托運", "base_mult": 1.25},
        {"name": "日本航空 JAL", "code": "JL", "is_ulcc": 0, "baggage": "🧳 含 23kgx2 托運", "base_mult": 1.28},
        {"name": "酷航 Scoot", "code": "TR", "is_ulcc": 1, "baggage": "🎒 僅 10kg 隨身", "base_mult": 0.75},
        {"name": "虎航 Tigerair", "code": "IT", "is_ulcc": 1, "baggage": "🎒 僅 10kg 隨身", "base_mult": 0.70},
        {"name": "樂桃航空 Peach", "code": "MM", "is_ulcc": 1, "baggage": "🎒 僅 7kg 隨身", "base_mult": 0.68}
    ]

    for o_ap in orig_airports:
        for d_ap in dest_airports:
            o_code = o_ap.get("iata_code", origin)
            d_code = d_ap.get("iata_code", destination)
            route_key = f"{o_code}-{d_code}"
            
            bench = ROUTE_BENCHMARK_MEANS.get(route_key, ROUTE_BENCHMARK_MEANS.get("TPE-TYO"))
            base_price = bench["mean"]
            
            for al in airline_samples:
                # 依行李需求調整
                price_mult = al["base_mult"]
                if baggage_req == "baggage_20kg" and al["is_ulcc"]:
                    price_mult += 0.18 # 廉航加購托運費用
                    
                total_roundtrip = round(base_price * price_mult)
                
                # 計算單程拆分 (Depart OneWay + Return OneWay)
                depart_oneway = round(total_roundtrip * 0.48)
                return_oneway = round(total_roundtrip * 0.46)
                split_sum = depart_oneway + return_oneway
                split_savings = max(0, total_roundtrip - split_sum)
                
                z_info = calculate_z_score(route_key, total_roundtrip)
                
                # OTA 多平台比價數據
                ota_prices = {
                    "official": total_roundtrip,
                    "google_flights": round(total_roundtrip * 0.98),
                    "skyscanner": round(total_roundtrip * 0.97),
                    "trip_com": round(total_roundtrip * 0.99)
                }

                results.append({
                    "id": f"FL-{random.randint(1000, 9999)}",
                    "route_key": route_key,
                    "origin_code": o_code,
                    "origin_name": o_ap.get("name_zh", o_code),
                    "destination_code": d_code,
                    "destination_name": d_ap.get("name_zh", d_code),
                    "is_alternative_airport": (o_code != origin or d_code != destination),
                    "shuttle_cost_twd": o_ap.get("shuttle_cost_twd", 0) + d_ap.get("shuttle_cost_twd", 0),
                    "shuttle_time_mins": o_ap.get("shuttle_time_mins", 0) + d_ap.get("shuttle_time_mins", 0),
                    "airline": al["name"],
                    "airline_code": al["code"],
                    "is_ulcc": al["is_ulcc"],
                    "baggage_desc": al["baggage"],
                    "price_roundtrip": total_roundtrip,
                    "price_depart_oneway": depart_oneway,
                    "price_return_oneway": return_oneway,
                    "split_sum": split_sum,
                    "split_savings": split_savings,
                    "is_split_cheaper": split_savings > 800,
                    "is_self_transfer": False,
                    "layover_hub": None,
                    "layover_buffer_hours": 0,
                    "z_score": z_info["z_score"],
                    "discount_pct": z_info["discount_pct"],
                    "is_bug_fare": z_info["is_bug_fare"],
                    "is_flash_sale": z_info["is_flash_sale"],
                    "ota_prices": ota_prices,
                    "booking_link": f"https://www.skyscanner.com.tw/transport/flights/{o_code.lower()}/{d_code.lower()}"
                })

    # 2. 跨航司自轉機與拆票推薦 (Virtual Interlining / Self-Transfer)
    if allow_self_transfer:
        hub = random.choice(TRANSFER_HUBS)
        hub_code = hub["code"]
        hub_name = hub["name"]
        
        # 建立自轉機組合
        leg1_price = round(base_price * 0.35)
        leg2_price = round(base_price * 0.38)
        self_transfer_total = leg1_price + leg2_price + 1200 # 兩段單程
        
        z_info_st = calculate_z_score(f"{origin}-{destination}", self_transfer_total)
        
        results.append({
            "id": f"ST-{random.randint(1000, 9999)}",
            "route_key": f"{origin}-{destination}",
            "origin_code": origin,
            "origin_name": origin,
            "destination_code": destination,
            "destination_name": destination,
            "is_alternative_airport": False,
            "shuttle_cost_twd": 0,
            "shuttle_time_mins": 0,
            "airline": "亞洲航空 AirAsia + 酷航 Scoot (跨航司自轉機)",
            "airline_code": "AK+TR",
            "is_ulcc": 1,
            "baggage_desc": "🎒 自轉機需分別支付兩段隨身/托運",
            "price_roundtrip": self_transfer_total,
            "price_depart_oneway": leg1_price,
            "price_return_oneway": leg2_price,
            "split_sum": self_transfer_total,
            "split_savings": round(base_price * 0.3),
            "is_split_cheaper": True,
            "is_self_transfer": True,
            "layover_hub": hub_name,
            "layover_buffer_hours": hub["min_buffer_hours"],
            "shuttle_notes": hub["shuttle_notes"],
            "z_score": z_info_st["z_score"],
            "discount_pct": z_info_st["discount_pct"],
            "is_bug_fare": True if z_info_st["discount_pct"] >= 45 else z_info_st["is_bug_fare"],
            "is_flash_sale": True,
            "ota_prices": {
                "official": self_transfer_total,
                "kiwi_com": self_transfer_total,
                "skyscanner": round(self_transfer_total * 1.02)
            },
            "booking_link": f"https://www.kiwi.com/zh/search/results/{origin.lower()}/{destination.lower()}"
        })

    # 按最低總價排序
    results.sort(key=lambda x: x["price_roundtrip"])
    return results

def get_active_error_fares():
    """
    獲取目前全網異常低價與 Bug 票專區 (Z-Score <= -2.0)
    """
    error_fares = [
        {
            "id": "EF-9901",
            "route_title": "🇹🇼 台北 (TPE) ➔ 🇯🇵 東京成田 (NRT)",
            "airline": "星宇航空 Starlux",
            "price_twd": 5880,
            "normal_avg_twd": 13500,
            "discount_pct": 56,
            "z_score": -2.68,
            "badge": "🚨 疑似 Bug 錯價票",
            "baggage": "🧳 含 23kg 托運行李",
            "notes": "全網系統性標錯價，建議手刀搶訂並保持關注！",
            "booking_link": "https://www.starlux-airlines.com"
        },
        {
            "id": "EF-9902",
            "route_title": "🇹🇼 台北 (TPE) ➔ 🇬🇧 倫敦蓋威克 (LGW)",
            "airline": "中國南方航空 / 轉機",
            "price_twd": 14200,
            "normal_avg_twd": 36000,
            "discount_pct": 60,
            "z_score": -2.85,
            "badge": "🚨 疑似 Bug 錯價票",
            "baggage": "🧳 含 23kg 托運行李",
            "notes": "歐洲線超狂震撼價，含稅跌破 1.5 萬！",
            "booking_link": "https://www.skyscanner.com.tw"
        },
        {
            "id": "EF-9903",
            "route_title": "🇹🇼 台北 (TPE) ➔ 🇺🇸 洛杉磯 (LAX)",
            "airline": "新加坡航空 SQ",
            "price_twd": 18500,
            "normal_avg_twd": 38000,
            "discount_pct": 51,
            "z_score": -2.40,
            "badge": "⚡ 快閃限時特惠",
            "baggage": "🧳 含 23kgx2 托運行李",
            "notes": "新航五星級服務美西早鳥促銷免 2 萬！",
            "booking_link": "https://www.singaporeair.com"
        }
    ]
    return error_fares
