/**
 * Build the gold-candidate dataset from the master/local CSV.
 *
 * Includes parcel-specific leads that are gold-eligible or near-ready, annotated
 * with readiness scores, computed gold status, normalized price, inferred
 * acquisition type, and a missing-field summary. Quarantined/research placeholders
 * are excluded. Writes data/output/ — never the protected production dataset.
 *
 * Usage:
 *   node scripts/build-gold-dataset-candidates.mjs [--include-near] [--in x.csv] [--out y.csv]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { scoreRow, inferAcquisitionType } from './lib/goldReadiness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name, fb) => { const i = process.argv.indexOf(`--${name}`); if (i === -1) return fb; const n = process.argv[i + 1]; return n && !n.startsWith('--') ? n : true; };
const INPUT = path.resolve(ROOT, arg('in', 'public/local_dashboard_dataset.csv'));
const OUTPUT = path.resolve(ROOT, arg('out', 'data/output/georgia_land_gold_candidates.csv'));
const INCLUDE_NEAR = Boolean(arg('include-near', true)); // include near_ready by default so the list is usable

function main() {
  if (!fs.existsSync(INPUT)) { console.error(`Input not found: ${INPUT}`); process.exit(1); }
  const { data, meta } = Papa.parse(fs.readFileSync(INPUT, 'utf8'), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });

  const annotated = [];
  let eligible = 0, near = 0;
  for (const row of data) {
    const s = scoreRow(row);
    const keep = s.goldStatus === 'eligible' || (INCLUDE_NEAR && s.goldStatus === 'near_ready');
    if (!keep) continue;
    if (s.goldStatus === 'eligible') eligible++; else near++;

    const inf = inferAcquisitionType(row);
    annotated.push({
      ...row,
      Row_Type: s.rowType,
      Gold_Dataset_Status: s.goldStatus,
      Gold_Dataset_Readiness_0_to_100: String(s.overall),
      Boundary_Readiness_0_to_100: String(s.boundaryReadiness),
      Price_Normalized: s.priceNormalized ?? '',
      Price_Label: s.priceLabel,
      Price_Parse_Status: s.priceBucket,
      Acquisition_Type_Suggested: row.Acquisition_Type?.trim() || inf.type,
      Acquisition_Type_Suggestion_Status: inf.status,
      Gold_Missing_Fields: s.blockers.join('|'),
    });
  }

  // Highest readiness first.
  annotated.sort((a, b) => Number(b.Gold_Dataset_Readiness_0_to_100) - Number(a.Gold_Dataset_Readiness_0_to_100));

  const extraCols = ['Row_Type', 'Gold_Dataset_Status', 'Gold_Dataset_Readiness_0_to_100', 'Boundary_Readiness_0_to_100', 'Price_Normalized', 'Price_Label', 'Price_Parse_Status', 'Acquisition_Type_Suggested', 'Acquisition_Type_Suggestion_Status', 'Gold_Missing_Fields'];
  const columns = [...meta.fields];
  for (const c of extraCols) if (!columns.includes(c)) columns.push(c);

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, Papa.unparse(annotated, { columns }));

  console.log('\n=== Gold Candidate Build ===');
  console.log(`Input:  ${path.relative(ROOT, INPUT)} (${data.length} rows)`);
  console.log(`Output: ${path.relative(ROOT, OUTPUT)}`);
  console.log(`Candidates: ${annotated.length}  (eligible: ${eligible}, near_ready: ${near})`);
  console.log('Note: production dataset NOT modified. Promote only after human review.\n');
}

main();
