/**
 * Winnerland | Portfolio OS - Dashboard Core Engine
 * Handles data syncing, calculation metrics, chart rendering,
 * scale shifting, and automatic database anomaly filtering.
 */

(function () {
    // --- Configuration ---
    const CONFIG = {
        URL: "https://acdlgvcxzxjvcwiqlydj.supabase.co",
        KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZGxndmN4enhqdmN3aXFseWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Mjc5NzksImV4cCI6MjA3MjIwMzk3OX0.9ZUURjJT73Igd2tAOv8aSZUmlkEf7DIzmOAGBSjWqCI"
    };

    // --- State ---
    let supabaseClient = null;
    let rawHistoryData = [];
    let rawHoldingsData = [];
    let currentRange = "ALL";
    let isDividedScale = false;
    let mainChartInstance = null;
    let drawerChartInstance = null;
    let selectedAssetHistory = [];

    // --- Initialization ---
    function init() {
        initSupabase();
        setupEventListeners();
        fetchDashboardData();
    }

    function initSupabase() {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(CONFIG.URL, CONFIG.KEY);
        } else if (window.supabaseClient) {
            supabaseClient = window.supabaseClient;
        } else {
            console.error("Supabase SDK missing or failed to load.");
        }
    }

    function setupEventListeners() {
        // Range Buttons
        const rangeButtons = document.querySelectorAll("#mainRangeSelector button");
        rangeButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                rangeButtons.forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                currentRange = e.target.getAttribute("data-range");
                updateChartsAndMetrics();
            });
        });
        // Set initial active state
        const initialActive = document.querySelector(`#mainRangeSelector button[data-range="${currentRange}"]`);
        if (initialActive) initialActive.classList.add("active");

        // Scale Toggle
        const toggle = document.getElementById("divideToggle");
        if (toggle) {
            toggle.addEventListener("change", (e) => {
                isDividedScale = e.target.checked;
                updateChartsAndMetrics();
                renderHoldingsTable();
            });
        }

        // Sign Out Button
        const signOutBtn = document.getElementById("btnSignOut");
        if (signOutBtn) {
            signOutBtn.addEventListener("click", () => {
                alert("Signing out...");
                // Handle actual authentication sign out redirect here if needed
            });
        }

        // Drawer Close
        const closeBtn = document.getElementById("btnCloseDrawer");
        const closeFooterBtn = document.getElementById("btnCloseDrawerFooter");
        const overlay = document.getElementById("drawer-overlay");

        if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
        if (closeFooterBtn) closeFooterBtn.addEventListener("click", closeDrawer);
        if (overlay) overlay.addEventListener("click", closeDrawer);
    }

    // --- Anomaly and Cleaning Engine ---
    /**
     * Eliminates dramatic database sync drops where values fall to 
     * near-zero or drop rapidly and return to normal in a V-shape.
     */
    function filterAnomalies(arr) {
        if (!arr || arr.length === 0) return [];
        
        // Step 1: Strip out strict zero, negative, or undefined anomalies
        let clean = arr.filter(pt => pt && pt.value > 0 && pt.date);
        if (clean.length < 3) return clean;

        // Step 2: Clear instant V-shaped drops (false tracking spikes)
        return clean.filter((pt, idx) => {
            if (idx === 0 || idx === clean.length - 1) return true;
            
            const prevVal = clean[idx - 1].value;
            const nextVal = clean[idx + 1].value;
            const currVal = pt.value;

            // If value plunges below 25% of both previous and subsequent point, filter it out
            if (currVal < prevVal * 0.25 && currVal < nextVal * 0.25) {
                return false;
            }
            return true;
        });
    }

    // --- Data Fetching ---
    async function fetchDashboardData() {
        if (!supabaseClient) return;

        try {
            document.getElementById("lastUpdated").innerText = "Syncing Data...";

            // Fetch history metrics
            const { data: history, error: historyErr } = await supabaseClient
                .from("portfolio_history")
                .select("created_at, total_value, cost_basis, asset_symbol, asset_name")
                .order("created_at", { ascending: true });

            if (historyErr) throw historyErr;

            // Normalize and parse database fields
            rawHistoryData = (history || []).map(row => ({
                date: new Date(row.created_at),
                value: parseFloat(row.total_value) || 0,
                cost: parseFloat(row.cost_basis) || 0,
                symbol: row.asset_symbol || "TOTAL",
                name: row.asset_name || "Total Portfolio"
            }));

            // Filter out specific data entries for individual tracking
            const activeHoldingsMap = {};
            rawHistoryData.forEach(item => {
                if (item.symbol !== "TOTAL") {
                    activeHoldingsMap[item.symbol] = item;
                }
            });

            // Convert to parsed array structure for table render
            rawHoldingsData = Object.values(activeHoldingsMap);

            // Set Timestamp
            document.getElementById("lastUpdated").innerText = "Updated: Just Now";

            updateChartsAndMetrics();
            renderHoldingsTable();

        } catch (err) {
            console.error("Error fetching historical ecosystem maps: ", err);
            document.getElementById("lastUpdated").innerText = "Sync Connection Error";
        }
    }

    // --- UI Update Engines ---
    function updateChartsAndMetrics() {
        // Filter portfolio global tracker lines
        const globalHistory = rawHistoryData.filter(item => item.symbol === "TOTAL");
        const cleanHistory = filterAnomalies(globalHistory);
        const windowedData = filterDataByRange(cleanHistory, currentRange);

        if (windowedData.length === 0) return;

        const latestEntry = windowedData[windowedData.length - 1];
        const initialEntry = windowedData[0];

        // Apply scale division option (1/11th scale module)
        const scaleFactor = isDividedScale ? 11 : 1;
        
        const currentEquity = latestEntry.value / scaleFactor;
        const currentCost = latestEntry.cost / scaleFactor;
        const unrealizedPL = currentEquity - currentCost;
        
        const totalChangeAmt = currentEquity - (initialEntry.value / scaleFactor);
        const totalChangePct = (initialEntry.value > 0) ? (totalChangeAmt / (initialEntry.value / scaleFactor)) * 100 : 0;

        // Render upper metric cards
        document.getElementById("totalValueDisplay").innerText = formatCurrency(currentEquity);
        document.getElementById("costDisplay").innerText = formatCurrency(currentCost);
        
        // P/L Elements
        const unRealEl = document.getElementById("unrealizedDisplay");
        unRealEl.innerText = (unrealizedPL >= 0 ? "+" : "") + formatCurrency(unrealizedPL);
        unRealEl.className = `text-2xl font-bold tracking-tight ${unrealizedPL >= 0 ? 'text-emerald-400' : 'text-red-500'}`;

        const changeEl = document.getElementById("totalChangeDisplay");
        changeEl.innerText = `${totalChangeAmt >= 0 ? "▲" : "▼"} ${formatCurrency(Math.abs(totalChangeAmt))} (${totalChangePct.toFixed(2)}%)`;
        changeEl.className = `text-sm font-bold ${totalChangeAmt >= 0 ? 'text-emerald-400' : 'text-red-500'}`;

        renderMainChart(windowedData, scaleFactor);
    }

    function filterDataByRange(data, range) {
        if (range === "ALL" || data.length === 0) return data;
        
        const latestDate = data[data.length - 1].date;
        let cutoffDate = new Date(latestDate);

        switch (range) {
            case "DAY": cutoffDate.setDate(cutoffDate.getDate() - 1); break;
            case "WEEK": cutoffDate.setDate(cutoffDate.getDate() - 7); break;
            case "MONTH": cutoffDate.setMonth(cutoffDate.getMonth() - 1); break;
            case "YEAR": cutoffDate.setFullYear(cutoffDate.getFullYear() - 1); break;
            default: return data;
        }

        return data.filter(pt => pt.date >= cutoffDate);
    }

    // --- Table Rendering Engine ---
    function renderHoldingsTable() {
        const tbody = document.getElementById("holdingsBody");
        if (!tbody) return;

        if (rawHoldingsData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-10 text-center text-neutral-500 font-bold uppercase">No Active Account Holdings found</td></tr>`;
            return;
        }

        const scaleFactor = isDividedScale ? 11 : 1;
        let runningTotalValue = 0;
        
        // Calculate dynamic sum for distribution allocations
        rawHoldingsData.forEach(h => runningTotalValue += (h.value / scaleFactor));

        tbody.innerHTML = "";

        rawHoldingsData.forEach(holding => {
            const val = holding.value / scaleFactor;
            const cost = holding.cost / scaleFactor;
            const pl = val - cost;
            const pctReturn = cost > 0 ? (pl / cost) * 100 : 0;
            const weight = runningTotalValue > 0 ? (val / runningTotalValue) * 100 : 0;

            const tr = document.createElement("tr");
            tr.className = "border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer text-sm font-medium text-neutral-300";
            
            tr.innerHTML = `
                <td class="px-6 py-4 font-bold text-white">
                    <div>${holding.symbol}</div>
                    <div class="text-[10px] text-neutral-500 font-normal mt-0.5">${holding.name}</div>
                </td>
                <td class="px-6 py-4">${formatCurrency(val)}</td>
                <td class="px-6 py-4 text-neutral-400">${formatCurrency(cost)}</td>
                <td class="px-6 py-4 ${pl >= 0 ? 'text-emerald-400' : 'text-red-500'}">${pl >= 0 ? '+' : ''}${formatCurrency(pl)}</td>
                <td class="px-6 py-4 ${pctReturn >= 0 ? 'text-emerald-400' : 'text-red-500'}">${pctReturn >= 0 ? '+' : ''}${pctReturn.toFixed(2)}%</td>
                <td class="px-6 py-4 text-neutral-400 font-mono">${weight.toFixed(1)}%</td>
            `;

            tr.addEventListener("click", () => openAssetDrawer(holding.symbol, holding.name, val, pl, pctReturn));
            tbody.appendChild(tr);
        });
    }

    // --- Chart Engines ---
    function renderMainChart(chartData, scaleFactor) {
        const ctx = document.getElementById("mainChart").getContext("2d");
        if (mainChartInstance) mainChartInstance.destroy();

        const labels = chartData.map(d => d.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const dataValues = chartData.map(d => d.value / scaleFactor);

        mainChartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    label: "Ecosystem Value",
                    data: dataValues,
                    borderColor: "#f59e0b",
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: "#f59e0b",
                    tension: 0.1,
                    fill: true,
                    backgroundColor: (context) => {
                        const chart = context.chart;
                        const {ctx, chartArea} = chart;
                        if (!chartArea) return null;
                        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        gradient.addColorStop(0, "rgba(245, 158, 11, 0.15)");
                        gradient.addColorStop(1, "rgba(245, 158, 11, 0)");
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: "#737373", font: { family: "Inter", size: 10 } } },
                    y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#737373", font: { family: "Inter", size: 10 } } }
                },
                interaction: { intersect: false, mode: 'index' }
            }
        });
    }

    // --- Drawer / Detail View Sub-modules ---
    function openAssetDrawer(symbol, name, currentVal, pl, pctReturn) {
        const drawer = document.getElementById("drawer");
        const overlay = document.getElementById("drawer-overlay");
        
        if (!drawer || !overlay) return;

        document.getElementById("drawer-symbol").innerText = symbol;
        document.getElementById("drawer-name").innerText = name;
        document.getElementById("drawer-value").innerText = formatCurrency(currentVal);
        
        const returnEl = document.getElementById("drawer-return");
        returnEl.innerText = `${pl >= 0 ? "+" : ""}${formatCurrency(pl)} (${pctReturn.toFixed(2)}%)`;
        returnEl.className = `text-2xl font-black ${pl >= 0 ? 'text-emerald-400' : 'text-red-500'}`;

        // Render dynamic asset historic metrics context inside drawer container
        const assetHistory = rawHistoryData.filter(item => item.symbol === symbol);
        const cleanAssetHistory = filterAnomalies(assetHistory);
        
        drawer.classList.add("open");
        overlay.classList.remove("opacity-0", "pointer-events-none");

        renderDrawerChart(cleanAssetHistory);
    }

    function renderDrawerChart(historyPoints) {
        const ctx = document.getElementById("drawerChart").getContext("2d");
        if (drawerChartInstance) drawerChartInstance.destroy();

        const scaleFactor = isDividedScale ? 11 : 1;
        const labels = historyPoints.map(p => p.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        const values = historyPoints.map(p => p.value / scaleFactor);

        drawerChartInstance = new Chart(ctx, {
            type: "line",
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    borderColor: "#ffffff",
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.1,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: "#525252" } },
                    y: { grid: { color: "rgba(255, 255, 255, 0.05)" }, ticks: { color: "#525252" } }
                }
            }
        });
    }

    function closeDrawer() {
        const drawer = document.getElementById("drawer");
        const overlay = document.getElementById("drawer-overlay");
        if (drawer) drawer.classList.remove("open");
        if (overlay) overlay.classList.add("opacity-0", "pointer-events-none");
    }

    // --- Helper Utilities ---
    function formatCurrency(num) {
        return "$" + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Global hook inside page scope
    window.addEventListener("load", init);
})();
