/* Inertia Ed Demo App, clean build */
const state = {
  user: { school: "", email: "", contact: "Demo Teacher", address: "123 Example Road, Wellington" },
  holds: [],        // [{kitId, year, blockIndex}]
  plan: [],         // [{kitId, year, blockIndex}]
  nowYear: new Date().getFullYear(),
  selectedSlot: null // {year, blockIndex, label, start, end}
};

const views = ["welcome","catalog","calendar","planner","confirm"];

function showView(id){
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if(el) el.classList.add("hidden");
  });
  const on = document.getElementById(`view-${id}`);
  if(on) on.classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("active", b.dataset.route===id));

  if(id==="catalog") renderCatalog();
  if(id==="calendar") renderCalendar();
  if(id==="planner") { renderPlanner(); renderSidePanel(); }
  if(id==="confirm") renderConfirm();
}

function init(){
  // populate schools
  const sel = document.getElementById("school-select");
  if(sel){
    (window.DEMO_DATA?.schoolList || []).forEach(s => {
      const o = document.createElement("option");
      o.textContent = s;
      sel.appendChild(o);
    });
  }

  // sign in
  const demoBtn = document.getElementById("btn-demo-login");
  if(demoBtn){
    demoBtn.addEventListener("click", () => {
      state.user.school = "Avonside Demo School";
      state.user.email = "demo.teacher@inertiaed.org";
      showView("catalog");
    });
  }
  const signBtn = document.getElementById("btn-sign-in");
  if(signBtn){
    signBtn.addEventListener("click", () => {
      const s = document.getElementById("school-select");
      state.user.school = s && s.value ? s.value : "Demo School";
      const e = document.getElementById("email-input");
      state.user.email = e && e.value ? e.value : "teacher@example.school.nz";
      showView("catalog");
    });
  }

  // nav
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => showView(btn.dataset.route));
  });

  // calendar dropdowns
  const calKit = document.getElementById("calendar-kit");
  const calYear = document.getElementById("calendar-year");
  if(calKit && calYear){
    (window.DEMO_DATA?.kits || []).forEach(k => {
      const o = document.createElement("option");
      o.value = k.id; o.textContent = `${k.title} (${k.id})`;
      calKit.appendChild(o);
    });
    const years = Object.keys(window.DEMO_DATA?.blocksByYear || {}).map(n => parseInt(n)).sort();
    years.forEach(y => { const o = document.createElement("option"); o.value = y; o.textContent = y; calYear.appendChild(o); });
    calYear.value = state.nowYear;
    calKit.value = window.DEMO_DATA.kits[0]?.id || "";
  }

  const clearBtn = document.getElementById("btn-clear-holds");
  if(clearBtn) clearBtn.addEventListener("click", () => { state.holds = []; renderCalendar(); });
  const addBtn = document.getElementById("btn-add-held-to-plan");
  if(addBtn) addBtn.addEventListener("click", addHeldToPlan);

  const printBtn = document.getElementById("btn-print-plan");
  if(printBtn) printBtn.addEventListener("click", () => window.print());

  // confirm form fields
  ["confirm-school","confirm-contact","confirm-email","confirm-address"].forEach(id => {
    const el = document.getElementById(id);
    if(el){
      el.addEventListener("input", e => {
        if(id==="confirm-school") state.user.school = e.target.value;
        if(id==="confirm-contact") state.user.contact = e.target.value;
        if(id==="confirm-email") state.user.email = e.target.value;
        if(id==="confirm-address") state.user.address = e.target.value;
        renderConfirm();
      });
    }
  });

  // filters
  ["filter-year","filter-strand","filter-search"].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener("input", renderCatalog);
  });

  // modal close
  const modalClose = document.getElementById("kit-modal-close");
  if(modalClose) modalClose.addEventListener("click", closeKitModal);
  const modal = document.getElementById("kit-modal");
  if(modal) modal.addEventListener("click", (e) => { if(e.target.id==="kit-modal") closeKitModal(); });

  showView("welcome");
}

