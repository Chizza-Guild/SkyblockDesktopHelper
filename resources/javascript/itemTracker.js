let priceTrackerActive = false;
let priceCheckInterval = null;
let lastNotifiedPrices = new Map(); // Track last notified price to avoid spam
let allItems = []; // Store fetched items from API

// Minecraft color code mapping
const MINECRAFT_COLORS = {
	"0": "#000000", // Black
	"1": "#0000AA", // Dark Blue
	"2": "#00AA00", // Dark Green
	"3": "#00AAAA", // Dark Aqua
	"4": "#AA0000", // Dark Red
	"5": "#AA00AA", // Dark Purple
	"6": "#FFAA00", // Gold
	"7": "#AAAAAA", // Gray
	"8": "#555555", // Dark Gray
	"9": "#5555FF", // Blue
	"a": "#55FF55", // Green
	"b": "#55FFFF", // Aqua
	"c": "#FF5555", // Red
	"d": "#FF55FF", // Light Purple
	"e": "#FFFF55", // Yellow
	"f": "#FFFFFF", // White
};

const MINECRAFT_FORMATS = {
	"l": "font-weight: bold",
	"o": "font-style: italic",
	"n": "text-decoration: underline",
	"m": "text-decoration: line-through",
};

// Convert Minecraft color codes to HTML
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

// Strip Minecraft color codes for plain text display
function stripMinecraftCodes(text) {
	if (!text || typeof text !== "string") return text;
	return text.replace(/[§&][0-9a-fk-or]/gi, "");
}

// Initialize when page loads
async function initItemTracker() {
	await fetchAllItems();
	populateItemsList();

	const form = document.getElementById("addItemForm");
	if (form) {
		form.addEventListener("submit", handleAddItem);
	}

	// Load tracker state from localStorage
	const savedState = localStorage.getItem("priceTrackerActive");
	priceTrackerActive = savedState === "true";
	const checkbox = document.getElementById("trackerActiveBtn");
	if (checkbox) {
		checkbox.checked = priceTrackerActive;
	}

	loadTrackedItems();

	// Start tracking if it was previously active
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

		// Filter out items without names and store only tradeable items (AUCTION or BAZAAR)
		allItems = items
			.filter(item => {
				const hasName = item.name && item.name !== "null" && item.name.trim() !== "";
				const isTradeable = item.flags === "AUCTION" || item.flags === "BAZAAR";
				return hasName && isTradeable;
			})
			.map(item => ({
				tag: item.tag,
				name: item.name,
				type: item.flags // "AUCTION" or "BAZAAR"
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

	// Sort items alphabetically by name (stripped of color codes for sorting)
	const sortedItems = [...allItems].sort((a, b) => {
		const nameA = stripMinecraftCodes(a.name);
		const nameB = stripMinecraftCodes(b.name);
		return nameA.localeCompare(nameB);
	});

	sortedItems.forEach(item => {
		const option = document.createElement("option");
		option.value = item.tag;
		// Strip color codes for datalist (doesn't support HTML)
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
			// For bazaar items, show a dropdown to select buy or sell order
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

	// Get item info from the fetched items list
	const foundItem = allItems.find(item => item.tag === itemTag);

	if (!foundItem) {
		alert("Please select a valid item from the dropdown list");
		return;
	}

	const itemName = foundItem.name;
	// Convert API type (BAZAAR/AUCTION) to internal price type (bazaar/bin)
	const priceType = foundItem.type === "BAZAAR" ? "bazaar" : "bin";

	// Get order type for bazaar items (buy or sell)
	let orderType = "buy"; // Default to buy
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
			[itemTag, itemName, priceType, thresholdType, thresholdPrice, orderType]
		);
		await saveDb();

		// Clear form
		document.getElementById("addItemForm").reset();

		// Reload the list
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

			// Default to 'buy' if orderType is null (for backward compatibility)
			const actualOrderType = orderType || 'buy';

			const itemDiv = document.createElement("div");
			itemDiv.style.cssText = "border: 1px solid #ccc; padding: 10px; border-radius: 5px; background-color: #f9f9f9";

			// Build price type display text
			let priceTypeText;
			if (priceType === "bazaar") {
				priceTypeText = `Bazaar (${actualOrderType === 'sell' ? 'Sell Order' : 'Buy Order'})`;
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
		lastNotifiedPrices.delete(id); // Clean up notification tracking
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

	// Check prices every 2 minutes (respecting API rate limits)
	priceCheckInterval = setInterval(() => {
		checkAllTrackedPrices();
	}, 2 * 60 * 1000);

	// Also check immediately
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

			// Default to 'buy' if orderType is null (for backward compatibility)
			const actualOrderType = orderType || 'buy';

			try {
				await checkItemPriceAndNotify(id, itemTag, itemName, priceType, thresholdType, thresholdPrice, actualOrderType);
				// Small delay between requests to respect rate limits
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
		// Check if we already notified for a similar price (within 5% to avoid spam)
		const lastPrice = lastNotifiedPrices.get(id);
		if (lastPrice && Math.abs(currentPrice - lastPrice) / lastPrice < 0.05) {
			return; // Don't spam notifications for similar prices
		}

		// Strip color codes for notification (OS notifications are plain text)
		const cleanName = stripMinecraftCodes(itemName);

		// Build order type text for bazaar items
		let orderTypeText = '';
		if (priceType === "bazaar") {
			orderTypeText = ` (${orderType === 'sell' ? 'Sell Order' : 'Buy Order'})`;
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
			const orderTypeText = priceType === "bazaar" ? ` (${orderType === 'sell' ? 'Sell Order' : 'Buy Order'})` : '';
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
			// Fetch bazaar price
			const response = await fetch(`${CoflnetUrl}/bazaar/${encodeURIComponent(itemTag)}/snapshot`);

			if (!response.ok) {
				console.error(`Bazaar API returned ${response.status}`);
				return null;
			}

			const data = await response.json();

			// Return the appropriate price based on order type
			if (orderType === "sell") {
				// Sell order = instant sell price (what a player would receive selling instantly)
				return data.sellPrice || data.quickStatus?.sellPrice || null;
			} else {
				// Buy order = instant buy price (what a player would pay to buy instantly)
				return data.buyPrice || data.quickStatus?.buyPrice || null;
			}
		} else if (priceType === "bin") {
			// Fetch auction BIN price
			const response = await fetch(`${CoflnetUrl}/auctions/tag/${encodeURIComponent(itemTag)}/active/bin`);

			if (!response.ok) {
				console.error(`Auction API returned ${response.status}`);
				return null;
			}

			const data = await response.json();

			// Get the lowest BIN price from active auctions
			if (Array.isArray(data) && data.length > 0) {
				// Find the lowest starting bid
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
