# Web Performance Benchmarker

A professional-grade web performance benchmarking platform inspired by Lighthouse and PageSpeed Insights. Analyze any website's performance, accessibility, SEO, best practices, and Core Web Vitals with detailed reports and historical tracking.

> Built with React, TypeScript, Vite, Tailwind CSS, and Recharts.

---

## Features

### Core Analysis

- **Performance Scoring** — 0-100 score across Performance, Accessibility, SEO, and Best Practices
- **Core Web Vitals** — LCP, INP, CLS, FCP, TTFB, Speed Index, Total Blocking Time
- **Navigation Timeline** — Visual breakdown: DNS, Connection, TLS, Request, Response, DOM, FCP, LCP, Load
- **Network Waterfall** — Full request waterfall with timing, sizes, and status codes

### Resource Analysis

- **Resource Breakdown** — Donut chart showing JS, CSS, Images, Fonts, HTML, XHR/Fetch sizes
- **Largest Resources** — Top heaviest assets with optimization recommendations
- **JavaScript Analysis** — Script counts, blocking vs async vs deferred, execution time, long tasks
- **Image Analysis** — Oversized images, missing dimensions, format issues, lazy-loading opportunities
- **Caching Analysis** — Resources with/without caching, recommendations
- **Compression Analysis** — Compressed vs uncompressed sizes, potential savings

### SEO & Accessibility

- **Accessibility Audits** — WCAG compliance checks with severity levels and fix suggestions
- **SEO Audits** — Meta tags, crawlability, canonical URLs, Open Graph, robots directives
- **Best Practices** — HTTPS, mixed content, console errors, deprecated APIs, CSP checks

### Third-Party & Security

- **Third-Party Analysis** — Domain-level breakdown of external scripts, analytics, fonts, CDNs
- **Security Checks** — HTTPS validation, mixed content detection, security headers

### Developer Experience

- **8-Tab Report** — Overview, Performance, Accessibility, SEO, Best Practices, Network, Resources, Diagnostics
- **Device Simulation** — Desktop (1920x1080) and Mobile (iPhone 14) profiles
- **Connection Profiles** — Fast, 4G, 3G, Slow connection simulation
- **Demo Mode** — Full functionality without a backend server using realistic simulated data
- **Historical Tracking** — Store and compare benchmark results over time
- **Comparison Mode** — Side-by-side comparison of two reports with improvement/regression highlighting
- **Trend Charts** — Performance, LCP, CLS, and page size over time using recharts
- **Export** — JSON export, print-friendly layout, shareable report links
- **Live Progress** — Real-time benchmark progress with stage indicators and elapsed time

### UI/UX

- **Premium Dark Theme** — Developer-tool inspired design with glass-morphism effects
- **Responsive** — Full mobile, tablet, and desktop support
- **Animated Scores** — SVG circular progress with count-up animations
- **Keyboard Accessible** — Full keyboard navigation and ARIA labels
- **Reduced Motion** — Respects `prefers-reduced-motion`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS 3, Custom CSS Variables |
| Charts | Recharts |
| State | React Query (TanStack Query) |
| Routing | React Router v6 |
| Backend (optional) | Node.js, Express, Playwright, Lighthouse |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or higher
- npm or yarn

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/web-performance-benchmarker.git
cd web-performance-benchmarker
npm install
```

### Development

```bash
# Frontend only (Demo Mode - no backend needed)
npm run dev

