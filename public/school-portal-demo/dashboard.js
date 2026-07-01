// --- 1. CONFIG ---
const SUPABASE_URL = "https://acdlgvcxzxjvcwiqlydj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZGxndmN4enhqdmN3aXFseWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Mjc5NzksImV4cCI6MjA3MjIwMzk3OX0.9ZUURjJT73Igd2tAOv8aSZUmlkEf7DIzmOAGBSjWqCI";
const SHEET_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby9-PQORBC7L27BItmvRVowsut2KAgcPyJxeDszODyouSxYB59pOf1TrIGm1SLQEIiccQ/exec";

// --- 2. STATE ---
let summary = null;
let tradesHistory = [];
let chartRegistry = {};
let globalRange = localStorage.getItem("pfRange") || "DAY";
let tickerRangeMode = {};
let currentSortCol = 'value'; // Default sorting parameter
let isSortAsc = false;

// Watchlist Embedded Relational Data Pipeline State Objects
let currentUser = null;
let wlItems = [], wlVotes = [], wlMyVotes = [];
let wlPctMap = {};
let wlExpandedItems = new Set();
let selectedWatchlistFY = null; // Currently evaluated financial year segment

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
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&gt;","</":"&lt;/","'":"&#39;","\"":"&quot;" }[c] || c));
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

// --- Financial Year (FY) Date Calculation Helpers ---
const getFinancialYearString = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    // July 1 is month index 6 (0-indexed JavaScript months)
    return d.getMonth() >= 6 ? `FY${y}-${String(y+1).substring(2)}` : `FY${y-1}-${String(y).substring(2)}`;
};

const getCurrentFinancialYearString = () => {
    const d = new Date();
    const y = d.getFullYear();
    return d.getMonth() >= 6 ? `FY${y}-${String(y+1).substring(2)}` : `FY${y-1}-${String(y).substring(2)}`;
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

        // Lookahead filter logic to prevent negative/zero data drop errors
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

// --- 5. RENDER MAIN PORTFOLIO UI ---
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
        renderWatchlistWorkspace();
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
    
    ['sort-symbol', 'sort-value', 'sort-cost', 'sort-profit', 'sort-pct'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = "";
    });

    const mapping = { symbol: 'sort-symbol', value: 'sort-value', cost: 'sort-cost', profit: 'sort-profit', pct: 'sort-pct' };
    const targetedIndicator = document.getElementById(mapping[currentSortCol]);
    if (targetedIndicator) {
        targetedIndicator.innerText = isSortAsc ? " ▴" : " ▾";
        targetedIndicator.className = "text-amber-500 font-black";
    }

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

// --- 6. EMBEDDED MODAL WATCHLIST PIPELINE METHODS ---
window.openWatchlistModal = async () => {
    document.getElementById("watchlist-modal-overlay").classList.remove("opacity-0", "pointer-events-none");
    const modal = document.getElementById("watchlist-modal");
    modal.classList.remove("scale-95", "opacity-0", "pointer-events-none");
    modal.classList.add("scale-100", "opacity-100", "pointer-events-auto");
    
    window.setWatchlistLoading(true);
    await fetchWatchlistBasicData();
    
    // Set default financial year context if not chosen
    if (!selectedWatchlistFY) {
        selectedWatchlistFY = getCurrentFinancialYearString();
    }
    
    renderWatchlistWorkspace();
    window.setWatchlistLoading(false);
    fetchWatchlistPrices();
};

window.closeWatchlistModal = () => {
    document.getElementById("watchlist-modal-overlay").classList.add("opacity-0", "pointer-events-none");
    const modal = document.getElementById("watchlist-modal");
    modal.classList.remove("scale-100", "opacity-100", "pointer-events-auto");
    modal.classList.add("scale-95", "opacity-0", "pointer-events-none");
};

window.setWatchlistLoading = (on) => {
    const loader = document.getElementById('watchlist_loading');
    if (loader) loader.style.display = on ? 'flex' : 'none';
};

window.showWatchlistMsg = (txt, ok=true) => {
    const m = document.getElementById('watchlist_msg');
    if (!m) return;
    m.textContent = txt;
    m.className = ok ? 'text-emerald-400 text-xs font-bold' : 'text-rose-500 text-xs font-bold';
    setTimeout(() => m.textContent = '', 2000);
};

