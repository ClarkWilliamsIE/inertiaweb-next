// --- 1. CONFIG ---
const SUPABASE_URL = "https://acdlgvcxzxjvcwiqlydj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZGxndmN4enhqdmN3aXFseWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Mjc5NzksImV4cCI6MjA3MjIwMzk3OX0.9ZUURjJT73Igd2tAOv8aSZUmlkEf7DIzmOAGBSjWqCI";

// --- 2. STATE ---
let summary = null;
let tradesHistory = [];
let chartRegistry = {};
let globalRange = localStorage.getItem("pfRange") || "DAY";
let tickerRangeMode = {};
let currentSortCol = 'value'; // Default sorting parameter
let isSortAsc = false;

try { tickerRangeMode = JSON.parse(localStorage.getItem("tickerRanges") || "{}"); } catch(_) {}

// --- 3. UTILS ---
const fmtMoney = (v, sign = false) => {
    if (v == null) return "0";
    const s = Math.round(v).toLocaleString();
    return sign ? "$" + s : s;
};
const fmtPct = (v) => (v == null) ? "0.00" : Number(v).toFixed(2);
const getLocalYMD = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const smartDate = (iso, range) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    if (range === 'DAY') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (range === 'ALL' || range === 'YEAR') return `${months[d.getMonth()]} ${d.getFullYear().toString().substr(-2)}`;
    return `${d.getDate()} ${months[d.getMonth()]}`;
};
const simplifyData = (arr) => {
    if (!arr || arr.length < 2) return arr;
    const clean = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
        const lastVal = clean[clean.length - 1][1];
        const currVal = arr[i][1];
        const pctChange = lastVal === 0 ? 1 : Math.abs((currVal - lastVal) / lastVal);
        if (i === arr.length - 1 || pctChange > 0.0005) clean.push(arr[i]);
    }
    return clean;
};
const simplifyCostData = (arr) => {
    if (!arr || arr.length < 2) return arr;
    const clean = [arr[0]];
    for (let i = 1; i < arr.length; i++) {
        const lastVal = clean[clean.length - 1][1];
        const currVal = arr[i][1];
        const pctChange = lastVal === 0 ? 1 : Math.abs((currVal - lastVal) / lastVal);
        if (i === arr.length - 1 || pctChange > 0.05) clean.push(arr[i]);
    }
    return clean;
};
const filterRange = (hist, rng) => {
    if (!hist?.length) return [];
    const ms = { DAY: 86400000, WEEK: 604800000, MONTH: 2592000000, SIX_MONTHS: 15552000000, YEAR: 31536000000 };
    let data = ms[rng] ? hist.filter(p => new Date(p[0]).getTime() >= (Date.now() - ms[rng])) : hist;
    if (['MONTH', 'YEAR', 'ALL'].includes(rng)) {
        const dailyMap = new Map();
        data.forEach(pt => { 
            const dateKey = getLocalYMD(pt[0]);
            dailyMap.set(dateKey, pt); 
        });
        data = Array.from(dailyMap.values());
    }
    return data;
};
const prepareChartData = (hist, costHist = [], factor = 1, currentRange = 'MONTH') => {
    const labels = [];
    const data = [];
    const costData = [];
    const safeCostHist = Array.isArray(costHist) ? costHist : [];
    const sortedCost = [...safeCostHist].sort((a,b) => new Date(a[0]) - new Date(b[0]));
    let lastKnownCost = 0;
    let costIdx = 0;
    hist.forEach((pt) => { 
        const timestamp = new Date(pt[0]).getTime();
        labels.push(smartDate(pt[0], currentRange)); 
        data.push((pt[1] || 0) / factor);
        while(costIdx < sortedCost.length && new Date(sortedCost[costIdx][0]).getTime() <= timestamp) {
            lastKnownCost = sortedCost[costIdx][1];
            costIdx++;
        }
        if (lastKnownCost === 0 && sortedCost.length > 0 && costIdx === 0) {
             if(sortedCost[0]) lastKnownCost = sortedCost[0][1]; 
        }
        costData.push(lastKnownCost / factor);
    });
    return { labels, data, costData };
};

