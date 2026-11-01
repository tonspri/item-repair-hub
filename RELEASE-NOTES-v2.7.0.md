## Item Repair Hub v2.7.0

By DaggerHashimoto. Renewal only. The first update since v2.3.1 that players can install from Find Mods.

### iRO item repairs (new since v2.3.1)

- **32 items** now match their official iRO descriptions: missing refine tiers, autocasts, Base Level bonuses and class bonuses. Examples: Future Wolf King Hat, Blighted Skullcap, Saint Knight Armor, Agni Sword, Vayu Follower Bow, Boreas Wings, Purple Haze.
- On by default behind one Mod Settings switch, **iRO effect repairs**. To turn off one item, add it in the editor, choose **Remove item**, then Save & Export.
- Some items now use iRO's refine levels, which are higher than before, so they are weaker at low refine: Starry Sky Twin Prime, Kshatra Vairya, Save the King, Squirrel Ear Hat, Brilliant, Infinity Blade, Awakened Old King's Double Edge and Mesarthim.
- Cocytus Armor's autocasts are ordinary item bonuses now (no Lua hook).

### Live changes (new since v2.3.1)

A third editor tab changes the gear you are wearing **while the game runs, with no restart**, from an ordinary player account (no GM commands):

- **Scan my equipment** lists what you wear, with refine and cards.
- Each item's effects are written out in plain English and worked out at your refine. Tiers above your refine are dimmed.
- **Description check** compares the in-game description with the item's script and lists what looks missing. **Copy report** gives a short text to share. It reads wording only, so treat each line as a lead.
- Add stats with pickers or advanced bonus lines, and save stat sets as **presets**.
- **Apply now** puts the change live. It stays after restarts until you **Undo** it (or **Undo all**).
- Live changes are not exported unless you choose **Keep in my saved edit**, which adds the stats to the item's saved edit.

Every live script is checked against an allow-list (bonuses, temporary skill grants, refine and level reads) in the editor and again by the server NPC before it is set.

### Editor

- Up to three custom skills per item, each with its own refine condition; passive Raging Trifecta Blow; minimum equip level; a visible falcon option for Blitz Beat.
- Item icons, and the iRO repairs list items with search and a slot filter.
- A "What's new" panel.

### Fixes

- **Skill tables:** the mod ships client skill rows only for the two skills the client lacks (Equip Switch, and Return To Lighthalzen's description). Earlier versions replaced about 185 stock skill rows (Night Watch, Hyper Novice, Sky Emperor, Soul Ascetic and others) with short stubs and empty skill-tree requirements while the mod was on. Thanks to Flux159 for the report on PR 723.
- The visible-falcon NPC used `getoption()`, which this server does not have, so it never loaded; it uses `checkoption()` now.
- An exported repair layer left with no rows is no longer written: an empty `item_db.yml` blocked other mods' copy of the same file.

### Updating from v2.3.1

An update replaces the installed folder with this starter package; your own repairs are not merged automatically. **Before updating, Save & Export and keep the ZIP.** After updating, open Item Repairs in the same game client, check your items are there, then Save & Export from the new editor and install that export. See the README for the full steps and keeping `.source.json`.

Live changes and presets are kept on the server and in your client preferences, so they survive the update.

### Limits

- Live requests are at most 200 characters each (a game client limit), so scripts are sent in 180-character parts; a script may be at most 30 parts.
- The description check and item icons need the editor opened in game.
- Bundled item definitions are from app 1.7.4 and skills from 1.7.0. Checked with official app 1.7.6 `mod-check` on Windows. Not tested on Linux or macOS.
