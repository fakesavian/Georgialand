/**
 * Gold-dataset readiness audit.
 *
 * Scores every row of public/local_dashboard_dataset.csv across the 10 property-card
 * standard dimensions, reports gold eligibility + top blockers, and emits an
 * acquisition-type cleanup candidate list. Never modifies the dataset.
 *
 * Usage: node scripts/audit-gold-dataset-readiness.mjs [path/to.csv]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { scoreRow, inferAcquisitionType, isFilled, isHttpUrl, parseBoundaryGeoJSON } from './lib/goldReadiness.mjs';
import { hasUsableParcelId } from './lib/parcelGis.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = process.argv[2] ? path.resolve(ROOT, process.argv[2]) : path.join(ROOT, 'public', 'local_dashboard_dataset.csv');
const REPORT_DIR = path.join(ROOT, 'reports');

function main() {
  if (!fs.existsSync(INPUT)) { console.error(`Dataset not found: ${INPUT}`); process.exit(1); }
  const { data, meta } = Papa.parse(fs.readFileSync(INPUT, 'utf8'), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
  const rows = data;

  const summary = {
    dataset: path.relative(ROOT, INPUT), generatedAt: new Date().toISOString(),
    totalRows: rows.length, fieldCount: meta.fields?.length ?? 0,
    goldEligible: 0, nearReady: 0, notReady: 0, quarantined: 0,
    rowType: { parcel_lead: 0, program_lead: 0, research_placeholder: 0 },
    missing: { acquisition_type: 0, parcel_id: 0, valid_price: 0, boundary_geojson: 0, gis_or_assessor_link: 0, title_redemption_risk: 0, last_checked_date: 0, human_reviewed: 0 },
    blockerCounts: {},
  };

  const scored = [];
  const acqCandidates = [];

  for (const row of rows) {
    const s = scoreRow(row);
    scored.push({ row, s });

    summary.rowType[s.rowType]++;
    if (s.goldStatus === 'eligible') summary.goldEligible++;
    else if (s.goldStatus === 'near_ready') summary.nearReady++;
    else if (s.goldStatus === 'quarantined') summary.quarantined++;
    else summary.notReady++;

    for (const b of s.blockers) summary.blockerCounts[b] = (summary.blockerCounts[b] || 0) + 1;

    if (!isFilled(row.Acquisition_Type)) summary.missing.acquisition_type++;
    if (!hasUsableParcelId(row.Parcel_ID)) summary.missing.parcel_id++;
    if (s.priceBucket === 'blank' || s.priceBucket === 'descriptive') summary.missing.valid_price++;
    if (!parseBoundaryGeoJSON(row.Parcel_Boundary_GeoJSON)) summary.missing.boundary_geojson++;
    if (!['GIS_Parcel_URL', 'GIS_URL', 'Assessor_Parcel_URL'].some((f) => isHttpUrl(row[f]))) summary.missing.gis_or_assessor_link++;
    if (!isFilled(row.Title_Status) && !isFilled(row.Redemption_Risk)) summary.missing.title_redemption_risk++;
    if (!isFilled(row.Last_Checked_Date)) summary.missing.last_checked_date++;
    if (String(row.Human_Reviewed || '').toLowerCase() !== 'yes') summary.missing.human_reviewed++;

    // Acquisition-type cleanup candidates (blank original only)
    if (!isFilled(row.Acquisition_Type)) {
      const inf = inferAcquisitionType(row);
      acqCandidates.push({
        Listing_ID: row.Listing_ID || '', Property: row.Property_Name_or_Address || '', County: row.County || '',
        Source_Agency: row.Source_Agency || '', Data_Source_Type: row.Data_Source_Type || '',
        Suggested_Acquisition_Type: inf.type, Suggestion_Status: inf.status,
      });
    }
  }

  scored.sort((a, b) => b.s.overall - a.s.overall);
  const candidateRows = scored.slice(0, 100).map(({ row, s }) => ({
    Listing_ID: row.Listing_ID || '', Property: row.Property_Name_or_Address || '', County: row.County || '',
    Row_Type: s.rowType, Gold_Status: s.goldStatus, Readiness: s.overall, Boundary_Readiness: s.boundaryReadiness,
    Price_Label: s.priceLabel, Parcel_ID: row.Parcel_ID || '', Blockers: s.blockers.join('|'),
  }));

  const blockers = scored
    .filter(({ s }) => s.goldStatus !== 'eligible')
    .map(({ row, s }) => ({ Listing_ID: row.Listing_ID || '', County: row.County || '', Gold_Status: s.goldStatus, Readiness: s.overall, Blockers: s.blockers.join('|') }));

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, 'gold_dataset_readiness_summary.json'), JSON.stringify({ summary, topBlockers: Object.entries(summary.blockerCounts).sort((a, b) => b[1] - a[1]) }, null, 2));
  fs.writeFileSync(path.join(REPORT_DIR, 'gold_dataset_candidate_rows.csv'), Papa.unparse(candidateRows));
  fs.writeFileSync(path.join(REPORT_DIR, 'gold_dataset_blockers.csv'), Papa.unparse(blockers));
  fs.writeFileSync(path.join(REPORT_DIR, 'acquisition_type_cleanup_candidates.csv'), Papa.unparse(acqCandidates));

  const L = (k, v) => console.log(`  ${String(k).padEnd(30)} ${v}`);
  console.log('\n=== Gold Dataset Readiness Audit ===');
  console.log(`Dataset: ${summary.dataset} (${summary.totalRows} rows)\n`);
  console.log('Gold status:');
  L('eligible (gold)', summary.goldEligible);
  L('near_ready', summary.nearReady);
  L('not_ready', summary.notReady);
  L('quarantined', summary.quarantined);
  console.log('\nRow type:');
  L('parcel_lead', summary.rowType.parcel_lead);
  L('program_lead', summary.rowType.program_lead);
  L('research_placeholder', summary.rowType.research_placeholder);
  console.log('\nMissing critical fields:');
  Object.entries(summary.missing).forEach(([k, v]) => L(k, v));
  console.log('\nTop blockers:');
  Object.entries(summary.blockerCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => L(k, v));
  console.log(`\nReports written to ${path.relative(ROOT, REPORT_DIR)}/:`);
  console.log('  gold_dataset_readiness_summary.json');
  console.log('  gold_dataset_candidate_rows.csv (top 100)');
  console.log('  gold_dataset_blockers.csv');
  console.log(`  acquisition_type_cleanup_candidates.csv (${acqCandidates.length} rows)\n`);
}

main();
