/* ============================================
   KarigarAI - Navigation Module
   ============================================ */

const Navigation = {
    currentPage: 'landing',
    history: [],

    init() {
        this.bindBottomNav();
        this.bindSidebarNav();
    },

    bindBottomNav() {
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.navigate(page);
            });
        });
    },

    bindSidebarNav() {
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.navigate(page);
            });
        });
    },

    navigate(page, params = {}) {
        // Hide current page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Show new page
        const el = document.getElementById('page-' + page);
        if (el) {
            el.classList.add('active');
            el.classList.add('page-enter');
            setTimeout(() => el.classList.remove('page-enter'), 300);
        }

        // Update history
        if (this.currentPage !== page) {
            this.history.push(this.currentPage);
        }
        this.currentPage = page;

        // Update active states
        this.updateActiveStates(page);

        // Show/hide layout elements
        this.updateLayout(page);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Trigger page-specific init
        if (typeof App !== 'undefined' && App.onPageLoad) {
            App.onPageLoad(page, params);
        }
    },

    back() {
        if (this.history.length > 0) {
            const prev = this.history.pop();
            this.navigate(prev);
        } else {
            this.navigate('landing');
        }
    },

    updateActiveStates(page) {
        // Bottom nav
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Sidebar
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
    },

    updateLayout(page) {
        const appLayout = document.querySelector('.app-layout');
        const landingPage = document.getElementById('page-landing');
        const loginPage = document.getElementById('page-login');
        const bottomNav = document.querySelector('.bottom-nav');
        const sidebar = document.querySelector('.sidebar');
        const fab = document.querySelector('.fab');
        const aiFab = document.querySelector('.ai-fab');

        const isLandingOrLogin = page === 'landing' || page === 'login';

        if (isLandingOrLogin) {
            if (appLayout) appLayout.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
            if (sidebar) sidebar.style.display = 'none';
            if (fab) fab.style.display = 'none';
            if (aiFab) aiFab.style.display = 'none';
        } else {
            if (appLayout) appLayout.style.display = 'flex';
            if (bottomNav && window.innerWidth < 768) bottomNav.style.display = 'flex';
            if (sidebar && window.innerWidth >= 768) sidebar.style.display = 'flex';
            if (fab) {
                fab.style.display = (page === 'products' || page === 'dashboard') ? 'flex' : 'none';
            }
            if (aiFab) aiFab.style.display = 'flex';
        }
    },

    goToAddProduct() {
        this.navigate('add-product');
    },

    goToProductPreview(productId) {
        this.navigate('product-preview', { productId });
    },

    goToOrderDetails(orderId) {
        this.navigate('order-details', { orderId });
    }
};
