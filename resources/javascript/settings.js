const CoflnetUrl = "https://sky.coflnet.com/api";

let playerNameVar;
let apiKeyVar;
let uuidVar;
let webhookURL;
let auctionNotifierVar;
let discordIdVar;
let privateWebhookURLVar;
let apiKeyTimestampVar;
let apiKeyExpiredSent = false;

async function saveUserSettings() {
	try {
		const name = document.getElementById("sbNameInput").value;
		const apiKey = document.getElementById("apiKeyInput").value;
		const discordId = document.getElementById("discordIdInput").value;

		if (apiKeyVar != apiKey) {
			apiKeyTimestampVar = Date.now() + 86400000;
		}

		db.run("INSERT OR REPLACE INTO user_info (id, name, apiKey, uuid, discordId, privateWebhookURL, apiKeyTimestamp) VALUES (?, ?, ?, ?, ?, ?, ?)", [1, name, apiKey, null, discordId, null, apiKeyTimestampVar]);

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

	const [id, name, apiKey, uuid, discordId, webhookUrl, apiKeyTimestamp] = res[0].values[0];
	console.log(`Loaded User Settings: ${res[0].values[0]}`);

	const timeRemaining = Number(apiKeyTimestamp) - Date.now();
    
	if (timeRemaining <= 0 && !apiKeyExpiredSent) {
        apiKeyExpiredSent = true;
		sendNotification("API Key Expired", "Your API key has expired. Please update it in the settings.");
	}

	if (currentPage == "settings") {
		document.getElementById("sbNameInput").value = name || "";
		document.getElementById("apiKeyInput").value = apiKey || "";
		document.getElementById("discordIdInput").value = discordId || "";
		if (timeRemaining <= 0) {
			document.getElementById("apiKeyCountdown").innerText = " (expired)";
		} else {
			document.getElementById("apiKeyCountdown").innerText = ` ${formatMs(timeRemaining)}`;
		}
	}

	privateWebhookURLVar = webhookUrl;
	playerNameVar = name;
	apiKeyVar = apiKey;
	discordIdVar = discordId;
	apiKeyTimestampVar = apiKeyTimestamp;

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
