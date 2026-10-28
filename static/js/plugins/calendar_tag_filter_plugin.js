/**
 * =========================================================================
 * LifeOS Calendar Plugin: Tag Filter Bar (Phase 2.1)
 * Architecture: Non-Intrusive Plugin / Zero Regression
 * - 在行事曆上方動態插入即時標籤篩選控制列 (Filter Bar)
 * - 純前端記憶體即時過濾，零後端伺服器請求壓力
 * - 向下相容 (Backward Compatible)：舊資料若無 tags 欄位，自動 fallback 歸類至 general
 * =========================================================================
 */

(function(window) {
    'use strict';

    const CalendarTagFilterPlugin = {
        name: 'CalendarTagFilterPlugin',
        version: '1.0.0',
        activeFilter: 'all', // all, work, travel, golf, finance, general
        searchKeyword: '',

        init() {
            console.log('[LifeOS Calendar Plugin] Initializing Tag Filter Bar Plugin...');
            this.injectStyles();
            this.renderFilterBar();
        },

        injectStyles() {
            if (document.getElementById('cal-tag-filter-styles')) return;
            const style = document.createElement('style');
            style.id = 'cal-tag-filter-styles';
            style.textContent = `
                .cal-filter-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                    background: #FFFFFF;
                    border: 1px solid rgba(167, 182, 162, 0.35);
                    border-radius: 12px;
                    padding: 10px 16px;
                    margin-bottom: 14px;
                    box-shadow: 0 2px 8px rgba(140, 106, 78, 0.04);
                }
                .cal-tag-pills {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    flex-wrap: wrap;
                }
                .cal-filter-pill {
                    padding: 5px 12px;
                    font-size: 12px;
                    font-weight: 700;
                    border-radius: 20px;
                    border: 1px solid rgba(140, 106, 78, 0.25);
                    background: #FAFAFA;
                    color: #6B6B6B;
                    cursor: pointer;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                }
                .cal-filter-pill:hover {
                    background: #FFFFFF;
                    border-color: #8C6A4E;
                    transform: translateY(-1px);
                }
                .cal-filter-pill.active {
                    background: #8C6A4E;
                    color: #FFFFFF;
                    border-color: #8C6A4E;
                    box-shadow: 0 2px 6px rgba(140, 106, 78, 0.25);
                }
                .cal-filter-search-box {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #FAFAFA;
                    border: 1px solid rgba(167, 182, 162, 0.3);
                    border-radius: 8px;
                    padding: 6px 12px;
                }
                .cal-filter-search-input {
                    border: none;
                    background: transparent;
                    font-size: 12px;
                    color: #3E3E3E;
                    outline: none;
                    width: 140px;
                }
                .cal-filter-search-input::placeholder {
                    color: #94A3B8;
                }
            `;
            document.head.appendChild(style);
        },

        // 在主畫布視角切換器下方無損置入 Filter Bar
        renderFilterBar() {
            const mainSection = document.querySelector('.cal-main');
            if (!mainSection) return;

            if (document.getElementById('cal-tag-filter-bar')) return;

            const toolbar = document.createElement('div');
            toolbar.id = 'cal-tag-filter-bar';
            toolbar.className = 'cal-filter-toolbar';

            toolbar.innerHTML = `
                <div class="cal-tag-pills">
                    <span style="font-size: 11px; font-weight: 800; color: #8C6A4E; margin-right: 4px; text-transform: uppercase;">
                        <i class="fa-solid fa-tags"></i> 標籤篩選:
                    </span>
                    <button class="cal-filter-pill active" data-category="all" onclick="window.CalendarTagFilterPlugin.setCategory('all')">
                        全部行程 (All)
                    </button>
                    <button class="cal-filter-pill" data-category="work" onclick="window.CalendarTagFilterPlugin.setCategory('work')">
                        💼 工務與專案
                    </button>
                    <button class="cal-filter-pill" data-category="travel" onclick="window.CalendarTagFilterPlugin.setCategory('travel')">
                        ✈️ 差旅與航班
                    </button>
                    <button class="cal-filter-pill" data-category="golf" onclick="window.CalendarTagFilterPlugin.setCategory('golf')">
                        🏌️ 高爾夫與球敘
                    </button>
                    <button class="cal-filter-pill" data-category="finance" onclick="window.CalendarTagFilterPlugin.setCategory('finance')">
                        💰 財務與風控
                    </button>
                    <button class="cal-filter-pill" data-category="general" onclick="window.CalendarTagFilterPlugin.setCategory('general')">
                        ☕ 一般備忘
                    </button>
                </div>

                <div class="cal-filter-search-box">
                    <i class="fa-solid fa-magnifying-glass" style="font-size: 11px; color: #8C6A4E;"></i>
                    <input type="text" class="cal-filter-search-input" placeholder="即時關鍵字搜尋..." 
                           oninput="window.CalendarTagFilterPlugin.setSearchKeyword(this.value)">
                </div>
            `;

            // 插在 cal-view-canvas 上方
            const canvas = document.getElementById('cal-view-canvas');
            if (canvas) {
                mainSection.insertBefore(toolbar, canvas);
            } else {
                mainSection.appendChild(toolbar);
            }
        },

        // 設定分類標籤
        setCategory(category) {
            this.activeFilter = category;

            // 更新 UI 膠囊 Active 狀態
            document.querySelectorAll('.cal-filter-pill').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-category') === category);
            });

            this.applyFilter();
        },

        // 設定即時搜尋關鍵字
        setSearchKeyword(keyword) {
            this.searchKeyword = (keyword || '').trim().toLowerCase();
            this.applyFilter();
        },

        // 純前端記憶體高效過濾 (零後端請求，向下相容)
        applyFilter() {
            const calEngine = window.CalEngine;
            if (!calEngine) return;

            if (this.activeFilter === 'all') {
                calEngine.activeCategories = ['work', 'travel', 'golf', 'finance', 'general'];
            } else {
                calEngine.activeCategories = [this.activeFilter];
            }

            // 若有關鍵字，依標題、地點、工種、備註篩選
            if (this.searchKeyword) {
                const kw = this.searchKeyword;
                const originalEvents = calEngine.events;
                const filtered = originalEvents.filter(ev => {
                    const title = (ev.title || '').toLowerCase();
                    const loc = (ev.location || '').toLowerCase();
                    const notes = (ev.notes || ev.description || '').toLowerCase();
                    const site = (ev.site_name || '').toLowerCase();
                    return title.includes(kw) || loc.includes(kw) || notes.includes(kw) || site.includes(kw);
                });
                // 暫存渲染
                const tempAll = [...filtered, ...calEngine.externalEvents];
                if (calEngine.currentView === 'month') calEngine.renderMonthView(tempAll);
                else if (calEngine.currentView === 'week') calEngine.renderWeekView(tempAll);
                else if (calEngine.currentView === 'day') calEngine.renderDayView(tempAll);
                else if (calEngine.currentView === 'agenda' && window.CalendarViewPlugin) window.CalendarViewPlugin.renderAgenda(tempAll, document.getElementById('cal-grid-body'));
                else if (calEngine.currentView === 'timeline' && window.CalendarViewPlugin) window.CalendarViewPlugin.renderTimeline(tempAll, document.getElementById('cal-grid-body'));
                return;
            }

            calEngine.renderCurrentView();
        }
    };

    window.CalendarTagFilterPlugin = CalendarTagFilterPlugin;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CalendarTagFilterPlugin.init());
    } else {
        CalendarTagFilterPlugin.init();
    }
})(window);