/* ---------------- Catalog ---------------- */
function renderCatalog(){
  const cont = document.getElementById("kits-grid");
  if(!cont) return;
  cont.innerHTML = "";

  const fy = document.getElementById("filter-year")?.value || "";
  const fs = document.getElementById("filter-strand")?.value || "";
  const q  = (document.getElementById("filter-search")?.value || "").trim().toLowerCase();

  (window.DEMO_DATA?.kits || [])
    .filter(k => !fy || k.yearLevel===fy)
    .filter(k => !fs || k.strand===fs)
    .filter(k => !q  || k.title.toLowerCase().includes(q))
    .forEach(k => {
      const card = document.createElement("div");
      card.className = "kit-card";
      const imgOrInit = k.imageUrl
        ? `<img alt="" src="${k.imageUrl}" class="w-full h-full object-cover" data-action="open" data-id="${k.id}">`
        : `<div class="text-2xl" data-action="open" data-id="${k.id}">${k.thumb}</div>`;
      card.innerHTML = `
        <div class="kit-thumb">${imgOrInit}</div>
        <div class="kit-body">
          <div class="flex items-start justify-between gap-2">
            <div>
              <button class="font-semibold text-left hover:underline" data-action="open" data-id="${k.id}">${k.title}</button>
              <div class="kit-meta">${k.yearLevel} · ${k.strand}</div>
            </div>
            <div class="text-right">
              <div class="rating" title="${k.ratingAvg} from ${k.ratingCount} ratings">${renderStars(k.ratingAvg)}</div>
              <div class="text-xs text-base-500">${k.ratingAvg} (${k.ratingCount})</div>
            </div>
          </div>
          <p class="mt-2 text-sm text-base-600">${k.outcome}</p>
          <div class="mt-3 flex items-center gap-2">
            <button class="btn-secondary" data-action="avail" data-id="${k.id}">Check availability</button>
            <button class="btn-primary" data-action="hold" data-id="${k.id}">Quick hold next free half</button>
          </div>
        </div>`;
      cont.appendChild(card);
    });

  // Buttons and image/title clicks
  cont.querySelectorAll("[data-action='open']").forEach(el => {
    el.addEventListener("click", () => openKitModal(el.getAttribute("data-id")));
  });
  cont.querySelectorAll("button").forEach(b => {
    const id = b.getAttribute("data-id");
    const act = b.getAttribute("data-action");
    if(act==="avail"){
      b.addEventListener("click", () => {
        const kitSel = document.getElementById("calendar-kit");
        if(kitSel) kitSel.value = id;
        showView("calendar");
      });
    }
    if(act==="hold"){
      b.addEventListener("click", () => quickHold(id));
    }
  });
}

function renderStars(avg){
  const full = Math.floor(avg);
  const frac = avg - full;
  let stars = "";
  for(let i=1; i<=5; i++){
    let fillPct = 0;
    if(i <= full) fillPct = 100;
    else if(i === full + 1) fillPct = Math.round(frac * 100);
    stars += `<span class="star" style="--p:${fillPct}"></span>`;
  }
  return stars;
}

