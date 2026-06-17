/**
 * Gold-dataset readiness scoring + acquisition-type inference.
 *
 * Scores each row across the 10 dimensions of the property-card data standard and
 * decides gold eligibility. Accuracy rule: nothing is invented — a missing field
 * lowers the score and is reported as a blocker; acquisition type is only ever
 * *suggested* (never silently written) with an explicit confidence status.
 */
import { hasUsableParcelId, isValidGaPolygon } from './parcelGis.mjs';

const NEEDS = /needs verification|^n\/?a$|^unknown$|^tbd$|^pending$/i;

export function isFilled(v) {
  const s = String(v ?? '').trim();
  return s.length > 0 && !NEEDS.test(s);
}

export function isHttpUrl(v) {
  const s = String(v ?? '').trim();
  return /^https?:\/\//i.test(s) && !/needs verification/i.test(s);
}

export function parsePriceValue(raw) {
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

export function priceBucket(raw) {
  const str = String(raw ?? '').trim();
  if (!str) return 'blank';
  if (parsePriceValue(str) !== null) return /\d\s*[-–—]\s*\$?\s*\d/.test(str) ? 'range' : 'numeric';
  return 'descriptive';
}

export function formatCompactUsd(value) {
  if (!Number.isFinite(value)) return '?';
  if (value >= 1_000_000) { const m = value / 1_000_000; return `$${m >= 10 ? Math.round(m) : Math.round(m * 10) / 10}M`; }
  if (value >= 1_000) { const k = value / 1_000; return `$${k >= 100 ? Math.round(k) : Math.round(k * 10) / 10}K`; }
  return `$${Math.round(value)}`;
}

export function formatPinPriceLabel(raw) {
  const str = String(raw ?? '').trim();
  if (!str || str.toLowerCase().includes('needs verification')) return '?';
  const v = parsePriceValue(str);
  if (v !== null) return /\d\s*[-–—]\s*\$?\s*\d/.test(str) ? `${formatCompactUsd(v)}+` : formatCompactUsd(v);
  if (/bid|auction|sheriff|upset|min(?:imum)?\b/i.test(str)) return 'Bid';
  if (/contact|inquire|call|ask|negotiat|email|offer|market|quote/i.test(str)) return 'Ask';
  return 'TBD';
}

export function parseBoundaryGeoJSON(raw) {
  if (!raw) return null;
  try {
    const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const geom = obj?.type === 'Feature' ? obj.geometry : obj;
    return isValidGaPolygon(geom) ? geom : null;
  } catch { return null; }
}

/** Infer acquisition type from status/source fields. Never written silently. */
export function inferAcquisitionType(row) {
  if (isFilled(row.Acquisition_Type)) return { type: row.Acquisition_Type.trim(), status: 'present' };
  const yes = (v) => String(v ?? '').trim().toLowerCase() === 'yes';
  const hay = [row.Source_Agency, row.Data_Source_Type, row.Source_URL, row.Source_Name, row.Property_Type, row.Notes, row.Current_Status, row.Region_Tier]
    .map((v) => String(v ?? '').toLowerCase()).join(' | ');

  if (yes(row.Land_Bank_Status) || /land\s*bank|lba\b|land bank authority/.test(hay)) return { type: 'Land Bank', status: 'auto_confident' };
  if (yes(row.Tax_Sale_Status) || /tax\s*sale|tax\s*deed/.test(hay)) return { type: 'Tax Sale', status: 'auto_confident' };
  if (yes(row.Sheriff_Sale_Status) || /sheriff/.test(hay)) return { type: 'Sheriff Sale', status: 'auto_confident' };
  if (yes(row.Surplus_Property_Status) || /surplus/.test(hay)) return { type: 'Surplus', status: 'auto_confident' };
  if (yes(row.Repository_Status) || /repository/.test(hay)) return { type: 'Repository', status: 'auto_confident' };
  if (/\bmls\b|listing|realtor|zillow|redfin|broker/.test(hay)) return { type: 'Market Listing', status: 'suggested_needs_review' };
  if (/off[\s-]?market|owner research|skip ?trace|driving for dollars/.test(hay)) return { type: 'Off-Market Research', status: 'suggested_needs_review' };
  return { type: '', status: 'unknown_needs_research' };
}

export function classifyRowType(row) {
  if (hasUsableParcelId(row.Parcel_ID)) {
    const lat = Number(row.Latitude), lon = Number(row.Longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0) return 'parcel_lead';
  }
  if (isFilled(row.Source_Agency) || isHttpUrl(row.Source_URL)) return 'program_lead';
  return 'research_placeholder';
}

function pct(n, d) { return d === 0 ? 0 : Math.min(100, Math.round((n / d) * 100)); }

/** Score one row across the 10 standard dimensions; decide gold status. */
export function scoreRow(row) {
  const blockers = [];

  // 1. Core identity
  const coreFields = ['Property_Name_or_Address', 'City', 'County', 'State', 'Lot_Size_Acres', 'Property_Type'];
  const coreHits = coreFields.filter((f) => isFilled(row[f])).length + (hasUsableParcelId(row.Parcel_ID) ? 1 : 0);
  const acqInfer = inferAcquisitionType(row);
  const hasAcq = acqInfer.status === 'present';
  const core = pct(coreHits + (hasAcq ? 1 : 0), coreFields.length + 2);
  if (!hasUsableParcelId(row.Parcel_ID)) blockers.push('parcel_id');
  if (!hasAcq) blockers.push('acquisition_type');

  // 2. Parcel / GIS readiness
  const lat = Number(row.Latitude), lon = Number(row.Longitude);
  const latLon = Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0;
  const gisLink = ['GIS_Parcel_URL', 'GIS_URL', 'Assessor_Parcel_URL', 'Map_URL'].some((f) => isHttpUrl(row[f]));
  const parcelGisScore = pct((hasUsableParcelId(row.Parcel_ID) ? 1 : 0) + (latLon ? 1 : 0) + (gisLink ? 1 : 0), 3);
  if (!latLon) blockers.push('lat_lon');
  if (!gisLink) blockers.push('gis_or_assessor_link');

  // 3. Boundary readiness
  const geom = parseBoundaryGeoJSON(row.Parcel_Boundary_GeoJSON);
  const bConf = parseFloat(row.Parcel_Boundary_Confidence_0_to_100 || '0') || 0;
  const bVerified = String(row.Parcel_Boundary_Verified || '').toLowerCase() === 'yes';
  const boundaryReady = Boolean(geom) && bVerified && bConf >= 70;
  const boundaryReadiness = boundaryReady ? Math.max(bConf, 70) : geom ? 50 : 0;
  if (!boundaryReady) blockers.push('boundary_geojson');

  // 4. Price readiness
  const pBucket = priceBucket(row.Estimated_Price_or_Min_Bid);
  const priceScore = pBucket === 'numeric' ? 100 : pBucket === 'range' ? 80 : pBucket === 'descriptive' ? 40 : 0;
  if (pBucket === 'blank') blockers.push('price');

  // 5. Acquisition-process readiness
  const procScore = pct(['Application_or_Auction_Process', 'Application_Deadline', 'Auction_Date', 'Eligibility_Requirements'].filter((f) => isFilled(row[f])).length, 2);

  // 6. Title / redemption / risk readiness
  const riskScore = pct(['Title_Status', 'Redemption_Risk', 'Known_Liens_or_Back_Taxes'].filter((f) => isFilled(row[f])).length, 2);
  if (!isFilled(row.Title_Status) && !isFilled(row.Redemption_Risk)) blockers.push('title_redemption_risk');

  // 7. Physical / site readiness
  const physScore = pct(['Zoning', 'Road_Access', 'Utilities_Status', 'Utilities_Available', 'Flood_Risk_Status'].filter((f) => isFilled(row[f])).length, 4);

  // 8. Source verification (mirrors PropertyDrawer's 6 checks)
  const srcChecks = [
    isHttpUrl(row.Source_URL),
    isHttpUrl(row.Property_Page_URL),
    isHttpUrl(row.GIS_URL) || isHttpUrl(row.GIS_Parcel_URL) || isHttpUrl(row.Assessor_Parcel_URL),
    isHttpUrl(row.Map_URL) || latLon,
    hasUsableParcelId(row.Parcel_ID),
    (parseFloat(row.Data_Confidence_0_to_100 || '0') || 0) >= 70,
  ].filter(Boolean).length;
  const sourceScore = pct(srcChecks, 6);
  if (!isHttpUrl(row.Source_URL)) blockers.push('source_url');

  // 9. Contact / next-action readiness
  const contactScore = pct(
    [isFilled(row.Recommended_Next_Action), isFilled(row.Contact_Agency_Name) || isFilled(row.Source_Agency), isFilled(row.Contact_Email) || isFilled(row.Contact_Phone) || isHttpUrl(row.Contact_Form_URL)].filter(Boolean).length, 2);

  // 10. Human review / audit readiness
  const reviewScore = pct([isFilled(row.Last_Checked_Date), String(row.Human_Reviewed || '').toLowerCase() === 'yes', isFilled(row.Verification_Level)].filter(Boolean).length, 2);
  if (!isFilled(row.Last_Checked_Date)) blockers.push('last_checked_date');
  if (String(row.Human_Reviewed || '').toLowerCase() !== 'yes') blockers.push('human_reviewed');

  const dimensions = {
    coreIdentity: core,
    parcelGis: parcelGisScore,
    boundary: boundaryReadiness,
    price: priceScore,
    acquisitionProcess: procScore,
    titleRisk: riskScore,
    physical: physScore,
    sourceVerification: sourceScore,
    contactNextAction: contactScore,
    reviewAudit: reviewScore,
  };

  // Weighted overall — identity/parcel/boundary/price/source weighted highest.
  const weights = { coreIdentity: 2, parcelGis: 2, boundary: 2, price: 1.5, acquisitionProcess: 1, titleRisk: 1, physical: 1, sourceVerification: 1.5, contactNextAction: 1, reviewAudit: 1 };
  let wSum = 0, w = 0;
  for (const k of Object.keys(dimensions)) { wSum += dimensions[k] * weights[k]; w += weights[k]; }
  const overall = Math.round(wSum / w);

  const rowType = classifyRowType(row);
  // Gold eligibility: parcel-specific, real price, verified boundary, source-backed, reviewed.
  const eligible = rowType === 'parcel_lead' && overall >= 80 && boundaryReady && priceScore >= 80 && sourceScore >= 67 && hasAcq;
  const nearReady = !eligible && rowType !== 'research_placeholder' && overall >= 60;
  const quarantined = rowType === 'research_placeholder' || (!hasUsableParcelId(row.Parcel_ID) && !isHttpUrl(row.Source_URL));
  const goldStatus = eligible ? 'eligible' : quarantined ? 'quarantined' : nearReady ? 'near_ready' : 'not_ready';

  // Make the exact gold-gate failures explicit so the blockers report is actionable.
  if (!eligible) {
    if (rowType !== 'parcel_lead' && !blockers.includes('parcel_id') && !blockers.includes('lat_lon')) blockers.push('not_parcel_specific');
    if (priceScore < 80 && pBucket !== 'blank') blockers.push('price_not_numeric');
    if (sourceScore < 67) blockers.push('source_under_4of6');
    if (overall < 80) blockers.push('overall_below_80');
  }

  return { dimensions, overall, boundaryReadiness, rowType, goldStatus, blockers, acqInfer, priceBucket: pBucket, priceLabel: formatPinPriceLabel(row.Estimated_Price_or_Min_Bid), priceNormalized: parsePriceValue(row.Estimated_Price_or_Min_Bid) };
}
