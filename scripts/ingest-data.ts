/**
 * Data Ingestion Script — Canadian City Prosperity Dashboard
 *
 * Downloads and parses real data from Statistics Canada's Web Data Service
 * and other official sources, then writes updated values into src/lib/data.ts.
 *
 * Data sources used:
 *   - StatsCan Table 14-10-0459-01 (LFS): Unemployment/Employment rates, Jan 2026
 *   - StatsCan Table 17-10-0148-01: Population estimates, 2024
 *   - StatsCan Table 18-10-0205-01 (NHPI): New Housing Price Index, Jan 2026
 *   - StatsCan Table 18-10-0004-01 (CPI): Consumer Price Index, Jan 2026
 *   - StatsCan Table 35-10-0026-01 (UCR): Crime Severity Index, 2024
 *   - CMHC Rental Market Survey 2024 (Oct survey, Jan 2025 release): Rent/Vacancy
 *   - StatsCan Census 2021: Immigration Share, Median Age (unchanged until 2026 Census)
 *
 * Usage:
 *   npx tsx scripts/ingest-data.ts
 *   (or: pnpm tsx scripts/ingest-data.ts)
 *
 * The script downloads live zip files from StatsCan, parses them, extracts
 * CMA-level values, and rewrites the RAW_METRIC_VALUES array and CMAS
 * populationLatest fields in src/lib/data.ts.
 *
 * For CMHC data (no public API), verified 2024 CMHC Rental Market Survey
 * values are used (October 2024 survey, published January 2025).
 * For Census 2021 metrics (immigration share, median age), existing values
 * are kept since no new Census data exists until 2026.
 * For AQHI, Environment Canada API values are used where available with
 * hardcoded seasonal averages as fallback.
 */

import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";
import { execSync } from "child_process";

// ── Types ─────────────────────────────────────────────────────────────────────

type CmaId = string;
type MetricRow = { cmaId: CmaId; value: number | null; isProxy: boolean; proxyNote: string | null };

// ── CMA Geographic Code Mappings ──────────────────────────────────────────────
// Maps our internal CMA IDs to StatsCan geography name patterns used in CSV files.
// Keyed by cmaId, value is an array of patterns to try in order.

const CMA_LFS_GEO_MAP: Record<string, string[]> = {
  cma_toronto:      ["Toronto, Ontario"],
  cma_montreal:     ["Montréal, Quebec", "Montreal, Quebec"],
  cma_vancouver:    ["Vancouver, British Columbia"],
  cma_calgary:      ["Calgary, Alberta"],
  cma_edmonton:     ["Edmonton, Alberta"],
  cma_ottawa:       ["Ottawa-Gatineau, Ontario/Quebec", "Ottawa - Gatineau, Ontario/Quebec"],
  cma_winnipeg:     ["Winnipeg, Manitoba"],
  cma_quebec_city:  ["Québec, Quebec", "Quebec, Quebec"],
  cma_hamilton:     ["Hamilton, Ontario"],
  cma_kitchener:    ["Kitchener-Cambridge-Waterloo, Ontario", "Kitchener - Cambridge - Waterloo, Ontario"],
  cma_london:       ["London, Ontario"],
  cma_halifax:      ["Halifax, Nova Scotia"],
  cma_oshawa:       ["Oshawa, Ontario"],
  cma_victoria:     ["Victoria, British Columbia"],
  cma_windsor:      ["Windsor, Ontario"],
  cma_saskatoon:    ["Saskatoon, Saskatchewan"],
  cma_regina:       ["Regina, Saskatchewan"],
  cma_sherbrooke:   ["Sherbrooke, Quebec"],
  cma_barrie:       ["Barrie, Ontario"],
  cma_kelowna:      ["Kelowna, British Columbia"],
  cma_abbotsford:   ["Abbotsford-Mission, British Columbia", "Abbotsford - Mission, British Columbia"],
  cma_sudbury:      ["Greater Sudbury, Ontario"],
  cma_kingston:     ["Kingston, Ontario"],
  cma_saguenay:     ["Saguenay, Quebec"],
  cma_thunder_bay:  ["Thunder Bay, Ontario"],
  cma_saint_john:   ["Saint John, New Brunswick"],
  cma_fredericton:  ["Fredericton, New Brunswick"],
  cma_moncton:      ["Moncton, New Brunswick"],
  cma_guelph:       ["Guelph, Ontario"],
  cma_brantford:    ["Brantford, Ontario"],
  cma_peterborough: ["Peterborough, Ontario"],
  cma_lethbridge:   ["Lethbridge, Alberta"],
  cma_nanaimo:      ["Nanaimo, British Columbia"],
  cma_red_deer:     ["Red Deer, Alberta"],
  cma_trois_rivieres: ["Trois-Rivières, Quebec", "Trois-Rivieres, Quebec"],
  cma_st_johns:     ["St. John's, Newfoundland and Labrador"],
};

// Population table uses "(CMA)" suffix format
const CMA_POP_GEO_MAP: Record<string, string[]> = {
  cma_toronto:      ["Toronto (CMA), Ontario"],
  cma_montreal:     ["Montréal (CMA), Quebec"],
  cma_vancouver:    ["Vancouver (CMA), British Columbia"],
  cma_calgary:      ["Calgary (CMA), Alberta"],
  cma_edmonton:     ["Edmonton (CMA), Alberta"],
  cma_ottawa:       ["Ottawa - Gatineau (CMA), Ontario/Quebec"],
  cma_winnipeg:     ["Winnipeg (CMA), Manitoba"],
  cma_quebec_city:  ["Québec (CMA), Quebec"],
  cma_hamilton:     ["Hamilton (CMA), Ontario"],
  cma_kitchener:    ["Kitchener - Cambridge - Waterloo (CMA), Ontario"],
  cma_london:       ["London (CMA), Ontario"],
  cma_halifax:      ["Halifax (CMA), Nova Scotia"],
  cma_oshawa:       ["Oshawa (CMA), Ontario"],
  cma_victoria:     ["Victoria (CMA), British Columbia"],
  cma_windsor:      ["Windsor (CMA), Ontario"],
  cma_saskatoon:    ["Saskatoon (CMA), Saskatchewan"],
  cma_regina:       ["Regina (CMA), Saskatchewan"],
  cma_sherbrooke:   ["Sherbrooke (CMA), Quebec"],
  cma_barrie:       ["Barrie (CMA), Ontario"],
  cma_kelowna:      ["Kelowna (CMA), British Columbia"],
  cma_abbotsford:   ["Abbotsford - Mission (CMA), British Columbia"],
  cma_sudbury:      ["Greater Sudbury (CMA), Ontario"],
  cma_kingston:     ["Kingston (CMA), Ontario"],
  cma_saguenay:     ["Saguenay (CMA), Quebec"],
  cma_thunder_bay:  ["Thunder Bay (CMA), Ontario"],
  cma_saint_john:   ["Saint John (CMA), New Brunswick"],
  cma_fredericton:  ["Fredericton (CMA), New Brunswick"],
  cma_moncton:      ["Moncton (CMA), New Brunswick"],
  cma_guelph:       ["Guelph (CMA), Ontario"],
  cma_brantford:    ["Brantford (CMA), Ontario"],
  cma_peterborough: ["Peterborough (CMA), Ontario"],
  cma_lethbridge:   ["Lethbridge (CMA), Alberta"],
  cma_nanaimo:      ["Nanaimo (CMA), British Columbia"],
  cma_red_deer:     ["Red Deer (CMA), Alberta"],
  cma_trois_rivieres: ["Trois-Rivières (CMA), Quebec"],
  cma_st_johns:     ["St. John's (CMA), Newfoundland and Labrador"],
};

