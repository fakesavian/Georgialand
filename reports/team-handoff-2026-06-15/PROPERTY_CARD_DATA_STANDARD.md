# Georgia Land Finder — Enriched Property Card Data Standard

**Date:** 2026-06-15  
**Purpose:** Create a repeatable standard for collecting new property data and enriching older rows so every property card is useful, trustworthy, and team-reviewable.

## Source files reviewed

- `public/local_dashboard_dataset.csv`
- `src/types.ts`
- `src/components/dashboard/PropertyCard.tsx`
- `src/components/dashboard/PropertyDrawer.tsx`
- `supabase/schema.sql`

## Strong enriched example row

**Dataset:** `public/local_dashboard_dataset.csv`  
**Listing ID:** `GA-034`  
**Property:** `884 Walnut St`  
**City/County:** Macon, Bibb County, GA  
**Parcel ID:** `Q073-0245`  
**Coordinates:** `32.8421, -83.6362`  
**Source Agency:** Macon-Bibb County Land Bank Authority  
**Price:** `$2,500`  
**Fit Score:** `100`  
**Risk Score:** `35`  
**Data Confidence:** `100`  
**Field completion observed:** 122 populated fields out of 133.

### Why this is a strong model row

GA-034 is a good example because it gives the buyer enough information to understand the deal without leaving the dashboard:

- specific address,
- real parcel ID,
- usable coordinates,
- price,
- land-bank acquisition path,
- eligibility rules,
- build/use requirements,
- zoning,
- road/utilities/flood/title/redemption fields,
- estimated acquisition and soft costs,
- buyer profile/use-case angles,
- contact agency/email/phone/form URL,
- next-call script,
- audit and verification fields,
- fit/risk/data-confidence scores.

It works well with the UI because:

- `PropertyCard.tsx` displays address, city/county, acquisition type, satellite image, fit/risk, price category, price, lot size, zoning, property type, pros/cons, recommended action, and source/property/map/GIS links.
- `PropertyDrawer.tsx` displays close-up imagery, source verification checks, warnings, notes, pros/cons, recommended action, and field-by-field detail.

### Remaining gaps even in this strong row

GA-034 is strong, but still shows what the team should keep improving:

- some neighborhood/context fields may still be `Needs verification`,
- source/property URLs should ideally deep-link directly to the listing or assessor parcel page when available,
- `Source_Snapshot_File` should point to an archived source snapshot when the row is production-grade,
- nearest transit/school/park/grocery should be verified rather than guessed.

## Current local dataset snapshot

Inspection of `public/local_dashboard_dataset.csv` showed:

- 358 rows,
- 133 fields,
- top county: DeKalb with 306 rows,
- 350 rows with `Data_Confidence_0_to_100 >= 70`,
- 333 rows with `Data_Confidence_0_to_100 >= 80`,
- average data confidence around 90.2.

Important caveat:

- Roughly 300 rows have blank `Acquisition_Type` in the inspected local dataset. This should be corrected or backfilled before the dataset is treated as polished paid inventory.

## Property-card data standard

Use this checklist for every new property and every enrichment pass on existing rows.

---

## 1. Core identity — required

Every row should have:

- `Listing_ID`
- `Priority_Rank`
- `Property_Name_or_Address`
- `City`
- `County`
- `State`
- `Zip` or `Zip_Code`
- `Parcel_ID`
- `Latitude`
- `Longitude`
- `Lot_Size_Acres`
- `Property_Type`
- `Current_Status`
- `Acquisition_Type`

### Quality bar

- Use parcel-specific address and parcel ID whenever possible.
- If a row is program-level rather than parcel-level, mark that explicitly in `Property_Type`, `Notes`, or `Data_Source_Type`.
- Coordinates must be numeric and precise enough for a satellite/map view.
- Do not leave `Acquisition_Type` blank; it is a major buyer decision field.

---

## 2. Source and verification links — required

Every row should have:

- `Source_Agency`
- `Source_URL`
- `Property_Page_URL`
- `Map_URL`
- `GIS_URL`
- `Data_Source_Type`
- `Official_Source_Confirmed`
- `Source_URL_Status`

### Quality bar

At least 4 of these 6 source checks should pass before a row is paid-dashboard ready:

1. valid official/source URL,
2. valid property page URL,
3. valid GIS or assessor URL,
4. valid map URL or usable coordinates,
5. non-empty real parcel ID,
6. `Data_Confidence_0_to_100 >= 70`.

These checks align with the source-verification panel logic in `PropertyDrawer.tsx`.

---

## 3. Pricing and acquisition economics — required

Every row should have:

- `Estimated_Price_or_Min_Bid`
- `Price_Category`
- `Deposit_Required`
- `Estimated_Closing_Costs`
- `Estimated_Title_Search_Cost`
- `Estimated_Survey_Cost`
- `Estimated_Legal_Cost`
- `Estimated_Quiet_Title_or_Redemption_Cost`
- `Estimated_Utility_Connection_Cost`
- `Estimated_Site_Clearing_Cost`
- `Estimated_Total_Acquisition_Cost_Low`
- `Estimated_Total_Acquisition_Cost_High`
- `Monetization_Value_0_to_100`

### Quality bar

- Do not only capture bid/asking price.
- Show a realistic total acquisition cost range where possible.
- Normalize price category into useful buckets such as `Under $10K`, `Under $25K`, `Under $50K`, etc.
- If price is unknown, explain exactly who/what must be contacted to verify it.

---

## 4. Acquisition process and eligibility — required

Every row should have:

- `Application_or_Auction_Process`
- `Eligibility_Requirements`
- `Build_or_Use_Requirements`
- `Eligible_Buyer_Type`
- `Developer_Experience_Required`
- `Nonprofit_Only`
- `Individual_Buyer_Allowed`
- `Owner_Occupant_Required`
- `Builder_Required_Before_Closing`
- `Proof_of_Funds_Required`
- `Financing_Preapproval_Required`
- `Application_Deadline`
- `Auction_Date`
- `Timeline_Requirements`

### Quality bar

- A buyer should know if they are eligible without opening another site.
- Use `Rolling` or `N/A` instead of blanks.
- Auction rows must include date/timing, deposit, bidding process, redemption risk, and title caveats.
- Land-bank rows must include application path, board approval requirements, and development timeline.

---

## 5. Physical and site readiness — required

Every row should have:

- `Zoning`
- `Future_Land_Use`
- `Road_Access`
- `Utilities_Status`
- `Flood_Risk_Status`
- `Environmental_or_Demolition_Risk`
- `Minimum_Home_Size_or_Construction_Standards`
- `Estimated_Development_Readiness`

### Quality bar

- Avoid vague `likely` language unless paired with a clear verification note.
- Flood risk should be checked against FEMA or local GIS when possible.
- Utilities should distinguish between available, nearby, stubbed, unknown, and extension required.
- Development readiness should summarize the practical buyer implication.

---

## 6. Title, lien, redemption, and restrictions — required

Every row should have:

- `Known_Liens_or_Back_Taxes`
- `Title_Status`
- `Redemption_Risk`
- `Affordable_Housing_Requirement`
- `Resale_or_Deed_Restrictions`
- `Public_Ownership_Status`
- `Land_Bank_Status`
- `Tax_Sale_Status`
- `Sheriff_Sale_Status`
- `Surplus_Property_Status`
- `Repository_Status`

### Quality bar

- Tax sale/repository/sheriff sale rows must clearly flag redemption/title risk.
- Land-bank rows should state whether liens/taxes are extinguished.
- Deed restrictions should be summarized plainly.
- If risk is unknown, state the exact verification step.

---

## 7. Location context and marketability — strongly recommended

Good enriched rows should have:

- `Region_Tier`
- `Metro_Area`
- `Distance_From_Atlanta_Miles`
- `Nearest_Major_City`
- `Neighborhood_or_District`
- `Census_Tract`
- `Opportunity_Zone_Status`
- `Nearest_Transit`
- `Nearest_School`
- `Nearest_Park`
- `Nearest_Grocery_or_Commercial_Corridor`
- `Walkability_Notes`
- `Transit_Access_Notes`
- `Job_Center_Access_Notes`
- `Redevelopment_Priority_Area`
- `Blight_or_Code_Enforcement_Status`

### Quality bar

- Strong rows should have at least 75% of these fields populated.
- Opportunity Zone, redevelopment priority, transit proximity, and nearby amenities matter for buyer targeting and marketing copy.

---

## 8. Scores and explainability — required

Every row should have:

- `Fit_Score_0_to_100`
- `Risk_Score_0_to_100`
- `Data_Confidence_0_to_100`
- `Score_Explanation`
- `Risk_Score_Explanation`
- `Fit_Score_Explanation`

### Quality bar

- Scores should be numeric 0–100.
- Production rows should usually have:
  - data confidence >= 70 minimum,
  - data confidence >= 85 preferred,
  - fit score >= 60 unless intentionally included as a caution/avoid row,
  - risk explanation whenever risk score > 50.

---

## 9. Buyer/use-case enrichment — strongly recommended

Good rows should have:

