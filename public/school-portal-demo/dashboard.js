// --- 1. CONFIG ---
const SUPABASE_URL = "https://acdlgvcxzxjvcwiqlydj.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZGxndmN4enhqdmN3aXFseWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Mjc5NzksImV4cCI6MjA3MjIwMzk3OX0.9ZUURjJT73Igd2tAOv8aSZUmlkEf7DIzmOAGBSjWqCI";

// --- 2. STATE ---
let summary = null;
let tradesHistory = [];
let chartRegistry = {};
let globalRange = localStorage.getItem("pfRange") || "DAY";
let tickerRangeMode = {};
try { tickerRangeMode = JSON.parse(localStorage.getItem("tickerRanges") || "{}"); } catch(_) {}

// --- 3. UTILS ---
const fmtMoney = (v, sign = false) => {
    if (v == null) return "0";
    const s = Math.round(v).toLocaleString();
    return sign ? "$" + s : s;
};

const fmtPct = (v) => (v == null) ? "0.00" : Number(v).toFixed(2);

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

const filterRange = (hist, rng) => {
    if (!hist?.length) return [];
    const ms = { DAY: 86400000, WEEK: 604800000, MONTH: 2592000000, SIX_MONTHS: 15552000000, YEAR: 31536000000 };
    let data = ms[rng] ? hist.filter(p => new Date(p[0]).getTime() >= (Date.now() - ms[rng])) : hist;
    if (['MONTH', 'YEAR', 'ALL'].includes(rng)) {
        const dailyMap = new Map();
        data.forEach(pt => { dailyMap.set(new Date(pt[0]).toDateString(), pt); });
        data = Array.from(dailyMap.values());
    }
    return data;
};

// --- CHART DATA PREP ---
const prepareChartData = (hist, symbol = null, factor = 1, currentRange = 'MONTH') => {
    const labels = [];
    const data = [];
    hist.forEach(pt => { labels.push(smartDate(pt[0], currentRange)); data.push((pt[1] || 0) / factor); });

    const count = hist.length;
    const pointRadii = new Array(count).fill(0); 
    const pointHoverRadii = new Array(count).fill(6);
    const details = new Array(count).fill(null);

    const relevantTrades = symbol ? tradesHistory.filter(t => t.symbol === symbol) : tradesHistory;
    
    relevantTrades.forEach(tr => {
        const trTime = new Date(tr.date).getTime();
        const start = new Date(hist[0][0]).getTime();
        const end = new Date(hist[hist.length - 1][0]).getTime();

        if (trTime >= start && trTime <= end + (86400000)) {
            let closestIdx = -1;
            let minDiff = Infinity;
            for (let i = 0; i < count; i++) {
                const diff = Math.abs(new Date(hist[i][0]).getTime() - trTime);
                if (diff < minDiff) { minDiff = diff; closestIdx = i; }
            }
            if (closestIdx !== -1) {
                details[closestIdx] = `${tr.type} ${Number(tr.quantity).toFixed(0)} ${tr.symbol} @ $${Number(tr.price).toFixed(2)}`;
            }
        }
    });
    return { labels, data, pointRadii, pointHoverRadii, details };
};

