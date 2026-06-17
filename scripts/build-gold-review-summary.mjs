/**
 * Build (or refresh) the gold-candidate review summary JSON and CSV queue.
 *
 * Reads the enriched dataset and the existing review summary to produce an
 * updated `reports/gold_candidates_review_summary.json` and
 * `reports/gold_candidates_human_review_queue.csv` with source fields added.
 *
 * The candidate set is determined by the existing JSON (preserving the
 * curated A5 selection). Source fields (Source_Agency, Source_URL,
 * Property_Page_URL) are looked up from the enriched CSV by Listing_ID.
 *
 * Safety: never modifies public/local_dashboard_dataset.csv.
 * Usage: node scripts/build-gold-review-summary.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENRICHED_CSV = path.join(ROOT, 'data', 'output', 'georgia_land_gold_enriched.csv');
const EXISTING_JSON = path.join(ROOT, 'reports', 'gold_candidates_review_summary.json');
const OUT_JSON = EXISTING_JSON;
const OUT_CSV = path.join(ROOT, 'reports', 'gold_candidates_human_review_queue.csv');

function main() {
  if (!fs.existsSync(ENRICHED_CSV)) {
    console.error(`Enriched CSV not found: ${ENRICHED_CSV}`);
    process.exit(1);
  }
  if (!fs.existsSync(EXISTING_JSON)) {
    console.error(`Existing review JSON not found: ${EXISTING_JSON}`);
    process.exit(1);
  }

  // --- Load enriched CSV into a lookup map by Listing_ID ---
  const { data: enrichedRows } = Papa.parse(
    fs.readFileSync(ENRICHED_CSV, 'utf8'),
    { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() }
  );

  const enrichedMap = {};
  for (const row of enrichedRows) {
    const id = (row.Listing_ID || '').trim();
    if (id) enrichedMap[id] = row;
  }

  // --- Load the existing review JSON (preserves the A5-curated candidate set) ---
  const existing = JSON.parse(fs.readFileSync(EXISTING_JSON, 'utf8'));

  // --- Helper: add source fields to a row object from the enriched CSV ---
  function withSourceFields(reviewRow) {
    const id = reviewRow.Listing_ID;
    const src = enrichedMap[id];
    if (!src) return reviewRow;

    const sourceAgency = (src.Source_Agency || '').trim() || null;
    const sourceUrl = (src.Source_URL || '').trim() || null;
    const propertyPageUrl = (src.Property_Page_URL || '').trim() || null;

    // Use Property_Page_URL if it differs from Source_URL (more specific);
    // fall back to Source_URL when they are the same or Property_Page_URL is blank.
    const primaryUrl =
      propertyPageUrl && propertyPageUrl !== sourceUrl ? propertyPageUrl : sourceUrl;

    return {
      ...reviewRow,
      Source_Name: sourceAgency,
      Source_URL: primaryUrl,
    };
  }

  // --- Enrich all three arrays ---
  const goldReady = existing.goldReady.map(withSourceFields);
  const nearReadyOneBlocker = existing.nearReadyOneBlocker.map(withSourceFields);
  const placeholderCountyBlocked = existing.placeholderCountyBlocked.map(withSourceFields);

  // --- Build updated JSON ---
  const updated = {
    ...existing,
    generatedAt: new Date().toISOString(),
    sourceFieldNote:
      'Source_Name and Source_URL added from data/output/georgia_land_gold_enriched.csv ' +
      '(Source_Agency and Property_Page_URL / Source_URL columns).',
    goldReady,
    nearReadyOneBlocker,
    placeholderCountyBlocked,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(updated, null, 2));
  console.log(`Wrote: ${path.relative(ROOT, OUT_JSON)}`);

  // --- Regenerate human-review queue CSV ---
  const allRows = [...goldReady, ...nearReadyOneBlocker, ...placeholderCountyBlocked];

  // Build flat rows with all important fields for the CSV queue
  const queueRows = allRows.map((row) => ({
    Listing_ID: row.Listing_ID,
    County: row.County,
    Property_Name_or_Address: row.Address,
    Parcel_ID: row.ParcelID,
    Readiness_Score: row.Score,
    Dataset_Status: row.Status,
    Price: row.Price,
    Acres: row.Acres,
    Acquisition_Type: row.AcquisitionType,
    Source_Name: row.Source_Name || '',
    Source_URL: row.Source_URL || '',
    Parcel_Boundary_Verified: row.Boundary_Verified || '',
    Parcel_Boundary_Confidence: row.Boundary_Confidence ?? '',
    Verification_Level: row.Verification_Level || '',
    Last_Checked_Date: row.LastChecked || '',
    Blocker: row.Blocker || (row.Blockers ? row.Blockers.join('; ') : ''),
    Human_Reviewed: enrichedMap[row.Listing_ID]?.Human_Reviewed || '',
  }));

  fs.writeFileSync(OUT_CSV, Papa.unparse(queueRows));
  console.log(`Wrote: ${path.relative(ROOT, OUT_CSV)}`);

  // --- Summary ---
  let withUrl = 0, withName = 0;
  for (const r of allRows) {
    if (r.Source_URL) withUrl++;
    if (r.Source_Name) withName++;
  }
  console.log(`\nSource coverage across ${allRows.length} candidates:`);
  console.log(`  Source_URL present:  ${withUrl}/${allRows.length}`);
  console.log(`  Source_Name present: ${withName}/${allRows.length}`);
  console.log('\nProduction CSV untouched. Review JSON and queue CSV updated.');
}

main();
