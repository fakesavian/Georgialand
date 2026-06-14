const fs = require('fs');
const Papa = require('papaparse');

const csvPath = 'D:/2025/user/Aicode/freelandfinder/public/local_dashboard_dataset.csv';
const content = fs.readFileSync(csvPath, 'utf-8');

const res = Papa.parse(content, { header: true, skipEmptyLines: true });
console.log("Data length:", res.data.length);
console.log("Errors length:", res.errors.length);
console.log("Last 5 errors:", res.errors.slice(-5));
