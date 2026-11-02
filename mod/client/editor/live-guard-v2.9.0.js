/* Item Repair Hub v2.9.0: allow-list check for live item scripts sent from a normal player account.
   npc/live-apply-v2.9.0.txt (L_Guard) runs the same steps in rAthena script; keep the two in step.
   rAthena matches names case-insensitively, so every identifier is compared lowercased. */
(function(root){
'use strict';
const MAX_LENGTH = 3600;
// The client refuses a server request whose text is over 200 characters, so a part plus its "part NN " prefix stays under it.
const REQUEST_LIMIT = 200, CHUNK = 180;
const ALLOWED_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_ .@,;(){}+-*/<>=!&|?:"%';
const KEYWORDS = ['if', 'else', 'bonus', 'bonus2', 'bonus3', 'bonus4', 'bonus5', 'skill', 'autobonus', 'autobonus2', 'autobonus3',
  'getrefine', 'getskilllv', 'getenchantgrade', 'getequiprefinerycnt', 'getequipid', 'getequipweaponlv', 'isequipped', 'isequippedcnt',
  'readparam', 'min', 'max', 'cap_value', 'rand', 'eaclass', 'baselevel', 'joblevel', 'basejob', 'baseclass', 'class', 'upper', 'sex',
  'pow', 'sta', 'wis', 'spl', 'con', 'crt', 'vip_status', 'gettime', 'getitempos', 'getpetinfo', 'hateffect', 'specialeffect2', 'vip_status_active', 'true', 'false'];
const PREFIXES = ['ele_', 'rc_', 'class_', 'size_', 'bf_', 'eajl_', 'eaj_', 'job_', 'enchantgrade_', 'eff_', 'eqi_', 'atf_', 'rc2_', 'w_', 'ig_', 'ef_', 'hat_ef_', 'eqp_', 'petinfo_', 'dt_', 'pet_intimate_'];
const BONUS_NAMES = ["bAbsorbDmgMaxHP", "bAbsorbDmgMaxHP2", "bAddClass", "bAddClassDropItem", "bAddClassDropItemGroup", "bAddDamageClass", "bAddDefMonster", "bAddEff", "bAddEff2", "bAddEffOnSkill", "bAddEffWhenHit", "bAddEle", "bAddGetZenyNum", "bAddItemGroupHealRate", "bAddItemGroupSPHealRate", "bAddItemHealRate", "bAddItemSPHealRate", "bAddMagicDamageClass", "bAddMaxWeight", "bAddMdefMonster", "bAddMonsterDropItem", "bAddMonsterDropItemGroup", "bAddMonsterIdDropItem", "bAddRace", "bAddRace2", "bAddSize", "bAddSkillBlow", "bAddStealRate", "bAgi", "bAgiDexStr", "bAgiVit", "bAllStats", "bAllTraitStats", "bAspd", "bAspdRate", "bAtk", "bAtk2", "bAtkEle", "bAtkRange", "bAtkRate", "bAutoSpell", "bAutoSpellOnSkill", "bAutoSpellWhenHit", "bBaseAtk", "bBreakArmorRate", "bBreakWeaponRate", "bCRateRate", "bCastrate", "bClassChange", "bComaClass", "bComaRace", "bCon", "bCrate", "bCritAtkRate", "bCritDefRate", "bCritical", "bCriticalAddRace", "bCriticalDef", "bCriticalLong", "bCriticalRate", "bCrt", "bDef", "bDef2", "bDef2Rate", "bDefEle", "bDefRate", "bDefRatioAtkClass", "bDefRatioAtkEle", "bDefRatioAtkRace", "bDelayrate", "bDex", "bDoubleAddRate", "bDoubleRate", "bDropAddClass", "bDropAddRace", "bExpAddClass", "bExpAddRace", "bFame", "bFixedCast", "bFixedCastrate", "bFlee", "bFlee2", "bFlee2Rate", "bFleeRate", "bGetZenyNum", "bHPDrainRate", "bHPDrainValue", "bHPDrainValueClass", "bHPDrainValueRace", "bHPGainValue", "bHPLossRate", "bHPRegenRate", "bHPVanishRaceRate", "bHPVanishRate", "bHPlusRate", "bHPrecovRate", "bHealPower", "bHealPower2", "bHit", "bHitRate", "bHplus", "bIgnoreDefClass", "bIgnoreDefClassRate", "bIgnoreDefEle", "bIgnoreDefRace", "bIgnoreDefRaceRate", "bIgnoreMResRaceRate", "bIgnoreMdefClassRate", "bIgnoreMdefEle", "bIgnoreMdefRace", "bIgnoreMdefRace2Rate", "bIgnoreMdefRaceRate", "bIgnoreResRaceRate", "bInt", "bIntravision", "bLongAtkDef", "bLongAtkRate", "bLongHPGainValue", "bLongSPGainValue", "bLongWeaponDamageReturn", "bLuk", "bMResRate", "bMagicAddClass", "bMagicAddEle", "bMagicAddRace", "bMagicAddRace2", "bMagicAddSize", "bMagicAtkDef", "bMagicAtkEle", "bMagicDamageReturn", "bMagicHPGainValue", "bMagicSPGainValue", "bMagicSubDefEle", "bMagicSubSize", "bMatk", "bMatk2", "bMatkRate", "bMaxAP", "bMaxAPrate", "bMaxHP", "bMaxHPrate", "bMaxSP", "bMaxSPrate", "bMdef", "bMdef2", "bMdef2Rate", "bMdefRate", "bMiscAtkDef", "bMres", "bNearAtkDef", "bNoCastCancel", "bNoCastCancel2", "bNoGemStone", "bNoKnockback", "bNoMadoFuel", "bNoMagicDamage", "bNoMiscDamage", "bNoRegen", "bNoSizeFix", "bNoWalkDelay", "bNoWeaponDamage", "bNonCritAtkRate", "bNonCritDefRate", "bPAtkRate", "bPatk", "bPerfectHide", "bPerfectHitAddRate", "bPerfectHitRate", "bPow", "bReduceDamageReturn", "bRegenPercentHP", "bRegenPercentSP", "bRes", "bResEff", "bResRate", "bRestartFullRecover", "bSMatkRate", "bSPDrainRate", "bSPDrainValue", "bSPDrainValueClass", "bSPDrainValueRace", "bSPGainRace", "bSPGainValue", "bSPLossRate", "bSPRegenRate", "bSPVanishRaceRate", "bSPVanishRate", "bSPrecovRate", "bSetDefRace", "bSetMDefRace", "bShortAtkRate", "bShortWeaponDamageReturn", "bSkillAtk", "bSkillCooldown", "bSkillDelay", "bSkillFixedCast", "bSkillHeal", "bSkillHeal2", "bSkillRatio", "bSkillUseSP", "bSkillUseSPrate", "bSkillVariableCast", "bSmatk", "bSpeedAddRate", "bSpeedRate", "bSpl", "bSplashAddRange", "bSplashRange", "bSta", "bStateNoRecoverRace", "bStr", "bSubClass", "bSubDefEle", "bSubEle", "bSubRace", "bSubRace2", "bSubSize", "bSubSkill", "bUnbreakable", "bUnbreakableArmor", "bUnbreakableGarment", "bUnbreakableHelm", "bUnbreakableShield", "bUnbreakableShoes", "bUnbreakableWeapon", "bUnstripable", "bUnstripableArmor", "bUnstripableHelm", "bUnstripableShield", "bUnstripableWeapon", "bUseSPrate", "bVariableCast", "bVariableCastrate", "bVit", "bWeaponAtk", "bWeaponAtkRate", "bWeaponComaClass", "bWeaponComaEle", "bWeaponComaRace", "bWeaponDamageRate", "bWeaponMatkRate", "bWeaponSubClass", "bWeaponSubSize", "bWis"];
const PUNCT = ',;(){}+-*/<>=!&|?:%';
// Compound assignments count as assignments (left side must be a .@ variable); ++ and -- are refused.
const COMPOUND = ['+=', '-=', '*=', '/=', '%=', '|=', '&='];
const WORDS = new Set([...KEYWORDS, ...BONUS_NAMES.map(b => b.toLowerCase())]);

const isName = s => /^[A-Za-z][A-Za-z0-9_]*$/.test(s);
const count = (s, c) => s.split(c).length - 1;

// Comments and line breaks are removed before sending: requests are one chat line, split between words.
function normalize(script) {
  return String(script || '').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ').replace(/\s+/g, ' ').trim();
}

function guard(s) {
  if (s.length > MAX_LENGTH) return `script is longer than ${MAX_LENGTH} characters`;
  for (const ch of s) if (!ALLOWED_CHARS.includes(ch)) return `character not allowed: ${ch}`;
  if (s.split('.@').join('').includes('@')) return '@ is only allowed in .@ variables';
  if (count(s, '{') !== count(s, '}')) return 'unbalanced { }';
  if (count(s, '(') !== count(s, ')')) return 'unbalanced ( )';
  if (count(s, '"') % 2) return 'unbalanced quotes';
  if (s.includes('++') || s.includes('--')) return '++ and -- are not allowed';

  // Quoted text is either a skill name (data) or an autobonus script, which is checked like the rest.
  let scan = '', bad = false;
  s.split('"').forEach((part, k) => {
    if (k % 2 === 0) scan += ` ${part} `;
    else if (isName(part)) { /* skill name */ }
    else if (part.startsWith('{') && part.endsWith('}')) scan += ` ${part} `;
    else bad = true;
  });
  if (bad) return 'only skill names and { } bonus scripts may be quoted';

  // Assignments only to .@ variables.
  let t = scan;
  for (const op of ['==', '!=', '>=', '<=']) t = t.split(op).join('  ');
  for (const op of COMPOUND) t = t.split(op).join(' =');
  const pieces = t.split('=');
  for (let k = 0; k < pieces.length - 1; k++) {
    if (!/\.@[A-Za-z0-9_]+\s*$/.test(pieces[k])) return 'only .@ variables can be assigned';
  }

  // skill grants must stay temporary: a third value of 0 or 3 would teach the skill for good.
  const low = scan.toLowerCase();
  for (let at = low.indexOf('skill'); at >= 0; at = low.indexOf('skill', at + 5)) {
    if (/[a-z0-9_]/.test(low[at - 1] || ' ') || /[a-z0-9_]/.test(low[at + 5] || ' ')) continue;
    const end = low.indexOf(';', at);
    const args = low.slice(at + 5, end < 0 ? undefined : end).split(',');
    if (args.length >= 3 && !['1', '2'].includes(args[2].trim())) return 'skill grants must be temporary (third value 1 or 2)';
  }

  // Every identifier must be on the allow-list.
  t = scan;
  for (const ch of PUNCT) t = t.split(ch).join(' ');
  for (const w of t.split(' ')) {
    if (!w) continue;
    if (w.startsWith('.@')) {
      const rest = w.slice(2);
      if (!rest || rest.includes('.') || rest.includes('@')) return `bad variable: ${w}`;
      continue;
    }
    if (w.includes('.')) return `unexpected . in ${w}`;
    if ('0123456789'.includes(w[0])) {
      if (!/^[0-9]+$/.test(w)) return `bad number: ${w}`;
      continue;
    }
    const lw = w.toLowerCase();
    if (WORDS.has(lw) || PREFIXES.some(p => lw.length > p.length && lw.startsWith(p))) continue;
    return `not allowed: ${w}`;
  }
  return '';
}

// Split between words into request-sized parts; the NPC joins them with single spaces.
function chunks(s, size = CHUNK) {
  const words = s.split(' ').filter(Boolean);
  if (words.some(w => w.length > 120)) throw Error('A word in this script is longer than 120 characters.');
  const out = [];
  let cur = '';
  for (const w of words) {
    if (cur && cur.length + 1 + w.length > size) { out.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) out.push(cur);
  return out;
}

// A short, stable fingerprint of a script, to tell whether the live copy is current.
function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36) + ':' + s.length;
}

const api = {MAX_LENGTH, REQUEST_LIMIT, CHUNK, KEYWORDS, PREFIXES, BONUS_NAMES, normalize, guard, chunks, hash};
if (typeof module !== 'undefined') module.exports = api; else root.HubLiveGuard = api;
})(globalThis);
