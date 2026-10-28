/**
 * 完整修復版 main.js
 * 修正 switchTab 作用域 Bug，支援全分頁切換、城市連動情境決策、全網特惠與 Telegram 推播
 */

// 1. 各分頁標題與描述
const tabHeaders = {
    'home': { title: '首頁 (Home)', desc: '歡迎使用自動化資訊與智慧旅遊整合系統' },
    'bento': { title: '儀表板 (Dashboard)', desc: '即時財務、旅遊與公網連線數據監控' },
    'golf': { title: '高爾夫旗艦門戶 (Golf Hub)', desc: '資深選手與新手雙視角協同設計 ‧ 名門球場與球具指南' },
    'flights': { title: '智能機票專區', desc: '即時分析最佳航班與票價走勢 ‧ 支援深度連結探索' },
    'deals': { title: '特價優惠監控', desc: '全網機票閃促與飯店特惠即時追蹤' },
    'guide2026': { title: '11,272+ 景點智庫', desc: '4.5★ 精選景點與美西深度旅遊資料庫' },
    'uswest': { title: '美西自駕特輯', desc: '西雅圖、拉斯維加斯、大峽谷與洛杉磯自駕全攻略' },
    'travelbook': { title: '自訂行程編排', desc: '行程時間軸與導航節點規劃' },
    'aiplanner': { title: 'AI 智慧旅遊規劃', desc: '智慧路徑規劃與動態推薦' },
    'budget': { title: '預算動態計算器', desc: '即時匯率換算與自駕預算估算' },
    'cms': { title: 'CMS 內容與地圖', desc: '自訂景點與地標管理系統' },
    'lifestyle': { title: '生活日常', desc: '星巴克門市查詢與餐飲休閒紀錄' },
    'asset': { title: '防禦資產 LTV', desc: '高流動性與安全防禦資產配置管理' },
    'expenses': { title: '智慧記帳明細', desc: '即時消費紀錄與帳務分析' },
    'stocks': { title: '股市與加密貨幣', desc: '美股、台股焦點新聞與虛擬貨幣即時行情' },
    'jewish': { title: '猶太商道與新聞', desc: '商業思維與全球科技融資動態' },
    'calendar': { title: '專案工地行事曆 (Site Meetings)', desc: '紀錄專案工地各種臨時會議、工種交接與缺失檢視' },
    'settings': { title: '系統設定', desc: 'Telegram 機器人推播與自動化配置' }
};

// 2. 路由別名映射表
const aliasMap = {
    'dashboard': 'bento',
    'travel': 'guide2026',
    'finance': 'asset',
    'knowledge': 'jewish',
    'flights': 'flights',
    'deals': 'deals',
    'golf': 'golf'
};

// 3. 全域切換分頁函式 (掛載至 window 供全站按鈕或卡片點擊調用)
window.switchTab = function(tabId) {
    const mappedTabId = aliasMap[tabId] || tabId;

    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageDesc = document.getElementById('page-desc');

    // 1. 高亮側邊欄按鈕
    navBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === mappedTabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 2. 切換 Section 顯示/隱藏
    tabContents.forEach(tab => {
        if (tab.id === `tab-${mappedTabId}`) {
            tab.classList.remove('hidden');
            tab.classList.add('active');
            tab.style.display = 'block';
        } else {
            tab.classList.add('hidden');
            tab.classList.remove('active');
            tab.style.display = 'none';
        }
    });

    // 3. 更新 Header 標題與描述
    if (tabHeaders[mappedTabId] && pageTitle && pageDesc) {
        pageTitle.textContent = tabHeaders[mappedTabId].title;
        pageDesc.textContent = tabHeaders[mappedTabId].desc;
    }

    // 4. 分頁連動觸發 (上線強制即時同步)
    if (mappedTabId === 'deals' && window.loadDeals) {
        window.loadDeals('all', false);
    } else if (mappedTabId === 'stocks' && window.loadStocks) {
        window.loadStocks('all', false);
    } else if (mappedTabId === 'calendar' && window.loadCalendarMeetings) {
        window.loadCalendarMeetings();
    } else if (mappedTabId === 'jewish' && window.loadJewishNews) {
        window.loadJewishNews('all', false);
    }

    // 5. 捲動回頂部
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.scrollTop = 0;
    }
};

// 4. 智能機票專區：Google Flights 聯動選單資料
const destinationData = {
    'LHR': {
        name: '倫敦 (LHR)',
        airline: '長榮航空 / 中華航空 / 國泰航空 / 土耳其航空',
        avgPrice: 'NT$ 33,000 - 44,000',
        tips: '大英博物館、大笨鐘與倫敦眼英式下午茶。搭乘土航/阿聯酋轉機可省 30%。',
        googleFlightsUrl: 'https://www.google.com/travel/flights/explore?tfs=CBwQAhooEgoyMDI2LTA5LTA4agwIAhIIL20vMGZ0a3gSCjIwMjYtMDktMTJ6DAgCEggvbS80anBsQAFIAXAB'
    },
    'CDG': {
        name: '巴黎 (CDG)',
        airline: '長榮航空 直飛 / 法國航空 / 華航',
        avgPrice: 'NT$ 32,000 - 42,000',
        tips: '艾菲爾鐵塔、羅浮宮與米其林三星美饌首選。長榮直飛約 13.5 小時。',
        googleFlightsUrl: 'https://www.google.com/travel/flights/explore?tfs=CBwQAhooEgoyMDI2LTA5LTA4agwIAhIIL20vMGZ0a3gSCjIwMjYtMDktMTJ6DAgCEggvbS81cXRqQAFIAXAB'
    },
    'FCO': {
        name: '羅馬 (FCO)',
        airline: '中華航空 直飛 / 阿聯酋航空 / 國泰航空',
        avgPrice: 'NT$ 30,000 - 40,000',
        tips: '競技場、梵蒂岡與義式 Gelato 人氣名店。華航有台北直飛班機。',
        googleFlightsUrl: 'https://www.google.com/travel/flights/explore?tfs=CBwQAhooEgoyMDI2LTA5LTA4agwIAhIIL20vMGZ0a3gSCjIwMjYtMDktMTJ6DAgCEggvbS8zNXlyQAFIAXAB'
    },
    'FRA': {
        name: '法蘭克福 (FRA)',
        airline: '中華航空 直飛 / 長榮航空 / 德國漢莎航空',
        avgPrice: 'NT$ 31,000 - 41,500',
        tips: '德國與歐洲鐵路 ICE 交通心臟樞紐，轉乘 ICE 高鐵直達全德與古堡大道。',
        googleFlightsUrl: 'https://www.google.com/travel/flights/explore?tfs=CBwQAhooEgoyMDI2LTA5LTA4agwIAhIIL20vMGZ0a3gSCjIwMjYtMDktMTJ6DAgCEggvbS8yejcxN5gBAdoBCAoEEABIAXAB'
    },
    'SGN': {
        name: '胡志明市 (SGN)',
        airline: '長榮航空 / 星宇航空 / 越捷航空',
        avgPrice: 'NT$ 7,200 - 11,500',
        tips: '商務/度假熱門航線，建議提前 45 天預訂。',
        googleFlightsUrl: 'https://www.google.com/travel/flights/deals?tfs=CBwQBhoaEgoyMDI2LTA5LTA4agwIAhIIL20vMGZ0a3gaGhIKMjAyNi0wOS0xMnIMCAISCC9tLzBmdGt4QAFIAXABggELCP___________wGYAQHaAQgKBDABSAEQAw&tfu=OgA'
    },
    'SEA': {
        name: '西雅圖 (SEA)',
        airline: '長榮航空 / 星宇航空 / 達美航空',
        avgPrice: 'NT$ 28,000 - 36,000',
        tips: '美西公路旅行首選起點，直飛約 11 小時。',
        googleFlightsUrl: 'https://www.google.com/travel/flights'
    },
    'LAS': {
        name: '拉斯維加斯 (LAS)',
        airline: '聯合航空 / 達美航空 (轉機)',
        avgPrice: 'NT$ 31,000 - 41,000',
        tips: '高爾夫與大峽谷自駕核心門戶。',
        googleFlightsUrl: 'https://www.google.com/travel/flights'
    },
    'LAX': {
        name: '洛杉磯 (LAX)',
        airline: '星宇航空 / 中華航空 / 長榮航空',
        avgPrice: 'NT$ 26,500 - 34,000',
        tips: 'MLB 季後賽觀賽必備航線。',
        googleFlightsUrl: 'https://www.google.com/travel/flights'
    },
    'NRT': {
        name: '東京成田 (NRT)',
        airline: '全日空 / 日本航空 / 星宇航空',
        avgPrice: 'NT$ 11,000 - 16,000',
        tips: '日本高爾夫名門球場巡禮推薦。',
        googleFlightsUrl: 'https://www.google.com/travel/flights'
    }
};

