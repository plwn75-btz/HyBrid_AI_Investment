# Lessons Learned: AI Stock Selection & Ranking Engine (v6.0 Edition)

## 1. Project Overview
- **Goal**: Develop an end-to-end AI Stock Selection Engine that automates technical screening, fundamental valuation, 30-day news aggregation, momentum volume checks, and selects the Top 10 Ranked stocks.
- **Architectural Requirement**: Master files in `Hybrid Investment/Web_base` must be kept completely untouched as reference master. All AI selection development is isolated in `Hybrid Investment/3_AI_Selection`.

---

## 2. Key Technical Discoveries & Solutions

### A. Isolated Workspace Strategy
- **Discovery**: Modifying production web apps directly introduces risk to existing user features.
- **Solution**: Created `3_AI_Selection` folder as a clean copy of `Web_base`. This guarantees 100% master file preservation while allowing full freedom for new AI features.

### B. Dynamic Scoring Weights & Weight Normalization
- **Discovery**: Investors prioritize technical setups, fundamental valuation, momentum spikes, news sentiment, or dividend yield differently.
- **Solution**: Built an "AI Selection Guide" panel in the UI with interactive numeric input controls allowing users to dynamically adjust weights (default: Technical 30%, Fundamental 40%, Momentum 15%, News 5%, Dividend 10%). The engine normalizes weights dynamically so the composite score is always scaled 0-100.

### C. Asynchronous Multi-Stage Progress Tracking & Cancel Capability
- **Discovery**: Deep analysis of fundamentals, news, and momentum for 25 candidate stocks takes ~20 seconds. Users need the ability to cancel long-running background tasks immediately if launched by mistake.
- **Solution**: Implemented background thread processing in `screening_api.py` (`/api/ai_rank/start`, `/api/ai_rank/progress`, `/api/ai_rank/results`, `/api/ai_rank/cancel`) with 5 stage indicators and a `🛑 Cancel Analysis` button on the frontend.

### D. 3x3 Grid Card Layout Restoration (v6.0 UI)
- **Discovery**: Full-width 1-column stock cards take up too much vertical screen space and force excessive scrolling.
- **Solution**: Wrapped all `.ai-card` elements in a `.ai-cards-grid` container using `grid-template-columns: repeat(3, 1fr)` in `static/screening.css` and `static/ai_ranking.js`. This restores the compact 3x3 grid layout (`#1`, `#2`, `#3` in Row 1; `#4`, `#5`, `#6` in Row 2; `#7`, `#8`, `#9` in Row 3) matching original user design.

### E. Screening Engine Data Structure Alignment
- **Discovery**: `run_screening()` in `screening_engine.py` groups output dictionaries under the key `'results'` with sub-keys `'6'`, `'5'`, `'4'`, etc., rather than a flat `'data'` array. Also, individual stock dictionaries use lowercase keys (`'symbol'`, `'close'`, `'rsi'`, `'stoch'`).
- **Solution**: Refactored candidate extraction in `ai_ranking_engine.py` to iterate through criteria keys `'6'` down to `'0'` and safely extract `'symbol'`, `'close'`, `'pe'`, and `'pbv'` with fallback logic.

### F. Intrinsic Valuation Dispatch Helper
- **Discovery**: `calc_forecast_metrics()` requires specific EPS and historical multiplier arguments derived from `yfinance` historical dictionary, whereas fair values for standard vs financial stocks require distinct DCF, DDM, PER, and PBV model dispatches.
- **Solution**: Created `compute_stock_valuation(yf_raw)` in `ai_ranking_engine.py` to handle sector-aware valuation dispatch (CAPM WACC DCF for industrial stocks vs Gordon DDM / Justified P/BV for financial stocks) aligned with `app.py` logic.

### G. Intelligent Criteria Auto-Relaxation & UI Warning Banner (v6.0)
- **Discovery**: On market consolidation days, 0 SET50 blue-chip stocks pass 4 criteria simultaneously due to neutral RSI levels across large-caps (~50 RSI).
- **Solution**: Preserved the 6 technical criteria formulas untouched while implementing an auto-relaxation step-down to 3 criteria when 0 candidates pass 4 criteria. When triggered, the backend sets `auto_relaxed: true` and the frontend renders an explicit warning banner: `⚠️ Warning: 0 stocks met 4 criteria. Auto-Relaxation Applied (Displaying candidates matching 3 criteria).`

