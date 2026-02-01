let forgeTimerInterval = null;
let cachedForgeData = null; // Store the forge data
const forgeMap = new Map();

function getBaseForgeTime(id, type) {
	const itemTimes = {
		// REFINING
		REFINED_DIAMOND: 28800000, // 8 hours
		REFINED_MITHRIL: 21600000, // 6 hours
		REFINED_TITANIUM: 43200000, // 12 hours
		REFINED_TUNGSTEN: 3600000, // 1 hour
		REFINED_UMBER: 3600000, // 1 hour

		// FORGING
		BEJEWELED_HANDLE: 30000, // 30 seconds
		DRILL_MOTOR: 108000000, // 1 day 6 hours
		FUEL_CANISTER: 36000000, // 10 hours
		GEMSTONE_MIXTURE: 14400000, // 4 hours
		GLACITE_AMALGAMATION: 14400000, // 4 hours
		GOLDEN_PLATE: 21600000, // 6 hours
		MITHRIL_PLATE: 64800000, // 18 hours
		TUNGSTEN_PLATE: 10800000, // 3 hours
		UMBER_PLATE: 10800000, // 3 hours
		PERFECT_PLATE: 1800000, // 30 minutes

		// TOOLS
		"MITHRIL_DRILL_SX-R226": 14400000, // 4 hours
		"MITHRIL_DRILL_SX-R326": 30000, // 30 seconds
		"RUBY_DRILL_TX-15": 14400000, // 4 hours
		"GEMSTONE_DRILL_LT-522": 30000, // 30 seconds
		"TOPAZ_DRILL_KGR-12": 30000, // 30 seconds
		JASPER_DRILL_X: 30000, // 30 seconds
		TOPAZ_ROD: 43200000, // 12 hours
		"TITANIUM_DRILL_DR-X355": 14400000, // 4 hours
		"TITANIUM_DRILL_DR-X455": 30000, // 30 seconds
		"TITANIUM_DRILL_DR-X555": 30000, // 30 seconds
		"TITANIUM_DRILL_DR-X655": 30000, // 30 seconds
		CHISEL: 14400000, // 4 hours
		REINFORCED_CHISEL: 30000, // 30 seconds
		GLACITE_CHISEL: 30000, // 30 seconds
		PERFECT_CHISEL: 30000, // 30 seconds
		DIVAN_DRILL: 30000, // 30 seconds

		// GEAR
		MITHRIL_NECKLACE: 3600000, // 1 hour
		MITHRIL_CLOAK: 3600000, // 1 hour
		MITHRIL_BELT: 3600000, // 1 hour
		MITHRIL_GAUNTLET: 3600000, // 1 hour
		TITANIUM_NECKLACE: 16200000, // 4 hours 30 minutes
		TITANIUM_CLOAK: 16200000, // 4 hours 30 minutes
		TITANIUM_BELT: 16200000, // 4 hours 30 minutes
		TITANIUM_GAUNTLET: 16200000, // 4 hours 30 minutes
		TITANIUM_TALISMAN: 50400000, // 14 hours
		TITANIUM_RING: 72000000, // 20 hours
		TITANIUM_ARTIFACT: 129600000, // 1 day 12 hours
		TITANIUM_RELIC: 259200000, // 3 days
		DIVAN_POWDER_COATING: 129600000, // 1 day 12 hours
		DIVAN_HELMET: 86400000, // 24 hours
		DIVAN_CHESTPLATE: 86400000, // 24 hours
		DIVAN_LEGGINGS: 86400000, // 24 hours
		DIVAN_BOOTS: 86400000, // 24 hours
		AMBER_NECKLACE: 86400000, // 24 hours
		SAPPHIRE_CLOAK: 86400000, // 24 hours
		JADE_BELT: 86400000, // 24 hours
		AMETHYST_GAUNTLET: 86400000, // 24 hours
		GEMSTONE_CHAMBER: 14400000, // 4 hours
		DWARVEN_HANDWARMERS: 14400000, // 4 hours
		DWARVEN_METAL: 86400000, // 24 hours
		DIVAN_PENDANT: 604800000, // 7 days
		POWER_RELIC: 28800000, // 8 hours

		// REFORGE STONES
		DIAMONITE: 21600000, // 6 hours
		POCKET_ICEBERG: 21600000, // 6 hours
		PETRIFIED_STARFALL: 21600000, // 6 hours
		PURE_MITHRIL: 21600000, // 6 hours
		ROCK_GEMSTONE: 21600000, // 6 hours
		TITANIUM_TESSERACT: 21600000, // 6 hours
		GLEAMING_CRYSTAL: 21600000, // 6 hours
		HOT_STUFF: 21600000, // 6 hours
		AMBER_MATERIAL: 21600000, // 6 hours
		FRIGID_HUSK: 21600000, // 6 hours

		// DRILL PARTS
		STARFALL_SEASONING: 64800000, // 18 hours
		GOBLIN_OMELETTE: 64800000, // 18 hours
		GOBLIN_OMELETTE_BLUE_CHEESE: 64800000, // 18 hours
		GOBLIN_OMELETTE_PESTO: 64800000, // 18 hours
		GOBLIN_OMELETTE_SPICY: 64800000, // 18 hours
		GOBLIN_OMELETTE_SUNNY_SIDE: 64800000, // 18 hours
		TUNGSTEN_REGULATOR: 64800000, // 18 hours
		MITHRIL_DRILL_ENGINE: 86400000, // 24 hours
		TITANIUM_DRILL_ENGINE: 86400000, // 24 hours
		RUBY_POLISHED_DRILL_ENGINE: 30000, // 30 seconds
		SAPPHIRE_POLISHED_DRILL_ENGINE: 30000, // 30 seconds
		AMBER_POLISHED_DRILL_ENGINE: 30000, // 30 seconds
		MITHRIL_FUEL_TANK: 86400000, // 24 hours
		TITANIUM_FUEL_TANK: 30000, // 30 seconds
		GEMSTONE_FUEL_TANK: 30000, // 30 seconds
		PERFECTLY_CUT_FUEL_TANK: 30000, // 30 seconds

		// PERFECT GEMSTONES
		PERFECT_AMBER_GEM: 72000000, // 20 hours
		PERFECT_AMETHYST_GEM: 72000000, // 20 hours
		PERFECT_JADE_GEM: 72000000, // 20 hours
		PERFECT_JASPER_GEM: 72000000, // 20 hours
		PERFECT_OPAL_GEM: 72000000, // 20 hours
		PERFECT_RUBY_GEM: 72000000, // 20 hours
		PERFECT_SAPPHIRE_GEM: 72000000, // 20 hours
		PERFECT_TOPAZ_GEM: 72000000, // 20 hours
		PERFECT_AQUAMARINE_GEM: 72000000, // 20 hours
		PERFECT_CITRINE_GEM: 72000000, // 20 hours
		PERFECT_ONYX_GEM: 72000000, // 20 hours
		PERFECT_PERIDOT_GEM: 72000000, // 20 hours

		// PETS
		BEJEWELED_COLLAR: 7200000, // 2 hours
		MOLE: 259200000, // 3 days
		AMMONITE: 259200000, // 3 days
		PENGUIN: 259200000, // 3 days
		TYRANNOSAURUS: 604800000, // 7 days
		SPINOSAURUS: 604800000, // 7 days
		GOBLIN: 604800000, // 7 days
		ANKYLOSAURUS: 604800000, // 7 days
		MAMMOTH: 604800000, // 7 days

		// OTHER
		BEACON_2: 72000000, // 20 hours
		BEACON_3: 108000000, // 1 day 6 hours
		BEACON_4: 144000000, // 1 day 16 hours
		BEACON_5: 180000000, // 2 day 2 hours
		FORGE_TRAVEL_SCROLL: 18000000, // 5 hours
		BASE_CAMP_TRAVEL_SCROLL: 36000000, // 10 hours
		POWER_CRYSTAL: 7200000, // 2 hours
		SECRET_RAILROAD_PASS: 30000, // 30 seconds
		TUNGSTEN_KEY: 30000, // 30 seconds
		UMBER_KEY: 30000, // 30 seconds
		SKELETON_KEY: 1800000, // 30 minutes
		PORTABLE_CAMPFIRE: 1800000, // 30 minutes
	};

	// Check item-specific time first
	if (itemTimes[id]) {
		return itemTimes[id];
	}

	// Fall back to type-based times
	const typeTimes = {
		PERFECT_GEMSTONES: 72000000, // 20 hours
		PETS: 259200000, // 3 days
		REFINED_MINERALS: 28800000, // 8 hours
		DWARVEN_METAL: 21600000, // 6 hours
		QUICK_FORGE: 1800000, // 30 minutes
		ARMOR: 86400000, // 24 hours
		DRILL: 14400000, // 4 hours
		DRILL_PARTS: 172800000, // 48 hours
		REFORGE_STONES: 43200000, // 12 hours
	};

	return typeTimes[type] || 999999999999999999999; // big number = something went wrong
}

