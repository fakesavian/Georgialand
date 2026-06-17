/**
 * Validation utilities for parcel boundary vs. pin location agreement.
 *
 * After a live county GIS lookup returns a polygon, we cannot assume it
 * matches the selected listing's pin — the pin may be a rough lead location,
 * the parcel ID may have a partial match, or the GIS service may return
 * an adjacent/wrong parcel. These utilities let MapView signal that clearly
 * rather than showing "Verified" unconditionally.
 */

/** Distance (from pin to polygon centroid) within which we call it a near-match. */
export const MATCH_THRESHOLD_METERS = 250;

export type BoundaryMatchStatus = 'matched' | 'near_match' | 'mismatch' | 'unknown';

export interface BoundaryMatchResult {
  status: BoundaryMatchStatus;
  /** Approximate distance from pin to polygon centroid in metres, or null if unknown. */
  distanceMeters: number | null;
  detail: string;
}

/** Haversine distance between two WGS84 points, in metres. */
export function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Compute the arithmetic centroid of the outer ring of a polygon.
 * Rings are in [lat, lon] order (as returned by wareCountyGisConnector).
 */
export function polygonCentroid(rings: [number, number][][]): [number, number] | null {
  if (!rings.length || !rings[0].length) return null;
  const outer = rings[0];
  let latSum = 0;
  let lonSum = 0;
  for (const [lat, lon] of outer) {
    latSum += lat;
    lonSum += lon;
  }
  return [latSum / outer.length, lonSum / outer.length];
}

/**
 * Ray-casting point-in-polygon test for a single ring.
 * Ring coordinates are [lat, lon] pairs.
 */
export function ringContainsPoint(ring: [number, number][], lat: number, lon: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lonI] = ring[i];
    const [latJ, lonJ] = ring[j];
    const crosses = (lonI > lon) !== (lonJ > lon);
    if (crosses) {
      const latAtCross = ((latJ - latI) * (lon - lonI)) / ((lonJ - lonI) || Number.EPSILON) + latI;
      if (lat < latAtCross) inside = !inside;
    }
  }
  return inside;
}

/**
 * Validate whether a listing's pin coordinates are consistent with a
 * returned parcel polygon. Uses point-in-polygon for a strong match,
 * centroid distance for a near/mismatch classification.
 *
 * @param rings   - Polygon rings in [lat, lon] order (outer ring first)
 * @param pinLat  - Listing marker latitude
 * @param pinLon  - Listing marker longitude
 */
export function validateBoundaryMatch(
  rings: [number, number][][] | undefined,
  pinLat: number,
  pinLon: number,
): BoundaryMatchResult {
  if (!rings || rings.length === 0) {
    return { status: 'unknown', distanceMeters: null, detail: 'No polygon geometry to validate.' };
  }
  if (!Number.isFinite(pinLat) || !Number.isFinite(pinLon)) {
    return { status: 'unknown', distanceMeters: null, detail: 'Pin coordinates are invalid.' };
  }

  // Strong match: pin is inside the outer ring
  if (ringContainsPoint(rings[0], pinLat, pinLon)) {
    return { status: 'matched', distanceMeters: 0, detail: 'Pin is inside the returned polygon.' };
  }

  // Compute centroid distance as a proxy for "how far away is this polygon?"
  const centroid = polygonCentroid(rings);
  if (!centroid) {
    return { status: 'unknown', distanceMeters: null, detail: 'Cannot compute polygon centroid.' };
  }

  const distanceMeters = haversineMeters(pinLat, pinLon, centroid[0], centroid[1]);

  if (distanceMeters <= MATCH_THRESHOLD_METERS) {
    return {
      status: 'near_match',
      distanceMeters,
      detail: `Pin is ~${Math.round(distanceMeters)}m from polygon centroid — marker location may be approximate.`,
    };
  }

  return {
    status: 'mismatch',
    distanceMeters,
    detail: `Pin is ~${Math.round(distanceMeters)}m from polygon centroid — boundary does not match the selected pin location.`,
  };
}

/** Human-readable status message for a boundary match result. */
export function getBoundaryStatusMessage(
  result: BoundaryMatchResult | null,
  featureCount: number,
  gisError: string | undefined,
): string {
  if (featureCount === 0) {
    return gisError || 'Select a property with a verified parcel ID to load its county boundary.';
  }
  switch (result?.status) {
    case 'matched':    return 'Parcel boundary loaded and matches the selected location.';
    case 'near_match': return 'Parcel boundary loaded, but marker location is approximate.';
    case 'mismatch':   return 'Boundary found, but it does not match the selected pin location. Verify parcel ID/source before using.';
    default:           return 'Parcel boundary loaded.';
  }
}
