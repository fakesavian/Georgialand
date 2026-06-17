import { AccessLevel } from './authTypes';

const STARTER_PLUS: AccessLevel[] = ['dashboard_starter', 'dashboard_pro', 'dashboard_investor', 'admin'];
const PRO_PLUS: AccessLevel[] = ['dashboard_pro', 'dashboard_investor', 'admin'];
const INVESTOR_PLUS: AccessLevel[] = ['dashboard_investor', 'admin'];

export function canViewFullDatabase(level: AccessLevel): boolean {
  return STARTER_PLUS.includes(level);
}

export function canExport(level: AccessLevel): boolean {
  return INVESTOR_PLUS.includes(level);
}

export function canSaveNotes(level: AccessLevel): boolean {
  return PRO_PLUS.includes(level);
}

export function canUseFavorites(level: AccessLevel): boolean {
  return PRO_PLUS.includes(level);
}

export function canUseNotes(level: AccessLevel): boolean {
  return canSaveNotes(level);
}

export function canExportLeadCards(level: AccessLevel): boolean {
  return INVESTOR_PLUS.includes(level);
}

export function canViewAgencyContacts(level: AccessLevel): boolean {
  return INVESTOR_PLUS.includes(level);
}

export function canUseAgencyContacts(level: AccessLevel): boolean {
  return INVESTOR_PLUS.includes(level);
}

export function canUseInvestorTools(level: AccessLevel): boolean {
  return INVESTOR_PLUS.includes(level);
}

export function canViewCountyCityBoundaries(level: AccessLevel): boolean {
  return STARTER_PLUS.includes(level);
}

export function canViewParcelBoundaries(level: AccessLevel): boolean {
  return PRO_PLUS.includes(level);
}

export function canViewAdvancedGisLayers(level: AccessLevel): boolean {
  return PRO_PLUS.includes(level);
}

export function canViewTaxCards(level: AccessLevel): boolean {
  return INVESTOR_PLUS.includes(level);
}

export function canViewOwnerData(level: AccessLevel): boolean {
  return INVESTOR_PLUS.includes(level);
}

export function canViewOffMarketLeads(level: AccessLevel): boolean {
  return INVESTOR_PLUS.includes(level);
}

export function canPreviewOffMarketLeads(level: AccessLevel): boolean {
  return PRO_PLUS.includes(level);
}

export function canUseDealPipeline(level: AccessLevel): boolean {
  return INVESTOR_PLUS.includes(level);
}

export function canUseBulkExports(level: AccessLevel): boolean {
  return INVESTOR_PLUS.includes(level);
}

export function canManageAdminSources(level: AccessLevel): boolean {
  return level === 'admin';
}

export function getMaxRowsAllowed(level: AccessLevel): number | null {
  if (['free_preview', 'alerts_subscriber'].includes(level)) return 10;
  if (level === 'report_buyer') return 50;
  return null;
}

export function getTierLabel(level: AccessLevel): string {
  switch (level) {
    case 'admin': return 'Admin';
    case 'dashboard_investor': return 'Investor';
    case 'dashboard_pro': return 'Pro';
    case 'dashboard_starter': return 'Starter';
    case 'report_buyer': return 'Report Buyer';
    case 'alerts_subscriber': return 'Alerts';
    default: return 'Free Tier';
  }
}
