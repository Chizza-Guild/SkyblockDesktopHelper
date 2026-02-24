let lastNotifiedPrices = new Map();
let priceCache = new Map();
let allItems = [];

async function toggleItemTrackerOnOff() {
	const theCheckbox = document.getElementById("itemTrackerCheckbox");
	const output = theCheckbox.checked ? 1 : 0;
	itemTrackerVar = output;

	db.run("UPDATE features SET itemtracker = ? WHERE id = 1", [output]);
	await saveDb();
	initItemTracker();
}

async function initItemTracker() {
	const lastRefresh = document.getElementById("itemTrackerLastRefresh");
	document.getElementById("itemTrackerCheckbox").checked = itemTrackerVar == 1;

	if (itemTrackerVar == 1) {
		fetchItemPrices();
		lastRefresh.style.color = "unset";
	} else {
		if (fetchItemInterval) {
			clearInterval(fetchItemInterval);
			fetchItemInterval = null;
		}
		lastRefresh.innerHTML = "Disabled";
		lastRefresh.style.color = "red";
	}
}

async function fetchAllItems() {
	try {
		const response = await fetch(`${CoflnetUrl}/items`);
		if (!response.ok) {
			console.error("Failed to fetch items from API");
			return;
		}

		const items = await response.json();

		allItems = items
			.filter(item => {
				const hasName = item.name && item.name != "null" && item.name.trim() != "";
				const isTradeable = item.flags == "AUCTION" || item.flags == "BAZAAR";
				return hasName && isTradeable;
			})
			.map(item => ({
				tag: item.tag,
				name: item.name,
				type: item.flags,
			}));

		await refreshTrackedItemPrices();

		console.log(`Loaded ${allItems.length} items from API`);
	} catch (err) {
		console.error("Error fetching items:", err);
		allItems = [];
	}
}

async function refreshTrackedItemPrices() {
	try {
		const result = db.exec("SELECT item_tag, price_type, order_type FROM tracked_items WHERE is_active = 1");
		if (!result.length || !result[0].values.length) return;

		for (const row of result[0].values) {
			const [itemTag, priceType, orderType] = row;
			await fetchAndCachePrice(itemTag, priceType, orderType || "buy");
		}

		const time = getCurrentLocalTime();
		if (currentPage == "itemTracker") document.getElementById("itemTrackerLastRefresh").innerText = "Last Refresh: " + time;

		await checkAllTrackedPrices();
	} catch (err) {
		console.error("Failed refreshing tracked prices:", err);
	}
}

async function fetchAndCachePrice(itemTag, priceType, orderType = "buy") {
	try {
		if (priceType == "bazaar") {
			const response = await fetch(`${CoflnetUrl}/bazaar/${encodeURIComponent(itemTag)}/snapshot`);
			if (!response.ok) return;

			const data = await response.json();

			const price = orderType == "sell" ? data.sellPrice || data.quickStatus?.sellPrice : data.buyPrice || data.quickStatus?.buyPrice;

			if (price) {
				const key = `${itemTag}|${priceType}|${orderType}`;
				priceCache.set(key, price);
			}
		} else if (priceType == "bin") {
			const response = await fetch(`${CoflnetUrl}/auctions/tag/${encodeURIComponent(itemTag)}/active/bin`);
			if (!response.ok) return;

			const data = await response.json();

			if (Array.isArray(data) && data.length > 0) {
				const prices = data.map(a => a.startingBid || a.bin || a.price).filter(p => p > 0);

				if (prices.length > 0) {
					const key = `${itemTag}|${priceType}|buy`;
					priceCache.set(key, Math.min(...prices));
				}
			}
		}
	} catch (err) {
		console.error("Price fetch failed:", err);
	}
}

