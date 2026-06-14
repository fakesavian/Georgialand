# Data Source API Inventory

| Source Name | Type | Coverage | API/Endpoint/Portal | Fields Available | Auth Needed | Cost | Rate Limits | Update Frequency | Recommended Use | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| FEMA NFHL | Federal GIS | US | https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer | Flood zones, floodways, panels | No | Free | ArcGIS service limits | Ongoing | Flood overlay/risk | High | Official source |
| USDA NRCS Soil Data Access | Federal API | US | https://sdmdataaccess.nrcs.usda.gov/ | Soils, farmland class, hydric/drainage data | No | Free | Service dependent | Periodic | Soil/land suitability | High | Normalize after PoC |
| Census APIs/TIGER | Federal API/GIS | US | https://www.census.gov/data/developers.html | Boundaries, geocoder, ACS | Optional key | Free | API limits | Annual/decennial | Boundaries/demographics/geocoding | High | Good base context |
| USGS National Map | Federal GIS/API | US | https://apps.nationalmap.gov/services/ | Elevation, hydrography, topo | No | Free | Service dependent | Periodic | Terrain/water overlays | Medium | Due-diligence layer |
| EPA Envirofacts/EJScreen/WATERS | Federal APIs | US | https://www.epa.gov/enviro | Facilities, permits, EJ, water | No | Free | API limits | Varies | Environmental flags | Medium | Attribute carefully |
| Georgia Geospatial Information Office | State GIS | GA | https://geospatial.georgia.gov/ | State GIS links/datasets | No | Free | Portal dependent | Varies | State GIS discovery | Medium | Per-dataset verification |
| Georgia Open Data Portal | State data | GA | https://data.georgia.gov/ | State datasets | No | Free | Portal dependent | Varies | Supplemental datasets | Medium | Per-dataset verification |
| Fulton County GIS/Open Data | County GIS | Fulton | https://gisdata.fultoncountyga.gov/ | Parcels/layers where published | No public portal | Public; bulk terms vary | Portal dependent | County cadence | Parcel/GIS source | High | Exact parcel REST URL Needs verification |
| DeKalb County GIS | County GIS | DeKalb | https://www.dekalbcountyga.gov/gis | Parcels/layers where published | No public portal | Public; bulk terms vary | Portal dependent | County cadence | Parcel/GIS source | High | Needs verification |
| Cobb County GIS | County GIS | Cobb | https://www.cobbcounty.org/geographic-information-systems | Parcels/layers where published | No public portal | Public; bulk terms vary | Portal dependent | County cadence | Parcel/GIS source | High | Needs verification |
| Gwinnett County GIS | County GIS | Gwinnett | https://www.gwinnettcounty.com/ | Parcels/layers where published | No public portal | Public; bulk terms vary | Portal dependent | County cadence | Parcel/GIS source | High | Needs verification |
| SAGIS / Chatham County | County GIS | Chatham | https://www.sagis.org/ | Parcels/local layers | No public portal | Public; terms vary | Portal dependent | County cadence | Coastal parcel/GIS | High | Verify downloads/API |
| Schneider qPublic | Assessor portal | Many GA counties | https://qpublic.schneidercorp.com/ | Tax cards, owner, values, sales | Usually no login | Free manual; automation terms vary | Unknown | County cadence | Tax-card source links/manual reference | Medium | Scraping requires terms review |
| Regrid | Commercial parcel API | US | https://regrid.com/ | Parcel geometry/attributes/owner | Yes | Commercial | Plan dependent | Vendor cadence | Parcel fallback | High | Do not enable without license |
| ATTOM | Commercial property API | US | https://www.attomdata.com/data-api/ | Property/tax/deed/sales/valuation/owner | Yes | Commercial | Plan dependent | Vendor cadence | Tax/owner/sales enrichment | High | Do not enable without license |
| Estated | Commercial property API | US | https://estated.com/ | Property/tax/valuation/owner | Yes | Commercial | Plan dependent | Vendor cadence | Tax/owner fallback | Medium | Verify GA coverage/pricing |
| RESO Web API | MLS standard | MLS specific | https://www.reso.org/web-api/ | Listings/solds/comps where licensed | Yes | Agreement required | MLS-specific | MLS cadence | Future listing connector | Medium | Requires legal/business setup |
| Georgia MLS / FMLS | MLS/listing | GA/Atlanta | https://www.georgiamls.com/ / https://www.firstmls.com/ | Listings/status/sold depending agreement | Yes | Agreement required | Contract | Near-real-time/daily | Listings/comps | Medium | Not open data |
| GovDeals | Auction/surplus | Public agencies | https://www.govdeals.com/ | Surplus auctions/listings | No browsing | Platform terms | Unknown | Listing cadence | Surplus leads | Medium | API unclear - Needs verification |

## Priority counties for endpoint verification
Fulton, DeKalb, Cobb, Gwinnett, Clayton, Douglas, Henry, Rockdale, Fayette, Cherokee, Forsyth, Richmond/Augusta, Chatham/Savannah, Bibb/Macon, Muscogee/Columbus, Clarke/Athens, Dougherty/Albany, Lowndes/Valdosta, Floyd/Rome, Bartow/Cartersville, Houston/Warner Robins, Glynn/Brunswick, Laurens/Dublin, Sumter/Americus, Thomas/Thomasville, Ware/Waycross.

Sources without a verified ArcGIS REST/API endpoint should remain `enabled: false` in `data/source_registry.json`.
