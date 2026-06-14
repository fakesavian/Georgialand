# Dashboard Navigation Split: Map + Property Dashboard

## Summary
Changed the dashboard navigation so the previous `Dashboard` tab is now `Map`, then added a new `Dashboard` tab next to it for property browsing.

## Changes Made
- Updated top dashboard nav tabs:
  - `Map`
  - `Dashboard`
  - `Analytics`
  - `Data Quality`
  - `Favorites`
  - `Agency Contacts`
- Made `Map` the default active tab for `/dashboard`.
- Kept the map-focused workspace inside the `Map` tab.
- Moved table/card property browsing into the new `Dashboard` tab.
- Dashboard tab now opens to table view by default.
- Dashboard tab includes:
  - summary cards
  - source metadata
  - filter panel
  - category subtabs
  - Table/Cards toggle
  - selection/export actions
- Removed the Map view toggle from the new Dashboard tab so the map and dashboard are clearly separated.

## Verification
- `npm run typecheck` passed.
- `npm run build` passed.
- Browser verification confirmed:
  - top nav shows `Map` then `Dashboard`
  - Map tab renders the Leaflet map workspace
  - Dashboard tab renders filters plus Table/Cards views
  - Dashboard tab does not render the map canvas

## Files Changed
- `src/components/dashboard/Header.tsx`
- `src/pages/DashboardPage.tsx`
