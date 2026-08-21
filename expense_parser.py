import re
import datetime

CATEGORY_KEYWORDS = {
    "飲食": [
        "午餐", "晚餐", "早餐", "下午茶", "飲料", "咖啡", "吃飯", "便當", "拉麵", "火鍋", 
        "超商", "全家", "7-11", "點心", "宵夜", "啤酒", "水果", "麵包", "肯德基", "麥當勞", 
        "星巴克", "手搖", "珍珠奶茶", "肉包", "外送", "UberEats", "Foodpanda"
    ],
    "交通": [
        "高鐵", "台鐵", "捷運", "公車", "計程車", "Uber", "油錢", "加油", "停車", 
        "悠遊卡", "一卡通", "車資", "租車", "機車", "過路費", "機票", "高鐵票", "車票"
    ],
    "購物": [
        "買", "衣服", "鞋子", "購物", "網購", "蝦皮", "淘寶", "亞馬遜", "日用品", 
        "電器", "手機", "雜貨", "美妝", "保養品", "包包", "特賣"
    ],
    "娛樂": [
        "電影", "遊戲", "Steam", "門票", "展覽", "唱歌", "KTV", "旅遊", "住宿", 
        "飯店", "民宿", "景點", "健身", "課金", "演唱會", "訂閱", "Netflix", "Spotify"
    ],
    "日常": [
        "水電", "房租", "電費", "水費", "瓦斯", "網路", "寬頻", "電話費", "電信", 
        "保險", "醫療", "看診", "藥局", "看醫生", "健保", "學費", "手續費"
    ]
}

def parse_expense_text(text: str):
    """
    Parses natural language input text into (item, amount, category).
    Examples:
        "午餐 150" -> ("午餐", 150.0, "飲食")
        "搭計程車 300 交通" -> ("搭計程車", 300.0, "交通")
        "1200 買衣服" -> ("買衣服", 1200.0, "購物")
    """
    if not text or not text.strip():
        raise ValueError("輸入文字不能為空")

    clean_text = text.strip()
    
    # 1. 尋找數字 (包含小數點與前綴字符 $, NT$)
    amount_match = re.search(r'(?:NT\$|\$|\b)?(\d+(?:\.\d{1,2})?)\b', clean_text, re.IGNORECASE)
    
    if not amount_match:
        raise ValueError("未包含有效的金額數字 (例如：午餐 150)")
        
    amount = float(amount_match.group(1))
    
    # 2. 移除金額部份，保留項目描述與分類
    # 移除如 $150, NT$150, 150 等
    item_part = re.sub(r'(?:NT\$|\$|\b)\d+(?:\.\d{1,2})?\b', '', clean_text, flags=re.IGNORECASE).strip()
    
    # 清理多餘符號
    item_part = re.sub(r'[\s,，]+', ' ', item_part).strip()
    
    # 3. 檢查是否有顯式指定分類 (如在結尾或獨立詞： "交通", "飲食")
    explicit_category = None
    tokens = item_part.split()
    for token in tokens:
        if token in CATEGORY_KEYWORDS.keys():
            explicit_category = token
            tokens.remove(token)
            break
            
    item_name = " ".join(tokens).strip() if tokens else "一般支出"
    if not item_name:
        item_name = "一般支出"

    # 4. 自動判定分類
    category = explicit_category
    if not category:
        for cat, keywords in CATEGORY_KEYWORDS.items():
            if any(kw in clean_text for kw in keywords):
                category = cat
                break
                
    if not category:
        category = "其他"

    return {
        "item": item_name,
        "amount": amount,
        "category": category,
        "expense_date": datetime.date.today().strftime('%Y-%m-%d'),
        "raw_text": text
    }

if __name__ == "__main__":
    test_cases = [
        "午餐 150",
        "搭計程車 300 交通",
        "1200 買衣服",
        "星巴克咖啡 $165",
        "水電費 1250"
    ]
    for tc in test_cases:
        res = parse_expense_text(tc)
        print(f"Input: '{tc}' -> {res}")
