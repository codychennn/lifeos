# LifeOS Phase 2 — Flask Full Audit Report

本文件詳細記錄 LifeOS 目前 Flask 網站的所有 Route、HTTP Method、Function、Template、API 連線狀態與系統稽核結果。

---

## 1. Flask Route Audit 總覽

- **總路由數 (Total Routes)**: 49（包含 48 個自訂功能/API 端點 + 1 個 Static 靜態資源路由）
- **架構類型**: Single Page Application (SPA) + Flask RESTful API
- **主渲染模板 (Main Template)**: `templates/index.html`

### 完整路由清單表格

| # | Route URL | HTTP Method | Function | Template | Status | 說明與用途 |
|---|---|---|---|---|---|---|
| 1 | `/` | `GET` | `index` | `templates/index.html` | `200 OK` | 系統入口首頁，載入 SPA 主骨幹 HTML |
| 2 | `/api/dashboard/stats` | `GET` | `api_get_dashboard_stats` | JSON API (`None`) | `200 OK` | 頂部儀表板統計數據（景點數、指南數、國家數） |
| 3 | `/api/spots/search` | `GET` | `api_search_spots` | JSON API (`None`) | `200 OK` | 全球 11,272+ 筆 Tripadvisor 4.5★ 景點美食搜尋與分頁庫 |
| 4 | `/api/recommendations` | `GET` | `api_get_recommendations` | JSON API (`None`) | `200 OK` | 基於國家、城市與景點的 AI 推薦演算法 |
| 5 | `/api/ai/plan` | `POST` | `api_ai_plan_itinerary` | JSON API (`None`) | `200 OK` | AI 2.0 智慧旅遊行程規劃器 |
| 6 | `/api/cms/countries` | `GET` | `api_get_countries` | JSON API (`None`) | `200 OK` | 取得國家清單 |
| 7 | `/api/cms/cities` | `GET` | `api_get_cities` | JSON API (`None`) | `200 OK` | 取得指定國家的城市清單 |
| 8 | `/api/cms/guides` | `GET` | `api_get_guides` | JSON API (`None`) | `200 OK` | 取得 CMS 旅遊書指南清單 |
| 9 | `/api/cms/guides/<int:guide_id>` | `GET` | `api_get_guide_content` | JSON API (`None`) | `200 OK` | 取得特定旅遊書手冊詳細內容與景點資料 |
| 10 | `/api/cms/guides/<int:guide_id>/edit` | `POST` | `api_edit_guide` | JSON API (`None`) | `200 OK` | 編輯旅遊書基本資訊 |
| 11 | `/api/cms/copy-guide` | `POST` | `api_copy_guide` | JSON API (`None`) | `200 OK` | 一鍵複製旅遊書範本至新國家/新標題 |
| 12 | `/api/cms/places` | `POST` | `api_save_place` | JSON API (`None`) | `200 OK` | 新增或更新 CMS 地點/景點/飯店資料 |
| 13 | `/api/cms/places/<int:place_id>` | `DELETE` | `api_delete_place` | JSON API (`None`) | `200 OK` | 刪除 CMS 地點資料 |
| 14 | `/api/maps/curated-list` | `GET` | `api_get_curated_map_list` | JSON API (`None`) | `200 OK` | 生成 Google Maps 景點分類清單連結 |
| 15 | `/api/maps/status-check` | `GET` | `api_check_place_status` | JSON API (`None`) | `200 OK` | 檢查景點營業營運狀態 |
| 16 | `/api/budget/calculate` | `POST` | `api_calculate_budget` | JSON API (`None`) | `200 OK` | 智慧旅遊預算動態計算器（機票、住宿、餐飲均攤） |
| 17 | `/api/expenses` | `GET` | `api_get_expenses` | JSON API (`None`) | `200 OK` | 查詢記帳明細清單（支援分類與日期篩選） |
| 18 | `/api/expenses` | `POST` | `api_add_expense` | JSON API (`None`) | `200 OK` | 新增記帳（支援自然語言文字解析與表單欄位） |
| 19 | `/api/expenses/<int:expense_id>` | `DELETE` | `api_delete_expense` | JSON API (`None`) | `200 OK` | 刪除特定一筆記帳紀錄 |
| 20 | `/api/stats` | `GET` | `api_get_stats` | JSON API (`None`) | `200 OK` | 取得今日與當月支出統計及類別佔比 (Chart.js) |
| 21 | `/api/deals` | `GET` | `api_get_deals` | JSON API (`None`) | `200 OK` | 取得 PTT 省錢板、長榮/阿拉斯加機票特價監控清單 |
| 22 | `/api/stocks` | `GET` | `api_get_stocks` | JSON API (`None`) | `200 OK` | 取得 WSJ 美股與台股重大新聞與市場情緒分析 |
| 23 | `/api/stocks/crawl` | `POST` | `api_crawl_stocks` | JSON API (`None`) | `200 OK` | 手動即時觸發美股/台股新聞爬蟲掃描 |
| 24 | `/api/jewish-news` | `GET` | `api_get_jewish_news` | JSON API (`None`) | `200 OK` | 取得猶太商道典籍與重點商業新聞評註 |
| 25 | `/api/jewish-news/crawl` | `POST` | `api_crawl_jewish_news` | JSON API (`None`) | `200 OK` | 手動即時觸發猶太智庫重點新聞爬取與繁中翻譯 |
| 26 | `/api/lifestyle` | `GET` | `api_get_lifestyle_deals` | JSON API (`None`) | `200 OK` | 新加坡星巴克買一送一、速食、本地早餐折價券 |
| 27 | `/api/lifestyle/crawl` | `POST` | `api_crawl_lifestyle` | JSON API (`None`) | `200 OK` | 即時掃描新加坡餐飲與星巴克最新優惠 |
| 28 | `/api/settings/telegram` | `GET` | `api_get_telegram_settings` | JSON API (`None`) | `200 OK` | 取得 Telegram Bot Token 與 Chat ID 設定狀態 |
| 29 | `/api/settings/telegram` | `POST` | `api_save_telegram_settings` | JSON API (`None`) | `200 OK` | 儲存 Telegram 設定至 `.env` 並發送測試推播 |
| 30 | `/api/trips` | `GET` | `api_get_trips` | JSON API (`None`) | `200 OK` | 取得所有自訂行程旅遊書清單 |
| 31 | `/api/trips` | `POST` | `api_create_trip` | JSON API (`None`) | `200 OK` | 建立新的自訂行程手冊 |
| 32 | `/api/trips/<int:trip_id>` | `GET` | `api_get_trip_detail` | JSON API (`None`) | `200 OK` | 取得特定行程詳細資料（含交通、住宿與每日行程） |
| 33 | `/api/trips/<int:trip_id>` | `DELETE` | `api_delete_trip` | JSON API (`None`) | `200 OK` | 刪除整個行程與相關手冊資料 |
| 34 | `/api/trips/<int:trip_id>/logistics` | `POST` | `api_add_logistics` | JSON API (`None`) | `200 OK` | 新增機票航班或飯店住宿紀錄 |
| 35 | `/api/logistics/<int:log_id>` | `DELETE` | `api_delete_logistics` | JSON API (`None`) | `200 OK` | 刪除特定交通/住宿項目 |
| 36 | `/api/trips/<int:trip_id>/itinerary` | `POST` | `api_add_itinerary` | JSON API (`None`) | `200 OK` | 新增行程活動項目至指定天數與時段 |
| 37 | `/api/itinerary/<int:itin_id>/swap` | `PUT` | `api_swap_itinerary_slot` | JSON API (`None`) | `200 OK` | 一鍵上下午行程時段對調 (morning ↔ afternoon) |
| 38 | `/api/itinerary/<int:itin_id>` | `DELETE` | `api_delete_itinerary` | JSON API (`None`) | `200 OK` | 刪除特定活動行程項目 |
| 39 | `/api/admin/refresh-scrapers` | `POST` | `api_refresh_scrapers` | JSON API (`None`) | `200 OK` | 全網即時掃描特價機票與財經即時新聞 |
| 40 | `/api/golf-logs` | `GET` | `api_get_golf_logs` | JSON API (`None`) | `200 OK` | 取得高爾夫訓練焦點日誌與揮桿數據 |
| 41 | `/api/golf-logs` | `POST` | `api_add_golf_log` | JSON API (`None`) | `200 OK` | 新增高爾夫訓練日誌記錄 |
| 42 | `/api/asset-monitor` | `GET` | `api_get_asset_monitor` | JSON API (`None`) | `200 OK` | 取得理財型房貸 LTV、現金流 Runway 與 ETF 水位 |
| 43 | `/api/asset-monitor` | `POST` | `api_update_asset_monitor` | JSON API (`None`) | `200 OK` | 更新防禦性資產與槓桿水位數據 |
| 44 | `/api/quick-capture` | `POST` | `api_quick_capture` | JSON API (`None`) | `200 OK` | 隨手記靈感錄入（自動分流至財務/差旅/工程） |
| 45 | `/api/quick-notes` | `GET` | `api_get_quick_notes` | JSON API (`None`) | `200 OK` | 取得所有錄入的隨手筆記清單 |
| 46 | `/api/tsp/optimize` | `POST` | `api_tsp_optimize` | JSON API (`None`) | `200 OK` | 旅行商問題 (TSP) 點對點動態路徑最佳化 |
| 47 | `/api/automation/weather` | `GET` | `api_get_weather` | JSON API (`None`) | `200 OK` | 目的地 7 日天氣預報與雨天備案建議 |
| 48 | `/api/automation/exchange-rates` | `GET` | `api_get_exchange_rates` | JSON API (`None`) | `200 OK` | 即時自動連網多國匯率牌價 |
| 49 | `/static/<path:filename>` | `GET` | `static` | Static Assets | `200 OK` | 提供 CSS (`style.css`)、JS (`main.js`) 靜態檔案 |

