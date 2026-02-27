# CityScore Canada

An interactive web dashboard ranking all 35 Canadian Census Metropolitan Areas (CMAs) by a composite prosperity score. Users can compare cities side-by-side and customize the weights of each dimension to reflect their own priorities.

**Live demo:** Deploy to Cloudflare Pages (see below)

---

## Features

- Rankings of all 35 Canadian CMAs across 6 dimensions and 14 metrics
- Real-time weight customization with sliders (no page reload)
- Side-by-side city comparison with delta toggle
- Individual city profile pages with per-metric freshness badges
- Data sources page with methodology explanation
- Fully static export — deploys to Cloudflare Pages with zero server costs
- Shareable comparison URLs (`/compare?a=toronto&b=calgary`)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, static export) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 (raw data cache) |
| Deployment | Cloudflare Pages |
| Package manager | pnpm |

## Data Sources

| Metric | Source | Frequency |
|---|---|---|
| Unemployment rate | StatsCan 14-10-0459-01 | Monthly |
| Employment rate | StatsCan 14-10-0459-01 | Monthly |
| Median household income | StatsCan T1FF / 11-10-0162-01 | Annual |
| Average monthly rent (2BR) | CMHC Rental Market Survey | Annual |
| Rental vacancy rate | CMHC Rental Market Survey | Annual |
| New housing price index | StatsCan 18-10-0205-01 | Monthly |
| Consumer Price Index | StatsCan 18-10-0004-01 | Monthly |
| Crime Severity Index | StatsCan 35-10-0026-01 | Annual |
| Air Quality Health Index | ECCC AQHI | Daily (30-day avg) |
| Population + growth | StatsCan 17-10-0148-01 | Annual |
| Immigration share | Census 2021 | 5-year |
| Median age | Census 2021 | 5-year |

---

## Local Development

### Prerequisites

- Node.js 18+
- pnpm 9+
- Wrangler (installed as dev dependency)

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd canadian-prosperity-dashboard

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
pnpm build
```

This generates a static export in `out/`. The build pre-renders all 35 city profile pages at build time.

---

## Database Setup (Cloudflare D1)

The app is statically exported and does not require D1 for local development — all data is embedded in the build. D1 is used for the optional data pipeline (future phase).

### Create the D1 database

```bash
# Create the database
npx wrangler d1 create canadian-prosperity-db

# Copy the database_id from the output into wrangler.jsonc
```

### Apply migrations

```bash
# Local (for testing)
npx wrangler d1 execute canadian-prosperity-db --local --file=migrations/0001_initial.sql

# Remote (production)
npx wrangler d1 execute canadian-prosperity-db --remote --file=migrations/0001_initial.sql
```

### Seed data

```bash
# Generate the seed SQL file
pnpm seed

# Apply to local D1
npx wrangler d1 execute canadian-prosperity-db --local --file=migrations/0002_seed.sql

# Apply to remote D1
npx wrangler d1 execute canadian-prosperity-db --remote --file=migrations/0002_seed.sql
```

---

## Deployment to Cloudflare Pages

### Option 1: Deploy via Cloudflare dashboard (recommended)

1. Push your code to GitHub
2. In Cloudflare Pages, create a new project
3. Connect your GitHub repo
4. Set build settings:
   - **Framework preset:** Next.js (Static HTML Export)
   - **Build command:** `pnpm build`
   - **Build output directory:** `out`
5. Deploy

### Option 2: Deploy via Wrangler CLI

```bash
# Build
pnpm build

# Deploy to Cloudflare Pages
npx wrangler pages deploy out --project-name=canadian-prosperity-dashboard
```

### Environment Variables

Set these in the Cloudflare Pages dashboard (Settings > Environment Variables):

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Your deployed URL (e.g., `https://cityscorecanada.pages.dev`) |
| `NEXT_PUBLIC_DATA_REFRESH_DATE` | Date of last data refresh |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Rankings homepage
│   ├── city/[slug]/        # City profile pages (35 static pages)
│   ├── compare/            # City comparison tool
│   ├── data/               # Data sources reference
│   └── about/              # About + methodology
├── components/
│   ├── nav/                # TopNav
│   ├── rankings/           # RankingTable, WeightPanel, CityRow, etc.
│   ├── city/               # HeroSection, FreshnessBadge, etc.
│   ├── compare/            # ComparisonLayout, MetricCompareRow
│   └── ui/                 # ScoreBar, Badge, Accordion, etc.
├── lib/
│   ├── data.ts             # Static CMA data + metric values (embedded)
│   ├── scoring.ts          # Scoring algorithm (runs client + server)
│   └── computed-scores.ts  # Build-time precomputed scores
└── types/
    └── index.ts            # TypeScript types
migrations/
├── 0001_initial.sql        # D1 schema
└── 0002_seed.sql           # Generated seed data (pnpm seed)
scripts/
└── seed.ts                 # D1 seed script
```

---

## Scoring Algorithm

1. **Collect** all metric values across all 35 CMAs
2. **Clip outliers** at 3 standard deviations (prevents one extreme value from collapsing all scores)
3. **Normalize** each metric to 0–100 using min-max normalization
4. **Invert** "lower is better" metrics so higher scores always mean better outcomes
5. **Dimension score** = unweighted average of available metrics for that CMA
6. **Overall score** = weighted average of dimension scores (default weights: Economic 25%, Housing 25%, Quality of Life 20%, Safety 15%, Environment 10%, Demographics 5%)
7. **Completeness score** = fraction of metric weight with real (non-proxy) data

Custom weights are computed entirely client-side using `src/lib/scoring.ts`'s `recomputeWithWeights()` function — no server round-trip required.

---

## License

MIT. Data sourced from public Statistics Canada tables, CMHC, and ECCC — all freely available.
