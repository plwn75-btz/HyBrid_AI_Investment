/**
 * ai_ranking.js — AI Stock Selection Frontend Controller (v6.0 - Precise Design Match)
 */

const AI_DEFAULT_WEIGHTS = {
  weight_tech: 30,
  weight_fund: 40,
  weight_mom:  15,
  weight_news:  5,
  weight_div:  10
};

let aiPollTimer = null;
let currentIndexFilter = 'set50';

document.addEventListener('DOMContentLoaded', () => {
  initWeightSliders();
  bindAiButtons();
});

function toggleWeightModal() {
  const panel = document.getElementById('aiWeightPanel');
  if (panel) {
    panel.style.display = (panel.style.display === 'none' || !panel.style.display) ? 'block' : 'none';
  }
}

function initWeightSliders() {
  const keys = ['tech', 'fund', 'mom', 'news', 'div'];
  keys.forEach(k => {
    const input = document.getElementById(`aiWeight_${k}`);
    const label  = document.getElementById(`aiWeightVal_${k}`);
    if (!input) return;
    input.value = AI_DEFAULT_WEIGHTS[`weight_${k}`];
    if (label) label.textContent = input.value + '%';
    ['input', 'change', 'keyup'].forEach(evt => {
      input.addEventListener(evt, () => {
        if (label) label.textContent = (input.value || 0) + '%';
        recalcWeightTotal();
        updateBannerChips();
      });
    });
    input.addEventListener('blur', () => {
      if (input.value === '' || isNaN(parseInt(input.value, 10))) {
        input.value = 0;
        if (label) label.textContent = '0%';
        recalcWeightTotal();
        updateBannerChips();
      }
    });
  });
  recalcWeightTotal();
  updateBannerChips();
}

function updateBannerChips() {
  ['tech', 'fund', 'mom', 'news', 'div'].forEach(k => {
    const input = document.getElementById(`aiWeight_${k}`);
    const chipVal = document.getElementById(`chip${k.charAt(0).toUpperCase() + k.slice(1)}Val`);
    if (input && chipVal) chipVal.textContent = (input && input.value !== '' ? input.value : 0) + '%';
  });
}

function recalcWeightTotal() {
  const keys = ['tech', 'fund', 'mom', 'news', 'div'];
  const total = keys.reduce((s, k) => {
    const el = document.getElementById(`aiWeight_${k}`);
    const val = el && el.value !== '' ? parseInt(el.value, 10) : 0;
    return s + (isNaN(val) ? 0 : val);
  }, 0);
  const totalEl = document.getElementById('aiWeightTotal');
  if (totalEl) {
    totalEl.textContent = total + '%';
    totalEl.style.color = total === 100 ? '#22c55e' : '#ef4444';
  }
}

function getWeights() {
  const keys = ['tech', 'fund', 'mom', 'news', 'div'];
  const raw = {};
  keys.forEach(k => {
    const el = document.getElementById(`aiWeight_${k}`);
    const val = el && el.value !== '' ? parseInt(el.value, 10) : 0;
    const num = isNaN(val) ? 0 : val;
    raw[`weight_${k}`] = num / 100.0;
  });
  return raw;
}

function bindAiButtons() {
  const btnSet50  = document.getElementById('btnRunSet50Ranking');
  const btnSet100 = document.getElementById('btnRunSet100Ranking');
  const btnAll    = document.getElementById('btnRunAiRanking');

  if (btnSet50)  btnSet50.addEventListener('click',  () => runAiSelection('set50',  btnSet50));
  if (btnSet100) btnSet100.addEventListener('click', () => runAiSelection('set100', btnSet100));
  if (btnAll)    btnAll.addEventListener('click',    () => runAiSelection('all',    btnAll));
}