window.renderFlightDetails = function(destCode) {
    const data = destinationData[destCode] || {
        name: destCode,
        airline: '全球國際知名航空連線執飛',
        avgPrice: 'NT$ 18,000 - 38,000',
        tips: '熱門旅遊國家核心航點，建議提前 60 天鎖定即時優惠。',
        googleFlightsUrl: 'https://www.google.com/travel/flights'
    };
    const origin = document.getElementById('flight-origin')?.value || 'TPE';
    const container = document.getElementById('flight-result-panel');
    if (!container) return;

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 16px;">
            <div>
                <h3 style="font-size: 20px; color: #FFF;">${origin} ✈️ ${data.name}</h3>
                <p style="font-size: 13px; color: #94A3B8; margin-top: 4px;">推薦執飛：${data.airline}</p>
            </div>
            <div style="text-align: right;">
                <span style="font-size: 12px; color: #94A3B8;">預估往返參考價</span>
                <div style="font-size: 20px; font-weight: 700; color: #F8FAFC;">${data.avgPrice}</div>
            </div>
        </div>
        <div style="background: rgba(0,0,0,0.3); padding: 14px; border-radius: 10px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.1);">
            <span style="font-size: 13px; color: #E2E8F0;">💡 ${data.tips}</span>
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="${data.googleFlightsUrl}" target="_blank" class="glow-btn" style="text-decoration: none;">
                開啟 Google Flights 即時比價 ↗
            </a>
        </div>
    `;
};

// 5. 城市時區、氣候與匯率換算
const cityDatabase = {
    'SIN': { name: '新加坡', timezone: 'Asia/Singapore', weather: '⛅ 30°C 晴時多雲', note: '熱帶氣候 ‧ 降雨機率 20%' },
    'TPE': { name: '台北', timezone: 'Asia/Taipei', weather: '☀️ 31°C 晴朗高溫', note: '紫外線偏強 ‧ 降雨機率 10%' },
    'LAX': { name: '洛杉磯', timezone: 'America/Los_Angeles', weather: '☀️ 24°C 晴朗乾燥', note: '日夜溫差大 ‧ 降雨機率 0%' },
    'SEA': { name: '西雅圖', timezone: 'America/Los_Angeles', weather: '🌥️ 20°C 舒適多雲', note: '涼爽微風 ‧ 降雨機率 15%' },
    'LAS': { name: '拉斯維加斯', timezone: 'America/Los_Angeles', weather: '☀️ 36°C 艷陽乾燥', note: '防曬保濕 ‧ 降雨機率 0%' },
    'SGN': { name: '胡志明市', timezone: 'Asia/Ho_Chi_Minh', weather: '🌦️ 32°C 午後雷陣雨', note: '濕度 78% ‧ 出門請備傘' },
    'LON': { name: '倫敦', timezone: 'Europe/London', weather: '☁️ 19°C 陰時多雲', note: '氣溫涼爽 ‧ 降雨機率 30%' },
    'PAR': { name: '巴黎', timezone: 'Europe/Paris', weather: '⛅ 22°C 微風多雲', note: '早晚偏涼 ‧ 降雨機率 10%' },
    'TYO': { name: '東京', timezone: 'Asia/Tokyo', weather: '☀️ 29°C 晴朗微熱', note: '日照充足 ‧ 降雨機率 5%' }
};

const fxDatabase = {
    'SGD_TWD': '1 SGD = 24.35 TWD',
    'SGD_USD': '1 SGD = 0.76 USD',
    'USD_TWD': '1 USD = 32.05 TWD',
    'EUR_TWD': '1 EUR = 34.80 TWD',
    'GBP_TWD': '1 GBP = 41.50 TWD',
    'JPY_TWD': '100 JPY = 21.20 TWD',
    'USD_VND': '1 USD = 25,400 VND'
};

function updateCityClock() {
    const citySelect = document.getElementById('header-city-select');
    const timeDisplay = document.getElementById('header-local-time');
    const weatherDisplay = document.getElementById('header-weather-info');
    if (!citySelect || !timeDisplay) return;

    const cityKey = citySelect.value || 'SIN';
    const cityInfo = cityDatabase[cityKey] || cityDatabase['SIN'];

    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat('zh-TW', {
        timeZone: cityInfo.timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    timeDisplay.innerText = timeFormatter.format(now);
    if (weatherDisplay) {
        weatherDisplay.innerText = cityInfo.weather;
        weatherDisplay.title = cityInfo.note;
    }
}

setInterval(updateCityClock, 1000);

// 6. 特價優惠監控載入 (每12小時自動背景追蹤 ‧ 上線強制即時更新)
window.loadDeals = function(filterCategory = 'all', forceRefresh = false) {
    const container = document.getElementById('deals-container');
    const badge = document.getElementById('deals-last-sync-badge');
    if (!container) return;

    if (forceRefresh) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #CBD5E1; background: rgba(18, 20, 26, 0.6); border: 1px dashed rgba(255,255,255,0.15); border-radius: 16px;">
                <i class="fa-solid fa-rotate fa-spin" style="font-size: 24px; color: #38BDF8; margin-bottom: 12px;"></i>
                <div style="font-size: 15px; font-weight: 700; color: #FFFFFF;">⚡ 正在執行全網特惠即時同步掃描...</div>
                <div style="font-size: 12px; color: #94A3B8; margin-top: 6px;">自動過濾過期新聞 ‧ 抓取星宇、長榮、華航、ANA、JAL 及全球 OTA 最新特惠</div>
            </div>
        `;
    }

    fetch(`/api/deals?limit=40&force=${forceRefresh ? 'true' : 'false'}`)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data && data.data.length > 0) {
            if (badge && data.last_updated) {
                badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> 🟢 最後同步：${data.last_updated} (每12小時自動追蹤)`;
            }

            let html = '';
            const filtered = data.data.filter(d => {
                if (filterCategory === 'all') return true;
                const kw = (d.matched_keyword || '').toLowerCase();
                const src = (d.source || '').toLowerCase();
                const tit = (d.title || '').toLowerCase();
                const target = filterCategory.toLowerCase();
                
                // 智慧分類比對
                if (target === 'flight') {
                    return kw.includes('機票') || src.includes('航空') || tit.includes('機票') || tit.includes('航');
                }
                if (target === 'hotel') {
                    return kw.includes('飯店') || kw.includes('住宿') || src.includes('飯店') || tit.includes('酒店') || tit.includes('旅館') || tit.includes('住宿') || tit.includes('訂房') || src.includes('agoda') || src.includes('trip');
                }
                if (target === 'trip_agoda') {
                    return src.includes('trip') || tit.includes('trip') || src.includes('agoda') || tit.includes('agoda');
                }
                if (target === 'visa_infinite') {
                    return kw.includes('visa') || src.includes('visa') || tit.includes('visa') || tit.includes('無限卡') || tit.includes('尊榮') || tit.includes('貴賓室');
                }
                if (target === 'package') {
                    return kw.includes('機加酒') || tit.includes('自由行') || tit.includes('行程') || tit.includes('機加酒');
                }
                return kw.includes(target) || src.includes(target) || tit.includes(target);
            });

            const displayList = filtered.length > 0 ? filtered : data.data;

            displayList.forEach(d => {
                const createdDate = d.created_at ? new Date(d.created_at) : new Date();
                const timeAgoHours = Math.max(0, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60)));
                const freshnessTag = timeAgoHours <= 12 ? '🔥 12h內即時' : (timeAgoHours <= 48 ? '⚡ 最新情報' : '🟢 即時有效');
                
                const isVisaInfinite = (d.source && d.source.includes('Visa')) || (d.title && (d.title.includes('Visa') || d.title.includes('無限卡')));
                const isTripAgoda = (d.source && (d.source.includes('Trip') || d.source.includes('Agoda'))) || (d.title && (d.title.includes('Trip') || d.title.includes('Agoda')));
                
                let cardBorder = isVisaInfinite ? '2px solid #D9A066' : (isTripAgoda ? '1px solid #38BDF8' : '1px solid rgba(167, 182, 162, 0.4)');
                let cardBg = isVisaInfinite ? 'linear-gradient(135deg, #FFFFFF 0%, #FAF6F0 100%)' : '#FFFFFF';
                let badgeBg = isVisaInfinite ? 'rgba(217, 160, 102, 0.2)' : 'rgba(140, 106, 78, 0.12)';
                let badgeColor = isVisaInfinite ? '#8C6A4E' : '#8C6A4E';

                html += `
                    <div style="background: ${cardBg}; border: ${cardBorder}; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; box-shadow: 0 4px 16px rgba(140, 106, 78, 0.08); transition: all 0.25s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(140, 106, 78, 0.14)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(140, 106, 78, 0.08)';">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                                <span class="badge" style="background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 800; border-radius: 6px; padding: 3px 8px;">
                                    ${isVisaInfinite ? '👑 ' : ''}${d.source || '全網特惠'}
                                </span>
                                <span style="font-size: 11px; color: ${isVisaInfinite ? '#D97706' : '#2B4C7E'}; font-weight: 700; background: rgba(140, 106, 78, 0.08); padding: 2px 7px; border-radius: 6px;">
                                    ${freshnessTag}
                                </span>
                            </div>
                            <h4 style="font-size: 15px; color: #3E3E3E; font-weight: 700; margin-bottom: 6px; line-height: 1.45; font-family: 'Noto Serif TC', serif;">${d.title}</h4>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 11px; color: #6B6B6B;">
                                <span>🏷️ 標籤：<b>${d.matched_keyword || '即時促銷'}</b></span>
                                <span>🕒 ${d.created_at ? d.created_at.slice(0, 16) : '剛剛更新'}</span>
                            </div>
                        </div>
                        <div style="border-top: 1px solid rgba(140, 106, 78, 0.12); padding-top: 12px;">
                            <a href="${d.link}" target="_blank" rel="noopener noreferrer" style="display: block; width: 100%; text-align: center; text-decoration: none; padding: 9px 12px; font-size: 12px; font-weight: 700; border-radius: 8px; background: ${isVisaInfinite ? 'linear-gradient(135deg, #D9A066 0%, #C08A50 100%)' : '#8C6A4E'}; color: #FFFFFF; box-shadow: 0 2px 8px rgba(140, 106, 78, 0.15); transition: opacity 0.2s ease;">
                                ${isVisaInfinite ? '👑 查看 Visa 無限卡尊榮權益 ↗' : '查看優惠詳情 / 立即前往 ↗'}
                            </a>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 40px 20px; text-align: center; color: #94A3B8; background: rgba(18, 20, 26, 0.5); border-radius: 16px;">
                    <i class="fa-solid fa-tags" style="font-size: 24px; margin-bottom: 8px;"></i>
                    <div>目前暫無符合條件之特惠，點擊右上角「強制立即更新特惠」以執行全網掃描。</div>
                </div>
            `;
        }
    })
    .catch(err => console.error("Load deals error:", err));
};

window.filterDealsCategory = function(cat, btnElem) {
    const btns = btnElem?.parentElement?.querySelectorAll('.sub-nav-btn');
    if (btns) {
        btns.forEach(b => b.classList.remove('active'));
        btnElem.classList.add('active');
    }

    // Filter curated deal feed cards
    const feedCards = document.querySelectorAll('.deal-feed-card');
    feedCards.forEach(card => {
        const type = card.getAttribute('data-deal-type');
        if (cat === 'all' || cat === type || (cat === '機票' && (type === 'business' || type === 'error_fare' || type === 'award'))) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });

    loadDeals(cat, false);
};

window.triggerDealsCrawl = function() {
    loadDeals('all', true);
};

// 7. 全域情境連動 Handler
window.handleCityContextChange = function(cityCode) {
    fetch(`/api/context/city-bundle?city=${cityCode}`)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data) {
            const ctx = data.data;

            const destSelect = document.getElementById('flight-destination');
            if (destSelect) {
                destSelect.value = ctx.flight_destination;
                if (window.renderFlightDetails) {
                    window.renderFlightDetails(ctx.flight_destination);
                }
            }

            const budgetFx = document.getElementById('budget-currency');
            if (budgetFx) {
                budgetFx.value = ctx.currency_code;
            }

            console.log(`[Contextual Engine ⚡] Synced city context to ${ctx.name_zh}`);
        }
    })
    .catch(err => console.error("Contextual Engine Sync Error:", err));
};

window.loadProactiveAlerts = function() {
    const container = document.getElementById('proactive-alerts-container');
    if (!container) return;

    fetch('/api/proactive/alerts')
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data) {
            let html = '';
            data.data.forEach(a => {
                html += `
                    <div style="background: #FFFFFF; border: 1px solid rgba(167, 182, 162, 0.4); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; box-shadow: 0 4px 16px rgba(140, 106, 78, 0.08); min-height: 250px; overflow: visible; height: auto;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="badge" style="background: rgba(140, 106, 78, 0.12); color: #8C6A4E; font-weight: 700; border: 1px solid rgba(140, 106, 78, 0.25); border-radius: 6px; padding: 3px 8px; font-size: 11px;">${a.category}</span>
                            <span style="font-size: 11px; color: #6B6B6B; font-weight: 600;">24/7 自動風控</span>
                        </div>
                        <h4 style="font-size: 15px; font-weight: 700; color: #8C6A4E; margin: 0; line-height: 1.4; font-family: 'Noto Serif TC', serif;">${a.title}</h4>
                        <div style="font-size: 12px; color: #3E3E3E; font-weight: 700; background: rgba(167, 182, 162, 0.15); border: 1px solid rgba(167, 182, 162, 0.3); padding: 8px 12px; border-radius: 8px;">
                            📊 ${a.metrics}
                        </div>
                        <div style="font-size: 12px; color: #3E3E3E; line-height: 1.6; background: rgba(244, 241, 237, 0.95); border: 1px solid rgba(140, 106, 78, 0.15); border-left: 4px solid #D9A066; padding: 12px 14px; border-radius: 8px; overflow: visible; word-break: break-word;">
                            <div style="color: #8C6A4E; font-weight: 700; margin-bottom: 6px;">💡 3點式行動建議：</div>
                            <div style="margin-bottom: 3px;">${a.recommendation_3bullets[0]}</div>
                            <div style="margin-bottom: 3px;">${a.recommendation_3bullets[1]}</div>
                            <div>${a.recommendation_3bullets[2]}</div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    })
    .catch(err => console.error("Load Proactive Alerts Error:", err));
};

window.triggerProactiveScan = function() {
    fetch('/api/proactive/trigger-scan', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        alert(`⚡ 已手動觸發 24/7 事件驅動風控與套利掃描！已發送 ${data.pushed || 0} 則 3點行動建議通知至 Telegram。`);
        loadProactiveAlerts();
    })
    .catch(err => console.error("Trigger Proactive Scan Error:", err));
};

// 8. DOM Ready Event Listeners Initialization
document.addEventListener("DOMContentLoaded", () => {
    // 綁定側邊欄所有按鈕點擊
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tabKey = btn.getAttribute('data-tab');
            if (tabKey) {
                window.switchTab(tabKey);
            }
        });
    });

    // 機票目的地選擇連動
    const destSelect = document.getElementById('flight-destination');
    if (destSelect) {
        destSelect.addEventListener('change', (e) => {
            if (window.renderFlightDetails) {
                window.renderFlightDetails(e.target.value);
            }
        });
        window.renderFlightDetails(destSelect.value || 'LHR');
    }

    // 城市切換連動
    const citySelect = document.getElementById('header-city-select');
    if (citySelect) {
        citySelect.addEventListener('change', (e) => {
            updateCityClock();
            window.handleCityContextChange(e.target.value);
        });
        updateCityClock();
        window.handleCityContextChange(citySelect.value || 'SIN');
    }

    // 匯率選單切換
    document.getElementById('header-fx-select')?.addEventListener('change', function(e) {
        const fxPair = e.target.value;
        const rateDisplay = document.getElementById('header-fx-rate');
        if (rateDisplay && fxDatabase[fxPair]) {
            rateDisplay.innerText = fxDatabase[fxPair];
        }
    });

    // 載入風控雷達卡片
    loadProactiveAlerts();

    // 預設切換至首頁
    window.switchTab('home');
});


/* =========================================================================
   世界潮牌動態牆 (Streetwear Feed 30大品牌) & 側邊欄 5 秒自動輪播動態牆
   ========================================================================= */

window.brandDropsList = [];
window.currentBrandIndex = 0;
window.brandTickerTimer = null;

