## Plans for Version 1.1.0 Release

- Change tray icon logo
- Add a downtime area for notifs ( ex 6pm - 6am or smth) or sends quitely (no ping on discord then repings at morning or smth) --> Let the user pick this

In Item Price Tracker: (mlg)

- Prevent tracking the same item twice

### Plans for Version 1.2.0 Release

- bug: item tracker has some items missing in API response (like molten powder)
- add OAuth2 so people don't put others discord IDs.
- make a setting in settings to activate any Discord notifs or not
- Fix forge timer not taking forge speedups to account (HOTM, Cole perk, etc.)
- add "no items being sold" to the auction notifier if there are no results
- in settings, toggle notifications
- add modifiers for Price Tracking (recoms, and other ones like, etherwarp for aotv or enchants)



Minion calc (ry) (1.2 or 1.1.x)
- Finish minionData.json (rev, tara void sunflower) 
- New json for all upgrades
- Be able to calculate minions for the best things. Money Collection Skill, etc. (if t1 isnt craftable. Check market, and if not on market just put an arbitrary number)
- add minion slot calculator too.

- make forgetimer load the cache. and use the map for everything
- run the forgetimer fetch like hourly (api_fetching)
- In the auction notifier, don't print "current bid" if it's BIN

### Not started

- Have an api endpoint in vercel maybe

- RYRY --> Daily tasks tracker
- VANG --> built-in event timers (Fiestas, farming contests (selectable crops), fallen stars, dark auctions etc.)
- RYRY --> mayors page (Current mayor and perks, last election results, next election candidates and votes etc.)
- VANG --> news, derailious videos, cowshed, popular reddit posts in one page
- MLG --> improved PV (Vs skycrypt), that can save the current data as a snapshot
- MLG --> calculate NW with the items in your island chests,
- add skyhelper bot features,
- Farming helper, speed/pitch guide and profit calculator from farming fortune and blocks per second
- MLG --> NPC buy Bazaar Sell flips (btw the api has npc sell price if u didnt know)
- MLG --> Bazaar buy npc sell flips
- MLG --> Effective HP Calculator
- MLG --> Drop calculator with fortune & pristine
- MLG --> Compost Profit Calculator
- RYRY --> Carpentry skill calculator
- RYRY --> Minion slot calculator
- Greenhouse Calculator by mlg
- RYRY --> BZ buy/sell offer notifier. (If your order gets outdated or fills send notif)
- RYRY --> Gambleing Calculator (dice, alter, dragons, ect.)
- RYRY --> Pet leveling. (Like looks a price for say a gdrag at lvl 140 and if each level upgrade makes more than like a 102 it recomends that one. Like the outcro one.)

### Ideas (feel free to add)

- Skyblock AI, train off of wiki. mostly just asking questions about different things. Maybe profile reviews too?

- Guild "marketplace" for people to advertise guilds.

- Money making guide marketplace.


### Misc

Minion Market (ry) 
- When buyer presses buy, send notification to seller. Make a setting in settings that can make it so it can auto create a channel with buyer and seller. Or the seller can make a channel on their own. 

no settings, but creates a channel (good enough for 1.1)
    In order for settings to work id have to save the ids and private weburls on supabase so when the buyer clicks buy, it talks to supabase and calls smth to go onto the sellers discord, or we also have the seller constantly check to see if their is , but that also may make privacy concers but idk.
    
- make a generated uuid for each user so the buyer cant just use the sellers discord id to delete their listings. smth with supabase. or OAUTH2 (version 1.2)

Future stuff for this :
- if we notice that users are making bogus listings. Limit to like 5 or We can scan their profile to see if they have that minion in their storage. Maybe scan chests too if users use that for networth calculator in future.