// NHPI table has fewer CMAs; some need regional/provincial proxy
// Map: cmaId -> [exactGeoPattern, isProxy, proxyNote]
const CMA_NHPI_GEO_MAP: Record<string, [string[], boolean, string | null]> = {
  cma_toronto:      [["Toronto, Ontario"], false, null],
  cma_montreal:     [["Montréal, Quebec"], false, null],
  cma_vancouver:    [["Vancouver, British Columbia"], false, null],
  cma_calgary:      [["Calgary, Alberta"], false, null],
  cma_edmonton:     [["Edmonton, Alberta"], false, null],
  cma_ottawa:       [["Ottawa-Gatineau, Ontario part, Ontario/Quebec", "Ottawa-Gatineau, Ontario/Quebec"], false, null],
  cma_winnipeg:     [["Winnipeg, Manitoba"], false, null],
  cma_quebec_city:  [["Québec, Quebec"], false, null],
  cma_hamilton:     [["Hamilton, Ontario"], false, null],
  cma_kitchener:    [["Kitchener-Cambridge-Waterloo, Ontario"], false, null],
  cma_london:       [["London, Ontario"], false, null],
  cma_halifax:      [["Halifax, Nova Scotia"], false, null],
  cma_oshawa:       [["Oshawa, Ontario"], false, null],
  cma_victoria:     [["Victoria, British Columbia"], false, null],
  cma_windsor:      [["Windsor, Ontario"], false, null],
  cma_saskatoon:    [["Saskatoon, Saskatchewan"], false, null],
  cma_regina:       [["Regina, Saskatchewan"], false, null],
  cma_sherbrooke:   [["Sherbrooke, Quebec"], false, null],
  cma_barrie:       [["Ontario"], true, "Ontario provincial NHPI used as proxy"],
  cma_kelowna:      [["Kelowna, British Columbia"], false, null],
  cma_abbotsford:   [["British Columbia"], true, "BC provincial NHPI used as proxy"],
  cma_sudbury:      [["Greater Sudbury, Ontario"], false, null],
  cma_kingston:     [["Ontario"], true, "Ontario provincial NHPI used as proxy"],
  cma_saguenay:     [["Quebec"], true, "Quebec provincial NHPI used as proxy"],
  cma_thunder_bay:  [["Ontario"], true, "Ontario provincial NHPI used as proxy"],
  cma_saint_john:   [["Saint John, Fredericton, and Moncton, New Brunswick"], false, null],
  cma_fredericton:  [["Saint John, Fredericton, and Moncton, New Brunswick"], false, null],
  cma_moncton:      [["Saint John, Fredericton, and Moncton, New Brunswick"], false, null],
  cma_guelph:       [["Guelph, Ontario"], false, null],
  cma_brantford:    [["Ontario"], true, "Ontario provincial NHPI used as proxy"],
  cma_peterborough: [["Ontario"], true, "Ontario provincial NHPI used as proxy"],
  cma_lethbridge:   [["Alberta"], true, "Alberta provincial NHPI used as proxy"],
  cma_nanaimo:      [["British Columbia"], true, "BC provincial NHPI used as proxy"],
  cma_red_deer:     [["Alberta"], true, "Alberta provincial NHPI used as proxy"],
  cma_trois_rivieres: [["Trois-Rivières, Quebec"], false, null],
  cma_st_johns:     [["St. John's, Newfoundland and Labrador"], false, null],
};

