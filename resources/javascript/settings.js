const CoflnetUrl = "https://sky.coflnet.com/api";

let playerNameVar;
let apiKeyVar;
let uuidVar;
let auctionNotifierVar;

async function saveUserSettings() {
	try {
		const name = document.getElementById("sbNameInput").value;
		const apiKey = document.getElementById("apiKeyInput").value;

		db.run("INSERT OR REPLACE INTO user_info (id, name, apiKey, uuid) VALUES (1, ?, ?, NULL)", [name, apiKey]);

		if (name != playerNameVar) await getPlayerUuid(name);
		playerNameVar = name;
		apiKeyVar = apiKey;

		await saveDb();

		alert("Settings saved successfully!");
	} catch (error) {
		alert(`Failed to save settings: ${error}`);
	}
}

async function loadUserSettings() {
	const res = db.exec("SELECT * FROM user_info WHERE id = 1");
	if (!res.length) return;

	const [id, name, apiKey, uuid] = res[0].values[0];
	console.log(`Loaded User Settings: ${res[0].values[0]}`);

	if (currentPage == "settings") {
		document.getElementById("sbNameInput").value = name || "";
		document.getElementById("apiKeyInput").value = apiKey || "";
	}

	playerNameVar = name;
	apiKeyVar = apiKey;

	if (name && !uuid) {
		uuidVar = await getPlayerUuid(name);
	} else {
		uuidVar = uuid;
	}
}

async function saveFeatureSettings() {
	try {
		db.run("INSERT OR REPLACE INTO features (id, auctionNotifier) VALUES (1, ?)", [auctionNotifierVar]);
		await saveDb();
	} catch (error) {
		alert(`Failed to save settings: ${error}`);
	}
}

async function loadFeatureSettings() {
	const res = db.exec("SELECT * FROM features WHERE id = 1");
	if (!res.length) return;

	const [id, auctionNotifier] = res[0].values[0];
	console.log(`Loaded Feature Settings: ${res[0].values[0]}`);

	if (currentPage == "auctionNotifier") {
		document.getElementById("aucNotyBtn").checked = auctionNotifier;
	}

	auctionNotifierVar = auctionNotifier;
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