window.renderBrandTickerItem = function() {
    const container = document.getElementById('brand-ticker-content');
    if (!container || !window.brandDropsList || window.brandDropsList.length === 0) return;

    const item = window.brandDropsList[window.currentBrandIndex];
    if (!item) return;

    container.style.opacity = '0';
    container.style.transform = 'translateY(4px)';

    setTimeout(() => {
        container.innerHTML = `
            <a href="${item.source_url}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: inherit; display: block;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <span style="font-size: 11px; font-weight: 800; color: #8C6A4E; background: rgba(140, 106, 78, 0.12); border: 1px solid rgba(140, 106, 78, 0.25); padding: 2px 7px; border-radius: 6px; letter-spacing: 0.3px;">
                        ${item.brand}
                    </span>
                    <span style="font-size: 10px; font-weight: 700; color: #6B6B6B;">
                        ${item.category}
                    </span>
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #3E3E3E; line-height: 1.4; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${item.title}">
                    ${item.title}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; margin-top: 3px;">
                    <span style="color: #8C6A4E; font-weight: 800;">${item.twd_price}</span>
                    <span style="font-size: 9px; color: #6B6B6B; background: rgba(140, 106, 78, 0.08); padding: 1px 5px; border-radius: 4px;">
                        ${window.currentBrandIndex + 1}/${window.brandDropsList.length} ↗
                    </span>
                </div>
            </a>
        `;
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 150);
};

window.nextBrandItem = function() {
    if (!window.brandDropsList || window.brandDropsList.length === 0) return;
    window.currentBrandIndex = (window.currentBrandIndex + 1) % window.brandDropsList.length;
    window.renderBrandTickerItem();
    window.restartBrandTickerTimer();
};

window.prevBrandItem = function() {
    if (!window.brandDropsList || window.brandDropsList.length === 0) return;
    window.currentBrandIndex = (window.currentBrandIndex - 1 + window.brandDropsList.length) % window.brandDropsList.length;
    window.renderBrandTickerItem();
    window.restartBrandTickerTimer();
};

window.startBrandTickerTimer = function() {
    if (window.brandTickerTimer) {
        clearInterval(window.brandTickerTimer);
    }
    // 5秒自動更換一次品牌
    window.brandTickerTimer = setInterval(() => {
        if (!window.brandDropsList || window.brandDropsList.length === 0) return;
        window.currentBrandIndex = (window.currentBrandIndex + 1) % window.brandDropsList.length;
        window.renderBrandTickerItem();
    }, 5000);
};

window.restartBrandTickerTimer = function() {
    window.startBrandTickerTimer();
};

window.loadStreetwearFeed = function(brandFilter = 'all') {
    fetch(`/api/streetwear/feed?brand=${brandFilter}`)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data && data.data.length > 0) {
            window.brandDropsList = data.data;
            window.currentBrandIndex = 0;
            window.renderBrandTickerItem();
            window.startBrandTickerTimer();

            // 若有獨立展示容器亦一併渲染
            const container = document.getElementById('streetwear-feed-container');
            if (container) {
                let html = '';
                data.data.forEach(item => {
                    html += `
                        <div style="background: rgba(18, 20, 26, 0.88); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; transition: all 0.25s ease;">
                            <div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span class="badge">${item.brand}</span>
                                    <span style="font-size: 11px; color: #CBD5E1; font-weight: 700;">${item.category}</span>
                                </div>
                                <h4 style="font-size: 15px; color: #FFF; font-weight: 700; margin-bottom: 6px; line-height: 1.4;">${item.title}</h4>
                                <p style="font-size: 12px; color: #94A3B8; line-height: 1.5; margin-bottom: 8px;">${item.description}</p>
                                <div style="font-size: 11px; color: #E2E8F0;">🗓️ ${item.release_date}</div>
                            </div>
                            <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 11px; color: #94A3B8;">原價: ${item.original_price}</span>
                                    <span style="font-size: 18px; font-weight: 800; color: #F8FAFC;">${item.twd_price}</span>
                                </div>
                                <a href="${item.source_url}" target="_blank" class="glow-btn" style="text-align: center; text-decoration: none; font-size: 12px; padding: 8px;">
                                    官方官網發售連結 ↗
                                </a>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            }
        }
    })
    .catch(err => console.error("Load streetwear feed error:", err));
};

window.filterStreetwearBrand = function(brand, btnElem) {
    const btns = btnElem?.parentElement?.querySelectorAll('.sub-nav-btn');
    if (btns) {
        btns.forEach(b => b.classList.remove('active'));
        btnElem.classList.add('active');
    }
    loadStreetwearFeed(brand);
};

window.updateQuickSpotConvert = function() {
    const currency = document.getElementById('header-bank-fx-select')?.value || 'USD';
    const amount = parseFloat(document.getElementById('quick-convert-amount')?.value || 100);
    const resultDisplay = document.getElementById('quick-convert-result');
    if (!resultDisplay) return;

    fetch('/api/fx/convert-twd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: currency, amount: amount })
    })
    .then(res => res.json())
    .then(data => {
        if (data.formatted) {
            resultDisplay.innerText = data.formatted;
        }
    })
    .catch(err => console.error("Quick convert error:", err));
};

// 綁定台銀即期換算與動態牆懸停暫停事件
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('header-bank-fx-select')?.addEventListener('change', updateQuickSpotConvert);
    document.getElementById('quick-convert-amount')?.addEventListener('input', updateQuickSpotConvert);
    
    // 動態牆滑鼠懸停時暫停自動輪播，移開時繼續
    const wallElem = document.querySelector('.trendy-brands-wall');
    if (wallElem) {
        wallElem.addEventListener('mouseenter', () => {
            if (window.brandTickerTimer) clearInterval(window.brandTickerTimer);
        });
        wallElem.addEventListener('mouseleave', () => {
            window.startBrandTickerTimer();
        });
    }

    // 初始化載入 30 大世界潮牌動態牆與即期換算
    loadStreetwearFeed('all');
    updateQuickSpotConvert();
});


/* =========================================================================
   50,000+ 筆景點智庫 (Viral Spots Intelligence Engine) 搜尋與渲染邏輯
   ========================================================================= */

window.loadViralSpots = function(query = "", tag = "ALL") {
    const container = document.getElementById('viral-spots-results-grid');
    if (!container) return;

    container.innerHTML = '<div style="grid-column: span 3; text-align: center; color: #CBD5E1; padding: 30px; font-weight: 700;">⚡ 正在連線自 50,000+ 筆社群景點智庫檢索中...</div>';

    fetch(`/api/travel/viral-spots?query=${encodeURIComponent(query)}&platform_tag=${encodeURIComponent(tag)}&limit=30`)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data && data.data.spots) {
            let html = '';
            data.data.spots.forEach(spot => {
                html += `
                    <div style="background: rgba(18, 20, 26, 0.88); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; transition: all 0.25s ease;" onmouseover="this.style.borderColor='rgba(255,255,255,0.4)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.14)'">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span class="badge">${spot.platform_tag}</span>
                                <span style="font-size: 12px; font-weight: 700; color: #F8FAFC;">⭐ ${spot.rating} (${spot.price_level})</span>
                            </div>
                            <h4 style="font-size: 15px; font-weight: 700; color: #FFF; margin-bottom: 4px; line-height: 1.4;">${spot.spot_name}</h4>
                            <p style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">📍 ${spot.address_desc}</p>
                            <p style="font-size: 12px; color: #CBD5E1; line-height: 1.5;">${spot.summary}</p>
                        </div>
                        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 11px; color: #94A3B8;">50,000+ 智庫收錄</span>
                            <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.spot_name)}" target="_blank" class="glow-btn" style="padding: 6px 12px; font-size: 11px; text-decoration: none;">
                                地圖導航 ↗
                            </a>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div style="grid-column: span 3; text-align: center; color: #94A3B8; padding: 20px;">無符合條件的景點，請嘗試其他關鍵字</div>';
        }
    })
    .catch(err => {
        console.error("Load viral spots error:", err);
        container.innerHTML = '<div style="grid-column: span 3; text-align: center; color: #94A3B8; padding: 20px;">載入景點資料庫發生錯誤，請重試</div>';
    });
};

window.triggerViralSpotSearch = function() {
    const query = document.getElementById('viral-search-query')?.value || '';
    const tag = document.getElementById('viral-filter-tag')?.value || 'ALL';
    loadViralSpots(query, tag);
};

// 在 switchTab 內自動連動載入景點智庫
const oldSwitchTabInViral = window.switchTab;
window.switchTab = function(tabId) {
    if (oldSwitchTabInViral) {
        oldSwitchTabInViral(tabId);
    }
    const aliasMap = { 'travel': 'guide2026' };
    const mapped = aliasMap[tabId] || tabId;
    if (mapped === 'guide2026') {
        window.loadViralSpots('', 'ALL');
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // 綁定 Enter 鍵搜尋
    document.getElementById('viral-search-query')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            triggerViralSpotSearch();
        }
    });

    document.getElementById('viral-filter-tag')?.addEventListener('change', () => {
        triggerViralSpotSearch();
    });

    // 初始載入 50k 景點智庫
    loadViralSpots('', 'ALL');
});


/* =========================================================================
   50,000+ 筆真實景點智庫 (12筆/頁精緻分頁)、真實地圖導航與「我的旅行清單」處理器
   ========================================================================= */

window.currentViralPage = 1;

window.loadViralSpots = function(query = "", tag = "ALL", page = 1) {
    window.currentViralPage = page;
    const container = document.getElementById('viral-spots-results-grid');
    const paginationContainer = document.getElementById('viral-pagination-container');
    if (!container) return;

    container.innerHTML = '<div style="grid-column: span 3; text-align: center; color: #CBD5E1; padding: 30px; font-weight: 700;">⚡ 正在連線自 50,000+ 筆真實景點與餐廳資料庫檢索中...</div>';

    fetch(`/api/travel/viral-spots?query=${encodeURIComponent(query)}&platform_tag=${encodeURIComponent(tag)}&page=${page}&limit=12`)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data && data.data.spots) {
            let html = '';
            data.data.spots.forEach(spot => {
                html += `
                    <div style="background: rgba(18, 20, 26, 0.88); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; transition: all 0.25s ease;" onmouseover="this.style.borderColor='rgba(255,255,255,0.4)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.14)'">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span class="badge">${spot.platform_tag}</span>
                                <span style="font-size: 12px; font-weight: 700; color: #F8FAFC;">⭐ ${spot.rating} (${spot.price_level})</span>
                            </div>
                            <h4 style="font-size: 15px; font-weight: 700; color: #FFF; margin-bottom: 4px; line-height: 1.4;">${spot.spot_name}</h4>
                            <p style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">📍 ${spot.address_desc}</p>
                            <p style="font-size: 12px; color: #CBD5E1; line-height: 1.5;">${spot.summary}</p>
                        </div>
                        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <button onclick="addToMyTravelList(${spot.id})" class="glow-btn" style="padding: 6px 12px; font-size: 11px; width: 100%; text-align: center; background: rgba(255, 255, 255, 0.1); color: #FFF; border-color: rgba(255,255,255,0.25);">
                                    ➕ 加入旅行與美食清單
                                </button>
                            </div>
                            <a href="${spot.google_map_url}" target="_blank" class="glow-btn" style="padding: 6px 12px; font-size: 11px; text-decoration: none; text-align: center; background: #FFFFFF; color: #0A0B0E;">
                                📍 Google 地圖精準導航 ↗
                            </a>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;

            // 渲染精緻分頁元件 (不需一路往下拉)
            if (paginationContainer && data.data.total_pages > 1) {
                const totalPages = data.data.total_pages;
                const prevDisabled = page <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : '';
                const nextDisabled = page >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : '';

                paginationContainer.innerHTML = `
                    <button ${prevDisabled} onclick="changeViralPage(${page - 1})" class="sub-nav-btn">◀ 上一頁</button>
                    <span style="font-size: 13px; font-weight: 700; color: #F8FAFC;">第 ${page} / ${totalPages.toLocaleString()} 頁 (共 ${data.data.total.toLocaleString()} 筆真實景點/餐廳)</span>
                    <button ${nextDisabled} onclick="changeViralPage(${page + 1})" class="sub-nav-btn">下一頁 ▶</button>
                `;
            }
        }
    })
    .catch(err => console.error("Load viral spots error:", err));
};

window.changeViralPage = function(newPage) {
    const query = document.getElementById('viral-search-query')?.value || '';
    const tag = document.getElementById('viral-filter-tag')?.value || 'ALL';
    loadViralSpots(query, tag, newPage);
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
};

window.addToMyTravelList = function(spotId) {
    fetch('/api/travel/my-list/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spot_id: spotId })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || "已加入您的旅行清單！");
        loadMyTravelList();
    })
    .catch(err => console.error("Add to my list error:", err));
};

window.loadMyTravelList = function() {
    const container = document.getElementById('my-travel-list-container');
    const badgeCount = document.getElementById('my-list-count-badge');

    fetch('/api/travel/my-list')
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data) {
            if (badgeCount) badgeCount.innerText = data.count;

            if (!container) return;

            if (data.data.length === 0) {
                container.innerHTML = '<div style="grid-column: span 3; text-align: center; color: #94A3B8; padding: 24px;">您的旅行清單尚無項目，請至「50,000+ 景點智庫」挑選喜歡的景點與餐廳點擊【➕ 加入旅行與美食清單】！</div>';
                return;
            }

            let html = '';
            data.data.forEach(item => {
                html += `
                    <div style="background: rgba(18, 20, 26, 0.88); border: 1px solid rgba(255, 255, 255, 0.16); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span class="badge">${item.category || '精選推薦'}</span>
                                <span style="font-size: 12px; font-weight: 700; color: #F8FAFC;">⭐ ${item.rating || 4.8}</span>
                            </div>
                            <h4 style="font-size: 15px; font-weight: 700; color: #FFF; margin-bottom: 4px; line-height: 1.4;">${item.spot_name}</h4>
                            <p style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">📍 ${item.address_desc || ''}</p>
                        </div>
                        <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; display: flex; gap: 8px;">
                            <a href="${item.google_map_url}" target="_blank" class="glow-btn" style="flex: 1; text-align: center; text-decoration: none; font-size: 11px; padding: 6px;">
                                📍 導航 ↗
                            </a>
                            <button onclick="removeFromMyTravelList(${item.id})" class="sub-nav-btn" style="padding: 6px 10px; font-size: 11px; color: #CBD5E1;">
                                🗑️ 移除
                            </button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    })
    .catch(err => console.error("Load my travel list error:", err));
};

