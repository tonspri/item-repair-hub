## v2.5.0 test update
Choose Blitz Beat, enable Manual use or Attack autocast, then optionally check **Keep a falcon visible while equipped**. Save & Export, replace the mod and restart/relog. The visible falcon is checked about every 1.5 seconds. This supplies temporary Falconry and replaces the item script, so other item-script mods can conflict. It does not waive other skill requirements. A falcon already present is left alone; wargs and mounts prevent the borrowed falcon. Turn this option off, export/apply and log in once before uninstalling the mod to clear a borrowed falcon. Live rendering, combat and lifecycle checks remain pending.

App 1.7.5 review: regional Jobs mappings updated from rAthena PR84 (16 changed rows). Other item data remains the 1.7.4 snapshot, skills remain1.7.0; a complete live1.7.5 database comparison is pending. New GRF browser and combat:damage event do not require changes to this editor or Companion Living Style. Permission fixes and custom effects remain distinct. No broad update of unrelated mods is claimed.

# Item Repair Hub v2.5.0 — in-game test build
By DaggerHashimoto. Renewal; official app 1.7.4 or newer. GPL-3.0-or-later; preserve existing asset notices.

Open **Item Repairs** in game. Add an equipment item, then use Classes, Transfer or Skills.

- Up to **three custom skills** per equipment item. Enable Manual use, Attack autocast, or both for each.
- Each slot has its own level, chance, target, attack type and minimum refine. Any refine has no refine restriction. The refine threshold applies to manual use and autocast for that slot.
- Custom autocasts roll independently on successful normal attacks. Skill restrictions, resources and server delays still apply; independent rolls do not guarantee simultaneous successful casts.
- Minimum equip level: Keep original or 1–275, within the item's existing maximum.
- Consumables remain transfer-only. Old single-skill choices become slot 1.
- Shadow equipment refine conditions are not yet supported by the equipment reader.

## Original refine autocasts — opt-in testing
Agni Sword (500118) and Dark Chaser Boots (470349) have a separate **Restore original refine autocasts (test)** switch. It is off by default and does not consume custom skill slots. Do not enable alongside another mod that supplies the same effects.

Agni: +12 melee normal hits roll 50%, then choose Fire Bolt 10 or Magnum Break 10 with equal probability.
Dark Chaser: physical hits at +9 roll 10% then choose Judex 7 or Genesis Ray 7 equally; +10 rolls From the Abyss 4 at 10%; +11 rolls the four elemental summons together at 30% and Tetra Vortex 10 separately at 10%. The old melee-only From the Abyss script rule is removed to avoid doubling it. This replaces the item Script with the bundled baseline. Other script mods may conflict.

These rules implement an explicit interpretation of the descriptions' alternative-skill and grouped-summon wording; exact iRO probability grouping has not been independently established. Tetra Vortex retains server prerequisites. These are autocast repairs, not a claim to restore every bonus, grade or card-combo effect. In-game combat verification remains required.
References: https://www.divine-pride.net/database/item/500118 and https://www.divine-pride.net/database/item/470349

## Save and apply
Save & Export, close the editor, extract the ZIP, replace the installed item-repair-hub folder, then Apply & restart in the app. Browser download settings determine the ZIP location. Direct folder overwriting is not supported.

Back up personal exports before upgrading. The existing editor-draft-v2.3.0 preference key is retained; a newer saved draft takes precedence over the packaged seed. Re-export from the new editor to keep new features. Preserve an app-created .source.json for Find Mods update tracking.

## Data and compatibility
The item baseline was refreshed from all five official Renewal tables in the running 1.7.4 server: 32,181 items. Personal mod imports are excluded. Skills remain the labelled 1.7.0 catalog; passive and unavailable skills cannot be selected. Manual grants and Dark Chaser repair replace an item script, so check other mods.
World Sync Extras v2.1.5 compatibility retains Skills while suppressing class, transfer and level overrides for its overlapping items. It is a manual setting, not automatic mod detection.

The entire-database structural comparison is complete; the entire-database regional-description/effects audit is NOT complete. This release must not be advertised as fixing all items.

## Validation
Compiler tests, simulated real-backend save/export and draft migration, isolated browser interaction/download and generated Lua execution with mocked server actions pass. These do not replace live combat verification. No automatic server restart.


## v2.5.0: iRO effect repairs

New built-in repairs for 18 items, behind one Mod Settings switch, "iRO effect repairs" (on by default).
They follow the official iRO item descriptions (iRO client itemInfo and Divine Pride iRO-English), checked
against the 1.7.4 server scripts, upstream rAthena and the app's rAthena fork, none of which had these effects.

