// Dynamic UI Component Layout Engine Template Router Matrix [cite: 225]
const Views = {
    async dashboard() {
        const sales = await DB.getAll('sales');
        const expenses = await DB.getAll('expenses');
        const inventory = await DB.getAll('inventory');
        const today = Utils.getTodayDate();

        const todaySales = sales.filter(s => s.date === today).reduce((sum, s) => sum + s.total, 0);
        const todayExp = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
        const lowStock = inventory.filter(i => i.quantity <= i.threshold);

        return `
            <div class="space-y-6">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"><span class="text-xs font-bold text-gray-400 uppercase">Today's Sales</span><span class="text-2xl font-black text-green-600 tracking-tight mt-2">${Utils.formatPHP(todaySales)}</span></div>
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"><span class="text-xs font-bold text-gray-400 uppercase">Expenses</span><span class="text-2xl font-black text-red-500 tracking-tight mt-2">${Utils.formatPHP(todayExp)}</span></div>
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"><span class="text-xs font-bold text-gray-400 uppercase">Net Income</span><span class="text-2xl font-black text-blue-600 tracking-tight mt-2">${Utils.formatPHP(todaySales - todayExp)}</span></div>
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between"><span class="text-xs font-bold text-gray-400 uppercase">Transactions</span><span class="text-2xl font-black text-gray-800 tracking-tight mt-2">${sales.filter(s => s.date === today).length}</span></div>
                </div>

                ${lowStock.length > 0 ? `
                <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl">
                    <h3 class="font-bold text-amber-800 text-sm">⚠️ Low Stock Ingredients System Warning</h3>
                    <div class="mt-2 text-xs text-amber-700 font-medium">${lowStock.map(i => `${i.name} (${i.quantity} left)`).join(', ')}</div>
                </div>` : ''}

                <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 class="font-black text-lg tracking-tight mb-4 text-gray-800">Operational Instructions Overview</h3>
                    <p class="text-gray-500 text-sm leading-relaxed">Open a register shift window tab inside the system prior to attempting transactions. Sales logs automatically commit to IndexedDB locally and pass via background workers into connected Google Sheets whenever data service captures internet reception.</p>
                </div>
            </div>`;
    },

    async sales() {
        const products = (await DB.getAll('products')).filter(p => p.status === 'Active');
        const activeShift = await DB.get('settings', 'active_shift');

        if (!activeShift) {
            return `<div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md mx-auto mt-12"><span class="text-4xl block mb-3">🔒</span><h3 class="font-bold text-gray-700">Counter Register Vault Closed</h3><p class="text-sm text-gray-400 mt-2">Initialize an operational daily opening tracking matrix workflow step session inside the Shift component view before executing checks.</p></div>`;
        }

        let cartLines = SalesController.cart.map(item => `
            <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div class="flex flex-col"><span class="font-bold text-sm text-gray-800">${item.name}</span><span class="text-xs text-gray-400">${Utils.formatPHP(item.price)} each</span></div>
                <div class="flex items-center gap-3">
                    <button onclick="SalesController.updateCartQty('${item.id}', -1)" class="w-8 h-8 rounded-full bg-white border border-gray-300 font-bold shadow-xs active:bg-gray-100 flex items-center justify-center text-sm">-</button>
                    <span class="font-black text-sm text-gray-800 w-4 text-center">${item.qty}</span>
                    <button onclick="SalesController.updateCartQty('${item.id}', 1)" class="w-8 h-8 rounded-full bg-white border border-gray-300 font-bold shadow-xs active:bg-gray-100 flex items-center justify-center text-sm">+</button>
                </div>
            </div>`).join('');

        const subtotal = SalesController.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const discount = subtotal * SalesController.discountPct;
        const total = subtotal - discount;

        let productGrid = products.map(p => `
            <button onclick="SalesController.addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})" class="bg-white border border-gray-100 p-4 rounded-2xl text-left shadow-xs hover:shadow-md active:bg-green-50 active:border-green-300 transition-all flex flex-col justify-between min-h-[100px]">
                <span class="font-black text-sm text-gray-800 tracking-tight leading-snug">${p.name}</span>
                <span class="text-green-600 font-extrabold text-sm mt-2 block">${Utils.formatPHP(p.price)}</span>
            </button>`).join('');

        return `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-4">
                    <h3 class="font-black text-xl tracking-tight text-gray-800">Menu Choices Catalog</h3>
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">${productGrid || '<p class="text-sm text-gray-400 col-span-full">No active products added.</p>'}</div>
                </div>

                <div class="bg-white p-5 rounded-3xl shadow-xl border border-gray-100 flex flex-col justify-between h-fit space-y-4 sticky top-24">
                    <div>
                        <h3 class="font-black text-lg tracking-tight text-gray-800 mb-3 flex justify-between items-center">Current Order <span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-bold">${SalesController.cart.length} unique items</span></h3>
                        <div class="space-y-2 max-h-[220px] overflow-y-auto pr-1">${cartLines || '<p class="text-xs text-gray-400 text-center py-8 font-medium">Add menu items to compile a receipt stack.</p>'}</div>
                    </div>

                    <div class="space-y-3 pt-3 border-t border-gray-100">
                        <div class="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2">
                            <label class="flex items-center gap-2 font-bold text-xs text-gray-500 uppercase tracking-wider">
                                <input type="checkbox" id="senior-trigger" ${SalesController.isPwdOrSenior ? 'checked' : ''} onchange="SalesController.setDiscount(this.checked ? 'PWD_SENIOR' : 'NONE')" class="rounded text-green-600 focus:ring-green-500 w-4 h-4">
                                Apply Senior Citizen / PWD (20%)
                            </label>
                            ${SalesController.isPwdOrSenior ? `
                            <div class="grid grid-cols-1 gap-2 pt-1">
                                <input type="text" id="pwd-name" placeholder="Customer Name" value="${SalesController.customerName}" oninput="SalesController.customerName = this.value" class="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-green-500 outline-hidden">
                                <input type="text" id="pwd-id" placeholder="ID Card Number" value="${SalesController.idNumber}" oninput="SalesController.idNumber = this.value" class="w-full border border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-green-500 outline-hidden">
                            </div>` : ''}
                        </div>

                        <div class="space-y-1 text-sm text-gray-600 font-medium">
                            <div class="flex justify-between"><span>Subtotal:</span><span>${Utils.formatPHP(subtotal)}</span></div>
                            <div class="flex justify-between text-red-500"><span>Discount Deductions:</span><span>-${Utils.formatPHP(discount)}</span></div>
                            <div class="flex justify-between font-black text-lg text-gray-900 pt-1"><span>Grand Total:</span><span>${Utils.formatPHP(total)}</span></div>
                        </div>

                        <div class="space-y-2 pt-2">
                            <label class="block text-xs font-bold text-gray-400 uppercase">Cash Tendered</label>
                            <input type="number" id="cash-given" placeholder="₱0.00" class="w-full border border-gray-300 rounded-xl p-3 font-black text-lg text-gray-800 tracking-tight focus:ring-2 focus:ring-green-500 outline-hidden bg-gray-50">
                            <button onclick="SalesController.processCheckout(document.getElementById('cash-given').value)" class="w-full bg-green-600 text-white font-black text-sm tracking-wide rounded-2xl py-4 shadow-md hover:bg-green-700 active:scale-[0.99] transition-all">COMPLETE TRANSACTION</button>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    async inventory() {
        const stockItems = await DB.getAll('inventory');
        let stockRows = stockItems.map(item => `
            <tr class="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                <td class="px-4 py-4 font-bold text-sm text-gray-800">${item.name}</td>
                <td class="px-4 py-4 text-xs font-bold text-gray-500"><span class="px-2 py-1 bg-gray-100 rounded-md">${item.type}</span></td>
                <td class="px-4 py-4 font-black text-sm ${item.quantity <= item.threshold ? 'text-amber-600' : 'text-gray-900'}">${item.quantity}</td>
                <td class="px-4 py-4">
                    <div class="flex items-center gap-1.5">
                        <button onclick="InventoryController.updateStock('${item.id}', 10)" class="px-2.5 py-1.5 bg-white border border-gray-300 text-xs font-bold rounded-lg shadow-2xs active:bg-gray-50">+10</button>
                        <button onclick="InventoryController.updateStock('${item.id}', -1)" class="px-2.5 py-1.5 bg-white border border-gray-300 text-xs font-bold rounded-lg shadow-2xs text-red-600 active:bg-gray-50">-1</button>
                    </div>
                </td>
            </tr>`).join('');

        return `
            <div class="space-y-4">
                <h3 class="font-black text-xl tracking-tight text-gray-800">Ingredients & Asset Count Control</h3>
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                                    <th class="px-4 py-3">Item Label</th>
                                    <th class="px-4 py-3">Type</th>
                                    <th class="px-4 py-3">Current Balance</th>
                                    <th class="px-4 py-3">Adjust Stock</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-100">${stockRows || '<tr><td colspan="4" class="p-4 text-xs text-gray-400 text-center font-medium">Add a product to track matching inventory targets.</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
    },

    async expenses() {
        const expenses = await DB.getAll('expenses');
        const today = Utils.getTodayDate();
        const activeToday = expenses.filter(e => e.date === today);

        let expenseLines = activeToday.map(e => `
            <div class="flex justify-between items-center bg-white p-4 rounded-xl shadow-xs border border-gray-100">
                <div class="flex flex-col"><span class="font-bold text-sm text-gray-800">${e.description}</span><span class="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-wider">${e.category} ${e.notes ? `• ${e.notes}` : ''}</span></div>
                <span class="font-black text-sm text-red-500 tracking-tight">${Utils.formatPHP(e.amount)}</span>
            </div>`).join('');

        return `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-fit space-y-4">
                    <h3 class="font-black text-lg tracking-tight text-gray-800">Log Operating Expense</h3>
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Description</label>
                            <input type="text" id="exp-desc" placeholder="e.g., Bought Ice Blocks" class="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-hidden">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Category</label>
                            <select id="exp-cat" class="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-hidden bg-white">
                                <option value="Ingredients">Ingredients (Sugar/Cups/Ice)</option>
                                <option value="Logistics">Transportation / Gas</option>
                                <option value="Maintenance">Stall Repairs / Tools</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Amount Cost</label>
                            <input type="number" id="exp-amt" placeholder="₱0.00" class="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-hidden">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Optional Notes</label>
                            <input type="text" id="exp-notes" placeholder="Vendor info, details..." class="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-green-500 outline-hidden">
                        </div>
                        <button onclick="ExpensesController.addExpense(document.getElementById('exp-desc').value, document.getElementById('exp-cat').value, document.getElementById('exp-amt').value, document.getElementById('exp-notes').value)" class="w-full bg-red-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl py-3 shadow-xs hover:bg-red-600 active:scale-[0.99] transition-all">Record Expense</button>
                    </div>
                </div>

                <div class="lg:col-span-2 space-y-3">
                    <h3 class="font-black text-xl tracking-tight text-gray-800">Today's Operating Expenditures Ledger</h3>
                    <div class="space-y-2 max-h-[480px] overflow-y-auto pr-1">${expenseLines || '<p class="text-sm text-gray-400 py-12 text-center font-medium bg-white rounded-2xl border border-dashed border-gray-200">No operational outlays logged today.</p>'}</div>
                </div>
            </div>`;
    },

    async reports() {
        const activeShift = await DB.get('settings', 'active_shift');
        const sales = await DB.getAll('sales');
        const expenses = await DB.getAll('expenses');
        const today = Utils.getTodayDate();

        const todaySales = sales.filter(s => s.date === today).reduce((sum, s) => sum + s.total, 0);
        const todayExp = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);

        if (!activeShift) {
            return `
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto mt-8 text-center space-y-4">
                    <span class="text-4xl block">🏪</span>
                    <h3 class="font-black text-lg text-gray-800">Initialize Morning Register Shift</h3>
                    <p class="text-sm text-gray-400 leading-relaxed">Input the base counting fund available inside the drawer to begin calculations for the operating day.</p>
                    <div class="text-left">
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Opening Petty Cash Fund</label>
                        <input type="number" id="opening-cash" value="500" class="w-full border border-gray-300 rounded-xl p-3 font-bold text-base text-center text-gray-800 focus:ring-2 focus:ring-green-500 outline-hidden">
                    </div>
                    <button onclick="ReportsController.openShift(document.getElementById('opening-cash').value)" class="w-full bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl py-3.5 shadow-md hover:bg-green-700">Open Register Session</button>
                </div>`;
        }

        const expectedCash = activeShift.openingCash + todaySales - todayExp;

        return `
            <div class="bg-white p-6 rounded-3xl shadow-md border border-gray-100 max-w-lg mx-auto space-y-6">
                <div>
                    <h3 class="font-black text-xl tracking-tight text-gray-800">Active Shift Live Summary</h3>
                    <p class="text-xs text-gray-400 font-medium mt-0.5">Session Started Today: ${activeShift.date}</p>
                </div>

                <div class="divide-y divide-gray-100 text-sm font-medium text-gray-600">
                    <div class="flex justify-between py-3"><span>(+) Drawer Starting Fund:</span><span class="text-gray-900 font-bold">${Utils.formatPHP(activeShift.openingCash)}</span></div>
                    <div class="flex justify-between py-3"><span>(+) Computed Gross Sales:</span><span class="text-green-600 font-bold">${Utils.formatPHP(todaySales)}</span></div>
                    <div class="flex justify-between py-3"><span>(-) Outbound Expenses:</span><span class="text-red-500 font-bold">${Utils.formatPHP(todayExp)}</span></div>
                    <div class="flex justify-between py-3 border-t border-gray-200 font-black text-base text-gray-900 pt-3"><span>(=) Expected Till Cash:</span><span>${Utils.formatPHP(expectedCash)}</span></div>
                </div>

                <div class="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-400 uppercase mb-1">Actual Physical Coin & Bill Drawer Count</label>
                        <input type="number" id="actual-cash" placeholder="Count coins and bills..." class="w-full border border-gray-300 rounded-xl p-3 font-black text-lg text-gray-800 focus:ring-2 focus:ring-green-500 outline-hidden bg-white">
                    </div>
                    <button onclick="ReportsController.closeShift(document.getElementById('actual-cash').value)" class="w-full bg-gray-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl py-3.5 shadow-sm hover:bg-gray-900 transition-all">Lock & Close out Day Session</button>
                </div>
            </div>`;
    },

    async settings() {
        const products = await DB.getAll('products');
        let productRows = products.map(p => `
            <div class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div class="flex flex-col"><span class="font-bold text-sm text-gray-800">${p.name}</span><span class="text-xs text-gray-400">${Utils.formatPHP(p.price)} • ${p.category}</span></div>
                <div class="flex items-center gap-2">
                    <button onclick="ProductsController.toggleStatus('${p.id}')" class="px-2.5 py-1 text-xs font-bold rounded-md border ${p.status === 'Active' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'}">${p.status}</button>
                    <button onclick="ProductsController.deleteProduct('${p.id}')" class="p-1 text-xs bg-red-50 border border-red-100 text-red-600 rounded-md">🗑️</button>
                </div>
            </div>`).join('');

        return `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="space-y-4">
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                        <h3 class="font-black text-base text-gray-800">Add New Menu Item</h3>
                        <div class="space-y-2">
                            <input type="text" id="prod-name" placeholder="Item Name (e.g., Avocado Shake)" class="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-green-500 outline-hidden">
                            <input type="number" id="prod-price" placeholder="Price (₱)" class="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-green-500 outline-hidden">
                            <input type="text" id="prod-cat" placeholder="Category (e.g., Shake, Juice)" class="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-green-500 outline-hidden">
                            <select id="prod-type" class="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-green-500 outline-hidden bg-white">
                                <option value="Finished Item">Finished Standalone Product</option>
                                <option value="Ingredient">Raw Material Ingredient Element</option>
                            </select>
                            <input type="number" id="prod-stock" placeholder="Initial Starting Stock Balance Count" class="w-full border border-gray-300 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-green-500 outline-hidden">
                            <button onclick="ProductsController.addProduct(document.getElementById('prod-name').value, document.getElementById('prod-price').value, document.getElementById('prod-cat').value, document.getElementById('prod-type').value, document.getElementById('prod-stock').value)" class="w-full bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl py-2.5 mt-2">Save to Catalog</button>
                        </div>
                    </div>

                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                        <h3 class="font-black text-base text-gray-800">Reporting Engine Endpoint</h3>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">Google Apps Script Web App Endpoint Address URL</label>
                            <input type="text" id="sync-url-input" value="${SyncEngine.webAppUrl}" placeholder="https://script.google.com/macros/s/.../exec" class="w-full border border-gray-300 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-green-500 outline-hidden bg-gray-50">
                            <button onclick="SyncEngine.webAppUrl = document.getElementById('sync-url-input').value; alert('Pipeline interface URL updated.'); SyncEngine.processQueue();" class="w-full bg-blue-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl py-2 mt-2">Bind Endpoint URL</button>
                        </div>
                    </div>

                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-2">
                        <h3 class="font-black text-base text-gray-800">Spreadsheet CSV Engine</h3>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="DB.getAll('products').then(p => ImporterController.exportToCSV(p, ['name', 'price', 'category', 'status'], 'BukoPOS_Products.csv'))" class="bg-gray-100 text-gray-700 font-bold text-xs py-2.5 rounded-xl border border-gray-200">Export Catalog</button>
                            <label class="bg-gray-100 text-gray-700 font-bold text-xs py-2.5 rounded-xl border border-gray-200 text-center cursor-pointer block">
                                Import Catalog
                                <input type="file" accept=".csv" onchange="ImporterController.parseCSVImport(event)" class="hidden">
                            </label>
                        </div>
                        <div class="grid grid-cols-2 gap-2 pt-1">
                            <button onclick="BackupController.exportData()" class="bg-gray-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs">System Backup</button>
                            <label class="bg-gray-800 text-white font-bold text-xs py-2.5 rounded-xl shadow-2xs text-center cursor-pointer block">
                                Restore System
                                <input type="file" accept=".json" onchange="BackupController.importData(event)" class="hidden">
                            </label>
                        </div>
                    </div>
                </div>

                <div class="lg:col-span-2 space-y-3">
                    <h3 class="font-black text-xl tracking-tight text-gray-800">Master Catalog Registry Matrix</h3>
                    <div class="space-y-2 max-h-[640px] overflow-y-auto pr-1">${productRows || '<p class="text-sm text-gray-400 py-12 text-center font-medium bg-white rounded-2xl border border-dashed border-gray-200">No entries listed.</p>'}</div>
                </div>
            </div>`;
    }
};