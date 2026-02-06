let priceTrackerActive = false;
let priceCheckInterval = null;
let lastNotifiedPrices = new Map();
let allItems = [];

async function initItemTracker() {
	await fetchAllItems();
	populateItemsList();

	const form = document.getElementById("addItemForm");
	if (form) {
		form.addEventListener("submit", handleAddItem);
	}

	const savedState = localStorage.getItem("priceTrackerActive");
	priceTrackerActive = savedState === "true";
	const checkbox = document.getElementById("trackerActiveBtn");
	if (checkbox) {
		checkbox.checked = priceTrackerActive;
	}

	loadTrackedItems();

	if (priceTrackerActive) {
		startPriceTracking();
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
				const hasName = item.name && item.name !== "null" && item.name.trim() !== "";
				const isTradeable = item.flags === "AUCTION" || item.flags === "BAZAAR";
				return hasName && isTradeable;
			})
			.map(item => ({
				tag: item.tag,
				name: item.name,
				type: item.flags,
			}));

		console.log(`Loaded ${allItems.length} items from API`);
	} catch (err) {
		console.error("Error fetching items:", err);
		allItems = [];
	}
}

function populateItemsList() {
	const datalist = document.getElementById("itemsList");
	if (!datalist) return;

	datalist.innerHTML = "";

	if (allItems.length === 0) {
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
		option.value = item.tag;
		const cleanName = stripMinecraftCodes(item.name);
		option.textContent = `${cleanName} - [${item.type}] (${item.tag})`;
		datalist.appendChild(option);
	});
}

