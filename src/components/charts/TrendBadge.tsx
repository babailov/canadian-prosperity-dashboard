const BADGE_STYLES = {
  Rising: { bg: "#2D6A4F", icon: "↑" },
  Falling: { bg: "#C41E3A", icon: "↓" },
  Stable: { bg: "#A8A29E", icon: "—" },
};

interface TrendBadgeProps {
  badge: "Rising" | "Falling" | "Stable";
  delta?: number;
  size?: "sm" | "lg";
}

export default function TrendBadge({ badge, delta, size = "sm" }: TrendBadgeProps) {
  const style = BADGE_STYLES[badge];
  const fontSize = size === "lg" ? "14px" : "12px";
  const padding = size === "lg" ? "4px 12px" : "2px 8px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        backgroundColor: style.bg,
        color: "#FFFFFF",
        borderRadius: "6px",
        padding,
        fontFamily: "var(--font-inter), Inter, sans-serif",
        fontSize,
        fontWeight: 600,
        whiteSpace: "nowrap",
        lineHeight: 1.4,
      }}
    >
      {style.icon} {badge}
      {delta !== undefined && (
        <span style={{ opacity: 0.8, fontSize: size === "lg" ? "12px" : "11px" }}>
          {delta > 0 ? "+" : ""}
          {delta.toFixed(1)}%
        </span>
      )}
    </span>
  );
}
