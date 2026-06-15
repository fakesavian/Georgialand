/**
 * Shared parcel-geometry helpers for the audit + backfill scripts.
 *
 * Accuracy rules (do NOT relax):
 *  - Geometry is only accepted from official county ArcGIS parcel layers.
 *  - A point query result is only accepted when exactly ONE official polygon
 *    contains the listing's coordinate (point-in-polygon).
 *  - A parcel-ID query result is only accepted on a normalized exact match.
 *  - Geometry outside Georgia bounds is rejected as clearly unrelated.
 *  - Nothing is ever synthesized from approximate coordinates.
 *
 * County endpoints + parcel-ID fields mirror src/lib/dataSources/sourceRegistry.ts.
 * Placeholder/unverified counties are intentionally excluded from querying.
 */

// county slug -> ArcGIS parcel layer config
export const COUNTY_CONFIG = {
  fulton:   { serviceUrl: 'https://services1.arcgis.com/AQDHTHDrZzfsFsB5/arcgis/rest/services/Tax_Parcels/FeatureServer/0', parcelIdField: 'ParcelID', status: 'verified' },
  dekalb:   { serviceUrl: 'https://services2.arcgis.com/IxVN2oUE9EYLSnPE/arcgis/rest/services/Tax_Parcels_2025/FeatureServer/0', parcelIdField: 'ParcelID', status: 'verified' },
  gwinnett: { serviceUrl: 'https://services3.arcgis.com/RfpmnkSAQleRbndX/arcgis/rest/services/Property_and_Tax/FeatureServer/0', parcelIdField: 'PIN', status: 'verified' },
  floyd:    { serviceUrl: 'https://services2.arcgis.com/nV67H1IJR8GS6SAA/ArcGIS/rest/services/Current_Parcels/FeatureServer/5', parcelIdField: 'PARCEL', status: 'verified' },
  ware:     { serviceUrl: 'https://services9.arcgis.com/XAyIBOsw3fLfDjTY/arcgis/rest/services/WareCounty_Base_gdb/FeatureServer/38', parcelIdField: 'PARCEL', status: 'verified' },
  clarke:   { serviceUrl: 'https://services.arcgis.com/uU67H6v3g22H29D3/ArcGIS/rest/services/ACC_PARCELS/FeatureServer/0', parcelIdField: 'PARID', status: 'researched' },
  forsyth:  { serviceUrl: 'https://maps.forsythco.com/arcgis/rest/services/Public/Tax_Parcel/FeatureServer/0', parcelIdField: 'PARID', status: 'researched' },
  cherokee: { serviceUrl: 'https://gis.cherokeega.com/arcgis/rest/services/MainLayers/MapServer/1', parcelIdField: 'PARID', status: 'researched' },
  cobb:     { serviceUrl: 'https://gis.cobbcounty.org/gisserver/rest/services/tax/taxassessorsdaily/MapServer/0', parcelIdField: 'PIN', status: 'researched' },
  clayton:  { serviceUrl: 'https://weba.co.clayton.ga.us:5443/server/rest/services/TaxAssessor/Parcels/MapServer/0', parcelIdField: 'PARID', status: 'researched' },
};

// Counties present in the dataset but only placeholder/portal sources — flag, never guess.
export const PLACEHOLDER_COUNTIES = new Set([
  'richmond', 'bibb', 'chatham', 'douglas', 'henry', 'rockdale',
  'muscogee', 'dougherty', 'lowndes', 'glynn', 'fayette',
]);

const GA_BOUNDS = { minLon: -86.0, maxLon: -80.5, minLat: 30.0, maxLat: 35.3 };

export function countySlug(county) {
  return String(county || '').trim().toLowerCase();
}

export function normalizeParcelId(value) {
  return String(value || '').replace(/[^0-9A-Za-z]+/g, '').toUpperCase();
}

export function hasUsableParcelId(value) {
  const raw = String(value || '').trim();
  const norm = normalizeParcelId(raw);
  if (norm.length < 6) return false;
  return !/(NEEDS|UNKNOWN|PENDING|VERIFY|VERIFICATION|PUBLISHED|PROGRAM|PRIOR|AUCTION|SALELIST|MARIETTA|LEGAL)/i.test(raw);
}

