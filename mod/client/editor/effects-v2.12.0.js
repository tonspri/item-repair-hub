/* Item Repair Hub v2.12.0 — shared item-effect helpers (browser and Node).
   STATS: the Live tab's stat pickers and saved stat bonuses (one table, so the live and exported lines match).
   explain(script, {refine, skills}): an item script as plain-English lines; with a refine level, refine
     conditions are marked active or not and refine formulas are worked out.
   check(description, script, skills): where an item's own description promises effects its script lacks
     (the description audit's rules, run on one item). Leads only, never proof. */
'use strict';
(function (root) {
  // Stat pickers: key, label, script line for an amount n, and how the amount reads.
  const STATS = [
    ['str', 'STR', 'bonus bStr,{n};'], ['agi', 'AGI', 'bonus bAgi,{n};'], ['vit', 'VIT', 'bonus bVit,{n};'], ['int', 'INT', 'bonus bInt,{n};'],
    ['dex', 'DEX', 'bonus bDex,{n};'], ['luk', 'LUK', 'bonus bLuk,{n};'], ['allstats', 'All basic stats', 'bonus bAllStats,{n};'],
    ['pow', 'POW', 'bonus bPow,{n};'], ['sta', 'STA', 'bonus bSta,{n};'], ['wis', 'WIS', 'bonus bWis,{n};'], ['spl', 'SPL', 'bonus bSpl,{n};'],
    ['con', 'CON', 'bonus bCon,{n};'], ['crt', 'CRT', 'bonus bCrt,{n};'], ['alltraits', 'All trait stats', 'bonus bAllTraitStats,{n};'],
    ['atk', 'ATK', 'bonus bBaseAtk,{n};'], ['matk', 'MATK', 'bonus bMatk,{n};'], ['atkrate', 'ATK %', 'bonus bAtkRate,{n};', '%'], ['matkrate', 'MATK %', 'bonus bMatkRate,{n};', '%'],
    ['patk', 'P.ATK', 'bonus bPAtk,{n};'], ['smatk', 'S.MATK', 'bonus bSMatk,{n};'],
    ['physclass', 'Physical damage to all enemies %', 'bonus2 bAddClass,Class_All,{n};', '%'], ['magclass', 'Magic damage to all enemies %', 'bonus2 bMagicAddClass,Class_All,{n};', '%'],
    ['ranged', 'Ranged physical damage %', 'bonus bLongAtkRate,{n};', '%'], ['critdmg', 'Critical damage %', 'bonus bCritAtkRate,{n};', '%'],
    ['maxhp', 'Max HP', 'bonus bMaxHP,{n};'], ['maxhprate', 'Max HP %', 'bonus bMaxHPrate,{n};', '%'], ['maxsp', 'Max SP', 'bonus bMaxSP,{n};'], ['maxsprate', 'Max SP %', 'bonus bMaxSPrate,{n};', '%'],
    ['def', 'DEF', 'bonus bDef,{n};'], ['mdef', 'MDEF', 'bonus bMdef,{n};'], ['hit', 'HIT', 'bonus bHit,{n};'], ['flee', 'FLEE', 'bonus bFlee,{n};'],
    ['pdodge', 'Perfect Dodge', 'bonus bFlee2,{n};'], ['crit', 'CRIT', 'bonus bCritical,{n};'], ['aspd', 'ASPD', 'bonus bAspd,{n};'], ['aspdrate', 'ASPD %', 'bonus bAspdRate,{n};', '%'],
    ['vct', 'Variable cast time % (negative is faster)', 'bonus bVariableCastrate,{n};', '%'], ['acd', 'After-cast delay % (negative is shorter)', 'bonus bDelayrate,{n};', '%'],
    ['heal', 'Healing power %', 'bonus bHealPower,{n};', '%'],
  ];
  // Trait stats and their attacks exist in renewal only; the pre-renewal picker leaves them out.
  const RENEWAL_ONLY = new Set(['pow', 'sta', 'wis', 'spl', 'con', 'crt', 'alltraits', 'patk', 'smatk']);
  const STAT = Object.fromEntries(STATS.map(([key, label, line, unit = '']) => [key, {label, line, unit}]));
  const statLine = e => STAT[e.stat].line.replace('{n}', String(e.amount));
  const readable = e => `${STAT[e.stat].label.replace(/ \(.*\)$/, '').replace(/ %$/, '')} ${e.amount >= 0 ? '+' : ''}${e.amount}${STAT[e.stat].unit}`;
  // A list of added stats ({stats, raw}) as checked shape; throws on anything else.
  function cleanBonuses(v) {
    const stats = Array.isArray(v?.stats) ? v.stats : [];
    if (stats.length > 40 || !stats.every(s => STAT[s?.stat] && Number.isInteger(s.amount) && s.amount !== 0 && Math.abs(s.amount) <= 10000)) throw Error('Invalid added stats.');
    const raw = v?.raw ?? '';
    if (typeof raw !== 'string' || raw.length > 3000) throw Error('Invalid advanced lines.');
    return {stats: stats.map(s => ({stat: s.stat, amount: s.amount})), raw};
  }
  const bonusScript = b => [...(b?.stats || []).map(statLine), b?.raw || ''].join(' ').trim();

  // ---- explain: script -> plain English ---------------------------------------------------------------------
  const ONE = {
    bStr: 'STR', bAgi: 'AGI', bVit: 'VIT', bInt: 'INT', bDex: 'DEX', bLuk: 'LUK', bAllStats: 'All basic stats', bAgiVit: 'AGI and VIT', bAgiDexStr: 'AGI, DEX and STR',
    bPow: 'POW', bSta: 'STA', bWis: 'WIS', bSpl: 'SPL', bCon: 'CON', bCrt: 'CRT', bAllTraitStats: 'All trait stats',
    bBaseAtk: 'ATK', bAtk: 'ATK', bAtk2: 'ATK', bMatk: 'MATK', bAtkRate: 'ATK %', bMatkRate: 'MATK %', bPAtk: 'P.ATK', bSMatk: 'S.MATK',
    bRes: 'RES', bMRes: 'MRES', bHPlus: 'H.PLUS', bCRate: 'C.RATE', bMaxAP: 'Max AP',
    bMaxHP: 'Max HP', bMaxHPrate: 'Max HP %', bMaxSP: 'Max SP', bMaxSPrate: 'Max SP %', bDef: 'DEF', bDefRate: 'DEF %', bMdef: 'MDEF', bMdefRate: 'MDEF %',
    bHit: 'HIT', bHitRate: 'HIT %', bFlee: 'FLEE', bFleeRate: 'FLEE %', bFlee2: 'Perfect Dodge', bCritical: 'CRIT', bCriticalLong: 'Ranged CRIT', bCritAtkRate: 'Critical damage %',
    bAspd: 'ASPD', bAspdRate: 'ASPD %', bVariableCastrate: 'Variable cast time %', bFixedCastrate: 'Fixed cast time %', bDelayrate: 'After-cast delay %', bHealPower: 'Healing power %', bHealPower2: 'Healing received %',
    bLongAtkRate: 'Ranged physical damage %', bShortAtkRate: 'Melee physical damage %', bSpeedRate: 'Movement speed %', bPerfectHitAddRate: 'Perfect Hit %', bPerfectHitRate: 'Perfect Hit %',
    bHPrecovRate: 'HP recovery %', bSPrecovRate: 'SP recovery %', bUseSPrate: 'SP cost %', bCastrate: 'Cast time %', bShortWeaponDamageReturn: 'Reflects melee damage %', bMagicDamageReturn: 'Reflects magic %',
    bLongHPGainValue: 'HP gained per ranged kill', bLongSPGainValue: 'SP gained per ranged kill', bCrate: 'C.RATE', bPatk: 'P.ATK', bSmatk: 'S.MATK',
    bLongAtkDef: 'Ranged damage taken -%', bNearAtkDef: 'Melee damage taken -%', bNonCritAtkRate: 'Non-critical damage %', bSPDrainValue: 'SP drained per hit',
    bSplashRange: 'Splash damage range', bAddItemHealRate: 'Healing from items %', bBreakArmorRate: 'Chance to break armor (0.01%)', bBreakWeaponRate: 'Chance to break weapon (0.01%)',
    bHPGainValue: 'HP gained per kill', bSPGainValue: 'SP gained per kill', bMagicHPGainValue: 'HP gained per magic kill', bMagicSPGainValue: 'SP gained per magic kill',
  };
  const FLAG = {
    bNoKnockback: 'Cannot be knocked back', bUnbreakableWeapon: 'Weapon is indestructible', bUnbreakableArmor: 'Armor is indestructible', bUnbreakableHelm: 'Headgear is indestructible',
    bUnbreakableShield: 'Shield is indestructible', bUnbreakableGarment: 'Garment is indestructible', bUnbreakableShoes: 'Shoes are indestructible', bUnbreakable: 'Indestructible',
    bNoSizeFix: 'No weapon size penalty', bNoGemStone: 'No gemstone cost', bIntravision: 'Can see hidden enemies', bNoCastCancel: 'Casting cannot be interrupted',
    bNoWalkDelay: 'No delay when hit', bRestartFullRecover: 'Full HP/SP when revived', bSplashRange: 'Splash damage', bInfiniteEndure: 'Endure',
  };
  const TWO = {
    bAddRace: 'Physical damage to {0} +{v}%', bMagicAddRace: 'Magic damage to {0} +{v}%', bSubRace: 'Damage taken from {0} -{v}%',
    bAddSize: 'Physical damage to {0} +{v}%', bMagicAddSize: 'Magic damage to {0} +{v}%', bSubSize: 'Damage taken from {0} -{v}%',
    bAddEle: 'Physical damage to {0} enemies +{v}%', bMagicAddEle: 'Magic damage to {0} enemies +{v}%', bSubEle: '{0} damage taken -{v}%',
    bAddClass: 'Physical damage to {0} +{v}%', bMagicAddClass: 'Magic damage to {0} +{v}%', bSubClass: 'Damage taken from {0} -{v}%',
    bMagicAtkEle: '{0} magic damage +{v}%', bSkillAtk: '{0} damage +{v}%', bSkillCooldown: '{0} cooldown {s}', bVariableCastrate: '{0} variable cast time {v}%',
    bFixedCastrate: '{0} fixed cast time {v}%', bSkillUseSP: '{0} SP cost {v}', bSkillUseSPrate: '{0} SP cost {v}%', bSkillDelay: '{0} after-cast delay {s}',
    bIgnoreDefRaceRate: 'Ignores {v}% of DEF of {0}', bIgnoreMdefRaceRate: 'Ignores {v}% of MDEF of {0}', bIgnoreDefClassRate: 'Ignores {v}% of DEF of {0}', bIgnoreMdefClassRate: 'Ignores {v}% of MDEF of {0}',
    bExpAddRace: 'EXP from {0} +{v}%', bExpAddClass: 'EXP from {0} +{v}%', bCriticalAddRace: 'CRIT against {0} +{v}', bHPDrainRate: '{0p}% chance to drain {v}% of damage as HP',
    bResEff: 'Resistance to {0} +{h}%', bAddEff: '{h}% chance to inflict {0} on attack', bAddEffWhenHit: '{h}% chance to inflict {0} when hit',
    bSkillVariableCast: '{0} variable cast time {s}', bSkillFixedCast: '{0} fixed cast time {s}', bSubSkill: 'Damage taken from {0} -{v}%',
    bAddRace2: 'Physical damage to {0} +{v}%', bMagicAddRace2: 'Magic damage to {0} +{v}%', bSubRace2: 'Damage taken from {0} -{v}%',
    bIgnoreResRaceRate: 'Ignores {v}% of RES of {0}', bIgnoreMResRaceRate: 'Ignores {v}% of MRES of {0}', bAddItemHealRate: 'Healing from {0} +{v}%',
    bSPLossRate: 'Loses {0} SP every {s}', bWeaponDamageRate: '{0} weapon damage +{v}%',
    bSPDrainRate: '{0p}% chance to drain {v}% of damage as SP', bHPLossRate: 'Loses {0} HP every {s}', bHPRegenRate: 'Recovers {0} HP every {s}', bSPRegenRate: 'Recovers {0} SP every {s}',
  };
  const lower = table => Object.fromEntries(Object.entries(table).map(([k, v]) => [k.toLowerCase(), v]));
  const ONE_ = lower(ONE), FLAG_ = lower(FLAG), TWO_ = lower(TWO);
  const NAMES = {
    RC_All: 'all races', RC_DemiHuman: 'Demi-Human', RC_Player_Human: 'human players', RC_Player_Doram: 'Doram players', RC_Brute: 'Brute', RC_Formless: 'Formless',
    RC_Undead: 'Undead', RC_Demon: 'Demon', RC_Angel: 'Angel', RC_Dragon: 'Dragon', RC_Insect: 'Insect', RC_Fish: 'Fish', RC_Plant: 'Plant',
    Size_All: 'all sizes', Size_Small: 'small enemies', Size_Medium: 'medium enemies', Size_Large: 'large enemies',
    Ele_All: 'all property', Class_All: 'all enemies', Class_Normal: 'normal monsters', Class_Boss: 'boss monsters',
  };
  const nameOf = c => NAMES[c] || (/^Eff_/.test(c) ? c.slice(4).replace(/_/g, ' ') : null) || (/^Ele_/.test(c) ? c.slice(4) + (c === 'Ele_All' ? '' : ' property') : c.replace(/^(RC|Size|Class)_/, '').replace(/_/g, ' '));

  // Top-level split on a separator, outside quotes, parentheses and braces.
  function split(text, sep) {
    const out = []; let depth = 0, quote = false, start = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quote) { if (c === '\\') i++; else if (c === '"') quote = false; continue; }
      if (c === '"') quote = true;
      else if (c === '(' || c === '{') depth++;
      else if (c === ')' || c === '}') depth--;
      else if (c === sep && depth === 0) { out.push(text.slice(start, i).trim()); start = i + 1; }
    }
    out.push(text.slice(start).trim());
    return out;
  }

  // Statements and blocks: [{type:'stmt',text} | {type:'if',cond,then:[...],else:[...]} | {type:'block',body}].
  function parse(src) {
    let i = 0;
    const ws = () => {
      for (;;) {
        while (i < src.length && /\s/.test(src[i])) i++;
        if (src.startsWith('//', i)) { const n = src.indexOf('\n', i); i = n < 0 ? src.length : n; continue; }
        if (src.startsWith('/*', i)) { const n = src.indexOf('*/', i + 2); i = n < 0 ? src.length : n + 2; continue; }
        return;
      }
    };
    const group = (open, close) => {
      let depth = 0, quote = false; const start = i;
      for (; i < src.length; i++) {
        const c = src[i];
        if (quote) { if (c === '\\') i++; else if (c === '"') quote = false; continue; }
        if (c === '"') quote = true;
        else if (c === open) depth++;
        else if (c === close && --depth === 0) { i++; return src.slice(start + 1, i - 1); }
      }
      return src.slice(start + 1);
    };
    function statement() {
      ws();
      if (i >= src.length) return null;
      if (src[i] === '{') return {type: 'block', body: parse(group('{', '}'))};
      if (/^if\s*\(/.test(src.slice(i, i + 10))) {
        i = src.indexOf('(', i);
        const cond = group('(', ')').trim();
        const then = statement();
        ws();
        let other = null;
        if (/^else\b/.test(src.slice(i, i + 5))) { i += 4; other = statement(); }
        return {type: 'if', cond, then: then ? [then] : [], else: other ? [other] : []};
      }
      if (/^(for|while|switch)\s*\(/.test(src.slice(i, i + 10))) {
        const start = i; i = src.indexOf('(', i); group('(', ')'); ws();
        if (src[i] === '{') group('{', '}'); else statement();
        return {type: 'stmt', text: src.slice(start, i).trim(), opaque: true};
      }
      let depth = 0, quote = false; const start = i;
      for (; i < src.length; i++) {
        const c = src[i];
        if (quote) { if (c === '\\') i++; else if (c === '"') quote = false; continue; }
        if (c === '"') quote = true;
        else if (c === '(' || c === '{') depth++;
        else if (c === ')' || c === '}') depth--;
        else if (c === ';' && depth <= 0) { i++; break; }
      }
      const text = src.slice(start, i).replace(/;$/, '').trim();
      return text ? {type: 'stmt', text} : statement();
    }
    const out = [];
    for (let s; (s = statement());) out.push(s);
    return out;
  }

  // Expressions: worked out when every part is known, or written out readably.
  function evaluate(expr, env) {
    const toks = expr.match(/\.@\w+|getrefine\(\)|[A-Za-z_]\w*|\d+|>=|<=|==|!=|&&|\|\||[-+*/%()<>!,?:]/g) || [];
    let p = 0, unknown = false;
    const peek = () => toks[p], next = () => toks[p++];
    function primary() {
      const t = next();
      if (t === undefined) { unknown = true; return 0; }
      if (/^\d+$/.test(t)) return Number(t);
      if (t === '(') { const v = ternary(); next(); return v; }
      if (t === '-') return -primary();
      if (t === '!') return primary() ? 0 : 1;
      if (t === 'getrefine()') { if (env.refine == null) unknown = true; return env.refine ?? 0; }
      if (t === 'min' || t === 'max') {
        next(); const args = [ternary()]; while (peek() === ',') { next(); args.push(ternary()); } next();
        return Math[t](...args);
      }
      if (t.startsWith('.@') && env.vars[t] != null) {
        const v = evaluate(env.vars[t], {...env, vars: {...env.vars, [t]: null}});
        if (v === null) unknown = true; return v ?? 0;
      }
      if (peek() === '(') { next(); let d = 1; while (p < toks.length && d) { const x = next(); if (x === '(') d++; if (x === ')') d--; } }
      unknown = true; return 0;
    }
    function term() { let v = primary(); while (['*', '/', '%'].includes(peek())) { const o = next(), r = primary(); v = o === '*' ? v * r : o === '/' ? (r ? Math.trunc(v / r) : 0) : (r ? v % r : 0); } return v; }
    function sum() { let v = term(); while (['+', '-'].includes(peek())) { const o = next(), r = term(); v = o === '+' ? v + r : v - r; } return v; }
    function compare() { let v = sum(); while (['<', '>', '<=', '>=', '==', '!='].includes(peek())) { const o = next(), r = sum(); v = Number({'<': v < r, '>': v > r, '<=': v <= r, '>=': v >= r, '==': v === r, '!=': v !== r}[o]); } return v; }
    function and() { let v = compare(); while (peek() === '&&') { next(); const r = compare(); v = Number(v && r); } return v; }
    function or() { let v = and(); while (peek() === '||') { next(); const r = and(); v = Number(v || r); } return v; }
    function ternary() { const c = or(); if (peek() !== '?') return c; next(); const a = ternary(); next(); const b = ternary(); return c ? a : b; }
    const v = ternary();
    return unknown || p < toks.length ? null : v;
  }
  function pretty(expr, env) {
    let text = expr;
    for (const [name, value] of Object.entries(env.vars)) if (value != null) text = text.split(name).join(`(${value})`);
    return text.replace(/getrefine\(\)/g, 'refine').replace(/\bBaseLevel\b/g, 'Base Lv').replace(/\bJobLevel\b/g, 'Job Lv')
      .replace(/min\(\s*Base Lv\s*,\s*(\d+)\s*\)/g, 'Base Lv (up to $1)').replace(/readparam\(b(\w+)\)/g, 'base $1').replace(/getskilllv\("(\w+)"\)/g, (_, s) => `${skillName(s, env)} level`)
      .replace(/\.@/g, '').replace(/\*/g, '×').replace(/\//g, '÷').replace(/\(\(([^()]*)\)\)/g, '($1)').replace(/\s+/g, ' ').trim();
  }
  function value(expr, env) {
    const v = evaluate(expr, env);
    return v === null ? {known: false, text: `(${pretty(expr, env)})`, n: NaN} : {known: true, text: String(v), n: v};
  }
  const signed = v => v.known ? (v.n >= 0 ? `+${v.n}` : String(v.n)) : `+${v.text}`;
  function skillName(arg, env) {
    const key = String(arg).replace(/^"|"$/g, '');
    const s = env.skills?.[key];
    return `[${s?.name || key}]`;
  }
  const seconds = v => v.known ? `${v.n < 0 ? '-' : '+'}${Math.abs(v.n) / 1000}s` : `${v.text} ms`;
  const percent = v => v.known ? `${v.n / 10}` : `${v.text}÷10`;
  function cast(args, env, when) {
    const [sk, lv, rate, flags] = args;
    const level = value(lv, env).text;
    const r = percent(value(rate, env));
    let on = when;
    if (on === undefined) {
      const f = flags || '';
      on = /BF_MAGIC/.test(f) && !/BF_WEAPON/.test(f) ? 'on magic attacks'
        : /BF_SHORT/.test(f) && !/BF_LONG/.test(f) ? 'on melee attacks' : /BF_LONG/.test(f) && !/BF_SHORT/.test(f) ? 'on ranged attacks' : 'on physical attacks';
    }
    return `${r}% chance to autocast ${skillName(sk, env)} Lv.${level}${on ? ' ' + on : ''}`;
  }

  function describe(stmt, env) {
    const text = stmt.text;
    let m = /^\.@(\w+)\s*([-+*/]?=)\s*([\s\S]+)$/.exec(text);
    if (m) {
      const name = '.@' + m[1];
      env.vars[name] = m[2] === '=' && !env.inBranch ? m[3] : null;
      return null;
    }
    m = /^(bonus[2-5]?)\s+(\w+)\s*(?:,([\s\S]*))?$/.exec(text);
    if (m) {
      const [, kind] = m, name = m[2].toLowerCase(), args = m[3] ? split(m[3], ',') : [];
      if (kind === 'bonus' && FLAG_[name] && !args.length) return FLAG_[name];
      if (kind === 'bonus' && name === 'bdefele') return `Armor property: ${nameOf(args[0]).replace(/ property$/, '')}`;
      if (kind === 'bonus' && name === 'batkele') return `Weapon property: ${nameOf(args[0]).replace(/ property$/, '')}`;
      if (kind === 'bonus' && name === 'bfixedcast') return `Fixed cast time ${seconds(value(args[0], env))}`;
      if (kind === 'bonus' && name === 'bdefratioatkclass') return 'Damage increases with the target\'s DEF';
      if (kind === 'bonus' && ONE_[name] && args.length === 1) {
        const label = ONE_[name], v = value(args[0], env);
        if (label.endsWith(' -%')) return `${label.slice(0, -3)} ${v.known ? (v.n >= 0 ? `-${v.n}` : `+${-v.n}`) : `-${v.text}`}%`;
        return label.endsWith(' %') ? `${label.slice(0, -2)} ${signed(v)}%` : `${label} ${signed(v)}`;
      }
      if (kind === 'bonus2' && TWO_[name] && args.length === 2) {
        const v = value(args[1], env), first = /^"/.test(args[0]) ? skillName(args[0], env) : /^[A-Z][A-Za-z]*_/.test(args[0]) ? nameOf(args[0]) : value(args[0], env).text;
        return TWO_[name].replace('{0p}', percent(value(args[0], env))).replace('{0}', first).replace('{s}', seconds(v)).replace('{h}', v.known ? String(v.n / 100) : `${v.text}÷100`)
          .replace('+{v}', signed(v)).replace('-{v}', v.known ? (v.n >= 0 ? `-${v.n}` : `+${-v.n}`) : `-${v.text}`).replace('{v}', v.text);
      }
      if (name === 'bautospell' && args.length >= 3) return cast(args, env);
      if (name === 'bautospellwhenhit' && args.length >= 3) return cast(args, env, 'when hit');
      if (name === 'bautospellonskill' && args.length >= 4) {
        const [on, ...rest] = args;
        return `When using ${skillName(on, env)}: ${cast(rest, env, '')}`;
      }
      return null;
    }
    m = /^skill\s+([\s\S]+)$/.exec(text);
    if (m) {
      const [sk, lv, flag] = split(m[1], ',');
      return `Enables ${skillName(sk, env)} Lv.${value(lv, env).text}${flag && flag !== '0' ? ' while equipped' : ''}`;
    }
    return null;
  }

  function condition(cond, env) {
    const v = evaluate(cond, env);
    const parts = split(cond.replace(/&&/g, '\u0001'), '\u0001').map(c => {
      let m = /^(getrefine\(\)|\.@\w+)\s*(>=|>|==|<=|<)\s*(\d+)$/.exec(c.trim());
      if (m && (m[1] === 'getrefine()' || /^(\(?getrefine\(\)\)?|min\(\s*\d+\s*,\s*getrefine\(\)\s*\))$/.test(env.vars[m[1]] || ''))) {
        const n = Number(m[3]);
        return {'>=': `Refine +${n} or higher`, '>': `Refine +${n + 1} or higher`, '==': `Refine exactly +${n}`, '<=': `Refine +${n} or lower`, '<': `Refine +${n - 1} or lower`}[m[2]];
      }
      m = /^BaseLevel\s*(>=|>|<=|<)\s*(\d+)$/.exec(c.trim());
      if (m) { const n = Number(m[2]); return {'>=': `Base Lv ${n} or higher`, '>': `Base Lv ${n + 1} or higher`, '<=': `Base Lv ${n} or lower`, '<': `Base Lv ${n - 1} or lower`}[m[1]]; }
      m = /^getskilllv\("(\w+)"\)\s*(>=|==)\s*(\d+)$/.exec(c.trim());
      if (m) return `${skillName(m[1], env)} Lv.${m[3]}${m[2] === '>=' ? '+' : ''} learned`;
      return `If ${pretty(c, env)}`;
    });
    return {text: parts.join(' and '), active: v === null ? null : !!v};
  }

  function explain(script, options = {}) {
    const env = {refine: Number.isInteger(options.refine) ? options.refine : null, skills: options.skills || {}, vars: {}, inBranch: false};
    const lines = [];
    function walk(nodes, depth, active) {
      for (const node of nodes) {
        if (node.type === 'block') walk(node.body, depth, active);
        else if (node.type === 'if') {
          const c = condition(node.cond, env);
          const on = active === false ? false : c.active;
          lines.push({text: c.text, depth, active: on, heading: true});
          const was = env.inBranch; env.inBranch = true;
          walk(node.then, depth + 1, on);
          if (node.else.length) {
            const elseOn = active === false ? false : c.active === null ? null : !c.active;
            const chained = node.else.length === 1 && node.else[0].type === 'if';
            if (!chained) lines.push({text: 'Otherwise', depth, active: elseOn, heading: true});
            walk(node.else, chained ? depth : depth + 1, elseOn);
          }
          env.inBranch = was;
        } else {
          const auto = /^(autobonus[23]?)\s+([\s\S]+)$/.exec(node.text);
          if (auto) {
            const [inner, rate, dur, , skill] = split(auto[2], ',');
            const when = auto[1] === 'autobonus2' ? 'when hit' : auto[1] === 'autobonus3' ? `when using ${skillName(skill ?? split(auto[2], ',')[3], env)}` : 'on attack';
            lines.push({text: `${percent(value(rate, env))}% chance ${when} to gain for ${value(dur, env).known ? value(dur, env).n / 1000 + 's' : value(dur, env).text}:`, depth, active, heading: true});
            const body = (inner || '').replace(/^"\{?|\}?"$/g, '').replace(/\\"/g, '"');
            for (const l of explain(body, options)) lines.push({...l, depth: depth + 1 + l.depth, active: active === false ? false : l.active});
            continue;
          }
          const text = describe(node, env);
          if (text === null && /^\.@/.test(node.text)) continue;
          lines.push({text: text ?? node.text, depth, active, raw: text === null});
        }
      }
    }
    walk(parse(String(script || '')), 0, true);
    // A heading with nothing under it says nothing.
    return lines.filter((l, i) => !l.heading || (lines[i + 1] && lines[i + 1].depth > l.depth));
  }

  // ---- check: description vs script ---------------------------------------------------------------------------
  const COLOR = /\^[0-9A-Fa-f]{6}/g;
  const SEPARATOR = /^\s*[-_=]{4,}\s*$/;
  const FOOTER = /^\s*(type|class|attack|defen[cs]e|weight|weapon level|armor level|requirement|required|location|position|element|property|jobs?|base level|equip(ped)? (on|level)|usable|refin(able|e ?able)|slots?|level requirement|matk|indestructible|can(not| ?not) be)\s*[:：]/i;
  const SET_START = /set bonus|when equipped (with|together)|when worn (with|together)|combo|\[grade bonus\]/i;
  const REFINE_THRESHOLD = [
    /(?:refined?|refine (?:level|rate)|upgraded?(?: level)?)(?:\s+(?:is|to|of|at|reaches|reached|by|level))*\s*(?:\+|lv\.?\s*)(\d{1,2})(?!\d)/gi,
    /\+(\d{1,2}) or (?:higher|more|above)/gi,
  ];
  const PER_REFINE = /(every|each|per)\s+(\d+\s+)?(refine|upgrade)/i;
  const AUTOCAST = /auto[- ]?(cast|spell)|chance (to|of) (cast|use|trigger|activate \[)|activates? \[|(cast|casts|casting) \[/i;
  const ENABLE_SKILL = /enables? (the )?(use|usage|to use)|enables? (level|lv)/i;
  const BASE_LEVEL = /base (lv|level)\.?\s*(is\s*)?\d+\s*(or|and)\s*(higher|lower|more|less|above|below)|(every|each|per)\s+(\d+\s+)?base (lv|level)|base (lv|level)\.?\s*(is\s*)?(between|over|under)/i;
  const SKILL_BRACKET = /\[([^\][]{3,40})\]/g;
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

  function body(description) {
    const lines = (Array.isArray(description) ? description : String(description || '').split(/\r?\n/)).map(l => String(l).replace(COLOR, '').trim());
    const out = [];
    for (const line of lines) {
      if (!line || SEPARATOR.test(line)) continue;
      if (SET_START.test(line)) break;  // set and grade bonuses come last
      if (!FOOTER.test(line)) out.push(line);
    }
    return out;
  }
  function thresholds(script) {
    const found = new Set(), vars = new Set([...script.matchAll(/(\.@\w+)\s*=\s*(?:min\(\s*\d+\s*,\s*)?getrefine\(\)/g)].map(m => m[1]));
    for (const [, subject, op, n] of script.matchAll(/(getrefine\(\)|\.@\w+)\s*(>=|>|==|<=|<)\s*(\d+)/g)) {
      if (subject !== 'getrefine()' && !vars.has(subject)) continue;
      found.add(Number(n) + (op === '>' || op === '<=' ? 1 : 0));
    }
    const subjects = ['getrefine\\(\\)', ...[...vars].map(v => v.replace('.', '\\.'))].join('|');
    if (new RegExp(`(${subjects})\\s*[-+]\\s*\\d`).test(script)) for (let n = 1; n <= 20; n++) found.add(n);
    return found;
  }
  // skills: aegis -> {name}. Returns [{kind, text, evidence}], plain English.
  function check(description, script, skills = {}) {
    const lines = body(description), s = String(script || ''), issues = [];
    const add = (kind, text, evidence) => issues.push({kind, text, evidence: String(evidence).slice(0, 200)});
    if (!lines.length) return issues;
    if (!s.trim()) {
      const effect = lines.find(l => /[+-]\s*\d|\d+\s*%|increase|decrease|reduce/i.test(l) || AUTOCAST.test(l) || ENABLE_SKILL.test(l));
      if (effect) add('no_script', 'The description lists effects, but the item has no script.', effect);
      return issues;
    }
    const have = thresholds(s), claimed = new Map();
    for (const line of lines) {
      if (PER_REFINE.test(line) && !/or (higher|more|above)/i.test(line)) continue;
      for (const re of REFINE_THRESHOLD) for (const [, n] of line.matchAll(re)) if (n >= 1 && n <= 20 && !claimed.has(Number(n))) claimed.set(Number(n), line);
    }
    for (const [n, line] of [...claimed].sort((a, b) => a[0] - b[0])) if (!have.has(n)) add('refine', `The description has a +${n} refine effect, but the script never checks for +${n}.`, line);
    const per = lines.find(l => PER_REFINE.test(l));
    if (per && !s.includes('getrefine')) add('per_refine', 'The description scales with refine, but the script never reads the refine level.', per);
    const casts = lines.filter(l => AUTOCAST.test(l)), scriptCasts = (s.match(/\bbonus\d\s+bAutoSpell(WhenHit|OnSkill)?\b/g) || []).length;
    if (casts.length > scriptCasts) add('autocast', `The description has ${casts.length} autocast${casts.length === 1 ? '' : 's'}, the script has ${scriptCasts}.`, casts[scriptCasts] || casts[0]);
    const enable = lines.find(l => ENABLE_SKILL.test(l));
    if (enable && !/(?<![\w.])skill\s+"?\w+"?\s*,/.test(s)) add('enable_skill', 'The description enables a skill, but the script grants none.', enable);
    const base = lines.find(l => BASE_LEVEL.test(l));
    if (base && !/BaseLevel/.test(s)) add('base_level', 'The description depends on Base Level, but the script never reads it.', base);
    const byName = new Map();
    for (const [aegis, info] of Object.entries(skills)) if (info?.name) { const k = norm(info.name); if (!byName.has(k)) byName.set(k, []); byName.get(k).push(aegis); }
    const seen = new Set();
    for (const line of lines) for (const [, name] of line.matchAll(SKILL_BRACKET)) {
      const aegis = byName.get(norm(name));
      if (!aegis || seen.has(name)) continue;
      seen.add(name);
      if (!aegis.some(a => s.includes(a))) add('skill', `The description mentions [${name}], but the script never uses it.`, line);
    }
    return issues;
  }

  const api = {STATS, RENEWAL_ONLY, STAT, statLine, readable, cleanBonuses, bonusScript, explain, check, descriptionBody: body, parse, evaluate};
  if (typeof module !== 'undefined') module.exports = api; else root.HubEffects = api;
})(globalThis);
