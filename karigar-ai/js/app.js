/* ============================================
   KarigarAI - Main Application (with API integration)
   ============================================ */

const App = {
    currentPage: 'landing',
    productCreationFlow: {
        step: 1,
        photo: null,
        enhanced: false,
        voiceText: '',
        listing: null,
        price: null
    },
    _apiAvailable: null,

    async init() {
        Navigation.init();
        I18N.init();

        // Check if already logged in
        if (Storage.isLoggedIn()) {
            Navigation.navigate('dashboard');
        } else {
            Navigation.navigate('landing');
        }

        this.bindEvents();
        this.applyTheme();
        this.applyLanguage();
        this.renderAllPages();

        // Check API availability in background
        this._apiAvailable = await API.isAvailable();
        if (this._apiAvailable) {
            console.log('✅ Backend API connected');
            // Re-render with fresh API data
            this.renderAllPages();
        } else {
            console.log('📦 Running in offline mode (mock data)');
        }
    },

    // ---- Event Bindings ----
    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }
        });
        document.addEventListener('click', (e) => {
            const langBtn = e.target.closest('.lang-btn');
            if (langBtn) {
                const lang = langBtn.dataset.lang;
                this.setLanguage(lang);
            }
        });
    },

    // ---- Theme ----
    toggleTheme() {
        const current = Storage.getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        Storage.setTheme(next);
        this.applyTheme();
    },

    applyTheme() {
        const theme = Storage.getTheme();
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-toggle').forEach(t => t.classList.toggle('active', theme === 'dark'));
    },

    // ---- Language ----
    setLanguage(lang) {
        I18N.setLanguage(lang);
        this.applyLanguage();
        this.renderAllPages();
    },

    applyLanguage() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === I18N.currentLang);
        });
        document.querySelectorAll('[data-i18n]').forEach(el => {
            el.textContent = I18N.t(el.dataset.i18n);
        });
    },

    // ---- Page Lifecycle ----
    onPageLoad(page, params = {}) {
        this.currentPage = page;
        switch (page) {
            case 'dashboard': this.renderDashboard(); break;
            case 'products': this.renderProducts(); break;
            case 'add-product': this.renderAddProduct(); break;
            case 'ai-image-studio': this.renderAIStudio(); break;
            case 'voice-cataloger': this.renderVoiceCataloger(); break;
            case 'ai-listing': this.renderAIListing(); break;
            case 'ai-pricing': this.renderAIPricing(); break;
            case 'product-preview': this.renderProductPreview(params); break;
            case 'marketplace': this.renderMarketplace(); break;
            case 'orders': this.renderOrders(); break;
            case 'order-details': this.renderOrderDetails(params); break;
            case 'profile': this.renderProfile(); break;
        }
    },

    renderAllPages() {
        this.renderDashboard();
        this.renderProducts();
        this.renderMarketplace();
        this.renderOrders();
        this.renderProfile();
    },

    // ---- Utility ----
    formatPrice(price) {
        return '₹' + Number(price).toLocaleString('en-IN');
    },

    getGreeting() {
        const h = new Date().getHours();
        if (h < 12) return I18N.t('goodMorning');
        if (h < 17) return I18N.t('goodAfternoon');
        return I18N.t('goodEvening');
    },

    // ---- Stats (API with mock fallback) ----
    async getStats() {
        if (this._apiAvailable) {
            try {
                const [productStats, orderStats] = await Promise.all([
                    API.products.stats(),
                    API.orders.stats(),
                ]);
                return {
                    products: productStats.total_products,
                    orders: orderStats.total_orders,
                    revenue: orderStats.total_revenue,
                };
            } catch {
                // Fall through to mock
            }
        }
        // Mock fallback
        const products = Storage.getProducts();
        const totalRevenue = MOCK_ORDERS.filter(o => o.status === 'completed')
            .reduce((sum, o) => sum + o.price, 0);
        return {
            products: products.length,
            orders: MOCK_ORDERS.length,
            revenue: totalRevenue,
        };
    },

    showAIProcessing(messages, callback) {
        const overlay = document.createElement('div');
        overlay.className = 'ai-modal active';
        overlay.innerHTML = `
            <div class="ai-modal-content">
                <div class="ai-icon-pulse">🤖</div>
                <div class="ai-message" id="ai-proc-msg">${messages[0]}</div>
                <div class="ai-submessage" id="ai-proc-sub">Please wait...</div>
                <div class="progress-bar mt-6">
                    <div class="progress-bar-fill" id="ai-proc-bar" style="width:0%"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        let idx = 0;
        const bar = overlay.querySelector('#ai-proc-bar');
        const msgEl = overlay.querySelector('#ai-proc-msg');
        const interval = setInterval(() => {
            idx++;
            if (idx < messages.length) {
                msgEl.textContent = messages[idx];
                bar.style.width = ((idx + 1) / messages.length * 100) + '%';
            } else {
                clearInterval(interval);
                setTimeout(() => { overlay.remove(); if (callback) callback(); }, 500);
            }
        }, 800);
    },

    showToast(message, type = 'success') {
        const container = document.querySelector('.toast-container');
        if (!container) return;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || ''}</span>
            <span class="toast-message">${message}</span>
            <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    // ============================================
    // DASHBOARD
    // ============================================
    async renderDashboard() {
        const stats = await this.getStats();
        const products = Storage.getProducts();
        const recent = products.slice(0, 3);
        const user = Storage.getUser();
        const el = document.getElementById('page-dashboard');
        if (!el) return;

        el.innerHTML = `
            <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6)">
                <div>
                    <h1 class="text-h2">${this.getGreeting()}, ${user.name} ${I18N.t('greetingSuffix')}</h1>
                    <p class="text-small text-muted mt-2">${I18N.t('dashboardSubtitle')}</p>
                </div>
                <button class="btn btn-icon btn-ghost" style="position:relative">
                    🔔
                    <span style="position:absolute;top:6px;right:6px;width:8px;height:8px;background:var(--error);border-radius:50%;border:2px solid var(--surface)"></span>
                </button>
            </div>

            <div class="stats-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-3);margin-bottom:var(--space-6)">
                <div class="stat-card">
                    <div class="stat-card-icon" style="background:var(--primary-50);color:var(--primary)">📦</div>
                    <div class="stat-card-value">${stats.products}</div>
                    <div class="stat-card-label">${I18N.t('products')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon" style="background:var(--info-bg);color:var(--info)">📋</div>
                    <div class="stat-card-value">${stats.orders}</div>
                    <div class="stat-card-label">${I18N.t('orders')}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-card-icon" style="background:var(--success-bg);color:var(--success)">💰</div>
                    <div class="stat-card-value">${this.formatPrice(stats.revenue)}</div>
                    <div class="stat-card-label">${I18N.t('revenue')}</div>
                </div>
            </div>

            <div class="card card-accent" style="margin-bottom:var(--space-6);padding:var(--space-6);border-radius:var(--radius-xl);cursor:pointer" onclick="Navigation.navigate('add-product')">
                <div style="display:flex;align-items:center;justify-content:space-between">
                    <div>
                        <h3 style="font-size:var(--text-h3);margin-bottom:var(--space-1)">${I18N.t('addNewProduct')}</h3>
                        <p style="opacity:0.85;font-size:var(--text-small)">${I18N.t('addNewProductDesc')}</p>
                    </div>
                    <button class="btn" style="background:rgba(255,255,255,0.2);color:#fff;border-radius:var(--radius-full);min-height:44px">${I18N.t('start')} →</button>
                </div>
            </div>

            <div class="card" style="margin-bottom:var(--space-6);padding:var(--space-5)">
                <div style="display:flex;align-items:start;gap:var(--space-4)">
                    <div style="font-size:1.5rem">🤖</div>
                    <div style="flex:1">
                        <h4 style="font-size:var(--text-body);font-weight:var(--weight-semibold);margin-bottom:var(--space-1)">${I18N.t('aiAssistant')}</h4>
                        <p style="color:var(--muted);font-size:var(--text-small);margin-bottom:var(--space-3)">${I18N.t('aiAssistantSuggestion')}</p>
                        <button class="btn btn-sm btn-outline" onclick="toggleChatPanel()">${I18N.t('improve')}</button>
                    </div>
                </div>
            </div>

            <div class="section-header">
                <h3 class="section-title">${I18N.t('recentProducts')}</h3>
                <span class="section-action" onclick="Navigation.navigate('products')">${I18N.t('viewAll')}</span>
            </div>
            <div class="product-grid" style="margin-bottom:var(--space-8)">
                ${recent.map(p => this.renderProductCard(p)).join('')}
            </div>

            <div class="section-header">
                <h3 class="section-title">${I18N.t('quickActions')}</h3>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-3)">
                <div class="card card-interactive" style="text-align:center;padding:var(--space-4)" onclick="Navigation.navigate('add-product')">
                    <div style="font-size:1.5rem;margin-bottom:var(--space-2)">➕</div>
                    <div style="font-size:var(--text-caption);font-weight:var(--weight-medium)">${I18N.t('addProduct')}</div>
                </div>
                <div class="card card-interactive" style="text-align:center;padding:var(--space-4)" onclick="Navigation.navigate('ai-image-studio')">
                    <div style="font-size:1.5rem;margin-bottom:var(--space-2)">📸</div>
                    <div style="font-size:var(--text-caption);font-weight:var(--weight-medium)">${I18N.t('improvePhotos')}</div>
                </div>
                <div class="card card-interactive" style="text-align:center;padding:var(--space-4)" onclick="Navigation.navigate('marketplace')">
                    <div style="font-size:1.5rem;margin-bottom:var(--space-2)">🏪</div>
                    <div style="font-size:var(--text-caption);font-weight:var(--weight-medium)">${I18N.t('marketplace')}</div>
                </div>
                <div class="card card-interactive" style="text-align:center;padding:var(--space-4)" onclick="Navigation.navigate('orders')">
                    <div style="font-size:1.5rem;margin-bottom:var(--space-2)">📋</div>
                    <div style="font-size:var(--text-caption);font-weight:var(--weight-medium)">${I18N.t('orders')}</div>
                </div>
            </div>
        `;
    },

    // ============================================
    // PRODUCTS
    // ============================================
    async renderProducts() {
        let products;
        if (this._apiAvailable) {
            try {
                products = await API.products.list();
            } catch {
                products = Storage.getProducts();
            }
        } else {
            products = Storage.getProducts();
        }
        const el = document.getElementById('page-products');
        if (!el) return;

        el.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
                <h1 class="text-h1">${I18N.t('myProducts')}</h1>
                <button class="btn btn-primary btn-sm" onclick="Navigation.navigate('add-product')">+ ${I18N.t('addProduct')}</button>
            </div>

            <div class="search-bar" style="margin-bottom:var(--space-4)">
                <span class="search-icon">🔍</span>
                <input type="text" placeholder="${I18N.t('search')}..." id="product-search" oninput="App.filterProducts()">
            </div>

            <div class="chips" style="margin-bottom:var(--space-4)" id="product-filters">
                ${MOCK_CATEGORIES.map(c => `
                    <button class="chip ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}" onclick="App.filterProductsByCategory('${c.id}')">
                        ${c.emoji} ${I18N.t('cat' + c.name.replace(/[^a-zA-Z]/g, ''))}
                    </button>
                `).join('')}
            </div>

            <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-4)">
                <select class="form-select" style="width:auto;height:40px;font-size:var(--text-caption);padding:var(--space-2) var(--space-8) var(--space-2) var(--space-3)" id="product-sort" onchange="App.filterProducts()">
                    <option value="newest">${I18N.t('newest')}</option>
                    <option value="price">${I18N.t('price')}</option>
                    <option value="status">${I18N.t('status')}</option>
                </select>
            </div>

            <div id="products-list" class="product-grid">
                ${products.map(p => this.renderProductCard(p, true)).join('')}
            </div>
        `;
    },

    filterProducts() {
        const query = (document.getElementById('product-search')?.value || '').toLowerCase();
        const sort = document.getElementById('product-sort')?.value || 'newest';
        let products = Storage.getProducts();

        const activeChip = document.querySelector('#product-filters .chip.active');
        const cat = activeChip?.dataset.cat || 'all';

        if (cat !== 'all') {
            products = products.filter(p => p.category.toLowerCase().replace(/[^a-z]/g, '').includes(cat));
        }
        if (query) {
            products = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
        }
        if (sort === 'price') products.sort((a, b) => a.price - b.price);
        else if (sort === 'status') products.sort((a, b) => a.status.localeCompare(b.status));
        else products.sort((a, b) => new Date(b.dateAdded || b.created_at) - new Date(a.dateAdded || a.created_at));

        const container = document.getElementById('products-list');
        if (container) {
            container.innerHTML = products.length
                ? products.map(p => this.renderProductCard(p, true)).join('')
                : `<div class="empty-state" style="grid-column:1/-1">
                    <div class="empty-state-icon">📦</div>
                    <h3 class="empty-state-title">${I18N.t('noProducts')}</h3>
                    <p class="empty-state-text">${I18N.t('noProductsDesc')}</p>
                    <button class="btn btn-primary" onclick="Navigation.navigate('add-product')">${I18N.t('addProduct')}</button>
                   </div>`;
        }
    },

    filterProductsByCategory(catId) {
        document.querySelectorAll('#product-filters .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === catId));
        this.filterProducts();
    },

    renderProductCard(product, showActions = false) {
        const statusClass = product.status === 'published' ? 'badge-published' : 'badge-draft';
        const statusText = product.status === 'published' ? I18N.t('published') : I18N.t('draft');
        return `
            <div class="product-card" onclick="Navigation.navigate('product-preview', {productId: ${product.id}})">
                <div class="product-card-image">
                    <div class="placeholder-img">${product.emoji || '📦'}</div>
                </div>
                <div class="product-card-body">
                    <div class="product-card-title">${product.name}</div>
                    <div class="product-card-price">${this.formatPrice(product.price)}</div>
                    <div class="product-card-meta">
                        <span class="badge ${statusClass} badge-dot">${statusText}</span>
                        ${showActions ? `
                        <div style="display:flex;gap:var(--space-1)" onclick="event.stopPropagation()">
                            <button class="btn btn-icon btn-ghost" style="width:32px;height:32px;font-size:0.8rem" title="Edit" onclick="App.editProduct(${product.id})">✏️</button>
                            <button class="btn btn-icon btn-ghost" style="width:32px;height:32px;font-size:0.8rem" title="Delete" onclick="App.deleteProduct(${product.id})">🗑️</button>
                        </div>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    editProduct(id) {
        const product = Storage.getProducts().find(p => p.id === id);
        if (product) {
            this.productCreationFlow.listing = product;
            this.productCreationFlow.step = 3;
            Navigation.navigate('ai-pricing');
        }
    },

    async deleteProduct(id) {
        if (confirm('Delete this product?')) {
            if (this._apiAvailable) {
                try { await API.products.delete(id); } catch {}
            }
            Storage.deleteProduct(id);
            this.renderProducts();
            this.renderDashboard();
            this.showToast('Product deleted', 'info');
        }
    },

    // ============================================
    // ADD PRODUCT (Multi-step flow)
    // ============================================
    renderAddProduct() {
        this.productCreationFlow = { step: 1, photo: null, enhanced: false, voiceText: '', listing: null, price: null };
        const el = document.getElementById('page-add-product');
        if (!el) return;

        el.innerHTML = `
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
                <button class="btn btn-icon btn-ghost" onclick="Navigation.back()">←</button>
                <h1 class="text-h2">${I18N.t('addProductTitle')}</h1>
            </div>
            <div class="steps" id="add-steps">
                <div class="step active" data-step="1"><div class="step-number">1</div><div class="step-label">${I18N.t('step1')}</div></div>
                <div class="step" data-step="2"><div class="step-number">2</div><div class="step-label">${I18N.t('step2')}</div></div>
                <div class="step" data-step="3"><div class="step-number">3</div><div class="step-label">${I18N.t('step3')}</div></div>
                <div class="step" data-step="4"><div class="step-number">4</div><div class="step-label">${I18N.t('step4')}</div></div>
            </div>
            <div id="add-step-content"></div>
        `;
        this.renderAddStep(1);
    },

    renderAddStep(step) {
        this.productCreationFlow.step = step;
        const content = document.getElementById('add-step-content');
        if (!content) return;
        document.querySelectorAll('#add-steps .step').forEach(s => {
            const sNum = parseInt(s.dataset.step);
            s.classList.remove('active', 'completed');
            if (sNum === step) s.classList.add('active');
            else if (sNum < step) s.classList.add('completed');
        });
        switch (step) {
            case 1: this.renderPhotoStep(content); break;
            case 2: this.renderVoiceStep(content); break;
            case 3: this.renderPricingStep(content); break;
            case 4: this.renderPreviewStep(content); break;
        }
    },

    renderPhotoStep(container) {
        container.innerHTML = `
            <div class="animate-fadeInUp">
                <h2 class="text-h2" style="margin-bottom:var(--space-2)">${I18N.t('letsStartPhoto')}</h2>
                <p class="text-muted" style="margin-bottom:var(--space-8)">${I18N.t('photoSubtitle')}</p>
                <div class="upload-area" id="photo-upload" onclick="document.getElementById('photo-file-input').click()">
                    <div class="upload-area-icon">📸</div>
                    <div class="upload-area-title">${I18N.t('takePhoto')}</div>
                    <div class="upload-area-text">or ${I18N.t('chooseFromGallery').toLowerCase()}</div>
                    <input type="file" id="photo-file-input" accept="image/*" capture="environment" style="display:none" onchange="App.handlePhotoUpload(event)">
                </div>
                <div style="text-align:center;margin-top:var(--space-6)">
                    <button class="btn btn-outline btn-full" onclick="App.useDemoProduct()">🎨 ${I18N.t('useDemoProduct')}</button>
                </div>
            </div>
        `;
    },

    handlePhotoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            // Try API upload first
            if (this._apiAvailable) {
                API.images.upload(file).then(result => {
                    this.productCreationFlow.photo = result.path;
                    this.showAIProcessing([I18N.t('analyzing'), I18N.t('preparingImage')], () => this.renderAddStep(2));
                }).catch(() => {
                    // Fallback to local FileReader
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        this.productCreationFlow.photo = e.target.result;
                        this.showAIProcessing([I18N.t('analyzing'), I18N.t('preparingImage')], () => this.renderAddStep(2));
                    };
                    reader.readAsDataURL(file);
                });
            } else {
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.productCreationFlow.photo = e.target.result;
                    this.showAIProcessing([I18N.t('analyzing'), I18N.t('preparingImage')], () => this.renderAddStep(2));
                };
                reader.readAsDataURL(file);
            }
        }
    },

    useDemoProduct() {
        this.productCreationFlow.photo = 'demo';
        this.showAIProcessing([I18N.t('analyzing'), I18N.t('preparingImage')], () => Navigation.navigate('ai-image-studio'));
    },

    // ============================================
    // AI IMAGE STUDIO
    // ============================================
    renderAIStudio() {
        const el = document.getElementById('page-ai-image-studio');
        if (!el) return;
        el.innerHTML = `
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
                <button class="btn btn-icon btn-ghost" onclick="Navigation.back()">←</button>
                <h1 class="text-h2">${I18N.t('aiStudio')}</h1>
            </div>
            <div class="compare-slider" id="compare-slider">
                <div class="compare-before"><div style="text-align:center"><div style="font-size:4rem;margin-bottom:var(--space-2)">🧶</div><div style="font-size:var(--text-small);font-weight:var(--weight-semibold)">Before</div></div></div>
                <div class="compare-after" id="compare-after"><div style="text-align:center"><div style="font-size:4rem;margin-bottom:var(--space-2)">✨🧶✨</div><div style="font-size:var(--text-small);font-weight:var(--weight-semibold)">After</div></div></div>
                <div class="compare-divider" id="compare-divider"></div>
                <div class="compare-handle" id="compare-handle">⇔</div>
            </div>
            <p class="text-caption text-center mt-4 mb-4" style="color:var(--muted)">↔ Drag to compare before & after</p>
            <div style="display:flex;flex-wrap:wrap;gap:var(--space-2);margin-bottom:var(--space-6);justify-content:center">
                <button class="btn btn-outline btn-sm" onclick="this.classList.toggle('btn-primary')">✂️ ${I18N.t('removeBackground')}</button>
                <button class="btn btn-outline btn-sm" onclick="this.classList.toggle('btn-primary')">💡 ${I18N.t('improveLighting')}</button>
                <button class="btn btn-outline btn-sm" onclick="this.classList.toggle('btn-primary')">✨ ${I18N.t('enhanceQuality')}</button>
                <button class="btn btn-outline btn-sm" onclick="this.classList.toggle('btn-primary')">🔲 ${I18N.t('crop')}</button>
                <button class="btn btn-outline btn-sm" onclick="this.classList.toggle('btn-primary')">🔄 ${I18N.t('rotate')}</button>
            </div>
            <button class="btn btn-primary btn-lg btn-full" onclick="App.enhanceImage()">🤖 ${I18N.t('enhanceWithAI')}</button>
        `;
        this.initCompareSlider();
    },

    initCompareSlider() {
        const slider = document.getElementById('compare-slider');
        const after = document.getElementById('compare-after');
        const divider = document.getElementById('compare-divider');
        const handle = document.getElementById('compare-handle');
        if (!slider || !after) return;
        let isDragging = false;
        const updatePosition = (x) => {
            const rect = slider.getBoundingClientRect();
            let pct = ((x - rect.left) / rect.width) * 100;
            pct = Math.max(0, Math.min(100, pct));
            after.style.clipPath = `inset(0 0 0 ${pct}%)`;
            divider.style.left = pct + '%';
            handle.style.left = pct + '%';
        };
        slider.addEventListener('mousedown', (e) => { isDragging = true; updatePosition(e.clientX); });
        slider.addEventListener('touchstart', (e) => { isDragging = true; updatePosition(e.touches[0].clientX); }, { passive: true });
        document.addEventListener('mousemove', (e) => { if (isDragging) updatePosition(e.clientX); });
        document.addEventListener('touchmove', (e) => { if (isDragging) updatePosition(e.touches[0].clientX); }, { passive: true });
        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('touchend', () => isDragging = false);
    },

    enhanceImage() {
        this.showAIProcessing([I18N.t('analyzing'), I18N.t('removingBg'), I18N.t('improvingLight'), I18N.t('preparingImage')], () => {
            this.productCreationFlow.enhanced = true;
            const after = document.getElementById('compare-after');
            if (after) after.innerHTML = `<div style="text-align:center"><div style="font-size:4rem;margin-bottom:var(--space-2)">✨🧶✨</div><div style="font-size:var(--text-small);font-weight:var(--weight-semibold);color:#fff">Enhanced</div></div>`;
            const cs = document.querySelector('.compare-slider');
            if (cs) cs.style.boxShadow = '0 0 0 4px var(--success)';
            this.showToast('Image enhanced successfully!', 'success');
        });
    },

    // ============================================
    // VOICE CATALOGER
    // ============================================
    renderVoiceCataloger() {
        const el = document.getElementById('page-voice-cataloger');
        if (!el) return;
        el.innerHTML = `
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-8)">
                <button class="btn btn-icon btn-ghost" onclick="Navigation.back()">←</button>
                <h1 class="text-h2">${I18N.t('voiceTitle')}</h1>
            </div>
            <div class="text-center" style="margin-bottom:var(--space-8)">
                <p class="text-muted" style="margin-bottom:var(--space-10)">${I18N.t('voiceSubtitle')}</p>
                <button class="mic-btn" id="mic-btn" onclick="App.startListening()">🎤</button>
                <div class="waveform mt-6" id="waveform" style="display:none">${[1,2,3,4,5,6,7,8].map(() => '<div class="waveform-bar"></div>').join('')}</div>
                <p id="mic-status" class="text-muted mt-4" style="min-height:24px"></p>
                <div id="voice-result" class="mt-6" style="display:none">
                    <div class="card" style="text-align:left">
                        <p style="font-size:var(--text-body);line-height:var(--line-height-relaxed)" id="voice-text"></p>
                        <div class="mt-4"><span class="badge badge-primary">🇮🇳 ${I18N.t('teluguDetected')}</span></div>
                    </div>
                </div>
                <div id="voice-actions" class="mt-6" style="display:none">
                    <div style="display:flex;gap:var(--space-3);justify-content:center">
                        <button class="btn btn-outline" onclick="App.startListening()">🔄 ${I18N.t('editListing')}</button>
                        <button class="btn btn-primary" onclick="App.generateListingFromVoice()">✨ ${I18N.t('generateListing')}</button>
                    </div>
                </div>
            </div>
        `;
    },

    startListening() {
        const micBtn = document.getElementById('mic-btn');
        const waveform = document.getElementById('waveform');
        const status = document.getElementById('mic-status');
        if (!micBtn) return;
        micBtn.classList.add('listening');
        micBtn.innerHTML = '🔴';
        if (waveform) waveform.style.display = 'flex';
        if (status) status.textContent = I18N.t('listening');

        setTimeout(() => {
            micBtn.classList.remove('listening');
            micBtn.classList.add('processing');
            micBtn.innerHTML = '⏳';
            if (status) status.textContent = I18N.t('processing');
            setTimeout(() => {
                const text = VOICE_SIMULATIONS[Math.floor(Math.random() * VOICE_SIMULATIONS.length)];
                this.productCreationFlow.voiceText = text;
                micBtn.classList.remove('processing');
                micBtn.classList.add('complete');
                micBtn.innerHTML = '✅';
                if (waveform) waveform.style.display = 'none';
                if (status) status.textContent = '';
                const result = document.getElementById('voice-result');
                const actions = document.getElementById('voice-actions');
                const textEl = document.getElementById('voice-text');
                if (result) result.style.display = 'block';
                if (actions) actions.style.display = 'block';
                if (textEl) textEl.textContent = text;
            }, 2000);
        }, 2500);
    },

    async generateListingFromVoice() {
        const text = this.productCreationFlow.voiceText || VOICE_SIMULATIONS[0];
        let listing;
        if (this._apiAvailable) {
            try {
                listing = await API.catalog.generate(text);
                listing.emoji = '🧶';
            } catch { listing = null; }
        }
        if (!listing) {
            listing = {
                name: 'Handwoven Silk Saree',
                category: 'Textiles',
                description: text,
                keywords: ['silk', 'handwoven', 'zari', 'saree'],
                languages: ['English', 'Hindi'],
                emoji: '🧶'
            };
        }
        this.productCreationFlow.listing = listing;
        Navigation.navigate('ai-listing');
    },

    // ============================================
    // AI LISTING
    // ============================================
    renderAIListing() {
        const el = document.getElementById('page-ai-listing');
        const listing = this.productCreationFlow.listing || {
            name: 'Handwoven Silk Saree', category: 'Textiles',
            description: 'Beautifully handcrafted silk saree featuring a traditional zari border.',
            keywords: ['silk', 'handwoven', 'zari', 'saree'],
            languages: ['English', 'Hindi'], emoji: '🧶'
        };
        this.productCreationFlow.listing = listing;
        if (!el) return;
        el.innerHTML = `
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
                <button class="btn btn-icon btn-ghost" onclick="Navigation.back()">←</button>
                <h1 class="text-h2">${I18N.t('listingReady')}</h1>
            </div>
            <div class="card mb-6" style="text-align:center;padding:var(--space-8)">
                <div style="font-size:4rem;margin-bottom:var(--space-4)">${listing.emoji}</div>
                <h2 class="text-h2" style="margin-bottom:var(--space-2)">${listing.name}</h2>
                <span class="badge badge-primary">${listing.category}</span>
            </div>
            <div class="form-group"><label class="form-label">${I18N.t('productName')}</label><input class="form-input" value="${listing.name}" id="listing-name"></div>
            <div class="form-group"><label class="form-label">${I18N.t('category')}</label>
                <select class="form-select form-input" id="listing-category">
                    ${MOCK_CATEGORIES.filter(c => c.id !== 'all').map(c => `<option value="${c.name}" ${listing.category === c.name ? 'selected' : ''}>${c.emoji} ${c.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group"><label class="form-label">${I18N.t('description')}</label><textarea class="form-input form-textarea" id="listing-description">${listing.description}</textarea></div>
            <div class="form-group"><label class="form-label">${I18N.t('keywords')}</label>
                <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)" id="listing-keywords">${listing.keywords.map(k => `<span class="badge badge-primary">${k}</span>`).join('')}</div>
            </div>
            <div class="form-group"><label class="form-label">${I18N.t('languages_')}</label>
                <div style="display:flex;gap:var(--space-2)">${(listing.languages || ['English']).map(l => `<span class="badge badge-accent">${l}</span>`).join('')}</div>
            </div>
            <div style="display:flex;gap:var(--space-3)">
                <button class="btn btn-outline btn-full" onclick="App.regenerateListing()">🔄 ${I18N.t('regenerate')}</button>
                <button class="btn btn-primary btn-full" onclick="App.confirmListing()">✨ ${I18N.t('looksGood')}</button>
            </div>
        `;
    },

    regenerateListing() {
        this.showAIProcessing([I18N.t('analyzing'), 'Generating description...', 'Finding keywords...'], () => {
            const texts = VOICE_SIMULATIONS;
            if (this.productCreationFlow.listing) {
                this.productCreationFlow.listing.description = texts[Math.floor(Math.random() * texts.length)];
            }
            this.renderAIListing();
            this.showToast('Listing regenerated!', 'success');
        });
    },

    confirmListing() {
        if (this.productCreationFlow.listing) {
            this.productCreationFlow.listing.name = document.getElementById('listing-name')?.value || 'Product';
            this.productCreationFlow.listing.description = document.getElementById('listing-description')?.value || '';
            this.productCreationFlow.listing.category = document.getElementById('listing-category')?.value || 'Handicrafts';
        }
        Navigation.navigate('ai-pricing');
    },

    // ============================================
    // AI PRICING (with API)
    // ============================================
    async renderAIPricing() {
        const el = document.getElementById('page-ai-pricing');
        if (!el) return;
        const listing = this.productCreationFlow.listing || {};
        let recommendedPrice = Math.floor(Math.random() * 600) + 700;
        let rangeLow = recommendedPrice - 100;
        let rangeHigh = recommendedPrice + 100;
        let explanation = 'Based on your costs and market patterns.';

        // Try API pricing
        if (this._apiAvailable) {
            try {
                const result = await API.pricing.recommend({
                    materialCost: 700,
                    labourCost: 300,
                    category: listing.category || 'Textiles',
                    quality: 'medium',
                    productName: listing.name || '',
                });
                recommendedPrice = result.recommended_price;
                rangeLow = result.price_range.min;
                rangeHigh = result.price_range.max;
                explanation = result.explanation;
            } catch { /* use fallback */ }
        }

        this.productCreationFlow.price = recommendedPrice;

        el.innerHTML = `
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
                <button class="btn btn-icon btn-ghost" onclick="Navigation.back()">←</button>
                <h1 class="text-h2">${I18N.t('pricingTitle')}</h1>
            </div>
            <p class="text-muted mb-6">${I18N.t('pricingSubtitle')}</p>
            <div class="form-group"><label class="form-label">${I18N.t('rawMaterialCost')}</label><input class="form-input" type="number" value="700" id="pricing-material" oninput="App.recalcPrice()"></div>
            <div class="form-group"><label class="form-label">${I18N.t('labourCost')}</label><input class="form-input" type="number" value="300" id="pricing-labour" oninput="App.recalcPrice()"></div>
            <div class="form-group"><label class="form-label">${I18N.t('category')}</label><input class="form-input" value="${listing.category || 'Textiles'}" disabled></div>
            <div class="form-group"><label class="form-label">${I18N.t('quality')}</label>
                <select class="form-select form-input" id="pricing-quality" onchange="App.recalcPrice()"><option value="high">High</option><option value="medium" selected>Medium</option><option value="standard">Standard</option></select>
            </div>
            <div class="card card-accent mt-6" style="text-align:center;padding:var(--space-8);margin-bottom:var(--space-6)">
                <p style="font-size:var(--text-small);opacity:0.8;margin-bottom:var(--space-2)">${I18N.t('recommendedPrice')}</p>
                <div style="font-size:2.5rem;font-weight:var(--weight-bold);margin-bottom:var(--space-2)" id="ai-price">${this.formatPrice(recommendedPrice)}</div>
                <p style="font-size:var(--text-small);opacity:0.8">${I18N.t('suggestedRange')}: <span id="price-range">${this.formatPrice(rangeLow)} – ${this.formatPrice(rangeHigh)}</span></p>
                <span class="badge" style="background:rgba(255,255,255,0.2);color:#fff;margin-top:var(--space-3)">✅ ${I18N.t('competitive')}</span>
            </div>
            <p class="text-caption text-center mb-6" style="color:var(--muted)">${explanation}</p>
            <div style="display:flex;gap:var(--space-3)">
                <button class="btn btn-primary btn-full btn-lg" onclick="App.useSuggestedPrice()">💰 ${I18N.t('usePrice')} ${this.formatPrice(recommendedPrice)}</button>
                <button class="btn btn-outline btn-full btn-lg" onclick="App.enterManualPrice()">✏️ ${I18N.t('enterManually')}</button>
            </div>
        `;
    },

    recalcPrice() {
        const material = parseInt(document.getElementById('pricing-material')?.value) || 0;
        const labour = parseInt(document.getElementById('pricing-labour')?.value) || 0;
        const quality = document.getElementById('pricing-quality')?.value;
        const multiplier = quality === 'high' ? 1.3 : quality === 'medium' ? 1.15 : 1.0;
        const price = Math.round((material + labour) * multiplier);
        this.productCreationFlow.price = price;
        const priceEl = document.getElementById('ai-price');
        const rangeEl = document.getElementById('price-range');
        if (priceEl) priceEl.textContent = this.formatPrice(price);
        if (rangeEl) rangeEl.textContent = `${this.formatPrice(price - 100)} – ${this.formatPrice(price + 100)}`;
    },

    useSuggestedPrice() { Navigation.navigate('product-preview'); },

    enterManualPrice() {
        const price = prompt('Enter your price (₹):');
        if (price && !isNaN(price)) {
            this.productCreationFlow.price = parseInt(price);
            Navigation.navigate('product-preview');
        }
    },

    // ============================================
    // PRODUCT PREVIEW
    // ============================================
    renderProductPreview(params = {}) {
        const el = document.getElementById('page-product-preview');
        if (!el) return;
        const flow = this.productCreationFlow;
        let product;
        if (params.productId) {
            product = Storage.getProducts().find(p => p.id === params.productId);
        }
        if (!product) {
            product = {
                name: flow.listing?.name || 'Handwoven Silk Saree', price: flow.price || 1299,
                emoji: flow.listing?.emoji || '🧶', description: flow.listing?.description || 'Beautifully handcrafted silk saree.',
                category: flow.listing?.category || 'Textiles', material: 'Silk', craftType: 'Handwoven',
                languages: flow.listing?.languages || ['English', 'Hindi']
            };
        }
        el.innerHTML = `
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
                <button class="btn btn-icon btn-ghost" onclick="Navigation.back()">←</button>
                <h1 class="text-h2">${I18N.t('previewTitle')}</h1>
            </div>
            <div class="card mb-6" style="padding:0;overflow:hidden">
                <div style="aspect-ratio:1;background:linear-gradient(135deg, var(--secondary), var(--secondary-dark));display:flex;align-items:center;justify-content:center;font-size:6rem">${product.emoji}</div>
            </div>
            <h2 class="text-h1 mb-2">${product.name}</h2>
            <div style="font-size:var(--text-h1);font-weight:var(--weight-bold);color:var(--primary);margin-bottom:var(--space-4)">${this.formatPrice(product.price)}</div>
            <p style="color:var(--text-secondary);line-height:var(--line-height-relaxed);margin-bottom:var(--space-6)">${product.description}</p>
            <div class="card mb-6">
                <h3 class="text-h3 mb-4">${I18N.t('orderDetails')}</h3>
                <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                    <div style="display:flex;justify-content:space-between"><span class="text-muted">${I18N.t('material')}</span><span class="text-small" style="font-weight:var(--weight-semibold)">${product.material || 'Silk'}</span></div>
                    <div class="divider" style="margin:0"></div>
                    <div style="display:flex;justify-content:space-between"><span class="text-muted">${I18N.t('category')}</span><span class="text-small" style="font-weight:var(--weight-semibold)">${product.category}</span></div>
                    <div class="divider" style="margin:0"></div>
                    <div style="display:flex;justify-content:space-between"><span class="text-muted">${I18N.t('craftType')}</span><span class="text-small" style="font-weight:var(--weight-semibold)">${product.craftType || 'Handwoven'}</span></div>
                </div>
            </div>
            <div style="margin-bottom:var(--space-6)">
                <span class="text-muted text-small" style="display:block;margin-bottom:var(--space-2)">${I18N.t('languages_')}:</span>
                <div style="display:flex;gap:var(--space-2)">${(product.languages || ['English']).map(l => `<span class="badge badge-accent">${l}</span>`).join('')}</div>
            </div>
            ${params.productId ? `<button class="btn btn-outline btn-full mb-4" onclick="Navigation.navigate('add-product')">✏️ ${I18N.t('edit')}</button>` :
            `<button class="btn btn-primary btn-full btn-lg" onclick="App.publishProduct()">🚀 ${I18N.t('publishProduct')}</button>`}
        `;
    },

    async publishProduct() {
        const flow = this.productCreationFlow;
        const productData = {
            name: flow.listing?.name || 'New Product',
            price: flow.price || 999,
            category: flow.listing?.category || 'Handicrafts',
            status: 'published',
            emoji: flow.listing?.emoji || '📦',
            description: flow.listing?.description || 'A beautiful handcrafted product.',
            material: 'Mixed', craftType: 'Handmade',
            keywords: flow.listing?.keywords || [],
            languages: flow.listing?.languages || ['English'],
        };

        // Try API first
        if (this._apiAvailable) {
            try {
                await API.products.create(productData);
                this.showAIProcessing(['Publishing...', 'Almost ready...'], () => Navigation.navigate('success'));
                return;
            } catch { /* fallback to local */ }
        }

        // Local fallback
        Storage.addProduct(productData);
        this.showAIProcessing(['Publishing...', 'Almost ready...'], () => Navigation.navigate('success'));
    },

    // ============================================
    // SUCCESS
    // ============================================
    renderSuccessPage() {
        const el = document.getElementById('page-success');
        if (!el) return;
        el.innerHTML = `
            <div style="text-align:center;padding:var(--space-16) var(--space-4)">
                <div style="width:100px;height:100px;border-radius:50%;background:var(--success-bg);display:flex;align-items:center;justify-content:center;margin:0 auto var(--space-8);font-size:3rem" class="success-check">✅</div>
                <h1 class="text-h1 mb-4">${I18N.t('successTitle')}</h1>
                <p class="text-muted mb-8" style="max-width:400px;margin-left:auto;margin-right:auto">${I18N.t('successSubtitle')}</p>
                <div style="display:flex;flex-direction:column;gap:var(--space-3);max-width:300px;margin:0 auto">
                    <button class="btn btn-primary btn-lg btn-full" onclick="Navigation.navigate('products')">${I18N.t('viewProduct')}</button>
                    <button class="btn btn-outline btn-full" onclick="Navigation.navigate('add-product')">${I18N.t('addAnother')}</button>
                </div>
            </div>
        `;
        this.addConfetti();
    },

    addConfetti() {
        const colors = ['#0d7c5f', '#e8842c', '#16a34a', '#d97706', '#2563eb', '#dc2626'];
        for (let i = 0; i < 30; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = Math.random() * 100 + 'vw';
            c.style.background = colors[Math.floor(Math.random() * colors.length)];
            c.style.animationDelay = Math.random() * 2 + 's';
            c.style.animationDuration = (Math.random() * 2 + 2) + 's';
            document.body.appendChild(c);
            setTimeout(() => c.remove(), 5000);
        }
    },

    // ============================================
    // MARKETPLACE (with API)
    // ============================================
    async renderMarketplace() {
        let products;
        if (this._apiAvailable) {
            try {
                products = await API.products.list({ status: 'published' });
            } catch {
                products = Storage.getProducts().filter(p => p.status === 'published');
            }
        } else {
            products = Storage.getProducts().filter(p => p.status === 'published');
        }
        const el = document.getElementById('page-marketplace');
        if (!el) return;
        el.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
                <h1 class="text-h1">${I18N.t('marketplaceTitle')}</h1>
            </div>
            <div class="search-bar" style="margin-bottom:var(--space-4)"><span class="search-icon">🔍</span><input type="text" placeholder="${I18N.t('search')}..." id="marketplace-search" oninput="App.filterMarketplace()"></div>
            <div class="chips" style="margin-bottom:var(--space-6)" id="marketplace-filters">
                ${MOCK_CATEGORIES.map(c => `<button class="chip ${c.id === 'all' ? 'active' : ''}" data-cat="${c.id}" onclick="App.filterMarketplaceByCategory('${c.id}')">${c.emoji} ${I18N.t('cat' + c.name.replace(/[^a-zA-Z]/g, ''))}</button>`).join('')}
            </div>
            <div class="section-header"><h3 class="section-title">${I18N.t('featuredProducts')}</h3></div>
            <div id="marketplace-list" class="marketplace-grid mb-8">
                ${products.map(p => `<div class="product-card" onclick="Navigation.navigate('product-preview', {productId: ${p.id}})"><div class="product-card-image"><div class="placeholder-img">${p.emoji}</div></div><div class="product-card-body"><div class="product-card-title">${p.name}</div><div style="display:flex;align-items:center;justify-content:space-between"><div class="product-card-price">${this.formatPrice(p.price)}</div><button class="btn btn-sm btn-primary" onclick="event.stopPropagation();App.showToast('Added to cart!', 'success')" style="min-height:36px;padding:var(--space-2) var(--space-3);font-size:var(--text-caption)">🛒</button></div></div></div>`).join('')}
            </div>
        `;
    },

    filterMarketplace() {
        const query = (document.getElementById('marketplace-search')?.value || '').toLowerCase();
        const activeChip = document.querySelector('#marketplace-filters .chip.active');
        const cat = activeChip?.dataset.cat || 'all';
        let products = Storage.getProducts().filter(p => p.status === 'published');
        if (cat !== 'all') products = products.filter(p => p.category.toLowerCase().replace(/[^a-z]/g, '').includes(cat));
        if (query) products = products.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
        const container = document.getElementById('marketplace-list');
        if (container) {
            container.innerHTML = products.map(p => `<div class="product-card" onclick="Navigation.navigate('product-preview', {productId: ${p.id}})"><div class="product-card-image"><div class="placeholder-img">${p.emoji}</div></div><div class="product-card-body"><div class="product-card-title">${p.name}</div><div style="display:flex;align-items:center;justify-content:space-between"><div class="product-card-price">${this.formatPrice(p.price)}</div><button class="btn btn-sm btn-primary" onclick="event.stopPropagation();App.showToast('Added to cart!', 'success')" style="min-height:36px;padding:var(--space-2) var(--space-3);font-size:var(--text-caption)">🛒</button></div></div></div>`).join('') || `<div class="empty-state" style="grid-column:1/-1"><p class="text-muted">No products found</p></div>`;
        }
    },

    filterMarketplaceByCategory(catId) {
        document.querySelectorAll('#marketplace-filters .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === catId));
        this.filterMarketplace();
    },

    // ============================================
    // ORDERS (with API)
    // ============================================
    async renderOrders(filterTab = 'all') {
        const el = document.getElementById('page-orders');
        if (!el) return;

        let orders;
        if (this._apiAvailable) {
            try {
                orders = filterTab === 'all' ? await API.orders.list() : await API.orders.list({ status: filterTab });
            } catch {
                orders = MOCK_ORDERS;
            }
        } else {
            orders = filterTab === 'all' ? [...MOCK_ORDERS] : MOCK_ORDERS.filter(o => o.status === filterTab);
        }

        el.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-6)">
                <h1 class="text-h1">${I18N.t('ordersTitle')}</h1>
            </div>
            <div class="tabs mb-6" id="order-tabs">
                <button class="tab ${filterTab === 'all' ? 'active' : ''}" onclick="App.renderOrders('all')">${I18N.t('all')}</button>
                <button class="tab ${filterTab === 'pending' ? 'active' : ''}" onclick="App.renderOrders('pending')">${I18N.t('pending')}</button>
                <button class="tab ${filterTab === 'processing' ? 'active' : ''}" onclick="App.renderOrders('processing')">${I18N.t('processing_')}</button>
                <button class="tab ${filterTab === 'completed' ? 'active' : ''}" onclick="App.renderOrders('completed')">${I18N.t('completed')}</button>
            </div>
            <div style="display:flex;flex-direction:column;gap:var(--space-3)">
                ${orders.length === 0 ? `<div class="empty-state"><div class="empty-state-icon">📋</div><h3 class="empty-state-title">No orders</h3><p class="empty-state-text">No orders in this category.</p></div>` :
                orders.map(o => `<div class="order-card" onclick="Navigation.navigate('order-details', {orderId: '${o.order_id || o.id}'})"><div class="order-card-header"><span class="order-id">${o.order_id || o.id}</span><span class="badge badge-${o.status === 'completed' ? 'completed' : o.status === 'processing' ? 'processing' : 'pending'} badge-dot">${I18N.t(o.status === 'completed' ? 'completed' : o.status === 'processing' ? 'processing_' : 'pending')}</span></div><div class="order-card-body"><div class="order-card-image">${o.product_emoji || o.emoji || '📦'}</div><div class="order-card-info"><div class="order-card-title">${o.product_name || o.productName}</div><div style="display:flex;align-items:center;justify-content:space-between"><div class="order-card-price">${this.formatPrice(o.price)}</div><span class="text-caption text-muted">${o.date || ''}</span></div></div></div></div>`).join('')}
            </div>
        `;
    },

    // ============================================
    // ORDER DETAILS
    // ============================================
    async renderOrderDetails(params = {}) {
        const el = document.getElementById('page-order-details');
        if (!el) return;

        let order;
        if (this._apiAvailable && params.orderId) {
            try { order = await API.orders.get(params.orderId); } catch { order = null; }
        }
        if (!order) {
            order = MOCK_ORDERS.find(o => o.id === params.orderId || o.order_id === params.orderId) || MOCK_ORDERS[0];
        }

        const timeline = order.timeline || [
            { step: 'Order received', date: '', completed: true },
            { step: 'Processing', date: '', completed: false },
            { step: 'Shipped', date: '', completed: false },
            { step: 'Delivered', date: '', completed: false },
        ];

        el.innerHTML = `
            <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-6)">
                <button class="btn btn-icon btn-ghost" onclick="Navigation.navigate('orders')">←</button>
                <h1 class="text-h2">${I18N.t('orderDetails')}</h1>
            </div>
            <div class="card mb-6">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4)">
                    <span class="order-id" style="font-size:var(--text-body)">${order.order_id || order.id}</span>
                    <span class="badge badge-${order.status === 'completed' ? 'completed' : order.status === 'processing' ? 'processing' : 'pending'} badge-dot">${I18N.t(order.status === 'completed' ? 'completed' : order.status === 'processing' ? 'processing_' : 'pending')}</span>
                </div>
                <div style="display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-4)">
                    <div class="order-card-image" style="width:64px;height:64px;font-size:2rem">${order.product_emoji || order.emoji || '📦'}</div>
                    <div><div style="font-weight:var(--weight-semibold)">${order.product_name || order.productName}</div><div style="color:var(--primary);font-weight:var(--weight-bold)">${this.formatPrice(order.price)}</div></div>
                </div>
                <div class="divider"></div>
                <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-top:var(--space-4)">
                    <div style="display:flex;justify-content:space-between"><span class="text-muted text-small">${I18N.t('buyer')}</span><span style="font-weight:var(--weight-medium);font-size:var(--text-small)">${order.buyer_name || order.buyer}</span></div>
                    <div style="display:flex;justify-content:space-between"><span class="text-muted text-small">${I18N.t('quantity')}</span><span style="font-weight:var(--weight-medium);font-size:var(--text-small)">${order.quantity}</span></div>
                    <div style="display:flex;justify-content:space-between"><span class="text-muted text-small">${I18N.t('shippingStatus')}</span><span style="font-weight:var(--weight-medium);font-size:var(--text-small)">${order.buyer_address || order.address || ''}</span></div>
                </div>
            </div>
            <h3 class="text-h3 mb-4">${I18N.t('timeline')}</h3>
            <div class="timeline">
                ${timeline.map(t => `<div class="timeline-item ${t.completed ? 'completed' : ''}"><div class="timeline-dot"></div><div><div class="timeline-text">${t.step}</div>${t.date ? `<div class="timeline-date">${t.date}</div>` : ''}</div></div>`).join('')}
            </div>
        `;
    },

    // ============================================
    // PROFILE
    // ============================================
    renderProfile() {
        const user = Storage.getUser();
        const el = document.getElementById('page-profile');
        if (!el) return;
        el.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar">${user.avatar}</div>
                <h2 class="profile-name">${user.name}</h2>
                <p class="profile-role">${user.role} • ${user.location}</p>
            </div>
            <div class="lang-selector mb-6" style="justify-content:center">
                ${I18N.getLanguages().map(l => `<button class="lang-btn ${I18N.currentLang === l.code ? 'active' : ''}" data-lang="${l.code}" onclick="App.setLanguage('${l.code}')">${l.native}</button>`).join('')}
            </div>
            <div class="profile-menu">
                <div class="profile-menu-item"><div class="profile-menu-icon" style="background:var(--primary-50);color:var(--primary)">🏪</div><div class="profile-menu-text"><div class="profile-menu-label">${I18N.t('businessProfile')}</div><div class="profile-menu-desc">${user.shopName}</div></div><span class="profile-menu-arrow">→</span></div>
                <div class="profile-menu-item"><div class="profile-menu-icon" style="background:var(--info-bg);color:var(--info)">🌐</div><div class="profile-menu-text"><div class="profile-menu-label">${I18N.t('languages')}</div><div class="profile-menu-desc">${user.languages.join(', ')}</div></div><span class="profile-menu-arrow">→</span></div>
                <div class="profile-menu-item"><div class="profile-menu-icon" style="background:var(--warning-bg);color:var(--warning)">🔔</div><div class="profile-menu-text"><div class="profile-menu-label">${I18N.t('notifications')}</div><div class="profile-menu-desc">On</div></div><span class="profile-menu-arrow">→</span></div>
                <div class="profile-menu-item" onclick="App.toggleTheme()"><div class="profile-menu-icon" style="background:var(--secondary);color:var(--accent)">🌙</div><div class="profile-menu-text"><div class="profile-menu-label">${I18N.t('appearance')}</div><div class="profile-menu-desc">${Storage.getTheme() === 'dark' ? 'Dark' : 'Light'} mode</div></div><div class="theme-toggle ${Storage.getTheme() === 'dark' ? 'active' : ''}"></div></div>
                <div class="profile-menu-item"><div class="profile-menu-icon" style="background:var(--success-bg);color:var(--success)">❓</div><div class="profile-menu-text"><div class="profile-menu-label">${I18N.t('helpSupport')}</div></div><span class="profile-menu-arrow">→</span></div>
                <div class="profile-menu-item"><div class="profile-menu-icon" style="background:var(--surface-hover);color:var(--muted)">ℹ️</div><div class="profile-menu-text"><div class="profile-menu-label">${I18N.t('about')}</div><div class="profile-menu-desc">v1.0.0</div></div><span class="profile-menu-arrow">→</span></div>
                <div class="divider" style="margin:var(--space-4) 0"></div>
                <div class="profile-menu-item" onclick="App.logout()" style="color:var(--error)"><div class="profile-menu-icon" style="background:var(--error-bg);color:var(--error)">🚪</div><div class="profile-menu-text"><div class="profile-menu-label">Logout</div></div></div>
            </div>
        `;
    },

    logout() {
        Storage.setLoggedIn(false);
        Navigation.navigate('landing');
    }
};

