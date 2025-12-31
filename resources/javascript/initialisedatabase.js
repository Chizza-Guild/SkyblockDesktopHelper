let db;
let saveDb;

(async () => {
	try {
		const SQL = await initSqlJs({ locateFile: file => "sqljs/" + file });
		const documentsPath = await Neutralino.os.getPath("documents");
		const appDir = `${documentsPath}/SkyblockDesktopHelperApp`;
		const dbPath = `${appDir}/app.db`;

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
			await Neutralino.filesystem.writeBinaryFile(dbPath, db.export());
			console.log("Created new database");
		}

		saveDb = function () {
			return Neutralino.filesystem.writeBinaryFile(dbPath, db.export());
		};

		// USER INFO TABLE HERE
		db.run("CREATE TABLE IF NOT EXISTS user_info (id INTEGER PRIMARY KEY, name TEXT, apiKey TEXT, discordId INTEGER)");
		await saveDb();

		// ADDS NEW COLUMNS TO USER INFO TABLE
		const cols = db.exec("PRAGMA table_info(user_info)")[0].values;
		const hasUuid = cols.some(c => c[1] == "uuid");
		if (!hasUuid) db.run("ALTER TABLE user_info ADD COLUMN uuid TEXT");
		await saveDb();

		// FEATURE ACTIVATION TABLE HERE
		db.run("CREATE TABLE IF NOT EXISTS features (id INTEGER PRIMARY KEY, auctionNotifier INTEGER)");
		await saveDb();

		// TRACKED ITEMS TABLE FOR PRICE TRACKING
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
