"use client";

import { useState, useEffect } from "react";
import { DimensionWeights, DEFAULT_WEIGHTS, DIMENSION_ORDER, DIMENSION_LABELS, Dimension } from "@/types";
import { normalizeWeights } from "@/lib/scoring";

const STORAGE_KEY = "city-score-weights";

interface WeightPanelProps {
  onWeightsChange: (weights: DimensionWeights) => void;
}

export default function WeightPanel({ onWeightsChange }: WeightPanelProps) {
  const [open, setOpen] = useState(false);
  const [weights, setWeights] = useState<DimensionWeights>(DEFAULT_WEIGHTS);
  const [isCustom, setIsCustom] = useState(false);
  const [zeroedDims, setZeroedDims] = useState<Dimension[]>([]);

  // Load saved weights on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DimensionWeights;
        setWeights(parsed);
        setIsCustom(true);
        onWeightsChange(parsed);
        const zeroed = DIMENSION_ORDER.filter((d) => parsed[d] === 0);
        setZeroedDims(zeroed);
      }
    } catch {
      // ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSliderChange(dim: Dimension, rawValue: number) {
    const newWeights = normalizeWeights(weights, dim, rawValue);
    setWeights(newWeights);
    setIsCustom(true);
    const zeroed = DIMENSION_ORDER.filter((d) => newWeights[d] === 0);
    setZeroedDims(zeroed);
    onWeightsChange(newWeights);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWeights));
    } catch {
      // ignore
    }
  }

  function handleReset() {
    setWeights(DEFAULT_WEIGHTS);
    setIsCustom(false);
    setZeroedDims([]);
    onWeightsChange(DEFAULT_WEIGHTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="overflow-hidden"
      style={{ border: "1px solid #E7E5E0", borderRadius: "10px", background: "#FFFFFF" }}
    >
      {/* Header toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[#FAFAF7]"
      >
        <div className="flex items-center gap-2">
          {/* Slider icon */}
          <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#78716C" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "13px",
              fontWeight: 500,
              color: "#78716C",
            }}
          >
            Adjust Weights
          </span>
          {isCustom && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(196,30,58,0.08)",
                color: "#C41E3A",
                fontSize: "11px",
                fontWeight: 500,
                fontFamily: "var(--font-inter)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#C41E3A]" />
              Custom active
            </span>
          )}
        </div>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "#A8A29E" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel body */}
      {open && (
        <div className="px-4 py-4 space-y-4" style={{ borderTop: "1px solid #F0EDE8" }}>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#78716C" }}>
            Adjust how much each dimension matters to you. Weights auto-normalize to 100%.
          </p>

          {/* Zeroed dimension warnings */}
          {zeroedDims.length > 0 && (
            <div className="space-y-1.5">
              {zeroedDims.map((dim) => (
                <div
                  key={dim}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "#FEF9C3", border: "1px solid #FEF08A" }}
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#CA8A04" }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#92400E" }}>
                    <strong>{DIMENSION_LABELS[dim]}</strong> is now excluded from your score.
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Sliders */}
          <div className="space-y-3">
            {DIMENSION_ORDER.map((dim) => {
              const w = Math.round(weights[dim]);
              return (
                <div key={dim}>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: "#78716C",
                      }}
                    >
                      {DIMENSION_LABELS[dim]}
                    </label>
                    <span
                      className="tabular-nums"
                      style={{
                        fontFamily: "var(--font-jetbrains-mono)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: w === 0 ? "#D6D3CE" : "#C41E3A",
                      }}
                    >
                      {w}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    step={1}
                    value={w}
                    onChange={(e) => handleSliderChange(dim, Number(e.target.value))}
                    className="w-full"
                    aria-label={`${DIMENSION_LABELS[dim]} weight`}
                  />
                </div>
              );
            })}
          </div>

          {/* Reset */}
          <div className="flex justify-end pt-1">
            <button
              onClick={handleReset}
              disabled={!isCustom}
              className="transition-colors disabled:opacity-30"
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "12px",
                color: "#78716C",
              }}
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
