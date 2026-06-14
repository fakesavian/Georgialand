import { LandProperty } from '../types';

export type BoundaryLayerKind = 'county' | 'city';

export interface BoundaryFeatureCollection {
  type: 'FeatureCollection';
  features: Array<Record<string, unknown>>;
}

interface CensusBoundaryLayerConfig {
  url: string;
  outFields: string;
  names: string[];
}

const CENSUS_COUNTY_LAYER = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query';
const CENSUS_PLACE_LAYER = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4/query';
const CENSUS_CONSOLIDATED_CITY_LAYER = 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/3/query';

const CITY_BOUNDARY_ALIASES: Record<string, string[]> = {
  Athens: ['Athens', 'Athens-Clarke County'],
  Augusta: ['Augusta', 'Augusta-Richmond County'],
  Macon: ['Macon', 'Macon-Bibb County'],
};

function normalizeName(value: unknown): string {
  return String(value || '').trim();
}

function uniqueNames(names: string[]): string[] {
  return Array.from(new Set(names.map(normalizeName).filter(Boolean))).sort();
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function getBoundaryNames(properties: LandProperty[], key: 'County' | 'City'): string[] {
  return uniqueNames(properties.map((property) => normalizeName(property[key])).filter((name) => !['Unknown', 'Various'].includes(name)));
}

function getCityNamesWithAliases(properties: LandProperty[]): string[] {
  const cities = getBoundaryNames(properties, 'City');
  return uniqueNames(cities.flatMap((city) => CITY_BOUNDARY_ALIASES[city] || [city]));
}

function buildNameWhereClause(names: string[]): string {
  if (!names.length) return "STATE='13'";
  const clauses = names.map((name) => `BASENAME='${escapeSqlString(name)}'`);
  return `STATE='13' AND (${clauses.join(' OR ')})`;
}

async function fetchCensusGeoJson(config: CensusBoundaryLayerConfig): Promise<BoundaryFeatureCollection> {
  if (!config.names.length) return { type: 'FeatureCollection', features: [] };

  const params = new URLSearchParams({
    f: 'geojson',
    where: buildNameWhereClause(config.names),
    outFields: config.outFields,
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '200',
    geometryPrecision: '5',
  });

  const response = await fetch(`${config.url}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Census TIGERweb boundary query failed: HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Census TIGERweb boundary query failed: ${data.error.message || data.error.code}`);
  }

  return {
    type: 'FeatureCollection',
    features: Array.isArray(data.features) ? data.features : [],
  };
}

function mergeFeatureCollections(collections: BoundaryFeatureCollection[]): BoundaryFeatureCollection {
  const seen = new Set<string>();
  const features: Array<Record<string, unknown>> = [];

  collections.flatMap((collection) => collection.features).forEach((feature) => {
    const properties = (feature.properties || {}) as Record<string, unknown>;
    const key = String(properties.GEOID || properties.NAME || JSON.stringify(feature.geometry || {}));
    if (seen.has(key)) return;
    seen.add(key);
    features.push(feature);
  });

  return { type: 'FeatureCollection', features };
}

export async function fetchCountyBoundaryGeoJson(properties: LandProperty[]): Promise<BoundaryFeatureCollection> {
  const countyNames = getBoundaryNames(properties, 'County');
  return fetchCensusGeoJson({
    url: CENSUS_COUNTY_LAYER,
    outFields: 'NAME,BASENAME,GEOID,STATE,COUNTY',
    names: countyNames,
  });
}

export async function fetchCityBoundaryGeoJson(properties: LandProperty[]): Promise<BoundaryFeatureCollection> {
  const cityNames = getCityNamesWithAliases(properties);
  const [places, consolidatedCities] = await Promise.all([
    fetchCensusGeoJson({
      url: CENSUS_PLACE_LAYER,
      outFields: 'NAME,BASENAME,GEOID,STATE,PLACE',
      names: cityNames,
    }),
    fetchCensusGeoJson({
      url: CENSUS_CONSOLIDATED_CITY_LAYER,
      outFields: 'NAME,BASENAME,GEOID,STATE',
      names: cityNames,
    }),
  ]);

  return mergeFeatureCollections([places, consolidatedCities]);
}
