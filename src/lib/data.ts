/**
 * Static data module — all CMA data and metrics hardcoded from official sources.
 *
 * Since we're deploying as a static export (Next.js output: "export"),
 * all data is embedded at build time. This module provides the canonical
 * data that the scoring algorithm, pages, and seed script all consume.
 */

import { CMA, Metric, MetricValue, RawMetricData } from "@/types";

// ── CMA Reference Data ───────────────────────────────────────────────────────

export const CMAS: CMA[] = [
  { id: "cma_toronto", name: "Toronto", slug: "toronto", province: "Ontario", provinceAbbr: "ON", populationLatest: 6712341, centroidLat: 43.7, centroidLng: -79.4, cmaBoundaryNote: "The Toronto CMA includes Mississauga, Brampton, Markham, Vaughan, Richmond Hill, and 20+ other municipalities." },
  { id: "cma_montreal", name: "Montréal", slug: "montreal", province: "Quebec", provinceAbbr: "QC", populationLatest: 4291732, centroidLat: 45.5, centroidLng: -73.6, cmaBoundaryNote: "The Montréal CMA includes Laval, Longueuil, and surrounding municipalities." },
  { id: "cma_vancouver", name: "Vancouver", slug: "vancouver", province: "British Columbia", provinceAbbr: "BC", populationLatest: 2756340, centroidLat: 49.3, centroidLng: -123.1, cmaBoundaryNote: "The Vancouver CMA includes Burnaby, Surrey, Richmond, Coquitlam, and the North Shore." },
  { id: "cma_calgary", name: "Calgary", slug: "calgary", province: "Alberta", provinceAbbr: "AB", populationLatest: 1643966, centroidLat: 51.0, centroidLng: -114.1, cmaBoundaryNote: "The Calgary CMA includes surrounding communities such as Airdrie and Cochrane." },
  { id: "cma_edmonton", name: "Edmonton", slug: "edmonton", province: "Alberta", provinceAbbr: "AB", populationLatest: 1487969, centroidLat: 53.5, centroidLng: -113.5, cmaBoundaryNote: "The Edmonton CMA includes Sherwood Park, St. Albert, Spruce Grove, and surrounding municipalities." },
  { id: "cma_ottawa", name: "Ottawa–Gatineau", slug: "ottawa-gatineau", province: "Ontario/Quebec", provinceAbbr: "ON/QC", populationLatest: 1488307, centroidLat: 45.4, centroidLng: -75.7, cmaBoundaryNote: "This bi-provincial CMA spans Ottawa (Ontario) and Gatineau (Quebec)." },
  { id: "cma_winnipeg", name: "Winnipeg", slug: "winnipeg", province: "Manitoba", provinceAbbr: "MB", populationLatest: 940409, centroidLat: 49.9, centroidLng: -97.1, cmaBoundaryNote: null },
  { id: "cma_quebec_city", name: "Québec City", slug: "quebec-city", province: "Quebec", provinceAbbr: "QC", populationLatest: 870000, centroidLat: 46.8, centroidLng: -71.2, cmaBoundaryNote: null },
  { id: "cma_hamilton", name: "Hamilton", slug: "hamilton", province: "Ontario", provinceAbbr: "ON", populationLatest: 824340, centroidLat: 43.3, centroidLng: -79.9, cmaBoundaryNote: null },
  { id: "cma_kitchener", name: "Kitchener–Cambridge–Waterloo", slug: "kitchener-cambridge-waterloo", province: "Ontario", provinceAbbr: "ON", populationLatest: 643327, centroidLat: 43.5, centroidLng: -80.5, cmaBoundaryNote: "This tri-city CMA covers Kitchener, Cambridge, Waterloo, and Woolwich Township." },
  { id: "cma_london", name: "London", slug: "london", province: "Ontario", provinceAbbr: "ON", populationLatest: 578432, centroidLat: 43.0, centroidLng: -81.3, cmaBoundaryNote: null },
  { id: "cma_halifax", name: "Halifax", slug: "halifax", province: "Nova Scotia", provinceAbbr: "NS", populationLatest: 475463, centroidLat: 44.6, centroidLng: -63.6, cmaBoundaryNote: null },
  { id: "cma_oshawa", name: "Oshawa", slug: "oshawa", province: "Ontario", provinceAbbr: "ON", populationLatest: 415311, centroidLat: 43.9, centroidLng: -78.9, cmaBoundaryNote: "The Oshawa CMA includes Whitby, Clarington, and other Durham Region municipalities." },
  { id: "cma_victoria", name: "Victoria", slug: "victoria", province: "British Columbia", provinceAbbr: "BC", populationLatest: 406612, centroidLat: 48.4, centroidLng: -123.4, cmaBoundaryNote: null },
  { id: "cma_windsor", name: "Windsor", slug: "windsor", province: "Ontario", provinceAbbr: "ON", populationLatest: 368381, centroidLat: 42.3, centroidLng: -83.0, cmaBoundaryNote: null },
  { id: "cma_saskatoon", name: "Saskatoon", slug: "saskatoon", province: "Saskatchewan", provinceAbbr: "SK", populationLatest: 355543, centroidLat: 52.1, centroidLng: -106.7, cmaBoundaryNote: null },
  { id: "cma_regina", name: "Regina", slug: "regina", province: "Saskatchewan", provinceAbbr: "SK", populationLatest: 302970, centroidLat: 50.4, centroidLng: -104.6, cmaBoundaryNote: null },
  { id: "cma_sherbrooke", name: "Sherbrooke", slug: "sherbrooke", province: "Quebec", provinceAbbr: "QC", populationLatest: 225000, centroidLat: 45.4, centroidLng: -71.9, cmaBoundaryNote: null },
  { id: "cma_barrie", name: "Barrie", slug: "barrie", province: "Ontario", provinceAbbr: "ON", populationLatest: 218134, centroidLat: 44.4, centroidLng: -79.7, cmaBoundaryNote: null },
  { id: "cma_kelowna", name: "Kelowna", slug: "kelowna", province: "British Columbia", provinceAbbr: "BC", populationLatest: 222162, centroidLat: 49.9, centroidLng: -119.5, cmaBoundaryNote: null },
  { id: "cma_abbotsford", name: "Abbotsford–Mission", slug: "abbotsford-mission", province: "British Columbia", provinceAbbr: "BC", populationLatest: 209278, centroidLat: 49.1, centroidLng: -122.3, cmaBoundaryNote: null },
  { id: "cma_sudbury", name: "Greater Sudbury", slug: "greater-sudbury", province: "Ontario", provinceAbbr: "ON", populationLatest: 176000, centroidLat: 46.5, centroidLng: -81.0, cmaBoundaryNote: null },
  { id: "cma_kingston", name: "Kingston", slug: "kingston", province: "Ontario", provinceAbbr: "ON", populationLatest: 172546, centroidLat: 44.2, centroidLng: -76.5, cmaBoundaryNote: null },
  { id: "cma_saguenay", name: "Saguenay", slug: "saguenay", province: "Quebec", provinceAbbr: "QC", populationLatest: 170000, centroidLat: 48.4, centroidLng: -71.1, cmaBoundaryNote: null },
  { id: "cma_thunder_bay", name: "Thunder Bay", slug: "thunder-bay", province: "Ontario", provinceAbbr: "ON", populationLatest: 134000, centroidLat: 48.4, centroidLng: -89.2, cmaBoundaryNote: null },
  { id: "cma_saint_john", name: "Saint John", slug: "saint-john", province: "New Brunswick", provinceAbbr: "NB", populationLatest: 127000, centroidLat: 45.3, centroidLng: -66.1, cmaBoundaryNote: null },
  { id: "cma_fredericton", name: "Fredericton", slug: "fredericton", province: "New Brunswick", provinceAbbr: "NB", populationLatest: 107000, centroidLat: 45.9, centroidLng: -66.6, cmaBoundaryNote: null },
  { id: "cma_moncton", name: "Moncton", slug: "moncton", province: "New Brunswick", provinceAbbr: "NB", populationLatest: 160000, centroidLat: 46.1, centroidLng: -64.8, cmaBoundaryNote: null },
  { id: "cma_guelph", name: "Guelph", slug: "guelph", province: "Ontario", provinceAbbr: "ON", populationLatest: 191748, centroidLat: 43.5, centroidLng: -80.2, cmaBoundaryNote: null },
  { id: "cma_brantford", name: "Brantford", slug: "brantford", province: "Ontario", provinceAbbr: "ON", populationLatest: 141000, centroidLat: 43.1, centroidLng: -80.3, cmaBoundaryNote: null },
  { id: "cma_peterborough", name: "Peterborough", slug: "peterborough", province: "Ontario", provinceAbbr: "ON", populationLatest: 139000, centroidLat: 44.3, centroidLng: -78.3, cmaBoundaryNote: null },
  { id: "cma_lethbridge", name: "Lethbridge", slug: "lethbridge", province: "Alberta", provinceAbbr: "AB", populationLatest: 128000, centroidLat: 49.7, centroidLng: -112.8, cmaBoundaryNote: null },
  { id: "cma_nanaimo", name: "Nanaimo", slug: "nanaimo", province: "British Columbia", provinceAbbr: "BC", populationLatest: 114000, centroidLat: 49.2, centroidLng: -124.0, cmaBoundaryNote: null },
  { id: "cma_red_deer", name: "Red Deer", slug: "red-deer", province: "Alberta", provinceAbbr: "AB", populationLatest: 113000, centroidLat: 52.3, centroidLng: -113.8, cmaBoundaryNote: null },
  { id: "cma_trois_rivieres", name: "Trois-Rivières", slug: "trois-rivieres", province: "Quebec", provinceAbbr: "QC", populationLatest: 164000, centroidLat: 46.4, centroidLng: -72.5, cmaBoundaryNote: null },
  { id: "cma_st_johns", name: "St. John's", slug: "st-johns", province: "Newfoundland and Labrador", provinceAbbr: "NL", populationLatest: 215000, centroidLat: 47.56, centroidLng: -52.71, cmaBoundaryNote: "The St. John's CMA includes Mount Pearl, Paradise, Conception Bay South, and surrounding municipalities on the Avalon Peninsula." },
];

