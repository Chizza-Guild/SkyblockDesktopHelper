const mainDiv = document.getElementById("main");

let currentPage = "mainmenu";

function renderPage(page) {
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
			}
		});
}

renderPage("mainmenu");