// --- CUSTOM PLUGIN: VERTICAL TRADE LINES ---
const tradeLinePlugin = {
    id: 'tradeLines',
    afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const meta = chart.getDatasetMeta(0);
        const dataPoints = meta.data;
        const details = chart.data.datasets[0].details;
        if(!details) return;

        ctx.save();
        details.forEach((det, index) => {
            if(det) {
                const pt = dataPoints[index];
                if(!pt) return;
                const isSell = det.includes('SELL');
                const x = pt.x;

                ctx.beginPath();
                ctx.strokeStyle = isSell ? 'rgba(239, 68, 68, 0.6)' : 'rgba(16, 185, 129, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 4]);
                ctx.moveTo(x, chartArea.top);
                ctx.lineTo(x, chartArea.bottom);
                ctx.stroke();
            }
        });
        ctx.restore();
    }
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
        const rawSym = {};
        combined.forEach(r => {
            const dt = r.data.lastUpdated || r.last_updated;
            if (!dt) return;
            const timeKey = new Date(dt).getTime();
            if (seenDates.has(timeKey)) return;
            seenDates.add(timeKey);
            const val = Number(r.data.totals?.value || 0);
            if (isFinite(val)) rawPf.push([dt, val]);
            (r.data.positions || []).forEach(p => {
                if (p?.symbol) {
                    if (!rawSym[p.symbol]) rawSym[p.symbol] = [];
                    rawSym[p.symbol].push([dt, Number(p.value || 0)]);
                }
            });
        });

        rawPf.sort((a, b) => new Date(a[0]) - new Date(b[0]));
        Object.keys(rawSym).forEach(k => rawSym[k].sort((a, b) => new Date(a[0]) - new Date(b[0])));
        summary.history = rawPf;
        summary.symbolHistory = rawSym;
        renderUI();
    } catch (e) {
        console.error(e);
        const el = document.getElementById("lastUpdated");
        if(el) el.textContent = "Connection Failed";
    }
}

// --- 5. RENDER UI ---
function renderUI() {
    const factor = document.getElementById("divideToggle").checked ? 11 : 1;
    const t = summary.totals;
    const v = (t.value || 0) / factor;
    const p = (t.profit || 0) / factor;
    const c = (t.cost || 0) / factor;
    const unrealized = v - c; 

    // --- WINNERLAND / LOSERLAND LOGIC ---
    const titleEl = document.querySelector("h1");
    if(titleEl) {
        titleEl.textContent = p >= 0 ? "WINNERLAND" : "LOSERLAND";
        titleEl.className = `text-2xl font-black tracking-tighter uppercase ${p >= 0 ? 'text-emerald-500' : 'text-red-500'}`;
    }

    const statsHTML = `
        <div class="glass-card p-6 border-b-4 ${p >= 0 ? 'border-accent-green' : 'border-accent-red'}">
            <p class="text-[10px] uppercase font-black text-neutral-500 tracking-[0.2em] mb-2">Winning Value</p>
            <p class="text-3xl font-black text-white tracking-tighter">${fmtMoney(v, true)}</p>
            <p class="text-xs font-bold ${p >= 0 ? 'text-accent-green' : 'text-accent-red'} mt-2">${p >= 0 ? '▲' : '▼'} ${fmtMoney(Math.abs(p), true)}</p>
        </div>
        <div class="glass-card p-6">
            <p class="text-[10px] uppercase font-black text-neutral-500 tracking-[0.2em] mb-2">Alpha Yield</p>
            <p class="text-3xl font-black text-white tracking-tighter">${fmtPct(t.pct)}%</p>
            <p class="text-xs font-bold text-neutral-500 mt-2 uppercase tracking-widest">Inception to Date</p>
        </div>
        <div class="glass-card p-6">
            <p class="text-[10px] uppercase font-black text-neutral-500 tracking-[0.2em] mb-2">Capital Deployed</p>
            <p class="text-3xl font-black text-white tracking-tighter">${fmtMoney(c, true)}</p>
            <p class="text-xs font-bold text-neutral-500 mt-2 uppercase tracking-widest">Net Cost Basis</p>
        </div>
        <div class="glass-card p-6 bg-amber-600/5 border-amber-500/20">
            <p class="text-[10px] uppercase font-black text-amber-500 tracking-[0.2em] mb-2">Win Sentiment</p>
            <p class="text-3xl font-black text-white tracking-tighter">${p >= 0 ? 'Peak' : 'Dip'}</p>
            <div class="w-full bg-neutral-800 h-1 rounded-full mt-4 overflow-hidden"><div class="bg-amber-500 h-full transition-all duration-1000" style="width: ${Math.min(100, Math.max(0, 50 + t.pct))}%"></div></div>
        </div>
    `;
    document.getElementById("statsGrid").innerHTML = statsHTML;

    document.getElementById("totalValueDisplay").textContent = fmtMoney(v, true);
    
    // Total Change Display
    const disp = document.getElementById("totalChangeDisplay");
    disp.className = `text-sm font-bold ${p >= 0 ? 'text-accent-green' : 'text-accent-red'}`;
    disp.textContent = `${p >= 0 ? '+' : ''}${fmtPct(t.pct)}%`;

    // Unrealized Display
    const unEl = document.getElementById("unrealizedDisplay");
    if(unEl) {
        unEl.textContent = `${unrealized >= 0 ? '+' : ''}${fmtMoney(unrealized, true)}`;
        unEl.className = `text-lg font-bold ${unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`;
    }

    document.getElementById("lastUpdated").textContent = `Sync: ${new Date(summary.lastUpdatedDate).toLocaleTimeString()}`;

    renderMainChart(factor);
    renderTable(factor);
}