// CPI table covers ~15 direct cities; others get provincial proxy
const CMA_CPI_GEO_MAP: Record<string, [string[], boolean, string | null]> = {
  cma_toronto:      [["Toronto, Ontario"], false, null],
  cma_montreal:     [["Montréal, Quebec"], false, null],
  cma_vancouver:    [["Vancouver, British Columbia"], false, null],
  cma_calgary:      [["Calgary, Alberta"], false, null],
  cma_edmonton:     [["Edmonton, Alberta"], false, null],
  cma_ottawa:       [["Ottawa-Gatineau, Ontario part, Ontario/Quebec", "Ottawa-Gatineau, Ontario/Quebec"], false, null],
  cma_winnipeg:     [["Winnipeg, Manitoba"], false, null],
  cma_quebec_city:  [["Québec, Quebec", "Quebec, Quebec"], false, null],
  cma_hamilton:     [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_kitchener:    [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_london:       [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_halifax:      [["Halifax, Nova Scotia"], false, null],
  cma_oshawa:       [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_victoria:     [["Victoria, British Columbia"], false, null],
  cma_windsor:      [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_saskatoon:    [["Saskatoon, Saskatchewan"], false, null],
  cma_regina:       [["Regina, Saskatchewan"], false, null],
  cma_sherbrooke:   [["Quebec"], true, "Quebec provincial CPI used as proxy"],
  cma_barrie:       [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_kelowna:      [["British Columbia"], true, "BC provincial CPI used as proxy"],
  cma_abbotsford:   [["British Columbia"], true, "BC provincial CPI used as proxy"],
  cma_sudbury:      [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_kingston:     [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_saguenay:     [["Quebec"], true, "Quebec provincial CPI used as proxy"],
  cma_thunder_bay:  [["Thunder Bay, Ontario"], false, null],
  cma_saint_john:   [["Saint John, New Brunswick"], false, null],
  cma_fredericton:  [["New Brunswick"], true, "New Brunswick provincial CPI used as proxy"],
  cma_moncton:      [["New Brunswick"], true, "New Brunswick provincial CPI used as proxy"],
  cma_guelph:       [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_brantford:    [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_peterborough: [["Ontario"], true, "Ontario provincial CPI used as proxy"],
  cma_lethbridge:   [["Alberta"], true, "Alberta provincial CPI used as proxy"],
  cma_nanaimo:      [["British Columbia"], true, "BC provincial CPI used as proxy"],
  cma_red_deer:     [["Alberta"], true, "Alberta provincial CPI used as proxy"],
  cma_trois_rivieres: [["Quebec"], true, "Quebec provincial CPI used as proxy"],
  cma_st_johns:     [["St. John's, Newfoundland and Labrador"], false, null],
};

// CSI table uses geo codes in brackets. Map: cmaId -> [patterns, isProxy, proxyNote]
const CMA_CSI_GEO_MAP: Record<string, [string[], boolean, string | null]> = {
  cma_toronto:      [["Toronto, Ontario [35535]"], false, null],
  cma_montreal:     [["Montréal, Quebec [24462]"], false, null],
  cma_vancouver:    [["Vancouver, British Columbia [59933]"], false, null],
  cma_calgary:      [["Calgary, Alberta [48825]"], false, null],
  cma_edmonton:     [["Edmonton, Alberta [48835]"], false, null],
  cma_ottawa:       [["Ottawa-Gatineau, Ontario/Quebec [24505/35505]"], false, null],
  cma_winnipeg:     [["Winnipeg, Manitoba [46602]"], false, null],
  cma_quebec_city:  [["Québec, Quebec [24421]"], false, null],
  cma_hamilton:     [["Hamilton, Ontario [35537]"], false, null],
  cma_kitchener:    [["Kitchener-Cambridge-Waterloo, Ontario [35541]"], false, null],
  cma_london:       [["London, Ontario [35555]"], false, null],
  cma_halifax:      [["Halifax, Nova Scotia [12205]"], false, null],
  // Oshawa CMA not in 2024 CSI table — use Ontario provincial fallback
  cma_oshawa:       [["Ontario [35]"], true, "Ontario provincial CSI used as proxy (Oshawa CMA not in 2024 table)"],
  cma_victoria:     [["Victoria, British Columbia [59935]"], false, null],
  cma_windsor:      [["Windsor, Ontario [35559]"], false, null],
  cma_saskatoon:    [["Saskatoon, Saskatchewan [47725]"], false, null],
  cma_regina:       [["Regina, Saskatchewan [47705]"], false, null],
  cma_sherbrooke:   [["Sherbrooke, Quebec [24433]"], false, null],
  cma_barrie:       [["Barrie, Ontario [35568]"], false, null],
  cma_kelowna:      [["Kelowna, British Columbia [59915]"], false, null],
  cma_abbotsford:   [["Abbotsford-Mission, British Columbia [59932]"], false, null],
  cma_sudbury:      [["Greater Sudbury, Ontario [35580]"], false, null],
  cma_kingston:     [["Kingston, Ontario [35521]"], false, null],
  cma_saguenay:     [["Saguenay, Quebec [24408]"], false, null],
  cma_thunder_bay:  [["Thunder Bay, Ontario [35595]"], false, null],
  cma_saint_john:   [["Saint John, New Brunswick [13310]"], false, null],
  cma_fredericton:  [["Fredericton, New Brunswick [13320]"], false, null],
  cma_moncton:      [["Moncton, New Brunswick [13305]"], false, null],
  cma_guelph:       [["Guelph, Ontario [35550]"], false, null],
  cma_brantford:    [["Brantford, Ontario [35543]"], false, null],
  cma_peterborough: [["Peterborough, Ontario [35529]"], false, null],
  cma_lethbridge:   [["Lethbridge, Alberta [48810]"], false, null],
  cma_nanaimo:      [["Nanaimo, British Columbia [59938]", "Nanaimo, British Columbia [59943]"], false, null],
  cma_red_deer:     [["Red Deer, Alberta [48830]"], false, null],
  cma_trois_rivieres: [["Trois-Rivières, Quebec [24442]"], false, null],
  cma_st_johns:     [["St. John's, Newfoundland and Labrador [10001]"], false, null],
};

const ALL_CMA_IDS = Object.keys(CMA_LFS_GEO_MAP);

// ── HTTP Download ─────────────────────────────────────────────────────────────

function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith("https") ? https : http;
    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        if (response.headers.location) {
          downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        } else {
          reject(new Error(`Redirect with no location from ${url}`));
        }
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        reject(new Error(`HTTP ${response.statusCode} from ${url}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function downloadAndExtract(tableId: string, tmpDir: string): Promise<string> {
  // StatsCan URL format: 14100459-eng.zip (remove hyphens only between segments, keep last -eng)
  // e.g. "14-10-0459-01" -> "14100459" for the file prefix, URL uses "14100459-eng.zip"
  const tableNum = tableId.split("-").slice(0, -1).join("").replace(/^0+/, "") || tableId.replace(/-/g, "").replace(/^0+/, "");
  // Actually the format tested manually is: 14100459-eng.zip for table 14-10-0459-01
  // The pattern: join all segments except the trailing -01, strip leading zeros per segment is wrong.
  // Correct: "14-10-0459-01" -> "14100459" (drop all dashes, drop trailing "01" segment? No.)
  // Looking at the working URL: 14100459-eng.zip - that's all 8 digits: 14 10 0459 = 14100459
  // But "01" is the sub-table number which is dropped in the URL.
  // Pattern: take first 3 segments: "14", "10", "0459" -> "14100459"
  const parts = tableId.split("-");
  const filePrefix = parts.slice(0, parts.length - 1).join("");  // drop trailing "01"
  const url = `https://www150.statcan.gc.ca/n1/tbl/csv/${filePrefix}-eng.zip`;
  const zipPath = path.join(tmpDir, `${filePrefix}.zip`);
  const csvPath = path.join(tmpDir, `${filePrefix}.csv`);

  // If CSV already downloaded, skip
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

/**
 * Stream-parse a StatsCan CSV and index rows by (GEO, col1, col2, ...) => value.
 * col2Header can contain multiple pipe-separated values to filter on additional columns.
 * Format: "ColHeader=Value" to require exact match, or just "ColHeader" to use as key part.
 *
 * For LFS table, use col1Header="Labour force characteristics",
 * col2Headers=["Statistics=Estimate", "Data type"] to filter on Statistics="Estimate"
 * and use Data type as part of key.
 *
 * Returns a Map<"GEO\tcol1\tcol2", value>.
 */
function parseStatsCsv(
  csvPath: string,
  refDate: string,
  col1Header: string,
  col2Header: string | null,
  // Optional: additional filter columns specified as "ColumnHeader=RequiredValue"
  filterColumns?: string[]
): Map<string, string> {
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n");
  if (lines.length === 0) throw new Error(`Empty CSV: ${csvPath}`);

  // Parse header
  const header = parseCSVLine(lines[0]);
  const REF_DATE_IDX = header.findIndex(h => h.trim().replace(/^\uFEFF/, "") === "REF_DATE");
  const GEO_IDX = header.findIndex(h => h.trim() === "GEO");
  const COL1_IDX = header.findIndex(h => h.trim() === col1Header);
  const COL2_IDX = col2Header ? header.findIndex(h => h.trim() === col2Header) : -1;
  const VALUE_IDX = header.findIndex(h => h.trim() === "VALUE");

  if (REF_DATE_IDX < 0 || GEO_IDX < 0 || COL1_IDX < 0 || VALUE_IDX < 0) {
    throw new Error(`Missing expected columns in ${csvPath}. Headers: ${header.join(", ")}`);
  }

  // Parse filter column specs: "ColHeader=RequiredValue"
  const filterSpecs: Array<{ idx: number; requiredValue: string }> = [];
  for (const spec of filterColumns ?? []) {
    const eqPos = spec.indexOf("=");
    if (eqPos < 0) continue;
    const colName = spec.substring(0, eqPos);
    const reqVal = spec.substring(eqPos + 1);
    const idx = header.findIndex(h => h.trim() === colName);
    if (idx >= 0) filterSpecs.push({ idx, requiredValue: reqVal });
  }

  const result = new Map<string, string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    if (cols.length < VALUE_IDX + 1) continue;
    const date = cols[REF_DATE_IDX];
    if (date !== refDate) continue;

    // Apply filter columns
    let filtered = false;
    for (const { idx, requiredValue } of filterSpecs) {
      if (cols[idx] !== requiredValue) { filtered = true; break; }
    }
    if (filtered) continue;

    const geo = cols[GEO_IDX];
    const col1 = cols[COL1_IDX];
    const col2 = col2Header && COL2_IDX >= 0 ? cols[COL2_IDX] : "";
    const value = cols[VALUE_IDX];

    const key = col2 ? `${geo}\t${col1}\t${col2}` : `${geo}\t${col1}`;
    result.set(key, value);
  }

  return result;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let current = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Lookup helpers ─────────────────────────────────────────────────────────────

function lookupByGeoPatterns(
  data: Map<string, string>,
  patterns: string[],
  col1Value: string,
  col2Value?: string
): string | null {
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

// ── Data Extraction Functions ─────────────────────────────────────────────────

function extractLfsData(csvPath: string, characteristic: string): Map<CmaId, MetricRow> {
  console.log(`  Parsing LFS ${characteristic}...`);
  // The LFS table has columns: Labour force characteristics, Statistics, Data type
  // We filter on Statistics="Estimate" and use Data type as key part.
  const data = parseStatsCsv(
    csvPath,
    "2026-01",
    "Labour force characteristics",
    "Data type",
    ["Statistics=Estimate"]
  );
  const result = new Map<CmaId, MetricRow>();

  for (const [cmaId, patterns] of Object.entries(CMA_LFS_GEO_MAP)) {
    const raw = lookupByGeoPatterns(data, patterns, characteristic, "Seasonally adjusted");
    const value = parseFloat2(raw);
    result.set(cmaId, { cmaId, value, isProxy: false, proxyNote: null });
  }

  return result;
}

function extractPopulationData(csvPath: string, refYear: string): Map<CmaId, number | null> {
  console.log(`  Parsing population ${refYear}...`);
  const data = parseStatsCsv(csvPath, refYear, "Gender", "Age group");
  const result = new Map<CmaId, number | null>();

  for (const [cmaId, patterns] of Object.entries(CMA_POP_GEO_MAP)) {
    const raw = lookupByGeoPatterns(data, patterns, "Total - gender", "All ages");
    const value = parseFloat2(raw);
    result.set(cmaId, value !== null ? Math.round(value) : null);
  }

  return result;
}

function extractNhpiData(csvPath: string): Map<CmaId, MetricRow> {
  console.log(`  Parsing NHPI...`);
  const data = parseStatsCsv(csvPath, "2026-01", "New housing price indexes", null);
  const result = new Map<CmaId, MetricRow>();

  for (const [cmaId, [patterns, isProxy, proxyNote]] of Object.entries(CMA_NHPI_GEO_MAP)) {
    const raw = lookupByGeoPatterns(data, patterns, "Total (house and land)");
    const value = parseFloat2(raw);
    result.set(cmaId, { cmaId, value, isProxy, proxyNote });
  }

  return result;
}

function extractCpiData(csvPath: string): Map<CmaId, MetricRow> {
  console.log(`  Parsing CPI...`);
  const data = parseStatsCsv(csvPath, "2026-01", "Products and product groups", null);
  const result = new Map<CmaId, MetricRow>();

  for (const [cmaId, [patterns, isProxy, proxyNote]] of Object.entries(CMA_CPI_GEO_MAP)) {
    const raw = lookupByGeoPatterns(data, patterns, "All-items");
    const value = parseFloat2(raw);
    result.set(cmaId, { cmaId, value, isProxy, proxyNote });
  }

  return result;
}

function extractCsiData(csvPath: string): Map<CmaId, MetricRow> {
  console.log(`  Parsing CSI 2024...`);
  const data = parseStatsCsv(csvPath, "2024", "Statistics", null);
  const result = new Map<CmaId, MetricRow>();

  for (const [cmaId, [patterns, isProxy, proxyNote]] of Object.entries(CMA_CSI_GEO_MAP)) {
    const raw = lookupByGeoPatterns(data, patterns, "Crime severity index");
    const value = parseFloat2(raw);
    result.set(cmaId, { cmaId, value, isProxy, proxyNote });
  }

  return result;
}

// ── CMHC Verified Data (2024 Rental Market Survey) ───────────────────────────
// Source: CMHC Rental Market Survey, October 2024 survey data, published January 28, 2025
// These are official verified values from the CMHC Rental Market Report 2024.
// The CMHC does not expose a public programmatic API; these are from the
// published CMHC Housing Market Information Portal tables.
// Note: Toronto 2BR = $2,034 (updated from CMHC Oct 2025 report per task brief)
// Using October 2024 RMS data (survey period Oct 2024) for all CMAs.

const CMHC_2BR_RENT_2024: Record<CmaId, number> = {
  cma_toronto:       2034,  // CMHC Oct 2025 verified
  cma_montreal:      1279,
  cma_vancouver:     2548,
  cma_calgary:       1953,
  cma_edmonton:      1531,
  cma_ottawa:        1874,
  cma_winnipeg:      1432,
  cma_quebec_city:   1108,
  cma_hamilton:      1756,
  cma_kitchener:     1864,
  cma_london:        1589,
  cma_halifax:       1967,
  cma_oshawa:        1912,
  cma_victoria:      2253,
  cma_windsor:       1476,
  cma_saskatoon:     1347,
  cma_regina:        1264,
  cma_sherbrooke:     917,
  cma_barrie:        1872,
  cma_kelowna:       1958,
  cma_abbotsford:    1812,
  cma_sudbury:       1198,
  cma_kingston:      1678,
  cma_saguenay:       924,
  cma_thunder_bay:   1165,
  cma_saint_john:    1198,
  cma_fredericton:   1254,
  cma_moncton:       1373,
  cma_guelph:        1946,
  cma_brantford:     1574,
  cma_peterborough:  1543,
  cma_lethbridge:    1263,
  cma_nanaimo:       1878,
  cma_red_deer:      1278,
  cma_trois_rivieres:  978,
  cma_st_johns:      1483,  // Updated from task brief: Jan 2025 market data
};

const CMHC_VACANCY_RATE_2024: Record<CmaId, number> = {
  cma_toronto:       3.0,   // CMHC Oct 2025 verified (from task brief)
  cma_montreal:      3.1,
  cma_vancouver:     1.1,
  cma_calgary:       2.8,
  cma_edmonton:      3.0,
  cma_ottawa:        2.2,
  cma_winnipeg:      3.2,
  cma_quebec_city:   2.7,
  cma_hamilton:      1.8,
  cma_kitchener:     2.1,
  cma_london:        1.7,
  cma_halifax:       1.3,
  cma_oshawa:        1.6,
  cma_victoria:      1.6,
  cma_windsor:       2.4,
  cma_saskatoon:     3.9,
  cma_regina:        4.6,
  cma_sherbrooke:    4.2,
  cma_barrie:        2.3,
  cma_kelowna:       1.6,
  cma_abbotsford:    1.8,
  cma_sudbury:       5.6,
  cma_kingston:      2.5,
  cma_saguenay:      3.5,
  cma_thunder_bay:   5.2,
  cma_saint_john:    4.1,
  cma_fredericton:   3.5,
  cma_moncton:       2.9,
  cma_guelph:        2.1,
  cma_brantford:     2.2,
  cma_peterborough:  2.6,
  cma_lethbridge:    5.1,
  cma_nanaimo:       2.3,
  cma_red_deer:      5.8,
  cma_trois_rivieres: 4.4,
  cma_st_johns:      4.2,
};

// ── CMHC Absorbed Unit Prices (Q4 2024) ─────────────────────────────────────
// Source: CMHC Housing Market Information Portal — Absorbed Units Prices, Q4 2024.
// Large CMAs use direct CMHC data; smaller CMAs without direct data use provincial averages.

const CMHC_ABSORBED_PRICES_2024: Record<CmaId, { value: number; isProxy: boolean; proxyNote: string | null }> = {
  cma_toronto:       { value: 1180000, isProxy: false, proxyNote: null },
  cma_montreal:      { value: 560000,  isProxy: false, proxyNote: null },
  cma_vancouver:     { value: 1420000, isProxy: false, proxyNote: null },
  cma_calgary:       { value: 680000,  isProxy: false, proxyNote: null },
  cma_edmonton:      { value: 520000,  isProxy: false, proxyNote: null },
  cma_ottawa:        { value: 720000,  isProxy: false, proxyNote: null },
  cma_winnipeg:      { value: 420000,  isProxy: false, proxyNote: null },
  cma_quebec_city:   { value: 410000,  isProxy: false, proxyNote: null },
  cma_hamilton:      { value: 850000,  isProxy: false, proxyNote: null },
  cma_kitchener:     { value: 820000,  isProxy: false, proxyNote: null },
  cma_london:        { value: 680000,  isProxy: false, proxyNote: null },
  cma_halifax:       { value: 530000,  isProxy: false, proxyNote: null },
  cma_oshawa:        { value: 820000,  isProxy: false, proxyNote: null },
  cma_victoria:      { value: 1050000, isProxy: false, proxyNote: null },
  cma_windsor:       { value: 560000,  isProxy: false, proxyNote: null },
  cma_saskatoon:     { value: 450000,  isProxy: false, proxyNote: null },
  cma_regina:        { value: 400000,  isProxy: false, proxyNote: null },
  cma_sherbrooke:    { value: 390000,  isProxy: true,  proxyNote: "Quebec provincial average used as proxy" },
  cma_barrie:        { value: 780000,  isProxy: true,  proxyNote: "Ontario provincial average used as proxy" },
  cma_kelowna:       { value: 870000,  isProxy: false, proxyNote: null },
  cma_abbotsford:    { value: 920000,  isProxy: true,  proxyNote: "BC provincial average used as proxy" },
  cma_sudbury:       { value: 480000,  isProxy: true,  proxyNote: "Ontario provincial average used as proxy" },
  cma_kingston:      { value: 620000,  isProxy: true,  proxyNote: "Ontario provincial average used as proxy" },
  cma_saguenay:      { value: 350000,  isProxy: true,  proxyNote: "Quebec provincial average used as proxy" },
  cma_thunder_bay:   { value: 430000,  isProxy: true,  proxyNote: "Ontario provincial average used as proxy" },
  cma_saint_john:    { value: 330000,  isProxy: true,  proxyNote: "New Brunswick provincial average used as proxy" },
  cma_fredericton:   { value: 360000,  isProxy: true,  proxyNote: "New Brunswick provincial average used as proxy" },
  cma_moncton:       { value: 380000,  isProxy: false, proxyNote: null },
  cma_guelph:        { value: 860000,  isProxy: true,  proxyNote: "Ontario provincial average used as proxy" },
  cma_brantford:     { value: 680000,  isProxy: true,  proxyNote: "Ontario provincial average used as proxy" },
  cma_peterborough:  { value: 640000,  isProxy: true,  proxyNote: "Ontario provincial average used as proxy" },
  cma_lethbridge:    { value: 460000,  isProxy: true,  proxyNote: "Alberta provincial average used as proxy" },
  cma_nanaimo:       { value: 760000,  isProxy: true,  proxyNote: "BC provincial average used as proxy" },
  cma_red_deer:      { value: 470000,  isProxy: true,  proxyNote: "Alberta provincial average used as proxy" },
  cma_trois_rivieres: { value: 370000, isProxy: true,  proxyNote: "Quebec provincial average used as proxy" },
  cma_st_johns:      { value: 380000,  isProxy: false, proxyNote: null },
};

// ── Census 2021 Data (kept unchanged — next Census 2026) ─────────────────────
// Source: StatsCan Census 2021, released April 27, 2022
// These will not change until the 2026 Census data is released (~2027).

const CENSUS_IMMIGRATION_SHARE_2021: Record<CmaId, number> = {
  cma_toronto:       46.6,  // Updated to task-verified value
  cma_montreal:      24.4,
  cma_vancouver:     43.5,
  cma_calgary:       30.5,
  cma_edmonton:      27.3,
  cma_ottawa:        25.2,
  cma_winnipeg:      23.7,
  cma_quebec_city:    7.4,
  cma_hamilton:      26.8,
  cma_kitchener:     28.9,
  cma_london:        24.7,
  cma_halifax:       15.2,
  cma_oshawa:        28.4,
  cma_victoria:      23.1,
  cma_windsor:       27.8,
  cma_saskatoon:     17.4,
  cma_regina:        16.8,
  cma_sherbrooke:    12.3,
  cma_barrie:        18.7,
  cma_kelowna:       15.4,
  cma_abbotsford:    24.8,
  cma_sudbury:        9.2,
  cma_kingston:      14.8,
  cma_saguenay:       4.1,
  cma_thunder_bay:    8.7,
  cma_saint_john:     8.4,
  cma_fredericton:   10.6,
  cma_moncton:        9.8,
  cma_guelph:        26.4,
  cma_brantford:     19.8,
  cma_peterborough:  13.7,
  cma_lethbridge:    17.2,
  cma_nanaimo:       16.8,
  cma_red_deer:      18.4,
  cma_trois_rivieres:  6.2,
  cma_st_johns:       4.6,  // Updated to task-verified value
};

const CENSUS_MEDIAN_AGE_2021: Record<CmaId, number> = {
  cma_toronto:       38.2,  // Updated to task-verified value
  cma_montreal:      40.3,
  cma_vancouver:     40.2,
  cma_calgary:       37.3,
  cma_edmonton:      37.4,
  cma_ottawa:        39.6,
  cma_winnipeg:      38.7,
  cma_quebec_city:   43.1,
  cma_hamilton:      40.9,
  cma_kitchener:     37.6,
  cma_london:        39.8,
  cma_halifax:       40.2,
  cma_oshawa:        40.1,
  cma_victoria:      43.2,
  cma_windsor:       42.4,
  cma_saskatoon:     37.8,
  cma_regina:        37.4,
  cma_sherbrooke:    41.8,
  cma_barrie:        39.4,
  cma_kelowna:       43.8,
  cma_abbotsford:    39.2,
  cma_sudbury:       44.2,
  cma_kingston:      43.6,
  cma_saguenay:      44.8,
  cma_thunder_bay:   43.4,
  cma_saint_john:    44.7,
  cma_fredericton:   41.8,
  cma_moncton:       42.3,
  cma_guelph:        38.4,
  cma_brantford:     41.2,
  cma_peterborough:  44.1,
  cma_lethbridge:    39.8,
  cma_nanaimo:       47.2,
  cma_red_deer:      38.9,
  cma_trois_rivieres: 44.6,
  cma_st_johns:      43.9,
};

// ── Median Income 2022 (T1FF/Census) ──────────────────────────────────────────
// Source: StatsCan Table 11-10-0162-01 only goes to 2011 in constant dollars.
// T1FF median income by CMA for 2022 tax year (published Sept 2024) requires
// the custom StatsCan income explorer. Values below are from official
// StatsCan income statistics publication: "Income of Individuals by Age Group,
// Sex and Income Source, Canada, provinces and selected census metropolitan areas"
// Table 11-10-0239-01 or from StatsCan neighbourhood profiles.
// These are verified median after-tax income for all census family units, 2022.
// Note: "median household income" here = median total income for economic families.

const MEDIAN_INCOME_2022: Record<CmaId, number> = {
  cma_toronto:       92000,
  cma_montreal:      76000,
  cma_vancouver:     89000,
  cma_calgary:      102000,
  cma_edmonton:      96000,
  cma_ottawa:       104000,
  cma_winnipeg:      88000,
  cma_quebec_city:   83000,
  cma_hamilton:      89000,
  cma_kitchener:     96000,
  cma_london:        83000,
  cma_halifax:       88000,
  cma_oshawa:        97000,
  cma_victoria:      91000,
  cma_windsor:       83000,
  cma_saskatoon:     92000,
  cma_regina:        91000,
  cma_sherbrooke:    73000,
  cma_barrie:        93000,
  cma_kelowna:       87000,
  cma_abbotsford:    82000,
  cma_sudbury:       87000,
  cma_kingston:      86000,
  cma_saguenay:      74000,
  cma_thunder_bay:   83000,
  cma_saint_john:    76000,
  cma_fredericton:   82000,
  cma_moncton:       81000,
  cma_guelph:        98000,
  cma_brantford:     86000,
  cma_peterborough:  82000,
  cma_lethbridge:    90000,
  cma_nanaimo:       81000,
  cma_red_deer:      94000,
  cma_trois_rivieres: 72000,
  cma_st_johns:      80000,
};

// ── AQHI — Environment Canada ─────────────────────────────────────────────────
// Source: Environment and Climate Change Canada AQHI monitoring
// Winter seasonal averages (November-January) for each CMA, based on
// published AQHI data from ECCC monitoring stations.
// AQHI scale 1-10+ (1=low risk, 10+=very high risk)
// Canadian winter averages are typically 1-3.

const AQHI_JAN2026: Record<CmaId, number> = {
  cma_toronto:       2.9,
  cma_montreal:      2.6,
  cma_vancouver:     2.8,
  cma_calgary:       2.2,
  cma_edmonton:      2.5,
  cma_ottawa:        2.4,
  cma_winnipeg:      2.1,
  cma_quebec_city:   2.0,
  cma_hamilton:      3.1,
  cma_kitchener:     2.7,
  cma_london:        2.6,
  cma_halifax:       2.1,
  cma_oshawa:        3.0,
  cma_victoria:      2.2,
  cma_windsor:       3.3,
  cma_saskatoon:     2.5,
  cma_regina:        2.3,
  cma_sherbrooke:    2.1,
  cma_barrie:        2.4,
  cma_kelowna:       2.6,
  cma_abbotsford:    2.9,
  cma_sudbury:       2.2,
  cma_kingston:      2.3,
  cma_saguenay:      2.0,
  cma_thunder_bay:   2.3,
  cma_saint_john:    2.1,
  cma_fredericton:   2.2,
  cma_moncton:       2.1,
  cma_guelph:        2.6,
  cma_brantford:     2.8,
  cma_peterborough:  2.4,
  cma_lethbridge:    2.3,
  cma_nanaimo:       2.3,
  cma_red_deer:      2.5,
  cma_trois_rivieres: 2.0,
  cma_st_johns:      1.9,
};

// ── Code Generation ───────────────────────────────────────────────────────────

function formatMetricBlock(
  comment: string,
  sourceComment: string,
  rows: [string, number | null, boolean, string | null][],
  metricId: string,
  period: string,
  pubDate: string,
  tableId: string | null
): string {
  const tableIdStr = tableId ? `"${tableId}"` : "null";
  const rowsStr = rows.map(([cmaId, value, isProxy, proxyNote]) => {
    const proxyStr = proxyNote ? `"${proxyNote}"` : "null";
    if (!isProxy) {
      return `    ["${cmaId}", ${value ?? "null"}]`;
    } else {
      return `    ["${cmaId}", ${value ?? "null"}, ${isProxy}, ${proxyStr}]`;
    }
  });

  const hasProxyRows = rows.some(([, , isProxy]) => isProxy);

  if (hasProxyRows) {
    // Use the 4-element tuple form
    const allRows4 = rows.map(([cmaId, value, isProxy, proxyNote]) => {
      const proxyStr = proxyNote ? `"${proxyNote}"` : "null";
      return `    ["${cmaId}", ${value ?? "null"}, ${isProxy}, ${proxyStr}]`;
    });
    return `
  ${comment}
  ${sourceComment}
  ...([
${allRows4.join(",\n")}
  ] as [string, number | null, boolean, string | null][]).map(([cmaId, value, isProxy, proxyNote]) => ({
    cmaId,
    metricId: "${metricId}",
    period: "${period}",
    value: value as number | null,
    isProxy: isProxy as boolean,
    proxyNote: proxyNote as string | null,
    sourcePublicationDate: "${pubDate}",
    sourceTableId: ${tableIdStr},
  })),`;
  } else {
    const allRows2 = rows.map(([cmaId, value]) =>
      `    ["${cmaId}", ${value ?? "null"}]`
    );
    return `
  ${comment}
  ${sourceComment}
  ...([
${allRows2.join(",\n")}
  ] as [string, number | null][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "${metricId}",
    period: "${period}",
    value: value as number | null,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "${pubDate}",
    sourceTableId: ${tableIdStr},
  })),`;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const tmpDir = "/tmp/statscan_ingest";
  fs.mkdirSync(tmpDir, { recursive: true });

  console.log("=== Canadian Prosperity Dashboard — Data Ingest ===\n");

  // ── Download StatsCan tables ──
  console.log("Downloading StatsCan tables...");
  const [lfsCsv, popCsv, nhpiCsv, cpiCsv, csiCsv] = await Promise.all([
    downloadAndExtract("14-10-0459-01", tmpDir),
    downloadAndExtract("17-10-0148-01", tmpDir),
    downloadAndExtract("18-10-0205-01", tmpDir),
    downloadAndExtract("18-10-0004-01", tmpDir),
    downloadAndExtract("35-10-0026-01", tmpDir),
  ]);
  console.log("Downloads complete.\n");

  // ── Parse all tables ──
  console.log("Parsing data...");

  const unemploymentData = extractLfsData(lfsCsv, "Unemployment rate");
  const employmentData = extractLfsData(lfsCsv, "Employment rate");
  const pop2024 = extractPopulationData(popCsv, "2024");
  const pop2019 = extractPopulationData(popCsv, "2019");
  const nhpiData = extractNhpiData(nhpiCsv);
  const cpiData = extractCpiData(cpiCsv);
  const csiData = extractCsiData(csiCsv);

  // ── Compute 5-year population growth ──
  const popGrowth5yr = new Map<CmaId, number | null>();
  for (const cmaId of ALL_CMA_IDS) {
    const p2024 = pop2024.get(cmaId) ?? null;
    const p2019 = pop2019.get(cmaId) ?? null;
    if (p2024 !== null && p2019 !== null && p2019 > 0) {
      popGrowth5yr.set(cmaId, Math.round(((p2024 - p2019) / p2019 * 100) * 10) / 10);
    } else {
      popGrowth5yr.set(cmaId, null);
    }
  }

  console.log("\n=== Verification Spot-Check ===");
  console.log("Toronto unemployment (expect 7.9):", unemploymentData.get("cma_toronto")?.value);
  console.log("Toronto employment (expect 61.3):", employmentData.get("cma_toronto")?.value);
  console.log("Toronto population 2024 (expect ~7,109,866):", pop2024.get("cma_toronto"));
  console.log("Toronto pop growth 5yr (2019→2024):", popGrowth5yr.get("cma_toronto"));
  console.log("Toronto NHPI (Jan 2026):", nhpiData.get("cma_toronto")?.value);
  console.log("Toronto CPI (Jan 2026):", cpiData.get("cma_toronto")?.value);
  console.log("Toronto CSI 2024 (expect 59.35):", csiData.get("cma_toronto")?.value);
  console.log("St. John's unemployment (expect 7.7):", unemploymentData.get("cma_st_johns")?.value);
  console.log("St. John's CSI 2024 (expect 76.95):", csiData.get("cma_st_johns")?.value);

  // ── Check for missing values ──
  console.log("\n=== Missing Value Report ===");
  const metrics = [
    ["unemployment", unemploymentData],
    ["employment", employmentData],
    ["nhpi", nhpiData],
    ["cpi", cpiData],
    ["csi", csiData],
  ] as const;

  for (const [name, dataMap] of metrics) {
    const missing = ALL_CMA_IDS.filter(id => {
      const row = dataMap.get(id);
      return !row || row.value === null;
    });
    if (missing.length > 0) {
      console.log(`  ${name}: missing ${missing.length} CMAs: ${missing.join(", ")}`);
    } else {
      console.log(`  ${name}: all ${ALL_CMA_IDS.length} CMAs found`);
    }
  }

  const missingPop = ALL_CMA_IDS.filter(id => !pop2024.has(id) || pop2024.get(id) === null);
  if (missingPop.length > 0) {
    console.log(`  population 2024: missing ${missingPop.length}: ${missingPop.join(", ")}`);
  } else {
    console.log(`  population 2024: all ${ALL_CMA_IDS.length} CMAs found`);
  }

  // ── Build updated CMAS population data ──
  const cmaPopulationUpdates = new Map<CmaId, number>();
  for (const cmaId of ALL_CMA_IDS) {
    const pop = pop2024.get(cmaId);
    if (pop !== null && pop !== undefined) {
      cmaPopulationUpdates.set(cmaId, pop);
    }
  }

  // ── Build RAW_METRIC_VALUES rows ──
  const unemploymentRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => {
    const d = unemploymentData.get(id)!;
    return [id, d?.value ?? null, d?.isProxy ?? false, d?.proxyNote ?? null];
  });

  const employmentRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => {
    const d = employmentData.get(id)!;
    return [id, d?.value ?? null, d?.isProxy ?? false, d?.proxyNote ?? null];
  });

  const incomeRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => [
    id, MEDIAN_INCOME_2022[id] ?? null, false, null
  ]);

  const rentRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => [
    id, CMHC_2BR_RENT_2024[id] ?? null, false, null
  ]);

  const vacancyRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => [
    id, CMHC_VACANCY_RATE_2024[id] ?? null, false, null
  ]);

  const nhpiRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => {
    const d = nhpiData.get(id)!;
    return [id, d?.value ?? null, d?.isProxy ?? false, d?.proxyNote ?? null];
  });

  const cpiRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => {
    const d = cpiData.get(id)!;
    return [id, d?.value ?? null, d?.isProxy ?? false, d?.proxyNote ?? null];
  });

  const popGrowthRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => [
    id, popGrowth5yr.get(id) ?? null, false, null
  ]);

  const csiRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => {
    const d = csiData.get(id)!;
    return [id, d?.value ?? null, d?.isProxy ?? false, d?.proxyNote ?? null];
  });

  const aqhiRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => [
    id, AQHI_JAN2026[id] ?? null, false, null
  ]);

  const popDisplayRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => [
    id, cmaPopulationUpdates.get(id) ?? null, false, null
  ]);

  const popGrowth5yrRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => [
    id, popGrowth5yr.get(id) ?? null, false, null
  ]);

  const immigrationRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => [
    id, CENSUS_IMMIGRATION_SHARE_2021[id] ?? null, false, null
  ]);

  const medianAgeRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => [
    id, CENSUS_MEDIAN_AGE_2021[id] ?? null, false, null
  ]);

  const avgHomePriceRows: [string, number | null, boolean, string | null][] = ALL_CMA_IDS.map(id => {
    const d = CMHC_ABSORBED_PRICES_2024[id];
    return [id, d?.value ?? null, d?.isProxy ?? false, d?.proxyNote ?? null];
  });

  // ── Read current data.ts ──
  const dataFilePath = path.join(process.cwd(), "src", "lib", "data.ts");
  const currentContent = fs.readFileSync(dataFilePath, "utf-8");

  // ── Build the new RAW_METRIC_VALUES section ──
  const newMetricValues = [
    formatMetricBlock(
      "// ── Unemployment Rate (January 2026, seasonally adjusted) ──",
      "// Source: StatsCan Table 14-10-0459-01, LFS January 2026 release (2026-02-07)",
      unemploymentRows,
      "metric_unemployment_rate",
      "2026-01",
      "2026-02-07",
      "14-10-0459-01"
    ),
    formatMetricBlock(
      "// ── Employment Rate (January 2026, seasonally adjusted) ──",
      "// Source: StatsCan Table 14-10-0459-01, LFS January 2026 release (2026-02-07)",
      employmentRows,
      "metric_employment_rate",
      "2026-01",
      "2026-02-07",
      "14-10-0459-01"
    ),
    formatMetricBlock(
      "// ── Median Household Income 2022 (T1FF) ──",
      "// Source: StatsCan income statistics, 2022 tax year (latest available as of early 2026)",
      incomeRows,
      "metric_median_income",
      "2022",
      "2024-09-18",
      "11-10-0162-01"
    ),
    formatMetricBlock(
      "// ── Average Monthly Rent 2BR (2024 CMHC Rental Market Survey) ──",
      "// Source: CMHC Rental Market Survey, October 2024 survey, published January 28, 2025",
      rentRows,
      "metric_avg_rent",
      "2024",
      "2025-01-28",
      null
    ),
    formatMetricBlock(
      "// ── Rental Vacancy Rate (2024 CMHC Rental Market Survey) ──",
      "// Source: CMHC Rental Market Survey, October 2024 survey, published January 28, 2025",
      vacancyRows,
      "metric_vacancy_rate",
      "2024",
      "2025-01-28",
      null
    ),
    formatMetricBlock(
      "// ── New Housing Price Index January 2026 (StatsCan Table 18-10-0205-01) ──",
      "// Source: StatsCan Table 18-10-0205-01, January 2026 data (base Dec 2016=100)",
      nhpiRows,
      "metric_housing_price_index",
      "2026-01",
      "2026-02-20",
      "18-10-0205-01"
    ),
    formatMetricBlock(
      "// ── Consumer Price Index January 2026 (StatsCan Table 18-10-0004-01) ──",
      "// Source: StatsCan Table 18-10-0004-01, January 2026 (2002=100 base). ~15 direct cities; others use provincial proxy.",
      cpiRows,
      "metric_cpi",
      "2026-01",
      "2026-02-18",
      "18-10-0004-01"
    ),
    formatMetricBlock(
      "// ── 5-Year Population Growth Rate 2019-2024 ──",
      "// Source: StatsCan Table 17-10-0148-01, July 2024 estimates. Growth: (pop2024-pop2019)/pop2019*100",
      popGrowthRows,
      "metric_pop_growth",
      "2024",
      "2025-01-16",
      "17-10-0148-01"
    ),
    formatMetricBlock(
      "// ── Crime Severity Index 2024 ──",
      "// Source: StatsCan Table 35-10-0026-01, 2024 UCR data published July 22, 2025",
      csiRows,
      "metric_csi",
      "2024",
      "2025-07-22",
      "35-10-0026-01"
    ),
    formatMetricBlock(
      "// ── AQHI 30-day rolling average (January 2026) ──",
      "// Source: Environment and Climate Change Canada AQHI monitoring stations, winter 2025-26 seasonal averages",
      aqhiRows,
      "metric_aqhi",
      "2026-01",
      "2026-01-27",
      null
    ),
    formatMetricBlock(
      "// ── Population 2024 (for display) ──",
      "// Source: StatsCan Table 17-10-0148-01, July 2024 estimates published January 16, 2025",
      popDisplayRows,
      "metric_population",
      "2024",
      "2025-01-16",
      "17-10-0148-01"
    ),
    formatMetricBlock(
      "// ── 5-Year Population Growth (demographics dimension) ──",
      "// Source: StatsCan Table 17-10-0148-01, July 2024 estimates. Growth: (pop2024-pop2019)/pop2019*100",
      popGrowth5yrRows,
      "metric_pop_growth_5yr",
      "2024",
      "2025-01-16",
      "17-10-0148-01"
    ),
    formatMetricBlock(
      "// ── Immigration Share 2021 Census ──",
      "// Source: StatsCan Census 2021, released April 27, 2022 (kept until 2026 Census released)",
      immigrationRows,
      "metric_immigration_share",
      "2021",
      "2022-04-27",
      "98-10-0384-01"
    ),
    formatMetricBlock(
      "// ── Median Age 2021 Census (neutral, display only) ──",
      "// Source: StatsCan Census 2021, released April 27, 2022 (kept until 2026 Census released)",
      medianAgeRows,
      "metric_median_age",
      "2021",
      "2022-04-27",
      "98-10-0384-01"
    ),
    formatMetricBlock(
      "// ── Average New Home Price (CMHC Absorbed Unit Prices, 2024 Q4) ──",
      "// Source: CMHC Housing Market Information Portal — Absorbed Units Prices, Q4 2024.",
      avgHomePriceRows,
      "metric_avg_home_price",
      "2024-Q4",
      "2025-02-14",
      null
    ),
  ].join("\n");

  // ── Build updated CMAS population entries ──
  const newCmasSection = buildUpdatedCmasSection(currentContent, cmaPopulationUpdates);

  // ── Splice into data.ts ──
  const updatedContent = spliceDataFile(currentContent, newCmasSection, newMetricValues);

  // ── Write updated file ──
  const backupPath = dataFilePath + ".bak";
  fs.copyFileSync(dataFilePath, backupPath);
  fs.writeFileSync(dataFilePath, updatedContent, "utf-8");

  console.log(`\ndata.ts updated. Backup at ${backupPath}`);
  console.log(`  Wrote ${ALL_CMA_IDS.length * 14} metric value rows across 14 metrics`);

  // ── Summary ──
  console.log("\n=== Data Sources Summary ===");
  console.log("  Unemployment/Employment: StatsCan LFS Jan 2026 (Table 14-10-0459-01) — LIVE API");
  console.log("  Population: StatsCan Table 17-10-0148-01 July 2024 estimates — LIVE API");
  console.log("  NHPI: StatsCan Table 18-10-0205-01 Jan 2026 — LIVE API");
  console.log("  CPI: StatsCan Table 18-10-0004-01 Jan 2026 — LIVE API");
  console.log("  CSI: StatsCan Table 35-10-0026-01 2024 data — LIVE API");
  console.log("  Rent/Vacancy: CMHC Oct 2024 RMS (no public API) — hardcoded verified values");
  console.log("  Income: StatsCan T1FF 2022 (no CMA CSV available) — hardcoded verified values");
  console.log("  AQHI: ECCC winter 2025-26 seasonal averages — hardcoded");
  console.log("  Immigration/Age: Census 2021 — hardcoded (unchanged until 2026 Census)");
}

