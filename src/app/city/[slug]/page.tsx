import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityProfileData } from "@/lib/computed-scores";
import { CMAS } from "@/lib/data";
import {
  DIMENSION_LABELS,
  DIMENSION_ORDER,
  Dimension,
} from "@/types";
import ScoreBar, { scoreColor } from "@/components/ui/ScoreBar";
import Badge from "@/components/ui/Badge";
import FreshnessBadge from "@/components/city/FreshnessBadge";
import Accordion from "@/components/ui/Accordion";
import { CompletenessBadge } from "@/components/ui/Badge";

export async function generateStaticParams() {
  return CMAS.map((cma) => ({ slug: cma.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getCityProfileData(slug);
  if (!data) return {};
  return {
    title: `${data.cma.name} — City Profile`,
    description: `Prosperity profile for the ${data.cma.name} CMA. Overall score: ${Math.round(data.score.overallScore)}/100. Rank ${data.rank} of 35 Canadian CMAs.`,
    openGraph: {
      title: `${data.cma.name} | CityScore Canada`,
      description: `Ranked #${data.rank} with an overall prosperity score of ${Math.round(data.score.overallScore)}/100.`,
    },
  };
}

const CENSUS_METRICS = new Set([
  "metric_median_income",
  "metric_immigration_share",
  "metric_median_age",
]);

function isCensusMetric(metricId: string) {
  return CENSUS_METRICS.has(metricId);
}

const STAT_CARD_METRICS = [
  { metricId: "metric_unemployment_rate", label: "Unemployment Rate", unit: "%", lower: true },
  { metricId: "metric_avg_rent", label: "Avg 2BR Rent", unit: "", prefix: "$", lower: true },
  { metricId: "metric_csi", label: "Crime Severity Index", unit: "", lower: true },
  { metricId: "metric_population", label: "Population", unit: "", format: "number" },
];

function formatValue(value: number | null, unit: string, prefix = "", format = ""): string {
  if (value === null) return "N/A";
  if (format === "number") {
    return prefix + value.toLocaleString("en-CA");
  }
  return `${prefix}${value.toLocaleString("en-CA")}${unit}`;
}

function dimScoreField(dim: Dimension) {
  const map: Record<Dimension, string> = {
    economic: "economicScore",
    housing: "housingScore",
    quality_of_life: "qualityScore",
    safety: "safetyScore",
    environment: "environmentScore",
    demographics: "demographicScore",
  };
  return map[dim];
}

function tierColor(score: number | null): string {
  if (score === null) return "text-[#A8A29E]";
  if (score >= 70) return "text-[#2D6A4F]";
  if (score >= 45) return "text-[#D4A843]";
  return "text-[#B85C5C]";
}

function tierBarColor(score: number | null): string {
  if (score === null) return "bg-[#E7E5E0]";
  if (score >= 70) return "bg-[#2D6A4F]";
  if (score >= 45) return "bg-[#D4A843]";
  return "bg-[#B85C5C]";
}

function statContextColor(isLower: boolean, value: number | null, thresholdGood: number, thresholdBad: number): string {
  if (value === null) return "text-[#A8A29E]";
  if (isLower) {
    return value <= thresholdGood ? "text-[#2D6A4F]" : value <= thresholdBad ? "text-[#D4A843]" : "text-[#B85C5C]";
  }
  return value >= thresholdGood ? "text-[#2D6A4F]" : value >= thresholdBad ? "text-[#D4A843]" : "text-[#B85C5C]";
}

export default async function CityProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getCityProfileData(slug);
  if (!data) notFound();

  const { cma, score, rank, dimensions } = data;

  // Build stat cards data
  const statValues = STAT_CARD_METRICS.map((card) => {
    const dim = dimensions.flatMap((d) => d.metrics).find(
      (m) => m.metric.id === card.metricId
    );
    const value = dim?.value?.value ?? null;
    return { ...card, value };
  });

  const overallPct = Math.round(score.overallScore);

  return (
    <div style={{ backgroundColor: "#FAFAF7", minHeight: "100vh" }}>
      {/* Breadcrumb */}
      <div className="px-4 sm:px-16 pt-6 pb-0">
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#A8A29E" }}
            className="hover:text-[#1C1917] transition-colors"
          >
            Rankings
          </Link>
          <span style={{ color: "#D6D3CE", fontSize: "13px" }}>/</span>
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", fontWeight: 500, color: "#1C1917" }}>
            {cma.name}
          </span>
        </nav>
      </div>

      {/* City Hero Section */}
      <div className="px-4 sm:px-16 pt-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          {/* Left: name + metadata */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "clamp(36px, 5vw, 52px)",
                  fontWeight: 700,
                  color: "#1C1917",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.1,
                }}
              >
                {cma.name}
              </h1>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "14px",
                  fontWeight: 700,
                  backgroundColor: "#C41E3A",
                  color: "#fff",
                  borderRadius: "6px",
                  padding: "2px 10px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                #{rank}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 500, color: "#78716C" }}>
                {cma.province}
              </span>
              <span style={{ color: "#D6D3CE" }}>&bull;</span>
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#A8A29E" }}>
                Census Metropolitan Area
              </span>
              {cma.populationLatest && (
                <>
                  <span style={{ color: "#D6D3CE" }}>&bull;</span>
                  <span style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#A8A29E" }}>
                    Pop. {cma.populationLatest.toLocaleString("en-CA")}
                  </span>
                </>
              )}
            </div>
            {cma.cmaBoundaryNote && (
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#A8A29E", marginTop: "8px" }}>
                {cma.cmaBoundaryNote}
              </p>
            )}
          </div>

          {/* Right: big overall score */}
          <div className="flex flex-col items-start sm:items-end">
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "clamp(48px, 7vw, 64px)",
                fontWeight: 700,
                lineHeight: 1,
              }}
              className={tierColor(overallPct)}
            >
              {overallPct}
            </div>
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "12px",
                fontWeight: 500,
                color: "#A8A29E",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: "4px",
              }}
            >
              Overall Score
            </div>
            <div className="mt-2">
              <CompletenessBadge score={score.completenessScore} />
            </div>
          </div>
        </div>

        {/* Key Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
          {statValues.map((card) => (
            <div
              key={card.metricId}
              style={{
                border: "1px solid #E7E5E0",
                borderRadius: "12px",
                padding: "24px",
                backgroundColor: "#fff",
              }}
            >
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#A8A29E",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#1C1917",
                  lineHeight: 1,
                }}
              >
                {formatValue(card.value, card.unit, card.prefix ?? "", card.format ?? "")}
              </div>
              {card.lower && card.value !== null && (
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "#A8A29E",
                    marginTop: "6px",
                  }}
                >
                  lower is better
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Score Breakdown Section */}
      <div className="px-4 sm:px-16 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
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
                  {scoredMetrics.map(({ metric, value, normalizedScore }) => {
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
                            }}
                          >
                            {metric.name}
                            {value?.isProxy && (
                              <span style={{ color: "#D4A843", fontSize: "11px", marginLeft: "4px" }}>(est.)</span>
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
      </div>

      {/* Data Sources CTA Band */}
      <div
        style={{
          backgroundColor: "#F0EDE8",
          padding: "40px 64px",
        }}
        className="px-4 sm:px-16"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "18px",
                fontWeight: 600,
                color: "#1C1917",
              }}
            >
              All data is open and auditable
            </p>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "14px",
                color: "#78716C",
                marginTop: "4px",
              }}
            >
              Every metric links back to its original Statistics Canada, CMHC, or ECCC source table.
            </p>
          </div>
          <Link
            href="/data"
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1C1917",
              border: "1px solid #1C1917",
              borderRadius: "8px",
              padding: "10px 20px",
              whiteSpace: "nowrap",
              flexShrink: 0,
              display: "inline-block",
              textDecoration: "none",
            }}
            className="hover:bg-[#1C1917] hover:text-white transition-colors"
          >
            View Data Sources →
          </Link>
        </div>
      </div>

      {/* Data sources accordion */}
      <div className="px-4 sm:px-16 py-8">
        <Accordion title="Data Sources for this profile">
          <div className="space-y-2">
            {dimensions
              .flatMap((d) => d.metrics)
              .filter((m) => m.metric.sourceTable || m.metric.sourceUrl)
              .map(({ metric }) => (
                <div key={metric.id} className="flex items-start gap-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <span style={{ fontWeight: 500, color: "#1C1917" }}>{metric.name}</span>
                    <span style={{ color: "#A8A29E", margin: "0 4px" }}>—</span>
                    <span style={{ color: "#78716C" }}>{metric.sourceName}</span>
                    {metric.sourceTable && (
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "12px",
                          color: "#A8A29E",
                          marginLeft: "4px",
                        }}
                      >
                        ({metric.sourceTable})
                      </span>
                    )}
                  </div>
                  {metric.sourceUrl && (
                    <a
                      href={metric.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "12px", color: "#C41E3A", flexShrink: 0 }}
                      className="hover:opacity-70"
                    >
                      View ↗
                    </a>
                  )}
                </div>
              ))}
          </div>
        </Accordion>
      </div>
    </div>
  );
}

/**
 * Format raw metric values for display.
 */
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
