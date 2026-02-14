/*
  Minion Profit + Cost Calculator (Neutralino + Hypixel Bazaar)

  Fixes in this version:
  - Prevents crashes when minion name doesn't match JSON (safe lookups + alias mapping)
  - Robust cost parsing supports:
      "80_COBBLESTONE"
      "64_RAW_COD+1_FISHING_ROD"
      "512_ENCHANTED_RED_MUSHROOM&512_ENCHANTED_BROWN_MUSHROOM"
      "SAND:1" style ids
      "BOUGHT_FROM_MARKET" / upgrade-stone placeholders (skips safely)
  - Safe bazaar price reads (handles missing products)
  - Profit supports multiple drops (sums expected value)
  - Supercompactor + double compactor handled per drop when data exists
  - Tier validation + missing tier fallback (uses closest lower tier)

  NOTE: This still uses "buyPrice" like you did (cost to buy instantly).
*/

let bzData = null;
let minionData = null;

// ---------- Helpers ----------
function safeNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

// Splits "amount_ITEM_ID" into {amount, itemId}, supports ids containing underscores + ":meta"
function parseCostString(costStr) {
  if (!costStr || typeof costStr !== "string") return null;

  const firstUnderscore = costStr.indexOf("_");
  if (firstUnderscore <= 0) return null;

  const amountStr = costStr.slice(0, firstUnderscore);
  const itemId = costStr.slice(firstUnderscore + 1);

  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!itemId) return null;

  return { amount, itemId };
}

// Supports compound strings like:
// "64_RAW_COD+1_FISHING_ROD" (sum)
// "512_A&512_B" (sum)
// Returns array of {amount, itemId}
function parseMultiCost(costValue) {
  if (!costValue || typeof costValue !== "string") return [];

  const trimmed = costValue.trim();
  if (!trimmed) return [];

  // placeholders that aren't bazaar items
  const BAD = [
    "BOUGHT_FROM_MARKET",
    "FISHING_MINION_XII_UPGRADE_STONE",
    "FISHING_MINION_XII_UPGRADE_STONE",
  ];
  if (BAD.includes(trimmed)) return [];

  // split on + or &
  const parts = trimmed.split(/[+&]/g).map(s => s.trim()).filter(Boolean);

  const out = [];
  for (const p of parts) {
    const parsed = parseCostString(p);
    if (parsed) out.push(parsed);
  }
  return out;
}

function getBazaarBuyPrice(itemId) {
  // bzData comes from /v2/skyblock/bazaar
  // structure: { products: { ITEM_ID: { quick_status: { buyPrice, sellPrice } } } }
  if (!bzData || !bzData.products) return null;
  const prod = bzData.products[itemId];
  if (!prod || !prod.quick_status) return null;

  const price = Number(prod.quick_status.buyPrice);
  return Number.isFinite(price) ? price : null;
}

// Your UI values don't always match JSON names (Endstone vs End Stone, etc.)
function toJsonMinionName(input) {
  let s = String(input || "").trim();

  const alias = {
    "Endstone": "End Stone",
    "Nether wart": "Netherwart",
    "Cocoa Bean": "Cocoa Beans",
    "Redstone": "Redstone",
    "End Stone": "End Stone",
    "Cave Spider": "Cave Spider",
    "Magma Cube": "Magma Cube",
    "Sugar Cane": "Sugar Cane",
    "Red Sand": "Red Sand",
    "Dark Oak": "Dark Oak",
    "Oak": "Oak",
    "Spruce": "Spruce",
    "Birch": "Birch",
    "Jungle": "Jungle",
    "Acacia": "Acacia",
    // add more if needed
  };

  if (alias[s]) s = alias[s];

  // If user already typed "Minion", don't double it
  if (!/minion$/i.test(s)) s = s + " Minion";

  return s;
}

function findMinionByName(name) {
  if (!Array.isArray(minionData)) return null;
  for (const m of minionData) {
    if (m && m.name === name) return m;
  }
  return null;
}

function clampTier(tier, maxTier) {
  let t = Math.floor(safeNumber(tier, 1));
  if (t < 1) t = 1;
  if (Number.isFinite(maxTier) && maxTier > 0 && t > maxTier) t = maxTier;
  return t;
}

// If requested tier doesn't exist (ex: asking tier_12 for an 11-tier minion),
// walk downward until we find an existing speed.
function getSpeedForTier(minion, tier) {
  if (!minion || !minion.speeds) return null;

  for (let t = tier; t >= 1; t--) {
    const v = minion.speeds[`tier_${t}`];
    if (v != null && Number.isFinite(Number(v))) return Number(v);
  }
  return null;
}

// Parses a drop string like "ITEM~amount~chance"
function parseDrop(dropStr) {
  if (!dropStr || typeof dropStr !== "string") return null;
  const parts = dropStr.split("~").map(s => s.trim());
  if (parts.length < 3) return null;

  const itemId = parts[0];
  const amount = safeNumber(parts[1], 0);
  const chance = safeNumber(parts[2], 0);

  if (!itemId || amount <= 0 || chance <= 0) return null;
  return { itemId, amount, chance }; // chance in %
}

// For compacted strings like "ENCHANTED_COBBLESTONE~160" (no chance in your JSON)
function parseCompacted(compStr) {
  if (!compStr || typeof compStr !== "string") return null;
  const parts = compStr.split("~").map(s => s.trim());
  if (parts.length < 2) return null;

  const itemId = parts[0];
  const amount = safeNumber(parts[1], 0);
  if (!itemId || amount <= 0) return null;

  return { itemId, amount };
}


