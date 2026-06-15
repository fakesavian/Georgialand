/**
 * Parcel-boundary backfill.
 *
 * Reads the dashboard dataset, queries official county ArcGIS parcel layers for
 * verified geometry, and writes an ENRICHED COPY (never overwrites the input by
 * default). Rows whose geometry cannot be accurately verified are flagged with a
 * reason — they are NEVER given a fabricated boundary.
 *
 * Usage:
 *   node scripts/backfill-parcel-boundaries.mjs [--county dekalb] [--limit 5]
 *        [--listing GA-034] [--sample] [--in path.csv] [--out path.csv]
 *
 * Flags:
 *   --sample        up to --limit (default 5) coordinate-bearing rows per verified county
 *   --county <slug> restrict to one county
 *   --listing <id>  restrict to one Listing_ID
 *   --limit <n>     cap rows processed (or per-county in --sample mode)
 *   --in / --out    input / output CSV paths
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { COUNTY_CONFIG, countySlug, fetchParcelGeometry } from './lib/parcelGis.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAMP = new Date().toISOString().slice(0, 10);

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const next = process.argv[i + 1];
  return next && !next.startsWith('--') ? next : true;
}

const INPUT = path.resolve(ROOT, arg('in', 'public/local_dashboard_dataset.csv'));
const OUTPUT = path.resolve(ROOT, arg('out', 'public/local_dashboard_dataset.enriched.csv'));
const COUNTY = arg('county', null);
const LISTING = arg('listing', null);
const SAMPLE = arg('sample', false);
const LIMIT = Number(arg('limit', SAMPLE ? 5 : 0)) || 0;

const BOUNDARY_FIELDS = [
  'Parcel_Boundary_GeoJSON', 'Parcel_Boundary_Source_URL', 'Parcel_Boundary_Source_Type',
  'Parcel_Boundary_Verified', 'Parcel_Boundary_Confidence_0_to_100', 'Parcel_Boundary_Last_Checked_Date',
  'Parcel_Boundary_Method', 'Parcel_Boundary_Error',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function selectTargets(rows) {
  let targets = rows.map((row, index) => ({ row, index }));
  if (LISTING) targets = targets.filter((t) => String(t.row.Listing_ID || '') === LISTING);
  if (COUNTY) targets = targets.filter((t) => countySlug(t.row.County) === countySlug(COUNTY));
  // Only attempt counties we have a verified/researched endpoint for.
  targets = targets.filter((t) => COUNTY_CONFIG[countySlug(t.row.County)]);

  if (SAMPLE) {
    const perCounty = {};
    const picked = [];
    for (const t of targets) {
      const c = countySlug(t.row.County);
      const lat = Number(t.row.Latitude), lon = Number(t.row.Longitude);
      if (!(Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0)) continue;
      perCounty[c] = perCounty[c] || 0;
      if (perCounty[c] >= (LIMIT || 5)) continue;
      perCounty[c]++;
      picked.push(t);
    }
    return picked;
  }
  return LIMIT ? targets.slice(0, LIMIT) : targets;
}

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Input dataset not found: ${INPUT}`);
    process.exit(1);
  }
  const text = fs.readFileSync(INPUT, 'utf8');
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
  const rows = parsed.data;
  const columns = [...parsed.meta.fields];
  for (const f of BOUNDARY_FIELDS) if (!columns.includes(f)) columns.push(f);

  const targets = selectTargets(rows);
  console.log(`\n=== Parcel Boundary Backfill ===`);
  console.log(`Input:   ${path.relative(ROOT, INPUT)} (${rows.length} rows)`);
  console.log(`Targets: ${targets.length} row(s)${COUNTY ? ` in ${COUNTY}` : ''}${SAMPLE ? ` (sample, <=${LIMIT || 5}/county)` : ''}\n`);

  const report = { generatedAt: new Date().toISOString(), attempted: targets.length, verified: 0, flagged: 0, byMethod: {}, results: [] };

  for (let i = 0; i < targets.length; i++) {
    const { row } = targets[i];
    const res = await fetchParcelGeometry({ county: row.County, parcelId: row.Parcel_ID, lat: row.Latitude, lon: row.Longitude });

    row.Parcel_Boundary_GeoJSON = res.geojson ? JSON.stringify(res.geojson) : '';
    row.Parcel_Boundary_Verified = res.geojson ? 'Yes' : 'No';
    row.Parcel_Boundary_Confidence_0_to_100 = String(res.confidence || 0);
    row.Parcel_Boundary_Method = res.method;
    row.Parcel_Boundary_Source_Type = res.geojson ? 'County ArcGIS parcel layer' : (row.Parcel_Boundary_Source_Type || '');
    row.Parcel_Boundary_Source_URL = res.sourceUrl || '';
    row.Parcel_Boundary_Last_Checked_Date = STAMP;
    row.Parcel_Boundary_Error = res.error || '';

    report.byMethod[res.method] = (report.byMethod[res.method] || 0) + 1;
    if (res.geojson) report.verified++; else report.flagged++;
    report.results.push({ Listing_ID: row.Listing_ID, County: row.County, Parcel_ID: row.Parcel_ID, method: res.method, confidence: res.confidence, verified: Boolean(res.geojson), error: res.error });

    const tag = res.geojson ? `OK  ${res.method} (${res.confidence})` : `FLAG ${res.error}`;
    console.log(`[${i + 1}/${targets.length}] ${(row.Listing_ID || '').padEnd(8)} ${(row.County || '').padEnd(10)} ${tag}`);
    await sleep(350);
  }

  fs.writeFileSync(OUTPUT, Papa.unparse(rows, { columns }));
  fs.mkdirSync(path.join(ROOT, 'data', 'reports'), { recursive: true });
  const reportPath = path.join(ROOT, 'data', 'reports', `parcel-boundary-backfill-${STAMP}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`\nVerified: ${report.verified}   Flagged: ${report.flagged}`);
  console.log(`By method: ${JSON.stringify(report.byMethod)}`);
  console.log(`Enriched copy: ${path.relative(ROOT, OUTPUT)}`);
  console.log(`Report:        ${path.relative(ROOT, reportPath)}\n`);
}

main();
