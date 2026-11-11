# Item Repair Hub
By **DaggerHashimoto** · **Renewal and pre-renewal** · v2.12.0

Restores **iRO item effects** for 76 items, lets you change the gear you wear **live, with no restart**, and gives weapons and armor optional **manual-use skills or attack autocasts**, all inside Ragnarok Offline. No custom app build is required.

Open the editor in game from the **IRH badge** beside the RODEX (mail) icon, or **Escape menu → Item Repairs**. The badge appears once you are on a map; drag it anywhere, and Escape menu → Reset Item Repairs Icon puts it back. The window uses the same look as Item Collection UI, with a gear for Window, Text and Picture sizes.

- Add items by ID, name, or Divine Pride link.
- Change equipment class-family access and transfer permissions.
- Choose manual-use skills and attack autocasts independently. Selecting a skill alone enables neither.
- Manage consumable transfer permissions; consumables do not receive equipment skills.
- Remove unwanted repairs. Removing a repair never deletes inventory items.
- Start with Agni Sword (500118), Cocytus Armor (450481), and All-in-One Buff Potion (100906).

## Renewal and pre-renewal

The editor and Live changes work in both eras, each with its own item and skill data (pre-renewal from the app's rAthena fork, `db/pre-re`). Once you are on a map, the editor asks the server which era is running (`@irhprobe era`); if the server cannot say, the editor does not load rather than guess.

- **Each era has its own collection** (its own saved draft). One Save & Export carries both: the ZIP's `renewal/` and `pre-renewal/` folders each hold that era's repairs, and the app reads only the running era's folder.
- **Renewal only:** the built-in repairs below (iRO effect repairs, Agni Sword, Cocytus Armor, All-in-One Buff Potion), World Sync Extras compatibility and the client skill rows. They are renewal items and live in `renewal/`.
- Skills that pre-renewal does not have cannot be chosen there, and the Live changes stat picker leaves out trait stats (POW, P.ATK and so on).

## iRO effect repairs (renewal)

76 items get the refine tiers, autocasts and Base Level bonuses their official iRO descriptions promise, on by default behind one Mod Settings switch, **iRO effect repairs**. The list, with what changed on each item, is in the editor under **Included repairs → iRO effect repairs** and in the release notes ([v2.7.0](RELEASE-NOTES-v2.7.0.md), [v2.9.0](RELEASE-NOTES-v2.9.0.md), [v2.12.0](RELEASE-NOTES-v2.12.0.md)). Some items move to iRO's higher refine levels, so they are weaker at low refine.

## Live changes

The **Live changes** tab changes the gear you are wearing while the game runs, from an ordinary player account:

- **Scan my equipment** (with refine and cards), read each item's effects in plain English at your refine, and run a **description check** against the in-game description (**Copy report** to share what it finds).
- Add stats or advanced bonus lines, save **presets**, **Apply now**, and **Undo** (or **Undo all**).
- Live changes stay after restarts and are not exported, unless you choose **Keep in my saved edit**.
- **Repair check:** after a scan, each worn item says **IRH repair**, **Repair off**, **Your edit** or **Original**, and a repaired item lights up the refine tiers you have reached.

Every live script is checked against an allow-list in the editor and again by the server NPC (`@irhapply`, bound at level 0). Requests are at most 200 characters each, a game client limit, so scripts are sent in 180-character parts.

## Download and install

Install it from **Find Mods** in the app, or download **ItemRepairHub-v2.12.0.zip** from [Releases](https://github.com/tonspri/item-repair-hub/releases). Use this asset, not GitHub's Source code ZIP, which also includes development files.

Extract its `item-repair-hub` folder into the app's `state/mods` folder, or use the app's mod import. Enable it, **Apply & restart**, and reopen the game client. Back up an existing installation first.

Item Repair Hub is listed in Find Mods ([registry PR 723](https://github.com/Flux159/ragnarokoffline.app/pull/723)). Installing from Find Mods enrolls the copy in updates from this repository's releases.

## Save your repairs

**Save & apply live** saves the items you changed under Add items and puts them in game at once: custom skills, autocasts, passives, added stats and the minimum equip level. They stay after restarts, with no ZIP. The message afterwards names any item that still needs Save & Export.

**Save & Export** is needed for **class families, job tiers, transfer rules and the visible falcon** (the server reads those from its item database at start), or to share your mod: **Save & Export → close Item Repairs → extract the downloaded ZIP → replace the installed mod folder (replace it, do not merge) → Apply & restart.**

Exports save the draft and request a browser download. They cannot write directly to your mod folder or confirm where your browser saved the file. Keep the exported ZIP as a backup.

## Updates and personal collections

An app-managed update replaces the installed mod files with the new starter package. It does **not** merge your generated item repairs automatically.

1. Before updating, Save & Export and keep the ZIP and a backup of the installed folder.
2. Install the update, Apply & restart, and reopen Item Repairs in the same game client/profile.
3. The editor uses its saved draft when its revision is at least the packaged seed revision. Check that your items, removed items and skill choices are present before exporting again.
4. Save & Export from the **new editor**, install that export and Apply & restart again. Do not install the old exported ZIP over a newer release unless intentionally rolling back.

Drafts use the app's client preferences, not the mod directory. A different client/profile or cleared preferences may not have your draft. If it is missing, retain your backup; do not overwrite it with an empty export. There is no general collection-import button in this release.

Find Mods installations also have an app-created `.source.json` file for update tracking. The editor's ZIP does not contain that file. Preserve the existing `.source.json` separately and put it back when replacing the folder with your personalized export. Do not invent one for a manually installed copy. Manual Discord ZIP installs are not automatically enrolled in repository updates; to enroll, back up your repairs and install through Find Mods.

Live changes (kept in the mod's server store) and presets (kept in your client preferences) survive an update.

The draft-selection behavior has been checked in a simulated backend test. A full two-release update/re-export cycle in the live app has not yet been tested.

## World Sync compatibility

Enable **World Sync Extras v2.1.5 compatibility** when using both mods. Its 16 overlapping items show **Skills only**, and class/transfer overrides are excluded from exports. This is a manual option, not enabled-mod detection. The reviewed World Sync changes affect class access; transfer suppression is a conservative policy of this editor. Cocytus Armor is not on that list.

Reference: [World Sync Extras v2.1.5](https://github.com/LilArt420/world-sync-extras/releases/tag/v2.1.5).

## Skills and compatibility

The catalog contains **1,107 selectable player skills**, plus disabled passive/internal/companion/monster/guild and unavailable-reference entries. A Divine Pride listing does not establish server support. Passive skills cannot be autocast. Costs, targeting, equipment requirements and other server restrictions still apply; this is not a universal bypass.

Manual grants use bundled item scripts and can overwrite script changes from other mods. Optional autocasts run on successful normal attacks, not every attempted hit. The editor does not automatically diagnose or repair every item's intended bonuses.

The package declares app >=1.7.0; v2.12.0 was checked with the official app's `mod-check` on Windows and tested in game by the author (renewal). Item definitions are from app 1.7.4 and skills from 1.7.0; exact skill parity with later app versions is not guaranteed. Linux/macOS and a full registry update cycle have not been tested.

The mod ships client skill rows only for skills the client lacks (Equip Switch, and Return To Lighthalzen's description), so stock skills keep the client's own names, descriptions and skill-tree requirements.

## Source, tests and release build

`mod/` contains the complete distributed mod, built by the author's build scripts. Repository documentation and tools are excluded from the ZIP.

```sh
node tests/check-features-v2.12.0.cjs
node tests/check-pre-renewal-v2.12.0.cjs
node tests/check-item-hub-effects-v2.12.0.cjs
node tests/check-item-hub-skills-v2.12.0.cjs
node tests/check-passive-v2.12.0.cjs
node tests/check-item-hub-export-v2.12.0.cjs
node tests/check-item-hub-removal-v2.12.0.cjs
node tests/check-draft-upgrade-v2.12.0.cjs
python scripts/build-release.py
```

Browser tests of the editor (Edge, with a simulated game client and NPC) run on the author's machine and are not part of CI.

The release workflow builds the ZIP from the public commit after running these tests. Its ZIP timestamps are fixed for repeatable packaging. Files inside match `mod/` exactly.

## Support

If you enjoy this mod, you can [buy DaggerHashimoto a coffee](https://buymeacoffee.com/miisteryap). It is entirely optional. The ☕ button at the bottom of the editor copies the link where the app does not open new windows. To hide it: Mod Settings → Support the author button.

## License and credits

Code: **GPL-3.0-or-later**, see [LICENSE](LICENSE). rAthena baseline: [8aea17a7c35fb5e5ee7caa89ee5f8a7b1a25d2f5](https://github.com/Flux159/rathena/tree/8aea17a7c35fb5e5ee7caa89ee5f8a7b1a25d2f5). Divine Pride skill IDs/names were audited on 2026-10-27; unsupported entries remain disabled references.

The guide illustration was supplied by the author and is retained unchanged. Its rights are separate from the code license; this repository does not represent it as GPL-licensed artwork. No game GRFs, app binaries, personal collections, or private backups are included.
