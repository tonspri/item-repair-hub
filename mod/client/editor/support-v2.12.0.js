/* Item Repair Hub v2.12.0 — Support the author, as in Item Collection UI: a small gold button in the footer beside
   Save & Export, shown while the Mod Settings switch "Show the Support the author button" is on (it is by default).
   The launcher opens the page when the host allows a new window; the desktop app does not, so the link is copied. */
'use strict';
(() => {
  const LINK = 'https://buymeacoffee.com/miisteryap', LABEL = '☕ Support the author';
  const actions = document.querySelector('footer .actions');
  if (!actions) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'coffee'; button.textContent = LABEL; button.title = 'Buy DaggerHashimoto a coffee. Entirely optional.';
  button.hidden = true;
  actions.prepend(button);
  let timer = null;

  async function shown() {
    try {
      const mod = await window.modSettings.get();
      return mod.settings.find(s => s.key === 'show_support')?.value !== false;
    } catch { return true; }
  }
  shown().then(on => { button.hidden = !on; });

  async function copy() {
    try { await navigator.clipboard.writeText(LINK); return true; } catch {
      const area = document.createElement('textarea'); area.value = LINK; document.body.append(area); area.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
      area.remove(); return ok;
    }
  }
  button.onclick = async () => {
    let opened = false;
    try { opened = (await window.modSettings.itemRepairs({op: 'support'}))?.opened === true; } catch { opened = false; }
    if (opened) return;
    button.textContent = await copy() ? 'Link copied! Paste it in your browser' : LINK.replace('https://', '');
    clearTimeout(timer);
    timer = setTimeout(() => { button.textContent = LABEL; }, 6000);
  };
})();