window.handleWatchlistFyChange = (fy) => {
    selectedWatchlistFY = fy;
    renderWatchlistWorkspace();
};

function loadWatchlistPctJSONP(tickers) {
    return new Promise(resolve => {
        const cb = "CB_" + Math.random().toString(36).slice(2);
        window[cb] = (raw) => {
            delete window[cb]; 
            document.getElementById(cb)?.remove();
            const map = {}; 
            const data = raw?.data || {};
            for(let k in data) map[String(k).toUpperCase()] = data[k];
            resolve(map);
        };
        const s = document.createElement("script");
        s.id = cb;
        s.src = `${SHEET_WEBAPP_URL}?tickers=${encodeURIComponent(tickers)}&callback=${cb}&ts=${Date.now()}`;
        s.onerror = () => resolve({});
        document.body.appendChild(s);
    });
}

async function fetchWatchlistBasicData() {
    try {
        const [r1, r2] = await Promise.all([
            window.supabase.from("watchlist_items").select("*").order("created_at", {ascending:false}),
            window.supabase.from("watchlist_votes").select("item_id, user_id, value")
        ]);
        wlItems = r1.data || [];
        wlVotes = r2.data || [];
        if (currentUser) {
            wlMyVotes = wlVotes.filter(v => v.user_id === currentUser.id);
        }
    } catch (err) {
        console.error("Watchlist relational synchronization failure", err);
    }
}

async function fetchWatchlistPrices() {
    const tickers = Array.from(new Set(wlItems.map(i => (i.ticker||"").toUpperCase()).filter(Boolean))).join(",");
    if(tickers) {
        const newMap = await loadWatchlistPctJSONP(tickers);
        wlPctMap = newMap;
        renderWatchlistWorkspace();
    }
}

function getWatchlistScore(itemId) { return wlVotes.filter(v => v.item_id === itemId).reduce((a,b) => a + (b.value||0), 0); }
function getWatchlistPctData(ticker) { return wlPctMap[(ticker||"").toUpperCase()] || null; }