// --- 4. DATA ENGINE ---
async function loadData() {
    try {
        const { data: trData } = await window.supabase.from("trades").select("*").order("date", { ascending: true });
        if (trData) tradesHistory = trData;
        const { data: sumRows } = await window.supabase.from("flex_summary").select("*").order("last_updated", { ascending: false }).limit(1);
        if (!sumRows?.length) return;
        summary = sumRows[0].data;
        summary.lastUpdatedDate = sumRows[0].last_updated;
        const { data: highRes } = await window.supabase.from("flex_summary").select("data,last_updated").order("last_updated", { ascending: false }).limit(500);
        const { data: lowRes } = await window.supabase.rpc('get_daily_history');
        const combined = [...(highRes || []), ...(lowRes || [])];
        const seenDates = new Set();
        const rawPf = [];
        const rawCost = [];
        const rawSym = {};
        combined.forEach(r => {
            const dt = r.data.lastUpdated || r.last_updated;
            if (!dt) return;
            const timeKey = new Date(dt).getTime();
            if (seenDates.has(timeKey)) return;
            seenDates.add(timeKey);
            const val = Number(r.data.totals?.value || 0);
            const cost = Number(r.data.totals?.cost || 0);
            if (isFinite(val) && val > 0) rawPf.push([dt, val]);
            if (isFinite(cost) && cost > 0) rawCost.push([dt, cost]);
            (r.data.positions || []).forEach(p => {
                if (p?.symbol) {
                    const pVal = Number(p.value || 0);
                    if (isFinite(pVal) && pVal > 0) {
                        if (!rawSym[p.symbol]) rawSym[p.symbol] = [];
                        rawSym[p.symbol].push([dt, pVal]);
                    }
                }
            });
        });
        
        rawPf.sort((a, b) => new Date(a[0]) - new Date(b[0]));
        rawCost.sort((a, b) => new Date(a[0]) - new Date(b[0]));
        Object.keys(rawSym).forEach(k => rawSym[k].sort((a, b) => new Date(a[0]) - new Date(b[0])));

        const filterSpikes = (arr) => {
            if (!arr || arr.length < 3) return arr;
            const clean = [arr[0]];
            for (let i = 1; i < arr.length - 1; i++) {
                const prev = clean[clean.length - 1][1]; 
                const curr = arr[i][1];
                const next = arr[i + 1][1];
                if (curr < prev * 0.95 && next > curr * 1.05 && next >= prev * 0.92) {
                    continue;
                }
                clean.push(arr[i]);
            }
            clean.push(arr[arr.length - 1]);
            return clean;
        };

        summary.history = filterSpikes(rawPf);
        summary.costHistory = filterSpikes(rawCost);
        summary.symbolHistory = {};
        Object.keys(rawSym).forEach(k => {
            summary.symbolHistory[k] = filterSpikes(rawSym[k]);
        });

        renderUI();
    } catch (e) {
        console.error(e);
        const el = document.getElementById("lastUpdated");
        if(el) el.textContent = "Connection Failed";
    }
}

// --- 5. RENDER UI ---
window.setSort = (col) => {
    if (currentSortCol === col) {
        isSortAsc = !isSortAsc;
    } else {
        currentSortCol = col;
        isSortAsc = false;
    }
    if (summary) renderUI();
};

