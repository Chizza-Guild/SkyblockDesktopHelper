
let bzData;
let minionData;
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
async function initMinionCalc() {
  const filePath = NL_PATH + "/resources/json/minionData.json";

  const fileContents = await Neutralino.filesystem.readFile(filePath);
  minionData = JSON.parse(fileContents);

  let response = await fetch("https://api.hypixel.net/v2/skyblock/bazaar");

  if (!response.ok) {
		console.error("Failed to fetch items from API");
		return;
	}

	const items = await response.json();


  bzData = items;
}

/* 
  for (const minion of minionData) {
    console.log("Minion:", minion.name);

    for (const [tier, speed] of Object.entries(minion.speeds)) {
      console.log(" ", tier, "->", speed);
    }

    for (const drop of Object.values(minion.drops)) {
      const [item, amount, chance] = drop.split("~");
      console.log(" Drop:", item, amount, chance);
    }
  }

*/
function CalculateMinionCost(name, tier) {
  let singleMinionData = null;

  // Find minion by name
  for (const minion of minionData) {
    if (minion.name === name) {
      singleMinionData = minion;
      break;
    }
  }

  if (!singleMinionData) {
    console.error("Minion not found:", name);
    return;
  }

  // Loop speeds
  let totalCost = 0;
  for (const [tierKey, cost] of Object.entries(singleMinionData.craftCost)) {
    let tierCost = 0;

    const tierNumber = Number(tierKey.split("_")[1]);

    if (tierNumber > tier) {
      continue; // incase its not in order
    }

    if (tierNumber == 12) {
      tierCost += Number(singleMinionData.tier_12_cost_coins);
     
    }

    const value = cost;

    const parts = value.split("_"); 
    const amount = Number(parts[0]); 
    console.log(amount);//1024
    const itemName = parts.slice(1).join("_"); // ech cobble

    let itemCost = bzData.products[itemName].quick_status.buyPrice;
    console.log(itemCost);
    tierCost += itemCost * amount;
    totalCost += tierCost;

  }
  console.log(totalCost);
  return totalCost;
}

async function minionProfitCalculatorMain() {
  await initMinionCalc();

  const name = document.getElementById("minion").value + " Minion"; // EXACT match
  const tier = Number(document.getElementById("tierInput").value);

  const cost = CalculateMinionCost(name, tier);

  const costEl = document.getElementById("minionCost");
  if (!costEl) {
    console.error("Missing element id=minionCost");
    return;
  }

  costEl.textContent =
    typeof cost === "number" && Number.isFinite(cost)
      ? cost.toLocaleString()
      : "N/A";
}
