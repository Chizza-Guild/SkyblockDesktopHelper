## Plans for Version 1.1.0 Release

- Change tray icon logo
- Fully working minion market
- Complete minions JSON
- Add a downtime area for notifs ( ex 6pm - 6am or smth) or sends quitely (no ping on discord then repings at morning or smth) --> Let the user pick this

Minion calc (pink-ry)
- Finish minionData.json (rev, tara void sunflower) 
- New json for all upgrades
- Be able to calculate minions for the best things. Money Collection Skill, etc. (if t1 isnt craftable. Check market, and if not on market just put an arbitrary number)
- add minion slot calculater too.

Minion Market (ry) 
- Update bot so you can make a channel with multiple people with supabase edge func.
- When buyer presses buy, send notification to seller. Make a setting in settings that can make it so it can auto create a channel with buyer and seller. Or the seller can make a channel on their own.
- make a generated uuid for each user so the buyer cant just use the sellers discord id to delete their listings. smth with supabase. or OAUTH2 (version 1.2)

Future stuff for this :
- if we notice that users are making bogus listings. Limit to like 5 or We can scan their profile to see if they have that minion in their storage. Maybe scan chests too if users use that for networth calculator in future.

In Item Price Tracker: (mlg)

- Make "Enable Price Tracking" enabled by default. If its disabled, do some red warnings
- Add Price Tracking to the settings, on-off
- Prevent tracking the same item twice
- each press on item price tracker fetches from the api, fix
- item list could be ordered a-->z

### Plans for Version 1.2.0 Release

- add OAuth2 so people don't put others discord IDs.
- make a setting in settings to activate any Discord notifs or not
- Fix forge timer not taking forge speedups to account (HOTM, Cole perk, etc.)
- add "no items being sold" to the auction notifier if there are no results
- in settings, toggle notifications (TODO)

- optimise api calling so price api is called every 2 mins, profile api is called every 15 mins or when profile viewer is opened etc. --> check cache first, but the user can request new
- test ifthe  forgetimer works correctly and once sends the notifications
- make forgetimer load the cache. and use the map for everything
- run the forgetimer fetch like hourly (api_fetching)
- In the auction notifier, don't print "current bid" if it's BIN

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