### H. Margin of Safety (MOS %) Parameter Order Verification
- **Discovery**: In `ai_ranking_engine.py`, `calc_margin_of_safety` was called with inverted positional arguments `calc_margin_of_safety(price, fair_val)`. Since `calc_margin_of_safety` definition expects `(fair_value, current_price)`, the engine computed `(Price - Fair Value) / Fair Value = -73.6%` (Discount %) instead of the true Margin of Safety `(Fair Value - Price) / Price = +279.1%`.
- **Solution**: Fixed argument order in `ai_ranking_engine.py` to `calc_margin_of_safety(fair_val, price)`. Now, stocks trading below Fair Value display a positive MOS % (undervaluation margin).

### J. Warren Buffett & Peter Lynch Fundamental Scoring Model
- **Requirement**: Fundamental Scoring Engine based on classic value investing (Buffett: Margin of Safety, ROE, Net Margin, Balance Sheet Safety) and GARP principles (Peter Lynch: PEG Ratio, Dividend Yield, Free Cash Flow).
- **Solution**: Implemented 5 fundamental pillars in `ai_ranking_engine.py`.

### K. Target-Specific Button Loading State & Render.com Preparedness
- **Solution**: Updated `runAiSelection(indexFilter)` in `static/ai_ranking.js` to change `⌛ AI Analyzing…` text strictly on the clicked button (`btnRunSet50Ranking`, `btnRunSet100Ranking`, or `btnRunAiRanking`). Configured Jinja choice loader fallbacks to avoid HTTP 500 errors on cloud deployments.

### L. Data Fetcher Key Alignment for Dividend Yield & Fundamental Ratios
- **Discovery**: `get_yf_data()` in `data_fetcher.py` returns dictionary keys `"dividend_yield"`, `"peg"`, `"de"`, and `"npm"` at top level without an `"info"` dict wrapper, whereas `compute_stock_valuation()` in `ai_ranking_engine.py` was looking for `"dividendYield"`, `"div_yield"`, etc., resulting in `0.00%` dividend yield across all stocks.
- **Solution**: Refactored `compute_stock_valuation()` key extraction to include fallback checks for `"dividend_yield"`, `"peg"`, `"de"`, and `"npm"`, ensuring accurate fundamental scores and dividend yield displays across all Top 10 stock cards.

### M. Dividend Yield Percentage Normalization
- **Discovery**: `yfinance` returns `info.get("dividendYield")` directly as a percentage (e.g. `7.33` for 7.33%) for SET stocks (`.BK`). Applying standard decimal conversion (`_pct()`) multiplied it by 100 (`733.0%`).
- **Solution**: Implemented smart normalization in `data_fetcher.py` and `ai_ranking_engine.py` so values $> 1.0$ (e.g. `7.33`) are recognized as percentage directly, while values $< 1.0$ (e.g. `0.0733`) are scaled by 100.

### N. Progress Polling Completion Guard (`data.done === true`)
- **Discovery**: In `static/ai_ranking.js`, `pollAiProgress()` checked `const isDone = data.done || data.pct === 100 || data.status === 'completed';`. When Stage 1 completed screening 100 candidates, the backend reported Stage 1 progress as `current=100, total=100` (`pct = 100`). The JS polling loop evaluated `data.pct === 100` as `true` and prematurely stopped polling while the backend thread was still running Stage 2 (`AWC 3/31`), causing `/api/ai_rank/results` to return empty data and render `"No stocks met the criteria."`
- **Solution**: Fixed `pollAiProgress()` to check strictly `data.done === true`, and updated `updateProgressUI()` to calculate a smooth overall pipeline percentage ($0\% \rightarrow 100\%$) across all 5 stages.

### P. Sector Tag Label Retrieval
- **Discovery**: Candidate stock dataset in `ai_ranking_engine.py` was reading `yf_raw.get('info', {}).get('sector', 'N/A')` which evaluated to `'N/A'`.
- **Solution**: Updated key access to `yf_raw.get('sector') or yf_raw.get('info', {}).get('sector', 'N/A')` and updated `static/ai_ranking.js` to render the actual sector name (e.g., `Financial Services`, `Healthcare`, `Utilities`) on every card.

### Q. Card Footer Scores Breakdown (`Tech | Fund | Mom | News | Div`)
- **Discovery**: `.ai-footer-scores` in `static/ai_ranking.js` was displaying `Tech: XX | Fund: XX | Mom: XX | News: XX` omitting the 5th pillar (Dividend Score).
- **Solution**: Updated card template in `static/ai_ranking.js` to render `Tech: XX | Fund: XX | Mom: XX | News: XX | Div: XX` so all 5 multi-factor scores are visible on every card.

