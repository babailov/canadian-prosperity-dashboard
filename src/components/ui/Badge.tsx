interface BadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "yellow" | "red" | "slate" | "province";
  size?: "sm" | "xs";
}

const variantMap: Record<string, string> = {
  blue: "bg-[rgba(196,30,58,0.08)] text-[#C41E3A] border-[rgba(196,30,58,0.2)]",
  green: "bg-[rgba(45,106,79,0.08)] text-[#2D6A4F] border-[rgba(45,106,79,0.2)]",
  yellow: "bg-[rgba(212,168,67,0.12)] text-[#92711B] border-[rgba(212,168,67,0.3)]",
  red: "bg-[rgba(184,92,92,0.08)] text-[#B85C5C] border-[rgba(184,92,92,0.2)]",
  slate: "bg-[#F0EDE8] text-[#78716C] border-[#E7E5E0]",
  province: "bg-[#1C1917] text-white border-transparent",
};

const sizeMap = {
  sm: "px-2 py-0.5 text-xs",
  xs: "px-1.5 py-0.5 text-[10px]",
};

export default function Badge({
  children,
  variant = "slate",
  size = "sm",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${variantMap[variant]} ${sizeMap[size]}`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      {children}
    </span>
  );
}

interface CompletenessBadgeProps {
  score: number;
}

export function CompletenessBadge({ score }: CompletenessBadgeProps) {
  const pct = Math.round(score);
  const variant =
    pct >= 90 ? "green" : pct >= 70 ? "yellow" : "red";

  return (
    <div className="tooltip-wrapper">
      <Badge variant={variant} size="xs">
        {pct}%
      </Badge>
      <div className="tooltip-content" style={{ whiteSpace: "normal", maxWidth: "200px" }}>
        <strong>Data Completeness: {pct}%</strong>
        <br />
        Fraction of metrics with real (non-proxy) data available for this CMA.
      </div>
    </div>
  );
}
