const notifiedAuctions = new Set();
let currentAuctions = [];
let previousAuctions = [];

async function getActiveAuctions(apiKey, playerUuid) {
	const url = `https://api.hypixel.net/skyblock/auction?key=${apiKey}&player=${playerUuid}`;
	document.getElementById("currentAuctionsList").innerHTML = "";

	try {
		const response = await fetch(url);
		const data = await response.json();

		if (data && data.success && Array.isArray(data.auctions)) {
			const now = Date.now();

			// Filter: Only shows auctions that haven't ended yet
			const activeAuctions = data.auctions.filter(auc => auc && (auc.end ?? 0) > now);

			// Defensive logging - avoid calling methods on undefined
			activeAuctions.forEach(auc => {
				try {
					const currentBid = auc.highest_bid_amount ?? auc.starting_bid ?? 0;
					const starting = auc.starting_bid ?? 0;
					const tier = auc.tier ?? "";
					document.getElementById("currentAuctionsList").innerHTML += `
                        <div class="auction-item">
                            <h3>${auc.item_name ?? "&lt;unknown&gt;"}</h3>
                            <h4>Current Bid: ${Number(currentBid).toLocaleString()} coins</h4>
                            <h4>Item Price: ${Number(starting).toLocaleString()} coins</h4>
                            <h5>Rarity: ${tier}</h5>
                            <h5>Ends in: ${Math.round(((auc.end ?? now) - now) / 60000)} minutes</h5>
                            <hr>
                        </div>
                    `;
				} catch (e) {
					console.warn("Logging auction failed for entry, continuing", e, auc);
				}
			});

			return activeAuctions;
		}

		console.error("API Error or unexpected response shape:", data && data.cause ? data.cause : data);
	} catch (error) {
		console.error("Request failed:", error);
	}

	// On any error, return an empty array so callers can continue safely
	return [];
}

async function getDetailedAuctionData(auctionId) {
	const base = typeof CoflnetUrl !== "undefined" && CoflnetUrl ? CoflnetUrl : "https://sky.coflnet.com/api";
	const url = base + "/auction/" + auctionId;
	const response = await fetch(url);

	return response.json();
}

function _getId(a) {
	return a?.uuid ?? a?.auctionUuid ?? a?.auctionId ?? a?.id ?? null;
}

function getEndedAuctions(currentAuctions = [], previousAuctions = []) {
	const currentIds = new Set(currentAuctions.map(a => _getId(a)).filter(Boolean));
	return previousAuctions.filter(a => {
		const id = _getId(a);
		return id && !currentIds.has(id);
	});
}

function getNewAuctions(currentAuctions = [], previousAuctions = []) {
	const prevIds = new Set(previousAuctions.map(a => _getId(a)).filter(Boolean));
	return currentAuctions.filter(a => {
		const id = _getId(a);
		return id && !prevIds.has(id);
	});
}


function auctionNotifierFunc() {
	auctionNotifierVar = auctionNotifierVar == 0 ? 1 : 0; // Swap from 0 to 1 or the opposite, SQLite doesnt have booleans
	alert(`${auctionNotifierVar == 1 ? "Started watching for sold auctions!" : "Stopped watching for sold auctions :("}`);
	saveFeatureSettings();
}

async function main() {
	if (!apiKeyVar || !uuidVar) {
		console.error("Missing apiKeyVar or uuidVar — auction notifier cannot start");
		return;
	}

	previousAuctions = await getActiveAuctions(apiKeyVar, uuidVar);

	await sendNotification("Auction Tracker Started", "Tracking auctions");

	while (auctionNotifierVar == 1) {
		try {
			currentAuctions = await getActiveAuctions(apiKeyVar, uuidVar);
			console.log(currentAuctions);

			const endedAuctions = getEndedAuctions(currentAuctions, previousAuctions);
			console.log(endedAuctions);

			if (endedAuctions.length > 0) {
				await sendNotification("Auction sold!", `${endedAuctions[0].item_name} sold for ${endedAuctions[0].starting_bid} coins.`);
			}

			// IMPORTANT: copy array, don’t reference
			previousAuctions = [...currentAuctions];
		} catch (err) {
			console.error("Loop error:", err);
		}

		await sleep(2 * 15 * 1000); // 30 sec
	}
}
async function start() {
	await Neutralino.init();
	await main();
}

start();

/* 
    Order

    Get player UUID : GET /api/search/player/{playerName}
    fetch active auctions : /api/search/{searchVal} | searchval = UUID
    save active auctions in a json.
    every minute or so see if the active auction is still active.
    if its not active get the specic auction id and get sold price and stuff /api/auction/{auctionUuid}

*/
