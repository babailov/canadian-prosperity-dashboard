"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CMA, DIMENSION_ORDER, DIMENSION_LABELS, Dimension } from "@/types";
import { getCityProfileData } from "@/lib/computed-scores";
import { getChartData, CHART_METRICS } from "@/lib/trends";
import ComparisonTrendChart from "@/components/charts/ComparisonTrendChart";

type CityRankData = ReturnType<typeof import("@/lib/computed-scores").getAllCityRankData>[number];

interface ComparisonLayoutProps {
  allData: CityRankData[];
  cmas: CMA[];
}

// Dimension weights for display labels
const DIMENSION_WEIGHTS: Record<Dimension, number> = {
  economic: 25,
  housing: 25,
  quality_of_life: 20,
  safety: 15,
  environment: 10,
  demographics: 5,
};

// Key metrics to display in the Key Metrics section
const KEY_METRIC_IDS = [
  "metric_unemployment_rate",
  "metric_median_income",
  "metric_avg_rent",
  "metric_csi",
  "metric_aqhi",
  "metric_population",
];

function formatRawValue(metricId: string, value: number): string {
  switch (metricId) {
    case "metric_unemployment_rate":
    case "metric_employment_rate":
      return `${value}%`;
    case "metric_median_income":
      return `$${value.toLocaleString("en-CA")}`;
    case "metric_avg_rent":
      return `$${value.toLocaleString("en-CA")}/mo`;
    case "metric_vacancy_rate":
      return `${value}%`;
    case "metric_housing_price_index":
      return `${value}`;
    case "metric_cpi":
      return `${value}`;
    case "metric_pop_growth":
    case "metric_pop_growth_5yr":
      return `${value}%`;
    case "metric_csi":
      return value.toFixed(1);
    case "metric_aqhi":
      return `${value}`;
    case "metric_population":
      return value.toLocaleString("en-CA");
    case "metric_immigration_share":
      return `${value}%`;
    case "metric_median_age":
      return `${value} yrs`;
    default:
      return String(value);
  }
}

function tierColor(score: number | null): string {
  if (score === null) return "#A8A29E";
  if (score >= 70) return "#2D6A4F";
  if (score >= 45) return "#D4A843";
  return "#B85C5C";
}

// For a given metric, determine which city has the "better" value based on direction
function isBetterValue(
  valA: number | null,
  valB: number | null,
  direction: string
): { aBetter: boolean; bBetter: boolean } {
  if (valA === null || valB === null) return { aBetter: false, bBetter: false };
  if (direction === "lower_is_better") {
    return { aBetter: valA < valB, bBetter: valB < valA };
  }
  if (direction === "higher_is_better") {
    return { aBetter: valA > valB, bBetter: valB > valA };
  }
  return { aBetter: false, bBetter: false };
}