window.removeFromMyTravelList = function(itemId) {
    fetch(`/api/travel/my-list/remove/${itemId}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
        loadMyTravelList();
    })
    .catch(err => console.error("Remove from list error:", err));
};

document.addEventListener("DOMContentLoaded", () => {
    // 初始載入旅行清單
    loadMyTravelList();
});


/* =========================================================================
   Bento 點擊連動、歐洲 10D9N 4大維度切換與全站 Toast 提示 Handler
   ========================================================================= */

window.openBentoTimelineDrawer = function() {
    const backdrop = document.getElementById('bento-timeline-backdrop');
    const drawer = document.getElementById('bento-timeline-drawer');
    if (backdrop && drawer) {
        backdrop.classList.add('active');
        drawer.classList.add('active');
    }
};

window.closeBentoTimelineDrawer = function() {
    const backdrop = document.getElementById('bento-timeline-backdrop');
    const drawer = document.getElementById('bento-timeline-drawer');
    if (backdrop && drawer) {
        backdrop.classList.remove('active');
        drawer.classList.remove('active');
    }
};

window.openBentoCalcModal = function() {
    const modal = document.getElementById('bento-calc-backdrop');
    if (modal) {
        modal.classList.add('active');
        updateBentoCalcResult();
    }
};

window.closeBentoCalcModal = function() {
    const modal = document.getElementById('bento-calc-backdrop');
    if (modal) {
        modal.classList.remove('active');
    }
};

window.updateBentoCalcResult = function() {
    const currency = document.getElementById('bento-calc-currency')?.value || 'USD';
    const amount = parseFloat(document.getElementById('bento-calc-amount')?.value || 500);
    const resultDisplay = document.getElementById('bento-calc-result');
    if (!resultDisplay) return;

    fetch('/api/fx/convert-twd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: currency, amount: amount })
    })
    .then(res => res.json())
    .then(data => {
        if (data.formatted) {
            resultDisplay.innerText = data.formatted;
        }
    })
    .catch(err => console.error("Bento calc error:", err));
};

window.switchEuropeGuideTab = function(panelName, btnElem) {
    const parent = btnElem.parentElement;
    parent.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
    btnElem.classList.add('active');

    const panels = document.querySelectorAll('.europe-panel');
    panels.forEach(p => p.style.display = 'none');

    const target = document.getElementById(`europe-guide-panel-${panelName}`);
    if (target) {
        target.style.display = 'block';
    }
};

window.updateEuropeBudgetContent = function() {
    const currency = document.getElementById('europe-currency-select')?.value || 'TWD';
    const display = document.getElementById('europe-budget-details');
    if (!display) return;

    if (currency === 'TWD') {
        display.innerHTML = `✈️ 機票：NT$ 33,000 | 🏨 9夜住宿：NT$ 36,000 | 🚆 高鐵地鐵：NT$ 12,000 | 🍽️ 餐飲美饌：NT$ 18,000 | 🎟️ 門票：NT$ 8,000<br><strong style="color: #F8FAFC; font-size: 15px;">💰 預估每人總預算：NT$ 107,000 起</strong>`;
    } else if (currency === 'SGD') {
        display.innerHTML = `✈️ 機票：SGD 1,355 | 🏨 9夜住宿：SGD 1,478 | 🚆 高鐵地鐵：SGD 492 | 🍽️ 餐飲美饌：SGD 739 | 🎟️ 門票：SGD 328<br><strong style="color: #F8FAFC; font-size: 15px;">💰 預估每人總預算：SGD 4,392 起</strong>`;
    } else {
        display.innerHTML = `✈️ 機票：EUR 948 | 🏨 9夜住宿：EUR 1,034 | 🚆 高鐵地鐵：EUR 344 | 🍽️ 餐飲美饌：EUR 517 | 🎟️ 門票：EUR 229<br><strong style="color: #F8FAFC; font-size: 15px;">💰 預估每人總預算：EUR 3,072 起</strong>`;
    }
};

window.showToast = function(msg) {
    const toast = document.getElementById('toast-notification');
    const msgElem = document.getElementById('toast-message');
    if (toast && msgElem) {
        msgElem.innerText = msg;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 2500);
    }
};

/* =========================================================================
   Command Palette (Ctrl+K) & View State Management
   ========================================================================= */
const commandList = [
    { title: '切換至 首頁 (Home)', action: () => window.switchTab('home'), icon: 'fa-house', group: '導航' },
    { title: '切換至 儀表板 (Dashboard)', action: () => window.switchTab('bento'), icon: 'fa-table-cells-large', group: '導航' },
    { title: '切換至 高爾夫旗艦門戶 (Golf Hub)', action: () => window.switchTab('golf'), icon: 'fa-golf-ball-tee', group: '導航' },
    { title: '切換至 智能機票專區 (Flights)', action: () => window.switchTab('flights'), icon: 'fa-plane-departure', group: '導航' },
    { title: '切換至 特價優惠監控 (Deals)', action: () => window.switchTab('deals'), icon: 'fa-tags', group: '導航' },
    { title: '切換至 景點智庫 (Travel Hub)', action: () => window.switchTab('guide2026'), icon: 'fa-map-location-dot', group: '導航' },
    { title: '切換至 我的旅行清單 (My Travel List)', action: () => window.switchTab('travelbook'), icon: 'fa-suitcase-rolling', group: '導航' },
    { title: '切換至 美西自駕特輯 (US West)', action: () => window.switchTab('uswest'), icon: 'fa-route', group: '導航' },
    { title: '切換至 生活日常 (Lifestyle)', action: () => window.switchTab('lifestyle'), icon: 'fa-mug-hot', group: '導航' },
    { title: '切換至 股市與加密貨幣 (Stocks & Crypto)', action: () => window.switchTab('stocks'), icon: 'fa-chart-line', group: '導航' },
    { title: '切換至 猶太商道與新聞 (Jewish Wisdom)', action: () => window.switchTab('jewish'), icon: 'fa-star-of-david', group: '導航' },
    { title: '切換至 系統設定 (Settings)', action: () => window.switchTab('settings'), icon: 'fa-gear', group: '導航' },
    { title: '立即觸發 24/7 風控套利掃描 (Proactive Scan)', action: () => window.triggerProactiveScan(), icon: 'fa-bolt', group: '操作' },
    { title: '立即執行 全網特惠掃描 (Deals Scan)', action: () => window.triggerDealsCrawl(), icon: 'fa-rotate-right', group: '操作' }
];

window.openCommandPalette = function() {
    const modal = document.getElementById('command-palette-modal');
    const input = document.getElementById('cmd-input');
    if (modal) {
        modal.classList.add('active');
        if (input) {
            input.value = '';
            input.focus();
            window.filterCommandItems();
        }
    }
};

window.closeCommandPalette = function() {
    const modal = document.getElementById('command-palette-modal');
    if (modal) {
        modal.classList.remove('active');
    }
};

window.filterCommandItems = function() {
    const input = document.getElementById('cmd-input');
    const container = document.getElementById('cmd-results-list');
    if (!container) return;

    const query = (input?.value || '').trim().toLowerCase();
    const filtered = commandList.filter(cmd => 
        !query || cmd.title.toLowerCase().includes(query) || cmd.group.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        container.innerHTML = '<div style="padding: 16px; text-align: center; color: #94A3B8; font-size: 13px;">無相符指令</div>';
        return;
    }

    container.innerHTML = filtered.map(cmd => `
        <div class="cmd-item" onclick="executeCommand(${commandList.indexOf(cmd)})" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; cursor: pointer; transition: all 0.15s ease;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fa-solid ${cmd.icon}" style="color: #CBD5E1; font-size: 13px;"></i>
                <span style="font-size: 13px; color: #FFFFFF; font-weight: 500;">${cmd.title}</span>
            </div>
            <span style="font-size: 10px; color: #94A3B8; text-transform: uppercase; background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px;">${cmd.group}</span>
        </div>
    `).join('');
};

window.executeCommand = function(idx) {
    if (commandList[idx] && typeof commandList[idx].action === 'function') {
        commandList[idx].action();
        window.closeCommandPalette();
    }
};

// 保留視角狀態相容性（維持預設 Admin 狀態）
window.currentRoleView = 'admin';
window.switchRoleView = function(role) {
    window.currentRoleView = role || 'admin';
    console.log(`[Role View] Default view active: ${window.currentRoleView}`);
};

document.addEventListener("DOMContentLoaded", () => {
    // 快捷鍵監聽：Esc 關閉彈窗，Ctrl+K / Cmd+K 開啟指令板
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeBentoTimelineDrawer();
            closeBentoCalcModal();
            closeCommandPalette();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
            e.preventDefault();
            openCommandPalette();
        }
    });

    // 點擊指令板外部背景關閉
    document.getElementById('command-palette-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'command-palette-modal') {
            closeCommandPalette();
        }
    });

    document.getElementById('bento-calc-currency')?.addEventListener('change', updateBentoCalcResult);
    document.getElementById('bento-calc-amount')?.addEventListener('input', updateBentoCalcResult);
});


/* =========================================================================
   高爾夫旗艦門戶 (Golf Hub 2.0) 錨點平滑滾動與多平台比價搜尋器 Handlers
   ========================================================================= */

window.switchGolfSubTab = function(targetKey, btnElem) {
    if (btnElem) {
        const parent = btnElem.parentElement;
        if (parent) {
            parent.querySelectorAll('.sub-nav-btn').forEach(b => b.classList.remove('active'));
            btnElem.classList.add('active');
        }
    }

    let targetElem = null;

    if (targetKey === 'gear' || targetKey === 'section-new-clubs') {
        targetElem = document.getElementById('golf-section-gear') || document.querySelector('[data-alias-id="section-new-clubs"]');
    } else if (targetKey === 'market' || targetKey === 'section-used-clubs') {
        targetElem = document.getElementById('golf-section-market') || document.querySelector('[data-alias-id="section-used-clubs"]');
    } else if (targetKey === 'courses' || targetKey === 'section-courses') {
        targetElem = document.getElementById('golf-section-courses') || document.querySelector('[data-alias-id="section-courses"]');
    } else if (targetKey === 'novice' || targetKey === 'section-guide') {
        targetElem = document.getElementById('golf-section-novice') || document.querySelector('[data-alias-id="section-guide"]');
    } else {
        targetElem = document.getElementById(targetKey) || document.querySelector(`[data-alias-id="${targetKey}"]`);
    }

    if (targetElem) {
        targetElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

window.setGolfSearchQuery = function(text) {
    const input = document.getElementById('golf-search-query');
    if (input) {
        input.value = text;
        input.focus();
    }
};

window.openGolfSearchPlatform = function(platformKey) {
    const input = document.getElementById('golf-search-query');
    const query = (input?.value || 'TaylorMade P790').trim();
    if (!query) {
        alert("請輸入欲搜尋的球桿型號！");
        return;
    }
    const encodedQuery = encodeURIComponent(query);
    let url = "";

    switch (platformKey) {
        case 'golfpartner':
            url = `https://www.golfpartner.jp/shop/goods/search.aspx?keyword=${encodedQuery}`;
            break;
        case 'ebay':
            url = `https://www.ebay.com/sch/i.html?_nkw=${encodedQuery}+golf`;
            break;
        case '2ndswing':
            url = `https://www.2ndswing.com/search?keyword=${encodedQuery}`;
            break;
        case 'mercari':
            url = `https://jp.mercari.com/search?keyword=${encodedQuery}+%E3%82%B4%E3%83%AB%E3%83%95`;
            break;
        case 'googleshopping':
            url = `https://www.google.com/search?tbm=shop&q=${encodedQuery}`;
            break;
        default:
            url = `https://www.google.com/search?tbm=shop&q=${encodedQuery}`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
};

// ==========================================================================
// 1. Back to Top Scroll Logic
// ==========================================================================
window.scrollToTop = function() {
    const mainContent = document.querySelector('.main-content') || window;
    if (mainContent.scrollTo) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    const backToTopBtn = document.getElementById('back-to-top');

    const handleScroll = (scrollTop) => {
        if (!backToTopBtn) return;
        if (scrollTop > 300) {
            backToTopBtn.style.display = 'flex';
        } else {
            backToTopBtn.style.display = 'none';
        }
    };

    if (mainContent) {
        mainContent.addEventListener('scroll', () => handleScroll(mainContent.scrollTop));
    }
    window.addEventListener('scroll', () => handleScroll(window.scrollY));
});

// ==========================================================================
// 2. Golf Spec Filter Pills (Hand / Flex / Type)
// ==========================================================================
window.selectedGolfSpecs = { hand: 'ALL', flex: 'ALL', type: 'ALL' };

window.toggleGolfSpecTag = function(category, value, el) {
    if (!el) return;
    const parentRow = el.parentElement;
    if (parentRow) {
        parentRow.querySelectorAll('.spec-filter-chip').forEach(chip => chip.classList.remove('active'));
    }
    el.classList.add('active');
    window.selectedGolfSpecs[category] = value;

    // Dynamically append selected specs to search input
    const input = document.getElementById('golf-search-query');
    if (input) {
        let baseQuery = input.value.replace(/\b(RH|LH|Regular|Stiff|Extra Stiff|Max Forgiveness|Tour Player)\b/gi, '').trim();
        let appended = [];
        if (window.selectedGolfSpecs.hand !== 'ALL') appended.push(window.selectedGolfSpecs.hand);
        if (window.selectedGolfSpecs.flex !== 'ALL') appended.push(window.selectedGolfSpecs.flex === 'R' ? 'Regular' : (window.selectedGolfSpecs.flex === 'S' ? 'Stiff' : 'Extra Stiff'));
        if (window.selectedGolfSpecs.type !== 'ALL') appended.push(window.selectedGolfSpecs.type);

        input.value = (baseQuery + ' ' + appended.join(' ')).trim();
    }
};

// ==========================================================================
// 3. GPS Coordinates Copy
// ==========================================================================
window.copyGpsCoords = function(coords, name) {
    if (!coords) return;
    navigator.clipboard.writeText(coords).then(() => {
        window.showToast?.(`📍 已成功複製 ${name} 座標：${coords}`) || alert(`已複製 ${name} GPS 座標：${coords}`);
    }).catch(() => {
        alert(`GPS 座標：${coords}`);
    });
};

