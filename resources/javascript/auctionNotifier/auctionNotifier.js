const BASEURL = "https://sky.coflnet.com/api"
const UuidEndpoint = "/search/player/" // use name

Neutralino.init();

let {playerName, Api_Key} = window.getSavedSettings();

async function sendNotification(title, body) {
    await Neutralino.os.showNotification(
        `${title}`,
        `${body}`
    )
}

async function getPlayerUuid(playerName) {
    playerName = window.getSavedSettings().name;
    const url = BASEURL + UuidEndpoint;
    const response = await fetch(url + encodeURIComponent(playerName));

    if (!response.ok) { // if nothing came throws error
        throw new Error(`Couldnt fetch player data for player ${playerName}`);
    }

    const players = await response.json();

    let uuid = players[0].uuid;
    alert(uuid)
    return uuid;
}


async function fetchAuctionData(playerUuid, limit = 50) {
    const url = BASEURL + `/player/${playerUuid}/auctions`;

    const response = await fetch(url + encodeURIComponent(playerName) + "?" + limit);

}

async function main() {

}

window.sendNotification = sendNotification;
window.getPlayerUuid = getPlayerUuid;
window.main = main;


/* 
    Order

    Get player UUID : GET /api/search/player/{playerName}
    fetch active auctions : /api/search/{searchVal} | searchval = UUID
    save active auctions in a json.
    every minute or so see if the active auction is still active.
    if its not active get the specic auction id and get sold price and stuff /api/auction/{auctionUuid}


*/