function renderMainChart(factor) {
    const ctx = document.getElementById('mainChart').getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 450);
    grad.addColorStop(0, 'rgba(245, 158, 11, 0.2)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
    const hist = simplifyData(filterRange(summary.history, globalRange));
    const cd = prepareChartData(hist, null, factor, globalRange);
    
    if (chartRegistry['main']) chartRegistry['main'].destroy();
    
    Chart.register(tradeLinePlugin);

    chartRegistry['main'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: cd.labels,
            datasets: [{
                data: cd.data, 
                borderColor: '#f59e0b', 
                borderWidth: 3, 
                backgroundColor: grad, 
                fill: true, 
                tension: 0.15,
                pointRadius: cd.pointRadii, 
                pointHoverRadius: cd.pointHoverRadius, 
                pointBackgroundColor: '#f59e0b',
                details: cd.details
            }]
        },
        options: getChartOptions()
    });
}

// --- RESPONSIVE CARD TABLE RENDERER ---
function renderTable(factor) {
    const body = document.getElementById("holdingsBody");
    body.innerHTML = "";
    
    summary.positions.forEach(p => {
        const row = document.createElement("tr");
        
        // CSS: On mobile (default), display as BLOCK with margins. On desktop (md), behave like a table row.
        row.className = "block md:table-row hover:bg-white/[0.04] cursor-pointer transition-all group border-b border-white/5 p-4 mb-4 md:mb-0 bg-white/[0.03] md:bg-transparent rounded-2xl md:rounded-none";
        
        row.onclick = () => openDrawer(p.symbol);
        
        const weight = ((p.value / summary.totals.value) * 100);
        const unrealized = (p.value - p.cost) / factor;

        // NOTE: We added "md:hidden" spans to act as labels on mobile cards
        row.innerHTML = `
            <td class="block md:table-cell px-4 py-3 md:px-6 md:py-5">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-black text-xs text-amber-500 group-hover:bg-amber-500 group-hover:text-black transition-all">${p.symbol}</div>
                    <span class="font-black text-white text-sm">${p.symbol}</span>
                </div>
            </td>
            
            <td class="block md:table-cell px-4 py-1 md:px-6 md:py-5 flex justify-between items-center">
                <span class="md:hidden text-neutral-500 text-xs font-bold uppercase tracking-wider">Value</span>
                <span class="font-bold text-neutral-200">${fmtMoney(p.value / factor, true)}</span>
            </td>
            
            <td class="block md:table-cell px-4 py-1 md:px-6 md:py-5 flex justify-between items-center">
                <span class="md:hidden text-neutral-500 text-xs font-bold uppercase tracking-wider">Cost</span>
                <span class="text-neutral-400 text-sm">${fmtMoney(p.cost / factor, true)}</span>
            </td>
            
            <td class="block md:table-cell px-4 py-1 md:px-6 md:py-5 flex justify-between items-center">
                <span class="md:hidden text-neutral-500 text-xs font-bold uppercase tracking-wider">P/L</span>
                <span class="font-bold ${unrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}">
                    ${unrealized >= 0 ? '+' : ''}${fmtMoney(unrealized, true)}
                </span>
            </td>

            <td class="block md:table-cell px-4 py-1 md:px-6 md:py-5 flex justify-between items-center">
                <span class="md:hidden text-neutral-500 text-xs font-bold uppercase tracking-wider">Return</span>
                <span class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-sm ${p.pct >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}">
                    ${p.pct >= 0 ? '▲' : '▼'} ${fmtPct(Math.abs(p.pct))}%
                </span>
            </td>
            
            <td class="block md:table-cell px-4 py-1 md:px-6 md:py-5 flex justify-between items-center">
                <span class="md:hidden text-neutral-500 text-xs font-bold uppercase tracking-wider">Weight</span>
                <div class="flex items-center gap-3 justify-end md:justify-start w-1/2 md:w-auto">
                    <span class="text-xs font-bold text-neutral-500 w-[30px]">${weight.toFixed(0)}%</span>
                    <div class="flex-1 max-w-[80px] h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div class="h-full bg-neutral-600 group-hover:bg-amber-500 transition-all" style="width: ${weight}%"></div>
                    </div>
                </div>
            </td>
        `;
        body.appendChild(row);
    });
}

