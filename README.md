# Georgia Low-Cost Land Finder

A clean, fast, investor-grade dashboard to browse, filter, sort, and analyze official land-bank, surplus, tax-sale, and low-cost land opportunities in Georgia.

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Vite%20%7C%20Tailwind-22c55e)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

- **Table, Card, and Map views** of all listings
- **Advanced filtering** by City, County, Region Tier, Metro Area, Acquisition Type, Deal Type, Buyer Profile, Price Category, Source Freshness, Development Readiness, and quick toggles (Under $50K, Metro Atlanta, Low Risk, etc.)
- **Interactive Range Sliders** for Fit Score, Risk Score, Data Confidence, and Monetization Value
- **Detailed Property Drawer** — shows all 105+ CSV fields dynamically, including local amenities, structural notes, contact information, and customizable personal notes
- **Lead Card Export** — select specific rows via checkboxes and export them to CSV, Markdown, or clean printable HTML cards
- **Agency Contact Directory** — groups all listings by public agency, showing direct email, phone, portal form URLs, and custom "Next Call Scripts"
- **Data Quality Dashboard** — checks field completeness and lists entries with missing critical info
- **Favorites & Notes** — persist to browser localStorage; survive page refreshes
- **Monetization View** — commercial viability scores, marketing hooks, buyer profile matrix

---

## Quick Start (Local Dev)

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
git clone <your-repo-url>
cd freelandfinder
npm install
npm run dev
```

App opens at **http://localhost:5173** automatically.

---

## Deploying to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO)

### Manual deploy steps

**1. Install Vercel CLI** (optional but handy):
```bash
npm i -g vercel
```

**2. Build settings** — Vercel auto-detects Vite. If you need to set them manually:

| Setting | Value |
|---|---|
| Framework Preset | `Vite` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

**3. Environment variables**

Copy `.env.example` to understand what variables are needed. In the Vercel dashboard:

> Project → Settings → Environment Variables

Add the following for each environment (Production / Preview / Development):

| Variable | Required | Description |
|---|---|---|
| `VITE_SITE_URL` | ✅ | Your production URL, e.g. `https://georgialandfinder.com` |
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Browser-safe Supabase publishable key |
| `VITE_DASHBOARD_STARTER_CHECKOUT_URL` | When selling | Stripe/Gumroad checkout link for $39/mo tier |
| `VITE_DASHBOARD_PRO_CHECKOUT_URL` | When selling | Stripe/Gumroad checkout link for $79/mo tier |
| `VITE_DASHBOARD_INVESTOR_CHECKOUT_URL` | When selling | Stripe/Gumroad checkout link for $149/mo tier |
| `VITE_REPORT_CHECKOUT_URL` | When selling | Checkout link for $29 one-time report |
| `VITE_PLAUSIBLE_DOMAIN` | Optional | Your domain for Plausible analytics |
| `VITE_POSTHOG_KEY` | Optional | PostHog project API key |
| `VITE_ANALYTICS_PROVIDER` | Optional | `console` \| `plausible` \| `posthog` (default: `console`) |

> **Important:** This is a Vite app, not Next.js, so use `VITE_SUPABASE_*` variables instead of Supabase's `NEXT_PUBLIC_*` examples. All Vite environment variables are included in the client bundle. Never put service-role keys, database passwords, Stripe secrets, or other server secrets in `VITE_*` values.
>
> See [`PRODUCTION_SETUP.md`](./PRODUCTION_SETUP.md) for the Supabase schema, storage buckets, Vercel env list, and smoke-test checklist.

### Setting up Stripe Payment Links & Webhooks

To enable checkout for the subscription tiers and the one-time report, and to ensure users automatically receive their access roles, you need to configure Stripe Payment Links and a Webhook.

