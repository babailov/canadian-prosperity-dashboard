import { METRICS } from "@/lib/data";
import { DIMENSION_ORDER, DIMENSION_LABELS, Dimension } from "@/types";

export const metadata = {
  title: "Data Sources",
  description: "Complete list of every data source used in the Canadian City Prosperity Dashboard, grouped by dimension.",
};

const LAST_REFRESH: Record<string, string> = {
  "metric_unemployment_rate": "December 2024",
  "metric_employment_rate": "December 2024",
  "metric_median_income": "September 2022 (2021 data)",
  "metric_avg_rent": "November 2023",
  "metric_vacancy_rate": "November 2023",
  "metric_housing_price_index": "January 2024",
  "metric_cpi": "December 2024",
  "metric_pop_growth": "September 2023",
  "metric_csi": "July 2024",
  "metric_aqhi": "November 2024",
  "metric_population": "September 2023",
  "metric_pop_growth_5yr": "September 2023",
  "metric_immigration_share": "April 2022 (2021 Census)",
  "metric_median_age": "April 2022 (2021 Census)",
};

const COVERAGE: Record<string, string> = {
  "metric_unemployment_rate": "35/35",
  "metric_employment_rate": "35/35",
  "metric_median_income": "35/35",
  "metric_avg_rent": "35/35",
  "metric_vacancy_rate": "35/35",
  "metric_housing_price_index": "35/35",
  "metric_cpi": "35/35",
  "metric_pop_growth": "35/35",
  "metric_csi": "35/35",
  "metric_aqhi": "35/35",
  "metric_population": "35/35",
  "metric_pop_growth_5yr": "35/35",
  "metric_immigration_share": "35/35",
  "metric_median_age": "35/35",
};

const FRESHNESS_MAP: Record<string, { state: "fresh" | "aging" | "stale" | "historical"; label: string }> = {
  "metric_unemployment_rate": { state: "fresh", label: "Fresh" },
  "metric_employment_rate": { state: "fresh", label: "Fresh" },
  "metric_median_income": { state: "historical", label: "Historical" },
  "metric_avg_rent": { state: "aging", label: "Aging" },
  "metric_vacancy_rate": { state: "aging", label: "Aging" },
  "metric_housing_price_index": { state: "aging", label: "Aging" },
  "metric_cpi": { state: "fresh", label: "Fresh" },
  "metric_pop_growth": { state: "aging", label: "Aging" },
  "metric_csi": { state: "aging", label: "Aging" },
  "metric_aqhi": { state: "fresh", label: "Fresh" },
  "metric_population": { state: "aging", label: "Aging" },
  "metric_pop_growth_5yr": { state: "aging", label: "Aging" },
  "metric_immigration_share": { state: "historical", label: "Historical" },
  "metric_median_age": { state: "historical", label: "Historical" },
};

function freshnessColor(state: string): string {
  switch (state) {
    case "fresh": return "#2D6A4F";
    case "aging": return "#D4A843";
    case "stale": return "#B85C5C";
    case "historical": return "#A8A29E";
    default: return "#A8A29E";
  }
}