- **Future Wolf King Hat** (401012): Adds the missing +11, +12 and +13 bonuses and autocasts.
- **Blighted Skullcap** (401544): Adds the missing +11, +12, +13 and +15 bonuses, cooldowns and autocasts.
- **Saint Knight Armor** (450442): Adds the class skills, +10 Tuna Belly autocast and +13 skill damage.
- **Dark Apostate Armor** (450444): Adds the Acolyte-class skills, +10 Tuna Belly autocast and +11 skill damage.
- **Stormy December** (450601): Adds the +12, +13 and +14 cooldowns and chain autocasts.
- **November Rain Robe** (450566): Adds the +13 and +14 Crystal Rain autocasts.
- **Iron Will** (450464): Adds the missing +11, +13 and +14 bonuses.
- **Spin Ball** (491013): Adds the +12 and +13 autocasts and fixes the +7 After Cast Delay.
- **Robotic Valkyrie Hairband** (400948): Adds the +9, +12 and +13 bonuses and fixes the Merchant-class bonus.
- **Legendary Stone Shield** (460130): Adds the per-refine stats and the +12, +13 and +14 bonuses.
- **Thundershell Ward** (460136): Adds the Base Level effects and the +12 autocasts.
- **Agni Sword** (500118): Adds the Base Level effects and the +12 autocasts.
- **Dark Chaser Boots** (470349): Adds the missing +9 and +11 autocasts; +10 now works for ranged attacks too.
- **Starry Sky Twin Prime** (470180): Uses iRO refine tiers (+10/+12/+14) and per-refine bonuses.
- **Kshatra Vairya** (470312): Moves the refine tiers to iRO's +10/+11/+12/+13.
- **Save the King** (13465): Adds MATK +130 and the +11/+12 tiers; heal tiers move to +9/+10.
- **Squirrel Ear Hat** (19140): Moves the refine tiers to iRO's +10/+11/+12.
- **Brilliant** (450247): Uses iRO tiers (+7/+9/+11) and adds the +12 and +13 bonuses.

- **Cocytus Armor**: the +12 Cold Bolt and Storm Gust autocasts are now plain item bonuses (20% each, rolled separately); the Lua hook is removed.

"X or Y" autocasts roll each skill separately at the described chance, so both can trigger on one hit.
Starry Sky Twin Prime, Kshatra Vairya, Save the King, Squirrel Ear Hat, Brilliant use iRO's refine levels, which are higher than before, so lower refines get weaker.

**Turning off one item:** the app allows at most 40 mod settings, so these repairs share one switch. To skip a
single item, open Item Repairs in game, add the item under Add items, choose Remove item, then Save & Export.
Removing an item drops every built-in repair for it (including class and transfer repairs) from the export.

The old "Restore the item's built-in refine skill effects (test)" option is gone; Agni Sword and Dark Chaser Boots
are covered by the new switch. Grade bonuses and set bonuses are not part of these repairs. Live combat has not
been tested for this release.


## v2.6.0: Live changes

A third tab, **Live changes**, applies your saved item edits to the running game with no restart, from a
normal player account. Pick an item and click **Apply now** (or **Apply all changes now**). Live changes
stay after restarts until you click **Undo live change**; removing an item from your collection undoes it.
After Save & Export, items that were already live are brought up to date automatically.

- Custom attack autocasts are now item bonuses instead of Lua, so they apply live too. Each skill still rolls
  on its own, on normal attacks, at the chance you chose.
- Applied live: bonuses, skill grants, autocasts, refine conditions and the minimum equip level.
  Still needs Save & Export and a restart: class and transfer rules, and the visible falcon.
- Items whose original script uses commands other than bonuses (healing, statuses, set) can't be applied live.
- **Request limit:** the game client refuses a single request over 200 characters, so a script is sent in
  parts of at most 180 characters and joined again on the server.
- The live command (`@irhapply`) is open to every player account, so the server checks each script against an
  allow-list first: bonuses, temporary skill grants, refine and level checks, and `.@` variables only.

Fixes:
- The visible falcon NPC never loaded: it called `getoption()`, which this server does not have. It now uses
  `checkoption(...)`.
- With World Sync compatibility on, an empty Agni Sword layer was exported, and it blocked Eden Rework's own
  item changes. Layers left with no rows are no longer exported.


## v2.6.1: Live changes with worn gear and added stats

- **Scan my equipment** lists the gear you are wearing. Pick an item to see its current effects (your saved
  edit, if any, or its original), then add stats with the picker (STR, ATK, MATK %, ASPD, Max HP %, and more)
  or with advanced bonus lines. The preview reads like "Adding: STR +100, ATK +50". **Apply now** puts it live.
- Added stats are live only: they stay after restarts and are remembered on this PC, but they are not part of
  Save & Export, so friends who install your export do not get them.
