const mainDiv = document.getElementById("main");

let currentPage = "mainmenu";

async function renderPage(page) {
    // The "db" here basically checks if the database has finished loading
	if (db && !redirectToSettings(page)) return renderPage("settings");

	currentPage = page;

	await fetch(`/pages/${page}.html`)
		.then(response => response.text())
		.then(html => {
			mainDiv.innerHTML = html;
		});

	if (page == "settings" && db) {
		loadUserSettings();
		loadFeatureSettings();
	} else if (page == "auctionNotifier") {
		await loadJSFile("auctionNotifier", "js");
		document.getElementById("aucNotyBtn").checked = auctionNotifierVar;
	} else if (page == "itemTracker") {
		await loadJSFile("itemTracker", "js");
		initItemTracker();
	} else if (page == "forgeTimer") {
		await loadJSFile("forgeTimer", "js");
		stopForgeTimer();
		loadForgeData();
		startForgeTimer();
	}
}

function redirectToSettings(page) {
	let canContinue = true;

	if (!apiKeyVar) {
		if (page == "auctionNotifier" || page == "forgeTimer") {
			alert("An API Key is needed for this feature!");
			canContinue = false;
		}
	} else if (!playerNameVar) {
		if (page == "auctionNotifier" || page == "forgeTimer") {
			alert("A player name is needed for this feature!");
			canContinue = false;
		}
	}

	return canContinue;
}

renderPage("mainmenu");