function normalizeForgeProcesses(forgeProcesses) {
	if (!forgeProcesses) return [];
	const forge1 = forgeProcesses.forge_1;
	if (!forge1) return [];
	if (typeof forge1 === "object" && !Array.isArray(forge1)) {
		return Object.values(forge1);
	}
	return [];
}

function formatTimeRemaining(ms) {
	if (ms <= 0) return "✅ Completed";

	const totalSeconds = Math.floor(ms / 1000);
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (days > 0) {
		return `⏳ ${days}d ${hours}h ${minutes}m ${seconds}s`;
	}
	if (hours > 0) {
		return `⏳ ${hours}h ${minutes}m ${seconds}s`;
	}
	if (minutes > 0) {
		return `⏳ ${minutes}m ${seconds}s`;
	}
	return `⏳ ${seconds}s`;
}

async function loadForgeData() {
	try {
		// Use the global variables from settings.js
		if (!apiKeyVar || !uuidVar) {
			updateAllForgeSlots("⚠️ Please configure settings first");
			return;
		}

		const profilesData = await getProfiles(uuidVar);
		const profile = profilesData.profiles.find(p => p.members[uuidVar]?.selected) || profilesData.profiles[0];

		if (!profile) {
			updateAllForgeSlots("❌ No SkyBlock profiles found");
			return;
		}

		const member = profile.members[uuidVar];
		const processes = normalizeForgeProcesses(member?.forge?.forge_processes);

		// Cache the forge data
		cachedForgeData = {};
		for (const process of processes) {
			cachedForgeData[process.slot] = process;

			// Runs if the map is empty (size <= 7) / or any value inside changes (Needs to change both in itemname and starttime)
			if (forgeMap.size <= 7 || process.id != forgeMap.get(process.slot)?.itemName || process.startTime != forgeMap.get(process.slot)?.startTime) {
				forgeMap.set(process.slot, {
					itemName: process.id,
					startTime: process.startTime,
					notified: false,
				});
			}
		}

		// Update display immediately
		updateForgeDisplay();
	} catch (error) {
		console.error("Error loading forge data:", error);
		updateAllForgeSlots(`❌ Error: ${error.message}`);
	}
}