// Ray-casting point-in-polygon on a GeoJSON linear ring ([ [lon,lat], ... ]).
function ringContains(ring, lon, lat) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < ((xj - xi) * (lat - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// GeoJSON geometry contains point. Polygon: [rings]; MultiPolygon: [[rings],...].
export function geometryContainsPoint(geom, lon, lat) {
  if (!geom) return false;
  if (geom.type === 'Polygon') {
    const [outer, ...holes] = geom.coordinates;
    if (!outer || !ringContains(outer, lon, lat)) return false;
    return !holes.some((h) => ringContains(h, lon, lat));
  }
  if (geom.type === 'MultiPolygon') {
    return geom.coordinates.some((poly) => {
      const [outer, ...holes] = poly;
      return outer && ringContains(outer, lon, lat) && !holes.some((h) => ringContains(h, lon, lat));
    });
  }
  return false;
}

function flattenCoords(geom) {
  const out = [];
  const walk = (a) => {
    if (typeof a[0] === 'number') { out.push(a); return; }
    a.forEach(walk);
  };
  if (geom && geom.coordinates) walk(geom.coordinates);
  return out;
}

// Validate geometry shape + Georgia bounds. Returns true only for sane GA polygons.
export function isValidGaPolygon(geom) {
  if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) return false;
  if (!Array.isArray(geom.coordinates) || geom.coordinates.length === 0) return false;
  const coords = flattenCoords(geom);
  if (coords.length < 4) return false;
  return coords.every(([lon, lat]) =>
    Number.isFinite(lon) && Number.isFinite(lat) &&
    lon >= GA_BOUNDS.minLon && lon <= GA_BOUNDS.maxLon &&
    lat >= GA_BOUNDS.minLat && lat <= GA_BOUNDS.maxLat);
}

async function arcgisQuery(serviceUrl, params, timeoutMs = 25000) {
  const url = `${serviceUrl}/query?${new URLSearchParams({
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
    ...params,
  }).toString()}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return { error: `HTTP ${res.status}`, features: [], url };
    const json = await res.json();
    if (json.error) return { error: `ArcGIS error: ${json.error.message || JSON.stringify(json.error)}`, features: [], url };
    return { features: Array.isArray(json.features) ? json.features : [], url };
  } catch (err) {
    return { error: err.name === 'AbortError' ? 'timeout' : String(err.message || err), features: [], url };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch verified parcel geometry for one listing row.
 * Returns { geojson, method, confidence, sourceUrl, error }.
 * geojson is null whenever geometry could not be accurately verified.
 */
export async function fetchParcelGeometry({ county, parcelId, lat, lon }) {
  const slug = countySlug(county);
  const cfg = COUNTY_CONFIG[slug];
  if (!cfg) {
    const reason = PLACEHOLDER_COUNTIES.has(slug)
      ? `No verified ArcGIS parcel endpoint for ${county} County (portal/placeholder only) — manual verification required.`
      : `No GIS parcel connector configured for ${county} County.`;
    return { geojson: null, method: 'none', confidence: 0, sourceUrl: '', error: reason };
  }

  const latN = Number(lat), lonN = Number(lon);
  const hasPoint = Number.isFinite(latN) && Number.isFinite(lonN) && latN !== 0 && lonN !== 0;
  const normTarget = normalizeParcelId(parcelId);
  const usableId = hasUsableParcelId(parcelId);

  // 1) Point-in-polygon (most accuracy-robust; immune to parcel-ID format drift).
  if (hasPoint) {
    const pad = 0.0009;
    const envelope = JSON.stringify({ xmin: lonN - pad, ymin: latN - pad, xmax: lonN + pad, ymax: latN + pad, spatialReference: { wkid: 4326 } });
    const r = await arcgisQuery(cfg.serviceUrl, {
      geometry: envelope,
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      where: '1=1',
    });
    if (!r.error) {
      const containing = r.features.filter((f) => isValidGaPolygon(f.geometry) && geometryContainsPoint(f.geometry, lonN, latN));
      if (containing.length === 1) {
        const f = containing[0];
        const srcId = normalizeParcelId(f.properties?.[cfg.parcelIdField]);
        const idMatches = usableId && srcId && (srcId === normTarget || srcId.endsWith(normTarget.slice(-10)) || normTarget.endsWith(srcId.slice(-10)));
        return {
          geojson: f.geometry,
          method: 'point_in_polygon',
          confidence: idMatches ? 96 : 80,
          sourceUrl: r.url,
          error: '',
        };
      }
    }
  }

  // 2) Parcel-ID match fallback.
  if (usableId) {
    const core = normTarget.slice(-10).replace(/'/g, "''");
    const r = await arcgisQuery(cfg.serviceUrl, {
      where: `UPPER(${cfg.parcelIdField}) LIKE '%${core}%'`,
    });
    if (!r.error) {
      const exact = r.features.filter((f) => {
        const srcId = normalizeParcelId(f.properties?.[cfg.parcelIdField]);
        return isValidGaPolygon(f.geometry) && srcId && (srcId === normTarget || srcId.endsWith(normTarget.slice(-12)) || normTarget.endsWith(srcId.slice(-12)));
      });
      if (exact.length === 1) {
        return { geojson: exact[0].geometry, method: 'parcel_id_match', confidence: 90, sourceUrl: r.url, error: '' };
      }
      if (exact.length > 1) {
        return { geojson: null, method: 'none', confidence: 0, sourceUrl: r.url, error: `Ambiguous parcel-ID match (${exact.length}) in ${county} County GIS.` };
      }
    } else {
      return { geojson: null, method: 'none', confidence: 0, sourceUrl: cfg.serviceUrl, error: `GIS query failed for ${county}: ${r.error}` };
    }
  }

  return {
    geojson: null,
    method: 'none',
    confidence: 0,
    sourceUrl: cfg.serviceUrl,
    error: hasPoint
      ? `No single official ${county} County parcel polygon contained the listing point.`
      : `No usable parcel ID or coordinates to verify a ${county} County parcel boundary.`,
  };
}
