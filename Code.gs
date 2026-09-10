// Code.gs - Deploy this as a Web App (Set access to "Anyone")
function getOrCreateSheetWithHeaders(sheetName, headers) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  const lastRow = sheet.getLastRow();
  const maxCols = Math.max(sheet.getLastColumn(), headers.length);
  const firstRow = lastRow > 0 ? sheet.getRange(1, 1, 1, maxCols).getValues()[0] : [];
  const normalized = (firstRow || []).map(value => (value === null || value === undefined ? '' : String(value).trim()));

  const headerMismatch = headers.some((expected, index) => normalized[index] !== expected);

  if (lastRow === 0 || headerMismatch) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    switch (payload.type) {
      case 'sale': {
        const salesSheet = getOrCreateSheetWithHeaders('Sales', ['Date', 'Time', 'Receipt #', 'Item Name', 'Quantity', 'Total', 'Discount']);
        const items = Array.isArray(payload.data.items) ? payload.data.items : [];

        if (items.length === 0) {
          salesSheet.appendRow([
            payload.data.date,
            payload.data.time,
            payload.data.receiptNumber,
            '',
            0,
            payload.data.total,
            payload.data.discount
          ]);
        } else {
          items.forEach(item => {
            salesSheet.appendRow([
              payload.data.date,
              payload.data.time,
              payload.data.receiptNumber,
              item.name || '',
              item.qty || 0,
              payload.data.total,
              payload.data.discount
            ]);
          });
        }
        break;
      }

      case 'expense': {
        const expSheet = getOrCreateSheetWithHeaders('Expenses', ['Date', 'Description', 'Category', 'Amount', 'Notes']);
        expSheet.appendRow([
          payload.data.date,
          payload.data.description,
          payload.data.category,
          payload.data.amount,
          payload.data.notes || ''
        ]);
        break;
      }

      case 'shift': {
        const shiftSheet = getOrCreateSheetWithHeaders('Shifts', ['Date', 'Opening Cash', 'Expected Cash', 'Actual Cash', 'Variance']);
        shiftSheet.appendRow([
          payload.data.date,
          payload.data.openingCash,
          payload.data.expectedCash,
          payload.data.actualCash,
          payload.data.variance
        ]);
        break;
      }

      case 'inventory': {
        const invSheet = getOrCreateSheetWithHeaders('Inventory', ['Item Name', 'Type', 'Quantity']);
        invSheet.clearContents();
        invSheet.appendRow(['Item Name', 'Type', 'Quantity']);
        (payload.data || []).forEach(item => {
          invSheet.appendRow([item.name, item.type, item.quantity]);
        });
        break;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}