# Dashboard Native Header and Real Parcel Boundary Correction

## Summary
Corrected the map-first dashboard after Savian's QA feedback. The previous pass removed/covered native dashboard navigation, added a fake map header, created overlapping map controls, and used a random global red-boundary button. This correction restores the native header/menu, removes the random red button, reduces overlap, restores useful selected-property data, and changes parcel boundaries to load for the selected property by exact county GIS parcel ID.

## Root Cause
- `DashboardPage.tsx` hid the native dashboard `Header` in immersive map mode and replaced it with a custom floating map header.
- `MapView.tsx` rendered `ParcelBoundaryFocusControl`, a global button that cycled through any loaded boundary instead of the selected property.
- The active boundary loader called `fetchParcelsForProperties`, which preferred broad county extent queries. That does not guarantee the selected property's parcel is included.
- Marker click then used nearest-boundary heuristics, which could focus a nearby or unrelated parcel.

## Changes Made
- Restored the native dashboard header and menu on the map dashboard.
- Removed the fake floating "Map Intelligence Dashboard" header.
- Removed the random `Zoom to red property line` button completely.
- Kept a compact map filter/search chip row below the native header.
- Reduced top clipping by sizing the map section below the native header.
- Kept left/right map panels separated and below the top chip row.
- Restored useful selected-property data in the map UI: address/parcel, city/county, price, acreage, fit/risk, details action, and boundary status.
- Replaced broad extent-based boundary loading with selected-property exact parcel lookup using `fetchParcelById(county, parcelId)`.
- Added selected-boundary auto-focus only after a real selected-property boundary loads.
- Added clear fallback messaging when a listing lacks a usable parcel ID instead of drawing fake boundaries.

## Boundary Behavior
- If the selected property has a valid county + parcel ID, the app queries the county ArcGIS source and renders the returned parcel polygon as the red property boundary.
- If the selected property has `Needs verification`, `Unknown`, or another placeholder parcel ID, the app does not draw a fake boundary and shows that the parcel ID must be verified.
- Verified by browser: selected DeKalb parcel `12 228 01 007` loaded a real red boundary polygon.

## Verification
- `npm run typecheck` passed.
- `npm run build` passed.
- Browser verification at `http://127.0.0.1:5173/dashboard` confirmed:
  - native header/menu visible
  - fake map header gone
  - random red boundary button gone
  - selected property red boundary visible
  - no browser JS errors

## Remaining Data Reality
Fulton/DeKalb can load real boundaries when valid parcel IDs exist. Some dataset rows still have placeholder IDs such as `Needs verification`; those need data enrichment/scraping/source verification before boundaries can be drawn honestly.
