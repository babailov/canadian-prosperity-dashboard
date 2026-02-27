interface ScoreBarProps {
  score: number | null;
  max?: number;
  height?: "xs" | "sm" | "md";
  colorClass?: string;
  showValue?: boolean;
}

const heightMap = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2.5",
};

export default function ScoreBar({
  score,
  max = 100,
  height = "sm",
  colorClass,
  showValue = false,
}: ScoreBarProps) {
  const pct = score !== null ? Math.min(100, Math.max(0, (score / max) * 100)) : 0;
  const resolvedColorClass = colorClass ?? scoreColorClass(score);

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 rounded-full overflow-hidden ${heightMap[height]}`} style={{ background: "#F0EDE8" }}>
        <div
          className={`${heightMap[height]} rounded-full score-bar-fill ${
            score === null ? "" : resolvedColorClass
          }`}
          style={score === null ? { background: "#D6D3CE", width: `${pct}%` } : { width: `${pct}%` }}
        />
      </div>
      {showValue && (
        <span
          className="tabular-nums"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "12px",
            color: "#78716C",
            width: "28px",
            textAlign: "right",
          }}
        >
          {score !== null ? Math.round(score) : "—"}
        </span>
      )}
    </div>
  );
}

/**
 * Tailwind color class based on score value.
 */
export function scoreColorClass(score: number | null): string {
  if (score === null) return "";
  if (score >= 70) return "bg-[#2D6A4F]";
  if (score >= 45) return "bg-[#D4A843]";
  return "bg-[#B85C5C]";
}

/**
 * Hex color based on score value.
 */
export function scoreColor(score: number | null): string {
  if (score === null) return "#D6D3CE";
  if (score >= 70) return "#2D6A4F";
  if (score >= 45) return "#D4A843";
  return "#B85C5C";
}
