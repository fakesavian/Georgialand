/**
 * Update production dataset with Acquisition_Type="Off-Market Research" for all 300 candidates
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = path.join(ROOT, 'public', 'local_dashboard_dataset.csv');
const CANDIDATES = path.join(ROOT, 'reports', 'acquisition_type_cleanup_candidates.csv');
const OUTPUT = path.join(ROOT, 'data', 'input', 'updated_with_acquisition_types.csv');

// Read candidates
const candidatesCsv = fs.readFileSync(CANDIDATES, 'utf8');
const candidatesData = Papa.parse(candidatesCsv, { header: true, skipEmptyLines: true }).data;
const listingIdsToUpdate = new Set(candidatesData.map(r => r.Listing_ID));

console.log(`Found ${listingIdsToUpdate.size} Listing IDs to update with Acquisition_Type="Off-Market Research"`);

// Read production dataset
const inputCsv = fs.readFileSync(INPUT, 'utf8');
const parsed = Papa.parse(inputCsv, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
const rows = parsed.data;

// Update rows
let updated = 0;
for (const row of rows) {
  if (listingIdsToUpdate.has(row.Listing_ID)) {
    row.Acquisition_Type = 'Off-Market Research';
    updated++;
  }
}

console.log(`Updated ${updated} rows with Acquisition_Type="Off-Market Research"`);

// Write output
fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, Papa.unparse(rows, { columns: parsed.meta.fields }));

console.log(`\nOutput: ${path.relative(ROOT, OUTPUT)}`);
