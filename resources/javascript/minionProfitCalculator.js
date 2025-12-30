async function loadMinionData() {
  const path = `${NL_PATH}/resources/json/minionData.json`;
  const txt = await Neutralino.filesystem.readFile(path);

  return JSON.parse(txt);
}

async function fetchBazaarData() {
    const resp = await fetch("https://api.hypixel.net/skyblock/bazaar");
    const data = resp.json();
    return data;
}

function calculateMinionProfit(minionsData, bzData) {
    for (let minion of minionsData) {
        for (let tier = 1; tier <= minion.tiers; tier++) {

            const speed = minion.speeds[`tier_${tier}`];
            getPriceForItemsPerAction(minion, bzData);
            
        }
    }

}

function calculatePriceForMinion(minionsData, bzData) {
    
}

function getAverageProfitForItemsPerAction(minion, bzData) {

    // look at base drops.
    // calculate how many actions for the enchanted versions (ex. cobble 160)
    // divide the price of the enchanted version by the amount of actions for it.
    // multiply by the rarity/100
    // loop through all the datapoints and sum up the profit per action.
    // return this value

    for (const drop of Object.values(minion.drops)) {
        const [item, amount, rarity] = drop.split("~");
        const [enchantedItem, enchantedAmount] = 

        // let actionsForEnchanted = 

        
}
}

async function calculateBestBaseMinion() {
    // get the minion data
    // find the amount a minion generates (per action)
    // compare all minions

    const minionsData = await loadMinionData();
    const bzData = await fetchBazaarData();




}