async function initMinionData() {
  const filePath = NL_PATH + "/resources/json/minionData.json";

  const fileContents = await Neutralino.filesystem.readFile(filePath);
  minionData = JSON.parse(fileContents);
}

// ---------- Init ----------
async function initMinionCalc() {

  await initMinionData();

  const response = await fetch("https://api.hypixel.net/v2/skyblock/bazaar");
  if (!response.ok) {
    console.error("Failed to fetch bazaar data:", response.status, response.statusText);
    return;
  }
  bzData = await response.json();
}

// Call once at startup if you want
async function startMinionCalc() {
  await initMinionCalc();
}

// ---------- Cost ----------
function CalculateMinionCost(name, tier) {
  const m = findMinionByName(name);
  if (!m) {
    console.error("Minion not found:", name);
    return null;
  }

  const maxTier = safeNumber(m.tiers, 12);
  tier = clampTier(tier, maxTier);

  if (!m.craftCost || typeof m.craftCost !== "object") {
    console.error("Missing craftCost for:", name);
    return null;
  }

  let totalCost = 0;

  // go tier_1..tier_N in order
  for (let t = 1; t <= tier; t++) {
    const key = `tier_${t}`;
    const costValue = m.craftCost[key];

    // Tier 12 sometimes has a coin cost in your JSON
    if (t === 12) {
      totalCost += safeNumber(m.tier_12_cost_coins, 0);
    }

    if (!costValue) continue;

    const parts = parseMultiCost(costValue);
    for (const p of parts) {
      const price = getBazaarBuyPrice(p.itemId);
      if (price == null) {
        // not in bazaar, skip (or you could handle npc prices here)
        console.warn("No bazaar price for:", p.itemId, "in", name, key);
        continue;
      }
      totalCost += price * p.amount;
    }
  }

  return totalCost;
}

// ---------- Profit ----------
function minionProfit(name, tier) {
  const m = findMinionByName(name);
  if (!m) {
    console.error("Minion not found (name mismatch):", name);
    return 0;
  }

  const maxTier = safeNumber(m.tiers, 12);
  tier = clampTier(tier, maxTier);

  const speed = getSpeedForTier(m, tier);
  if (!speed || speed <= 0) {
    console.error("Missing/invalid speed for:", name, "tier", tier, m.speeds);
    return 0;
  }

  if (!m.drops || typeof m.drops !== "object") {
    console.error("Missing drops for:", name);
    return 0;
  }

  // Expected value per action = sum over drops:
  //   P(drop) * amountProducedPerAction * pricePerUnit
  // Then divide by 2 to account for "place then break" (your assumption)
  let valuePerAction = 0;

  for (const dropKey of Object.keys(m.drops)) {
    const dropStr = m.drops[dropKey];
    const base = parseDrop(dropStr);
    if (!base) continue;

    const chanceFrac = base.chance / 100;

    // default: base item
    let unitPrice = getBazaarBuyPrice(base.itemId);
    let producedUnits = base.amount;

    if (m.supercompactable) {
      // Try compacted mapping for THIS dropKey if it exists
      const comp = m.dropsCompacted && m.dropsCompacted[dropKey]
        ? parseCompacted(m.dropsCompacted[dropKey])
        : null;

      const dcomp = m.dropsDoubleCompacted && m.dropsDoubleCompacted[dropKey]
        ? parseCompacted(m.dropsDoubleCompacted[dropKey])
        : null;

      // Prefer double compacted if present
      if (dcomp) {
        const p = getBazaarBuyPrice(dcomp.itemId);
        if (p != null) {
          unitPrice = p;
          // If 1 action gives producedUnits base items,
          // double compact converts: base -> enchanted (comp.amount), then enchanted -> double (dcomp.amount)
          // So price per base item = priceDouble / (comp.amount * dcomp.amount)
          const compAmount = comp ? comp.amount : 1;
          producedUnits = producedUnits / (compAmount * dcomp.amount);
        }
      } else if (comp) {
        const p = getBazaarBuyPrice(comp.itemId);
        if (p != null) {
          unitPrice = p;
          producedUnits = producedUnits / comp.amount;
        }
      }
    }

    if (unitPrice == null) {
      console.warn("No bazaar price for drop:", base.itemId, "in", name, dropKey);
      continue;
    }

    valuePerAction += chanceFrac * producedUnits * unitPrice;
  }

  valuePerAction /= 2; // your "place then break" assumption

  const secondsPerDay = 24 * 60 * 60;
  const actionsPerDay = secondsPerDay / speed;

  return actionsPerDay * valuePerAction;
}

// ---------- Main UI ----------
async function minionProfitCalculatorMain() {
  // Ensure data is loaded
  if (!minionData || !bzData) {
    await initMinionCalc();
  }

  const raw = document.getElementById("minion").value;
  const name = toJsonMinionName(raw);

  const tier = Number(document.getElementById("tierInput").value);

  console.log("Looking up:", name, "Found:", findMinionByName(name));

  const cost = CalculateMinionCost(name, tier);
  const profitPerDay = minionProfit(name, tier);

  const costEl = document.getElementById("minionCost");
  if (costEl) {
    costEl.textContent =
      typeof cost === "number" && Number.isFinite(cost)
        ? `Cost: ${cost.toLocaleString()} coins`
        : "Cost: N/A";
  }

  console.log("Profit/day:", profitPerDay);
}
