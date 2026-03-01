import { notFound } from "next/navigation";
import Link from "next/link";
import { getCityProfileData } from "@/lib/computed-scores";
import { CMAS } from "@/lib/data";
import Accordion from "@/components/ui/Accordion";
import { CompletenessBadge } from "@/components/ui/Badge";
import { computeTrend, getAllChartData } from "@/lib/trends";
import TrendBadge from "@/components/charts/TrendBadge";
import CityProfileTabs from "@/components/city/CityProfileTabs";

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
    description: `Prosperity profile for the ${data.cma.name} CMA. Overall score: ${Math.round(data.score.overallScore)}/100. Rank ${data.rank} of 36 Canadian CMAs.`,
    openGraph: {
      title: `${data.cma.name} | CityScore Canada`,
      description: `Ranked #${data.rank} with an overall prosperity score of ${Math.round(data.score.overallScore)}/100.`,
    },
  };
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

function tierColor(score: number | null): string {
  if (score === null) return "text-[#A8A29E]";
  if (score >= 70) return "text-[#2D6A4F]";
  if (score >= 45) return "text-[#D4A843]";
  return "text-[#B85C5C]";
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

  const trend = computeTrend(cma.id);
  const charts = getAllChartData(cma.id);

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
            <div className="mt-2 flex items-center gap-2">
              <CompletenessBadge score={score.completenessScore} />
              {trend && <TrendBadge badge={trend.badge} delta={trend.delta} size="lg" />}
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

      {/* Tabbed Score Breakdown + Historical Trends */}
      <CityProfileTabs
        dimensions={dimensions}
        cma={cma}
        trend={trend}
        charts={charts}
      />

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

