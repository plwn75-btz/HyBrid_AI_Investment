# Agent Handoff — HYBRID INVESTMENT Web App (3_AI_Selection)
**Last Updated**: 2026-08-14 | **Session Start**: ~05:54 Bangkok Time (UTC+7)
**Previous Session**: 2026-08-09 ~16:51 Bangkok Time

---

## 1. Current App State

| Item | Status |
|------|--------|
| Flask server | `python app.py` — port **5101** |
| Login password | **`btz2026`** |
| App version | **BTZ Inc. Ver.6.3 2026 — Python Web Edition (Dynamic Sales Growth)** |
| Total tabs | **10 tabs** (see list below) |
| Directive | **DO NOT modify `Web_base` directory** — focus on `3_AI_Selection` only |

### Tab Bar Order
| # | Button Label | data-tab | Status |
|---|-------------|----------|--------|
| 1 | SCREENING | screening | OK |
| 2 | VALUATION | valuation | OK |
| 3 | NOTE | note | OK |
| 4 | MOMENTUM | momentum | OK |
| 5 | NEWS | news | OK |
| 6 | TECHNICAL CHART | technical | OK |
| 7 | SHORT LIST | shortlist | OK |
| 8 | AI TOP 10 RANKING (robot emoji) | ai-ranking | OK |
| 9 | SCORING PRINCIPLES | scoring | OK |
| 10 | PIPELINE FLOWCHART | pipeline | OK |

---

## 2. Work Completed Today (2026-08-14)

### Dynamic YoY & QoQ Sales Growth Engine & VBA Master Benchmark (v6.3 Release)

1. **VBA Master Benchmark (`VBA_Code_02052026.docx`)**:
   - Compared formulas with Python engine across AOT, PTTEP, CPN, IVL.
   - Verified that all 5 Fair Value models (DCF, DIV, DDM, PER, PBV), Quarter Multiplier (Q1-Q4), Forecast DPS, Forecast Yield, MOS, DuPont, and 11/13 color ratings match 100%.
   - Fixed negative ratio coloring (`(None, "red")`) so negative NPM/ROE/ROTC/ROIC show red instead of falling through to gray.
   - Added `peg_fallback` to `calc_forecast_metrics()` to utilize published market PEG when intra-year growth is non-positive.

2. **Root Cause Diagnosis**:
   - Identified why Sale Growth was always defaulting to 5%: hardcoded `value="5"` default in UI `#saleGrowth` input, server fallback in `/api/valuate`, and hardcoded `0.05` (5%) for DCF 5-yr projection in `ai_ranking_engine.py`.

3. **Data Fetcher Upgrade (`data_fetcher.py`)**:
   - Implemented `_get_historical_sales_growth(ticker, info)` helper to calculate actual `yoy_sales_growth` (%) and `qoq_sales_growth` (%) from quarterly/annual income statements and yfinance data.
   - Added `yoy_sales_growth` and `qoq_sales_growth` to returned market data dictionary.

4. **Valuation Endpoint Upgrade (`app.py`)**:
   - Updated `/api/valuate` to dynamically default `sale_growth_pct` to stock's actual YoY sales growth when user simulation input is omitted.
   - Preserved full user simulation functionality when custom values are entered.
   - Returned `yoy_sales_growth` and `qoq_sales_growth` in API JSON output.

5. **DCF & AI Ranking Integration (`ai_ranking_engine.py`)**:
   - Updated Stage 2 DCF valuation in AI Top 10 Ranking to use each stock's actual YoY sales growth (clamped between `-10%` and `+25%` for 5-year projections to prevent one-off outliers from distorting long-term DCF).
   - Appended actual YoY and QoQ sales growth metrics to candidate dataset and final AI ranking card payloads.

6. **Dashboard UI Upgrades (`templates/index.html`, `static/app.js`, `static/ai_ranking.js`)**:
   - Added real-time `Actual YoY: XX.X% | QoQ: YY.Y%` badges under Trial & Simulation panel in `index.html`.
   - Updated `runValuation()` and `renderResult()` in `app.js` to render actual growth metrics while supporting user simulations.
   - Updated `addAiCardToShortlist` in `ai_ranking.js` to pass actual sales growth into shortlist payloads.

7. **Documentation & Verification**:
   - Appended Lessons AE & AF to `lessons_learned.md`.
   - Created `vba_vs_python_comparison.md` benchmark artifact.
   - Passed all automated integration tests across sample SET stocks (`DELTA`, `PTT`, `CPALL`, `AOT`, `PTTEP`, `CPN`, `IVL`).

---

## 3. Key Technical Rules (for Next Agent)

CRITICAL — Mermaid v10 Rule:
- Always use mermaid.render() JS API, never <pre class="mermaid"> with HTML entities.
- All node labels must be plain ASCII text. No &gt;, &lt;, &le;, <br/> or any HTML inside labels.
- Class assignment: Node:::className (no space before :::) — Mermaid v10 strict rule.

Process Lock Rule:
- /api/ai_rank/start returns HTTP 200 with status: already_running (not 409) when a run is active.
- Auto-unlock fires after 60 seconds via _ai_start_time guard in screening_api.py.

Tab System Rule:
- Tab switching driven by data-tab="X" matching #tab-X — fully automatic from static/app.js.
- Adding new tabs: add button to .tab-bar + add #tab-X content div + add #tab-X to padding rule in screening.css.

---

## 4. Files Modified Today

| File | Changes |
|------|---------|
| `valuation_engine.py` | Fixed negative ratio color threshold `(None, "red")`; added `peg_fallback` support in `calc_forecast_metrics()` |
| `app.py` | Passed `peg_fallback` to `calc_forecast_metrics()`; updated `/api/valuate` to dynamically default to actual YoY sales growth |
| `data_fetcher.py` | Added `_get_historical_sales_growth()` helper; added `yoy_sales_growth` & `qoq_sales_growth` to return dict |
| `ai_ranking_engine.py` | Updated Stage 2 DCF calculation to use clamped actual YoY sales growth; added sales growth to ranking card payload |
| `templates/index.html` | Added Actual YoY & QoQ badges to Trial & Simulation panel; updated `#saleGrowth` input placeholder |
| `static/app.js` | Updated `runValuation()` and `renderResult()` to render actual YoY/QoQ sales growth while retaining simulation support |
| `static/ai_ranking.js` | Updated shortlist payload generator to use actual YoY sales growth |
| `lessons_learned.md` | Appended Lessons AE & AF |
| `handoff.md` | This document — updated end-of-session |

---

## 5. Pending / Known Issues

| Item | Notes |
|------|-------|
| Git commit | Run `git add . && git commit -m "v6.3 Dynamic Sales Growth Engine & VBA Alignment"` when ready to push to Render cloud. |

---

Session active. Run: `python app.py` in `3_AI_Selection/` — port **5101**

