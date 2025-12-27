let currentPage = "mainmenu"; // Not used yet
const mainDiv = document.getElementById("main");

function renderPage(page) {
	currentPage = page;
    
	loadJSFile(page, "js"); // TODO: Change so it auto-finds the extension

	fetch(`/pages/${page}.html`)
		.then(response => response.text())
		.then(html => {
			mainDiv.innerHTML = html;
		});
}