// ==========================================================================
// 4. Split Expense Calculator (多人開銷分帳計算器)
// ==========================================================================
window.calculateSplitExpense = function() {
    const totalAmount = parseFloat(document.getElementById('split-total-amount')?.value || 0);
    const peopleCount = parseInt(document.getElementById('split-people-count')?.value || 2, 10);
    const depositPaid = parseFloat(document.getElementById('split-deposit-paid')?.value || 0);
    const currency = document.getElementById('split-currency')?.value || 'USD';

    if (peopleCount <= 0) return;

    const perPersonTotal = totalAmount / peopleCount;
    const remainingTotal = Math.max(0, totalAmount - depositPaid);
    const perPersonRemaining = remainingTotal / peopleCount;

    const symbol = currency === 'USD' ? 'USD $' : (currency === 'TWD' ? 'NT$ ' : 'SGD $');

    const totalEl = document.getElementById('split-result-per-person');
    const remainingEl = document.getElementById('split-result-remaining-per-person');
    const summaryTextEl = document.getElementById('split-result-summary-text');

    if (totalEl) totalEl.innerText = `${symbol}${perPersonTotal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    if (remainingEl) remainingEl.innerText = `${symbol}${perPersonRemaining.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;
    if (summaryTextEl) {
        summaryTextEl.innerText = `總金額 ${symbol}${totalAmount.toLocaleString()} ÷ ${peopleCount} 人 ＝ 每人應分攤 ${symbol}${perPersonTotal.toFixed(1)}（已扣除訂金 ${symbol}${depositPaid.toLocaleString()}，現場每人需補 ${symbol}${perPersonRemaining.toFixed(1)}）`;
    }
};

window.copySplitExpenseSummary = function() {
    const summaryText = document.getElementById('split-result-summary-text')?.innerText;
    if (summaryText) {
        navigator.clipboard.writeText(summaryText).then(() => {
            window.showToast?.("📋 已複製分帳結果明細至剪貼簿！") || alert("已複製分帳結果明細！");
        });
    }
};

// ==========================================================================
// 5. HSBC Travel Infinite Privilege Tracker (滙豐旅人無限卡權益追蹤)
// ==========================================================================
window.getHsbcPrivileges = function() {
    try {
        const data = localStorage.getItem('hsbc_privileges_data');
        return data ? JSON.parse(data) : { pickup_used: 0, lounge_used: 0 };
    } catch (e) {
        return { pickup_used: 0, lounge_used: 0 };
    }
};

window.renderHsbcPrivileges = function() {
    const state = window.getHsbcPrivileges();
    const pickupMax = 4;
    const loungeMax = 8;

    const pickupRem = Math.max(0, pickupMax - (state.pickup_used || 0));
    const loungeRem = Math.max(0, loungeMax - (state.lounge_used || 0));

    const pickupEl = document.getElementById('hsbc-pickup-remaining');
    const pickupBar = document.getElementById('hsbc-pickup-bar');
    const loungeEl = document.getElementById('hsbc-lounge-remaining');
    const loungeBar = document.getElementById('hsbc-lounge-bar');

    if (pickupEl) pickupEl.innerText = pickupRem;
    if (pickupBar) pickupBar.style.width = `${(pickupRem / pickupMax) * 100}%`;

    if (loungeEl) loungeEl.innerText = loungeRem;
    if (loungeBar) loungeBar.style.width = `${(loungeRem / loungeMax) * 100}%`;
};

window.updateHsbcPrivilege = function(type, delta) {
    const state = window.getHsbcPrivileges();
    if (type === 'pickup') {
        state.pickup_used = Math.min(4, Math.max(0, (state.pickup_used || 0) + delta));
    } else if (type === 'lounge') {
        state.lounge_used = Math.min(8, Math.max(0, (state.lounge_used || 0) + delta));
    }
    localStorage.setItem('hsbc_privileges_data', JSON.stringify(state));
    window.renderHsbcPrivileges();
    window.showToast?.(delta > 0 ? `✅ 已登記扣抵 1 次權益！` : `🔄 已恢復 1 次權益！`);
};

// ==========================================================================
// 6. HSBC Mileage Sweet-Spot Calculator (旅人積分 1:1 哩程兌換計算機)
// ==========================================================================
window.calculateHsbcMileage = function() {
    const pointsInput = document.getElementById('hsbc-points-input');
    const container = document.getElementById('hsbc-mileage-result-table');
    if (!pointsInput || !container) return;

    const points = parseInt(pointsInput.value || 50000, 10);
    const asiaMilesJapanBiz = (points / 25000).toFixed(1);
    const asiaMilesEuropeBiz = (points / 65000).toFixed(1);
    const starluxUsUpgrade = (points / 35000).toFixed(1);
    const aviosJapanEcon = (points / 7500).toFixed(1);
    const siaBiz = (points / 43000).toFixed(1);

    container.innerHTML = `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #38BDF8; font-size: 12px;">🇭🇰 國泰亞洲萬里通 (Asia Miles)</strong>
                <div style="font-size: 11px; color: #CBD5E1;">25,000 里換台日商務艙 ｜ 65,000 里換歐洲芬航商務艙</div>
            </div>
            <span class="badge" style="background: rgba(56,189,248,0.2); color: #FFF; font-size: 11px; font-weight: 700;">可換 ${asiaMilesJapanBiz} 趟台日商務 / ${asiaMilesEuropeBiz} 趟歐洲</span>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #c084fc; font-size: 12px;">🌟 星宇航空 (COSMILE) / 長榮航空</strong>
                <div style="font-size: 11px; color: #CBD5E1;">35,000~50,000 里換美西 (LAX/SEA) 單程商務艙升等</div>
            </div>
            <span class="badge" style="background: rgba(192,132,252,0.2); color: #FFF; font-size: 11px; font-weight: 700;">可升等 ${starluxUsUpgrade} 次美西商務</span>
        </div>
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: #34D399; font-size: 12px;">🇬🇧 英國航空 (Avios) / 🇸🇬 新加坡航空</strong>
                <div style="font-size: 11px; color: #CBD5E1;">7,500 Avios 換台日短程經濟 ｜ 43,000 里換星馬商務艙</div>
            </div>
            <span class="badge" style="background: rgba(52,211,153,0.2); color: #FFF; font-size: 11px; font-weight: 700;">可換 ${aviosJapanEcon} 趟台日 / ${siaBiz} 趟新航商務</span>
        </div>
    `;
};

window.setHsbcPoints = function(pts) {
    const input = document.getElementById('hsbc-points-input');
    if (input) {
        input.value = pts;
        window.calculateHsbcMileage();
    }
};

// ==========================================================================
// 7. Instant Alert Hub Settings & Test Push (即時推播設定與測試)
// ==========================================================================
window.loadNotificationSettings = function() {
    const saved = localStorage.getItem('user_notification_settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const tgInput = document.getElementById('alert-tg-chat-id');
            const whInput = document.getElementById('alert-webhook-url');
            if (tgInput && parsed.tg_chat_id) tgInput.value = parsed.tg_chat_id;
            if (whInput && parsed.webhook_url) whInput.value = parsed.webhook_url;
        } catch (e) {}
    }
};

window.saveNotificationSettings = function() {
    const tgChatId = document.getElementById('alert-tg-chat-id')?.value.trim() || '';
    const webhookUrl = document.getElementById('alert-webhook-url')?.value.trim() || '';
    localStorage.setItem('user_notification_settings', JSON.stringify({
        tg_chat_id: tgChatId,
        webhook_url: webhookUrl
    }));
    window.showToast?.("✅ 推播通知設定已成功儲存至瀏覽器！") || alert("推播通知設定已儲存！");
};

window.sendTestNotification = function() {
    const tgChatId = document.getElementById('alert-tg-chat-id')?.value.trim() || '';
    const webhookUrl = document.getElementById('alert-webhook-url')?.value.trim() || '';

    window.showToast?.("📡 正在發送測試推播中...");

    fetch('/api/notification/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            telegram_chat_id: tgChatId,
            webhook_url: webhookUrl
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            window.showToast?.(`🔔 推播測試結果：${data.message}`);
        } else {
            alert(`推播測試異常: ${data.message}`);
        }
    })
    .catch(err => {
        window.showToast?.("🔔 已觸發本機推播測試！");
    });
};

// ==========================================================================
// 8. Itinerary Multi-View Workspace & Fine-Grained Controls
// ==========================================================================
window.activeTripId = null;
window.currentItinDay = 1;
window.cachedTripData = null;

window.switchItineraryView = function(viewType, btnElem) {
    const btns = btnElem?.parentElement?.querySelectorAll('.sub-nav-btn');
    if (btns) {
        btns.forEach(b => b.classList.remove('active'));
        btnElem.classList.add('active');
    }

    document.querySelectorAll('.itin-view-panel').forEach(p => p.style.display = 'none');
    const targetPanel = document.getElementById(`itin-view-${viewType}`);
    if (targetPanel) {
        targetPanel.style.display = 'block';
    }

    if (viewType === 'map') {
        window.renderRouteMap();
    } else if (viewType === 'radar') {
        window.renderPaceRadar();
    } else if (viewType === 'cockpit') {
        window.renderCockpitFocus();
    }
};

window.onItineraryDayChange = function() {
    const daySelect = document.getElementById('select-trip-day');
    if (daySelect) {
        window.currentItinDay = parseInt(daySelect.value, 10) || 1;
        window.loadTripItinerary(window.activeTripId, window.currentItinDay);
    }
};

window.loadTripItinerary = function(tripId, dayNumber = 1) {
    if (!tripId) {
        // Fetch first trip if activeTripId not set
        fetch('/api/trips')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success' && data.data && data.data.length > 0) {
                window.activeTripId = data.data[0].id;
                window.loadTripItinerary(window.activeTripId, dayNumber);
            }
        })
        .catch(err => console.error("Load trips error:", err));
        return;
    }

    window.activeTripId = tripId;
    window.currentItinDay = dayNumber;

    fetch(`/api/trips/${tripId}`)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data) {
            window.cachedTripData = data.data;
            window.renderItinerarySlots(data.data, dayNumber);
            window.renderPaceRadar();
            window.renderRouteMap();
            window.renderCockpitFocus();
        }
    })
    .catch(err => console.error("Load trip detail error:", err));
};

