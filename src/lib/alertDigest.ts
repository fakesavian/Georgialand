import { escapeHtml } from './htmlEscape';

export interface AlertPreferences {
  counties: string[];
  acquisition_types: string[];
  max_price_category: string;
  min_fit_score: number;
}

export interface PropertyData {
  parcel_id: string;
  address: string;
  city: string;
  county: string;
  price: string;
  acquisition_type: string;
  fit_score: number;
  risk_score: number;
  url?: string;
}

// Convert max price string to a number
function parseMaxPrice(category: string): number {
  if (category.includes('10k')) return 10000;
  if (category.includes('25k')) return 25000;
  if (category.includes('50k')) return 50000;
  return Infinity; // 'Any'
}

// Extract numeric price
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  const num = parseInt(priceStr.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

export function generateDigest(
  preferences: AlertPreferences,
  allProperties: PropertyData[],
  siteUrl = 'https://georgialandfinder.com'
): string {
  const maxPriceNum = parseMaxPrice(preferences.max_price_category);
  const targetCounties = preferences.counties.map(c => c.toLowerCase());
  const targetAcquisitions = preferences.acquisition_types.map(a => a.toLowerCase());

  const dashboardUrl = `${siteUrl.replace(/\/$/, '')}/dashboard`;

  // Filter candidates
  const candidates = allProperties.filter(prop => {
    // 1. Fit Score
    if (prop.fit_score < preferences.min_fit_score) return false;
    
    // 2. Price
    const propPrice = parsePrice(prop.price);
    if (propPrice > maxPriceNum && maxPriceNum !== Infinity) return false;
    
    // 3. County
    if (targetCounties.length > 0) {
      if (!targetCounties.some(c => prop.county?.toLowerCase().includes(c))) return false;
    }
    
    // 4. Acquisition Type
    if (targetAcquisitions.length > 0) {
      if (!targetAcquisitions.some(a => prop.acquisition_type?.toLowerCase().includes(a))) return false;
    }

    return true;
  });

  // Limit to top 10 for the email to not overflow
  const topCandidates = candidates.slice(0, 10);

  // Generate HTML
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c120c; color: #f5f7f5; padding: 40px 20px; text-align: center;">
      <div style="max-w-width: 600px; margin: 0 auto; background-color: #151e15; border: 1px solid #233123; border-radius: 8px; padding: 40px;">
        <h1 style="color: #ecfc93; margin-top: 0;">Your Weekly Land Alerts</h1>
        <p style="color: #a4b6a4; line-height: 1.6; margin-bottom: 30px;">
          Based on your preferences, we found <strong>${candidates.length}</strong> new properties that match your criteria. 
          Here are the top ${topCandidates.length} highest-fit opportunities.
        </p>

        ${topCandidates.length === 0 ? `
          <div style="background-color: #1a251a; padding: 20px; border-radius: 6px; color: #a4b6a4;">
            No properties matched your exact criteria this week. Try broadening your county or price filters in the dashboard.
          </div>
        ` : `
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid #233123; color: #819881; font-size: 12px; text-transform: uppercase;">
                <th style="padding: 12px 8px;">Property</th>
                <th style="padding: 12px 8px;">Price</th>
                <th style="padding: 12px 8px;">Fit Score</th>
              </tr>
            </thead>
            <tbody>
              ${topCandidates.map(prop => `
                <tr style="border-bottom: 1px solid #1a251a;">
                  <td style="padding: 16px 8px;">
                    <div style="font-weight: 600; color: #ffffff;">${escapeHtml(prop.address || prop.parcel_id)}</div>
                    <div style="font-size: 12px; color: #819881; margin-top: 4px;">${escapeHtml(prop.county)} County • ${escapeHtml(prop.acquisition_type)}</div>
                  </td>
                  <td style="padding: 16px 8px; font-weight: bold; color: #ecfc93;">
                    ${escapeHtml(prop.price)}
                  </td>
                  <td style="padding: 16px 8px;">
                    <span style="background-color: ${prop.fit_score >= 80 ? '#2E4C2E' : '#333322'}; color: ${prop.fit_score >= 80 ? '#ecfc93' : '#eab308'}; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                      ${prop.fit_score}/100
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #233123;">
          <a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; background-color: #ecfc93; color: #0c120c; font-weight: bold; text-decoration: none; padding: 14px 24px; border-radius: 6px;">
            View All ${candidates.length} Matches in Dashboard
          </a>
        </div>
      </div>
    </div>
  `;
}
