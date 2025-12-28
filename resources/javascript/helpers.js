async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadJSFile(filename, extension) {
	// This function helps to load the JS files just when you are about the use it instead of the launch,
	// resulting in faster launch times.
	return new Promise((resolve, reject) => {
		const src = `/${extension == ".ts" ? "dist" : "javascript"}/${filename}.${extension}`;

		if (Array.from(document.scripts).find(script => script.src.includes(src))) {
            if (filename == "settings") loadSettings();
			resolve();
			return;
		}

		const script = document.createElement("script");
		script.src = src;
		script.onload = resolve;
		script.onerror = reject;
		document.body.appendChild(script);
	});
}

// lets user get the saved settings on the db.
function getSavedSettings() {
  const res = db.exec("SELECT name, apiKey FROM user_info LIMIT 1");
  const name = res.length ? (res[0].values[0][0] ?? "") : "";
  const apiKey = res.length ? (res[0].values[0][1] ?? "") : "";
  return { name, apiKey };
}

window.getSavedSettings = getSavedSettings;