"use client";

import { useState } from "react";
import Link from "next/link";
import { CMA, DimensionData, DIMENSION_LABELS } from "@/types";
import { TrendInfo, ChartData } from "@/lib/trends";
import FreshnessBadge from "@/components/city/FreshnessBadge";
import TrendBadge from "@/components/charts/TrendBadge";
import TrendChart from "@/components/charts/TrendChart";
import ProfileTabs, { ProfileTabKey } from "@/components/city/ProfileTabs";

// ── Helpers (moved from page.tsx for use in the client component) ─────────────

const CENSUS_METRICS = new Set([
  "metric_median_income",
  "metric_immigration_share",
  "metric_median_age",
]);

function isCensusMetric(metricId: string) {
  return CENSUS_METRICS.has(metricId);
}

function tierColor(score: number | null): string {
  if (score === null) return "text-[#A8A29E]";
  if (score >= 70) return "text-[#2D6A4F]";
  if (score >= 45) return "text-[#D4A843]";
  return "text-[#B85C5C]";
}

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
      return `${value} (2016=100)`;
    case "metric_cpi":
      return `${value} (2002=100)`;
    case "metric_pop_growth":
    case "metric_pop_growth_5yr":
      return `${value}%`;
    case "metric_avg_home_price": {
      if (value >= 1_000_000) {
        return `$${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
      }
      return `$${Math.round(value / 1000)}K`;
    }
    case "metric_csi":
      return value.toFixed(1);
    case "metric_aqhi":
      return `${value} (30-day avg)`;
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

// ── Props ─────────────────────────────────────────────────────────────────────

interface CityProfileTabsProps {
  dimensions: DimensionData[];
  cma: CMA;
  trend: TrendInfo | null;
  charts: ChartData[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CityProfileTabs({
  dimensions,
  cma,
  trend,
  charts,
}: CityProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("breakdown");

  return (
    <div className="px-4 sm:px-16 pb-10">
      {/* Tab bar + Compare link */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />
        <Link
          href={`/compare?a=${cma.slug}`}
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            backgroundColor: "#1C1917",
            color: "#fff",
            borderRadius: "8px",
            padding: "10px 20px",
            whiteSpace: "nowrap",
            flexShrink: 0,
            display: "inline-block",
            textDecoration: "none",
          }}
        >
          Compare with another city
        </Link>
      </div>

      {/* Score Breakdown tab */}
      {activeTab === "breakdown" && (
        <>
          <div className="mb-6">
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "28px",
                fontWeight: 700,
                color: "#1C1917",
                letterSpacing: "-0.02em",
              }}
            >
              Score Breakdown
            </h2>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                color: "#78716C",
                marginTop: "4px",
              }}
            >
              How {cma.name} performs across all six dimensions
            </p>
          </div>

          {/* 2-column dimension cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dimensions.map((dim) => {
              const dimScore = dim.score;
              const scoredMetrics = dim.metrics.filter(
                (m) => m.metric.direction !== "neutral"
              );

              return (
                <div
                  key={dim.dimension}
                  style={{
                    border: "1px solid #E7E5E0",
                    borderRadius: "12px",
                    padding: "28px",
                    backgroundColor: "#fff",
                  }}
                >
                  {/* Dimension header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: "18px",
                        fontWeight: 600,
                        color: "#1C1917",
                      }}
                    >
                      {DIMENSION_LABELS[dim.dimension]}
                    </h3>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "28px",
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                      className={tierColor(dimScore)}
                    >
                      {dimScore !== null ? Math.round(dimScore) : "—"}
                    </span>
                  </div>

                  {/* Score bar */}
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      borderRadius: "3px",
                      backgroundColor: "#F0EDE8",
                      overflow: "hidden",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: `${dimScore !== null ? Math.min(dimScore, 100) : 0}%`,
                        height: "100%",
                        borderRadius: "3px",
                        backgroundColor:
                          dimScore === null
                            ? "#E7E5E0"
                            : dimScore >= 70
                            ? "#2D6A4F"
                            : dimScore >= 45
                            ? "#D4A843"
                            : "#B85C5C",
                      }}
                    />
                  </div>

                  {/* Metrics rows */}
                  <div className="space-y-3">
                    {scoredMetrics.map(({ metric, value, normalizedScore: _normalizedScore }) => {
                      const isAvailable = value?.value !== null && value !== null;
                      const isCensus = isCensusMetric(metric.id);

                      return (
                        <div key={metric.id}>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontSize: "14px",
                                color: "#78716C",
                                flex: 1,
                                minWidth: 0,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                flexWrap: "wrap",
                              }}
                            >
                              {metric.name}
                              {metric.description && (
                                <span className="tooltip-wrapper" style={{ display: "inline-flex", alignItems: "center" }}>
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{ color: "#78716C", flexShrink: 0, cursor: "default" }}
                                  >
                                    <circle cx="8" cy="8" r="7.5" stroke="currentColor" />
                                    <path d="M8 7v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
                                    <circle cx="8" cy="4.5" fill="currentColor" r="0.75" />
                                  </svg>
                                  <div className="tooltip-content">
                                    {metric.description}
                                  </div>
                                </span>
                              )}
                              {value?.isProxy && (
                                <span style={{ color: "#D4A843", fontSize: "11px" }}>(est.)</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {isAvailable && (
                                <span
                                  style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: "13px",
                                    color: "#1C1917",
                                  }}
                                >
                                  {formatRawValue(metric.id, value!.value!)}
                                </span>
                              )}
                              <FreshnessBadge
                                sourcePublicationDate={value?.sourcePublicationDate ?? null}
                                sourceTableId={value?.sourceTableId ?? null}
                                updateFrequency={metric.updateFrequency}
                                isCensus={isCensus}
                                period={isCensus ? value?.period : undefined}
                              />
                            </div>
                          </div>
                          {!isAvailable && (
                            <div
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontSize: "13px",
                                color: "#A8A29E",
                                fontStyle: "italic",
                              }}
                            >
                              Not available
                            </div>
                          )}
                          {value?.proxyNote && (
                            <p
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontSize: "11px",
                                color: "#D4A843",
                                marginTop: "2px",
                              }}
                            >
                              {value.proxyNote}
                            </p>
                          )}
                          {metric.sourceUrl && (
                            <a
                              href={metric.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontSize: "11px",
                                color: "#C41E3A",
                              }}
                              className="hover:opacity-70 transition-opacity"
                            >
                              {metric.sourceName} ↗
                            </a>
                          )}
                        </div>
                      );
                    })}
                    {/* Neutral/display-only metrics */}
                    {dim.metrics
                      .filter((m) => m.metric.direction === "neutral")
                      .map(({ metric, value }) => (
                        <div
                          key={metric.id}
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: "13px",
                            color: "#A8A29E",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>{metric.name}:</span>{" "}
                          {value?.value !== null && value?.value !== undefined
                            ? formatRawValue(metric.id, value.value)
                            : "N/A"}
                          {isCensusMetric(metric.id) && (
                            <span style={{ fontSize: "11px", marginLeft: "4px" }}>(2021 Census)</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Historical Trends tab */}
      {activeTab === "trends" && charts.length > 0 && (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#1C1917",
                  letterSpacing: "-0.02em",
                }}
              >
                Historical Trends
              </h2>
              {trend && <TrendBadge badge={trend.badge} delta={trend.delta} />}
            </div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                color: "#78716C",
                marginTop: "4px",
              }}
            >
              Year-over-year metric performance for {cma.name}
              {trend?.leadingPhrase && (
                <span> — {trend.leadingPhrase}</span>
              )}
            </p>
          </div>
          {(() => {
            // Render charts in pairs (2-col grid). If there's an odd chart at the
            // end, render it full-width below the grid.
            const paired = charts.length % 2 === 0 ? charts : charts.slice(0, -1);
            const orphan = charts.length % 2 !== 0 ? charts[charts.length - 1] : null;
            return (
              <>
                {paired.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {paired.map((chart) => (
                      <TrendChart
                        key={chart.metricId}
                        label={chart.label}
                        unit={chart.unit}
                        description={chart.description}
                        cityName={cma.name}
                        cityLine={chart.cityLine}
                        nationalAvgLine={chart.nationalAvgLine}
                      />
                    ))}
                  </div>
                )}
                {orphan && (
                  <div className="mt-4">
                    <TrendChart
                      label={orphan.label}
                      unit={orphan.unit}
                      description={orphan.description}
                      cityName={cma.name}
                      cityLine={orphan.cityLine}
                      nationalAvgLine={orphan.nationalAvgLine}
                    />
                  </div>
                )}
              </>
            );
          })()}
        </>
      )}

      {/* Historical Trends tab — no data state */}
      {activeTab === "trends" && charts.length === 0 && (
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            color: "#A8A29E",
            padding: "40px 0",
          }}
        >
          No historical trend data available for {cma.name}.
        </div>
      )}
    </div>
  );
}
