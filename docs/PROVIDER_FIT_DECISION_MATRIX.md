# Licensed Parcel/Property Provider — Fit Decision Matrix

**Date:** 2026-06-15
**Purpose:** Decide which (if any) licensed data provider immediately makes Georgia
Land Finder more accurate, more trustworthy, or easier to sell — without creating
decision fatigue. The goal is to narrow the path, not catalog vendors.

## TL;DR recommendation

- **Do now (one thing):** Keep using **free official county GIS/ArcGIS sources** (already wired in the prior parcel-boundary task) as the primary boundary source for the 50–100 row gold dataset — it is $0 and licensing-clean. In parallel, **open a Regrid self-serve API trial** and use it *only* to (a) cover the counties our free pipeline can't reach (Richmond/Bibb/Chatham and other placeholder counties) and (b) get standardized APN + acreage + owner/land-use in one schema. Do **not** sign a paid Regrid contract until the free pipeline is exhausted for the gold counties **and** the three licensing questions below are answered.
- **Do later:** **ATTOM** for property/tax/last-sale/valuation enrichment once there are paying users (free 30-day trial available to evaluate when ready).
- **Do not think about yet:** DataTree/First American, CoreLogic/Cotality, LightBox, ICE — enterprise/sales-gated, premium, no meaningful self-serve startup entry.

Rationale: our current biggest accuracy blocker (verified red parcel boundaries) is
already solvable for the DeKalb-heavy dataset via **free** county ArcGIS layers. A paid
provider is only worth it to close coverage gaps and standardize enrichment — Regrid is
the only candidate with a self-serve, GeoJSON-native, all-159-GA-county product that
permits SaaS display. Everything else is enterprise-tier and premature pre-revenue.

## Decision matrix

| Provider | Best use for us | Data types | GA fit | Integration | Licensing risk | Pricing transparency | Immediate value (0–100) | Decision |
|---|---|---|---|---|---|---|---|---|
| **Regrid** | Verified parcel geometry + standardized APN/acreage/owner/land-use for gold rows; cover gap counties | Boundary polygons (GeoJSON), APN, owner, land value, land use, structures; premium schema adds more | **All 159 GA counties**, sourced from county assessors | REST API → GeoJSON FeatureCollection (lat/lon, APN, address, polygon queries); raster+vector tiles; bulk + per-county store | **Medium** — SaaS display ✅, cache API records ✅ (destroy on termination); **derivative works/enrichment needs written approval**; **end-user export prohibited**; tiles can't be cached without approval | Partial — self-serve monthly API plans + published annual package examples (~$18K/yr for 120k records/12M tiles); exact entry tier sales-confirmed | **82** | **Use now (trial first)** |
| **ATTOM** | Property characteristics, tax assessment, last sale/deed, AVM valuation enrichment | 160M+ properties: ownership, boundaries, sales history, assessment, valuation, schools/crime | National incl. GA (99% US) | REST API (JSON/XML) by address/APN/ID/lat-lon; free 30-day trial | Unknown until sales contact (yearly license, SaaS display/cache terms not public) | Low — pricing sales-gated; trial is free | **55** | **Do later** |
| **DataTree / First American** | Recorded documents, deed/title history, AVM — premium title-grade lookups | Property details, recorded doc images, AVMs, transaction history | National, direct-from-county (very reliable) | API + bulk licensing + web self-service | Higher — premium, more sales/legal-heavy; SaaS display terms unclear | None published; premium | **35** | **Later / enterprise only** |
| **CoreLogic / Cotality** | Lender/insurer-grade valuation, climate/risk analytics at scale | Property, mortgage, valuation, climate risk, market analytics | National | Enterprise API | High — large upfront commitments, per-call costs exceed small budgets | None published; enterprise | **20** | **Do not think about yet** |
| **LightBox** | CRE-centric parcel/location intelligence | Parcels, CRE attributes, geocoding | National | Enterprise API | High — enterprise/CRE focus, no transparent self-serve | None published | **18** | **Do not think about yet** |
| **ICE (property data)** | Mortgage/servicing-grade data | Property, mortgage, servicing datasets | National | Enterprise | High — enterprise mortgage focus | None public | **12** | **Do not think about yet** |

