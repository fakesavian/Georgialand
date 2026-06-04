import { AccessLevel } from './authTypes';

export function canExport(level: AccessLevel): boolean {
  return ['dashboard_pro', 'dashboard_investor', 'admin'].includes(level);
}

export function canViewFullDatabase(level: AccessLevel): boolean {
  return ['dashboard_starter', 'dashboard_pro', 'dashboard_investor', 'admin'].includes(level);
}

export function canViewAgencyContacts(level: AccessLevel): boolean {
  return ['dashboard_investor', 'admin'].includes(level);
}

export function getMaxRowsAllowed(level: AccessLevel): number | null {
  if (['free_preview', 'alerts_subscriber'].includes(level)) return 10;
  if (level === 'report_buyer') return 50;
  return null; // Unlimited
}

export function canUseFavorites(level: AccessLevel): boolean {
  return ['dashboard_pro', 'dashboard_investor', 'admin'].includes(level);
}

export function canUseNotes(level: AccessLevel): boolean {
  return ['dashboard_pro', 'dashboard_investor', 'admin'].includes(level);
}

export function canExportLeadCards(level: AccessLevel): boolean {
  return ['dashboard_pro', 'dashboard_investor', 'admin'].includes(level);
}

export function canUseInvestorTools(level: AccessLevel): boolean {
  return ['dashboard_investor', 'admin'].includes(level);
}