- `Buyer_Profile`
- `Best_Use_Case`
- `Deal_Type`
- `Investor_Angle`
- `Affordable_Housing_Angle`
- `Small_Builder_Angle`
- `First_Time_Buyer_Angle`
- `Content_Marketing_Angle`
- `Alert_Worthy`
- `Avoid_Flag`
- `Avoid_Reason`

### Quality bar

- Every row should answer: “Who is this deal good for?”
- If `Avoid_Flag = Yes`, `Avoid_Reason` must be specific and actionable.
- `Content_Marketing_Angle` should be human-readable and usable in newsletters/reports.

---

## 10. Pros, cons, notes, and next action — required

Every row should have:

- `Pros`
- `Cons`
- `Missing_Info_To_Verify`
- `Recommended_Next_Action`
- `Notes`
- `Researcher_Notes`

### Quality bar

- Pros and cons should be semicolon-separated short bullets so they render cleanly in the UI.
- `Recommended_Next_Action` should be specific, not generic.
- `Missing_Info_To_Verify` should list exact unknowns.

---

## 11. Contact and outreach — strongly recommended

Good rows should have:

- `Contact_Agency_Name`
- `Contact_Email`
- `Contact_Phone`
- `Contact_Form_URL`
- `Next_Call_Script`

### Quality bar

- At least one direct contact method should be present.
- `Next_Call_Script` should mention the listing ID, address/parcel, and the exact question to ask.

---

## 12. Audit/change tracking — required for maintained datasets

Every row should have:

- `First_Seen_Date`
- `Last_Checked_Date`
- `Last_Seen_Active_Date`
- `Listing_Status`
- `Previous_Status`
- `Status_Changed`
- `Previous_Price`
- `Price_Changed`
- `Previous_Source_URL`
- `Source_Last_Modified_Date`
- `Source_Snapshot_File`
- `Change_Log`
- `Change_Type`
- `Change_Severity`
- `Verification_Level`
- `Human_Reviewed`
- `Human_Reviewer_Notes`

### Quality bar

- `Last_Checked_Date` should be current for active listings.
- `Listing_Status` should use consistent vocabulary.
- Production-grade rows should have `Human_Reviewed = Yes` before being promoted to paid dashboard inventory.

---

## Practical minimum standard before a row enters the dashboard

A row is dashboard-ready if it has:

- real address or property/program name,
- city/county/state/zip,
- parcel ID or explicit reason parcel is unavailable,
- latitude/longitude,
- lot size,
- property type,
- acquisition type,
- price or minimum bid,
- source URL,
- property page URL or official program page,
- GIS or assessor URL,
- map URL,
- zoning or explicit `Needs verification`,
- road access,
- utilities status,
- flood risk,
- title status,
- redemption risk,
- pros,
- cons,
- recommended next action,
- fit score,
- risk score,
- data confidence score,
- listing status,
- last checked date,
- contact agency or next verification action.

## Suggested promotion thresholds

### Free sample eligible

- 80% required field completion,
- clear source URL,
- clear buyer next step,
- no severe unresolved title/redemption unknowns unless used as an educational warning.

### Paid dashboard eligible

- 90% required field completion,
- 70% enriched optional field completion,
- data confidence >= 70 minimum,
- at least 4/6 source verification checks backed,
- human reviewed or explicitly marked as automated/preliminary.

### Team “gold card” standard

- parcel-specific row,
- real parcel ID,
- verified GIS/assessor link,
- direct or archived source snapshot,
- clear acquisition path,
- total acquisition cost range,
- fit/risk/data confidence explanations,
- next-call script,
- contact method,
- recent `Last_Checked_Date`,
- no unexplained blanks in buyer-critical fields.

## Recommended workflow for new data collection

1. Capture official source page and agency.
2. Capture parcel ID, address, county, city, zip, lat/lon.
3. Cross-check GIS/assessor link.
4. Record acquisition type and process.
5. Record price/min bid and all expected soft costs.
6. Record eligibility/build/use restrictions.
7. Record title/redemption/lien risk.
8. Add location and market context.
9. Add pros/cons and buyer profile.
10. Score fit, risk, and data confidence with explanations.
11. Fill contact/next-call fields.
12. Set audit fields and snapshot/source status.
13. Human-review before paid publication.

## Data cleanup priorities from current dataset inspection

1. Backfill blank `Acquisition_Type` rows.
2. Separate parcel-specific leads from source/program-level leads.
3. Require real parcel ID or explicit unavailable reason.
4. Normalize score fields and explain default/zero values.
5. Add source snapshots for gold-standard rows.
6. Build a script/report that flags rows failing the dashboard-ready checklist.