- **Undo live change** puts back what the item has at server start: your saved edit, or its original effects.
  Live items you are not wearing are listed under "Other live items" so they can be undone.
- The live request limit still applies: at most 200 characters per request, so scripts are sent in 180-character parts.


## v2.7.0: more iRO repairs, description check, presets

### 14 more iRO effect repairs (32 in all)

On by default, behind the same Mod Settings switch, "iRO effect repairs". They follow the iRO item descriptions
(set and Grade bonuses are not included).

- **Mad Linker Glove** (490794): Adds the Base Level 99-or-below and 100-or-above effects.
- **Infinity Blade** (500005): Uses iRO tiers: Soul Destroyer Lv.5 and no size penalty at +11, ATK +20% at +12.
- **Thorn Armor** (450516): Adds Earth property, 30% reflect and the +13 Striking skill and buff.
- **Awakened Old King's Double Edge** (610029): Uses iRO tiers: extra skill damage at +11 and +13, penetration and cooldown at +14, capped at Base Lv 240.
- **Vayu Follower Bow** (700144): Adds the missing +13, +14 and +15 bonuses.
- **Poison Shoes** (470382): Adds per-refine stats, Meteor Assault scaling and +11 bonuses; class bonus only for Acolyte and Thief.
- **Purple Haze** (491057): Adds the HP drain, the Reproduce/Weapon Blocking buff, the +10 Poison Burst autocast and the when-hit Venom Swamp.
- **Blood Ruby Dagger** (510222): Adds the HP drain and the missing +12 stats and Crimson Rock autocast.
- **Mesarthim** (460079): Adds POW/SPL +15 and uses iRO tiers (+9 Ghost, +11 Poison resistance).
- **Royal Morroc Cape** (480597): Adds knockback immunity, the +9 and +12 damage and the +14 Dancing Knife autocast.
- **Howling Tiger Pajama** (450368): Adds the missing +10 and +12 bonuses.
- **Legendary Performer Manteau** (480455): Adds the Voice Lessons bonus and the +11 and +12 bonuses.
- **Boreas Wings** (480639): Adds the +10 Frost Diver autocast and the Base Level damage scaling.
- **Novice Follower Suit** (450536): Adds the Super/Hyper Novice bonus and the +14 Cart Tornado effects.

Infinity Blade, Awakened Old King's Double Edge and Mesarthim now use iRO's refine levels, which are higher than
before, so lower refines get weaker. To turn off one item only, add it under Add items, choose Remove item, then
Save & Export.

### Live changes

- **Scan my equipment** also reads each item's refine and cards (from any player account).
- **Current effects** read in plain English, worked out at your refine. Effects for a higher refine are dimmed.
  **Show script** still shows the raw script.
- **Description check** compares the in-game description with the script and lists what looks missing
  ("The description has a +11 refine effect, but the script never checks for +11"). It reads wording only, so
  treat every line as a lead. **Copy report** copies a short text to paste on Discord.
- **Presets**: save a set of stats under a name and add it to any worn item later. Presets stay on this PC.
- **Keep in my saved edit** adds the stats to the item's saved edit. They are then part of Save & Export, so
  friends who install your export get them too. Remove them again under Add items → the item → Skills.
- **Undo all live changes** puts every live item back (click twice to confirm).

### Interface

- Item icons from the game client in the lists (in game only).
- iRO effect repairs lists its items with a search box and a slot filter.
- A "What's new" panel at the top; close it and it stays closed until the next version.

### Skill tables

The mod now ships client skill rows only for skills the client lacks (Equip Switch, and the description
of Return To Lighthalzen). Earlier versions also replaced about 185 stock skill rows (Night Watch, Hyper Novice,
Sky Emperor, Soul Ascetic and more) with short stubs and empty skill-tree requirements while the mod was on.

### Known limits

- Live requests are at most 200 characters each (a game client limit), so scripts go in 180-character parts and
  a script may be at most 30 parts.
- The description check needs the editor opened in game, where the client provides the descriptions.


## v2.8.0: pre-renewal support

Item Repair Hub now installs in renewal and pre-renewal.

- **Works in both eras:** the in-game editor (Add items: class families, transfer rules, custom skills and
  autocasts, minimum equip level) and Live changes (scan, plain-English effects, description check, presets,
  Keep in my saved edit, Undo all).
- **Renewal only:** the built-in repairs (32 iRO effect repairs, Agni Sword, Cocytus Armor, All-in-One Buff
  Potion), World Sync Extras compatibility and the client skill-table rows. They are in the mod's `renewal/`
  folder, which the app reads only in renewal.
- Pre-renewal uses its own item list (6169 items) and skill list (767 selectable skills), from the
  app's rAthena fork (`db/pre-re`, commit 1b1b937). Skills that pre-renewal does not have cannot be chosen there.
