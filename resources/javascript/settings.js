async function saveSettings() {
	try {
		const name = document.getElementById("sbNameInput").value;
		const apiKey = document.getElementById("apiKeyInput").value;

		db.run("DELETE FROM user_info");
		await saveDb();
		db.run("INSERT INTO user_info (name, apiKey) VALUES (?, ?)", [name, apiKey]);
		await saveDb();
		alert("Settings saved successfully!");
	} catch (err) {
		console.error("Failed to save settings:", err);
		alert("Failed to save settings!");
	}
}

async function loadSettings() {
    await sleep(50);

	const res = db.exec("SELECT name, apiKey FROM user_info LIMIT 1");
	const name = res.length ? res[0].values[0][0] : "";
	const apiKey = res.length ? res[0].values[0][1] : "";
	document.getElementById("sbNameInput").value = name;
	document.getElementById("apiKeyInput").value = apiKey;
}


// Expose functions to the global window so inline handlers work
window.saveSettings = saveSettings;
window.loadSettings = loadSettings;