/* ---------------- Kit modal with feedback ---------------- */
function openKitModal(kitId){
  const k = (window.DEMO_DATA?.kits || []).find(x => x.id===kitId);
  if(!k) return;
  const modal = document.getElementById("kit-modal");
  const c = document.getElementById("kit-modal-content");
  if(!modal || !c) return;

  const img = k.imageUrl
    ? `<img src="${k.imageUrl}" alt="" class="w-full h-44 object-cover rounded-lg bg-base-100">`
    : `<div class="w-full h-44 rounded-lg bg-base-100 flex items-center justify-center text-3xl">${k.thumb}</div>`;

  const reviews = loadReviews(kitId);
  const reviewList = reviews.map(r => `
    <div class="border-b border-base-200 py-2">
      <div class="text-sm font-medium">${escapeHtml(r.name || "Teacher")}</div>
      <div class="rating mt-1">${renderStars(parseFloat(r.stars || 0))}</div>
      <div class="text-sm text-base-700 mt-1">${escapeHtml(r.text || "")}</div>
    </div>`).join("");

  c.innerHTML = `
    <div class="grid md:grid-cols-2 gap-4">
      <div>${img}</div>
      <div>
        <div class="text-2xl font-semibold">${k.title} <span class="text-base-500 text-sm">(${k.id})</span></div>
        <div class="text-sm text-base-600 mt-1">${k.yearLevel} · ${k.strand}</div>
        <p class="mt-3 text-base-700">${k.outcome}</p>
        <div class="mt-3 text-sm">
          <div class="font-medium">What is inside</div>
          <ul class="list-disc ml-5 text-base-700">
            <li>Teacher guide and care notes</li>
            <li>Core materials and equipment</li>
            <li>Suggested investigations and extensions</li>
          </ul>
        </div>
        <div class="mt-3">
          <div class="font-medium">Community rating</div>
          <div class="rating mt-1" title="${k.ratingAvg} from ${k.ratingCount} ratings">${renderStars(k.ratingAvg)}</div>
          <div class="text-xs text-base-500">${k.ratingAvg} average · ${k.ratingCount} ratings</div>
        </div>
      </div>
    </div>
    <div class="mt-4">
      <div class="font-medium mb-1">Teacher feedback</div>
      <div>${reviewList || '<div class="text-base-600 text-sm">No comments yet. Be the first to add one.</div>'}</div>
      <form id="review-form" class="mt-3 grid sm:grid-cols-2 gap-2">
        <input class="input" name="name" placeholder="Your name">
        <select class="input" name="stars">
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
        <textarea class="input sm:col-span-2" name="text" rows="3" placeholder="What worked well and any tips for other teachers"></textarea>
        <button class="btn-primary sm:col-span-2" type="submit">Submit feedback</button>
      </form>
    </div>`;

  modal.classList.remove("hidden");
  const form = document.getElementById("review-form");
  if(form){
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const entry = { name: fd.get("name"), stars: parseFloat(fd.get("stars")), text: fd.get("text"), ts: Date.now() };
      saveReview(kitId, entry);
      closeKitModal();
      openKitModal(kitId);
    });
  }
}

function closeKitModal(){
  const modal = document.getElementById("kit-modal");
  if(modal) modal.classList.add("hidden");
}

