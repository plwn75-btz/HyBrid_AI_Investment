# Agent Handoff — HYBRID INVESTMENT Web App (3_AI_Selection)
**Last Updated**: 2026-08-09 | **Session Start**: ~16:51 Bangkok Time (UTC+7)
**Previous Session**: 2026-08-08 ~08:47 Bangkok Time

---

## 1. Current App State

| Item | Status |
|------|--------|
| Flask server | `python app.py` — port **5101** |
| Login password | **`btz2026`** |
| App version | **BTZ Inc. Ver.6.2 2026 — Python Web Edition** |
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
| 10 | PIPELINE FLOWCHART | pipeline | OK (new — today) |

---

## 2. Work Completed Today (2026-08-08)

### A. Fixed AI Ranking Process Lock (already_running bug)
- Problem: _ai_progress running stayed True after long runs; next click triggered HTTP 409 + error alert.
- Fix 1: Changed HTTP 409 to HTTP 200 with status: already_running; frontend silently connects to pollAiProgress().
- Fix 2: Added 60-second auto-unlock guard in screening_api.py using _ai_start_time = time.time().
- Files: screening_api.py, static/ai_ranking.js

### B. Added 10th Tab — PIPELINE FLOWCHART
- Feature: New #tab-pipeline tab showing the complete 5-stage AI selection pipeline as a Mermaid v10 flowchart, plus 5 colored Stage Reference Cards.
- Tab button: <button class="tab-btn" data-tab="pipeline">PIPELINE FLOWCHART</button>
- CSS: Added #tab-pipeline to static/screening.css padding/width rule for flush alignment.
- Files: templates/index.html, static/screening.css

### C. Fixed Mermaid v10 "Syntax error in text" (Critical)
- Problem: <pre class="mermaid"> with HTML entities (&gt;, &le;, <br/>) caused "Syntax error in text — mermaid version 10.9.8" bomb in browser.
- Root cause: Mermaid v10 startOnLoad: true cannot parse HTML entities or tags inside node labels.
- Fix: Replaced entire <pre class="mermaid"> block with JS mermaid.render() call. Diagram definition stored in a JS template literal with plain ASCII text only.
- Files: templates/index.html

### D. Tab Bar Cleanup — Removed Emoji from 2 Tabs
- Removed laptop emoji from SCORING PRINCIPLES tab button.
- Removed chart emoji from PIPELINE FLOWCHART tab button.
- Kept robot emoji on AI TOP 10 RANKING (intentional visual anchor).
- Files: templates/index.html lines 61-62

### E. Mermaid Diagram Font Alignment
- Updated Mermaid fontSize: 11px and fontFamily: Inter, system-ui, sans-serif in both head init block and bottom render script.
- lineColor: #475569, clusterBkg: #0d1520 — matches dark navy theme of stage reference cards.

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
| templates/index.html | Added PIPELINE FLOWCHART tab; fixed Mermaid render; removed emoji from 2 tabs; updated Mermaid font |
| static/screening.css | Added #tab-pipeline to padding/width rule |
| screening_api.py | Added _ai_start_time 60-sec auto-unlock guard; HTTP 409 -> 200 for already_running |
| static/ai_ranking.js | Handled data.status === already_running gracefully, connects to pollAiProgress() |
| lessons_learned.md | Appended Lessons V, W, X, Y |
| handoff.md | This document — updated end-of-session |

---

## 5. Pending / Known Issues

| Item | Notes |
|------|-------|
| Mermaid diagram visual verification | Open http://127.0.0.1:5101/ and click PIPELINE FLOWCHART tab to confirm SVG renders cleanly (browser screenshot not yet taken this session). |
| Git commit | All changes since Aug 2 commit are uncommitted. Run `git add . && git commit` when ready to push to Render. |

---

## 6. Work Completed — 2026-08-09 Session Start

### A. Documentation Review & Update (All MD Files)
- **README.md**: Updated from v5.0 to v6.2. Corrected scoring weights (was Technical 40%, now 30%). Added 10-tab layout table. Added Pipeline Flowchart feature. Added style.css to file structure. Added Critical Technical Rules section. Updated deployment instructions with correct service name and password env var.
- **handoff.md** (root): Added session date stamp (2026-08-09).
- **handoff.md** (3_AI_Selection): Updated date header to reflect new session (2026-08-09).
### B. Native HTML Execution Pipeline Component (Replaced Mermaid - Lesson Z)
- **Native HTML Architecture**: Replaced Mermaid.js SVG rendering with a native HTML/CSS flexbox execution pipeline component.
- **Perfect Font Matching**: Box text (1) uses `.flowchart-step-text` (`0.82rem`, `font-weight: 400`, Inter) which 100% matches banner subtitle (2). Stage header text (3) uses `.flowchart-stage-title` (`0.8rem`, `font-weight: 600`, `letter-spacing: 0.5px`) which 100% matches tab buttons (4).
### C. Thailand Public Holiday Auto-Adjustment & Data Date Banner (Lesson AA)
- **Holiday Resolution Engine**: Added Thai Bank & SET Public Holiday calendars to `screening_engine.py`. Execution on holidays/weekends recursively steps back to the latest active trading day.
- **UI Data Date Display**: Returns `resolved_date` and `date_message` in API response; displays a prominent `📅 Market Data Date: YYYY-MM-DD` banner above the Top 10 cards in `static/ai_ranking.js`.
### D. Single-Row Scoring Weight Control Panel Layout & 3-Digit Input Support (Lesson AB)
- **1-Row 5-Column Grid**: Removed "Weight" text from all labels in `templates/index.html` (`Technical`, `Fundamental`, `Momentum`, `News Sentiment`, `Dividend Profit`).
- **CSS Grid Layout**: Updated `.ai-weight-grid` in `static/screening.css` to `display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;`, aligning all 5 weight input cards side-by-side in 1 single horizontal row.
- **3-Digit Input Sizing & Auto-Zero**: Expanded `.ai-weight-input-wrapper` width to `76px` and `.ai-weight-input` width to `46px` (`0.84rem` centered font) so 3-digit numbers (`100%`) fit clearly without clipping. Empty inputs automatically default to `0` (0%) on blur and in scoring calculation.
- **Files Modified**: `templates/index.html`, `static/screening.css`, `screening_engine.py`, `ai_ranking_engine.py`, `static/ai_ranking.js`, `test_holiday_date.py`, `lessons_learned.md`, `handoff.md`.
### E. File Wrap-Up & Superseded Directory Organization
- **Clean Project Tree**: Created `superseded/` directory and moved non-production test/scratch scripts (`test_ai_ranking.py`, `test_holiday_date.py`) and prompt notes (`instruction.txt`) into `superseded/`.
- **Documentation Updated**: Updated `README.md` version tag to `BTZ Inc. Ver. 6.2 (2026 AI Edition)` and synchronized project tree structure.
### F. Deployment Evaluation & WSGI Production Analysis (Lesson AC)
- **WSGI Warning Evaluation**: Evaluated the local console warning (`This is a development server...`). Confirmed it is harmless locally and will be completely eliminated on Render.com because Gunicorn (`Procfile`) serves as the production WSGI server.
- **Deployment Strategy Documented**: Created `deployment_evaluation_plan.md` covering memory safeguards, password security via environment variables, and step-by-step GitHub/Render deployment instructions.
- **Files Modified**: `lessons_learned.md`, `handoff.md`, `deployment_evaluation_plan.md`.

---

Session active. Run: python app.py in 3_AI_Selection/ — port 5101

