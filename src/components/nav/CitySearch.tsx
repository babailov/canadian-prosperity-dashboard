"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CMAS } from "@/lib/data";
import { CMA } from "@/types";

const MNEMONICS: Record<string, string[]> = {
  "gta": ["toronto"],
  "gva": ["vancouver"],
  "ncr": ["ottawa-gatineau"],
  "kw": ["kitchener-cambridge-waterloo"],
  "kcw": ["kitchener-cambridge-waterloo"],
  "tri-cities": ["kitchener-cambridge-waterloo"],
  "hammer": ["hamilton"],
  "the peg": ["winnipeg"],
  "cowtown": ["calgary"],
  "e-town": ["edmonton"],
  "t-dot": ["toronto"],
  "van": ["vancouver"],
  "mtl": ["montreal"],
  "ott": ["ottawa-gatineau"],
  "yeg": ["edmonton"],
  "yyc": ["calgary"],
  "yyz": ["toronto"],
  "yvr": ["vancouver"],
  "yul": ["montreal"],
  "yhz": ["halifax"],
  "yow": ["ottawa-gatineau"],
  "ywg": ["winnipeg"],
  "yqr": ["regina"],
  "yxe": ["saskatoon"],
  "yyj": ["victoria"],
  "yqb": ["quebec"],
  "yjt": ["st-johns"],
};

function searchCities(query: string): CMA[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Check mnemonic mappings first — collect all slugs that match
  const mnemonicSlugs = new Set<string>();
  for (const [mnemonic, slugs] of Object.entries(MNEMONICS)) {
    if (mnemonic.includes(q) || q.includes(mnemonic)) {
      slugs.forEach((s) => mnemonicSlugs.add(s));
    }
  }

  const results: CMA[] = [];
  const seen = new Set<string>();

  // Add mnemonic matches first
  for (const cma of CMAS) {
    if (mnemonicSlugs.has(cma.slug) && !seen.has(cma.id)) {
      results.push(cma);
      seen.add(cma.id);
    }
  }

  // Then add substring matches on name, province abbr, province full name
  for (const cma of CMAS) {
    if (seen.has(cma.id)) continue;
    const nameMatch = cma.name.toLowerCase().includes(q);
    const abbrMatch = cma.provinceAbbr.toLowerCase().includes(q);
    const provinceMatch = cma.province.toLowerCase().includes(q);
    if (nameMatch || abbrMatch || provinceMatch) {
      results.push(cma);
      seen.add(cma.id);
    }
  }

  return results.slice(0, 6);
}

export default function CitySearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searchCities(query);

  const selectCity = useCallback(
    (cma: CMA) => {
      setQuery("");
      setOpen(false);
      setActiveIndex(-1);
      router.push(`/city/${cma.slug}`);
    },
    [router]
  );

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (e.key === "Escape") {
        setOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        selectCity(results[activeIndex]);
      } else if (results.length === 1) {
        selectCity(results[0]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showDropdown = open && query.trim().length > 0 && results.length > 0;

  return (
    <div ref={containerRef} style={{ position: "relative", minWidth: "200px" }}>
      {/* Input */}
      <div
        className="flex items-center gap-2 px-3 rounded-lg"
        style={{
          border: "1px solid #E7E5E0",
          height: "36px",
          background: "white",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A8A29E"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          placeholder="Search cities..."
          style={{
            fontFamily: "var(--font-inter)",
            fontSize: "13px",
            color: "#1C1917",
            background: "transparent",
            border: "none",
            outline: "none",
            width: "100%",
          }}
          aria-label="Search cities"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          role="combobox"
          autoComplete="off"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #E7E5E0",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            zIndex: 50,
            overflow: "hidden",
          }}
          role="listbox"
        >
          {results.map((cma, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={cma.id}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent input blur before click fires
                  selectCity(cma);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 12px",
                  background: isActive ? "#F5F4F2" : "white",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#1C1917",
                  }}
                >
                  {cma.name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-inter)",
                    fontSize: "12px",
                    color: "#78716C",
                    marginLeft: "8px",
                    flexShrink: 0,
                  }}
                >
                  {cma.provinceAbbr}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
