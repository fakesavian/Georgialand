# Georgia Land Finder – Scoring Model Documentation

> Version 1.0 · June 2026 · `src/lib/valueScoring.ts` · `src/lib/offMarketScoring.ts`

---

## Overview

Every property in the Georgia Land Finder platform is evaluated against **7 composite scores**, each ranging from **0 to 100**.  
Scores are surfaced in the UI based on the user's subscription tier (see §Tier Gating below).

| # | Score Name | Source File | Key Purpose |
|---|------------|-------------|-------------|
| 1 | `Fit_Score` | `offMarketScoring.ts` | Product/user fit |
| 2 | `Risk_Score` | `offMarketScoring.ts` | Composite acquisition risk |
| 3 | `Data_Confidence` | `offMarketScoring.ts` | Data completeness & reliability |
| 4 | `Value_Score` | `valueScoring.ts` | Price attractiveness |
| 5 | `Price_Confidence` | `valueScoring.ts` | Reliability of the price signal |
| 6 | `Off_Market_Confidence` | `offMarketScoring.ts` | Strength of off-market lead |
| 7 | `Market_Liquidity` | `valueScoring.ts` | Local land market activity |

---

## Score 1 – Fit Score (0–100)

**Definition:** How well the property matches the target buyer profile and product focus (rural raw land / agricultural / timberland in Georgia).

### Factor Weights

| Factor | Max Points | Notes |
|--------|-----------|-------|
| Property type match (land/vacant) | +20 | Land/vacant parcel = full points |
| Zoning compatible with use | +15 | AG, RR, Timber, I-1 compatible uses |
| Acreage in target range (1–500 ac) | +15 | Scaled; <0.25 ac or >1000 ac penalized |
| Buyer profile match | +15 | Based on session/saved search filters |
| Acquisition type fit (fee simple) | +10 | Mineral rights issues penalized |
| Metro vs rural preference | +10 | Rural counties score higher for our buyer base |
| Price bracket alignment | +10 | Under $250K preferred for entry-level |
| Adjacent opportunity presence | +5 | Near other scored opportunities |

### Fallback / Default
- If property type is unknown → score capped at 50
- If zoning is unknown → zoning factor is 0 (no penalty, no bonus)

---

## Score 2 – Risk Score (0–100, higher = more risky)

**Definition:** Composite acquisition risk. A high score (e.g., 80) signals that this property carries significant risk factors that require investigation before acquisition.

### Factor Weights

| Factor | Risk Added | Notes |
|--------|-----------|-------|
| FEMA flood zone (AE/VE) | +20 | Zone X = 0 risk |
| Title status unknown | +15 | Clouded or unknown title |
| Active redemption period | +15 | Tax sale redemption window open |
| Tax delinquency >2 years | +12 | Extended delinquency |
| Source confidence <40 | +10 | Unverified data source |
| Data freshness >180 days | +8 | Stale data increases uncertainty |
| No recorded access road | +8 | Landlocked parcel risk |
| Complex / mixed zoning | +6 | Multi-zone or overlay districts |
| Corporate owner (unknown LLC) | +6 | Harder to negotiate/contact |

### Fallback / Default
- If flood data unavailable → +5 warning added (unknown risk)
- If title status unavailable → +10 added (assume unknown = risk)
- Minimum score: 5 (some risk always exists)

---

## Score 3 – Data Confidence (0–100)

**Definition:** How complete, fresh, and verified the underlying data is for this property record.

### Factor Weights

| Factor | Max Points | Notes |
|--------|-----------|-------|
| Required fields populated (≥8/12) | +30 | Parcel ID, owner, address, acreage, price, zoning, coords, source |
| Source verified (MLS/GIS/County) | +20 | vs scraped/unknown |
| Human-reviewed flag set | +15 | Staff or broker reviewed |
| Verification level ≥ 2 | +10 | Scale: 0=raw, 1=auto, 2=human, 3=field |
| Source freshness ≤30 days | +10 | vs >180 days (-10) |
| Coordinate validity (lat/lng in GA) | +10 | Validates to Georgia bbox |
| Price validity (not $0 or null) | +5 | Non-zero, plausible price |

### Fallback / Default
- If fewer than 4 required fields present → score capped at 25
- Human-reviewed = 0 points by default

---

## Score 4 – Value Score (0–100)

**Definition:** Price attractiveness relative to the local market context.  
A $500K property can score 90 if price-per-acre is far below county median.  
A $10K property can score 20 if it is overpriced per-acre.

### Factor Weights

