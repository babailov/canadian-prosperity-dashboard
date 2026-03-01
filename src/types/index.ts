// Core domain types for the Canadian City Prosperity Dashboard

export type Dimension =
  | "economic"
  | "housing"
  | "quality_of_life"
  | "safety"
  | "environment"
  | "demographics";

export type MetricDirection = "higher_is_better" | "lower_is_better" | "neutral";

export type FreshnessState = "fresh" | "aging" | "stale" | "historical";

export interface CMA {
  id: string;
  name: string;
  slug: string;
  province: string;
  provinceAbbr: string;
  populationLatest: number | null;
  centroidLat: number | null;
  centroidLng: number | null;
  cmaBoundaryNote: string | null;
}

export interface Metric {
  id: string;
  dimension: Dimension;
  name: string;
  description: string | null;
  sourceName: string;
  sourceTable: string | null;
  sourceUrl: string | null;
  updateFrequency: string;
  direction: MetricDirection;
  weightWithinDimension: number;
  proxyFallbackMetricId: string | null;
  isProxyTarget: boolean;
}

export interface MetricValue {
  id: string;
  cmaId: string;
  metricId: string;
  period: string;
  value: number | null;
  isProxy: boolean;
  proxyNote: string | null;
  sourcePublicationDate: string | null;
  collectedAt: string;
  sourceTableId: string | null;
}

export interface CMAScore {
  id: string;
  cmaId: string;
  computedAt: string;
  economicScore: number | null;
  housingScore: number | null;
  qualityScore: number | null;
  safetyScore: number | null;
  environmentScore: number | null;
  demographicScore: number | null;
  overallScore: number;
  completenessScore: number;
  defaultWeightsJson: string;
}

export interface DimensionWeights {
  economic: number;
  housing: number;
  quality_of_life: number;
  safety: number;
  environment: number;
  demographics: number;
}

export const DEFAULT_WEIGHTS: DimensionWeights = {
  economic: 25,
  housing: 25,
  quality_of_life: 20,
  safety: 15,
  environment: 10,
  demographics: 5,
};

export const DIMENSION_LABELS: Record<Dimension, string> = {
  economic: "Economic Vitality",
  housing: "Housing Affordability",
  quality_of_life: "Quality of Life",
  safety: "Safety",
  environment: "Environment",
  demographics: "Demographics",
};

export const DIMENSION_ORDER: Dimension[] = [
  "economic",
  "housing",
  "quality_of_life",
  "safety",
  "environment",
  "demographics",
];

// Rich city data for frontend use (joined from multiple tables)
export interface CityRankData {
  cma: CMA;
  score: CMAScore;
  rank: number;
}

export interface MetricWithValue {
  metric: Metric;
  value: MetricValue | null;
  normalizedScore: number | null;
}

export interface DimensionData {
  dimension: Dimension;
  score: number | null;
  metrics: MetricWithValue[];
}

export interface CityProfileData {
  cma: CMA;
  score: CMAScore;
  rank: number;
  dimensions: DimensionData[];
}

// For scoring algorithm input
export interface RawMetricData {
  metricId: string;
  cmaId: string;
  value: number | null;
  isProxy: boolean;
  direction: MetricDirection;
  weightWithinDimension: number;
  dimension: Dimension;
}

export interface ComputedScore {
  cmaId: string;
  economicScore: number | null;
  housingScore: number | null;
  qualityScore: number | null;
  safetyScore: number | null;
  environmentScore: number | null;
  demographicScore: number | null;
  overallScore: number;
  completenessScore: number;
  normalizedValues: Record<string, number | null>; // metricId -> normalized 0-100
}

// Data source info for the /data page
export interface DataSource {
  dimension: Dimension;
  metricName: string;
  sourceName: string;
  tableId: string | null;
  url: string | null;
  updateFrequency: string;
  lastRefresh: string;
  coverage: string;
}
