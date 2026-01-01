// ==============================
// Neutralino + Hypixel Minion Calc
// Coins/hour + Skill XP/hour + Craft Cost (Bazaar)
// ==============================

async function loadMinionData() {
  const path = `${NL_PATH}/resources/json/minionData.json`;
  const txt = await Neutralino.filesystem.readFile(path);
  return JSON.parse(txt);
}

async function fetchBazaarData() {
  const resp = await fetch("https://api.hypixel.net/v2/skyblock/bazaar");
  const data = await resp.json();
  return data;
}

/** Generic: value per hour given value per action and seconds per action */
function getHourlyValue(perAction, secondsPerAction) {
  const s = Number(secondsPerAction);
  const v = Number(perAction);

  if (!Number.isFinite(s) || s <= 0) return 0;
  if (!Number.isFinite(v) || v <= 0) return 0;

  return v * (3600 / s);
}

/**
 * skillExp format:
 *   "skillExp": { "item_1": "0.4_MINING", ... }
 * Returns:
 *   { skillType, skillXpPerAction }
 */
function getSkillExpPerAction(minion) {
  const skillExp = minion?.skillExp ?? {};
  let totalXpPerAction = 0;
  let skillType = null;

  for (const key of Object.keys(skillExp)) {
    const expStr = skillExp[key];
    if (!expStr) continue;

    const [xpStr, type] = expStr.split("_");
    const xp = Number(xpStr);

    if (!Number.isFinite(xp) || xp <= 0) continue;

    totalXpPerAction += xp;
    if (!skillType && type) skillType = type;
  }

  return { skillType, skillXpPerAction: totalXpPerAction };
}

/**
 * Calculates expected coins per action for a minion.
 * Uses dropsCompacted when present for each item_n key:
 *   drops:          "BASE_ID~AMOUNT~RARITY%"
 *   dropsCompacted: "ENCHANTED_ID~BASE_REQUIRED"
 */
function getAverageProfitForItemsPerAction(minion, bzData) {
  let totalCoinsPerAction = 0;

  const drops = minion?.drops ?? {};
  const compacted = minion?.dropsCompacted ?? null;

  for (const key of Object.keys(drops)) {
    const dropStr = drops[key];
    if (!dropStr) continue;

    const [baseItem, amountStr, rarityStr] = dropStr.split("~");
    const amount = Number(amountStr);
    const rarity = Number(rarityStr) / 100;

    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (!Number.isFinite(rarity) || rarity <= 0) continue;

    const compStr = compacted?.[key];

    if (compStr) {
      const [enchantedItem, regRequiredStr] = compStr.split("~");
      const regRequired = Number(regRequiredStr);
      if (!Number.isFinite(regRequired) || regRequired <= 0) continue;

      const price =
        bzData?.products?.[enchantedItem]?.quick_status?.sellPrice ?? 0;
      if (!Number.isFinite(price) || price <= 0) continue;

      const enchantedPerAction = (amount / regRequired) * rarity;
      totalCoinsPerAction += enchantedPerAction * price;
    } else {
      const price = bzData?.products?.[baseItem]?.quick_status?.sellPrice ?? 0;
      if (!Number.isFinite(price) || price <= 0) continue;

      const basePerAction = amount * rarity;
      totalCoinsPerAction += basePerAction * price;
    }
  }

  return totalCoinsPerAction;
}

/**
 * Parse craft cost strings like:
 *   "128_GLOWSTONE_DUST"
 *   "8_ENCHANTED_GLOWSTONE"
 * Returns: { amount, itemId }
 */
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

/**
 * Craft cost in coins (Bazaar) for a specific tier.
 * Uses quick_status.buyPrice as "instant buy" cost.
 * Returns:
 *   { craftCostCoins, missingItems: [{itemId, amount}] }
 */
function calculateCraftCostForTier(minion, bzData, tier = 12) {
  const tierKey = `tier_${tier}`;
  const craftCostStr = minion?.craftCost?.[tierKey];

  if (!craftCostStr) {
    return { craftCostCoins: 0, missingItems: [] };
  }

  const parsed = parseCostString(craftCostStr);
  if (!parsed) {
    return { craftCostCoins: 0, missingItems: [] };
  }

  const { amount, itemId } = parsed;

  const unitPrice = bzData?.products?.[itemId]?.quick_status?.buyPrice;
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return {
      craftCostCoins: 0,
      missingItems: [{ itemId, amount }],
    };
  }

  return {
    craftCostCoins: amount * unitPrice,
    missingItems: [],
  };
}

/**
 * Builds list of minions with:
 * - coinsPerAction, coinsPerHour
 * - skillType, skillXpPerAction, skillXpPerHour
 * - craftCostCoins (for that tier), craftCostMissing
 */
function calculateMinionProfit(minionsData, bzData, tier = 12) {
  const out = [];
  const tierKey = `tier_${tier}`;

  for (const minion of minionsData) {
    const secondsPerAction = minion?.speeds?.[tierKey];

    const coinsPerAction = getAverageProfitForItemsPerAction(minion, bzData);
    const coinsPerHour = getHourlyValue(coinsPerAction, secondsPerAction);

    const { skillType, skillXpPerAction } = getSkillExpPerAction(minion);
    const skillXpPerHour = getHourlyValue(skillXpPerAction, secondsPerAction);

    const { craftCostCoins, missingItems } = calculateCraftCostForTier(
      minion,
      bzData,
      tier
    );

    out.push({
      name: minion.name,
      tier,
      secondsPerAction: secondsPerAction ?? null,

      coinsPerAction,
      coinsPerHour,

      skillType,
      skillXpPerAction,
      skillXpPerHour,

      craftCostCoins,
      craftCostMissing: missingItems, // empty if all good
    });
  }

  // Best to worst by hourly coins
  out.sort((a, b) => (b.coinsPerHour ?? 0) - (a.coinsPerHour ?? 0));
  return out;
}

async function calculateBestBaseMinion() {
  const minionsData = await loadMinionData();
  const bzData = await fetchBazaarData();

  
  const results = calculateMinionProfit(minionsData, bzData, 12);

  console.log("Top 10 by coins/hour (tier 12):");
  console.table(
    results.slice(0, 10).map((r) => ({
      name: r.name,
      tier: r.tier,
      secondsPerAction: r.secondsPerAction,
      coinsPerHour: Math.round(r.coinsPerHour * 100) / 100,
      coinsPerAction: Math.round(r.coinsPerAction * 100000) / 100000,
      skillType: r.skillType,
      skillXpPerHour: Math.round(r.skillXpPerHour * 100) / 100,
      craftCostCoins: Math.round(r.craftCostCoins),
      missing: r.craftCostMissing?.length ? "YES" : "NO",
    }))
  );

  // If you want to see which items were missing prices:
  const missing = results.filter((r) => r.craftCostMissing?.length);
  if (missing.length) {
    console.log("Minions with missing Bazaar prices for craft cost:");
    console.log(
      missing.map((m) => ({
        name: m.name,
        missing: m.craftCostMissing,
      }))
    );
  }

  return results;
}