function renderUI() {
    const splitActive = document.getElementById("divideToggle").checked;
    const factor = splitActive ? 11 : 1;
    
    document.getElementById("scaleLabelMain").textContent = splitActive ? "Per Member View" : "Total Pool View";
    document.getElementById("scaleLabelSub").textContent = splitActive ? "1/11th Split Sub-Value" : "100% Fund Valuation";
    document.getElementById("yieldDescriptionLabel").textContent = splitActive ? "Per Member Growth Yield" : "Net Growth Allocation";

    const t = summary.totals;
    const v = (t.value || 0) / factor;
    const p = (t.profit || 0) / factor;
    const c = (t.cost || 0) / factor;
    const unrealized = v - c; 

    const isProfitable = p >= 0;
    const themeColor = isProfitable ? '#10b981' : '#ef4444';
    const themeBgTailwind = isProfitable ? 'bg-emerald-500/10' : 'bg-red-500/10';
    const themeBorderTailwind = isProfitable ? 'border-emerald-500/20' : 'border-red-500/20';
    const themeTextTailwind = isProfitable ? 'text-emerald-500' : 'text-red-500';

    const titleEl = document.getElementById("mainDashboardTitle");
    if(titleEl) {
        titleEl.textContent = isProfitable ? "WINNERLAND OS" : "LOSERLAND OS";
        titleEl.className = `text-xl font-black tracking-tighter uppercase ${themeTextTailwind}`;
    }
    
    const brandIcon = document.getElementById("brandIconContainer");
    if(brandIcon) brandIcon.className = `p-3 ${themeBgTailwind} rounded-2xl border ${themeBorderTailwind} shadow-xl`;
    
    const logoSvg = document.getElementById("headerLogoSvg");
    if(logoSvg) logoSvg.className = themeTextTailwind;

    document.getElementById("totalValueDisplay").textContent = fmtMoney(v, true);
    
    const disp = document.getElementById("totalChangeDisplay");
    disp.className = `text-xs font-bold px-2 py-0.5 rounded ${isProfitable ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`;
    disp.textContent = `${isProfitable ? '▲ +' : '▼ '}${fmtPct(t.pct)}%`;
    
    const unEl = document.getElementById("unrealizedDisplay");
    if(unEl) {
        unEl.textContent = `${unrealized >= 0 ? '+' : ''}${fmtMoney(unrealized, true)}`;
        unEl.className = `text-3xl font-black tracking-tighter ${unrealized >= 0 ? 'text-emerald-400' : 'text-rose-500'}`;
    }
    
    const yieldIconContainer = document.getElementById("yieldIconContainer");
    if(yieldIconContainer) {
        yieldIconContainer.className = `p-3.5 bg-zinc-800/40 rounded-2xl border border-zinc-800 ${unrealized >= 0 ? 'text-emerald-400' : 'text-rose-500'}`;
    }

    const costEl = document.getElementById("costDisplay");
    if(costEl) { costEl.textContent = fmtMoney(c, true); }
    
    document.getElementById("lastUpdated").textContent = `Sync: ${new Date(summary.lastUpdatedDate).toLocaleTimeString()}`;
    
    renderMainChart(factor, themeColor);
    renderTable(factor);
    if (document.getElementById("watchlist-modal").classList.contains("scale-100")) {
        renderWatchlistContent(factor);
    }
}

function renderMainChart(factor, accentColor) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 400);
    grad.addColorStop(0, accentColor + '33'); 
    grad.addColorStop(1, accentColor + '00'); 
    
    const hist = simplifyData(filterRange(summary.history, globalRange));
    const costHist = simplifyCostData(filterRange(summary.costHistory || [], globalRange));
    const cd = prepareChartData(hist, costHist, factor, globalRange);
    
    if (chartRegistry['main']) chartRegistry['main'].destroy();
    chartRegistry['main'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: cd.labels,
            datasets: [
                {
                    label: 'Portfolio Value',
                    data: cd.data, 
                    borderColor: accentColor, 
                    borderWidth: 3, 
                    backgroundColor: grad, 
                    fill: true, 
                    tension: 0.2,
                    pointRadius: 0, 
                    pointHoverRadius: 6,
                    order: 1
                },
                {
                    label: 'Cost Basis Baseline',
                    data: cd.costData, 
                    borderColor: 'rgba(255, 255, 255, 0.15)', 
                    borderWidth: 1.5, 
                    borderDash: [5, 5], 
                    backgroundColor: 'transparent',
                    fill: false, 
                    tension: 0, 
                    stepped: 'before',
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    order: 2
                }
            ]
        },
        options: getChartOptions()
    });
}

