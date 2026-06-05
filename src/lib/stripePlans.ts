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
    desc: 'Full searchable database access for active researchers.',
    annualDesc: 'Full searchable database access with a lower effective monthly rate when prepaid annually.',
    cta: 'Get Started',
    annualCta: 'Start Annual Plan',
    features: [
      'Full database — all listings, all counties',
      'Unified search + 15+ advanced filters',
      'Risk score, fit score, data confidence',
      'Aerial map and GIS source links',
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
    desc: 'Full workflow tools for serious investors and builders.',
    annualDesc: 'Full workflow tools with annual upfront billing and a lower monthly-equivalent rate.',
    cta: 'Get Pro',
    annualCta: 'Get Pro Annual',
    features: [
      'Everything in Starter',
      'CSV exports and lead card exports',
      'Saved leads and personal notes',
      'Lead card builder (MD / HTML / CSV)',
      'Data quality audit panel',
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
    desc: 'Agency-grade tools for high-volume deal sourcing.',
    annualDesc: 'Agency-grade tools with annual upfront billing and a lower monthly-equivalent rate.',
    cta: 'Get Investor',
    annualCta: 'Get Investor Annual',
    features: [
      'Everything in Pro',
      'Priority and high-fit property alerts',
      'Agency contacts and deal pipeline view',
      'Investor-grade property scoring view',
      'Multi-county watchlists',
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