// ---- Chat Panel ----
function toggleChatPanel() {
    const panel = document.getElementById('chat-panel');
    if (panel) {
        panel.classList.toggle('active');
        if (panel.classList.contains('active')) addChatMessage('ai', I18N.t('aiSuggestion1'));
    }
}

function addChatMessage(type, text) {
    const messages = document.getElementById('chat-messages');
    if (!messages) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble chat-bubble-${type === 'ai' ? 'ai' : 'user'}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;
    addChatMessage('user', input.value);
    input.value = '';
    setTimeout(() => {
        const response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
        addChatMessage('ai', response);
    }, 800);
}

function handleChatSuggestion(text) {
    addChatMessage('user', text);
    setTimeout(() => {
        const response = AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
        addChatMessage('ai', response);
    }, 800);
}

// ---- Landing & Login ----
function goToLogin() { Navigation.navigate('login'); }
function demoLogin() {
    Storage.setLoggedIn(true);
    Navigation.navigate('dashboard');
    App.showToast('Welcome, Bhargav! 🎉', 'success');
}

// ---- Navigation Override: handle success page ----
(function() {
    const origNavigate = Navigation.navigate.bind(Navigation);
    Navigation.navigate = function(page, params) {
        origNavigate(page, params);
        if (page === 'success') App.renderSuccessPage();
    };
})();

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => App.init());
