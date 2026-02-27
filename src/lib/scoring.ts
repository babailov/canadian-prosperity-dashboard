/**
 * Prosperity Scoring Algorithm
 *
 * Implements the scoring spec from PRD Section 5:
 * - Min-max normalization (0–100) per metric across all CMAs
 * - Outlier clipping at 3 standard deviations
 * - Missing data: excluded from dimension/overall score
 * - Dimension score = avg of available normalized metrics
 * - Overall score = weighted avg of available dimension scores
 * - Data completeness score = fraction of metric weight with real data
 *
 * This module is pure TypeScript with no external dependencies so it
 * can run both server-side (Node/D1 seed) and client-side (weight sliders).
 */

import {
  Dimension,
  DimensionWeights,
  DEFAULT_WEIGHTS,
  RawMetricData,
  ComputedScore,
  DIMENSION_ORDER,
} from "@/types";

// ── Statistical helpers ──────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Clip values beyond 3 standard deviations from the mean.
 * Returns a map of original values → clipped values.
 */
function clipOutliers(values: number[]): number[] {
  if (values.length < 3) return values;
  const m = mean(values);
  const sd = stdDev(values);
  const lo = m - 3 * sd;
  const hi = m + 3 * sd;
  return values.map((v) => Math.min(Math.max(v, lo), hi));
}

// ── Core normalization ───────────────────────────────────────────────────────

/**
 * Normalize a single value to 0–100.
 * direction: "higher_is_better" → higher raw value → higher score
 *            "lower_is_better"  → lower raw value → higher score
 *            "neutral"          → not scored (returns null)
 */
function normalizeValue(
  value: number,
  best: number,
  worst: number,
  direction: "higher_is_better" | "lower_is_better" | "neutral"
): number | null {
  if (direction === "neutral") return null;

  if (best === worst) return 50; // all CMAs identical → midpoint

  let score: number;
  if (direction === "higher_is_better") {
    score = ((value - worst) / (best - worst)) * 100;
  } else {
    // lower_is_better: best = lowest value, worst = highest value
    score = ((worst - value) / (worst - best)) * 100;
  }

  // Clamp to [0, 100]
  return Math.min(100, Math.max(0, score));
}

// ── Main scoring function ────────────────────────────────────────────────────

/**
 * Compute prosperity scores for all CMAs.
 *
 * @param allMetrics  All metric definitions with their dimension/direction/weight
 * @param allValues   All raw metric values for all CMAs
 * @param weights     Dimension weights (0–100 each, should sum to ~100)
 * @returns           Array of ComputedScore, one per CMA
 */
export function computeScores(
  allMetrics: RawMetricData[],
  weights: DimensionWeights = DEFAULT_WEIGHTS
): ComputedScore[] {
  // Group values by metricId
  const valuesByMetric = new Map<
    string,
    Array<{ cmaId: string; value: number; isProxy: boolean }>
  >();

  for (const m of allMetrics) {
    if (m.value === null) continue;
    if (!valuesByMetric.has(m.metricId)) {
      valuesByMetric.set(m.metricId, []);
    }
    valuesByMetric.get(m.metricId)!.push({
      cmaId: m.cmaId,
      value: m.value,
      isProxy: m.isProxy,
    });
  }

  // For each metric, compute clipped + normalized values per CMA
  // normalizedByMetric: metricId → Map<cmaId, normalizedScore>
  const normalizedByMetric = new Map<string, Map<string, number>>();

  // Get unique metrics
  const metricDefs = new Map<
    string,
    { direction: RawMetricData["direction"]; dimension: Dimension; weight: number }
  >();
  for (const m of allMetrics) {
    if (!metricDefs.has(m.metricId)) {
      metricDefs.set(m.metricId, {
        direction: m.direction,
        dimension: m.dimension,
        weight: m.weightWithinDimension,
      });
    }
  }

  for (const [metricId, entries] of valuesByMetric) {
    const def = metricDefs.get(metricId);
    if (!def || def.direction === "neutral") continue;

    const rawValues = entries.map((e) => e.value);
    const clipped = clipOutliers(rawValues);

    // Find best/worst after clipping
    const isHigherBetter = def.direction === "higher_is_better";
    const best = isHigherBetter ? Math.max(...clipped) : Math.min(...clipped);
    const worst = isHigherBetter ? Math.min(...clipped) : Math.max(...clipped);

    const metricMap = new Map<string, number>();
    entries.forEach((entry, idx) => {
      const normalized = normalizeValue(
        clipped[idx],
        best,
        worst,
        def.direction
      );
      if (normalized !== null) {
        metricMap.set(entry.cmaId, normalized);
      }
    });
    normalizedByMetric.set(metricId, metricMap);
  }

  // Get all unique CMA IDs
  const allCmaIds = Array.from(new Set(allMetrics.map((m) => m.cmaId)));

  // Normalize weights to sum to 100
  const totalWeight = DIMENSION_ORDER.reduce(
    (sum, dim) => sum + (weights[dim] ?? 0),
    0
  );
  const normalizedWeights: DimensionWeights = { ...DEFAULT_WEIGHTS };
  if (totalWeight > 0) {
    for (const dim of DIMENSION_ORDER) {
      normalizedWeights[dim] = ((weights[dim] ?? 0) / totalWeight) * 100;
    }
  }

  // Compute completeness: total weight of all scorable (non-neutral) metrics
  const totalScoredWeight = Array.from(metricDefs.entries()).reduce(
    (sum, [, def]) => {
      if (def.direction === "neutral") return sum;
      return sum + (normalizedWeights[def.dimension] / 100) * def.weight;
    },
    0
  );

  // Build per-CMA scores
  const results: ComputedScore[] = [];

  for (const cmaId of allCmaIds) {
    const dimScores: Partial<Record<Dimension, number | null>> = {};
    const allNormalized: Record<string, number | null> = {};
    let realDataWeight = 0;

    for (const dim of DIMENSION_ORDER) {
      const dimMetrics = Array.from(metricDefs.entries()).filter(
        ([, def]) => def.dimension === dim && def.direction !== "neutral"
      );

      const scores: number[] = [];

      for (const [metricId, def] of dimMetrics) {
        const metricMap = normalizedByMetric.get(metricId);
        const score = metricMap?.get(cmaId) ?? null;
        allNormalized[metricId] = score;

        if (score !== null) {
          scores.push(score);
          // Check if this CMA has a non-proxy value for completeness
          const entry = valuesByMetric
            .get(metricId)
            ?.find((e) => e.cmaId === cmaId);
          if (entry && !entry.isProxy) {
            realDataWeight +=
              (normalizedWeights[dim] / 100) * def.weight;
          }
        }
      }

      dimScores[dim] = scores.length > 0 ? mean(scores) : null;
    }

    // Overall score: weighted avg of available dimensions
    let weightedSum = 0;
    let usedWeight = 0;

    for (const dim of DIMENSION_ORDER) {
      const dimScore = dimScores[dim] ?? null;
      const w = normalizedWeights[dim];
      if (dimScore !== null && w > 0) {
        weightedSum += (w / 100) * dimScore;
        usedWeight += w;
      }
    }

    const overallScore = usedWeight > 0 ? (weightedSum / usedWeight) * 100 : 0;

    // Completeness: fraction of total scored metric weight with real data
    const completenessScore =
      totalScoredWeight > 0
        ? Math.min(100, (realDataWeight / totalScoredWeight) * 100)
        : 0;

    results.push({
      cmaId,
      economicScore: dimScores.economic ?? null,
      housingScore: dimScores.housing ?? null,
      qualityScore: dimScores.quality_of_life ?? null,
      safetyScore: dimScores.safety ?? null,
      environmentScore: dimScores.environment ?? null,
      demographicScore: dimScores.demographics ?? null,
      overallScore,
      completenessScore,
      normalizedValues: allNormalized,
    });
  }

  return results;
}

