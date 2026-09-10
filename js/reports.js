// Shift Management and Reconciliation Controller [cite: 222]
const ReportsController = {
    async openShift(openingAmount) {
        if (openingAmount === '' || openingAmount === null || isNaN(openingAmount) || parseFloat(openingAmount) < 0) return alert("Invalid opening currency asset.");
        const shiftObj = { isOpen: true, date: Utils.getTodayDate(), openingCash: parseFloat(openingAmount) };
        await DB.save('settings', shiftObj, 'active_shift');
        App.reloadView();
    },

    async closeShift(actualCount) {
        if (actualCount === '' || actualCount === null || isNaN(actualCount) || parseFloat(actualCount) < 0) return alert("Provide an actual counted absolute register tier value balance.");
        
        const activeShift = await DB.get('settings', 'active_shift');
        const sales = await DB.getAll('sales');
        const expenses = await DB.getAll('expenses');
        const today = Utils.getTodayDate();

        const todaySales = sales.filter(s => s.date === today).reduce((sum, s) => sum + s.total, 0);
        const todayExp = expenses.filter(e => e.date === today).reduce((sum, e) => sum + e.amount, 0);
        
        const expectedCash = activeShift.openingCash + todaySales - todayExp;
        const variance = actualCount - expectedCash;

        const summaryLog = {
            date: today,
            openingCash: activeShift.openingCash,
            salesTotal: todaySales,
            expensesTotal: todayExp,
            expectedCash,
            actualCash: parseFloat(actualCount),
            variance
        };

        await DB.delete('settings', 'active_shift');
        SyncEngine.queueItem('shift', summaryLog);
        
        alert(`Shift Safely Finalized!\nVariance Captured: ${Utils.formatPHP(variance)}`);
        App.reloadView();
    }
};