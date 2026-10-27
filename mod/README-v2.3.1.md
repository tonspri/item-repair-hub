# Item Repair Hub v2.3.1
By DaggerHashimoto · Renewal · GPL-3.0-or-later (code)

Build your own repair collection in game. Add weapons or armor, adjust class access and transfer rules, and optionally grant an active skill for manual use or trigger it on successful normal attacks. Consumables have transfer controls only. Passive skills cannot be autocast. Skill restrictions and server combat rules still apply.

## Three starter examples
- Agni Sword — 500118: class-family repair.
- Cocytus Armor — 450481: included bonuses/autocast repair.
- All-in-One Buff Potion — 100906: transfer permission repair.

No personal added items or custom skill selections are included. World Sync compatibility starts off. This release starts a fresh collection; older editor preferences are retained separately, not imported automatically.

## Install and save
1. Extract the ZIP. Put its item-repair-hub folder in Ragnarok Offline's state/mods folder, or use the app's mod import. Back up and replace an existing copy; do not nest or merge version folders.
2. Enable the mod, Apply & restart, and reopen the game client. Open Item Repairs.
3. Add/edit/remove items. Manual skill grants use bundled item scripts and may conflict with other script mods. Selecting a skill alone does not enable attack autocasting; enable that option separately.
4. Click Save & Export. Find the ZIP in your chosen download destination. Close Item Repairs, extract the ZIP, replace the installed item-repair-hub folder, then Apply & restart and reopen the client.

Exporting does not directly overwrite the installed mod or restart the world. Removing an item removes its repairs, never inventory items. Add its ID again to restore a starter repair; previous custom choices must be entered again. The guide explains tabs and export blockers; the launcher can be dragged.

## World Sync Extras
Lil Art's World Sync Extras v2.1.5 already fixes class access for 16 iRO items, including Agni Sword. Item Repair Hub's distinct feature is optional skill grants and attack autocasts on weapons/armor, alongside a player-managed repair collection.

When using both, enable World Sync Extras v2.1.5 compatibility in this editor. This is a manual setting, not automatic detection. Its 16 listed items show Skills only; overlapping class and transfer overrides are excluded from the next exported ZIP. The reviewed World Sync patch changes Jobs, not transfer rules; suppressing transfers is this mod's conservative compatibility policy. Cocytus Armor is not on that list. Compatibility changes require export/replacement/restart. Original starter templates remain available for restoration when compatibility is turned off and another ZIP exported.

Reference: https://github.com/LilArt420/world-sync-extras/releases/tag/v2.1.5

## Scope and credits
Package validation uses official Ragnarok Offline 1.7.4. The bundled 32,178 item and 1,712 skill definitions come from the 1.7.0 server baseline, not a live merge of other mods or later fixes. Unknown items are refused; manual grants can replace an item's script with that baseline plus included repairs. Check script compatibility. Custom autocasts are optional behavior, not automatic detection or repair of every missing bonus.

By DaggerHashimoto. GPL rAthena baseline revision 8aea17a7c35fb5e5ee7caa89ee5f8a7b1a25d2f5; see LICENSE-v2.3.1.txt. Guide image supplied by the user, unchanged; image rights are separate from the code license. No personal backups, prior version history, app binaries or custom desktop integration are included.

Skill audit: all96 pages of Divine Pride reviewed on2026-10-27 (1,906 IDs). 234 IDs absent from bundled server definitions are searchable as disabled references. The1,107 selectable server skills remain unchanged; website listing does not establish server support. Manual use and Attack autocast are independent options; no extra acknowledgement checkbox.