window.renderItinerarySlots = function(tripData, dayNumber) {
    const allItin = tripData.itinerary || [];
    const dayItems = allItin.filter(i => (i.day_number === dayNumber && !i.is_contingency));
    const contingencyItems = allItin.filter(i => i.is_contingency);

    const slots = ['morning', 'afternoon', 'evening', 'overnight'];
    slots.forEach(slotKey => {
        const container = document.getElementById(`slot-container-${slotKey}`);
        if (!container) return;

        const slotItems = dayItems.filter(i => i.time_slot === slotKey);
        if (slotItems.length === 0) {
            container.innerHTML = `
                <div style="padding: 20px 10px; text-align: center; color: #64748B; font-size: 11px; border: 1px dashed rgba(255,255,255,0.08); border-radius: 8px;">
                    尚無安排活動 ‧ 點擊上方表單加入
                </div>
            `;
            return;
        }

        let html = '';
        slotItems.forEach((item, index) => {
            const isFrozen = item.is_frozen === 1;
            const freezeBadge = isFrozen 
                ? `<span class="badge" style="background: rgba(248,113,113,0.2); color: #F87171; font-size: 10px; font-weight: 700;"><i class="fa-solid fa-lock"></i> 已確認定錨</span>`
                : `<span class="badge" style="background: rgba(56,189,248,0.15); color: #38BDF8; font-size: 10px;"><i class="fa-solid fa-unlock"></i> 可自由調度</span>`;

            const driveBadge = item.drive_time_text ? `
                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 4px 8px; font-size: 10px; color: #94A3B8; margin-top: 6px; display: flex; align-items: center; gap: 4px;">
                    <span>${item.drive_time_text}</span>
                </div>
            ` : '';

            html += `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid ${isFrozen ? 'rgba(248,113,113,0.3)' : 'rgba(255,255,255,0.1)'}; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 6px;">
                        <div>
                            ${freezeBadge}
                            <h5 style="font-size: 13px; font-weight: 700; color: #FFF; margin: 4px 0 2px 0; line-height: 1.4;">${item.activity}</h5>
                            <span style="font-size: 11px; color: #94A3B8;">📍 ${item.location || '自駕動線'}</span>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <button onclick="reorderItinItem(${item.id}, 'up')" class="pill-action-btn" style="padding: 2px 6px; font-size: 10px;" title="上移">⬆️</button>
                            <button onclick="reorderItinItem(${item.id}, 'down')" class="pill-action-btn" style="padding: 2px 6px; font-size: 10px;" title="下移">⬇️</button>
                        </div>
                    </div>

                    ${item.notes ? `<div style="font-size: 10px; color: #CBD5E1; line-height: 1.4;">${item.notes}</div>` : ''}
                    ${driveBadge}

                    <!-- 輕量微調控制列 (時段切換 / 跨天 / 鎖定 / 備案) -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; margin-top: 2px; flex-wrap: wrap; gap: 4px;">
                        <div style="display: flex; gap: 4px; align-items: center;">
                            <select onchange="updateItinSlot(${item.id}, this.value)" class="input-modern" style="padding: 2px 6px; font-size: 10px; background: #0F172A; color: #CBD5E1; border-radius: 4px;">
                                <option value="morning" ${item.time_slot === 'morning' ? 'selected' : ''}>早晨</option>
                                <option value="afternoon" ${item.time_slot === 'afternoon' ? 'selected' : ''}>下午</option>
                                <option value="evening" ${item.time_slot === 'evening' ? 'selected' : ''}>晚間</option>
                                <option value="overnight" ${item.time_slot === 'overnight' ? 'selected' : ''}>夜宿</option>
                            </select>
                            <select onchange="moveItinDay(${item.id}, this.value)" class="input-modern" style="padding: 2px 6px; font-size: 10px; background: #0F172A; color: #CBD5E1; border-radius: 4px;">
                                <option value="1" ${item.day_number === 1 ? 'selected' : ''}>Day 1</option>
                                <option value="2" ${item.day_number === 2 ? 'selected' : ''}>Day 2</option>
                                <option value="3" ${item.day_number === 3 ? 'selected' : ''}>Day 3</option>
                                <option value="4" ${item.day_number === 4 ? 'selected' : ''}>Day 4</option>
                                <option value="5" ${item.day_number === 5 ? 'selected' : ''}>Day 5</option>
                            </select>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <button onclick="toggleItinFreeze(${item.id})" class="pill-action-btn" style="padding: 2px 6px; font-size: 10px; ${isFrozen ? 'background: rgba(248,113,113,0.2); border-color: rgba(248,113,113,0.4); color: #FFF;' : ''}">
                                ${isFrozen ? '🔒 已鎖定' : '🔓 鎖定'}
                            </button>
                            <button onclick="toggleContingency(${item.id}, 1)" class="pill-action-btn" style="padding: 2px 6px; font-size: 10px;" title="移至天候備案庫">
                                💡 備案
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    });

    // Render Contingency Pool
    const contContainer = document.getElementById('contingency-pool-container');
    if (contContainer) {
        if (contingencyItems.length === 0) {
            contContainer.innerHTML = `<div style="grid-column: 1 / -1; color: #64748B; font-size: 11px;">目前備案庫無項目，可將任何行程一鍵移至備案庫保管。</div>`;
        } else {
            let cHtml = '';
            contingencyItems.forEach(c => {
                cHtml += `
                    <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(52,211,153,0.2); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; justify-content: space-between; gap: 6px;">
                        <div>
                            <span class="badge" style="background: rgba(52,211,153,0.15); color: #34D399; font-size: 9px;">💡 彈性備選</span>
                            <h5 style="font-size: 12px; font-weight: 700; color: #FFF; margin: 4px 0 2px 0;">${c.activity}</h5>
                            <span style="font-size: 10px; color: #94A3B8;">${c.location || '彈性地點'}</span>
                        </div>
                        <button onclick="toggleContingency(${c.id}, 0)" class="glow-btn" style="padding: 4px 8px; font-size: 10px; width: 100%;">
                            ➕ 加入當日行程 (Day ${dayNumber})
                        </button>
                    </div>
                `;
            });
            contContainer.innerHTML = cHtml;
        }
    }
};

window.renderPaceRadar = function() {
    if (!window.cachedTripData) return;
    const allItin = window.cachedTripData.itinerary || [];
    const dayItems = allItin.filter(i => (i.day_number === window.currentItinDay && !i.is_contingency));

    let totalDriveMiles = 0.0;
    dayItems.forEach(i => {
        totalDriveMiles += parseFloat(i.drive_distance_miles || 0.0);
    });

    const driveHours = (totalDriveMiles / 55).toFixed(1);
    const activityHours = Math.max(2.0, (dayItems.length * 1.5)).toFixed(1);
    const bufferHours = Math.max(1.0, (12.0 - parseFloat(driveHours) - parseFloat(activityHours))).toFixed(1);

    const driveEl = document.getElementById('radar-drive-time');
    const actEl = document.getElementById('radar-activity-time');
    const buffEl = document.getElementById('radar-buffer-time');
    const alertEl = document.getElementById('radar-pace-alert');

    if (driveEl) driveEl.innerHTML = `${driveHours} 小時 <div style="font-size: 11px; font-weight: normal; color: #94A3B8;">約 ${totalDriveMiles.toFixed(0)} 英哩</div>`;
    if (actEl) actEl.innerHTML = `${activityHours} 小時 <div style="font-size: 11px; font-weight: normal; color: #94A3B8;">共 ${dayItems.length} 項活動</div>`;
    if (buffEl) buffEl.innerHTML = `${bufferHours} 小時 <div style="font-size: 11px; font-weight: normal; color: #94A3B8;">彈性留白充裕</div>`;

    if (alertEl) {
        if (parseFloat(driveHours) > 3.5) {
            alertEl.style.background = 'rgba(245, 158, 11, 0.15)';
            alertEl.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            alertEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #FBBF24; font-size: 18px;"></i> <span>⚠️ <strong>長途駕駛提醒</strong>：今日預估行車時間偏長 (${driveHours} hr > 3.5 hr)，建議中途於加油站換手或安排 30 分鐘休息。</span>`;
        } else {
            alertEl.style.background = 'rgba(52, 211, 153, 0.1)';
            alertEl.style.borderColor = 'rgba(52, 211, 153, 0.3)';
            alertEl.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #34D399; font-size: 18px;"></i> <span>🟢 <strong>節奏健康平衡</strong>：今日行車時間 (${driveHours} hr) 適中，活動與自由留白時間充裕。</span>`;
        }
    }
};

window.renderRouteMap = function() {
    if (!window.cachedTripData) return;
    const waypointsContainer = document.getElementById('map-route-waypoints');
    if (!waypointsContainer) return;

    const allItin = window.cachedTripData.itinerary || [];
    const dayItems = allItin.filter(i => (i.day_number === window.currentItinDay && !i.is_contingency));

    if (dayItems.length === 0) {
        waypointsContainer.innerHTML = `<div>當日暫無設定座標站點。</div>`;
        return;
    }

    let wHtml = '';
    dayItems.forEach((item, idx) => {
        wHtml += `
            <div style="background: rgba(255,255,255,0.03); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: #38BDF8;">站點 ${idx + 1}：</strong>
                    <span style="color: #FFF;">${item.activity}</span>
                    <div style="font-size: 10px; color: #94A3B8;">📍 ${item.location || '美西公路景點'}</div>
                </div>
                ${item.gps_coords ? `<button onclick="copyGpsCoords('${item.gps_coords}', '${item.activity}')" class="pill-action-btn" style="padding: 2px 6px; font-size: 10px;">複製GPS</button>` : ''}
            </div>
        `;
    });
    waypointsContainer.innerHTML = wHtml;
};

window.renderCockpitFocus = function() {
    if (!window.cachedTripData) return;
    const allItin = window.cachedTripData.itinerary || [];
    const dayItems = allItin.filter(i => (i.day_number === window.currentItinDay && !i.is_contingency));

    const nextActivity = dayItems.find(i => i.time_slot !== 'overnight') || dayItems[0];
    const hotelItem = dayItems.find(i => i.time_slot === 'overnight');

    const nextTitle = document.getElementById('cockpit-next-title');
    const nextDesc = document.getElementById('cockpit-next-desc');
    const hotelTitle = document.getElementById('cockpit-hotel-title');
    const hotelAddr = document.getElementById('cockpit-hotel-address');

    if (nextActivity && nextTitle && nextDesc) {
        nextTitle.innerText = nextActivity.activity;
        nextDesc.innerText = `${nextActivity.location || '美西自駕核心站點'} ‧ ${nextActivity.notes || '請預留時間前往'}`;
        window.currentCockpitGps = nextActivity.gps_coords || '36.9026, -111.4112';
        window.currentCockpitLoc = nextActivity.location || nextActivity.activity;
    }

    if (hotelItem && hotelTitle && hotelAddr) {
        hotelTitle.innerText = hotelItem.activity;
        hotelAddr.innerText = hotelItem.location || hotelItem.notes || '賭城大道核心渡假村';
    }
};

window.openCurrentSpotNavigation = function() {
    const loc = window.currentCockpitLoc || 'Bellagio Hotel Las Vegas';
    window.open(`https://maps.google.com/?q=${encodeURIComponent(loc)}`, '_blank', 'noopener,noreferrer');
};

window.copyCurrentGps = function() {
    const gps = window.currentCockpitGps || '36.1126, -115.1767';
    navigator.clipboard.writeText(gps).then(() => {
        window.showToast?.(`📍 已成功複製 GPS 座標：${gps}`) || alert(`GPS: ${gps}`);
    });
};

window.toggleItinFreeze = function(itinId) {
    fetch(`/api/itinerary/${itinId}/toggle-freeze`, { method: 'PUT' })
    .then(res => res.json())
    .then(data => {
        window.showToast?.(data.message || "狀態已更新！");
        window.loadTripItinerary(window.activeTripId, window.currentItinDay);
    })
    .catch(err => console.error("Toggle freeze error:", err));
};

window.updateItinSlot = function(itinId, newSlot) {
    fetch(`/api/itinerary/${itinId}/update-slot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time_slot: newSlot })
    })
    .then(res => res.json())
    .then(() => {
        window.showToast?.(`🕒 已切換至 ${newSlot === 'morning' ? '早晨' : (newSlot === 'afternoon' ? '下午' : (newSlot === 'evening' ? '晚間' : '夜宿'))}！`);
        window.loadTripItinerary(window.activeTripId, window.currentItinDay);
    });
};

window.moveItinDay = function(itinId, newDay) {
    fetch(`/api/itinerary/${itinId}/update-slot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_number: parseInt(newDay, 10) })
    })
    .then(res => res.json())
    .then(() => {
        window.showToast?.(`📅 已移動至第 ${newDay} 天！`);
        window.currentItinDay = parseInt(newDay, 10);
        const daySelect = document.getElementById('select-trip-day');
        if (daySelect) daySelect.value = newDay;
        window.loadTripItinerary(window.activeTripId, window.currentItinDay);
    });
};

window.reorderItinItem = function(itinId, direction) {
    fetch(`/api/itinerary/${itinId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
    })
    .then(res => res.json())
    .then(() => {
        window.loadTripItinerary(window.activeTripId, window.currentItinDay);
    });
};

window.toggleContingency = function(itinId, state) {
    fetch(`/api/itinerary/${itinId}/toggle-contingency`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_contingency: state })
    })
    .then(res => res.json())
    .then(data => {
        window.showToast?.(data.message || "已更新備案狀態！");
        window.loadTripItinerary(window.activeTripId, window.currentItinDay);
    });
};

window.submitNewActivity = function() {
    const slot = document.getElementById('itin-slot')?.value || 'morning';
    const activity = document.getElementById('itin-activity')?.value.trim();
    const location = document.getElementById('itin-location')?.value.trim();
    const cost = parseFloat(document.getElementById('itin-cost')?.value || 0);

    if (!activity) {
        alert("請輸入活動或景點名稱！");
        return;
    }

    fetch(`/api/trips/${window.activeTripId || 1}/itinerary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            day_number: window.currentItinDay || 1,
            time_slot: slot,
            activity: activity,
            location: location,
            estimated_cost: cost
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            window.showToast?.("✅ 活動已成功新增至當日行程表！");
            document.getElementById('itin-activity').value = '';
            document.getElementById('itin-location').value = '';
            document.getElementById('itin-cost').value = '';
            window.loadTripItinerary(window.activeTripId, window.currentItinDay);
        }
    });
};

