/**
 * Convert near-ready rows into verified gold rows using OFFICIAL COUNTY GIS only.
 * (No Regrid / no licensed provider.)
 *
 * For each near-ready row:
 *   1. Fetch verified parcel geometry from the county ArcGIS layer
 *      (point-in-polygon first, then normalized parcel-ID match).
 *   2. On success, set the boundary fields + an official GIS link + today's
 *      checked date + Verification_Level=automated_gis_verified. (Human_Reviewed is
 *      left as-is — automated verification is honest, human review is a later gate.)
 *   3. If Acquisition_Type is blank, fill it ONLY when inference is auto_confident.
 *   4. Re-score and report which rows flipped to gold-eligible.
 *
 * Nothing is fabricated: rows whose geometry can't be verified keep empty geometry
 * and an explicit error/blocker. The production dataset is never overwritten.
 *
 * Output:
 *   data/output/georgia_land_gold_enriched.csv   (full dataset, near-ready enriched)
 *   reports/gold_conversion_summary.json
 *   reports/gold_conversion_remaining_blockers.csv
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { fetchParcelGeometry, COUNTY_CONFIG, countySlug, hasUsableParcelId } from './lib/parcelGis.mjs';
import { scoreRow, inferAcquisitionType } from './lib/goldReadiness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = path.join(ROOT, 'public', 'local_dashboard_dataset.csv');
const OUT_CSV = path.join(ROOT, 'data', 'output', 'georgia_land_gold_enriched.csv');
const REPORT_DIR = path.join(ROOT, 'reports');
const STAMP = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const NEW_FIELDS = [
  'Parcel_Boundary_GeoJSON', 'Parcel_Boundary_Source_URL', 'Parcel_Boundary_Source_Type',
  'Parcel_Boundary_Verified', 'Parcel_Boundary_Confidence_0_to_100', 'Parcel_Boundary_Last_Checked_Date',
  'Parcel_Boundary_Method', 'Parcel_Boundary_Error', 'GIS_Parcel_URL', 'Last_Checked_Date',
  'Verification_Level', 'Acquisition_Type', 'Acquisition_Type_Suggestion_Status',
  'Parcel_ID', 'Parcel_ID_Source',
  'Gold_Dataset_Status', 'Gold_Dataset_Readiness_0_to_100', 'Boundary_Readiness_0_to_100',
];

async function main() {
  const parsed = Papa.parse(fs.readFileSync(INPUT, 'utf8'), { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
  const rows = parsed.data;
  const columns = [...parsed.meta.fields];
  for (const f of NEW_FIELDS) if (!columns.includes(f)) columns.push(f);

  const targets = rows.filter((r) => scoreRow(r).goldStatus === 'near_ready');
  console.log(`\n=== Convert near-ready -> gold (official county GIS only) ===`);
  console.log(`Near-ready rows: ${targets.length}\n`);

  const report = { generatedAt: new Date().toISOString(), nearReady: targets.length, geometryVerified: 0, flippedToGold: 0, stillNearOrBlocked: 0, byMethod: {}, results: [] };
  const remaining = [];

  for (let i = 0; i < targets.length; i++) {
    const row = targets[i];
    const slug = countySlug(row.County);
    const before = scoreRow(row);
    let note = '';

    if (COUNTY_CONFIG[slug]) {
      const res = await fetchParcelGeometry({ county: row.County, parcelId: row.Parcel_ID, lat: row.Latitude, lon: row.Longitude });
      report.byMethod[res.method] = (report.byMethod[res.method] || 0) + 1;
      row.Parcel_Boundary_GeoJSON = res.geojson ? JSON.stringify(res.geojson) : (row.Parcel_Boundary_GeoJSON || '');
      row.Parcel_Boundary_Verified = res.geojson ? 'Yes' : (row.Parcel_Boundary_Verified || 'No');
      row.Parcel_Boundary_Confidence_0_to_100 = String(res.confidence || 0);
      row.Parcel_Boundary_Method = res.method;
      row.Parcel_Boundary_Source_URL = res.sourceUrl || '';
      row.Parcel_Boundary_Source_Type = res.geojson ? 'County ArcGIS parcel layer' : (row.Parcel_Boundary_Source_Type || '');
      row.Parcel_Boundary_Last_Checked_Date = STAMP;
      row.Parcel_Boundary_Error = res.error || '';
      if (res.geojson) {
        report.geometryVerified++;
        // Real official artifacts produced by this verification.
        if (!String(row.GIS_Parcel_URL || '').trim()) row.GIS_Parcel_URL = res.sourceUrl;
        row.Last_Checked_Date = STAMP;
        row.Verification_Level = 'automated_gis_verified';
        // The official parcel that contains the listing point gives the authoritative
        // APN — adopt it only when our row lacks a usable one (official data, not faked).
        if (!hasUsableParcelId(row.Parcel_ID) && res.officialParcelId && hasUsableParcelId(res.officialParcelId)) {
          row.Parcel_ID = res.officialParcelId;
          row.Parcel_ID_Source = `county GIS (${res.method})`;
        }
        note = `geometry ${res.method} (${res.confidence})`;
      } else {
        note = `geometry failed: ${res.error}`;
      }
    } else {
      report.byMethod.no_gis_connector = (report.byMethod.no_gis_connector || 0) + 1;
      row.Parcel_Boundary_Error = `No official GIS connector for ${row.County} County — needs licensed provider or manual GIS verification.`;
      note = 'no GIS connector (placeholder county)';
    }

    // Acquisition_Type: only auto-fill when confident.
    if (!String(row.Acquisition_Type || '').trim()) {
      const inf = inferAcquisitionType(row);
      row.Acquisition_Type_Suggestion_Status = inf.status;
      if (inf.status === 'auto_confident') row.Acquisition_Type = inf.type;
    }

    const after = scoreRow(row);
    row.Gold_Dataset_Status = after.goldStatus;
    row.Gold_Dataset_Readiness_0_to_100 = String(after.overall);
    row.Boundary_Readiness_0_to_100 = String(after.boundaryReadiness);

    const flipped = after.goldStatus === 'eligible';
    if (flipped) report.flippedToGold++; else report.stillNearOrBlocked++;

    report.results.push({ Listing_ID: row.Listing_ID, County: row.County, before: before.goldStatus, after: after.goldStatus, overall: after.overall, note, blockers: after.blockers });
    if (!flipped) {
      remaining.push({ Listing_ID: row.Listing_ID || '', Property: row.Property_Name_or_Address || '', County: row.County || '', Readiness: after.overall, GIS_Queryable: Boolean(COUNTY_CONFIG[slug]), Remaining_Blockers: after.blockers.join('|'), Note: note });
    }
    console.log(`[${i + 1}/${targets.length}] ${(row.Listing_ID || '').padEnd(9)} ${(row.County || '').padEnd(10)} ${before.goldStatus}->${after.goldStatus}  ${note}`);
  }

  fs.mkdirSync(path.dirname(OUT_CSV), { recursive: true });
  fs.writeFileSync(OUT_CSV, Papa.unparse(rows, { columns }));
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(path.join(REPORT_DIR, 'gold_conversion_summary.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(REPORT_DIR, 'gold_conversion_remaining_blockers.csv'), Papa.unparse(remaining));

  console.log(`\nGeometry verified: ${report.geometryVerified}/${targets.length}`);
  console.log(`Flipped to GOLD:   ${report.flippedToGold}`);
  console.log(`Still near/blocked:${report.stillNearOrBlocked}`);
  console.log(`By method: ${JSON.stringify(report.byMethod)}`);
  console.log(`\nEnriched copy: ${path.relative(ROOT, OUT_CSV)}`);
  console.log(`Reports: reports/gold_conversion_summary.json, reports/gold_conversion_remaining_blockers.csv\n`);
}

main();
