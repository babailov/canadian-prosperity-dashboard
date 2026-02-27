import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import TopNav from "@/components/nav/TopNav";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: {
    default: "CityScore Canada — Canadian City Prosperity Rankings",
    template: "%s | CityScore Canada",
  },
  description:
    "Compare all 35 Canadian Census Metropolitan Areas by prosperity score. Rank cities by economic vitality, housing affordability, safety, quality of life, environment, and demographics.",
  keywords: [
    "Canadian cities",
    "city comparison",
    "best cities in Canada",
    "CMA rankings",
    "housing affordability Canada",
    "crime statistics Canada",
    "Canadian prosperity index",
  ],
  openGraph: {
    type: "website",
    siteName: "CityScore Canada",
    title: "CityScore Canada — Canadian City Prosperity Rankings",
    description:
      "Interactive rankings of all 35 Canadian CMAs by prosperity score. Customize weights and compare cities side-by-side.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CityScore Canada",
    description: "Rankings of all 35 Canadian CMAs by prosperity score.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className={`${inter.className} bg-[#FAFAF7] text-[#1C1917] min-h-screen`}>
        <TopNav />
        <main>{children}</main>
        <footer className="mt-16 border-t border-[#E7E5E0] bg-[#FAFAF7]">
          <div className="px-4 sm:px-16 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {/* Left: logo + tagline */}
              <div className="flex items-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                  <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" fill="#C41E3A"/>
                </svg>
                <div>
                  <p
                    className="font-semibold text-[#1C1917]"
                    style={{ fontFamily: "var(--font-space-grotesk)", fontSize: "15px", letterSpacing: "-0.02em" }}
                  >
                    CityScore Canada
                  </p>
                  <p style={{ fontSize: "13px", color: "#A8A29E", fontFamily: "var(--font-inter)", marginTop: "2px" }}>
                    Open data from Statistics Canada, CMHC, and ECCC.
                  </p>
                </div>
              </div>

              {/* Right: nav links */}
              <nav className="flex gap-6">
                {[
                  { href: "/", label: "Rankings" },
                  { href: "/compare", label: "Compare" },
                  { href: "/data", label: "Data Sources" },
                  { href: "/about", label: "About" },
                ].map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    style={{ fontSize: "13px", color: "#78716C", fontFamily: "var(--font-inter)" }}
                    className="hover:text-[#1C1917] transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
