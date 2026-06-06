export interface ListingSourceConfig {
  id: string;
  name: string;
  sourceType: 'reso' | 'idx' | 'marketplace' | 'commercial_api' | 'manual_import';
  url: string;
  authRequired: boolean;
  enabled: boolean;
  notes: string;
}

export interface NormalizedListingRecord {
  sourceId: string;
  listingId: string;
  status: 'active' | 'pending' | 'sold' | 'expired' | 'unknown';
  address?: string;
  city?: string;
  county?: string;
  state: 'GA';
  zip?: string;
  parcelId?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  pricePerAcre?: number;
  acreage?: number;
  propertyType?: string;
  listingUrl?: string;
  listedAt?: string;
  soldAt?: string;
  soldPrice?: number;
  attribution?: string;
  raw?: Record<string, unknown>;
}
