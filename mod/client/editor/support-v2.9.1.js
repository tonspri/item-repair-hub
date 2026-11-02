/* Item Repair Hub v2.9.1 — Support the author: an optional Buy Me a Coffee button at the top of the editor.
   The launcher opens the page when the host allows a new window; the desktop app does not, so the link is copied.
   The small × hides the button until the next version. */
'use strict';
(() => {
  const LINK = 'https://buymeacoffee.com/miisteryap', LABEL = '☕ Support the author', VERSION = '2.9.1', HIDDEN = 'irh-support-hidden';
  const box = document.getElementById('support-author');
  if (!box) return;
  const button = box.querySelector('.coffee'), hide = box.querySelector('.coffee-hide');
  let timer = null;
  try { box.hidden = localStorage.getItem(HIDDEN) === VERSION; } catch { box.hidden = false; }

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
  hide.onclick = () => {
    box.hidden = true;
    try { localStorage.setItem(HIDDEN, VERSION); } catch { /* remembered only when storage works */ }
  };
})();
