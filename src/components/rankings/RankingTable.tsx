"use client";

import { useState, useMemo } from "react";
import DimensionTabs, { SortKey } from "./DimensionTabs";
import WeightPanel from "./WeightPanel";
import CityRow, { CityRowData } from "./CityRow";
import CMAExplainer from "./CMAExplainer";
import { DimensionWeights, DEFAULT_WEIGHTS, Dimension } from "@/types";
import { recomputeWithWeights } from "@/lib/scoring";

interface ScoreRow {
  cmaId: string;
  name: string;
  slug: string;
  provinceAbbr: string;
  economicScore: number | null;
  housingScore: number | null;
  qualityScore: number | null;
  safetyScore: number | null;
  environmentScore: number | null;
  demographicScore: number | null;
  defaultOverallScore: number;
  completenessScore: number;
}

interface RankingTableProps {
  rows: ScoreRow[];
  dataRefreshDate: string;
}

const dimScoreField: Record<Dimension, keyof ScoreRow> = {
  economic: "economicScore",
  housing: "housingScore",
  quality_of_life: "qualityScore",
  safety: "safetyScore",
  environment: "environmentScore",
  demographics: "demographicScore",
};

const INITIAL_DISPLAY_COUNT = 10;

export default function RankingTable({ rows, dataRefreshDate }: RankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("overall");
  const [weights, setWeights] = useState<DimensionWeights>(DEFAULT_WEIGHTS);
  const [showAll, setShowAll] = useState(false);

  // Recompute overall scores when weights change
  const rowsWithCustomScores = useMemo(() => {
    const scoreInputs = rows.map((r) => ({
      cmaId: r.cmaId,
      economicScore: r.economicScore,
      housingScore: r.housingScore,
      qualityScore: r.qualityScore,
      safetyScore: r.safetyScore,
      environmentScore: r.environmentScore,
      demographicScore: r.demographicScore,
    }));
    const newScores = recomputeWithWeights(scoreInputs, weights);
    return rows.map((r) => ({
      ...r,
      overallScore: newScores.get(r.cmaId) ?? r.defaultOverallScore,
    }));
  }, [rows, weights]);

  // Sort by active tab
  const sortedRows = useMemo(() => {
    const sorted = [...rowsWithCustomScores].sort((a, b) => {
      if (sortKey === "overall") {
        return b.overallScore - a.overallScore;
      }
      const field = dimScoreField[sortKey as Dimension];
      const aScore = (a[field] as number | null) ?? -1;
      const bScore = (b[field] as number | null) ?? -1;
      return bScore - aScore;
    });
    return sorted.map((r, idx) => ({ ...r, rank: idx + 1 }));
  }, [rowsWithCustomScores, sortKey]);

  // Convert to CityRowData
  const cityRows: CityRowData[] = sortedRows.map((r) => ({
    cmaId: r.cmaId,
    name: r.name,
    slug: r.slug,
    provinceAbbr: r.provinceAbbr,
    rank: r.rank,
    overallScore: r.overallScore,
    completenessScore: r.completenessScore,
    economicScore: r.economicScore,
    housingScore: r.housingScore,
    qualityScore: r.qualityScore,
    safetyScore: r.safetyScore,
    environmentScore: r.environmentScore,
    demographicScore: r.demographicScore,
  }));

  const displayedRows = showAll ? cityRows : cityRows.slice(0, INITIAL_DISPLAY_COUNT);
  const hasMore = cityRows.length > INITIAL_DISPLAY_COUNT && !showAll;

  return (
    <div className="space-y-4">
      {/* Freshness banner */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{
          background: "#F0EDE8",
          border: "1px solid #E7E5E0",
        }}
      >
        <svg
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: "#2D6A4F" }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "12px",
            color: "#78716C",
          }}
        >
          Data last refreshed:{" "}
          <strong style={{ color: "#1C1917" }}>{dataRefreshDate}</strong>.{" "}
          Sources include StatsCan, CMHC, and ECCC.
        </span>
      </div>

      {/* CMA explainer */}
      <CMAExplainer />

      {/* Controls */}
      <WeightPanel onWeightsChange={setWeights} />

      {/* Sort tabs */}
      <DimensionTabs active={sortKey} onChange={setSortKey} />

      {/* Column headers */}
      <div
        className="flex items-center gap-4 px-4 sm:px-16 py-2"
        style={{
          borderBottom: "1px solid #E7E5E0",
        }}
      >
        <div
          className="w-8 flex-shrink-0"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#A8A29E",
          }}
        >
          #
        </div>
        <div
          className="flex-1"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#A8A29E",
          }}
        >
          City
        </div>
        <div
          className="w-12 text-center flex-shrink-0"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#A8A29E",
          }}
        >
          Score
        </div>
        <div
          className="hidden lg:flex items-center gap-3"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            fontWeight: 500,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#A8A29E",
          }}
        >
          <span style={{ width: "100px", textAlign: "center" }}>Eco</span>
          <span style={{ width: "100px", textAlign: "center" }}>Housing</span>
          <span style={{ width: "100px", textAlign: "center" }}>QoL</span>
          <span style={{ width: "100px", textAlign: "center" }}>Safety</span>
          <span style={{ width: "100px", textAlign: "center" }}>Env</span>
          <span style={{ width: "100px", textAlign: "center" }}>Demo</span>
        </div>
      </div>

      {/* Rows */}
      <div className="overflow-hidden" style={{ borderRadius: "12px", border: "1px solid #E7E5E0", background: "#FFFFFF" }}>
        {displayedRows.map((row) => (
          <CityRow key={row.cmaId} data={row} />
        ))}
      </div>

      {/* Show all button */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors hover:bg-[#F0EDE8]"
            style={{
              border: "1px solid #E7E5E0",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
              fontWeight: 500,
              color: "#1C1917",
              background: "#FFFFFF",
              cursor: "pointer",
            }}
          >
            Show all {cityRows.length} cities
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      )}

      {showAll && (
        <p
          className="text-center"
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "12px",
            color: "#A8A29E",
          }}
        >
          Showing all {cityRows.length} Census Metropolitan Areas (CMAs)
        </p>
      )}
    </div>
  );
}
