/**
 * Parcel-boundary readiness audit.
 *
 * Reads public/local_dashboard_dataset.csv and reports which rows are ready for a
 * "verified parcel boundary" map mode and which are not. Writes a JSON + CSV report
 * under data/reports/. NEVER modifies the dataset.
 *
 * Usage: node scripts/audit-parcel-boundaries.mjs [path/to.csv]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';
import { COUNTY_CONFIG, PLACEHOLDER_COUNTIES, countySlug, hasUsableParcelId, isValidGaPolygon } from './lib/parcelGis.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = process.argv[2] || path.join(ROOT, 'public', 'local_dashboard_dataset.csv');
const REPORT_DIR = path.join(ROOT, 'data', 'reports');
const STAMP = new Date().toISOString().slice(0, 10);

const BOUNDARY_CONFIDENCE_THRESHOLD = 70;

function parsePriceValue(raw) {
  const str = String(raw ?? '').trim();
  if (!str || str.toLowerCase().includes('needs verification')) return null;
  const matches = str.match(/\$?\s?\d{1,3}(?:,\d{3})+(?:\.\d+)?|\$?\s?\d+(?:\.\d+)?/g);
  if (!matches) return null;
  for (const m of matches) {
    const n = parseFloat(m.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function priceBucket(raw) {
  const str = String(raw ?? '').trim();
  if (!str) return 'blank';
  if (parsePriceValue(str) !== null) return /\d\s*[-–—]\s*\$?\s*\d/.test(str) ? 'numeric_range' : 'numeric';
  return 'descriptive';
}

function parseBoundaryGeoJSON(raw) {
  if (!raw) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const geom = obj?.type === 'Feature' ? obj.geometry : obj;
    return isValidGaPolygon(geom) ? geom : null;
  } catch {
    return null;
  }
}

function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`Dataset not found: ${INPUT}`);
    process.exit(1);
  }
  const text = fs.readFileSync(INPUT, 'utf8');
  const { data, meta } = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
  const rows = data;

  const summary = {
    dataset: path.relative(ROOT, INPUT),
    generatedAt: new Date().toISOString(),
    totalRows: rows.length,
    fieldCount: meta.fields?.length ?? 0,
    price: { numeric: 0, numeric_range: 0, descriptive: 0, blank: 0 },
    parcelIdPresent: 0,
    parcelIdUsable: 0,
    latLonValid: 0,
    gisOrAssessorUrl: 0,
    boundaryGeoJsonValid: 0,
    boundaryVerified: 0,
    boundaryReady: 0,
    boundaryMissing: 0,
    countyQueryable: 0,
    countyPlaceholder: 0,
    countyUnsupported: 0,
  };

  const notReady = [];
  const byCounty = {};

  for (const row of rows) {
    const county = countySlug(row.County);
    byCounty[county] = byCounty[county] || { county: row.County || '(blank)', rows: 0, queryable: false, ready: 0 };
    byCounty[county].rows++;

    summary.price[priceBucket(row.Estimated_Price_or_Min_Bid)]++;

    const parcelPresent = Boolean(String(row.Parcel_ID || '').trim());
    const parcelUsable = hasUsableParcelId(row.Parcel_ID);
    if (parcelPresent) summary.parcelIdPresent++;
    if (parcelUsable) summary.parcelIdUsable++;

    const lat = Number(row.Latitude), lon = Number(row.Longitude);
    const latLonValid = Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0;
    if (latLonValid) summary.latLonValid++;

    const hasGisUrl = ['GIS_URL', 'GIS_Parcel_URL', 'Assessor_Parcel_URL', 'Map_URL']
      .some((k) => String(row[k] || '').trim().startsWith('http'));
    if (hasGisUrl) summary.gisOrAssessorUrl++;

    const geom = parseBoundaryGeoJSON(row.Parcel_Boundary_GeoJSON);
    const verifiedFlag = String(row.Parcel_Boundary_Verified || '').toLowerCase() === 'yes';
    const confidence = parseFloat(row.Parcel_Boundary_Confidence_0_to_100 || '0') || 0;
    const boundaryReady = Boolean(geom) && verifiedFlag && confidence >= BOUNDARY_CONFIDENCE_THRESHOLD;
    if (geom) summary.boundaryGeoJsonValid++;
    if (verifiedFlag) summary.boundaryVerified++;
    if (boundaryReady) { summary.boundaryReady++; byCounty[county].ready++; }
    else summary.boundaryMissing++;

    const queryable = Boolean(COUNTY_CONFIG[county]);
    const placeholder = PLACEHOLDER_COUNTIES.has(county);
    byCounty[county].queryable = queryable;
    if (queryable) summary.countyQueryable++;
    else if (placeholder) summary.countyPlaceholder++;
    else summary.countyUnsupported++;

    if (!boundaryReady) {
      notReady.push({
        Listing_ID: row.Listing_ID || '',
        Property: row.Property_Name_or_Address || '',
        County: row.County || '',
        Parcel_ID: row.Parcel_ID || '',
        latLonValid,
        parcelUsable,
        priceBucket: priceBucket(row.Estimated_Price_or_Min_Bid),
        countySupport: queryable ? 'queryable' : placeholder ? 'placeholder' : 'unsupported',
        reason: !geom
          ? (queryable ? 'no_geometry_backfillable' : placeholder ? 'no_geometry_placeholder_county' : 'no_geometry_unsupported_county')
          : !verifiedFlag ? 'geometry_unverified' : 'confidence_below_threshold',
      });
    }
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const jsonPath = path.join(REPORT_DIR, `parcel-boundary-audit-${STAMP}.json`);
  const csvPath = path.join(REPORT_DIR, `parcel-boundary-not-ready-${STAMP}.csv`);
  fs.writeFileSync(jsonPath, JSON.stringify({ summary, byCounty: Object.values(byCounty).sort((a, b) => b.rows - a.rows), notReadyCount: notReady.length, notReadySample: notReady.slice(0, 40) }, null, 2));
  fs.writeFileSync(csvPath, Papa.unparse(notReady));

  // Console summary
  const L = (k, v) => console.log(`  ${k.padEnd(34)} ${v}`);
  console.log('\n=== Parcel Boundary Readiness Audit ===');
  console.log(`Dataset: ${summary.dataset}  (${summary.totalRows} rows, ${summary.fieldCount} fields)\n`);
  console.log('Price labels:');
  L('numeric ($ on pin)', summary.price.numeric);
  L('numeric range', summary.price.numeric_range);
  L('descriptive (Ask/Bid/TBD)', summary.price.descriptive);
  L('blank (? on pin)', summary.price.blank);
  console.log('\nParcel / location:');
  L('parcel ID present', summary.parcelIdPresent);
  L('parcel ID usable', summary.parcelIdUsable);
  L('lat/lon valid', summary.latLonValid);
  L('GIS/assessor/map URL present', summary.gisOrAssessorUrl);
  console.log('\nBoundary geometry:');
  L('valid Parcel_Boundary_GeoJSON', summary.boundaryGeoJsonValid);
  L('boundary marked verified', summary.boundaryVerified);
  L(`boundary READY (>= ${BOUNDARY_CONFIDENCE_THRESHOLD})`, summary.boundaryReady);
  L('boundary MISSING / not ready', summary.boundaryMissing);
  console.log('\nCounty GIS support:');
  L('rows in queryable counties', summary.countyQueryable);
  L('rows in placeholder counties', summary.countyPlaceholder);
  L('rows in unsupported counties', summary.countyUnsupported);
  console.log(`\nReports written:\n  ${path.relative(ROOT, jsonPath)}\n  ${path.relative(ROOT, csvPath)} (${notReady.length} rows not boundary-ready)\n`);
}

main();
