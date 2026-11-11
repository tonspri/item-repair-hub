## Item Repair Hub v2.12.0

By DaggerHashimoto. Renewal and pre-renewal. This release brings together v2.10.0, v2.11.0 and v2.12.0, which were
tested in game by the author before release.

### Save & apply live: no more ZIP for most edits

- The new **Save & apply live** button (bottom right) saves the items you changed under **Add items** and puts them in
  game at once: custom skills, autocasts, passives, added stats and the minimum equip level. They **stay after
  restarts**.
- **Save & Export** is only needed for **class families, job tiers, transfer rules and the visible falcon**, or to
  share your mod. The message after Save & apply live names any item that still needs it.
- **Undo** in Live changes keeps your saved edit live and only removes added stats.

### New look

- The editor now has the same style as Item Collection UI: a side menu (**Add items**, **Included repairs**,
  **Live changes**, **What's new**), one glass panel, and a blue title bar.
- **Sizes:** the ⚙ gear (top right) sets **Window**, **Text** and **Pictures** (Small, Normal, Large, Largest). Your
  choice is kept. The window no longer resizes by dragging its edge.
- **Repair check** in Live changes: after **Scan my equipment**, each worn item says **IRH repair**, **Repair off**,
  **Your edit** or **Original**, and a repaired item lights up the refine tiers you have reached.
- ☕ **Support the author** moved to the bottom beside the save buttons. To hide it: Mod Settings → **Support the
  author button**.

### New launcher

- The **IRH badge** replaces the "Item Repairs" text button. It sits beside the RODEX (mail) icon and only shows once
  you are in game, not on the login or character screens.
- Drag it anywhere and it stays there. **Escape menu → Reset Item Repairs Icon** puts it back; **Escape menu → Item
  Repairs** also opens the editor.

### 21 more iRO item repairs (76 in all, renewal only)

On by default, behind the same **iRO effect repairs** switch. Each one follows the official iRO item description,
checked line by line against Divine Pride's iRO page. Set and Grade bonuses are not included.

**Missing effects added**
- **On Bolt Magic:** Fire, Cold and Lightning Bolt damage at +7 and +9.
- **Wound Maker:** Throw Shuriken and Haze Slasher damage at +7 and +9.
- **Flush Sandals:** the +12 Merchant and Thief bonuses.
- **Fierce Boots:** +13 ignores 50% DEF and MDEF.
- **Chaos Sword:** size damage per refine, plus +13 and +14 (long-range part; its magic reduction is left out).
- **Purity / Corrupted Shadow Shield:** damage +5% now starts at +9, plus the +10 fixed cast bonus.
- **'Merica Hat:** +7 LUK and FLEE. **Grudge:** +7 ASPD. **Wolf Rayet:** +10 Perfect Hit and after-cast delay.
- **Varmundt Energy Suit:** +13 damage. **Rasgand's Soutane:** +13 after-cast delay.
- **Boitata Cap:** Perfect Hit, the +9 tier and damage per 2 refines.
- **Alpha Beast Armor:** the Hawk Rush bonus, +9 knockback immunity and +10 skill damage.
- **Speculation:** its +9 bonus now applies to Crimson Arrow; adds +12. **Tir na nog:** +9 spirit cooldowns and +12.
- **Bougainvillea:** adds +12 and drops a +10 bonus the iRO text does not have.

**Now use iRO's refine levels, so they are weaker at lower refines**
Pursuiter Shoes, Cylinder Boots, Demon Hunting Shoes, Prana Boots.

To turn off one item, add it under Add items, choose **Remove item**, then Save & Export.

### Updating

- **Find Mods:** update in the app, then **Apply & restart before opening the editor**.
- Your saved collections, live changes and presets are kept. If you made class or transfer changes, open Item Repairs
  after updating and Save & Export again, keeping the installed folder's `.source.json` when you replace the folder.
- When you unpack a Save & Export ZIP, **replace** the `item-repair-hub` folder; don't unpack it on top.

### Tested

In game by the author (renewal, normal account): the badge and Escape menu buttons, the new look and sizes, the
repair check, and Save & apply live. All automated checks pass (18). The 21 new repair tiers were checked against the
iRO descriptions and by the checks, not each played in game. Please report anything odd with **Copy report** in Live
changes.
