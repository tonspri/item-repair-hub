// Item Repair Hub v2.9.0 without a browser (runs in the mod repository's CI too):
// effects reader and description check, saved-edit stat bonuses in the compiler, the backend's presets,
// Keep in my saved edit and item info, presets left out of the export, and the trimmed skill tables.
// Usage: node check-features-v2.9.0.cjs [mod folder]   (default: mod, as in the repository)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(process.argv[2] || 'mod'), ed = path.join(root, 'client/editor');
const E = require(path.join(ed, 'effects-v2.9.0.js')), G = require(path.join(ed, 'live-guard-v2.9.0.js'));
const skillData = JSON.parse(fs.readFileSync(path.join(ed, 'skills-v1.7.0.json'))), skills = skillData.skills;
const compiler = require(path.join(ed, 'compiler-v2.9.0.js')).create(skillData);
const items = new Map(JSON.parse(fs.readFileSync(path.join(ed, 'items-v1.7.4.json'))).map(i => [i.id, i]));

// 1. Plain-English effects, worked out at a refine level.
const script = '.@r = getrefine(); bonus bStr,5*(.@r/2); bonus2 bSubRace,RC_DemiHuman,15; if (.@r >= 10) { bonus5 bAutoSpell,"MG_FIREBOLT",10,50,BF_SHORT|BF_WEAPON|BF_NORMAL,1; } if (BaseLevel <= 99) { skill "MG_SOULSTRIKE",10; }';
const at9 = E.explain(script, {refine: 9, skills});
assert.deepEqual(at9.map(l => [l.text, l.depth, l.active]), [
  ['STR +20', 0, true], ['Damage taken from Demi-Human -15%', 0, true],
  ['Refine +10 or higher', 0, false], ['5% chance to autocast [Fire Bolt] Lv.10 on melee attacks', 1, false],
  ['Base Lv 99 or lower', 0, null], ['Enables [Soul Strike] Lv.10', 1, null],
]);
assert.equal(E.explain(script, {skills})[0].text, 'STR +(5×((refine)÷2))');
assert.deepEqual(E.explain('autobonus3 "{ bonus bAtkRate,30; }",1000,20000,"SO_STRIKING";', {skills}).map(l => l.text),
  ['100% chance when using [Striking] to gain for 20s:', 'ATK +30%']);

// 2. Description check: promised effects the script lacks; none once they are there.
const description = ['MATK + 10.', 'When refined to +11 or higher, 5% chance to autocast [Fire Bolt] Lv.10 when performing a physical attack.', 'Enables use of Lv.5 [Soul Strike].', '------', 'Set Bonus:', 'When refined to +13 or higher, STR +5.'];
assert.deepEqual(E.check(description, 'bonus bMatk,10;', skills).map(i => i.kind), ['refine', 'autocast', 'enable_skill', 'skill', 'skill']);
assert.deepEqual(E.check(description, 'bonus bMatk,10; skill "MG_SOULSTRIKE",5; if (getrefine() >= 11) bonus5 bAutoSpell,"MG_FIREBOLT",10,50,BF_WEAPON,1;', skills), []);

// 3. Saved-edit stat bonuses: checked, compiled into the item script, refused when unsafe.
const bat = items.get(420422);
const entry = compiler.validateEntry({id: 420422, enabled: true, bonuses: {stats: [{stat: 'str', amount: 100}], raw: 'bonus bLuk,7;'}}, bat);
assert.deepEqual(entry.bonuses, {stats: [{stat: 'str', amount: 100}], raw: 'bonus bLuk,7;'});
const row = compiler.parseTable(compiler.compile([entry])).get(420422);
assert.match(row.Script, /\/\/ IRH_TEMP_SKILL_BEGIN\nbonus bStr,100; bonus bLuk,7;\n\/\/ IRH_TEMP_SKILL_END\n/);
assert(row.Script.endsWith(bat.Script.trimEnd()), 'the item keeps its own script');
assert.throws(() => compiler.validateEntry({id: 420422, bonuses: {stats: [], raw: 'getitem 501,1;'}}, bat), /Stat bonuses refused: not allowed: getitem/);
assert.throws(() => compiler.validateEntry({id: 420422, bonuses: {stats: [{stat: 'nope', amount: 1}]}}, bat), /Invalid added stats/);
assert.throws(() => compiler.validateEntry({id: 501, bonuses: {stats: [{stat: 'str', amount: 1}]}}, items.get(501)), /require equipment/);