function runAiSelection(indexFilter, clickedBtn) {
  currentIndexFilter = indexFilter;

  ['btnRunSet50Ranking','btnRunSet100Ranking','btnRunAiRanking'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = true;
  });
  if (clickedBtn) {
    clickedBtn._originalText = clickedBtn.innerHTML;
    clickedBtn.innerHTML = '⌛ AI Analyzing…';
  }

  const btnCancel = document.getElementById('btnCancelAiRanking');
  if (btnCancel) btnCancel.style.display = 'inline-block';

  const resultsEl = document.getElementById('aiRankingResults');
  if (resultsEl) resultsEl.innerHTML = '';

  const progressSection = document.getElementById('aiProgressSection');
  if (progressSection) progressSection.style.display = 'block';

  const weights = getWeights();

  fetch('/api/ai_rank/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ index_filter: indexFilter, ...weights })
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'started' || data.status === 'already_running') {
      pollAiProgress();
    } else {
      alert('Error: ' + (data.message || data.error || 'Could not start AI ranking.'));
      resetAiButtons();
    }
  })
  .catch(err => {
    console.error('AI Rank Start Error:', err);
    alert('Failed to launch AI Selection task.');
    resetAiButtons();
  });
}

function pollAiProgress() {
  if (aiPollTimer) clearInterval(aiPollTimer);
  aiPollTimer = setInterval(() => {
    fetch('/api/ai_rank/progress')
      .then(res => res.json())
      .then(data => {
        updateProgressUI(data);
        const isDone = Boolean(data.done || data.status === 'completed');
        if (isDone) {
          clearInterval(aiPollTimer);
          fetchAiResults();
        } else if (data.status === 'error') {
          clearInterval(aiPollTimer);
          alert('AI Analysis Error: ' + (data.message || 'Unknown error'));
          resetAiButtons();
        }
      })
      .catch(err => {
        console.error('Polling Error:', err);
      });
  }, 1000);
}

function updateProgressUI(data) {
  const stageEl = document.getElementById('aiProgressStage');
  const pctEl   = document.getElementById('aiProgressPct');
  const barEl   = document.getElementById('aiProgressBar');
  const msgEl   = document.getElementById('aiProgressText');

  const stage = data.stage || 1;
  const intraPct = data.pct !== undefined ? data.pct : (data.progress || 0);

  let overallPct = 0;
  if (data.done) {
    overallPct = 100;
  } else {
    overallPct = Math.min(99, Math.floor(((stage - 1) / 5) * 100 + (intraPct / 5)));
  }

  if (stageEl) stageEl.textContent = `Stage ${stage}/5`;
  if (pctEl)   pctEl.textContent   = `${overallPct}%`;
  if (barEl)   barEl.style.width   = `${overallPct}%`;
  if (msgEl)   msgEl.textContent   = data.message || 'Analyzing...';
}

function cancelAiSelection() {
  if (aiPollTimer) clearInterval(aiPollTimer);

  fetch('/api/ai_rank/cancel', { method: 'POST' })
    .then(res => res.json())
    .then(() => {
      resetAiButtons();
      const msgEl = document.getElementById('aiProgressText');
      if (msgEl) msgEl.textContent = '🛑 Analysis Cancelled by User.';
      const pctEl = document.getElementById('aiProgressPct');
      if (pctEl) pctEl.textContent = '0%';
      const barEl = document.getElementById('aiProgressBar');
      if (barEl) barEl.style.width = '0%';
    })
    .catch(err => {
      console.error('Cancel Error:', err);
      resetAiButtons();
    });
}

function fetchAiResults() {
  fetch('/api/ai_rank/results')
    .then(res => res.json())
    .then(data => {
      resetAiButtons();
      const progressSection = document.getElementById('aiProgressSection');
      if (progressSection) progressSection.style.display = 'none';

      const stocks = data.rankings || data.results || (Array.isArray(data) ? data : []);
      if (stocks && stocks.length > 0) {
        renderAiRankings(stocks, data);
      } else {
        const resultsEl = document.getElementById('aiRankingResults');
        if (resultsEl) resultsEl.innerHTML = '<div class="no-results" style="padding:20px; text-align:center; color:#94a3b8;">No stocks met the criteria.</div>';
      }
    })
    .catch(err => {
      console.error('Fetch Results Error:', err);
      alert('Failed to retrieve AI ranking results.');
      resetAiButtons();
    });
}

