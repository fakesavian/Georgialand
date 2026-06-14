# Georgia Land Finder – Off-Market Discovery Model

> Version 1.0 · June 2026 · `src/lib/offMarketScoring.ts`

---

## Purpose

The Off-Market Discovery Model identifies parcels that are **not listed on the MLS** but show strong signals that the owner may be **motivated, reachable, and willing to sell** at or below market rate. These parcels represent the highest-value acquisition opportunities for our buyers.

---

## Off-Market Flag & Criteria

### `Off_Market_Flag` (boolean)

Set to `true` when **any 2 or more** of the following primary signals are present on a parcel:

| Signal | Definition | Data Source |
|--------|-----------|-------------|
| `likelyVacant` | No structure or improvement value ≤$1K | County assessor / GIS |
| `taxDelinquent` | Property is on county delinquent tax rolls | County tax office |
| `absenteeOwner` | Owner mailing address ≠ property situs address | County assessor |
| `publiclyOwned` | Owner is a government entity or authority | County/state records |
| `lowImprovementValue` | Improvement value <$5K relative to total assessment | County assessor |
| `lastSaleAgeYears` ≥15 | Property has not sold in 15+ years | Deed records / GSCCCA |
| `corporateOwner` | Owner is an LLC or trust (small entity) | Secretary of State / deed |

### `Off_Market_Reason` (string[])

Array of human-readable strings explaining why the `Off_Market_Flag` is set.  
Populated from signal labels in `calculateOffMarketScore()` and `generateOffMarketReport()`.

---

## All Off-Market Signal Definitions

### Primary Vacancy & Ownership Signals

| Field | Type | Description | Weight |
|-------|------|-------------|--------|
| `likelyVacant` | boolean | No structure present; land-only parcel | 18 pts |
| `lowImprovementValue` | boolean | Improvement value <$5K | 14 pts |
| `taxDelinquent` | boolean | On county delinquent rolls | 14 pts |
| `publiclyOwned` | boolean | Owned by government/authority (surplus candidate) | 12 pts |
| `absenteeOwner` | boolean | Owner mailing address out-of-county or out-of-state | 10 pts |
| `corporateOwner` | boolean | Small LLC or trust ownership | 6 pts |

### Location & Context Signals

| Field | Type | Description | Weight |
|-------|------|-------------|--------|
| `landBankAdjacent` | boolean | Parcel adjacent to or within 500ft of land bank property | 8 pts |
| `nearExistingOpportunity` | boolean | Within 1 mile of another tracked off-market opportunity | 8 pts |
| `adjacentRedevActivity` | boolean | Adjacent to active redevelopment project | 5 pts |
| `nearTransitCorridor` | boolean | Within 0.5 mile of highway interchange or transit line | 5 pts |
| `opportunityZone` | boolean | Within a federally designated Opportunity Zone | 5 pts |
| `blightStatus` | boolean | Formally designated as blighted by municipality | 6 pts |

### Temporal & Financial Signals

| Field | Type | Description | Weight |
|-------|------|-------------|--------|
| `lastSaleAgeYears` | number | Years since last recorded deed transfer | +8 if ≥15 yrs |
| `assessedValuePerAcre` | number | County assessed $/acre (used for value benchmarking) | context |
| `nearbyListingCount` | number | Active listings within 5-mile radius | context |
| `marketListingsNearby` | number | County-level active listing count | context |

### Data Quality Signals

| Field | Type | Description | Weight |
|-------|------|-------------|--------|
| `sourceConfidence` | number (0–100) | How reliable is the data source | +8 if ≥80; -10 if <40 |
| `dataFreshnessDays` | number | Days since data was last verified | +5 if ≤30; -8 if >180 |

---

## Owner Type Classification (`Owner_Type`)

| Value | Description | Off-Market Implication |
|-------|-------------|----------------------|
| `individual` | Single person or married couple | Standard outreach |
| `absentee_individual` | Individual whose mailing ≠ situs | High priority outreach |
| `small_llc` | LLC with ≤3 apparent members | Often motivated, direct contact possible |
| `large_corporation` | Regional/national corporation | Harder to negotiate; lower off-market score |
| `government` | Federal, state, or local government | Surplus land program candidate |
| `land_bank` | County or city land bank | Acquisition program outreach |
| `trust` | Family or irrevocable trust | May have estate/succession motivation |
| `estate` | Probate or estate-in-progress | High motivation; legal complexity |

---

## Scoring Weights Table (Full)