export default function DataSourcesPage() {
  const totalMetrics = METRICS.filter((m) => m.direction !== "neutral").length;

  return (
    <div style={{ backgroundColor: "#FAFAF7", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="px-4 sm:px-16 pt-12 pb-10">
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: "#C41E3A",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          Transparency
        </div>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            color: "#A8A29E",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          {totalMetrics} metrics from public sources
        </p>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: "16px",
          }}
        >
          Data Sources &amp; Methodology
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "17px",
            color: "#78716C",
            maxWidth: "600px",
            lineHeight: 1.6,
          }}
        >
          Every metric displayed in CityScore Canada is sourced from official public datasets.
          No proprietary data. All sources freely accessible.
        </p>
      </div>

      {/* How Scores Are Calculated — 3 cards */}
      <div className="px-4 sm:px-16 pb-10">
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.01em",
            marginBottom: "16px",
          }}
        >
          How Scores Are Calculated
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: "01",
              title: "Normalize",
              description:
                "Each metric is normalized to a 0–100 score using min-max normalization across all 35 CMAs. Values beyond 3 standard deviations are clipped to prevent outliers from collapsing other scores.",
            },
            {
              step: "02",
              title: "Aggregate",
              description:
                "Dimension scores are the unweighted average of constituent metric scores. If a metric is unavailable for a CMA, it is excluded from that dimension average.",
            },
            {
              step: "03",
              title: "Weight",
              description:
                "The overall score is the weighted average of all dimension scores. Default weights: Economic 25%, Housing 25%, Quality of Life 20%, Safety 15%, Environment 10%, Demographics 5%.",
            },
          ].map((card) => (
            <div
              key={card.step}
              style={{
                backgroundColor: "#F0EDE8",
                borderRadius: "12px",
                padding: "28px",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "32px",
                  fontWeight: 700,
                  color: "#C41E3A",
                  marginBottom: "8px",
                  lineHeight: 1,
                }}
              >
                {card.step}
              </div>
              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#1C1917",
                  marginBottom: "10px",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  color: "#78716C",
                  lineHeight: 1.6,
                }}
              >
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Freshness Legend */}
      <div className="px-4 sm:px-16 pb-10">
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.01em",
            marginBottom: "16px",
          }}
        >
          Data Freshness
        </h2>
        <div className="flex flex-wrap gap-6">
          {[
            { state: "fresh", label: "Fresh", range: "Within 60 days", color: "#2D6A4F" },
            { state: "aging", label: "Aging", range: "61–365 days old", color: "#D4A843" },
            { state: "stale", label: "Stale", range: "Older than 365 days", color: "#B85C5C" },
            { state: "historical", label: "Historical", range: "Census data (5-year cycle)", color: "#A8A29E" },
          ].map((item) => (
            <div key={item.state} className="flex items-center gap-3">
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: item.color,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              <div>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#1C1917",
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "#A8A29E",
                    marginLeft: "6px",
                  }}
                >
                  — {item.range}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            color: "#A8A29E",
            marginTop: "12px",
          }}
        >
          Freshness is derived from the source publication date, not when CityScore Canada collected the data.
          Stale data is still shown but clearly marked — it is never silently omitted.
        </p>
      </div>

      {/* Sources by Metric — flat table per dimension */}
      <div className="px-4 sm:px-16 pb-12">
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.01em",
            marginBottom: "20px",
          }}
        >
          Sources by Metric
        </h2>

        {DIMENSION_ORDER.map((dim) => {
          const dimMetrics = METRICS.filter((m) => m.dimension === dim);
          return (
            <div key={dim} style={{ marginBottom: "32px" }}>
              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1C1917",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {DIMENSION_LABELS[dim]}
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "#A8A29E",
                  }}
                >
                  ({dimMetrics.length} metric{dimMetrics.length !== 1 ? "s" : ""})
                </span>
              </h3>
              <div
                style={{
                  border: "1px solid #E7E5E0",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E7E5E0", backgroundColor: "#F0EDE8" }}>
                      <th
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#A8A29E",
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          textAlign: "left",
                          padding: "10px 16px",
                          width: "220px",
                        }}
                      >
                        Metric
                      </th>
                      <th
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#A8A29E",
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          textAlign: "left",
                          padding: "10px 16px",
                        }}
                      >
                        Source
                      </th>
                      <th
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#A8A29E",
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          textAlign: "left",
                          padding: "10px 16px",
                          width: "100px",
                        }}
                        className="hidden md:table-cell"
                      >
                        Frequency
                      </th>
                      <th
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#A8A29E",
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          textAlign: "left",
                          padding: "10px 16px",
                          width: "100px",
                        }}
                        className="hidden lg:table-cell"
                      >
                        Freshness
                      </th>
                      <th
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#A8A29E",
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                          textAlign: "left",
                          padding: "10px 16px",
                          width: "80px",
                        }}
                        className="hidden lg:table-cell"
                      >
                        Coverage
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dimMetrics.map((metric, idx) => {
                      const freshnessData = FRESHNESS_MAP[metric.id];
                      const fColor = freshnessData ? freshnessColor(freshnessData.state) : "#A8A29E";
                      return (
                        <tr
                          key={metric.id}
                          style={{
                            borderBottom: idx < dimMetrics.length - 1 ? "1px solid #F0EDE8" : "none",
                            backgroundColor: "#fff",
                          }}
                        >
                          <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                            <div
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#1C1917",
                              }}
                            >
                              {metric.name}
                            </div>
                            <div
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontSize: "12px",
                                color: "#A8A29E",
                                marginTop: "2px",
                              }}
                            >
                              {metric.direction === "neutral"
                                ? "Display only"
                                : metric.direction === "higher_is_better"
                                ? "Higher is better"
                                : "Lower is better"}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                            <div
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontSize: "14px",
                                color: "#1C1917",
                              }}
                            >
                              {metric.sourceName}
                            </div>
                            {metric.sourceTable && (
                              <div
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: "11px",
                                  color: "#A8A29E",
                                  marginTop: "2px",
                                }}
                              >
                                {metric.sourceTable}
                              </div>
                            )}
                            {metric.sourceUrl && (
                              <a
                                href={metric.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  fontFamily: "Inter, sans-serif",
                                  fontSize: "12px",
                                  color: "#C41E3A",
                                  textDecoration: "none",
                                }}
                              >
                                Open dataset ↗
                              </a>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              verticalAlign: "top",
                              fontFamily: "Inter, sans-serif",
                              fontSize: "13px",
                              color: "#78716C",
                            }}
                            className="hidden md:table-cell"
                          >
                            {metric.updateFrequency}
                          </td>
                          <td
                            style={{ padding: "12px 16px", verticalAlign: "top" }}
                            className="hidden lg:table-cell"
                          >
                            {freshnessData && (
                              <div className="flex items-center gap-1.5">
                                <span
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    backgroundColor: fColor,
                                    display: "inline-block",
                                    flexShrink: 0,
                                  }}
                                />
                                <span
                                  style={{
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "13px",
                                    color: fColor,
                                  }}
                                >
                                  {freshnessData.label}
                                </span>
                              </div>
                            )}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              verticalAlign: "top",
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "13px",
                              color: "#78716C",
                            }}
                            className="hidden lg:table-cell"
                          >
                            {COVERAGE[metric.id] ?? "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
