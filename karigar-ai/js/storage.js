/* ============================================
   KarigarAI - Storage Module
   ============================================ */

const Storage = {
    KEYS: {
        THEME: 'karigarai_theme',
        LANGUAGE: 'karigarai_language',
        PRODUCTS: 'karigarai_products',
        SESSION: 'karigarai_session',
        USER: 'karigarai_user'
    },

    get(key) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : null;
        } catch (e) {
            return null;
        }
    },

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('Storage: Could not save', key);
        }
    },

    remove(key) {
        localStorage.removeItem(key);
    },

    // Theme
    getTheme() {
        return this.get(this.KEYS.THEME) || 'light';
    },

    setTheme(theme) {
        this.set(this.KEYS.THEME, theme);
        document.documentElement.setAttribute('data-theme', theme);
    },

    // Language
    getLanguage() {
        return this.get(this.KEYS.LANGUAGE) || 'en';
    },

    setLanguage(lang) {
        this.set(this.KEYS.LANGUAGE, lang);
    },

    // Products (combine defaults + user-added)
    getProducts() {
        const custom = this.get(this.KEYS.PRODUCTS) || [];
        // Merge: if custom products exist, use them; otherwise use defaults
        if (custom.length > 0) {
            return custom;
        }
        return [...MOCK_PRODUCTS];
    },

    saveProducts(products) {
        this.set(this.KEYS.PRODUCTS, products);
    },

    addProduct(product) {
        const products = this.getProducts();
        product.id = Date.now();
        product.dateAdded = new Date().toISOString().split('T')[0];
        products.unshift(product);
        this.saveProducts(products);
        return product;
    },

    updateProduct(id, updates) {
        const products = this.getProducts();
        const idx = products.findIndex(p => p.id === id);
        if (idx !== -1) {
            products[idx] = { ...products[idx], ...updates };
            this.saveProducts(products);
            return products[idx];
        }
        return null;
    },

    deleteProduct(id) {
        let products = this.getProducts();
        products = products.filter(p => p.id !== id);
        this.saveProducts(products);
    },

    // Session
    isLoggedIn() {
        return this.get(this.KEYS.SESSION) === true;
    },

    setLoggedIn(val) {
        this.set(this.KEYS.SESSION, val);
    },

    // User
    getUser() {
        return this.get(this.KEYS.USER) || MOCK_USER;
    },

    setUser(user) {
        this.set(this.KEYS.USER, user);
    },

    // Init
    init() {
        const theme = this.getTheme();
        document.documentElement.setAttribute('data-theme', theme);

        // If no saved products, initialize with defaults
        if (!this.get(this.KEYS.PRODUCTS)) {
            this.saveProducts([...MOCK_PRODUCTS]);
        }
    }
};

Storage.init();
