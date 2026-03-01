import Link from "next/link";
import MiniScoreBar from "./MiniScoreBar";
import { DIMENSION_ORDER, DIMENSION_LABELS } from "@/types";
import TrendBadge from "@/components/charts/TrendBadge";

interface CityRowData {
  cmaId: string;
  name: string;
  slug: string;
  provinceAbbr: string;
  rank: number;
  overallScore: number;
  completenessScore: number;
  economicScore: number | null;
  housingScore: number | null;
  qualityScore: number | null;
  safetyScore: number | null;
  environmentScore: number | null;
  demographicScore: number | null;
  trendBadge?: "Rising" | "Falling" | "Stable";
  trendDelta?: number;
}

interface CityRowProps {
  data: CityRowData;
  isHighlighted?: boolean;
}

const dimScoreKey: Record<string, keyof CityRowData> = {
  economic: "economicScore",
  housing: "housingScore",
  quality_of_life: "qualityScore",
  safety: "safetyScore",
  environment: "environmentScore",
  demographics: "demographicScore",
};

function getScoreColor(score: number): string {
  if (score >= 70) return "#2D6A4F";
  if (score >= 45) return "#D4A843";
  return "#B85C5C";
}

function RankBadge({ rank }: { rank: number }) {
  const isFirst = rank === 1;
  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        background: isFirst ? "#C41E3A" : "#F0EDE8",
        fontFamily: "var(--font-jetbrains-mono)",
        fontSize: "13px",
        fontWeight: 700,
        color: isFirst ? "#FFFFFF" : "#78716C",
      }}
    >
      {rank}
    </div>
  );
}

export type { CityRowData };
export default function CityRow({ data, isHighlighted }: CityRowProps) {
  return (
    <Link
      href={`/city/${data.slug}`}
      className="flex items-center gap-4 px-4 sm:px-16 py-4 transition-colors hover:bg-[#F0EDE8] group"
      style={{
        borderBottom: "1px solid #F0EDE8",
        background: isHighlighted ? "rgba(196,30,58,0.03)" : undefined,
      }}
    >
      {/* Rank badge */}
      <RankBadge rank={data.rank} />

      {/* City info */}
      <div className="flex-1 min-w-0">
        <span
          className="block truncate"
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 600,
            fontSize: "16px",
            color: "#1C1917",
          }}
        >
          {data.name}
        </span>
        <span
          className="block"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "12px",
            color: "#A8A29E",
            marginTop: "1px",
          }}
        >
          {data.provinceAbbr}
        </span>
      </div>

      {/* Overall score */}
      <div className="flex-shrink-0 text-center" style={{ minWidth: "48px" }}>
        <span
          className="tabular-nums"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontWeight: 700,
            fontSize: "24px",
            color: getScoreColor(data.overallScore),
          }}
        >
          {Math.round(data.overallScore)}
        </span>
      </div>

      {/* Trend badge (hidden on mobile) */}
      {data.trendBadge && (
        <div className="hidden sm:flex w-20 justify-center flex-shrink-0">
          <TrendBadge badge={data.trendBadge} />
        </div>
      )}

      {/* Dimension mini-bars (hidden on mobile) */}
      <div className="hidden lg:flex items-center gap-3">
        {DIMENSION_ORDER.map((dim) => {
          const key = dimScoreKey[dim] as keyof CityRowData;
          const score = data[key] as number | null;
          return (
            <MiniScoreBar
              key={dim}
              score={score}
              label={DIMENSION_LABELS[dim]}
            />
          );
        })}
      </div>
    </Link>
  );
}
