/**
 * =========================================================================
 * LifeOS Calendar Plugin: Conflict Detector & Google Calendar Sync (Phase 3.2)
 * Architecture: Non-Intrusive Plugin / Zero Regression
 * - 實作非阻斷式撞期偵測演算法 (Non-blocking Conflict Detection)
 * - 當本地或同步行程時間重疊時，在介面與 Modal 上顯示「🚨 撞期預警提示區」
 * - 絕不阻斷原本的儲存與排程流程，保障最大業務彈性
 * =========================================================================
 */

(function(window) {
    'use strict';

    const ConflictDetectorPlugin = {
        name: 'ConflictDetectorPlugin',
        version: '1.0.0',

        init() {
            console.log('[LifeOS Calendar Plugin] Initializing Conflict Detector Plugin...');
            this.injectStyles();
            this.hookEventModal();
            this.hookViewRendering();
        },

        injectStyles() {
            if (document.getElementById('cal-conflict-styles')) return;
            const style = document.createElement('style');
            style.id = 'cal-conflict-styles';
            style.textContent = `
                /* 撞期警示橫幅 (Non-blocking Conflict Alert) */
                .cal-conflict-alert-box {
                    background: #FEF2F2;
                    border: 1px solid #FCA5A5;
                    border-left: 5px solid #DC2626;
                    border-radius: 8px;
                    padding: 10px 14px;
                    margin-bottom: 14px;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    animation: fadeIn 0.25s ease;
                }
                .cal-conflict-badge {
                    font-size: 10px;
                    background: #DC2626;
                    color: #FFFFFF;
                    padding: 1px 5px;
                    border-radius: 4px;
                    font-weight: 800;
                    margin-left: 4px;
                }
            `;
            document.head.appendChild(style);
        },

        // 時間重疊檢測演算法：[Start_A, End_A] ∩ [Start_B, End_B]
        findConflicts(targetEvent, allEvents) {
            if (!targetEvent || !targetEvent.meeting_date) return [];

            const tDate = targetEvent.meeting_date;
            const tStartMin = this.timeToMinutes(targetEvent.meeting_time || '09:00');
            const tEndMin = this.timeToMinutes(targetEvent.end_time || '10:00');
            const targetId = String(targetEvent.raw_id || targetEvent.id).replace('evt_', '');

            return allEvents.filter(other => {
                const otherId = String(other.raw_id || other.id).replace('evt_', '');
                if (otherId === targetId) return false;

                const oDate = other.meeting_date || (other.start ? other.start.slice(0, 10) : '');
                if (oDate !== tDate) return false;

                const oStartMin = this.timeToMinutes(other.meeting_time || '09:00');
                const oEndMin = this.timeToMinutes(other.end_time || '10:00');

                // 判斷時間區間是否有重疊 (Overlapping)
                return (tStartMin < oEndMin && tEndMin > oStartMin);
            });
        },

        timeToMinutes(timeStr) {
            if (!timeStr) return 0;
            const parts = timeStr.split(':').map(Number);
            return (parts[0] || 0) * 60 + (parts[1] || 0);
        },

        // 攔截 Modal 開啟，自動比對撞期並顯示非阻斷式警示
        hookEventModal() {
            const calEngine = window.CalEngine;
            if (!calEngine) return;

            const origOpenActionModal = calEngine.openActionModal;
            calEngine.openActionModal = (eventId) => {
                origOpenActionModal.call(calEngine, eventId);

                const cleanId = String(eventId).replace('evt_', '');
                const ev = calEngine.events.find(e => String(e.raw_id || e.id).replace('evt_', '') === cleanId);
                if (!ev) return;

                this.renderConflictAlertInModal(ev, calEngine.events);
            };
        },

        renderConflictAlertInModal(ev, allEvents) {
            let alertBox = document.getElementById('modal-conflict-alert-box');
            const modalContent = document.querySelector('#modal-event-action .modal-content');
            if (!modalContent) return;

            const conflicts = this.findConflicts(ev, allEvents);

            if (conflicts.length > 0) {
                if (!alertBox) {
                    alertBox = document.createElement('div');
                    alertBox.id = 'modal-conflict-alert-box';
                    alertBox.className = 'cal-conflict-alert-box';
                    const timeEl = document.getElementById('action-modal-time');
                    if (timeEl && timeEl.nextSibling) {
                        timeEl.parentNode.insertBefore(alertBox, timeEl.nextSibling);
                    } else {
                        modalContent.appendChild(alertBox);
                    }
                }
                alertBox.style.display = 'flex';
                alertBox.innerHTML = `
                    <i class="fa-solid fa-triangle-exclamation" style="color: #DC2626; font-size: 16px; margin-top: 2px;"></i>
                    <div style="flex: 1;">
                        <div style="font-size: 13px; font-weight: 700; color: #991B1B;">
                            🚨 行程時間撞期預警 (Conflict Alert)
                        </div>
                        <div style="font-size: 11px; color: #7F1D1D; margin-top: 2px; line-height: 1.4;">
                            此時段與下列 <b>${conflicts.length}</b> 個行程時間重疊，請留意衝突：
                            <ul style="margin: 4px 0 0 16px; padding: 0;">
                                ${conflicts.map(c => `
                                    <li><b>${c.meeting_time || ''}~${c.end_time || ''}</b> ${c.title} (${c.location || '現場'})</li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                `;
            } else {
                if (alertBox) alertBox.style.display = 'none';
            }
        },

        // 在視圖渲染後自動為撞期卡片加上紅色小標記
        hookViewRendering() {
            const calEngine = window.CalEngine;
            if (!calEngine) return;

            const origRenderMonthView = calEngine.renderMonthView;
            calEngine.renderMonthView = (events) => {
                origRenderMonthView.call(calEngine, events);

                // 為每個有衝突的行程注入小警示標籤
                events.forEach(ev => {
                    const conflicts = this.findConflicts(ev, events);
                    if (conflicts.length > 0) {
                        const cleanId = String(ev.raw_id || ev.id).replace('evt_', '');
                        const pillEls = document.querySelectorAll(`[onclick*="'${cleanId}'"]`);
                        pillEls.forEach(pill => {
                            if (!pill.querySelector('.cal-conflict-badge')) {
                                const badge = document.createElement('span');
                                badge.className = 'cal-conflict-badge';
                                badge.title = `與 ${conflicts.length} 個行程重疊`;
                                badge.innerText = '⚠️ 撞期';
                                pill.appendChild(badge);
                            }
                        });
                    }
                });
            };
        }
    };

    window.ConflictDetectorPlugin = ConflictDetectorPlugin;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ConflictDetectorPlugin.init());
    } else {
        ConflictDetectorPlugin.init();
    }
})(window);
