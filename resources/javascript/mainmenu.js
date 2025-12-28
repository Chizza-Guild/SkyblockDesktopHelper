const mainDiv = document.getElementById("main");

let currentPage = "mainmenu";

function renderPage(page) {
	currentPage = page;

	fetch(`/pages/${page}.html`)
		.then(response => response.text())
		.then(html => {
			mainDiv.innerHTML = html;

			if (page == "settings") {
				loadSettings();
			} else if (page === "auctionNotifier") {
				const cb = document.getElementById("aucNotyBtn");
				if (cb) {
					cb.checked = localStorage.getItem("auctionNotifierSubscribed") === "true";
				}
				if (typeof window.updateCheckbox === "function") window.updateCheckbox();
			}
		});
}

renderPage("mainmenu");