function loadReviews(kitId){
  try { return JSON.parse(localStorage.getItem("reviews:"+kitId) || "[]"); } catch { return []; }
}
function saveReview(kitId, entry){
  const list = loadReviews(kitId); list.unshift(entry);
  try { localStorage.setItem("reviews:"+kitId, JSON.stringify(list)); } catch {}
}
function escapeHtml(s){ return (s||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

/* ---------------- Availability ---------------- */
function renderCalendar(){
  const kitId = document.getElementById("calendar-kit")?.value || "";
  const year = document.getElementById("calendar-year")?.value || String(state.nowYear);
  const wrap = document.getElementById("calendar-terms");
  if(!wrap) return;
  wrap.innerHTML = "";

  const blocks = (window.DEMO_DATA?.blocksByYear || {})[year] || [];
  const av = ((window.DEMO_DATA?.availability || {})[kitId] || {})[year] || [];

  for(let term=1; term<=4; term++){
    const termDiv = document.createElement("div");
    termDiv.className = "term-card";
    termDiv.innerHTML = `<div class="font-semibold">Term ${term}</div>`;

    const halves = blocks.map((b,i)=>({...b,index:i})).filter(b => b.term===term);
    halves.forEach(h => {
      const held = state.holds.find(x => x.kitId===kitId && x.year===year && x.blockIndex===h.index);
      const st = av[h.index]?.status || "available";
      const row = document.createElement("div");
      row.className = "mt-2 flex items-center justify-between gap-2 border border-base-200 rounded-md p-2";
      row.innerHTML = `<div>
          <div class="text-sm font-medium">${h.label}</div>
          <div class="text-xs text-base-600">${formatDate(h.start)} to ${formatDate(h.end)}</div>
        </div>
        <div>
          ${st!=="unavailable"
            ? `<button class="btn-secondary text-sm" data-i="${h.index}">${held ? "Unhold" : "Hold"}</button>`
            : `<span class="badge">Unavailable</span>`}
        </div>`;
      termDiv.appendChild(row);
    });
    wrap.appendChild(termDiv);
  }

  wrap.querySelectorAll("button[data-i]").forEach(btn => {
    btn.addEventListener("click", () => {
      const i = parseInt(btn.getAttribute("data-i"));
      toggleHold(kitId, year, i);
      renderCalendar();
    });
  });
}

function toggleHold(kitId, year, blockIndex){
  const idx = state.holds.findIndex(h => h.kitId===kitId && h.year===year && h.blockIndex===blockIndex);
  if(idx>=0) state.holds.splice(idx,1);
  else state.holds.push({kitId, year, blockIndex});
}

function addHeldToPlan(){
  state.holds.forEach(h => {
    if(!state.plan.find(p => p.kitId===h.kitId && p.year===h.year && p.blockIndex===h.blockIndex)){
      state.plan.push({...h});
    }
  });
  state.holds = [];
  showView("planner");
}

function quickHold(kitId){
  const year = String(state.nowYear);
  const list = ((window.DEMO_DATA?.availability || {})[kitId] || {})[year] || [];
  const firstFree = list.findIndex(x => x.status==="available");
  if(firstFree>=0){
    toggleHold(kitId, year, firstFree);
    addHeldToPlan();
  } else {
    alert("No free half term blocks for this kit in " + year);
  }
}

/* ---------------- Planner ---------------- */
function renderPlanner(){
  const grid = document.getElementById("planner-terms");
  if(!grid) return;
  grid.innerHTML = "";
  const years = Object.keys(window.DEMO_DATA?.blocksByYear || {}).map(n => parseInt(n)).sort();

  years.forEach(y => {
    for(let term=1; term<=4; term++){
      const termCard = document.createElement("div");
      termCard.className = "term-card";
      termCard.innerHTML = `<div class="font-semibold">${y} · Term ${term}</div>`;
      const halves = (window.DEMO_DATA.blocksByYear[y] || []).map((b,i)=>({...b,index:i})).filter(b => b.term===term);
      halves.forEach(h => {
        const slot = document.createElement("div");
        slot.className = "half-slot mt-2";
        slot.dataset.year = y;
        slot.dataset.blockIndex = h.index;

        const items = state.plan.filter(p => p.year==y && p.blockIndex==h.index);
        let list = "";
        items.forEach(p => {
          const k = (window.DEMO_DATA?.kits || []).find(x => x.id===p.kitId);
          if(!k) return;
          list += `<div class="plan-chip">
              <div>
                <div class="title">${k.title}</div>
                <div class="meta">${k.yearLevel} · ${k.strand}</div>
              </div>
              <div class="flex items-center gap-1">
                <button class="btn-secondary text-xs" data-action="remove" data-kit="${k.id}" data-y="${y}" data-i="${h.index}">Remove</button>
              </div>
            </div>`;
        });

        slot.innerHTML = `<div class="text-sm"><span class="font-medium">${h.label}</span> · ${formatDate(h.start)} to ${formatDate(h.end)}</div>${list || '<div class="text-sm text-base-500 mt-1">Empty</div>'}`;

        slot.addEventListener("click", () => {
          state.selectedSlot = { year: y, blockIndex: h.index, label: h.label, start: h.start, end: h.end };
          highlightSelected(y, h.index);
          renderSidePanel();
        });

        termCard.appendChild(slot);
      });
      grid.appendChild(termCard);
    }
  });

  // remove buttons
  grid.querySelectorAll("button[data-action='remove']").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const kitId = btn.getAttribute("data-kit");
      const y = parseInt(btn.getAttribute("data-y"));
      const i = parseInt(btn.getAttribute("data-i"));
      const idx = state.plan.findIndex(p => p.kitId===kitId && p.year==y && p.blockIndex==i);
      if(idx>=0){ state.plan.splice(idx,1); renderPlanner(); renderConfirm(); renderSidePanel(); }
    });
  });
}

function highlightSelected(y, i){
  document.querySelectorAll(".half-slot").forEach(el => {
    const yy = parseInt(el.dataset.year || "0");
    const ii = parseInt(el.dataset.blockIndex || "0");
    el.dataset.active = (yy===y && ii===i) ? "true" : "false";
  });
}

