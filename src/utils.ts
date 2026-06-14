import { LandProperty, Filters } from './types';

export function getFitScoreClass(score: number): string {
  if (score >= 70) return 'fit-score-high';
  if (score >= 40) return 'fit-score-med';
  return 'fit-score-low';
}

export function getRiskScoreClass(score: number): string {
  if (score <= 30) return 'risk-score-low';
  if (score <= 60) return 'risk-score-med';
  return 'risk-score-high';
}

export function parseScore(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

export function parsePrice(val: string): number | null {
  if (!val || val.trim() === '' || val.toLowerCase().includes('needs verification')) return null;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

export function isValidUrl(url: string): boolean {
  if (!url || url.trim() === '') return false;
  if (url.toLowerCase().includes('needs verification')) return false;
  if (url.toLowerCase().includes('n/a')) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function displayValue(val: string, fallback = 'Needs verification'): string {
  if (!val || val.trim() === '') return fallback;
  return val;
}

export function filterProperties(properties: LandProperty[], filters: Filters): LandProperty[] {
  return properties.filter(prop => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const searchFields = [
        prop.Property_Name_or_Address,
        prop.City,
        prop.County,
        prop.Parcel_ID,
        prop.Notes,
        prop.Zoning,
        prop.Property_Type,
        prop.Region_Tier,
        prop.Metro_Area,
        prop.Deal_Type,
        prop.Buyer_Profile,
      ];
      if (!searchFields.some(f => (f || '').toString().toLowerCase().includes(q))) return false;
    }

    // Dropdown Filters
    if (filters.city && prop.City !== filters.city) return false;
    if (filters.county && prop.County !== filters.county) return false;
    if (filters.acquisitionType && prop.Acquisition_Type !== filters.acquisitionType) return false;
    if (filters.priceCategory && prop.Price_Category !== filters.priceCategory) return false;
    if (filters.zoning && prop.Zoning !== filters.zoning) return false;
    if (filters.propertyType && prop.Property_Type !== filters.propertyType) return false;
    if (filters.regionTier && prop.Region_Tier !== filters.regionTier) return false;
    if (filters.metroArea && prop.Metro_Area !== filters.metroArea) return false;
    if (filters.dealType && prop.Deal_Type !== filters.dealType) return false;
    if (filters.buyerProfile && prop.Buyer_Profile !== filters.buyerProfile) return false;
    if (filters.sourceFreshness && prop.Source_Freshness !== filters.sourceFreshness) return false;
    if (filters.readiness && prop.Estimated_Development_Readiness !== filters.readiness) return false;
    if (filters.eligibleBuyerType && prop.Eligible_Buyer_Type !== filters.eligibleBuyerType) return false;

    // String Matching Toggles/Selects (Case-insensitive)
    if (filters.individualBuyerAllowed && (prop.Individual_Buyer_Allowed || '').toLowerCase() !== filters.individualBuyerAllowed.toLowerCase()) return false;
    if (filters.nonprofitOnly && (prop.Nonprofit_Only || '').toLowerCase() !== filters.nonprofitOnly.toLowerCase()) return false;
    if (filters.builderRequired && (prop.Builder_Required_Before_Closing || '').toLowerCase() !== filters.builderRequired.toLowerCase()) return false;
    if (filters.alertWorthy && (prop.Alert_Worthy || '').toLowerCase() !== filters.alertWorthy.toLowerCase()) return false;
    if (filters.avoidFlag && (prop.Avoid_Flag || '').toLowerCase() !== filters.avoidFlag.toLowerCase()) return false;

    // Score Range Filters
    const fit = parseScore(prop.Fit_Score_0_to_100);
    if (fit < filters.fitScoreMin || fit > filters.fitScoreMax) return false;

    const risk = parseScore(prop.Risk_Score_0_to_100);
    if (risk < filters.riskScoreMin || risk > filters.riskScoreMax) return false;

    const confidence = parseScore(prop.Data_Confidence_0_to_100 || '0');
    if (confidence < filters.dataConfidenceMin || confidence > filters.dataConfidenceMax) return false;

    const monetization = parseScore(prop.Monetization_Value_0_to_100 || '0');
    if (monetization < filters.monetizationValueMin || monetization > filters.monetizationValueMax) return false;

    // Legacy/Quick Filters
    if (filters.affordableHousingReq && prop.Affordable_Housing_Requirement !== filters.affordableHousingReq) return false;
    if (filters.redemptionRisk && prop.Redemption_Risk !== filters.redemptionRisk) return false;
    if (filters.floodRiskStatus && prop.Flood_Risk_Status !== filters.floodRiskStatus) return false;
    if (filters.titleStatus && prop.Title_Status !== filters.titleStatus) return false;

    if (filters.under50k) {
      const price = parsePrice(prop.Estimated_Price_or_Min_Bid);
      if (price === null || price >= 50000) return false;
    }

    if (filters.atlantaOnly) {
      if ((prop.City || '').toLowerCase() !== 'atlanta') return false;
    }

    if (filters.metroAtlantaOnly) {
      const isYes = (prop.Metro_Atlanta || '').toLowerCase() === 'yes' || (prop.Region_Tier || '').toLowerCase() === 'metro atlanta' || (prop.Region_Tier || '').toLowerCase() === 'atlanta core';
      if (!isYes) return false;
    }

    if (filters.lowRiskOnly) {
      const risk2 = parseScore(prop.Risk_Score_0_to_100);
      if (risk2 > 30) return false;
    }

    if (filters.needsVerification) {
      const hasIssue = getPropertyWarnings(prop).length > 0;
      if (!hasIssue) return false;
    }

    // Mobile/search-sheet numeric filters
    const propertyPrice = parsePrice(prop.Estimated_Price_or_Min_Bid);
    if (filters.priceMin > 0 && (propertyPrice === null || propertyPrice < filters.priceMin)) return false;
    if (filters.priceMax > 0 && (propertyPrice === null || propertyPrice > filters.priceMax)) return false;

    const acreageRaw = String(prop.Lot_Size_Acres || '').replace(/[^0-9.]/g, '');
    const acreage = acreageRaw ? Number.parseFloat(acreageRaw) : null;
    if (filters.acreageMin > 0 && (acreage === null || !Number.isFinite(acreage) || acreage < filters.acreageMin)) return false;
    if (filters.acreageMax > 0 && (acreage === null || !Number.isFinite(acreage) || acreage > filters.acreageMax)) return false;

    const pricePerAcre = propertyPrice !== null && acreage && acreage > 0 ? propertyPrice / acreage : null;
    if (filters.pricePerAcreMin > 0 && (pricePerAcre === null || pricePerAcre < filters.pricePerAcreMin)) return false;
    if (filters.pricePerAcreMax > 0 && (pricePerAcre === null || pricePerAcre > filters.pricePerAcreMax)) return false;

    if (filters.sourceType) {
      const sourceNeedle = filters.sourceType.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sourceFields = [prop.Data_Source_Type, prop.Acquisition_Type, prop.Source_Name, prop.Source_Agency, prop.Region_Tier, prop.Deal_Type];
      const sourceMatch = sourceFields.some((value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '').includes(sourceNeedle));
      if (!sourceMatch) return false;
    }

    if (filters.listingStatus && String(prop.Listing_Status || '').toLowerCase() !== filters.listingStatus.toLowerCase()) return false;

    if (filters.valueScoreMin > 0) {
      const valueScore = Math.max(
        parseScore(prop.Value_Score_0_to_100 || '0'),
        parseScore(prop.Monetization_Value_0_to_100 || '0'),
        parseScore(prop.Fit_Score_0_to_100 || '0')
      );
      if (valueScore < filters.valueScoreMin) return false;
    }

    if (filters.gisAvailableOnly) {
      const hasCoordinates = Boolean(prop.Latitude && prop.Longitude && !Number.isNaN(Number(prop.Latitude)) && !Number.isNaN(Number(prop.Longitude)));
      const hasParcelKey = Boolean(prop.Parcel_ID && !String(prop.Parcel_ID).toLowerCase().includes('needs verification'));
      if (!isValidUrl(prop.GIS_URL) && !(hasCoordinates && hasParcelKey)) return false;
    }

    return true;
  });
}

export function sortProperties(
  properties: LandProperty[],
  key: keyof LandProperty,
  direction: 'asc' | 'desc'
): LandProperty[] {
  return [...properties].sort((a, b) => {
    const valA = a[key] || '';
    const valB = b[key] || '';

    // Try numeric sort for score/rank/price fields
    const numA = parseFloat(valA.toString());
    const numB = parseFloat(valB.toString());
    if (!isNaN(numA) && !isNaN(numB)) {
      return direction === 'asc' ? numA - numB : numB - numA;
    }

    return direction === 'asc'
      ? valA.toString().localeCompare(valB.toString())
      : valB.toString().localeCompare(valA.toString());
  });
}

export function exportToCSV(properties: LandProperty[], filename = 'export.csv') {
  if (!properties.length) return;
  const headers = Object.keys(properties[0]);
  const rows = properties.map(p =>
    headers.map(h => {
      const val = (p[h] || '').toString().replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function getUniqueValues(properties: LandProperty[], key: keyof LandProperty): string[] {
  const vals = properties.map(p => p[key] || '').filter(Boolean).map(v => v.toString());
  return Array.from(new Set(vals)).sort();
}

export function getPropertyWarnings(prop: LandProperty): string[] {
  const warnings: string[] = [];
  if (!prop.Parcel_ID || prop.Parcel_ID.toLowerCase().includes('needs verification')) {
    warnings.push('Parcel ID missing');
  }
  const price = prop.Estimated_Price_or_Min_Bid;
  if (!price || price.toLowerCase().includes('needs verification') || price.trim() === '') {
    warnings.push('Price missing');
  }
  if (!prop.Source_URL || !isValidUrl(prop.Source_URL)) {
    warnings.push('Source URL missing');
  }
  if (!prop.Zoning || prop.Zoning.toLowerCase().includes('needs verification')) {
    warnings.push('Zoning missing');
  }
  if (!prop.Flood_Risk_Status || prop.Flood_Risk_Status.toLowerCase().includes('needs verification')) {
    warnings.push('Flood status missing');
  }
  if (!prop.Title_Status || prop.Title_Status.toLowerCase().includes('needs verification')) {
    warnings.push('Title status missing');
  }
  if (!prop.Application_or_Auction_Process && !prop.Application_Deadline) {
    warnings.push('Acquisition process missing');
  }
  if (!prop.Contact_Agency_Name && !prop.Source_Agency) {
    warnings.push('Contact agency missing');
  }
  return warnings;
}

export function getMissingDataProperties(properties: LandProperty[]): LandProperty[] {
  return properties.filter(p => getPropertyWarnings(p).length > 0);
}

export function exportToMarkdown(properties: LandProperty[]) {
  if (!properties.length) return;
  const content = properties.map(p => {
    const pros = getProList(p.Pros).map(pr => `- ${pr}`).join('\n');
    const cons = getConsList(p.Cons).map(co => `- ${co}`).join('\n');
    
    return `# Lead Card: ${p.Property_Name_or_Address || 'Unnamed Property'}
- **Location**: ${p.City || 'Unknown City'}, ${p.County || 'Unknown County'}, GA
- **Price**: ${p.Estimated_Price_or_Min_Bid || 'Needs verification'}
- **Lot Size**: ${p.Lot_Size_Acres || 'Unknown'} acres
- **Deal Type**: ${p.Deal_Type || p.Acquisition_Type || 'Unknown'}
- **Acquisition Path**: ${p.Application_or_Auction_Process || p.Recommended_Next_Action || 'Needs verification'}
- **Scores**: Fit: ${p.Fit_Score_0_to_100}/100 | Risk: ${p.Risk_Score_0_to_100}/100 | Data Confidence: ${p.Data_Confidence_0_to_100 || 'N/A'}/100

### Why It Matters
${p.Content_Marketing_Angle || p.Notes || 'N/A'}

### Pros
${pros || 'None listed'}

### Cons
${cons || 'None listed'}

### Missing Info
${p.Missing_Info_To_Verify || 'None listed'}

### Next Action
${p.Recommended_Next_Action || 'Needs verification'}

### Links
- **Source**: ${isValidUrl(p.Source_URL) ? p.Source_URL : 'Not available'}
- **Property Page**: ${isValidUrl(p.Property_Page_URL) ? p.Property_Page_URL : 'Not available'}
- **Map**: ${isValidUrl(p.Map_URL) ? p.Map_URL : 'Not available'}
- **GIS**: ${isValidUrl(p.GIS_URL) ? p.GIS_URL : 'Not available'}
`;
  }).join('\n\n---\n\n');

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lead-cards-${new Date().toISOString().split('T')[0]}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToHTML(properties: LandProperty[]) {
  if (!properties.length) return;
  const cardsHtml = properties.map(p => {
    const pros = getProList(p.Pros).map(pr => `<li>${pr}</li>`).join('');
    const cons = getConsList(p.Cons).map(co => `<li>${co}</li>`).join('');
    
    return `
    <div class="card">
      <div class="card-header">
        <h2>${p.Property_Name_or_Address || 'Unnamed Property'}</h2>
        <div class="subtitle">${p.City || 'Unknown City'}, ${p.County || 'Unknown County'}, GA</div>
      </div>
      <div class="badges">
        <span class="badge badge-fit">Fit: ${p.Fit_Score_0_to_100}</span>
        <span class="badge badge-risk">Risk: ${p.Risk_Score_0_to_100}</span>
        <span class="badge badge-conf">Confidence: ${p.Data_Confidence_0_to_100 || 'N/A'}</span>
      </div>
      <div class="details">
        <p><strong>Price:</strong> <span class="price">${p.Estimated_Price_or_Min_Bid || 'Needs verification'}</span></p>
        <p><strong>Lot Size:</strong> ${p.Lot_Size_Acres || 'Unknown'} acres</p>
        <p><strong>Deal Type:</strong> ${p.Deal_Type || p.Acquisition_Type || 'Unknown'}</p>
        <p><strong>Acquisition Path:</strong> ${p.Application_or_Auction_Process || 'Needs verification'}</p>
      </div>
      <div class="section">
        <h3>Why It Matters</h3>
        <p>${p.Content_Marketing_Angle || p.Notes || 'N/A'}</p>
      </div>
      <div class="grid-2">
        <div class="section">
          <h3>Pros</h3>
          <ul>${pros || '<li>None listed</li>'}</ul>
        </div>
        <div class="section">
          <h3>Cons</h3>
          <ul>${cons || '<li>None listed</li>'}</ul>
        </div>
      </div>
      <div class="section">
        <h3>Missing Info</h3>
        <p>${p.Missing_Info_To_Verify || 'None listed'}</p>
      </div>
      <div class="section">
        <h3>Next Action</h3>
        <p><strong>${p.Recommended_Next_Action || 'Needs verification'}</strong></p>
      </div>
      <div class="links">
        <a href="${p.Source_URL}" target="_blank">Source</a>
        <a href="${p.Property_Page_URL}" target="_blank">Property Page</a>
        <a href="${p.Map_URL}" target="_blank">Google Maps</a>
        <a href="${p.GIS_URL}" target="_blank">GIS Portal</a>
      </div>
    </div>
    `;
  }).join('');

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Georgia Land Finder Lead Cards</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f0f2f5;
      color: #1c1e21;
      padding: 40px 20px;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      padding: 24px;
      margin-bottom: 30px;
      border-left: 6px solid #16a34a;
      page-break-inside: avoid;
    }
    .card-header h2 {
      margin: 0;
      font-size: 20px;
      color: #111827;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-top: 4px;
    }
    .badges {
      margin: 16px 0;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
    }
    .badge-fit { background: #dcfce7; color: #166534; }
    .badge-risk { background: #fef9c3; color: #854d0e; }
    .badge-conf { background: #dbeafe; color: #1e40af; }
    .details {
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .details p {
      margin: 6px 0;
      font-size: 14px;
    }
    .price {
      color: #16a34a;
      font-weight: bold;
    }
    h3 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4b5563;
      margin-bottom: 8px;
      margin-top: 0;
    }
    .section {
      margin-bottom: 16px;
    }
    .section p, .section ul {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
    }
    .section ul {
      padding-left: 20px;
    }
    .grid-2 {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 16px;
    }
    .links {
      border-t: 1px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 16px;
      display: flex;
      gap: 12px;
    }
    .links a {
      font-size: 13px;
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }
    .links a:hover {
      text-decoration: underline;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .card { box-shadow: none; border: 1px solid #e5e7eb; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 style="text-align:center; margin-bottom:40px; color:#111827;">Georgia Land Opportunity Lead Cards</h1>
    ${cardsHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lead-cards-${new Date().toISOString().split('T')[0]}.html`;
  link.click();
  URL.revokeObjectURL(url);
}



export function getProList(val: string): string[] {
  if (!val) return [];
  return val.split(';').map(s => s.trim()).filter(Boolean).slice(0, 3);
}

export function getConsList(val: string): string[] {
  if (!val) return [];
  return val.split(';').map(s => s.trim()).filter(Boolean).slice(0, 3);
}

export function getSatelliteImageUrl(lat: string | number, lon: string | number, zoom: number = 18): string | null {
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lon as string);
  if (isNaN(latitude) || isNaN(longitude)) return null;

  const delta = zoom >= 19 ? 0.0007 : zoom >= 18 ? 0.0012 : zoom >= 17 ? 0.002 : 0.004;
  const bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta].join(',');

  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=640,360&format=jpg&f=image`;
}

export function getStreetContextImageUrl(lat: string | number, lon: string | number, zoom: number = 18): string | null {
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lon as string);
  if (isNaN(latitude) || isNaN(longitude)) return null;

  const delta = zoom >= 18 ? 0.0011 : 0.0025;
  const bbox = [longitude - delta, latitude - delta, longitude + delta, latitude + delta].join(',');

  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/export?bbox=${bbox}&bboxSR=4326&imageSR=4326&size=640,360&format=jpg&f=image`;
}

export function getGoogleStreetViewEmbedUrl(lat: string | number, lon: string | number): string | null {
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lon as string);
  if (isNaN(latitude) || isNaN(longitude)) return null;

  return `https://www.google.com/maps?layer=c&cbll=${latitude},${longitude}&cbp=11,0,0,0,0&output=svembed`;
}

export function getGoogleMapsEmbedUrl(query: string, mode: 'satellite' | 'street' = 'satellite', zoom: number = 18): string | null {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) return null;

  const encodedQuery = encodeURIComponent(cleanQuery);
  const mapType = mode === 'satellite' ? '&t=k' : '';
  const streetLayer = mode === 'street' ? '&layer=c' : '';
  return `https://www.google.com/maps?q=${encodedQuery}${mapType}${streetLayer}&z=${zoom}&output=embed`;
}

