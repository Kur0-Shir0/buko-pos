// Native CSV Interface Parser for Microsoft Excel [cite: 224]
const ImporterController = {
    exportToCSV(dataList, headerArray, filename) {
        let csvContent = headerArray.join(",") + "\n";
        dataList.forEach(obj => {
            let row = headerArray.map(header => {
                let field = obj[header] !== undefined ? obj[header] : "";
                return `"${String(field).replace(/"/g, '""')}"`;
            });
            csvContent += row.join(",") + "\n";
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    },

    // Bug 7 fix: RFC 4180-compliant CSV line parser that handles quoted fields containing commas
    parseCSVLine(line) {
        const fields = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"' && line[i + 1] === '"') {
                    // Escaped quote inside a quoted field
                    current += '"';
                    i++;
                } else if (ch === '"') {
                    inQuotes = false;
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    fields.push(current.trim());
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        fields.push(current.trim());
        return fields;
    },

    async parseCSVImport(fileEvent) {
        const file = fileEvent.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            const lines = e.target.result.split(/\r?\n/).filter(line => line.trim() !== "");
            if (lines.length <= 1) return alert("The import sheet file contains no rows.");
            
            const headers = this.parseCSVLine(lines[0]);
            let imported = 0;

            for (let i = 1; i < lines.length; i++) {
                const values = this.parseCSVLine(lines[i]);
                if (values.length < headers.length) continue;

                const name = values[headers.indexOf("Product Name")];
                const price = parseFloat(values[headers.indexOf("Selling Price")]);
                const category = values[headers.indexOf("Category")] || "General";
                const stock = parseInt(values[headers.indexOf("Starting Stock")]) || 0;

                if (name && !isNaN(price)) {
                    const products = await DB.getAll('products');
                    let existing = products.find(p => p.name.toLowerCase() === name.toLowerCase());
                    let id = existing ? existing.id : Utils.generateUUID();

                    await DB.save('products', { id, name, price, category, status: 'Active' });
                    await DB.save('inventory', { id, name, type: 'Finished Item', quantity: stock, threshold: 5 });
                    imported++;
                }
            }
            alert(`Process complete. Successfully uploaded ${imported} records.`);
            SyncEngine.syncCurrentInventory();
            App.reloadView();
        };
        reader.readAsText(file);
    }
};