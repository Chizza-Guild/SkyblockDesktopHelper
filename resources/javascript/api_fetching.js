// If you are going to fetch any API, do it in this file.
// The main goal is to keep all requests grouped and clear so we don't send a lot of requests at once.

let fetchPlayerInterval;
let fetchItemInterval;

let fetchPlayerLastRefresh;
let fetchItemLastRefresh;

async function fetchPlayerData() {
	// Player data fetching: Every 15 minutes
	if (fetchPlayerInterval) return;
	fetchPlayerInterval = setInterval(
		() => {
			console.log("fetch player data ran");
		},
		1000 * 60 * 15,
	); // 1000ms * 60 seconds * 15 minutes
}

async function fetchItemPrices() {
	// Item price fetching: Every 5 minutes

	async function inside() {
		console.log("fetch item prices function ran");
		fetchAllItems();
		fetchItemLastRefresh = getCurrentLocalTime();
	}

	if (!fetchItemInterval) await inside();
    
	loadTrackedItems();
	checkAllTrackedPrices();
	if (currentPage == "itemTracker") document.getElementById("itemTrackerLastRefresh").innerText = "Last Refresh: " + fetchItemLastRefresh;

	if (fetchItemInterval) return;

	fetchItemInterval = setInterval(
		() => {
			inside();
		},
		1000 * 60 * 5,
	); // 1000ms * 60 seconds * 5 minutes
}

async function getProfiles(uuid) {
	const res = await fetch(`https://api.hypixel.net/v2/skyblock/profiles?key=${apiKeyVar}&uuid=${uuid}`);
	const data = await res.json();

	if (!data.success) {
		alert("Invalid API key!");
		renderPage("settings");
	} else {
		await increaseApiUsage();
	}

	return data;
}

async function getPlayerUuid(playerName) {
	try {
		const response = await fetch(CoflnetUrl + "/search/player/" + encodeURIComponent(playerName));
		const players = await response.json();
		const output = players[0].uuid;

		db.run("UPDATE user_info SET uuid = ? WHERE id = 1", [output]);
		await saveDb();

		return output;
	} catch (error) {
		alert(error);
	}
}

async function increaseApiUsage() {
	// Since the Hypixel API is limited to 5000 uses, keeping track of them is an advantage
	try {
		db.run("UPDATE user_info SET apiKeyUseAmount = COALESCE(apiKeyUseAmount, 0) + 1 WHERE ID = 1;");
		await saveDb();
		apiKeyUseAmountVar++;
		if (currentPage == "settings") document.getElementById("apiKeyUsageCount").innerText = `${apiKeyUseAmountVar || 0}/5000`;
	} catch (error) {
		alert(error);
	}
}
