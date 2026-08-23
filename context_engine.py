import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 9 大國際城市全域情境資料庫
CITY_CONTEXT_REPOSITORY = {
    'SIN': {
        'city_code': 'SIN',
        'name_zh': '新加坡 (Singapore)',
        'flag': '🇸🇬',
        'timezone': 'Asia/Singapore',
        'weather': '⛅ 30°C 晴時多雲 (熱帶氣候 ‧ 降雨率 20%)',
        'currency_code': 'SGD',
        'fx_pair': 'SGD_TWD',
        'fx_rate_str': '1 SGD = 24.35 TWD',
        'fx_rate_val': 24.35,
        'flight_destination': 'SIN',
        'flight_name': '新加坡樟宜 (SIN)',
        'flight_avg_price': 'NT$ 9,500 - 15,000',
        'flight_tips': '濱海灣金沙無邊際泳池、星耀樟宜與海南雞飯。提前 30 天預訂價格最優。',
        'budget_daily_factor': 1.25,
        'lifestyle_filter': 'Starbucks',
        'recommendation_3bullets': [
            "1. 匯率建議：SGD/TWD 現報 24.35，位處中性區間，建議按需換匯。",
            "2. 機票連動：台北-新加坡新航/星宇直飛特惠 NT$ 9,500 起，建議搭配早鳥票。",
            "3. 生活消費：新加坡星巴克全門市買一送一活動進行中，建議使用專屬優惠券。"
        ]
    },
    'TPE': {
        'city_code': 'TPE',
        'name_zh': '台北 (Taipei)',
        'flag': '🇹🇼',
        'timezone': 'Asia/Taipei',
        'weather': '☀️ 31°C 晴朗高溫 (紫外線偏強 ‧ 降雨率 10%)',
        'currency_code': 'TWD',
        'fx_pair': 'USD_TWD',
        'fx_rate_str': '1 USD = 32.05 TWD',
        'fx_rate_val': 32.05,
        'flight_destination': 'TPE',
        'flight_name': '台北桃園/松山 (TPE/TSA)',
        'flight_avg_price': '基地母港起飛',
        'flight_tips': '亞洲樞紐轉運中心，可連線全球 30 大熱門國家門戶航線。',
        'budget_daily_factor': 1.0,
        'lifestyle_filter': 'all',
        'recommendation_3bullets': [
            "1. 資產防禦：台幣匯率與美股科技連動強烈，目前現金流可支持 15 個月防禦資產。",
            "2. 樞紐策略：以台北為起點，現正監控 5 條大跌 > 20% 的快閃 bug 票航線。",
            "3. 景點智庫：已同步索引台北 4.5★ 以上爆紅 IG/小紅書打卡秘境。"
        ]
    },
    'LAX': {
        'city_code': 'LAX',
        'name_zh': '洛杉磯 (Los Angeles)',
        'flag': '🇺🇸',
        'timezone': 'America/Los_Angeles',
        'weather': '☀️ 24°C 晴朗乾燥 (日夜溫差大 ‧ 降雨率 0%)',
        'currency_code': 'USD',
        'fx_pair': 'USD_TWD',
        'fx_rate_str': '1 USD = 32.05 TWD',
        'fx_rate_val': 32.05,
        'flight_destination': 'LAX',
        'flight_name': '洛杉磯國際機場 (LAX)',
        'flight_avg_price': 'NT$ 26,500 - 34,000',
        'flight_tips': '好萊塢影城、好萊塢地標與 MLB 觀賽必備。美西自駕倒數 42 天。',
        'budget_daily_factor': 1.45,
        'lifestyle_filter': 'FastFood',
        'recommendation_3bullets': [
            "1. 自駕籌備：美西縱貫公路自駕倒數中，租車與大峽谷門票已鎖定優惠。",
            "2. 避險匯率：美元/台幣現報 32.05，建議分批鎖定旅行預算所需美金。",
            "3. 航班動態：星宇/長榮 BR12 已完成開票，搭乘最新 A350-900 旗艦客機。"
        ]
    },
    'SEA': {
        'city_code': 'SEA',
        'name_zh': '西雅圖 (Seattle)',
        'flag': '🇺🇸',
        'timezone': 'America/Los_Angeles',
        'weather': '🌥️ 20°C 舒適多雲 (涼爽微風 ‧ 降雨率 15%)',
        'currency_code': 'USD',
        'fx_pair': 'USD_TWD',
        'fx_rate_str': '1 USD = 32.05 TWD',
        'fx_rate_val': 32.05,
        'flight_destination': 'SEA',
        'flight_name': '西雅圖塔科馬 (SEA)',
        'flight_avg_price': 'NT$ 28,000 - 36,000',
        'flight_tips': '派克市場、第一家星巴克創始店與太空針塔。美西公路旅行首選起點。',
        'budget_daily_factor': 1.4,
        'lifestyle_filter': 'Starbucks',
        'recommendation_3bullets': [
            "1. 航線優勢：星宇/長榮/達美三強競爭直飛西雅圖，票價自高點回落 18%。",
            "2. 景點規劃：派克市場飛魚秀與第一家星巴克創始店已納入自訂行程表。",
            "3. 天氣建議：氣溫舒適偏涼，建議準備輕便防風外套。"
        ]
    },
    'LAS': {
        'city_code': 'LAS',
        'name_zh': '拉斯維加斯 (Las Vegas)',
        'flag': '🇺🇸',
        'timezone': 'America/Los_Angeles',
        'weather': '☀️ 36°C 艷陽乾燥 (防曬保濕 ‧ 降雨率 0%)',
        'currency_code': 'USD',
        'fx_pair': 'USD_TWD',
        'fx_rate_str': '1 USD = 32.05 TWD',
        'fx_rate_val': 32.05,
        'flight_destination': 'LAS',
        'flight_name': '麥卡倫國際機場 (LAS)',
        'flight_avg_price': 'NT$ 31,000 - 41,000',
        'flight_tips': '不夜城娛樂、大峽谷與圓石灘高爾夫奢華度假核心門戶。',
        'budget_daily_factor': 1.5,
        'lifestyle_filter': 'Dining',
        'recommendation_3bullets': [
            "1. 高爾夫預訂：圓石灘與名門球場建議提前 60 天鎖定 Tee Time。",
            "2. 大峽谷自駕：從賭城出發至大峽谷南緣約 4.5 小時，車程順暢。",
            "3. 預算提醒：酒店 Resort Fee 與娛樂消費較高，建議調高預算安全邊際。"
        ]
    },
    'SGN': {
        'city_code': 'SGN',
        'name_zh': '胡志明市 (Ho Chi Minh City)',
        'flag': '🇻🇳',
        'timezone': 'Asia/Ho_Chi_Minh',
        'weather': '🌦️ 32°C 午後雷陣雨 (濕度 78% ‧ 出門備傘)',
        'currency_code': 'VND',
        'fx_pair': 'USD_VND',
        'fx_rate_str': '1 USD = 25,400 VND',
        'fx_rate_val': 25400,
        'flight_destination': 'SGN',
        'flight_name': '胡志明新山一 (SGN)',
        'flight_avg_price': 'NT$ 7,200 - 11,500',
        'flight_tips': '粉紅教堂、法式咖啡館與越式河粉。性價比極高的東南亞渡假首選。',
        'budget_daily_factor': 0.65,
        'lifestyle_filter': 'Dining',
        'recommendation_3bullets': [
            "1. 套利避險：越南美金兌換越盾匯率處於歷史高位 25,400，消費極具優勢。",
            "2. 渡假高爾夫：越南頂級高爾夫球場 18 洞含桿弟僅需約 NT$ 2,500。",
            "3. 機票推薦：越捷與星宇競價中，來回機票低於 NT$ 8,000 時可立即手刀開票。"
        ]
    },
    'LON': {
        'city_code': 'LON',
        'name_zh': '倫敦 (London)',
        'flag': '🇬🇧',
        'timezone': 'Europe/London',
        'weather': '☁️ 19°C 陰時多雲 (氣溫涼爽 ‧ 降雨率 30%)',
        'currency_code': 'GBP',
        'fx_pair': 'GBP_TWD',
        'fx_rate_str': '1 GBP = 41.50 TWD',
        'fx_rate_val': 41.5,
        'flight_destination': 'LHR',
        'flight_name': '倫敦希斯洛 (LHR)',
        'flight_avg_price': 'NT$ 33,000 - 44,000',
        'flight_tips': '大英博物館、大笨鐘與倫敦眼。阿聯酋/土航轉機可省下 30% 票價。',
        'budget_daily_factor': 1.6,
        'lifestyle_filter': 'Lifestyle',
        'recommendation_3bullets': [
            "1. 轉機省錢：選擇阿聯酋 (DXB) 或土航 (IST) 轉機，票價省 30% 且送 2*23kg 行李。",
            "2. 英鎊匯率：英鎊/台幣現報 41.50，高於 52 週均值，建議適度提早避險。",
            "3. 歐州快線：大英博物館與百老匯歌劇預訂已寫入 Headless 資料庫。"
        ]
    },
    'PAR': {
        'city_code': 'PAR',
        'name_zh': '巴黎 (Paris)',
        'flag': '🇫🇷',
        'timezone': 'Europe/Paris',
        'weather': '⛅ 22°C 微風多雲 (早晚偏涼 ‧ 降雨率 10%)',
        'currency_code': 'EUR',
        'fx_pair': 'EUR_TWD',
        'fx_rate_str': '1 EUR = 34.80 TWD',
        'fx_rate_val': 34.80,
        'flight_destination': 'CDG',
        'flight_name': '巴黎戴高樂 (CDG)',
        'flight_avg_price': 'NT$ 32,000 - 42,000',
        'flight_tips': '艾菲爾鐵塔、羅浮宮與米其林三星美饌首選。長榮直飛約 13.5 小時。',
        'budget_daily_factor': 1.55,
        'lifestyle_filter': 'Dining',
        'recommendation_3bullets': [
            "1. 直飛首選：長榮航空台北-巴黎直飛優惠票 NT$ 31,800 開放預訂。",
            "2. 申根免簽：台灣護照享 90 天免簽，跨國搭乘歐洲之星高鐵極方便。",
            "3. 米其林指南：羅浮宮與米其林三星名店需提前 90 天卡位。"
        ]
    },
    'TYO': {
        'city_code': 'TYO',
        'name_zh': '東京 (Tokyo)',
        'flag': '🇯🇵',
        'timezone': 'Asia/Tokyo',
        'weather': '☀️ 29°C 晴朗微熱 (日照充足 ‧ 降雨率 5%)',
        'currency_code': 'JPY',
        'fx_pair': 'JPY_TWD',
        'fx_rate_str': '100 JPY = 21.20 TWD',
        'fx_rate_val': 0.212,
        'flight_destination': 'NRT',
        'flight_name': '東京成田/羽田 (NRT/HND)',
        'flight_avg_price': 'NT$ 11,000 - 16,000',
        'flight_tips': '晴空塔、淺草寺、澀谷 Sky 與名門高爾夫球場巡禮首選。',
        'budget_daily_factor': 1.15,
        'lifestyle_filter': 'Dining',
        'recommendation_3bullets': [
            "1. 日圓抄底：日幣兌台幣處於 0.212 極低歷史關卡，大舉提高消費套利空間！",
            "2. 高爾夫之旅：千葉與茨城名門高爾夫球場，專車接送與 T-Time 已就緒。",
            "3. 爆紅景點：澀谷 Sky 與teamLab 已索引 50,000 筆社群評價。"
        ]
    }
}

def get_city_context_bundle(city_code='SIN'):
    return CITY_CONTEXT_REPOSITORY.get(city_code, CITY_CONTEXT_REPOSITORY['SIN'])