**1. Create Products and Metadata**
Go to **Stripe Dashboard → Products**. Create the following products and **crucially**, add a metadata key called `access_level` to each product so the webhook knows what to grant:
   - Dashboard Starter ($39/mo recurring) -> Metadata: `access_level: dashboard_starter`
   - Dashboard Pro ($79/mo recurring) -> Metadata: `access_level: dashboard_pro`
   - Dashboard Investor ($149/mo recurring) -> Metadata: `access_level: dashboard_investor`
   - Georgia Land Report ($29 one-time) -> Metadata: `access_level: report_buyer`

**2. Create Payment Links**
For each product, generate a Stripe Payment Link and paste the URL into your `.env` file under the corresponding `VITE_*_CHECKOUT_URL` variables.

**3. Configure Webhook**
Go to **Stripe Dashboard → Developers → Webhooks**. Add a new endpoint pointing to `https://your-production-url.com/api/stripe-webhook`.
Listen for the following events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

Copy the **Signing Secret** and place it in your `.env` as `STRIPE_WEBHOOK_SECRET`. Also add your `STRIPE_SECRET_KEY`.

## SEO Maintenance
The application includes a robust SEO architecture using `react-helmet-async`, `public/robots.txt`, and `public/sitemap.xml`.
- **Dynamic SEO Pages:** To add a new SEO landing page, add the slug and metadata to `src/data/seoPages.ts`. The `SeoLandingPage.tsx` component will automatically render it.
- **Sitemap Updates:** Because this is a static SPA without a CMS, you must manually append any new slugs or static routes to `public/sitemap.xml`.
- **Open Graph & Twitter Cards:** The `<SEO />` component (in `src/components/SEO.tsx`) handles Open Graph and Twitter Card tags. You can update the default `imageUrl` in that file.

## Production Build


**4. SPA routing**

The `vercel.json` file at the project root already handles this:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

This ensures that direct visits to `/dashboard`, `/pricing`, etc. work without 404s — React Router handles routing client-side after the initial HTML load.

**5. Deploy**

```bash
# Via CLI
vercel --prod

# Or push to your connected Git repo — Vercel auto-deploys on every push to main
git push origin main
```

---

## Production Setup: Dataset Storage

To ensure data security and prevent unauthorized downloads of the paid dataset, the full CSVs are **no longer served as public static assets**. 

Instead, data is stored securely in **Supabase Storage**.

### Public Files
The following files are allowed to remain in the `public/` directory and will be deployed as public static assets:
- `free_georgia_land_10_lead_sample.csv`
- `free_georgia_land_10_lead_sample.md`
- Marketing assets, `favicon.svg`, `robots.txt`, `sitemap.xml`

### Protected Files
The following files **MUST NOT** be placed in the `public/` directory. They must be uploaded to the `protected-datasets` Supabase bucket:
- `georgia_low_cost_land_opportunities_enriched.csv`
- `georgia_low_cost_land_opportunities.csv`
- `georgia_low_cost_land_report.csv`
- `georgia_low_cost_land_report.md`
- Any other full or paid dataset

### How to Upload the Protected Dataset
1. Log into your Supabase Dashboard.
2. Go to Storage and create a private bucket named `protected-datasets` (if not already created).
3. Apply Row Level Security (RLS) to restrict `protected-datasets` downloads to users whose `profiles.access_level` permits it.
4. Upload `georgia_low_cost_land_opportunities_enriched.csv` to this bucket.

### How to Test Paid vs Free Data Access
1. **Free User Test**: Log in with an account that has a free/basic access level. Navigate to the dashboard. You should only see 10 listings (the free sample). 
2. **Paid User Test**: Log in with an account upgraded to Starter, Pro, or Investor. Navigate to the dashboard. You should see the full dataset loaded from Supabase storage.
3. **Public Path Test**: Try visiting `http://localhost:5173/georgia_low_cost_land_opportunities_enriched.csv` directly in your browser. You should receive a 404 or a routing fallback, NOT the CSV file. Visiting `http://localhost:5173/free_georgia_land_10_lead_sample.csv` should still download the sample.

