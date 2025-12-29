const mainDiv = document.getElementById("main");

let currentPage = "mainmenu";

async function renderPage(page) {
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
	} else if (page == "forgetimer") {
		await loadJSFile("forgetimer", "js");
		stopForgeTimer();
		loadForgeData();
		startForgeTimer();
	}
}

renderPage("mainmenu");