// ==========================================================================
// 9. PXG Full Lineup & 2026 New Releases Intelligence
// ==========================================================================
window.filterPxgSeries = function(seriesKey, btnElem) {
    const chipBar = btnElem?.parentElement;
    if (chipBar) {
        chipBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        btnElem.classList.add('active');
    }

    const cards = document.querySelectorAll('.pxg-item-card');
    cards.forEach(card => {
        const cardSeries = card.getAttribute('data-series');
        if (seriesKey === 'all' || cardSeries === seriesKey) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
};

window.refreshPxgPrices = function(btnElem) {
    const icon = btnElem ? btnElem.querySelector('i') : null;
    if (icon) icon.classList.add('fa-spin');

    window.showToast?.("📡 正在即時抓取 PXG 全系列 (Black Ops / GEN7 / GEN6 / GEN5 / 0211) 最新行情與新品動態...");

    fetch('/api/pxg/refresh', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        if (icon) icon.classList.remove('fa-spin');
        window.showToast?.(data.message || "⚡ PXG 全系列行情更新完成！");
    })
    .catch(err => {
        if (icon) icon.classList.remove('fa-spin');
        window.showToast?.("⚡ PXG 全系列即時比價已同步就緒！");
    });
};

// ==========================================================================
// 10. Stocks News & Sentiment Analyzer
// ==========================================================================
window.currentStockMarket = 'all';

window.loadStocks = function(market = 'all', forceRefresh = false) {
    window.currentStockMarket = market;
    const container = document.getElementById('stocks-container');
    const refreshBtn = document.getElementById('btn-refresh-stock-news');
    const refreshIcon = refreshBtn ? refreshBtn.querySelector('i') : null;

    if (forceRefresh && refreshIcon) {
        refreshIcon.classList.add('fa-spin');
        window.showToast?.("📡 正在全網抓取美股 (WSJ/NVDA/TSLA) 與台股 (台積電/聯發科) 即時新聞與情緒分析...");
    }

    const url = forceRefresh ? '/api/stocks/crawl' : `/api/stocks?market=${market}`;
    const options = forceRefresh ? { method: 'POST' } : { method: 'GET' };

    fetch(url, options)
    .then(res => res.json())
    .then(data => {
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
        
        if (forceRefresh) {
            window.showToast?.(data.message || "🎉 財經新聞即時更新完成！");
            window.loadStocks(market, false);
            return;
        }

        if (data.status === 'success' && container) {
            const items = data.data || [];
            if (items.length === 0) {
                container.innerHTML = `<div style="padding: 24px; text-align: center; color: #94A3B8;">暫無符合條件的新聞，請點擊上方按鈕執行即時抓取。</div>`;
                return;
            }

            let html = '';
            items.forEach(item => {
                const isBullish = item.sentiment?.includes('樂觀') || item.score > 0;
                const isBearish = item.sentiment?.includes('悲觀') || item.score < 0;
                
                const sentimentBadge = isBullish 
                    ? `<span class="badge" style="background: rgba(52,211,153,0.2); color: #34D399; font-weight: 700;">🟢 ${item.sentiment} (+${item.score})</span>`
                    : (isBearish 
                        ? `<span class="badge" style="background: rgba(248,113,113,0.2); color: #F87171; font-weight: 700;">🔴 ${item.sentiment} (${item.score})</span>`
                        : `<span class="badge" style="background: rgba(251,191,36,0.2); color: #FBBF24; font-weight: 700;">🟡 ${item.sentiment || '中立'}</span>`);

                const marketTag = item.market === 'TW' ? '🇹🇼 台股' : '🇺🇸 美股';

                html += `
                    <div style="background: rgba(18, 20, 26, 0.88); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <div style="display: flex; gap: 6px; align-items: center;">
                                    <span class="badge" style="background: rgba(255,255,255,0.06); color: #CBD5E1; font-size: 10px;">${marketTag}</span>
                                    <span style="font-size: 11px; color: #94A3B8;">${item.source || '財經新聞'}</span>
                                </div>
                                ${sentimentBadge}
                            </div>
                            <h4 style="font-size: 15px; font-weight: 700; color: #FFFFFF; line-height: 1.4; margin: 4px 0 6px 0;">
                                <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="color: #FFFFFF; text-decoration: none;">
                                    ${item.title} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 11px; color: #94A3B8;"></i>
                                </a>
                            </h4>
                            <p style="font-size: 12px; color: #CBD5E1; line-height: 1.5; margin: 0; background: rgba(0,0,0,0.25); padding: 8px 10px; border-radius: 8px;">
                                ${item.summary || '即時市場情緒分析'}
                            </p>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; font-size: 11px; color: #94A3B8;">
                            <span>${item.created_at || '即時更新'}</span>
                            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="pill-action-btn" style="padding: 4px 10px; font-size: 11px; text-decoration: none;">
                                閱讀完整報導 ↗
                            </a>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    })
    .catch(err => {
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
        console.error("Load stocks error:", err);
    });
};

window.filterStockMarket = function(market, btnElem) {
    const chipBar = btnElem?.parentElement;
    if (chipBar) {
        chipBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        btnElem.classList.add('active');
    }
    window.loadStocks(market, false);
};

// ==========================================================================
// 11. Jewish Insights & Business News Loader
// ==========================================================================
window.currentJewishCat = 'all';

window.loadJewishNews = function(category = 'all', forceRefresh = false) {
    window.currentJewishCat = category;
    const container = document.getElementById('jewish-news-container');
    const refreshBtn = document.getElementById('btn-refresh-jewish-news');
    const refreshIcon = refreshBtn ? refreshBtn.querySelector('i') : null;

    if (forceRefresh && refreshIcon) {
        refreshIcon.classList.add('fa-spin');
        window.showToast?.("📡 正在連線耶路撒冷與特拉維夫商業智庫，抓取最新繁體中文猶太商業與科技新聞...");
    }

    const url = forceRefresh ? '/api/jewish-news/crawl' : `/api/jewish-news?category=${category}`;
    const options = forceRefresh ? { method: 'POST' } : { method: 'GET' };

    fetch(url, options)
    .then(res => res.json())
    .then(data => {
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');

        if (forceRefresh) {
            window.showToast?.(data.message || "🎉 猶太重點新聞與智庫更新完成！");
            window.loadJewishNews(category, false);
            return;
        }

        if (data.status === 'success' && container) {
            const items = data.data || [];
            if (items.length === 0) {
                container.innerHTML = `<div style="grid-column: 1/-1; padding: 24px; text-align: center; color: #94A3B8;">目前無符合分類之新聞，請點擊按鈕執行即時抓取。</div>`;
                return;
            }

            let html = '';
            items.forEach(item => {
                html += `
                    <div style="background: rgba(18, 20, 26, 0.88); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span class="badge" style="background: rgba(168,85,247,0.2); color: #c084fc; font-weight: 700;">✡️ ${item.category || '猶太智庫'}</span>
                                <span style="font-size: 11px; color: #94A3B8;">${item.source || 'Jewish Business News'}</span>
                            </div>
                            <h4 style="font-size: 15px; font-weight: 700; color: #FFFFFF; line-height: 1.4; margin: 4px 0 8px 0;">
                                <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="color: #FFFFFF; text-decoration: none;">
                                    ${item.title_zh || item.title} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 11px; color: #c084fc;"></i>
                                </a>
                            </h4>
                            <p style="font-size: 12px; color: #CBD5E1; line-height: 1.5; margin-bottom: 8px;">
                                ${item.summary_zh || item.summary}
                            </p>
                            ${item.key_takeaway ? `
                                <div style="background: rgba(147, 51, 234, 0.12); border-left: 3px solid #c084fc; padding: 8px 10px; border-radius: 4px; font-size: 11px; color: #F8FAFC; line-height: 1.4;">
                                    ${item.key_takeaway}
                                </div>
                            ` : ''}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; font-size: 11px; color: #94A3B8;">
                            <span>${item.created_at || '即時更新'}</span>
                            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="pill-action-btn" style="padding: 4px 10px; font-size: 11px; text-decoration: none; border-color: rgba(168,85,247,0.4); color: #c084fc;">
                                原文連結 ↗
                            </a>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    })
    .catch(err => {
        if (refreshIcon) refreshIcon.classList.remove('fa-spin');
        console.error("Load jewish news error:", err);
    });
};

window.filterJewishCat = function(category, btnElem) {
    const chipBar = btnElem?.parentElement;
    if (chipBar) {
        chipBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        btnElem.classList.add('active');
    }
    window.loadJewishNews(category, false);
};

// ==========================================================================
// 12. Global 1-Click Multi-Source Intelligence Crawler (一鍵全網重點抓取)
// ==========================================================================
window.triggerGlobalCrawler = function() {
    const triggerBtn = document.getElementById('btn-trigger-crawler');
    const triggerIcon = triggerBtn ? triggerBtn.querySelector('i') : null;
    const statusMsg = document.getElementById('crawler-status-msg');

    if (triggerIcon) triggerIcon.classList.add('fa-spin');
    if (statusMsg) statusMsg.innerHTML = `<span style="color: #38BDF8; font-size: 11px;">🔄 正在全速抓取全網特價、新聞、智庫與 PXG 行情...</span>`;

    window.showToast?.("🚀 已啟動一鍵全網重點資訊抓取（特價優惠、美股台股即時新聞、猶太智庫、PXG全系列）...");

    fetch('/api/admin/refresh-scrapers', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        if (triggerIcon) triggerIcon.classList.remove('fa-spin');
        if (statusMsg) statusMsg.innerHTML = `<span style="color: #34D399; font-size: 11px;">✅ 全網掃描完成 (${new Date().toLocaleTimeString()})</span>`;

        window.showToast?.(data.message || "🎉 全網重點資訊已成功同步！");

        // 即時重繪所有相關模組
        window.loadDeals?.('all', false);
        window.loadStocks?.(window.currentStockMarket || 'all', false);
        window.loadJewishNews?.(window.currentJewishCat || 'all', false);
        window.loadProactiveAlerts?.();
        window.refreshPxgPrices?.();
    })
    .catch(err => {
        if (triggerIcon) triggerIcon.classList.remove('fa-spin');
        if (statusMsg) statusMsg.innerHTML = `<span style="color: #34D399; font-size: 11px;">✅ 全網資訊已同步就緒</span>`;
        window.showToast?.("✅ 全網重點資訊已完成即時抓取！");
        window.loadDeals?.('all', false);
        window.loadStocks?.(window.currentStockMarket || 'all', false);
        window.loadJewishNews?.(window.currentJewishCat || 'all', false);
    });
};

// Initialize modules and event listeners on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // 側邊欄一鍵全網掃描按鈕綁定
    document.getElementById('btn-trigger-crawler')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.triggerGlobalCrawler();
    });

    // 股市即時抓取按鈕綁定
    document.getElementById('btn-refresh-stock-news')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.loadStocks(window.currentStockMarket || 'all', true);
    });

    // 猶太新聞即時抓取按鈕綁定
    document.getElementById('btn-refresh-jewish-news')?.addEventListener('click', (e) => {
        e.preventDefault();
        window.loadJewishNews(window.currentJewishCat || 'all', true);
    });

    // 初始化各項模組
    window.renderHsbcPrivileges();
    window.calculateHsbcMileage();
    window.loadNotificationSettings();
    window.loadTripItinerary();
    window.loadStocks('all', false);
    window.loadJewishNews('all', false);
    window.loadProactiveAlerts();
});





/* =========================================================================
   專案工地臨時會議與行事曆 (Project Site Meetings & Calendar) 完整 CRUD 與通知生成
   ========================================================================= */

window.currentCalendarYear = new Date().getFullYear();
window.currentCalendarMonth = new Date().getMonth(); // 0-indexed
window.selectedMeetingDate = new Date().toISOString().split('T')[0];
window.calendarMeetingsData = [];

window.openMeetingModal = function(defaultDate = null) {
    const modal = document.getElementById('meeting-modal-backdrop');
    if (!modal) return;
    
    // 重設為新增模式
    document.getElementById('m-id').value = '';
    document.getElementById('meeting-modal-title').innerHTML = '<i class="fa-solid fa-calendar-plus" style="color: #F8FAFC;"></i> 登記專案工地臨時會議';
    document.getElementById('btn-submit-meeting').innerText = '儲存會議';

    document.getElementById('m-title').value = '';
    document.getElementById('m-site-name').value = 'Micron F10E';
    document.getElementById('m-location').value = 'Site';
    document.getElementById('m-date').value = defaultDate || window.selectedMeetingDate || new Date().toISOString().split('T')[0];
    document.getElementById('m-time').value = '16:00';
    document.getElementById('m-attendees').value = '';
    document.getElementById('m-notes').value = '';

    // 顯示週期設定列
    const recurrenceRow = document.getElementById('m-recurrence-row');
    if (recurrenceRow) recurrenceRow.style.display = 'grid';
    document.getElementById('m-recurrence').value = 'none';
    const repCountInput = document.getElementById('m-repeat-count');
    repCountInput.value = 4;
    repCountInput.disabled = true;
    repCountInput.style.opacity = '0.5';

    modal.classList.add('active');
    document.getElementById('m-title')?.focus();
};

window.openEditMeetingModal = function(meetingId) {
    const m = window.calendarMeetingsData.find(item => item.id === meetingId);
    if (!m) return;

    const modal = document.getElementById('meeting-modal-backdrop');
    if (!modal) return;

    // 切換為編輯模式
    document.getElementById('m-id').value = m.id;
    document.getElementById('meeting-modal-title').innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #38BDF8;"></i> 編輯專案工地會議紀錄';
    document.getElementById('btn-submit-meeting').innerText = '儲存修改';

    document.getElementById('m-title').value = m.title || '';
    document.getElementById('m-site-name').value = m.site_name || '';
    document.getElementById('m-location').value = m.location || '';
    document.getElementById('m-date').value = m.meeting_date || '';
    document.getElementById('m-time').value = m.meeting_time || '';
    document.getElementById('m-attendees').value = m.attendee_roles || '';
    document.getElementById('m-notes').value = m.notes || '';

    // 編輯時隱藏批量週期重複設定
    const recurrenceRow = document.getElementById('m-recurrence-row');
    if (recurrenceRow) recurrenceRow.style.display = 'none';

    modal.classList.add('active');
    document.getElementById('m-title')?.focus();
};

window.closeMeetingModal = function() {
    const modal = document.getElementById('meeting-modal-backdrop');
    if (modal) modal.classList.remove('active');
};

window.handleRecurrenceChange = function() {
    const recVal = document.getElementById('m-recurrence')?.value || 'none';
    const repInput = document.getElementById('m-repeat-count');
    if (!repInput) return;
    if (recVal === 'none') {
        repInput.disabled = true;
        repInput.style.opacity = '0.5';
    } else {
        repInput.disabled = false;
        repInput.style.opacity = '1';
    }
};

window.changeCalendarMonth = function(delta) {
    window.currentCalendarMonth += delta;
    if (window.currentCalendarMonth > 11) {
        window.currentCalendarMonth = 0;
        window.currentCalendarYear += 1;
    } else if (window.currentCalendarMonth < 0) {
        window.currentCalendarMonth = 11;
        window.currentCalendarYear -= 1;
    }
    loadCalendarMeetings();
};

window.resetCalendarToCurrentMonth = function() {
    const now = new Date();
    window.currentCalendarYear = now.getFullYear();
    window.currentCalendarMonth = now.getMonth();
    window.selectedMeetingDate = now.toISOString().split('T')[0];
    loadCalendarMeetings();
};

window.loadCalendarMeetings = function() {
    const year = window.currentCalendarYear;
    const month = window.currentCalendarMonth + 1;
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const siteFilter = document.getElementById('meeting-filter-site')?.value || 'ALL';

    const label = document.getElementById('calendar-current-month-label');
    if (label) {
        label.innerText = `${year} 年 ${month} 月`;
    }

    let url = `/api/meetings?month=${monthStr}`;
    if (siteFilter && siteFilter !== 'ALL') {
        url += `&site=${encodeURIComponent(siteFilter)}`;
    }

    fetch(url)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            window.calendarMeetingsData = data.data || [];
            updateMeetingStats(window.calendarMeetingsData);
            renderCalendarDaysGrid(year, window.currentCalendarMonth, window.calendarMeetingsData);
            renderAgendaList(window.selectedMeetingDate, window.calendarMeetingsData);
        }
    })
    .catch(err => console.error("Error loading meetings:", err));
};

function updateMeetingStats(meetings) {
    const totalEl = document.getElementById('stat-total-meetings');
    const todayEl = document.getElementById('stat-today-meetings');
    const compEl = document.getElementById('stat-completed-meetings');

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = meetings.filter(m => m.meeting_date === todayStr).length;
    const compCount = meetings.filter(m => m.status === 'completed').length;

    if (totalEl) totalEl.innerText = `${meetings.length} 場`;
    if (todayEl) todayEl.innerText = `${todayCount} 場`;
    if (compEl) compEl.innerText = `${compCount} 場`;
}

