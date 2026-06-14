# Dashboard Map Cleanup, 3D Mode, and Property-Line Correction

## Summary
Cleaned up the map-focused dashboard after Savian's visual QA: fixed clipped top sizing, reduced overlay clutter, kept map layers switchable, improved red property-line visibility, and changed 3D mode to render closer to the provided light/angled property-massing reference.

## Files Changed
- `src/components/dashboard/MapView.tsx`
- `src/pages/DashboardPage.tsx`
- `src/index.css`

## Changes
- Reworked immersive dashboard sizing so the header/menu area is no longer clipped.
- Reduced left-side clutter by replacing the property stack with a compact tools panel and selected-property summary.
- Added collapsible side panels so users can reclaim map space.
- Made the Map Layers panel user-switchable instead of always occupying space.
- Changed default GIS overlays to prioritize parcel boundaries instead of loading every available layer by default.
- Strengthened red parcel boundary styling with thicker stroke and visible glow/fill.
- Added nearest-boundary focus logic for marker interactions when verified parcel geometry is available.
- Moved the `Zoom to red property line` control into a visible, usable position.
- Reworked 3D mode into a light/tilted map view with a central 3D parcel/building massing overlay and collapsed side panels by default.

## Verification
- `npm run typecheck` passed.
- Browser verification confirmed:
  - top controls are no longer clipped
  - 2D dashboard is cleaner and more usable
  - map layers remain switchable
  - 3D mode shows a light, tilted parcel/massing visual closer to the reference
  - red parcel boundary layer is visible/readable after property-line focus

## Notes
The 3D mode remains an in-app conceptual parcel massing preview, not licensed Google 3D buildings.