function renderSidePanel(){
  const info = document.getElementById("side-selected");
  const list = document.getElementById("side-kits");
  if(!info || !list) return;
  list.innerHTML = "";
  if(!state.selectedSlot){ info.textContent = "Pick a half term slot"; return; }
  const {year, blockIndex, label, start, end} = state.selectedSlot;
  info.textContent = `${year} ${label} · ${formatDate(start)} to ${formatDate(end)}`;

  const rows = (window.DEMO_DATA?.kits || []).map(k => {
    const slot = (((window.DEMO_DATA?.availability || {})[k.id] || {})[String(year)] || [])[blockIndex];
    if(!slot || slot.status!=="available") return null;
    const img = k.imageUrl
      ? `<img src="${k.imageUrl}" alt="" data-action="details" data-id="${k.id}" style="width:44px;height:44px;object-fit:cover;border-radius:.5rem;background:var(--base-100)">`
      : `<div class="w-11 h-11 rounded bg-base-100 flex items-center justify-center font-semibold" data-action="details" data-id="${k.id}">${k.thumb}</div>`;
    return `<div class="kit-row">
      ${img}
      <div class="flex-1 min-w-0">
        <div class="truncate font-medium">${k.title}</div>
        <div class="text-xs text-base-600">${k.yearLevel} · ${k.strand}</div>
        <div class="text-xs text-base-500 rating mt-0.5">${renderStars(k.ratingAvg)} <span class="ml-1">${k.ratingAvg} (${k.ratingCount})</span></div>
      </div>
      <div class="flex items-center gap-1">
        <button class="btn-secondary text-xs" data-action="details" data-id="${k.id}">Info</button>
        <button class="btn-primary text-xs" data-action="add" data-id="${k.id}">Add</button>
      </div>
    </div>`;
  }).filter(Boolean).join("");

  list.innerHTML = rows || '<div class="text-base-600 text-sm">No kits available for this slot.</div>';

  list.querySelectorAll("button[data-action='add']").forEach(btn => {
    btn.addEventListener("click", () => {
      const kitId = btn.getAttribute("data-id");
      if(!state.selectedSlot) return;
      const exists = state.plan.find(p => p.kitId===kitId && p.year==state.selectedSlot.year && p.blockIndex==state.selectedSlot.blockIndex);
      if(!exists){
        state.plan.push({ kitId, year: state.selectedSlot.year, blockIndex: state.selectedSlot.blockIndex });
        renderPlanner();
        renderConfirm();
        renderSidePanel();
      }
    });
  });
  list.querySelectorAll("[data-action='details']").forEach(el => {
    el.addEventListener("click", () => openKitModal(el.getAttribute("data-id")));
  });
}

/* ---------------- Confirm ---------------- */
function renderConfirm(){
  const school = document.getElementById("confirm-school");
  const contact = document.getElementById("confirm-contact");
  const email = document.getElementById("confirm-email");
  const addr = document.getElementById("confirm-address");
  if(school) school.value = state.user.school || "";
  if(contact) contact.value = state.user.contact || "";
  if(email) email.value = state.user.email || "";
  if(addr) addr.value = state.user.address || "";

  const wrap = document.getElementById("confirm-bookings");
  if(!wrap) return;
  wrap.innerHTML = "";
  const items = state.plan.slice().sort((a,b) => (a.year-b.year) || (a.blockIndex-b.blockIndex));
  if(items.length===0){
    wrap.innerHTML = `<div class="text-base-600">No bookings yet. Add some from the Year planner.</div>`;
    return;
  }
  items.forEach(p => {
    const blk = (window.DEMO_DATA.blocksByYear[p.year] || [])[p.blockIndex];
    const k = (window.DEMO_DATA.kits || []).find(x => x.id===p.kitId);
    if(!blk || !k) return;
    const row = document.createElement("div");
    row.className = "py-2 flex items-center justify-between";
    row.innerHTML = `<div>
      <div class="font-medium">${k.title} <span class="text-base-500">(${k.id})</span></div>
      <div class="text-sm text-base-600">${formatDate(blk.start)} to ${formatDate(blk.end)} · ${k.yearLevel} · ${k.strand}</div>
    </div>
    <div class="text-sm">${p.year} ${blk.label}</div>`;
    wrap.appendChild(row);
  });
}

/* ---------------- Helpers ---------------- */
function formatDate(iso){
  const d = new Date(iso+"T12:00:00");
  return d.toLocaleDateString(undefined, { day:"numeric", month:"short", year:"numeric" });
}

window.addEventListener("DOMContentLoaded", init);
