/**
 * LifeOS Enterprise Calendar Core Engine (v2.1 Architecture Upgrade)
 * - 支援：Optimistic UI Update (樂觀更新與 Rollback)
 * - 捨棄 alert() / confirm()，全數採用平滑過渡 Toast 與 Modal 原地二次確認防呆機制
 * - 支援 status: completed, urgent, pending, other Color-Coding 與即時切換
 * - 支援多態檢視 (Month/Week/Day/Agenda/Timeline)、四大標籤色彩、視角聯動、iCal同步與拖曳改期
 */

// ========================================================
// 1. 全域客製化 Toast 通知系統 (無原生 alert)
// ========================================================
window.ToastNotification = {
    container: null,
    init: function() {
        if (!document.getElementById('lifeos-toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'lifeos-toast-container';
            this.container.style.cssText = `
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('lifeos-toast-container');
        }
    },
    show: function(message, type = 'info', duration = 3200) {
        this.init();
        const toast = document.createElement('div');
        toast.className = `lifeos-toast lifeos-toast-${type}`;

        const colors = {
            info: { bg: '#8C6A4E', border: '#D9A066', text: '#FFFFFF', icon: 'fa-circle-info' },
            success: { bg: '#10B981', border: '#059669', text: '#FFFFFF', icon: 'fa-circle-check' },
            error: { bg: '#DC2626', border: '#B91C1C', text: '#FFFFFF', icon: 'fa-triangle-exclamation' },
            warning: { bg: '#D97706', border: '#B45309', text: '#FFFFFF', icon: 'fa-bell' }
        };
        const c = colors[type] || colors.info;

        toast.style.cssText = `
            background: ${c.bg};
            border-left: 4px solid ${c.border};
            color: ${c.text};
            padding: 12px 18px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(0,0,0,0.18);
            display: flex;
            align-items: center;
            gap: 10px;
            opacity: 0;
            transform: translateY(12px) scale(0.96);
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            max-width: 380px;
            line-height: 1.4;
        `;

        toast.innerHTML = `<i class="fa-solid ${c.icon}" style="font-size: 14px;"></i> <span>${message}</span>`;
        this.container.appendChild(toast);

        // 平滑進場
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0) scale(1)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-8px) scale(0.96)';
            setTimeout(() => toast.remove(), 250);
        }, duration);
    }
};

// ========================================================
// 2. API 服務層 (API Service Layer)
// ========================================================
window.CalendarApiService = {
    async fetchEvents(monthStr, perspective = 'admin') {
        if (!navigator.onLine && window.CalendarOfflineEngine) {
            console.log('[CalendarApiService] 離線狀態：直接自離線資料庫載入事件');
            const localEvents = window.CalendarOfflineEngine.getEvents(monthStr, perspective);
            return { status: 'success', data: localEvents, offline: true };
        }
        try {
            const url = `/api/calendar/events?month=${monthStr}&perspective=${perspective}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('無法載入行事曆事件');
            const data = await res.json();
            if (data.status === 'success' && window.CalendarOfflineEngine) {
                window.CalendarOfflineEngine.saveEventsToMaster(data.data || []);
            }
            return data;
        } catch (err) {
            if (window.CalendarOfflineEngine) {
                console.warn('[CalendarApiService] 網路請求失敗，自動轉向離線快取引擎:', err.message);
                const localEvents = window.CalendarOfflineEngine.getEvents(monthStr, perspective);
                return { status: 'success', data: localEvents, offline: true };
            }
            throw err;
        }
    },

    async patchStatus(eventId, newStatus) {
        const cleanId = String(eventId).replace('evt_', '');
        if (!navigator.onLine && window.CalendarOfflineEngine) {
            window.CalendarOfflineEngine.enqueuePatchStatus(cleanId, newStatus);
            return { status: 'success', message: '已於離線模式標記狀態（已加入同步佇列）', offline: true };
        }
        try {
            const res = await fetch(`/api/events/${cleanId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (!res.ok || data.status === 'error') {
                throw new Error(data.message || '更新狀態失敗');
            }
            return data;
        } catch (err) {
            if (window.CalendarOfflineEngine) {
                console.warn('[CalendarApiService] 網路中斷，轉存離線同步佇列');
                window.CalendarOfflineEngine.enqueuePatchStatus(cleanId, newStatus);
                return { status: 'success', message: '已於離線模式標記狀態（已加入同步佇列）', offline: true };
            }
            throw err;
        }
    },

    async deleteEvent(eventId) {
        const cleanId = String(eventId).replace('evt_', '');
        if (!navigator.onLine && window.CalendarOfflineEngine) {
            window.CalendarOfflineEngine.enqueueDelete(cleanId);
            return { status: 'success', message: '已於離線模式刪除事件（已加入同步佇列）', offline: true };
        }
        try {
            const res = await fetch(`/api/events/${cleanId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (!res.ok || data.status === 'error') {
                throw new Error(data.message || '刪除事件失敗');
            }
            return data;
        } catch (err) {
            if (window.CalendarOfflineEngine) {
                console.warn('[CalendarApiService] 網路中斷，轉存離線同步佇列');
                window.CalendarOfflineEngine.enqueueDelete(cleanId);
                return { status: 'success', message: '已於離線模式刪除事件（已加入同步佇列）', offline: true };
            }
            throw err;
        }
    },

    async updateDate(eventId, targetDate) {
        const cleanId = String(eventId).replace('evt_', '');
        if (!navigator.onLine && window.CalendarOfflineEngine) {
            window.CalendarOfflineEngine.enqueueUpdateDate(cleanId, targetDate);
            return { status: 'success', message: '已於離線模式改期（已加入同步佇列）', offline: true };
        }
        try {
            const res = await fetch(`/api/calendar/events/${cleanId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    meeting_date: targetDate,
                    end_date: targetDate
                })
            });
            const data = await res.json();
            if (!res.ok || data.status === 'error') {
                throw new Error(data.message || '改期失敗');
            }
            return data;
        } catch (err) {
            if (window.CalendarOfflineEngine) {
                console.warn('[CalendarApiService] 網路中斷，轉存離線同步佇列');
                window.CalendarOfflineEngine.enqueueUpdateDate(cleanId, targetDate);
                return { status: 'success', message: '已於離線模式改期（已加入同步佇列）', offline: true };
            }
            throw err;
        }
    }
};

// ========================================================
// 3. 行事曆核心引擎 (CalEngine with State & Optimistic UI)
// ========================================================
window.CalEngine = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(), // 0-indexed
    currentView: 'month',
    selectedDate: new Date().toISOString().split('T')[0],
    currentPerspective: 'admin',
    activeCategories: ['work', 'travel', 'golf', 'finance', 'general'],
    events: [],
    externalEvents: [],

    init: function() {
        window.ToastNotification.init();
        this.bindGlobalEvents();
        this.loadEvents();
        this.loadMilestones();
    },

    bindGlobalEvents: function() {
        document.addEventListener('dragover', (e) => {
            if (e.target.closest('.cal-day-cell')) e.preventDefault();
        });
        document.addEventListener('drop', (e) => {
            const cell = e.target.closest('.cal-day-cell');
            if (cell && e.dataTransfer) {
                e.preventDefault();
                const eventId = e.dataTransfer.getData('text/plain');
                const targetDate = cell.getAttribute('data-date');
                if (eventId && targetDate) {
                    window.CalEngine.handleEventDropOptimistic(eventId, targetDate);
                }
            }
        });
    },

    loadEvents: function() {
        const year = this.currentYear;
        const month = this.currentMonth + 1;
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;

        window.CalendarApiService.fetchEvents(monthStr, this.currentPerspective)
        .then(data => {
            if (data.status === 'success') {
                this.events = data.data || [];
                try {
                    localStorage.setItem('lifeos_calendar_events_cache', JSON.stringify(this.events));
                } catch(e) {}
                this.renderCurrentView();
                this.renderSidebarDayAgenda();
            }
        })
        .catch(err => {
            console.warn("API 獲取失敗，啟動快取還原:", err);
            const cached = localStorage.getItem('lifeos_calendar_events_cache');
            if (cached) {
                this.events = JSON.parse(cached);
                this.renderCurrentView();
            }
        });
    },

    loadMilestones: function() {
        if (!navigator.onLine && window.CalendarOfflineEngine) {
            const list = window.CalendarOfflineEngine.getOfflineMilestones();
            this.renderMilestonesList(list);
            return;
        }
        fetch('/api/calendar/milestones/countdown')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                this.renderMilestonesList(data.data || []);
            }
        })
        .catch(e => {
            if (window.CalendarOfflineEngine) {
                const list = window.CalendarOfflineEngine.getOfflineMilestones();
                this.renderMilestonesList(list);
            } else {
                console.error("Milestones load error:", e);
            }
        });
    },

    renderMilestonesList: function(milestones) {
        const container = document.getElementById('sidebar-milestones-list');
        if (!container) return;

        if (milestones.length === 0) {
            container.innerHTML = `<div style="font-size: 12px; color: #6B6B6B;">目前無倒數中的里程碑事件</div>`;
            return;
        }

        container.innerHTML = milestones.map(m => `
            <div style="background: rgba(244, 241, 237, 0.9); border-left: 4px solid ${m.color || '#D97706'}; border-radius: 6px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 6px rgba(140, 106, 78, 0.05);">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;">
                    <div style="font-size: 12px; font-weight: 700; color: #3E3E3E;">${m.title}</div>
                    <div style="font-size: 10px; color: #6B6B6B;">${m.meeting_date} ‧ ${m.site_name || '一般'}</div>
                </div>
                <span style="font-size: 12px; font-weight: 800; color: #8C6A4E; background: rgba(140, 106, 78, 0.12); padding: 2px 6px; border-radius: 6px;">
                    ${m.days_left} 天
                </span>
            </div>
        `).join('');
    },

    renderCurrentView: function() {
        const titleEl = document.getElementById('cal-month-title');
        if (titleEl) {
            titleEl.innerText = `${this.currentYear} 年 ${this.currentMonth + 1} 月`;
        }

        const allEvts = [...this.events, ...this.externalEvents].filter(ev => {
            if (this.activeCategories.length === 0) return true;
            return this.activeCategories.includes(ev.category || 'general');
        });

        const canvas = document.getElementById('cal-view-canvas');
        if (!canvas) return;

        if (this.currentView === 'month') this.renderMonthView(allEvts);
        else if (this.currentView === 'week') this.renderWeekView(allEvts);
        else if (this.currentView === 'day') this.renderDayView(allEvts);
        else if (this.currentView === 'agenda') this.renderAgendaView(allEvts);
        else if (this.currentView === 'timeline') this.renderTimelineView(allEvts);
    },

    // 1. 月視角 (Month View) - 包含 status Color-Coding 與浮凸效果
    renderMonthView: function(events) {
        const headerEl = document.getElementById('cal-weekdays-header');
        if (headerEl) headerEl.style.display = 'grid';

        const container = document.getElementById('cal-grid-body');
        if (!container) return;
        container.className = 'month-grid';
        container.innerHTML = '';

        const year = this.currentYear;
        const monthIndex = this.currentMonth;
        const firstDay = new Date(year, monthIndex, 1).getDay();
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
        const todayStr = new Date().toISOString().split('T')[0];

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.style.cssText = 'min-height: 105px; background: rgba(0,0,0,0.02); border-radius: 8px; border: 1px dashed rgba(167, 182, 162, 0.2);';
            container.appendChild(empty);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = events.filter(e => {
                const s = e.meeting_date || (e.start ? e.start.slice(0, 10) : '');
                const end = e.end_date || (e.end ? e.end.slice(0, 10) : s);
                return dateStr >= s && dateStr <= end;
            });

            const isToday = (dateStr === todayStr);
            const isSelected = (dateStr === this.selectedDate);

            const cell = document.createElement('div');
            cell.className = `cal-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`;
            cell.setAttribute('data-date', dateStr);

            cell.onclick = () => {
                this.selectedDate = dateStr;
                this.renderMonthView(events);
                this.renderSidebarDayAgenda();
            };

            cell.ondblclick = () => {
                window.openQuickAddModal(dateStr);
            };

            let eventsHtml = '';
            dayEvents.forEach(ev => {
                const isExt = ev.external_source === 'ical';
                const isMilestone = ev.is_milestone;
                const status = ev.status || 'pending'; // completed, urgent, pending, other

                // 狀態樣式類別
                let statusClass = `status-${status}`;
                let statusBadge = '';
                if (status === 'completed') statusBadge = '✓ ';
                else if (status === 'urgent') statusBadge = '🚨 ';

                eventsHtml += `
                    <div class="cal-event-pill ${statusClass} ${isMilestone ? 'is-milestone-flag' : ''} ${isExt ? 'is-external' : ''}" 
                         style="background: ${status === 'urgent' ? '#FEF2F2' : (status === 'completed' ? 'rgba(244, 241, 237, 0.7)' : (ev.color || '#2B4C7E'))};"
                         draggable="true" 
                         ondragstart="window.CalEngine.onDragStart(event, '${ev.raw_id || ev.id}')"
                         onmouseenter="window.CalEngine.showTooltip(event, '${encodeURIComponent(JSON.stringify(ev))}')"
                         onmouseleave="window.CalEngine.hideTooltip()"
                         onclick="event.stopPropagation(); window.CalEngine.openActionModal('${ev.raw_id || ev.id}')">
                        <span style="font-weight: 700;">${statusBadge}${isMilestone ? '🚩 ' : ''}${ev.meeting_time ? ev.meeting_time + ' ' : ''}</span>
                        <span class="event-pill-title" style="${status === 'completed' ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${ev.title}</span>
                    </div>
                `;
            });

            cell.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 13px; font-weight: ${isToday || isSelected ? '800' : '600'}; color: ${isToday ? '#D9A066' : '#3E3E3E'};">${d}</span>
                    ${isToday ? '<span style="font-size: 10px; background: #D9A066; color: #FFF; padding: 1px 5px; border-radius: 4px; font-weight: 700;">今天</span>' : ''}
                </div>
                <div style="display: flex; flex-direction: column; gap: 3px; overflow: hidden;">
                    ${eventsHtml}
                </div>
            `;

            container.appendChild(cell);
        }
    },

    // 2. 週視角 (Week View)
    renderWeekView: function(events) {
        const headerEl = document.getElementById('cal-weekdays-header');
        if (headerEl) headerEl.style.display = 'none';

        const container = document.getElementById('cal-grid-body');
        if (!container) return;
        container.className = '';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(7, 1fr)';
        container.style.gap = '10px';
        container.innerHTML = '';

        const curr = new Date(this.selectedDate);
        const dayOfWeek = curr.getDay();
        const startOfWeek = new Date(curr);
        startOfWeek.setDate(curr.getDate() - dayOfWeek);

        const weekdayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            const dateStr = dayDate.toISOString().split('T')[0];

            const col = document.createElement('div');
            col.className = 'cal-day-cell';
            col.style.minHeight = '550px';
            col.setAttribute('data-date', dateStr);

            const dayEvts = events.filter(e => (e.meeting_date === dateStr || (e.start && e.start.startsWith(dateStr))));

            col.innerHTML = `
                <div style="text-align: center; border-bottom: 1px solid rgba(167, 182, 162, 0.3); padding-bottom: 6px; margin-bottom: 8px;">
                    <div style="font-size: 11px; color: #6B6B6B;">${weekdayNames[i]}</div>
                    <div style="font-size: 16px; font-weight: 800; color: #8C6A4E;">${dateStr.slice(5)}</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                    ${dayEvts.map(ev => {
                        const status = ev.status || 'pending';
                        return `
                            <div class="cal-event-pill status-${status}" 
                                 style="background: ${status === 'urgent' ? '#FEF2F2' : (status === 'completed' ? '#F4F1ED' : (ev.color || '#2B4C7E'))}; padding: 6px 8px; font-size: 12px; white-space: normal;"
                                 onmouseenter="window.CalEngine.showTooltip(event, '${encodeURIComponent(JSON.stringify(ev))}')"
                                 onmouseleave="window.CalEngine.hideTooltip()"
                                 onclick="window.CalEngine.openActionModal('${ev.raw_id || ev.id}')">
                                <div style="font-weight: 700; ${status === 'completed' ? 'text-decoration: line-through;' : ''}">
                                    ${status === 'completed' ? '✓ ' : (status === 'urgent' ? '🚨 ' : '')}${ev.meeting_time || '09:00'} ${ev.title}
                                </div>
                                <div style="font-size: 10px; opacity: 0.9;">${ev.site_name || ev.location || ''}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            container.appendChild(col);
        }
    },

    // 3. 日視角 (Day View)
    renderDayView: function(events) {
        const headerEl = document.getElementById('cal-weekdays-header');
        if (headerEl) headerEl.style.display = 'none';

        const container = document.getElementById('cal-grid-body');
        if (!container) return;
        container.className = '';
        container.style.display = 'block';

        const dayEvts = events.filter(e => (e.meeting_date === this.selectedDate || (e.start && e.start.startsWith(this.selectedDate))));

        container.innerHTML = `
            <div style="background: #FAFAFA; border: 1px solid rgba(167, 182, 162, 0.3); border-radius: 12px; padding: 20px;">
                <h3 style="color: #8C6A4E; font-family: 'Noto Serif TC', serif; margin-bottom: 16px;">
                    📅 ${this.selectedDate} 當日行程時間軸
                </h3>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${dayEvts.length === 0 ? '<div style="color: #6B6B6B;">當日無排定行程，點擊右上角「新增行程」進行登記。</div>' : ''}
                    ${dayEvts.map(ev => {
                        const status = ev.status || 'pending';
                        return `
                            <div style="display: flex; gap: 16px; background: ${status === 'urgent' ? '#FEF2F2' : '#FFFFFF'}; border-left: 5px solid ${status === 'urgent' ? '#EF4444' : (status === 'completed' ? '#10B981' : (ev.color || '#2B4C7E'))}; padding: 14px 18px; border-radius: 8px; box-shadow: 0 2px 8px rgba(140, 106, 78, 0.06); cursor: pointer;"
                                 onclick="window.CalEngine.openActionModal('${ev.raw_id || ev.id}')">
                                <div style="font-size: 16px; font-weight: 800; color: #8C6A4E; min-width: 70px;">${ev.meeting_time || '09:00'}</div>
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 11px; background: rgba(140, 106, 78, 0.1); color: #8C6A4E; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${ev.category}</span>
                                        <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 700; ${status === 'urgent' ? 'background: #EF4444; color: #FFF;' : (status === 'completed' ? 'background: #10B981; color: #FFF;' : 'background: #E5E7EB; color: #374151;')}">${status}</span>
                                        <h4 style="font-size: 15px; font-weight: 700; color: #3E3E3E; margin: 0; ${status === 'completed' ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${ev.title}</h4>
                                    </div>
                                    <div style="font-size: 13px; color: #6B6B6B; margin-top: 4px;">地點：${ev.location || '現場'} ‧ 出席：${ev.attendee_roles || '全體'}</div>
                                    ${ev.description ? `<div style="font-size: 12px; color: #3E3E3E; background: rgba(244, 241, 237, 0.8); padding: 6px 10px; border-radius: 6px; margin-top: 6px;">${ev.description}</div>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    },

    // 4. 清單視角 (Agenda List)
    renderAgendaView: function(events) {
        const headerEl = document.getElementById('cal-weekdays-header');
        if (headerEl) headerEl.style.display = 'none';

        const container = document.getElementById('cal-grid-body');
        if (!container) return;
        container.className = '';
        container.style.display = 'block';

        const sorted = [...events].sort((a,b) => (a.meeting_date || a.start || '').localeCompare(b.meeting_date || b.start || ''));

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px; max-height: 650px; overflow-y: auto;">
                ${sorted.map(ev => {
                    const status = ev.status || 'pending';
                    return `
                        <div style="background: ${status === 'urgent' ? '#FEF2F2' : '#FAFAFA'}; border: 1px solid rgba(167, 182, 162, 0.3); border-left: 5px solid ${status === 'urgent' ? '#EF4444' : (status === 'completed' ? '#10B981' : (ev.color || '#2B4C7E'))}; border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(140, 106, 78, 0.05); cursor: pointer;"
                             onclick="window.CalEngine.openActionModal('${ev.raw_id || ev.id}')">
                            <div style="display: flex; align-items: center; gap: 14px;">
                                <span style="font-size: 13px; font-weight: 800; color: #8C6A4E; background: rgba(140, 106, 78, 0.12); padding: 4px 8px; border-radius: 6px;">
                                    ${ev.meeting_date || (ev.start ? ev.start.slice(0, 10) : '')}
                                </span>
                                <div>
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <span style="font-size: 11px; padding: 2px 5px; border-radius: 4px; font-weight: 700; ${status === 'urgent' ? 'background: #EF4444; color: #FFF;' : (status === 'completed' ? 'background: #10B981; color: #FFF;' : 'background: #E5E7EB; color: #374151;')}">${status}</span>
                                        <div style="font-size: 14px; font-weight: 700; color: #3E3E3E; ${status === 'completed' ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${ev.title}</div>
                                    </div>
                                    <div style="font-size: 11px; color: #6B6B6B; margin-top: 2px;">${ev.meeting_time || '09:00'} ‧ ${ev.site_name || ev.location || ''}</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-outline" style="padding: 4px 10px; font-size: 11px;">狀態 / 操作</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    // 5. 甘特時間軸視角 (Timeline / Gantt View)
    renderTimelineView: function(events) {
        const headerEl = document.getElementById('cal-weekdays-header');
        if (headerEl) headerEl.style.display = 'none';

        const container = document.getElementById('cal-grid-body');
        if (!container) return;
        container.className = 'timeline-view';
        container.style.display = 'flex';

        container.innerHTML = events.map(ev => {
            const startD = ev.meeting_date || (ev.start ? ev.start.slice(0, 10) : '');
            const endD = ev.end_date || (ev.end ? ev.end.slice(0, 10) : startD);
            const isMilestone = ev.is_milestone;
            const status = ev.status || 'pending';
            return `
                <div class="timeline-item" style="border-left-color: ${status === 'urgent' ? '#EF4444' : (status === 'completed' ? '#10B981' : (ev.color || '#2B4C7E'))}; cursor: pointer;"
                     onclick="window.CalEngine.openActionModal('${ev.raw_id || ev.id}')">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${isMilestone ? '<span style="font-size: 11px; background: #D97706; color: #FFF; padding: 1px 6px; border-radius: 4px; font-weight: 700;">🚩 關鍵里程碑</span>' : ''}
                            <span style="font-size: 11px; background: rgba(140, 106, 78, 0.12); color: #8C6A4E; padding: 2px 6px; border-radius: 4px;">${ev.category}</span>
                            <span style="font-size: 11px; padding: 1px 5px; border-radius: 4px; font-weight: 700; ${status === 'urgent' ? 'background: #EF4444; color: #FFF;' : (status === 'completed' ? 'background: #10B981; color: #FFF;' : 'background: #E5E7EB; color: #374151;')}">${status}</span>
                            <strong style="font-size: 14px; color: #3E3E3E; ${status === 'completed' ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${ev.title}</strong>
                        </div>
                        <div style="font-size: 12px; color: #6B6B6B; margin-top: 4px;">
                            時段：${startD} ${ev.meeting_time || ''} ➔ ${endD} ${ev.end_time || ''} ‧ 工地/地點：${ev.site_name || ev.location || '現場'}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // 側邊欄當日行程簡表
    renderSidebarDayAgenda: function() {
        const titleEl = document.getElementById('sidebar-selected-date-title');
        const container = document.getElementById('sidebar-day-agenda');
        if (titleEl) titleEl.innerText = `${this.selectedDate} 行程簡表`;
        if (!container) return;

        const dayEvts = this.events.filter(e => (e.meeting_date === this.selectedDate || (e.start && e.start.startsWith(this.selectedDate))));
        if (dayEvts.length === 0) {
            container.innerHTML = `<div style="color: #6B6B6B;">當日暫無特定排程</div>`;
            return;
        }

        container.innerHTML = dayEvts.map(e => `
            <div style="padding: 6px 8px; background: rgba(244, 241, 237, 0.9); border-left: 3px solid ${e.color || '#2B4C7E'}; border-radius: 4px; cursor: pointer;"
                 onclick="window.CalEngine.openActionModal('${e.raw_id || e.id}')">
                <div style="font-weight: 700; color: #3E3E3E; ${e.status === 'completed' ? 'text-decoration: line-through;' : ''}">${e.meeting_time || ''} ${e.title}</div>
                <div style="font-size: 10px; color: #6B6B6B;">${e.location || e.site_name || ''} ‧ ${e.status || 'pending'}</div>
            </div>
        `).join('');
    },

    // 樂觀拖曳改期 (Optimistic Drop Update with Auto Rollback)
    onDragStart: function(e, eventId) {
        e.dataTransfer.setData('text/plain', String(eventId));
    },

    async handleEventDropOptimistic(eventId, targetDate) {
        const cleanId = String(eventId).replace('evt_', '');
        const targetEvt = this.events.find(e => String(e.raw_id || e.id).replace('evt_', '') === cleanId);
        if (!targetEvt) return;

        const originalMeetingDate = targetEvt.meeting_date;
        const originalEndDate = targetEvt.end_date;
        const originalStart = targetEvt.start;

        // [1] 樂觀更新: 畫面先立刻反應
        targetEvt.meeting_date = targetDate;
        targetEvt.end_date = targetDate;
        targetEvt.start = `${targetDate}T${targetEvt.meeting_time || '09:00'}:00`;
        this.renderCurrentView();
        this.renderSidebarDayAgenda();
        window.ToastNotification.show(`已將「${targetEvt.title}」改期至 ${targetDate}`, 'info');

        try {
            // [2] 背景發送 API
            await window.CalendarApiService.updateDate(cleanId, targetDate);
            this.loadMilestones();
        } catch (err) {
            // [3] 失敗自動回滾 (Rollback)
            console.error('[Drop Rollback]', err);
            targetEvt.meeting_date = originalMeetingDate;
            targetEvt.end_date = originalEndDate;
            targetEvt.start = originalStart;
            this.renderCurrentView();
            this.renderSidebarDayAgenda();
            window.ToastNotification.show(`改期失敗：${err.message}，已自動復原`, 'error');
        }
    },

    // Hover 懸浮預覽小卡 (Rich Tooltip)
    showTooltip: function(e, rawJsonStr) {
        const tooltip = document.getElementById('cal-rich-tooltip');
        if (!tooltip) return;

        try {
            const ev = JSON.parse(decodeURIComponent(rawJsonStr));
            tooltip.innerHTML = `
                <div style="font-size: 11px; font-weight: 800; color: ${ev.color || '#2B4C7E'}; text-transform: uppercase; margin-bottom: 4px;">
                    ${ev.category} ‧ 狀態：${ev.status || 'pending'}
                </div>
                <h5 style="font-size: 14px; font-weight: 700; color: #3E3E3E; margin: 0 0 6px 0;">${ev.title}</h5>
                <div style="font-size: 11px; color: #6B6B6B; line-height: 1.5;">
                    <div>⏰ <b>時間：</b>${ev.meeting_date || ''} ${ev.meeting_time || ''}</div>
                    <div>📍 <b>地點：</b>${ev.location || ev.site_name || '無'}</div>
                    <div>👥 <b>出席：</b>${ev.attendee_roles || '專案人員'}</div>
                    ${ev.description ? `<div style="margin-top: 4px; border-top: 1px dashed #DDD; padding-top: 4px;">📝 <b>備註：</b>${ev.description}</div>` : ''}
                </div>
            `;
            tooltip.style.display = 'block';
            tooltip.style.left = `${e.pageX + 15}px`;
            tooltip.style.top = `${e.pageY + 15}px`;
        } catch(err) {}
    },

    hideTooltip: function() {
        const tooltip = document.getElementById('cal-rich-tooltip');
        if (tooltip) tooltip.style.display = 'none';
    },

    // ========================================================
    // 4. 客製化 Modal (狀態切換 + 原地二次確認防呆，不彈原生視窗)
    // ========================================================
    currentActiveEventId: null,

    openActionModal: function(eventId) {
        const cleanId = String(eventId).replace('evt_', '');
        const ev = this.events.find(e => String(e.raw_id || e.id).replace('evt_', '') === cleanId);
        if (!ev) return;

        this.currentActiveEventId = cleanId;

        document.getElementById('action-modal-title').innerText = ev.title;
        document.getElementById('action-modal-time').innerText = `時間：${ev.meeting_date || ''} ${ev.meeting_time || ''} ‧ 地點：${ev.location || ev.site_name || '現場'}`;
        
        // 綁定當前狀態
        const selectEl = document.getElementById('action-modal-status-select');
        if (selectEl) selectEl.value = ev.status || 'pending';

        // 隱藏刪除防呆確認區，顯示初始刪除觸發鈕
        document.getElementById('action-delete-confirm-box').style.display = 'none';
        document.getElementById('btn-action-trigger-delete').style.display = 'inline-block';

        const modal = document.getElementById('modal-event-action');
        if (modal) modal.classList.add('active');
    },

    closeActionModal: function() {
        const modal = document.getElementById('modal-event-action');
        if (modal) modal.classList.remove('active');
        this.currentActiveEventId = null;
    },

    // 樂觀狀態切換 (Optimistic Status Change)
    async handleModalStatusChange(newStatus) {
        if (!this.currentActiveEventId) return;
        const cleanId = this.currentActiveEventId;
        const ev = this.events.find(e => String(e.raw_id || e.id).replace('evt_', '') === cleanId);
        if (!ev) return;

        const previousStatus = ev.status || 'pending';

        // [1] 樂觀更新: 畫面直接變色與渲染
        ev.status = newStatus;
        this.renderCurrentView();
        this.renderSidebarDayAgenda();
        window.ToastNotification.show(`狀態已更新為「${newStatus}」`, 'info');

        try {
            // [2] 背景發送 API
            await window.CalendarApiService.patchStatus(cleanId, newStatus);
        } catch (err) {
            // [3] 失敗自動回滾 (Rollback)
            console.error('[Status Rollback]', err);
            ev.status = previousStatus;
            document.getElementById('action-modal-status-select').value = previousStatus;
            this.renderCurrentView();
            this.renderSidebarDayAgenda();
            window.ToastNotification.show(`更新失敗：${err.message}，已還原狀態`, 'error');
        }
    },

    // 原地展開防呆確認
    showDeleteConfirm: function() {
        document.getElementById('btn-action-trigger-delete').style.display = 'none';
        const confirmBox = document.getElementById('action-delete-confirm-box');
        confirmBox.style.display = 'block';
    },

    hideDeleteConfirm: function() {
        document.getElementById('action-delete-confirm-box').style.display = 'none';
        document.getElementById('btn-action-trigger-delete').style.display = 'inline-block';
    },

    // 樂觀刪除事件 (Optimistic Delete with Auto Rollback)
    async executeConfirmedDelete() {
        if (!this.currentActiveEventId) return;
        const cleanId = this.currentActiveEventId;
        const targetIndex = this.events.findIndex(e => String(e.raw_id || e.id).replace('evt_', '') === cleanId);
        if (targetIndex === -1) return;

        const deletedEvent = this.events[targetIndex];

        // [1] 關閉 Modal 並樂觀移除 DOM
        this.closeActionModal();
        this.events.splice(targetIndex, 1);
        this.renderCurrentView();
        this.renderSidebarDayAgenda();
        window.ToastNotification.show(`事件「${deletedEvent.title}」已刪除`, 'info');

        try {
            // [2] 背景發送 API
            await window.CalendarApiService.deleteEvent(cleanId);
            this.loadMilestones();
        } catch (err) {
            // [3] 失敗自動回滾 (Rollback)
            console.error('[Delete Rollback]', err);
            this.events.splice(targetIndex, 0, deletedEvent);
            this.renderCurrentView();
            this.renderSidebarDayAgenda();
            window.ToastNotification.show(`刪除失敗：${err.message}，事件已恢復`, 'error');
        }
    }
};

// 獨立頁面快速初始化入口
window.initStandaloneCalendar = function() {
    window.CalEngine.init();
};

// 視角切換器綁定
window.changePerspective = function(val) {
    window.CalEngine.currentPerspective = val;
    document.body.className = '';
    if (val === 'senior') document.body.classList.add('view-senior');
    else if (val === 'print') document.body.classList.add('view-print');
    window.CalEngine.loadEvents();
};

// 5大維度切換
window.switchCalendarView = function(viewName) {
    window.CalEngine.currentView = viewName;
    document.querySelectorAll('.btn-view-tab').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-view') === viewName);
    });
    window.CalEngine.renderCurrentView();
};

window.navigateMonth = function(delta) {
    window.CalEngine.currentMonth += delta;
    if (window.CalEngine.currentMonth > 11) {
        window.CalEngine.currentMonth = 0;
        window.CalEngine.currentYear += 1;
    } else if (window.CalEngine.currentMonth < 0) {
        window.CalEngine.currentMonth = 11;
        window.CalEngine.currentYear -= 1;
    }
    window.CalEngine.loadEvents();
};

window.goToToday = function() {
    const now = new Date();
    window.CalEngine.currentYear = now.getFullYear();
    window.CalEngine.currentMonth = now.getMonth();
    window.CalEngine.selectedDate = now.toISOString().split('T')[0];
    window.CalEngine.loadEvents();
};

// 快速新增表單處理
window.openQuickAddModal = function(defaultDate = null) {
    document.getElementById('fe-id').value = '';
    document.getElementById('modal-event-title-display').innerHTML = '<i class="fa-solid fa-calendar-plus" style="color: var(--accent);"></i> 新增行事曆事件';
    document.getElementById('fe-title').value = '';
    document.getElementById('fe-category').value = 'work';
    document.getElementById('fe-site-name').value = 'Micron F10E';
    document.getElementById('fe-start-date').value = defaultDate || window.CalEngine.selectedDate || new Date().toISOString().split('T')[0];
    document.getElementById('fe-start-time').value = '09:00';
    document.getElementById('fe-end-date').value = defaultDate || window.CalEngine.selectedDate || new Date().toISOString().split('T')[0];
    document.getElementById('fe-end-time').value = '10:00';
    document.getElementById('fe-is-milestone').checked = false;
    document.getElementById('fe-all-day').checked = false;
    document.getElementById('fe-location').value = 'Site';
    document.getElementById('fe-notes').value = '';

    const modal = document.getElementById('modal-quick-add');
    if (modal) {
        modal.classList.add('active');
        if (window.LifeOSMemoryEngine) {
            window.LifeOSMemoryEngine.renderInlineChips('fe-title-history-chips', 'fe-title', 'cal_event_title');
            window.LifeOSMemoryEngine.renderInlineChips('fe-site-history-chips', 'fe-site-name', 'cal_site_name');
        }
    }
};

window.closeQuickAddModal = function() {
    const modal = document.getElementById('modal-quick-add');
    if (modal) modal.classList.remove('active');
};

window.handleEventFormSubmit = function(e) {
    e.preventDefault();
    const id = document.getElementById('fe-id').value;
    const isEdit = Boolean(id);

    const payload = {
        title: document.getElementById('fe-title').value.trim(),
        category: document.getElementById('fe-category').value,
        site_name: document.getElementById('fe-site-name').value,
        meeting_date: document.getElementById('fe-start-date').value,
        meeting_time: document.getElementById('fe-start-time').value,
        end_date: document.getElementById('fe-end-date').value || document.getElementById('fe-start-date').value,
        end_time: document.getElementById('fe-end-time').value || '10:00',
        is_milestone: document.getElementById('fe-is-milestone').checked,
        allDay: document.getElementById('fe-all-day').checked,
        location: document.getElementById('fe-location').value,
        notes: document.getElementById('fe-notes').value,
        status: 'pending'
    };

    if (window.LifeOSMemoryEngine) {
        if (payload.title) window.LifeOSMemoryEngine.addEntry('cal_event_title', payload.title);
        if (payload.site_name) window.LifeOSMemoryEngine.addEntry('cal_site_name', payload.site_name);
        if (payload.location) window.LifeOSMemoryEngine.addEntry('cal_location', payload.location);
    }

    if (!navigator.onLine && window.CalendarOfflineEngine) {
        if (isEdit) {
            window.CalendarOfflineEngine.enqueueUpdate(id, payload);
            window.ToastNotification.show('已於離線模式更新事件（已排入背景同步佇列）', 'success');
        } else {
            window.CalendarOfflineEngine.enqueueCreate(payload);
            window.ToastNotification.show('已於離線模式建立事件（將於網路連線後自動同步）', 'success');
        }
        closeQuickAddModal();
        window.CalEngine.loadEvents();
        window.CalEngine.loadMilestones();
        return;
    }

    const url = isEdit ? `/api/calendar/events/${id}` : '/api/calendar/events';
    const method = isEdit ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            closeQuickAddModal();
            window.ToastNotification.show(data.message || '事件已成功儲存！', 'success');
            window.CalEngine.loadEvents();
            window.CalEngine.loadMilestones();
        } else {
            window.ToastNotification.show('儲存失敗: ' + (data.message || '未知錯誤'), 'error');
        }
    })
    .catch(err => {
        if (window.CalendarOfflineEngine) {
            if (isEdit) {
                window.CalendarOfflineEngine.enqueueUpdate(id, payload);
                window.ToastNotification.show('網路連線中斷，已轉為離線模式更新事件！', 'warning');
            } else {
                window.CalendarOfflineEngine.enqueueCreate(payload);
                window.ToastNotification.show('網路連線中斷，已轉為離線模式儲存事件！', 'warning');
            }
            closeQuickAddModal();
            window.CalEngine.loadEvents();
            window.CalEngine.loadMilestones();
        } else {
            window.ToastNotification.show('網絡請求錯誤: ' + err, 'error');
        }
    });
};

// 分類篩選連動
window.onCategoryFilterChange = function() {
    const checked = [];
    document.querySelectorAll('.cat-filter:checked').forEach(c => checked.push(c.value));
    window.CalEngine.activeCategories = checked;
    const filterAll = document.getElementById('filter-all');
    if (filterAll) filterAll.checked = (checked.length === 4);
    window.CalEngine.renderCurrentView();
};

window.toggleFilterCategory = function(cat) {
    const filterAll = document.getElementById('filter-all');
    if (!filterAll) return;
    const isChecked = filterAll.checked;
    document.querySelectorAll('.cat-filter').forEach(c => c.checked = isChecked);
    window.CalEngine.activeCategories = isChecked ? ['work', 'travel', 'golf', 'finance', 'general'] : [];
    window.CalEngine.renderCurrentView();
};

// 外部日曆同步處理 (以 Toast 呈現)
window.openSyncModal = function() {
    const modal = document.getElementById('modal-sync-calendar');
    if (modal) modal.classList.add('active');
};

window.closeSyncModal = function() {
    const modal = document.getElementById('modal-sync-calendar');
    if (modal) modal.classList.remove('active');
};

window.executeCalendarSync = function() {
    const icalUrl = document.getElementById('sync-ical-url')?.value.trim();
    if (!icalUrl) {
        window.ToastNotification.show('請先輸入有效的 iCal 網址！', 'warning');
        return;
    }

    fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ical_url: icalUrl })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            window.CalEngine.externalEvents = data.data || [];
            closeSyncModal();
            window.ToastNotification.show(`🎉 ${data.message}`, 'success');
            window.CalEngine.renderCurrentView();
        } else {
            window.ToastNotification.show('同步失敗: ' + (data.message || '無法解析該日曆'), 'error');
        }
    })
    .catch(err => window.ToastNotification.show('同步請求異常: ' + err, 'error'));
};
