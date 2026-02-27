interface MiniScoreBarProps {
  score: number | null;
  label?: string;
}

function getBarFillColor(score: number | null): string {
  if (score === null) return "#D6D3CE";
  if (score >= 70) return "#2D6A4F";
  if (score >= 45) return "#D4A843";
  return "#B85C5C";
}

export default function MiniScoreBar({ score, label }: MiniScoreBarProps) {
  const pct = score !== null ? Math.min(100, Math.max(0, score)) : 0;
  const fillColor = getBarFillColor(score);

  return (
    <div
      className="flex flex-col items-center"
      style={{ gap: "4px", width: "100px" }}
      title={label ? `${label}: ${score !== null ? Math.round(score) : "N/A"}` : undefined}
    >
      {/* Bar track */}
      <div
        style={{
          width: "64px",
          height: "6px",
          background: "#F0EDE8",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          className="score-bar-fill"
          style={{
            width: `${pct}%`,
            height: "100%",
            background: fillColor,
            borderRadius: "3px",
          }}
        />
      </div>
      {/* Score number */}
      <span
        className="tabular-nums"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "11px",
          color: "#78716C",
          lineHeight: 1,
        }}
      >
        {score !== null ? Math.round(score) : "—"}
      </span>
    </div>
  );
}
