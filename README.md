# HYBRID INVESTMENT – BTZ Inc. Ver. 6.2 (2026 AI Edition)

An automated, multi-dimensional AI Stock Selection, Screening, and Intrinsic Valuation Web Application for SET-listed stocks.

---

## 🌟 Key Features (v6.2 AI Edition)

- **🤖 AI Top 10 Selection Engine**: 5-stage multi-factor stock ranking.
  - **Scoring Weights**: Technical (30%) / Fundamental Valuation (40%) / Momentum (15%) / News Sentiment (5%) / Dividend Profit (10%).
- **⚖️ Warren Buffett & Peter Lynch Fundamental Model**:
  1. *Pillar 1*: Intrinsic Margin of Safety (DCF / Justified P/BV / DDM vs Market Price).
  2. *Pillar 2*: Economic Moats & ROE Profitability (ROE >= 20%, Net Margin >= 12%).
  3. *Pillar 3*: Peter Lynch GARP & PEG Ratio (PEG <= 0.5 Bargain Hunter).
  4. *Pillar 4*: Balance Sheet Safety & Debt-to-Equity (D/E < 0.5).
  5. *Pillar 5*: Shareholder Yield & Free Cash Flow (Yield >= 4.0% + FCF).
- **🎯 Quick Selection Buttons**:
  - `🎯 Run AI Selection from SET50` (Blue-chip index filter)
  - `🏆 Run AI Selection from SET100` (Large & mid-cap index filter)
  - `⚡ Run AI Selection from SET` (Full SET candidate screening)
- **📈 Pipeline Flowchart Tab**: Interactive Mermaid v10 flowchart of End-to-End Execution Pipeline with 5 Stage Reference Cards.
- **📖 Interactive Scoring Principles Tab**: Live UI reference guide detailing exact scoring rules and formulas.
- **📰 30-Day News Aggregator**: Multi-source news scanner (*yfinance*, *Google News*, *SET Announcements*, *Thunhoon*, *RYT9*).
- **🛑 AI Process Lock Guard**: 60-second auto-unlock timeout prevents permanent lock when a background run stalls.
- **✓ Direct Shortlist from AI Cards**: Clicking `+ Shortlist` on any AI card directly posts to `/api/shortlist/add`.

---

## 📁 Repository Structure

```
├── app.py                      # Main Flask application & Gunicorn entry point
├── ai_ranking_engine.py        # Core 5-stage AI Stock Selection Engine
├── screening_api.py            # Flask API Blueprint: AI background worker, progress polling, cancel
├── screening_engine.py         # Technical screening engine (C1-C6 criteria, auto-relaxation)
├── data_fetcher.py             # Central data hub (yfinance, SET data, curl_cffi Chrome impersonation)
├── valuation_engine.py         # Intrinsic valuation algorithms (DCF, DDM, PER, PBV)
├── news_fetcher.py             # 5-source financial news aggregator
├── set50_list.py               # Official SET50 & SET100 constituent lists
├── handoff.md                  # Comprehensive handoff & architecture report (updated each session)
├── lessons_learned.md          # Key architectural learnings & bug fix log (Lessons A-AB)
├── README.md                   # This file
├── templates/
│   ├── index.html              # Modern dark glassmorphic dashboard UI (10-tab layout)
│   └── login.html              # Password authentication login page
├── static/
│   ├── ai_ranking.js           # AI ranking controller: cards grid, shortlist payload, progress polling
│   ├── app.js                  # Valuation controller & tab navigator
│   ├── screening.js            # Screening tab logic
│   ├── screening.css           # Custom glassmorphic styling (flush boundary alignment, 5-col grid)
│   └── style.css               # Global base styles
├── superseded/                 # Archived test scripts and outdated instructions
│   ├── test_ai_ranking.py      # AI ranking integration test script
│   ├── test_holiday_date.py    # Thai public holiday & weekend date resolution test script
│   └── instruction.txt         # Previous session prompt notes
├── Procfile                    # Render.com web process configuration
├── requirements.txt            # Python dependencies (includes curl_cffi)
├── runtime.txt                 # Python version specification (3.11.9)
└── .gitignore                  # Git exclusion rules
```

---

## 🖥️ 10-Tab Dashboard Layout

| # | Tab Label | data-tab | Description |
|---|-----------|----------|-------------|
| 1 | SCREENING | `screening` | Technical criteria screening (C1-C6) |
| 2 | VALUATION | `valuation` | Intrinsic valuation (DCF, DDM, PER, PBV) |
| 3 | NOTE | `note` | User notes |
| 4 | MOMENTUM | `momentum` | Volume & price momentum analysis |
| 5 | NEWS | `news` | 30-day multi-source news feed |
| 6 | TECHNICAL CHART | `technical` | Candlestick price chart |
| 7 | SHORT LIST | `shortlist` | Global shortlist with fair value comparison |
| 8 | 🤖 AI TOP 10 RANKING | `ai-ranking` | 5-stage AI selection engine |
| 9 | SCORING PRINCIPLES | `scoring` | Formula reference cards for all 5 pillars |
| 10 | PIPELINE FLOWCHART | `pipeline` | Mermaid v10 end-to-end architecture diagram |

---

## 🚀 Local Execution Instructions

1. Navigate to directory:
   ```powershell
   cd "Hybrid Investment/3_AI_Selection"
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run local server:
   ```bash
   python app.py
   ```
4. Open browser at `http://localhost:5101`.
5. Login password: **`btz2026`**

---

## ☁️ Deployment Guide for Render.com & GitHub

### Step 1: Push Code to GitHub
1. Stage and commit:
   ```bash
   git add .
   git commit -m "Deploy v6.2 AI Edition — PIPELINE FLOWCHART, process lock guard, 5-pillar scoring"
   ```
2. Push to GitHub:
   ```bash
   git push origin main
   ```

### Step 2: Create Web Service on Render.com
1. Log in to [Render.com Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name**: `hybrid-investment-cloud`
   - **Environment**: `Python 3`
   - **Region**: Singapore (or nearest region)
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --worker-class gthread --threads 4 --timeout 300 app:app`
5. *(Optional)* Add Environment Variables:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key for AI synthesis text)*
   - `APP_PASSWORD`: *(Override default login password)*
6. Click **Create Web Service**. Deploy complete!

> **Note**: `curl_cffi` Chrome session impersonation is pre-configured in `data_fetcher.py` to bypass yfinance IP blocking on Render cloud.

---

## ⚠️ Critical Technical Rules

### Mermaid v10 Rule
- Always use `mermaid.render()` JS API, never `<pre class="mermaid">` with HTML entities.
- All node labels must be plain ASCII text — no `&gt;`, `&lt;`, `<br/>` or HTML inside labels.

### Process Lock Rule
- `/api/ai_rank/start` returns HTTP 200 with `status: already_running` (not 409) when a run is active.
- Auto-unlock fires after 60 seconds via `_ai_start_time` guard in `screening_api.py`.

### Tab System Rule
- Tab switching driven by `data-tab="X"` matching `#tab-X` — fully automatic from `static/app.js`.
- Adding new tabs: add button to `.tab-bar` + add `#tab-X` content div + add `#tab-X` to padding rule in `screening.css`.

### Architecture Rule
- **DO NOT modify** `Hybrid Investment/Web_base` — it is the untouched reference master.
- All AI selection development is isolated in `Hybrid Investment/3_AI_Selection`.
