// Checkout Transaction Matrix Engine [cite: 220]
const SalesController = {
    cart: [],
    discountPct: 0,
    isPwdOrSenior: false,
    customerName: '',
    idNumber: '',

    addToCart(product, quantity = 1) {
        const existing = this.cart.find(i => i.id === product.id);
        if (existing) {
            existing.qty += quantity;
        } else {
            this.cart.push({ id: product.id, name: product.name, price: product.price, qty: quantity });
        }
        App.reloadView();
    },

    updateCartQty(id, delta) {
        const match = this.cart.find(i => i.id === id);
        if (match) {
            match.qty += delta;
            if (match.qty <= 0) this.cart = this.cart.filter(i => i.id !== id);
        }
        App.reloadView();
    },

    setDiscount(type) {
        if (type === 'PWD_SENIOR') {
            this.isPwdOrSenior = true;
            this.discountPct = 0.20; // Standard 20% Philippine Mandatory Discount Framework [cite: 167, 168]
            this.customerName = document.getElementById('pwd-name')?.value || '';
            this.idNumber = document.getElementById('pwd-id')?.value || '';
        } else {
            this.isPwdOrSenior = false;
            this.discountPct = 0;
            this.customerName = '';
            this.idNumber = '';
        }
        App.reloadView();
    },

    async processCheckout(cashReceived) {
        const activeShift = await DB.get('settings', 'active_shift');
        if (!activeShift) return alert("Please open a daily operations cashier shift window register tab balance first.");
        if (this.cart.length === 0) return alert("Checkout tracking pipeline canvas register is empty.");
        
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const discountAmount = subtotal * this.discountPct;
        const total = subtotal - discountAmount;

        // Bug 2: parse to float before comparison — raw DOM value is a string
        const cashFloat = parseFloat(cashReceived);
        if (isNaN(cashFloat) || cashFloat < total) return alert("Insufficient payment presented.");

        // Deduct associated inventory levels
        for (let item of this.cart) {
            const stock = await DB.get('inventory', item.id);
            if (stock) {
                stock.quantity = Math.max(0, stock.quantity - item.qty);
                await DB.save('inventory', stock);
            }
        }

        const now = new Date();
        const saleRecord = {
            id: Utils.generateUUID(),
            receiptNumber: 'REC-' + Date.now().toString().slice(-6),
            date: Utils.getTodayDate(),
            time: now.toTimeString().split(' ')[0],
            items: this.cart,
            subtotal,
            discount: discountAmount,
            total,
            cashReceived: cashFloat,
            change: cashFloat - total,
            isPwdOrSenior: this.isPwdOrSenior,
            customerName: this.customerName,
            idNumber: this.idNumber
        };

        await DB.save('sales', saleRecord);
        // Dup-2: await both sync calls sequentially so inventory is fully deducted
        // before it is snapshotted, and no concurrent processQueue() races occur
        await SyncEngine.queueItem('sale', saleRecord);
        await SyncEngine.syncCurrentInventory();

        alert(`Checkout Successful! Change: ${Utils.formatPHP(saleRecord.change)}`);
        // Bug 8: reset all customer fields so they don't carry over to the next transaction
        this.cart = [];
        this.discountPct = 0;
        this.isPwdOrSenior = false;
        this.customerName = '';
        this.idNumber = '';
        App.reloadView();
    }
};