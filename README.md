# CityScore Canada

An interactive web dashboard ranking all 36 Canadian Census Metropolitan Areas (CMAs) by a composite prosperity score. Users can compare cities side-by-side and customize the weights of each dimension to reflect their own priorities.

**Live:** [canadian-prosperity-dashboard-prod.nbabailov.workers.dev](https://canadian-prosperity-dashboard-prod.nbabailov.workers.dev)

---

## Features

- Rankings of all 36 Canadian CMAs across 6 dimensions and 14 metrics
- Real-time weight customization with sliders (no page reload)
- Side-by-side city comparison with delta toggle
- Individual city profile pages with per-metric freshness badges
- City search with mnemonic support (airport codes, nicknames)
- Data sources page with methodology explanation
- Shareable comparison URLs (`/compare?a=toronto&b=calgary`)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) via vinext |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Deployment | Cloudflare Workers |
| Package manager | pnpm |

## Data Architecture

All data is **statically embedded** at build time — no runtime database queries.

```
scripts/ingest-data.ts  →  src/lib/data.ts  →  pnpm build  →  baked into JS bundle
```

- `src/lib/data.ts` — 36 CMAs, 14 metrics, ~500 metric values
- `src/lib/scoring.ts` — min-max normalization, outlier clipping, weight computation
- `src/lib/computed-scores.ts` — build-time score precomputation

The ingestion script downloads real CSV data directly from Statistics Canada's bulk download API, parses it, and writes verified values into `data.ts`. CMHC and ECCC data is sourced from published reports.

D1 schema and seed scripts exist in `migrations/` for a future Phase 2 runtime data layer.

## Data Sources

| Metric | Source | Table | Frequency |
|---|---|---|---|
| Unemployment rate | Statistics Canada LFS | 14-10-0459-01 | Monthly |
| Employment rate | Statistics Canada LFS | 14-10-0459-01 | Monthly |
| Median household income | Statistics Canada T1FF | 11-10-0162-01 | Annual |
| Average monthly rent (2BR) | CMHC Rental Market Survey | — | Annual |
| Rental vacancy rate | CMHC Rental Market Survey | — | Annual |
| New housing price index | Statistics Canada | 18-10-0205-01 | Monthly |
| Consumer Price Index | Statistics Canada | 18-10-0004-01 | Monthly |
| Crime Severity Index | Statistics Canada UCR | 35-10-0026-01 | Annual |
| Air Quality Health Index | Environment Canada | — | Daily (30-day avg) |
| Population + growth | Statistics Canada | 17-10-0148-01 | Annual |
| Immigration share | Census 2021 | — | 5-year |
| Median age | Census 2021 | — | 5-year |

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 9+

### Setup

```bash
git clone https://github.com/babailov/canadian-prosperity-dashboard.git
cd canadian-prosperity-dashboard
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm run build:vinext
```

### Refresh Data

To pull the latest data from Statistics Canada:

```bash
npx tsx scripts/ingest-data.ts
pnpm run build:vinext
```

The script downloads real CSV tables from StatsCan's bulk API, parses values for all 36 CMAs, and rewrites `src/lib/data.ts`.

---

## Deployment

The project deploys to Cloudflare Workers via vinext. CI/CD is configured in `.github/workflows/deploy.yml`:

| Branch | Environment | URL |
|---|---|---|
| `main` | Production | `canadian-prosperity-dashboard-prod.nbabailov.workers.dev` |
| `develop` | Development | `canadian-prosperity-dashboard-dev.nbabailov.workers.dev` |
| PR to `main` | Build check only | — |

### GitHub Actions Secrets Required

| Secret | Description |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers deploy permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

### Manual Deploy

```bash
pnpm run build:vinext
npx vinext deploy
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Rankings homepage
│   ├── city/[slug]/        # City profile pages (36 static pages)
│   ├── compare/            # City comparison tool
│   ├── data/               # Data sources reference
│   └── about/              # About + methodology
├── components/
│   ├── nav/                # TopNav, CitySearch
│   ├── rankings/           # RankingTable, WeightPanel, DimensionTabs
│   ├── city/               # FreshnessBadge
│   ├── compare/            # ComparisonLayout
│   └── ui/                 # ScoreBar, Badge, Accordion
├── lib/
│   ├── data.ts             # All CMA data + metric values (embedded)
│   ├── scoring.ts          # Scoring algorithm (client + server)
│   └── computed-scores.ts  # Build-time precomputed scores
└── types/
    └── index.ts            # TypeScript types
scripts/
└── ingest-data.ts          # StatsCan data ingestion pipeline
migrations/
├── 0001_initial.sql        # D1 schema (Phase 2)
└── 0002_seed.sql           # Generated seed data (Phase 2)
```

---

## Scoring Algorithm

1. **Collect** all metric values across all 36 CMAs
2. **Clip outliers** at 3 standard deviations
3. **Normalize** each metric to 0–100 using min-max normalization
4. **Invert** "lower is better" metrics so higher scores always mean better outcomes
5. **Dimension score** = unweighted average of available metrics for that CMA
6. **Overall score** = weighted average of dimension scores

Default weights: Economic 25%, Housing 25%, Quality of Life 20%, Safety 15%, Environment 10%, Demographics 5%.

Custom weights are computed entirely client-side — no server round-trip required.

---

## License

MIT. Data sourced from public Statistics Canada tables, CMHC, and ECCC.