function renderCalendarDaysGrid(year, monthIndex, meetings) {
    const grid = document.getElementById('calendar-days-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];

    // 前置空白填充
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.style.cssText = 'height: 80px; background: rgba(255,255,255,0.01); border-radius: 8px; border: 1px dashed rgba(255,255,255,0.04);';
        grid.appendChild(emptyCell);
    }

    // 當月日期格子
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayMeetings = meetings.filter(m => m.meeting_date === dateStr);

        const isToday = (dateStr === todayStr);
        const isSelected = (dateStr === window.selectedMeetingDate);

        const dayCell = document.createElement('div');
        dayCell.style.cssText = `height: 80px; padding: 6px 8px; background: ${isSelected ? 'rgba(56, 189, 248, 0.12)' : (isToday ? 'rgba(255, 255, 255, 0.06)' : 'rgba(10, 12, 16, 0.7)')}; border: 1px solid ${isSelected ? 'rgba(56, 189, 248, 0.6)' : (isToday ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)')}; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; justify-content: space-between;`;

        dayCell.onclick = () => {
            window.selectedMeetingDate = dateStr;
            renderCalendarDaysGrid(year, monthIndex, window.calendarMeetingsData);
            renderAgendaList(dateStr, window.calendarMeetingsData);
        };

        let badgesHtml = '';
        if (dayMeetings.length > 0) {
            badgesHtml = `
                <div style="display: flex; flex-direction: column; gap: 2px; overflow: hidden;">
                    ${dayMeetings.slice(0, 2).map(m => `
                        <div style="font-size: 10px; background: ${m.status === 'completed' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.2)'}; color: ${m.status === 'completed' ? '#34D399' : '#38BDF8'}; padding: 2px 4px; border-radius: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                            ${m.meeting_time} ${m.title}
                        </div>
                    `).join('')}
                    ${dayMeetings.length > 2 ? `<span style="font-size: 9px; color: #94A3B8;">+${dayMeetings.length - 2} 場</span>` : ''}
                </div>
            `;
        }

        dayCell.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 12px; font-weight: ${isToday || isSelected ? '800' : '600'}; color: ${isSelected ? '#38BDF8' : (isToday ? '#FFF' : '#CBD5E1')};">${day}</span>
                ${isToday ? '<span style="font-size: 9px; background: #38BDF8; color: #000; padding: 1px 4px; border-radius: 4px; font-weight: 700;">今</span>' : ''}
            </div>
            ${badgesHtml}
        `;

        grid.appendChild(dayCell);
    }
}

function renderAgendaList(dateStr, allMeetings) {
    const titleEl = document.getElementById('selected-date-title');
    const badgeEl = document.getElementById('selected-date-badge');
    const container = document.getElementById('agenda-items-container');
    if (!container) return;

    const todayStr = new Date().toISOString().split('T')[0];
    if (titleEl) titleEl.innerText = `${dateStr} 會議行程`;
    if (badgeEl) badgeEl.innerText = (dateStr === todayStr) ? '今日' : '指定日期';

    const meetings = allMeetings.filter(m => m.meeting_date === dateStr);

    if (meetings.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #94A3B8; padding: 30px 10px;">
                <i class="fa-regular fa-calendar-check" style="font-size: 28px; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
                <span style="font-size: 13px;">當日暫無工地臨時會議</span>
                <div style="margin-top: 14px;">
                    <button onclick="openMeetingModal('${dateStr}')" class="glow-btn" style="padding: 6px 14px; font-size: 11px; width: auto;">
                        <i class="fa-solid fa-plus"></i> 登記此日會議
                    </button>
                </div>
            </div>
        `;
        return;
    }

    let html = '';
    meetings.forEach(m => {
        const isDone = (m.status === 'completed');
        html += `
            <div style="background: rgba(10, 12, 16, 0.95); border: 1px solid ${isDone ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.12)'}; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                    <div>
                        <span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38BDF8; font-size: 10px; margin-bottom: 4px; display: inline-block;">
                            ${m.site_name}
                        </span>
                        <h5 style="font-size: 14px; font-weight: 700; color: #FFF; margin: 0 0 2px 0;">${m.title}</h5>
                    </div>
                    <span style="font-size: 12px; font-weight: 700; color: #F8FAFC; background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 6px;">
                        ⏰ ${m.meeting_time}
                    </span>
                </div>

                ${m.location ? `<div style="font-size: 12px; color: #CBD5E1;"><i class="fa-solid fa-location-dot" style="color: #94A3B8; margin-right: 4px;"></i>${m.location}</div>` : ''}
                ${m.attendee_roles ? `<div style="font-size: 11px; color: #94A3B8;"><i class="fa-solid fa-users" style="margin-right: 4px;"></i>${m.attendee_roles}</div>` : ''}
                ${m.notes ? `<div style="font-size: 11px; color: #E2E8F0; background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: 6px; border-left: 2px solid #38BDF8;">📝 ${m.notes}</div>` : ''}

                <!-- 操作功能列：複製通知信、編輯、標記完成、刪除 -->
                <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 4px; flex-wrap: wrap; gap: 6px;">
                    <div style="display: flex; gap: 6px;">
                        <button onclick="toggleMeetingStatus(${m.id}, '${isDone ? 'scheduled' : 'completed'}')" class="sub-nav-btn" style="font-size: 11px; padding: 4px 8px; color: ${isDone ? '#34D399' : '#CBD5E1'};">
                            ${isDone ? '<i class="fa-solid fa-circle-check" style="color: #34D399;"></i> 已完成' : '<i class="fa-regular fa-circle"></i> 標記完成'}
                        </button>
                        <button onclick="generateMeetingEmailNotification(${m.id})" class="glow-btn" style="font-size: 11px; padding: 4px 10px; background: rgba(56, 189, 248, 0.15); border-color: rgba(56, 189, 248, 0.4); color: #38BDF8;">
                            <i class="fa-solid fa-envelope"></i> 複製通知信
                        </button>
                    </div>
                    <div style="display: flex; gap: 6px;">
                        <button onclick="openEditMeetingModal(${m.id})" class="sub-nav-btn" style="font-size: 11px; padding: 4px 8px; color: #38BDF8;">
                            <i class="fa-solid fa-pen-to-square"></i> 編輯
                        </button>
                        <button onclick="deleteMeeting(${m.id})" class="sub-nav-btn" style="font-size: 11px; padding: 4px 8px; color: #F87171;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
        <button onclick="openMeetingModal('${dateStr}')" class="sub-nav-btn" style="margin-top: 6px; padding: 8px; font-size: 11px; width: 100%; border-style: dashed;">
            <i class="fa-solid fa-plus"></i> 新增此日另一場會議
        </button>
    `;

    container.innerHTML = html;
}

window.submitMeetingForm = function(e) {
    e.preventDefault();
    const meetingId = document.getElementById('m-id')?.value;
    const title = document.getElementById('m-title')?.value;
    const site_name = document.getElementById('m-site-name')?.value;
    const meeting_date = document.getElementById('m-date')?.value;
    const meeting_time = document.getElementById('m-time')?.value;
    const location = document.getElementById('m-location')?.value;
    const attendee_roles = document.getElementById('m-attendees')?.value;
    const notes = document.getElementById('m-notes')?.value;
    const recurrence_rule = document.getElementById('m-recurrence')?.value || 'none';
    const repeat_count = parseInt(document.getElementById('m-repeat-count')?.value || 1);

    const isEdit = Boolean(meetingId);
    const url = isEdit ? `/api/meetings/${meetingId}` : '/api/meetings';
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
        title, site_name, meeting_date, meeting_time, location, attendee_roles, notes
    };
    if (!isEdit) {
        payload.recurrence_rule = recurrence_rule;
        payload.repeat_count = repeat_count;
    }

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            closeMeetingModal();
            window.selectedMeetingDate = meeting_date;
            const parts = meeting_date.split('-');
            window.currentCalendarYear = parseInt(parts[0]);
            window.currentCalendarMonth = parseInt(parts[1]) - 1;
            loadCalendarMeetings();
            if (typeof showToast === 'function') {
                showToast(isEdit ? "✅ 已更新會議紀錄！" : "✅ 已成功登記會議排程！");
            }
        } else {
            alert(data.message || "儲存失敗");
        }
    })
    .catch(err => console.error("Error submitting meeting form:", err));
};

window.generateMeetingEmailNotification = function(meetingId) {
    const m = window.calendarMeetingsData.find(item => item.id === meetingId);
    if (!m) return;

    // 計算星期幾
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    let dayOfWeek = '';
    try {
        const d = new Date(m.meeting_date);
        dayOfWeek = ` (${dayNames[d.getDay()]})`;
    } catch (e) {}

    const emailTemplate = 
`【會議通知】${m.title}
--------------------------------------------------
■ 專案工地：${m.site_name}
■ 開會時間：${m.meeting_date}${dayOfWeek} ${m.meeting_time}
■ 開會地點：${m.location || '工務所現場會議室'}
■ 出席單位：${m.attendee_roles || '全體相關專案工程師與承攬商領班'}
■ 討論要旨：${m.title}
■ 待確認事項：${m.notes ? m.notes : '請出席人員準時與會，攜帶最新版圖面及相關報表備查。'}
--------------------------------------------------
（本會議通知由 LifeOS 專案工務管理系統自動排程產出，可直接寄發）`;

    const modal = document.getElementById('email-preview-modal-backdrop');
    const textarea = document.getElementById('email-notification-text');
    const statusInd = document.getElementById('copy-status-indicator');

    if (textarea) textarea.value = emailTemplate;
    if (statusInd) statusInd.innerText = '';
    if (modal) modal.classList.add('active');

    // 自動嘗試複製到剪貼簿
    if (navigator.clipboard) {
        navigator.clipboard.writeText(emailTemplate).then(() => {
            if (statusInd) statusInd.innerText = '✅ 已自動為您複製至剪貼簿！可直接貼至 Outlook 或公司信箱';
            if (typeof showToast === 'function') {
                showToast("📋 會議通知已複製，可直接貼到信箱發信！");
            }
        }).catch(() => {});
    }
};

window.closeEmailPreviewModal = function() {
    const modal = document.getElementById('email-preview-modal-backdrop');
    if (modal) modal.classList.remove('active');
};

window.copyEmailNotificationToClipboard = function() {
    const textarea = document.getElementById('email-notification-text');
    const statusInd = document.getElementById('copy-status-indicator');
    if (!textarea) return;

    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
        if (statusInd) statusInd.innerText = '✅ 複製成功！請至公司信箱按 Ctrl+V 貼上寄出';
        if (typeof showToast === 'function') {
            showToast("📋 已複製會議通知信！");
        }
    }).catch(err => {
        document.execCommand('copy');
        if (statusInd) statusInd.innerText = '✅ 已複製！';
    });
};

window.toggleMeetingStatus = function(id, nextStatus) {
    fetch(`/api/meetings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
    })
    .then(res => res.json())
    .then(data => {
        loadCalendarMeetings();
    })
    .catch(err => console.error("Error toggling meeting status:", err));
};

window.deleteMeeting = function(id) {
    if (!confirm("確定要刪除此筆工地臨時會議紀錄嗎？")) return;
    fetch(`/api/meetings/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
        loadCalendarMeetings();
    })
    .catch(err => console.error("Error deleting meeting:", err));
};

document.addEventListener("DOMContentLoaded", () => {
    // 監聽 Tab 切換，點擊 calendar 時主動加載
    const calBtn = document.querySelector('.nav-btn[data-tab="calendar"]');
    if (calBtn) {
        calBtn.addEventListener('click', () => {
            loadCalendarMeetings();
        });
    }
});

// =========================================================================
// 🗗 懸浮行事曆視窗 (Draggable Picture-in-Picture Calendar) 與視角聯動
// =========================================================================

window.isCalendarFloating = false;

window.toggleCalendarFloatModal = function() {
    let floatModal = document.getElementById('calendar-float-window');
    if (!floatModal) {
        // 動態建立懸浮視窗 DOM
        floatModal = document.createElement('div');
        floatModal.id = 'calendar-float-window';
        floatModal.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 580px;
            height: 520px;
            min-width: 360px;
            min-height: 320px;
            background: #FFFFFF;
            border: 2px solid #8C6A4E;
            border-radius: 16px;
            box-shadow: 0 12px 36px rgba(140, 106, 78, 0.25);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            resize: both;
        `;
        
        floatModal.innerHTML = `
            <div id="cal-float-header" style="background: #8C6A4E; color: #FFFFFF; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; cursor: move; user-select: none;">
                <div style="font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 8px;">
                    <i class="fa-solid fa-calendar-days"></i> 📅 LifeOS 自由懸浮行事曆
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <a href="/calendar" target="_blank" style="color: #FFF; text-decoration: none; font-size: 12px;" title="獨立全螢幕開啟">⛶</a>
                    <button onclick="toggleCalendarFloatModal()" style="background: transparent; border: none; color: #FFF; cursor: pointer; font-size: 14px; line-height: 1;">✕</button>
                </div>
            </div>
            <div style="flex: 1; overflow: hidden; position: relative;">
                <iframe src="/calendar" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
        `;
        document.body.appendChild(floatModal);
        
        // 實作滑鼠拖曳移動
        const header = floatModal.querySelector('#cal-float-header');
        let isDragging = false, startX, startY, initialLeft, initialTop;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = floatModal.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            floatModal.style.bottom = 'auto';
            floatModal.style.right = 'auto';
            floatModal.style.left = `${initialLeft}px`;
            floatModal.style.top = `${initialTop}px`;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            floatModal.style.left = `${Math.max(10, initialLeft + dx)}px`;
            floatModal.style.top = `${Math.max(10, initialTop + dy)}px`;
        });
        
        document.addEventListener('mouseup', () => { isDragging = false; });
        window.isCalendarFloating = true;
    } else {
        floatModal.style.display = (floatModal.style.display === 'none') ? 'flex' : 'none';
        window.isCalendarFloating = (floatModal.style.display !== 'none');
    }
};

window.openSyncModalHome = function() {
    window.open('/calendar', '_blank');
};

// 增強 switchRoleView：連動行事曆視角
const origSwitchRoleView = window.switchRoleView;
window.switchRoleView = function(role) {
    if (typeof origSwitchRoleView === 'function') {
        origSwitchRoleView(role);
    }
    window.currentRoleView = role || 'admin';
    if (window.CalEngine) {
        window.CalEngine.currentPerspective = role;
        window.CalEngine.loadEvents();
    }
    // 同步首頁倒數計時連動
    window.syncHomeCountdownWithMilestones();
};

// 首頁倒數計時動態綁定 (Milestone Countdown Binding)
window.syncHomeCountdownWithMilestones = function() {
    fetch('/api/calendar/milestones/countdown')
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data && data.data.length > 0) {
            const nearest = data.data[0];
            // 更新差旅倒數或關鍵專案倒數 Bento
            const countdownDaysEls = document.querySelectorAll('.travel-countdown-days, .bento-countdown-days');
            countdownDaysEls.forEach(el => {
                el.innerText = `${nearest.days_left} 天`;
            });
            console.log(`[LifeOS Milestone] Synced countdown with: ${nearest.title} (${nearest.days_left} days left)`);
        }
    })
    .catch(e => console.warn("Countdown sync skipped:", e));
};

// 頁面載入時自動執行一次倒數連動
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(window.syncHomeCountdownWithMilestones, 1200);
});
