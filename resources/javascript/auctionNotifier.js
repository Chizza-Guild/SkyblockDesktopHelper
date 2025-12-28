const CoflnetUrl = "https://sky.coflnet.com/api";

let activeAuctionsId = new Set();
let subscribed = false;
let currentAuctions;
let previousAuctions;

async function fetchActiveAuctionData(playerUuid) {
	let fetchedAuctions = [];
	// loops through maximum of 35
	outer: for (let depth = 1; depth <= 4; depth++) {
		const response = await fetch(CoflnetUrl + "/player/" + encodeURIComponent(playerUuid) + "/auctions?page=" + depth);

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

function updateCheckbox() {
	subscribed = document.getElementById("aucNotyBtn").checked;
	localStorage.setItem("auctionNotifierSubscribed", subscribed ? "true" : "false");
}

async function main() {
	alert(`${subscribed ? "Started watching for sold auctions!" : "Stopped watching for sold auctions :("}`);
	previousAuctions = await fetchActiveAuctionData(uuidVar);
	while (subscribed) {
		try {
			currentAuctions = await fetchActiveAuctionData(uuidVar);
			console.log(currentAuctions);
			let endedAuctions = [];
			endedAuctions = getEndedAuctions(currentAuctions, previousAuctions);
			console.log(endedAuctions);
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

/* 
    Order

    Get player UUID : GET /api/search/player/{playerName}
    fetch active auctions : /api/search/{searchVal} | searchval = UUID
    save active auctions in a json.
    every minute or so see if the active auction is still active.
    if its not active get the specic auction id and get sold price and stuff /api/auction/{auctionUuid}

*/
