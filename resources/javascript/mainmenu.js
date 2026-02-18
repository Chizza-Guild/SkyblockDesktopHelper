const mainDiv = document.getElementById("main");

let currentPage = "mainmenu";

async function renderPage(page) {
	await loadJSFile("notifications");
	// The "db" here basically checks if the database has finished loading
	if (db && !redirectToSettings(page)) {
		// so you can get notified for no api key at start.
		return renderPage("settings");
	}

	currentPage = page;
	let newAppTitle = "Skyblock Desktop App - ";

	await fetch(`/pages/${page}.html`)
		.then(response => response.text())
		.then(html => {
			mainDiv.innerHTML = html;
		});

	if (page == "settings" && db) {
		await loadJSFile("notifications");
		loadUserSettings();
		loadFeatureSettings();
		newAppTitle += "Settings";
	} else if (page == "auctionNotifier") {
		await loadJSFile("auctionNotifier");
		document.getElementById("aucNotyBtn").checked = auctionNotifierVar;
		newAppTitle += "Auction Notifier";
	} else if (page == "itemTracker") {
		await loadJSFile("itemTracker");
		initItemTracker();
		newAppTitle += "Item Tracker";
	} else if (page == "forgeTimer") {
		await loadJSFile("forgeTimer");
		startForgeTimer();
		newAppTitle += "Forge Timer";
		document.getElementById("quickforgeinput").value = quickforgeVar;
	} else if (page == "minionProfitCalculator") {
		await loadJSFile("minionProfitCalculator");
		initMinionCalc();
		newAppTitle += "Minion Profit Calculator";
	} else if (page == "greenhouse") {
		await loadJSFile("greenhouse");
		displayGreenhouse(greenhouseNo1);
		newAppTitle += "Greenhouse Calculator";
	} else if (page == "minionMarket") {
		await loadJSFile("minionProfitCalculator");
		await loadJSFile("minionMarket");
		initMinionData();
		refreshListings();
		newAppTitle += "Minion Market";
	} else if (page == "mainmenu") {
		document.getElementById("appVersion").innerText = "Version " + (await getAppVersion());
		newAppTitle += "Main Menu";
	}

	await Neutralino.window.setTitle(newAppTitle);
}

setInterval(() => {
	if (currentPage == "settings") {
		const timeRemaining = apiKeyTimestampVar - Date.now();
		document.getElementById("apiKeyCountdown").innerText = `${timeRemaining > 0 ? formatMs(timeRemaining) : "expired"}`;
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
