## Plans for Version 1.1.0 Release

- Change tray icon logo
- Fully working minion market
- Complete minions JSON

In Item Price Tracker: (mlg)

- Remove "check now" button and just write the current price
- Add a div where the user can see when was the data last refreshed
- Make "Enable Price Tracking" enabled by default. If its disabled, do some red warnings
- Add Price Tracking to the settings, on-off
- add ARE YOU SURE TO DELETE THIS ITEM???
- each press on item price tracker fetches from the api, fix
- item list could be ordered a-->z

### Plans for Version 1.2.0 Release

- RYRY --> Discord notifications.
- make a setting in settings to activate any discord notifs or not
- Fix forge timer not taking forge speedups to account (HOTM, Cole perk, etc.)
- add "no items being sold" to auction notifier if there is no results
- in settings, toggle notifications (TODO)

- optimise api calling so price api is called every 2 mins, profile api is called every 15 mins or when profile viewer is opened etc. --> check cache first but the user can request new
- test if forgetimer correctly and once sends the notifications
- make forgetimer load the cache. and use the map for everything
- run the forgetimer fetch like hourly (api_fetching)
- in auction notifier, dont print "current bid" if its BIN

### Not started

- Have an api endpoint in vercel maybe

- Daily tasks tracker
- VANG --> built-in event timers (Fiestas, farming contests (selectable crops), fallen stars, dark auctions etc.)
- VANG --> mayors page (Current mayor and perks, last election results, next election candidates and votes etc.)
- VANG --> news, derailious videos, cowshed, popular reddit posts in one page
- MLG --> improved PV (Vs skycrypt), that can save the current data as a snapshot
- MLG --> calculate NW with the items in your island chests,
- add skyhelper bot features,
- Farming helper, speed/pitch guide and profit calculator from farming fortune and blocks per second
- MLG --> NPC buy Bazaar Sell flips
- MLG --> Bazaar buy npc sell flips
- MLG --> Effective HP Calculator
- MLG --> Drop calculator with fortune & pristine
- MLG --> Compost Profit Calculator
- RYRY --> Carpentry skill calculator
- RYRY --> Minion slot calculator
- Greenhouse Calculator by mlg
