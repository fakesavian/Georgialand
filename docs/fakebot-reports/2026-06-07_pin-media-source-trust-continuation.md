# Pin Hover, Media Enlargement, and Source Trust Continuation

Date: 2026-06-07
Project: Georgia Land Finder / freelandfinder

## Summary

Continued the last few UI/data trust tasks:

1. Fixed map pin hover so only the directly hovered pin enters the glow state.
2. Added enlarged property media viewer over the blurred main/backdrop area.
3. Made Street View passive in thumbnails and interactive only in the enlarged viewer.
4. Added per-property Source Verification UI so paid users can see which fields are backed by multiple source lanes and where black spots remain.

## Implementation Notes

### Pin hover

- Removed document-level `[data-property-pin]` hover tracking that could affect neighboring/overlapping pins.
- Added stable per-property pin IDs.
- Marker hover is now handled by Leaflet marker events plus marker-element `mouseenter`/`mouseleave` fallback.
- Added `data-pin-hovered` marker state for verifiable one-glow behavior.

### Media enlargement

- Drawer thumbnails are now buttons.
- Thumbnail iframes are `pointer-events: none`, so Street View is not functional inside the thumbnail strip.
- Clicking any media tile opens `data-property-media-viewer="true"` over the blurred main content/backdrop area left of the drawer.
- Street View iframe is interactive only inside the enlarged viewer.

### Source trust

- Added `Source Verification` panel per property.
- Checks multiple source/evidence lanes:
  - Official/source listing URL
  - Property page URL
  - GIS/assessor URL
  - Map/geocode or coordinates
  - Parcel ID
  - Data confidence score
- Shows backed count and black spots to verify.

## Current Dataset Coverage Summary

Total properties: 53

| Evidence Lane | Backed | Black Spots |
|---|---:|---:|
| Official/source URL | 44 | 9 |
| Property page URL | 53 | 0 |
| GIS URL | 37 | 16 |
| Map or coordinates | 41 | 12 |
| Parcel ID | 53 | 0 |
| Data confidence >= 70 | 48 | 5 |

## Verification

Build:

```bash
npm run typecheck
npm run build
```

Result: passed.

Pin hover browser check:

```json
{
  "hoveredTarget": "7-GA-001",
  "glowingCount": 1,
  "glowingIds": ["7-GA-001"],
  "previewVisible": true
}
```

Media/source browser check:

```json
{
  "before": {
    "hasSourceVerification": true,
    "thumbCount": 3,
    "thumbFramesPassive": true
  },
  "after": {
    "viewerOpen": true,
    "hasStreetFrame": true,
    "frameInteractive": true
  }
}
```

## Remaining Source-Trust Work

This update exposes trust gaps but does not magically fill them. Next data work should actually ingest/verify missing lanes:

1. Add geocoding for the 12 properties missing map/coordinate verification.
2. Fill/verify the 16 missing GIS/assessor URL lanes.
3. Re-check the 9 missing official source URL lanes.
4. Add source snapshots/check timestamps for every critical URL.
5. Connect paid/vendor sources only after licensing/API access is approved.