function renderWatchlistWorkspace() {
    const term = document.getElementById('watchlist_search').value.toUpperCase();
    const archTerm = document.getElementById('watchlist_archSearch').value.toUpperCase();
    
    // Dynamic generation of available financial options inside dropdown select element
    const fySelector = document.getElementById("watchlist_fy_selector");
    if (fySelector) {
        const uniqueFYs = new Set();
        uniqueFYs.add(getCurrentFinancialYearString());
        wlItems.forEach(item => {
            const fy = getFinancialYearString(item.created_at);
            if (fy) uniqueFYs.add(fy);
        });
        const sortedFYs = Array.from(uniqueFYs).sort().reverse();
        if (fySelector.options.length !== sortedFYs.length) {
            fySelector.innerHTML = sortedFYs.map(fy => `<option value="${fy}">${fy}</option>`).join('');
            fySelector.value = selectedWatchlistFY;
        }
    }

    // Filter active assets strictly based on the selection parameters
    const active = wlItems.filter(i => !i.archived && getFinancialYearString(i.created_at) === selectedWatchlistFY).map(i => ({ 
        ...i, 
        score: getWatchlistScore(i.id), 
        myVote: wlMyVotes.find(v => v.item_id === i.id)?.value || 0 
    }));
    active.sort((a,b) => b.score - a.score || a.ticker.localeCompare(b.ticker));

    const listContainer = document.getElementById('watchlist_list'); 
    listContainer.innerHTML = "";
    
    if(active.length === 0) {
        listContainer.innerHTML = `<div class="text-zinc-600 text-[10px] font-black uppercase py-8 text-center bg-zinc-900/10 rounded-xl border border-zinc-900">No active entries found for ${selectedWatchlistFY}</div>`;
    }

    active.forEach(i => {
        if(term && !i.ticker.toUpperCase().includes(term)) return;
        const data = getWatchlistPctData(i.ticker);
        const pctTxt = data ? (data.pct * 100).toFixed(2) + "%" : "n/a";
        const priceTxt = data && data.price ? "$" + Number(data.price).toFixed(2) : "-";
        
        let stCls = "neutral", pctCls = "muted";
        if(data) { if(data.pct >= 0) { stCls = "up"; pctCls = "up"; } else { stCls = "down"; pctCls = "down"; } }
        
        const isExpanded = wlExpandedItems.has(i.id);
        const card = document.createElement('div');
        card.className = `ticker-card ${stCls} ${isExpanded ? 'expanded' : ''}`;
        
        card.innerHTML = `
            <div class="ticker-header">
                <div class="vote-box ${i.myVote === 1 ? 'active' : ''}" onclick="window.toggleWatchlistVote('${i.id}')">
                    <div class="vote-count">${i.score}</div>
                    <div class="vote-lbl">Vote</div>
                </div>
                <div class="ticker-content" onclick="window.toggleWatchlistExpand('${i.id}')">
                    <div class="ticker-symbol">
                        ${escapeHtml(i.ticker)} <span class="market-badge">${i.ticker.length > 4 ? 'CRYPTO' : 'STOCK'}</span>
                    </div>
                    <div class="ticker-note">${escapeHtml(i.notes || "No notes available")}</div>
                    <div class="suggester">By ${escapeHtml(i.suggested_by_name || "Member")}</div>
                </div>
                <div class="price-box">
                    <div class="pct-lg ${pctCls}">${pctTxt}</div>
                    <div class="price-sm">${priceTxt}</div>
                </div>
                <div class="actions">
                    <button class="btn-icon btn-expand" onclick="window.toggleWatchlistExpand('${i.id}')">
                         <svg viewBox="0 0 24 24"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"></path></svg>
                    </button>
                    <button class="btn-icon" onclick="window.toggleWatchlistArchive('${i.id}', true)">
                        <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path></svg>
                    </button>
                </div>
            </div>
            <div class="ticker-body">
                <strong style="color:#fff;">Full Analysis Brief:</strong><br/>
                ${escapeHtml(i.notes || "No additional notes logged.")}
            </div>
        `;
        listContainer.appendChild(card);
    });

    // Compute active leader array statistics matching current season parameters
    const uStats = {};
    wlItems.filter(item => getFinancialYearString(item.created_at) === selectedWatchlistFY).forEach(i => {
        const n = i.suggested_by_name || "Anon";
        const d = getWatchlistPctData(i.ticker);
        if(d) {
            if(!uStats[n]) uStats[n] = { c: 0, s: 0 };
            uStats[n].c++; 
            uStats[n].s += d.pct;
        }
    });
    
    const leaders = Object.keys(uStats).map(n => ({ 
        name: n, 
        count: uStats[n].c, 
        avg: uStats[n].s / uStats[n].c 
    })).sort((a,b) => b.avg - a.avg);

    const leaderWrap = document.getElementById('watchlist_leaderWrap'); 
    leaderWrap.innerHTML = "";
    if(leaders.length === 0) leaderWrap.innerHTML = `<div class="text-zinc-600 text-[10px] font-black uppercase py-4">No picks for season</div>`;
    
    leaders.forEach((l, idx) => {
        const ab = l.avg >= 0 ? "up" : "down";
        leaderWrap.innerHTML += `
            <div class="leader-row">
                <div class="rank">${idx+1}</div>
                <div class="avatar">${l.name.substring(0,2).toUpperCase()}</div>
                <div class="player-info">
                    <div class="player-name">${escapeHtml(l.name)}</div>
                    <div class="suggester">${l.count} picks</div>
                </div>
                <div class="perf-badge ${ab}">${(l.avg * 100).toFixed(2)}%</div>
            </div>`;
    });

    // Populate Archive Framework Listings
    const archContainer = document.getElementById('watchlist_archList'); 
    archContainer.innerHTML = "";
    const archived = wlItems.filter(i => i.archived && getFinancialYearString(i.created_at) === selectedWatchlistFY);
    if(archived.length === 0) archContainer.innerHTML = `<div class="text-zinc-600 text-[10px] font-black uppercase py-2">Archive box empty</div>`;
    
    archived.forEach(i => {
        if(archTerm && !i.ticker.toUpperCase().includes(archTerm)) return;
        const d = getWatchlistPctData(i.ticker);
        const col = d ? (d.pct >= 0 ? 'text-emerald-400' : 'text-rose-500') : 'text-zinc-500';
        const txt = d ? (d.pct * 100).toFixed(2) + "%" : "n/a";
        
        archContainer.innerHTML += `
            <div style="display:flex; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid #27272a; font-size:0.85rem;">
                <div><strong class="text-white">${i.ticker}</strong> <span class="${col}">${txt}</span></div>
                <button class="text-[10px] font-black text-amber-500 uppercase hover:text-white" onclick="window.toggleWatchlistArchive('${i.id}', false)">Restore</button>
            </div>`;
    });
}

