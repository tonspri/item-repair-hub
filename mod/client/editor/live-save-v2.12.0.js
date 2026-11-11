/* Item Repair Hub v2.12.0 — Save & apply live. One footer button saves the items you changed in Add items and
   sends each one to the game live (through Live changes' @irhapply), where it stays after restarts. Skills,
   autocasts, passives, added stats and the minimum equip level work at once; class families, job tiers, transfer
   rules and the visible falcon live in the item database, so those still need Save & Export and a restart (the
   message says so for the items that have them). */
'use strict';
(() => {
  const actions = document.querySelector('footer .actions'), exportButton = document.getElementById('export-zip');
  if (!actions || !exportButton || !window.hubCustom || !window.HubLive) return;
  const button = document.createElement('button');
  button.type = 'button'; button.id = 'save-live'; button.className = 'primary'; button.textContent = 'Save & apply live';
  button.title = 'Save your item changes and apply them in game now. They stay after restarts.';
  exportButton.classList.remove('primary');
  exportButton.title = 'Download the mod with your changes as a ZIP: needed for class families, transfer rules and the falcon, or to share it.';
  exportButton.before(button);
  let busy = false;
  const status = text => { const s = document.getElementById('status'); if (s) s.textContent = text; };
  const dirty = () => { try { return window.hubCustom.isDirty(); } catch { return false; } };
  function refresh() { button.disabled = busy || !dirty(); }
  for (const type of ['change', 'input', 'click']) document.addEventListener(type, () => setTimeout(refresh, 0), true);
  window.addEventListener('hub-ready', refresh);
  refresh();

  const list = names => names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} and ${names.length - 3} more`;
  button.onclick = async () => {
    if (busy || !dirty()) return;
    const exportWas = exportButton.disabled;
    busy = true; refresh(); exportButton.disabled = true;
    status('Saving and applying in game…');
    try {
      const ids = window.hubCustom.dirtyIds();
      await window.hubCustom.save();
      window.dispatchEvent(new Event('hub-draft-changed'));
      const results = [];
      for (const id of ids) {
        try { results.push(await window.HubLive.applySaved(id)); }
        catch (e) { results.push({id, name: `Item ${id}`, live: false, reason: e.message || String(e)}); }
      }
      const live = results.filter(r => r.live), notLive = results.filter(r => !r.live && r.reason !== 'nothing to apply');
      const needsExport = live.filter(r => (r.notes || []).length);
      const parts = [];
      if (live.length) parts.push(`Saved and live now: ${list(live.map(r => r.name))}. It stays after restarts.`);
      if (needsExport.length) parts.push(`Classes, transfer rules or the falcon for ${list(needsExport.map(r => r.name))} still need Save & Export and Apply & restart.`);
      if (notLive.length) parts.push(`Saved, not live: ${notLive.map(r => `${r.name} (${String(r.reason).replace(/\.+$/, '')})`).join('; ')}. Use Save & Export for ${notLive.length === 1 ? 'it' : 'them'}.`);
      if (!parts.length) parts.push('Saved.');
      const text = parts.join(' ');
      status(text);
      window.HubGuide?.message?.(text, notLive.length ? 'error' : 'success');
    } catch (e) {
      status(`Not saved: ${e.message || e}`);
    } finally {
      busy = false; exportButton.disabled = exportWas; refresh();
    }
  };
})();
