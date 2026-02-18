// If you are going to fetch any API, do it in this file.
// The main goal is to keep all requests grouped and clear so we don't send a lot of requests at once.

let fetchPlayerInterval;
let fetchItemInterval;

let fetchPlayerLastRefresh;
let fetchItemLastRefresh;

async function fetchPlayerData() {
	// Player data fetching: Every 15 minutes
	if (fetchPlayerInterval) clearInterval(fetchPlayerInterval);
	fetchPlayerInterval = setInterval(
		() => {
			console.log("fetch player data ran");
		},
		1000 * 60 * 15,
	); // 1000ms * 60 seconds * 15 minutes
}

function fetchItemPrices() {
	// Item price fetching: Every 5 minutes

	function inside() {
		console.log("fetch item prices function ran");
		checkAllTrackedPrices();
        fetchItemLastRefresh = getCurrentLocalTime();
        if (currentPage == "itemTracker") document.getElementById("itemTrackerLastRefresh").innerText = "Last Refresh: "+fetchItemLastRefresh;
	}

	if (fetchItemInterval) clearInterval(fetchItemInterval);
	fetchItemInterval = setInterval(
		() => {
			inside();
		},
		1000 * 60 * 5,
	); // 1000ms * 60 seconds * 5 minutes
	inside();
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
