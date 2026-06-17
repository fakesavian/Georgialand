export type BillingCycle = 'monthly' | 'annual';
export type PaidPlanId = 'starter' | 'pro' | 'investor';

export interface PaidPlan {
  id: PaidPlanId;
  name: string;
  accessLevel: 'dashboard_starter' | 'dashboard_pro' | 'dashboard_investor';
  monthlyPrice: string;
  annualMonthlyPrice: string;
  monthlyPeriod: string;
  annualPeriod: string;
  desc: string;
  annualDesc: string;
  cta: string;
  annualCta: string;
  features: string[];
  stripePriceEnv: {
    monthly: string;
    annual: string;
  };
}

export const PAID_PLANS: PaidPlan[] = [
  {
    id: 'starter',
    name: 'Dashboard Starter',
    accessLevel: 'dashboard_starter',
    monthlyPrice: '$39',
    annualMonthlyPrice: '$35',
    monthlyPeriod: '/ mo',
    annualPeriod: '/ mo',
    desc: 'Full Georgia land intelligence database for active researchers and buyers.',
    annualDesc: 'Full Georgia land intelligence database with a lower effective monthly rate when prepaid annually.',
    cta: 'Get Started',
    annualCta: 'Start Annual Plan',
    features: [
      'Full listing database — all sources, all counties',
      'Unified search + 15+ filters including price per acre',
      'Risk, fit, and data confidence scores',
      'County and city boundary map layers',
      'Aerial map and GIS source links',
      'Favorites list',
      'Property drawer with full details',
    ],
    stripePriceEnv: {
      monthly: 'STRIPE_DASHBOARD_STARTER_MONTHLY_PRICE_ID',
      annual: 'STRIPE_DASHBOARD_STARTER_ANNUAL_PRICE_ID',
    },
  },
  {
    id: 'pro',
    name: 'Dashboard Pro',
    accessLevel: 'dashboard_pro',
    monthlyPrice: '$79',
    annualMonthlyPrice: '$69',
    monthlyPeriod: '/ mo',
    annualPeriod: '/ mo',
    desc: 'Full workflow tools for serious land investors and builders.',
    annualDesc: 'Full workflow tools with annual upfront billing and a lower monthly-equivalent rate.',
    cta: 'Get Pro',
    annualCta: 'Get Pro Annual',
    features: [
      'Everything in Starter',
      'Saved notes and lead management',
      'Advanced filters: price range, value score, source type',
      'Tax card links and owner/public record fields',
      'County GIS deep links',
      'Parcel boundaries (where verified-source records exist)',
      'Alert preferences and daily/weekly email alerts',
      'Source freshness and change history',
      'Comp indicators (nearby listing prices)',
      'FEMA flood and zoning layers (coming soon)',
    ],
    stripePriceEnv: {
      monthly: 'STRIPE_DASHBOARD_PRO_MONTHLY_PRICE_ID',
      annual: 'STRIPE_DASHBOARD_PRO_ANNUAL_PRICE_ID',
    },
  },
  {
    id: 'investor',
    name: 'Dashboard Investor',
    accessLevel: 'dashboard_investor',
    monthlyPrice: '$149',
    annualMonthlyPrice: '$129',
    monthlyPeriod: '/ mo',
    annualPeriod: '/ mo',
    desc: 'Agency-grade Georgia land intelligence for high-volume deal sourcing.',
    annualDesc: 'Agency-grade Georgia land intelligence with annual upfront billing and a lower monthly-equivalent rate.',
    cta: 'Get Investor',
    annualCta: 'Get Investor Annual',
    features: [
      'Everything in Pro',
      'CSV exports and lead card exports',
      'Bulk export for high-volume sourcing',
      'Deal pipeline and watchlists',
      'Parcel-level off-market candidate scoring (coming soon)',
      'Opportunity zone layer (coming soon)',
      'Distinct land-bank and tax-sale map layers (coming soon)',
      'Advanced value and market liquidity scoring',
      'High-fit priority alerts',
      'Source registry and data confidence details',
      'Agency contact workflow fields',
      'Off-market outreach action fields',
    ],
    stripePriceEnv: {
      monthly: 'STRIPE_DASHBOARD_INVESTOR_MONTHLY_PRICE_ID',
      annual: 'STRIPE_DASHBOARD_INVESTOR_ANNUAL_PRICE_ID',
    },
  },
];

export function getPaidPlan(planId: string): PaidPlan | undefined {
  return PAID_PLANS.find((plan) => plan.id === planId);
}

export function isBillingCycle(value: string): value is BillingCycle {
  return value === 'monthly' || value === 'annual';
}
