

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

function CalculateMinionCost(name, tier) {
    
}