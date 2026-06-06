import { ListingSourceConfig } from '../types/listings';

export const LISTING_SOURCE_CONFIGS: ListingSourceConfig[] = [
  {
    id: 'reso_generic',
    name: 'RESO Web API Connector',
    sourceType: 'reso',
    url: 'https://www.reso.org/web-api/',
    authRequired: true,
    enabled: false,
    notes: 'Future connector. Requires MLS/vendor authorization before use.',
  },
  {
    id: 'georgia_mls',
    name: 'Georgia MLS',
    sourceType: 'idx',
    url: 'https://www.georgiamls.com/',
    authRequired: true,
    enabled: false,
    notes: 'Requires broker/vendor agreement. Not open data.',
  },
  {
    id: 'fmls',
    name: 'First Multiple Listing Service (FMLS)',
    sourceType: 'idx',
    url: 'https://www.firstmls.com/',
    authRequired: true,
    enabled: false,
    notes: 'Important Atlanta/North Georgia listing source. Requires authorization.',
  },
  {
    id: 'land_marketplace_partner_feed',
    name: 'Land Marketplace Partner Feed',
    sourceType: 'marketplace',
    url: '',
    authRequired: true,
    enabled: false,
    notes: 'Placeholder for approved partner feed/listing syndication data.',
  },
];
