// Security Core Local Storage Backups Utilities Matrix
const BackupController = {
    async exportData() {
        const payload = {
            products: await DB.getAll('products'),
            inventory: await DB.getAll('inventory'),
            sales: await DB.getAll('sales'),
            expenses: await DB.getAll('expenses')
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = `BukoPOS_Backup_${Utils.getTodayDate()}.json`;
        link.click();
    },

    async importData(fileEvent) {
        const file = fileEvent.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.products) for (let p of data.products) await DB.save('products', p);
                if (data.inventory) for (let i of data.inventory) await DB.save('inventory', i);
                if (data.sales) for (let s of data.sales) await DB.save('sales', s);
                if (data.expenses) for (let ex of data.expenses) await DB.save('expenses', ex);
                alert("Internal device parameters structural parsing operation fully successful.");
                SyncEngine.syncCurrentInventory();
                App.reloadView();
            } catch (err) {
                alert("Corruption detected parsing structural schema file definition inputs.");
            }
        };
        reader.readAsText(file);
    }
};