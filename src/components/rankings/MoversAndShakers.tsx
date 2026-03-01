import Link from "next/link";

interface MoverCardData {
  cmaName: string;
  cmaSlug: string;
  provinceAbbr: string;
  delta: number;
  narrative: string;
  type: "riser" | "faller" | "stable";
}

interface MoversAndShakersProps {
  cards: MoverCardData[];
}

const TYPE_STYLES = {
  riser: { label: "Biggest Riser", borderColor: "#2D6A4F", deltaColor: "#2D6A4F", icon: "↑" },
  faller: { label: "Biggest Faller", borderColor: "#C41E3A", deltaColor: "#C41E3A", icon: "↓" },
  stable: { label: "Most Stable", borderColor: "#A8A29E", deltaColor: "#78716C", icon: "—" },
};

export default function MoversAndShakers({ cards }: MoversAndShakersProps) {
  if (cards.length < 3) return null;

  return (
    <div style={{ marginBottom: "32px" }}>
      <div className="flex items-center gap-3 mb-4">
        <h2
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontSize: "24px",
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.02em",
          }}
        >
          Movers &amp; Shakers
        </h2>
        <span
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "12px",
            fontWeight: 500,
            color: "#A8A29E",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Year-over-year
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => {
          const s = TYPE_STYLES[card.type];
          return (
            <div
              key={card.cmaSlug}
              style={{
                border: `1px solid ${s.borderColor}`,
                borderRadius: "12px",
                padding: "24px",
                backgroundColor: "#fff",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: s.borderColor,
                  marginBottom: "12px",
                }}
              >
                {s.icon} {s.label}
              </div>
              <div style={{ marginBottom: "4px" }}>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#1C1917",
                  }}
                >
                  {card.cmaName}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: "14px",
                    fontWeight: 400,
                    color: "#A8A29E",
                    marginLeft: "8px",
                  }}
                >
                  {card.provinceAbbr}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: s.deltaColor,
                  marginBottom: "8px",
                }}
              >
                {card.delta > 0 ? "+" : ""}
                {card.delta.toFixed(1)}%
              </div>
              <p
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "13px",
                  color: "#78716C",
                  lineHeight: "18px",
                  marginBottom: "12px",
                }}
              >
                {card.narrative}
              </p>
              <Link
                href={`/city/${card.cmaSlug}`}
                style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#C41E3A",
                  textDecoration: "none",
                }}
                className="hover:opacity-70 transition-opacity"
              >
                View profile →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