---

## 2. 核心問題診斷：為什麼某些分頁（例如 Golf / 儀表板 / 財務 / 智庫）點擊後會變空白？

經過代碼級全流程追蹤，找出造成頁面空白與異常的 **3 大關鍵根因**：

### 根因 1：`switchTab()` 與 HTML 卡片 `onclick` 路由別名不匹配 (Critical)
- **問題現象**：在首頁 (Home) 點擊「開始使用 LifeOS」、「瀏覽旅遊智庫」，或點擊「Travel」、「Finance」、「Knowledge」卡片時，整個畫面會瞬間變成完全空白。
- **追蹤代碼**：
  - `templates/index.html` 中的 Home 模組卡片直接調用：
    - `onclick="switchTab('dashboard')"`
    - `onclick="switchTab('travel')"`
    - `onclick="switchTab('finance')"`
    - `onclick="switchTab('knowledge')"`
  - `static/js/main.js` 中的 `window.switchTab(tabId)`：
    ```javascript
    window.switchTab = function(tabId) {
        const targetBtn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
        if (targetBtn) {
            targetBtn.click();
        } else {
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active')); // ⚠️ 將所有 tab-content 的 active 移除
            const targetElem = document.getElementById(`tab-${tabId}`); // ⚠️ 尋找 tab-dashboard / tab-travel / tab-finance / tab-knowledge
            if (targetElem) targetElem.classList.add('active');
        }
    };
    ```
  - 但在 DOM 中，實際存在的 section ID 分別是：
    - `#tab-bento`（而不是 `#tab-dashboard`）
    - `#tab-guide2026`（而不是 `#tab-travel`）
    - `#tab-asset` / `#tab-expenses`（而不是 `#tab-finance`）
    - `#tab-jewish`（而不是 `#tab-knowledge`）
  - 因此 `targetElem` 為 `null`，所有分頁的 `active` 類別被全數移除，導致**畫面 100% 變為空白**！

