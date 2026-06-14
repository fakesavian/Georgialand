const fs = require('fs');
const Papa = require('./node_modules/papaparse');

const csvPath = 'D:/2025/user/Aicode/freelandfinder/public/local_dashboard_dataset.csv';
const content = fs.readFileSync(csvPath, 'utf-8');

// 1. Normalize line endings
const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// 2. Parse without headers to get raw arrays
const parsed = Papa.parse(normalizedContent, { header: false, skipEmptyLines: true });
console.log(`Parsed ${parsed.data.length} total rows`);

// 3. Fix the rows
const fixedData = [];
for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];
    if (i === 0) {
        // Header should be 133
        fixedData.push(row);
    } else {
        // Data rows
        if (row.length === 135) {
            // Remove the two duplicated explanation columns (they are just before the last 2 columns)
            // Example: [..., 'Risk_Score_explanation', 'Fit_Score_explanation', 'Risk_Score_Explanation', 'Fit_Score_Explanation', 'Data_Source_Type', 'Official_Source_Confirmed']
            // We want to remove the ones at index row.length - 4 and row.length - 3
            row.splice(row.length - 4, 2);
        }
        
        // Ensure exactly 133
        if (row.length > 133) {
            row.length = 133;
        }
        
        fixedData.push(row);
    }
}

// 4. Output
const finalCsv = Papa.unparse(fixedData);
fs.writeFileSync(csvPath, finalCsv);
fs.writeFileSync('D:/2025/user/Aicode/freelandfinder/georgia_low_cost_land_opportunities_enriched.csv', finalCsv);

console.log("Fixed CSV saved. Total rows written:", fixedData.length);
