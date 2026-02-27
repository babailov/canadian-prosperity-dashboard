/**
 * Pre-computed scores using the static data.
 * This runs at build time (server component) and also exports
 * data structures used by client components (via serialization).
 */

import { CMAS, METRICS, toRawMetricData, getMetricValue } from "@/lib/data";
import { computeScores, recomputeWithWeights as _recomputeWithWeights } from "@/lib/scoring";
import {
  CityRankData,
  CityProfileData,
  DimensionData,
  MetricWithValue,
  DimensionWeights,
  DEFAULT_WEIGHTS,
  DIMENSION_ORDER,
  Dimension,
  Metric,
  MetricValue,
} from "@/types";

const rawData = toRawMetricData();
const computedScores = computeScores(rawData, DEFAULT_WEIGHTS);

// Build a map for quick lookup
const scoreMap = new Map(computedScores.map((s) => [s.cmaId, s]));

// Rank CMAs by overall score
const rankedCMAs = [...CMAS]
  .map((cma) => {
    const score = scoreMap.get(cma.id);
    return { cma, score };
  })
  .filter((x) => x.score !== undefined)
  .sort((a, b) => (b.score!.overallScore ?? 0) - (a.score!.overallScore ?? 0));

// Assign ranks (1-based)
const rankMap = new Map<string, number>(
  rankedCMAs.map(({ cma }, idx) => [cma.id, idx + 1])
);

// Convert computed score to CMAScore shape
function toScoreRow(cs: ReturnType<typeof computeScores>[number]) {
  return {
    id: `score_${cs.cmaId}`,
    cmaId: cs.cmaId,
    computedAt: new Date().toISOString(),
    economicScore: cs.economicScore,
    housingScore: cs.housingScore,
    qualityScore: cs.qualityScore,
    safetyScore: cs.safetyScore,
    environmentScore: cs.environmentScore,
    demographicScore: cs.demographicScore,
    overallScore: cs.overallScore,
    completenessScore: cs.completenessScore,
    defaultWeightsJson: JSON.stringify(DEFAULT_WEIGHTS),
    normalizedValues: cs.normalizedValues,
  };
}

/**
 * Get all CMA rank data with precomputed default-weight scores.
 */
export function getAllCityRankData(): CityRankData[] {
  return rankedCMAs
    .map(({ cma }, idx) => {
      const cs = scoreMap.get(cma.id)!;
      return {
        cma,
        score: toScoreRow(cs),
        rank: idx + 1,
      };
    });
}

/**
 * Get rank data for a specific CMA slug.
 */
export function getCityRankDataBySlug(slug: string): CityRankData | null {
  const cma = CMAS.find((c) => c.slug === slug);
  if (!cma) return null;
  const cs = scoreMap.get(cma.id);
  if (!cs) return null;
  const rank = rankMap.get(cma.id) ?? 0;
  return { cma, score: toScoreRow(cs), rank };
}

/**
 * Get full profile data for a CMA — includes all metrics with values and normalized scores.
 */
export function getCityProfileData(slug: string): CityProfileData | null {
  const rankData = getCityRankDataBySlug(slug);
  if (!rankData) return null;

  const { cma, score, rank } = rankData;
  const cs = scoreMap.get(cma.id)!;

  const metricMap = new Map(METRICS.map((m) => [m.id, m]));

  const dimensions: DimensionData[] = DIMENSION_ORDER.map((dim) => {
    const dimMetrics = METRICS.filter((m) => m.dimension === dim);

    const metrics: MetricWithValue[] = dimMetrics.map((metric) => {
      const rawVal = getMetricValue(cma.id, metric.id);
      const normalizedScore = cs.normalizedValues[metric.id] ?? null;

      const metricValue: MetricValue | null = rawVal
        ? {
            id: `mv_${cma.id}_${metric.id}`,
            cmaId: cma.id,
            metricId: metric.id,
            period: rawVal.period,
            value: rawVal.value,
            isProxy: rawVal.isProxy,
            proxyNote: rawVal.proxyNote,
            sourcePublicationDate: rawVal.sourcePublicationDate,
            collectedAt: new Date().toISOString(),
            sourceTableId: rawVal.sourceTableId,
          }
        : null;

      return { metric, value: metricValue, normalizedScore };
    });

    // Determine dimension score from computed
    const dimScoreMap: Partial<Record<Dimension, number | null>> = {
      economic: cs.economicScore,
      housing: cs.housingScore,
      quality_of_life: cs.qualityScore,
      safety: cs.safetyScore,
      environment: cs.environmentScore,
      demographics: cs.demographicScore,
    };

    return {
      dimension: dim,
      score: dimScoreMap[dim] ?? null,
      metrics,
    };
  });

  return { cma, score, rank, dimensions };
}

/**
 * Get all city rank data including normalized metric values.
 * Used by the client-side weight slider to recompute scores.
 */
export function getAllScoreData() {
  return computedScores.map((cs) => ({
    cmaId: cs.cmaId,
    economicScore: cs.economicScore,
    housingScore: cs.housingScore,
    qualityScore: cs.qualityScore,
    safetyScore: cs.safetyScore,
    environmentScore: cs.environmentScore,
    demographicScore: cs.demographicScore,
    overallScore: cs.overallScore,
    completenessScore: cs.completenessScore,
  }));
}

/**
 * Rerank cities with custom weights (for the client).
 * Input: dimension scores from DB, new weights.
 * Returns sorted CityRankData array.
 */
export function rerankWithWeights(
  allRankData: ReturnType<typeof getAllCityRankData>,
  weights: DimensionWeights
): (CityRankData & { customOverallScore: number })[] {
  const scoreInputs = allRankData.map((r) => ({
    cmaId: r.cma.id,
    economicScore: r.score.economicScore,
    housingScore: r.score.housingScore,
    qualityScore: r.score.qualityScore,
    safetyScore: r.score.safetyScore,
    environmentScore: r.score.environmentScore,
    demographicScore: r.score.demographicScore,
  }));

  const newScores = _recomputeWithWeights(scoreInputs, weights);

  return allRankData
    .map((r) => ({
      ...r,
      customOverallScore: newScores.get(r.cma.id) ?? r.score.overallScore,
    }))
    .sort((a, b) => b.customOverallScore - a.customOverallScore)
    .map((r, idx) => ({ ...r, rank: idx + 1 }));
}
