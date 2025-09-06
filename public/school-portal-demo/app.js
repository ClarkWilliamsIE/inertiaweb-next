<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Winnerland!</title>

  <!-- Chart.js and Papa Parse -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/papaparse@5.3.2/papaparse.min.js"></script>

  <style>
    :root {
      color-scheme: dark;
    }
    body {
      margin: 0;
      padding: 1rem;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: #121212;
      color: #fff;
    }

    /* top nav */
    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.5rem 0.25rem;
    }
    .topbar-left,
    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .brand {
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: 0.5px;
    }
    .link, .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      background: #1e1e1e;
      color: #fff;
      text-decoration: none;
      border: 1px solid #2a2a2a;
      cursor: pointer;
      user-select: none;
    }
    .link:hover, .btn:hover { background: #232323; }
    .btn.primary { background: #2b6cb0; border-color: #2b6cb0; }
    .btn.primary:hover { background: #2f76bf; }

    h1 {
      text-align: center;
      margin: 0.25rem 0 0.5rem;
    }

    /* member toggle */
    .center-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin: 0.25rem 0 0.5rem;
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 26px;
      vertical-align: middle;
    }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; inset: 0;
      cursor: pointer;
      background: #444;
      transition: .25s;
      border-radius: 26px;
    }
    .slider:before {
      content: "";
      position: absolute;
      height: 18px; width: 18px;
      left: 4px; bottom: 4px;
      background: #fff;
      border-radius: 999px;
      transition: .25s;
    }
    input:checked + .slider { background: #2196F3; }
    input:checked + .slider:before { transform: translateX(24px); }

    /* dashboard grid and cards */
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .chart-card {
      background: #1e1e1e;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      border: 3px solid transparent;
    }
    .chart-card h2 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      text-align: center;
      color: #fff;
    }
    .chart-container {
      position: relative;
      flex: 1;
      height: 200px;
    }
    .chart-container canvas {
      width: 100% !important;
      height: 100% !important;
    }
  </style>
</head>
<body>
  <!-- top bar with only the three items you wanted -->
  <div class="topbar" role="navigation" aria-label="Main">
    <div class="topbar-left">
      <span class="brand">Winnerland</span>
    </div>
    <div class="topbar-right">
      <a class="link" href="watchlist.html">Watchlist</a>
      <a class="link" href="login.html" id="signinLink">Sign In</a>
      <button class="btn primary" id="signoutBtn" type="button" style="display:none;">Sign Out</button>
    </div>
  </div>

  <h1>Winnerland!</h1>

  <div class="center-controls">
    <label class="switch" title="Toggle per member view">
      <input type="checkbox" id="memberToggle" />
      <span class="slider"></span>
    </label>
    <span>Member view</span>
  </div>

  <div class="dashboard" id="dashboard"></div>

  <script>
    // If you have Supabase on the page, this will sign out there too.
    async function trySupabaseSignOut() {
      try {
        if (window.supabase && window.supabase.auth) {
          await window.supabase.auth.signOut();
        }
      } catch (_) {}
    }

    // Simple session check for showing Sign In or Sign Out.
    // Adjust this for your auth, for example, set localStorage.setItem('wl_session','1') on login.
    function refreshAuthUI() {
      const signedIn = !!(localStorage.getItem('wl_session') || (window.supabase && window.supabase.auth && window.supabase.auth.getSession));
      const signIn = document.getElementById('signinLink');
      const signOut = document.getElementById('signoutBtn');
      if (signedIn) {
        signIn.style.display = 'none';
        signOut.style.display = 'inline-flex';
      } else {
        signIn.style.display = 'inline-flex';
        signOut.style.display = 'none';
      }
    }

    document.getElementById('signoutBtn').addEventListener('click', async () => {
      localStorage.removeItem('wl_session');
      await trySupabaseSignOut();
      refreshAuthUI();
      location.reload();
    });

    refreshAuthUI();

    // Dashboard logic, matching your original look and behavior
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQEJMIKmxhiNNEJ8h-sgxpsSAT8ndO5TK0EVCijAoAv4y-cmmU0YSHFUX8mC6gMBouC9k50FVFQLawN/pub?gid=1666283294&single=true&output=csv';

    let rawRows = [];
    let portfolioData = [];
    const chartInstances = new Map();

    function parseCurrency(x) {
      if (x == null) return 0;
      if (typeof x === 'number') return x;
      return parseFloat(String(x).replace(/[^\d.-]/g, '')) || 0;
    }

    function destroyChart(id) {
      const inst = chartInstances.get(id);
      if (inst) {
        inst.destroy();
        chartInstances.delete(id);
      }
    }
    function makeChart(canvas, cfg) {
      destroyChart(canvas.id);
      const c = new Chart(canvas, cfg);
      chartInstances.set(canvas.id, c);
      return c;
    }

    Papa.parse(csvUrl, {
      download: true,
      header: true,
      complete: ({ data }) => {
        rawRows = data.filter(r => parseFloat(r['QTY']) > 0 && r.Ticker);

        portfolioData = data.map(row => {
          const date = row['M'];
          const portfolioValue = parseFloat(row['N']) || 0;
          if (!portfolioValue) return null;
          return { date, portfolioValue };
        }).filter(Boolean);

        renderCharts(false);
        document.getElementById('memberToggle')
          .addEventListener('change', e => renderCharts(e.target.checked));
      },
      error: err => console.error('CSV load error:', err)
    });

    function renderCharts(memberView) {
      const f = memberView ? 14 : 1;
      const dashboard = document.getElementById('dashboard');
      dashboard.innerHTML = '';

      // compute totals
      let totalSpent = 0, totalValue = 0;
      rawRows.forEach(r => {
        const tcUsd   = parseCurrency(r['Total Cost']);
        const mvUsd   = parseCurrency(r['Market Value']);
        const mvNzd   = parseCurrency(r['NZD']);
        const costNzd = mvUsd ? tcUsd * (mvNzd / mvUsd) : 0;
        totalSpent += costNzd;
        totalValue += mvNzd;
      });
      const totalProfit = totalValue - totalSpent;

      // PIE card
      const pieCard = document.createElement('div');
      pieCard.className = 'chart-card';
      pieCard.innerHTML = `
        <h2>Allocation ${memberView ? '(per member)' : ''}</h2>
        <div class="chart-container"><canvas id="summaryPie"></canvas></div>
      `;
      dashboard.appendChild(pieCard);

      // BAR card
      const barCard = document.createElement('div');
      barCard.className = 'chart-card';
      barCard.innerHTML = `
        <h2>Portfolio Summary ${memberView ? '(per member)' : ''}</h2>
        <div class="chart-container"><canvas id="summaryBar"></canvas></div>
      `;
      dashboard.appendChild(barCard);

      // LINE card
      const lineCard = document.createElement('div');
      lineCard.className = 'chart-card';
      lineCard.innerHTML = `
        <h2>Portfolio Value Over Time</h2>
        <div class="chart-container"><canvas id="portfolioValueLine"></canvas></div>
      `;
      dashboard.appendChild(lineCard);

      // portfolio value line
      const lineLabels = portfolioData.map(r => r.date);
      const lineData = portfolioData.map(r => r.portfolioValue);
      const minValue = Math.min(...lineData);
      const maxValue = Math.max(...lineData);
      const margin = (maxValue - minValue) * 0.1;

      makeChart(document.getElementById('portfolioValueLine'), {
        type: 'line',
        data: {
          labels: lineLabels,
          datasets: [{
            label: 'Portfolio Value NZD',
            data: lineData,
            fill: false,
            borderColor: 'rgba(75,192,192,1)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: minValue - margin,
              max: maxValue + margin,
              ticks: {
                callback: v => '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })
              },
              grid: { color: '#444', borderColor: '#444' }
            },
            x: { grid: { color: '#444' } }
          },
          plugins: { legend: { labels: { color: '#fff' } } }
        }
      });

      // allocation pie
      const pieLabels = rawRows.map(r => r.Ticker);
      const pieData = rawRows.map(r => parseCurrency(r['NZD']) / f);
      makeChart(document.getElementById('summaryPie'), {
        type: 'doughnut',
        data: { labels: pieLabels, datasets: [{ data: pieData }] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#fff' } } },
          elements: { arc: { borderWidth: 0 } }
        }
      });

      // summary bar
      makeChart(document.getElementById('summaryBar'), {
        type: 'bar',
        data: {
          labels: ['Spent', 'Profit', 'Value'],
          datasets: [{
            label: 'NZD',
            data: [ totalSpent / f, totalProfit / f, totalValue / f ],
            backgroundColor: [
              'rgba(54,162,235,0.6)',
              'rgba(255,205,86,0.6)',
              'rgba(75,192,192,0.6)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: v => '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2 }) },
              grid: { color: '#444', borderColor: '#444' }
            },
            x: { grid: { color: '#444' } }
          },
          plugins: { legend: { display: false } }
        }
      });

      // one card per holding
      rawRows.forEach(r => {
        const tcUsd = parseCurrency(r['Total Cost']);
        const mvUsd = parseCurrency(r['Market Value']);
        const mvNzd = parseCurrency(r['NZD']);
        const costNzd = mvUsd ? tcUsd * (mvNzd / mvUsd) : 0;
        const profitNzd = mvNzd - costNzd;
        const pctChange = parseFloat(String(r['% Change']).replace(/[^\d.-]/g, '')) || 0;

        const card = document.createElement('div');
        card.className = 'chart-card';
        card.innerHTML = `
          <h2>${r.Ticker}</h2>
          <div class="chart-container">
            <canvas id="chart-${r.Ticker}"></canvas>
          </div>
        `;
        card.style.border = profitNzd >= 0 ? '3px solid #28a745' : '3px solid #dc3545';
        dashboard.appendChild(card);

        makeChart(document.getElementById(`chart-${r.Ticker}`), {
          data: {
            labels: ['Cost', 'Value', 'Profit', '% Change'],
            datasets: [
              {
                type: 'bar',
                label: 'NZD',
                data: [ costNzd / f, mvNzd / f, profitNzd / f, null ],
                backgroundColor: [
                  'rgba(54,162,235,0.6)',
                  'rgba(75,192,192,0.6)',
                  'rgba(255,205,86,0.6)'
                ]
              },
              {
                type: 'line',
                label: '% Change',
                data: [ null, null, null, pctChange ],
                yAxisID: 'PCT',
                borderColor: 'rgba(255,99,132,0.8)',
                backgroundColor: 'rgba(255,99,132,0.4)',
                tension: 0.3,
                pointRadius: 4,
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: { display: true, text: 'NZD' },
                ticks: { callback: v => '$' + Number(v).toLocaleString() },
                grid: { color: '#444' }
              },
              PCT: {
                type: 'linear',
                position: 'right',
                title: { display: true, text: '% Change' },
                grid: { drawOnChartArea: false },
                ticks: { callback: v => v + '%' }
              }
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    if (ctx.dataset.type === 'line') return '% Change: ' + ctx.parsed.y + '%';
                    return 'NZD $' + Number(ctx.parsed.y).toLocaleString();
                  }
                }
              },
              legend: { position: 'bottom' }
            }
          }
        });
      });
    }
  </script>
</body>
</html>

