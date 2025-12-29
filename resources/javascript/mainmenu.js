const mainDiv = document.getElementById("main");

let currentPage = "mainmenu";

function renderPage(page) {
	if (currentPage === "forgetimer") {
		stopForgeTimer();
	}
	currentPage = page;

	fetch(`/pages/${page}.html`)
		.then(response => response.text())
		.then(html => {
			mainDiv.innerHTML = html;

			if (page == "settings" && db) {
				loadUserSettings();
				loadFeatureSettings();
			} else if (page === "auctionNotifier") {
                loadJSFile("auctionNotifier","js")
				document.getElementById("aucNotyBtn").checked = auctionNotifierVar;
			} else if (page === "itemTracker") {
				if (typeof initItemTracker === "function") {
					initItemTracker();
				}
			} else if (page === "forgetimer") {
				setTimeout(() => {
					if (typeof loadForgeData === "function") {
						loadForgeData();
					}
					if (typeof startForgeTimer === "function") {
						startForgeTimer();
					}
				}, 100);
			}
		});
}

renderPage("mainmenu");
