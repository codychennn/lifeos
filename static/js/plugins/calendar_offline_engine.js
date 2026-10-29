/**
 * LifeOS Enterprise Calendar Offline Autonomous Engine (離線自主運作核心引擎)
 * 
 * 核心特色：
 * 1. 離線無損運作 (Zero-Loss Offline Operation)：網路斷開時，仍可自由切換月/週/日/清單/時間軸、檢視所有事件、查看倒數里程碑。
 * 2. 離線完整 CRUD：在斷網狀態下新增事件、拖曳改期、狀態切換 (Completed/Urgent)、刪除事件皆能秒速反應並即時保存於本機。
 * 3. 雙向樂觀同步佇列 (Optimistic Sync Queue)：斷網時操作自動寫入佇列；一旦偵測到網路連線恢復，自動將本機離線異動無縫回放同步至雲端資料庫。
 * 4. PWA Service Worker 聯動：透過 Service Worker 提供 App Shell 離線快取，無網路時亦可開啟 /calendar。
 */

window.CalendarOfflineEngine = {
    KEYS: {
        MASTER_EVENTS: 'lifeos_offline_master_events',
        SYNC_QUEUE: 'lifeos_offline_sync_queue',
        MILESTONES: 'lifeos_offline_cached_milestones',
        LAST_SYNC: 'lifeos_offline_last_sync_time'
    },

    isSyncing: false,
    syncIntervalId: null,

    init: function() {
        console.log('[OfflineEngine] 正在啟動 LifeOS 離線自主引擎...');
        this.registerServiceWorker();
        this.bindNetworkEvents();
        this.updateNetworkBadge();

        // 啟動時若在線，預熱抓取全域事件快取並處理待同步佇列
        if (navigator.onLine) {
            this.warmupMasterCache();
            this.processSyncQueue();
        }

        // 定期心跳檢查與連線探測 (每 20 秒)
        this.syncIntervalId = setInterval(() => {
            if (navigator.onLine) {
                this.processSyncQueue();
            }
            this.updateNetworkBadge();
        }, 20000);
    },

    // 1. 註冊 Service Worker
    registerServiceWorker: function() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .then(reg => {
                    console.log('[OfflineEngine] Service Worker 註冊成功，範圍:', reg.scope);
                })
                .catch(err => {
                    console.warn('[OfflineEngine] Service Worker 註冊受限 (非致命):', err);
                });
        }
    },

    // 2. 監聽瀏覽器網路狀態
    bindNetworkEvents: function() {
        window.addEventListener('online', () => {
            console.log('[OfflineEngine] 偵測到網路連線恢復！');
            this.updateNetworkBadge();
            if (window.ToastNotification) {
                window.ToastNotification.show('🟢 網路連線已恢復，正在啟動自動雙向同步...', 'success', 3000);
            }
            setTimeout(() => {
                this.processSyncQueue();
            }, 800);
        });

        window.addEventListener('offline', () => {
            console.warn('[OfflineEngine] 偵測到網路已斷開，切換為「離線自主運作模式」');
            this.updateNetworkBadge();
            if (window.ToastNotification) {
                window.ToastNotification.show('📡 已切換至「離線自主運作模式」：所有瀏覽、新增、編輯、改期皆可正常使用，連線後自動同步。', 'warning', 4500);
            }
        });
    },

    // 3. 預熱全域事件快取 (抓取全庫事件以支援離線月份切換)
    async warmupMasterCache() {
        try {
            const res = await fetch('/api/calendar/events');
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'success' && Array.isArray(data.data)) {
                    this.saveEventsToMaster(data.data);
                    console.log(`[OfflineEngine] 已成功預熱 ${data.data.length} 筆全域事件快取！`);
                }
            }
        } catch(e) {
            console.warn('[OfflineEngine] 預熱抓取暫緩:', e.message);
        }
    },

    // 4. 讀取與寫入本機 Master 快取
    getMasterEvents: function() {
        try {
            const raw = localStorage.getItem(this.KEYS.MASTER_EVENTS);
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    },

    saveEventsToMaster: function(serverEvents) {
        try {
            const master = this.getMasterEvents();
            const queue = this.getSyncQueue();
            const offlineCreatedTempIds = queue.filter(q => q.action === 'create').map(q => q.tempId);

            // 保留尚未同步至伺服器的本機離線新增事件
            const unsyncedOfflineEvents = master.filter(ev => offlineCreatedTempIds.includes(ev.id));

            // 合併伺服器資料與離線尚未同步的項目
            const serverEventIds = new Set(serverEvents.map(e => String(e.raw_id || e.id).replace('evt_', '')));
            const merged = [...unsyncedOfflineEvents];

            serverEvents.forEach(srvEvt => {
                const cleanId = String(srvEvt.raw_id || srvEvt.id).replace('evt_', '');
                // 檢查是否本機佇列中有未同步的 patch/update
                const pendingPatch = queue.find(q => q.action === 'patch_status' && String(q.eventId) === cleanId);
                const pendingDate = queue.find(q => q.action === 'update_date' && String(q.eventId) === cleanId);
                const pendingDelete = queue.find(q => q.action === 'delete' && String(q.eventId) === cleanId);

                if (pendingDelete) {
                    return; // 本機已標記刪除，不放入快取
                }

                const finalEvt = { ...srvEvt };
                if (pendingPatch) finalEvt.status = pendingPatch.newStatus;
                if (pendingDate) {
                    finalEvt.meeting_date = pendingDate.targetDate;
                    finalEvt.end_date = pendingDate.targetDate;
                    finalEvt.start = `${pendingDate.targetDate}T${finalEvt.meeting_time || '09:00'}:00`;
                }
                merged.push(finalEvt);
            });

            localStorage.setItem(this.KEYS.MASTER_EVENTS, JSON.stringify(merged));
            localStorage.setItem(this.KEYS.LAST_SYNC, new Date().toISOString());
        } catch(e) {
            console.error('[OfflineEngine] 快取寫入異常:', e);
        }
    },

    // 5. 離線事件查詢 (支援月份、視角與標籤分類過濾)
    getEvents: function(monthStr, perspective = 'admin', category = '') {
        const master = this.getMasterEvents();
        return master.filter(ev => {
            // 月份過濾
            if (monthStr) {
                const mStart = (ev.meeting_date || '').startsWith(monthStr);
                const mEnd = (ev.end_date || '').startsWith(monthStr);
                if (!mStart && !mEnd) return false;
            }

            // 分類過濾
            if (category && category !== 'all' && ev.category !== category) {
                return false;
            }

            // 視角過濾
            if (perspective && perspective !== 'admin') {
                if (Array.isArray(ev.visibility) && !ev.visibility.includes(perspective)) {
                    return false;
                }
                if (perspective === 'senior' && ['work', 'finance'].includes(ev.category)) {
                    return false;
                }
            }

            return true;
        });
    },

    // 6. 離線里程碑倒數計算
    getOfflineMilestones: function() {
        const master = this.getMasterEvents();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const milestones = master.filter(ev => Boolean(ev.is_milestone));
        const list = [];

        milestones.forEach(m => {
            if (!m.meeting_date) return;
            const targetDate = new Date(m.meeting_date);
            targetDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

            if (diffDays >= 0) {
                list.push({
                    id: m.id,
                    title: m.title,
                    meeting_date: m.meeting_date,
                    site_name: m.site_name || '一般',
                    color: m.color || '#D97706',
                    category: m.category || 'work',
                    days_left: diffDays
                });
            }
        });

        list.sort((a, b) => a.days_left - b.days_left);
        return list.slice(0, 5);
    },

    // 7. 同步佇列管理 (Sync Queue Operations)
    getSyncQueue: function() {
        try {
            const raw = localStorage.getItem(this.KEYS.SYNC_QUEUE);
            return raw ? JSON.parse(raw) : [];
        } catch(e) {
            return [];
        }
    },

    saveSyncQueue: function(queue) {
        try {
            localStorage.setItem(this.KEYS.SYNC_QUEUE, JSON.stringify(queue));
            this.updateNetworkBadge();
        } catch(e) {}
    },

    // 離線建立事件
    enqueueCreate: function(payload) {
        const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const colorMap = {
            work: '#2B4C7E',
            travel: '#D97706',
            golf: '#4A7C59',
            finance: '#B91C1C',
            general: '#8C6A4E'
        };

        const newEvent = {
            id: tempId,
            raw_id: tempId,
            title: payload.title || '未命名事件',
            category: payload.category || 'work',
            site_name: payload.site_name || '現場',
            meeting_date: payload.meeting_date,
            meeting_time: payload.meeting_time || '09:00',
            end_date: payload.end_date || payload.meeting_date,
            end_time: payload.end_time || '10:00',
            start: `${payload.meeting_date}T${payload.meeting_time || '09:00'}:00`,
            end: `${payload.end_date || payload.meeting_date}T${payload.end_time || '10:00'}:00`,
            is_milestone: Boolean(payload.is_milestone),
            allDay: Boolean(payload.allDay),
            location: payload.location || '',
            notes: payload.notes || '',
            description: payload.notes || '',
            status: payload.status || 'pending',
            color: colorMap[payload.category] || '#8C6A4E',
            visibility: ['admin', 'senior', 'print'],
            is_offline_created: true
        };

        // 寫入 Master 快取
        const master = this.getMasterEvents();
        master.unshift(newEvent);
        localStorage.setItem(this.KEYS.MASTER_EVENTS, JSON.stringify(master));

        // 寫入佇列
        const queue = this.getSyncQueue();
        queue.push({
            action: 'create',
            tempId: tempId,
            payload: payload,
            timestamp: Date.now()
        });
        this.saveSyncQueue(queue);

        return newEvent;
    },

    // 離線更新事件
    enqueueUpdate: function(cleanId, payload) {
        const master = this.getMasterEvents();
        const evIndex = master.findIndex(e => String(e.raw_id || e.id).replace('evt_', '') === String(cleanId));
        if (evIndex !== -1) {
            Object.assign(master[evIndex], payload);
            master[evIndex].start = `${payload.meeting_date}T${payload.meeting_time || '09:00'}:00`;
            master[evIndex].end = `${payload.end_date || payload.meeting_date}T${payload.end_time || '10:00'}:00`;
            localStorage.setItem(this.KEYS.MASTER_EVENTS, JSON.stringify(master));
        }

        const queue = this.getSyncQueue();
        // 若該事件本身就是離線新增且未同步，直接更新該新增項目的 payload
        const existingCreate = queue.find(q => q.action === 'create' && q.tempId === cleanId);
        if (existingCreate) {
            Object.assign(existingCreate.payload, payload);
        } else {
            queue.push({
                action: 'update',
                eventId: cleanId,
                payload: payload,
                timestamp: Date.now()
            });
        }
        this.saveSyncQueue(queue);
    },

    // 離線變更日期 (拖曳改期)
    enqueueUpdateDate: function(cleanId, targetDate) {
        const master = this.getMasterEvents();
        const ev = master.find(e => String(e.raw_id || e.id).replace('evt_', '') === String(cleanId));
        if (ev) {
            ev.meeting_date = targetDate;
            ev.end_date = targetDate;
            ev.start = `${targetDate}T${ev.meeting_time || '09:00'}:00`;
            localStorage.setItem(this.KEYS.MASTER_EVENTS, JSON.stringify(master));
        }

        const queue = this.getSyncQueue();
        const existingCreate = queue.find(q => q.action === 'create' && q.tempId === cleanId);
        if (existingCreate) {
            existingCreate.payload.meeting_date = targetDate;
            existingCreate.payload.end_date = targetDate;
        } else {
            queue.push({
                action: 'update_date',
                eventId: cleanId,
                targetDate: targetDate,
                timestamp: Date.now()
            });
        }
        this.saveSyncQueue(queue);
    },

    // 離線標記狀態 (completed / urgent / pending)
    enqueuePatchStatus: function(cleanId, newStatus) {
        const master = this.getMasterEvents();
        const ev = master.find(e => String(e.raw_id || e.id).replace('evt_', '') === String(cleanId));
        if (ev) {
            ev.status = newStatus;
            localStorage.setItem(this.KEYS.MASTER_EVENTS, JSON.stringify(master));
        }

        const queue = this.getSyncQueue();
        const existingCreate = queue.find(q => q.action === 'create' && q.tempId === cleanId);
        if (existingCreate) {
            existingCreate.payload.status = newStatus;
        } else {
            queue.push({
                action: 'patch_status',
                eventId: cleanId,
                newStatus: newStatus,
                timestamp: Date.now()
            });
        }
        this.saveSyncQueue(queue);
    },

    // 離線刪除事件
    enqueueDelete: function(cleanId) {
        let master = this.getMasterEvents();
        master = master.filter(e => String(e.raw_id || e.id).replace('evt_', '') !== String(cleanId));
        localStorage.setItem(this.KEYS.MASTER_EVENTS, JSON.stringify(master));

        const queue = this.getSyncQueue();
        const createIndex = queue.findIndex(q => q.action === 'create' && q.tempId === cleanId);
        if (createIndex !== -1) {
            // 本身就是離線新增尚未上雲，直接從佇列移除即可
            queue.splice(createIndex, 1);
        } else {
            queue.push({
                action: 'delete',
                eventId: cleanId,
                timestamp: Date.now()
            });
        }
        this.saveSyncQueue(queue);
    },

    // 8. 雙向同步處理 (Process Sync Queue)
    async processSyncQueue() {
        if (this.isSyncing || !navigator.onLine) return;

        const queue = this.getSyncQueue();
        if (queue.length === 0) return;

        this.isSyncing = true;
        this.updateNetworkBadge();

        console.log(`[OfflineEngine] 正在執行背景雙向同步，佇列待處理筆數: ${queue.length}...`);
        const totalItems = queue.length;
        let successCount = 0;
        const remainingQueue = [];

        for (const item of queue) {
            try {
                if (item.action === 'create') {
                    const res = await fetch('/api/calendar/events', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item.payload)
                    });
                    const data = await res.json();
                    if (res.ok && data.status === 'success') {
                        successCount++;
                        // 若回傳真實 ID，替換本機 master 快取中的暫時 ID
                        const realId = data.id || `evt_${data.raw_id}`;
                        const master = this.getMasterEvents();
                        const target = master.find(e => e.id === item.tempId);
                        if (target) {
                            target.id = realId;
                            target.raw_id = data.raw_id;
                            delete target.is_offline_created;
                            localStorage.setItem(this.KEYS.MASTER_EVENTS, JSON.stringify(master));
                        }
                    } else {
                        remainingQueue.push(item);
                    }
                } else if (item.action === 'update') {
                    const res = await fetch(`/api/calendar/events/${item.eventId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(item.payload)
                    });
                    if (res.ok) successCount++;
                    else remainingQueue.push(item);
                } else if (item.action === 'update_date') {
                    const res = await fetch(`/api/calendar/events/${item.eventId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            meeting_date: item.targetDate,
                            end_date: item.targetDate
                        })
                    });
                    if (res.ok) successCount++;
                    else remainingQueue.push(item);
                } else if (item.action === 'patch_status') {
                    const res = await fetch(`/api/events/${item.eventId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: item.newStatus })
                    });
                    if (res.ok) successCount++;
                    else remainingQueue.push(item);
                } else if (item.action === 'delete') {
                    const res = await fetch(`/api/events/${item.eventId}`, {
                        method: 'DELETE'
                    });
                    if (res.ok) successCount++;
                    else remainingQueue.push(item);
                }
            } catch (err) {
                console.warn('[OfflineEngine] 項目同步遇網路阻斷，保留於佇列:', err.message);
                remainingQueue.push(item);
                break; // 網路不穩，中斷後續等待下次重試
            }
        }

        this.saveSyncQueue(remainingQueue);
        this.isSyncing = false;
        this.updateNetworkBadge();

        if (successCount > 0) {
            console.log(`[OfflineEngine] 背景同步完成！已成功同步 ${successCount} 筆項目。`);
            if (window.ToastNotification) {
                window.ToastNotification.show(`🎉 雙向同步完成！已將 ${successCount} 筆離線異動無縫同步至雲端伺服器。`, 'success', 4000);
            }
            // 重新刷新主行事曆與里程碑以獲取伺服器最終狀態
            if (window.CalEngine) {
                window.CalEngine.loadEvents();
                window.CalEngine.loadMilestones();
            }
        }
    },

    // 9. 更新頂部網路與同步狀態標籤
    updateNetworkBadge: function() {
        const badge = document.getElementById('cal-network-status-badge');
        const textEl = document.getElementById('cal-network-status-text');
        const countEl = document.getElementById('cal-offline-pending-badge');
        if (!badge || !textEl) return;

        const queue = this.getSyncQueue();
        const pendingCount = queue.length;
        const isOnline = navigator.onLine;

        if (countEl) {
            if (pendingCount > 0) {
                countEl.style.display = 'inline-block';
                countEl.innerText = pendingCount;
            } else {
                countEl.style.display = 'none';
            }
        }

        if (this.isSyncing) {
            badge.className = 'net-status-badge syncing';
            textEl.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin"></i> 同步中...`;
            badge.title = `正在將 ${pendingCount} 筆離線異動同步至伺服器`;
        } else if (!isOnline) {
            badge.className = 'net-status-badge offline';
            textEl.innerHTML = `<i class="fa-solid fa-plane"></i> 離線自主模式`;
            badge.title = `網路未連線。目前有 ${pendingCount} 筆操作暫存於本機，將於連線後自動同步。點擊嘗試連線。`;
        } else if (pendingCount > 0) {
            badge.className = 'net-status-badge pending';
            textEl.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> 待同步 (${pendingCount})`;
            badge.title = `有 ${pendingCount} 筆離線操作待上傳，點擊立即同步`;
        } else {
            badge.className = 'net-status-badge online';
            textEl.innerHTML = `<i class="fa-solid fa-cloud-check"></i> 雲端連線正常`;
            badge.title = `即時連線中，資料已全面與伺服器同步。點擊檢查狀態。`;
        }
    },

    // 10. 使用者點擊手動觸發同步
    manualSync: function() {
        if (!navigator.onLine) {
            const queue = this.getSyncQueue();
            if (window.ToastNotification) {
                window.ToastNotification.show(`📡 目前處於無網路離線狀態。系統已安全保留 ${queue.length} 筆待同步操作，連線後將自動無損上傳。`, 'info', 4000);
            }
            return;
        }

        if (window.ToastNotification) {
            window.ToastNotification.show('🔄 正在檢查連線並執行手動雙向同步...', 'info', 2000);
        }
        this.processSyncQueue();
    }
};

// 頁面載入後自動啟動離線引擎
document.addEventListener('DOMContentLoaded', () => {
    window.CalendarOfflineEngine.init();
});
