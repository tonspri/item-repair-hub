# Item Repair Hub
By **DaggerHashimoto** · **Renewal only** · v2.3.1

Give weapons and armor optional **manual-use skills or attack autocasts**, and build your own item-repair collection inside Ragnarok Offline. No custom app build is required.

Click the draggable **Item Repairs** button in game to open the editor.

- Add items by ID, name, or Divine Pride link.
- Change equipment class-family access and transfer permissions.
- Choose manual-use skills and attack autocasts independently. Selecting a skill alone enables neither.
- Manage consumable transfer permissions; consumables do not receive equipment skills.
- Remove unwanted repairs. Removing a repair never deletes inventory items.
- Start with Agni Sword (500118), Cocytus Armor (450481), and All-in-One Buff Potion (100906).

## Download and install

Download **ItemRepairHub-v2.3.1.zip** from [Releases](https://github.com/tonspri/item-repair-hub/releases). Use this asset, not GitHub's Source code ZIP, which also includes development files.

Extract its `item-repair-hub` folder into the app's `state/mods` folder, or use the app's mod import. Enable it, **Apply & restart**, and reopen the game client. Back up an existing installation first.

The Find Mods listing is being submitted for review; creating this repository does not mean it is already approved or listed.

## Save your repairs

**Save & Export → close Item Repairs → extract the downloaded ZIP → replace the installed mod folder → Apply & restart.**

Exports save the draft and request a browser download. They cannot write directly to your mod folder or confirm where your browser saved the file. Keep the exported ZIP as a backup.

## Updates and personal collections

An app-managed update replaces the installed mod files with the new starter package. It does **not** merge your generated item repairs automatically.

1. Before updating, Save & Export and keep the ZIP and a backup of the installed folder.
2. Install the update, Apply & restart, and reopen Item Repairs in the same game client/profile.
3. The editor uses its saved draft when its revision is at least the packaged seed revision. Check that your items, removed items and skill choices are present before exporting again.
4. Save & Export from the **new editor**, install that export and Apply & restart again. Do not install the old exported ZIP over a newer release unless intentionally rolling back.

Drafts use the app's client preferences, not the mod directory. A different client/profile or cleared preferences may not have your draft. If it is missing, retain your backup; do not overwrite it with an empty export. There is no general collection-import button in this release.

Find Mods installations also have an app-created `.source.json` file for update tracking. The editor's ZIP does not contain that file. Preserve the existing `.source.json` separately and put it back when replacing the folder with your personalized export. Do not invent one for a manually installed copy. Manual Discord ZIP installs are not automatically enrolled in repository updates; install through Find Mods once the listing is accepted, after backing up your repairs.

The draft-selection behavior has been checked in a simulated backend test. A full two-release update/re-export cycle in the live app has not yet been tested.

## World Sync compatibility

Enable **World Sync Extras v2.1.5 compatibility** when using both mods. Its 16 overlapping items show **Skills only**, and class/transfer overrides are excluded from exports. This is a manual option, not enabled-mod detection. The reviewed World Sync changes affect class access; transfer suppression is a conservative policy of this editor. Cocytus Armor is not on that list.

Reference: [World Sync Extras v2.1.5](https://github.com/LilArt420/world-sync-extras/releases/tag/v2.1.5).

## Skills and compatibility

The catalog contains **1,107 selectable player skills**, plus disabled passive/internal/companion/monster/guild and unavailable-reference entries. A Divine Pride listing does not establish server support. Passive skills cannot be autocast. Costs, targeting, equipment requirements and other server restrictions still apply; this is not a universal bypass.

Manual grants use bundled item scripts and can overwrite script changes from other mods. Optional autocasts run on successful normal attacks, not every attempted hit. The editor does not automatically diagnose or repair every item's intended bonuses.

The package declares app >=1.7.0; package validation was performed with official app 1.7.4 on Windows. Item/skill snapshots are from the 1.7.0 baseline. Exact skill parity with later app versions is not guaranteed. The author reports successful in-game use and Discord recipients installing v2.3.1. Linux/macOS and a full registry update cycle have not been tested.

## Source, tests and release build

`mod/` contains the complete distributed mod. The initial source is byte-for-byte the working v2.3.1 starter package. Repository documentation and tools are excluded from the ZIP.

```sh
node tests/check-item-hub-menus-v2.3.1.cjs
node tests/check-item-hub-export-v2.3.1.cjs
node tests/check-item-hub-removal-v2.3.1.cjs
node tests/check-draft-upgrade-v2.3.1.cjs
python scripts/build-release.py
```

The release workflow builds the ZIP from the public commit after running these tests. Its ZIP timestamps are fixed for repeatable packaging. Files inside match `mod/` exactly.

## License and credits

Code: **GPL-3.0-or-later**, see [LICENSE](LICENSE). rAthena baseline: [8aea17a7c35fb5e5ee7caa89ee5f8a7b1a25d2f5](https://github.com/Flux159/rathena/tree/8aea17a7c35fb5e5ee7caa89ee5f8a7b1a25d2f5). Divine Pride skill IDs/names were audited on 2026-10-27; unsupported entries remain disabled references.

The guide illustration was supplied by the author and is retained unchanged. Its rights are separate from the code license; this repository does not represent it as GPL-licensed artwork. No game GRFs, app binaries, personal collections, or private backups are included.