// 4. The editor backend: presets, Keep in my saved edit, item info, and what the export leaves out.
(async () => {
  const events = {}, sent = [];
  let host = {parameters: {}, draft: null}, files;
  const ctx = {console, Map, Set, Blob, TextEncoder, TextDecoder, Uint8Array, structuredClone, atob, btoa, setTimeout: (f, t) => t === 60000 ? 0 : setTimeout(f, t), clearTimeout,
    URL: class extends URL { static createObjectURL() { return 'blob:test'; } static revokeObjectURL() {} },
    location: {href: 'http://test/client/editor/index.html', origin: 'http://test'},
    ItemRepairCompiler: require(path.join(ed, 'compiler-v2.9.0.js')), HubCompat: require(path.join(ed, 'compat-v2.9.0.js')), HubEffects: E, HubLiveGuard: G,
    HubZip: {pack: f => { files = f; return new Uint8Array(1); }},
    document: {createElement: () => ({click() {}, remove() {}}), body: {append() {}}}};
  ctx.window = {addEventListener: (n, f) => { events[n] = f; }, parent: {postMessage: r => queueMicrotask(() => {
    sent.push(r);
    const value = r.op === 'load' ? host : r.op === 'item' ? r.value.map(id => ({id, name: `Item ${id}`, description: ['MATK + 10.'], icon: 'data:image/png;base64,'})) : {saved: true};
    if (r.op === 'save') host = {parameters: {}, draft: r.value};
    events.message({source: ctx.window.parent, origin: 'http://test', data: {type: 'irh-native-reply', id: r.id, value}});
  })}};
  ctx.fetch = async url => { const u = new URL(String(url), 'http://test/client/editor/'); const bytes = fs.readFileSync(path.join(root, decodeURIComponent(u.pathname))); return {ok: true, json: async () => JSON.parse(bytes), arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)}; };
  vm.runInNewContext(fs.readFileSync(path.join(ed, 'native-backend-v2.9.0.js'), 'utf8'), ctx);
  await ctx.window.modSettings.get();
  const api = ctx.window.modSettings.itemRepairs;

  let presets = (await api({op: 'presetSave', preset: {name: 'Farming', stats: [{stat: 'str', amount: 50}], raw: ''}})).presets;
  assert.deepEqual(presets, [{name: 'Farming', stats: [{stat: 'str', amount: 50}], raw: ''}]);
  await assert.rejects(api({op: 'presetSave', preset: {name: 'Bad', stats: [], raw: 'warp "prontera",1,1;'}}), /Not saved/);
  await assert.rejects(api({op: 'presetSave', preset: {name: '', stats: [{stat: 'str', amount: 1}]}}), /name/);
  presets = (await api({op: 'presetSave', preset: {name: 'Farming', stats: [{stat: 'agi', amount: 5}], raw: ''}})).presets;
  assert.deepEqual(presets.map(p => p.stats[0].stat), ['agi'], 'saving under the same name replaces it');

  const before = (await api({op: 'list'})).revision;
  await api({op: 'keepBonuses', id: 420422, bonuses: {stats: [{stat: 'str', amount: 100}], raw: ''}});
  const kept = await api({op: 'keepBonuses', id: 420422, bonuses: {stats: [{stat: 'str', amount: 20}, {stat: 'maxhprate', amount: 15}], raw: ''}});
  assert.equal(kept.revision, before + 2);
  assert.deepEqual(kept.entries.find(e => e.id === 420422).bonuses.stats, [{stat: 'str', amount: 120}, {stat: 'maxhprate', amount: 15}], 'kept stats add up per stat');
  const info = (await api({op: 'liveInfo', ids: [420422]})).items[0];
  assert(info.hasEdit && /bonus bStr,120; bonus bMaxHPrate,15;/.test(info.script), 'the item now starts with the kept stats');

  const meta = (await api({op: 'itemInfo', ids: [420422, 4001]})).items;
  assert.deepEqual(meta.map(m => m.id), [420422, 4001]);
  await assert.rejects(api({op: 'itemInfo', ids: ['x']}), /Invalid item list/);

  await ctx.window.HubNative.exportZip();
  const seed = JSON.parse(files.get('item-repair-hub/client/seed-config-v2.9.0.json'));
  assert(!('livePresets' in seed) && !('liveApplied' in seed) && !('liveExtras' in seed), 'presets and live markers stay on this PC');
  assert.match(files.get('item-repair-hub/renewal/db/when/zz_native_exports/item_db.yml'), /- Id: 420422[\s\S]*bonus bStr,120; bonus bMaxHPrate,15;/);
  assert.deepEqual(host.draft.livePresets.map(p => p.name), ['Farming']);

  // 5. Skill tables: only the rows the client lacks (PR 723 follow-up).
  const tables = path.join(root, 'renewal/data/luafiles514/lua files/skillinfoz');
  const rows = name => [...fs.readFileSync(path.join(tables, name), 'utf8').matchAll(/^ {2}(?:\[SKID\.)?(\w+)\]? = /gm)].map(m => m[1]);
  assert.deepEqual(rows('skillid.lub'), ['ALL_EQSWITCH']);
  assert.deepEqual(rows('skillinfolist.lub'), ['ALL_LIGHTHALZEN_RECALL', 'ALL_EQSWITCH']);
  assert.deepEqual(rows('skilldescript.lub'), ['ALL_LIGHTHALZEN_RECALL', 'ALL_EQSWITCH']);

  // 6. 55 iRO repairs behind one switch, and the NPC answers the scan's gear request.
  assert.equal((fs.readFileSync(path.join(root, 'renewal/db/when/fx_iro_effects/item_db.yml'), 'utf8').match(/^ {2}- Id: /gm) || []).length, 55);
  assert.match(fs.readFileSync(path.join(root, 'npc/live-apply-v2.9.0.txt'), 'utf8'), /if \(\.@op\$ == "gear"\)[\s\S]*getequipcardid\(\.@s, \.@c\)/);
  console.log('PASS v2.9.0 features: plain-English effects and refine tiers, description check, saved stat bonuses compiled and guarded, presets, Keep in my saved edit, item info, presets and live markers kept out of the export, skill tables trimmed to 2 client-missing skills, 55 iRO repairs, gear scan op.');
})().catch(e => { console.error(e); process.exitCode = 1; });
