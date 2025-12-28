const BASEURL = "https://sky.coflnet.com/api"
const UuidEndpoint = "/search/player/" // use name

let activeAuctionsId = new Set();
let subscribed = false;
if (typeof Neutralino !== 'undefined' && Neutralino.init) Neutralino.init();
let playerName;

async function sendNotification(title, body) {
    await Neutralino.os.showNotification(
        `${title}`,
        `${body}`
    )
}

async function getPlayerUuid(playerName) {
    const url = BASEURL + UuidEndpoint;
    const response = await fetch(url + encodeURIComponent(playerName));

    if (!response.ok) { // if nothing came throws error
        throw new Error(`Couldnt fetch player data for player ${playerName}`);
    }

    const players = await response.json();

    let uuid = players[0].uuid;
    return uuid;
}


async function fetchActiveAuctionData(playerUuid) {
    
    let fetchedAuctions = [];
    outer:
    // loops through maximum of 35
    for (let depth = 1; depth <= 4; depth++) {
        const response = await fetch(BASEURL + "/player/" + encodeURIComponent(playerUuid)  + "/auctions?page=" + depth);

        if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(`Auction fetch failed ${response.status}: ${text}`);
        }

        const data = await response.json();

        // response can be array or object depending on API version
        const items = Array.isArray(data) ? data : (data?.auctions ?? data?.items ?? []);

        // filter to auction-like entries (field names vary)
        const auctions = items.filter(x => x && (x.auctionUuid || x.auctionId || x.uuid || x.id));

        for (const auction of auctions) {
            let auctionId = auction.auctionId;

            if (fetchedAuctions.includes(auctionId)) {
                break outer;  // since it repeats that means weve hit all the active auctions.
            } else {
                fetchedAuctions.push(auctionId);
            }

            
            
        }
    }

    return fetchedAuctions;
}

async function getDetailedAuctionData(auctionId) {
    const url = BASEURL + "/auction/" + auctionId;

    const response = await fetch(url);

    return response.json();
}



function getEndedAuctions(currentAuctions, previousAuctions) {
    const ended = []

    for (const id of previousAuctions) {
        if (!currentAuctions.includes(id)) ended.push(id);
    }

    return ended;
}

function getNewAuctions(currentAuctions, previousAuctions) {
    const newAuc = []

    for (const id of currentAuctions) {
        if (!previousAuctions.includes(id)) newAuc.push(id);
    }

    return newAuc;
}

let uuid;

function updateCheckbox () {
    subscribed = document.getElementById("aucNotyBtn").checked;
    try {
        localStorage.setItem('auctionNotifierSubscribed', subscribed ? 'true' : 'false');
    } catch (e) {
        // ignore storage errors
    }
}

async function init() {
    playerName = window.getSavedSettings().name;
    uuid = await getPlayerUuid(playerName);
    fetchedAuctions = await fetchActiveAuctionData(uuid);
    previousAuctions = fetchedAuctions;
}

let currentAuctions;
let previousAuctions;
async function main() {
    if (subscribed) alert("Started watching for sold auctions!"); else alert("Stopped watching for sold auctions :(");
    await init();
    while (subscribed) {
        try {
            console.log(playerName)
            currentAuctions = await fetchActiveAuctionData(uuid);
            console.log(currentAuctions);
            let endedAuctions = [];
            endedAuctions = getEndedAuctions(currentAuctions, previousAuctions);
            console.log(endedAuctions);
            for (const ended of endedAuctions) {
                sendNotification(
                    "Auction Ended!",
                    ""
                );
            }
            
        } catch (err) {
            console.error(err);
        }

        previousAuctions = currentAuctions;
        currentAuctions = [];
        await sleep(2 * 10 * 1000); // 2 min pause
        
    }
    
}

document.addEventListener("DOMContentLoaded", () => {
  window.main = main; // or set up handlers here
});



window.sendNotification = sendNotification;
window.getPlayerUuid = getPlayerUuid;
window.main = main;
window.updateCheckbox = updateCheckbox;


/* 
    Order

    Get player UUID : GET /api/search/player/{playerName}
    fetch active auctions : /api/search/{searchVal} | searchval = UUID
    save active auctions in a json.
    every minute or so see if the active auction is still active.
    if its not active get the specic auction id and get sold price and stuff /api/auction/{auctionUuid}


*/