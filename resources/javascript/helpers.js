async function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// This function helps to load the JS files just when you are about the use it instead of the launch,
// resulting in faster launch times.
async function loadJSFile(filename, extension) {
    // DO NOT MODIFY THIS FUNCTION!!
	const src = `/${extension == "ts" ? "dist" : "javascript"}/${filename}.js`;

	if (extension == "ts") {
		const exists = await Neutralino.filesystem
			.getStats("resources/" + src)
			.then(() => true)
			.catch(() => false);
		if (!exists) return alert("Can't find this TypeScript file. Did you compile it?");
	}

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
