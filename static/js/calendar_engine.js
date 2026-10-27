/**
 * LifeOS Unified Calendar Core Engine (v2.0 Enterprise)
 * 支援：多態檢視 (Month/Week/Day/Agenda/Timeline)、四大標籤色彩編碼、
 * 視角連動 (Admin/Senior/Print)、里程碑倒數連動、外部日曆同步與拖曳改期
 */

window.CalEngine = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(), // 0-indexed
    currentView: 'month', // month, week, day, agenda, timeline
    selectedDate: new Date().toISOString().split('T')[0],
    currentPerspective: 'admin', // admin, senior, print
    activeCategories: ['work', 'travel', 'golf', 'finance', 'general'],
    events: [],
    externalEvents: [],

    init: function() {
        this.bindGlobalEvents();
        this.loadEvents();
        this.loadMilestones();
    },

    bindGlobalEvents: function() {
        // 拖曳放置監聽
        document.addEventListener('dragover', (e) => {
            if (e.target.closest('.cal-day-cell')) {
                e.preventDefault();
            }
        });
        document.addEventListener('drop', (e) => {
            const cell = e.target.closest('.cal-day-cell');
            if (cell && e.dataTransfer) {
                e.preventDefault();
                const eventId = e.dataTransfer.getData('text/plain');
                const targetDate = cell.getAttribute('data-date');
                if (eventId && targetDate) {
                    window.CalEngine.handleEventDrop(eventId, targetDate);
                }
            }
        });
    },

    loadEvents: function() {
        const year = this.currentYear;
        const month = this.currentMonth + 1;
        const monthStr = `${year}-${String(month).padStart(2, '0')}`;
        
        const url = `/api/calendar/events?month=${monthStr}&perspective=${this.currentPerspective}`;
        
        fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                this.events = data.data || [];
                // 備份至 localStorage
                try {
                    localStorage.setItem('lifeos_calendar_events_cache', JSON.stringify(this.events));
                } catch(e) {}
                this.renderCurrentView();
                this.renderSidebarDayAgenda();
            }
        })
        .catch(err => {
            console.warn("Failed to fetch calendar events, falling back to cache:", err);
            const cached = localStorage.getItem('lifeos_calendar_events_cache');
            if (cached) {
                this.events = JSON.parse(cached);
                this.renderCurrentView();
            }
        });
    },

    loadMilestones: function() {
        fetch('/api/calendar/milestones/countdown')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                this.renderMilestonesList(data.data || []);
            }
        })
        .catch(e => console.error("Milestones load error:", e));
    },

    renderMilestonesList: function(milestones) {
        const container = document.getElementById('sidebar-milestones-list');
        if (!container) return;

        if (milestones.length === 0) {
            container.innerHTML = `<div style="font-size: 12px; color: #6B6B6B;">目前無倒數中的里程碑事件</div>`;
            return;
        }

        container.innerHTML = milestones.map(m => `
            <div style="background: rgba(244, 241, 237, 0.9); border-left: 4px solid ${m.color || '#D97706'}; border-radius: 6px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center;">
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

        // 合併本地事件與外部同步日曆
        const allEvts = [...this.events, ...this.externalEvents].filter(ev => {
            if (this.activeCategories.length === 0) return true;
            return this.activeCategories.includes(ev.category || 'general');
        });

        const canvas = document.getElementById('cal-view-canvas');
        if (!canvas) return;

        if (this.currentView === 'month') {
            this.renderMonthView(allEvts);
        } else if (this.currentView === 'week') {
            this.renderWeekView(allEvts);
        } else if (this.currentView === 'day') {
            this.renderDayView(allEvts);
        } else if (this.currentView === 'agenda') {
            this.renderAgendaView(allEvts);
        } else if (this.currentView === 'timeline') {
            this.renderTimelineView(allEvts);
        }
    },

    // 1. 月視角 (Month View)
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

        // 前置空白格
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.style.cssText = 'min-height: 105px; background: rgba(0,0,0,0.02); border-radius: 8px; border: 1px dashed rgba(167, 182, 162, 0.2);';
            container.appendChild(empty);
        }

        // 每日格子
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
                const bg = ev.color || '#2B4C7E';
                eventsHtml += `
                    <div class="cal-event-pill ${isMilestone ? 'is-milestone-flag' : ''} ${isExt ? 'is-external' : ''}" 
                         style="background: ${bg};"
                         draggable="true" 
                         ondragstart="window.CalEngine.onDragStart(event, '${ev.raw_id || ev.id}')"
                         onmouseenter="window.CalEngine.showTooltip(event, '${encodeURIComponent(JSON.stringify(ev))}')"
                         onmouseleave="window.CalEngine.hideTooltip()"
                         onclick="event.stopPropagation(); window.CalEngine.openEditEvent('${ev.raw_id || ev.id}')">
                        ${isMilestone ? '🚩 ' : ''}${isExt ? '🔗 ' : ''}${ev.meeting_time ? ev.meeting_time + ' ' : ''}${ev.title}
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

        // 計算以當前 selectedDate 為中心的一週 (日~六)
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
                    ${dayEvts.map(ev => `
                        <div class="cal-event-pill" style="background: ${ev.color || '#2B4C7E'}; padding: 6px 8px; font-size: 12px; white-space: normal;"
                             onmouseenter="window.CalEngine.showTooltip(event, '${encodeURIComponent(JSON.stringify(ev))}')"
                             onmouseleave="window.CalEngine.hideTooltip()"
                             onclick="window.CalEngine.openEditEvent('${ev.raw_id || ev.id}')">
                            <div style="font-weight: 700;">${ev.meeting_time || '09:00'} ${ev.title}</div>
                            <div style="font-size: 10px; opacity: 0.9;">${ev.site_name || ev.location || ''}</div>
                        </div>
                    `).join('')}
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
                    ${dayEvts.length === 0 ? '<div style="color: #6B6B6B;">當日無排定行程，點擊「新增行程」進行登記。</div>' : ''}
                    ${dayEvts.map(ev => `
                        <div style="display: flex; gap: 16px; background: #FFFFFF; border-left: 5px solid ${ev.color || '#2B4C7E'}; padding: 14px 18px; border-radius: 8px; box-shadow: 0 2px 8px rgba(140, 106, 78, 0.06);">
                            <div style="font-size: 16px; font-weight: 800; color: #8C6A4E; min-width: 70px;">${ev.meeting_time || '09:00'}</div>
                            <div style="flex: 1;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="font-size: 11px; background: rgba(140, 106, 78, 0.1); color: #8C6A4E; padding: 2px 6px; border-radius: 4px; font-weight: 700;">${ev.category}</span>
                                    <h4 style="font-size: 15px; font-weight: 700; color: #3E3E3E; margin: 0;">${ev.title}</h4>
                                </div>
                                <div style="font-size: 13px; color: #6B6B6B; margin-top: 4px;">地點：${ev.location || '現場'} ‧ 出席：${ev.attendee_roles || '全體'}</div>
                                ${ev.description ? `<div style="font-size: 12px; color: #3E3E3E; background: rgba(244, 241, 237, 0.8); padding: 6px 10px; border-radius: 6px; margin-top: 6px;">${ev.description}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
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

        // 依日期升冪排列
        const sorted = [...events].sort((a,b) => (a.meeting_date || a.start || '').localeCompare(b.meeting_date || b.start || ''));

        container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 10px; max-height: 650px; overflow-y: auto;">
                ${sorted.map(ev => `
                    <div style="background: #FAFAFA; border: 1px solid rgba(167, 182, 162, 0.3); border-radius: 10px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(140, 106, 78, 0.05);">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <span style="font-size: 13px; font-weight: 800; color: #8C6A4E; background: rgba(140, 106, 78, 0.12); padding: 4px 8px; border-radius: 6px;">
                                ${ev.meeting_date || (ev.start ? ev.start.slice(0, 10) : '')}
                            </span>
                            <div>
                                <div style="font-size: 14px; font-weight: 700; color: #3E3E3E;">${ev.title}</div>
                                <div style="font-size: 11px; color: #6B6B6B;">${ev.meeting_time || '09:00'} ‧ ${ev.site_name || ev.location || ''}</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="window.CalEngine.openEditEvent('${ev.raw_id || ev.id}')" class="btn-outline" style="padding: 4px 10px; font-size: 11px;">編輯</button>
                        </div>
                    </div>
                `).join('')}
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
            return `
                <div class="timeline-item" style="border-left-color: ${ev.color || '#2B4C7E'};">
                    <div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            ${isMilestone ? '<span style="font-size: 11px; background: #D97706; color: #FFF; padding: 1px 6px; border-radius: 4px; font-weight: 700;">🚩 關鍵里程碑</span>' : ''}
                            <span style="font-size: 11px; background: rgba(140, 106, 78, 0.12); color: #8C6A4E; padding: 2px 6px; border-radius: 4px;">${ev.category}</span>
                            <strong style="font-size: 14px; color: #3E3E3E;">${ev.title}</strong>
                        </div>
                        <div style="font-size: 12px; color: #6B6B6B; margin-top: 4px;">
                            時段：${startD} ${ev.meeting_time || ''} ➔ ${endD} ${ev.end_time || ''} ‧ 工地/地點：${ev.site_name || ev.location || '現場'}
                        </div>
                    </div>
                    <div>
                        <span style="font-size: 11px; color: #8C6A4E; font-weight: 700;">${ev.status === 'completed' ? '✅ 已完成' : '⏳ 進行中/排定'}</span>
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
            <div style="padding: 6px 8px; background: rgba(244, 241, 237, 0.9); border-left: 3px solid ${e.color || '#2B4C7E'}; border-radius: 4px;">
                <div style="font-weight: 700; color: #3E3E3E;">${e.meeting_time || ''} ${e.title}</div>
                <div style="font-size: 10px; color: #6B6B6B;">${e.location || e.site_name || ''}</div>
            </div>
        `).join('');
    },

    // 拖曳改期處理 (Drag & Drop)
    onDragStart: function(e, eventId) {
        e.dataTransfer.setData('text/plain', String(eventId));
    },

    handleEventDrop: function(eventId, targetDate) {
        const cleanId = String(eventId).replace('evt_', '');
        const targetEvt = this.events.find(e => String(e.raw_id || e.id).replace('evt_', '') === cleanId);
        if (!targetEvt) return;

        if (confirm(`確定將「${targetEvt.title}」改期至 ${targetDate} 嗎？`)) {
            fetch(`/api/calendar/events/${cleanId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    meeting_date: targetDate,
                    end_date: targetDate
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    targetEvt.meeting_date = targetDate;
                    targetEvt.end_date = targetDate;
                    targetEvt.start = `${targetDate}T${targetEvt.meeting_time || '09:00'}:00`;
                    this.renderCurrentView();
                    this.renderSidebarDayAgenda();
                    this.loadMilestones();
                } else {
                    alert('改期失敗: ' + (data.message || '未知錯誤'));
                }
            })
            .catch(err => alert('網絡連線錯誤: ' + err));
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
                    ${ev.category} ‧ ${ev.status === 'completed' ? '已完成' : '排定中'}
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

    openEditEvent: function(eventId) {
        const cleanId = String(eventId).replace('evt_', '');
        const ev = this.events.find(e => String(e.raw_id || e.id).replace('evt_', '') === cleanId);
        if (!ev) return;

        document.getElementById('fe-id').value = cleanId;
        document.getElementById('modal-event-title-display').innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #D9A066;"></i> 編輯行事曆事件';
        document.getElementById('fe-title').value = ev.title || '';
        document.getElementById('fe-category').value = ev.category || 'work';
        document.getElementById('fe-site-name').value = ev.site_name || '';
        document.getElementById('fe-start-date').value = ev.meeting_date || (ev.start ? ev.start.slice(0, 10) : '');
        document.getElementById('fe-start-time').value = ev.meeting_time || '09:00';
        document.getElementById('fe-end-date').value = ev.end_date || ev.meeting_date || '';
        document.getElementById('fe-end-time').value = ev.end_time || '10:00';
        document.getElementById('fe-is-milestone').checked = Boolean(ev.is_milestone);
        document.getElementById('fe-all-day').checked = Boolean(ev.allDay);
        document.getElementById('fe-location').value = ev.location || '';
        document.getElementById('fe-notes').value = ev.notes || ev.description || '';

        const modal = document.getElementById('modal-quick-add');
        if (modal) modal.classList.add('active');
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
    if (val === 'senior') {
        document.body.classList.add('view-senior');
    } else if (val === 'print') {
        document.body.classList.add('view-print');
    }
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
    if (modal) modal.classList.add('active');
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
        title: document.getElementById('fe-title').value.strip ? document.getElementById('fe-title').value.strip() : document.getElementById('fe-title').value,
        category: document.getElementById('fe-category').value,
        site_name: document.getElementById('fe-site-name').value,
        meeting_date: document.getElementById('fe-start-date').value,
        meeting_time: document.getElementById('fe-start-time').value,
        end_date: document.getElementById('fe-end-date').value || document.getElementById('fe-start-date').value,
        end_time: document.getElementById('fe-end-time').value || '10:00',
        is_milestone: document.getElementById('fe-is-milestone').checked,
        allDay: document.getElementById('fe-all-day').checked,
        location: document.getElementById('fe-location').value,
        notes: document.getElementById('fe-notes').value
    };

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
            window.CalEngine.loadEvents();
            window.CalEngine.loadMilestones();
        } else {
            alert('儲存失敗: ' + (data.message || '未知錯誤'));
        }
    })
    .catch(err => alert('網絡連線錯誤: ' + err));
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

// 外部日曆同步處理
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
        alert('請先輸入 iCal 網址！');
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
            alert(`🎉 ${data.message}`);
            closeSyncModal();
            window.CalEngine.renderCurrentView();
        } else {
            alert('同步失敗: ' + (data.message || '無法解析該日曆'));
        }
    })
    .catch(err => alert('同步請求異常: ' + err));
};
