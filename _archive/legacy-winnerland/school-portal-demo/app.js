// Winnerland members only dashboard logic
// Uses your Google Sheets CSV and Chart.js, with extra controls.
// Put this file next to members.html and login.html.

(function () {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQEJMIKmxhiNNEJ8h-sgxpsSAT8ndO5TK0EVCijAoAv4y-cmmU0YSHFUX8mC6gMBouC9k50FVFQLawN/pub?gid=1666283294&single=true&output=csv';
  const state = { rawRows: [], portfolioSeries: [] };

  function parseCurrency(x) {
    if (x == null) return 0;
    if (typeof x === "number") return x;
    return parseFloat(String(x).replace(/[^\d.-]/g, "")) || 0;
  }

  function fetchCsv() {
    return new Promise((resolve, reject) => {
      Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: ({ data }) => {
          state.rawRows = data.filter(r => parseFloat(r["QTY"]) > 0 && r.Ticker);

          state.portfolioSeries = data.map(row => {
            const date = row["M"];
            const portfolioValue = parseFloat(row["N"]) || 0;
            if (!portfolioValue) return null;
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
      const tcUsd = parseCurrency(r["Total Cost"]);
      const mvUsd = parseCurrency(r["Market Value"]);
      const mvNzd = parseCurrency(r["NZD"]);
      const costNzd = mvUsd ? tcUsd * (mvNzd / mvUsd) : 0;
      totalSpent += costNzd;
      totalValue += mvNzd;
    });
    return { totalSpent, totalValue, profit: totalValue - totalSpent };
  }

  function destroyCharts() {
    for (const c of document.querySelectorAll("canvas")) {
      if (c._chartInstance) {
        c._chartInstance.destroy();
        c._chartInstance = null;
      }
    }
  }

  function makeChart(ctx, config) {
    const chart = new Chart(ctx, config);
    ctx._chartInstance = chart;
    return chart;
  }

  function exportPNGs() {
    const canvases = Array.from(document.querySelectorAll("canvas"));
    canvases.forEach((c, idx) => {
      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = "winnerland_chart_" + String(idx + 1).padStart(2, "0") + ".png";
      a.click();
    });
  }

  function render() {
    const dashboard = document.getElementById("dashboard");
    dashboard.innerHTML = "";

    const memberCount = Math.max(1, parseInt(document.getElementById("memberCount").value || "1", 10));
    const filterTicker = (document.getElementById("filterTicker").value || "").trim().toUpperCase();
    const minNZD = Math.max(0, parseFloat(document.getElementById("minNZD").value || "0"));
    const pctMode = document.getElementById("pctMode").value;

    const viewRows = state.rawRows
      .filter(r => !filterTicker || String(r.Ticker).toUpperCase().includes(filterTicker))
      .filter(r => parseCurrency(r["NZD"]) >= minNZD);

    const { totalSpent, totalValue, profit } = computeTotals(viewRows);

    const pieCard = document.createElement("div");
    pieCard.className = "chart-card";
    pieCard.innerHTML = '<h2>Allocation ' + (memberCount > 1 ? "(per member)" : "") + '</h2><div class="chart-container"><canvas id="summaryPie"></canvas></div>';
    dashboard.appendChild(pieCard);

    const barCard = document.createElement("div");
    barCard.className = "chart-card";
    barCard.innerHTML = '<h2>Portfolio Summary ' + (memberCount > 1 ? "(per member)" : "") + '</h2><div class="chart-container"><canvas id="summaryBar"></canvas></div>';
    dashboard.appendChild(barCard);

    const lineCard = document.createElement("div");
    lineCard.className = "chart-card";
    lineCard.innerHTML = '<h2>Portfolio Value Over Time</h2><div class="chart-container"><canvas id="portfolioValueLine"></canvas></div>';
    dashboard.appendChild(lineCard);

    const lineLabels = state.portfolioSeries.map(r => r.date);
    const lineData = state.portfolioSeries.map(r => r.portfolioValue);
    const minValue = Math.min(...lineData);
    const maxValue = Math.max(...lineData);
    const margin = (maxValue - minValue) * 0.1;

    makeChart(document.getElementById("portfolioValueLine"), {
      type: "line",
      data: {
        labels: lineLabels,
        datasets: [{
          label: "Portfolio Value NZD",
          data: lineData,
          fill: false,
          borderColor: "rgba(75,192,192,1)",
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
            ticks: { callback: v => "$" + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
            grid: { color: "#444", borderColor: "#444" }
          },
          x: { grid: { color: "#444" } }
        },
        plugins: { legend: { labels: { color: "#fff" } } }
      }
    });

    const pieLabels = viewRows.map(r => r.Ticker);
    const pieData = viewRows.map(r => parseCurrency(r["NZD"]) / memberCount);
    makeChart(document.getElementById("summaryPie"), {
      type: "doughnut",
      data: { labels: pieLabels, datasets: [{ data: pieData }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "right", labels: { color: "#fff" } } },
        elements: { arc: { borderWidth: 0 } }
      }
    });

    makeChart(document.getElementById("summaryBar"), {
      type: "bar",
      data: {
        labels: ["Spent", "Profit", "Value"],
        datasets: [{
          label: "NZD",
          data: [ totalSpent / memberCount, profit / memberCount, totalValue / memberCount ],
          backgroundColor: [ "rgba(54,162,235,0.6)", "rgba(255,205,86,0.6)", "rgba(75,192,192,0.6)" ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => "$" + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 }) },
            grid: { color: "#444", borderColor: "#444" }
          },
          x: { grid: { color: "#444" } }
        },
        plugins: { legend: { display: false } }
      }
    });

    viewRows.forEach(r => {
      const tcUsd = parseCurrency(r["Total Cost"]);
      const mvUsd = parseCurrency(r["Market Value"]);
      const mvNzd = parseCurrency(r["NZD"]);
      const pct = parseFloat(String(r["% Change"]).replace(/[^\d.-]/g, "")) || 0;

      const costNzd = mvUsd ? tcUsd * (mvNzd / mvUsd) : 0;
      const profitNzd = mvNzd - costNzd;

      const card = document.createElement("div");
      card.className = "chart-card";
      card.innerHTML = '<h2>' + r.Ticker + '</h2><div class="chart-container"><canvas id="chart-' + r.Ticker + '"></canvas></div>';
      card.style.border = profitNzd >= 0 ? "3px solid #28a745" : "3px solid #dc3545";
      dashboard.appendChild(card);

      const labels = ["Cost", "Value", "Profit", "% Change"];
      const barData = [ costNzd / memberCount, mvNzd / memberCount, profitNzd / memberCount, null ];

      const datasets = [
        { type: "bar", label: "NZD", data: barData, backgroundColor: [ "rgba(54,162,235,0.6)", "rgba(75,192,192,0.6)", "rgba(255,205,86,0.6)" ] }
      ];

      if (pctMode === "on") {
        datasets.push({
          type: "line",
          label: "% Change",
          data: [ null, null, null, pct ],
          yAxisID: "PCT",
          borderColor: "rgba(255,99,132,0.8)",
          backgroundColor: "rgba(255,99,132,0.4)",
          tension: 0.3,
          pointRadius: 4,
          fill: false
        });
      }

      makeChart(document.getElementById("chart-" + r.Ticker), {
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: { display: true, text: "NZD" },
              ticks: { callback: v => "$" + Number(v).toLocaleString() },
              grid: { color: "#444" }
            },
            PCT: {
              type: "linear",
              position: "right",
              title: { display: true, text: "% Change" },
              grid: { drawOnChartArea: false },
              ticks: { callback: v => v + "%" }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: ctx => {
                  const isLine = ctx.dataset.type === "line";
                  return isLine ? ("% Change: " + ctx.parsed.y + "%") : ("NZD $" + Number(ctx.parsed.y).toLocaleString());
                }
              }
            },
            legend: { position: "bottom" }
          }
        }
      });
    });
  }

  async function init() {
    await fetchCsv();
    render();
  }

  window.WINNERLAND = {
    renderNow: () => { destroyCharts(); render(); },
    exportPNGs
  };

  init();
})();
