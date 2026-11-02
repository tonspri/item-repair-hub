// Item Repair Hub v2.9.1 in pre-renewal: the editor backend loads pre-renewal items and skills when the launcher
// says the server runs pre-renewal, keeps its own draft, refuses renewal-only items and skills and World Sync
// compatibility, and Save & Export writes both eras' repairs (this era's draft and the other era's saved one).
// The manifest and layout put renewal-only files in renewal/. Node only (runs in the mod repository's CI too).
// Usage: node check-pre-renewal-v2.9.1.cjs [mod folder]   (default: mod, as in the repository)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const root = path.resolve(process.argv[2] || 'mod'), ed = path.join(root, 'client/editor');
const pre = new Map(JSON.parse(fs.readFileSync(path.join(ed, 'items-pre-v1.7.6.json'))).map(i => [i.id, i]));
const renewalItems = new Map(JSON.parse(fs.readFileSync(path.join(ed, 'items-v1.7.4.json'))).map(i => [i.id, i]));
const cast = (skill, level, extra = {}) => ({skill, enabled: true, manual: false, level, chance: 10, trigger: 'both', target: 'auto', minRefine: 0, ...extra});

async function backend(host) {
  const events = {}, saves = [];
  let files;
  const ctx = {console, Map, Set, Blob, TextEncoder, TextDecoder, Uint8Array, structuredClone, atob, btoa, setTimeout: (f, t) => t === 60000 ? 0 : setTimeout(f, t), clearTimeout,
    URL: class extends URL { static createObjectURL() { return 'blob:test'; } static revokeObjectURL() {} },
    location: {href: 'http://test/client/editor/index.html', origin: 'http://test'},
    ItemRepairCompiler: require(path.join(ed, 'compiler-v2.9.1.js')), HubCompat: require(path.join(ed, 'compat-v2.9.1.js')),
    HubEffects: require(path.join(ed, 'effects-v2.9.1.js')), HubLiveGuard: require(path.join(ed, 'live-guard-v2.9.1.js')),
    HubZip: {pack: f => { files = f; return new Uint8Array(1); }}, document: {createElement: () => ({click() {}, remove() {}}), body: {append() {}}}};
  ctx.window = {addEventListener: (n, f) => { events[n] = f; }, parent: {postMessage: r => queueMicrotask(() => {
    let value;
    if (r.op === 'load') value = host.load;
    else if (r.op === 'save') { saves.push(r.value); value = {saved: true}; }
    else if (r.op === 'draft') value = host.drafts[r.value] ?? null;
    else if (r.op === 'probe') { const it = (host.load.era === 'pre-renewal' ? pre : renewalItems).get(r.value); value = it ? `OK|${r.value}|${it.AegisName}` : 'MISSING'; }
    else value = {saved: true};
    events.message({source: ctx.window.parent, origin: 'http://test', data: {type: 'irh-native-reply', id: r.id, value}});
  })}};
  ctx.fetch = async url => { const u = new URL(String(url), 'http://test/client/editor/'); const bytes = fs.readFileSync(path.join(root, decodeURIComponent(u.pathname))); return {ok: true, json: async () => JSON.parse(bytes), arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)}; };
  vm.runInNewContext(fs.readFileSync(path.join(ed, 'native-backend-v2.9.1.js'), 'utf8'), ctx);
  return {ctx, saves, files: () => files};
}

