import sys
import time

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 全球頂級潮牌與奢華時尚即時動態庫 (自動換算為新台幣 NT$)
STREETWEAR_DROPS = [
    {
        "id": "drop-001",
        "brand": "Supreme",
        "title": "Supreme x Nike Air Force 1 Low 聯名限定款",
        "original_price": "$128 USD",
        "twd_price": "NT$ 4,100",
        "twd_val": 4100,
        "category": "👟 潮流球鞋",
        "status": "🔥 本週搶購熱選",
        "release_date": "2026-08-27 (週四發售)",
        "source_url": "https://www.supreme.com",
        "description": "經典全白皮革搭配側邊紅底 Box Logo 壓印，全球潮流玩家必收必備款式。"
    },
    {
        "id": "drop-002",
        "brand": "Stüssy",
        "title": "Stüssy 8-Ball Pigment Dyed 復古抓絨帽T",
        "original_price": "$135 USD",
        "twd_price": "NT$ 4,320",
        "twd_val": 4320,
        "category": "👕 街頭服飾",
        "status": "⚡ 即將售罄",
        "release_date": "2026-08-25 (今日開賣)",
        "source_url": "https://www.stussy.com",
        "description": "重磅水洗水洗棉質配背後經典 8 號黑球印花，美式街頭極簡風格必備。"
    },
    {
        "id": "drop-003",
        "brand": "Fear of God Essentials",
        "title": "Essentials Core Collection 霧面墨黑極簡衛衣",
        "original_price": "$100 USD",
        "twd_price": "NT$ 3,200",
        "twd_val": 3200,
        "category": "🧥 奢華休閒",
        "status": "🟢 現貨熱銷",
        "release_date": "現正熱賣中",
        "source_url": "https://fearofgod.com",
        "description": "Jerry Lorenzo 經典剪裁，立體矽膠植絨 Logo，極簡曜石黑高質感打底必備。"
    },
    {
        "id": "drop-004",
        "brand": "Chrome Hearts",
        "title": "Chrome Hearts 十字架純銀刺繡網帽 (Black/Silver)",
        "original_price": "$385 USD",
        "twd_price": "NT$ 12,340",
        "twd_val": 12340,
        "category": "🧢 精品配件",
        "status": "💎 限量極珍稀",
        "release_date": "門市抽籤限定",
        "source_url": "https://www.chromehearts.com",
        "description": "經典 925 純銀銀扣與頂級十字架刺繡，頂級名流與潮流明星最愛配飾。"
    },
    {
        "id": "drop-005",
        "brand": "Kith",
        "title": "Kith x New Balance 990v6 聯名賽車灰慢跑鞋",
        "original_price": "$220 USD",
        "twd_price": "NT$ 7,050",
        "twd_val": 7050,
        "category": "👟 聯名限量",
        "status": "🔥 爆款預告",
        "release_date": "2026-08-29 (全球抽籤)",
        "source_url": "https://kith.com",
        "description": "Ronnie Fieg 獨家調色賽車灰麂皮，搭載 FuelCell 頂級緩震中底科技。"
    },
    {
        "id": "drop-006",
        "brand": "Gentle Monster",
        "title": "Gentle Monster Bold 系列鈦金屬墨鏡 (Matrix 01)",
        "original_price": "$330 USD",
        "twd_price": "NT$ 10,580",
        "twd_val": 10580,
        "category": "🕶️ 時尚眼鏡",
        "status": "🟢 現貨供應",
        "release_date": "現正熱賣中",
        "source_url": "https://www.gentlemonster.com",
        "description": "前衛星辰金屬鑲嵌設計，修飾臉型首選，韓國明星與時尚週必備熱單。"
    },
    {
        "id": "drop-007",
        "brand": "Palace",
        "title": "Palace Tri-Ferg 經典三稜鏡重磅 T-Shirt (Obsidian)",
        "original_price": "£48 GBP",
        "twd_price": "NT$ 1,990",
        "twd_val": 1990,
        "category": "👕 街頭服飾",
        "status": "⚡ 倫敦直郵",
        "release_date": "週五新品發售",
        "source_url": "https://palaceskateboards.com",
        "description": "倫敦板仔品牌龍頭，背後經典 Tri-Ferg 三角形 Logo 曜石黑限定配色。"
    },
    {
        "id": "drop-008",
        "brand": "Human Made",
        "title": "Human Made Nigo 鴨子圖騰美式復古帆布包",
        "original_price": "¥14,800 JPY",
        "twd_price": "NT$ 3,140",
        "twd_val": 3140,
        "category": "👜 潮牌包款",
        "status": "🟢 東京門市限定",
        "release_date": "東京直營店發售",
        "source_url": "https://humanmade.jp",
        "description": "NIGO 經典美式復古咔嘰風格，高品質重磅帆布配可愛獨家北極熊/鴨子繪圖。"
    }
]

def get_streetwear_feed(brand_filter='all'):
    """
    回傳世界潮牌動態牆 (100% 標註新台幣 NT$)
    """
    if brand_filter == 'all':
        return STREETWEAR_DROPS
    return [item for item in STREETWEAR_DROPS if item['brand'].lower() == brand_filter.lower()]
