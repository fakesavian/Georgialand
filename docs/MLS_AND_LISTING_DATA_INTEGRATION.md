# MLS and Listing Data Integration

## Goal
Add connector-ready architecture for active listings, pending listings, sold comps, market comps, and land listing feeds without hardwiring the product to one provider.

## Candidate providers
- RESO Web API via authorized MLS/vendor agreement.
- Georgia MLS.
- First Multiple Listing Service (FMLS) for Atlanta/North Georgia.
- Local MLSs for coastal and regional Georgia markets.
- Land listing marketplaces or partner feeds where legally available.
- Commercial property APIs such as ATTOM, Estated, CoreLogic/DataTree, or Regrid where license permits display/enrichment.

## Auth/config requirements
- Store provider credentials server-side only.
- Never expose API keys in `VITE_*` variables.
- Keep provider-specific rate limits and redistribution rules in config.
- Add a source entry to `data/source_registry.json` with `auth_required: true` and `enabled: false` until credentials and legal terms are approved.

## Normalized listing schema
Use `src/types/listings.ts` for shared types. Normalize provider fields into source ID, listing ID, status, address, parcel ID where available, lat/lng, price, acreage, listing dates, sold date/price where available, attribution, and raw payload.

## Mapping into Georgia Land Finder
- Active listings become market context, not public land-bank records.
- Sold listings/comps support valuation and price-per-acre comparison.
- MLS/listing data should stay separate from public land-bank/surplus/tax-sale sources in source attribution.
- Display provider attribution and required disclaimers in UI.

## UI candidates
- Market comps tab in property drawer.
- Nearby active listings.
- Nearby sold listings.
- Price-per-acre comparison.
- Market competition score.
- Off-market vs active-market comparison.

## Safety
MLS/IDX/RESO is not open data. Do not ingest, cache, display, or export MLS data until a valid data agreement allows the exact use case.
