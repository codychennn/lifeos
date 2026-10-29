/**
 * LifeOS Smart Memory & Input History Engine (智慧記憶空間與快速快選引擎)
 * 
 * 功能亮點：
 * 1. 記憶空間持久化 (Persistent Memory Storage)：自動記住使用者輸入過、搜尋過的關鍵字、標題、案場與地點。
 * 2. 聚焦即彈出快選 (Instant Pop-up Dropdown on Focus)：點擊輸入框立即跳出歷史記憶與智慧推薦選單。
 * 3. 即時模糊過濾 (Real-time Fuzzy Filtering)：打字時即時過濾歷史紀錄，並高亮匹配字元。
 * 4. 快捷標籤列 (Inline Quick Chips Bar)：在關鍵搜尋框下方直接顯示可點擊的膠囊標籤。
 * 5. 鍵盤快速導航 (Keyboard Nav)：支援 ↑ / ↓ 箭頭快速選取，Enter 確認，Esc 關閉。
 * 6. 靈活單筆刪除與全清：可單筆刪除不想要的歷史紀錄，或一鍵清空。
 */

window.LifeOSMemoryEngine = {
    STORAGE_PREFIX: 'lifeos_memory_history_',
    activeDropdown: null,
    currentInput: null,
    selectedIndex: -1,

    // 常用預設情境資料 (Pre-seeded Presets)
    PRESETS: {
        viral_search: [
            '東京 澀谷', '京都 懷石料理', '曼谷 露天高空酒吧', '首爾 聖水洞', 
            '新加坡 濱海灣', '米其林星級名廚', '美西自駕公路', 'Outlet 名品街'
        ],
        cal_event_title: [
            'TAK Site Walk 案場巡檢', '機電廠商動員進場會議', '長榮航空直飛東京機票確認', 
            '大溪高爾夫球場球敘', '月度財務除權息與風控檢視', '星野度假村飯店入住', '設備進廠吊裝工程'
        ],
        cal_site_name: [
            'Micron F10E', '台積電 F18 晶圓廠', '美西自駕公路之旅', 
            '林口國際高爾夫球場', '南科三期智慧園區', '台北總部辦公室'
        ],
        cal_location: [
            '工務所會議室 A', '現場 B 棟 3F 潔淨室', '線上 Microsoft Teams 會議', 
            '桃園機場 T2 貴賓室', '球會會館餐廳', '線上視訊會議'
        ],
        meeting_title: [
            'TAK Site Walk 案場巡檢', '工程節點協調會', '廠商動員進場進度檢討', '工務所每週定檢'
        ],
        meeting_site: [
            'Micron F10E', '台積電 F18', '南科三期', '竹科專案'
        ],
        meeting_location: [
            'Site 工務所會議室', '線上視訊會議', 'A 棟 3F 會議廳'
        ],
        meeting_attendees: [
            '專案經理、工種主任、外包廠商', '建築師、結構技師、業主代表', '全體專案小組成員'
        ]
    },

    init: function() {
        console.log('[MemoryEngine] 正在啟動 LifeOS 智慧記憶與快選引擎...');
        this.injectGlobalStyles();
        this.bindGlobalListeners();
        this.autoAttachKnownInputs();
    },

    // 1. 讀取與儲存歷史紀錄
    getHistory: function(namespace) {
        try {
            const raw = localStorage.getItem(this.STORAGE_PREFIX + namespace);
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    },

    saveHistory: function(namespace, list) {
        try {
            localStorage.setItem(this.STORAGE_PREFIX + namespace, JSON.stringify(list));
        } catch(e) {}
    },

    addEntry: function(namespace, value) {
        if (!value || typeof value !== 'string') return;
        const clean = value.trim();
        if (!clean || clean.length < 1) return;

        let list = this.getHistory(namespace);
        // 去除重複並將最新輸入置頂
        list = list.filter(item => item.toLowerCase() !== clean.toLowerCase());
        list.unshift(clean);
        // 限制每個欄位最多保存 25 筆
        if (list.length > 25) list = list.slice(0, 25);

        this.saveHistory(namespace, list);
        this.refreshActiveChips(namespace);
    },

    removeEntry: function(namespace, value) {
        let list = this.getHistory(namespace);
        list = list.filter(item => item !== value);
        this.saveHistory(namespace, list);
        this.refreshActiveChips(namespace);
    },

    clearHistory: function(namespace) {
        localStorage.removeItem(this.STORAGE_PREFIX + namespace);
        this.refreshActiveChips(namespace);
    },

    // 2. 全域 CSS 樣式注入
    injectGlobalStyles: function() {
        if (document.getElementById('lifeos-memory-styles')) return;
        const style = document.createElement('style');
        style.id = 'lifeos-memory-styles';
        style.textContent = `
            /* 智慧記憶浮動面板 (Smart Memory Floating Dropdown) */
            .lifeos-memory-dropdown {
                position: absolute;
                z-index: 10050;
                background: #FFFFFF;
                border: 1px solid rgba(140, 106, 78, 0.28);
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(140, 106, 78, 0.08);
                padding: 10px 0;
                min-width: 280px;
                max-width: 520px;
                font-family: 'Noto Sans TC', sans-serif;
                animation: memoryFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                user-select: none;
                backdrop-filter: blur(16px);
            }

            /* 暗色系儀表板適配 */
            body.dark-mode .lifeos-memory-dropdown,
            .theme-dark .lifeos-memory-dropdown,
            .glass-card .lifeos-memory-dropdown {
                background: rgba(18, 20, 26, 0.96) !important;
                border-color: rgba(255, 255, 255, 0.18) !important;
                color: #F8FAFC !important;
                box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5) !important;
            }

            @keyframes memoryFadeIn {
                from { opacity: 0; transform: translateY(-6px) scale(0.98); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            .lmd-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 14px 8px 14px;
                border-bottom: 1px solid rgba(140, 106, 78, 0.12);
                font-size: 11px;
                font-weight: 700;
                color: #8C6A4E;
                letter-spacing: 0.5px;
            }
            .dark-mode .lmd-header {
                border-bottom-color: rgba(255, 255, 255, 0.1);
                color: #CBD5E1;
            }

            .lmd-clear-btn {
                background: none;
                border: none;
                color: #94A3B8;
                font-size: 11px;
                cursor: pointer;
                transition: color 0.15s ease;
                padding: 2px 4px;
                border-radius: 4px;
            }
            .lmd-clear-btn:hover {
                color: #EF4444;
                text-decoration: underline;
            }

            .lmd-list {
                max-height: 230px;
                overflow-y: auto;
                padding: 4px 0;
            }

            .lmd-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 14px;
                font-size: 13px;
                color: #3E3E3E;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .dark-mode .lmd-item {
                color: #E2E8F0;
            }

            .lmd-item:hover, .lmd-item.selected {
                background: rgba(217, 160, 102, 0.12);
                color: #8C6A4E;
            }
            .dark-mode .lmd-item:hover, .dark-mode .lmd-item.selected {
                background: rgba(255, 255, 255, 0.08);
                color: #38BDF8;
            }

            .lmd-item-text {
                display: flex;
                align-items: center;
                gap: 8px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                flex: 1;
            }

            .lmd-item-del {
                opacity: 0;
                background: none;
                border: none;
                color: #94A3B8;
                font-size: 13px;
                padding: 2px 6px;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.15s ease;
            }
            .lmd-item:hover .lmd-item-del {
                opacity: 0.8;
            }
            .lmd-item-del:hover {
                color: #EF4444;
                background: rgba(239, 68, 68, 0.1);
                opacity: 1;
            }

            .lmd-presets-box {
                padding: 8px 14px 4px 14px;
                border-top: 1px dashed rgba(140, 106, 78, 0.15);
                background: rgba(244, 241, 237, 0.35);
            }
            .dark-mode .lmd-presets-box {
                border-top-color: rgba(255, 255, 255, 0.1);
                background: rgba(0, 0, 0, 0.2);
            }

            .lmd-presets-title {
                font-size: 11px;
                font-weight: 700;
                color: #6B6B6B;
                margin-bottom: 6px;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .dark-mode .lmd-presets-title { color: #94A3B8; }

            .lmd-presets-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }

            .lmd-preset-chip {
                font-size: 11px;
                padding: 3px 8px;
                border-radius: 6px;
                background: rgba(140, 106, 78, 0.08);
                border: 1px solid rgba(140, 106, 78, 0.2);
                color: #8C6A4E;
                cursor: pointer;
                transition: all 0.15s ease;
            }
            .dark-mode .lmd-preset-chip {
                background: rgba(255, 255, 255, 0.06);
                border-color: rgba(255, 255, 255, 0.15);
                color: #CBD5E1;
            }
            .lmd-preset-chip:hover {
                background: #8C6A4E;
                color: #FFFFFF;
                border-color: #8C6A4E;
                transform: translateY(-1px);
            }
            .dark-mode .lmd-preset-chip:hover {
                background: #38BDF8;
                color: #000;
                border-color: #38BDF8;
            }

            /* 即時標籤列 (Inline Quick Chips Bar) */
            .search-history-chips-row {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                margin: 8px 0 12px 0;
                font-size: 12px;
            }
            .sh-chip-pill {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                padding: 3px 10px;
                background: rgba(140, 106, 78, 0.08);
                border: 1px solid rgba(140, 106, 78, 0.22);
                border-radius: 20px;
                color: #8C6A4E;
                cursor: pointer;
                transition: all 0.2s ease;
                font-weight: 500;
            }
            .dark-mode .sh-chip-pill, .glass-card .sh-chip-pill {
                background: rgba(255, 255, 255, 0.06);
                border-color: rgba(255, 255, 255, 0.16);
                color: #E2E8F0;
            }
            .sh-chip-pill:hover {
                background: rgba(140, 106, 78, 0.16);
                border-color: #D9A066;
                transform: translateY(-1px);
            }
            .sh-chip-remove {
                font-size: 11px;
                color: #94A3B8;
                cursor: pointer;
                margin-left: 2px;
                line-height: 1;
            }
            .sh-chip-remove:hover {
                color: #EF4444;
            }
            .sh-label {
                font-size: 11px;
                font-weight: 700;
                color: #8C6A4E;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .dark-mode .sh-label, .glass-card .sh-label {
                color: #94A3B8;
            }
        `;
        document.head.appendChild(style);
    },

    // 3. 全域點擊外部關閉監聽
    bindGlobalListeners: function() {
        document.addEventListener('click', (e) => {
            if (this.activeDropdown && !this.activeDropdown.contains(e.target) && e.target !== this.currentInput) {
                this.hideDropdown();
            }
        });

        window.addEventListener('resize', () => {
            if (this.activeDropdown && this.currentInput) {
                this.repositionDropdown(this.currentInput);
            }
        });

        window.addEventListener('scroll', () => {
            if (this.activeDropdown && this.currentInput) {
                this.repositionDropdown(this.currentInput);
            }
        }, true);
    },

    // 4. 掛載支援記憶的輸入框
    attach: function(inputEl, namespace, options = {}) {
        if (!inputEl) return;
        inputEl.setAttribute('autocomplete', 'off'); // 禁用原生雜亂彈窗

        const onTrigger = options.onSelect || null;

        // 點擊與聚焦跳出快選
        const showHandler = () => {
            this.showDropdown(inputEl, namespace, options);
        };
        inputEl.addEventListener('focus', showHandler);
        inputEl.addEventListener('click', showHandler);

        // 輸入時即時過濾
        inputEl.addEventListener('input', () => {
            this.showDropdown(inputEl, namespace, options);
        });

        // 鍵盤導航 (上下鍵選取、Enter確認、Esc關閉)
        inputEl.addEventListener('keydown', (e) => {
            if (!this.activeDropdown) {
                if (e.key === 'ArrowDown') {
                    this.showDropdown(inputEl, namespace, options);
                    e.preventDefault();
                }
                return;
            }

            const items = this.activeDropdown.querySelectorAll('.lmd-item');
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex + 1) % items.length;
                this.updateSelectedVisual(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
                this.updateSelectedVisual(items);
            } else if (e.key === 'Enter') {
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    e.preventDefault();
                    items[this.selectedIndex].click();
                } else {
                    // 使用者直接按 Enter 提交，將其記錄到歷史
                    this.addEntry(namespace, inputEl.value);
                    this.hideDropdown();
                    if (typeof onTrigger === 'function') onTrigger(inputEl.value);
                }
            } else if (e.key === 'Escape') {
                this.hideDropdown();
            }
        });
    },

    updateSelectedVisual: function(items) {
        items.forEach((item, idx) => {
            if (idx === this.selectedIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    },

    // 5. 渲染與定位浮動快選彈窗
    showDropdown: function(inputEl, namespace, options = {}) {
        this.currentInput = inputEl;
        this.selectedIndex = -1;

        let dropdown = document.getElementById('lifeos-memory-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.id = 'lifeos-memory-dropdown';
            dropdown.className = 'lifeos-memory-dropdown';
            document.body.appendChild(dropdown);
        }
        this.activeDropdown = dropdown;

        // 檢查是否處於深色卡片或暗黑模式
        const isDark = Boolean(inputEl.closest('.glass-card') || document.body.classList.contains('dark-mode') || document.body.classList.contains('theme-dark'));
        dropdown.classList.toggle('dark-mode', isDark);

        const currentVal = (inputEl.value || '').trim().toLowerCase();
        let history = this.getHistory(namespace);
        const presets = options.presets || this.PRESETS[namespace] || [];

        // 若使用者正在輸入，即時模糊過濾
        if (currentVal) {
            history = history.filter(h => h.toLowerCase().includes(currentVal));
        }

        let html = '';

        // Header
        html += `
            <div class="lmd-header">
                <span><i class="fa-solid fa-clock-rotate-left"></i> ${currentVal ? '匹配搜尋記憶' : '輸入歷史記憶'} (${history.length})</span>
                ${history.length > 0 ? `<button type="button" class="lmd-clear-btn" onclick="window.LifeOSMemoryEngine.handleClearAll('${namespace}')">清空紀錄</button>` : ''}
            </div>
        `;

        // 歷史列表
        html += `<div class="lmd-list">`;
        if (history.length === 0) {
            html += `<div style="padding: 12px 14px; font-size: 12px; color: #94A3B8; text-align: center;">無相關歷史紀錄 (按 Enter 即可自動記憶)</div>`;
        } else {
            history.forEach(item => {
                const escaped = this.escapeHtml(item);
                const displayHtml = currentVal ? this.highlightMatch(item, currentVal) : escaped;
                html += `
                    <div class="lmd-item" onclick="window.LifeOSMemoryEngine.selectItem('${this.escapeHtml(item)}')">
                        <span class="lmd-item-text">
                            <i class="fa-solid fa-magnifying-glass" style="font-size: 11px; color: #94A3B8;"></i>
                            <span>${displayHtml}</span>
                        </span>
                        <button type="button" class="lmd-item-del" title="刪除此紀錄" onclick="event.stopPropagation(); window.LifeOSMemoryEngine.handleDeleteItem('${namespace}', '${this.escapeHtml(item)}')">✕</button>
                    </div>
                `;
            });
        }
        html += `</div>`;

        // 常用推薦捷徑 (Presets)
        if (presets.length > 0) {
            const matchedPresets = currentVal ? presets.filter(p => p.toLowerCase().includes(currentVal)) : presets;
            if (matchedPresets.length > 0) {
                html += `
                    <div class="lmd-presets-box">
                        <div class="lmd-presets-title"><i class="fa-solid fa-bolt" style="color: #D9A066;"></i> 常用快捷推薦</div>
                        <div class="lmd-presets-chips">
                            ${matchedPresets.slice(0, 8).map(p => `
                                <span class="lmd-preset-chip" onclick="window.LifeOSMemoryEngine.selectItem('${this.escapeHtml(p)}')">${p}</span>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }

        dropdown.innerHTML = html;
        this.repositionDropdown(inputEl);
        dropdown.style.display = 'block';
    },

    repositionDropdown: function(inputEl) {
        if (!this.activeDropdown) return;
        const rect = inputEl.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        this.activeDropdown.style.top = `${rect.bottom + scrollTop + 4}px`;
        this.activeDropdown.style.left = `${rect.left + scrollLeft}px`;
        this.activeDropdown.style.width = `${Math.max(rect.width, 280)}px`;
    },

    hideDropdown: function() {
        if (this.activeDropdown) {
            this.activeDropdown.style.display = 'none';
            this.activeDropdown = null;
            this.currentInput = null;
            this.selectedIndex = -1;
        }
    },

    selectItem: function(val) {
        if (this.currentInput) {
            this.currentInput.value = val;
            this.currentInput.dispatchEvent(new Event('input', { bubbles: true }));
            this.currentInput.dispatchEvent(new Event('change', { bubbles: true }));

            // 觸發自訂選取事件
            const customEvent = new CustomEvent('memory:selected', { detail: { value: val } });
            this.currentInput.dispatchEvent(customEvent);

            // 若為搜尋框，自動觸發對應的搜尋查詢函式
            if (this.currentInput.id === 'viral-search-query' && typeof window.triggerViralSpotSearch === 'function') {
                window.triggerViralSpotSearch();
            } else if (this.currentInput.id === 'spot-search-input' && typeof window.triggerSpotSearch === 'function') {
                window.triggerSpotSearch();
            }
        }
        this.hideDropdown();
    },

    handleDeleteItem: function(namespace, val) {
        this.removeEntry(namespace, val);
        if (this.currentInput) {
            this.showDropdown(this.currentInput, namespace);
        }
    },

    handleClearAll: function(namespace) {
        this.clearHistory(namespace);
        if (this.currentInput) {
            this.showDropdown(this.currentInput, namespace);
        }
    },

    // 6. 即時快速標籤列 (Inline Quick Chips Bar)
    renderInlineChips: function(containerId, inputId, namespace, presets = []) {
        const container = document.getElementById(containerId);
        const inputEl = document.getElementById(inputId);
        if (!container || !inputEl) return;

        const history = this.getHistory(namespace).slice(0, 5);
        const quickPresets = (presets.length > 0 ? presets : (this.PRESETS[namespace] || [])).slice(0, 4);

        if (history.length === 0 && quickPresets.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        let html = `<span class="sh-label"><i class="fa-solid fa-clock-rotate-left"></i> 快選:</span>`;

        // 歷史項目
        history.forEach(item => {
            html += `
                <span class="sh-chip-pill" onclick="window.LifeOSMemoryEngine.quickFillInput('${inputId}', '${this.escapeHtml(item)}')">
                    <span>${this.escapeHtml(item)}</span>
                    <span class="sh-chip-remove" title="刪除此紀錄" onclick="event.stopPropagation(); window.LifeOSMemoryEngine.removeEntry('${namespace}', '${this.escapeHtml(item)}'); window.LifeOSMemoryEngine.renderInlineChips('${containerId}', '${inputId}', '${namespace}');">✕</span>
                </span>
            `;
        });

        // 推薦捷徑
        if (quickPresets.length > 0) {
            quickPresets.forEach(preset => {
                if (!history.includes(preset)) {
                    html += `
                        <span class="sh-chip-pill" style="border-style: dashed;" onclick="window.LifeOSMemoryEngine.quickFillInput('${inputId}', '${this.escapeHtml(preset)}')">
                            <i class="fa-solid fa-bolt" style="color: #D9A066; font-size: 10px;"></i>
                            <span>${this.escapeHtml(preset)}</span>
                        </span>
                    `;
                }
            });
        }

        container.innerHTML = html;
    },

    refreshActiveChips: function(namespace) {
        if (namespace === 'viral_search') {
            this.renderInlineChips('viral-search-history-chips', 'viral-search-query', 'viral_search');
        }
    },

    quickFillInput: function(inputId, val) {
        const inputEl = document.getElementById(inputId);
        if (!inputEl) return;
        inputEl.value = val;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));

        if (inputId === 'viral-search-query' && typeof window.triggerViralSpotSearch === 'function') {
            window.triggerViralSpotSearch();
        } else if (inputId === 'spot-search-input' && typeof window.triggerSpotSearch === 'function') {
            window.triggerSpotSearch();
        }
    },

    // 7. 自動掃描並掛載已知的關鍵輸入框
    autoAttachKnownInputs: function() {
        // [1] 景點美食智庫搜尋
        const viralSearch = document.getElementById('viral-search-query');
        if (viralSearch) {
            this.attach(viralSearch, 'viral_search');
            this.renderInlineChips('viral-search-history-chips', 'viral-search-query', 'viral_search');
        }

        const spotSearch = document.getElementById('spot-search-input');
        if (spotSearch) {
            this.attach(spotSearch, 'viral_search');
        }

        // [2] 行事曆中心表單 (Standalone Calendar)
        const feTitle = document.getElementById('fe-title');
        if (feTitle) this.attach(feTitle, 'cal_event_title');

        const feSite = document.getElementById('fe-site-name');
        if (feSite) this.attach(feSite, 'cal_site_name');

        const feLocation = document.getElementById('fe-location');
        if (feLocation) this.attach(feLocation, 'cal_location');

        // [3] 主儀表板會議表單 (Dashboard Meeting Modal)
        const mTitle = document.getElementById('m-title');
        if (mTitle) this.attach(mTitle, 'meeting_title');

        const mSite = document.getElementById('m-site-name');
        if (mSite) this.attach(mSite, 'meeting_site');

        const mLocation = document.getElementById('m-location');
        if (mLocation) this.attach(mLocation, 'meeting_location');

        const mAttendees = document.getElementById('m-attendees');
        if (mAttendees) this.attach(mAttendees, 'meeting_attendees');
    },

    // 輔助工具
    escapeHtml: function(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    highlightMatch: function(text, query) {
        if (!query) return this.escapeHtml(text);
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return this.escapeHtml(text);
        const before = this.escapeHtml(text.substring(0, idx));
        const matched = this.escapeHtml(text.substring(idx, idx + query.length));
        const after = this.escapeHtml(text.substring(idx + query.length));
        return `${before}<b style="color: #D9A066; text-decoration: underline;">${matched}</b>${after}`;
    }
};

// DOM 載入後自動啟動
document.addEventListener('DOMContentLoaded', () => {
    window.LifeOSMemoryEngine.init();
});