(async () => {
  // 1. Layout: renewal-only files in renewal/, both eras declared, one falcon NPC per era.
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'mod.json')));
  assert.equal(manifest.requires.era, 'any');
  assert.equal(manifest.renewalFolder, 'renewal');
  assert.equal(manifest.prerenewalFolder, 'pre-renewal');
  assert(!fs.existsSync(path.join(root, 'db')) && !fs.existsSync(path.join(root, 'data')), 'nothing era-specific at the top');
  assert(fs.existsSync(path.join(root, 'renewal/db/when/fx_iro_effects/item_db.yml')));
  for (const era of ['renewal', 'pre-renewal']) assert(fs.existsSync(path.join(root, `${era}/npc/visible-falcon-v2.9.1.txt`)));
  assert.match(fs.readFileSync(path.join(root, 'npc/item-probe-v2.9.1.txt'), 'utf8'), /checkre\(0\) \? "renewal" : "pre-renewal"/);
  const index = fs.readFileSync(path.join(root, 'client/index.js'), 'utf8');
  assert.match(index, /api\.on\('map:enter'/, 'the launcher waits for a map before asking the server');
  assert.match(index, /'editor-draft-pre-renewal-v2\.8\.0':'editor-draft-v2\.3\.0'/, 'one draft per era; both keys stay as earlier versions saved them');
  for (const catalog of ['client/editor/catalog-v2.9.1.json', 'settings/catalog-v2.9.1.json']) assert(JSON.parse(fs.readFileSync(path.join(root, catalog))).every(c => c.eras?.join() === 'renewal'));

  // 2. Pre-renewal data: its own items and skills.
  assert(pre.size > 6000 && !pre.has(500118), 'Agni Sword is a renewal item');
  assert.notEqual(pre.get(1132).Script, renewalItems.get(1132).Script, 'Edge differs between eras');
  const skills = JSON.parse(fs.readFileSync(path.join(ed, 'skills-pre-v1.7.6.json'))).skills;
  assert.equal(skills.ABC_ABYSS_SQUARE.selectable, false);
  assert.equal(skills.ALL_CATCRY.maxLevel, 9, 'pre-renewal max levels');

  // 3. The backend in pre-renewal, with a renewal draft saved earlier.
  const renewalDraft = {schema: 1, era: 'renewal', revision: 4, settings: {}, worldSyncCompat: true, removedIds: [], entries: [{id: 500118, enabled: true, autocasts: [cast('MG_COLDBOLT', 10, {manual: true})]}]};
  const b = await backend({load: {parameters: {}, era: 'pre-renewal', draft: null}, drafts: {renewal: renewalDraft}});
  const api = b.ctx.window.modSettings.itemRepairs;
  assert.equal((await b.ctx.window.modSettings.get()).context.era, 'pre-renewal');
  let state = await api({op: 'list'});
  assert.equal(state.era, 'pre-renewal');
  assert.equal(state.worldSyncCompat, false);
  assert.deepEqual(state.entries, [], 'pre-renewal starts with its own empty collection');
  await assert.rejects(api({op: 'compatibility', enabled: true}), /renewal only/);
  assert.equal((await api({op: 'lookup', id: 1132})).item.Script, pre.get(1132).Script);
  await assert.rejects(api({op: 'lookup', id: 500118}), /not in the bundled pre-renewal item definitions/);
  await assert.rejects(api({op: 'save', revision: state.revision, entry: {id: 1132, enabled: true, autocasts: [cast('ABC_ABYSS_SQUARE', 1)]}}), /Not in pre-renewal/);
  const saved = await api({op: 'save', revision: state.revision, entry: {id: 1132, enabled: true, autocasts: [cast('MG_FIREBOLT', 5)]}});
  assert.equal(saved.entries.length, 1);
  assert.equal(b.saves.at(-1).era, 'pre-renewal', 'saved under the pre-renewal draft');
  assert(!(await api({op: 'search', query: 'Agni'})).items.some(i => i.id === 500118));
  const live = (await api({op: 'liveInfo', ids: [1132]})).items[0];
  assert(live.hasEdit && live.script.includes('bonus2 bAddEff,Eff_Curse,30;') && live.script.includes('"MG_FIREBOLT",5,100'), 'live script is the pre-renewal item plus the edit');

  // 3b. Items with no script of their own (Main Gauche) take custom skills (v2.9.1 fix for "Missing baseline script").
  assert.equal(typeof pre.get(1208).Script, 'undefined');
  state = await api({op: 'list'});
  await api({op: 'save', revision: state.revision, entry: {id: 1208, enabled: true, autocasts: [
    {skill: 'MO_TRIPLEATTACK', enabled: false, manual: false, passive: true, level: 10, chance: 5, trigger: 'both', target: 'auto', minRefine: 0},
    cast('HT_BLITZBEAT', 5, {manual: true})]}});
  const gauche = (await api({op: 'liveInfo', ids: [1208]})).items[0];
  assert(gauche.hasEdit && /skill "MO_TRIPLEATTACK",10,1;/.test(gauche.script) && /bonus5 bAutoSpell,"HT_BLITZBEAT",5,100/.test(gauche.script));
  assert(b.ctx.HubLiveGuard.guard(b.ctx.HubLiveGuard.normalize(gauche.script)) === '', 'the live script passes the guard');

  // 4. Save & Export: this era's repairs and the renewal ones in their own folders, both seeds, no live data.
  await b.ctx.window.HubNative.exportZip();
  const files = b.files(), text = name => { const v = files.get('item-repair-hub/' + name); return typeof v === 'string' ? v : new TextDecoder().decode(v); };
  assert.match(text('pre-renewal/db/when/zz_native_exports/item_db.yml'), /- Id: 1132[\s\S]*bonus5 bAutoSpell,"MG_FIREBOLT",5,100/);
  assert.match(text('renewal/db/when/zz_native_exports/item_db.yml'), /- Id: 500118[\s\S]*skill "MG_COLDBOLT",10,1;/);
  assert.doesNotMatch(text('renewal/db/when/zz_native_exports/item_db.yml'), /Id: 1132/);
  assert(files.has('item-repair-hub/renewal/db/when/fx_iro_effects/item_db.yml'), 'renewal repairs still ship');
  assert(![...files.keys()].some(k => /^item-repair-hub\/(db|data)\//.test(k)), 'nothing era-specific at the top');
  const preSeed = JSON.parse(text('client/seed-config-pre-v2.9.1.json')), reSeed = JSON.parse(text('client/seed-config-v2.9.1.json'));
  assert.equal(preSeed.era, 'pre-renewal');
  assert.deepEqual(preSeed.entries.map(e => e.id), [1132, 1208]);
  assert.match(text('pre-renewal/db/when/zz_native_exports/item_db.yml'), /- Id: 1208\n    Script: \|\n      \/\/ IRH_TEMP_SKILL_BEGIN[\s\S]*IRH_TEMP_SKILL_END\n/);
  assert.equal(reSeed.era, 'renewal');
  assert.equal(reSeed.worldSyncCompat, true);
  assert.deepEqual(reSeed.entries.map(e => e.id), [500118]);
  assert(!('liveApplied' in preSeed) && !('livePresets' in reSeed));
  assert.match(text('renewal/npc/visible-falcon-v2.9.1.txt'), /IRHVisibleFalcon/);
  assert.match(text('pre-renewal/npc/visible-falcon-v2.9.1.txt'), /IRHVisibleFalcon/);

  // 4b. A renewal draft saved before v2.8.0 has no era field: an export from pre-renewal must still carry it (v2.9.1 fix).
  const {era: _era, ...oldDraft} = renewalDraft;
  const old = await backend({load: {parameters: {}, era: 'pre-renewal', draft: null}, drafts: {renewal: oldDraft}});
  await old.ctx.window.modSettings.get();
  await old.ctx.window.HubNative.exportZip();
  const oldFiles = old.files(), oldRenewal = oldFiles.get('item-repair-hub/renewal/db/when/zz_native_exports/item_db.yml');
  assert(typeof oldRenewal === 'string' && oldRenewal.includes('- Id: 500118'), 'the old renewal draft is exported');
  assert.deepEqual(JSON.parse(oldFiles.get('item-repair-hub/client/seed-config-v2.9.1.json')).entries.map(e => e.id), [500118]);
  // A draft that says it belongs to the other era is still not taken.
  const wrong = await backend({load: {parameters: {}, era: 'renewal', draft: null}, drafts: {'pre-renewal': oldDraft}});
  await wrong.ctx.window.modSettings.get();
  await wrong.ctx.window.HubNative.exportZip();
  assert(!wrong.files().has('item-repair-hub/pre-renewal/db/when/zz_native_exports/item_db.yml'), 'no era is renewal only');

  // 5. A server that cannot say its era: the editor does not guess.
  const lost = await backend({load: {parameters: {}, era: null, draft: null}, drafts: {}});
  await assert.rejects(lost.ctx.window.modSettings.get(), /did not say whether it runs renewal or pre-renewal/);

  // 6. Renewal is unchanged: an old launcher (no era) means renewal, with the renewal draft and data.
  const r = await backend({load: {parameters: {}, draft: renewalDraft}, drafts: {}});
  state = await r.ctx.window.modSettings.itemRepairs({op: 'list'});
  assert.equal(state.era, 'renewal');
  assert.deepEqual(state.entries.map(e => e.id), [500118]);
  console.log('PASS pre-renewal: manifest and renewal/ layout; pre-renewal items and skills; own draft; renewal-only items, skills and World Sync compatibility refused; live script from pre-renewal data; one export carries both eras in their folders with both seeds; unknown era refuses to load; renewal unchanged.');
})().catch(e => { console.error(e); process.exitCode = 1; });
