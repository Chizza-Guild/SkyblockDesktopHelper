const CoflnetUrl = "https://sky.coflnet.com/api";

let playerNameVar;
let apiKeyVar;
let uuidVar;
let auctionNotifierVar;
let discordIdVar;

async function saveUserSettings() {
	try {
		const name = document.getElementById("sbNameInput").value;
		const apiKey = document.getElementById("apiKeyInput").value;
		const discordId = document.getElementById("discordIdInput")

		db.run("INSERT OR REPLACE INTO user_info (id, name, apiKey, discordId, uuid) VALUES (1, ?, ?, ?, NULL)", [name, apiKey, discordId]);

		if (name != playerNameVar) {
			console.log("Fetching new UUID for:", name);
			uuidVar = await getPlayerUuid(name);
			console.log("New UUID:", uuidVar);
		}
		
		playerNameVar = name;
		apiKeyVar = apiKey;
		discordIdVar = discordId;

		await saveDb();

		console.log("Settings saved. apiKeyVar:", apiKeyVar, "uuidVar:", uuidVar, "discordId:", discordIdVar);

		alert("Settings saved successfully!");
		
	} catch (error) {
		console.error("Error in saveUserSettings:", error);
		alert(`Failed to save settings: ${error}`);
	}
}

async function loadUserSettings() {
	const res = db.exec("SELECT * FROM user_info WHERE id = 1");
	if (!res.length) return;

	const [id, name, apiKey, discordId, uuid] = res[0].values[0];
	console.log(`Loaded User Settings: ${res[0].values[0]}`);

	if (currentPage == "settings") {
		document.getElementById("sbNameInput").value = name || "";
		document.getElementById("apiKeyInput").value = apiKey || "";
		document.getElementById("discordIdInput").value = discordId || "";
	}

	playerNameVar = name;
	apiKeyVar = apiKey;
	discordIdVar = discordId;

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
