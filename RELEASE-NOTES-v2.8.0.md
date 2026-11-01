## Item Repair Hub v2.8.0

By DaggerHashimoto. Now for **renewal and pre-renewal**.

### Pre-renewal support

- The in-game editor (Add items: class families, transfer rules, custom skills and autocasts, minimum equip level) and **Live changes** (scan, plain-English effects, description check, presets, Keep in my saved edit, Undo all) work in pre-renewal, with pre-renewal items (6,169) and skills (767 selectable) from the app's rAthena fork.
- Once you are on a map, the editor asks the server which era is running. If the server cannot say, the editor does not load rather than guess.
- **Each era has its own collection.** One Save & Export carries both: the ZIP's `renewal/` and `pre-renewal/` folders each hold that era's repairs, and the app reads only the running era's folder. Your existing collection becomes the renewal one.
- Skills pre-renewal does not have cannot be chosen there. In pre-renewal the Live changes stat picker leaves out trait stats (POW, STA, WIS, SPL, CON, CRT, P.ATK, S.MATK).

### Renewal only

The 32 iRO effect repairs, Agni Sword, Cocytus Armor, the All-in-One Buff Potion, World Sync Extras compatibility and the client skill rows are renewal items. They moved into the mod's `renewal/` folder and work exactly as in v2.7.0.

### Updating

- **Find Mods:** update in the app, then Apply & restart.
- **If you made your own repairs:** before updating, Save & Export and keep the ZIP. After updating, open Item Repairs in game, check your items, then Save & Export again from the new editor and install that ZIP. Keep the installed folder's `.source.json` when you replace it, so the app keeps updating it.
- Live changes and presets are kept.

### Limits

- The pre-renewal side passed simulated tests but has not yet been played in the real game. Please report anything odd.
- Live requests are at most 200 characters each (a game client limit), so very long item scripts cannot be applied live.
- Find Mods may still list the mod as renewal-only until its registry entry is updated.