### R. Direct AI Card Shortlist Payload Construction
- **Discovery**: Clicking `+ Shortlist` on an AI card called `addToShortList()` in `static/app.js`, which checked `currentResult` from the Valuation tab. If no valuation was run, it alerted `"Please run a valuation first"`. If `AOT` was run previously, clicking `+ Shortlist` on `TCAP` added `AOT` instead of `TCAP`.
- **Solution**: Refactored `addAiStockToShortlist(symbol)` in `static/ai_ranking.js` to store `window.currentAiRankings`, construct a complete shortlist object (`symbol`, `price`, `fair_value`, `mos_dcf`, `pe`, `pbv`, `roe`, `forecast_yield`) directly from the card object, and post it to `/api/shortlist/add`. Button turns green `✓ Shortlisted` upon addition.

### S. Comprehensive SET50 & SET100 Trial Verification
- **Discovery**: Full trial testing required validation across both blue-chip (`SET50`) and expanded (`SET100`) index filters.
- **Solution**: Executed trial suite verifying 31 SET100 candidates passing $\ge 4$ criteria and 75 candidates passing $\ge 3$ criteria. Both index filters successfully score and select 10 Top Ranked stocks with 100% metrics population.

### T. Left & Right Boundary Alignment for AI Ranking & Scoring Principles Tabs
- **Discovery**: `#tab-ai-ranking` had custom padding `padding: 16px 20px;` in `static/screening.css`, causing its panels and cards to be inset by 20px compared to the main `.app-header` and `.tab-bar` elements above them.
- **Solution**: Standardized CSS rules to `#tab-ai-ranking, #tab-scoring { padding: 14px 0 0 0; }`. Now all banner panels, card grids, weight controls, and scoring reference containers across both tabs align 100% flush with the left and right boundaries of the header navigation bar.

### U. Premature `.app-wrapper` Closure Markup Fix
- **Discovery**: An extra unmatched `</div>` tag existed at line 677 of `templates/index.html` after `#tab-shortlist`. This prematurely closed `.app-wrapper` (which enforces `max-width: 1280px; margin: 0 auto;`), causing `#tab-technical`, `#tab-ai-ranking`, and `#tab-scoring` to be rendered outside `.app-wrapper` directly under `<body>` and expand to full monitor viewport width (1600px+).
- **Solution**: Removed the redundant `</div>` tag in `templates/index.html`. All 9 tabs are now correctly nested inside `.app-wrapper`, guaranteeing 100% pixel-perfect left and right boundary alignment across all screens.

### V. AI Ranking Process Lock Auto-Unlock Guard
- **Discovery**: When a background AI analysis thread exceeded ~20 seconds (due to news fetching from 5 sources), `_ai_progress['running']` remained `True`. If the browser reloaded or the user clicked **Run AI Selection** again, the server returned `HTTP 409 ('AI Ranking already in progress')`, triggering an error alert dialog over the running progress bar.
- **Solution 1**: Replaced HTTP 409 with `HTTP 200` returning `status: 'already_running'`, allowing the frontend to seamlessly connect to the active pipeline via `pollAiProgress()` without showing an error popup.
- **Solution 2**: Added a **60-second auto-unlock timeout guard** (`_ai_start_time = time.time()`) in `screening_api.py`. If a run has been `running=True` for >60 seconds, it is automatically force-released on the next `/api/ai_rank/start` request to prevent permanent lockout.

### W. New Tab: 📊 PIPELINE FLOWCHART
- **Feature Added**: A new tab (`#tab-pipeline`) was added in `templates/index.html` after `💻 SCORING PRINCIPLES`. This tab displays the **End-to-End Execution Pipeline Architecture** as an interactive Mermaid v10 flowchart, along with 5 Stage Summary Reference Cards.
- **Tab Button**: Added `<button class="tab-btn" data-tab="pipeline">📊 PIPELINE FLOWCHART</button>` to the tab bar. CSS rule `#tab-pipeline` added to `static/screening.css` for flush boundary alignment.
- **Stage Reference Cards**: 5 color-coded summary cards (Stage 1-5) displayed below the diagram using `.scoring-pillar-card` class with per-stage accent colors (`#38bdf8`, `#4ade80`, `#c084fc`, `#fbbf24`, `#f472b6`).

