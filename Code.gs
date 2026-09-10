// Code.gs - Deploy this as a Web App (Set access to "Anyone")
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const sheetApp = SpreadsheetApp.getActiveSpreadsheet();
    
    // Route incoming data payloads dynamically based on ledger type
    switch(payload.type) {
      case 'sale':
        const salesSheet = sheetApp.getSheetByName('Sales');
        // Structure: Date, Time, Receipt #, Total, Discount, Items String
        salesSheet.appendRow([
          payload.data.date,
          payload.data.time,
          payload.data.receiptNumber,
          payload.data.total,
          payload.data.discount,
          JSON.stringify(payload.data.items.map(i => `${i.name} (x${i.qty})`))
        ]);
        break;
        
      case 'expense':
        const expSheet = sheetApp.getSheetByName('Expenses');
        // Structure: Date, Description, Category, Amount, Notes
        expSheet.appendRow([
          payload.data.date,
          payload.data.description,
          payload.data.category,
          payload.data.amount,
          payload.data.notes
        ]);
        break;
        
      case 'shift':
        const shiftSheet = sheetApp.getSheetByName('Shifts');
        // Structure: Date, Opening Cash, Expected, Actual, Variance
        shiftSheet.appendRow([
          payload.data.date,
          payload.data.openingCash,
          payload.data.expectedCash,
          payload.data.actualCash,
          payload.data.variance
        ]);
        break;
        
      case 'inventory':
        const invSheet = sheetApp.getSheetByName('Inventory');
        // Clear and rewrite current stock status snapshot
        invSheet.clearContents();
        invSheet.appendRow(['Item Name', 'Type', 'Current Stock Level']);
        payload.data.forEach(item => {
          invSheet.appendRow([item.name, item.type, item.quantity]);
        });
        break;
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}