## What each "do now / later" provider would improve in OUR product

- **Regrid →** turns "boundary missing" rows into verified red boundaries for counties our
  free ArcGIS connectors don't cover; gives one standardized APN/acreage/owner/land-use
  schema so the gold rows stop depending on per-county field-name mapping; tiles could
  later render all-parcel context without per-pin fetches.
- **ATTOM →** fills `Estimated_*` economics + last-sale + assessment + valuation +
  property characteristics that we currently mark "Needs verification," improving
  `Data_Confidence` and buyer trust once we monetize.

## Exact unanswered licensing/pricing questions (ask before paying)

**Regrid (parcels@regrid.com / self-serve dashboard):**
1. **Derivative works / enrichment:** We want to store Regrid parcel *geometry* + APN inside our own listing records (`Parcel_Boundary_GeoJSON`) and display it to authenticated subscribers. Their ToS requires written approval for derivative works — is storing geometry in our enriched dataset permitted under the standard API plan, and at what fee?
2. **Self-serve entry price:** What is the actual lowest monthly self-serve API tier (price, included parcel-record calls, tile allotment) at `app.regrid.com/api/plans`? Is there a free/trial tier for evaluation?
3. **Export boundary:** End-user export is prohibited. We currently let paid users export lead CSVs. Confirm we may export our *own* fields while excluding Regrid-sourced geometry/attributes — and whether parcel boundary GeoJSON specifically may never be exported.
4. **Tile caching:** Confirm whether map tiles may be cached for performance (ToS says not without written approval).

**Integration security (already enforced in the stub):** the Regrid API token is a
private paid credential and is **server-only** — `REGRID_API_TOKEN` (no `VITE_`
prefix), read via `process.env` in `src/lib/providers/regridConnector.ts` and only
ever called from a Vercel API function or Node script. Browser code must call a
same-origin serverless endpoint, never hold the token. Any public *tile* token
Regrid may offer is a separate, explicitly-browser-safe credential.

**ATTOM (when revisited):**
1. Can assessment/sale/valuation data be displayed to and cached for authenticated SaaS subscribers?
2. Lowest annual commitment + per-endpoint call pricing for a small-business tier?
3. Are AVM/valuation fields separately licensed/priced?

## Why we are NOT recommending the others now

Pre-revenue, with a DeKalb-concentrated dataset already coverable by free county GIS,
committing to enterprise contracts (DataTree/CoreLogic/LightBox/ICE) adds legal and
cost overhead before it improves a single gold row. Revisit only when (a) we need
title-grade recorded documents (→ DataTree) or (b) we operate at a scale where
enterprise valuation/risk models pay for themselves (→ CoreLogic/Cotality).

## Sources

- [Regrid Parcel API & Tiles coverage](https://regrid.com/api)
- [Regrid API/Tileserver Terms of Service](https://regrid.com/terms/api)
- [Regrid Plans & Pricing](https://app.regrid.com/plans)
- [Regrid Georgia parcel data (159 counties)](https://regrid.com/georgia-parcel-data)
- [Regrid API v1 endpoints & GeoJSON format](https://support.regrid.com/api/parcel-api-v1-endpoints)
- [ATTOM Property Data API](https://www.attomdata.com/solutions/property-data-api/)
- [ATTOM developer signup / free trial](https://api.developer.attomdata.com/signup)
- [DataTree by First American (Datarade profile)](https://datarade.ai/data-providers/datatree-by-first-american/profile)
- [First American Data & Analytics — DataTree](https://dna.firstam.com/solutions/property-data/datatree-property-research)
