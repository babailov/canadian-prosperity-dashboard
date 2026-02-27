"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cma-explainer-dismissed";

export default function CMAExplainer() {
  const [dismissed, setDismissed] = useState(true); // default true to avoid flash

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setDismissed(false);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  if (dismissed) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
      <div className="flex-shrink-0 mt-0.5">
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-900">What is a Census Metropolitan Area?</p>
        <p className="text-sm text-blue-800 mt-0.5">
          CMAs often extend well beyond a city&apos;s municipal limits. For example, the Toronto CMA includes Mississauga,
          Brampton, Markham, and 20+ other municipalities. All data on this dashboard reflects the entire CMA, not just the city core.
        </p>
      </div>
      <button
        onClick={dismiss}
        className="flex-shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
