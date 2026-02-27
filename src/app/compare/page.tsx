import { Suspense } from "react";
import ComparisonClient from "@/components/compare/ComparisonLayout";
import { getAllCityRankData } from "@/lib/computed-scores";
import { CMAS } from "@/lib/data";

export const metadata = {
  title: "Compare Cities",
  description: "Side-by-side comparison of any two Canadian CMAs across all prosperity metrics.",
};

function ComparisonContent() {
  const allData = getAllCityRankData();
  return (
    <ComparisonClient
      allData={allData}
      cmas={CMAS}
    />
  );
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-6xl mx-auto px-4 py-8">
          <p className="text-slate-500">Loading comparison tool...</p>
        </div>
      }
    >
      <ComparisonContent />
    </Suspense>
  );
}
