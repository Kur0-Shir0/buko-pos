// Background Synchronization Queue Processing Engine [cite: 294, 303]
const SyncEngine = {
    // Fixed Google Apps Script URL for the seller app
    webAppUrl: "https://script.google.com/macros/s/AKfycbzps_3d_3e-0tH8y7Fx2eQJwGR9L8BvEia4gh9NQw9V2X0w7QvDw1QFQ6T3_xxjR0m2P/exec",

    // Mutex flag: prevents concurrent processQueue() runs that cause duplicate sends
    isSyncing: false,

    async loadSavedUrl() {
        return this.webAppUrl;
    },

    async saveWebAppUrl(url) {
        this.webAppUrl = (url || '').trim() || this.webAppUrl;
        return this.webAppUrl;
    },

    async queueItem(type, data) {
        const queueObj = { type, data: JSON.parse(JSON.stringify(data)), timestamp: Date.now() };
        await DB.save('syncQueue', queueObj);
        this.processQueue();
    },

    async processQueue() {
        // Guard: if a sync is already in flight, skip — avoids sending duplicates to Google Sheets
        if (this.isSyncing || !navigator.onLine || !this.webAppUrl) {
            this.updateBadge();
            return;
        }

        const items = await DB.getAll('syncQueue');
        if (items.length === 0) {
            this.updateBadge();
            return;
        }

        this.isSyncing = true;
        document.getElementById('sync-badge').className = "bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs animate-pulse";
        document.getElementById('sync-badge').innerText = `Syncing (${items.length})`;

        try {
            for (let item of items) {
                try {
                    const response = await fetch(this.webAppUrl, {
                        method: 'POST',
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({ type: item.type, data: item.data })
                    });

                    const confirmation = await response.json();
                    if (confirmation.status === 'success') {
                        await DB.delete('syncQueue', item.id);
                    } else {
                        console.warn('Spreadsheet sync rejected payload:', confirmation);
                        break;
                    }
                } catch (err) {
                    console.warn("Spreadsheet reporting interface unreachable. Retaining queue records.", err);
                    break;
                }
            }
        } finally {
            // Always release the lock so future syncs can proceed
            this.isSyncing = false;
            this.updateBadge();
        }
    },

    async syncCurrentInventory() {
        const stockItems = await DB.getAll('inventory');
        await this.queueItem('inventory', stockItems);
    },

    async updateBadge() {
        const badge = document.getElementById('sync-badge');
        const count = (await DB.getAll('syncQueue')).length;

        if (!navigator.onLine) {
            badge.className = "bg-gray-500 text-white px-2 py-0.5 rounded-full text-xs";
            badge.innerText = `Offline (${count})`;
        } else if (count > 0) {
            badge.className = "bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs";
            badge.innerText = `Pending (${count})`;
        } else {
            badge.className = "bg-green-500 text-white px-2 py-0.5 rounded-full text-xs";
            badge.innerText = "Synced";
        }
    }
};

window.addEventListener('online', () => SyncEngine.processQueue());
window.addEventListener('offline', () => SyncEngine.updateBadge());
setInterval(() => SyncEngine.processQueue(), 45000);