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
		await loadJSFile("discordTest", "js");
	} else if (page == "auctionNotifier") {
		await loadJSFile("auctionNotifier", "js");
		document.getElementById("aucNotyBtn").checked = auctionNotifierVar;
	} else if (page == "itemTracker") {
		await loadJSFile("itemTracker", "js");
		initItemTracker();
	} else if (page == "forgeTimer") {
		await loadJSFile("forgeTimer", "js");
		startForgeTimer();
		document.getElementById("quickforgeinput").value = quickforgeVar;
	} else if (page == "minionProfitCalculator") {
		await loadJSFile("minionProfitCalculator", "js");
		initMinionCalc();
	} else if (page == "greenhouse") {
		await loadJSFile("greenhouse", "ts");
		displayGreenhouse(greenhouseNo1);
	} else if (page == "minionMarket") {
		await loadJSFile("minionMarket", "js");
		refreshListings();
	}
}

setInterval(() => {
	if (currentPage == "settings") {
		document.getElementById("apiKeyCountdown").innerText = `${formatMs(apiKeyTimestampVar - Date.now())}`;
	}
}, 1000);

function redirectToSettings(page) {
	if (!apiKeyVar) {
		if (page == "auctionNotifier" || page == "forgeTimer") {
			return alert("An API Key is needed for this feature!");
		}
	}

	if (!playerNameVar) {
		if (page == "auctionNotifier" || page == "forgeTimer") {
			return alert("A player name is needed for this feature!");
		}
	}

	return true;
}

renderPage("mainmenu");
