/**
 * LifeOS Service Worker - 離線自主運作核心 (Offline Autonomous Engine)
 * 支援：App Shell 離線快取、網路切斷自動容錯、動態資產背景更新 (Stale-While-Revalidate)
 */

const CACHE_NAME = 'lifeos-calendar-cache-v1';
const PRECACHE_URLS = [
    '/calendar',
    '/static/manifest.json',
    '/static/css/style.css',
    '/static/js/calendar_engine.js',
    '/static/js/plugins/calendar_offline_engine.js',
    '/static/js/plugins/calendar_dnd_plugin.js',
    '/static/js/plugins/calendar_view_plugin.js',
    '/static/js/plugins/calendar_tag_filter_plugin.js',
    '/static/js/plugins/conflict_detector_plugin.js',
    '/static/js/plugins/modal_context_plugin.js',
    '/static/js/plugins/timezone_engine_plugin.js',
    '/static/js/plugins/lifeos_smart_memory_engine.js'
];

// 安裝 Service Worker 並預先載入關鍵離線資源
self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] 正在預先快取 LifeOS 行事曆核心資源...');
            return cache.addAll(PRECACHE_URLS).catch((err) => {
                console.warn('[ServiceWorker] 部分預先快取資源未能載入 (非致命):', err);
            });
        })
    );
});

// 啟動階段清理舊版快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        console.log('[ServiceWorker] 清除過期快取:', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 攔截網路請求以支援離線自主運作
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // 1. 只處理 GET 請求，POST / PUT / PATCH / DELETE 由前端 CalendarOfflineEngine 佇列管理
    if (request.method !== 'GET') {
        return;
    }

    // 2. 針對頁面導覽 (如 /calendar) 採用 Network-First with Cache Fallback
    if (request.mode === 'navigate' || url.pathname === '/calendar') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    console.log('[ServiceWorker] 離線狀態：從快取載入行事曆頁面');
                    return caches.match('/calendar');
                })
        );
        return;
    }

    // 3. 靜態資源 (JS, CSS, 字型圖標) 採用 Stale-While-Revalidate
    if (url.pathname.startsWith('/static/') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com') || url.hostname.includes('cdnjs.cloudflare.com')) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                const fetchPromise = fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                }).catch(() => cachedResponse);

                return cachedResponse || fetchPromise;
            })
        );
        return;
    }

    // 4. API 請求：優先走網路，若斷網則嘗試快取，失敗則由前端 API 服務層接手離線資料庫
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cached) => {
                        if (cached) return cached;
                        // 若無快取，回傳標準 JSON 離線提示，讓前端調用 LocalStorage
                        return new Response(JSON.stringify({
                            status: 'offline',
                            offline: true,
                            message: '設備目前處於離線狀態'
                        }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
                })
        );
        return;
    }
});