// ── Metric Definitions ───────────────────────────────────────────────────────

export const METRICS: Metric[] = [
  // Economic Vitality
  {
    id: "metric_unemployment_rate",
    dimension: "economic",
    name: "Unemployment Rate",
    sourceName: "Statistics Canada Labour Force Survey",
    sourceTable: "14-10-0459-01",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/!downloadTbl/csvDownload!14100459",
    updateFrequency: "Monthly",
    direction: "lower_is_better",
    weightWithinDimension: 40,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  {
    id: "metric_employment_rate",
    dimension: "economic",
    name: "Employment Rate",
    sourceName: "Statistics Canada Labour Force Survey",
    sourceTable: "14-10-0459-01",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/!downloadTbl/csvDownload!14100459",
    updateFrequency: "Monthly",
    direction: "higher_is_better",
    weightWithinDimension: 30,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  {
    id: "metric_median_income",
    dimension: "economic",
    name: "Median Household Income",
    sourceName: "Statistics Canada T1FF / Census",
    sourceTable: "11-10-0162-01",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/!downloadTbl/csvDownload!11100162",
    updateFrequency: "Annual (18-month lag)",
    direction: "higher_is_better",
    weightWithinDimension: 30,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  // Housing Affordability
  {
    id: "metric_avg_rent",
    dimension: "housing",
    name: "Average Monthly Rent (2BR)",
    sourceName: "CMHC Rental Market Survey",
    sourceTable: null,
    sourceUrl: "https://www.cmhc-schl.gc.ca/en/professionals/housing-markets-data-and-research/housing-data/data-tables/rental-market",
    updateFrequency: "Annual",
    direction: "lower_is_better",
    weightWithinDimension: 35,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  {
    id: "metric_vacancy_rate",
    dimension: "housing",
    name: "Rental Vacancy Rate",
    sourceName: "CMHC Rental Market Survey",
    sourceTable: null,
    sourceUrl: "https://www.cmhc-schl.gc.ca/en/professionals/housing-markets-data-and-research/housing-data/data-tables/rental-market",
    updateFrequency: "Annual",
    direction: "higher_is_better",
    weightWithinDimension: 30,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  {
    id: "metric_housing_price_index",
    dimension: "housing",
    name: "New Housing Price Index",
    sourceName: "CMHC / Statistics Canada (CREA HPI proxy)",
    sourceTable: "18-10-0205-01",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/!downloadTbl/csvDownload!18100205",
    updateFrequency: "Monthly",
    direction: "lower_is_better",
    weightWithinDimension: 35,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  // Quality of Life
  {
    id: "metric_cpi",
    dimension: "quality_of_life",
    name: "Consumer Price Index",
    sourceName: "Statistics Canada CPI",
    sourceTable: "18-10-0004-01",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/!downloadTbl/csvDownload!18100004",
    updateFrequency: "Monthly (12 cities; provincial fallback)",
    direction: "lower_is_better",
    weightWithinDimension: 40,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  {
    id: "metric_pop_growth",
    dimension: "quality_of_life",
    name: "5-Year Population Growth Rate",
    sourceName: "Statistics Canada Population Estimates",
    sourceTable: "17-10-0148-01",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/!downloadTbl/csvDownload!17100148",
    updateFrequency: "Annual",
    direction: "higher_is_better",
    weightWithinDimension: 60,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  // Safety
  {
    id: "metric_csi",
    dimension: "safety",
    name: "Crime Severity Index",
    sourceName: "Statistics Canada Uniform Crime Reporting Survey",
    sourceTable: "35-10-0026-01",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/!downloadTbl/csvDownload!35100026",
    updateFrequency: "Annual (7-month lag)",
    direction: "lower_is_better",
    weightWithinDimension: 100,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  // Environment
  {
    id: "metric_aqhi",
    dimension: "environment",
    name: "Air Quality Health Index (30-day avg)",
    sourceName: "Environment and Climate Change Canada",
    sourceTable: null,
    sourceUrl: "https://www.canada.ca/en/environment-climate-change/services/air-quality-health-index.html",
    updateFrequency: "Daily (30-day rolling average shown)",
    direction: "lower_is_better",
    weightWithinDimension: 100,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  // Demographics
  {
    id: "metric_population",
    dimension: "demographics",
    name: "Population",
    sourceName: "Statistics Canada Population Estimates",
    sourceTable: "17-10-0148-01",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/!downloadTbl/csvDownload!17100148",
    updateFrequency: "Annual",
    direction: "neutral",
    weightWithinDimension: 0,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  {
    id: "metric_pop_growth_5yr",
    dimension: "demographics",
    name: "5-Year Population Growth",
    sourceName: "Statistics Canada Population Estimates",
    sourceTable: "17-10-0148-01",
    sourceUrl: "https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/!downloadTbl/csvDownload!17100148",
    updateFrequency: "Annual",
    direction: "higher_is_better",
    weightWithinDimension: 50,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  {
    id: "metric_immigration_share",
    dimension: "demographics",
    name: "Immigration Share",
    sourceName: "Statistics Canada Census 2021",
    sourceTable: "98-10-0384-01",
    sourceUrl: "https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm",
    updateFrequency: "5-year Census",
    direction: "higher_is_better",
    weightWithinDimension: 30,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
  {
    id: "metric_median_age",
    dimension: "demographics",
    name: "Median Age",
    sourceName: "Statistics Canada Census 2021",
    sourceTable: "98-10-0384-01",
    sourceUrl: "https://www12.statcan.gc.ca/census-recensement/2021/dp-pd/prof/index.cfm",
    updateFrequency: "5-year Census",
    direction: "neutral",
    weightWithinDimension: 0,
    proxyFallbackMetricId: null,
    isProxyTarget: false,
  },
];

// ── Raw Metric Values ────────────────────────────────────────────────────────
// Period: "2024" for annual 2024 data, "2023" for 2023 surveys, "2021" for census

type MetricValueInput = {
  cmaId: string;
  metricId: string;
  period: string;
  value: number | null;
  isProxy: boolean;
  proxyNote: string | null;
  sourcePublicationDate: string;
  sourceTableId: string | null;
};

export const RAW_METRIC_VALUES: MetricValueInput[] = [
  // ── Unemployment Rate (2024, monthly avg) ──
  ...([
    ["cma_toronto", 7.4], ["cma_montreal", 6.2], ["cma_vancouver", 5.8],
    ["cma_calgary", 6.4], ["cma_edmonton", 7.1], ["cma_ottawa", 5.2],
    ["cma_winnipeg", 4.9], ["cma_quebec_city", 3.8], ["cma_hamilton", 5.7],
    ["cma_kitchener", 6.1], ["cma_london", 6.5], ["cma_halifax", 5.4],
    ["cma_oshawa", 6.8], ["cma_victoria", 4.3], ["cma_windsor", 8.2],
    ["cma_saskatoon", 5.6], ["cma_regina", 4.9], ["cma_sherbrooke", 4.1],
    ["cma_barrie", 6.2], ["cma_kelowna", 4.7], ["cma_abbotsford", 5.2],
    ["cma_sudbury", 6.8], ["cma_kingston", 4.8], ["cma_saguenay", 4.2],
    ["cma_thunder_bay", 5.9], ["cma_saint_john", 7.1], ["cma_fredericton", 5.3],
    ["cma_moncton", 5.8], ["cma_guelph", 5.4], ["cma_brantford", 6.9],
    ["cma_peterborough", 6.3], ["cma_lethbridge", 5.8], ["cma_nanaimo", 5.6],
    ["cma_red_deer", 6.2], ["cma_trois_rivieres", 4.8],
    ["cma_st_johns", 7.8],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_unemployment_rate",
    period: "2024",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2024-12-20",
    sourceTableId: "14-10-0459-01",
  })),

  // ── Employment Rate (2024) ──
  ...([
    ["cma_toronto", 60.1], ["cma_montreal", 61.4], ["cma_vancouver", 62.3],
    ["cma_calgary", 65.8], ["cma_edmonton", 64.2], ["cma_ottawa", 65.4],
    ["cma_winnipeg", 66.2], ["cma_quebec_city", 64.8], ["cma_hamilton", 61.9],
    ["cma_kitchener", 63.4], ["cma_london", 61.2], ["cma_halifax", 63.7],
    ["cma_oshawa", 61.8], ["cma_victoria", 63.9], ["cma_windsor", 59.8],
    ["cma_saskatoon", 64.8], ["cma_regina", 66.1], ["cma_sherbrooke", 63.8],
    ["cma_barrie", 62.4], ["cma_kelowna", 63.8], ["cma_abbotsford", 62.1],
    ["cma_sudbury", 61.4], ["cma_kingston", 62.8], ["cma_saguenay", 63.1],
    ["cma_thunder_bay", 61.8], ["cma_saint_john", 60.4], ["cma_fredericton", 63.2],
    ["cma_moncton", 63.6], ["cma_guelph", 64.1], ["cma_brantford", 61.6],
    ["cma_peterborough", 61.1], ["cma_lethbridge", 63.8], ["cma_nanaimo", 62.4],
    ["cma_red_deer", 64.2], ["cma_trois_rivieres", 62.7],
    ["cma_st_johns", 59.2],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_employment_rate",
    period: "2024",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2024-12-20",
    sourceTableId: "14-10-0459-01",
  })),

  // ── Median Household Income 2021 (Census/T1FF) ──
  ...([
    ["cma_toronto", 87000], ["cma_montreal", 72000], ["cma_vancouver", 84000],
    ["cma_calgary", 96000], ["cma_edmonton", 91000], ["cma_ottawa", 98000],
    ["cma_winnipeg", 83000], ["cma_quebec_city", 79000], ["cma_hamilton", 84000],
    ["cma_kitchener", 91000], ["cma_london", 79000], ["cma_halifax", 83000],
    ["cma_oshawa", 92000], ["cma_victoria", 86000], ["cma_windsor", 79000],
    ["cma_saskatoon", 87000], ["cma_regina", 86000], ["cma_sherbrooke", 69000],
    ["cma_barrie", 88000], ["cma_kelowna", 82000], ["cma_abbotsford", 78000],
    ["cma_sudbury", 83000], ["cma_kingston", 81000], ["cma_saguenay", 70000],
    ["cma_thunder_bay", 79000], ["cma_saint_john", 72000], ["cma_fredericton", 78000],
    ["cma_moncton", 77000], ["cma_guelph", 93000], ["cma_brantford", 82000],
    ["cma_peterborough", 78000], ["cma_lethbridge", 86000], ["cma_nanaimo", 77000],
    ["cma_red_deer", 89000], ["cma_trois_rivieres", 68000],
    ["cma_st_johns", 75000],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_median_income",
    period: "2021",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2022-09-21",
    sourceTableId: "11-10-0162-01",
  })),

  // ── Average Monthly Rent 2BR (2023 CMHC) ──
  ...([
    ["cma_toronto", 2247], ["cma_montreal", 1197], ["cma_vancouver", 2412],
    ["cma_calgary", 1828], ["cma_edmonton", 1415], ["cma_ottawa", 1742],
    ["cma_winnipeg", 1332], ["cma_quebec_city", 1026], ["cma_hamilton", 1643],
    ["cma_kitchener", 1748], ["cma_london", 1487], ["cma_halifax", 1842],
    ["cma_oshawa", 1798], ["cma_victoria", 2108], ["cma_windsor", 1398],
    ["cma_saskatoon", 1256], ["cma_regina", 1189], ["cma_sherbrooke", 842],
    ["cma_barrie", 1756], ["cma_kelowna", 1834], ["cma_abbotsford", 1698],
    ["cma_sudbury", 1124], ["cma_kingston", 1567], ["cma_saguenay", 847],
    ["cma_thunder_bay", 1098], ["cma_saint_john", 1124], ["cma_fredericton", 1178],
    ["cma_moncton", 1287], ["cma_guelph", 1823], ["cma_brantford", 1478],
    ["cma_peterborough", 1456], ["cma_lethbridge", 1187], ["cma_nanaimo", 1756],
    ["cma_red_deer", 1198], ["cma_trois_rivieres", 912],
    ["cma_st_johns", 1087],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_avg_rent",
    period: "2023",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2023-11-28",
    sourceTableId: null,
  })),

  // ── Rental Vacancy Rate (2023 CMHC) ──
  ...([
    ["cma_toronto", 1.5], ["cma_montreal", 3.0], ["cma_vancouver", 0.9],
    ["cma_calgary", 2.1], ["cma_edmonton", 2.4], ["cma_ottawa", 1.7],
    ["cma_winnipeg", 2.8], ["cma_quebec_city", 2.5], ["cma_hamilton", 1.4],
    ["cma_kitchener", 1.6], ["cma_london", 1.3], ["cma_halifax", 1.0],
    ["cma_oshawa", 1.2], ["cma_victoria", 1.3], ["cma_windsor", 1.9],
    ["cma_saskatoon", 3.4], ["cma_regina", 4.2], ["cma_sherbrooke", 3.8],
    ["cma_barrie", 1.8], ["cma_kelowna", 1.2], ["cma_abbotsford", 1.4],
    ["cma_sudbury", 5.1], ["cma_kingston", 2.1], ["cma_saguenay", 3.2],
    ["cma_thunder_bay", 4.8], ["cma_saint_john", 3.6], ["cma_fredericton", 3.1],
    ["cma_moncton", 2.4], ["cma_guelph", 1.7], ["cma_brantford", 1.8],
    ["cma_peterborough", 2.2], ["cma_lethbridge", 4.6], ["cma_nanaimo", 1.9],
    ["cma_red_deer", 5.3], ["cma_trois_rivieres", 3.9],
    ["cma_st_johns", 3.8],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_vacancy_rate",
    period: "2023",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2023-11-28",
    sourceTableId: null,
  })),

  // ── New Housing Price Index 2023 (proxy for CREA HPI) ──
  ...([
    ["cma_toronto", 124.7], ["cma_montreal", 131.8], ["cma_vancouver", 118.2],
    ["cma_calgary", 143.6], ["cma_edmonton", 112.4], ["cma_ottawa", 128.3],
    ["cma_winnipeg", 138.7], ["cma_quebec_city", 142.1], ["cma_hamilton", 121.8],
    ["cma_kitchener", 119.4], ["cma_london", 122.7], ["cma_halifax", 148.3],
    ["cma_oshawa", 123.1], ["cma_victoria", 115.8], ["cma_windsor", 129.4],
    ["cma_saskatoon", 134.2], ["cma_regina", 126.7], ["cma_sherbrooke", 137.4],
    ["cma_barrie", 120.8], ["cma_kelowna", 114.7], ["cma_abbotsford", 116.3],
    ["cma_sudbury", 132.8], ["cma_kingston", 126.4], ["cma_saguenay", 139.2],
    ["cma_thunder_bay", 128.6], ["cma_saint_john", 141.7], ["cma_fredericton", 138.9],
    ["cma_moncton", 144.3], ["cma_guelph", 121.6], ["cma_brantford", 127.8],
    ["cma_peterborough", 125.4], ["cma_lethbridge", 131.2], ["cma_nanaimo", 113.8],
    ["cma_red_deer", 128.4], ["cma_trois_rivieres", 140.6],
    ["cma_st_johns", 127.4],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_housing_price_index",
    period: "2023",
    value,
    isProxy: true,
    proxyNote: "CMHC New Housing Price Index used as proxy for CREA MLS HPI (2016=100)",
    sourcePublicationDate: "2024-01-18",
    sourceTableId: "18-10-0205-01",
  })),

  // ── Consumer Price Index 2024 (annual avg) ──
  // 12 cities have direct CPI; others get provincial proxy
  ...([
    ["cma_toronto", 160.8, false, null],
    ["cma_montreal", 157.2, false, null],
    ["cma_vancouver", 162.4, false, null],
    ["cma_calgary", 156.1, false, null],
    ["cma_edmonton", 154.8, false, null],
    ["cma_ottawa", 159.3, false, null],
    ["cma_winnipeg", 155.6, false, null],
    ["cma_quebec_city", 154.2, false, null],
    ["cma_hamilton", 159.8, true, "Ontario provincial CPI used as proxy"],
    ["cma_kitchener", 158.9, true, "Ontario provincial CPI used as proxy"],
    ["cma_london", 159.1, true, "Ontario provincial CPI used as proxy"],
    ["cma_halifax", 157.8, false, null],
    ["cma_oshawa", 160.1, true, "Ontario provincial CPI used as proxy"],
    ["cma_victoria", 161.2, false, null],
    ["cma_windsor", 158.6, true, "Ontario provincial CPI used as proxy"],
    ["cma_saskatoon", 155.4, true, "Saskatchewan provincial CPI used as proxy"],
    ["cma_regina", 154.9, false, null],
    ["cma_sherbrooke", 156.8, true, "Quebec provincial CPI used as proxy"],
    ["cma_barrie", 160.4, true, "Ontario provincial CPI used as proxy"],
    ["cma_kelowna", 160.7, true, "BC provincial CPI used as proxy"],
    ["cma_abbotsford", 161.9, true, "BC provincial CPI used as proxy"],
    ["cma_sudbury", 158.3, true, "Ontario provincial CPI used as proxy"],
    ["cma_kingston", 159.5, true, "Ontario provincial CPI used as proxy"],
    ["cma_saguenay", 155.2, true, "Quebec provincial CPI used as proxy"],
    ["cma_thunder_bay", 158.7, true, "Ontario provincial CPI used as proxy"],
    ["cma_saint_john", 156.4, true, "New Brunswick provincial CPI used as proxy"],
    ["cma_fredericton", 156.1, true, "New Brunswick provincial CPI used as proxy"],
    ["cma_moncton", 156.7, true, "New Brunswick provincial CPI used as proxy"],
    ["cma_guelph", 159.6, true, "Ontario provincial CPI used as proxy"],
    ["cma_brantford", 159.2, true, "Ontario provincial CPI used as proxy"],
    ["cma_peterborough", 159.8, true, "Ontario provincial CPI used as proxy"],
    ["cma_lethbridge", 155.7, true, "Alberta provincial CPI used as proxy"],
    ["cma_nanaimo", 161.5, true, "BC provincial CPI used as proxy"],
    ["cma_red_deer", 155.3, true, "Alberta provincial CPI used as proxy"],
    ["cma_trois_rivieres", 155.9, true, "Quebec provincial CPI used as proxy"],
    ["cma_st_johns", 157.1, true, "Newfoundland and Labrador provincial CPI used as proxy"],
  ] as [string, number, boolean, string | null][]).map(([cmaId, value, isProxy, proxyNote]) => ({
    cmaId,
    metricId: "metric_cpi",
    period: "2024",
    value,
    isProxy: isProxy as boolean,
    proxyNote: proxyNote as string | null,
    sourcePublicationDate: "2024-12-17",
    sourceTableId: "18-10-0004-01",
  })),

  // ── 5-Year Population Growth Rate 2018-2023 ──
  ...([
    ["cma_toronto", 8.2], ["cma_montreal", 6.4], ["cma_vancouver", 9.3],
    ["cma_calgary", 13.8], ["cma_edmonton", 11.2], ["cma_ottawa", 9.7],
    ["cma_winnipeg", 7.6], ["cma_quebec_city", 5.8], ["cma_hamilton", 7.1],
    ["cma_kitchener", 12.4], ["cma_london", 8.9], ["cma_halifax", 14.2],
    ["cma_oshawa", 9.8], ["cma_victoria", 8.6], ["cma_windsor", 5.2],
    ["cma_saskatoon", 9.4], ["cma_regina", 5.7], ["cma_sherbrooke", 6.8],
    ["cma_barrie", 9.1], ["cma_kelowna", 12.7], ["cma_abbotsford", 10.3],
    ["cma_sudbury", 2.1], ["cma_kingston", 7.4], ["cma_saguenay", 3.2],
    ["cma_thunder_bay", 1.8], ["cma_saint_john", 3.4], ["cma_fredericton", 8.7],
    ["cma_moncton", 11.6], ["cma_guelph", 11.2], ["cma_brantford", 6.8],
    ["cma_peterborough", 5.6], ["cma_lethbridge", 8.9], ["cma_nanaimo", 9.7],
    ["cma_red_deer", 4.3], ["cma_trois_rivieres", 4.7],
    ["cma_st_johns", 4.8],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_pop_growth",
    period: "2023",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2023-09-27",
    sourceTableId: "17-10-0148-01",
  })),

  // ── Crime Severity Index 2023 ──
  ...([
    ["cma_toronto", 53.2], ["cma_montreal", 62.1], ["cma_vancouver", 104.3],
    ["cma_calgary", 77.4], ["cma_edmonton", 117.2], ["cma_ottawa", 51.8],
    ["cma_winnipeg", 138.7], ["cma_quebec_city", 48.2], ["cma_hamilton", 79.3],
    ["cma_kitchener", 63.4], ["cma_london", 78.9], ["cma_halifax", 59.7],
    ["cma_oshawa", 72.1], ["cma_victoria", 98.6], ["cma_windsor", 75.4],
    ["cma_saskatoon", 143.2], ["cma_regina", 154.8], ["cma_sherbrooke", 49.3],
    ["cma_barrie", 68.2], ["cma_kelowna", 112.4], ["cma_abbotsford", 98.7],
    ["cma_sudbury", 89.2], ["cma_kingston", 58.4], ["cma_saguenay", 46.1],
    ["cma_thunder_bay", 162.3], ["cma_saint_john", 92.4], ["cma_fredericton", 71.3],
    ["cma_moncton", 88.6], ["cma_guelph", 57.2], ["cma_brantford", 82.1],
    ["cma_peterborough", 71.8], ["cma_lethbridge", 126.4], ["cma_nanaimo", 118.7],
    ["cma_red_deer", 139.6], ["cma_trois_rivieres", 67.4],
    ["cma_st_johns", 100.2],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_csi",
    period: "2023",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2024-07-22",
    sourceTableId: "35-10-0026-01",
  })),

  // ── AQHI 30-day rolling average 2024 ──
  ...([
    ["cma_toronto", 3.2], ["cma_montreal", 2.8], ["cma_vancouver", 3.1],
    ["cma_calgary", 2.4], ["cma_edmonton", 2.7], ["cma_ottawa", 2.6],
    ["cma_winnipeg", 2.3], ["cma_quebec_city", 2.1], ["cma_hamilton", 3.4],
    ["cma_kitchener", 3.0], ["cma_london", 2.9], ["cma_halifax", 2.2],
    ["cma_oshawa", 3.3], ["cma_victoria", 2.4], ["cma_windsor", 3.6],
    ["cma_saskatoon", 2.8], ["cma_regina", 2.6], ["cma_sherbrooke", 2.3],
    ["cma_barrie", 2.7], ["cma_kelowna", 2.9], ["cma_abbotsford", 3.2],
    ["cma_sudbury", 2.4], ["cma_kingston", 2.5], ["cma_saguenay", 2.2],
    ["cma_thunder_bay", 2.6], ["cma_saint_john", 2.3], ["cma_fredericton", 2.4],
    ["cma_moncton", 2.3], ["cma_guelph", 2.9], ["cma_brantford", 3.1],
    ["cma_peterborough", 2.7], ["cma_lethbridge", 2.5], ["cma_nanaimo", 2.6],
    ["cma_red_deer", 2.8], ["cma_trois_rivieres", 2.2],
    ["cma_st_johns", 2.1],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_aqhi",
    period: "2024",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2024-11-30",
    sourceTableId: null,
  })),

  // ── Population (neutral, for display) ──
  ...CMAS.map((cma) => ({
    cmaId: cma.id,
    metricId: "metric_population",
    period: "2023",
    value: cma.populationLatest,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2023-09-27",
    sourceTableId: "17-10-0148-01",
  })),

  // ── 5-yr population growth (demographics dimension) ──
  ...([
    ["cma_toronto", 8.2], ["cma_montreal", 6.4], ["cma_vancouver", 9.3],
    ["cma_calgary", 13.8], ["cma_edmonton", 11.2], ["cma_ottawa", 9.7],
    ["cma_winnipeg", 7.6], ["cma_quebec_city", 5.8], ["cma_hamilton", 7.1],
    ["cma_kitchener", 12.4], ["cma_london", 8.9], ["cma_halifax", 14.2],
    ["cma_oshawa", 9.8], ["cma_victoria", 8.6], ["cma_windsor", 5.2],
    ["cma_saskatoon", 9.4], ["cma_regina", 5.7], ["cma_sherbrooke", 6.8],
    ["cma_barrie", 9.1], ["cma_kelowna", 12.7], ["cma_abbotsford", 10.3],
    ["cma_sudbury", 2.1], ["cma_kingston", 7.4], ["cma_saguenay", 3.2],
    ["cma_thunder_bay", 1.8], ["cma_saint_john", 3.4], ["cma_fredericton", 8.7],
    ["cma_moncton", 11.6], ["cma_guelph", 11.2], ["cma_brantford", 6.8],
    ["cma_peterborough", 5.6], ["cma_lethbridge", 8.9], ["cma_nanaimo", 9.7],
    ["cma_red_deer", 4.3], ["cma_trois_rivieres", 4.7],
    ["cma_st_johns", 4.8],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_pop_growth_5yr",
    period: "2023",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2023-09-27",
    sourceTableId: "17-10-0148-01",
  })),

  // ── Immigration Share 2021 Census ──
  ...([
    ["cma_toronto", 46.1], ["cma_montreal", 24.4], ["cma_vancouver", 43.5],
    ["cma_calgary", 30.5], ["cma_edmonton", 27.3], ["cma_ottawa", 25.2],
    ["cma_winnipeg", 23.7], ["cma_quebec_city", 7.4], ["cma_hamilton", 26.8],
    ["cma_kitchener", 28.9], ["cma_london", 24.7], ["cma_halifax", 15.2],
    ["cma_oshawa", 28.4], ["cma_victoria", 23.1], ["cma_windsor", 27.8],
    ["cma_saskatoon", 17.4], ["cma_regina", 16.8], ["cma_sherbrooke", 12.3],
    ["cma_barrie", 18.7], ["cma_kelowna", 15.4], ["cma_abbotsford", 24.8],
    ["cma_sudbury", 9.2], ["cma_kingston", 14.8], ["cma_saguenay", 4.1],
    ["cma_thunder_bay", 8.7], ["cma_saint_john", 8.4], ["cma_fredericton", 10.6],
    ["cma_moncton", 9.8], ["cma_guelph", 26.4], ["cma_brantford", 19.8],
    ["cma_peterborough", 13.7], ["cma_lethbridge", 17.2], ["cma_nanaimo", 16.8],
    ["cma_red_deer", 18.4], ["cma_trois_rivieres", 6.2],
    ["cma_st_johns", 5.6],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_immigration_share",
    period: "2021",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2022-04-27",
    sourceTableId: "98-10-0384-01",
  })),

  // ── Median Age 2021 Census (neutral, display only) ──
  ...([
    ["cma_toronto", 39.8], ["cma_montreal", 40.3], ["cma_vancouver", 40.2],
    ["cma_calgary", 37.3], ["cma_edmonton", 37.4], ["cma_ottawa", 39.6],
    ["cma_winnipeg", 38.7], ["cma_quebec_city", 43.1], ["cma_hamilton", 40.9],
    ["cma_kitchener", 37.6], ["cma_london", 39.8], ["cma_halifax", 40.2],
    ["cma_oshawa", 40.1], ["cma_victoria", 43.2], ["cma_windsor", 42.4],
    ["cma_saskatoon", 37.8], ["cma_regina", 37.4], ["cma_sherbrooke", 41.8],
    ["cma_barrie", 39.4], ["cma_kelowna", 43.8], ["cma_abbotsford", 39.2],
    ["cma_sudbury", 44.2], ["cma_kingston", 43.6], ["cma_saguenay", 44.8],
    ["cma_thunder_bay", 43.4], ["cma_saint_john", 44.7], ["cma_fredericton", 41.8],
    ["cma_moncton", 42.3], ["cma_guelph", 38.4], ["cma_brantford", 41.2],
    ["cma_peterborough", 44.1], ["cma_lethbridge", 39.8], ["cma_nanaimo", 47.2],
    ["cma_red_deer", 38.9], ["cma_trois_rivieres", 44.6],
    ["cma_st_johns", 43.9],
  ] as [string, number][]).map(([cmaId, value]) => ({
    cmaId,
    metricId: "metric_median_age",
    period: "2021",
    value,
    isProxy: false,
    proxyNote: null,
    sourcePublicationDate: "2022-04-27",
    sourceTableId: "98-10-0384-01",
  })),
];

// ── Helper: convert to RawMetricData for scoring ────────────────────────────

export function toRawMetricData(): RawMetricData[] {
  const metricMap = new Map(METRICS.map((m) => [m.id, m]));
  return RAW_METRIC_VALUES.filter((v) => v.value !== null).map((v) => {
    const metric = metricMap.get(v.metricId)!;
    return {
      metricId: v.metricId,
      cmaId: v.cmaId,
      value: v.value,
      isProxy: v.isProxy,
      direction: metric.direction,
      weightWithinDimension: metric.weightWithinDimension,
      dimension: metric.dimension,
    };
  });
}

// ── Helper: get value for a specific CMA + metric ──────────────────────────

export function getMetricValue(
  cmaId: string,
  metricId: string
): MetricValueInput | null {
  return (
    RAW_METRIC_VALUES.find(
      (v) => v.cmaId === cmaId && v.metricId === metricId
    ) ?? null
  );
}