| Factor | Max Delta | Notes |
|--------|----------|-------|
| List price / assessed value ratio | ±25 | ≤0.5 ratio = +25; >1.5 = -15 |
| Price-per-acre vs county median | ±20 | ≤50% of median = +20; >150% = -14 |
| Days on market (DOM) | +10 | >365 days = +10; <14 days = -4 |
| Price reductions | +8 | ≥3 reductions = +8 |
| Local price trend | ±5 | Falling = +5 (buy timing); Rising = +3 |
| Nearby comparable count | ±5 | 0 comps = -5 |

**Baseline:** 50 (neutral – no data means market-rate)

### Fallback / Default
- listPrice or assessedValue missing → list/assessed factor skipped (warning issued)
- acreage or countyMedianPricePerAcre missing → PPA comparison skipped
- daysOnMarket missing → DOM factor skipped

---

## Score 5 – Price Confidence (0–100)

**Definition:** How reliable and verifiable the price signal is.  
Prevents acting on stale tax estimates as if they were MLS-verified prices.

### Factor Weights

| Factor | Max Delta | Notes |
|--------|----------|-------|
| Source = verified_sale | +35 | Deed-recorded sale price |
| Source = MLS | +25 | Licensed feed |
| Source = owner_asking | +5 | Treat as ceiling only |
| Source = tax_estimate | 0 | Not a market price |
| Source = unknown | -10 | Severely penalized |
| Price freshness ≤30 days | +15 | Current |
| Price freshness 31–90 days | +8 | Recent |
| Price freshness >365 days | -15 | Very stale |
| Comp count ≥5 | +15 | Strong comp support |
| Comp count 2–4 | +8 | Moderate support |
| Comp count = 0 | -8 | No validation |
| Human verified | +8 | Broker/staff confirmed |
| MLS verified flag | +5 | System cross-check |
| Is verified sale flag | +5 | Additional confirmation |

**Baseline:** 30 (assume low confidence until evidence provided)

### Fallback / Default
- priceSource = 'unknown' → baseline further penalized
- No comp data → warning issued, -8 applied

---

## Score 6 – Off-Market Confidence (0–100)

**Definition:** How strong the off-market lead signal is. High score means this parcel shows multiple indicators that the owner may be motivated or the property is underutilized and acquirable without MLS competition.

### Factor Weights

| Factor | Max Points | Notes |
|--------|-----------|-------|
| Likely vacant | +18 | Land-only / no structure |
| Low improvement value | +14 | <$5K improvement value |
| Tax delinquency | +14 | County delinquent rolls |
| Public/government ownership | +12 | Surplus land candidate |
| Absentee owner | +10 | Out-of-state or mailing ≠ situs |
| Last sale age ≥15 years | +8 | Long hold period |
| Land bank adjacent | +8 | Near known land bank asset |
| Near tracked opportunity | +8 | Adjacent to existing deal |
| Zoning fit | +8 | Compatible with target use |
| Corporate owner (small LLC) | +6 | Often motivated sellers |
| Blight designation | +6 | Municipality priority |
| Near redevelopment activity | +5 | Adjacent redev signals |
| Source confidence ≥80 | +8 | High-quality lead signal |
| Source freshness ≤30 days | +5 | Current intelligence |

### Fallback / Default
- No signals present → returns "Insufficient signals – Needs verification"
- dataFreshnessDays >180 → score penalized -8

---

## Score 7 – Market Liquidity (0–100)

**Definition:** How active and liquid the local land market is. High score means there are many buyers, fast sales, and strong demand indicators.

### Factor Weights

| Factor | Max Delta | Notes |
|--------|----------|-------|
| County activity = high | +25 | Known active county |
| County activity = moderate | +12 | Average activity |
| County activity = low | 0 | Neutral |
| County activity = very_low | -10 | Illiquid |
| Nearby listing count ≥20 | +15 | Very active inventory |
| Nearby listing count 10–19 | +10 | Healthy inventory |
| Nearby listing count 3–9 | +4 | Limited but present |
| Nearby listing count = 0 | -10 | No market data |
| Median DOM ≤45 days | +15 | Fast market |
| Median DOM 46–120 days | +7 | Moderate pace |
| Median DOM >365 days | -10 | Very slow |
| Price trend = rising | +10 | Demand increasing |
| Price trend = falling | -5 | Demand softening |
| Annual sales volume ≥50 | +10 | High volume |
| Annual sales volume 15–49 | +5 | Moderate volume |
| Annual sales volume <5 | -8 | Very thin |
| Known demand driver | +8 | Solar, industrial, residential |
| Opportunity Zone | +5 | Federal designation |
| Near transit corridor | +5 | Infrastructure connectivity |