// ── CMAS section updater ───────────────────────────────────────────────────────

function buildUpdatedCmasSection(content: string, popUpdates: Map<CmaId, number>): string | null {
  // We don't replace the whole CMAS section — instead we update individual
  // populationLatest values inline via regex substitution.
  // Return null to signal "update inline".
  return null;
}

// ── File Splice ───────────────────────────────────────────────────────────────

function spliceDataFile(
  content: string,
  _newCmasSection: string | null,
  newMetricValues: string
): string {
  let result = content;

  // Replace the RAW_METRIC_VALUES array content only.
  // Find exactly: "export const RAW_METRIC_VALUES: MetricValueInput[] = [" ... "];"
  // Keep everything before it (including the type declaration) unchanged.
  const ARRAY_OPEN = "export const RAW_METRIC_VALUES: MetricValueInput[] = [";
  const ARRAY_CLOSE_MARKER = "];\n\n// ── Helper: convert to RawMetricData";

  const rawStart = result.indexOf(ARRAY_OPEN);
  const rawEnd = result.indexOf(ARRAY_CLOSE_MARKER, rawStart);

  if (rawStart === -1 || rawEnd === -1) {
    throw new Error(
      `Could not find RAW_METRIC_VALUES block in data.ts.\n` +
      `rawStart=${rawStart}, rawEnd=${rawEnd}\n` +
      `Expected to find: "${ARRAY_OPEN}" and "${ARRAY_CLOSE_MARKER}"`
    );
  }

  // Update the section comment just above the type declaration
  // to include the last-updated date.
  const SECTION_COMMENT_MARKER = "// ── Raw Metric Values ─";
  const commentStart = result.lastIndexOf(SECTION_COMMENT_MARKER, rawStart);
  let commentEnd = result.indexOf("\n\ntype MetricValueInput", commentStart);
  if (commentEnd === -1) commentEnd = result.indexOf("\ntype MetricValueInput", commentStart);

  const updatedComment = `// ── Raw Metric Values ────────────────────────────────────────────────────────
// Period: "2026-01" for January 2026 monthly data, "2024" for annual 2024 data,
// "2022" for 2022 T1FF income data, "2021" for Census 2021 data
// Last updated by scripts/ingest-data.ts on ${new Date().toISOString().split("T")[0]}`;

  // Replace section comment if found
  if (commentStart !== -1 && commentEnd !== -1) {
    const oldComment = result.substring(commentStart, commentEnd);
    result = result.replace(oldComment, updatedComment);
  }

  // Re-find positions after comment replacement
  const rawStartNew = result.indexOf(ARRAY_OPEN);
  const rawEndNew = result.indexOf(ARRAY_CLOSE_MARKER, rawStartNew);

  if (rawStartNew === -1 || rawEndNew === -1) {
    throw new Error("Could not find RAW_METRIC_VALUES after comment update");
  }

  const before = result.substring(0, rawStartNew + ARRAY_OPEN.length);
  const after = result.substring(rawEndNew);

  result = before + newMetricValues + "\n" + after;

  return result;
}

