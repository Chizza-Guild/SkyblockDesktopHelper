// ===================== CONFIG =====================
const SUPABASE_URL = "https://qrhswmwyccpzgjbjwrpz.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyaHN3bXd5Y2NwemdqYmp3cnB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMTIwNjAsImV4cCI6MjA4MjY4ODA2MH0.f1MRqXZ030OAZrdJsKm4N04gEEdKTxi9IgHVap6a4p0";

// Table name (URL-encoded because it contains a space)
const TABLE = encodeURIComponent("Minion Market");



// ===================== UI STATUS =====================
function setStatus(msg, isError = false) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = isError ? "#ffb3b3" : "#c8ffc8";
}

// ===================== HTML ESCAPE =====================
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===================== REST HELPER =====================
async function supabaseRequest(
  path,
  { method = "GET", body, prefer = "return=representation" } = {}
) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;

  const headers = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: prefer,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.error("Supabase error:", { method, url, status: res.status, data });
    throw new Error(`${method} ${url} -> ${res.status}\n${text}`);
  }

  return data;
}

// ===================== QUERIES =====================
async function fetchActiveListings() {
  const nowIso = new Date().toISOString();

  // IMPORTANT: no created_at ordering (400 if column doesn't exist)
  const query =
    `select=*` +
    `&status=eq.active` +
    `&or=(ends_at.is.null,ends_at.gt.${encodeURIComponent(nowIso)})` +
    `&order=id.desc`;

  return await supabaseRequest(`${TABLE}?${query}`);
}

async function fetchListingById(id) {
  const safeId = String(id ?? "").trim();
  if (!safeId) throw new Error("Missing listing id.");

  const query =
    `select=id,minion_Id,minion_id,minion_name,tier,sell_price,quantity,orders,status,minion_data,ends_at,seller_id,seller_name` +
    `&id=eq.${encodeURIComponent(safeId)}` +
    `&limit=1`;

  const rows = await supabaseRequest(`${TABLE}?${query}`);
  return Array.isArray(rows) ? rows[0] : null;
}

// ===================== CREATE LISTING =====================
async function createListing() {
  setStatus("Submitting listing...");

  const minionIdEl = document.getElementById("minion_Id");
  const tierEl = document.getElementById("tier");
  const priceEl = document.getElementById("price_per_unit");
  const qtyEl = document.getElementById("quantity");
  const mithEl = document.getElementById("mithrilInfused");
  const freeEl = document.getElementById("freeWilled");

  const minionId = String(minionIdEl?.value ?? "").trim();
  const tier = Number(tierEl?.value);
  const price = Number(priceEl?.value);
  const quantity = Number(qtyEl?.value);

  // HARD validation (prevents bigint/typing crashes)
  if (!minionId) return setStatus("Minion ID required", true);
  if (!Number.isInteger(tier)) return setStatus("Tier must be a whole number", true);
  if (!Number.isInteger(price)) return setStatus("Price must be a whole number", true);
  if (!Number.isInteger(quantity)) return setStatus("Quantity must be a whole number", true);
  if (tier <= 0) return setStatus("Tier must be > 0", true);
  if (price < 0) return setStatus("Price must be >= 0", true);
  if (quantity <= 0) return setStatus("Quantity must be > 0", true);

  // NOTE: discordIdVar/playerNameVar assumed to exist globally in your page
  const sellerIdNum = Number(discordIdVar);
  if (!Number.isFinite(sellerIdNum) || !Number.isInteger(sellerIdNum)) {
    return setStatus("seller_id (discordIdVar) must be a valid whole number", true);
  }

  const row = {
    minion_Id: minionId, // text
    tier: tier, // int8
    sell_price: price, // int8
    quantity: quantity, // int8
    ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    seller_id: sellerIdNum,
    seller_name: playerNameVar ?? "",
    status: "active",
    minion_data: {
      mithrilInfused: !!mithEl?.checked,
      freeWilled: !!freeEl?.checked,
    },
    orders: [], // json
  };

  try {
    const inserted = await supabaseRequest(`${TABLE}`, { method: "POST", body: row });
    console.log("Inserted row:", inserted);

    setStatus("Listing created!");
    await refreshListings();
  } catch (e) {
    console.error(e);
    setStatus("Insert failed — check console", true);
    alert(e.message);
  }
}

// ===================== DELETE LISTING =====================
async function deleteListing(id) {
  try {
    setStatus("Deleting listing...");

    const safeId = String(id ?? "").trim();
    if (!safeId) return setStatus("Missing listing id", true);

    await supabaseRequest(`${TABLE}?id=eq.${encodeURIComponent(safeId)}`, {
      method: "DELETE",
      prefer: "return=minimal",
    });

    setStatus("Listing deleted!");
    await refreshListings();
  } catch (e) {
    console.error("deleteListing failed:", e);
    setStatus(`Delete failed: ${e.message}`, true);
    alert(e.message);
  }
}

