/**
 * D1 Seed Script
 *
 * Populates the D1 database with all CMA reference data,
 * metric definitions, metric values, and precomputed scores.
 *
 * Usage:
 *   pnpm seed
 *   (or: pnpm tsx scripts/seed.ts)
 *
 * This generates a SQL file at migrations/0002_seed.sql that can be
 * applied with wrangler:
 *   wrangler d1 execute canadian-prosperity-db --file=migrations/0002_seed.sql
 *   wrangler d1 execute canadian-prosperity-db --remote --file=migrations/0002_seed.sql
 */

import { CMAS, METRICS, RAW_METRIC_VALUES, toRawMetricData } from "../src/lib/data";
import { computeScores } from "../src/lib/scoring";
import { DEFAULT_WEIGHTS } from "../src/types";
import * as fs from "fs";
import * as path from "path";

// ── Helpers ──────────────────────────────────────────────────────────────────

function escape(s: string | null | undefined): string {
  if (s === null || s === undefined) return "NULL";
  return `'${String(s).replace(/'/g, "''")}'`;
}

function num(n: number | null | undefined): string {
  if (n === null || n === undefined) return "NULL";
  return String(n);
}

function bool(b: boolean): string {
  return b ? "1" : "0";
}

function uuid(prefix: string, suffix: string): string {
  // Deterministic ID based on prefix + suffix
  return `${prefix}_${suffix.replace(/[^a-z0-9_]/gi, "_").toLowerCase()}`;
}

// ── Generate SQL ──────────────────────────────────────────────────────────────

const lines: string[] = [
  "-- CityScore Canada — Seed Data",
  "-- Generated: " + new Date().toISOString(),
  "-- Do not edit manually. Regenerate with: pnpm seed",
  "",
  "BEGIN TRANSACTION;",
  "",
  "-- Clear existing data",
  "DELETE FROM cma_scores;",
  "DELETE FROM metric_history;",
  "DELETE FROM metric_values;",
  "DELETE FROM metrics;",
  "DELETE FROM cmas;",
  "",
];

// CMAs
lines.push("-- CMAs");
for (const cma of CMAS) {
  lines.push(
    `INSERT INTO cmas (id, name, slug, province, province_abbr, population_latest, centroid_lat, centroid_lng, cma_boundary_note) VALUES (` +
      [
        escape(cma.id),
        escape(cma.name),
        escape(cma.slug),
        escape(cma.province),
        escape(cma.provinceAbbr),
        num(cma.populationLatest),
        num(cma.centroidLat),
        num(cma.centroidLng),
        escape(cma.cmaBoundaryNote),
      ].join(", ") +
      ");"
  );
}
lines.push("");

// Metrics
lines.push("-- Metrics");
for (const metric of METRICS) {
  lines.push(
    `INSERT INTO metrics (id, dimension, name, source_name, source_table, source_url, update_frequency, direction, weight_within_dimension, proxy_fallback_metric_id, is_proxy_target) VALUES (` +
      [
        escape(metric.id),
        escape(metric.dimension),
        escape(metric.name),
        escape(metric.sourceName),
        escape(metric.sourceTable),
        escape(metric.sourceUrl),
        escape(metric.updateFrequency),
        escape(metric.direction),
        num(metric.weightWithinDimension),
        escape(metric.proxyFallbackMetricId),
        bool(metric.isProxyTarget),
      ].join(", ") +
      ");"
  );
}
lines.push("");

// Metric values
lines.push("-- Metric Values");
for (const mv of RAW_METRIC_VALUES) {
  const id = uuid("mv", `${mv.cmaId}_${mv.metricId}`);
  lines.push(
    `INSERT INTO metric_values (id, cma_id, metric_id, period, value, is_proxy, proxy_note, source_publication_date, source_table_id) VALUES (` +
      [
        escape(id),
        escape(mv.cmaId),
        escape(mv.metricId),
        escape(mv.period),
        num(mv.value),
        bool(mv.isProxy),
        escape(mv.proxyNote),
        escape(mv.sourcePublicationDate),
        escape(mv.sourceTableId),
      ].join(", ") +
      ");"
  );
}
lines.push("");

// Compute and insert scores
lines.push("-- CMA Scores (precomputed)");
const rawData = toRawMetricData();
const scores = computeScores(rawData, DEFAULT_WEIGHTS);

// Sort by overall score for rank assignment
const sorted = [...scores].sort((a, b) => b.overallScore - a.overallScore);

for (const cs of sorted) {
  const id = `score_${cs.cmaId}`;
  lines.push(
    `INSERT INTO cma_scores (id, cma_id, economic_score, housing_score, quality_score, safety_score, environment_score, demographic_score, overall_score, completeness_score, default_weights_json) VALUES (` +
      [
        escape(id),
        escape(cs.cmaId),
        num(cs.economicScore !== null ? Math.round(cs.economicScore * 10) / 10 : null),
        num(cs.housingScore !== null ? Math.round(cs.housingScore * 10) / 10 : null),
        num(cs.qualityScore !== null ? Math.round(cs.qualityScore * 10) / 10 : null),
        num(cs.safetyScore !== null ? Math.round(cs.safetyScore * 10) / 10 : null),
        num(cs.environmentScore !== null ? Math.round(cs.environmentScore * 10) / 10 : null),
        num(cs.demographicScore !== null ? Math.round(cs.demographicScore * 10) / 10 : null),
        num(Math.round(cs.overallScore * 10) / 10),
        num(Math.round(cs.completenessScore * 10) / 10),
        escape(JSON.stringify(DEFAULT_WEIGHTS)),
      ].join(", ") +
      ");"
  );
}
lines.push("");
lines.push("COMMIT;");
lines.push("");

// Write to file
const outPath = path.join(process.cwd(), "migrations", "0002_seed.sql");
fs.writeFileSync(outPath, lines.join("\n"), "utf-8");

console.log(`Seed SQL written to ${outPath}`);
console.log(`  ${CMAS.length} CMAs`);
console.log(`  ${METRICS.length} metrics`);
console.log(`  ${RAW_METRIC_VALUES.length} metric values`);
console.log(`  ${scores.length} CMA scores`);

// Print top 10 for verification
console.log("\nTop 10 by overall score (default weights):");
sorted.slice(0, 10).forEach((cs, idx) => {
  const cma = CMAS.find((c) => c.id === cs.cmaId)!;
  console.log(
    `  ${idx + 1}. ${cma.name} — Overall: ${cs.overallScore.toFixed(1)}, Completeness: ${cs.completenessScore.toFixed(1)}%`
  );
});