**Local Development Fallback:**
If you are running the app locally using `npm run dev`, and the Supabase download fails (e.g. if the bucket is not set up), the app will output a warning to the console and safely fall back to loading the free sample data (`free_georgia_land_10_lead_sample.csv`). The paid data is **never** loaded from a local fallback file, ensuring it can never be accidentally exposed in a production build.

---

## How Scoring Works

The dashboard calculates four investor-grade metrics for every property listing based on CSV data:

### 1. Fit Score (0–100)
Measures overall investment viability. Higher is better.
- **Rewards**: Official source URL (+10), low prices (up to +20 for under $10K), land bank or surplus type (+10), Atlanta core/metro location (+10), residential/infill zoning (+10), clear title (+10)
- **Penalties**: `Avoid_Flag = Yes` subtracts 40 points

### 2. Risk Score (0–100)
Indicates legal, financial, or site risks. Lower is better.
- **Increases for**: Tax deeds/sheriff sales (+30), defeasible title (+20), missing zoning (+15), flood zone AE/A (+25), missing parcel ID (+15), landlocked access (+30), stale source (+15)

### 3. Data Confidence (0–100)
Represents completeness and verifiability of public record data.
- **Rewards**: Parcel ID (+15), price (+15), zoning (+15), source URL (+15), property page (+10), Maps link (+10), GIS portal (+10)

### 4. Monetization Value (0–100)
Measures suitability for paid newsletter/investor report packaging.
- **Rewards**: Atlanta core/metro (+20), price under $15K (+25) or $30K (+15), high fit (+15), low risk (+10), high confidence (+10), current freshness (+10)

---

## Tech Stack

| Package | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool and dev server |
| Tailwind CSS | 3 | Utility-first styling |
| PapaParse | 5 | CSV parsing |
| React-Leaflet + Leaflet | 4 / 1.9 | Interactive map view |
| Recharts | 2 | Analytics charts |
| Lucide React | 0.358 | Icons |
| React Router DOM | 7 | Client-side routing |

---

## Project Structure

```
freelandfinder/
├── public/
│   ├── favicon.svg
│   ├── robots.txt                                          ← SEO crawl rules
│   ├── sitemap.xml
│   ├── free_georgia_land_10_lead_sample.csv               ← Free sample dataset
│   └── free_georgia_land_10_lead_sample.md
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Header.tsx          ← Navigation + stats summary
│   │   │   ├── FilterPanel.tsx     ← Search + all filters & ranges
│   │   │   ├── PropertyTable.tsx   ← Grouped property listing view
│   │   │   ├── PropertyCard.tsx    ← Card view
│   │   │   ├── MapView.tsx         ← Leaflet map view
│   │   │   ├── PropertyDrawer.tsx  ← Detail sidebar + notes
│   │   │   ├── Analytics.tsx       ← Charts and stats
│   │   │   ├── DataQuality.tsx     ← Completeness report
│   │   │   ├── FavoritesView.tsx   ← Saved properties
│   │   │   └── AgencyContacts.tsx  ← Contact directory
│   │   └── marketing/
│   │       ├── GeorgiaLandSearchHero.tsx
│   │       └── SponsorBanner.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PricingPage.tsx
│   │   ├── FreeSamplePage.tsx
│   │   ├── NotFoundPage.tsx        ← 404 page
│   │   └── ...
│   ├── App.tsx                     ← Router + route definitions
│   ├── types.ts                    ← TypeScript interfaces
│   ├── utils.ts                    ← Filter, sort, export helpers
│   ├── main.tsx                    ← Entry point
│   └── index.css                   ← Global styles + Tailwind
├── vercel.json                     ← SPA rewrite rules + cache headers
├── .env.example                    ← All required environment variables
├── index.html                      ← HTML entry point
├── package.json
├── vite.config.ts                  ← Build config + chunk splitting
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. The build produces split vendor chunks for better caching:
- `vendor-react` — React, React DOM, React Router
- `vendor-charts` — Recharts
- `vendor-map` — Leaflet, React-Leaflet
- `vendor-csv` — PapaParse

---

## License

MIT — use freely for personal or commercial research.
