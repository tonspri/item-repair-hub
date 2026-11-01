## Item Repair Hub v2.8.1

By DaggerHashimoto. Renewal and pre-renewal. A fix for v2.8.0.

### Fix

- **Custom skills on items with no script of their own.** Items such as Main Gauche have no item script, and once one had a custom skill, autocast or passive, Save & Export stopped with "Missing baseline script for custom skills". This hit over 4,000 weapons and armor in renewal and 500+ in pre-renewal. They now start from an empty script. Only an item whose script the editor could not read at all is still refused, with a message saying so.

Found while testing pre-renewal. Thanks for reporting!

### Updating

- **Find Mods:** update in the app, then Apply & restart.
- Your saved collections (renewal and pre-renewal) are kept. If Save & Export failed for you in v2.8.0, open Item Repairs in game after updating and press Save & Export again.

Everything else is as in [v2.8.0](https://github.com/tonspri/item-repair-hub/releases/tag/v2.8.0), including pre-renewal support.
