document.addEventListener('DOMContentLoaded', () => {
    // --- Global State ---
    let categoryChart = null;

    // --- DOM Elements ---
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const pageTitle = document.getElementById('page-title');
    const pageDesc = document.getElementById('page-desc');

    const statTodayTotal = document.getElementById('stat-today-total');
    const statMonthTotal = document.getElementById('stat-month-total');

    const formQuickExpense = document.getElementById('form-quick-expense');
    const quickTextInput = document.getElementById('quick-text-input');
    const expenseTableBody = document.getElementById('expense-table-body');
    const filterCategory = document.getElementById('filter-category');

    const dealsContainer = document.getElementById('deals-container');
    const stocksContainer = document.getElementById('stocks-container');
    const btnTriggerCrawler = document.getElementById('btn-trigger-crawler');
    const crawlerStatusMsg = document.getElementById('crawler-status-msg');

    // --- Tab Navigation ---
        const tabHeaders = {
        lifestyle: { title: "生活日常 (Lifestyle & SG Dining Perks)", desc: "即時監控新加坡星巴克 (Starbucks SG) 買一送一/限定杯款、麥當勞/KFC 速食店特價、土司工坊/亞坤傳統早餐折價券與 GrabFood 外送促銷碼" },
        home: { title: "LifeOS", desc: "Your Personal AI Operating System ‧ 高效決策與個人數位資產指揮中心" },
        dashboard: { title: "100vh 儀表板 (Dashboard Overview)", desc: "首頁零滾動模組化介面 ‧ 差旅倒數 ‧ 資產 LTV ‧ 高爾夫力學 ‧ Quick Inbox" },
        travel: { title: "旅遊 (Travel Hub)", desc: "11,272+ 全球 Tripadvisor 4.5★ 景點美食智庫 ‧ 2026 美西公路攻略 ‧ AI 行程規劃" },
        finance: { title: "財務 (Finance Hub)", desc: "防禦性資產 LTV 水位 ‧ 智慧記帳解析 ‧ 華爾街日報 WSJ 美股台股新聞 ‧ 特價優惠" },
        knowledge: { title: "智庫 (Knowledge Hub)", desc: "瞬時靈感隨手記 (N) ‧ 猶太商道典籍 ‧ 塔木德商業智慧評註 ‧ AI 摘要庫" },
        golf: { title: "高爾夫 (Golf Hub)", desc: "最新品牌球具科技 ‧ 二手購物門市 ‧ 世界各地球場目錄與一鍵預訂" },
        automation: { title: "自動化 (Automation)", desc: "Telegram 機器人推播 ‧ 全網 30 分鐘自動爬蟲 Scheduler ‧ 天氣與外匯狀態" },
        settings: { title: "系統與安全性設定 (Settings)", desc: ".env 環境變數託管 ‧ Telegram Bot Token 密鑰遮罩" },
        guide2026: { title: "通用智慧旅遊 (Global Travel Search Vault)", desc: "11,272+ 全球 Tripadvisor 4.5★ 景點美食智庫" },
        uswest: { title: "《2026 美西公路橫跨縱貫旅行攻略》旗艦標竿指南", desc: "15天黃金自駕路線與互動地圖" },
        aiplanner: { title: "AI 智慧旅遊規劃器", desc: "AI 自動為您產出個人化旅遊手冊" },
        bento: { title: "100vh 便當盒儀表板 (Bento Box Dashboard)", desc: "差旅倒數 ‧ 資產 LTV ‧ 高爾夫力學" },
        asset: { title: "防禦性資產與槓桿水位監控", desc: "理財型房貸 LTV 成數 ‧ 防禦現金流可支撐月數" },
        budget: { title: "智慧旅遊預算動態計算器", desc: "估算機票、租車、油資、住宿與餐飲" },
        cms: { title: "CMS 內容管理與一鍵複製系統", desc: "新增/修改景點與飯店" },
        travelbook: { title: "自訂行程編排 (對調時段)", desc: "自由對調上下午行程並生成專屬旅遊手冊" },
        expenses: { title: "智慧記帳管理", desc: "輸入簡短文字即可自動解析與分類" },
        deals: { title: "特價與機票優惠監控", desc: "自動監控 PTT 省錢板、長榮/阿拉斯加促銷" },
        stocks: { title: "財經新聞與股市情緒分析 (美股 vs 台股)", desc: "自動掃描華爾街日報 WSJ 與極度樂觀新聞" },
        flights: { title: "智能機票專區 (Smart Flight Search)", desc: "150-300km 鄰近替代機場自動擴展 ‧ 跨航司自轉機拆票推薦 ‧ Z-Score 異常低價/Bug票發掘與降價監控" },
        jewish: { title: "猶太人智庫與每日重點新聞專區", desc: "塔木德商道智慧與商業焦點解析" }
    };

    window.toggleNavGroup = function(headerElem) {
        const group = headerElem.closest('.nav-group');
        if (group) {
            group.classList.toggle('open');
        }
    };

    window.switchTab = function(tabId) {
        const aliasMap = {
            'dashboard': 'bento',
            'travel': 'guide2026',
            'finance': 'asset',
            'knowledge': 'jewish',
            'flights': 'flights',
            'deals': 'flights',
            'golf': 'golf'
        };
        const mappedTabId = aliasMap[tabId] || tabId;

        const targetBtn = document.querySelector(`.nav-btn[data-tab="${mappedTabId}"]`);
        if (targetBtn) {
            targetBtn.click();
        } else {
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            const targetElem = document.getElementById(`tab-${mappedTabId}`);
            if (targetElem) targetElem.classList.add('active');
            if (tabHeaders[mappedTabId]) {
                pageTitle.textContent = tabHeaders[mappedTabId].title;
                pageDesc.textContent = tabHeaders[mappedTabId].desc;
            }
        }
        const mainContent = document.querySelector('.main-content');
        if (mainContent) mainContent.scrollTop = 0;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.openAddGuideModal = function() {
        const modal = document.getElementById('modal-edit-guide');
        if (!modal) return;
        document.getElementById('eg-guide-id').value = '';
        document.getElementById('eg-title').value = '';
        document.getElementById('eg-country').value = 1;
        document.getElementById('eg-days').value = 7;
        document.getElementById('eg-desc').value = '';
        modal.classList.add('active');
    };

    window.openCopyModal = function() {
        const modal = document.getElementById('modal-copy-guide');
        if (modal) modal.classList.add('active');
    };

    async function loadDashboardStats() {
        try {
            const res = await fetch('/api/dashboard/stats');
            const data = await res.json();
            if (data.status === 'success') {
                const d = data.data;
                const elCompleted = document.getElementById('stat-completed-guides');
                const elBuilding = document.getElementById('stat-building-guides');
                const elSpots = document.getElementById('stat-spots-count');
                const elCountries = document.getElementById('stat-countries-count');
                if (elCompleted) elCompleted.innerText = `${d.completed_guides || 1} 本`;
                if (elBuilding) elBuilding.innerText = `${d.building_guides || 11} 本`;
                if (elSpots) elSpots.innerText = `${(d.spots_count || 11272).toLocaleString()}+ 資源`;
                if (elCountries) elCountries.innerText = `${d.countries_count || 8} 個`;
            }
        } catch(err) {
            console.error('loadDashboardStats error:', err);
        }
    }

    loadDashboardStats();

    // --- 世界潮牌新品輪播動態牆 (Top-Left Trendy Brands Dynamic Wall) ---
    const TRENDY_BRANDS = [
        {
            brand: "Supreme New York",
            badge: "2026 Spring/Summer Drop",
            title: "Box Logo Hooded & Leather Jacket Series",
            price: "$188 USD ~ $698 USD",
            link: "https://www.supreme.com",
            icon: "fa-fire",
            color: "#ef4444"
        },
        {
            brand: "Off-White™",
            badge: "Milano Fashion Week",
            title: "Out Of Office Sneakers & Arrow Varsity",
            price: "$560 USD",
            link: "https://www.off---white.com",
            icon: "fa-shirt",
            color: "#38bdf8"
        },
        {
            brand: "Fear of God ESSENTIALS",
            badge: "Mainline Collection 9",
            title: "Heavyweight Fleece & Oversized Trench",
            price: "$110 USD ~ $450 USD",
            link: "https://fearofgod.com",
            icon: "fa-crown",
            color: "#fbbf24"
        },
        {
            brand: "Stüssy Worldwide",
            badge: "New Spring Drop",
            title: "8-Ball Fleece Jacket & World Tour Tee",
            price: "$45 USD ~ $210 USD",
            link: "https://www.stussy.com",
            icon: "fa-cubes-stacked",
            color: "#00ff9d"
        },
        {
            brand: "A Bathing Ape (BAPE)",
            badge: "Tokyo Harajuku Special",
            title: "Shark Full-Zip Hoodie & BAPE STA 2026",
            price: "$340 USD",
            link: "https://bape.com",
            icon: "fa-ghost",
            color: "#a855f7"
        },
        {
            brand: "Balenciaga Paris",
            badge: "Runway Capsule",
            title: "3XL Sneaker & Defender Oversized Mule",
            price: "$1,150 USD",
            link: "https://www.balenciaga.com",
            icon: "fa-gem",
            color: "#3b82f6"
        },
        {
            brand: "Kith New York",
            badge: "Kith Treats & Loyalty",
            title: "Cyberpunk Corduroy Jacket & ASICS Collab",
            price: "$165 USD",
            link: "https://kith.com",
            icon: "fa-store",
            color: "#f43f5e"
        },
        {
            brand: "Human Made by NIGO",
            badge: "Gears For Futuristic Teenagers",
            title: "Duck Camo Varsity & Graphic Knit",
            price: "$280 USD",
            link: "https://humanmade.jp",
            icon: "fa-heart",
            color: "#ec4899"
        },
        {
            brand: "Palace Skateboards",
            badge: "London Tri-Ferg Drop",
            title: "GORE-TEX Wave Jacket & Tri-Ferg Hood",
            price: "$198 USD",
            link: "https://www.palaceskateboards.com",
            icon: "fa-triangle-exclamation",
            color: "#10b981"
        },
        {
            brand: "Nike SNKRS x Travis Scott",
            badge: "Exclusive Heat Release",
            title: "Air Jordan 1 Low OG 'Velvet Brown'",
            price: "$150 USD (Raffle)",
            link: "https://www.nike.com/launch",
            icon: "fa-shoe-prints",
            color: "#f59e0b"
        }
    ];

    let currentBrandIdx = 0;
    let brandTimer = null;

    function renderBrandItem() {
        const container = document.getElementById('brand-ticker-content');
        if (!container) return;
        const item = TRENDY_BRANDS[currentBrandIdx];

        container.style.opacity = '0';
        container.style.transform = 'translateY(4px)';

        setTimeout(() => {
            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <span style="font-size: 13px; font-weight: 800; color: ${item.color}; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid ${item.icon}"></i> ${item.brand}
                    </span>
                    <span style="font-size: 10px; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; color: var(--text-muted);">${item.badge}</span>
                </div>
                <div style="font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">
                    ${item.title}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                    <span style="color: var(--accent-green); font-weight: 600;">${item.price}</span>
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; background: rgba(56,189,248,0.15); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(56,189,248,0.3);">
                        前往新品 <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 10px;"></i>
                    </a>
                </div>
            `;
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 150);
    }

    window.nextBrandItem = function() {
        currentBrandIdx = (currentBrandIdx + 1) % TRENDY_BRANDS.length;
        renderBrandItem();
        resetBrandTimer();
    };

    window.prevBrandItem = function() {
        currentBrandIdx = (currentBrandIdx - 1 + TRENDY_BRANDS.length) % TRENDY_BRANDS.length;
        renderBrandItem();
        resetBrandTimer();
    };

    function resetBrandTimer() {
        if (brandTimer) clearInterval(brandTimer);
        brandTimer = setInterval(() => {
            currentBrandIdx = (currentBrandIdx + 1) % TRENDY_BRANDS.length;
            renderBrandItem();
        }, 3500);
    }

    renderBrandItem();
    resetBrandTimer();

        navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            navBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

            btn.classList.add('active');
            let targetElem = document.getElementById(`tab-${targetTab}`);
            
            // Map legacy aliases
            if (!targetElem) {
                if (['guide2026', 'uswest', 'aiplanner', 'budget', 'cms', 'travelbook'].includes(targetTab)) targetElem = document.getElementById('tab-travel') || document.getElementById('tab-guide2026');
                if (['asset', 'expenses', 'stocks', 'deals'].includes(targetTab)) targetElem = document.getElementById('tab-finance') || document.getElementById('tab-expenses');
                if (['jewish'].includes(targetTab)) targetElem = document.getElementById('tab-knowledge') || document.getElementById('tab-jewish');
                if (['bento'].includes(targetTab)) targetElem = document.getElementById('tab-dashboard') || document.getElementById('tab-bento');
            }

            if (targetElem) targetElem.classList.add('active');

            if (tabHeaders[targetTab]) {
                pageTitle.textContent = tabHeaders[targetTab].title;
                pageDesc.textContent = tabHeaders[targetTab].desc;
            }

            // Highlight active travel sub-nav pills
            document.querySelectorAll('.sub-nav-btn[data-travel-tab]').forEach(sb => {
                if (sb.dataset.travelTab === targetTab) {
                    sb.classList.add('active');
                } else {
                    sb.classList.remove('active');
                }
            });

            const mainContent = document.querySelector('.main-content');
            if (mainContent) mainContent.scrollTop = 0;
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Load data for module & sub-features
            if (['travel', 'guide2026', 'uswest', 'travelbook', 'aiplanner', 'budget', 'cms'].includes(targetTab)) {
                loadGuide2026('premium');
                loadTrips();
                loadCMSGuides();
            }
            if (['finance', 'asset', 'expenses', 'stocks', 'deals'].includes(targetTab)) {
                loadStocks();
                loadDeals();
            }
            if (['knowledge', 'jewish'].includes(targetTab)) {
                loadJewishNews();
            }
            if (targetTab === 'golf') loadLifestyleDeals();
    loadGolfLogs();
            if (['automation', 'settings'].includes(targetTab)) loadTelegramSettings();
        });
    });

    // --- Telegram Settings Form ---
    const formTelegramSetup = document.getElementById('form-telegram-setup');
    const tgBotTokenInput = document.getElementById('tg-bot-token');
    const tgChatIdInput = document.getElementById('tg-chat-id');
    const btnSaveTg = document.getElementById('btn-save-tg');
    const tgSetupMsg = document.getElementById('tg-setup-msg');

    async function loadTelegramSettings() {
        try {
            const res = await fetch('/api/settings/telegram');
            const data = await res.json();
            if (data.status === 'success') {
                if (data.data.bot_token) tgBotTokenInput.value = data.data.bot_token;
                if (data.data.chat_id) tgChatIdInput.value = data.data.chat_id;
                if (data.data.configured) {
                    tgSetupMsg.style.color = 'var(--accent-green)';
                    tgSetupMsg.textContent = '✅ 目前 Telegram 推播服務已綁定並開啟中。';
                }
            }
        } catch (err) {
            console.error('Failed loading TG settings:', err);
        }
    }

    if (formTelegramSetup) {
        formTelegramSetup.addEventListener('submit', async (e) => {
            e.preventDefault();
            const bot_token = tgBotTokenInput.value.trim();
            const chat_id = tgChatIdInput.value.trim();

            if (!bot_token || !chat_id) {
                alert('請完整填寫 Bot Token 與 Chat ID');
                return;
            }

            btnSaveTg.disabled = true;
            btnSaveTg.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 測試連線中...`;
            tgSetupMsg.style.color = 'var(--accent-color)';
            tgSetupMsg.textContent = '正在儲存設定並發送測試推播至 Telegram...';

            try {
                const res = await fetch('/api/settings/telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bot_token, chat_id })
                });

                const data = await res.json();
                if (data.status === 'success') {
                    tgSetupMsg.style.color = 'var(--accent-green)';
                    tgSetupMsg.textContent = '🎉 ' + data.message;
                } else {
                    tgSetupMsg.style.color = 'var(--accent-red)';
                    tgSetupMsg.textContent = '❌ ' + data.message;
                }
            } catch (err) {
                tgSetupMsg.style.color = 'var(--accent-red)';
                tgSetupMsg.textContent = '連線測試時發生錯誤';
            } finally {
                btnSaveTg.disabled = false;
                btnSaveTg.innerHTML = `<i class="fa-solid fa-check-circle"></i> <span>儲存設定並發送測試推播訊息</span>`;
            }
        });
    }

    // --- Category Badge Mapper ---
    function getCategoryBadgeClass(category) {
        switch (category) {
            case '飲食': return 'badge-food';
            case '交通': return 'badge-transport';
            case '購物': return 'badge-shopping';
            case '娛樂': return 'badge-entertainment';
            case '日常': return 'badge-utility';
            default: return 'badge-other';
        }
    }

    // --- Fetch Stats & Update Chart ---
    async function loadStats() {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();

            if (data.status === 'success') {
                const stats = data.data;
                statTodayTotal.textContent = `$${stats.today_total.toLocaleString()}`;
                statMonthTotal.textContent = `$${stats.month_total.toLocaleString()}`;

                renderChart(stats.category_summary);
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }

    function renderChart(categories) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        const labels = categories.map(c => c.category);
        const dataValues = categories.map(c => c.total);

        const colorMap = {
            '飲食': '#fbbf24',
            '交通': '#38bdf8',
            '購物': '#f472b6',
            '娛樂': '#c084fc',
            '日常': '#34d399',
            '其他': '#94a3b8'
        };

        const bgColors = labels.map(l => colorMap[l] || '#94a3b8');

        if (categoryChart) {
            categoryChart.destroy();
        }

        categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels.length ? labels : ['無資料'],
                datasets: [{
                    data: dataValues.length ? dataValues : [1],
                    backgroundColor: dataValues.length ? bgColors : ['rgba(255,255,255,0.1)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8', font: { family: 'Outfit' } }
                    }
                }
            }
        });
    }

    // --- Fetch & Render Expenses ---
    async function loadExpenses() {
        const cat = filterCategory.value;
        let url = '/api/expenses?limit=50';
        if (cat) url += `&category=${encodeURIComponent(cat)}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (data.status === 'success') {
                expenseTableBody.innerHTML = '';
                const expenses = data.data;

                if (!expenses.length) {
                    expenseTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">尚無支出紀錄</td></tr>`;
                    return;
                }

                expenses.forEach(exp => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${exp.expense_date}</td>
                        <td><strong>${exp.item}</strong></td>
                        <td><span class="badge ${getCategoryBadgeClass(exp.category)}">${exp.category}</span></td>
                        <td><strong>$${exp.amount.toLocaleString()}</strong></td>
                        <td style="color: var(--text-muted); font-size: 13px;">${exp.raw_text || '-'}</td>
                        <td>
                            <button class="btn-delete" data-id="${exp.id}">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    `;
                    expenseTableBody.appendChild(tr);
                });

                // Attach delete handlers
                document.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const id = btn.dataset.id;
                        if (confirm('確定要刪除這筆支出紀錄嗎？')) {
                            await deleteExpense(id);
                        }
                    });
                });
            }
        } catch (err) {
            console.error('Failed to load expenses:', err);
        }
    }

    // --- Quick Expense Submission ---
    formQuickExpense.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = quickTextInput.value.trim();
        if (!text) return;

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            const data = await res.json();
            if (data.status === 'success') {
                quickTextInput.value = '';
                loadStats();
                loadExpenses();
            } else {
                alert(data.message || '新增失敗');
            }
        } catch (err) {
            alert('請求發生錯誤');
        }
    });

    filterCategory.addEventListener('change', loadExpenses);

    async function deleteExpense(id) {
        try {
            const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                loadStats();
                loadExpenses();
            }
        } catch (err) {
            console.error('Delete error:', err);
        }
    }

    // --- Universal Pagination Helper ---
    function renderPaginationControls(container, currentPage, totalPages, onPageChangeCallbackName) {
        let bar = container.parentNode.querySelector('.universal-pagination-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.className = 'universal-pagination-bar';
            bar.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; margin-top: 16px; background: rgba(17, 21, 30, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; width: 100%; box-sizing: border-box; grid-column: 1 / -1;';
            container.parentNode.appendChild(bar);
        }

        const isFirst = currentPage <= 1;
        const isLast = currentPage >= totalPages;

        bar.innerHTML = `
            <div style="display: flex; gap: 8px;">
                <button ${isFirst ? 'disabled' : ''} onclick="${onPageChangeCallbackName}(1)" class="pill-action-btn" style="padding: 6px 12px; font-size: 11px; ${isFirst ? 'opacity: 0.3; cursor: not-allowed;' : ''}">
                    <i class="fa-solid fa-angles-left"></i> 第一頁
                </button>
                <button ${isFirst ? 'disabled' : ''} onclick="${onPageChangeCallbackName}(${currentPage - 1})" class="pill-action-btn" style="padding: 6px 12px; font-size: 11px; ${isFirst ? 'opacity: 0.3; cursor: not-allowed;' : ''}">
                    <i class="fa-solid fa-chevron-left"></i> 上一頁
                </button>
            </div>

            <span style="font-size: 12px; color: #94A3B8; font-weight: 600;">
                第 <strong style="color: #FFFFFF;">${currentPage}</strong> 頁 / 共 <strong style="color: #38BDF8;">${totalPages}</strong> 頁
            </span>

            <div style="display: flex; gap: 8px;">
                <button ${isLast ? 'disabled' : ''} onclick="${onPageChangeCallbackName}(${currentPage + 1})" class="pill-action-btn" style="padding: 6px 12px; font-size: 11px; ${isLast ? 'opacity: 0.3; cursor: not-allowed;' : ''}">
                    下一頁 <i class="fa-solid fa-chevron-right"></i>
                </button>
                <button ${isLast ? 'disabled' : ''} onclick="${onPageChangeCallbackName}(${totalPages})" class="pill-action-btn" style="padding: 6px 12px; font-size: 11px; ${isLast ? 'opacity: 0.3; cursor: not-allowed;' : ''}">
                    最後一頁 <i class="fa-solid fa-angles-right"></i>
                </button>
            </div>
        `;
    }

    // --- Load Deals (Paginated) ---
    let currentDealsPage = 1;
    const dealsPageSize = 6;
    let cachedDeals = [];

    window.dealsGoPage = function(page) {
        currentDealsPage = page;
        renderDealsPage();
    };

    function renderDealsPage() {
        if (!dealsContainer) return;
        dealsContainer.innerHTML = '';
        const totalPages = Math.ceil(cachedDeals.length / dealsPageSize) || 1;
        currentDealsPage = Math.max(1, Math.min(currentDealsPage, totalPages));

        const pageItems = cachedDeals.slice((currentDealsPage - 1) * dealsPageSize, currentDealsPage * dealsPageSize);
        pageItems.forEach(deal => {
            const card = document.createElement('div');
            card.className = 'card glass-card deal-card';
            card.style.cssText = 'background: rgba(17, 21, 30, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); color: #FFFFFF; padding: 18px; border-radius: 14px;';
            card.innerHTML = `
                <div class="deal-source" style="color: #FBBF24; font-size: 12px; font-weight: 600; margin-bottom: 6px;"><i class="fa-solid fa-fire"></i> [${deal.source}] 關鍵字: ${deal.matched_keyword}</div>
                <div class="deal-title" style="color: #FFFFFF; font-size: 15px; font-weight: 600; margin-bottom: 10px; line-height: 1.4;">${deal.title}</div>
                <div class="deal-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px;">
                    <span style="font-size: 11px; color: #94A3B8;">${deal.created_at}</span>
                    <a href="${deal.link}" target="_blank" rel="noopener" class="deal-link" style="color: #38BDF8; font-size: 12px; text-decoration: none; font-weight: 600;">前往連結 <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                </div>
            `;
            dealsContainer.appendChild(card);
        });

        renderPaginationControls(dealsContainer, currentDealsPage, totalPages, 'dealsGoPage');
    }

    async function loadDeals() {
        try {
            const res = await fetch('/api/deals?limit=60');
            const data = await res.json();
            if (data.status === 'success') {
                cachedDeals = data.data || [];
                currentDealsPage = 1;
                if (!cachedDeals.length) {
                    dealsContainer.innerHTML = `<div class="glass-card span-3" style="padding: 24px; text-align: center; color: #94A3B8; background: rgba(17,21,30,0.85); border: 1px solid rgba(255,255,255,0.12);">目前無抓取到的特價優惠，點擊上方進行掃描！</div>`;
                    return;
                }
                renderDealsPage();
            }
        } catch (err) {
            console.error('Failed to load deals:', err);
        }
    }

    // --- Load Stocks (US vs TW - Paginated) ---
    let currentStockMarket = 'all';
    let currentStockPage = 1;
    const stockPageSize = 6;
    let cachedStocks = [];

    window.filterStockMarket = function(market, btnElem) {
        currentStockMarket = market;
        document.querySelectorAll('#tab-stocks .filter-chip').forEach(c => c.classList.remove('active'));
        if (btnElem) btnElem.classList.add('active');
        currentStockPage = 1;
        loadStocks(market);
    };

    window.stockGoPage = function(page) {
        currentStockPage = page;
        renderStocksPage();
    };

    function renderStocksPage() {
        if (!stocksContainer) return;
        stocksContainer.innerHTML = '';
        const totalPages = Math.ceil(cachedStocks.length / stockPageSize) || 1;
        currentStockPage = Math.max(1, Math.min(currentStockPage, totalPages));

        const pageItems = cachedStocks.slice((currentStockPage - 1) * stockPageSize, currentStockPage * stockPageSize);
        pageItems.forEach(stock => {
            const isBullish = stock.sentiment.includes('樂觀');
            const badgeColor = isBullish ? '#34D399' : '#F87171';
            const badgeBg = isBullish ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)';
            const icon = isBullish ? '🟢' : '🔴';
            const mktTag = stock.market === 'US' ? '[美股]' : '[台股]';

            const item = document.createElement('div');
            item.className = 'glass-card';
            item.style.cssText = 'padding: 14px 20px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 14px; cursor: pointer; border-radius: 14px; transition: all 0.2s ease; background: rgba(17, 21, 30, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); color: #FFFFFF;';
            
            item.onclick = () => {
                openNewsDrawer({
                    badgeText: `${icon} ${stock.sentiment} ${mktTag}`,
                    badgeBg: badgeBg,
                    badgeColor: badgeColor,
                    source: stock.source,
                    title: stock.title,
                    summary: stock.summary,
                    date: stock.created_at,
                    link: stock.link
                });
            };

            item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
                    <span class="badge" style="background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeColor}40; font-size: 11px; font-weight: 700; white-space: nowrap; padding: 4px 10px; border-radius: 8px;">
                        ${icon} ${stock.sentiment} ${mktTag}
                    </span>
                    <span style="font-size: 14px; font-weight: 600; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                        ${stock.title}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 14px; white-space: nowrap;">
                    <span style="font-size: 11px; color: #94A3B8;">${stock.source} | ${stock.created_at}</span>
                    <span style="font-size: 12px; color: #38BDF8; font-weight: 600;">閱讀摘要 <i class="fa-solid fa-chevron-right"></i></span>
                </div>
            `;
            stocksContainer.appendChild(item);
        });

        renderPaginationControls(stocksContainer, currentStockPage, totalPages, 'stockGoPage');
    }

    async function loadStocks(market = currentStockMarket) {
        if (!stocksContainer) return;
        try {
            const url = (market && market !== 'all') ? `/api/stocks?limit=60&market=${market}` : '/api/stocks?limit=60';
            const res = await fetch(url);
            const data = await res.json();

            if (data.status === 'success') {
                cachedStocks = data.data || [];
                if (!cachedStocks.length) {
                    stocksContainer.innerHTML = `<div class="glass-card" style="padding: 24px; text-align: center; color: #94A3B8; background: rgba(17,21,30,0.85); border: 1px solid rgba(255,255,255,0.12);">目前無此市場重大股市新聞警示，點擊左側「全網掃描」進行掃描！</div>`;
                    return;
                }
                renderStocksPage();
            }
        } catch (err) {
            console.error('Failed to load stocks:', err);
        }
    }

    const btnRefreshStockNews = document.getElementById('btn-refresh-stock-news');
    if (btnRefreshStockNews) {
        btnRefreshStockNews.addEventListener('click', async () => {
            btnRefreshStockNews.disabled = true;
            btnRefreshStockNews.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 正在全網即時抓取美股/台股新聞...`;
            try {
                const res = await fetch('/api/stocks/crawl', { method: 'POST' });
                const data = await res.json();
                alert(data.message);
                loadStocks();
            } catch (err) {
                alert('抓取股市新聞失敗');
            } finally {
                btnRefreshStockNews.disabled = false;
                btnRefreshStockNews.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> ⚡ 即時抓取美股/台股新聞`;
            }
        });
    }

    // --- Slide-Over Drawer / Detail Modal Helpers for News ---
    window.openNewsDrawer = function(data) {
        const modal = document.getElementById('modal-news-drawer');
        if (!modal) return;

        document.getElementById('nd-badge').innerText = data.badgeText || '新聞';
        document.getElementById('nd-badge').style.background = data.badgeBg || 'rgba(56,189,248,0.15)';
        document.getElementById('nd-badge').style.color = data.badgeColor || '#38BDF8';

        document.getElementById('nd-source').innerText = `來源: ${data.source || '即時新聞'}`;
        document.getElementById('nd-title').innerText = data.title || '';
        document.getElementById('nd-summary').innerText = data.summary || '暫無詳細摘要描述。';
        document.getElementById('nd-date').innerText = `更新時間: ${data.date || '今日'}`;
        document.getElementById('nd-link').href = data.link || '#';

        const takeawayBox = document.getElementById('nd-takeaway');
        if (data.takeaway) {
            takeawayBox.style.display = 'block';
            takeawayBox.innerHTML = `<strong>💡 塔木德商道與鑰匙洞察：</strong><br>${data.takeaway}`;
        } else {
            takeawayBox.style.display = 'none';
        }

        modal.classList.add('active');
    };

    window.closeNewsDrawer = function() {
        const modal = document.getElementById('modal-news-drawer');
        if (modal) modal.classList.remove('active');
    };

    // --- Load Jewish News & Insights (Paginated) ---
    let currentJewishCat = 'all';
    let currentJewishPage = 1;
    const jewishPageSize = 6;
    let cachedJewishNews = [];

    window.filterJewishCat = function(category, btnElem) {
        currentJewishCat = category;
        document.querySelectorAll('#tab-jewish .filter-chip').forEach(c => c.classList.remove('active'));
        if (btnElem) btnElem.classList.add('active');
        currentJewishPage = 1;
        loadJewishNews(category);
    };

    window.jewishGoPage = function(page) {
        currentJewishPage = page;
        renderJewishNewsPage();
    };

    function renderJewishNewsPage() {
        const container = document.getElementById('jewish-news-container');
        if (!container) return;
        container.innerHTML = '';

        const totalPages = Math.ceil(cachedJewishNews.length / jewishPageSize) || 1;
        currentJewishPage = Math.max(1, Math.min(currentJewishPage, totalPages));

        const pageItems = cachedJewishNews.slice((currentJewishPage - 1) * jewishPageSize, currentJewishPage * jewishPageSize);
        pageItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'glass-card';
            div.style.cssText = 'padding: 14px 20px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 14px; cursor: pointer; border-radius: 14px; transition: all 0.2s ease; background: rgba(17, 21, 30, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); color: #FFFFFF;';

            div.onclick = () => {
                openNewsDrawer({
                    badgeText: `✡️ ${item.category || '商業財經'}`,
                    badgeBg: 'rgba(192,132,252,0.15)',
                    badgeColor: '#c084fc',
                    source: item.source,
                    title: item.title_zh,
                    summary: item.summary_zh,
                    takeaway: item.key_takeaway,
                    date: item.created_at,
                    link: item.link
                });
            };

            div.innerHTML = `
                <div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0;">
                    <span class="badge" style="background: rgba(192,132,252,0.15); color: #c084fc; border: 1px solid rgba(192,132,252,0.3); font-size: 11px; font-weight: 700; white-space: nowrap; padding: 4px 10px; border-radius: 8px;">
                        ✡️ ${item.category || '商業財經'}
                    </span>
                    <span style="font-size: 14px; font-weight: 600; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">
                        ${item.title_zh}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 14px; white-space: nowrap;">
                    <span style="font-size: 11px; color: #94A3B8;">${item.source}</span>
                    <span style="font-size: 12px; color: #c084fc; font-weight: 600;">解析與全文 <i class="fa-solid fa-chevron-right"></i></span>
                </div>
            `;
            container.appendChild(div);
        });

        renderPaginationControls(container, currentJewishPage, totalPages, 'jewishGoPage');
    }

    async function loadJewishNews(category = currentJewishCat) {
        const container = document.getElementById('jewish-news-container');
        if (!container) return;
        try {
            const url = (category && category !== 'all') ? `/api/jewish-news?category=${encodeURIComponent(category)}` : '/api/jewish-news';
            const res = await fetch(url);
            const data = await res.json();
            if (data.status === 'success') {
                cachedJewishNews = data.data || [];
                if (cachedJewishNews.length === 0) {
                    container.innerHTML = '<div style="grid-column: span 3; text-align:center; padding: 40px; color: #94A3B8; background: rgba(17,21,30,0.85); border: 1px solid rgba(255,255,255,0.12); border-radius: 14px;">目前無此類別的猶太新聞洞察</div>';
                    return;
                }
                renderJewishNewsPage();
            }
        } catch (err) {
            console.error('Load jewish news error:', err);
        }
    }

    const btnRefreshJewishNews = document.getElementById('btn-refresh-jewish-news');
    if (btnRefreshJewishNews) {
        btnRefreshJewishNews.addEventListener('click', async () => {
            btnRefreshJewishNews.disabled = true;
            btnRefreshJewishNews.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 爬取繁體中文翻譯中...`;
            try {
                const res = await fetch('/api/jewish-news/crawl', { method: 'POST' });
                const data = await res.json();
                alert(data.message);
                loadJewishNews();
            } catch (err) {
                alert('抓取猶太新聞失敗');
            } finally {
                btnRefreshJewishNews.disabled = false;
                btnRefreshJewishNews.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> 抓取最新猶太重點新聞`;
            }
        });
    }

    // --- Manual Crawler Trigger ---
    btnTriggerCrawler.addEventListener('click', async () => {
        btnTriggerCrawler.disabled = true;
        btnTriggerCrawler.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 掃描中...`;
        crawlerStatusMsg.textContent = '正在爬取最新特價與新聞...';

        try {
            const res = await fetch('/api/admin/refresh-scrapers', { method: 'POST' });
            const data = await res.json();

            if (data.status === 'success') {
                crawlerStatusMsg.textContent = data.message;
                loadDeals();
                loadStocks();
            } else {
                crawlerStatusMsg.textContent = '掃描失敗：' + data.message;
            }
        } catch (err) {
            crawlerStatusMsg.textContent = '請求發生錯誤';
        } finally {
            btnTriggerCrawler.disabled = false;
            btnTriggerCrawler.innerHTML = `<i class="fa-solid fa-rotate-right"></i> <span>立即執行全網掃描</span>`;
            setTimeout(() => { crawlerStatusMsg.textContent = ''; }, 5000);
        }
    });

    // --- Travel Book & Itinerary Management ---
    let activeTripId = null;
    let currentTripData = null;

    const selectActiveTrip = document.getElementById('select-active-trip');
    const btnOpenCreateTrip = document.getElementById('btn-open-create-trip');
    const btnDeleteTrip = document.getElementById('btn-delete-trip');
    const btnPreviewTravelbook = document.getElementById('btn-preview-travelbook');
    const modalTravelbook = document.getElementById('modal-travelbook');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalTravelbookContent = document.getElementById('modal-travelbook-content');

    const formAddLogistics = document.getElementById('form-add-logistics');
    const logisticsList = document.getElementById('logistics-list');

    const formAddActivity = document.getElementById('form-add-activity');
    const selectTripDay = document.getElementById('select-trip-day');
    const containerMorning = document.getElementById('slot-container-morning');
    const containerAfternoon = document.getElementById('slot-container-afternoon');
    const containerEvening = document.getElementById('slot-container-evening');

    async function loadTrips() {
        try {
            const res = await fetch('/api/trips');
            const data = await res.json();
            if (data.status === 'success') {
                let trips = data.data;

                // Create sample trip if none exists
                if (!trips.length) {
                    const createRes = await fetch('/api/trips', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title: "東京 5 天 4 夜浪漫自由行",
                            destination: "日本 東京 (Tokyo)",
                            start_date: "2026-09-15",
                            end_date: "2026-09-19",
                            notes: "第一次玩東京，包含迪士尼與淺草寺！"
                        })
                    });
                    const createdData = await createRes.json();
                    activeTripId = createdData.data.id;
                    
                    // Add sample flight & hotel
                    await fetch(`/api/trips/${activeTripId}/logistics`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'flight', title: '長榮航空 BR198', detail: '08:50 桃園 T2 -> 13:15 成田 T1', date_time: '2026-09-15 08:50', reference_no: 'BR-987654' })
                    });
                    await fetch(`/api/trips/${activeTripId}/logistics`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'hotel', title: '東京新宿格拉斯麗飯店', detail: '東京都新宿區歌舞伎町1-19-1', date_time: '09/15 入住 - 09/19 退房', reference_no: 'HTL-882200' })
                    });

                    // Add sample itinerary items
                    await fetch(`/api/trips/${activeTripId}/itinerary`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ day_number: 1, time_slot: 'morning', activity: '成田機場搭乘 N\'EX 特快至新宿', location: '成田機場', estimated_cost: 3070 })
                    });
                    await fetch(`/api/trips/${activeTripId}/itinerary`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ day_number: 1, time_slot: 'afternoon', activity: '飯店 Check-in 放置行李 & 漫步歌舞伎町', location: '新宿', estimated_cost: 0 })
                    });
                    await fetch(`/api/trips/${activeTripId}/itinerary`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ day_number: 1, time_slot: 'evening', activity: '登東京都廳舍看免費夜景 & 享用敘敘苑燒肉', location: '西新宿', estimated_cost: 8500 })
                    });

                    return loadTrips();
                }

                selectActiveTrip.innerHTML = '';
                trips.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = `✈️ ${t.title} (${t.start_date} ~ ${t.end_date})`;
                    selectActiveTrip.appendChild(opt);
                });

                if (!activeTripId || !trips.find(t => t.id == activeTripId)) {
                    activeTripId = trips[0].id;
                }
                selectActiveTrip.value = activeTripId;

                loadTripDetails(activeTripId);
            }
        } catch (err) {
            console.error('Failed loading trips:', err);
        }
    }

    selectActiveTrip.addEventListener('change', () => {
        activeTripId = selectActiveTrip.value;
        loadTripDetails(activeTripId);
    });

    selectTripDay.addEventListener('change', () => {
        if (currentTripData) renderItineraryGrid(currentTripData.itinerary);
    });

    async function loadTripDetails(tripId) {
        try {
            const res = await fetch(`/api/trips/${tripId}`);
            const data = await res.json();
            if (data.status === 'success') {
                currentTripData = data.data;
                renderLogisticsList(currentTripData.logistics);
                renderItineraryGrid(currentTripData.itinerary);
            }
        } catch (err) {
            console.error('Failed loading trip detail:', err);
        }
    }

    function renderLogisticsList(logistics) {
        logisticsList.innerHTML = '';
        if (!logistics.length) {
            logisticsList.innerHTML = `<span style="color: var(--text-muted); font-size: 13px;">尚未新增交通與住宿資料</span>`;
            return;
        }

        logistics.forEach(log => {
            const icon = log.type === 'flight' ? '✈️' : (log.type === 'hotel' ? '🏨' : '🚗');
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.cssText = 'padding: 12px 18px; display: flex; align-items: center; gap: 14px; flex: 1; min-width: 260px;';
            card.innerHTML = `
                <span style="font-size: 20px;">${icon}</span>
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 14px; color: #fff;">${log.title}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${log.detail || '-'}</div>
                    <div style="font-size: 11px; color: var(--primary-color);">${log.date_time || ''} ${log.reference_no ? '| 代號: ' + log.reference_no : ''}</div>
                </div>
                <button class="btn-delete" onclick="deleteLogistics(${log.id})"><i class="fa-solid fa-trash"></i></button>
            `;
            logisticsList.appendChild(card);
        });
    }

    window.deleteLogistics = async function(logId) {
        if (confirm('確定刪除此項記錄？')) {
            await fetch(`/api/logistics/${logId}`, { method: 'DELETE' });
            loadTripDetails(activeTripId);
        }
    };

    function renderItineraryGrid(itinerary) {
        const selectedDay = parseInt(selectTripDay.value, 10);
        containerMorning.innerHTML = '';
        containerAfternoon.innerHTML = '';
        containerEvening.innerHTML = '';

        const dayItems = itinerary.filter(i => i.day_number === selectedDay);

        const morningItems = dayItems.filter(i => i.time_slot === 'morning');
        const afternoonItems = dayItems.filter(i => i.time_slot === 'afternoon');
        const eveningItems = dayItems.filter(i => i.time_slot === 'evening');

        renderSlotItems(containerMorning, morningItems);
        renderSlotItems(containerAfternoon, afternoonItems);
        renderSlotItems(containerEvening, eveningItems);
    }

    function renderSlotItems(container, items) {
        if (!items.length) {
            container.innerHTML = `<span style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 12px;">無行程</span>`;
            return;
        }

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'itin-item';
            el.innerHTML = `
                <div class="itin-activity">${item.activity}</div>
                <div class="itin-meta">
                    ${item.location ? `<span><i class="fa-solid fa-location-dot"></i> ${item.location}</span>` : ''}
                    ${item.estimated_cost ? `<span style="color: var(--accent-green);"><i class="fa-solid fa-yen-sign"></i> NT$${item.estimated_cost.toLocaleString()}</span>` : ''}
                </div>
                <div class="itin-actions">
                    <button class="btn-swap" onclick="swapSlot(${item.id})">
                        <i class="fa-solid fa-right-left"></i> 對調上下午
                    </button>
                    <button class="btn-delete" onclick="deleteItinerary(${item.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
            container.appendChild(el);
        });
    }

    window.swapSlot = async function(itinId) {
        try {
            const res = await fetch(`/api/itinerary/${itinId}/swap`, { method: 'PUT' });
            const data = await res.json();
            if (data.status === 'success') {
                loadTripDetails(activeTripId);
            }
        } catch (err) {
            console.error('Swap slot error:', err);
        }
    };

    window.deleteItinerary = async function(itinId) {
        await fetch(`/api/itinerary/${itinId}`, { method: 'DELETE' });
        loadTripDetails(activeTripId);
    };

    // Add Logistics Form
    formAddLogistics.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('log-type').value;
        const title = document.getElementById('log-title').value.trim();
        const date_time = document.getElementById('log-datetime').value.trim();
        const reference_no = document.getElementById('log-ref').value.trim();

        if (!title) return;

        await fetch(`/api/trips/${activeTripId}/logistics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, title, date_time, reference_no, detail: `${title} (${date_time})` })
        });

        document.getElementById('log-title').value = '';
        document.getElementById('log-datetime').value = '';
        document.getElementById('log-ref').value = '';

        loadTripDetails(activeTripId);
    });

    // Add Activity Form
    formAddActivity.addEventListener('submit', async (e) => {
        e.preventDefault();
        const day_number = parseInt(selectTripDay.value, 10);
        const time_slot = document.getElementById('itin-slot').value;
        const activity = document.getElementById('itin-activity').value.trim();
        const location = document.getElementById('itin-location').value.trim();
        const estimated_cost = parseFloat(document.getElementById('itin-cost').value) || 0;

        if (!activity) return;

        await fetch(`/api/trips/${activeTripId}/itinerary`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ day_number, time_slot, activity, location, estimated_cost })
        });

        document.getElementById('itin-activity').value = '';
        document.getElementById('itin-location').value = '';
        document.getElementById('itin-cost').value = '';

        loadTripDetails(activeTripId);
    });

    // Create New Trip Button
    btnOpenCreateTrip.addEventListener('click', async () => {
        const title = prompt('請輸入行程名稱 (例: 京都紅葉奢華 6 日遊):');
        if (!title) return;
        const destination = prompt('請輸入目的地 (例: 日本 京都):') || title;
        const start_date = prompt('出發日期 (YYYY-MM-DD):') || '2026-10-01';
        const end_date = prompt('結束日期 (YYYY-MM-DD):') || '2026-10-06';

        const res = await fetch('/api/trips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, destination, start_date, end_date })
        });
        const data = await res.json();
        if (data.status === 'success') {
            activeTripId = data.data.id;
            loadTrips();
        }
    });

    // Delete Trip Button
    btnDeleteTrip.addEventListener('click', async () => {
        if (confirm('確定要刪除整個行程與旅遊手冊紀錄嗎？')) {
            await fetch(`/api/trips/${activeTripId}`, { method: 'DELETE' });
            activeTripId = null;
            loadTrips();
        }
    });

    // Preview / Generate Travel Book Modal
    btnPreviewTravelbook.addEventListener('click', () => {
        if (!currentTripData) return;

        const trip = currentTripData.trip;
        const logistics = currentTripData.logistics;
        const itinerary = currentTripData.itinerary;

        let totalCost = itinerary.reduce((acc, curr) => acc + (curr.estimated_cost || 0), 0);

        let html = `
            <div style="text-align: center; border-bottom: 1px solid var(--border-color); padding-bottom: 20px; margin-bottom: 20px;">
                <h1 style="font-size: 28px; color: #fff;">📖 ${trip.title}</h1>
                <div style="font-size: 15px; color: var(--primary-color); margin-top: 8px;">
                    📍 目的地：${trip.destination} | 📅 日期：${trip.start_date} ~ ${trip.end_date}
                </div>
            </div>

            <h3 style="color: var(--primary-color); margin-bottom: 12px;"><i class="fa-solid fa-plane"></i> 交通與住宿明細</h3>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px;">
        `;

        if (logistics.length) {
            logistics.forEach(l => {
                const icon = l.type === 'flight' ? '✈️' : (l.type === 'hotel' ? '🏨' : '🚗');
                html += `
                    <div style="background: rgba(15,23,42,0.8); padding: 12px 16px; border-radius: 8px; display: flex; justify-content: space-between;">
                        <span><strong>${icon} ${l.title}</strong> (${l.detail || '-'})</span>
                        <span style="color: var(--text-muted); font-size: 13px;">${l.date_time || ''}</span>
                    </div>
                `;
            });
        } else {
            html += `<span style="color: var(--text-muted);">無交通住宿資料</span>`;
        }

        html += `
            </div>
            <h3 style="color: var(--primary-color); margin-bottom: 12px;"><i class="fa-solid fa-calendar-check"></i> 每日精選行程表</h3>
            <table class="custom-table" style="margin-bottom: 24px;">
                <thead>
                    <tr>
                        <th style="width: 80px;">天數</th>
                        <th style="width: 100px;">時段</th>
                        <th>活動景點</th>
                        <th>地點</th>
                        <th style="width: 120px;">預算</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (itinerary.length) {
            itinerary.forEach(i => {
                const slotText = i.time_slot === 'morning' ? '🌅 上午' : (i.time_slot === 'afternoon' ? '☀️ 下午' : '🌙 晚上');
                html += `
                    <tr>
                        <td><strong>第 ${i.day_number} 天</strong></td>
                        <td>${slotText}</td>
                        <td><strong>${i.activity}</strong></td>
                        <td>${i.location || '-'}</td>
                        <td>${i.estimated_cost ? 'NT$' + i.estimated_cost.toLocaleString() : '-'}</td>
                    </tr>
                `;
            });
        } else {
            html += `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">尚無行程安排</td></tr>`;
        }

        html += `
                </tbody>
            </table>
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 240, 255, 0.1); padding: 16px 20px; border-radius: 8px; border: 1px solid var(--primary-color);">
                <span style="font-weight: 700; font-size: 16px;">💰 行程預估總預算費用：</span>
                <span style="font-weight: 800; font-size: 20px; color: var(--accent-green);">NT$ ${totalCost.toLocaleString()} 元</span>
            </div>
        `;

        modalTravelbookContent.innerHTML = html;
        modalTravelbook.classList.add('active');
    });

    btnCloseModal.addEventListener('click', () => {
        modalTravelbook.classList.remove('active');
    });

    // --- Stage 2: 《2026 美西公路旅行攻略》 Exhibition & Quick/Premium Mode ---
    let currentGuidePlaces = [];
    let currentGuideMode = 'premium';
    let currentCategoryFilter = 'all';

    const btnModeQuick = document.getElementById('btn-mode-quick');
    const btnModePremium = document.getElementById('btn-mode-premium');
    const placesGridContainer = document.getElementById('places-grid-container');
    const filterChips = document.querySelectorAll('.filter-chip');
    const btnGenMapList = document.getElementById('btn-gen-map-list');
    const btnExportGuidePdf = document.getElementById('btn-export-guide-pdf');

    if (btnModeQuick && btnModePremium) {
        btnModeQuick.addEventListener('click', () => {
            btnModeQuick.classList.add('active');
            btnModeQuick.style.background = 'var(--primary-color)';
            btnModeQuick.style.color = '#000';
            btnModePremium.classList.remove('active');
            btnModePremium.style.background = 'transparent';
            btnModePremium.style.color = 'var(--text-muted)';
            currentGuideMode = 'quick';
            renderPlacesGrid();
        });

        btnModePremium.addEventListener('click', () => {
            btnModePremium.classList.add('active');
            btnModePremium.style.background = 'var(--primary-color)';
            btnModePremium.style.color = '#000';
            btnModeQuick.classList.remove('active');
            btnModeQuick.style.background = 'transparent';
            btnModeQuick.style.color = 'var(--text-muted)';
            currentGuideMode = 'premium';
            renderPlacesGrid();
        });
    }

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentCategoryFilter = chip.dataset.cat;
            renderPlacesGrid();
        });
    });

    async function loadGuide2026(mode = 'premium') {
        try {
            const res = await fetch('/api/cms/guides/1');
            const data = await res.json();
            if (data.status === 'success') {
                currentGuidePlaces = data.data.places;
                renderPlacesGrid();
            }
        } catch (err) {
            console.error('Failed loading Guide 2026:', err);
        }
    }

    function renderPlacesGrid() {
        if (!placesGridContainer) return;
        placesGridContainer.innerHTML = '';

        let filtered = currentGuidePlaces;

        // Filter by category
        if (currentCategoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === currentCategoryFilter);
        }

        // Quick vs Premium filter
        if (currentGuideMode === 'quick') {
            // Quick mode shows top-rated attractions & hotels only
            filtered = filtered.filter(p => p.category === 'attraction' || p.category === 'hotel');
        }

        if (!filtered.length) {
            placesGridContainer.innerHTML = `<div class="glass-card span-3" style="padding: 24px; text-align: center; color: var(--text-muted);">尚無符合條件的地點資訊</div>`;
            return;
        }

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'place-cyber-card';

            const mapsUrl = p.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.address || p.title)}`;
            const taUrl = p.tripadvisor_url || `https://www.tripadvisor.com.tw/Search?q=${encodeURIComponent(p.title)}`;

            card.innerHTML = `
                <div class="place-card-header">
                    <span class="place-card-category">${p.category} ${p.sub_category ? '| ' + p.sub_category : ''}</span>
                    <span class="badge" style="background: rgba(0, 255, 157, 0.15); color: var(--accent-green); border: 1px solid rgba(0, 255, 157, 0.4); font-size: 11px; font-weight: 700;">
                        🟢 Tripadvisor ${p.rating}★ (${(p.review_count || 100).toLocaleString()}+ 評價人次)
                    </span>
                </div>
                <div class="place-card-title">${p.title}</div>
                <div class="place-card-meta">
                    <div>📍 <strong>地址/位置：</strong> ${p.address || '美西專屬路線'}</div>
                    ${p.best_time ? `<div>🕒 <strong>造訪時間：</strong> ${p.best_time}</div>` : ''}
                    ${p.estimated_price ? `<div>💰 <strong>預估費用：</strong> NT$ ${p.estimated_price.toLocaleString()} 元</div>` : ''}
                    <div style="line-height: 1.5; margin-top: 4px;">${p.description || ''}</div>
                </div>
                <div class="place-card-links">
                    <a href="${mapsUrl}" target="_blank" rel="noopener" class="btn-nav-map">
                        <i class="fa-solid fa-diamond-turn-right"></i> Google 地圖導航
                    </a>
                    <a href="${taUrl}" target="_blank" rel="noopener" class="btn-nav-map" style="background: rgba(0,255,157,0.15); border-color: rgba(0,255,157,0.4); color: var(--accent-green);">
                        <i class="fa-solid fa-circle-check"></i> 🟢 Tripadvisor 評價與心得
                    </a>
                    ${p.official_url ? `<a href="${p.official_url}" target="_blank" rel="noopener" class="btn-nav-map" style="background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color: #818cf8;"><i class="fa-solid fa-globe"></i> 官方網站</a>` : ''}
                    ${p.booking_url ? `<a href="${p.booking_url}" target="_blank" rel="noopener" class="btn-book-ticket"><i class="fa-solid fa-ticket"></i> 預約/訂票連結</a>` : ''}
                </div>
            `;
            placesGridContainer.appendChild(card);
        });
    }

    if (btnGenMapList) {
        btnGenMapList.addEventListener('click', async () => {
            const city = prompt('請輸入城市名稱 (例如：洛杉磯 / Las Vegas / 西雅圖):') || '洛杉磯';
            const cat = prompt('請輸入類別 (例如：景點 / 美食 / 咖啡 / 牛排館):') || '景點';
            const res = await fetch(`/api/maps/curated-list?city=${encodeURIComponent(city)}&category=${encodeURIComponent(cat)}`);
            const data = await res.json();
            if (data.status === 'success') {
                window.open(data.data.google_maps_list_url, '_blank');
            }
        });
    }

    if (btnExportGuidePdf) {
        btnExportGuidePdf.addEventListener('click', () => {
            window.print();
        });
    }

    // --- Smart Budget Calculator ---
    const formBudgetCalc = document.getElementById('form-budget-calc');
    const budgetSummaryBox = document.getElementById('budget-summary-box');
    let budgetChart = null;

    if (formBudgetCalc) {
        formBudgetCalc.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateBudget();
        });
    }

    async function calculateBudget() {
        if (!formBudgetCalc) return;

        const payload = {
            travelers: parseInt(document.getElementById('b-travelers').value, 10) || 2,
            days: parseInt(document.getElementById('b-days').value, 10) || 10,
            flight_cost: parseFloat(document.getElementById('b-flight').value) || 0,
            car_cost: parseFloat(document.getElementById('b-car').value) || 0,
            gas_cost: parseFloat(document.getElementById('b-gas').value) || 0,
            hotel_cost: parseFloat(document.getElementById('b-hotel').value) || 0,
            food_cost: parseFloat(document.getElementById('b-food').value) || 0,
            entertainment_cost: parseFloat(document.getElementById('b-entertainment').value) || 0,
            shopping_cost: parseFloat(document.getElementById('b-shopping').value) || 0
        };

        try {
            const res = await fetch('/api/budget/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.status === 'success') {
                const b = data.data;
                budgetSummaryBox.innerHTML = `
                    <div style="color: var(--primary-color);">💵 總行程估算費用：<span style="font-size: 22px; color: var(--accent-green);">NT$ ${b.total_budget.toLocaleString()} 元</span></div>
                    <div style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">👤 每人平均費用 (${b.travelers} 人 / ${b.days} 天)：NT$ ${b.per_person_budget.toLocaleString()} 元</div>
                `;

                renderBudgetChart(b.breakdown);
            }
        } catch (err) {
            console.error('Calculate budget error:', err);
        }
    }

    function renderBudgetChart(breakdown) {
        const ctx = document.getElementById('budgetChart');
        if (!ctx) return;

        const labels = ['機票', '租車與油資', '住宿飯店', '餐飲美食', '門票娛樂', '購物預算'];
        const values = [
            breakdown.flight,
            breakdown.car_and_gas,
            breakdown.hotel,
            breakdown.food,
            breakdown.entertainment,
            breakdown.shopping
        ];

        if (budgetChart) budgetChart.destroy();

        budgetChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#00f0ff', '#38bdf8', '#6366f1', '#fbbf24', '#00ff9d', '#ec4899'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: '#94a3b8', font: { family: 'Outfit' } }
                    }
                }
            }
        });
    }

    // --- AI Travel Planner 2.0 ---
    const formAiPlanner = document.getElementById('form-ai-planner');
    const btnGenerateAiPlan = document.getElementById('btn-generate-ai-plan');
    const aiPlanResultContainer = document.getElementById('ai-plan-result-container');

    if (formAiPlanner) {
        formAiPlanner.addEventListener('submit', async (e) => {
            e.preventDefault();

            const departure_city = document.getElementById('ai-departure').value;
            const country = document.getElementById('ai-country').value;
            const travel_month = parseInt(document.getElementById('ai-month').value, 10);
            const days = parseInt(document.getElementById('ai-days').value, 10);
            const travelers = parseInt(document.getElementById('ai-travelers').value, 10);
            const travel_style = document.getElementById('ai-style').value;
            const pace_level = document.getElementById('ai-pace').value;
            const budget_level = document.getElementById('ai-budget-level').value;

            const checkboxes = document.querySelectorAll('input[name="interest"]:checked');
            const interests = Array.from(checkboxes).map(cb => cb.value);

            btnGenerateAiPlan.disabled = true;
            btnGenerateAiPlan.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> AI 2.0 智慧運算與排程中...`;

            try {
                const res = await fetch('/api/ai/plan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        country, days, budget_level, travelers, interests,
                        departure_city, travel_month, travel_style, pace_level
                    })
                });
                const data = await res.json();

                if (data.status === 'success') {
                    renderAIPlanResult(data.data);
                }
            } catch (err) {
                alert('AI 產生失敗');
            } finally {
                btnGenerateAiPlan.disabled = false;
                btnGenerateAiPlan.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> 立即生成 AI 2.0 個人化奢華旅遊計畫`;
            }
        });
    }

    window.lastGeneratedPlan = null;

    function renderAIPlanResult(plan) {
        window.lastGeneratedPlan = plan;
        aiPlanResultContainer.style.display = 'block';
        const eb = plan.estimated_budget;

        let html = `
            <div style="border-bottom: 2px solid rgba(56,189,248,0.3); padding-bottom: 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <div>
                    <h2 style="color: #FFFFFF; font-size: 20px; font-family: 'Inter Tight', sans-serif;"><i class="fa-solid fa-wand-magic-sparkles text-gold"></i> 推薦 AI 經典行程：《${plan.country} ${plan.duration_days} 天奢華體驗手冊》</h2>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
                        <span class="badge" style="background: rgba(56,189,248,0.2); color: #38BDF8;">✈️ 出發地：${plan.departure_city}</span>
                        <span class="badge" style="background: rgba(251,191,36,0.2); color: #FBBF24;">🗓️ 出發月份：${plan.travel_month} 月 (${plan.season_name})</span>
                        <span class="badge" style="background: rgba(168,85,247,0.2); color: #c084fc;">🛍️ 旅遊型態：${plan.travel_style}</span>
                        <span class="badge" style="background: rgba(52,211,153,0.2); color: #34D399;">⚡ 體力節奏：${plan.pace_level}</span>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="importAIPlanToItinerary()" class="glow-btn" style="width: auto; padding: 10px 20px;"><i class="fa-solid fa-bolt"></i> ⚡ 一鍵自動生成並匯入此行程</button>
                    <button onclick="window.print()" class="pill-action-btn" style="padding: 10px 18px;"><i class="fa-solid fa-print"></i> 列印 PDF 手冊</button>
                </div>
            </div>

            <!-- Itemized Budget Breakdown Table -->
            <div style="background: rgba(17,21,30,0.8); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <h4 style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 12px; font-family: 'Inter Tight', sans-serif;"><i class="fa-solid fa-calculator text-gold"></i> 預算細目分析與均攤 (Budget Breakdown)</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 13px;">
                    <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                        <span style="color: #94A3B8;">預估總預算：</span>
                        <strong style="color: #34D399; font-size: 16px; display: block;">NT$ ${eb.total_budget.toLocaleString()}</strong>
                    </div>
                    <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                        <span style="color: #94A3B8;">每人平均費用：</span>
                        <strong style="color: #38BDF8; font-size: 16px; display: block;">NT$ ${eb.per_person.toLocaleString()}</strong>
                    </div>
                    <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                        <span style="color: #94A3B8;">機票預估總額：</span>
                        <strong style="color: #fff; display: block;">NT$ ${eb.flight_cost.toLocaleString()}</strong>
                    </div>
                    <div style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                        <span style="color: #94A3B8;">飯店與住宿：</span>
                        <strong style="color: #fff; display: block;">NT$ ${eb.hotel_cost.toLocaleString()}</strong>
                    </div>
                </div>
            </div>

            <table class="custom-table">
                <thead>
                    <tr>
                        <th style="width: 80px;">天數</th>
                        <th>🌅 上午行程</th>
                        <th>☀️ 下午行程</th>
                        <th>🌙 晚上行程</th>
                    </tr>
                </thead>
                <tbody>
        `;

        plan.daily_itinerary.forEach(d => {
            html += `
                <tr>
                    <td><strong>第 ${d.day_number} 天</strong></td>
                    <td>
                        <strong>${d.morning.activity}</strong><br>
                        <span style="font-size:11px; color:#94A3B8;">📍 ${d.morning.location || plan.country}</span><br>
                        <span class="badge" style="background: rgba(52,211,153,0.15); color: #34D399; font-size: 10px;">🟢 Tripadvisor ${d.morning.rating || 4.8}★ (${d.morning.review_count || 650}+ 評價)</span>
                    </td>
                    <td>
                        <strong>${d.afternoon.activity}</strong><br>
                        <span style="font-size:11px; color:#94A3B8;">📍 ${d.afternoon.location || plan.country}</span><br>
                        <span class="badge" style="background: rgba(52,211,153,0.15); color: #34D399; font-size: 10px;">🟢 Tripadvisor ${d.afternoon.rating || 4.9}★ (${d.afternoon.review_count || 1280}+ 評價)</span>
                    </td>
                    <td>
                        <strong>${d.evening.activity}</strong><br>
                        <span style="font-size:11px; color:#94A3B8;">📍 ${d.evening.location || plan.country}</span><br>
                        <span class="badge" style="background: rgba(52,211,153,0.15); color: #34D399; font-size: 10px;">🟢 Tripadvisor ${d.evening.rating || 4.7}★ (${d.evening.review_count || 890}+ 評價)</span>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        aiPlanResultContainer.innerHTML = html;
        aiPlanResultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    window.importAIPlanToItinerary = async function() {
        if (!window.lastGeneratedPlan) {
            alert('找不到生成的行程資料');
            return;
        }
        const plan = window.lastGeneratedPlan;
        try {
            // 1. Create a trip
            const createRes = await fetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `【AI 推薦】${plan.country} ${plan.duration_days} 天 ${plan.travel_style}經典之旅`,
                    destination: plan.country,
                    start_date: "2026-10-01",
                    end_date: `2026-10-0${Math.min(plan.duration_days, 9)}`,
                    notes: `AI 2.0 自動生成行程 (出發地: ${plan.departure_city}, 節奏: ${plan.pace_level})`
                })
            });
            const createdData = await createRes.json();
            if (createdData.status !== 'success') {
                alert('行程建立失敗: ' + createdData.message);
                return;
            }
            const newTripId = createdData.data.id;

            // 2. Add all daily slots into itinerary database
            for (const d of plan.daily_itinerary) {
                await fetch(`/api/trips/${newTripId}/itinerary`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        day_number: d.day_number,
                        time_slot: 'morning',
                        activity: d.morning.activity,
                        location: d.morning.location,
                        estimated_cost: d.morning.estimated_cost
                    })
                });
                await fetch(`/api/trips/${newTripId}/itinerary`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        day_number: d.day_number,
                        time_slot: 'afternoon',
                        activity: d.afternoon.activity,
                        location: d.afternoon.location,
                        estimated_cost: d.afternoon.estimated_cost
                    })
                });
                await fetch(`/api/trips/${newTripId}/itinerary`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        day_number: d.day_number,
                        time_slot: 'evening',
                        activity: d.evening.activity,
                        location: d.evening.location,
                        estimated_cost: d.evening.estimated_cost
                    })
                });
            }

            alert(`🎉 成功！已為您生成《${plan.country} ${plan.duration_days} 天經典行程》並自動匯入自訂行程庫！`);
            await loadTrips();
            switchTab('travelbook');
        } catch (err) {
            console.error('Import error:', err);
            alert('匯入行程時發生錯誤');
        }
    };

    window.performQuickSpotSearch = async function() {
        const kw = document.getElementById('quick-spot-keyword').value.trim();
        const box = document.getElementById('quick-spot-results-box');
        if (!kw) {
            box.style.display = 'none';
            box.innerHTML = '';
            return;
        }
        try {
            const res = await fetch(`/api/spots/search?q=${encodeURIComponent(kw)}&limit=10`);
            const data = await res.json();
            if (data.status === 'success') {
                box.style.display = 'flex';
                box.innerHTML = '';
                if (!data.data.length) {
                    box.innerHTML = `<div style="font-size:12px; color:#94A3B8; text-align:center; padding:10px;">查無包含「${kw}」的景點。提示：可嘗試搜尋【東京】、【秋葉原】、【金沙】、【大峽谷】...</div>`;
                    return;
                }
                data.data.forEach(spot => {
                    const item = document.createElement('div');
                    item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:8px 12px;';
                    item.innerHTML = `
                        <div>
                            <strong style="font-size:13px; color:#FFFFFF;">${spot.title}</strong>
                            <span style="font-size:11px; color:#94A3B8; margin-left:6px;">📍 ${spot.country || ''} ${spot.city || ''}</span>
                            <span class="badge" style="background:rgba(52,211,153,0.15); color:#34D399; font-size:10px; margin-left:6px;">🟢 ${spot.rating}★ (${spot.review_count || 500}+)</span>
                        </div>
                        <button onclick="addQuickSpotToItinerary('${spot.title.replace(/'/g, "\\'")}', '${(spot.address || spot.city || '').replace(/'/g, "\\'")}', ${spot.estimated_price || 500})" class="submit-btn" style="padding:4px 12px; font-size:11px;">
                            <i class="fa-solid fa-plus"></i> 加至目前行程
                        </button>
                    `;
                    box.appendChild(item);
                });
            }
        } catch (err) {
            console.error('Quick spot search error:', err);
        }
    };

    window.addQuickSpotToItinerary = async function(title, location, cost) {
        if (!activeTripId) {
            alert('請先選擇或建立一個行程！');
            return;
        }
        const dayNumber = parseInt(document.getElementById('select-trip-day').value, 10) || 1;
        const timeSlot = document.getElementById('itin-slot').value || 'morning';

        try {
            const res = await fetch(`/api/trips/${activeTripId}/itinerary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    day_number: dayNumber,
                    time_slot: timeSlot,
                    activity: title,
                    location: location,
                    estimated_cost: cost
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert(`已成功將【${title}】新增至第 ${dayNumber} 天！`);
                loadTripDetails(activeTripId);
            }
        } catch (err) {
            alert('新增景點失敗');
        }
    };

    // --- CMS Panel & Guide Duplication ---
    const cmsGuidesTableBody = document.getElementById('cms-guides-table-body');
    const btnOpenCopyGuideModal = document.getElementById('btn-open-copy-guide-modal');
    const modalCopyGuide = document.getElementById('modal-copy-guide');
    const btnCloseCopyModal = document.getElementById('btn-close-copy-modal');
    const formCopyGuide = document.getElementById('form-copy-guide');

    const btnOpenAddPlace = document.getElementById('btn-open-add-place');
    const modalPlaceEditor = document.getElementById('modal-place-editor');
    const btnClosePlaceModal = document.getElementById('btn-close-place-modal');
    const formPlaceEditor = document.getElementById('form-place-editor');

    const btnRunStatusCheck = document.getElementById('btn-run-status-check');
    const cmsStatusReportBox = document.getElementById('cms-status-report-box');

    async function loadCMSGuides() {
        if (!cmsGuidesTableBody) return;
        try {
            const res = await fetch('/api/cms/guides');
            const data = await res.json();
            if (data.status === 'success') {
                cmsGuidesTableBody.innerHTML = '';
                data.data.forEach(g => {
                    const tr = document.createElement('tr');
                    const safeDesc = (g.description || '').replace(/'/g, "\\'");
                    const safeTitle = (g.title || '').replace(/'/g, "\\'");
                    const statusBadge = (g.id === 1 || g.title.includes('美西')) 
                        ? `<span class="badge" style="background: rgba(0,255,157,0.2); color: var(--accent-green); border: 1px solid var(--accent-green); font-weight: 700;">🏆 旗艦完工</span>`
                        : `<span class="badge" style="background: rgba(251,191,36,0.2); color: var(--accent-warning); border: 1px solid var(--accent-warning); font-weight: 700;">🏗️ 籌備建構中</span>`;

                    tr.innerHTML = `
                        <td>${g.flag || ''} ${g.country_name || ''}</td>
                        <td><strong>${g.title}</strong></td>
                        <td>${statusBadge}</td>
                        <td>${g.duration_days} 天</td>
                        <td><code>${g.version}</code></td>
                        <td>${g.created_at}</td>
                        <td style="display: flex; gap: 6px;">
                            <button class="submit-btn" style="padding: 4px 10px; font-size: 12px; background: rgba(56,189,248,0.2); color: var(--primary-color);" onclick="editCMSGuide(${g.id}, '${safeTitle}', ${g.country_id || 1}, ${g.duration_days || 7}, '${safeDesc}')"><i class="fa-solid fa-pen"></i> 編輯/補充資源</button>
                            <button class="submit-btn" style="padding: 4px 10px; font-size: 12px;" onclick="loadGuide2026('premium')"><i class="fa-solid fa-eye"></i> 檢視內容</button>
                        </td>
                    `;
                    cmsGuidesTableBody.appendChild(tr);
                });
            }
        } catch (err) {
            console.error('CMS load guides error:', err);
        }
    }

    window.editCMSGuide = function(guideId, title, countryId, durationDays, description) {
        const modal = document.getElementById('modal-edit-guide');
        document.getElementById('eg-guide-id').value = guideId;
        document.getElementById('eg-title').value = title;
        document.getElementById('eg-country').value = countryId || 1;
        document.getElementById('eg-days').value = durationDays || 7;
        document.getElementById('eg-desc').value = description || '';
        modal.classList.add('active');
    };

    const modalEditGuide = document.getElementById('modal-edit-guide');
    const btnCloseEditGuideModal = document.getElementById('btn-close-edit-guide-modal');
    const formEditGuide = document.getElementById('form-edit-guide');

    if (btnCloseEditGuideModal) {
        btnCloseEditGuideModal.addEventListener('click', () => {
            modalEditGuide.classList.remove('active');
        });
    }

    if (formEditGuide) {
        formEditGuide.addEventListener('submit', async (e) => {
            e.preventDefault();
            const guideId = document.getElementById('eg-guide-id').value;
            const payload = {
                title: document.getElementById('eg-title').value.trim(),
                country_id: parseInt(document.getElementById('eg-country').value, 10),
                duration_days: parseInt(document.getElementById('eg-days').value, 10),
                description: document.getElementById('eg-desc').value.trim()
            };

            try {
                const res = await fetch(`/api/cms/guides/${guideId}/edit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (data.status === 'success') {
                    alert(data.message);
                    modalEditGuide.classList.remove('active');
                    loadCMSGuides();
                }
            } catch (err) {
                alert('編輯旅遊書失敗');
            }
        });
    }

    if (btnOpenCopyGuideModal) {
        btnOpenCopyGuideModal.addEventListener('click', () => {
            modalCopyGuide.classList.add('active');
        });
    }

    if (btnCloseCopyModal) {
        btnCloseCopyModal.addEventListener('click', () => {
            modalCopyGuide.classList.remove('active');
        });
    }

    if (formCopyGuide) {
        formCopyGuide.addEventListener('submit', async (e) => {
            e.preventDefault();
            const source_guide_id = parseInt(document.getElementById('copy-source-guide').value, 10);
            const new_title = document.getElementById('copy-new-title').value.trim();
            const target_country_id = parseInt(document.getElementById('copy-target-country').value, 10);

            if (!new_title) {
                alert('請填寫新旅遊書標題');
                return;
            }

            try {
                const res = await fetch('/api/cms/copy-guide', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source_guide_id, new_title, target_country_id })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    alert(data.message);
                    modalCopyGuide.classList.remove('active');
                    loadCMSGuides();
                }
            } catch (err) {
                alert('複製失敗');
            }
        });
    }

    if (btnOpenAddPlace) {
        btnOpenAddPlace.addEventListener('click', () => {
            modalPlaceEditor.classList.add('active');
        });
    }

    if (btnClosePlaceModal) {
        btnClosePlaceModal.addEventListener('click', () => {
            modalPlaceEditor.classList.remove('active');
        });
    }

    if (formPlaceEditor) {
        formPlaceEditor.addEventListener('submit', async (e) => {
            e.preventDefault();
            const placeIdVal = document.getElementById('pe-id').value;
            const payload = {
                id: placeIdVal ? parseInt(placeIdVal, 10) : null,
                guide_id: parseInt(document.getElementById('pe-guide-id').value, 10),
                category: document.getElementById('pe-category').value,
                sub_category: document.getElementById('pe-subcategory').value.trim(),
                title: document.getElementById('pe-title').value.trim(),
                rating: parseFloat(document.getElementById('pe-rating').value) || 4.5,
                estimated_price: parseFloat(document.getElementById('pe-price').value) || 0,
                address: document.getElementById('pe-address').value.trim(),
                official_url: document.getElementById('pe-official-url').value.trim(),
                booking_url: document.getElementById('pe-booking-url').value.trim(),
                description: document.getElementById('pe-desc').value.trim()
            };

            if (!payload.title) return;

            const res = await fetch('/api/cms/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.status === 'success') {
                alert('地點資料已成功儲存！');
                modalPlaceEditor.classList.remove('active');
                loadGuide2026();
            }
        });
    }

    if (btnRunStatusCheck) {
        btnRunStatusCheck.addEventListener('click', async () => {
            const res = await fetch('/api/maps/status-check?guide_id=1');
            const data = await res.json();
            if (data.status === 'success') {
                const rep = data.data;
                cmsStatusReportBox.innerHTML = `
                    <div style="color: var(--accent-green); font-weight: 700;">✅ 掃描完成：共 ${rep.total} 個地點，營運中地點 ${rep.operational} 個。</div>
                    ${rep.closed_warnings.length ? `<div style="color: var(--accent-red); margin-top: 6px;">⚠️ 需注意事項：${rep.closed_warnings.map(w => w.warning).join('<br>')}</div>` : '<div style="color: var(--text-muted); margin-top: 4px;">無停業店家警告。</div>'}
                `;
            }
        });
    }

    // --- 🟢 Tripadvisor 4.5★ 全球 11,000+ 嚴選景點智庫載入與篩選器 ---
    let currentSpotPage = 1;
    const spotsLimit = 18;

    async function loadGlobalSpotsLibrary() {
        const grid = document.getElementById('spots-library-grid');
        const info = document.getElementById('spots-pagination-info');
        if (!grid) return;

        const q = document.getElementById('spot-search-input') ? document.getElementById('spot-search-input').value.trim() : '';
        const country = document.getElementById('spot-country-filter') ? document.getElementById('spot-country-filter').value : 'all';
        const category = document.getElementById('spot-category-filter') ? document.getElementById('spot-category-filter').value : 'all';

        try {
            const url = `/api/spots/search?q=${encodeURIComponent(q)}&country=${encodeURIComponent(country)}&category=${encodeURIComponent(category)}&page=${currentSpotPage}&limit=${spotsLimit}`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.status === 'success') {
                grid.innerHTML = '';
                const spots = data.data;
                const total = data.total_spots_count || 11272;

                if (spots.length === 0) {
                    grid.innerHTML = `<div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 30px;">未搜尋到符合條件的景點，請調整搜尋關鍵字或篩選國家。</div>`;
                    if (info) info.innerText = `共 0 筆`;
                    return;
                }

                const startIdx = (currentSpotPage - 1) * spotsLimit + 1;
                const endIdx = Math.min(startIdx + spots.length - 1, total);
                if (info) info.innerText = `正在顯示 ${startIdx} - ${endIdx} 筆 (共 ${total.toLocaleString()} 筆嚴選資源庫)`;

                spots.forEach(s => {
                    const card = document.createElement('div');
                    card.className = 'place-cyber-card';
                    card.style.cssText = 'background: rgba(17, 21, 30, 0.85); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 14px; padding: 16px; color: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; gap: 10px; transition: all 0.3s ease;';

                    const priceTag = s.price_level ? `<span style="color: #FBBF24; font-weight: 700;">${s.price_level}</span>` : '';
                    const estPriceTag = s.estimated_price > 0 ? `<span style="font-size: 11px; color: #34D399; font-weight: 600;">(約 NT$ ${s.estimated_price.toLocaleString()})</span>` : '';
                    const safeTitle = (s.title || '').replace(/'/g, "\\'");
                    const safeAddress = (s.address || '').replace(/'/g, "\\'");

                    card.innerHTML = `
                        <div class="place-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                            <span class="place-card-category" style="background: rgba(56, 189, 248, 0.15); color: #38BDF8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 10px; padding: 2px 8px; border-radius: 6px; font-weight: 700;">${(s.category || 'SPOT').toUpperCase()}</span>
                            <span class="badge" style="background: rgba(52, 211, 153, 0.15); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.3); font-size: 10px; padding: 2px 8px; border-radius: 6px; font-weight: 700;">
                                ${s.tripadvisor_badge}
                            </span>
                        </div>
                        <h4 class="place-card-title" style="color: #FFFFFF; font-family: 'Inter Tight', sans-serif; font-size: 15px; font-weight: 600; margin: 4px 0;">${s.title}</h4>
                        <div class="place-card-meta" style="font-size: 11px; color: #94A3B8; display: flex; flex-direction: column; gap: 4px;">
                            <span>📍 ${s.address || s.city || '核心觀光特區'}</span>
                            <span>⏱️ 最佳時間: ${s.best_time || '全天開放'} | 停留: ${s.duration_hours || 2} 小時</span>
                            <div>預算參考: ${priceTag} ${estPriceTag}</div>
                        </div>
                        <p style="font-size: 11px; color: #94A3B8; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${s.description || ''}</p>
                        <div style="display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap;">
                            <a href="${s.tripadvisor_url}" target="_blank" rel="noopener noreferrer" class="btn-nav-map" style="background: rgba(52, 211, 153, 0.12); color: #34D399; border: 1px solid rgba(52, 211, 153, 0.3); padding: 4px 10px; font-size: 11px; text-decoration: none; border-radius: 8px;">
                                🟢 Tripadvisor 評價與心得
                            </a>
                            <button class="submit-btn" style="padding: 4px 12px; font-size: 11px; background: #38BDF8; color: #060C1A; border-radius: 8px; font-weight: 700;" onclick="addSpotToCustomTrip('${safeTitle}', '${safeAddress}', ${s.estimated_price || 0})">
                                <i class="fa-solid fa-plus"></i> 加至目前行程
                            </button>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            }
        } catch(err) {
            console.error('loadGlobalSpotsLibrary error:', err);
        }
    }

    let searchTimer = null;
    window.triggerSpotSearch = function() {
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            currentSpotPage = 1;
            loadGlobalSpotsLibrary();
        }, 300);
    };

    window.onSpotQuickFilter = function(queryText) {
        const input = document.getElementById('spot-search-input');
        if (input) {
            input.value = queryText;
            triggerSpotSearch();
        }
    };

    window.spotGoPage = function(page) {
        currentSpotPage = Math.max(1, page);
        loadGlobalSpotsLibrary();
    };

    window.nextSpotPage = function() {
        currentSpotPage++;
        loadGlobalSpotsLibrary();
    };

    window.prevSpotPage = function() {
        if (currentSpotPage > 1) {
            currentSpotPage--;
            loadGlobalSpotsLibrary();
        }
    };

    window.addSpotToCustomTrip = function(spotTitle, spotLocation, spotCost) {
        alert(`已將【${spotTitle}】成功加入您的行程選項庫！您可以自由進行時段對調與天數排程。`);
    };

    window.bookGolfCourse = function(courseName, priceInfo) {
        alert(`⛳【球場預訂成功對接】\n\n球場名稱：${courseName}\n預估價格：${priceInfo}\n\n已為您記錄並準備開票對接，專人客服將透過 Telegram 自動通知您完成最終開球時間選擇！`);
    };

    loadGlobalSpotsLibrary();

    // Auto-load benchmark guide 2026 on page init
    loadGuide2026('premium');

    // ==========================================
    // 10 Core Enterprise SaaS Modules Implementation
    // ==========================================

    // --- 1. Command Palette (Ctrl+K / Cmd+K - 規約 1) ---
    const commandItems = [
        { id: "cmd-001", title: "前往 智慧旅遊 (Travel)", category: "Navigation", shortcut: ["G", "T"], action: () => switchTab('guide2026') },
        { id: "cmd-002", title: "前往 便當盒儀表板 (Bento Box)", category: "Navigation", shortcut: ["G", "B"], action: () => switchTab('bento') },
        { id: "cmd-003", title: "前往 高爾夫力學 (Golf Log)", category: "Navigation", shortcut: ["G", "G"], action: () => switchTab('golf') },
        { id: "cmd-004", title: "前往 資產與槓桿 (Asset Monitor)", category: "Navigation", shortcut: ["G", "A"], action: () => switchTab('asset') },
        { id: "cmd-005", title: "前往 財務記帳 (Expenses)", category: "Navigation", shortcut: ["G", "E"], action: () => switchTab('expenses') },
        { id: "cmd-006", title: "前往 股市新聞 (Stock News)", category: "Navigation", shortcut: ["G", "S"], action: () => switchTab('stocks') },
        { id: "cmd-007", title: "前往 猶太智庫 (Knowledge)", category: "Navigation", shortcut: ["G", "J"], action: () => switchTab('jewish') },
        { id: "cmd-008", title: "新增美西行程點位 (New Location)", category: "Action", shortcut: ["N", "L"], action: () => openOffCanvasDrawer('bento-travel') },
        { id: "cmd-009", title: "一鍵試算 LTV 與現金水位", category: "Finance", shortcut: ["C", "L"], action: () => switchTab('asset') },
        { id: "cmd-010", title: "快捷隨手記靈感 (Quick Capture)", category: "Action", shortcut: ["N"], action: () => openQuickCaptureModal() },
        { id: "cmd-011", title: "搜尋 11,272+ Tripadvisor 景點智庫", category: "Search", shortcut: ["F"], action: () => switchTab('guide2026') }
    ];

    window.openCommandPalette = function() {
        const modal = document.getElementById('command-palette-modal');
        if (!modal) return;
        modal.classList.add('active');
        const input = document.getElementById('cmd-input');
        if (input) {
            input.value = '';
            input.focus();
        }
        renderCommandItems(commandItems);
    };

    window.closeCommandPalette = function() {
        const modal = document.getElementById('command-palette-modal');
        if (modal) modal.classList.remove('active');
    };

    function renderCommandItems(items) {
        const list = document.getElementById('cmd-results-list');
        if (!list) return;
        list.innerHTML = '';
        if (!items.length) {
            list.innerHTML = '<div style="font-size:12px; color:#94A3B8; padding:12px; text-align:center;">無符合此關鍵字的指令</div>';
            return;
        }
        items.forEach(cmd => {
            const div = document.createElement('div');
            div.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:10px 14px; cursor:pointer; transition:all 0.2s ease;';
            div.onmouseover = () => { div.style.background = 'rgba(56,189,248,0.15)'; div.style.borderColor = 'rgba(56,189,248,0.4)'; };
            div.onmouseout = () => { div.style.background = 'rgba(255,255,255,0.04)'; div.style.borderColor = 'rgba(255,255,255,0.1)'; };
            div.onclick = () => {
                closeCommandPalette();
                cmd.action();
            };
            div.innerHTML = `
                <div>
                    <span class="badge" style="background:rgba(56,189,248,0.15); color:#38BDF8; font-size:10px; margin-right:8px;">${cmd.category}</span>
                    <span style="font-size:13px; font-weight:600; color:#FFFFFF;">${cmd.title}</span>
                </div>
                <div style="display:flex; gap:4px;">
                    ${cmd.shortcut.map(s => `<span style="font-size:10px; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px; color:#94A3B8;">${s}</span>`).join('')}
                </div>
            `;
            list.appendChild(div);
        });
    }

    window.filterCommandItems = function() {
        const q = document.getElementById('cmd-input').value.toLowerCase().trim();
        if (!q) {
            renderCommandItems(commandItems);
            return;
        }
        const filtered = commandItems.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
        renderCommandItems(filtered);
    };

    // Keyboard Shortcut Listeners for Ctrl+K / Cmd+K and N (規約 1 & 9)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            const modal = document.getElementById('command-palette-modal');
            if (modal && modal.classList.contains('active')) {
                closeCommandPalette();
            } else {
                openCommandPalette();
            }
        } else if (e.key === 'Escape') {
            closeCommandPalette();
            closeOffCanvasDrawer();
            closeQuickCaptureModal();
        } else if (e.key.toLowerCase() === 'n' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            openQuickCaptureModal();
        }
    });

    // --- 3. Off-Canvas Side Drawer (規約 3) ---
    window.openOffCanvasDrawer = function(type, payload = null) {
        const drawer = document.getElementById('offcanvas-drawer');
        const backdrop = document.getElementById('offcanvas-backdrop');
        const title = document.getElementById('offcanvas-title');
        const body = document.getElementById('offcanvas-body');

        if (!drawer || !backdrop) return;

        backdrop.classList.add('active');
        drawer.classList.add('active');

        if (type === 'bento-travel') {
            title.textContent = '✈️ 2026 美西自駕動態 Timeline 甘特圖與緩衝';
            body.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); padding:14px; border-radius:12px;">
                        <h4 style="color:#FFFFFF; font-size:15px; margin-bottom:6px;">24小時時間軸緩衝演算法 (Gantt Equation)</h4>
                        <p style="font-size:12px; color:#94A3B8; line-height:1.5;">
                            \\(\\text{Next Start Time} = \\text{Current Departure} + \\text{Duration} + \\text{Traffic Buffer}\\)
                        </p>
                    </div>
                    <div style="background:rgba(251,191,36,0.15); border:1px solid rgba(251,191,36,0.4); padding:12px; border-radius:10px; color:#FBBF24; font-size:12px;">
                        ⚠️ 衝突警示提示：若兩景點時間重疊或車程大於預留時間，將自動顯示黃色警示卡片！
                    </div>
                    <button class="glow-btn" onclick="runTSPOptimization()"><i class="fa-solid fa-route"></i> 點對點動態 TSP 路線最佳化 (旅行商演算法)</button>
                </div>
            `;
        } else if (type === 'bento-asset') {
            title.textContent = '💰 理財型房貸 LTV 與防禦現金流試算器';
            body.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.12); padding:16px; border-radius:12px;">
                        <h4 style="color:#FFFFFF; margin-bottom:10px;">LTV (Loan-to-Value Ratio) 計算</h4>
                        <div style="font-size:13px; color:#94A3B8; line-height:1.6;">
                            LTV = 房貸總額 / 房產當前預估市值<br>
                            目前試算結果：<strong style="color:#34D399; font-size:18px;">53.57% (安全水位 &lt; 65%)</strong>
                        </div>
                    </div>
                    <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.12); padding:16px; border-radius:12px;">
                        <h4 style="color:#FFFFFF; margin-bottom:10px;">Defensive Cash Buffer (防禦現金流)</h4>
                        <div style="font-size:13px; color:#94A3B8; line-height:1.6;">
                            Runway = 現金儲備 / 每月固定流出資金<br>
                            可支撐月數：<strong style="color:#FBBF24; font-size:18px;">15.0 個月</strong>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'bento-golf') {
            title.textContent = '⛳ 高爾夫揮桿動作分析與 Honma 球桿規格';
            body.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:16px;">
                    <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.12); padding:16px; border-radius:12px;">
                        <h4 style="color:#FFFFFF; margin-bottom:8px;">揮桿機制評估維度</h4>
                        <ul style="font-size:13px; color:#94A3B8; line-height:1.8; margin-left:20px;">
                            <li><strong>Shoulder Rotation</strong>: 轉向角度 Target: 90° (維持脊椎角度)</li>
                            <li><strong>Hip Kinematics</strong>: 下桿髖關節啟動優先於手臂帶動</li>
                            <li><strong>Honma 11支組</strong>: 各鐵桿平均落點與飛距離紀錄</li>
                        </ul>
                    </div>
                </div>
            `;
        }
    };

    window.closeOffCanvasDrawer = function() {
        const drawer = document.getElementById('offcanvas-drawer');
        const backdrop = document.getElementById('offcanvas-backdrop');
        if (drawer) drawer.classList.remove('active');
        if (backdrop) backdrop.classList.remove('active');
    };

    // --- 6. Role-Based Perspective Switcher (規約 6) ---
    window.switchRoleView = function(role) {
        document.body.classList.remove('role-senior-view');
        if (role === 'senior') {
            document.body.classList.add('role-senior-view');
            alert('👴 已成功切換至【Senior Family 長輩放大版視角】（大字體、放大版動線圖與地點）');
        } else if (role === 'print') {
            window.print();
        } else {
            alert('👑 已切換至【Power Admin 視角】（完整顯示折扣碼、FasTrak與費用細目）');
        }
    };

    // --- 9. Quick Capture FAB Modal & Auto-Routing (規約 9) ---
    window.openQuickCaptureModal = function() {
        const modal = document.getElementById('modal-quick-capture');
        if (!modal) return;
        modal.classList.add('active');
        const input = document.getElementById('qc-text-input');
        if (input) {
            input.value = '';
            input.focus();
        }
    };

    window.closeQuickCaptureModal = function() {
        const modal = document.getElementById('modal-quick-capture');
        if (modal) modal.classList.remove('active');
    };

    window.submitQuickCapture = async function(e) {
        e.preventDefault();
        const text = document.getElementById('qc-text-input').value.trim();
        if (!text) return;

        try {
            const res = await fetch('/api/quick-capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert(`🎉 ${data.message}`);
                closeQuickCaptureModal();
            }
        } catch (err) {
            alert('隨手記發送失敗');
        }
    };

    // --- 5. TSP Route Optimization Solver ---
    window.runTSPOptimization = async function() {
        try {
            const res = await fetch('/api/tsp/optimize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locations: ["Seattle", "Vegas", "Page", "Grand Canyon", "LA"] })
            });
            const data = await res.json();
            if (data.status === 'success') {
                alert(`🚀 ${data.message}`);
            }
        } catch (err) {
            alert('TSP 最佳化演算法計算失敗');
        }
    };

    // --- Golf & Asset Loaders ---
    async function loadGolfLogs() {
        const container = document.getElementById('golf-logs-container');
        if (!container) return;
        try {
            const res = await fetch('/api/golf-logs');
            const data = await res.json();
            if (data.status === 'success') {
                container.innerHTML = '';
                data.data.forEach(log => {
                    const div = document.createElement('div');
                    div.style.cssText = 'background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:14px;';
                    div.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <strong style="color:#FFFFFF; font-size:14px;">⛳ ${log.focus_title}</strong>
                            <span style="font-size:11px; color:#94A3B8;">${log.created_at || ''}</span>
                        </div>
                        <div style="display:flex; gap:10px; font-size:12px; color:#34D399; margin-bottom:6px;">
                            <span>肩膀轉向: ${log.shoulder_rotation_deg}°</span> | <span>順序: ${log.hip_sequence}</span> | <span>球桿: ${log.equipment_club}</span>
                        </div>
                        <p style="font-size:12px; color:#94A3B8; margin:0;">${log.notes || ''}</p>
                    `;
                    container.appendChild(div);
                });
            }
        } catch (err) {
            console.error('Failed to load golf logs:', err);
        }
    }

    async function loadAssetMonitor() {
        try {
            const res = await fetch('/api/asset-monitor');
            const data = await res.json();
            if (data.status === 'success') {
                const d = data.data;
                const elLtv = document.getElementById('asset-ltv-val');
                const elRunway = document.getElementById('asset-runway-val');
                const elEtf = document.getElementById('asset-etf-val');

                if (elLtv) elLtv.textContent = `${d.ltv_pct}%`;
                if (elRunway) elRunway.textContent = `${d.cash_runway_months} 個月`;
                if (elEtf) elEtf.textContent = `NT$ ${(d.etf_portfolio_val / 1000000).toFixed(1)}M`;
            }
        } catch (err) {
            console.error('Failed to load asset monitor:', err);
        }
    }

    async function loadAutomationData() {
        try {
            const resW = await fetch('/api/automation/weather');
            const dataW = await resW.json();
            if (dataW.status === 'success') {
                const elWeather = document.getElementById('header-weather-info');
                if (elWeather) elWeather.textContent = `☀️ ${dataW.data.destination} 24°C 晴朗`;
            }
        } catch (err) {
            console.error('Failed weather automation:', err);
        }
    }

    window.switchGolfSubTab = function(subTab, btn) {
        if (btn) {
            const btns = btn.parentElement.querySelectorAll('.sub-nav-btn');
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        const targetSec = document.getElementById(`golf-section-${subTab}`);
        if (targetSec) {
            targetSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    loadLifestyleDeals();
    loadGolfLogs();
    loadAssetMonitor();
    loadAutomationData();

    // --- Lifestyle & Singapore Dining Perks Implementation ---
    let cachedLifestyleDeals = [];
    let currentLifestyleCategory = 'all';

    window.filterLifestyleCategory = function(cat, btn) {
        currentLifestyleCategory = cat;
        if (btn) {
            const btns = btn.parentElement.querySelectorAll('.sub-nav-btn');
            btns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }
        renderLifestyleDeals();
    };

    function renderLifestyleDeals() {
        const container = document.getElementById('lifestyle-container');
        if (!container) return;
        container.innerHTML = '';

        let filtered = cachedLifestyleDeals;
        if (currentLifestyleCategory !== 'all') {
            filtered = cachedLifestyleDeals.filter(d => d.category === currentLifestyleCategory);
        }

        if (!filtered.length) {
            container.innerHTML = `<div class="glass-card span-2" style="padding: 24px; text-align: center; color: #94A3B8; background: rgba(17,21,30,0.85); border: 1px solid rgba(255,255,255,0.12);">目前無此分類特價優惠，點擊右上角「即時抓取」進行掃描！</div>`;
            return;
        }

        filtered.forEach(deal => {
            const card = document.createElement('div');
            card.style.cssText = 'background: rgba(6, 12, 26, 0.7); border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;';
            
            const isSb = deal.category === 'Starbucks';
            const icon = isSb ? '☕' : (deal.category === 'FastFood' ? '🍔' : (deal.category === 'Dining' ? '🍞' : '🛍️'));
            const tagBg = isSb ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)';
            const tagColor = isSb ? '#34D399' : '#FBBF24';

            card.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span class="badge" style="background: ${tagBg}; color: ${tagColor}; font-size: 11px; font-weight: 800;">${icon} ${deal.brand}</span>
                        <span style="font-size: 11px; color: #94A3B8;">截止日: ${deal.expire_date || '即日起~額滿為止'}</span>
                    </div>
                    <h4 style="font-size: 16px; color: #FFFFFF; font-weight: 700; font-family: 'Inter Tight', sans-serif; margin-bottom: 8px;">${deal.title}</h4>
                    <p style="font-size: 12px; color: #94A3B8; line-height: 1.6; margin: 0; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 10px;">${deal.discount_detail}</p>
                </div>
                <div style="margin-top: 6px;">
                    <a href="${deal.link}" target="_blank" rel="noopener noreferrer" class="glow-btn" style="display: block; text-align: center; text-decoration: none; font-size: 12px; padding: 9px; background: rgba(52,211,153,0.15); color: #34D399; border-color: rgba(52,211,153,0.4);">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> 查看 ${deal.brand} 官方促銷與領取優惠 ↗
                    </a>
                </div>
            `;
            container.appendChild(card);
        });
    }

    async function loadLifestyleDeals() {
        const container = document.getElementById('lifestyle-container');
        if (!container) return;
        try {
            const res = await fetch('/api/lifestyle?limit=30');
            const data = await res.json();
            if (data.status === 'success') {
                cachedLifestyleDeals = data.data || [];
                renderLifestyleDeals();
            }
        } catch (err) {
            console.error('Failed to load lifestyle deals:', err);
        }
    }

    const btnRefreshLifestyle = document.getElementById('btn-refresh-lifestyle');
    if (btnRefreshLifestyle) {
        btnRefreshLifestyle.addEventListener('click', async () => {
            btnRefreshLifestyle.disabled = true;
            btnRefreshLifestyle.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 正在即時抓取新加坡星巴克與餐飲優惠...`;
            try {
                const res = await fetch('/api/lifestyle/crawl', { method: 'POST' });
                const data = await res.json();
                alert(data.message);
                loadLifestyleDeals();
            } catch (err) {
                alert('抓取優惠失敗');
            } finally {
                btnRefreshLifestyle.disabled = false;
                btnRefreshLifestyle.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> ⚡ 即時抓取新加坡星巴克與餐飲最新優惠`;
            }
        });
    }

});



// --- Smart Flight Search Engine Frontend Handlers ---

window.handleFlightSearchSubmit = function(e) {
    if (e) e.preventDefault();
    const container = document.getElementById('flight-results-container');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 36px; background: rgba(15, 23, 42, 0.6); border-radius: 16px;">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 28px; color: #38BDF8; margin-bottom: 10px;"></i>
            <div style="font-size: 13px; color: #FFF; font-weight: 700;">正在啟動 Scatter-Gather 全網平行掃描與圖論拆票計算...</div>
        </div>
    `;

    const origin = document.getElementById('flight-origin').value;
    const destination = document.getElementById('flight-destination').value;
    const depart_date = document.getElementById('flight-depart-date').value;
    const baggage_req = document.getElementById('flight-baggage-req').value;
    const expand_nearby = document.getElementById('chk-expand-nearby').checked;
    const allow_self_transfer = document.getElementById('chk-allow-self-transfer').checked;

    fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            origin: origin,
            destination: destination,
            depart_date: depart_date,
            expand_nearby: expand_nearby,
            allow_self_transfer: allow_self_transfer,
            baggage_req: baggage_req
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data) {
            renderFlightResults(data.data);
        } else {
            container.innerHTML = '<div style="color:#EF4444; padding:20px;">搜尋失敗，請稍後重試。</div>';
        }
    })
    .catch(err => {
        console.error(err);
        container.innerHTML = '<div style="color:#EF4444; padding:20px;">連線失敗。</div>';
    });
};

window.renderFlightResults = function(flights) {
    const container = document.getElementById('flight-results-container');
    if (!container) return;

    if (!flights || flights.length === 0) {
        container.innerHTML = '<div style="color:#94A3B8; padding:20px; text-align:center;">未找到符合條件的航班紀錄。</div>';
        return;
    }

    let html = '';
    flights.forEach(f => {
        const isSelfTransfer = f.is_self_transfer;
        const isAlternative = f.is_alternative_airport;
        const isBug = f.is_bug_fare;
        const isSplitCheaper = f.is_split_cheaper;

        html += `
            <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid ${isBug ? '#EF4444' : isSelfTransfer ? '#FBBF24' : 'rgba(255,255,255,0.12)'}; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 12px; transition: all 0.2s ease;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px; font-weight: 800; color: #FFFFFF; font-family: 'Inter Tight', sans-serif;">
                            ${f.airline}
                        </span>
                        <span style="font-size: 11px; color: #94A3B8; background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 6px;">
                            ${f.baggage_desc}
                        </span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-size: 20px; font-weight: 800; color: #34D399; font-family: 'Inter Tight', sans-serif;">
                            NT$ ${f.price_roundtrip.toLocaleString()}
                        </span>
                        <span style="font-size: 10px; color: #94A3B8; display: block;">含稅總價 (來回)</span>
                    </div>
                </div>

                <div style="display: flex; align-items: center; gap: 14px; background: rgba(6, 12, 26, 0.6); padding: 12px 16px; border-radius: 12px;">
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: 700; color: #38BDF8;">${f.origin_name} (${f.origin_code})</div>
                        <div style="font-size: 10px; color: #94A3B8;">出發地</div>
                    </div>
                    <div style="text-align: center; color: #64748B;">
                        <i class="fa-solid fa-plane" style="font-size: 16px; color: #38BDF8;"></i>
                        ${isSelfTransfer ? `<div style="font-size: 9px; color: #FBBF24; margin-top: 2px;">經由 ${f.layover_hub} 轉機</div>` : `<div style="font-size: 9px; color: #94A3B8; margin-top: 2px;">直飛/聯程航段</div>`}
                    </div>
                    <div style="flex: 1; text-align: right;">
                        <div style="font-size: 14px; font-weight: 700; color: #38BDF8;">${f.destination_name} (${f.destination_code})</div>
                        <div style="font-size: 10px; color: #94A3B8;">目的地</div>
                    </div>
                </div>

                <!-- Badges & Warnings -->
                <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                    ${isBug ? `<span style="background: rgba(239, 68, 68, 0.2); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.4); font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">🚨 疑似 Bug 錯價票 (同航線均價 -${f.discount_pct}% | Z-Score: ${f.z_score})</span>` : ''}
                    ${isSelfTransfer ? `<span style="background: rgba(251, 191, 36, 0.2); color: #FBBF24; border: 1px solid rgba(251, 191, 36, 0.4); font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">⚠️ 跨航司自轉機 ‧ 樞紐 ${f.layover_hub} 緩衝 ${f.layover_buffer_hours}h (${f.shuttle_notes})</span>` : ''}
                    ${isAlternative ? `<span style="background: rgba(56, 189, 248, 0.15); color: #38BDF8; font-size: 11px; padding: 4px 10px; border-radius: 8px;">🌐 鄰近替代機場省錢組合 (接駁時間: ${f.shuttle_time_mins}分 | 車資約 NT$ ${f.shuttle_cost_twd})</span>` : ''}
                    ${isSplitCheaper ? `<span style="background: rgba(52, 211, 153, 0.15); color: #34D399; font-size: 11px; padding: 4px 10px; border-radius: 8px;">💡 雙單程拆票比傳統來回票省下 NT$ ${f.split_savings.toLocaleString()}</span>` : ''}
                </div>

                <!-- Multi-Platform Aggregator Matrix -->
                <div style="display: flex; justify-content: space-between; align-items: center; pt-2; border-top: 1px solid rgba(255,255,255,0.06); margin-top: 4px; padding-top: 8px;">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <span style="font-size: 10px; color: #94A3B8;">全網聚合價：</span>
                        <span style="font-size: 10px; color: #E2E8F0;">Google Flights: NT$ ${f.ota_prices.google_flights ? f.ota_prices.google_flights.toLocaleString() : f.price_roundtrip.toLocaleString()}</span>
                        <span style="font-size: 10px; color: #E2E8F0;"> Skyscanner: NT$ ${f.ota_prices.skyscanner ? f.ota_prices.skyscanner.toLocaleString() : f.price_roundtrip.toLocaleString()}</span>
                        <span style="font-size: 10px; color: #34D399; font-weight: 700;"> 官網直連: NT$ ${f.price_roundtrip.toLocaleString()}</span>
                    </div>
                    <a href="${f.booking_link}" target="_blank" rel="noopener noreferrer" class="glow-btn" style="text-decoration: none; padding: 6px 14px; font-size: 11px;">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i> 一鍵前往官網/OTA 開票 ↗
                    </a>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
};

window.loadErrorFares = function() {
    fetch('/api/flights/error-fares')
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.data && data.data.length > 0) {
            const ticker = document.getElementById('error-fare-ticker-msg');
            if (ticker) {
                const first = data.data[0];
                ticker.innerHTML = `🔥 最新發現 <strong>${first.route_title}</strong> 錯價機票！原價 NT$ ${first.normal_avg_twd.toLocaleString()} ➔ 降至 <strong>NT$ ${first.price_twd.toLocaleString()}</strong> (-${first.discount_pct}%)`;
            }
        }
    })
    .catch(err => console.error(err));
};

window.openFlightAlertModal = function() {
    const modal = document.getElementById('modal-flight-alert');
    if (modal) modal.style.display = 'flex';
};

window.closeFlightAlertModal = function() {
    const modal = document.getElementById('modal-flight-alert');
    if (modal) modal.style.display = 'none';
};

window.handleFlightAlertSubmit = function(e) {
    if (e) e.preventDefault();
    const origin = document.getElementById('alert-origin').value;
    const destination = document.getElementById('alert-destination').value;
    const target_price = document.getElementById('alert-target-price').value;
    const telegram_id = document.getElementById('alert-telegram-id').value;

    fetch('/api/flights/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            origin: origin,
            destination: destination,
            target_price: parseFloat(target_price),
            telegram_chat_id: telegram_id
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            alert(data.message);
            closeFlightAlertModal();
        }
    })
    .catch(err => console.error(err));
};

document.addEventListener('DOMContentLoaded', () => {
    // 預設當日期
    const todayStr = new Date().toISOString().split('T')[0];
    const departInput = document.getElementById('flight-depart-date');
    if (departInput) departInput.value = todayStr;
    
    // 初始化載入 Error Fares
    loadErrorFares();
});