### X. Mermaid v10 Syntax Compatibility - HTML Entities in Node Labels
- **Discovery**: Mermaid v10.9.8 does not support HTML entities (`&gt;`, `&le;`, `&ge;`, `<br/>`) inside quoted node label text. Using these inside `[ "label" ]` causes a **"Syntax error in text"** bomb error in the browser.
- **Root Cause**: The `<pre class="mermaid">` approach uses `startOnLoad: true`, which processes the raw HTML-escaped characters as literal text, causing parse failures.
- **Solution**: Switched to `mermaid.render('id', diagramDef)` JavaScript API approach via a `<script>` block at the end of the page. The diagram definition is stored in a JS template literal string with **plain English text labels only** (no HTML entities, no special characters). The rendered SVG is injected directly into the container div.
- **Key Rule**: For Mermaid v10 compatibility, always use plain ASCII text in node labels. Replace `>` with `gt`, `<=` with `le`, `>=` with `ge`, and avoid `<br/>` — use separate nodes instead if line breaks are needed.

### Y. Tab Bar Emoji & Diagram Font Consistency
- **Change**: Removed emoji icons (`💻`, `📊`) from the **SCORING PRINCIPLES** and **PIPELINE FLOWCHART** tab buttons in `templates/index.html` to match the clean text-only style of all other tabs (SCREENING, VALUATION, NOTE, etc.).
- **Note**: The `🤖` emoji on **AI TOP 10 RANKING** was intentionally kept as it is a distinct visual anchor for the AI feature.
### AA. Thailand Public Holiday Auto-Adjustment & AI Top 10 Data Date Display
- **Requirement**: Automatically handle Thailand official public holidays (Songkran, Labour Day, Coronation Day, Royal Birthdays, New Year, Makha Bucha, etc.) so execution on a holiday or weekend steps back to the latest active SET trading day. Display the resolved market data date on the AI Top 10 screen.
- **Solution**:
  1. *Holiday Calendar & Trading Day Check*: Built `THAI_HOLIDAYS_FIXED` and `THAI_HOLIDAYS_VARIABLE` calendars in `screening_engine.py` and implemented `is_trading_day(date_obj)`.
  2. *Recursive Date Resolution*: Updated `resolve_date(date_str)` to step back day-by-day until a valid trading day is found, generating clear adjustment reason messages (e.g. `2026-04-13 is a non-trading day (Songkran Festival). Adjusted to latest trading day 2026-04-10.`).
  3. *AI Top 10 Date Banner*: Updated `run_ai_stock_selection` (`ai_ranking_engine.py`) to include `"date": resolved_date` and `"date_message": date_message` in return payload, and updated `renderAiRankings` (`static/ai_ranking.js`) to display a prominent `📅 Market Data Date: YYYY-MM-DD` banner above the Top 10 cards.

### AB. Single-Row Scoring Weight Control Panel Layout & 3-Digit Input Sizing
- **Requirement**: Align all 5 scoring weight boxes (Technical, Fundamental, Momentum, News Sentiment, Dividend Profit) in 1 single horizontal row, remove the word "Weight" from all labels, and enlarge input boxes so 3-digit figures (`100`) as well as 1 and 2-digit figures (`30`, `40`, `15`, `5`, `10`) display clearly without truncation.
- **Solution**:
  1. *Label Shortening*: Updated `templates/index.html` weight input labels from `Technical Weight`, `Fundamental Weight`, `Momentum Weight`, `News Sentiment Weight`, `Dividend Profit Weight` to concise labels: `Technical`, `Fundamental`, `Momentum`, `News Sentiment`, `Dividend Profit`.
  2. *5-Column CSS Grid*: Updated `.ai-weight-grid` in `static/screening.css` to `display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;`, ensuring all 5 cards align side-by-side in 1 horizontal row.
  3. *3-Digit Input Box Sizing*: Expanded `.ai-weight-input-wrapper` width to `76px` and set `.ai-weight-input` to `width: 46px; font-size: 0.84rem; text-align: center;`, fully supporting 3-digit numbers (`100%`) with zero clipping or text overlap.
### AC. WSGI Server Warning vs. Production Deployment Architecture on Render.com
- **Observation**: When executing `python app.py` locally, Flask logs `WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.`
- **Technical Explanation**: Flask's `app.run()` launches Werkzeug—Flask's built-in development server designed for local single-developer debugging.
- **Production Architecture**: On Render.com cloud, deployment is driven by `Procfile`:
  `web: gunicorn --worker-class gthread --threads 4 --timeout 300 app:app`
  Gunicorn acts as the production WSGI server, importing `app:app` directly. Flask's `app.run()` block is completely bypassed, eliminating the warning message entirely in cloud production.