function openDrawer(sym) {
    const p = summary.positions.find(x => x.symbol === sym);
    if (!p) return;
    const factor = document.getElementById("divideToggle").checked ? 11 : 1;
    document.getElementById("drawer-symbol").innerText = sym;
    document.getElementById("drawer-value").innerText = fmtMoney(p.value / factor, true);
    document.getElementById("drawer-return").innerText = (p.profit >= 0 ? '+' : '') + fmtMoney(p.profit / factor, true);
    document.getElementById("drawer-return").className = `text-2xl font-black ${p.profit >= 0 ? 'text-accent-green' : 'text-accent-red'}`;
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
    const rawHist = filterRange(summary.symbolHistory[sym] || [], range);
    const hist = simplifyData(rawHist);
    const cd = prepareChartData(hist, sym, factor, range);
    if (chartRegistry['drawer']) chartRegistry['drawer'].destroy();
    
    chartRegistry['drawer'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: cd.labels,
            datasets: [{
                data: cd.data, borderColor: '#f59e0b', borderWidth: 2.5, backgroundColor: 'rgba(245, 158, 11, 0.05)', fill: true, tension: 0.1,
                pointRadius: cd.pointRadii, pointHoverRadius: cd.pointHoverRadius, pointBackgroundColor: '#f59e0b', details: cd.details
            }]
        },
        options: getChartOptions(false)
    });
}

function renderDrawerRanges(sym) {
    const container = document.getElementById("drawer-ranges");
    const current = tickerRangeMode[sym] || "YEAR";
    container.innerHTML = ['DAY', 'WEEK', 'MONTH', 'YEAR', 'ALL'].map(k => `
        <button onclick="window.updateTickerRange('${sym}', '${k}')" class="px-3 py-1.5 text-[10px] font-black rounded-lg transition-all border border-transparent ${current === k ? 'bg-amber-500 text-black' : 'text-neutral-500 hover:text-white hover:bg-white/5'}">${k === 'DAY' ? '1D' : k === 'WEEK' ? '1W' : k === 'MONTH' ? '1M' : k === 'YEAR' ? '1Y' : 'ALL'}</button>
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
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'nearest', axis: 'x', intersect: false },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(10, 10, 10, 0.95)', titleColor: '#888', bodyColor: '#fff', borderColor: '#333', borderWidth: 1, padding: 12, cornerRadius: 12,
                titleFont: { size: 10, weight: 'bold' }, bodyFont: { size: 12, weight: '900' }, displayColors: false,
                callbacks: { label: (ctx) => { const d = ctx.dataset.details; return (d && d[ctx.dataIndex]) ? d[ctx.dataIndex] : fmtMoney(ctx.raw, true); } }
            }
        },
        scales: {
            x: { display: showScales, grid: { display: false }, ticks: { color: '#555', font: { size: 10, weight: '700' }, maxTicksLimit: 8 } },
            y: { display: showScales, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#555', font: { size: 10, weight: '700' }, callback: v => fmtMoney(v) } }
        }
    };
}

// EVENTS
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

// INIT
(async () => {
    if(!window.supabase) return console.error("Supabase lib not loaded");
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data: { session } } = await window.supabase.auth.getSession();
    if (!session) location.href = "login.html";
    loadData();
})();
setInterval(loadData, 60000);
