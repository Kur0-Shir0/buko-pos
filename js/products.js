// Product Operational Business Actions Controller
const ProductsController = {
    async addProduct(name, price, category, type, quantity) {
        if (!name || isNaN(price) || price <= 0) return alert('Invalid criteria definitions entry.');
        
        const products = await DB.getAll('products');
        if (products.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            return alert("A product with this identical tracking title matching constraint name exists.");
        }

        const id = Utils.generateUUID();
        const newProd = { id, name, price: parseFloat(price), category, status: 'Active' };
        await DB.save('products', newProd);
        
        // Setup initial attached raw ingredient/finished target count link directly
        const newInv = { id, name, type, quantity: parseInt(quantity) || 0, threshold: 10 };
        await DB.save('inventory', newInv);
        
        SyncEngine.syncCurrentInventory();
        App.reloadView();
    },

    async toggleStatus(id) {
        const prod = await DB.get('products', id);
        if (prod) {
            prod.status = prod.status === 'Active' ? 'Inactive' : 'Active';
            await DB.save('products', prod);
            App.reloadView();
        }
    },

    async deleteProduct(id) {
        if (confirm("Remove this entry completely?")) {
            await DB.delete('products', id);
            await DB.delete('inventory', id);
            SyncEngine.syncCurrentInventory();
            App.reloadView();
        }
    }
};