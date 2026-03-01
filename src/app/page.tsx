import { getAllCityRankData } from "@/lib/computed-scores";
import RankingTable from "@/components/rankings/RankingTable";
import MoversAndShakers from "@/components/rankings/MoversAndShakers";
import { getMoversAndShakers, getAllTrends } from "@/lib/trends";

export const metadata = {
  title: "Canadian City Prosperity Rankings",
  description:
    "Rank all 36 Canadian Census Metropolitan Areas by prosperity score. Compare economic vitality, housing affordability, safety, quality of life, environment, and demographics.",
};

export default function HomePage() {
  const allData = getAllCityRankData();
  const movers = getMoversAndShakers();
  const trends = getAllTrends();

  const rows = allData.map((d) => {
    const trend = trends[d.cma.id];
    return {
      cmaId: d.cma.id,
      name: d.cma.name,
      slug: d.cma.slug,
      provinceAbbr: d.cma.provinceAbbr,
      economicScore: d.score.economicScore,
      housingScore: d.score.housingScore,
      qualityScore: d.score.qualityScore,
      safetyScore: d.score.safetyScore,
      environmentScore: d.score.environmentScore,
      demographicScore: d.score.demographicScore,
      defaultOverallScore: d.score.overallScore,
      completenessScore: d.score.completenessScore,
      trendBadge: trend?.badge ?? ("Stable" as const),
      trendDelta: trend?.delta ?? 0,
    };
  });

  return (
    <div className="px-4 sm:px-16 py-12">
      {/* Editorial hero */}
      <div className="mb-10">
        {/* Tagline row */}
        <div className="flex items-center gap-2 mb-5">
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#C41E3A",
            }}
          >
            2026 Edition
          </span>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#D6D3CE", display: "inline-block" }} />
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#78716C",
            }}
          >
            36 Metropolitan Areas
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 700,
            fontSize: "56px",
            color: "#1C1917",
            letterSpacing: "-0.03em",
            lineHeight: "60px",
            marginBottom: "20px",
          }}
        >
          Where Canada Thrives
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "18px",
            color: "#78716C",
            lineHeight: "28px",
            maxWidth: "800px",
          }}
        >
          Ranking every Census Metropolitan Area across economics, housing, safety, environment, and quality of life. Adjust the weights to match what matters to you.
        </p>
      </div>

      {/* Movers & Shakers */}
      <MoversAndShakers cards={movers} />

      {/* Ranking table (client component — handles interactive sorting + weights) */}
      <RankingTable rows={rows} dataRefreshDate="November 2024" />
    </div>
  );
}
