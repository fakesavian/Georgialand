/**
 * valueScoring.ts
 *
 * Scoring functions for Value Score, Price Confidence, and Market Liquidity.
 * All scores are 0–100 (clamped integers).
 *
 * Part of the Georgia Land Finder scoring model.
 */

// ─── Utility ─────────────────────────────────────────────────────────────────

function clamp(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

// ─── Shared return type ───────────────────────────────────────────────────────

/** Common result shape returned by every scoring function in this module. */
export interface ScoreResult {
  /** 0–100 integer score. */
  score: number;
  /** Human-readable factors that contributed positively or negatively. */
  factors: string[];
  /** Non-fatal warnings about data quality or missing fields. */
  warnings: string[];
}

// ─── Value Score ──────────────────────────────────────────────────────────────

/**
 * Input for calculating how price-attractive a property is relative to its
 * market context.  All fields are optional; missing fields degrade confidence
 * rather than block scoring.
 */
export interface ValueScoreInput {
  /** Asking / list price in USD. */
  listPrice?: number;
  /** County/appraiser assessed value in USD. */
  assessedValue?: number;
  /** Total acreage of the parcel. */
  acreage?: number;
  /** Median price-per-acre for comparable listings in the same county (USD). */
  countyMedianPricePerAcre?: number;
  /** Number of days the property has been listed (DOM). */
  daysOnMarket?: number;
  /** Number of price reductions since first listing. */
  priceReductions?: number;
  /** Number of comparable active listings within ~5 miles or same zip. */
  nearbyComparableCount?: number;
  /**
   * Directional price trend for the local market.
   * 'rising' | 'flat' | 'falling'
   */
  localPriceTrend?: 'rising' | 'flat' | 'falling';
  /** Whether the property has had a verified recent sale price available. */
  hasVerifiedSale?: boolean;
}

/**
 * Calculates how price-attractive a property is (0 = overpriced / no data,
 * 100 = exceptional value).  A property can score high at any absolute price
 * if price-per-acre or list-to-assessed ratio is favorable.
 *
 * @param input - ValueScoreInput fields (all optional)
 * @returns ScoreResult with score, contributing factors, and warnings
 */
export function calculateValueScore(input: ValueScoreInput): ScoreResult {
  let score = 50; // neutral baseline
  const factors: string[] = [];
  const warnings: string[] = [];

  // ── List-price vs Assessed-value ratio ──────────────────────────────────
  if (
    typeof input.listPrice === 'number' &&
    typeof input.assessedValue === 'number' &&
    input.assessedValue > 0
  ) {
    const ratio = input.listPrice / input.assessedValue;
    if (ratio <= 0.5) {
      score += 25;
      factors.push(`List price is ≤50 % of assessed value (ratio: ${ratio.toFixed(2)})`);
    } else if (ratio <= 0.75) {
      score += 15;
      factors.push(`List price is 50–75 % of assessed value (ratio: ${ratio.toFixed(2)})`);
    } else if (ratio <= 1.0) {
      score += 5;
      factors.push(`List price is at or below assessed value (ratio: ${ratio.toFixed(2)})`);
    } else if (ratio <= 1.5) {
      score -= 5;
      factors.push(`List price is 0–50 % above assessed value (ratio: ${ratio.toFixed(2)})`);
    } else {
      score -= 15;
      factors.push(`List price significantly exceeds assessed value (ratio: ${ratio.toFixed(2)})`);
    }
  } else {
    warnings.push('listPrice or assessedValue missing – list/assessed ratio skipped');
  }

  // ── Price-per-acre vs county median ─────────────────────────────────────
  if (
    typeof input.listPrice === 'number' &&
    typeof input.acreage === 'number' &&
    input.acreage > 0 &&
    typeof input.countyMedianPricePerAcre === 'number' &&
    input.countyMedianPricePerAcre > 0
  ) {
    const ppa = input.listPrice / input.acreage;
    const medianRatio = ppa / input.countyMedianPricePerAcre;
    if (medianRatio <= 0.5) {
      score += 20;
      factors.push(`Price-per-acre is ≤50 % of county median ($${Math.round(ppa)}/ac vs $${Math.round(input.countyMedianPricePerAcre)}/ac median)`);
    } else if (medianRatio <= 0.75) {
      score += 12;
      factors.push(`Price-per-acre is 25–50 % below county median`);
    } else if (medianRatio <= 1.0) {
      score += 4;
      factors.push(`Price-per-acre is at or below county median`);
    } else if (medianRatio <= 1.5) {
      score -= 6;
      factors.push(`Price-per-acre is 0–50 % above county median`);
    } else {
      score -= 14;
      factors.push(`Price-per-acre is >50 % above county median`);
    }
  } else {
    warnings.push('listPrice, acreage, or countyMedianPricePerAcre missing – PPA comparison skipped');
  }

  // ── Days on market (DOM) ─────────────────────────────────────────────────
  if (typeof input.daysOnMarket === 'number') {
    if (input.daysOnMarket > 365) {
      score += 10;
      factors.push(`Long DOM (${input.daysOnMarket} days) – seller may be motivated`);
    } else if (input.daysOnMarket > 180) {
      score += 5;
      factors.push(`Extended DOM (${input.daysOnMarket} days) – possible negotiating room`);
    } else if (input.daysOnMarket < 14) {
      score -= 4;
      factors.push(`Very fresh listing (${input.daysOnMarket} days) – limited DOM pressure`);
    }
  } else {
    warnings.push('daysOnMarket not provided – DOM signal skipped');
  }

  // ── Price reductions ─────────────────────────────────────────────────────
  if (typeof input.priceReductions === 'number') {
    if (input.priceReductions >= 3) {
      score += 8;
      factors.push(`${input.priceReductions} price reductions – strong seller motivation signal`);
    } else if (input.priceReductions === 2) {
      score += 5;
      factors.push(`${input.priceReductions} price reductions – moderate motivation signal`);
    } else if (input.priceReductions === 1) {
      score += 2;
      factors.push('1 price reduction – mild motivation signal');
    }
  }

  // ── Local price trend ────────────────────────────────────────────────────
  if (input.localPriceTrend === 'falling') {
    score += 5;
    factors.push('Local price trend is falling – better buy timing');
  } else if (input.localPriceTrend === 'rising') {
    score += 3;
    factors.push('Local price trend is rising – appreciation potential');
  }

  // ── Nearby comparable count ──────────────────────────────────────────────
  if (typeof input.nearbyComparableCount === 'number') {
    if (input.nearbyComparableCount === 0) {
      score -= 5;
      warnings.push('No nearby comparable listings – value context is thin');
    } else if (input.nearbyComparableCount >= 5) {
      factors.push(`${input.nearbyComparableCount} nearby comparables available – good market context`);
    }
  } else {
    warnings.push('nearbyComparableCount not provided – comp context unknown');
  }

  return { score: clamp(score), factors, warnings };
}

// ─── Price Confidence ────────────────────────────────────────────────────────

/**
 * Input for assessing how reliable the price signal is for a given property.
 */
export interface PriceConfidenceInput {
  /**
   * Source type of the price.
   * 'mls' | 'tax_estimate' | 'owner_asking' | 'verified_sale' | 'unknown'
   */
  priceSource?: 'mls' | 'tax_estimate' | 'owner_asking' | 'verified_sale' | 'unknown';
  /** How many days ago the price was recorded or verified. */
  priceFreshnessAgeDays?: number;
  /** Number of nearby closed comps to support the price. */
  compCount?: number;
  /** Whether the price has been human-reviewed or broker-verified. */
  humanVerified?: boolean;
  /** Whether the price reflects an actual closed sale (vs asking/estimate). */
  isVerifiedSale?: boolean;
  /** Whether the listing appears on a licensed MLS feed. */
  mlsVerified?: boolean;
}

/**
 * Calculates how reliable the price signal is for a property (0 = unreliable,
 * 100 = fully verified with strong comps).
 *
 * @param input - PriceConfidenceInput fields
 * @returns ScoreResult with score, factors, and warnings
 */
export function calculatePriceConfidence(input: PriceConfidenceInput): ScoreResult {
  let score = 30; // conservative baseline – assume low confidence until proven
  const factors: string[] = [];
  const warnings: string[] = [];

  // ── Price source quality ─────────────────────────────────────────────────
  const sourceScores: Record<string, number> = {
    verified_sale: 35,
    mls: 25,
    owner_asking: 5,
    tax_estimate: 0,
    unknown: -10,
  };
  const src = input.priceSource ?? 'unknown';
  const srcDelta = sourceScores[src] ?? -10;
  score += srcDelta;
  if (src === 'verified_sale') {
    factors.push('Price is from a verified closed sale – highest confidence source');
  } else if (src === 'mls') {
    factors.push('Price sourced from MLS feed – high reliability');
  } else if (src === 'owner_asking') {
    warnings.push('Price is owner-asking only – treat as upper bound');
  } else if (src === 'tax_estimate') {
    warnings.push('Price is a tax/assessed estimate – not a market price');
  } else {
    warnings.push('Price source unknown – confidence severely limited');
  }

  // ── Freshness ────────────────────────────────────────────────────────────
  if (typeof input.priceFreshnessAgeDays === 'number') {
    if (input.priceFreshnessAgeDays <= 30) {
      score += 15;
      factors.push(`Price is current (≤30 days old)`);
    } else if (input.priceFreshnessAgeDays <= 90) {
      score += 8;
      factors.push(`Price is recent (${input.priceFreshnessAgeDays} days old)`);
    } else if (input.priceFreshnessAgeDays <= 365) {
      score -= 5;
      warnings.push(`Price is ${input.priceFreshnessAgeDays} days old – may be stale`);
    } else {
      score -= 15;
      warnings.push(`Price is over 1 year old (${input.priceFreshnessAgeDays} days) – likely stale`);
    }
  } else {
    warnings.push('priceFreshnessAgeDays not provided – freshness unknown');
  }

  // ── Comp support ─────────────────────────────────────────────────────────
  if (typeof input.compCount === 'number') {
    if (input.compCount >= 5) {
      score += 15;
      factors.push(`${input.compCount} comps available – strong market support`);
    } else if (input.compCount >= 2) {
      score += 8;
      factors.push(`${input.compCount} comps available – moderate support`);
    } else if (input.compCount === 1) {
      score += 3;
      factors.push('1 comp available – thin but present');
    } else {
      score -= 8;
      warnings.push('No comps available – price cannot be validated against market');
    }
  } else {
    warnings.push('compCount not provided – comp support unknown');
  }

  // ── Verification bonuses ─────────────────────────────────────────────────
  if (input.humanVerified) {
    score += 8;
    factors.push('Price has been human-reviewed or broker-verified');
  }
  if (input.mlsVerified) {
    score += 5;
    factors.push('Listing is confirmed on a licensed MLS feed');
  }
  if (input.isVerifiedSale) {
    score += 5;
    factors.push('Price reflects an actual closed/recorded sale');
  }

  return { score: clamp(score), factors, warnings };
}

// ─── Market Liquidity ────────────────────────────────────────────────────────

/**
 * Input for assessing how active the local land market is around a property.
 */
export interface MarketLiquidityInput {
  /**
   * Qualitative activity level of the county/market area.
   * 'high' | 'moderate' | 'low' | 'very_low'
   */
  countyActivityLevel?: 'high' | 'moderate' | 'low' | 'very_low';
  /** Number of active land listings within ~10 miles or same county zone. */
  nearbyListingCount?: number;
  /** Median days-on-market for comparable recent sales in the area. */
  medianDomDays?: number;
  /**
   * Recent 6-month price trend direction.
   * 'rising' | 'flat' | 'falling'
   */
  recentPriceTrend?: 'rising' | 'flat' | 'falling';
  /** Number of recorded land sales in the county in the past 12 months. */
  annualSalesVolume?: number;
  /**
   * Known demand driver near the property.
   * e.g. 'industrial', 'solar', 'residential', 'timber', 'none'
   */
  demandDriver?: string;
  /** Whether the area is within a designated Opportunity Zone. */
  opportunityZone?: boolean;
  /** Whether the area is near a major transit corridor or highway interchange. */
  nearTransitCorridor?: boolean;
}

/**
 * Calculates how liquid/active the local land market is (0 = illiquid dead
 * market, 100 = highly active with many buyers and sellers).
 *
 * @param input - MarketLiquidityInput fields
 * @returns ScoreResult with score, factors, and warnings
 */
export function calculateMarketLiquidity(input: MarketLiquidityInput): ScoreResult {
  let score = 30; // conservative baseline
  const factors: string[] = [];
  const warnings: string[] = [];

  // ── County activity level ────────────────────────────────────────────────
  if (input.countyActivityLevel) {
    const activityMap: Record<string, number> = {
      high: 25,
      moderate: 12,
      low: 0,
      very_low: -10,
    };
    const delta = activityMap[input.countyActivityLevel] ?? 0;
    score += delta;
    factors.push(`County activity level: ${input.countyActivityLevel}`);
  } else {
    warnings.push('countyActivityLevel not provided – county context unknown');
  }

  // ── Nearby listing count ─────────────────────────────────────────────────
  if (typeof input.nearbyListingCount === 'number') {
    if (input.nearbyListingCount >= 20) {
      score += 15;
      factors.push(`${input.nearbyListingCount} nearby active listings – very active local market`);
    } else if (input.nearbyListingCount >= 10) {
      score += 10;
      factors.push(`${input.nearbyListingCount} nearby listings – healthy local inventory`);
    } else if (input.nearbyListingCount >= 3) {
      score += 4;
      factors.push(`${input.nearbyListingCount} nearby listings – limited but present`);
    } else if (input.nearbyListingCount === 0) {
      score -= 10;
      warnings.push('No nearby listings – market may be very thin or data is missing');
    }
  } else {
    warnings.push('nearbyListingCount not provided');
  }

  // ── Median DOM ───────────────────────────────────────────────────────────
  if (typeof input.medianDomDays === 'number') {
    if (input.medianDomDays <= 45) {
      score += 15;
      factors.push(`Median DOM is ${input.medianDomDays} days – fast-moving market`);
    } else if (input.medianDomDays <= 120) {
      score += 7;
      factors.push(`Median DOM is ${input.medianDomDays} days – moderate market pace`);
    } else if (input.medianDomDays > 365) {
      score -= 10;
      warnings.push(`Median DOM is ${input.medianDomDays} days – very slow market`);
    } else {
      factors.push(`Median DOM is ${input.medianDomDays} days – slow but not stagnant`);
    }
  } else {
    warnings.push('medianDomDays not provided – market pace unknown');
  }

  // ── Price trend ──────────────────────────────────────────────────────────
  if (input.recentPriceTrend === 'rising') {
    score += 10;
    factors.push('Recent price trend is rising – increasing demand signal');
  } else if (input.recentPriceTrend === 'flat') {
    factors.push('Recent price trend is flat – stable market');
  } else if (input.recentPriceTrend === 'falling') {
    score -= 5;
    warnings.push('Recent price trend is falling – softening demand');
  }

  // ── Annual sales volume ──────────────────────────────────────────────────
  if (typeof input.annualSalesVolume === 'number') {
    if (input.annualSalesVolume >= 50) {
      score += 10;
      factors.push(`${input.annualSalesVolume} land sales in county past 12 months – high volume`);
    } else if (input.annualSalesVolume >= 15) {
      score += 5;
      factors.push(`${input.annualSalesVolume} land sales in county past 12 months`);
    } else if (input.annualSalesVolume < 5) {
      score -= 8;
      warnings.push(`Only ${input.annualSalesVolume} land sales in county past 12 months – very thin`);
    }
  }

  // ── Demand drivers ───────────────────────────────────────────────────────
  if (input.demandDriver && input.demandDriver !== 'none') {
    score += 8;
    factors.push(`Known demand driver in area: ${input.demandDriver}`);
  }
  if (input.opportunityZone) {
    score += 5;
    factors.push('Property is within a federal Opportunity Zone – investor interest likely');
  }
  if (input.nearTransitCorridor) {
    score += 5;
    factors.push('Near major transit corridor or highway interchange – strong connectivity');
  }

  return { score: clamp(score), factors, warnings };
}
