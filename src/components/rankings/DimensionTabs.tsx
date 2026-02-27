"use client";

import { Dimension, DIMENSION_LABELS, DIMENSION_ORDER } from "@/types";

export type SortKey = "overall" | Dimension;

interface DimensionTabsProps {
  active: SortKey;
  onChange: (key: SortKey) => void;
}

const TABS: { key: SortKey; label: string }[] = [
  { key: "overall", label: "Overall" },
  ...DIMENSION_ORDER.map((dim) => ({ key: dim as SortKey, label: DIMENSION_LABELS[dim] })),
];

export default function DimensionTabs({ active, onChange }: DimensionTabsProps) {
  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 min-w-max">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="whitespace-nowrap transition-colors"
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
              fontWeight: 500,
              padding: "6px 14px",
              borderRadius: "9999px",
              border: active === key ? "none" : "1px solid #E7E5E0",
              background: active === key ? "#1C1917" : "transparent",
              color: active === key ? "#FFFFFF" : "#78716C",
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