window.addWatchlistItemNode = async () => {
    const t = document.getElementById('watchlist_ticker').value.trim().toUpperCase();
    const notesInput = document.getElementById('watchlist_notes');
    if(!t) return window.showWatchlistMsg("Enter symbol", false);
    
    document.getElementById('watchlist_addBtn').disabled = true;
    try {
        const name = (currentUser?.user_metadata?.first_name) || currentUser?.email?.split('@')[0] || "Network Node";
        const { error } = await window.supabase.from("watchlist_items").insert({
            ticker: t, notes: notesInput.value.trim(), created_by: currentUser.id, suggested_by_name: name, archived: false
        });
        if(error) throw error;
        
        fetch(SHEET_WEBAPP_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ ticker: t, notes: notesInput.value, user_id: currentUser.id }) });
        document.getElementById('watchlist_ticker').value = ""; 
        notesInput.value = "";
        window.showWatchlistMsg("Added Node successfully!");
        
        // Force evaluation view to reset onto current season framework context when node deploys
        selectedWatchlistFY = getCurrentFinancialYearString();
        await fetchWatchlistBasicData(); 
        renderWatchlistWorkspace(); 
        fetchWatchlistPrices();
    } catch(err) {
        window.showWatchlistMsg("Failed deployment insertion", false);
    }
    document.getElementById('watchlist_addBtn').disabled = false;
};

window.toggleWatchlistExpand = (id) => {
    if(wlExpandedItems.has(id)) wlExpandedItems.delete(id);
    else wlExpandedItems.add(id);
    renderWatchlistWorkspace();
};

window.toggleWatchlistVote = async (itemId) => {
    const exists = wlMyVotes.find(v => v.item_id === itemId);
    if(exists) {
         wlMyVotes = wlMyVotes.filter(v => v.item_id !== itemId);
         const idx = wlVotes.findIndex(v => v.item_id === itemId && v.user_id === currentUser.id);
         if(idx > -1) wlVotes.splice(idx, 1);
         window.supabase.from("watchlist_votes").delete().match({ item_id: itemId, user_id: currentUser.id }).then();
    } else {
         wlMyVotes.push({ item_id: itemId, user_id: currentUser.id, value: 1 });
         wlVotes.push({ item_id: itemId, user_id: currentUser.id, value: 1 });
         window.supabase.from("watchlist_votes").insert({ item_id: itemId, user_id: currentUser.id, value: 1 }).then();
    }
    renderWatchlistWorkspace();
};

window.toggleWatchlistArchive = async (id, state) => {
    await window.supabase.from("watchlist_items").update({ archived: state }).eq("id", id);
    await fetchWatchlistBasicData(); 
    renderWatchlistWorkspace();
};

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

document.getElementById('watchlist_search').oninput = renderWatchlistWorkspace; 
document.getElementById('watchlist_archSearch').oninput = renderWatchlistWorkspace;

(async () => {
    if(!window.supabase) return console.error("Supabase engine connection pipeline missing");
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) location.href = "login.html";
    currentUser = session.user;
    
    window.supabase.channel('public:watchlist')
        .on('postgres_changes', { event:'*', schema:'public', table:'watchlist_items' }, async()=>{ await fetchWatchlistBasicData(); renderWatchlistWorkspace(); fetchWatchlistPrices(); })
        .on('postgres_changes', { event:'*', schema:'public', table:'watchlist_votes' }, async()=>{ await fetchWatchlistBasicData(); renderWatchlistWorkspace(); })
        .subscribe();
        
    loadData();
    
    setInterval(async () => { 
        if (document.getElementById("watchlist-modal").classList.contains("opacity-100")) {
            const t = Array.from(new Set(wlItems.map(i=>(i.ticker||"").toUpperCase()).filter(Boolean))).join(",");
            if(t) { wlPctMap = await loadWatchlistPctJSONP(t); renderWatchlistWorkspace(); }
        }
    }, 60000);
})();
setInterval(loadData, 60000);
