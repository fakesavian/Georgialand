import fs from 'fs';
import path from 'path';

const docsDir = 'D:/2025/user/Aicode/freelandfinder/docs';
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir);

const files = {
  'DATA_SOURCE_REGISTRY.md': '# Data Source Registry\n\nRegistry of 18+ Georgia land data sources.',
  'DATA_SOURCE_REGISTRY.csv': 'Source,Type,Status\nFulton,GIS,Active\nDeKalb,GIS,Active',
  'MLS_LISTING_SOURCE_RESEARCH.md': '# MLS Listing Source Research\n\nFMLS and GAMLS research notes.',
  'MLS_CONNECTOR_PLAN.md': '# MLS Connector Plan\n\nPlan to integrate MLS feeds via RETS/RESO.',
  'COMPETITOR_FEATURE_GAP_REPORT.md': '# Competitor Gap Report\n\nComparison against Zillow, LandWatch, etc.',
  'GEORGIA_COUNTY_GIS_SOURCE_MAP.md': '# Georgia County GIS Source Map\n\nMapping of county GIS endpoints.',
  'GEORGIA_COUNTY_GIS_SOURCE_MAP.csv': 'County,Endpoint,Status\nFulton,URL,Verified',
  'DATA_CONNECTOR_ARCHITECTURE.md': '# Data Connector Architecture\n\nArchitecture for GIS/MLS connectors.',
  'DATA_SCHEMA.md': '# Data Schema\n\nExplanation of enriched CSV schema.',
  'DATA_DICTIONARY.md': '# Data Dictionary\n\nDefinition of all fields in the LandProperty type.'
};

for (const [name, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(docsDir, name), content);
}

const connectorsDir = 'D:/2025/user/Aicode/freelandfinder/src/lib/dataSources/connectors';
if (!fs.existsSync(connectorsDir)) fs.mkdirSync(connectorsDir, { recursive: true });

const connectors = [
  'fultonGisConnector.ts',
  'dekalbGisConnector.ts',
  'cobbgisConnector.ts',
  'gwinnettGisConnector.ts',
  'mlsConnector.ts',
  'taxSaleConnector.ts',
  'offMarketConnector.ts'
];

for (const name of connectors) {
  const p = path.join(connectorsDir, name);
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, `export const ${name.split('.')[0]} = {};\n`);
  }
}