### AD. Negative Score Badge Styling (`.pts-neg`) on Scoring Principles Tab
- **Discovery**: In the **Scoring Principles** tab, positive score items (`+30 pts`, `+20 pts`) were rendered in a green pill badge (`.pts-badge`), while negative score items (`-10 pts`, `-5 pts`, `-15 pts`) used the class `.pts-neg` which was missing CSS rules in `static/screening.css`, resulting in unstyled plain text.
- **Solution**: Added `.pts-neg` CSS rule in `static/screening.css` with a soft red background (`rgba(239, 68, 68, 0.12)`), red border (`rgba(239, 68, 68, 0.25)`), and red font (`#f87171`), matching the exact pill box badge style of positive scores.

### AE. Dynamic YoY / QoQ Sales Growth Calculation & Integration
- **Problem**: Sale Growth was previously always defaulting to 5% across Valuation, DCF, and AI Top 10 Ranking cards because the input field `#saleGrowth` had a static `value="5"` default, `/api/valuate` fell back to `5.0%`, and `ai_ranking_engine.py` hardcoded `sale_growth_y1_5 = 0.05` for DCF.
- **Solution**:
  1. *Data Fetcher Helper (`data_fetcher.py`)*: Created `_get_historical_sales_growth(ticker, info)` helper to calculate actual `yoy_sales_growth` (%) and `qoq_sales_growth` (%) from quarterly/annual income statements and yfinance data.
  2. *Valuation Endpoint (`app.py`)*: Updated `/api/valuate` to dynamically default to stock's actual YoY sales growth when no user input is provided, while still supporting user simulation inputs. Returned `yoy_sales_growth` and `qoq_sales_growth` in API payload.
  3. *DCF & AI Ranking Integration (`ai_ranking_engine.py`)*: Updated Stage 2 DCF calculation in AI Ranking to use the stock's actual YoY sales growth (clamped between -10% and +25% for 5-year projections to prevent one-off quarter outliers from distorting long-term DCF). Included sales growth in card payloads.
  4. *UI Dashboard (`index.html`, `app.js`, `ai_ranking.js`)*: Added actual YoY/QoQ sales growth badges in Valuation tab under Trial & Simulation, pre-filled auto growth, and passed actual sales growth into shortlist payloads.

### AF. VBA Master Code Benchmark & Negative Value Color / PEG Fallback Alignment
- **Requirement**: Benchmark Python fundamental valuation formulas against master VBA code (`VBA_Code_02052026.docx`) across sample stocks (AOT, PTTEP, CPN, IVL).
- **Findings & Fixes**:
  1. *Color Rules for Negative Ratios (`valuation_engine.py`)*: Python `CRITERIA` thresholds previously used `(0, "red")` for NPM, ROE, ROTC, and ROIC which required $v \ge 0$, causing negative numbers (e.g. IVL NPM $-0.52\%$, ROE $-0.9\%$) to fall through to `"gray"`. Updated to `(None, "red")` catch-all matching VBA where negative ratios are styled red.
  2. *PEG Ratio Fallback (`valuation_engine.py`, `app.py`)*: Added `peg_fallback` to `calc_forecast_metrics()` and updated `app.py` highlight narrative to use the market PEG (from yfinance/SET) when calculated intra-year growth is $\le 0$.
  3. *Forecast Method Preserved*: Confirmed Python's full-year annualized YoY growth calculation is the industry-standard methodology for real-time forecasting.

---

## 3. Best Practices & Guidelines for Future Updates
1. **Candidate Pool Management**: Offer full candidate screening, SET50, and SET100 index filter modes for optimal user flexibility.
2. **Shortlist Interoperability**: Stock cards in the AI Top 10 tab expose direct `+ Shortlist` actions, integrating smoothly with the global shortlist storage system.
3. **Cloud Deployment**: Keep `Procfile`, `requirements.txt`, and `runtime.txt` synchronized in project root for continuous integration on Render.com.
4. **Mermaid Diagrams**: Always use Mermaid v10 `mermaid.render()` JS API, never `<pre class="mermaid">` with HTML entities. Use plain English labels only. Keep text concise, font size $\ge 14\text{px}$, and use distinct stage color classes for visual clarity.
5. **Tab Bar Style Consistency**: Tab buttons should use text-only labels (no emoji) unless the emoji is a deliberate visual anchor (e.g., `🤖` on AI tab). Font and color of diagram content must match the Inter/dark-navy theme used across all tab content areas.