- The editor asks the server which era is running once you are on a map. If it cannot tell, it says so and
  does not load, rather than guessing.
- **Each era has its own collection** (its own saved draft). One Save & Export carries both: the ZIP's
  `renewal/` and `pre-renewal/` folders each get that era's repairs. Your renewal collection from earlier
  versions is the renewal one.
- Live changes and presets are per era as well (pre-renewal has its own server database).
- In pre-renewal the Live changes stat picker leaves out trait stats (POW, STA, WIS, SPL, CON, CRT, P.ATK,
  S.MATK), which pre-renewal does not use.


## v2.8.1: custom skills on items with no script

Items with no script of their own (Main Gauche and over 4,000 other weapons and armor in renewal, 500+ in
pre-renewal) stopped Save & Export with "Missing baseline script for custom skills" once they had a custom
skill or autocast. They now start from an empty script. Only an item whose script the editor could not read at
all is still refused, with a message saying so.


## v2.8.2: support the author

If you enjoy this mod, you can [buy DaggerHashimoto a coffee](https://buymeacoffee.com/miisteryap). It is entirely optional. The button at the
top right of the editor opens the page, or copies the link where the app does not allow a new window. Its × hides
it until the next version.


## v2.9.0: 23 more iRO effect repairs (55 in all)

Renewal only. On by default, behind the same "iRO effect repairs" switch. They follow the iRO item descriptions (set
and Grade bonuses are not included).

- **Gate of Netherworld** (400101): Fixes the +7 and +9 bonuses, which never applied, and uses damage to all properties.
- **Bear Aimed Bag** (480417): Adds the Main Ranger bonus and the missing +12 and +13 effects.
- **Melody Wing** (480465): Adds the missing +7 SP reduction and +13 no size penalty.
- **Screaming Ghost Party** (450338): Adds the missing +12 and +13 bonuses.
- **Orc Ancestor Armor** (450374): Makes the size damage scale with First Faith Power at +12, and adds the +13 Rampage Blast damage.
- **Giant Shield** (460107): Adds the +9 cooldown and +11 delay, and moves critical damage to +11.
- **Archangel Aegis** (460118): Adds the missing +12 Tiger Cannon skill and cooldown.
- **Ignis Flame Guard** (460178): Adds the +9 cooldowns, the +11 HP and SP drain, and the +12 skill damage.
- **Ancient Royal Guard Greaves** (470352): Adds the per-3-refine, +10 and +11 bonuses, and moves Genesis Ray and Earth Drive damage to +13.
- **Constellation Blessing** (480527): Makes all stats and trait stats scale per refine, and adds the +11 and +12 bonuses.
- **Coatneis Knuckle** (560077): Adds indestructible, per-2-refine skill damage, and the missing +13 and +15 bonuses.
- **Kuraokami's Feather Robe** (15421): Uses iRO values: ASPD +1% per 2 refines, damage at +8 and +10.
- **Fairy of Eden** (20991): Uses iRO tiers: +9 stats and no knockback, +11 Energy Coat.
- **Authority Sandals** (22214): Uses iRO tiers: all stats +10 at +10 and +11.
- **Stylish Silent Shoes** (22244): Uses iRO tiers: Greed and damage at +10, more damage at +11.
- **Legacy of Wise One** (400287): Uses iRO effects: After Cast Delay -20%, +10 damage and player resist, +12 Max HP and SP.
- **Ghost Whisper** (400396): Uses iRO tiers: skill damage at +11 and +12, capped at Base Lv 210; delay capped at +12.
- **Awaking Bloom** (400566): Uses iRO tiers: +10 and +12.
- **Twinhead Dragon Mail** (450216): Uses iRO tiers: +9, +10 and +12.
- **Four of a Kind** (450226): Uses iRO tiers: +10, +11 and +12, with Neutral magic damage added.
- **Loud Park** (450258): Uses iRO effects: ASPD +10%, DEF from Deep Sleep Lullaby, kill recovery, Metallic Sound at +9 and +11.
- **Spenta Armaiti** (460057): Uses iRO tiers: Holy resistance at +9, Neutral at +11.
- **Gracies Aranea** (460074): Uses iRO tiers: movement speed at +11, fixed cast at +14.

Kuraokami's Feather Robe, Fairy of Eden, Authority Sandals, Stylish Silent Shoes, Legacy of Wise One, Ghost Whisper, Awaking Bloom, Twinhead Dragon Mail, Four of a Kind, Loud Park, Spenta Armaiti, Gracies Aranea now use iRO's refine levels or effects, so they get weaker at lower refines. To turn off one item only, add
it under Add items, choose Remove item, then Save & Export.