| Signal | Points | Category |
|--------|--------|----------|
| Likely vacant / land-only | +18 | Vacancy |
| Low improvement value (<$5K) | +14 | Vacancy |
| Tax delinquent | +14 | Financial Distress |
| Publicly owned | +12 | Ownership |
| Absentee owner | +10 | Ownership |
| High source confidence (≥80) | +8 | Data Quality |
| Land bank adjacent | +8 | Location |
| Near tracked opportunity | +8 | Location |
| Zoning fit | +8 | Fit |
| Last sale age ≥15 years | +8 | Temporal |
| Corporate/LLC owner | +6 | Ownership |
| Blight designation | +6 | Distress |
| Fresh data (≤30 days) | +5 | Data Quality |
| Near transit corridor | +5 | Location |
| Opportunity Zone | +5 | Location |
| Adjacent redevelopment activity | +5 | Location |
| Acreage signal (≥0.1 ac) | up to +8 | Size |
| Low confidence (<40) | -10 | Data Quality Penalty |
| Stale data (>180 days) | -8 | Data Quality Penalty |

---

## Confidence Tier Definitions

| Tier | Score Range | Label | Recommended Action |
|------|------------|-------|-------------------|
| **Platinum** | 80–100 | 🔴 Immediate Opportunity | Direct outreach within 24 hours; skip-trace owner |
| **Gold** | 65–79 | 🟠 High Confidence Lead | Outreach within 7 days; mail + phone |
| **Silver** | 45–64 | 🟡 Moderate Signal | Monitor + mail campaign; queue for batch outreach |
| **Bronze** | 25–44 | 🔵 Weak Signal | Log for future monitoring; re-evaluate in 90 days |
| **Unqualified** | 0–24 | ⚪ Insufficient Data | Do not contact yet; enrich data first |

---

## Outreach Action Matrix

| Confidence Tier | Primary Channel | Secondary Channel | Timing | Template |
|-----------------|----------------|-------------------|--------|----------|
| Platinum (80–100) | Phone (skip-traced) | Certified mail | Within 24 hrs | `OUTREACH_PLATINUM` |
| Gold (65–79) | Direct mail | Email (if found) | Within 7 days | `OUTREACH_GOLD` |
| Silver (45–64) | Direct mail (batch) | None initially | Within 30 days | `OUTREACH_SILVER` |
| Bronze (25–44) | Postcard campaign | — | 60–90 day cycle | `OUTREACH_BRONZE` |
| Unqualified (0–24) | Data enrichment | — | Before any contact | Internal only |

### Outreach Channel Priority

1. **Skip-traced phone** – highest response rate for absentee/estate owners
2. **Certified / handwritten letter** – signals serious buyer intent
3. **Standard direct mail** – cost-effective for batch campaigns
4. **Email** – use if address found via skip-trace or public records
5. **Door knock** – local agents only; use for Platinum tier with local rep

---

## Off-Market Report Schema

Generated by `generateOffMarketReport()` in `offMarketScoring.ts`:

```typescript
interface OffMarketReport {
  parcelId?: string;
  offMarketFlag: boolean;
  offMarketScore: number;
  confidenceTier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze' | 'Unqualified';
  reasons: string[];
  ownerType?: string;
  recommendedAction: string;
  outreachPriority: 1 | 2 | 3 | 4 | 5;
  dataWarnings: string[];
  scoredAt: string; // ISO 8601 timestamp
}
```

---

## Data Pipeline Integration

### Recommended Data Sources (Georgia)

| Data Type | Source | Update Frequency |
|-----------|--------|-----------------|
| Parcel ownership & address | County Tax Assessor (GIS portal) | Annual / quarterly |
| Tax delinquency rolls | County Tax Commissioner | Monthly |
| Deed transfer history | GSCCCA (Georgia Superior Court Clerks) | Weekly |
| Vacant lot indicators | County GIS / FGDC aerial classification | Annual |
| Land bank inventory | Georgia Land Bank Association | As available |
| Opportunity Zones | HUD / USDA overlay | Static (2018 designation) |
| Transit corridors | GDOT / GRTA layers | As available |
| Blight designations | Municipal code enforcement | Varies by city |

### Enrichment Priority

When a parcel triggers `Off_Market_Flag = true`, enrich in this order:
1. Verify owner mailing address (skip-trace if needed)
2. Pull full deed history from GSCCCA
3. Check county delinquent tax roll for exact balance
4. Confirm flood zone via FEMA FIRM
5. Validate coordinates and parcel boundary in GIS
6. Score with all 7 composite scores before outreach

---

## Scoring Methodology Notes

- **Additive model** – each signal adds or subtracts points from a base of 0
- **No single signal is disqualifying** – a property with only 1 signal may still be logged
- **Score floor** – minimum final score is 0 (clamped)
- **Score ceiling** – maximum final score is 100 (clamped)
- **Multi-signal bonus** – when 5+ signals fire, the score naturally reflects compounding evidence
- **Data staleness penalty** – scores degrade automatically when data is >180 days old
- **Confidence weighting** – source confidence below 40 applies a -10 global penalty

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| June 2026 | 1.0 | Initial model documentation |