function updatePriceType() {
	const itemTag = document.getElementById("itemTagInput").value.trim().toUpperCase();
	const priceTypeDisplay = document.getElementById("priceTypeDisplay");

	if (!itemTag) {
		priceTypeDisplay.textContent = "Select an item to see price type";
		priceTypeDisplay.style.backgroundColor = "#f0f0f0";
		priceTypeDisplay.style.color = "#000";
		return;
	}

	const foundItem = allItems.find(item => item.tag === itemTag);

	if (foundItem) {
		if (foundItem.type === "BAZAAR") {
			priceTypeDisplay.innerHTML = `
				<div style="display: flex; align-items: center; gap: 10px;">
					<span style="font-weight: bold; color: #1976d2;">Bazaar</span>
					<select id="orderTypeSelect" style="flex: 1; padding: 5px; background-color: #e3f2fd; border: 1px solid #1976d2; border-radius: 3px; font-weight: bold; color: #1976d2;">
						<option value="buy">Buy Order (Instant Buy)</option>
						<option value="sell">Sell Order (Instant Sell)</option>
					</select>
				</div>
			`;
			priceTypeDisplay.style.backgroundColor = "#e3f2fd";
			priceTypeDisplay.style.color = "#1976d2";
		} else if (foundItem.type === "AUCTION") {
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

async function handleAddItem(event) {
	event.preventDefault();

	const itemTag = document.getElementById("itemTagInput").value.trim().toUpperCase();
	const thresholdType = document.getElementById("thresholdTypeSelect").value;
	const thresholdPrice = parseFloat(document.getElementById("thresholdPriceInput").value);

	if (!itemTag || !thresholdPrice) {
		alert("Please fill in all fields");
		return;
	}

	const foundItem = allItems.find(item => item.tag === itemTag);

	if (!foundItem) {
		alert("Please select a valid item from the dropdown list");
		return;
	}

	const itemName = foundItem.name;
	const priceType = foundItem.type === "BAZAAR" ? "bazaar" : "bin";

	let orderType = "buy";
	if (foundItem.type === "BAZAAR") {
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

		document.getElementById("addItemForm").reset();

		loadTrackedItems();

		console.log("Item added successfully");
	} catch (err) {
		console.error("Failed to add item:", err);
		alert("Failed to add item. Please try again.");
	}
}

function loadTrackedItems() {
	const listContainer = document.getElementById("trackedItemsList");
	if (!listContainer) return;

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

			let priceTypeText;
			if (priceType === "bazaar") {
				priceTypeText = `Bazaar (${actualOrderType === "sell" ? "Sell Order" : "Buy Order"})`;
			} else {
				priceTypeText = "Auction BIN";
			}

			itemDiv.innerHTML = `
				<div style="display: flex; justify-content: space-between; align-items: center;">
					<div>
						<strong>${minecraftToHTML(itemName)}</strong> (${itemTag})<br>
						<small>
							${priceTypeText} -
							Alert when ${thresholdType} ${thresholdPrice.toLocaleString()} coins
						</small>
					</div>
					<div style="display: flex; gap: 10px;">
						<button onclick="checkItemPrice('${itemTag}', '${priceType}', '${actualOrderType}')"
							style="padding: 5px 10px; cursor: pointer; background-color: #2196F3; color: white; border: none; border-radius: 3px;">
							Check Now
						</button>
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
	if (!confirm("Are you sure you want to delete this tracked item?")) {
		return;
	}

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

function togglePriceTracking() {
	priceTrackerActive = document.getElementById("trackerActiveBtn").checked;
	localStorage.setItem("priceTrackerActive", priceTrackerActive ? "true" : "false");

	if (priceTrackerActive) {
		startPriceTracking();
		alert("Price tracking started! You'll receive notifications when prices cross your thresholds.");
	} else {
		stopPriceTracking();
		alert("Price tracking stopped.");
	}
}

function startPriceTracking() {
	if (priceCheckInterval) {
		clearInterval(priceCheckInterval);
	}

	priceCheckInterval = setInterval(
		() => {
			checkAllTrackedPrices();
		},
		2 * 60 * 1000,
	);

	checkAllTrackedPrices();
}

function stopPriceTracking() {
	if (priceCheckInterval) {
		clearInterval(priceCheckInterval);
		priceCheckInterval = null;
	}
}

async function checkAllTrackedPrices() {
	if (!priceTrackerActive) return;

	try {
		const result = db.exec("SELECT * FROM tracked_items WHERE is_active = 1");
		if (!result.length || !result[0].values.length) return;

		const items = result[0].values;

		for (const item of items) {
			const [id, itemTag, itemName, priceType, thresholdType, thresholdPrice, isActive, createdAt, orderType] = item;

			const actualOrderType = orderType || "buy";

			try {
				await checkItemPriceAndNotify(id, itemTag, itemName, priceType, thresholdType, thresholdPrice, actualOrderType);
				await sleep(500);
			} catch (err) {
				console.error(`Failed to check price for ${stripMinecraftCodes(itemName)}:`, err);
			}
		}
	} catch (err) {
		console.error("Failed to check tracked prices:", err);
	}
}

async function checkItemPriceAndNotify(id, itemTag, itemName, priceType, thresholdType, thresholdPrice, orderType = "buy") {
	const currentPrice = await fetchItemPrice(itemTag, priceType, orderType);

	if (currentPrice === null) {
		console.log(`Could not fetch price for ${stripMinecraftCodes(itemName)}`);
		return;
	}

	let shouldNotify = false;

	if (thresholdType === "below" && currentPrice < thresholdPrice) {
		shouldNotify = true;
	} else if (thresholdType === "above" && currentPrice > thresholdPrice) {
		shouldNotify = true;
	}

	if (shouldNotify) {
		const lastPrice = lastNotifiedPrices.get(id);
		if (lastPrice && Math.abs(currentPrice - lastPrice) / lastPrice < 0.05) {
			return;
		}

		const cleanName = stripMinecraftCodes(itemName);

		let orderTypeText = "";
		if (priceType === "bazaar") {
			orderTypeText = ` (${orderType === "sell" ? "Sell Order" : "Buy Order"})`;
		}

		const message = `${cleanName}${orderTypeText} is now ${currentPrice.toLocaleString()} coins (threshold: ${thresholdPrice.toLocaleString()})`;
		await sendNotification("Price Alert!", message, true);
		lastNotifiedPrices.set(id, currentPrice);
		console.log(`Notification sent for ${cleanName}: ${message}`);
	}
}

async function checkItemPrice(itemTag, priceType, orderType = "buy") {
	try {
		const price = await fetchItemPrice(itemTag, priceType, orderType);
		if (price !== null) {
			const orderTypeText = priceType === "bazaar" ? ` (${orderType === "sell" ? "Sell Order" : "Buy Order"})` : "";
			alert(`Current price${orderTypeText}: ${price.toLocaleString()} coins`);
		} else {
			alert("Could not fetch price. Please check the item tag and try again.");
		}
	} catch (err) {
		console.error("Failed to check price:", err);
		alert("Error checking price");
	}
}

async function fetchItemPrice(itemTag, priceType, orderType = "buy") {
	try {
		if (priceType === "bazaar") {
			const response = await fetch(`${CoflnetUrl}/bazaar/${encodeURIComponent(itemTag)}/snapshot`);

			if (!response.ok) {
				console.error(`Bazaar API returned ${response.status}`);
				return null;
			}

			const data = await response.json();

			if (orderType === "sell") {
				return data.sellPrice || data.quickStatus?.sellPrice || null;
			} else {
				return data.buyPrice || data.quickStatus?.buyPrice || null;
			}
		} else if (priceType === "bin") {
			const response = await fetch(`${CoflnetUrl}/auctions/tag/${encodeURIComponent(itemTag)}/active/bin`);

			if (!response.ok) {
				console.error(`Auction API returned ${response.status}`);
				return null;
			}

			const data = await response.json();

			if (Array.isArray(data) && data.length > 0) {
				const prices = data.map(auction => auction.startingBid || auction.bin || auction.price).filter(p => p > 0);
				return prices.length > 0 ? Math.min(...prices) : null;
			}

			return null;
		}
	} catch (err) {
		console.error(`Error fetching ${priceType} price for ${itemTag}:`, err);
		return null;
	}
}

function itemTrackerOpenModal() {
	document.getElementById("addItemModal").style.display = "flex";
}

function itemTrackerCloseModal() {
	document.getElementById("addItemModal").style.display = "none";
}
