/* Item Repair Hub v2.8.0 — Included repairs: item icons from the game client, a searchable item list with a
   slot filter for groups such as the iRO effect repairs, and the "What's new" panel. */
'use strict';
(() => {
  const make = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
  const VERSION = '2.8.0', SEEN = 'irh-whats-new-seen';

  // Icons and names come from the game client in batches; outside the game there are none.
  const meta = new Map(), waiting = new Map();
  let queued = null;
  function request(id) {
    if (meta.has(id) || waiting.has(id)) return;
    waiting.set(id, []);
    queued ??= Promise.resolve().then(flush);
  }
  async function flush() {
    const ids = [...waiting.keys()].slice(0, 40);
    let items = [];
    try { const got = (await window.modSettings.itemRepairs({op: 'itemInfo', ids})).items; items = Array.isArray(got) ? got : []; } catch { items = []; }
    for (const id of ids) {
      const m = items.find(i => i.id === id) || {id};
      meta.set(id, m);
      for (const img of waiting.get(id) || []) fill(img, m);
      waiting.delete(id);
    }
    queued = waiting.size ? Promise.resolve().then(flush) : null;
  }
  function fill(node, m) {
    if (!m?.icon) { node.classList.add('empty'); return; }
    const img = make('img', undefined, 'item-icon'); img.src = m.icon; img.alt = '';
    img.onerror = () => img.replaceWith(make('span', undefined, 'item-icon empty'));
    node.replaceWith(img);
  }
  function icon(id) {
    const holder = make('span', undefined, 'item-icon');
    if (!Number.isSafeInteger(id) || id <= 0) { holder.classList.add('empty'); return holder; }
    if (meta.has(id)) { queueMicrotask(() => fill(holder, meta.get(id))); return holder; }
    request(id);
    waiting.get(id)?.push(holder);
    return holder;
  }

  // A group's items: search, slot filter, icon, name and what was repaired.
  function group(box, entry) {
    const items = entry.items || (entry.affected || []).map(id => ({id, name: `Item ${id}`, summary: '', slot: 'Other'}));
    box.append(make('h3', `Items in this group (${items.length})`));
    const tools = make('div', undefined, 'group-tools');
    const search = make('input'); search.type = 'search'; search.placeholder = 'Search these items'; search.setAttribute('aria-label', 'Search items in this group');
    const slot = make('select'); slot.setAttribute('aria-label', 'Slot');
    slot.append(new Option('All slots', ''));
    for (const s of [...new Set(items.map(i => i.slot))].sort()) slot.append(new Option(s, s));
    const count = make('small');
    tools.append(search, slot, count);
    const list = make('ul', undefined, 'group-items');
    function draw() {
      const q = search.value.trim().toLowerCase();
      const shown = items.filter(i => (!slot.value || i.slot === slot.value) && `${i.id} ${i.name} ${i.summary}`.toLowerCase().includes(q));
      list.replaceChildren();
      for (const i of shown) {
        const li = make('li');
        const text = make('div');
        text.append(make('strong', `${i.name} (${i.id})`), make('small', `${i.slot}${i.retier ? ' · uses iRO refine tiers' : ''}`, 'muted'), make('p', i.summary));
        li.append(icon(i.id), text);
        list.append(li);
      }
      count.textContent = `${shown.length} of ${items.length}`;
      if (!shown.length) list.append(make('li', 'No matching items.', 'empty'));
    }
    search.oninput = draw; slot.onchange = draw;
    draw();
    box.append(tools, list);
  }

  function whatsNew() {
    const box = document.getElementById('whats-new');
    if (!box) return;
    let seen = null;
    try { seen = localStorage.getItem(SEEN); } catch { seen = null; }
    box.open = seen !== VERSION;
    box.addEventListener('toggle', () => { if (!box.open) try { localStorage.setItem(SEEN, VERSION); } catch { /* remembered only when storage works */ } });
  }
  window.HubIncluded = {icon, group};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', whatsNew); else whatsNew();
})();
