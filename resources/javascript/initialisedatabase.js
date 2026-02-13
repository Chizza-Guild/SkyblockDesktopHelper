let db;
let saveDb;

(async () => {
	try {
		const SQL = await initSqlJs({ locateFile: file => "system/" + file });
		const documentsPath = await Neutralino.os.getPath("documents");
		const appDir = `${documentsPath}/SkyblockDesktopHelperApp`;
		const dbPath = `${appDir}/app.db`;

		// We are creating saveDb late like this since we need dbPath initialised first.
		saveDb = function () {
			return Neutralino.filesystem.writeBinaryFile(dbPath, db.export());
		};

		try {
			await Neutralino.filesystem.createDirectory(appDir);
			console.log("Created app directory");
		} catch (err) {
			console.log("Directory already exists or couldn't be created:", err);
		}

		try {
			const fileData = await Neutralino.filesystem.readBinaryFile(dbPath);
			db = new SQL.Database(new Uint8Array(fileData));
			console.log("Loaded existing database");
		} catch (err) {
			console.warn("DB file not found, creating new:", err);
			db = new SQL.Database();
			await saveDb();
			console.log("Created new database");
		}

		// USER INFO TABLE HERE
		db.run("CREATE TABLE IF NOT EXISTS user_info (id INTEGER PRIMARY KEY, name TEXT, apiKey TEXT)");
		await saveDb();

		// ADDS NEW COLUMNS TO USER INFO TABLE
		const cols = db.exec("PRAGMA table_info(user_info)")[0].values;
		if (!cols.some(c => c[1] == "uuid")) db.run("ALTER TABLE user_info ADD COLUMN uuid TEXT");
		if (!cols.some(c => c[1] == "discordId")) db.run("ALTER TABLE user_info ADD COLUMN discordId TEXT");  // Changed to TEXT for large IDs
		if (!cols.some(c => c[1] == "privateWebhookURL")) db.run("ALTER TABLE user_info ADD COLUMN privateWebhookURL TEXT");  // FIXED: removed extra space
		if (!cols.some(c => c[1] == "apiKeyTimestamp")) db.run("ALTER TABLE user_info ADD COLUMN apiKeyTimestamp INTEGER");
		if (!cols.some(c => c[1] == "apiKeyUseAmount")) db.run("ALTER TABLE user_info ADD COLUMN apiKeyUseAmount INTEGER DEFAULT 0");

		// true = 1, false = 0
		if (!cols.some(c => c[1] == "doDiscordNotification")) db.run("ALTER TABLE user_info ADD COLUMN doDiscordNotification INTEGER DEFAULT 0");

		await saveDb();

		// FEATURE ACTIVATION TABLE HERE
		db.run("CREATE TABLE IF NOT EXISTS features (id INTEGER PRIMARY KEY, auctionNotifier INTEGER)");
		await saveDb();

		// ADDS NEW COLUMNS TO THE FEATURE TABLE
		const featureCols = db.exec("PRAGMA table_info(features)")[0].values;
		if (!featureCols.some(c => c[1] == "quickforge")) db.run("ALTER TABLE features ADD COLUMN quickforge INTEGER DEFAULT 0");
		await saveDb();

		// TRACKED ITEMS TABLE HERE
		db.run(`CREATE TABLE IF NOT EXISTS tracked_items (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			item_tag TEXT NOT NULL,
			item_name TEXT NOT NULL,
			price_type TEXT NOT NULL,
			threshold_type TEXT NOT NULL,
			threshold_price REAL NOT NULL,
			is_active INTEGER DEFAULT 1,
			created_at TEXT DEFAULT CURRENT_TIMESTAMP
		)`);
		await saveDb();

		// ADDS NEW COLUMNS TO TRACKED ITEMS TABLE
		const trackedItemsCols = db.exec("PRAGMA table_info(tracked_items)");
		if (trackedItemsCols.length > 0) {
			const hasOrderType = trackedItemsCols[0].values.some(c => c[1] == "order_type");
			if (!hasOrderType) {
				db.run("ALTER TABLE tracked_items ADD COLUMN order_type TEXT DEFAULT 'buy'");
				await saveDb();
			}
		}

		console.log("Database initialized successfully!");

		loadUserSettings();
		loadFeatureSettings();
	} catch (err) {
		console.error("Initialization failed:", err);
	}
})();