### 根因 2：雙重預設 Active 標籤衝突
- **問題現象**：首次載入網頁時，`tab-home` (Line 177) 與 `tab-guide2026` (Line 263) 同時帶有 `class="tab-content active"`。
- **影響**：兩個頁面內容同時在 DOM 中顯示並堆疊，造成首頁排版異常。

### 根因 3：爬蟲手動觸發 API URL 不一致
- `app.py` 中定義的後端端點為：`@app.route("/api/admin/refresh-scrapers", methods=["POST"])`
- 但在 `static/js/main.js`（Line 896）中調用的卻是：`fetch('/api/trigger-crawler', { method: 'POST' })`
- **影響**：側邊欄左下角的「立即執行全網掃描」按鈕點擊後會回傳 500/404 錯誤，無法手動觸發新聞與特價爬蟲。

---

## 3. Template Audit (模板稽核)

### HTML 結構與變數清單

- **檔案路徑**: `templates/index.html` (1,986 行, 178 KB)
- **Extends / Blocks**: 無使用 Jinja2 模板繼承（單一 SPA 頁面架構）。
- **Jinja2 變數使用**:
  - `{{ url_for('static', filename='css/style.css') }}`
  - `{{ url_for('static', filename='js/main.js') }}`
- **Undefined Variables**: 無未定義的 Flask 模板變數（所有動態內容皆由前端 JS Fetch API 驅動）。
- **外部資源**:
  - FontAwesome 6.4.0 (CDN)
  - Google Fonts (Outfit, Inter Tight, Inter, Noto Sans TC, Noto Serif TC)
  - Chart.js (CDN)
  - MathJax 3 (CDN)

---

## 4. 稽核結論與改善建議 (Next Steps)

1. **修正 `window.switchTab` 別名映射**：將 `dashboard` 映射至 `bento`，`travel` 映射至 `guide2026`，`finance` 映射至 `asset`/`expenses`，`knowledge` 映射至 `jewish`，避免任何點擊導致空白頁。
2. **移除 `tab-guide2026` 初始的 `active` class**：確保首頁載入時僅有 `tab-home` 處於 active 狀態。
3. **對齊爬蟲觸發 API 端點**：將 `main.js` 中的 `/api/trigger-crawler` 更新為 `/api/admin/refresh-scrapers`，或在 `app.py` 中新增相容別名路由。
4. **補充遺漏的 DOM 容器 ID**：確保 `loadGolfLogs()` 與 `loadDashboardStats()` 能精準將後端資料注入對應 DOM 元素。
