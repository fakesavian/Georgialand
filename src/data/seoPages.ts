export interface SeoPageData {
  title: string;
  description: string;
  h1: string;
  intent: string;
  content: string[];
}

export const seoPages: Record<string, SeoPageData> = {
  'georgia-low-cost-land': {
    title: 'Find Low-Cost Land in Georgia | Georgia Land Finder',
    description: 'Discover curated low-cost land opportunities across Georgia. Perfect for investors, builders, and individuals looking for affordable acreage.',
    h1: 'Georgia Low-Cost Land',
    intent: 'Main topical page for broad low-cost Georgia land search.',
    content: [
      'Finding affordable land in Georgia requires digging through multiple county databases, tax sale lists, and surplus property portals. We streamline this process.',
      'Our curated lists include properties under $50k, tax deed sales, and land bank opportunities across the state.'
    ]
  },
  'georgia-land-bank-properties': {
    title: 'Georgia Land Bank Properties | How to Buy & Current Listings',
    description: 'Learn how to buy land bank properties in Georgia. Access curated lists of available lots for development and affordable housing.',
    h1: 'Georgia Land Bank Properties',
    intent: 'Capture land-bank-specific searches.',
    content: [
      'Land banks in Georgia acquire tax-delinquent or abandoned properties to return them to productive use. They offer excellent opportunities for builders and investors who commit to community development.',
      'Requirements vary by county, but typically prioritize affordable housing or owner-occupant development.'
    ]
  },
  'atlanta-low-cost-land': {
    title: 'Low-Cost Land in Metro Atlanta | Investment & Development Lots',
    description: 'Find affordable land for sale in the Atlanta metro area. Curated leads for infill development and affordable housing projects.',
    h1: 'Atlanta Low-Cost Land',
    intent: 'Atlanta-specific search and local credibility.',
    content: [
      'As Atlanta expands, finding affordable infill lots within the Perimeter and surrounding metro areas has become highly competitive.',
      'We track opportunities across Fulton, DeKalb, Clayton, and other metro counties to surface properties that fit affordable development models.'
    ]
  },
  'fulton-county-land-bank-properties': {
    title: 'Fulton County Land Bank Properties | Available Lots',
    description: 'Search available properties from the Fulton County/City of Atlanta Land Bank Authority. Opportunities for builders and nonprofits.',
    h1: 'Fulton County Land Bank Properties',
    intent: 'County-level long-tail search.',
    content: [
      'The Fulton County/City of Atlanta Land Bank Authority frequently releases lots intended for affordable housing development or neighborhood revitalization.',
      'Buyers must typically submit a development plan and demonstrate financial capacity to complete the proposed project.'
    ]
  },
  'dekalb-county-land-bank-properties': {
    title: 'DeKalb County Land Bank Properties | Available Lots',
    description: 'Search available properties from the DeKalb County Land Bank. Discover affordable lots for development in DeKalb County, GA.',
    h1: 'DeKalb County Land Bank Properties',
    intent: 'County-level long-tail search.',
    content: [
      'DeKalb County\'s land bank focuses on returning tax-delinquent properties to the tax rolls through strategic redevelopment.',
      'We monitor their inventory to alert builders and investors to new acquisition opportunities.'
    ]
  },
  'clayton-county-land-bank-properties': {
    title: 'Clayton County Land Bank Properties | Available Lots',
    description: 'Search available properties from the Clayton County Land Bank. Affordable land opportunities south of Atlanta.',
    h1: 'Clayton County Land Bank Properties',
    intent: 'County-level long-tail search.',
    content: [
      'Clayton County offers significant opportunities for affordable land acquisition, especially through land bank and tax sale channels.',
      'Explore our curated data for the latest lots available in the area.'
    ]
  },
  'georgia-tax-sale-land': {
    title: 'Georgia Tax Sale Land & Tax Deeds | Risks & Opportunities',
    description: 'Understand how Georgia tax deed sales work. Learn the risks, the right of redemption, and how to find tax sale land.',
    h1: 'Georgia Tax Sale Land',
    intent: 'Tax deed/tax sale education and warnings.',
    content: [
      'Buying tax sale land in Georgia is not for beginners. Georgia is a "redeemable tax deed" state, meaning the original owner has a minimum of one year to redeem the property by paying the bid amount plus a 20% premium.',
      'During this redemption period, you do NOT have clear title and cannot build on or sell the property.'
    ]
  },
  'georgia-surplus-property': {
    title: 'Georgia Public Surplus Property | State & Local Land',
    description: 'How to find and buy surplus real estate from Georgia state and local governments. Curated lists of public land sales.',
    h1: 'Georgia Surplus Property',
    intent: 'Public surplus property search intent.',
    content: [
      'When government agencies no longer need certain parcels of land, they declare them "surplus" and sell them to the public, often via auction.',
      'We aggregate surplus property listings from various municipal sources to save you hours of searching.'
    ]
  },
  'how-to-buy-land-bank-property-in-georgia': {
    title: 'How to Buy Land Bank Property in Georgia | Step-by-Step Guide',
    description: 'A comprehensive guide on purchasing property from Georgia Land Banks. Learn the requirements, process, and tips for approval.',
    h1: 'How to Buy Land Bank Property in Georgia',
    intent: 'Educational content with strong signup CTA.',
    content: [
      'Purchasing from a land bank is not like a traditional real estate transaction. Land banks prioritize the proposed use of the property over the highest bid.',
      'Most require a detailed application, proof of funds, a construction timeline, and a commitment to specific community goals, such as affordable housing.'
    ]
  },
  'how-georgia-tax-deed-sales-work': {
    title: 'How Georgia Tax Deed Sales Work | Investor Guide',
    description: 'A detailed breakdown of the Georgia tax deed process, including the auction, the 1-year redemption period, and the foreclosure of the right to redeem.',
    h1: 'How Georgia Tax Deed Sales Work',
    intent: 'Risk-aware content that builds trust.',
    content: [
      'In Georgia, property taxes are collected by the county Tax Commissioner. If taxes go unpaid, the county can auction a "tax deed" to the highest bidder.',
      'Important: Winning the auction does not give you immediate ownership. The original owner has a 12-month right of redemption. After 12 months, you must undergo a legal process to "bar the right of redemption" to gain a clear title.'
    ]
  }
};
