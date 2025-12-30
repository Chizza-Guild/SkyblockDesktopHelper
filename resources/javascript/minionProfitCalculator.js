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

function calculateMinionProfit(minionsData, bzData) {
    const minionActionProfit = [];

    for (let i = 0; i < minionsData.length; i++) {
        const minion = minionsData[i];
        const profit = getAverageProfitForItemsPerAction(minion, bzData);

        minionActionProfit.push({
            name: minion.name,
            coinsPerAction: profit
        });
    }

    return minionActionProfit;
}

function calculatePriceForMinion(minionsData, bzData) {
    
}

function getAverageProfitForItemsPerAction(minion, bzData) {
  let totalCoinsPerAction = 0;

  const drops = minion?.drops ?? {};
  const compacted = minion?.dropsCompacted ?? null; // can be null/undefined

  // iterate keys so drops and dropsCompacted can line up by "item_1", "item_2", etc
  for (const key of Object.keys(drops)) {
    const dropStr = drops[key];
    if (!dropStr) continue;

    const [baseItem, amountStr, rarityStr] = dropStr.split("~");
    const amount = Number(amountStr);
    const rarity = Number(rarityStr) / 100;

    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (!Number.isFinite(rarity) || rarity <= 0) continue;

    // If we have a compacted mapping for this drop, use it. Otherwise use base item.
    const compStr = compacted?.[key];

    if (compStr) {
      // compStr: "ENCHANTED_ITEM_ID~REG_REQUIRED"
      const [enchantedItem, regRequiredStr] = compStr.split("~");
      const regRequired = Number(regRequiredStr);
      if (!Number.isFinite(regRequired) || regRequired <= 0) continue;

      const price = bzData?.products?.[enchantedItem]?.quick_status?.sellPrice ?? 0;
      if (!Number.isFinite(price) || price <= 0) continue;

      // expected enchanted items per action:
      // (base amount per action / base required per enchanted) * rarity chance
      const enchantedPerAction = (amount / regRequired) * rarity;

      totalCoinsPerAction += enchantedPerAction * price;
    } else {
      // fallback: treat the base item itself as the sell target
      const price = bzData?.products?.[baseItem]?.quick_status?.sellPrice ?? 0;
      if (!Number.isFinite(price) || price <= 0) continue;

      // expected base items per action = amount * rarity
      const basePerAction = amount * rarity;

      totalCoinsPerAction += basePerAction * price;
    }
  }

  return totalCoinsPerAction;
}

async function calculateBestBaseMinion() {
    // get the minion data
    // find the amount a minion generates (per action)
    // compare all minions

    const minionsData = await loadMinionData();
    const bzData = await fetchBazaarData();

    console.log(calculateMinionProfit(minionsData, bzData));




}