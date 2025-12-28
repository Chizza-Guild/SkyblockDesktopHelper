let activeAuctionsId = new Set();
let currentAuctions;
let previousAuctions;

async function fetchActiveAuctionData() {
	let fetchedAuctions = [];
	// loops through maximum of 35
	outer: for (let depth = 1; depth <= 4; depth++) {
		const response = await fetch(CoflnetUrl + "/player/" + encodeURIComponent(uuidVar) + "/auctions?page=" + depth);

		if (!response.ok) {
			const text = await response.text().catch(() => "");
			throw new Error(`Auction fetch failed ${response.status}: ${text}`);
		}

		const data = await response.json();

		// response can be array or object depending on API version
		const items = Array.isArray(data) ? data : data?.auctions ?? data?.items ?? [];

		// filter to auction-like entries (field names vary)
		const auctions = items.filter(x => x && (x.auctionUuid || x.auctionId || x.uuid || x.id));

		for (const auction of auctions) {
			let auctionId = auction.auctionId;

			if (fetchedAuctions.includes(auctionId)) {
				break outer; // since it repeats that means weve hit all the active auctions.
			} else {
				fetchedAuctions.push(auctionId);
			}
		}
	}

	return fetchedAuctions;
}

async function getDetailedAuctionData(auctionId) {
	const url = CoflnetUrl + "/auction/" + auctionId;
	const response = await fetch(url);

	return response.json();
}

function getEndedAuctions(currentAuctions, previousAuctions) {
	const ended = [];

	for (const id of previousAuctions) {
		if (!currentAuctions.includes(id)) ended.push(id);
	}

	return ended;
}

function getNewAuctions(currentAuctions, previousAuctions) {
	const newAuc = [];

	for (const id of currentAuctions) {
		if (!previousAuctions.includes(id)) newAuc.push(id);
	}

	return newAuc;
}

function auctionNotifierFunc() {
	auctionNotifierVar = auctionNotifierVar == 0 ? 1 : 0; // Swap from 0 to 1 or the opposite, SQLite doesnt have booleans
	alert(`${auctionNotifierVar == 1 ? "Started watching for sold auctions!" : "Stopped watching for sold auctions :("}`);
	saveFeatureSettings();
}

async function main() {
	previousAuctions = await fetchActiveAuctionData();
	while (auctionNotifierVar == 1) {
		try {
			currentAuctions = await fetchActiveAuctionData();
			console.log("CurrentActions", currentAuctions);

			let endedAuctions = [];
			endedAuctions = getEndedAuctions(currentAuctions, previousAuctions);
			console.log("EndedAuctions:", endedAuctions);

			for (const ended of endedAuctions) {
				sendNotification("Auction Ended!", "");
			}
		} catch (err) {
			console.error(err);
		}

		previousAuctions = currentAuctions;
		currentAuctions = [];
		await sleep(2 * 10 * 1000); // 2 min pause
	}
}

main();

/* 
    Order

    Get player UUID : GET /api/search/player/{playerName}
    fetch active auctions : /api/search/{searchVal} | searchval = UUID
    save active auctions in a json.
    every minute or so see if the active auction is still active.
    if its not active get the specic auction id and get sold price and stuff /api/auction/{auctionUuid}

*/
