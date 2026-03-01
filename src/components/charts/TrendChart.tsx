"use client";

import { useState } from "react";

interface ChartPoint {
  period: string;
  value: number;
}

interface TrendChartProps {
  label: string;
  unit: string;
  description?: string | null;
  cityName: string;
  cityLine: ChartPoint[];
  nationalAvgLine: ChartPoint[];
}

const W = 600;
const H = 280;
const PAD = { top: 20, right: 20, bottom: 50, left: 65 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function formatPeriodLabel(period: string): string {
  if (period.includes("-")) {
    const [y, m] = period.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${months[parseInt(m) - 1]} '${y.slice(2)}`;
  }
  return period;
}

function formatValue(value: number, unit: string): string {
  if (unit === "%") return `${value.toFixed(1)}%`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export default function TrendChart({
  label,
  unit,
  description,
  cityName,
  cityLine,
  nationalAvgLine,
}: TrendChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (cityLine.length < 2) return null;

  const allValues = [...cityLine, ...nationalAvgLine].map((p) => p.value);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const yMin = minVal - range * 0.1;
  const yMax = maxVal + range * 0.1;

  const xScale = (i: number) => PAD.left + (i / (cityLine.length - 1)) * PLOT_W;
  const yScale = (v: number) =>
    PAD.top + PLOT_H - ((v - yMin) / (yMax - yMin)) * PLOT_H;

  const cityPath = cityLine
    .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(p.value).toFixed(1)}`)
    .join(" ");
  const avgPath = nationalAvgLine
    .map((p, i) => `${i === 0 ? "M" : "L"}${xScale(i).toFixed(1)},${yScale(p.value).toFixed(1)}`)
    .join(" ");

  const yTicks = Array.from({ length: 5 }, (_, i) => yMin + (i / 4) * (yMax - yMin));
  const labelEvery = Math.max(1, Math.floor(cityLine.length / 6));

  return (
    <div
      style={{
        border: "1px solid #E7E5E0",
        borderRadius: "12px",
        padding: "24px",
        backgroundColor: "#fff",
      }}
    >
      <h4
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "16px",
          fontWeight: 600,
          color: "#1C1917",
          margin: 0,
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        {label}
        {description && (
          <span className="tooltip-wrapper" style={{ display: "inline-flex", alignItems: "center" }}>
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: "#A8A29E", flexShrink: 0, cursor: "default" }}
            >
              <circle cx="8" cy="8" r="7.5" stroke="currentColor" />
              <path d="M8 7v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
              <circle cx="8" cy="4.5" fill="currentColor" r="0.75" />
            </svg>
            <div
              className="tooltip-content"
              style={{ maxWidth: "260px", whiteSpace: "normal", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)" }}
            >
              {description}
            </div>
          </span>
        )}
      </h4>

      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "auto" }}
          role="img"
          aria-label={`${label} trend chart for ${cityName}`}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Grid lines + Y labels */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={yScale(tick)}
                y2={yScale(tick)}
                stroke="#F0EDE8"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 10}
                y={yScale(tick) + 4}
                textAnchor="end"
                fill="#A8A29E"
                fontSize="11"
                fontFamily="Inter, sans-serif"
              >
                {formatValue(Math.round(tick * 10) / 10, unit)}
              </text>
            </g>
          ))}

          {/* National average line (dashed) */}
          <path
            d={avgPath}
            fill="none"
            stroke="#D6D3CE"
            strokeWidth={1.5}
            strokeDasharray="6,4"
          />

          {/* City line (solid) */}
          <path
            d={cityPath}
            fill="none"
            stroke="#1C1917"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X-axis labels */}
          {cityLine.map((p, i) => {
            if (i % labelEvery !== 0 && i !== cityLine.length - 1) return null;
            return (
              <text
                key={i}
                x={xScale(i)}
                y={H - 8}
                textAnchor="middle"
                fill="#A8A29E"
                fontSize="10"
                fontFamily="Inter, sans-serif"
              >
                {formatPeriodLabel(p.period)}
              </text>
            );
          })}

          {/* Invisible hover zones */}
          {cityLine.map((_, i) => (
            <rect
              key={i}
              x={xScale(i) - PLOT_W / cityLine.length / 2}
              y={PAD.top}
              width={PLOT_W / cityLine.length}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
            />
          ))}

          {/* Hover crosshair + dots */}
          {hoveredIdx !== null && (
            <>
              <line
                x1={xScale(hoveredIdx)}
                x2={xScale(hoveredIdx)}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                stroke="#D6D3CE"
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <circle
                cx={xScale(hoveredIdx)}
                cy={yScale(cityLine[hoveredIdx].value)}
                r={4}
                fill="#1C1917"
                stroke="#fff"
                strokeWidth={2}
              />
              {nationalAvgLine[hoveredIdx] && (
                <circle
                  cx={xScale(hoveredIdx)}
                  cy={yScale(nationalAvgLine[hoveredIdx].value)}
                  r={3}
                  fill="#A8A29E"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredIdx !== null && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "#1C1917",
              color: "#fff",
              borderRadius: "8px",
              padding: "10px 14px",
              fontFamily: "Inter, sans-serif",
              fontSize: "12px",
              lineHeight: "18px",
              zIndex: 10,
              pointerEvents: "none",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>
              {formatPeriodLabel(cityLine[hoveredIdx].period)}
            </div>
            <div>
              <span style={{ color: "#93C5FD" }}>{cityName}:</span>{" "}
              {formatValue(cityLine[hoveredIdx].value, unit)}
            </div>
            {nationalAvgLine[hoveredIdx] && (
              <div>
                <span style={{ color: "#D1D5DB" }}>Natl avg:</span>{" "}
                {formatValue(nationalAvgLine[hoveredIdx].value, unit)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginTop: "12px",
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
          color: "#78716C",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "16px",
              height: "2.5px",
              backgroundColor: "#1C1917",
              borderRadius: "1px",
            }}
          />
          {cityName}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "16px",
              height: "0",
              borderTop: "2px dashed #D6D3CE",
            }}
          />
          National CMA average
        </div>
      </div>
    </div>
  );
}
