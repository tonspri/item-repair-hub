/* Item Repair Hub v2.3.1 — server-backed custom collection */
'use strict';
(() => {
  const panel = document.createElement('section'); panel.className = 'custom-panel';
  const make = (tag, text) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; return n; };
  const heading = make('h2', 'Add and manage items');
  const note = make('p', 'Find an item, edit its repair, then Save & Export. Replace the installed folder and restart to apply.');
  const input = make('input'); input.placeholder = 'Item ID, Divine Pride link, or name'; input.setAttribute('aria-label', 'Add an item');
  const lookup = make('button', 'Add item');
  const message = make('p'); message.setAttribute('role', 'status');
  const results = make('div'); const editor = make('div'); const collection = make('div');
  const reloadButton = make('button', 'Reload saved items');
  const savedSearch = make('input'); savedSearch.placeholder = 'Search your added items'; savedSearch.setAttribute('aria-label', 'Search added items');
  const previous = make('button', 'Previous'), next = make('button', 'Next'), count = make('span');
  panel.append(heading, note, input, lookup, reloadButton, message, results);
  editor.className = 'custom-editor';
  document.querySelector('.toolbar').before(panel);
  const tabs = make('nav'); tabs.setAttribute('aria-label', 'Repair collections'); tabs.className = 'collection-tabs';
  const customTab = make('button', 'Add items'), includedTab = make('button', 'Included repairs');
  tabs.append(customTab, includedTab); panel.before(tabs);
  function tab(custom) {
    panel.hidden = !custom;
    document.querySelector('.toolbar').hidden = custom; document.querySelector('.workspace').hidden = custom;
    customTab.setAttribute('aria-pressed', String(custom)); includedTab.setAttribute('aria-pressed', String(!custom));
  }
  customTab.onclick = () => tab(true); includedTab.onclick = () => tab(false); tab(true);
  let revision = 0, entries = [], loading = false, page = 0, autocastSkills = {}, skillSource = 'bundled-1.7.0';
  let worldSyncCompat=false,originalCatalog=null;
  const compatLabel=make('label','World Sync Extras v2.1.5 compatibility '),compatBox=make('input');compatBox.type='checkbox';compatBox.id='world-sync-compat';compatLabel.append(compatBox);compatLabel.className='notice';tabs.after(compatLabel);
  compatBox.onchange=()=>run(async()=>{await api({op:'compatibility',enabled:compatBox.checked});await load();status('Compatibility choice saved. Save & Export and replace the mod folder to apply it.');});
  const drafts = new Map();
  const savedNotice = 'Draft retained. Use Save & Export below to update the mod, then Apply & restart.';
  window.hubCustom = {
    isDirty: () => drafts.size > 0,
    save: async () => {
      if (loading) throw Error('Please wait for the current item operation to finish.');
      loading = true;
      try {
        for (const [id, entry] of drafts) {
          const result = await api({ op: 'save', revision, entry }); revision = result.revision; entries = result.entries; drafts.delete(id);
        }
        await api({ op: 'sync', revision });
        await load();
      } finally { loading = false; }
    },
    revert: () => { drafts.clear(); },
  };
  const api = request => window.modSettings.itemRepairs(request);
  const familyNames = { swordsman: 'Swordsman', merchant: 'Merchant (including Whitesmith)', thief: 'Thief', acolyte: 'Acolyte', mage: 'Mage', archer: 'Archer' };
  const permissionNames = { trade: 'Trading', storage: 'Personal storage', guild: 'Guild storage', cart: 'Cart storage', mail: 'Mail' };
  async function run(fn) {
    if (loading) return; loading = true;
    for (const n of panel.querySelectorAll('button,input,select')) n.disabled = true;
    try { await fn(); } catch (e) {
      let text = e.message || String(e);
      text = text.replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '');
      if (text.includes('not present in the exported bundled item definitions')) text = 'This item was not found in the loaded server tables. No repair was added. Check that the updated app integration is installed and the world is running.';
      message.textContent = text; status(text);
    }
    finally { loading = false; for (const n of panel.querySelectorAll('button,input,select')) n.disabled = false; renderCollection(); }
  }
  async function load() {
    const state = await api({ op: 'list' });
    if (!state.autocastSkills || state.skillFeatures !== 4) throw Error('Install the matching native editor backend to use the full skill catalog and ETC grants.');
    worldSyncCompat=state.worldSyncCompat===true;compatBox.checked=worldSyncCompat;revision = state.revision; entries = state.entries; autocastSkills = state.autocastSkills;
    if(!originalCatalog)originalCatalog=catalog.filter(item=>!item.customOnly).map(item=>({...item}));
    catalog = originalCatalog.filter(item => !(state.removedIds||[]).includes(item.id)).map(item => { const clean = { ...item }; delete clean.customEntry; return clean; });
    for (const entry of entries) {
      let item = catalog.find(item => item.id === entry.id);
      if (!item) { item = { key: `custom_${entry.id}`, id: entry.id, name: entry.name, category: 'equipment', categoryLabel: 'Added item', description: 'Your saved class-family and transfer choices.', scope: 'Renewal', toggles: [], customOnly: true }; catalog.push(item); }
      item.customEntry = entry;
    }
    if (ready) { refreshCollection(); const active=catalog.find(i=>i.key===selected); if(active?.id)await edit(active.id); }
    renderCollection();
  }
  function refreshCollection() { refresh(); }
  window.addEventListener('hub-select-custom', event => {
    document.getElementById('detail').append(editor);
    if (!loading) run(() => edit(event.detail));
  });
  async function removeItem(id){await api({op:'remove',revision,id});drafts.delete(id);editor.replaceChildren();await load();status('Item removed. Save & Export, replace the mod folder, then Apply & restart. Add its ID again to restore it.');window.HubGuide?.message('Item removed from this collection, not your inventory. Save & Export and replace the mod folder to apply the removal. Add it again by ID to restore its repairs.');}
  window.addEventListener('hub-remove-item',event=>run(()=>removeItem(event.detail)));
  function renderCollection() {
    collection.replaceChildren();
    if (!entries.length) collection.append(make('p', 'No custom items added yet. Your existing repairs remain in the collection below.'));
    const query = savedSearch.value.trim().toLowerCase();
    const matches = entries.filter(entry => `${entry.id} ${entry.name}`.toLowerCase().includes(query));
    const pages = Math.max(1, Math.ceil(matches.length / 8)); page = Math.min(page, pages - 1);
    count.textContent = ` ${page + 1} / ${pages} · ${matches.length} items `;
    previous.disabled = loading || page === 0; next.disabled = loading || page === pages - 1;
    for (const entry of matches.slice(page * 8, page * 8 + 8)) {
      const b = make('button', `${entry.name} · #${entry.id}${entry.enabled ? '' : ' · Disabled'}`);
      b.onclick = () => run(() => edit(entry.id)); collection.append(b);
    }
  }
  previous.onclick = () => { page--; renderCollection(); }; next.onclick = () => { page++; renderCollection(); };
  savedSearch.oninput = () => { page = 0; renderCollection(); };
  async function edit(id) {
    const { item } = await api({ op: 'lookup', id });
    const equipment = ['Weapon','Armor','ShadowGear'].includes(item.Type);
    const conflict=HubCompat.overlap(item.id,worldSyncCompat);
    const prior = drafts.get(item.id) || entries.find(e => e.id === item.id);
    results.replaceChildren(); editor.replaceChildren();
    editor.append(make('h3', `${item.Name || item.AegisName} · #${item.id}`));
    editor.append(make('p', `Type: ${item.Type || 'Unknown'}. Minimum level: ${item.EquipLevelMin ?? 'unchanged'}. Keep original leaves that choice inherited. Other requirements and binding can still prevent equipping or transferring.`));
    if(conflict)editor.append(make('p','World Sync Extras v2.1.5 compatibility: this item is on its class-fix list. Classes and Transfer overrides are excluded from exports. Skills remain available.'));
    const enabled = make('input'); enabled.type = 'checkbox'; enabled.checked = prior?.enabled !== false;
    const enabledLabel = make('label', 'Enable this custom repair '); enabledLabel.append(enabled); editor.append(enabledLabel);
    const controls = { families: {}, permissions: {} };
    function choice(label, options, value) {
      const row = make('label'); row.className = 'rule'; const select = make('select'); select.setAttribute('aria-label', label);
      for (const [v, text] of options) { const option = make('option', text); option.value = v; select.append(option); }
      select.value = value; row.append(make('span', label), select); editor.append(row); return select;
    }
    const modes = [['keep', 'Keep original'], ['allow', 'Allow'], ['block', 'Block']];
    editor.append(make('h3', 'Class families'));
    for (const [key, label] of Object.entries(familyNames)) controls.families[key] = choice(label, modes, prior?.families[key] || 'keep');
    const tiers = choice('Job tiers', [['keep', 'Keep original'], ['all', 'All tiers (including baby classes)']], prior?.tiers || 'keep');
    editor.append(make('h3', 'Transfer permissions'));
    for (const [key, label] of Object.entries(permissionNames)) controls.permissions[key] = choice(label, modes, prior?.permissions[key] || 'keep');
    editor.append(make('h3', 'Skill selection and optional autocast'));
    const autoDefault = prior?.autocast || { enabled: false, skill: 'MG_COLDBOLT', level: 1, chance: 5, trigger: 'both', manual: false, target: 'auto' };
    const autoEnabled = make('input'); autoEnabled.type = 'checkbox'; autoEnabled.checked = autoDefault.enabled;
    const autoLabel = make('label', 'Attack autocast '); autoLabel.append(autoEnabled); editor.append(autoLabel);
    const skillOptions = Object.entries(autocastSkills).map(([id, skill]) => [id, skill.name]);
    const skillSearch = make('input'); skillSearch.type = 'search'; skillSearch.placeholder = 'Search all skills by name, ID or code'; skillSearch.setAttribute('aria-label', 'Search skills'); skillSearch.dataset.viewOnly = 'true'; editor.append(skillSearch);
    const skillFilter = choice('Skill list', [['player', 'Usable player skills'], ['all', 'All skills (including references)'], ['reference', 'Divine Pride — reference only'], ['passive', 'Passive skills'], ['monster', 'Monster/internal skills'], ['companion', 'Companion skills'], ['guild', 'Guild skills']], 'player'); skillFilter.dataset.viewOnly = 'true';
    const autoSkill = choice('Selected skill', [], autoDefault.skill); autoSkill.parentElement.classList.add('skill-picker');
    let chosenSkill = autoDefault.skill, skillPage = 0;
    const skillCount = make('p'), previousSkills = make('button', 'Previous skills'), nextSkills = make('button', 'Next skills');
    editor.append(skillCount, previousSkills, nextSkills);
    function drawSkills() {
      const query = skillSearch.value.trim().toLowerCase();
      const filtered = Object.values(autocastSkills).filter(skill => (skillFilter.value === 'all' || (skillFilter.value === 'player' ? skill.selectable : skill.category === skillFilter.value)) && `${skill.id} ${skill.skill} ${skill.name}`.toLowerCase().includes(query)).sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
      const pages = Math.max(1, Math.ceil(filtered.length / 40)); skillPage = Math.min(skillPage, pages - 1);
      const batch = filtered.slice(skillPage * 40, skillPage * 40 + 40);
      const selected = autocastSkills[chosenSkill] || prior?.skillMetadata;
      if (selected && !batch.some(skill => skill.skill === chosenSkill)) batch.unshift(selected);
      autoSkill.replaceChildren();
      for (const skill of batch) { const option = make('option', `${skill.name} · #${skill.id}${skill.selectable ? '' : ' — ' + skill.reason}`); option.value = skill.skill; option.disabled = !skill.selectable; option.title = skill.reason; autoSkill.append(option); }
      autoSkill.value = chosenSkill;
      skillCount.textContent = `${filtered.length} matches · page ${skillPage + 1}/${pages} · ${Object.keys(autocastSkills).length} skills · ${skillSource === 'running-server' ? 'bundled definitions' : 'bundled 1.7.0 definitions'}. The selected skill stays visible while searching. Unavailable skills are labelled and cannot be selected.`;
      previousSkills.disabled = previousSkills.hidden = skillPage === 0; nextSkills.disabled = nextSkills.hidden = skillPage === pages - 1;
    }
    skillSearch.oninput = skillFilter.onchange = () => { skillPage = 0; drawSkills(); };
    previousSkills.onclick = () => { if (skillPage > 0) skillPage--; drawSkills(); };
    nextSkills.onclick = () => { skillPage++; drawSkills(); };
    drawSkills();
    const autoLevel = choice('Skill level', Array.from({ length: Math.min(13, autocastSkills[autoDefault.skill]?.maxLevel || 1) }, (_, i) => [String(i + 1), String(i + 1)]), String(autoDefault.level));
    autoSkill.onchange = () => {
      chosenSkill = autoSkill.value; skillHint();
      const level = Number(autoLevel.value); autoLevel.replaceChildren();
      for (let i = 1; i <= Math.min(13, autocastSkills[autoSkill.value].maxLevel); i++) { const option = make('option', String(i)); option.value = String(i); autoLevel.append(option); }
      autoLevel.value = String(Math.min(level, 13, autocastSkills[autoSkill.value].maxLevel));
    };
    const manualGrant = make('input'); manualGrant.type = 'checkbox'; manualGrant.checked = autoDefault.manual === true;
    const manualLabel = make('label', 'Manual use (ETC tab while equipped) '); manualLabel.append(manualGrant); editor.append(manualLabel);
    function skillHint(){const selected=autocastSkills[chosenSkill];let text=selected&&!selected.selectable?'This skill cannot be used for manual casts or attack autocasts. '+selected.reason:(!autoEnabled.checked?'Choose Manual use, Attack autocast, or both. Selecting a skill alone does not activate it.':'Autocasting rolls on successful normal attacks; misses and skill attacks do not trigger it. Player targets still require the server to allow combat.');if(manualGrant.checked)text+=' Manual use replaces this item’s script with the bundled baseline plus included repairs; check other script mods.';window.HubGuide?.skill(text);}
    autoEnabled.onchange = () => { skillHint(); };manualGrant.onchange=skillHint;skillFilter.addEventListener('change',()=>{if(skillFilter.value==='passive')window.HubGuide?.skill('Passive skills cannot be cast or triggered by this autocast feature. They are listed for reference and cannot be selected.');});
    editor.append(make('p','Manual use may replace the item script. Attack autocasts roll on successful normal hits; skill restrictions still apply.'));
    const autoTarget = choice('Autocast target', [['auto', 'Automatic (buffs/heals on self)'], ['caster', 'Self'], ['target', 'Attack target']], autoDefault.target || 'auto');
    const autoChance = make('input'); autoChance.type = 'number'; autoChance.min = '1'; autoChance.max = '100'; autoChance.step = '1'; autoChance.value = String(autoDefault.chance); autoChance.setAttribute('aria-label', 'Autocast chance percent');
    const chanceRow = make('label', 'Chance per hit (%) '); chanceRow.className = 'rule'; chanceRow.append(autoChance); editor.append(chanceRow);
    const autoTrigger = choice('Attack trigger', [['both', 'Melee and ranged normal attacks'], ['melee', 'Melee normal attacks'], ['ranged', 'Ranged normal attacks']], autoDefault.trigger);
    const entry = () => ({ id: item.id, enabled: enabled.checked, tiers: equipment && !conflict ? tiers.value : 'keep',
      ...(equipment && skillOptions.length ? { autocast: { enabled: autoEnabled.checked, skill: chosenSkill, level: Number(autoLevel.value), chance: Number(autoChance.value), trigger: autoTrigger.value, manual: manualGrant.checked, target: autoTarget.value } } : {}),
      ...Object.fromEntries(Object.entries(controls).map(([group, choices]) => [group, Object.fromEntries(Object.entries(choices).map(([key, select]) => [key, conflict || (group === 'families' && !equipment) ? 'keep' : select.value]))])) });
    const preview = make('pre'); preview.hidden = true;
    editor.onchange = event => { if (event.target.dataset.viewOnly) return; drafts.set(item.id, entry()); status('Unsaved item changes. Use Save & Export below.'); buttons(); };
    const previewButton = make('button', 'Preview changes'); previewButton.onclick = () => run(async () => { const result = await api({ op: 'preview', entry: entry() }); preview.textContent = result.yaml + '\n' + (result.lua || ''); preview.hidden = false; });
    editor.append(previewButton, preview);
    // Compact native-style subtabs keep the three groups out of one long form.
    const sectionTabs=make('nav');sectionTabs.className='collection-tabs';sectionTabs.setAttribute('aria-label','Item settings');
    const sections=[],sectionNames=['Class families','Transfer permissions','Skill selection and optional autocast'];let activeSection=null;
    for(const node of [...editor.children]){
      const index=node.tagName==='H3'?sectionNames.indexOf(node.textContent):-1;
      if(index>=0){activeSection=make('section');sections.push(activeSection);node.before(activeSection);}
      if(node===previewButton)activeSection=null;
      if(activeSection)activeSection.append(node);
    }
    if(sections.length===3){
      sections[0].before(sectionTabs);
      const visibleSections=conflict?[2]:equipment?[0,1,2]:[1];
      const buttons=['Classes','Transfer','Skills'].map((name,index)=>{const b=make('button',name);b.type='button';b.onclick=()=>show(index);b.hidden=!visibleSections.includes(index);sectionTabs.append(b);return b;});
      function show(index){window.HubGuide?.context(['Classes','Transfer','Skills'][index]);if(index===2)skillHint();sections.forEach((section,i)=>{section.hidden=i!==index;});buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));}
      show(conflict?2:equipment?0:1);
      if(conflict)window.HubGuide?.message('Compatibility mode: World Sync Extras v2.1.5 covers this item. Only Skills can be edited here; class and transfer overrides are omitted when exporting.');
    }
    if(!equipment)editor.append(make('p','This item supports transfer permission repairs only. Class and equipped-skill settings do not apply.'));
    message.textContent = prior ? 'Editing a saved item. It uses bundled official definitions plus your selected included repairs.' : 'Item found in your bundled item definitions. Choose the changes, then add it.';
  }
  async function add(id) {
    const { item } = await api({ op: 'lookup', id });
    if (!entries.some(entry => entry.id === item.id)) await api({ op: 'save', revision, entry: { id: item.id } });
    await load();
    document.getElementById('search').value = ''; document.getElementById('category').value = 'all'; document.getElementById('filter').value = 'all';
    selected = catalog.find(entry => entry.id === item.id).key; tab(false); refreshCollection(); await edit(item.id);
    status('Item added. Choose its settings, then Save & Export. Use Save & Export below, then Apply & restart.');
  }
  lookup.onclick = () => run(async () => {
    const query = input.value.trim(); if (!query) throw Error('Enter an ID, link, or item name.');
    if (/^\d+$/.test(query) || /^https?:/i.test(query)) return add(query);
    const response = await api({ op: 'search', query }); results.replaceChildren(); editor.replaceChildren();
    for (const item of response.items) { const b = make('button', `Add ${item.name} · #${item.id}`); b.onclick = () => run(() => add(item.id)); results.append(b); }
    message.textContent = response.items.length ? 'Choose an item. Up to 30 matches are shown; refine the name if needed.' : 'No matching item in the bundled item definitions.';
  });
  input.addEventListener('keydown', event => { if (event.key === 'Enter') lookup.click(); });
  reloadButton.onclick = () => run(async () => { await load(); const item = catalog.find(item => item.key === selected); if (item?.id) await edit(item.id); message.textContent = 'Saved items reloaded.'; });
  run(async () => {
    if (!window.modSettings?.itemRepairs) throw Error('The native export-editor backend did not load. Reinstall the complete package; no desktop app patch is required.');
    if (!ready) await new Promise(resolve => window.addEventListener('hub-ready', resolve, { once: true }));
    const skills = await api({ op: 'skills' }); skillSource = skills.source;
    await load(); message.textContent = 'Ready to add an item.';
  });
})();




