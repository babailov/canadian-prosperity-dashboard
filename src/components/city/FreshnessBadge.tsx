import { getFreshnessState } from "@/lib/scoring";

interface FreshnessBadgeProps {
  sourcePublicationDate: string | null;
  sourceTableId: string | null;
  updateFrequency: string;
  isCensus?: boolean;
  period?: string;
}

const stateConfig = {
  fresh: {
    dot: "bg-[#2D6A4F]",
    text: "text-[#2D6A4F]",
    bg: "bg-[#2D6A4F]/10",
    label: "Fresh",
  },
  aging: {
    dot: "bg-[#D4A843]",
    text: "text-[#D4A843]",
    bg: "bg-[#D4A843]/10",
    label: "Aging",
  },
  stale: {
    dot: "bg-[#B85C5C]",
    text: "text-[#B85C5C]",
    bg: "bg-[#B85C5C]/10",
    label: "Stale",
  },
  historical: {
    dot: "bg-[#A8A29E]",
    text: "text-[#78716C]",
    bg: "bg-[#A8A29E]/10",
    label: "Historical",
  },
};

export default function FreshnessBadge({
  sourcePublicationDate,
  sourceTableId,
  updateFrequency,
  isCensus = false,
  period,
}: FreshnessBadgeProps) {
  const state = getFreshnessState(sourcePublicationDate, isCensus);
  const config = stateConfig[state];

  const displayLabel =
    state === "historical" && period
      ? `${period} Census`
      : config.label;

  const formattedDate = sourcePublicationDate
    ? new Date(sourcePublicationDate).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Unknown";

  return (
    <div className="tooltip-wrapper">
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
        {displayLabel}
      </span>
      <div className="tooltip-content" style={{ maxWidth: "240px" }}>
        <div className="space-y-1">
          {sourceTableId && (
            <div><span className="opacity-70">Table:</span> {sourceTableId}</div>
          )}
          <div><span className="opacity-70">Published:</span> {formattedDate}</div>
          <div><span className="opacity-70">Frequency:</span> {updateFrequency}</div>
        </div>
      </div>
    </div>
  );
}
