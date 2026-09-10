// Application Setup, Lifecycle Routing, and Global Target Operations Manager [cite: 216]
const App = {
    currentView: 'dashboard',

    async init() {
        // Run internal data object layer check passes safely
        await DB.init();
        await SyncEngine.loadSavedUrl();

        // Synchronize active context drawer visual interface state flags
        const activeShift = await DB.get('settings', 'active_shift');
        const shiftBadge = document.getElementById('shift-status-badge');
        if (activeShift) {
            shiftBadge.className = "bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-bold";
            shiftBadge.innerText = "Open";
        } else {
            shiftBadge.className = "bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold";
            shiftBadge.innerText = "Closed";
        }

        await SyncEngine.updateBadge();
        this.navigate(this.currentView);
    },

    async navigate(viewName) {
        this.currentView = viewName;
        const canvas = document.getElementById('view-canvas');
        if (Views[viewName]) {
            canvas.innerHTML = await Views[viewName]();
        }

        // Standardize navigational state active class parameters styling
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.getAttribute('data-view') === viewName) {
                btn.classList.add('active-nav');
            } else {
                btn.classList.remove('active-nav');
            }
        });
    },

    reloadView() {
        this.navigate(this.currentView);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());