function resetAiButtons() {
  ['btnRunSet50Ranking','btnRunSet100Ranking','btnRunAiRanking'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.disabled = false;
      if (btn._originalText) btn.innerHTML = btn._originalText;
    }
  });

  const btnCancel = document.getElementById('btnCancelAiRanking');
  if (btnCancel) btnCancel.style.display = 'none';
}

function renderAiRankings(stocks, meta = {}) {
  const container = document.getElementById('aiRankingResults');
  if (!container) return;

  window.currentAiRankings = stocks || [];

  let html = '';
  if (meta && meta.auto_relaxed && meta.auto_relaxed_msg) {
    html += `
      <div class="ai-relaxed-banner">
        <span class="relaxed-icon">⚠️</span>
        <span class="relaxed-msg">${meta.auto_relaxed_msg}</span>
      </div>
    `;
  }

  const dataDateStr = meta.date || '';
  const dateMsgStr = meta.date_message || '';
  if (dataDateStr) {
    html += `
      <div class="ai-date-banner" style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 10px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem;">📅</span>
          <span style="font-size: 0.85rem; font-weight: 600; color: #38bdf8;">Market Data Date: <strong style="color: #f8fafc;">${dataDateStr}</strong></span>
        </div>
        ${dateMsgStr ? `<span style="font-size: 0.78rem; color: #94a3b8;">${dateMsgStr}</span>` : ''}
      </div>
    `;
  }

  html += `<h2 class="ai-results-header">🏆 TOP 10 RANKED STOCKS (${currentIndexFilter.toUpperCase()})</h2>`;
  html += `<div class="ai-cards-grid">`;

  stocks.forEach(stock => {
    let mosClass = 'mos-neutral';
    let mosText  = '0.0%';
    if (stock.mos_pct > 0) {
      mosClass = 'mos-positive';
      mosText  = `+${stock.mos_pct.toFixed(1)}%`;
    } else if (stock.mos_pct < 0) {
      mosClass = 'mos-negative';
      mosText  = `${stock.mos_pct.toFixed(1)}%`;
    }

    const rankClass = stock.rank <= 3 ? 'rank-top3' : 'rank-sub';
    const fvNote = stock.fair_value_method_note || '10-Yr CAPM DCF Model';

    // Format Dividend Yield display value
    let divYieldVal = 'N/A';
    if (stock.div_yield !== undefined && stock.div_yield !== null && stock.div_yield > 0) {
      let dy = stock.div_yield;
      if (dy > 0 && dy < 1.0) dy = dy * 100.0;
      divYieldVal = `${dy.toFixed(2)}%`;
    } else if (stock.div_yield === 0) {
      divYieldVal = '0.00%';
    }

    html += `
      <div class="ai-card" id="aiCard_${stock.symbol}">
        <!-- Top Row: Rank Circle, Symbol & Technical Criteria, Score & Grade -->
        <div class="ai-card-top">
          <div class="ai-rank-circle ${rankClass}">#${stock.rank}</div>
          <div class="ai-symbol-block">
            <div class="ai-symbol-name">${stock.symbol}</div>
            <div class="ai-criteria-tag">${stock.sector || 'N/A'} • ${stock.criteria_passed}/6 TECHNICAL CRITERIA PASSED</div>
          </div>
          <div class="ai-score-block">
            <div class="ai-score-num">${stock.composite_score.toFixed(1)}</div>
            <div class="ai-grade-badge">${stock.ai_grade || 'B'}</div>
          </div>
        </div>

        <!-- Metric Cards 5-Column Grid -->
        <div class="ai-metrics-grid">
          <div class="ai-metric-box">
            <div class="ai-metric-lbl">PRICE</div>
            <div class="ai-metric-val">฿${stock.price ? stock.price.toFixed(2) : '0.00'}</div>
          </div>
          <div class="ai-metric-box">
            <div class="ai-metric-lbl">FAIR VALUE</div>
            <div class="ai-metric-val">฿${stock.fair_value ? stock.fair_value.toFixed(2) : '0.00'}</div>
          </div>
          <div class="ai-metric-box">
            <div class="ai-metric-lbl">MOS %</div>
            <div class="ai-metric-val ${mosClass}">${mosText}</div>
          </div>
          <div class="ai-metric-box">
            <div class="ai-metric-lbl">P/E</div>
            <div class="ai-metric-val">${stock.pe ? stock.pe.toFixed(1) : '0.0'}</div>
          </div>
          <div class="ai-metric-box">
            <div class="ai-metric-lbl">DIV YIELD</div>
            <div class="ai-metric-val">${divYieldVal}</div>
          </div>
        </div>

        <!-- Fair Value Method Tag -->
        <div class="ai-fv-tag">
          💡 Fair Value Method: <span>${fvNote}</span>
        </div>

        <!-- Investment Thesis Box -->
        <div class="ai-box ai-thesis-box">
          <div class="ai-box-title">💡 AI Investment Thesis:</div>
          <div class="ai-box-body">${stock.investment_thesis || 'Solid overall setup with strong valuation margin of safety.'}</div>
        </div>

        <!-- Key Risk Factor Box -->
        <div class="ai-box ai-risk-box">
          <div class="ai-box-title">⚠️ Key Risk Factor:</div>
          <div class="ai-box-body">${stock.key_risks || 'General SET market volatility and sector cyclicality.'}</div>
        </div>

        <!-- Bottom Bar: Scores Breakdown + Shortlist Button -->
        <div class="ai-card-footer">
          <div class="ai-footer-scores">
            Tech: ${Math.round(stock.tech_score)} | Fund: ${Math.round(stock.fund_score)} | Mom: ${Math.round(stock.mom_score)} | News: ${Math.round(stock.news_score)} | Div: ${Math.round(stock.div_score || 50)}
          </div>
          <button class="btn-shortlist-pill" id="btnShortlist_${stock.symbol}" onclick="addAiStockToShortlist('${stock.symbol}')">
            + Shortlist
          </button>
        </div>

      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function addAiStockToShortlist(symbol) {
  const stocks = window.currentAiRankings || [];
  const stock = stocks.find(s => s.symbol === symbol);

  if (!stock) {
    if (typeof addToShortList === 'function') {
      addToShortList({ symbol: symbol });
    }
    return;
  }

  const payload = {
    symbol: stock.symbol,
    price: stock.price,
    fair_value: stock.fair_value,
    fv_dcf: (stock.fair_value_method_note || '').includes('DCF') ? stock.fair_value : null,
    fv_div: (stock.fair_value_method_note || '').includes('DDM') ? stock.fair_value : null,
    fv_per: stock.pe && stock.price ? Number((stock.price * 15 / stock.pe).toFixed(2)) : null,
    fv_pbv: stock.pbv && stock.price ? Number((stock.price * 1.5 / stock.pbv).toFixed(2)) : null,
    mos_dcf: stock.mos_pct,
    pe: stock.pe,
    pbv: stock.pbv,
    roe: stock.roe || 0,
    sale_growth: stock.yoy_sales_growth != null ? stock.yoy_sales_growth : 5.0,
    yoy_sales_growth: stock.yoy_sales_growth,
    qoq_sales_growth: stock.qoq_sales_growth,
    forecast_yield: stock.div_yield,
    timestamp: new Date().toLocaleDateString('en-GB')
  };

  fetch('/api/shortlist/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(data => {
    if (typeof renderShortList === 'function' && data.items) {
      renderShortList(data.items);
    }
    const btn = document.getElementById(`btnShortlist_${symbol}`);
    if (btn) {
      btn.innerHTML = '✓ Shortlisted';
      btn.style.background = '#10b981';
      btn.style.color = '#ffffff';
      btn.style.borderColor = '#10b981';
    }
    const statusBox = document.getElementById('status-box');
    if (statusBox) statusBox.textContent = `✅ ${symbol} added to Short List (${data.count} total)`;
  })
  .catch(err => {
    console.error('Shortlist addition error:', err);
    alert(`Failed to add ${symbol} to shortlist.`);
  });
}

function showAiError(msg) {
  const el = document.getElementById('aiRankingResults');
  if (el) el.innerHTML = `<div class="ai-error">❌ ${msg}</div>`;
}
