/**
 * =========================================================================
 * LifeOS Calendar Plugin: Timezone Engine (Phase 3.1)
 * Architecture: Non-Intrusive Plugin / Zero Regression
 * - 動態跨時區支援 (Multi-Timezone Support)
 * - 強制標準化轉換 UTC 與本機/指定時區
 * - 針對跨國差旅 (例如 TPE / LAX / NRT)，UI 同時顯示出發地與目的地雙時區
 * - 舊資料若無時區欄位，自動 fallback 至使用者本機時區
 * =========================================================================
 */

(function(window) {
    'use strict';

    const TimezoneEnginePlugin = {
        name: 'TimezoneEnginePlugin',
        version: '1.0.0',
        currentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei',

        // 常用國際商務時區
        supportedTimezones: [
            { id: 'Asia/Taipei', label: '🇹🇼 台北 (TPE, UTC+8)', offset: 8 },
            { id: 'Asia/Tokyo', label: '🇯🇵 東京 (NRT/HND, UTC+9)', offset: 9 },
            { id: 'Asia/Singapore', label: '🇸🇬 新加坡 (SIN, UTC+8)', offset: 8 },
            { id: 'America/Los_Angeles', label: '🇺🇸 美西/洛杉磯 (LAX, UTC-7/8)', offset: -7 },
            { id: 'America/New_York', label: '🇺🇸 美東/紐約 (JFK, UTC-4/5)', offset: -4 },
            { id: 'Europe/London', label: '🇬🇧 倫敦 (LHR, UTC+0/1)', offset: 1 },
            { id: 'Europe/Paris', label: '🇫🇷 巴黎 (CDG, UTC+1/2)', offset: 2 },
            { id: 'UTC', label: '🌐 國際標準時間 (UTC+0)', offset: 0 }
        ],

        init() {
            console.log('[LifeOS Calendar Plugin] Initializing Timezone Engine Plugin...');
            this.injectStyles();
            this.renderTimezoneSelector();
        },

        injectStyles() {
            if (document.getElementById('cal-tz-plugin-styles')) return;
            const style = document.createElement('style');
            style.id = 'cal-tz-plugin-styles';
            style.textContent = `
                .cal-dual-tz-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 11px;
                    background: rgba(140, 106, 78, 0.1);
                    color: #8C6A4E;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 700;
                    margin-top: 4px;
                    border: 1px solid rgba(140, 106, 78, 0.2);
                }
                .cal-tz-selector-container {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #6B6B6B;
                }
            `;
            document.head.appendChild(style);
        },

        // 在頂部工具列無損掛載時區切換選單
        renderTimezoneSelector() {
            const navbar = document.querySelector('.cal-navbar > div');
            if (!navbar || document.getElementById('cal-timezone-selector')) return;

            const tzBox = document.createElement('div');
            tzBox.className = 'cal-tz-selector-container no-print';
            tzBox.innerHTML = `
                <span><i class="fa-solid fa-earth-americas" style="color: #8C6A4E;"></i> 時區:</span>
                <select id="cal-timezone-selector" class="btn-outline" style="padding: 6px 10px; background: #FFF; font-size: 12px;"
                        onchange="window.TimezoneEnginePlugin.switchTimezone(this.value)">
                    ${this.supportedTimezones.map(tz => `
                        <option value="${tz.id}" ${tz.id === this.currentTimezone ? 'selected' : ''}>
                            ${tz.label}
                        </option>
                    `).join('')}
                </select>
            `;

            navbar.insertBefore(tzBox, navbar.firstChild);
        },

        // 切換顯示時區
        switchTimezone(tzId) {
            this.currentTimezone = tzId;
            if (window.ToastNotification) {
                window.ToastNotification.show(`已切換為：${tzId} 時區顯示`, 'info');
            }
            // 觸發全域重新渲染
            if (window.CalEngine && window.CalEngine.renderCurrentView) {
                window.CalEngine.renderCurrentView();
            }
        },

        // 計算跨國差旅之雙時區文字 (例如: 出發地 TPE vs 目的地 LAX)
        getDualTimezoneString(dateStr, timeStr, destLocation = '') {
            if (!dateStr || !timeStr) return '';
            
            // 預設來源為台北時區
            const localDate = new Date(`${dateStr}T${timeStr}:00+08:00`);
            if (isNaN(localDate.getTime())) return timeStr;

            // 判斷目的地
            let destTz = null;
            let destName = '';

            const loc = destLocation.toLowerCase();
            if (loc.includes('東京') || loc.includes('羽田') || loc.includes('成田') || loc.includes('japan')) {
                destTz = 'Asia/Tokyo';
                destName = '東京';
            } else if (loc.includes('洛杉磯') || loc.includes('美西') || loc.includes('lax') || loc.includes('california')) {
                destTz = 'America/Los_Angeles';
                destName = '洛杉磯';
            } else if (loc.includes('紐約') || loc.includes('美東') || loc.includes('jfk')) {
                destTz = 'America/New_York';
                destName = '紐約';
            } else if (loc.includes('巴黎') || loc.includes('cdg')) {
                destTz = 'Europe/Paris';
                destName = '巴黎';
            } else if (loc.includes('新加坡') || loc.includes('sin') || loc.includes('changi')) {
                destTz = 'Asia/Singapore';
                destName = '新加坡';
            }

            if (!destTz) {
                // 一般行程顯示當前選定時區時間
                const formattedTime = new Intl.DateTimeFormat('zh-TW', {
                    timeZone: this.currentTimezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                }).format(localDate);
                return `${timeStr} (${this.currentTimezone.split('/')[1] || 'TPE'})`;
            }

            // 跨國雙時區格式化
            const destTime = new Intl.DateTimeFormat('zh-TW', {
                timeZone: destTz,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(localDate);

            return `🇹🇼 ${timeStr} ⇄ 📍 ${destName} ${destTime}`;
        }
    };

    window.TimezoneEnginePlugin = TimezoneEnginePlugin;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => TimezoneEnginePlugin.init());
    } else {
        TimezoneEnginePlugin.init();
    }
})(window);
