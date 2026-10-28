/**
 * =========================================================================
 * LifeOS Calendar Plugin: DnD & Resize Extension (Phase 1.1)
 * Architecture: Non-Intrusive Plugin / Zero Regression
 * - 拖曳更改日期 (Drag & Drop)
 * - 邊緣拉伸調整時間跨度 (Resize Handle)
 * - 嚴格區分 click（開啟 Modal）與 drag/resize（修改日期/時長），零衝突
 * - Optimistic UI Update + Snapshot Rollback + Toast Notification
 * =========================================================================
 */

(function(window) {
    'use strict';

    const CalendarDnDPlugin = {
        name: 'CalendarDnDPlugin',
        version: '1.0.0',
        isDragging: false,
        isResizing: false,
        currentDragEvent: null,
        resizeStartY: 0,
        initialEndMinutes: 0,

        // 初始化外掛
        init() {
            console.log('[LifeOS Calendar Plugin] Initializing DnD & Resize Plugin...');
            this.injectStyles();
            this.bindGlobalEvents();
        },

        // 動態注入拖曳與拉伸的專屬樣式（無侵入，不破壞原有 CSS）
        injectStyles() {
            if (document.getElementById('cal-dnd-plugin-styles')) return;
            const style = document.createElement('style');
            style.id = 'cal-dnd-plugin-styles';
            style.textContent = `
                /* 拖曳狀態樣式 */
                .cal-event-pill.is-dragging {
                    opacity: 0.45 !important;
                    transform: scale(0.96) !important;
                    cursor: grabbing !important;
                }
                .cal-day-cell.cal-drop-hover {
                    background: rgba(217, 160, 102, 0.15) !important;
                    border: 2px dashed #D9A066 !important;
                    transition: all 0.15s ease;
                }

                /* 邊緣拉伸調整手柄 (Resize Handle) */
                .cal-event-pill {
                    position: relative;
                    user-select: none;
                }
                .cal-resize-handle-bottom {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 5px;
                    cursor: ns-resize;
                    background: rgba(255, 255, 255, 0.25);
                    border-radius: 0 0 4px 4px;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                .cal-event-pill:hover .cal-resize-handle-bottom {
                    opacity: 1;
                }
                .cal-resize-handle-bottom:hover {
                    background: #FFD700;
                    height: 6px;
                }
            `;
            document.head.appendChild(style);
        },

        // 綁定全域事件
        bindGlobalEvents() {
            // 監聽拖曳進出網格高亮
            document.addEventListener('dragover', (e) => {
                const cell = e.target.closest('.cal-day-cell');
                if (cell) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    cell.classList.add('cal-drop-hover');
                }
            });

            document.addEventListener('dragleave', (e) => {
                const cell = e.target.closest('.cal-day-cell');
                if (cell && !cell.contains(e.relatedTarget)) {
                    cell.classList.remove('cal-drop-hover');
                }
            });

            // 監聽放下 (Drop)
            document.addEventListener('drop', (e) => {
                const cell = e.target.closest('.cal-day-cell');
                if (!cell) return;
                cell.classList.remove('cal-drop-hover');

                const eventDataStr = e.dataTransfer.getData('application/json');
                if (!eventDataStr) return;

                try {
                    const eventData = JSON.parse(eventDataStr);
                    const targetDate = cell.getAttribute('data-date');
                    if (targetDate && eventData.id) {
                        e.preventDefault();
                        this.handleEventDrop(eventData, targetDate);
                    }
                } catch (err) {
                    console.error('[DnD Plugin] Parse drop payload error:', err);
                }
            });

            // 監聽滑鼠全域放開以終止 Resize
            document.addEventListener('mouseup', () => {
                if (this.isResizing) {
                    this.isResizing = false;
                    document.body.style.cursor = '';
                }
            });
        },

        // 高階掛載方法：為每個已渲染的 Event DOM 增強 DnD 與 Resize
        enhanceEventElement(element, eventData) {
            if (!element || !eventData) return;

            // 1. 設定可拖曳屬性
            element.setAttribute('draggable', 'true');

            // 2. 拖曳開始
            element.addEventListener('dragstart', (e) => {
                // 若正在點擊 resize handle 則不啟動拖曳
                if (this.isResizing) {
                    e.preventDefault();
                    return;
                }
                this.isDragging = true;
                this.currentDragEvent = eventData;
                element.classList.add('is-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('application/json', JSON.stringify(eventData));
            });

            // 3. 拖曳結束
            element.addEventListener('dragend', () => {
                this.isDragging = false;
                this.currentDragEvent = null;
                element.classList.remove('is-dragging');
                document.querySelectorAll('.cal-day-cell.cal-drop-hover').forEach(c => c.classList.remove('cal-drop-hover'));
            });

            // 4. 掛載底部拉伸把手 (Resize Handle)
            if (!element.querySelector('.cal-resize-handle-bottom')) {
                const handle = document.createElement('div');
                handle.className = 'cal-resize-handle-bottom';
                handle.title = '拉伸以延長或縮短行程時間';

                handle.addEventListener('mousedown', (e) => {
                    e.stopPropagation(); // 阻止點擊觸發 Modal
                    e.preventDefault();
                    this.startResize(e, eventData, element);
                });

                element.appendChild(handle);
            }
        },

        // 處理拖曳更改日期 (Optimistic UI + Auto Rollback)
        async handleEventDrop(eventData, targetDate) {
            const cleanId = String(eventData.raw_id || eventData.id).replace('evt_', '');
            const prevStartDate = eventData.meeting_date || (eventData.start ? eventData.start.slice(0, 10) : targetDate);
            const prevEndDate = eventData.end_date || prevStartDate;

            if (prevStartDate === targetDate) return; // 日期相同不發送請求

            // [1] Optimistic UI: 快照儲存並即時更新前端狀態
            const calEngine = window.CalEngine;
            const targetInStore = calEngine ? calEngine.events.find(ev => String(ev.raw_id || ev.id).replace('evt_', '') === cleanId) : null;
            
            if (targetInStore) {
                targetInStore.meeting_date = targetDate;
                targetInStore.end_date = targetDate;
                if (targetInStore.start) {
                    targetInStore.start = `${targetDate}T${targetInStore.meeting_time || '09:00'}:00`;
                }
                if (calEngine.renderCurrentView) calEngine.renderCurrentView();
                if (calEngine.renderSidebarDayAgenda) calEngine.renderSidebarDayAgenda();
            }

            if (window.ToastNotification) {
                window.ToastNotification.show(`已將「${eventData.title}」移至 ${targetDate}`, 'info');
            }

            try {
                // [2] 非同步背景發送 API (向下相容既有 PUT 端點)
                const res = await fetch(`/api/calendar/events/${cleanId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        meeting_date: targetDate,
                        end_date: targetDate
                    })
                });
                const resData = await res.json();
                if (!res.ok || resData.status === 'error') {
                    throw new Error(resData.message || '伺服器拒絕更新');
                }
                // 同步更新里程碑倒數
                if (calEngine && calEngine.loadMilestones) calEngine.loadMilestones();
            } catch (err) {
                // [3] 失敗自動回滾 (Rollback)
                console.error('[CalendarDnDPlugin Rollback]', err);
                if (targetInStore) {
                    targetInStore.meeting_date = prevStartDate;
                    targetInStore.end_date = prevEndDate;
                    if (targetInStore.start) {
                        targetInStore.start = `${prevStartDate}T${targetInStore.meeting_time || '09:00'}:00`;
                    }
                    if (calEngine.renderCurrentView) calEngine.renderCurrentView();
                    if (calEngine.renderSidebarDayAgenda) calEngine.renderSidebarDayAgenda();
                }
                if (window.ToastNotification) {
                    window.ToastNotification.show(`拖曳改期失敗：${err.message}，已自動還原`, 'error');
                }
            }
        },

        // 開始拉伸調整時間長度
        startResize(e, eventData, element) {
            this.isResizing = true;
            this.resizeStartY = e.clientY;
            document.body.style.cursor = 'ns-resize';

            const cleanId = String(eventData.raw_id || eventData.id).replace('evt_', '');
            const currentEndTime = eventData.end_time || eventData.meeting_time || '10:00';
            const [h, m] = currentEndTime.split(':').map(Number);
            this.initialEndMinutes = (h || 10) * 60 + (m || 0);

            const onMouseMove = (moveEvent) => {
                if (!this.isResizing) return;
                const deltaY = moveEvent.clientY - this.resizeStartY;
                // 每移動 20px 調整 30 分鐘
                const stepCount = Math.round(deltaY / 20);
                const newTotalMinutes = Math.max(60, Math.min(23 * 60 + 59, this.initialEndMinutes + stepCount * 30));
                
                const newHour = String(Math.floor(newTotalMinutes / 60)).padStart(2, '0');
                const newMin = String(newTotalMinutes % 60).padStart(2, '0');
                const previewEndTime = `${newHour}:${newMin}`;

                // 即時視覺提示
                let badge = element.querySelector('.cal-resize-preview-badge');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'cal-resize-preview-badge';
                    badge.style.cssText = 'font-size: 10px; background: #FFD700; color: #000; padding: 1px 4px; border-radius: 3px; margin-left: 4px; font-weight: 800;';
                    element.appendChild(badge);
                }
                badge.innerText = `➔ ${previewEndTime}`;
            };

            const onMouseUp = async (upEvent) => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                this.isResizing = false;
                document.body.style.cursor = '';

                const badge = element.querySelector('.cal-resize-preview-badge');
                if (badge) badge.remove();

                const deltaY = upEvent.clientY - this.resizeStartY;
                const stepCount = Math.round(deltaY / 20);
                if (stepCount === 0) return; // 無時間變更

                const newTotalMinutes = Math.max(60, Math.min(23 * 60 + 59, this.initialEndMinutes + stepCount * 30));
                const newHour = String(Math.floor(newTotalMinutes / 60)).padStart(2, '0');
                const newMin = String(newTotalMinutes % 60).padStart(2, '0');
                const finalEndTime = `${newHour}:${newMin}`;

                // Optimistic UI 更新
                const calEngine = window.CalEngine;
                const targetInStore = calEngine ? calEngine.events.find(ev => String(ev.raw_id || ev.id).replace('evt_', '') === cleanId) : null;
                const prevEndTime = eventData.end_time || '10:00';

                if (targetInStore) {
                    targetInStore.end_time = finalEndTime;
                    if (calEngine.renderCurrentView) calEngine.renderCurrentView();
                }

                if (window.ToastNotification) {
                    window.ToastNotification.show(`已調整「${eventData.title}」結束時間至 ${finalEndTime}`, 'info');
                }

                try {
                    const res = await fetch(`/api/calendar/events/${cleanId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ end_time: finalEndTime })
                    });
                    const resData = await res.json();
                    if (!res.ok || resData.status === 'error') {
                        throw new Error(resData.message || '更新失敗');
                    }
                } catch (err) {
                    console.error('[Resize Rollback]', err);
                    if (targetInStore) {
                        targetInStore.end_time = prevEndTime;
                        if (calEngine.renderCurrentView) calEngine.renderCurrentView();
                    }
                    if (window.ToastNotification) {
                        window.ToastNotification.show(`調整時間失敗：${err.message}，已自動還原`, 'error');
                    }
                }
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    };

    // 掛載至全域
    window.CalendarDnDPlugin = CalendarDnDPlugin;

    // DOM 準備就緒時自動初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CalendarDnDPlugin.init());
    } else {
        CalendarDnDPlugin.init();
    }
})(window);