function renderTable(factor) {
    const body = document.getElementById("holdingsBody");
    body.innerHTML = "";
    
    Object.keys(chartRegistry).forEach(key => {
        if (key.startsWith('spark-')) {
            chartRegistry[key].destroy();
            delete chartRegistry[key];
        }
    });
    
    ['symbol', 'value', 'cost', 'profit', 'pct'].forEach(c => {
        const el = document.getElementById(`sort-${c}`);
        if(el) {
            if(currentSortCol === c) {
                el.innerText = isSortAsc ? " ▴" : " ▾";
                el.className = "text-amber-500 font-black";
            } else {
                el.innerText = "";
            }
        }
    });

    const sortedPositions = [...summary.positions].sort((a, b) => {
        let valA = a[currentSortCol];
        let valB = b[currentSortCol];
        if (currentSortCol === 'profit') {
            valA = a.value - a.cost;
            valB = b.value - b.cost;
        }
        if (typeof valA === 'string') {
            return isSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return isSortAsc ? valA - valB : valB - valA;
    });

    sortedPositions.forEach(p => {
        const row = document.createElement("tr");
        row.className = "hover:bg-white/[0.02] cursor-pointer transition-all border-b border-zinc-900/40 text-[11px] md:text-xs font-semibold text-zinc-300";
        row.onclick = () => openDrawer(p.symbol);
        
        const weight = ((p.value / summary.totals.value) * 100);
        const unrealized = (p.value - p.cost) / factor;
        const assetReturnPct = p.pct || 0;
        
        row.innerHTML = `
            <td class="px-2 py-2.5 md:px-4 md:py-3.5 font-bold text-white">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-black text-[10px] md:text-[11px] text-amber-500 inline-block uppercase tracking-wider shadow-sm select-none">${p.symbol}</span>
                    <div class="w-10 h-5 md:w-14 md:h-6 relative"><canvas id="sparkline-${p.symbol}"></canvas></div>
                </div>
            </td>
            <td class="px-2 py-2.5 md:px-4 md:py-3.5 text-right md:text-left">
                <span class="font-bold block ${unrealized >= 0 ? 'text-emerald-400' : 'text-rose-500'}">${unrealized >= 0 ? '+' : ''}${fmtMoney(unrealized, true)}</span>
                <span class="text-[9px] md:text-[10px] font-black tracking-tight ${assetReturnPct >= 0 ? 'text-emerald-500' : 'text-red-400'}">
                    ${assetReturnPct >= 0 ? '▲' : '▼'} ${fmtPct(Math.abs(assetReturnPct))}%
                </span>
            </td>
            <td class="px-2 py-2.5 md:px-4 md:py-3.5 text-right md:text-left text-white font-medium">
                <span class="block text-zinc-100">${fmtMoney(p.value / factor, true)}</span>
                <span class="text-[9px] text-zinc-500 block md:hidden font-normal">Cost: ${fmtMoney(p.cost / factor, true)}</span>
            </td>
            <td class="px-4 py-3.5 text-zinc-400 font-medium hidden md:table-cell">${fmtMoney(p.cost / factor, true)}</td>
            <td class="px-2 py-2.5 md:px-4 md:py-3.5 text-right md:text-left font-black text-zinc-400">
                <span>${weight.toFixed(1)}%</span>
            </td>
        `;
        
        body.appendChild(row);
        
        const sparkCanvas = document.getElementById(`sparkline-${p.symbol}`);
        if (sparkCanvas) {
            const rawHist = filterRange(summary.symbolHistory[p.symbol] || [], globalRange);
            const hist = simplifyData(rawHist);
            const sparkData = hist.map(x => x[1] / factor);
            const sparkLabels = hist.map(x => x[0]);
            
            let strokeColor = 'rgba(161, 161, 170, 0.4)'; 
            if (sparkData.length >= 2) {
                strokeColor = sparkData[sparkData.length - 1] >= sparkData[0] ? '#10b981' : '#ef4444';
            }
            
            const sparkCtx = sparkCanvas.getContext('2d');
            chartRegistry[`spark-${p.symbol}`] = new Chart(sparkCtx, {
                type: 'line',
                data: {
                    labels: sparkLabels,
                    datasets: [{
                        data: sparkData,
                        borderColor: strokeColor,
                        borderWidth: 1.5,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false,
                        tension: 0.2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: false } },
                    scales: { x: { display: false }, y: { display: false } },
                    animation: false,
                    events: [] 
                }
            });
        }
    });
}

// --- 6. POPUP WATCHLIST SYSTEM INTERFACES ---
window.openWatchlist = () => {
    const splitActive = document.getElementById("divideToggle").checked;
    const factor = splitActive ? 11 : 1;
    
    document.getElementById("watchlist-overlay").classList.remove("opacity-0", "pointer-events-none");
    const modal = document.getElementById("watchlist-modal");
    modal.classList.remove("scale-95", "opacity-0", "pointer-events-none");
    modal.classList.add("scale-100", "opacity-100", "pointer-events-auto");
    renderWatchlistContent(factor);
};

window.closeWatchlist = () => {
    document.getElementById("watchlist-overlay").classList.add("opacity-0", "pointer-events-none");
    const modal = document.getElementById("watchlist-modal");
    modal.classList.remove("scale-100", "opacity-100", "pointer-events-auto");
    modal.classList.add("scale-95", "opacity-0", "pointer-events-none");
};

window.addToWatchlist = () => {
    const input = document.getElementById("watchlistInput");
    const sym = input.value.trim().toUpperCase();
    if (!sym) return;
    
    let list = JSON.parse(localStorage.getItem("winnerland_watchlist") || "[\"BTC\",\"ETH\",\"AAPL\"]");
    if (!list.includes(sym)) {
        list.push(sym);
        localStorage.setItem("winnerland_watchlist", JSON.stringify(list));
    }
    input.value = "";
    const factor = document.getElementById("divideToggle").checked ? 11 : 1;
    renderWatchlistContent(factor);
};

window.removeFromWatchlist = (sym) => {
    let list = JSON.parse(localStorage.getItem("winnerland_watchlist") || "[\"BTC\",\"ETH\",\"AAPL\"]");
    list = list.filter(x => x !== sym);
    localStorage.setItem("winnerland_watchlist", JSON.stringify(list));
    const factor = document.getElementById("divideToggle").checked ? 11 : 1;
    renderWatchlistContent(factor);
};

function renderWatchlistContent(factor) {
    const container = document.getElementById("watchlistContentRows");
    container.innerHTML = "";
    
    const list = JSON.parse(localStorage.getItem("winnerland_watchlist") || "[\"BTC\",\"ETH\",\"AAPL\"]");
    
    if (list.length === 0) {
        container.innerHTML = `<div class="text-center text-zinc-600 text-[10px] font-bold uppercase py-8 tracking-wider">Watchlist Empty</div>`;
        return;
    }
    
    list.forEach(sym => {
        const p = summary?.positions?.find(x => x.symbol === sym);
        let valuationString = `<span class="text-zinc-500 font-normal">Tracking Baseline</span>`;
        
        if (p) {
            const equityVal = p.value / factor;
            valuationString = `
                <div class="text-right">
                    <span class="text-white font-bold block">${fmtMoney(equityVal, true)}</span>
                    <span class="text-[9px] font-black ${p.pct >= 0 ? 'text-emerald-400' : 'text-red-400'}">${p.pct >= 0 ? '▲' : '▼'} ${fmtPct(p.pct)}%</span>
                </div>`;
        }
        
        const item = document.createElement("div");
        item.className = "flex items-center justify-between py-2.5 text-xs font-semibold";
        item.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-black text-[10px] text-amber-500 tracking-wider">${sym}</span>
            </div>
            <div class="flex items-center gap-4">
                ${valuationString}
                <button onclick="window.removeFromWatchlist('${sym}')" class="text-zinc-600 hover:text-red-400 transition-colors text-base font-black px-1">&times;</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function openDrawer(sym) {
    const p = summary.positions.find(x => x.symbol === sym);
    if (!p) return;
    const factor = document.getElementById("divideToggle").checked ? 11 : 1;
    document.getElementById("drawer-symbol").innerText = sym;
    document.getElementById("drawer-value").innerText = fmtMoney(p.value / factor, true);
    
    const positionProfit = p.profit || (p.value - p.cost);
    document.getElementById("drawer-return").innerText = (positionProfit >= 0 ? '+' : '') + fmtMoney(positionProfit / factor, true);
    document.getElementById("drawer-return").className = `text-2xl font-black ${positionProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`;
    
    document.getElementById("drawer-overlay").style.opacity = "1";
    document.getElementById("drawer-overlay").style.pointerEvents = "auto";
    document.getElementById("drawer").classList.add("open");
    
    renderDrawerChart(sym, factor);
    renderDrawerRanges(sym);
}

function closeDrawer() {
    document.getElementById("drawer-overlay").style.opacity = "0";
    document.getElementById("drawer-overlay").style.pointerEvents = "none";
    document.getElementById("drawer").classList.remove("open");
}

function renderDrawerChart(sym, factor) {
    const ctx = document.getElementById('drawerChart').getContext('2d');
    const range = tickerRangeMode[sym] || "YEAR";
    chartRegistry.symbol = sym;
    const rawHist = filterRange(summary.symbolHistory[sym] || [], range);
    const hist = simplifyData(rawHist);
    const cd = prepareChartData(hist, [], factor, range); 
    
    if (chartRegistry['drawer']) chartRegistry['drawer'].destroy();
    chartRegistry['drawer'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: cd.labels,
            datasets: [{
                data: cd.data, 
                borderColor: '#f59e0b', 
                borderWidth: 2, 
                backgroundColor: 'rgba(245, 158, 11, 0.03)', 
                fill: true, 
                tension: 0.15,
                pointRadius: 0, 
                pointHoverRadius: 5, 
                pointBackgroundColor: '#f59e0b', 
                details: cd.details
            }]
        },
        options: getChartOptions(false)
    });
}

function renderDrawerRanges(sym) {
    const container = document.getElementById("drawer-ranges");
    const current = tickerRangeMode[sym] || "YEAR";
    container.innerHTML = ['DAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'].map(k => `
        <button onclick="window.updateTickerRange('${sym}', '${k}')" class="px-2 py-1 text-[9px] font-black rounded transition-all border ${current === k ? 'bg-amber-500 text-black border-amber-500' : 'text-zinc-500 hover:text-white border-zinc-800 bg-zinc-900/60'}">${k === 'DAY' ? '1D' : k === 'WEEK' ? '1W' : k === 'MONTH' ? '1M' : k === 'YEAR' ? '1Y' : 'ALL'}</button>
    `).join('');
}

window.updateTickerRange = (sym, k) => {
    tickerRangeMode[sym] = k;
    localStorage.setItem("tickerRanges", JSON.stringify(tickerRangeMode));
    const factor = document.getElementById("divideToggle").checked ? 11 : 1;
    renderDrawerRanges(sym);
    renderDrawerChart(sym, factor);
};

function getChartOptions(showScales = true) {
    return {
        responsive: true, 
        maintainAspectRatio: false, 
        interaction: { mode: 'nearest', axis: 'x', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#09090b', 
                titleColor: '#71717a', 
                bodyColor: '#fff', 
                borderColor: '#27272a', 
                borderWidth: 1, 
                padding: 10, 
                cornerRadius: 10,
                titleFont: { size: 10, weight: 'bold', family: "'Inter'" }, 
                bodyFont: { size: 11, weight: '900', family: "'Inter'" }, 
                displayColors: false,
                callbacks: { 
                    label: (ctx) => ctx.dataset.label ? ctx.dataset.label + ': ' + fmtMoney(ctx.raw, true) : fmtMoney(ctx.raw, true)
                }
            }
        },
        scales: {
            x: { display: showScales, grid: { display: false }, ticks: { color: '#52525b', font: { size: 9, weight: '700', family: "'Inter'" }, maxTicksLimit: 7 } },
            y: { display: showScales, grid: { color: 'rgba(255,255,255,0.02)' }, ticks: { color: '#52525b', font: { size: 9, weight: '700', family: "'Inter'" }, callback: v => fmtMoney(v) } }
        }
    };
}

document.getElementById("divideToggle").addEventListener('change', renderUI);
document.getElementById("btnSignOut").onclick = async () => { await window.supabase.auth.signOut(); location.href = "login.html"; };
document.getElementById("btnCloseDrawer").onclick = closeDrawer;
document.getElementById("btnCloseDrawerFooter").onclick = closeDrawer;
document.getElementById("drawer-overlay").onclick = closeDrawer;

document.querySelectorAll("#mainRangeSelector button").forEach(btn => {
    btn.addEventListener('click', (e) => {
        globalRange = e.target.dataset.range;
        localStorage.setItem("pfRange", globalRange);
        document.querySelectorAll("#mainRangeSelector button").forEach(b => b.classList.toggle("active", b.dataset.range === globalRange));
        renderUI();
    });
});
document.querySelectorAll("#mainRangeSelector button").forEach(b => b.classList.toggle("active", b.dataset.range === globalRange));

// Form processing element intercept keybinds
document.getElementById("watchlistInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        window.addToWatchlist();
    }
});

(async () => {
    if(!window.supabase) return console.error("Supabase engine connection pipeline missing");
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) location.href = "login.html";
    loadData();
})();
setInterval(loadData, 60000);
