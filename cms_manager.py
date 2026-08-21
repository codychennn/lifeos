import database

def generate_curated_map_list(city_name: str, category: str):
    """
    Generates a curated Google Maps list URL for a specific city & category.
    Example: '洛杉磯景點地圖', 'Vegas 美食地圖', '西雅圖咖啡地圖'
    """
    query = f"{city_name} {category} 景點地圖"
    encoded_query = query.replace(" ", "+")
    return {
        "title": f"{city_name} {category} 精選地圖清單",
        "google_maps_list_url": f"https://www.google.com/maps/search/{encoded_query}",
        "city_name": city_name,
        "category": category
    }

def check_place_operational_status(places: list):
    """
    Scans list of places and returns operational summary & warnings for closed/temporarily closed items.
    """
    operational_count = 0
    closed_items = []
    
    for place in places:
        status = place.get("status", "operational")
        if status == "operational":
            operational_count += 1
        else:
            closed_items.append({
                "id": place.get("id"),
                "title": place.get("title"),
                "status": status,
                "warning": f"警告：[{place.get('title')}] 目前狀態為 {status}，建議管理者更新！"
            })
            
    return {
        "total": len(places),
        "operational": operational_count,
        "closed_warnings": closed_items
    }
