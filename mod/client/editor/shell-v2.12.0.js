/* Item Repair Hub v2.12.0 — the signature layout, as in Item Collection UI: a head (name, era, count, gear), a side
   menu (Add items, Included repairs, Live changes, What's new), one glass panel, and a footer (status, Support the
   author, Save & Export). It only moves and dresses what the other editor scripts built; their logic is unchanged.
   The gear menu sets Window, Text and Picture sizes. Text and pictures are drawn here; the window size is applied by
   the launcher (client/index.js), which also remembers all three for the player. */
'use strict';
(() => {
  const VERSION = '2.12.0', SEEN = 'irh-news-seen';
  const LEVELS = ['small', 'normal', 'large', 'largest'], NAMES = {small: 'Small', normal: 'Normal', large: 'Large', largest: 'Largest'};
  const TEXT = {small: 0.9, normal: 1, large: 1.15, largest: 1.3}, IMAGE = {small: 0.8, normal: 1, large: 1.25, largest: 1.5};
  const make = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
  const api = request => window.modSettings.itemRepairs(request);
  const body = document.body, header = document.querySelector('body > header'), footer = document.querySelector('body > footer');
  const tabs = document.querySelector('nav.collection-tabs'), whatsNew = document.getElementById('whats-new'), notice = document.querySelector('body > p.notice');
  // The compatibility notes (a <details> the parser lifted out of the notice paragraph) go to the What's new sheet too.
  const compat = [...document.querySelectorAll('body > details')].find(d => d !== whatsNew);
  if (!footer || !tabs) return;

  // Head.
  const head = make('div', undefined, 'glass irh-head');
  const title = make('div', undefined, 'irh-title');
  title.append(make('b', 'Item Repair Hub'));
  const gear = make('button', '⚙', 'irh-gear');
  gear.type = 'button'; gear.title = 'Window, text and picture sizes'; gear.setAttribute('aria-label', 'Display sizes'); gear.setAttribute('aria-expanded', 'false');
  head.append(title);
  for (const id of ['context', 'total']) { const n = document.getElementById(id); if (n) head.append(n); }
  head.append(gear);

  // Side menu, panel, sheet.
  const main = make('div', undefined, 'irh-main');
  const rail = make('div', undefined, 'irh-rail');
  const stage = make('div', undefined, 'glass irh-stage');
  const sheet = make('div', undefined, 'glass irh-sheet');
  sheet.hidden = true; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', "What's new");
  const news = make('button', "What's new", 'irh-news');
  news.type = 'button'; news.setAttribute('aria-pressed', 'false');
  rail.append(tabs, make('hr'), news);
  for (const n of [...body.children]) if (n !== header && n !== footer && n !== whatsNew && n !== notice && n !== compat && n.tagName !== 'SCRIPT') stage.append(n);
  main.append(rail, stage, sheet);

  const sheetHead = make('div', undefined, 'irh-sheet-head');
  const close = make('button', '×', 'irh-close');
  close.type = 'button'; close.title = 'Close'; close.setAttribute('aria-label', "Close What's new");
  sheetHead.append(make('h2', `What's new in v${VERSION}`), close);
  sheet.append(sheetHead);
  if (whatsNew) { whatsNew.open = true; sheet.append(whatsNew); }
  if (notice) { sheet.append(make('h4', 'How it works')); sheet.append(notice); }
  if (compat) { compat.open = true; compat.querySelector('summary')?.remove(); sheet.append(make('h4', 'Compatibility notes'), compat); }

  // Footer: Support the author sits beside Save & Export (support-v2.12.0.js fills it).
  const root = make('div', undefined, 'irh-root');
  root.append(head, main, footer);
  header?.remove();
  body.prepend(root);

  function openSheet(on) {
    sheet.hidden = !on;
    news.setAttribute('aria-pressed', String(on));
    if (on) { news.classList.remove('unseen'); try { localStorage.setItem(SEEN, VERSION); } catch {} sheet.scrollTop = 0; }
  }
  try { if (localStorage.getItem(SEEN) !== VERSION) news.classList.add('unseen'); } catch {}
  news.onclick = () => openSheet(sheet.hidden);
  close.onclick = () => openSheet(false);
  tabs.addEventListener('click', () => openSheet(false));
  addEventListener('keydown', event => { if (event.key === 'Escape') { openSheet(false); showOptions(false); } });

  // Sizes. Text and pictures here; the window through the launcher, which keeps all three for the player.
  let size = {window: 'normal', text: 'normal', image: 'normal'};
  const pick = (v, fallback) => (LEVELS.includes(v) ? v : fallback);
  function apply() {
    document.documentElement.style.setProperty('--ts', String(TEXT[size.text]));
    document.documentElement.style.setProperty('--img', String(IMAGE[size.image]));
  }
  const options = make('div', undefined, 'glass irh-options');
  options.hidden = true;
  function showOptions(on) {
    options.hidden = !on;
    gear.setAttribute('aria-expanded', String(on));
    if (!on) return;
    options.replaceChildren(make('b', 'Display'));
    for (const [key, label] of [['window', 'Window'], ['text', 'Text'], ['image', 'Pictures']]) {
      const select = make('select');
      select.dataset.size = key; select.setAttribute('aria-label', `${label} size`);
      for (const level of LEVELS) { const o = make('option', NAMES[level]); o.value = level; select.append(o); }
      select.value = size[key];
      select.onchange = () => {
        size = {...size, [key]: pick(select.value, 'normal')};
        apply();
        api({op: 'display', value: size}).catch(() => {});
      };
      options.append(make('span', label), select);
    }
    options.append(make('small', 'Saved for this account on this computer.'));
  }
  gear.onclick = event => { event.stopPropagation(); showOptions(options.hidden); };
  addEventListener('pointerdown', event => { if (!options.hidden && !options.contains(event.target) && event.target !== gear) showOptions(false); });
  root.append(options);

  apply();
  api({op: 'display'}).then(saved => {
    if (!saved || typeof saved !== 'object') return;
    size = {window: pick(saved.window, 'normal'), text: pick(saved.text, 'normal'), image: pick(saved.image, 'normal')};
    apply();
  }).catch(() => {});
  window.HubShell = {openSheet, showOptions, sizes: () => ({...size})};
})();
