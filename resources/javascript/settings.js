let playerNameVar;
let apiKeyVar;
let uuidVar;

async function saveSettings() {
	try {
		const name = document.getElementById("sbNameInput").value;
		const apiKey = document.getElementById("apiKeyInput").value;

		db.run("INSERT OR REPLACE INTO user_info (id, name, apiKey, uuid) VALUES (1, ?, ?, NULL)", [name, apiKey]);
		await saveDb();

		alert("Settings saved successfully!");
	} catch (err) {
		console.error(err);
		alert("Failed to save settings!");
	}
}

async function loadSettings() {
	await sleep(50);

	const res = db.exec("SELECT * FROM user_info WHERE id = 1");
	if (!res.length) return;
    console.log(res);

	const [id, name, apiKey, uuid] = res[0].values[0];

	if (currentPage === "settings") {
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

loadSettings();