// ===================== BUY LISTING =====================
async function buyListing(id) {
  try {
    const safeId = String(id ?? "").trim();
    if (!safeId) throw new Error("Missing listing id.");

    const qtyStr = prompt("Enter quantity to buy:", "1");
    const qty = Number(qtyStr);

    if (!Number.isInteger(qty) || qty <= 0) {
      setStatus("Quantity must be a positive whole number.", true);
      return;
    }

    setStatus("Processing purchase...");

    // Fetch ONLY this listing (fixes the 'id as array index' bug)
    const listing = await fetchListingById(safeId);
    if (!listing) throw new Error("Listing not found.");

    if (listing.status && listing.status !== "active") {
      setStatus("This listing is not active.", true);
      return;
    }

    const available = Number(listing.quantity);
    if (!Number.isFinite(available) || available <= 0) {
      setStatus("This listing is sold out.", true);
      return;
    }

    if (qty > available) {
      setStatus(`Not enough stock. Available: ${available}`, true);
      return;
    }

    const existingOrders = Array.isArray(listing.orders) ? listing.orders : [];

    const newOrder = {
      buyer_name: playerNameVar ?? "",
      buyer_discord: String(discordIdVar ?? ""),
      quantity: qty,
      price_per_unit: Number(listing.sell_price ?? 0),
      bought_at: new Date().toISOString(),
    };

    const newQty = available - qty;

    const patchBody = {
      orders: [...existingOrders, newOrder],
      quantity: newQty,
      status: newQty === 0 ? "sold" : "active",
    };

    await supabaseRequest(`${TABLE}?id=eq.${encodeURIComponent(safeId)}`, {
      method: "PATCH",
      body: patchBody,
    });

    setStatus("Purchase successful!");
    await refreshListings();
  } catch (e) {
    console.error("buyListing failed:", e);
    setStatus(`Purchase failed: ${e.message}`, true);
    alert(e.message);
  }
}

// ===================== DISPLAY HELPERS =====================
async function setMaxTier() {
  let minion_Id = toJsonMinionName(document.getElementById("minion_Id").value);
  let maxTier = minionData["minion_Id"].maxTier;

  if (tier > maxTier || tier < 1) {
    alert('Invalid tier for this minion!');
    return;
  }

  document.getElementById("tier").max = maxTier;
}

function formatCoins(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "b";
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "m";
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(Math.floor(num));
}

function listingCardHTML(row) {
  const id = String(row.id ?? "");
  const name = row.minion_name || row.minion_Id || row.minion_id || "Minion";
  const tier = row.tier ?? "?";
  const price = formatCoins(row.sell_price);
  const qty = row.quantity ?? 1;

  const infused = row.minion_data?.mithrilInfused ? " (Infused)" : "";
  const free = row.minion_data?.freeWilled ? " (Free-Willed)" : "";

  const disabled = !id;

  return `
    <div style="background:#c2c2c2;border:1px solid #2a2a2a;border-radius:12px;padding:14px;color:#070707;">
      <h3 style="margin:0 0 6px;font-size:16px;">${esc(name)}</h3>
      <p style="margin:0;font-size:13px;">
        Tier ${esc(tier)} | Price: ${esc(price)} | Qty: ${esc(qty)}${esc(infused)}${esc(free)}
      </p>

      <div style="display:flex;gap:10px;margin-top:12px;">
        <button
          style="flex:1;padding:10px;border-radius:10px;border:1px solid #2a2a2a;background:${disabled ? "#444" : "#161616"};color:#fff;cursor:${disabled ? "not-allowed" : "pointer"};opacity:${disabled ? "0.6" : "1"};"
          ${disabled ? "disabled" : `onclick="buyListing('${esc(id)}')"`}
        >Buy</button>

        <button
          style="width:44px;padding:10px;border-radius:10px;border:1px solid #2a2a2a;background:${disabled ? "#6b3a3a" : "#4a1f1f"};color:#fff;cursor:${disabled ? "not-allowed" : "pointer"};opacity:${disabled ? "0.6" : "1"};"
          ${disabled ? "disabled" : `onclick="deleteListing('${esc(id)}')"`}
          title="Delete listing"
        >✕</button>
      </div>
    </div>
  `;
}

function renderListingsGrid(rows) {
  const el = document.getElementById("listings");
  if (!el) {
    console.error('Missing container: <div id="listings"></div>');
    return;
  }

  el.style.display = "grid";
  el.style.gridTemplateColumns = "repeat(auto-fill, minmax(240px, 1fr))";
  el.style.gap = "12px";
  el.style.alignItems = "start";
  el.style.width = "100%";
  el.style.maxWidth = "100%";

  if (!rows || rows.length === 0) {
    el.innerHTML = `<div style="opacity:.8;">No active listings.</div>`;
    return;
  }

  el.innerHTML = rows.map(listingCardHTML).join("");
}

// ===================== REFRESH =====================
async function refreshListings() {
  const el = document.getElementById("listings");
  try {
    setStatus("Loading listings...");
    if (el) el.innerHTML = `<div style="opacity:.8;">Loading listings...</div>`;

    const rows = await fetchActiveListings();
    renderListingsGrid(rows);

    setStatus(`Loaded ${rows?.length ?? 0} listing(s).`);
  } catch (e) {
    console.error(e);
    setStatus(
      "Failed to load listings. Open Console for details (likely RLS or bad column names).",
      true
    );
    if (el) el.innerHTML = `<div style="color:#ffb3b3;">Failed to load listings.</div>`;
  }
}
