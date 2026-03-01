"use client";

export type ProfileTabKey = "breakdown" | "trends";

interface ProfileTabsProps {
  activeTab: ProfileTabKey;
  onChange: (tab: ProfileTabKey) => void;
}

const TABS: { key: ProfileTabKey; label: string }[] = [
  { key: "breakdown", label: "Score Breakdown" },
  { key: "trends", label: "Historical Trends" },
];

export default function ProfileTabs({ activeTab, onChange }: ProfileTabsProps) {
  return (
    <div className="flex gap-2">
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
            border: activeTab === key ? "none" : "1px solid #E7E5E0",
            background: activeTab === key ? "#1C1917" : "transparent",
            color: activeTab === key ? "#FFFFFF" : "#78716C",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
