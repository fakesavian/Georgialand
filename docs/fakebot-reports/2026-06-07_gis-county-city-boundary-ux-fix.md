# GIS County/City Boundary UX Fix

Date: 2026-06-07
Project: Georgia Land Finder / freelandfinder

## Summary

Fixed the county/city GIS overlays that were previously rendered as bounding boxes around listing coordinates. County and city toggles now render real Census TIGERweb GeoJSON boundaries across every base map layer. Source Status is collapsed by default and can be shown/hidden.

## Implemented

- Removed fake county/city grouped bounding boxes from `MapView`.
- Added `src/lib/censusBoundaryConnector.ts`.
- Added official Census TIGERweb boundary queries for:
  - Georgia county boundaries: `TIGERweb/State_County/MapServer/1`
  - Georgia incorporated places: `TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/4`
  - Georgia consolidated governments: `TIGERweb/Places_CouSub_ConCity_SubMCD/MapServer/3`
- Added city alias handling for:
  - Athens -> Athens-Clarke County
  - Augusta -> Augusta-Richmond County
  - Macon -> Macon-Bibb County
- Rendered boundaries with Leaflet GeoJSON overlays so they are togglable on Dark, Light, Satellite, and Topographic layers.
- Changed Source Status panel to minimized by default with Show/Hide control.
- Updated layer attribution copy to identify Census TIGERweb as the source.

## Verification

Commands passed:

```bash
npm run typecheck
npm run build
```

Source scan:

```text
No getGroupedBounds/countyBounds/cityBounds fake boundary code remains in MapView.tsx.
```

Census endpoint count verification:

```json
{
  "currentCountyNames": 19,
  "countyFeatures": 19,
  "currentCityAliasNames": 27,
  "placeFeatures": 22,
  "consolidatedFeatures": 2
}
```

Live preview smoke test:

```text
http://127.0.0.1:5205/dashboard
```

Results:

```json
{
  "svgRectCount": 0,
  "svgPathCount": 20,
  "pathsWithDash": 19,
  "sourceDetailsHiddenInitially": true,
  "sourceDetailsVisibleAfterClick": true
}
```

## Notes

The Esri satellite basemap still includes its own non-togglable reference label/line tile layer when Satellite is selected. The new Census overlays are separate, app-controlled overlays and work across all base maps.