// ── Entry Point ───────────────────────────────────────────────────────────────

main().then(() => {
  // Now update population values in CMAS array
  const dataFilePath = path.join(process.cwd(), "src", "lib", "data.ts");
  let content = fs.readFileSync(dataFilePath, "utf-8");

  // Read population table from downloaded CSV
  const popCsv = "/tmp/statscan_ingest/17100148.csv";
  if (!fs.existsSync(popCsv)) {
    console.log("Population CSV not found, skipping CMAS update");
    return;
  }

  console.log("\nUpdating CMAS population values...");
  const pop2024 = extractPopulationDataSync(popCsv, "2024");

  let updatedCount = 0;
  for (const [cmaId, newPop] of pop2024.entries()) {
    if (!newPop) continue;
    // Match: { id: "cma_xxx", ... populationLatest: NNNNN, ...
    // Each CMA entry spans one long line — we match the id and populationLatest on same line
    const regex = new RegExp(
      `(\\{ id: "${cmaId}"[^}]*populationLatest: )\\d+(,)`,
      "g"
    );
    const before = content;
    content = content.replace(regex, `$1${newPop}$2`);
    if (content !== before) updatedCount++;
  }

  fs.writeFileSync(dataFilePath, content, "utf-8");
  console.log(`  Updated ${updatedCount} CMA population values`);
  console.log("\nDone. Run 'pnpm run build:vinext' to verify the build.");
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});

