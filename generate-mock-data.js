import fs from 'fs';
import path from 'path';

const csvPath = 'D:/2025/user/Aicode/freelandfinder/georgia_low_cost_land_opportunities_enriched.csv';

let content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split('\n');

// Fix headers
let headerLine = lines[0];
headerLine = headerLine.replace(',Risk_Score_explanation,Fit_Score_explanation', '');
lines[0] = headerLine;

const headers = headerLine.split(',');

// Generate 250 mock rows
const newRows = [];
const counties = ['Fulton', 'DeKalb', 'Cobb', 'Gwinnett', 'Chatham', 'Richmond', 'Ware'];
const statuses = ['Active', 'Pending', 'Sold'];
const types = ['GIS-Parcel', 'MLS-Style', 'Tax-Sale', 'Off-Market', 'Land-Bank'];

for (let i = 1; i <= 250; i++) {
  const row = new Array(headers.length).fill('');
  
  const county = counties[Math.floor(Math.random() * counties.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const sourceType = types[Math.floor(Math.random() * types.length)];
  const price = Math.floor(Math.random() * 200000) + 5000;
  const acres = (Math.random() * 5 + 0.1).toFixed(2);
  const priceCategory = price < 50000 ? 'Under $50k' : price < 100000 ? '$50k - $100k' : 'Over $100k';

  // Fill essential fields
  row[headers.indexOf('Listing_ID')] = `MOCK-${1000 + i}`;
  row[headers.indexOf('Property_Name_or_Address')] = `${Math.floor(Math.random() * 9000) + 100} Mock St`;
  row[headers.indexOf('City')] = 'Mock City';
  row[headers.indexOf('County')] = county;
  row[headers.indexOf('State')] = 'GA';
  row[headers.indexOf('Parcel_ID')] = `PAR-${Math.floor(Math.random() * 1000000)}`;
  row[headers.indexOf('Latitude')] = (33 + Math.random() * 2 - 1).toFixed(6);
  row[headers.indexOf('Longitude')] = (-84 + Math.random() * 2 - 1).toFixed(6);
  row[headers.indexOf('Lot_Size_Acres')] = acres;
  row[headers.indexOf('Estimated_Price_or_Min_Bid')] = price;
  row[headers.indexOf('Price_Category')] = priceCategory;
  row[headers.indexOf('Current_Status')] = status;
  row[headers.indexOf('Data_Source_Type')] = sourceType;
  row[headers.indexOf('Fit_Score_0_to_100')] = Math.floor(Math.random() * 100);
  row[headers.indexOf('Risk_Score_0_to_100')] = Math.floor(Math.random() * 100);
  row[headers.indexOf('Value_Score')] = Math.floor(Math.random() * 100);
  row[headers.indexOf('Data_Confidence_0_to_100')] = 80 + Math.floor(Math.random() * 20);

  newRows.push(row.join(','));
}

const newContent = lines.filter(l => l.trim() !== '').concat(newRows).join('\n');
fs.writeFileSync(csvPath, newContent);
console.log('Added 250 rows and fixed headers.');
