<div align="center">
<img width="1200" height="400" alt="dokucreator banner" src="./assets/banner_dokucreator_17809874203791.png" />

# dokucreator

**ai-powered document creation toolkit — charts, slides, and reports from raw data**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Gemini](https://img.shields.io/badge/Gemini_AI-powered-4285F4?logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[live demo]([#](https://dokucreator.vercel.app) · [backend repo](https://github.com/swarajduttacv/dokucreator-backend) · [report bug](https://github.com/swarajduttacv/dokucreator/issues)

</div>

---

## what is this

dokucreator takes your raw data — csv, excel, text, pdf — and turns it into professional charts, presentation slides, and full reports using ai. no more wrestling with chart libraries or spending hours on formatting.

paste some numbers, pick a chart type (or let the system figure it out), and get publication-ready visualizations in seconds. then push those charts into ai-generated slides or entire multi-page reports, complete with embedded html visualizations.

```
┌──────────────────────────────────────────────────────────────┐
│                        dokucreator                           │
│                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│   │   chart      │  │   slide     │  │   report         │    │
│   │   generator  │  │   creator   │  │   creator        │    │
│   └──────┬───────┘  └──────┬──────┘  └────────┬─────────┘    │
│          │                 │                   │              │
│          └─────────┬───────┴───────────────────┘              │
│                    │                                          │
│            ┌───────▼────────┐                                 │
│            │  frontend api  │                                 │
│            │  service layer │                                 │
│            └───────┬────────┘                                 │
└────────────────────┼─────────────────────────────────────────┘
                     │ REST
         ┌───────────▼───────────┐
         │  dokucreator-backend  │
         │  express + mongodb    │
         │                       │
         │  ┌─────────────────┐  │
         │  │  chart engine   │  │  ← rule-based recommender
         │  │  + data analyzer│  │  ← statistical pre-analysis
         │  └────────┬────────┘  │
         │           │           │
         │  ┌────────▼────────┐  │
         │  │  gemini 3 flash │  │  ← primary ai model
         │  │  groq llama 3.3 │  │  ← fallback / reports
         │  └─────────────────┘  │
         │                       │
         │  ┌─────────────────┐  │
         │  │   mongodb atlas │  │  ← user data + saved content
         │  └─────────────────┘  │
         └───────────────────────┘
```

## features

### 📊 chart generator
- paste raw data or upload files (csv, xlsx, pdf, word)
- ai analyzes your data and recommends the best chart types
- rule-based chart recommender with statistical pre-analysis — the backend computes min, max, mean, median, stddev, growth rates, trend detection, and outlier detection *before* sending to the ai, so chart titles include real numbers
- supports bar, line, pie, area, and composed charts via recharts
- choose a specific chart type or let auto mode decide
- generate 1–4 chart variants from the same dataset
- customize chart colors with ai-generated palettes (describe a vibe like "ocean sunset" and get matching hex codes)
- download any chart as png
- send charts directly to the slide creator

### 🎯 slide creator
- describe what you want or feed it a chart — ai generates a full slide definition
- 7 slide templates: executive summary, data deep dive, comparison, title slide, key findings, dashboard, conclusion
- configurable bullet count, analysis depth (summary / detailed / executive), and tone (professional / academic / executive brief)
- 15 built-in color palettes including corporate blue, financial times, tech modern, colorblind safe, and more
- live slide preview with embedded recharts rendering
- download as `.pptx` using pptxgenjs — charts get rendered to high-res images and embedded
- save/load slides to your account

### 📝 report creator
- ai generates multi-page html reports with embedded visualizations
- pick report structure: title, abstract, table of contents, introduction, body, conclusion, acknowledgement, references
- target page count from 1–50 pages — ai expands or compresses to fit
- 3 report styles: business executive, academic, technical
- choose between gemini 3 flash or groq llama 3.3 70b for generation
- reports include css-styled metric boxes, callout sections, bar charts, data tables, and flow diagrams
- download as word (.doc) or pdf (via jspdf + html2canvas)
- save/load reports to your account

### 🔐 auth & storage
- jwt-based authentication with 7-day token expiry
- save up to 20 chart generations, 40 slides, and 20 reports per user
- session verification on page load — no re-login needed
- automatic logout on 401 responses

### 🎨 theming
- light/dark mode toggle persisted to localstorage
- custom warm brown/beige brand palette across both themes
- smooth transitions between themes

## tech stack

| layer | tech |
|---|---|
| framework | react 19 + vite 6 |
| language | typescript 5.8 |
| charts | recharts 3 |
| exports | html-to-image, html2canvas, pptxgenjs, jspdf |
| ai | google gemini 3 flash (primary), groq llama 3.3 70b (fallback) |
| styling | tailwind css (cdn) |
| backend | [dokucreator-backend](https://github.com/swarajduttacv/dokucreator-backend) — express, mongodb, jwt |

## project structure

```
dokucreator/
├── App.tsx                    # main app — tabs, state, auth flow
├── index.tsx                  # react 19 root
├── index.html                 # tailwind config, cdn scripts, theme
├── types.ts                   # shared types — charts, slides, reports, auth
├── components/
│   ├── Auth.tsx               # login / signup form
│   ├── Header.tsx             # navbar with user, theme toggle, logout
│   ├── DataInput.tsx          # data entry — text, file upload, chart options
│   ├── ChartCard.tsx          # chart renderer + download + customize + slide export
│   ├── SlideGenerator.tsx     # slide builder — templates, palettes, live preview
│   ├── ReportGenerator.tsx    # report builder — components, styles, ai model picker
│   ├── SavedContentModal.tsx  # modal for viewing/loading/deleting saved items
│   └── Icons.tsx              # svg icon components
├── services/
│   ├── geminiService.ts       # api client for /generate endpoints
│   ├── storageService.ts      # api client for /auth + /content endpoints
│   └── presentationService.ts # pptx file generation with pptxgenjs
├── utils/
│   └── colorPalettes.ts       # 15 color palettes + custom palette support
├── vite.config.ts             # dev server on :3000, proxy /api to :5000
└── package.json
```

## getting started

### prerequisites

- [node.js](https://nodejs.org) (v18+)
- a running instance of [dokucreator-backend](https://github.com/swarajduttacv/dokucreator-backend)

### setup

```bash
# clone
git clone https://github.com/swarajduttacv/dokucreator.git
cd dokucreator

# install dependencies
npm install

# start dev server (runs on port 3000, proxies /api to localhost:5000)
npm run dev
```

make sure the backend is running on port 5000 (or set `VITE_API_URL` in a `.env` file for a custom backend url).

### build for production

```bash
npm run build
npm run preview
```

### environment variables

| variable | description | default |
|---|---|---|
| `VITE_API_URL` | backend api base url (only needed if not using vite proxy) | `/api` |

## how it works

1. **you provide data** — paste text, csv, or upload xlsx/pdf/word files
2. **backend pre-analyzes** — a rule-based engine parses your data, detects column types (time-series, categorical, numerical), computes statistics, and recommends chart types with confidence scores
3. **ai generates charts** — the pre-computed analysis gets injected into the prompt so gemini uses *real numbers* in titles and annotations instead of hallucinating
4. **you refine** — customize colors with ai-generated palettes, pick chart types, adjust variants
5. **create deliverables** — push charts to slides, generate reports, download everything as png/pptx/pdf/word

## license

[MIT](LICENSE) © 2025-2026 Swaraj Dutta

