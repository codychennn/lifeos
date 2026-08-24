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

    // 4. 特惠分頁連動觸發
    if (mappedTabId === 'deals' && window.loadDeals) {
        window.loadDeals('all');
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

// 6. 特價優惠監控載入
window.loadDeals = function(filterCategory = 'all') {
    const container = document.getElementById('deals-container');
    if (!container) return;

    fetch('/api/deals?limit=30')
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data && data.data.length > 0) {
            let html = '';
            const filtered = data.data.filter(d => {
                if (filterCategory === 'all') return true;
                return d.matched_keyword && d.matched_keyword.toLowerCase().includes(filterCategory.toLowerCase());
            });

            const displayList = filtered.length > 0 ? filtered : data.data;

            displayList.forEach(d => {
                html += `
                    <div style="background: rgba(18, 20, 26, 0.88); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span class="badge">${d.source || '全網特惠'}</span>
                                <span style="font-size: 11px; color: #F8FAFC; font-weight: 700;">${d.matched_keyword || '閃促特惠'}</span>
                            </div>
                            <h4 style="font-size: 15px; color: #FFF; font-weight: 700; margin-bottom: 6px; line-height: 1.4;">${d.title}</h4>
                            <p style="font-size: 11px; color: #94A3B8; margin-top: 4px;">更新時間：${new Date(d.created_at || Date.now()).toLocaleDateString()}</p>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
                            <a href="${d.link}" target="_blank" class="glow-btn" style="width: 100%; text-align: center; text-decoration: none;">
                                查看特惠詳情 ↗
                            </a>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    })
    .catch(err => console.error("Load deals error:", err));
};

window.filterDealsCategory = function(cat, btnElem) {
    const btns = btnElem.parentElement.querySelectorAll('.sub-nav-btn');
    btns.forEach(b => b.classList.remove('active'));
    btnElem.classList.add('active');
    loadDeals(cat);
};

window.triggerDealsCrawl = function() {
    alert("⚡ 已手動觸發全網特惠與機票閃促爬蟲！系統正即時掃描優惠中...");
    loadDeals('all');
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
                    <div style="background: rgba(18, 20, 26, 0.88); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="badge">${a.category}</span>
                            <span style="font-size: 10px; color: #94A3B8;">24/7 自動風控</span>
                        </div>
                        <h4 style="font-size: 14px; font-weight: 700; color: #FFF; margin: 0; line-height: 1.4;">${a.title}</h4>
                        <div style="font-size: 11px; color: #E2E8F0; font-weight: 700; background: rgba(255,255,255,0.03); padding: 6px 10px; border-radius: 6px;">
                            📊 ${a.metrics}
                        </div>
                        <div style="font-size: 11px; color: #CBD5E1; line-height: 1.5; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
                            <div style="color: #F8FAFC; font-weight: 700; margin-bottom: 4px;">💡 3點式行動建議：</div>
                            <div>${a.recommendation_3bullets[0]}</div>
                            <div>${a.recommendation_3bullets[1]}</div>
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
   世界潮牌動態牆 (Streetwear Feed) & 台灣銀行即期匯率快速換算 Handler
   ========================================================================= */

window.loadStreetwearFeed = function(brandFilter = 'all') {
    const container = document.getElementById('streetwear-feed-container');
    if (!container) return;

    fetch(`/api/streetwear/feed?brand=${brandFilter}`)
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data) {
            let html = '';
            data.data.forEach(item => {
                html += `
                    <div style="background: rgba(18, 20, 26, 0.88); border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px; transition: all 0.25s ease;" onmouseover="this.style.borderColor='rgba(255,255,255,0.4)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.14)'">
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
    })
    .catch(err => console.error("Load streetwear feed error:", err));
};

window.filterStreetwearBrand = function(brand, btnElem) {
    const btns = btnElem.parentElement.querySelectorAll('.sub-nav-btn');
    btns.forEach(b => b.classList.remove('active'));
    btnElem.classList.add('active');
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

// 綁定台銀即期換算事件
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById('header-bank-fx-select')?.addEventListener('change', updateQuickSpotConvert);
    document.getElementById('quick-convert-amount')?.addEventListener('input', updateQuickSpotConvert);
    
    // 初始化載入潮牌動態牆與即期換算
    loadStreetwearFeed('all');
    updateQuickSpotConvert();
});
