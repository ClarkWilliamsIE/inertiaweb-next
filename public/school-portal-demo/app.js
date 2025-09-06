<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Winnerland Members Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <!-- Chart.js and Papa Parse -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js"></script>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0, font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif, background: #0f1115, color: #fff; }
    .wrap { max-width: 1200px, margin: 24px auto, padding: 0 16px; }
    h1 { margin: 0 0 12px 0, font-size: 22px, font-weight: 700; }
    #controls { display: flex, flex-wrap: wrap, gap: 12px, align-items: center, margin: 0 0 16px 0; }
    #controls input[type="text"], #controls input[type="number"] {
      padding: 8px 10px, background: #1a1d24, color: #fff, border: 1px solid #2a2f3a, border-radius: 8px, outline: none;
    }
    #controls label { display: inline-flex, align-items: center, gap: 8px, user-select: none; }
    .grid { display: grid, grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)), gap: 16px; }
    .card { background: #161a22, border: 1px solid #262b36, border-radius: 14px, padding: 12px 12px 8px 12px, min-height: 220px; }
    .card h2 { margin: 0 0 8px 0, font-size: 16px; }
    .chart-container { position: relative, height: 240px; }
    .ticker-card { border: 3px solid transparent; }
    .muted { color: #9aa3b2, font-size: 13px; }
    .error { background: #2a1313, color: #ffbdbd, border: 1px solid #542222, padding: 10px, border-radius: 8px, margin-bottom: 12px; }
    a { color: #8adfff, text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Winnerland Members Dashboard</h1>

    <div id="err" class="error" style="display:none"></div>

    <div id="controls">
      <input id="filterTicker" type="text" placeholder="Filter by ticker" />
      <input id="minNZD" type="number" min="0" step="0.01" placeholder="Min NZD" />
      <label><input id="divideBy12Toggle" type="checkbox" /> Divide by 12 (members)</label>
      <span class="muted">Percent line is always shown, PNG export removed</span>
    </div>

    <div id="dashboard" class="grid"></div>
  </div>

  <script>
  (function () {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQEJMIKmxhiNNEJ8h-sgxpsSAT8ndO5TK0EVCijAoAv4y-cmmU0YSHFUX8mC6gMBouC9k50FVFQLawN/pub?gid=1666283294&single=true&output=csv';
    const state = { rawRows: [], portfolioSeries: [] };

    // helpers
    const $ = sel => document.querySelector(sel);
    function showError(msg) {
      const box = $('#err');
      box.textContent = msg;
      box.style.display = 'block';
    }
    function clearError() { const box = $('#err'); box.style.display = 'none'; box.textContent = ''; }

    function parseCurrency(x) {
      if (x == null) return 0;
      if (typeof x === 'number') return x;
      return parseFloat(String(x).replace(/[^\d.-]/g, '')) || 0;
    }

    function fetchCsv() {
      return new Promise((resolve, reject) => {
        Papa.parse(csvUrl, {
          download: true,
          header: true,
          complete: ({ data }) => {
            // table rows, one per holding, require QTY and Ticker
            state.rawRows = data.filter(r => parseFloat(r['QTY']) > 0 && r.Ticker);

            // time series for the big line chart (columns M date, N total NZD)
            state.portfolioSeries = data.map(row => {
              const date = row['M'];
              const portfolioValue = parseFloat(row['N']) || 0;
              if (!date || !portfolioValue) return null;
              return { date, portfolioValue };
            }).filter(Boolean);

            resolve();
          },
          error: reject
        });
      });
    }

    function computeTotals(rows) {
      let totalSpent = 0, totalValue = 0;
      rows.forEach(r => {
        const tcUsd = parseCurrency(r['Total Cost']);
        const mvUsd = parseCurrency(r['Market Value']);
        const mvNzd = parseCurrency(r['NZD']);
        const costNzd = mvUsd ? tcUsd * (mvNzd / mvUsd) : 0;
        totalSpent += costNzd;
        totalValue += mvNzd;
      });
      return { totalSpent, totalValue, profit: totalValue - totalSpent };
    }

    function destroyCharts() {
      document.querySelectorAll('canvas').forEach(c => {
        if (c._chartInstance) { c._chartInstance.destroy(); c._chartInstance = null; }
      });
    }

    function makeChart(canvas, config) {
      const chart = new Chart(canvas, config);
      canvas._chartInstance = chart;
      return chart;
    }

    function fmtMoney(n, withCents = true) {
      return '$' + Number(n).toLocaleString(undefined, { minimumFractionDigits: withCents ? 2 : 0, maximumFractionDigits: 2 });
    }

    function render() {
      clearError();
      const dashboard = $('#dashboard');
      dashboard.innerHTML = '';

      const filterTicker = ($('#filterTicker').value || '').trim().toUpperCase();
      const minNZD = Math.max(0, parseFloat($('#minNZD').value || '0'));
      const divisor = $('#divideBy12Toggle').checked ? 12 : 1;

      const viewRows = state.rawRows
        .filter(r => !filterTicker || String(r.Ticker).toUpperCase().includes(filterTicker))
        .filter(r => parseCurrency(r['NZD']) >= minNZD);

      // summary cards
      const pieCard = document.createElement('div');
      pieCard.className = 'card';
      pieCard.innerHTML = '<h2>Allocation</h2><div class="chart-container"><canvas id="summaryPie"></canvas></div>';
      dashboard.appendChild(pieCard);

      const barCard = document.createElement('div');
      barCard.className = 'card';
      barCard.innerHTML = '<h2>Portfolio Summary</h2><div class="chart-container"><canvas id="summaryBar"></canvas></div>';
      dashboard.appendChild(barCard);

      const lineCard = document.createElement('div');
      lineCard.className = 'card';
      lineCard.innerHTML = '<h2>Portfolio Value Over Time</h2><div class="chart-container"><canvas id="portfolioValueLine"></canvas></div>';
      dashboard.appendChild(lineCard);

      // line series
      const lineLabels = state.portfolioSeries.map(r => r.date);
      const lineDataRaw = state.portfolioSeries.map(r => r.portfolioValue);
      const lineData = lineDataRaw.map(v => v / divisor);

      if (lineData.length > 0) {
        const minValue = Math.min(...lineData);
        const maxValue = Math.max(...lineData);
        const margin = Math.max(1, (maxValue - minValue) * 0.1);

        makeChart(document.getElementById('portfolioValueLine'), {
          type: 'line',
          data: {
            labels: lineLabels,
            datasets: [{ label: 'Portfolio Value NZD', data: lineData, fill: false, tension: 0.1 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
              y: {
                min: minValue - margin, max: maxValue + margin,
                ticks: { callback: v => fmtMoney(v) }, grid: { color: '#444', borderColor: '#444' }
              },
              x: { grid: { color: '#444' } }
            },
            plugins: { legend: { labels: { color: '#fff' } } }
          }
        });
      } else {
        document.getElementById('portfolioValueLine').replaceWith((() => {
          const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No time series data available';
          return p;
        })());
      }

      // allocation pie
      const pieLabels = viewRows.map(r => r.Ticker);
      const pieData = viewRows.map(r => parseCurrency(r['NZD']) / divisor);
      if (pieData.length > 0) {
        makeChart(document.getElementById('summaryPie'), {
          type: 'doughnut',
          data: { labels: pieLabels, datasets: [{ data: pieData }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#fff' } } },
            elements: { arc: { borderWidth: 0 } }
          }
        });
      } else {
        document.getElementById('summaryPie').replaceWith((() => {
          const p = document.createElement('p'); p.className = 'muted'; p.textContent = 'No holdings match your filters';
          return p;
        })());
      }

      // summary bar
      const { totalSpent, totalValue, profit } = computeTotals(viewRows);
      makeChart(document.getElementById('summaryBar'), {
        type: 'bar',
        data: {
          labels: ['Spent', 'Profit', 'Value'],
          datasets: [{
            label: 'NZD',
            data: [ totalSpent / divisor, profit / divisor, totalValue / divisor ],
            backgroundColor: ['rgba(54,162,235,0.6)', 'rgba(255,205,86,0.6)', 'rgba(75,192,192,0.6)']
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { callback: v => fmtMoney(v) }, grid: { color: '#444', borderColor: '#444' } },
            x: { grid: { color: '#444' } }
          },
          plugins: { legend: { display: false } }
        }
      });

      // per ticker cards, percent line always on
      viewRows.forEach(r => {
        const tcUsd = parseCurrency(r['Total Cost']);
        const mvUsd = parseCurrency(r['Market Value']);
        const mvNzd = parseCurrency(r['NZD']);
        const pct = parseFloat(String(r['% Change']).replace(/[^\d.-]/g, '')) || 0;

        const costNzd = mvUsd ? tcUsd * (mvNzd / mvUsd) : 0;
        const profitNzd = mvNzd - costNzd;

        const card = document.createElement('div');
        card.className = 'card ticker-card';
        card.style.borderColor = profitNzd >= 0 ? '#28a745' : '#dc3545';
        card.innerHTML = '<h2>' + r.Ticker + '</h2><div class="chart-container"><canvas id="chart-' + r.Ticker + '"></canvas></div>';
        dashboard.appendChild(card);

        const labels = ['Cost', 'Value', 'Profit', '% Change'];
        const barData = [ costNzd / divisor, mvNzd / divisor, profitNzd / divisor, null ];

        const datasets = [
          { type: 'bar', label: 'NZD', data: barData, backgroundColor: ['rgba(54,162,235,0.6)', 'rgba(75,192,192,0.6)', 'rgba(255,205,86,0.6)'] },
          { type: 'line', label: '% Change', data: [ null, null, null, pct ], yAxisID: 'PCT', tension: 0.3, pointRadius: 4, fill: false }
        ];

        makeChart(document.getElementById('chart-' + r.Ticker), {
          data: { labels, datasets },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true, title: { display: true, text: 'NZD' },
                ticks: { callback: v => fmtMoney(v, false) }, grid: { color: '#444' }
              },
              PCT: {
                type: 'linear', position: 'right', title: { display: true, text: '% Change' },
                grid: { drawOnChartArea: false }, ticks: { callback: v => v + '%' }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: ctx => ctx.dataset.type === 'line'
                    ? ('% Change: ' + ctx.parsed.y + '%')
                    : ('NZD ' + fmtMoney(ctx.parsed.y))
                }
              },
              legend: { position: 'bottom' }
            }
          }
        });
      });
    }

    async function init() {
      try {
        await fetchCsv();
        render();
        // hook controls
        $('#filterTicker').addEventListener('input', () => { destroyCharts(), render(); });
        $('#minNZD').addEventListener('input', () => { destroyCharts(), render(); });
        $('#divideBy12Toggle').addEventListener('change', () => { destroyCharts(), render(); });
      } catch (e) {
        showError('Could not load data, please check the CSV URL, or try again later');
        console.error(e);
      }
    }

    init();
  })();
  </script>
</body>
</html>