function populateItemsList() {
	const datalist = document.getElementById("itemsList");
	if (!datalist) return;

	datalist.innerHTML = "";

	if (allItems.length == 0) {
		console.warn("No items loaded from API");
		return;
	}

	const sortedItems = [...allItems].sort((a, b) => {
		const nameA = stripMinecraftCodes(a.name);
		const nameB = stripMinecraftCodes(b.name);
		return nameA.localeCompare(nameB);
	});

	sortedItems.forEach(item => {
		const option = document.createElement("option");
		option.value = item.name;
		const cleanName = stripMinecraftCodes(item.name);
		option.textContent = `${cleanName} - [${item.type}] (${item.tag})`;
		datalist.appendChild(option);
	});
}

function updatePriceType() {
	const itemName = document.getElementById("itemTagInput").value.trim();
	const priceTypeDisplay = document.getElementById("priceTypeDisplay");

	if (!itemName) {
		priceTypeDisplay.textContent = "Select an item to see price type";
		priceTypeDisplay.style.backgroundColor = "#f0f0f0";
		priceTypeDisplay.style.color = "#000";
		return;
	}

	const foundItem = allItems.find(item => item.name == itemName);

	if (foundItem) {
		if (foundItem.type == "BAZAAR") {
			priceTypeDisplay.innerHTML = `
				<div style="display: flex; align-items: center; gap: 10px;">
					<span style="font-weight: bold; color: #1976d2;">Bazaar</span>
					<select id="orderTypeSelect" style="flex: 1; padding: 5px; background-color: #e3f2fd; border: 1px solid #1976d2; border-radius: 3px; font-weight: bold; color: #1976d2;">
						<option value="buy">Sell Order (Instant Buy)</option>
						<option value="sell">Buy Order (Instant Sell)</option>
					</select>
				</div>
			`;
			priceTypeDisplay.style.backgroundColor = "#e3f2fd";
			priceTypeDisplay.style.color = "#1976d2";
		} else if (foundItem.type == "AUCTION") {
			priceTypeDisplay.textContent = "Auction BIN (Buy It Now)";
			priceTypeDisplay.style.backgroundColor = "#fff3e0";
			priceTypeDisplay.style.color = "#f57c00";
		}
	} else {
		priceTypeDisplay.textContent = "Unknown item - please select from list";
		priceTypeDisplay.style.backgroundColor = "#ffebee";
		priceTypeDisplay.style.color = "#c62828";
	}
}

async function handleAddItem() {
	const itemName = document.getElementById("itemTagInput").value.trim();
	const thresholdType = document.getElementById("thresholdTypeSelect").value;
	const thresholdPrice = parseFloat(document.getElementById("thresholdPriceInput").value);

	if (!itemName || !thresholdPrice) {
		alert("Please fill in all fields");
		return;
	}

	const foundItem = allItems.find(item => item.name == itemName);

	if (!foundItem) {
		alert("Please select a valid item from the dropdown list");
		return;
	}

	const itemTag = foundItem.tag;
	const priceType = foundItem.type == "BAZAAR" ? "bazaar" : "bin";

	let orderType = "buy";
	if (foundItem.type == "BAZAAR") {
		const orderTypeSelect = document.getElementById("orderTypeSelect");
		if (orderTypeSelect) {
			orderType = orderTypeSelect.value;
		}
	}

	try {
		db.run(
			`INSERT INTO tracked_items (item_tag, item_name, price_type, threshold_type, threshold_price, is_active, order_type)
			 VALUES (?, ?, ?, ?, ?, 1, ?)`,
			[itemTag, itemName, priceType, thresholdType, thresholdPrice, orderType],
		);
		await saveDb();
		loadTrackedItems();
	} catch (err) {
		console.error("Failed to add item:", err);
		alert("Failed to add item. Please try again.");
	}
}

