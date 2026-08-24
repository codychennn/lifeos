# LifeOS 核心功能與系統架構 永久鎖定規範 (LOCKED_FEATURES.md)

> [!IMPORTANT]
> **本文件所列之 9 大核心功能與系統架構已由使用者授權【永久鎖定】。**
> **未來的任何開發與迭代【只能進行效能優化與功能擴充，絕對禁止刪除或破壞現有行為】。**

---

## 🔒 9 大永久鎖定核心功能 (Locked Core Features)

### 1. 📍 100% 精準 Google Maps 地圖真實導航
- **核心行為**：所有景點與餐廳卡片之 `google_map_query` 參數必須為 **100% 純淨實體英文/在地地名**（例如：`Bellagio Fountains Las Vegas NV`、`Louvre Museum Paris France`、`Shibuya Sky Tokyo Japan`）。
- **嚴格禁令**：絕對禁止包含 `#6` 序號、`#IG爆紅` 或虛構 Hashtag 雜訊，確保點擊【📍 Google 地圖精準導航 ↗】100% 直達實體店家。

### 2. 🗺️ 50,000+ 筆全網真實景點與美食名店智庫
- **核心行為**：SQLite 資料庫 (`personal_assistant.db`) 保持 50,000 筆以上之全球 30 大旅遊國家真實景點與名店收錄。
- **嚴格禁令**：全站標籤、Header 與 API 統計統一連線並標示為 **50,000+ 筆**，禁止回退為一萬筆或測試假資料。

### 3. 🧳 1-Click ➕ 加入個人旅行與美食清單
- **核心行為**：每張景點/餐廳卡片皆具備【➕ 加入旅行與美食清單】按鈕，點擊後即時寫入 `my_travel_list` 資料庫，並連動頂部 `🧳 我的旅行清單 (X)` 狀態計數器與 `tab-travelbook` 渲染。

### 4. 📄 12 筆 / 頁 精緻分頁控制器 (Paginated Grid UX)
- **核心行為**：`tab-guide2026` 預設採 12 筆/頁之精緻 3x4 網格分頁器 (`[◀ 上一頁] 第 1 / 4,167 頁 [下一頁 ▶]`)，翻頁時優雅捲動至頂部。
- **嚴格禁令**：禁止改回超級冗長的無限垂直下拉（Vertical Infinite Scroll），維護高級使用體驗。

### 5. 🇹🇼 全站新台幣 NT$ 價格統一與台銀即期匯率算盤
- **核心行為**：
  1. 全站機票、特惠、潮牌、飯店與加密貨幣標價，100% 統一標示為 **新台幣 (NT$)**。
  2. 頂部 Header 內建台灣銀行即期買賣匯率表 (USD, JPY, EUR, GBP, SGD, AUD, HKD, VND, CNY) 與 **1-Click 即期換算台幣算盤**。

### 6. 👕 世界潮牌與奢華時尚即時動態牆 (World Streetwear Feed)
- **核心行為**：`tab-lifestyle` 內建即時潮牌動態牆，追蹤 Supreme, Stüssy, Fear of God Essentials, Chrome Hearts, Gentle Monster 全球限量發售與新台幣價格。

### 7. ⚡ 全域動態情境決策引擎 (Contextual Decision Engine)
- **核心行為**：頂部選擇城市（新加坡、胡志明市、洛杉磯、西雅圖、倫敦、巴黎、東京）時，全頁面「智能機票」、「預算計算器」與「生活日常」無縫連動切換。

### 8. 🚨 24/7 事件驅動主動風控與套利推播雷達 (Event-Driven Proactive Alerts)
- **核心行為**：離線背景持續監控匯率超跌、機票暴跌 > 20%、股市/加密貨幣觸及 $MA_{30}$ 均線，格式化產出 **3點式黃金行動建議** 並發送 Telegram。

### 9. 🖤 極簡高級黑灰白 (Monochrome Matte Black & Slate Silver) 視覺主題
- **核心行為**：全站統一採用曜石黑 (`#0A0B0E`) 搭配霧面暗色玻璃卡片 (`rgba(18, 20, 26, 0.88)`)、白銀線框與高對比白鈦字體。

---

## 🧪 回歸驗證機制 (Regression Test Protection)

系統內建 `test_locked_features_regression.py` 單元測試，每次程式碼變更前必須全數通過，確保 locked 功能不受任何後續修改影響。