**Baseline:** 30 (conservative – assume illiquid until proven otherwise)

---

## Score Examples

### Example A: Cheap Vacant Rural Land ($15K, 5 acres, Ware County)

| Score | Value | Rationale |
|-------|-------|-----------|
| Fit_Score | 78 | Rural, acreage in range, AG zoning |
| Risk_Score | 22 | Low risk, clear title, not delinquent |
| Data_Confidence | 55 | County GIS data, not human-reviewed |
| Value_Score | 82 | $3K/ac vs $8K county median, assessed at $18K |
| Price_Confidence | 48 | Tax record price, no MLS, 90-day old data |
| Off_Market_Confidence | 34 | Absentee owner + low improvement value |
| Market_Liquidity | 38 | Low county activity, 6 nearby listings |

### Example B: Normal Land (MLS-listed, $85K, 12 acres, Chatham County)

| Score | Value | Rationale |
|-------|-------|-----------|
| Fit_Score | 62 | Semi-urban, zoning mixed |
| Risk_Score | 18 | Clean title, MLS-listed |
| Data_Confidence | 85 | MLS data, verified, fresh |
| Value_Score | 55 | Near market rate |
| Price_Confidence | 78 | MLS source, 15 comps |
| Off_Market_Confidence | 12 | Listed property, not an off-market lead |
| Market_Liquidity | 68 | Active suburban market |

### Example C: Premium Land ($500K, 200 acres, Lowndes County)

| Score | Value | Rationale |
|-------|-------|-----------|
| Fit_Score | 70 | Large acreage, good for timber/solar |
| Risk_Score | 15 | Clean title, good access |
| Data_Confidence | 90 | Broker-verified, human reviewed |
| Value_Score | 88 | $2,500/ac vs $4,200 county median → 40% below |
| Price_Confidence | 85 | Broker-verified MLS, 8 comps |
| Off_Market_Confidence | 20 | MLS listed, not a lead signal |
| Market_Liquidity | 55 | Moderate activity, solar demand driver |

### Example D: Off-Market Parcel (Tax-delinquent, absentee, no listing)

| Score | Value | Rationale |
|-------|-------|-----------|
| Fit_Score | 72 | Vacant land, AG zoning |
| Risk_Score | 48 | Delinquent tax, title unverified |
| Data_Confidence | 38 | Tax roll data only, no human review |
| Value_Score | 71 | Listed below assessed, long hold |
| Price_Confidence | 25 | Tax estimate only, 0 comps |
| Off_Market_Confidence | 74 | Vacant + delinquent + absentee + old sale |
| Market_Liquidity | 42 | Moderate county, few comps |

---

## Tier Gating – Which Scores Unlock at Which Tier

| Score | Free | Scout ($19) | Pro ($49) | Agency ($149) |
|-------|------|-------------|-----------|---------------|
| Fit_Score | ✅ (capped 0–50) | ✅ | ✅ | ✅ |
| Risk_Score | ❌ | ✅ | ✅ | ✅ |
| Data_Confidence | ❌ | ✅ | ✅ | ✅ |
| Value_Score | ❌ | ✅ | ✅ | ✅ |
| Price_Confidence | ❌ | ❌ | ✅ | ✅ |
| Off_Market_Confidence | ❌ | ❌ | ✅ | ✅ |
| Market_Liquidity | ❌ | ❌ | ✅ | ✅ |

> Free users see Fit_Score as a teaser (values capped at 50 to show direction without full signal).

---

## Data Requirements per Score

| Score | Required Fields | Optional Enhancements |
|-------|----------------|----------------------|
| Fit_Score | parcelType, zoning, acreage | buyerProfile, acquisitionType |
| Risk_Score | sourceConfidence | floodZone, titleStatus, taxDelinquent |
| Data_Confidence | fieldCount, sourceType | humanReviewed, verificationLevel |
| Value_Score | listPrice, acreage | assessedValue, countyMedianPPA, DOM |
| Price_Confidence | priceSource | priceFreshnessAgeDays, compCount |
| Off_Market_Confidence | (any signal present) | vacancy, taxStatus, ownerType |
| Market_Liquidity | (any market field) | countyActivity, nearbyListings, DOM |

---

## Implementation Notes

- All scores are **clamped to [0, 100]** and **rounded to integers**.
- A baseline of 50 (Value), 30 (Price Confidence, Market Liquidity), and 0 (Risk, Off-Market) is used.
- Scores degrade gracefully: missing fields produce warnings, not failures.
- The `generateOffMarketReport()` function in `offMarketScoring.ts` aggregates all available scores into a single report object.
