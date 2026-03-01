/**
 * Historical Data Backfill — Canadian City Prosperity Dashboard
 * Downloads 5 StatsCan tables and extracts per-CMA historical values.
 *
 * Usage: pnpm tsx scripts/backfill-history.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface HistoricalDataPoint {
  metricId: string;
  cmaId: string;
  period: string;
  value: number;
  isProxy: boolean;
  proxyNote: string | null;
  sourceTableId: string;
  collectedAt: string;
}

function generateMonthlyPeriods(startYear: number, startMonth: number, endYear: number, endMonth: number): string[] {
  const periods: string[] = [];
  let y = startYear, m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    periods.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return periods;
}

function generateAnnualPeriods(startYear: number, endYear: number): string[] {
  const periods: string[] = [];
  for (let y = startYear; y <= endYear; y++) periods.push(String(y));
  return periods;
}

const MONTHLY_PERIODS = generateMonthlyPeriods(2021, 1, 2026, 1);
const ANNUAL_PERIODS = generateAnnualPeriods(2019, 2024);

const CMA_LFS_GEO_MAP: Record<string, string[]> = {
  cma_toronto: ["Toronto, Ontario"],
  cma_montreal: ["Montréal, Quebec", "Montreal, Quebec"],
  cma_vancouver: ["Vancouver, British Columbia"],
  cma_calgary: ["Calgary, Alberta"],
  cma_edmonton: ["Edmonton, Alberta"],
  cma_ottawa: ["Ottawa-Gatineau, Ontario/Quebec", "Ottawa - Gatineau, Ontario/Quebec"],
  cma_winnipeg: ["Winnipeg, Manitoba"],
  cma_quebec_city: ["Québec, Quebec", "Quebec, Quebec"],
  cma_hamilton: ["Hamilton, Ontario"],
  cma_kitchener: ["Kitchener-Cambridge-Waterloo, Ontario", "Kitchener - Cambridge - Waterloo, Ontario"],
  cma_london: ["London, Ontario"],
  cma_halifax: ["Halifax, Nova Scotia"],
  cma_oshawa: ["Oshawa, Ontario"],
  cma_victoria: ["Victoria, British Columbia"],
  cma_windsor: ["Windsor, Ontario"],
  cma_saskatoon: ["Saskatoon, Saskatchewan"],
  cma_regina: ["Regina, Saskatchewan"],
  cma_sherbrooke: ["Sherbrooke, Quebec"],
  cma_barrie: ["Barrie, Ontario"],
  cma_kelowna: ["Kelowna, British Columbia"],
  cma_abbotsford: ["Abbotsford-Mission, British Columbia", "Abbotsford - Mission, British Columbia"],
  cma_sudbury: ["Greater Sudbury, Ontario"],
  cma_kingston: ["Kingston, Ontario"],
  cma_saguenay: ["Saguenay, Quebec"],
  cma_thunder_bay: ["Thunder Bay, Ontario"],
  cma_saint_john: ["Saint John, New Brunswick"],
  cma_fredericton: ["Fredericton, New Brunswick"],
  cma_moncton: ["Moncton, New Brunswick"],
  cma_guelph: ["Guelph, Ontario"],
  cma_brantford: ["Brantford, Ontario"],
  cma_peterborough: ["Peterborough, Ontario"],
  cma_lethbridge: ["Lethbridge, Alberta"],
  cma_nanaimo: ["Nanaimo, British Columbia"],
  cma_red_deer: ["Red Deer, Alberta"],
  cma_trois_rivieres: ["Trois-Rivières, Quebec", "Trois-Rivieres, Quebec"],
  cma_st_johns: ["St. John's, Newfoundland and Labrador"],
};

const CMA_POP_GEO_MAP: Record<string, string[]> = {
  cma_toronto: ["Toronto (CMA), Ontario"],
  cma_montreal: ["Montréal (CMA), Quebec"],
  cma_vancouver: ["Vancouver (CMA), British Columbia"],
  cma_calgary: ["Calgary (CMA), Alberta"],
  cma_edmonton: ["Edmonton (CMA), Alberta"],
  cma_ottawa: ["Ottawa - Gatineau (CMA), Ontario/Quebec"],
  cma_winnipeg: ["Winnipeg (CMA), Manitoba"],
  cma_quebec_city: ["Québec (CMA), Quebec"],
  cma_hamilton: ["Hamilton (CMA), Ontario"],
  cma_kitchener: ["Kitchener - Cambridge - Waterloo (CMA), Ontario"],
  cma_london: ["London (CMA), Ontario"],
  cma_halifax: ["Halifax (CMA), Nova Scotia"],
  cma_oshawa: ["Oshawa (CMA), Ontario"],
  cma_victoria: ["Victoria (CMA), British Columbia"],
  cma_windsor: ["Windsor (CMA), Ontario"],
  cma_saskatoon: ["Saskatoon (CMA), Saskatchewan"],
  cma_regina: ["Regina (CMA), Saskatchewan"],
  cma_sherbrooke: ["Sherbrooke (CMA), Quebec"],
  cma_barrie: ["Barrie (CMA), Ontario"],
  cma_kelowna: ["Kelowna (CMA), British Columbia"],
  cma_abbotsford: ["Abbotsford - Mission (CMA), British Columbia"],
  cma_sudbury: ["Greater Sudbury (CMA), Ontario"],
  cma_kingston: ["Kingston (CMA), Ontario"],
  cma_saguenay: ["Saguenay (CMA), Quebec"],
  cma_thunder_bay: ["Thunder Bay (CMA), Ontario"],
  cma_saint_john: ["Saint John (CMA), New Brunswick"],
  cma_fredericton: ["Fredericton (CMA), New Brunswick"],
  cma_moncton: ["Moncton (CMA), New Brunswick"],
  cma_guelph: ["Guelph (CMA), Ontario"],
  cma_brantford: ["Brantford (CMA), Ontario"],
  cma_peterborough: ["Peterborough (CMA), Ontario"],
  cma_lethbridge: ["Lethbridge (CMA), Alberta"],
  cma_nanaimo: ["Nanaimo (CMA), British Columbia"],
  cma_red_deer: ["Red Deer (CMA), Alberta"],
  cma_trois_rivieres: ["Trois-Rivières (CMA), Quebec"],
  cma_st_johns: ["St. John's (CMA), Newfoundland and Labrador"],
};

const CMA_NHPI_GEO_MAP: Record<string, [string[], boolean, string | null]> = {
  cma_toronto: [["Toronto, Ontario"], false, null],
  cma_montreal: [["Montréal, Quebec"], false, null],
  cma_vancouver: [["Vancouver, British Columbia"], false, null],
  cma_calgary: [["Calgary, Alberta"], false, null],
  cma_edmonton: [["Edmonton, Alberta"], false, null],
  cma_ottawa: [["Ottawa-Gatineau, Ontario part, Ontario/Quebec", "Ottawa-Gatineau, Ontario/Quebec"], false, null],
  cma_winnipeg: [["Winnipeg, Manitoba"], false, null],
  cma_quebec_city: [["Québec, Quebec"], false, null],
  cma_hamilton: [["Hamilton, Ontario"], false, null],
  cma_kitchener: [["Kitchener-Cambridge-Waterloo, Ontario"], false, null],
  cma_london: [["London, Ontario"], false, null],
  cma_halifax: [["Halifax, Nova Scotia"], false, null],
  cma_oshawa: [["Oshawa, Ontario"], false, null],
  cma_victoria: [["Victoria, British Columbia"], false, null],
  cma_windsor: [["Windsor, Ontario"], false, null],
  cma_saskatoon: [["Saskatoon, Saskatchewan"], false, null],
  cma_regina: [["Regina, Saskatchewan"], false, null],
  cma_sherbrooke: [["Sherbrooke, Quebec"], false, null],
  cma_barrie: [["Ontario"], true, "Ontario provincial NHPI used as proxy"],
  cma_kelowna: [["Kelowna, British Columbia"], false, null],
  cma_abbotsford: [["British Columbia"], true, "BC provincial NHPI used as proxy"],
  cma_sudbury: [["Greater Sudbury, Ontario"], false, null],
  cma_kingston: [["Ontario"], true, "Ontario provincial NHPI used as proxy"],
  cma_saguenay: [["Quebec"], true, "Quebec provincial NHPI used as proxy"],
  cma_thunder_bay: [["Ontario"], true, "Ontario provincial NHPI used as proxy"],
  cma_saint_john: [["Saint John, Fredericton, and Moncton, New Brunswick"], false, null],
  cma_fredericton: [["Saint John, Fredericton, and Moncton, New Brunswick"], false, null],
  cma_moncton: [["Saint John, Fredericton, and Moncton, New Brunswick"], false, null],
  cma_guelph: [["Guelph, Ontario"], false, null],
  cma_brantford: [["Ontario"], true, "Ontario provincial NHPI used as proxy"],
  cma_peterborough: [["Ontario"], true, "Ontario provincial NHPI used as proxy"],
  cma_lethbridge: [["Alberta"], true, "Alberta provincial NHPI used as proxy"],
  cma_nanaimo: [["British Columbia"], true, "BC provincial NHPI used as proxy"],
  cma_red_deer: [["Alberta"], true, "Alberta provincial NHPI used as proxy"],
  cma_trois_rivieres: [["Trois-Rivières, Quebec"], false, null],
  cma_st_johns: [["St. John's, Newfoundland and Labrador"], false, null],
};

const CMA_CPI_GEO_MAP: Record<string, [string[], boolean, string | null]> = {
  cma_toronto: [["Toronto, Ontario"], false, null],
  cma_montreal: [["Montréal, Quebec"], false, null],
  cma_vancouver: [["Vancouver, British Columbia"], false, null],
  cma_calgary: [["Calgary, Alberta"], false, null],
  cma_edmonton: [["Edmonton, Alberta"], false, null],
  cma_ottawa: [["Ottawa-Gatineau, Ontario part, Ontario/Quebec", "Ottawa-Gatineau, Ontario/Quebec"], false, null],
  cma_winnipeg: [["Winnipeg, Manitoba"], false, null],
  cma_quebec_city: [["Québec, Quebec", "Quebec, Quebec"], false, null],
  cma_hamilton: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_kitchener: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_london: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_halifax: [["Halifax, Nova Scotia"], false, null],
  cma_oshawa: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_victoria: [["Victoria, British Columbia"], false, null],
  cma_windsor: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_saskatoon: [["Saskatoon, Saskatchewan"], false, null],
  cma_regina: [["Regina, Saskatchewan"], false, null],
  cma_sherbrooke: [["Quebec"], true, "Quebec provincial CPI used as proxy"],
  cma_barrie: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_kelowna: [["British Columbia"], true, "BC provincial CPI used as proxy"],
  cma_abbotsford: [["British Columbia"], true, "BC provincial CPI used as proxy"],
  cma_sudbury: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_kingston: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_saguenay: [["Quebec"], true, "Quebec provincial CPI used as proxy"],
  cma_thunder_bay: [["Thunder Bay, Ontario"], false, null],
  cma_saint_john: [["Saint John, New Brunswick"], false, null],
  cma_fredericton: [["New Brunswick"], true, "New Brunswick provincial CPI used as proxy"],
  cma_moncton: [["New Brunswick"], true, "New Brunswick provincial CPI used as proxy"],
  cma_guelph: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_brantford: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_peterborough: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_lethbridge: [["Alberta"], true, "Alberta provincial CPI used as proxy"],
  cma_nanaimo: [["British Columbia"], true, "BC provincial CPI used as proxy"],
  cma_red_deer: [["Alberta"], true, "Alberta provincial CPI used as proxy"],
  cma_trois_rivieres: [["Quebec"], true, "Quebec provincial CPI used as proxy"],
  cma_st_johns: [["St. John's, Newfoundland and Labrador"], false, null],
};

const CMA_CSI_GEO_MAP: Record<string, [string[], boolean, string | null]> = {
  cma_toronto: [["Toronto, Ontario [35535]"], false, null],
  cma_montreal: [["Montréal, Quebec [24462]"], false, null],
  cma_vancouver: [["Vancouver, British Columbia [59933]"], false, null],
  cma_calgary: [["Calgary, Alberta [48825]"], false, null],
  cma_edmonton: [["Edmonton, Alberta [48835]"], false, null],
  cma_ottawa: [["Ottawa-Gatineau, Ontario/Quebec [24505/35505]"], false, null],
  cma_winnipeg: [["Winnipeg, Manitoba [46602]"], false, null],
  cma_quebec_city: [["Québec, Quebec [24421]"], false, null],
  cma_hamilton: [["Hamilton, Ontario [35537]"], false, null],
  cma_kitchener: [["Kitchener-Cambridge-Waterloo, Ontario [35541]"], false, null],
  cma_london: [["London, Ontario [35555]"], false, null],
  cma_halifax: [["Halifax, Nova Scotia [12205]"], false, null],
  cma_oshawa: [["Ontario [35]"], true, "Ontario provincial CSI used as proxy"],
  cma_victoria: [["Victoria, British Columbia [59935]"], false, null],
  cma_windsor: [["Windsor, Ontario [35559]"], false, null],
  cma_saskatoon: [["Saskatoon, Saskatchewan [47725]"], false, null],
  cma_regina: [["Regina, Saskatchewan [47705]"], false, null],
  cma_sherbrooke: [["Sherbrooke, Quebec [24433]"], false, null],
  cma_barrie: [["Barrie, Ontario [35568]"], false, null],
  cma_kelowna: [["Kelowna, British Columbia [59915]"], false, null],
  cma_abbotsford: [["Abbotsford-Mission, British Columbia [59932]"], false, null],
  cma_sudbury: [["Greater Sudbury, Ontario [35580]"], false, null],
  cma_kingston: [["Kingston, Ontario [35521]"], false, null],
  cma_saguenay: [["Saguenay, Quebec [24408]"], false, null],
  cma_thunder_bay: [["Thunder Bay, Ontario [35595]"], false, null],
  cma_saint_john: [["Saint John, New Brunswick [13310]"], false, null],
  cma_fredericton: [["Fredericton, New Brunswick [13320]"], false, null],
  cma_moncton: [["Moncton, New Brunswick [13305]"], false, null],
  cma_guelph: [["Guelph, Ontario [35550]"], false, null],
  cma_brantford: [["Brantford, Ontario [35543]"], false, null],
  cma_peterborough: [["Peterborough, Ontario [35529]"], false, null],
  cma_lethbridge: [["Lethbridge, Alberta [48810]"], false, null],
  cma_nanaimo: [["Nanaimo, British Columbia [59938]", "Nanaimo, British Columbia [59943]"], false, null],
  cma_red_deer: [["Red Deer, Alberta [48830]"], false, null],
  cma_trois_rivieres: [["Trois-Rivières, Quebec [24442]"], false, null],
  cma_st_johns: [["St. John's, Newfoundland and Labrador [10001]"], false, null],
};

// ── HTTP Download ─────────────────────────────────────────────────────────────

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 300000 }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(destPath, () => {});
        if (response.headers.location) {
          downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        } else {
          reject(new Error(`Redirect with no location from ${url}`));
        }
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        reject(new Error(`HTTP ${response.statusCode} from ${url}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
      file.on("error", (err) => { fs.unlink(destPath, () => {}); reject(err); });
    });
    req.on("error", (err) => { fs.unlink(destPath, () => {}); reject(err); });
    req.on("timeout", () => { req.destroy(); fs.unlink(destPath, () => {}); reject(new Error(`Timeout downloading ${url}`)); });
  });
}

function downloadAndExtract(tableId: string, tmpDir: string): Promise<string> {
  const parts = tableId.split("-");
  const filePrefix = parts.slice(0, parts.length - 1).join("");
  const url = `https://www150.statcan.gc.ca/n1/tbl/csv/${filePrefix}-eng.zip`;
  const zipPath = path.join(tmpDir, `${filePrefix}.zip`);
  const csvPath = path.join(tmpDir, `${filePrefix}.csv`);
  if (fs.existsSync(csvPath)) {
    console.log(`  [cache] ${tableId} already extracted`);
    return Promise.resolve(csvPath);
  }
  console.log(`  [download] ${tableId} from ${url}`);
  return downloadFile(url, zipPath).then(() => {
    console.log(`  [extract] ${tableId}`);
    execSync(`unzip -o "${zipPath}" "${filePrefix}.csv" -d "${tmpDir}"`, { stdio: "pipe" });
    return csvPath;
  });
}

// ── CSV Parsing ───────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) { result.push(current); current = ""; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

function parseStatsCsvAllPeriods(
  csvPath: string, col1Header: string, col2Header: string | null, filterColumns?: string[]
): Map<string, Map<string, string>> {
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n");
  if (lines.length === 0) throw new Error(`Empty CSV: ${csvPath}`);
  const header = parseCSVLine(lines[0]);
  const REF_DATE_IDX = header.findIndex(h => h.trim().replace(/^\uFEFF/, "") === "REF_DATE");
  const GEO_IDX = header.findIndex(h => h.trim() === "GEO");
  const COL1_IDX = header.findIndex(h => h.trim() === col1Header);
  const COL2_IDX = col2Header ? header.findIndex(h => h.trim() === col2Header) : -1;
  const VALUE_IDX = header.findIndex(h => h.trim() === "VALUE");
  if (REF_DATE_IDX < 0 || GEO_IDX < 0 || COL1_IDX < 0 || VALUE_IDX < 0) {
    throw new Error(`Missing columns in ${csvPath}. Headers: ${header.join(", ")}`);
  }
  const filterSpecs: Array<{ idx: number; requiredValue: string }> = [];
  for (const spec of filterColumns ?? []) {
    const eqPos = spec.indexOf("=");
    if (eqPos < 0) continue;
    const colName = spec.substring(0, eqPos);
    const reqVal = spec.substring(eqPos + 1);
    const idx = header.findIndex(h => h.trim() === colName);
    if (idx >= 0) filterSpecs.push({ idx, requiredValue: reqVal });
  }
  const byPeriod = new Map<string, Map<string, string>>();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    if (cols.length < VALUE_IDX + 1) continue;
    let filtered = false;
    for (const { idx, requiredValue } of filterSpecs) {
      if (cols[idx] !== requiredValue) { filtered = true; break; }
    }
    if (filtered) continue;
    const period = cols[REF_DATE_IDX];
    const geo = cols[GEO_IDX];
    const col1 = cols[COL1_IDX];
    const col2 = col2Header && COL2_IDX >= 0 ? cols[COL2_IDX] : "";
    const value = cols[VALUE_IDX];
    const key = col2 ? `${geo}\t${col1}\t${col2}` : `${geo}\t${col1}`;
    if (!byPeriod.has(period)) byPeriod.set(period, new Map());
    byPeriod.get(period)!.set(key, value);
  }
  return byPeriod;
}

function lookupByGeoPatterns(data: Map<string, string>, patterns: string[], col1Value: string, col2Value?: string): string | null {
  for (const geo of patterns) {
    const key = col2Value ? `${geo}\t${col1Value}\t${col2Value}` : `${geo}\t${col1Value}`;
    const val = data.get(key);
    if (val && val.trim() !== "") return val;
  }
  return null;
}

function parseFloat2(s: string | null): number | null {
  if (!s) return null;
  const n = parseFloat(s.trim());
  return isNaN(n) ? null : n;
}

// ── Extraction Functions ──────────────────────────────────────────────────────

interface ExtractedPoint {
  cmaId: string; period: string; value: number | null; isProxy: boolean; proxyNote: string | null;
}

function extractLfsHistory(csvPath: string, characteristic: string): ExtractedPoint[] {
  console.log(`  Parsing LFS ${characteristic}...`);
  const byPeriod = parseStatsCsvAllPeriods(csvPath, "Labour force characteristics", "Data type", ["Statistics=Estimate"]);
  const points: ExtractedPoint[] = [];
  for (const period of MONTHLY_PERIODS) {
    const data = byPeriod.get(period);
    if (!data) continue;
    for (const [cmaId, patterns] of Object.entries(CMA_LFS_GEO_MAP)) {
      const raw = lookupByGeoPatterns(data, patterns, characteristic, "Seasonally adjusted");
      const value = parseFloat2(raw);
      if (value !== null) points.push({ cmaId, period, value, isProxy: false, proxyNote: null });
    }
  }
  return points;
}

function extractNhpiHistory(csvPath: string): ExtractedPoint[] {
  console.log(`  Parsing NHPI...`);
  const byPeriod = parseStatsCsvAllPeriods(csvPath, "New housing price indexes", null);
  const points: ExtractedPoint[] = [];
  for (const period of MONTHLY_PERIODS) {
    const data = byPeriod.get(period);
    if (!data) continue;
    for (const [cmaId, [patterns, isProxy, proxyNote]] of Object.entries(CMA_NHPI_GEO_MAP)) {
      const raw = lookupByGeoPatterns(data, patterns, "Total (house and land)");
      const value = parseFloat2(raw);
      if (value !== null) points.push({ cmaId, period, value, isProxy, proxyNote });
    }
  }
  return points;
}

function extractCpiHistory(csvPath: string): ExtractedPoint[] {
  console.log(`  Parsing CPI...`);
  const byPeriod = parseStatsCsvAllPeriods(csvPath, "Products and product groups", null);
  const points: ExtractedPoint[] = [];
  for (const period of MONTHLY_PERIODS) {
    const data = byPeriod.get(period);
    if (!data) continue;
    for (const [cmaId, [patterns, isProxy, proxyNote]] of Object.entries(CMA_CPI_GEO_MAP)) {
      const raw = lookupByGeoPatterns(data, patterns, "All-items");
      const value = parseFloat2(raw);
      if (value !== null) points.push({ cmaId, period, value, isProxy, proxyNote });
    }
  }
  return points;
}

function extractCsiHistory(csvPath: string): ExtractedPoint[] {
  console.log(`  Parsing CSI...`);
  const byPeriod = parseStatsCsvAllPeriods(csvPath, "Statistics", null);
  const points: ExtractedPoint[] = [];
  for (const period of ANNUAL_PERIODS) {
    const data = byPeriod.get(period);
    if (!data) continue;
    for (const [cmaId, [patterns, isProxy, proxyNote]] of Object.entries(CMA_CSI_GEO_MAP)) {
      const raw = lookupByGeoPatterns(data, patterns, "Crime severity index");
      const value = parseFloat2(raw);
      if (value !== null) points.push({ cmaId, period, value, isProxy, proxyNote });
    }
  }
  return points;
}

function extractPopulationHistory(csvPath: string): ExtractedPoint[] {
  console.log(`  Parsing Population...`);
  const byPeriod = parseStatsCsvAllPeriods(csvPath, "Gender", "Age group");
  const points: ExtractedPoint[] = [];
  for (const period of ANNUAL_PERIODS) {
    const data = byPeriod.get(period);
    if (!data) continue;
    for (const [cmaId, patterns] of Object.entries(CMA_POP_GEO_MAP)) {
      const raw = lookupByGeoPatterns(data, patterns, "Total - gender", "All ages");
      const value = parseFloat2(raw);
      if (value !== null) points.push({ cmaId, period, value: Math.round(value), isProxy: false, proxyNote: null });
    }
  }
  return points;
}

// ── TypeScript Module Generator ───────────────────────────────────────────────

function generateTypeScriptModule(points: HistoricalDataPoint[]): string {
  const metricPeriods = new Map<string, Set<string>>();
  for (const p of points) {
    if (!metricPeriods.has(p.metricId)) metricPeriods.set(p.metricId, new Set());
    metricPeriods.get(p.metricId)!.add(p.period);
  }
  const periodsByMetric: Record<string, string[]> = {};
  for (const [metricId, periods] of metricPeriods.entries()) {
    periodsByMetric[metricId] = Array.from(periods).sort();
  }
  const latestByMetric: Record<string, string> = {};
  for (const [metricId, periods] of Object.entries(periodsByMetric)) {
    latestByMetric[metricId] = periods[periods.length - 1];
  }
  return [
    "/**",
    " * Historical metric data — auto-generated by scripts/backfill-history.ts",
    ` * Generated: ${new Date().toISOString()}`,
    ` * Total data points: ${points.length}`,
    " * DO NOT EDIT MANUALLY",
    " */",
    "",
    "export interface HistoricalDataPoint {",
    "  metricId: string;",
    "  cmaId: string;",
    "  period: string;",
    "  value: number;",
    "  isProxy: boolean;",
    "  proxyNote: string | null;",
    "  sourceTableId: string;",
    "  collectedAt: string;",
    "}",
    "",
    "export const HISTORY: HistoricalDataPoint[] = " + JSON.stringify(points, null, 2) + ";",
    "",
    "export function getMetricHistory(metricId: string, cmaId: string): HistoricalDataPoint[] {",
    "  return HISTORY.filter(p => p.metricId === metricId && p.cmaId === cmaId).sort((a, b) => a.period.localeCompare(b.period));",
    "}",
    "",
    "export function getLatestPeriod(metricId: string): string | null {",
    `  const map: Record<string, string> = ${JSON.stringify(latestByMetric)};`,
    "  return map[metricId] ?? null;",
    "}",
    "",
    "export function getMetricPeriods(metricId: string): string[] {",
    `  const map: Record<string, string[]> = ${JSON.stringify(periodsByMetric)};`,
    "  return map[metricId] ?? [];",
    "}",
    "",
  ].join("\n");
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const tmpDir = path.join(projectRoot, ".tmp-backfill");
  const dataDir = path.join(projectRoot, "data");
  const outputJsonPath = path.join(dataDir, "metric-history.json");
  const outputTsPath = path.join(projectRoot, "src", "lib", "history-data.ts");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const collectedAt = new Date().toISOString();
  const allPoints: HistoricalDataPoint[] = [];

  console.log("\n=== Canadian Prosperity Dashboard — Historical Backfill ===\n");

  console.log("[1/5] LFS table 14-10-0459-01...");
  const lfsCsv = await downloadAndExtract("14-10-0459-01", tmpDir);
  const unempPts = extractLfsHistory(lfsCsv, "Unemployment rate");
  console.log(`    Unemployment: ${unempPts.length} points`);
  for (const p of unempPts) allPoints.push({ ...p, value: p.value!, metricId: "metric_unemployment_rate", sourceTableId: "14-10-0459-01", collectedAt });
  const empPts = extractLfsHistory(lfsCsv, "Employment rate");
  console.log(`    Employment: ${empPts.length} points`);
  for (const p of empPts) allPoints.push({ ...p, value: p.value!, metricId: "metric_employment_rate", sourceTableId: "14-10-0459-01", collectedAt });

  console.log("\n[2/5] NHPI table 18-10-0205-01...");
  const nhpiCsv = await downloadAndExtract("18-10-0205-01", tmpDir);
  const nhpiPts = extractNhpiHistory(nhpiCsv);
  console.log(`    NHPI: ${nhpiPts.length} points`);
  for (const p of nhpiPts) allPoints.push({ ...p, value: p.value!, metricId: "metric_housing_price_index", sourceTableId: "18-10-0205-01", collectedAt });

  console.log("\n[3/5] CPI table 18-10-0004-01...");
  const cpiCsv = await downloadAndExtract("18-10-0004-01", tmpDir);
  const cpiPts = extractCpiHistory(cpiCsv);
  console.log(`    CPI: ${cpiPts.length} points`);
  for (const p of cpiPts) allPoints.push({ ...p, value: p.value!, metricId: "metric_cpi", sourceTableId: "18-10-0004-01", collectedAt });

  console.log("\n[4/5] CSI table 35-10-0026-01...");
  const csiCsv = await downloadAndExtract("35-10-0026-01", tmpDir);
  const csiPts = extractCsiHistory(csiCsv);
  console.log(`    CSI: ${csiPts.length} points`);
  for (const p of csiPts) allPoints.push({ ...p, value: p.value!, metricId: "metric_csi", sourceTableId: "35-10-0026-01", collectedAt });

  console.log("\n[5/5] Population table 17-10-0148-01...");
  const popCsv = await downloadAndExtract("17-10-0148-01", tmpDir);
  const popPts = extractPopulationHistory(popCsv);
  console.log(`    Population: ${popPts.length} points`);
  for (const p of popPts) allPoints.push({ ...p, value: p.value!, metricId: "metric_population", sourceTableId: "17-10-0148-01", collectedAt });

  console.log("\n=== Summary ===");
  console.log(`Total: ${allPoints.length} data points`);
  const byMetric = new Map<string, number>();
  for (const p of allPoints) byMetric.set(p.metricId, (byMetric.get(p.metricId) ?? 0) + 1);
  for (const [m, c] of byMetric.entries()) {
    const cmas = new Set(allPoints.filter(p => p.metricId === m).map(p => p.cmaId)).size;
    const periods = new Set(allPoints.filter(p => p.metricId === m).map(p => p.period)).size;
    console.log(`  ${m}: ${c} pts (${cmas} CMAs, ${periods} periods)`);
  }

  console.log("\nWriting outputs...");
  fs.writeFileSync(outputJsonPath, JSON.stringify(allPoints, null, 2), "utf-8");
  console.log(`  data/metric-history.json: ${(fs.statSync(outputJsonPath).size / 1024 / 1024).toFixed(2)} MB`);
  const tsContent = generateTypeScriptModule(allPoints);
  fs.writeFileSync(outputTsPath, tsContent, "utf-8");
  console.log(`  src/lib/history-data.ts: ${(fs.statSync(outputTsPath).size / 1024).toFixed(1)} KB`);
  console.log("\nBackfill complete.");
}

main().catch((err) => { console.error("FATAL:", err); process.exit(1); });