# Full stack (Frontend + Backend with Playwright)
npm run dev:full
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview
```

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Git Repository
3. Select your repository
4. Vercel auto-detects:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**

The app runs in **Demo Mode** on Vercel — all benchmarks generate realistic simulated data without a backend.

### Other Platforms

The app builds to static files in `dist/`. Deploy to any static hosting:

```bash
npm run build
# Upload dist/ to your hosting provider
```

---

## Project Structure

```
├── public/
│   └── favicon.svg              # App favicon
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── AuditList.tsx        # Accessibility/SEO/BP audit list
│   │   ├── BenchmarkProgress.tsx # Live benchmark progress
│   │   ├── ComparisonTable.tsx  # Report comparison table
│   │   ├── DiagnosticCard.tsx   # Diagnostic metric card
│   │   ├── ExportMenu.tsx       # Export/share dropdown
│   │   ├── Header.tsx           # Navigation header
│   │   ├── NavigationTimeline.tsx # Performance timeline
│   │   ├── OpportunityCard.tsx  # Optimization opportunity
│   │   ├── ResourceBreakdownChart.tsx # Donut chart
│   │   ├── ResourceTable.tsx    # Network resources table
│   │   ├── ScoreCircle.tsx      # Animated score indicator
│   │   ├── ScoreOverview.tsx    # 4-score overview panel
│   │   ├── TestHistoryCard.tsx  # History entry card
│   │   ├── ThirdPartyTable.tsx  # Third-party analysis
│   │   ├── WaterfallChart.tsx   # Network waterfall
│   │   └── WebVitalCard.tsx     # Core Web Vital card
│   ├── hooks/
│   │   ├── useBenchmark.ts      # Benchmark execution hook
│   │   ├── useHistory.ts        # History data hook
│   │   └── useLocalStorage.ts   # Local storage hook
│   ├── pages/
│   │   ├── Home.tsx             # Landing page with URL input
│   │   ├── Dashboard.tsx        # Activity dashboard
│   │   ├── Report.tsx           # Full report viewer (8 tabs)
│   │   ├── History.tsx          # Test history list
│   │   └── Compare.tsx          # Side-by-side comparison
│   ├── services/
│   │   └── api.ts               # Backend API client
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   ├── demoData.ts          # Demo data generator
│   │   ├── formatting.ts        # Formatting utilities
│   │   └── storage.ts           # localStorage manager
│   ├── App.tsx                  # Root component with routing
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles + Tailwind
├── server/                      # Backend (optional)
│   ├── benchmark/
│   │   ├── demoData.ts          # Server-side demo data
│   │   └── engine.ts            # Playwright benchmark engine
│   ├── controllers/
│   ├── routes/
│   ├── security/
│   │   ├── rateLimiter.ts       # Request rate limiting
│   │   └── urlValidator.ts      # SSRF-safe URL validation
│   ├── utils/
│   │   ├── historyStore.ts      # File-based history
│   │   └── jobStore.ts          # In-memory job queue
│   ├── workers/
│   │   └── benchmarkWorker.ts   # Async job processor
│   └── index.ts                 # Express server
├── index.html                   # HTML entry point
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind CSS config
├── postcss.config.js            # PostCSS config
├── tsconfig.json                # TypeScript config (frontend)
├── tsconfig.node.json           # TypeScript config (Vite)
├── vercel.json                  # Vercel deployment config
├── package.json                 # Dependencies & scripts
└── .gitignore                   # Git ignore rules
```

---

## Report Categories

### Overview
- Core Web Vitals (LCP, INP, CLS)
- Supporting metrics (FCP, TTFB, Speed Index, TBT)
- Navigation timeline
- Top issues and opportunities
- Resource breakdown summary

### Performance
- Detailed Core Web Vitals with ratings and thresholds
- Navigation timing breakdown
- Optimization opportunities with savings estimates
- JavaScript analysis (bundle sizes, blocking scripts, long tasks)
- Image analysis (oversized, missing formats, lazy-load opportunities)
- Caching and compression analysis

### Accessibility
- WCAG compliance checks (alt text, form labels, color contrast, ARIA)
- Severity levels: critical, serious, moderate, minor
- Detailed fix suggestions for each failed audit

### SEO
- Title, meta description, canonical URL checks
- robots.txt validation
- Heading structure analysis
- Crawlability indicators

### Best Practices
- HTTPS validation
- Console error detection
- Deprecated API usage
- CSP and security header checks

### Network
- Full resource table with filtering and sorting
- Third-party domain analysis
- Network waterfall visualization

### Resources
- Interactive donut chart breakdown
- Largest resources with optimization suggestions
- Per-category size analysis

### Diagnostics
- DOM size analysis
- Main-thread work measurement
- Network request count
- Third-party impact summary

---

## Backend (Optional)

The backend provides real browser benchmarking using Playwright and Lighthouse. The frontend works fully in demo mode without it.

### Setup

```bash
npm run dev:full
```

### Features
- Isolated browser execution
- SSRF-safe URL validation
- Rate limiting
- Job queue with progress streaming
- File-based history storage

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |
| `NODE_ENV` | `development` | Environment mode |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Acknowledgments

- [Lighthouse](https://github.com/GoogleChrome/lighthouse) — Performance auditing inspiration
- [PageSpeed Insights](https://pagespeed.web.dev/) — Core Web Vitals methodology
- [Web Vitals](https://web.dev/vitals/) — Performance metrics standards
- [Playwright](https://playwright.dev/) — Browser automation
- [Recharts](https://recharts.org/) — Chart components
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
"# web-performance-benchmarking-platform" 
