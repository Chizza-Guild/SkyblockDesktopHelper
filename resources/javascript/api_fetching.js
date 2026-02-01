// If you are going to fetch any API, do it in this file.
// The main goal is to keep all requests grouped and clear so we don't send a lot of requests at once.

async function fetchPlayerData() {
	// Player data fetching: Every 15 minutes
	setInterval(
		() => {
			console.log("fetch player data ran");
		},
		1000 * 60 * 15,
	); // 1000ms * 60 seconds * 15 minutes
}

function fetchItemPrices() {
	// Item price fetching: Every 2 minutes
	setInterval(
		() => {
			console.log("fetch item prices ran");
		},
		1000 * 60 * 2,
	); // 1000ms * 60 seconds * 2 minutes
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
