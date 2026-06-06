export interface OffMarketScoreInput {
  likelyVacant?: boolean;
  lowImprovementValue?: boolean;
  publiclyOwned?: boolean;
  taxDelinquent?: boolean;
  absenteeOwner?: boolean;
  landBankAdjacent?: boolean;
  nearExistingOpportunity?: boolean;
  acreage?: number;
  zoningFit?: boolean;
  sourceConfidence?: number;
  dataFreshnessDays?: number;
}

export interface OffMarketScoreResult {
  score: number;
  reasons: string[];
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateOffMarketScore(input: OffMarketScoreInput): OffMarketScoreResult {
  let score = 0;
  const reasons: string[] = [];

  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(reason);
  };

  if (input.likelyVacant) add(18, 'Likely vacant or land-only parcel');
  if (input.lowImprovementValue) add(14, 'Low improvement value');
  if (input.publiclyOwned) add(12, 'Public ownership signal');
  if (input.taxDelinquent) add(14, 'Tax delinquency signal');
  if (input.absenteeOwner) add(10, 'Absentee owner signal');
  if (input.landBankAdjacent) add(8, 'Adjacent/near land bank property');
  if (input.nearExistingOpportunity) add(8, 'Near existing tracked opportunity');
  if (input.zoningFit) add(8, 'Zoning appears compatible with target use');
  if (typeof input.acreage === 'number' && input.acreage >= 0.1) add(Math.min(8, input.acreage), 'Usable acreage signal');

  const confidence = input.sourceConfidence ?? 50;
  if (confidence >= 80) add(8, 'High source confidence');
  else if (confidence < 40) score -= 10;

  if (typeof input.dataFreshnessDays === 'number') {
    if (input.dataFreshnessDays <= 30) add(5, 'Fresh source data');
    if (input.dataFreshnessDays > 180) score -= 8;
  }

  const finalScore = clampScore(score);
  return { score: finalScore, reasons: reasons.length ? reasons : ['Insufficient signals - Needs verification'] };
}
