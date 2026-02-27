import Link from "next/link";

export const metadata = {
  title: "About",
  description: "About CityScore Canada — methodology, CMA explainer, and data freshness policy.",
};

export default function AboutPage() {
  return (
    <div style={{ backgroundColor: "#FAFAF7", minHeight: "100vh" }}>
      {/* Hero */}
      <div className="px-4 sm:px-16 pt-12 pb-10">
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "12px",
            fontWeight: 600,
            color: "#C41E3A",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          About CityScore
        </div>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: "20px",
            maxWidth: "720px",
          }}
        >
          Helping Canadians find where they&apos;ll thrive
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "17px",
            color: "#78716C",
            maxWidth: "640px",
            lineHeight: 1.7,
          }}
        >
          Both MoneySense Best Places to Live (discontinued 2018) and Maclean&apos;s Best Communities
          (discontinued 2021) are gone. No active, interactive Canadian city prosperity comparison tool
          exists. CityScore Canada fills that gap — aggregating open data from Statistics Canada, CMHC,
          and ECCC into a single, comparable index covering all 35 Census Metropolitan Areas.
        </p>
      </div>

      {/* Who is this for — 4 cards */}
      <div className="px-4 sm:px-16 pb-10">
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "24px",
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.01em",
            marginBottom: "16px",
          }}
        >
          Who is this for?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              title: "Job Seekers",
              description:
                "Compare economic vitality and unemployment rates across cities before making a move.",
            },
            {
              title: "New Immigrants",
              description:
                "Find cities with the highest immigration share and best quality-of-life scores.",
            },
            {
              title: "Remote Workers",
              description:
                "Weigh housing affordability and environment scores to find your ideal base.",
            },
            {
              title: "Researchers",
              description:
                "Access a transparent, open-data index of Canadian urban prosperity with full source provenance.",
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                border: "1px solid #E7E5E0",
                borderRadius: "12px",
                padding: "24px",
                backgroundColor: "#fff",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1C1917",
                  marginBottom: "8px",
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  color: "#78716C",
                  lineHeight: 1.6,
                }}
              >
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* What is a CMA — two-column */}
      <div className="px-4 sm:px-16 pb-10">
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "24px",
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.01em",
            marginBottom: "20px",
          }}
        >
          What is a CMA?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Left: explanation */}
          <div>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "16px",
                color: "#78716C",
                lineHeight: 1.7,
                marginBottom: "16px",
              }}
            >
              A <strong style={{ color: "#1C1917" }}>Census Metropolitan Area</strong> is Statistics
              Canada&apos;s definition of an urban economic region with a core urban area of at least
              100,000 people. CMAs often extend well beyond the central city.
            </p>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {[
                "The Toronto CMA includes Mississauga, Brampton, Markham, Vaughan, Richmond Hill, and 20+ other municipalities",
                "The Vancouver CMA includes Burnaby, Surrey, Richmond, Coquitlam, and the North Shore",
                "The Ottawa–Gatineau CMA spans two provinces — Ottawa (Ontario) and Gatineau (Quebec)",
                "The Kitchener–Cambridge–Waterloo CMA is three cities treated as one urban region",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#C41E3A",
                      flexShrink: 0,
                      marginTop: "8px",
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "15px",
                      color: "#78716C",
                      lineHeight: 1.5,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <p
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "15px",
                color: "#78716C",
                lineHeight: 1.6,
                marginTop: "16px",
              }}
            >
              All data on this dashboard reflects the entire CMA, not just the city core. This is why
              Mississauga does not appear separately — its data is included in the Toronto CMA.
            </p>
          </div>

          {/* Right: Toronto CMA example card */}
          <div
            style={{
              backgroundColor: "#F0EDE8",
              borderRadius: "12px",
              padding: "28px",
            }}
          >
            <div
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                color: "#A8A29E",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              Example: Toronto CMA
            </div>
            <div className="space-y-2">
              {[
                { city: "Toronto (core)", pop: "2,794,356" },
                { city: "Mississauga", pop: "717,961" },
                { city: "Brampton", pop: "656,480" },
                { city: "Markham", pop: "338,503" },
                { city: "Vaughan", pop: "323,103" },
                { city: "Richmond Hill", pop: "209,922" },
                { city: "Oakville", pop: "213,759" },
                { city: "+ 20 more municipalities", pop: "~700,000" },
              ].map((row) => (
                <div
                  key={row.city}
                  className="flex items-center justify-between"
                  style={{ borderBottom: "1px solid #E7E5E0", paddingBottom: "6px" }}
                >
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      color: "#78716C",
                    }}
                  >
                    {row.city}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "13px",
                      color: "#1C1917",
                    }}
                  >
                    {row.pop}
                  </span>
                </div>
              ))}
              <div
                className="flex items-center justify-between pt-1"
              >
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1C1917",
                  }}
                >
                  Toronto CMA Total
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#C41E3A",
                  }}
                >
                  6,202,225
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Default Dimension Weights Table */}
      <div className="px-4 sm:px-16 pb-12">
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "24px",
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.01em",
            marginBottom: "16px",
          }}
        >
          Default Dimension Weights
        </h2>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "15px",
            color: "#78716C",
            marginBottom: "20px",
          }}
        >
          These weights reflect the relative importance of each dimension to Canadians making location
          decisions. You can adjust them on the{" "}
          <Link
            href="/"
            style={{ color: "#C41E3A", textDecoration: "none" }}
          >
            Rankings page
          </Link>
          .
        </p>
        <div
          style={{
            border: "1px solid #E7E5E0",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E7E5E0", backgroundColor: "#F0EDE8" }}>
                <th
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#A8A29E",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    textAlign: "left",
                    padding: "12px 20px",
                    width: "200px",
                  }}
                >
                  Dimension
                </th>
                <th
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#A8A29E",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    textAlign: "center",
                    padding: "12px 20px",
                    width: "80px",
                  }}
                >
                  Weight
                </th>
                <th
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "#A8A29E",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    textAlign: "left",
                    padding: "12px 20px",
                  }}
                  className="hidden sm:table-cell"
                >
                  Constituent Metrics
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  dim: "Economic Vitality",
                  weight: "25%",
                  metrics: "Unemployment rate, employment rate, median household income",
                },
                {
                  dim: "Housing Affordability",
                  weight: "25%",
                  metrics: "Average rent, vacancy rate, new housing price index",
                },
                {
                  dim: "Quality of Life",
                  weight: "20%",
                  metrics: "Consumer Price Index, 5-year population growth",
                },
                {
                  dim: "Safety",
                  weight: "15%",
                  metrics: "Crime Severity Index",
                },
                {
                  dim: "Environment",
                  weight: "10%",
                  metrics: "Air Quality Health Index (30-day average)",
                },
                {
                  dim: "Demographics",
                  weight: "5%",
                  metrics: "5-year population growth, immigration share",
                },
              ].map((row, idx, arr) => (
                <tr
                  key={row.dim}
                  style={{
                    borderBottom: idx < arr.length - 1 ? "1px solid #F0EDE8" : "none",
                    backgroundColor: "#fff",
                  }}
                >
                  <td
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#1C1917",
                      padding: "14px 20px",
                    }}
                  >
                    {row.dim}
                  </td>
                  <td
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#C41E3A",
                      padding: "14px 20px",
                      textAlign: "center",
                    }}
                  >
                    {row.weight}
                  </td>
                  <td
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: "13px",
                      color: "#78716C",
                      padding: "14px 20px",
                    }}
                    className="hidden sm:table-cell"
                  >
                    {row.metrics}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Methodology notes */}
        <div
          style={{
            marginTop: "32px",
            padding: "24px",
            backgroundColor: "#fff",
            border: "1px solid #E7E5E0",
            borderRadius: "12px",
          }}
        >
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "18px",
              fontWeight: 600,
              color: "#1C1917",
              marginBottom: "12px",
            }}
          >
            Adjustable Weights
          </h3>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#78716C",
              lineHeight: 1.6,
            }}
          >
            The Rankings page lets you drag sliders to change how much each dimension matters.
            Your custom weights are saved locally and applied in real time — no page reload required.
            Weights must sum to 100%.
          </p>
        </div>

        {/* About the project */}
        <div
          style={{
            marginTop: "16px",
            padding: "24px",
            backgroundColor: "#fff",
            border: "1px solid #E7E5E0",
            borderRadius: "12px",
          }}
        >
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "18px",
              fontWeight: 600,
              color: "#1C1917",
              marginBottom: "12px",
            }}
          >
            About This Project
          </h3>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#78716C",
              lineHeight: 1.6,
              marginBottom: "8px",
            }}
          >
            CityScore Canada is an independent portfolio project. It is not affiliated with Statistics
            Canada, CMHC, ECCC, or any level of government. All data used is publicly available and
            freely accessible from the sources listed on the{" "}
            <Link href="/data" style={{ color: "#C41E3A", textDecoration: "none" }}>
              Data Sources page
            </Link>
            .
          </p>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              color: "#78716C",
              lineHeight: 1.6,
            }}
          >
            Built with Next.js, Tailwind CSS, and deployed on Cloudflare Pages. Data sourced from
            Statistics Canada&apos;s Web Data Service, CMHC&apos;s Rental Market Survey, and ECCC&apos;s
            AQHI data. Last updated: November 2024.
          </p>
        </div>
      </div>
    </div>
  );
}
