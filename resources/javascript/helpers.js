async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// This function helps to load the JS files just when you are about the use it instead of the launch,
// resulting in faster launch times.
async function loadJSFile(filename) {
	// DO NOT MODIFY THIS FUNCTION!!
	const src = `/javascript/${filename}.js`;

	return new Promise((resolve, reject) => {
		if (Array.from(document.scripts).find(script => script.src.includes(src))) {
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

function formatMs(totalMs) {
	const totalSeconds = Math.floor(totalMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return `${hours} hours ${minutes} mins ${seconds} seconds`;
}

function getCurrentLocalTime() {
    // Returns current time in HH:MM:SS
	const now = new Date();

	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	const seconds = String(now.getSeconds()).padStart(2, "0");

	return `${hours}:${minutes}:${seconds}`;
}

function formatCoins(totalCoins) {
	totalCoins = Math.floor(totalCoins);

	let [k, m, b] = 0;
	if (totalCoins >= 1000000000) {
		b = Math.round(totalCoins / 1000000000);
		return b + "b";
	} else if (totalCoins >= 1000000) {
		m = Math.round(totalCoins / 1000000);
		return b + "m";
	} else if (totalCoins >= 1000) {
		k = Math.round(totalCoins / 1000);
		return k + "k";
	}
}

const MINECRAFT_COLORS = {
	0: "#000000", // Black
	1: "#0000AA", // Dark Blue
	2: "#00AA00", // Dark Green
	3: "#00AAAA", // Dark Aqua
	4: "#AA0000", // Dark Red
	5: "#AA00AA", // Dark Purple
	6: "#FFAA00", // Gold
	7: "#AAAAAA", // Gray
	8: "#555555", // Dark Gray
	9: "#5555FF", // Blue
	a: "#55FF55", // Green
	b: "#55FFFF", // Aqua
	c: "#FF5555", // Red
	d: "#FF55FF", // Light Purple
	e: "#FFFF55", // Yellow
	f: "#FFFFFF", // White
};

const MINECRAFT_FORMATS = {
	l: "font-weight: bold",
	o: "font-style: italic",
	n: "text-decoration: underline",
	m: "text-decoration: line-through",
};

function minecraftToHTML(text) {
	if (!text || typeof text !== "string") return text;

	// Replace § with & if needed for compatibility
	text = text.replace(/&/g, "§");

	let result = "";
	let currentColor = "";
	let currentFormats = [];
	let i = 0;

	while (i < text.length) {
		if (text[i] === "§" && i + 1 < text.length) {
			const code = text[i + 1].toLowerCase();

			// Close previous span if exists
			if (currentColor || currentFormats.length > 0) {
				result += "</span>";
			}

			if (code === "r") {
				// Reset formatting
				currentColor = "";
				currentFormats = [];
			} else if (MINECRAFT_COLORS[code]) {
				// Color code
				currentColor = MINECRAFT_COLORS[code];
				currentFormats = [];
			} else if (MINECRAFT_FORMATS[code]) {
				// Format code
				currentFormats.push(MINECRAFT_FORMATS[code]);
			}

			// Open new span with current styling
			if (currentColor || currentFormats.length > 0) {
				let style = "";
				if (currentColor) style += `color: ${currentColor};`;
				if (currentFormats.length > 0) style += currentFormats.join(";");
				result += `<span style="${style}">`;
			}

			i += 2; // Skip § and code character
		} else {
			result += text[i];
			i++;
		}
	}

	// Close any remaining open span
	if (currentColor || currentFormats.length > 0) {
		result += "</span>";
	}

	return result;
}

function stripMinecraftCodes(text) {
	// For plain text display
	if (!text || typeof text !== "string") return text;
	return text.replace(/[§&][0-9a-fk-or]/gi, "");
}
