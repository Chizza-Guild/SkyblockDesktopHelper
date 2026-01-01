const SUPABASE_URL = "https://qrhswmwyccpzgjbjwrpz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaHN3bXd5Y2NwemdqYmp3cnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTIwNjAsImV4cCI6MjA4MjY4ODA2MH0.f1MRqXZ030OAZrdJsKm4N04gEEdKTxi9IgHVap6a4p0";

// IMPORTANT: table name has a space -> encode it
const TABLE = encodeURIComponent("Minion Market");

// ---------- Supabase REST helper ----------
async function sbRequest(path, { method = "GET", body } = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status}\n${text}`);
  return data;
}

// ---------- Queries ----------
async function fetchActiveListings() {
  const nowIso = new Date().toISOString();

  const query =
    `select=*&status=eq.active&or=(ends_at.is.null,ends_at.gt.${encodeURIComponent(nowIso)})&order=created_at.desc`;

  return await sbRequest(`${TABLE}?${query}`);
}

async function createListing() {
  const row = {
    minion_Id: "COBBLESTONE", // keep exact casing if that's your real column name
    tier: 12,
    sell_price: 2500000,
    quantity: 1,
    ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    seller_id: discordIdVar,
    seller_name: "RyRyGuy",
    status: "active",
    minion_data: { mithrilInfused: false, freeWilled: false },
    orders: []
  };

  const inserted = await sbRequest(`${TABLE}`, { method: "POST", body: row });
  await refreshListings();
  return inserted[0] ?? null;
}

async function deleteListing(id) {
  await sbRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
  await refreshListings();
}

// ---------- UI helpers ----------
function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCoins(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "b";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "m";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(Math.floor(num));
}

// Create one card's HTML
function listingCardHTML(row) {
  const name = row.minion_name || row.minion_Id || row.minion_id || "Minion";
  const tier = row.tier ?? "?";
  const price = formatCoins(row.sell_price);
  const qty = row.quantity ?? 1;

  const infused = row.minion_data?.mithrilInfused ? " (Infused)" : "";
  const free = row.minion_data?.freeWilled ? " (Free-Willed)" : "";

  return `
    <div
      class="card"
      style="
        background: #c2c2c2;
        border: 1px solid #2a2a2a;
        border-radius: 12px;
        padding: 14px;
        color: #070707;
      "
    >
      <h3 style="margin: 0 0 6px; font-size: 16px;">
        ${esc(name)}
      </h3>

      <p style="margin: 0; font-size: 13px;">
        Tier ${esc(tier)} | Price: ${esc(price)} | Qty: ${esc(qty)}${esc(infused)}${esc(free)}
      </p>

      <div style="display:flex; gap:10px; margin-top:12px;">
        <button
          style="
            flex: 1;
            padding: 10px;
            border-radius: 10px;
            border: 1px solid #2a2a2a;
            background: #161616;
            color: #ffffff;
            cursor: pointer;
          "
          onclick="buyListing(${Number(row.id)})"
        >
          Buy
        </button>

        <button
          style="
            width: 44px;
            padding: 10px;
            border-radius: 10px;
            border: 1px solid #2a2a2a;
            background: #4a1f1f;
            color: #ffffff;
            cursor: pointer;
          "
          onclick="deleteListing(${Number(row.id)})"
          title="Delete listing"
        >
          ✕
        </button>
      </div>
    </div>
  `;
}

// Render grid into #listings
function renderListingsGrid(rows) {
  const el = document.getElementById("listings");
  if (!el) {
    console.error('Missing container: <div id="listings"></div>');
    return;
  }

  // grid layout
  el.style.display = "grid";
  el.style.gridTemplateColumns = "repeat(auto-fill, minmax(240px, 1fr))";
  el.style.gap = "12px";
  el.style.alignItems = "start";

  if (!rows || rows.length === 0) {
    el.innerHTML = `<div style="opacity:.8;">No active listings.</div>`;
    return;
  }

  el.innerHTML = rows.map(listingCardHTML).join("");
}

// Fetch + render
async function refreshListings() {
  try {
    const rows = await fetchActiveListings();
    renderListingsGrid(rows);
  } catch (e) {
    console.error(e);
    const el = document.getElementById("listings");
    if (el) el.innerHTML = `<div style="color:#ffb3b3;">Failed to load listings (check RLS / table name).</div>`;
  }
}

// Example buy handler (replace with your real flow)
async function buyListing(id) {
  // simplest: mark as sold
  try {
    await sbRequest(`${TABLE}?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: { status: "sold" },
    });
    await refreshListings();
  } catch (e) {
    console.error("buyListing failed:", e);
  }
}

// Call once on app start
// refreshListings();
