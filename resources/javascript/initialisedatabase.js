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

		db.run("CREATE TABLE IF NOT EXISTS user_info (id INTEGER PRIMARY KEY, name TEXT, apiKey TEXT)");
		await saveDb();

		const cols = db.exec("PRAGMA table_info(user_info)")[0].values;
		const hasUuid = cols.some(c => c[1] == "uuid");
		if (!hasUuid) db.run("ALTER TABLE user_info ADD COLUMN uuid TEXT");
		await saveDb();

		console.log("Database initialized successfully!");
	} catch (err) {
		console.error("Initialization failed:", err);
	}
})();
