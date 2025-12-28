
Neutralino.init();

async function sendNotification(title, body) {
    await Neutralino.os.showNotification(
        `${title}`,
        `${body}`
    )
}

async function fetchAuctionData(playerUUID) {

}

window.sendNotification = sendNotification;


/* 
    Order

    Get player UUID
    fetch active auctions : /api/search/{searchVal} | searchval = UUID
    save active auctions in a json.
    every minute or so see if the active auction is still active.
    if its not active get the specic auction id and get sold price and stuff /api/auction/{auctionUuid}


*/