export default function ComparisonLayout({ allData, cmas }: ComparisonLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [cityASlug, setCityASlug] = useState(searchParams.get("a") || "toronto");
  const [cityBSlug, setCityBSlug] = useState(searchParams.get("b") || "calgary");

  // Update URL when selections change
  const updateUrl = useCallback(
    (a: string, b: string) => {
      const params = new URLSearchParams();
      params.set("a", a);
      params.set("b", b);
      router.push(`${pathname}?${params.toString()}`, { scroll: false } as Parameters<typeof router.push>[1]);
    },
    [router, pathname]
  );

  function selectCityA(slug: string) {
    setCityASlug(slug);
    updateUrl(slug, cityBSlug);
  }

  function selectCityB(slug: string) {
    setCityBSlug(slug);
    updateUrl(cityASlug, slug);
  }

  function swapCities() {
    setCityASlug(cityBSlug);
    setCityBSlug(cityASlug);
    updateUrl(cityBSlug, cityASlug);
  }

  const dataA = getCityProfileData(cityASlug);
  const dataB = getCityProfileData(cityBSlug);

  const rankA = allData.find((d) => d.cma.slug === cityASlug);
  const rankB = allData.find((d) => d.cma.slug === cityBSlug);

  const scoreA = rankA?.score.overallScore ?? 0;
  const scoreB = rankB?.score.overallScore ?? 0;

  const sortedCmas = [...cmas].sort((a, b) => a.name.localeCompare(b.name));

  if (!dataA || !dataB) {
    return (
      <div style={{ backgroundColor: "#FAFAF7", minHeight: "100vh" }} className="px-4 sm:px-16 py-8">
        <p style={{ color: "#78716C" }}>Select two cities to compare.</p>
      </div>
    );
  }

  // Build a flat map of all metrics for key metrics section
  const allMetricsA = dataA.dimensions.flatMap((d) => d.metrics);
  const allMetricsB = dataB.dimensions.flatMap((d) => d.metrics);

  return (
    <div style={{ backgroundColor: "#FAFAF7", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="px-4 sm:px-16 pt-12 pb-8 text-center">
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "11px",
            fontWeight: 500,
            color: "#A8A29E",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Side-by-Side Comparison
        </p>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.02em",
            marginBottom: "32px",
          }}
        >
          How do they stack up?
        </h1>

        {/* City panels — joined unit */}
        <div
          className="flex items-stretch max-w-3xl mx-auto"
          style={{ position: "relative" }}
        >
          {/* City A panel */}
          <div
            style={{
              flex: 1,
              border: "1px solid #E7E5E0",
              borderRight: "none",
              borderRadius: "16px 0 0 16px",
              padding: "40px 24px",
              backgroundColor: "#FAFAF7",
              textAlign: "center",
            }}
          >
            {/* Dropdown wrapper */}
            <div
              style={{
                border: "1px solid #E7E5E0",
                borderRadius: "8px",
                padding: "8px 20px",
                width: "260px",
                margin: "0 auto 20px auto",
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <select
                value={cityASlug}
                onChange={(e) => selectCityA(e.target.value)}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#1C1917",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  width: "100%",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              >
                {sortedCmas.map((cma) => (
                  <option key={cma.slug} value={cma.slug}>{cma.name}</option>
                ))}
              </select>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#78716C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginLeft: "4px" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(48px, 6vw, 72px)",
                fontWeight: 700,
                lineHeight: 1,
                color: tierColor(Math.round(scoreA)),
                marginBottom: "8px",
              }}
            >
              {Math.round(scoreA)}
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  fontWeight: 700,
                  backgroundColor: (rankA?.rank ?? 0) === 1 ? "#C41E3A" : "#F0EDE8",
                  color: (rankA?.rank ?? 0) === 1 ? "#fff" : "#78716C",
                  borderRadius: "4px",
                  padding: "2px 8px",
                }}
              >
                #{rankA?.rank ?? "—"}
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "#78716C",
                }}
              >
                {dataA.cma.provinceAbbr}
              </span>
            </div>
          </div>

          {/* VS circle — overlapping between panels */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "28px",
              backgroundColor: "#1C1917",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              color: "#FAFAF7",
              flexShrink: 0,
              alignSelf: "center",
              marginLeft: "-28px",
              marginRight: "-28px",
              zIndex: 1,
              position: "relative",
            }}
          >
            vs
          </div>

          {/* City B panel */}
          <div
            style={{
              flex: 1,
              border: "1px solid #E7E5E0",
              borderLeft: "none",
              borderRadius: "0 16px 16px 0",
              padding: "40px 24px",
              backgroundColor: "#FAFAF7",
              textAlign: "center",
            }}
          >
            {/* Dropdown wrapper */}
            <div
              style={{
                border: "1px solid #E7E5E0",
                borderRadius: "8px",
                padding: "8px 20px",
                width: "260px",
                margin: "0 auto 20px auto",
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <select
                value={cityBSlug}
                onChange={(e) => selectCityB(e.target.value)}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#1C1917",
                  backgroundColor: "transparent",
                  border: "none",
                  outline: "none",
                  cursor: "pointer",
                  width: "100%",
                  appearance: "none",
                  WebkitAppearance: "none",
                }}
              >
                {sortedCmas.map((cma) => (
                  <option key={cma.slug} value={cma.slug}>{cma.name}</option>
                ))}
              </select>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#78716C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginLeft: "4px" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(48px, 6vw, 72px)",
                fontWeight: 700,
                lineHeight: 1,
                color: tierColor(Math.round(scoreB)),
                marginBottom: "8px",
              }}
            >
              {Math.round(scoreB)}
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  fontWeight: 700,
                  backgroundColor: (rankB?.rank ?? 0) === 1 ? "#C41E3A" : "#F0EDE8",
                  color: (rankB?.rank ?? 0) === 1 ? "#fff" : "#78716C",
                  borderRadius: "4px",
                  padding: "2px 8px",
                }}
              >
                #{rankB?.rank ?? "—"}
              </span>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "#78716C",
                }}
              >
                {dataB.cma.provinceAbbr}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension Scores Section */}
      <div className="px-4 sm:px-16 pb-10">
        {/* Section header */}
        <div
          style={{
            borderBottom: "1px solid #E7E5E0",
            paddingBottom: "16px",
            marginBottom: "0",
          }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        >
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#1C1917",
              letterSpacing: "-0.01em",
            }}
          >
            Dimension Scores
          </h2>
          {/* City legend */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "2px",
                  backgroundColor: "#2D6A4F",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "#78716C",
                }}
              >
                {dataA.cma.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "2px",
                  backgroundColor: "#D4A843",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "13px",
                  color: "#78716C",
                }}
              >
                {dataB.cma.name}
              </span>
            </div>
          </div>
        </div>

        {/* Dimension flat rows */}
        <div>
          {DIMENSION_ORDER.map((dim) => {
            const dimA = dataA.dimensions.find((d) => d.dimension === dim);
            const dimB = dataB.dimensions.find((d) => d.dimension === dim);
            if (!dimA || !dimB) return null;

            const scoreDA = dimA.score ?? 0;
            const scoreDB = dimB.score ?? 0;
            const delta = scoreDA - scoreDB;

            return (
              <div
                key={dim}
                style={{
                  padding: "28px 0",
                  borderBottom: "1px solid #F0EDE8",
                  display: "flex",
                  alignItems: "center",
                  gap: "0",
                }}
              >
                {/* Left: dimension name + weight */}
                <div style={{ width: "180px", flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "#1C1917",
                      marginBottom: "2px",
                    }}
                  >
                    {DIMENSION_LABELS[dim]}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "12px",
                      color: "#A8A29E",
                    }}
                  >
                    {DIMENSION_WEIGHTS[dim]}% weight
                  </div>
                </div>

                {/* Middle: dual bars */}
                <div style={{ flex: 1, padding: "0 32px" }}>
                  {/* City A bar */}
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}
                  >
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: tierColor(dimA.score),
                        width: "32px",
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {dimA.score !== null ? Math.round(dimA.score) : "—"}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "8px",
                        borderRadius: "4px",
                        backgroundColor: "#F0EDE8",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${dimA.score !== null ? Math.min(dimA.score, 100) : 0}%`,
                          height: "100%",
                          borderRadius: "4px",
                          backgroundColor: tierColor(dimA.score),
                        }}
                      />
                    </div>
                  </div>
                  {/* City B bar */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: tierColor(dimB.score),
                        width: "32px",
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {dimB.score !== null ? Math.round(dimB.score) : "—"}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "8px",
                        borderRadius: "4px",
                        backgroundColor: "#F0EDE8",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${dimB.score !== null ? Math.min(dimB.score, 100) : 0}%`,
                          height: "100%",
                          borderRadius: "4px",
                          backgroundColor: tierColor(dimB.score),
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: delta */}
                <div style={{ width: "72px", textAlign: "center", flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: delta > 0.5 ? "#2D6A4F" : delta < -0.5 ? "#B85C5C" : "#A8A29E",
                    }}
                  >
                    {delta > 0.5 ? "+" : ""}{Math.round(delta) === 0 && Math.abs(delta) < 0.5 ? "=" : Math.round(delta)}
                  </div>
                  <div
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "11px",
                      color: "#A8A29E",
                      marginTop: "2px",
                    }}
                  >
                    delta
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Key Metrics Section */}
        <div style={{ paddingTop: "48px", paddingLeft: "0", paddingRight: "0" }}>
          {/* Key Metrics header */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#1C1917",
                letterSpacing: "-0.01em",
                marginBottom: "4px",
              }}
            >
              Key Metrics
            </h2>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                color: "#78716C",
              }}
            >
              Raw values behind the scores. Better value highlighted.
            </p>
          </div>

          {/* Table header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 0 12px 0",
              borderBottom: "1px solid #E7E5E0",
            }}
          >
            <div
              style={{
                flex: 1,
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                color: "#A8A29E",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Metric
            </div>
            <div
              style={{
                width: "160px",
                textAlign: "right",
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                color: "#A8A29E",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {dataA.cma.name}
            </div>
            <div
              style={{
                width: "160px",
                textAlign: "right",
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 500,
                color: "#A8A29E",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {dataB.cma.name}
            </div>
          </div>

          {/* Metric rows */}
          {KEY_METRIC_IDS.map((metricId) => {
            const mvA = allMetricsA.find((m) => m.metric.id === metricId);
            const mvB = allMetricsB.find((m) => m.metric.id === metricId);
            if (!mvA && !mvB) return null;

            const metric = mvA?.metric ?? mvB?.metric;
            if (!metric) return null;

            const valA = mvA?.value?.value ?? null;
            const valB = mvB?.value?.value ?? null;

            // For population, use CMA populationLatest if metric value missing
            const displayValA =
              metricId === "metric_population" && valA === null
                ? dataA.cma.populationLatest
                : valA;
            const displayValB =
              metricId === "metric_population" && valB === null
                ? dataB.cma.populationLatest
                : valB;

            const { aBetter, bBetter } = isBetterValue(
              displayValA,
              displayValB,
              metric.direction
            );

            return (
              <div
                key={metricId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 0",
                  borderBottom: "1px solid #F0EDE8",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    color: "#78716C",
                  }}
                >
                  {metric.name}
                </div>
                <div
                  style={{
                    width: "160px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "14px",
                    color: aBetter ? "#2D6A4F" : "#78716C",
                    fontWeight: aBetter ? 500 : 400,
                  }}
                >
                  {displayValA !== null ? formatRawValue(metricId, displayValA) : (
                    <span style={{ color: "#D6D3CE", fontStyle: "italic", fontSize: "12px" }}>N/A</span>
                  )}
                </div>
                <div
                  style={{
                    width: "160px",
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "14px",
                    color: bBetter ? "#2D6A4F" : "#78716C",
                    fontWeight: bBetter ? 500 : 400,
                  }}
                >
                  {displayValB !== null ? formatRawValue(metricId, displayValB) : (
                    <span style={{ color: "#D6D3CE", fontStyle: "italic", fontSize: "12px" }}>N/A</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trend Comparison Section */}
        <div style={{ paddingTop: "48px" }}>
          {/* Section header */}
          <div style={{ marginBottom: "24px" }}>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "24px",
                fontWeight: 700,
                color: "#1C1917",
                letterSpacing: "-0.01em",
                marginBottom: "4px",
              }}
            >
              Trend Comparison
            </h2>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                color: "#78716C",
              }}
            >
              How each city&apos;s key indicators have moved over time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHART_METRICS.map((metric) => {
              const chartA = getChartData(dataA.cma.id, metric.id);
              const chartB = getChartData(dataB.cma.id, metric.id);
              if (!chartA || !chartB) return null;
              return (
                <ComparisonTrendChart
                  key={metric.id}
                  label={metric.label}
                  unit={metric.unit}
                  description={metric.description}
                  cityAName={dataA.cma.name}
                  cityBName={dataB.cma.name}
                  cityALine={chartA.cityLine}
                  cityBLine={chartB.cityLine}
                  nationalAvgLine={chartA.nationalAvgLine}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
