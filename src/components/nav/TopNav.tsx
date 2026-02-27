"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import CitySearch from "./CitySearch";

const NAV_LINKS = [
  { href: "/", label: "Rankings" },
  { href: "/compare", label: "Compare" },
  { href: "/data", label: "Data Sources" },
  { href: "/about", label: "About" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 bg-white"
      style={{ borderBottom: "1px solid #E7E5E0", height: "64px" }}
    >
      <div className="px-4 sm:px-16 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" fill="#C41E3A"/>
          </svg>
          <div className="flex items-baseline gap-1.5">
            <span
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 700,
                fontSize: "18px",
                color: "#1C1917",
                letterSpacing: "-0.02em",
              }}
            >
              CityScore
            </span>
            <span
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "13px",
                color: "#78716C",
              }}
            >
              Canada
            </span>
          </div>
        </Link>

        {/* Desktop nav + search */}
        <div className="hidden sm:flex items-center gap-7">
          <nav className="flex items-center gap-7">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: "14px",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "#C41E3A" : "#78716C",
                    textDecoration: "none",
                  }}
                  className="hover:text-[#1C1917] transition-colors whitespace-nowrap"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Search box */}
          <CitySearch />
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-md"
          style={{ color: "#78716C" }}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden bg-white" style={{ borderTop: "1px solid #E7E5E0" }}>
          <nav className="px-4 pt-2 pb-3 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg transition-colors"
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: "14px",
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "#C41E3A" : "#78716C",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
