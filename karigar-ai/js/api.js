/* ============================================
   KarigarAI - API Client Module

   Communicates with the FastAPI backend.
   Falls back to mock data if backend is unavailable.
   ============================================ */

const API = {
    // Auto-detect API base URL (same origin in production, localhost in dev)
    BASE_URL: window.location.origin,
    _available: null, // cached availability check
    _checkTimeout: 3000,

    // ---- Core HTTP Client ----
    async request(method, path, data = null, options = {}) {
        const url = this.BASE_URL + path;
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        if (data && method !== 'GET') {
            if (data instanceof FormData) {
                delete config.headers['Content-Type'];
                config.body = data;
            } else {
                config.body = JSON.stringify(data);
            }
        }

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.detail || `HTTP ${response.status}`);
            }
            return await response.json();
        } catch (err) {
            console.warn(`API ${method} ${path} failed:`, err.message);
            throw err;
        }
    },

    async get(path) { return this.request('GET', path); },
    async post(path, data) { return this.request('POST', path, data); },
    async put(path, data) { return this.request('PUT', path, data); },
    async del(path) { return this.request('DELETE', path); },

    // ---- Health Check ----
    async isAvailable() {
        if (this._available !== null) return this._available;
        try {
            const result = await Promise.race([
                fetch(this.BASE_URL + '/health', { method: 'GET' }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), this._checkTimeout)),
            ]);
            this._available = result.ok;
        } catch {
            this._available = false;
        }
        return this._available;
    },

    // ---- Products API ----
    products: {
        async list(params = {}) {
            const qs = new URLSearchParams();
            if (params.category) qs.set('category', params.category);
            if (params.status) qs.set('status', params.status);
            if (params.search) qs.set('search', params.search);
            if (params.sort) qs.set('sort', params.sort);
            const query = qs.toString();
            return API.get(`/api/products${query ? '?' + query : ''}`);
        },

        async get(id) {
            return API.get(`/api/products/${id}`);
        },

        async create(data) {
            return API.post('/api/products', data);
        },

        async update(id, data) {
            return API.put(`/api/products/${id}`, data);
        },

        async delete(id) {
            return API.del(`/api/products/${id}`);
        },

        async publish(id) {
            return API.post(`/api/products/${id}/publish`);
        },

        async duplicate(id) {
            return API.post(`/api/products/${id}/duplicate`);
        },

        async stats() {
            return API.get('/api/products/stats');
        },
    },

    // ---- Orders API ----
    orders: {
        async list(params = {}) {
            const qs = new URLSearchParams();
            if (params.status) qs.set('status', params.status);
            const query = qs.toString();
            return API.get(`/api/orders${query ? '?' + query : ''}`);
        },

        async get(orderId) {
            return API.get(`/api/orders/${orderId}`);
        },

        async create(data) {
            return API.post('/api/orders', data);
        },

        async updateStatus(orderId, status) {
            return API.put(`/api/orders/${orderId}/status`, { status });
        },

        async stats() {
            return API.get('/api/orders/stats');
        },
    },

    // ---- Images API ----
    images: {
        async upload(file) {
            const formData = new FormData();
            formData.append('file', file);
            return API.request('POST', '/api/images/upload', formData);
        },

        async enhance(imagePath, options = {}) {
            return API.post('/api/images/enhance', {
                image_path: imagePath,
                remove_bg: options.removeBg ?? true,
                improve_lighting: options.improveLighting ?? true,
                enhance_quality: options.enhanceQuality ?? true,
            });
        },

        async analyze(imagePath) {
            const formData = new FormData();
            formData.append('image_path', imagePath);
            return API.request('POST', '/api/images/analyze', formData);
        },
    },

    // ---- Catalog API ----
    catalog: {
        async transcribe(audioFile) {
            const formData = new FormData();
            formData.append('file', audioFile);
            return API.request('POST', '/api/catalog/transcribe', formData);
        },

        async generate(text, language = 'en') {
            return API.post('/api/catalog/generate', { text, language });
        },

        async classify(text) {
            const formData = new FormData();
            formData.append('text', text);
            return API.request('POST', '/api/catalog/classify', formData);
        },

        async languages() {
            return API.get('/api/catalog/languages');
        },
    },

    // ---- Pricing API ----
    pricing: {
        async recommend(data) {
            return API.post('/api/pricing/recommend', {
                material_cost: data.materialCost,
                labour_cost: data.labourCost,
                category: data.category || 'Handicrafts',
                quality: data.quality || 'medium',
                product_name: data.productName || '',
            });
        },

        async marketInsights(category) {
            return API.get(`/api/pricing/market/${category}`);
        },

        async batch(products) {
            return API.post('/api/pricing/batch', { products });
        },
    },
};
