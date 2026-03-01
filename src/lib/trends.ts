/**
 * Build-time trend computation — compares recent vs year-ago metric values
 * to produce Rising/Falling/Stable badges, chart data, and Movers & Shakers.
 */

import { HISTORY, getMetricHistory } from "./history-data";
import { CMAS } from "./data";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TrendInfo {
  badge: "Rising" | "Falling" | "Stable";
  delta: number;
  leadingMetricId: string | null;
  leadingPhrase: string | null;
}

export interface ChartSeries {
  period: string;
  value: number;
}

export interface ChartData {
  metricId: string;
  label: string;
  unit: string;
  description: string | null;
  cityLine: ChartSeries[];
  nationalAvgLine: ChartSeries[];
}

export interface MoverCard {
  cmaName: string;
  cmaSlug: string;
  provinceAbbr: string;
  delta: number;
  narrative: string;
  type: "riser" | "faller" | "stable";
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const CHART_METRICS = [
  { id: "metric_unemployment_rate", label: "Unemployment Rate", unit: "%", description: null },
  { id: "metric_employment_rate", label: "Employment Rate", unit: "%", description: null },
  { id: "metric_cpi", label: "Consumer Price Index", unit: "", description: "Measures inflation since 2002 (base = 100), not cost of living. Higher = faster price increases." },
  { id: "metric_housing_price_index", label: "New Housing Price Index", unit: "", description: "Measures price change since Dec 2016 (base = 100), not absolute prices. A value of 108 means prices rose 8% since 2016." },
  { id: "metric_csi", label: "Crime Severity Index", unit: "", description: "Weighted crime index where serious crimes count more. Canada-wide base = 100 in 2006." },
  { id: "metric_avg_rent", label: "Average Monthly Rent (2BR)", unit: "", description: null },
];

// Annual metrics only have a few data points — use a lower minimum threshold
const ANNUAL_METRICS = new Set(["metric_avg_rent", "metric_csi", "metric_population"]);

const METRIC_DIRECTION: Record<string, "higher_is_better" | "lower_is_better"> = {
  metric_unemployment_rate: "lower_is_better",
  metric_employment_rate: "higher_is_better",
  metric_cpi: "lower_is_better",
  metric_housing_price_index: "lower_is_better",
};

const METRIC_WEIGHTS: Record<string, number> = {
  metric_unemployment_rate: 0.25,
  metric_employment_rate: 0.25,
  metric_cpi: 0.20,
  metric_housing_price_index: 0.30,
};

function getDirectionPhrase(metricId: string, isImproving: boolean): string {
  const phrases: Record<string, [string, string]> = {
    metric_unemployment_rate: ["unemployment down", "unemployment up"],
    metric_employment_rate: ["employment rising", "employment declining"],
    metric_cpi: ["inflation easing", "inflation pressure"],
    metric_housing_price_index: ["housing prices softening", "housing prices rising"],
    metric_csi: ["crime severity declining", "crime severity increasing"],
  };
  return phrases[metricId]?.[isImproving ? 0 : 1] ?? "";
}

// ── Trend Computation ─────────────────────────────────────────────────────────

export function computeTrend(cmaId: string): TrendInfo {
  let totalDelta = 0;
  let totalWeight = 0;
  let maxAbsChange = 0;
  let leadingMetricId: string | null = null;
  let leadingIsImproving = true;

  for (const [metricId, weight] of Object.entries(METRIC_WEIGHTS)) {
    const history = getMetricHistory(metricId, cmaId);
    if (history.length < 13) continue;

    const current = history[history.length - 1].value;
    const yearAgo = history[history.length - 13].value;
    if (yearAgo === 0) continue;

    const pctChange = ((current - yearAgo) / Math.abs(yearAgo)) * 100;
    const direction = METRIC_DIRECTION[metricId];
    const directedChange = direction === "higher_is_better" ? pctChange : -pctChange;

    totalDelta += directedChange * weight;
    totalWeight += weight;

    if (Math.abs(directedChange * weight) > maxAbsChange) {
      maxAbsChange = Math.abs(directedChange * weight);
      leadingMetricId = metricId;
      leadingIsImproving = directedChange > 0;
    }
  }

  if (totalWeight === 0) {
    return { badge: "Stable", delta: 0, leadingMetricId: null, leadingPhrase: null };
  }

  const normalizedDelta = totalDelta / totalWeight;
  const badge: TrendInfo["badge"] =
    normalizedDelta >= 1.5 ? "Rising" : normalizedDelta <= -1.5 ? "Falling" : "Stable";

  return {
    badge,
    delta: Math.round(normalizedDelta * 10) / 10,
    leadingMetricId,
    leadingPhrase: leadingMetricId
      ? getDirectionPhrase(leadingMetricId, leadingIsImproving)
      : null,
  };
}

// ── Chart Data ────────────────────────────────────────────────────────────────

export function getChartData(cmaId: string, metricId: string): ChartData | null {
  const meta = CHART_METRICS.find((m) => m.id === metricId);
  if (!meta) return null;

  const cityHistory = getMetricHistory(metricId, cmaId);
  // Annual metrics have fewer data points — require at least 2; monthly require at least 3
  const minPoints = ANNUAL_METRICS.has(metricId) ? 2 : 3;
  if (cityHistory.length < minPoints) return null;

  const cityLine: ChartSeries[] = cityHistory.map((p) => ({
    period: p.period,
    value: p.value,
  }));

  const periods = [...new Set(cityHistory.map((p) => p.period))].sort();
  const nationalAvgLine: ChartSeries[] = periods.map((period) => {
    const allValues = HISTORY
      .filter((p) => p.metricId === metricId && p.period === period)
      .map((p) => p.value);
    const avg =
      allValues.length > 0
        ? allValues.reduce((a, b) => a + b, 0) / allValues.length
        : 0;
    return { period, value: Math.round(avg * 100) / 100 };
  });

  return { metricId: meta.id, label: meta.label, unit: meta.unit, description: meta.description, cityLine, nationalAvgLine };
}

export function getAllChartData(cmaId: string): ChartData[] {
  return CHART_METRICS.map((m) => getChartData(cmaId, m.id)).filter(
    (d): d is ChartData => d !== null,
  );
}

// ── Movers & Shakers ──────────────────────────────────────────────────────────

export function getMoversAndShakers(): MoverCard[] {
  const trends = CMAS.map((cma) => ({ cma, trend: computeTrend(cma.id) }));
  const sorted = [...trends].sort((a, b) => b.trend.delta - a.trend.delta);

  const riser = sorted[0];
  const faller = sorted[sorted.length - 1];
  const stable = [...trends].sort(
    (a, b) => Math.abs(a.trend.delta) - Math.abs(b.trend.delta),
  )[0];

  const cards: MoverCard[] = [];

  if (riser && riser.trend.delta > 0) {
    cards.push({
      cmaName: riser.cma.name,
      cmaSlug: riser.cma.slug,
      provinceAbbr: riser.cma.provinceAbbr,
      delta: riser.trend.delta,
      narrative: `${riser.cma.name}'s metrics improved ${Math.abs(riser.trend.delta).toFixed(1)}% year-over-year, driven by ${riser.trend.leadingPhrase ?? "broad improvement"}.`,
      type: "riser",
    });
  }

  if (faller && faller.trend.delta < 0) {
    cards.push({
      cmaName: faller.cma.name,
      cmaSlug: faller.cma.slug,
      provinceAbbr: faller.cma.provinceAbbr,
      delta: faller.trend.delta,
      narrative: `${faller.cma.name}'s metrics declined ${Math.abs(faller.trend.delta).toFixed(1)}% year-over-year, with ${faller.trend.leadingPhrase ?? "broad decline"}.`,
      type: "faller",
    });
  }

  if (stable) {
    cards.push({
      cmaName: stable.cma.name,
      cmaSlug: stable.cma.slug,
      provinceAbbr: stable.cma.provinceAbbr,
      delta: stable.trend.delta,
      narrative: `${stable.cma.name}'s metrics held steady year-over-year, with ${stable.trend.leadingPhrase ?? "minimal movement across all indicators"}.`,
      type: "stable",
    });
  }

  return cards;
}

// ── All Trends (for ranking table) ────────────────────────────────────────────

export function getAllTrends(): Record<string, TrendInfo> {
  const result: Record<string, TrendInfo> = {};
  for (const cma of CMAS) {
    result[cma.id] = computeTrend(cma.id);
  }
  return result;
}