/**
 * Recompute overall scores with custom weights.
 * Used client-side for real-time weight slider updates.
 *
 * @param baseScores  Precomputed dimension scores (from DB)
 * @param weights     New dimension weights (0–100 each)
 * @returns           Map of cmaId → overall score
 */
export function recomputeWithWeights(
  baseScores: Array<{
    cmaId: string;
    economicScore: number | null;
    housingScore: number | null;
    qualityScore: number | null;
    safetyScore: number | null;
    environmentScore: number | null;
    demographicScore: number | null;
  }>,
  weights: DimensionWeights
): Map<string, number> {
  const result = new Map<string, number>();

  // Normalize weights
  const totalWeight = DIMENSION_ORDER.reduce(
    (sum, dim) => sum + (weights[dim] ?? 0),
    0
  );

  for (const row of baseScores) {
    const dimScoreMap: Partial<Record<Dimension, number | null>> = {
      economic: row.economicScore,
      housing: row.housingScore,
      quality_of_life: row.qualityScore,
      safety: row.safetyScore,
      environment: row.environmentScore,
      demographics: row.demographicScore,
    };

    let weightedSum = 0;
    let usedWeight = 0;

    for (const dim of DIMENSION_ORDER) {
      const dimScore = dimScoreMap[dim] ?? null;
      const rawW = weights[dim] ?? 0;
      const w = totalWeight > 0 ? (rawW / totalWeight) * 100 : 0;

      if (dimScore !== null && rawW > 0) {
        weightedSum += (w / 100) * dimScore;
        usedWeight += w;
      }
    }

    const overallScore = usedWeight > 0 ? (weightedSum / usedWeight) * 100 : 0;
    result.set(row.cmaId, overallScore);
  }

  return result;
}

/**
 * Get freshness state from a source publication date string.
 */
export function getFreshnessState(
  sourcePublicationDate: string | null,
  isCensus = false
): "fresh" | "aging" | "stale" | "historical" {
  if (isCensus) return "historical";
  if (!sourcePublicationDate) return "stale";

  const pub = new Date(sourcePublicationDate);
  const now = new Date();
  const daysDiff = (now.getTime() - pub.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff <= 60) return "fresh";
  if (daysDiff <= 365) return "aging";
  return "stale";
}

/**
 * Auto-normalize weights so they sum to 100.
 * When one slider changes, redistribute the remainder proportionally.
 */
export function normalizeWeights(
  weights: DimensionWeights,
  changedDim: Dimension,
  newValue: number
): DimensionWeights {
  const clamped = Math.min(50, Math.max(0, newValue));
  const remaining = 100 - clamped;

  // Sum of all other dimensions before change
  const otherDims = DIMENSION_ORDER.filter((d) => d !== changedDim);
  const otherSum = otherDims.reduce((sum, d) => sum + (weights[d] ?? 0), 0);

  const newWeights = { ...weights, [changedDim]: clamped };

  if (otherSum === 0) {
    // Distribute remaining equally
    const each = remaining / otherDims.length;
    for (const d of otherDims) {
      newWeights[d] = each;
    }
  } else {
    // Distribute proportionally
    for (const d of otherDims) {
      newWeights[d] = ((weights[d] ?? 0) / otherSum) * remaining;
    }
  }

  return newWeights;
}
