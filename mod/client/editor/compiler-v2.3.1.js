/* Item Repair Hub v2.3.1: portable mod-owned compiler prototype. */
(function(root){
function create(skillData){
'use strict';
// Item repair integration v2.3.1. Typed item data only; never accepts paths or scripts.
const FAMILIES = {
  swordsman: ['Swordman', 'Knight', 'Crusader'],
  merchant: ['Merchant', 'Blacksmith', 'Alchemist'],
  thief: ['Thief', 'Assassin', 'Rogue'],
  acolyte: ['Acolyte', 'Priest', 'Monk'],
  mage: ['Mage', 'Wizard', 'Sage'],
  archer: ['Archer', 'Hunter', 'BardDancer'],
};
const PERMISSIONS = { trade: 'NoTrade', storage: 'NoStorage', guild: 'NoGuildStorage', cart: 'NoCart', mail: 'NoMail' };
const MODES = ['keep', 'allow', 'block'];
const SKILL_DATA = skillData;
const AUTOCAST_SKILLS = SKILL_DATA.skills;
function autocastChoice(given, baseline, skills = AUTOCAST_SKILLS) {
  if (given === undefined) return { enabled: false, skill: 'MG_COLDBOLT', level: 1, chance: 5, trigger: 'both', manual: false, target: 'auto' };
  if (!given || typeof given !== 'object' || Array.isArray(given)) fail('Invalid autocast choices.');
  for (const key of Object.keys(given)) if (!['enabled', 'skill', 'level', 'chance', 'trigger', 'manual', 'target'].includes(key)) fail('Unsupported autocast field.');
  if (typeof given.enabled !== 'boolean' || !/^[A-Za-z][A-Za-z0-9_]*$/.test(given.skill || '') || !Object.hasOwn(skills, given.skill)) fail('Choose a supported server skill.');
  const manual = given.manual ?? false, target = given.target ?? 'auto';
  if (typeof manual !== 'boolean' || !['auto', 'caster', 'target'].includes(target)) fail('Invalid manual-skill or target choice.');
  const skill = skills[given.skill];
  if ((given.enabled || manual) && !skill.selectable) fail(skill.reason || 'This skill cannot be granted to a player.');
  if (!Number.isInteger(given.level) || given.level < 1 || given.level > skill.maxLevel || given.level > 13) fail('The selected skill level is outside its server-supported range.');
  if (!Number.isInteger(given.chance) || given.chance < 1 || given.chance > 100) fail('Autocast chance must be a whole percentage from 1 to 100.');
  if (!['both', 'melee', 'ranged'].includes(given.trigger)) fail('Choose a normal attack trigger.');
  if ((given.enabled || manual) && (!['Weapon', 'Armor', 'ShadowGear'].includes(baseline.Type) || !/^[A-Za-z0-9_]+$/.test(baseline.AegisName || ''))) fail('Skill customization requires a recognized equipment item.');
  return { ...given, manual, target };
}
function fail(message) { throw new Error(message); }
function idOf(value) {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 2147483647) return value;
  if (typeof value !== 'string' || value.length > 300) fail('Enter an item ID or a Divine Pride item link.');
  const text = value.trim();
  if (/^[1-9][0-9]{0,9}$/.test(text)) return idOf(Number(text));
  let url; try { url = new URL(text); } catch { fail('Enter an item ID or a Divine Pride item link.'); }
  const match = url.pathname.match(/^\/database\/item\/([1-9][0-9]*)(?:\/[^/]*)?\/?$/);
  if (url.protocol !== 'https:' || !['divine-pride.net', 'www.divine-pride.net'].includes(url.hostname) || url.username || url.password || url.port || !match) fail('Use an HTTPS Divine Pride item link.');
  return idOf(match[1]);
}
function boolMap(text, field) {
  if (!text.trim()) return {};
  const result = {};
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (field === 'Trade' && /^      Override:\s*\d+\s*(?:#.*)?$/.test(line)) continue;
    const match = line.match(/^      ([A-Za-z][A-Za-z0-9_]*):\s*(true|false)\s*(?:#.*)?$/);
    if (!match) fail(`The server's ${field} mapping uses a format this repair reader does not support.`);
    result[match[1]] = match[2] === 'true';
  }
  return result;
}
function parseTable(text) {
  if (typeof text !== 'string' || text.length > 32 * 1024 * 1024) fail('The item table is too large or unreadable.');
  const result = new Map();
  const parts = text.replace(/\r\n/g, '\n').split(/(?=^  - Id: )/m);
  for (const part of parts) {
    const id = /^  - Id:\s*(\d+)\s*$/m.exec(part); if (!id) continue;
    const item = { id: idOf(Number(id[1])) };
    const fields = [...part.matchAll(/^    ([A-Za-z][A-Za-z0-9_]*):([^\n]*)(?:\n|$)/gm)];
    for (let index = 0; index < fields.length; index++) {
      const match = fields[index], key = match[1], value = match[2].trim();
      if (['Name', 'AegisName', 'Type'].includes(key)) item[key] = value.replace(/^(['"])(.*)\1$/, '$2');
      if (['EquipLevelMin', 'EquipLevelMax'].includes(key) && /^\d+$/.test(value)) item[key] = Number(value);
      if (key === 'Script') {
        if (/^\|[-+]?$/.test(value)) {
          const footer = part.search(/^Footer:/m);
          const end = fields[index + 1]?.index ?? (footer < 0 ? part.length : footer);
          const block = part.slice(match.index + match[0].length, end).split('\n');
          item.Script = block.filter(line => /^ {6}/.test(line) || !line.trim()).map(line => line.replace(/^ {6}/, '')).join('\n').trimEnd();
        } else if (value.startsWith('"')) {
          try { const decoded = JSON.parse(value); if (typeof decoded !== 'string') throw Error(); item.Script = decoded; } catch { item.ScriptUnsupported = true; }
        } else if (value.startsWith("'") && value.endsWith("'")) item.Script = value.slice(1, -1).replace(/''/g, "'");
        else item.ScriptUnsupported = true;
      }
      if (['Jobs', 'Classes', 'Trade'].includes(key)) {
        if (value && value !== '{}') fail(`Item ${item.id}: inline ${key} mappings are unsupported.`);
        const footer = part.search(/^Footer:/m);
        const end = fields[index + 1]?.index ?? (footer < 0 ? part.length : footer);
        item[key] = boolMap(part.slice(match.index + match[0].length, end), key);
      }
    }
    overlay(result, new Map([[item.id, item]]));
  }
  return result;
}
function overlay(base, extra) {
  for (const [id, add] of extra) {
    const prior = base.get(id) || { id };
    const item = { ...prior, ...add };
    // Jobs resets its mask; Trade and Classes patch only named keys in rAthena.
    for (const key of ['Trade', 'Classes']) if (add[key]) item[key] = { ...(prior[key] || {}), ...add[key] };
    base.set(id, item);
  }
}
function choices(given = {}, keys) {
  if (!given || typeof given !== 'object' || Array.isArray(given)) fail('Choices must be an object.');
  for (const key of Object.keys(given)) if (!keys.includes(key)) fail(`Unsupported choice: ${key}`);
  return Object.fromEntries(keys.map(key => { const value = given[key] ?? 'keep'; if (!MODES.includes(value)) fail(`Invalid choice for ${key}.`); return [key, value]; }));
}
function validateEntry(given, baseline, skills = AUTOCAST_SKILLS) {
  if (!given || typeof given !== 'object' || Array.isArray(given)) fail('Invalid item repair.');
  for (const key of Object.keys(given)) if (!['id', 'families', 'permissions', 'tiers', 'enabled', 'autocast'].includes(key)) fail(`Unsupported repair field: ${key}`);
  const id = idOf(given.id);
  if (given.enabled !== undefined && typeof given.enabled !== 'boolean') fail('Enabled must be true or false.');
  if (!['keep', 'all'].includes(given.tiers ?? 'keep')) fail('Invalid job-tier choice.');
  if (!['Weapon','Armor','ShadowGear'].includes(baseline.Type) && ((given.tiers ?? 'keep') !== 'keep' || Object.values(given.families || {}).some(v => v !== 'keep'))) fail('Non-equipment items support transfer permission repairs only.');
  const autocast = autocastChoice(given.autocast, baseline, skills);
  return { id, enabled: given.enabled !== false, name: baseline.Name || baseline.AegisName || `Item ${id}`, baseline,
    families: choices(given.families, Object.keys(FAMILIES)), permissions: choices(given.permissions, Object.keys(PERMISSIONS)), tiers: given.tiers ?? 'keep', autocast,
    skillMetadata: { ...skills[autocast.skill] } };
}
function entrySkills(item) {
  const meta = item.skillMetadata;
  if (!meta) return AUTOCAST_SKILLS;
  if (meta.skill !== item.autocast.skill || !Number.isInteger(meta.id) || meta.id < 1 || meta.id > 65535 || !Number.isInteger(meta.maxLevel) || meta.maxLevel < 1 || meta.maxLevel > 13 || typeof meta.selectable !== 'boolean') fail('Invalid saved skill metadata.');
  return { [meta.skill]: meta };
}
function stripGrant(script) { return script.replace(/^\/\/ IRH_TEMP_SKILL_BEGIN\n[\s\S]*?^\/\/ IRH_TEMP_SKILL_END\n?/m, ''); }
function compileLua(entries) {
  const lines = ['-- Generated by Item Repair Hub v2.3.1; optional custom behavior.'];
  for (const item of [...entries].sort((a, b) => a.id - b.id)) {
    if (!item.enabled || !item.autocast?.enabled) continue;
    const skills = entrySkills(item), choice = autocastChoice(item.autocast, item.baseline, skills);
    const target = choice.target === 'auto' ? (['Self', 'Support'].includes(skills[choice.skill].targetType) ? 'caster' : 'target') : choice.target;
    lines.push(`-- Item ${idOf(item.id)}`, `item(${JSON.stringify(item.baseline.AegisName)}, {`, '  on_attack = function(c)',
      '    if c.skill_id ~= 0 or c.autocast or not c.connected or c.damage <= 0 then return end');
    if (choice.trigger === 'melee') lines.push('    if c.ranged then return end');
    if (choice.trigger === 'ranged') lines.push('    if not c.ranged then return end');
    lines.push(`    if c:chance(${choice.chance * 100}) then`, `      c:cast(${JSON.stringify(choice.skill)}, ${choice.level}, ${JSON.stringify(target)})`, '    end', '  end,', '})');
  }
  return lines.join('\n') + '\n';
}
function compile(entries) {
  const lines = ['# Generated by item repair integration v2.3.1', 'Header:', '  Type: ITEM_DB', '  Version: 3', 'Body:'];
  for (const item of [...entries].sort((a, b) => a.id - b.id)) {
    if (!item.enabled) continue;
    const fields = [];
    if (Object.values(item.families).some(v => v !== 'keep')) {
      const initial = item.baseline.Jobs;
      const jobs = { All: initial ? (initial.All ?? false) : true, ...(initial || {}) };
      for (const [family, value] of Object.entries(item.families)) if (value !== 'keep') for (const job of FAMILIES[family]) jobs[job] = value === 'allow';
      fields.push('    Jobs:', ...Object.entries(jobs).map(([key, value]) => {
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(key) || typeof value !== 'boolean') fail('Invalid baseline job mapping.');
        return `      ${key}: ${value}`;
      }));
    }
    if (item.tiers === 'all') fields.push('    Classes:', '      All: true');
    const trade = Object.entries(item.permissions).filter(([, v]) => v !== 'keep');
    if (trade.length) fields.push('    Trade:', ...trade.map(([key, value]) => `      ${PERMISSIONS[key]}: ${value === 'block'}`));
    if (item.autocast?.manual) {
      const choice = autocastChoice(item.autocast, item.baseline, entrySkills(item));
      if (typeof item.baseline.Script !== 'string') fail('Start the world and save this item again to capture its original script before granting a manual skill.');
      const original = stripGrant(item.baseline.Script);
      const script = ['// IRH_TEMP_SKILL_BEGIN', `skill ${JSON.stringify(choice.skill)},${choice.level},1;`, '// IRH_TEMP_SKILL_END', original].join('\n');
      fields.push('    Script: |', ...script.split('\n').map(line => '      ' + line));
    }
    if (fields.length) lines.push(`  - Id: ${item.id}`, ...fields);
  }
  if (lines.length === 5) lines[4] = 'Body: []';
  return lines.join('\n') + '\n';
}

return {idOf,parseTable,overlay,validateEntry,compile,compileLua,FAMILIES,PERMISSIONS,AUTOCAST_SKILLS};
}
const api={create}; if(typeof module!=="undefined")module.exports=api;else root.ItemRepairCompiler=api;
})(globalThis);
