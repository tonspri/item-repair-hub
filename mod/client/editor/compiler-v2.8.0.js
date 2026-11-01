/* Item Repair Hub v2.8.0: portable mod-owned compiler prototype. */
(function(root){
function create(skillData){
'use strict';
// Item repair integration v2.8.0. Typed item data only; never accepts paths or scripts.
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
  const lines = ['-- Generated by Item Repair Hub v2.8.0; optional custom behavior.'];
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
  const lines = ['# Generated by item repair integration v2.8.0', 'Header:', '  Type: ITEM_DB', '  Version: 3', 'Body:'];
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


const singleValidate=validateEntry, singleCompile=compile;
function validateMany(given, baseline, skills=AUTOCAST_SKILLS) {
 const {autocasts,equipLevelMin,restoreRefineEffects=false,bonuses,...legacy}=given;
 if(typeof restoreRefineEffects!=='boolean')fail('Invalid refine-effect choice.');
 // Stat bonuses kept from the Live changes tab: checked like a live script, compiled into the item script.
 let kept;try{kept=(globalThis.HubEffects||require('./effects-v2.8.0.js')).cleanBonuses(bonuses??{});}catch(e){fail(e.message);}
 if(kept.stats.length||kept.raw.trim()){if(!['Weapon','Armor','ShadowGear'].includes(baseline.Type))fail('Stat bonuses require equipment.');const G=(globalThis.HubLiveGuard||require('./live-guard-v2.8.0.js')),why=G.guard(G.normalize((globalThis.HubEffects||require('./effects-v2.8.0.js')).bonusScript(kept)));if(why)fail('Stat bonuses refused: '+why+'.');}
 const list=autocasts===undefined?[given.autocast||autocastChoice(undefined,baseline,skills)]:autocasts;
 if(!Array.isArray(list)||list.length>3)fail('Choose at most three custom skills.');
 const min=equipLevelMin??null;
 if(min!==null&&(!Number.isInteger(min)||min<1||min>275))fail('Minimum equip level must be 1–275 or Keep original.');
 if(min!==null&&baseline.EquipLevelMax&&min>baseline.EquipLevelMax)fail('Minimum level exceeds this item’s existing maximum level.');
 if(min!==null&&!['Weapon','Armor','ShadowGear'].includes(baseline.Type))fail('Only equipment supports level changes.');
 const validated=list.map(c=>{
  const {minRefine=0,metadata,passive=false,visibleFalcon=false,...old}=c;
  if(typeof visibleFalcon!=='boolean'||(visibleFalcon&&old.skill!=='HT_BLITZBEAT'))fail('Visible falcon is available only for Blitz Beat.');
  if(typeof passive!=='boolean'||(passive&&old.skill!=='MO_TRIPLEATTACK'))fail('This passive is not supported yet.');
  if(old.skill==='MO_TRIPLEATTACK'&&(old.enabled||old.manual))fail('Use Passive while equipped for Raging Trifecta Blow.');
  if(passive&&!['Weapon','Armor','ShadowGear'].includes(baseline.Type))fail('Passive grants require equipment.');
  if(!Number.isInteger(minRefine)||minRefine<0||minRefine>20)fail('Minimum refine must be 0–20.');
  if(minRefine && baseline.Type==='ShadowGear')fail('Refine conditions for shadow equipment are not supported yet.');
  const e=singleValidate({...legacy,autocast:old},baseline,skills);
  return {...e.autocast,minRefine,passive,visibleFalcon,metadata:e.skillMetadata};
 });
 const active=validated.filter(c=>c.enabled||c.manual||c.passive).map(c=>c.skill);
 if(new Set(active).size!==active.length)fail('Choose each active custom skill only once per item.');
 const first=validated[0];
 const result=singleValidate({...legacy,autocast:first?Object.fromEntries(Object.entries(first).filter(([k])=>!['minRefine','metadata','passive','visibleFalcon'].includes(k))):undefined},baseline,skills);
 return {...result,autocasts:validated,equipLevelMin:min,restoreRefineEffects:false,bonuses:kept};
}
function compileMany(entries){
 const parts=[];
 for(const item of entries){
  if(!item.enabled)continue;
  const grants=(item.autocasts||[item.autocast]).filter(c=>c?.manual||c?.passive);
  const falcon=(item.autocasts||[]).find(c=>c.visibleFalcon&&(c.enabled||c.manual));
  const casts=(item.autocasts||[item.autocast]).filter(c=>c?.enabled);
  const bonusLines=(globalThis.HubEffects||require('./effects-v2.8.0.js')).bonusScript(item.bonuses);
  let text=singleCompile([{...item,autocast:{...item.autocast,manual:false}}]);
  let body=text.split('Body:')[1].trimStart();
  if(body.startsWith('[]'))body='';
  if(!body&&(item.equipLevelMin!=null||grants.length||falcon||casts.length||bonusLines))body=`  - Id: ${item.id}\n`;
  else if(body)body='  '+body;
  if(item.equipLevelMin!=null)body+=`    EquipLevelMin: ${item.equipLevelMin}\n`;
  if(grants.length||falcon||casts.length||bonusLines){
   if(typeof item.baseline.Script!=='string')fail('Missing baseline script for custom skills.');
   const lines=['// IRH_TEMP_SKILL_BEGIN',...(falcon?[`${falcon.minRefine?`if (getrefine() >= ${falcon.minRefine}) `:''}skill \"HT_FALCON\",1,1;`]:[]),...grants.map(c=>`${c.minRefine?`if (getrefine() >= ${c.minRefine}) `:''}skill ${JSON.stringify(c.skill)},${c.level},1;`),...casts.map(autospell),...(bonusLines?[bonusLines]:[]),'// IRH_TEMP_SKILL_END',stripGrant(item.baseline.Script)];
   body+='    Script: |\n'+lines.join('\n').split('\n').map(l=>'      '+l).join('\n')+'\n';
  }
  if(body)parts.push(body.trimEnd());
 }
 return '# Item Repair Hub v2.8.0\nHeader:\n  Type: ITEM_DB\n  Version: 3\nBody:'+(parts.length?'\n'+parts.join('\n')+'\n':' []\n');
}
// rAthena bonus5 bAutoSpell: rate in tenths of a percent; last value 0 casts on self, 1 on the enemy.
// Normal attacks only (BF_NORMAL), as the old Lua rolls were; each row rolls on its own.
function autospell(c){
 const meta=c.metadata||AUTOCAST_SKILLS[c.skill];
 const self=c.target==='caster'||(c.target==='auto'&&['Self','Support'].includes(meta?.targetType));
 const range=c.trigger==='melee'?'BF_SHORT':c.trigger==='ranged'?'BF_LONG':'BF_SHORT|BF_LONG';
 return `${c.minRefine?`if (getrefine() >= ${c.minRefine}) `:''}bonus5 bAutoSpell,${JSON.stringify(c.skill)},${c.level},${c.chance*10},${range}|BF_WEAPON|BF_NORMAL,${self?0:1};`;
}
// Custom autocasts are item bonuses since v2.8.0; no Lua is written for them.
function luaMany(entries){
 return '-- Item Repair Hub v2.8.0: custom autocasts are item bonuses now.\n';
}
function luaManyRetired(entries){
 const lines=['-- Item Repair Hub v2.8.0: independent custom skill rolls.'];
 for(const item of entries){
  const choices=(item.autocasts||[item.autocast]).filter(c=>c?.enabled);
  if(!item.enabled||!choices.length)continue;
  lines.push(`item(${JSON.stringify(item.baseline.AegisName)}, { on_attack = function(c)`, ' if c.autocast or not c.connected or c.damage <= 0 then return end', ' local refine = -1', ' for _, slot in ipairs({"weapon","shield","armor","shoes","garment","head_top","head_mid","head_low","accessory_1","accessory_2"}) do', '  local equipped = c.caster:equipment(slot)', `  if equipped and equipped.id == ${item.id} then refine = math.max(refine, equipped.refine) end`, ' end');
  for(const choice of choices){
   const meta=choice.metadata||AUTOCAST_SKILLS[choice.skill];
   const target=choice.target==='auto'?(['Self','Support'].includes(meta.targetType)?'caster':'target'):choice.target;
   const trigger=choice.trigger==='melee'?' and not c.ranged':choice.trigger==='ranged'?' and c.ranged':'';
   lines.push(` if c.skill_id == 0 and ${choice.minRefine ? `refine >= ${choice.minRefine}` : 'true'}${trigger} and c:chance(${choice.chance*100}) then`, `  c:cast(${JSON.stringify(choice.skill)}, ${choice.level}, ${JSON.stringify(target)})`, ' end');
  }
  lines.push('end })');
 }
 return lines.join('\n')+'\n';
}

function compileFalcon(entries){
 const rules=[];
 for(const e of entries){if(!e.enabled)continue;for(const c of e.autocasts||[])if(c.visibleFalcon&&(c.enabled||c.manual)&&c.skill==='HT_BLITZBEAT')rules.push({id:e.id,refine:c.minRefine||0});}
 return `// Item Repair Hub v2.8.0: temporary visible falcon; player login timer only.
-\tscript\tIRHVisibleFalcon\t-1,{
OnPCLoginEvent:
    if (IRH_FalconOwned) {
        if (checkfalcon()) setfalcon 0;
        IRH_FalconOwned = 0;
    }
    deltimer strnpcinfo(3) + "::OnCheck";
    addtimer 1500, strnpcinfo(3) + "::OnCheck";
    end;
OnPCLogoutEvent:
    deltimer strnpcinfo(3) + "::OnCheck";
    if (IRH_FalconOwned) {
        if (checkfalcon()) setfalcon 0;
        IRH_FalconOwned = 0;
    }
    end;
OnCheck:
    .@eligible = 0;
    setarray .@slots[0], EQI_HAND_R, EQI_HAND_L, EQI_ARMOR, EQI_SHOES, EQI_GARMENT, EQI_HEAD_TOP, EQI_HEAD_MID, EQI_HEAD_LOW, EQI_ACC_R, EQI_ACC_L, EQI_SHADOW_ARMOR, EQI_SHADOW_WEAPON, EQI_SHADOW_SHIELD, EQI_SHADOW_SHOES, EQI_SHADOW_ACC_R, EQI_SHADOW_ACC_L;
    for (.@n = 0; .@n < getarraysize(.@slots); .@n++) {
        .@id = getequipid(.@slots[.@n]);
${rules.map(r=>`        if (.@id == ${idOf(r.id)} && getequiprefinerycnt(.@slots[.@n]) >= ${r.refine}) .@eligible = 1;`).join('\n')}
    }
    if (checkoption(OPTION_WUG|OPTION_WUGRIDER|OPTION_RIDING|OPTION_DRAGON|OPTION_MADOGEAR)) .@eligible = 0;
    if (getstatus(SC_ALL_RIDING)) .@eligible = 0;
    if (!.@eligible || getskilllv("HT_FALCON") < 1) {
        if (IRH_FalconOwned) {
            if (checkfalcon()) setfalcon 0;
            IRH_FalconOwned = 0;
        }
    } else if (!checkfalcon()) {
        setfalcon 1;
        if (checkfalcon()) IRH_FalconOwned = 1;
    }
    addtimer 1500, strnpcinfo(3) + "::OnCheck";
    end;
}
`.replace(/\\t/g,'\t');
}
return {idOf,parseTable,overlay,validateEntry:validateMany,compile:compileMany,compileLua:luaMany,compileFalcon,autospell,FAMILIES,PERMISSIONS,AUTOCAST_SKILLS};
}
const api={create}; if(typeof module!=="undefined")module.exports=api;else root.ItemRepairCompiler=api;
})(globalThis);