function loadTrackedItems() {
	const listContainer = document.getElementById("trackedItemsList");

	try {
		const result = db.exec("SELECT * FROM tracked_items ORDER BY created_at DESC");

		if (!result.length || !result[0].values.length) {
			listContainer.innerHTML = "<p>No items tracked yet. Add one above!</p>";
			return;
		}

		const items = result[0].values;
		listContainer.innerHTML = "";

		items.forEach(item => {
			const [id, itemTag, itemName, priceType, thresholdType, thresholdPrice, isActive, createdAt, orderType] = item;

			const actualOrderType = orderType || "buy";

			const itemDiv = document.createElement("div");
			itemDiv.style.cssText = "border: 1px solid #ccc; padding: 10px; border-radius: 5px; background-color: #f9f9f9";

			itemDiv.innerHTML = `
				<div style="display: flex; justify-content: space-between; align-items: center;">
					<div>
						<strong>${minecraftToHTML(itemName)}</strong> (${itemTag})<br>
						<small id=${itemTag}></small>
					</div>
					<div style="display: flex; gap: 10px;">
						<button onclick="deleteTrackedItem(${id})"
							style="padding: 5px 10px; cursor: pointer; background-color: #f44336; color: white; border: none; border-radius: 3px;">
							Delete
						</button>
					</div>
				</div>
			`;

			listContainer.appendChild(itemDiv);
		});
	} catch (err) {
		console.error("Failed to load tracked items:", err);
		listContainer.innerHTML = "<p>Error loading tracked items</p>";
	}
}

async function deleteTrackedItem(id) {
	if (!confirm("Are you sure you want to delete this tracked item?")) return;

	try {
		db.run("DELETE FROM tracked_items WHERE id = ?", [id]);
		await saveDb();
		lastNotifiedPrices.delete(id);
		loadTrackedItems();
	} catch (err) {
		console.error("Failed to delete item:", err);
		alert("Failed to delete item");
	}
}

async function checkAllTrackedPrices() {
	if (!itemTrackerVar) return;

	try {
		const result = db.exec("SELECT * FROM tracked_items WHERE is_active = 1");
		if (!result.length || !result[0].values.length) return;

		for (const item of result[0].values) {
			const [id, itemTag, itemName, priceType, thresholdType, thresholdPrice, , , orderType] = item;
			await checkItemPriceAndNotify(id, itemTag, itemName, priceType, thresholdType, thresholdPrice, orderType || "buy");
		}
	} catch (err) {
		console.error("Failed to check tracked prices:", err);
	}
}

async function checkItemPriceAndNotify(id, itemTag, itemName, priceType, thresholdType, thresholdPrice, orderType = "buy") {
	const currentPrice = await fetchItemPrice(itemTag, priceType, orderType);
	if (currentPrice == null) return;

	let shouldNotify = false;

	if (thresholdType == "below" && currentPrice < thresholdPrice) shouldNotify = true;
	if (thresholdType == "above" && currentPrice > thresholdPrice) shouldNotify = true;

	const orderTypeText = priceType == "bazaar" ? `${orderType == "sell" ? "Buy Order" : "Sell Order"}` : "";
	const message = `${orderTypeText} is now ${currentPrice.toLocaleString()} coins (threshold: ${thresholdPrice.toLocaleString()})`;

	document.getElementById(itemTag).innerHTML = message;

	if (shouldNotify) {
		const lastPrice = lastNotifiedPrices.get(id);
		if (lastPrice && Math.abs(currentPrice - lastPrice) / lastPrice < 0.05) return;

		if (itemTrackerNotificationsVar == 1) await sendNotification("Price Alert!", message, true);
		lastNotifiedPrices.set(id, currentPrice);
	}
}

async function fetchItemPrice(itemTag, priceType, orderType = "buy") {
	const key = `${itemTag}|${priceType}|${orderType}`;
	return priceCache.get(key) ?? null;
}

function itemTrackerOpenModal() {
	document.getElementById("addItemModal").style.display = "flex";
}

function itemTrackerCloseModal() {
	document.getElementById("addItemModal").style.display = "none";
}
