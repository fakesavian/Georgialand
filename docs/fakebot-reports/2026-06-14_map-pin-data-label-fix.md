# Map Pin Data Label Fix

## Summary
Fixed map pins that were showing `?` for many properties. The issue was not missing coordinates; the pin renderer only displayed fit score and fell back to `?` whenever `Fit_Score_0_to_100` was blank. The active paid/local dataset has 335 mapped properties but 300 rows with blank fit score, while most still have usable price/parcel data.

## Changes Made
- Updated `src/components/dashboard/MapView.tsx` pin rendering.
- Replaced the `Math.round(fit) || '?'` marker label behavior.
- Added a real fallback chain for map pin labels:
  1. fit score when available
  2. compact price label like `375K`
  3. priority rank when available
  4. parcel suffix/county fallback when needed
- Added color fallback logic:
  - score-based colors when fit score exists
  - price-tier colors when score is missing
  - neutral fallback only when no score/price is available
- Added `data-pin-label` to marker DOM for verification.

## Data Findings
- `public/local_dashboard_dataset.csv`: 358 rows.
- Mapped coordinate rows: 335.
- Rows with blank `Fit_Score_0_to_100`: 300.
- Rows with nonblank price: 354.
- So the map had enough data to label pins; it was using the wrong field as the only display source.

## Verification
- Browser DOM check found:
  - 335 rendered map pins
  - 0 pins with `?`
  - sample labels: `375K`, `345K`, `359K`, `341K`, `254K`, `224K`, `30K`
- Browser visual check confirmed visible pins no longer show `?`.
- `npm run typecheck` passed.
- `npm run build` passed.

## Files Changed
- `src/components/dashboard/MapView.tsx`
