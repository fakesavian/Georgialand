# Dashboard Functional 3D, Hover Zoom, and Source Status Fix

## Summary
Fixed the latest dashboard QA issues: removed the fake 3D building/massing overlay, made 3D mode a functional tilted live map with pitch control, stopped hover from changing the selected boundary/zoom target, and fixed Source Status expansion so the Hide control remains reachable.

## Changes Made
- Removed the fake 3D building/massing overlay from `MapView.tsx`.
- Reworked 3D mode to keep the real live Leaflet map, real property pins, and real red parcel boundaries visible.
- Added a visible `Functional 3D Map Pitch` range control so the user can adjust the map tilt.
- Changed 3D styling in `src/index.css` from washed-out gray/cartoon mode to a real satellite-map pitch transform.
- Separated hover preview from selected boundary target:
  - hover can update the lightweight preview state
  - only click changes the selected boundary/zoom target
  - selected parcel boundary fetch/autofocus is now tied to clicked property or default initial target, not hover
- Fixed Source Status panel z-index, placement, max height, overflow, and sticky header so `Hide` remains visible when expanded.

## Verification
- Browser visual check confirmed:
  - fake 3D building is gone
  - 3D mode shows the real map, real pins, and red parcel boundaries
  - pitch slider is visible
  - Source Status expands above other panels and `Hide` remains reachable
- `npm run typecheck` passed.
- `npm run build` passed.

## Notes
This is still Leaflet/CSS-pitch 3D, not Google Maps native vector 3D buildings. It is now functional for inspecting parcels because it preserves the live map, pins, and parcel boundaries instead of covering the map with a fake building mockup.