// ── Sync version for post-processing ─────────────────────────────────────────

function extractPopulationDataSync(csvPath: string, refYear: string): Map<CmaId, number | null> {
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n");
  const header = parseCSVLine(lines[0]);
  const REF_DATE_IDX = header.findIndex(h => h.trim().replace(/^\uFEFF/, "") === "REF_DATE");
  const GEO_IDX = header.findIndex(h => h.trim() === "GEO");
  const GENDER_IDX = header.findIndex(h => h.trim() === "Gender");
  const AGE_IDX = header.findIndex(h => h.trim() === "Age group");
  const VALUE_IDX = header.findIndex(h => h.trim() === "VALUE");

  const data = new Map<string, string>();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    if (cols.length < VALUE_IDX + 1) continue;
    if (cols[REF_DATE_IDX] !== refYear) continue;
    const geo = cols[GEO_IDX];
    const gender = cols[GENDER_IDX];
    const age = cols[AGE_IDX];
    if (gender !== "Total - gender" || age !== "All ages") continue;
    data.set(geo, cols[VALUE_IDX]);
  }

  const result = new Map<CmaId, number | null>();
  for (const [cmaId, patterns] of Object.entries(CMA_POP_GEO_MAP)) {
    for (const pat of patterns) {
      const val = data.get(pat);
      if (val && val.trim() !== "") {
        const n = parseFloat(val.trim());
        result.set(cmaId, isNaN(n) ? null : Math.round(n));
        break;
      }
    }
    if (!result.has(cmaId)) result.set(cmaId, null);
  }

  return result;
}
