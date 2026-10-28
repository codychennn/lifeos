/**
 * =========================================================================
 * LifeOS Calendar Plugin: Multiple Views Manager (Phase 1.2)
 * Architecture: Non-Intrusive Plugin / Zero Regression
 * - 清單視圖 (Agenda List View)
 * - 時間軸 / 甘特視圖 (Timeline / Gantt View)
 * - 純 CSS Class 與獨立容器動態替換，保留既有月/週視圖之 DOM 狀態與邏輯
 * =========================================================================
 */

(function(window) {
    'use strict';

    const CalendarViewPlugin = {
        name: 'CalendarViewPlugin',
        version: '1.0.0',
        activeView: 'month',

        init() {
            console.log('[LifeOS Calendar Plugin] Initializing Multiple Views Plugin...');
            this.injectStyles();
        },

        injectStyles() {
            if (document.getElementById('cal-view-plugin-styles')) return;
            const style = document.createElement('style');
            style.id = 'cal-view-plugin-styles';
            style.textContent = `
                /* 清單視圖 (Agenda View) 專屬佈局 */
                .cal-agenda-container {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-height: 680px;
                    overflow-y: auto;
                    padding-right: 6px;
                }
                .cal-agenda-item {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #FFFFFF;
                    border: 1px solid rgba(167, 182, 162, 0.35);
                    border-radius: 10px;
                    padding: 14px 18px;
                    box-shadow: 0 2px 8px rgba(140, 106, 78, 0.05);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                }
                .cal-agenda-item:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 18px rgba(140, 106, 78, 0.12);
                    border-color: #D9A066;
                }

                /* 時間軸 / 甘特視圖 (Timeline / Gantt View) 專屬佈局 */
                .cal-timeline-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-height: 680px;
                    overflow-y: auto;
                    padding-right: 6px;
                }
                .cal-timeline-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #FAFAFA;
                    border-left: 6px solid #2B4C7E;
                    border-radius: 8px;
                    padding: 12px 18px;
                    box-shadow: 0 2px 6px rgba(140, 106, 78, 0.05);
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .cal-timeline-item:hover {
                    background: #FFFFFF;
                    transform: translateX(4px);
                    box-shadow: 0 4px 14px rgba(140, 106, 78, 0.1);
                }
            `;
            document.head.appendChild(style);
        },

        // 渲染清單視圖 (Agenda View)
        renderAgenda(events, container) {
            if (!container) return;
            container.className = 'cal-agenda-container';
            container.style.display = 'flex';

            const sorted = [...events].sort((a, b) => 
                (a.meeting_date || a.start || '').localeCompare(b.meeting_date || b.start || '')
            );

            if (sorted.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; color: #6B6B6B; padding: 40px 0;">
                        <i class="fa-regular fa-calendar-xmark" style="font-size: 32px; opacity: 0.4; margin-bottom: 8px; display: block;"></i>
                        <span>當前分類篩選下暫無行程紀錄</span>
                    </div>
                `;
                return;
            }

            container.innerHTML = sorted.map(ev => {
                const status = ev.status || 'pending';
                const dateStr = ev.meeting_date || (ev.start ? ev.start.slice(0, 10) : '未指定');
                const timeStr = ev.meeting_time || '09:00';
                const isMilestone = Boolean(ev.is_milestone);

                return `
                    <div class="cal-agenda-item" onclick="window.CalEngine.openActionModal('${ev.raw_id || ev.id}')">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="min-width: 90px; text-align: center; background: rgba(140, 106, 78, 0.1); border-radius: 8px; padding: 6px 10px;">
                                <div style="font-size: 13px; font-weight: 800; color: #8C6A4E;">${dateStr}</div>
                                <div style="font-size: 11px; color: #6B6B6B; font-weight: 600;">⏰ ${timeStr}</div>
                            </div>
                            <div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                                    ${isMilestone ? '<span style="font-size: 10px; background: #D97706; color: #FFF; padding: 1px 6px; border-radius: 4px; font-weight: 700;">🚩 里程碑</span>' : ''}
                                    <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700; ${status === 'urgent' ? 'background: #EF4444; color: #FFF;' : (status === 'completed' ? 'background: #10B981; color: #FFF;' : 'background: #E5E7EB; color: #374151;')}">${status}</span>
                                    <span style="font-size: 11px; background: rgba(140, 106, 78, 0.12); color: #8C6A4E; padding: 2px 6px; border-radius: 4px;">${ev.category || 'work'}</span>
                                    <strong style="font-size: 14px; color: #3E3E3E; ${status === 'completed' ? 'text-decoration: line-through; opacity: 0.65;' : ''}">${ev.title}</strong>
                                </div>
                                <div style="font-size: 12px; color: #6B6B6B;">
                                    📍 地點：${ev.location || ev.site_name || '現場'} ‧ 出席：${ev.attendee_roles || '專案人員'}
                                </div>
                            </div>
                        </div>
                        <div>
                            <button class="btn-outline" style="padding: 5px 12px; font-size: 11px;">操作 / 詳情</button>
                        </div>
                    </div>
                `;
            }).join('');
        },

        // 渲染時間軸 / 甘特視圖 (Timeline View)
        renderTimeline(events, container) {
            if (!container) return;
            container.className = 'cal-timeline-container';
            container.style.display = 'flex';

            const sorted = [...events].sort((a, b) => 
                (a.meeting_date || a.start || '').localeCompare(b.meeting_date || b.start || '')
            );

            if (sorted.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; color: #6B6B6B; padding: 40px 0;">
                        <span>當前分類篩選下無時間軸排程</span>
                    </div>
                `;
                return;
            }

            container.innerHTML = sorted.map(ev => {
                const startD = ev.meeting_date || (ev.start ? ev.start.slice(0, 10) : '');
                const endD = ev.end_date || (ev.end ? ev.end.slice(0, 10) : startD);
                const isMilestone = Boolean(ev.is_milestone);
                const status = ev.status || 'pending';
                const borderColor = status === 'urgent' ? '#EF4444' : (status === 'completed' ? '#10B981' : (ev.color || '#2B4C7E'));

                return `
                    <div class="cal-timeline-item" style="border-left-color: ${borderColor};" onclick="window.CalEngine.openActionModal('${ev.raw_id || ev.id}')">
                        <div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                ${isMilestone ? '<span style="font-size: 11px; background: #D97706; color: #FFF; padding: 1px 6px; border-radius: 4px; font-weight: 700;">🚩 關鍵里程碑</span>' : ''}
                                <span style="font-size: 11px; background: rgba(140, 106, 78, 0.12); color: #8C6A4E; padding: 2px 6px; border-radius: 4px;">${ev.category || 'work'}</span>
                                <span style="font-size: 11px; padding: 1px 5px; border-radius: 4px; font-weight: 700; ${status === 'urgent' ? 'background: #EF4444; color: #FFF;' : (status === 'completed' ? 'background: #10B981; color: #FFF;' : 'background: #E5E7EB; color: #374151;')}">${status}</span>
                                <strong style="font-size: 14px; color: #3E3E3E; ${status === 'completed' ? 'text-decoration: line-through; opacity: 0.65;' : ''}">${ev.title}</strong>
                            </div>
                            <div style="font-size: 12px; color: #6B6B6B; margin-top: 4px;">
                                📅 期程跨度：<b>${startD} ${ev.meeting_time || '09:00'}</b> ➔ <b>${endD} ${ev.end_time || '10:00'}</b> ‧ 地點：${ev.site_name || ev.location || '現場'}
                            </div>
                        </div>
                        <div>
                            <span style="font-size: 11px; color: #8C6A4E; font-weight: 700;">${status === 'completed' ? '✅ 已結案' : (status === 'urgent' ? '🚨 緊急' : '⏳ 進行中')}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    };

    // 掛載至全域
    window.CalendarViewPlugin = CalendarViewPlugin;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CalendarViewPlugin.init());
    } else {
        CalendarViewPlugin.init();
    }
})(window);
