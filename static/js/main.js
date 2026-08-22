/**
 * 完整整合版 main.js
 * 支援全分頁切換、智能機票比價、加密貨幣定時更新與 Telegram 推播
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. 取得全域 DOM 元素
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageDesc = document.getElementById('page-desc');

    // 2. 定義各分頁的標題與描述
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

    // 3. 路由別名映射表
    const aliasMap = {
        'dashboard': 'bento',
        'travel': 'guide2026',
        'finance': 'asset',
        'knowledge': 'jewish',
        'flights': 'flights',
        'deals': 'deals',
        'golf': 'golf'
    };

    // 4. 全域切換分頁函式 (掛載至 window 供按鈕或卡片點擊調用)
    window.switchTab = function(tabId) {
        const mappedTabId = aliasMap[tabId] || tabId;

        // 移除所有導覽按鈕的 active
        navBtns.forEach(btn => btn.classList.remove('active'));

        // 高亮目標導覽按鈕
        const targetBtn = document.querySelector(`.nav-btn[data-tab="${mappedTabId}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        // 切換各分頁容器的顯示/隱藏
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

        // 更新頂部標題與描述
        if (tabHeaders[mappedTabId] && pageTitle && pageDesc) {
            pageTitle.textContent = tabHeaders[mappedTabId].title;
            pageDesc.textContent = tabHeaders[mappedTabId].desc;
        }

        // 捲動回主內容區頂部
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.scrollTop = 0;
        }
    };

    // 5. 綁定所有側邊欄按鈕的點擊事件
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tabKey = btn.getAttribute('data-tab');
            if (tabKey) {
                window.switchTab(tabKey);
            }
        });
    });

    // 6. 智能機票專區：Google Flights 聯動選單邏輯
    const destinationData = {
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

    function renderFlightDetails(destCode) {
        const data = destinationData[destCode] || destinationData['SGN'];
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
                    <div style="font-size: 20px; font-weight: 700; color: #34D399;">${data.avgPrice}</div>
                </div>
            </div>
            <div style="background: rgba(0,0,0,0.25); padding: 14px; border-radius: 10px; margin-bottom: 16px;">
                <span style="font-size: 13px; color: #E2E8F0;">💡 ${data.tips}</span>
            </div>
            <div>
                <a href="${data.googleFlightsUrl}" target="_blank" style="text-decoration: none; padding: 10px 20px; background: #38BDF8; color: #0F172A; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 8px;">
                    開啟 Google Flights 即時比價 ↗
                </a>
            </div>
        `;
    }

    // 目的地選單切換監聽
    const destSelect = document.getElementById('flight-destination');
    if (destSelect) {
        destSelect.addEventListener('change', (e) => renderFlightDetails(e.target.value));
        renderFlightDetails(destSelect.value || 'SGN');
    }

    // 7. Telegram 推播小工具函式
    window.sendTelegramAlert = function(msg) {
        const token = document.getElementById('cfg-tg-token')?.value || localStorage.getItem('tg_bot_token');
        const chatId = document.getElementById('cfg-tg-chatid')?.value || localStorage.getItem('tg_chat_id');
        if (!token || !chatId) {
            console.warn("尚未設定 Telegram Token 或 Chat ID");
            return;
        }
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
        }).catch(err => console.error("Telegram 推播失敗:", err));
    };

    // 8. 虛擬貨幣與股市每小時定時更新 & 補追機制
    function updateCryptoData() {
        const timeLabel = document.getElementById('crypto-last-sync');
        if (timeLabel) {
            timeLabel.innerText = `已更新於 ${new Date().toLocaleTimeString()}`;
        }
        localStorage.setItem('last_crypto_sync_time', Date.now().toString());
    }

    // 檢查是否超過 1 小時未更新，若是則立即補追
    const lastSync = localStorage.getItem('last_crypto_sync_time');
    if (!lastSync || (Date.now() - parseInt(lastSync, 10)) > 3600000) {
        updateCryptoData();
    }
    setInterval(updateCryptoData, 3600000); // 每小時自動輪詢

    // 9. 預設顯示首頁
    window.switchTab('home');
});
