/* Item Repair Hub v2.9.1 — Live changes: change worn gear in the running game without a restart.
   Scan what you wear (with refine and cards), pick an item, read its effects in plain English at your refine,
   check them against the in-game description, add stats (or a saved preset), Apply now.
   The item's script (its saved edit, or its original) plus the added stats goes to npc/live-apply-v2.9.1.txt
   through @irhapply (any player account), which checks it, sets it with setitemscript, keeps it in the mod store
   and puts it back at every start. Added stats are live only unless you choose Keep in my saved edit. */
'use strict';
(() => {
  const G = window.HubLiveGuard, E = window.HubEffects;
  const make = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
  const api = request => window.modSettings.itemRepairs(request);
  const SLOTS = ['Weapon', 'Shield', 'Armor', 'Garment', 'Shoes', 'Upper headgear', 'Middle headgear', 'Lower headgear', 'Accessory (left)', 'Accessory (right)'];
  const VERSION = '2.9.1';
  const {STATS, statLine, readable} = E;

  const tabs = document.querySelector('.collection-tabs');
  const liveTab = make('button', 'Live changes');
  tabs.append(liveTab);
  const panel = make('section', undefined, 'live-panel');
  panel.hidden = true;
  const intro = make('p', 'Change the gear you are wearing right now, no restart. Scan your equipment, pick an item, add stats and click Apply now. Live changes stay after restarts until you undo them. They are not included in Save & Export unless you keep them in your saved edit.');
  const scan = make('button', 'Scan my equipment', 'primary');
  const undoAll = make('button', 'Undo all live changes');
  const bar = make('div', undefined, 'live-bar');
  bar.append(scan, undoAll);
  const message = make('p'); message.setAttribute('role', 'status');
  const list = make('div', undefined, 'live-list');
  const detail = make('div', undefined, 'live-detail');
  const others = make('div', undefined, 'live-others');
  panel.append(make('h2', 'Live changes'), intro, bar, message, list, detail, others);
  document.querySelector('.custom-panel').after(panel);

  let worn = [], info = new Map(), meta = new Map(), selected = 0, busy = false, skills = {}, presets = [], undoArmed = false, era = null;
  let draft = {stats: [], raw: ''};
  const say = text => { message.textContent = text; };

  function show(on) {
    panel.hidden = !on;
    liveTab.setAttribute('aria-pressed', String(on));
    if (!on) return;
    document.querySelector('.custom-panel').hidden = true;
    document.querySelector('.toolbar').hidden = true;
    document.querySelector('.workspace').hidden = true;
    for (const b of tabs.querySelectorAll('button')) if (b !== liveTab) b.setAttribute('aria-pressed', 'false');
    run(refresh);
  }
  liveTab.onclick = () => show(true);
  window.addEventListener('hub-tab', () => show(false));

  const extrasScript = x => E.bonusScript(x);
  const combined = (item, x) => `${item.script} ${extrasScript(x)}`.trim();
  const fingerprint = (item, x) => G.hash(G.normalize(combined(item, x)) + '|' + item.level);
  const hasExtras = x => (x?.stats || []).length > 0 || G.normalize(x?.raw || '') !== '';
  const extrasText = x => [...(x?.stats || []).map(readable), ...(G.normalize(x?.raw || '') ? ['advanced lines'] : [])].join(', ');
  function state(item) {
    const refused = G.guard(G.normalize(item.script));
    if (refused) return {text: `This item's own script can't be changed live (${refused}).`, canApply: false};
    if (!item.applied) return {text: item.hasEdit ? 'Your saved edit is not live yet.' : 'Not changed live.', canApply: true};
    if (item.applied !== fingerprint(item, item.extras)) return {text: 'Changed since it was applied live.', canApply: true};
    return {text: hasExtras(item.extras) ? `Live: ${extrasText(item.extras)}.` : 'Live and up to date.', canApply: true};
  }
  const wornOf = id => worn.find(w => w.id === id);
  const issuesOf = item => { const m = meta.get(item.id); return m?.description ? E.check(m.description, item.script, skills) : null; };

  async function refresh() {
    if (window.hubCustom?.isDirty()) await window.hubCustom.save();
    if (!Object.keys(skills).length) skills = (await api({op: 'skills'})).skills || {};
    era ??= (await api({op: 'list'})).era || 'renewal';
    presets = (await api({op: 'presets'})).presets;
    const items = (await api({op: 'liveInfo', ids: worn.map(w => w.id)})).items;
    info = new Map(items.map(i => [i.id, i]));
    const missing = [...new Set([...items.map(i => i.id), ...worn.flatMap(w => w.cards)])].filter(id => !meta.has(id));
    if (missing.length) {
      try { for (const m of (await api({op: 'itemInfo', ids: missing.slice(0, 40)})).items) meta.set(m.id, m); } catch { /* names and icons are extras */ }
    }
    // The name the player sees in game, when the client has one.
    for (const item of info.values()) if (meta.get(item.id)?.name) item.name = meta.get(item.id).name;
    render();
  }

  function icon(id) {
    const url = meta.get(id)?.icon;
    if (!url) return make('span', undefined, 'item-icon empty');
    const img = make('img', undefined, 'item-icon'); img.src = url; img.alt = ''; img.onerror = () => img.replaceWith(make('span', undefined, 'item-icon empty'));
    return img;
  }
  const cardNames = w => w.cards.map(c => meta.get(c)?.name || `Card ${c}`);

  function render() {
    list.replaceChildren();
    if (!worn.length) list.append(make('p', 'Press Scan my equipment while you are in game.', 'empty'));
    for (const w of worn) {
      const item = info.get(w.id);
      const row = make('button', undefined, 'live-row');
      row.type = 'button';
      row.setAttribute('aria-pressed', String(selected === w.id));
      const text = make('span', undefined, 'live-row-text');
      const name = `${w.refine ? `+${w.refine} ` : ''}${item ? item.name : 'Item'} (${w.id})`;
      text.append(make('strong', `${w.slot}: ${name}`));
      if (w.cards.length) text.append(make('small', `Cards: ${cardNames(w).join(', ')}`, 'live-cards'));
      text.append(make('small', item ? (item.changeable ? state(item).text : item.reason) : ''));
      row.append(icon(w.id), text);
      const issues = item?.changeable ? issuesOf(item) : null;
      if (issues?.length) row.append(make('span', `${issues.length} to check`, 'badge warn'));
      row.disabled = busy || !item?.changeable;
      row.onclick = () => { select(w.id); };
      list.append(row);
    }
    renderDetail();
    others.replaceChildren();
    const stray = [...info.values()].filter(i => i.applied && !wornOf(i.id));
    if (stray.length) {
      others.append(make('h3', 'Other live items (not worn now)'));
      for (const item of stray) {
        const row = make('div', undefined, 'live-other');
        const undo = make('button', 'Undo live change');
        undo.onclick = () => run(() => undoItem(item));
        row.append(make('span', `${item.name} (${item.id})${hasExtras(item.extras) ? `: ${extrasText(item.extras)}` : ''}`), undo);
        others.append(row);
      }
    }
    const live = [...info.values()].filter(i => i.applied);
    undoAll.hidden = !live.length;
    undoAll.textContent = undoArmed ? `Click again to undo ${live.length} live item${live.length === 1 ? '' : 's'}` : 'Undo all live changes';
    undoAll.classList.toggle('danger', undoArmed);
  }

  function select(id) {
    selected = id;
    const item = info.get(id);
    draft = {stats: [...(item?.extras?.stats || [])], raw: item?.extras?.raw || ''};
    render();
  }

  // Plain-English effects; at a known refine, conditions that don't apply are dimmed.
  function effectList(script, refine) {
    const lines = E.explain(script, {refine, skills});
    const box = make('ul', undefined, 'effects');
    if (!lines.length) box.append(make('li', 'No effects.', 'muted'));
    for (const l of lines) {
      const li = make('li', l.text, (l.heading ? 'heading ' : '') + (l.active === false ? 'off ' : '') + (l.raw ? 'raw' : ''));
      li.style.marginLeft = `${l.depth * 16}px`;
      if (l.active === false && l.heading) li.title = refine == null ? 'Not active' : `Not active at +${refine}`;
      box.append(li);
    }
    return box;
  }

  function report(item, issues) {
    const w = wornOf(item.id);
    const lines = [`Item Repair Hub v${VERSION}: possible description mismatch`, `Item: ${item.name} (${item.id})${w?.refine ? `, refined +${w.refine}` : ''}`];
    for (const i of issues) lines.push(`- ${i.text}`, `  Description: "${i.evidence}"`);
    lines.push(`Script: ${G.normalize(item.script).slice(0, 900)}`);
    return lines.join('\n');
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const area = make('textarea'); area.value = text; document.body.append(area); area.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
      area.remove(); return ok;
    }
  }

  function checkSection(item) {
    const box = make('details', undefined, 'live-check');
    const m = meta.get(item.id), issues = issuesOf(item);
    const summary = make('summary', issues === null ? 'Description check: no in-game description available' : issues.length ? `Description check: ${issues.length} thing${issues.length === 1 ? '' : 's'} to check` : 'Description check: matches');
    box.append(summary);
    if (issues === null) { box.append(make('p', 'The game client did not send a description for this item. Open this window in game.', 'hint')); return box; }
    if (!issues.length) box.append(make('p', 'Nothing in the description looks missing from the script. This is a quick check, not proof.', 'hint'));
    else {
      box.open = true;
      const ul = make('ul', undefined, 'issues');
      for (const i of issues) { const li = make('li', i.text); li.append(make('q', i.evidence)); ul.append(li); }
      box.append(ul, make('p', 'These are leads, not proof: the check reads the description\'s wording. Share the report on Discord so it can be looked at.', 'hint'));
      const copyButton = make('button', 'Copy report');
      copyButton.onclick = async () => { say(await copy(report(item, issues)) ? 'Report copied. Paste it on Discord.' : 'Could not copy. Select the report below and copy it.'); };
      const text = make('textarea'); text.readOnly = true; text.rows = 4; text.value = report(item, issues); text.setAttribute('aria-label', 'Report');
      box.append(copyButton, text);
    }
    const desc = make('details', undefined, 'live-desc');
    desc.append(make('summary', 'In-game description'), make('pre', E.descriptionBody(m.description).join('\n')));
    box.append(desc);
    return box;
  }

  function presetRow() {
    const row = make('div', undefined, 'live-presets');
    const pick = make('select'); pick.setAttribute('aria-label', 'Preset');
    pick.append(new Option(presets.length ? 'Choose a preset…' : 'No presets yet', ''));
    for (const p of presets) pick.append(new Option(`${p.name}: ${extrasText(p)}`, p.name));
    const use = make('button', 'Use preset');
    use.disabled = !presets.length;
    use.onclick = () => {
      const p = presets.find(x => x.name === pick.value);
      if (!p) { say('Choose a preset first.'); return; }
      for (const e of p.stats) addStat(e.stat, e.amount);
      if (G.normalize(p.raw)) draft.raw = [draft.raw, p.raw].filter(Boolean).join(' ');
      say(`Added preset ${p.name}.`);
      renderDetail();
    };
    const remove = make('button', 'Delete preset');
    remove.disabled = !presets.length;
    remove.onclick = () => run(async () => {
      if (!pick.value) throw Error('Choose a preset to delete.');
      presets = (await api({op: 'presetDelete', name: pick.value})).presets;
      say('Preset deleted.');
    });
    const name = make('input'); name.placeholder = 'Preset name'; name.maxLength = 30; name.setAttribute('aria-label', 'Preset name');
    const save = make('button', 'Save as preset');
    save.onclick = () => run(async () => {
      if (!hasExtras(draft)) throw Error('Add some stats first, then save them as a preset.');
      presets = (await api({op: 'presetSave', preset: {name: name.value.trim(), stats: draft.stats, raw: G.normalize(draft.raw)}})).presets;
      say(`Preset ${name.value.trim()} saved.`);
    });
    row.append(pick, use, remove, name, save);
    return row;
  }

  function addStat(stat, n) {
    const same = draft.stats.find(e => e.stat === stat);
    if (same) same.amount += n; else draft.stats.push({stat, amount: n});
    draft.stats = draft.stats.filter(e => e.amount !== 0);
  }

  function renderDetail() {
    detail.replaceChildren();
    const item = info.get(selected), w = wornOf(selected);
    if (!item || !w) return;
    const s = state(item);
    const head = make('div', undefined, 'live-head');
    const title = make('div');
    title.append(make('h3', `${w.refine ? `+${w.refine} ` : ''}${item.name} (${item.id})`), make('p', s.text));
    if (w.cards.length) title.append(make('small', `Cards: ${cardNames(w).join(', ')}`, 'live-cards'));
    head.append(icon(item.id), title);
    detail.append(head);
    for (const note of item.notes || []) detail.append(make('p', note, 'live-note'));

    const current = make('section', undefined, 'live-current');
    current.append(make('h4', `${item.hasEdit ? 'Current effects (your saved edit)' : 'Current effects'}${w.refine != null ? ` at +${w.refine}` : ''}`), effectList(item.script, w.refine));
    const raw = make('details', undefined, 'live-script');
    const scriptBox = make('textarea'); scriptBox.readOnly = true; scriptBox.rows = 4; scriptBox.value = item.script; scriptBox.setAttribute('aria-label', 'Item script');
    raw.append(make('summary', 'Show script'), scriptBox);
    current.append(raw);
    detail.append(current, checkSection(item));

    const pick = make('select'); pick.setAttribute('aria-label', 'Stat');
    for (const [key, label] of STATS) if (era !== 'pre-renewal' || !E.RENEWAL_ONLY.has(key)) pick.append(new Option(label, key));
    const amount = make('input'); amount.type = 'number'; amount.step = '1'; amount.value = '10'; amount.setAttribute('aria-label', 'Amount');
    const add = make('button', 'Add');
    add.onclick = () => {
      const n = Number(amount.value);
      if (!Number.isInteger(n) || n === 0 || Math.abs(n) > 10000) { say('Enter a whole number from -10000 to 10000, not 0.'); return; }
      addStat(pick.value, n);
      renderDetail();
    };
    const picker = make('div', undefined, 'live-picker');
    picker.append(pick, amount, add);

    const added = make('div', undefined, 'live-added');
    for (const e of draft.stats) {
      const chip = make('span', readable(e), 'live-chip');
      const remove = make('button', '×'); remove.title = `Remove ${readable(e)}`; remove.setAttribute('aria-label', `Remove ${readable(e)}`);
      remove.onclick = () => { draft.stats = draft.stats.filter(x => x !== e); renderDetail(); };
      chip.append(remove);
      added.append(chip);
    }
    const advanced = make('details');
    advanced.append(make('summary', 'Advanced: bonus lines'));
    const rawLines = make('textarea'); rawLines.rows = 2; rawLines.value = draft.raw; rawLines.placeholder = 'bonus bStr,10;'; rawLines.setAttribute('aria-label', 'Advanced bonus lines');
    const rawMeaning = make('div', undefined, 'live-raw-meaning');
    const showRaw = () => { rawMeaning.replaceChildren(); if (G.normalize(draft.raw)) rawMeaning.append(make('small', 'These lines read as:'), effectList(draft.raw, w.refine)); };
    rawLines.oninput = () => { draft.raw = rawLines.value; preview.textContent = previewText(); showRaw(); };
    advanced.append(rawLines, rawMeaning);
    if (draft.raw) { advanced.open = true; showRaw(); }
    const preview = make('p', undefined, 'live-preview');
    const previewText = () => { const t = extrasText(draft); return t ? `Adding: ${t}` : 'Adding: nothing (applies the current effects only).'; };
    preview.textContent = previewText();

    const apply = make('button', 'Apply now', 'primary');
    apply.disabled = busy || !s.canApply;
    apply.onclick = () => run(() => applyItem(item, {stats: draft.stats, raw: draft.raw}));
    const keep = make('button', 'Keep in my saved edit');
    keep.title = 'Adds these stats to your saved edit, so they are in your next Save & Export and your friends get them too.';
    keep.disabled = busy || !s.canApply || !hasExtras(draft);
    keep.onclick = () => run(() => keepItem(item, {stats: draft.stats, raw: draft.raw}));
    const actions = make('div', undefined, 'live-actions');
    actions.append(apply, keep);
    if (item.applied) {
      const undo = make('button', 'Undo live change');
      undo.onclick = () => run(() => undoItem(item));
      actions.append(undo);
    }
    detail.append(make('h4', 'Add stats'), picker, added, advanced, make('h4', 'Presets'), presetRow(), preview, actions);
  }

  async function run(fn) {
    if (busy) return;
    busy = true;
    for (const b of panel.querySelectorAll('button')) b.disabled = true;
    try { await fn(); } catch (e) { say(e.message || String(e)); }
    finally { busy = false; scan.disabled = false; undoAll.disabled = false; render(); }
  }

  async function ask(text) {
    if (text.length > G.REQUEST_LIMIT) throw Error('A request would be too long for the game client.');
    const reply = String(await api({op: 'liveSend', text}) || '');
    if (!reply.startsWith('OK')) throw Error(reply.replace(/^ERR\|/, '') || 'No answer from the game. Open this window in game while the server is running.');
    return reply.split('|').slice(1);
  }
  async function send(id, script, level, keep) {
    const text = G.normalize(script);
    const refused = G.guard(text);
    if (refused) throw Error(`Not sent: ${refused}.`);
    const parts = G.chunks(text);
    if (parts.length > 30) throw Error('This item script is too long to apply live.');
    await ask(`begin ${id} ${parts.length} ${level}`);
    for (let i = 0; i < parts.length; i++) await ask(`part ${i} ${parts[i]}`);
    return ask(`commit ${keep ? 'keep' : 'forget'}`);
  }

  scan.onclick = () => run(async () => {
    undoArmed = false;
    const ids = await ask('equip');
    const found = ids.map((raw, i) => ({slot: SLOTS[i], index: i, id: Number(raw)})).filter(w => w.id > 0);
    // The same item in both hands or both accessory slots is listed once.
    worn = found.filter((w, i) => found.findIndex(x => x.id === w.id) === i);
    for (const w of worn) {
      // Refine and cards: "gear <slot>" answers OK|id|refine|card|card|card|card.
      try {
        const [id, refine, ...cards] = await ask(`gear ${w.index}`);
        w.refine = Number(id) === w.id ? Number(refine) : null;
        w.cards = Number(id) === w.id ? cards.map(Number).filter(c => c > 0) : [];
      } catch { w.refine = null; w.cards = []; }
    }
    await refresh();
    if (!wornOf(selected)) selected = 0;
    say(worn.length ? 'Pick an item to change.' : 'Nothing worn.');
  });

  undoAll.onclick = () => {
    if (!undoArmed) { undoArmed = true; render(); return; }
    undoArmed = false;
    run(async () => {
      const live = [...info.values()].filter(i => i.applied);
      let done = 0;
      for (const item of live) { await undoItem(item); done++; }
      say(`${done} item${done === 1 ? ' is' : 's are'} back to ${done === 1 ? 'its' : 'their'} saved or original effects.`);
    });
  };

  async function applyItem(item, extras) {
    const clean = {stats: (extras?.stats || []).map(e => ({stat: e.stat, amount: e.amount})), raw: G.normalize(extras?.raw || '')};
    await send(item.id, combined(item, clean), item.level, true);
    const hash = fingerprint(item, clean);
    await api({op: 'liveMark', id: item.id, hash, extras: clean});
    Object.assign(item, {applied: hash, extras: clean});
    say(`${item.name} is live${hasExtras(clean) ? ` with ${extrasText(clean)}` : ''}. Check your stats now; it stays after restarts.`);
  }
  async function undoItem(item) {
    await send(item.id, item.script, item.level, false);
    await api({op: 'liveMark', id: item.id, hash: null});
    Object.assign(item, {applied: null, extras: {stats: [], raw: ''}});
    if (selected === item.id) draft = {stats: [], raw: ''};
    say(`${item.name} is back to ${item.hasEdit ? 'your saved edit' : 'its original effects'}.`);
  }
  // The stats become part of the saved edit (exported); the live copy is then the saved edit itself.
  async function keepItem(item, extras) {
    const clean = {stats: (extras?.stats || []).map(e => ({stat: e.stat, amount: e.amount})), raw: G.normalize(extras?.raw || '')};
    const refused = G.guard(G.normalize(combined(item, clean)));
    if (refused) throw Error(`Not kept: ${refused}.`);
    await api({op: 'keepBonuses', id: item.id, bonuses: clean});
    window.dispatchEvent(new Event('hub-draft-changed'));
    const fresh = (await api({op: 'liveInfo', ids: [item.id]})).items.find(i => i.id === item.id);
    info.set(item.id, fresh);
    draft = {stats: [], raw: ''};
    await applyItem(fresh, draft);
    say(`${item.name}: ${extrasText(clean)} kept in your saved edit and live now. Save & Export to share it.`);
  }

  window.HubLive = {
    // After Save & Export, re-send live items whose saved edit changed, keeping their added stats.
    async syncAfterExport() {
      const items = (await api({op: 'liveInfo', ids: []})).items.filter(i => i.applied && i.changeable);
      let done = 0;
      for (const item of items) {
        if (item.applied !== fingerprint(item, item.extras) && !G.guard(G.normalize(combined(item, item.extras)))) { await applyItem(item, item.extras); done++; }
      }
      return done;
    },
    // Removing an item from the collection re-sends what it is now (its original), keeping any added stats.
    async afterRemove(id) {
      const item = (await api({op: 'liveInfo', ids: [id]})).items.find(i => i.id === id);
      if (item?.applied) await applyItem(item, item.extras);
    },
  };
})();