function updateForgeDisplay() {
	if (!cachedForgeData) return;

	const now = Date.now();
	for (let i = 1; i <= 7; i++) {
		const slotElement = document.getElementById(`forge${i}`);
		if (!slotElement) continue;

		const slot = cachedForgeData[i];

		if (!slot) {
			slotElement.innerHTML = "💤 Empty";
			slotElement.className = "forge-box empty";
		} else {
			// Calculate actual forge time using comprehensive database + modifier
			const baseForgeTime = getBaseForgeTime(slot.id, slot.type);
			const actualForgeTime = baseForgeTime + (slot.processTimeModifier || 0);
			const endTime = slot.startTime + actualForgeTime;
			const quickForgeMultiplier = (100 - (quickforgeVar == 0 ? 0 : Math.min(30, 10 + quickforgeVar * 0.5 + (quickforgeVar == 20 ? 10 : 0)))) / 100;
			const timeRemaining = (endTime - now) * quickForgeMultiplier;

			const itemName = slot.id
				.replace(/_/g, " ")
				.toLowerCase()
				.replace(/\b\w/g, l => l.toUpperCase());

			if (timeRemaining <= 0) {
				slotElement.innerHTML = `
                    <div class="item-name">🔧 ${itemName}</div>
                    <div class="item-status">✅ Completed</div>
                `;
				slotElement.className = "forge-box completed";

				if (!forgeMap.get(i).notified) {
					forgeMap.get(i).notified = true;
					sendNotification("Forge Completed", `Your ${itemName} is ready!`);
				}
			} else {
				slotElement.innerHTML = `
                    <div class="item-name">🔧 ${itemName}</div>
                    <div class="item-status">${formatTimeRemaining(timeRemaining)}</div>
                `;
				slotElement.className = "forge-box in-progress";
			}
		}
	}
}

function updateAllForgeSlots(message) {
	for (let i = 1; i <= 7; i++) {
		const slotElement = document.getElementById(`forge${i}`);
		if (slotElement) {
			slotElement.innerHTML = message;
			slotElement.className = "forge-box";
		}
	}
}

function startForgeTimer() {
	stopForgeTimer(); // Clear any existing timer
	cachedForgeData = null; // Clear cache
	loadForgeData(); // Load from API once
	forgeTimerInterval = setInterval(updateForgeDisplay, 1000); // Update display every second
}

function stopForgeTimer() {
	if (forgeTimerInterval) {
		clearInterval(forgeTimerInterval);
		forgeTimerInterval = null;
		console.log("Forge timer stopped");
	}
}

async function quickForgeSetting() {
	let newLevel = Number(document.getElementById("quickforgeinput").value);
	if (newLevel > 20) newLevel = 20;
	if (newLevel < 0) newLevel = 0;
	quickforgeVar = newLevel;
	document.getElementById("quickforgeinput").value = newLevel;
	db.run("UPDATE features SET quickforge = ? WHERE id = 1", [newLevel]);
	await saveDb();
	console.log("New Quick Forge Level:", newLevel);
}
