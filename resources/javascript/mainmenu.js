let currentPage = "mainmenu"; // Not used yet
const mainDiv = document.getElementById("main");

function renderPage(page) {
	currentPage = page;

	fetch(`/pages/${page}.html`)
		.then(response => response.text())
		.then(html => {
			mainDiv.innerHTML = html;
			// Page-specific initialization
			if (page === 'settings' && typeof window.loadSettings === 'function') {
				window.loadSettings();
			}
			if (page === 'auctionNotifier') {
				const cb = document.getElementById('aucNotyBtn');
				if (cb) {
					cb.checked = localStorage.getItem('auctionNotifierSubscribed') === 'true';
				}
				if (typeof window.updateCheckbox === 'function') window.updateCheckbox();
			}
		});
}
