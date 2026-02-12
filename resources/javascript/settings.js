const CoflnetUrl = "https://sky.coflnet.com/api";

let playerNameVar;
let apiKeyVar;
let uuidVar;
let webhookURL;
let discordIdVar;
let privateWebhookURLVar;
let apiKeyTimestampVar;
let apiKeyUseAmountVar;
let apiKeyExpiredSent = false;

let auctionNotifierVar;
let quickforgeVar;
let discordNotificationVar;

async function saveUserSettings() {
	try {
		const name = document.getElementById("sbNameInput").value;
		const apiKey = document.getElementById("apiKeyInput").value;
		const discordId = document.getElementById("discordIdInput").value;
		const doDiscordNotification = document.getElementById("discordNotificationCheckBox").checked ? 1 : 0;

		if (apiKeyVar != apiKey) {
			// The user has changed the API key
			apiKeyTimestampVar = Date.now() + 86400000 * 2; // 2 days now
			db.run("UPDATE user_info SET apiKeyUseAmount = 0 WHERE ID = 1;");
            await saveDb();
		}

		db.run("INSERT OR REPLACE INTO user_info (id, name, apiKey, uuid, discordId, privateWebhookURL, apiKeyTimestamp, doDiscordNotification) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [1, name, apiKey, null, discordId, null, apiKeyTimestampVar, null]);
		await saveDb();

		if (name != playerNameVar) {
			console.log("Fetching new UUID for:", name);
			uuidVar = await getPlayerUuid(name);
			console.log("New UUID:", uuidVar);
		}

		playerNameVar = name;
		apiKeyVar = apiKey;
		discordIdVar = discordId;
		discordNotificationVar = doDiscordNotification;

		console.log("Settings saved. apiKeyVar:", apiKeyVar, "uuidVar:", uuidVar, "discordIdVar:", discordIdVar, "DiscordNotifications:", discordNotificationVar);

		alert("Settings saved successfully!");
	} catch (error) {
		console.error("Error in saveUserSettings:", error);
		alert(`Failed to save settings: ${error}`);
	}
}

async function loadUserSettings() {
	const res = db.exec("SELECT * FROM user_info WHERE id = 1");
	if (!res.length) return;

	const [id, name, apiKey, uuid, discordId, webhookUrl, apiKeyTimestamp, apiKeyUseAmount] = res[0].values[0];
	console.log("-- Loaded User Settings --");
	console.log("name:", name);
	console.log("apikey:", apiKey);
	console.log("uuid:", uuid);
	console.log("discordId", discordId);
	console.log("webhookUrl", webhookUrl);
	console.log("apiKeyTimestamp", apiKeyTimestamp);
	console.log("apiKeyUseAmount", apiKeyUseAmount);
	console.log("discordNotifications", apiKeyUseAmount);

	const timeRemaining = Number(apiKeyTimestamp) - Date.now();

	if (timeRemaining <= 0 && !apiKeyExpiredSent) {
		apiKeyExpiredSent = true;
		sendNotification("API Key Expired", "Your API key has expired. Please update it in the settings."); 
	}

	if (currentPage == "settings") {
		document.getElementById("sbNameInput").value = name || "";
		document.getElementById("apiKeyInput").value = apiKey || "";
		document.getElementById("discordIdInput").value = discordId || "";
		document.getElementById("apiKeyUsageCount").innerText = `${apiKeyUseAmount || 0}/5000`;
		if (timeRemaining <= 0) {
			document.getElementById("apiKeyCountdown").innerText = "expired";
		} else {
			document.getElementById("apiKeyCountdown").innerText = ` ${formatMs(timeRemaining)}`;
		}
	}

	privateWebhookURLVar = webhookUrl;
	playerNameVar = name;
	apiKeyVar = apiKey;
	discordIdVar = discordId;
	apiKeyTimestampVar = apiKeyTimestamp;
	apiKeyUseAmountVar = apiKeyUseAmount;

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

	const [id, auctionNotifier, quickforge] = res[0].values[0];
	console.log("-- Loaded Feature Settings --");
	console.log("auctionNotifier", auctionNotifier);
	console.log("quickforge", quickforge);

	if (currentPage == "auctionNotifier") {
		document.getElementById("aucNotyBtn").checked = auctionNotifier;
	} else if (currentPage == "forgetimer") {
        document.getElementById("quickforgeinput").value = quickforge;
    }

	auctionNotifierVar = auctionNotifier;
    quickforgeVar = quickforge;
}

async function getPlayerUuid(playerName) {
	// Move this to api_fetching.js
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
