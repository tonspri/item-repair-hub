/* Item Repair Hub v2.12.0: ordinary-client draft/export backend; no Electron bridge.
   Renewal and pre-renewal: the launcher asks the server which era runs (@irhprobe era, checkre(0)). Each era has
   its own item and skill data, its own draft (client preference) and its own exported repairs, written to the
   mod's renewal/ or pre-renewal/ folder, which the app reads only in that era. One Save & Export carries both. */
(function(){'use strict';
  const VERSION='2.12.0';
  const ERAS={
    renewal:{items:'items-v1.7.4.json',skills:'skills-v1.7.0.json',seed:'seed-config-v2.12.0.json',folder:'renewal',label:'bundled-items-1.7.4'},
    'pre-renewal':{items:'items-pre-v1.7.6.json',skills:'skills-pre-v1.7.6.json',seed:'seed-config-pre-v2.12.0.json',folder:'pre-renewal',label:'bundled-items-pre-1.7.6'},
  };
  const other=era=>era==='renewal'?'pre-renewal':'renewal';
  const replies=new Map();let serial=0;
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||event.origin!==location.origin||event.data?.type!=='irh-native-reply')return;
    const pending=replies.get(event.data.id);if(!pending)return;replies.delete(event.data.id);clearTimeout(pending.timer);
    event.data.error?pending.reject(Error(event.data.error)):pending.resolve(event.data.value);
  });
  function remote(op,value){return new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{replies.delete(id);reject(Error('Open Item Repairs from the in-game button. The editor could not reach its ordinary client API.'));},6000);replies.set(id,{resolve,reject,timer});window.parent.postMessage({type:'irh-native-request',id,op,value},location.origin);});}
  async function json(file){const r=await fetch(file);if(!r.ok)throw Error('Missing editor file: '+file);return r.json();}
  function decodeText(b64){return new TextDecoder().decode(Uint8Array.from(atob(b64),c=>c.charCodeAt(0)));}
  const rootUrl=new URL('../',location.href);

  // Per-era data: items, skills, a compiler for that era's skills, and the repair layers the app applies in it
  // (db/when/<key>/ at the top, and <era folder>/db/when/<key>/).
  const eraCache=new Map();
  function eraData(name){
    if(!eraCache.has(name))eraCache.set(name,(async()=>{
      const spec=ERAS[name];
      const [items,skillData]=await Promise.all([json(spec.items),json(spec.skills)]);
      const compiler=ItemRepairCompiler.create(skillData),layers=new Map();
      for(const [file,data] of Object.entries(packageFiles.static)){
        const m=/^(?:(renewal|pre-renewal)\/)?db\/when\/([^/]+)\/item_db\.yml$/.exec(file);
        if(m&&(!m[1]||m[1]===spec.folder))layers.set(file,{key:m[2],table:compiler.parseTable(decodeText(data))});
      }
      return {name,spec,base:new Map(items.map(i=>[i.id,i])),skills:skillData.skills,compiler,layers};
    })());
    return eraCache.get(name);
  }
  // World Sync Extras is a renewal mod; its compatibility choice means nothing in pre-renewal.
  const compat=state=>state.era==='renewal'&&state.worldSyncCompat===true;
  function baselineIn(d,state,id){
    id=d.compiler.idOf(id);const initial=d.base.get(id);
    if(!initial)throw Error(`This item is not in the bundled ${d.name} item definitions. A safe class/script baseline is required; no repair was added.`);
    const selected=new Map([[id,structuredClone(initial)]]);
    for(const [file,{key,table}] of [...d.layers].sort(([a],[b])=>a.localeCompare(b))){
      if(state.settings[key]&&table.has(id)&&(key.startsWith('fx_')||!HubCompat.overlap(id,compat(state))))d.compiler.overlay(selected,new Map([[id,table.get(id)]]));
    }
    return selected.get(id);
  }
  function choice(e){return Object.fromEntries(['id','enabled','families','permissions','tiers','autocast','autocasts','equipLevelMin','restoreRefineEffects','bonuses'].filter(k=>e[k]!==undefined).map(k=>[k,e[k]]));}
  // Which items were applied live, and the fingerprint of what was sent (live changes tab).
  function liveMap(v){return Object.fromEntries(Object.entries(v&&typeof v==='object'?v:{}).filter(([k,h])=>/^\d+$/.test(k)&&typeof h==='string'&&h.length<64));}
  function liveExtras(v){
    const stats=Array.isArray(v?.stats)?v.stats:[];
    if(stats.length>40||!stats.every(s=>/^[a-z]{1,16}$/.test(s?.stat)&&Number.isInteger(s.amount)&&Math.abs(s.amount)<=10000))throw Error('Invalid added stats.');
    if(typeof(v?.raw??'')!=='string'||(v?.raw??'').length>3000)throw Error('Invalid advanced lines.');
    return {stats:stats.map(s=>({stat:s.stat,amount:s.amount})),raw:v?.raw??''};
  }
  // Live tab stat presets: this PC only, like live markers; never exported.
  function presetList(v){const out=[];for(const p of Array.isArray(v)?v:[]){try{const name=String(p?.name??'').trim();if(!name||name.length>30||out.some(x=>x.name===name))continue;out.push({name,...HubEffects.cleanBonuses(p)});}catch{}}return out.slice(0,20);}
  // A draft for one era: the saved one when it is at least as new as the packaged seed, else the seed.
  function stateFrom(d,draft,seed,parameters){
    const initial=draft?.schema===1&&draft.revision>=seed.revision?draft:seed;
    const defaults=Object.fromEntries(manifest.settings.map(s=>[s.key,s.default]));
    const state={schema:1,era:d.name,revision:Math.max(0,Number.isSafeInteger(initial.revision)?initial.revision:0),settings:{...defaults,...initial.settings,...parameters},
      worldSyncCompat:d.name==='renewal'&&initial.worldSyncCompat===true,removedIds:Array.isArray(initial.removedIds)?initial.removedIds.filter(Number.isSafeInteger):[],entries:initial.entries||[],
      liveApplied:liveMap(initial.liveApplied),liveExtras:Object.fromEntries(Object.entries(initial.liveExtras&&typeof initial.liveExtras==='object'?initial.liveExtras:{}).filter(([k])=>/^\d+$/.test(k)).map(([k,v])=>{try{return [k,liveExtras(v)];}catch{return [k,{stats:[],raw:''}];}})),
      livePresets:presetList(initial.livePresets)};
    for(const s of manifest.settings)state.settings[s.key]=state.settings[s.key]===true;
    state.entries=state.entries.map(e=>d.compiler.validateEntry(choice(e),baselineIn(d,state,e.id)));
    return state;
  }

  let manifest,packageFiles,documentState,current,compiler,base,skills;
  const baseline=id=>baselineIn(current,documentState,id);
  const loaded=(async()=>{
    const [bundle,host]=await Promise.all([json('../package-files-v2.12.0.json'),remote('load')]);
    packageFiles=bundle;manifest=JSON.parse(decodeText(bundle.static['mod.json']));
    // A launcher from before v2.12.0 (and the tests' stand-in) says nothing about the era: that is renewal.
    const era=host?.era===undefined?'renewal':host.era;
    if(!ERAS[era])throw Error('The game server did not say whether it runs renewal or pre-renewal. Open Item Repairs in game while the server is running.');
    current=await eraData(era);({compiler,base,skills}=current);
    documentState=stateFrom(current,host.draft,await json('../'+current.spec.seed),host.parameters);
    return host;
  })();

  // Live changes tab: for worn items (and items already live), the script the item has at server start
  // (its saved edit, or its original), the minimum equip level to send, and the live-only added stats.
  function liveInfo(ids){
    const wanted=[...new Set([...ids.map(Number).filter(Number.isSafeInteger),...Object.keys(documentState.liveApplied).map(Number)])];
    return wanted.map(id=>{
      const raw=base.get(id),key=String(id),applied=documentState.liveApplied[key]||null,extras=documentState.liveExtras[key]||{stats:[],raw:''};
      if(!raw)return {id,name:`Item ${id}`,changeable:false,reason:'Not in the bundled item list.',applied,extras};
      if(!['Weapon','Armor','ShadowGear'].includes(raw.Type))return {id,name:raw.Name,changeable:false,reason:'Only weapons, armor and shadow gear can be changed.',applied,extras};
      const original=documentState.removedIds.includes(id)?raw:baseline(id);
      const saved=documentState.entries.find(e=>e.id===id);
      const notes=[];let script=original.Script??'',level=original.EquipLevelMin??-1,hasEdit=false;
      if(saved){
        const e=compiler.validateEntry(HubCompat.choices(choice(saved),compat(documentState)),baseline(id));
        if(e.enabled){
          const row=compiler.parseTable(compiler.compile([e])).get(id);
          script=row?.Script??script;hasEdit=true;
          if(e.equipLevelMin!=null)level=e.equipLevelMin;
          if(Object.values(e.families).some(v=>v!=='keep')||e.tiers!=='keep'||Object.values(e.permissions).some(v=>v!=='keep'))notes.push('Class and transfer rules from your saved edit apply after Save & Export and a restart.');
          if((e.autocasts||[]).some(c=>c.visibleFalcon&&(c.enabled||c.manual)))notes.push('The visible falcon starts after Save & Export and a restart.');
        }
      }
      // Built-in repair layers that change this item's script, and whether each is on for it (repair checker).
      const repairs=[...current.layers.values()].filter(({table})=>table.get(id)?.Script!==undefined).map(({key})=>({key,on:documentState.settings[key]===true&&!documentState.removedIds.includes(id)&&(key.startsWith('fx_')||!HubCompat.overlap(id,compat(documentState)))}));
      return {id,name:raw.Name||`Item ${id}`,changeable:true,script,level,hasEdit,notes,applied,extras,repairs};
    });
  }
  const strip=s=>{const out=structuredClone(s);delete out.liveApplied;delete out.liveExtras;delete out.livePresets;return out;};
  function snapshot(){return {schema:1,era:documentState.era,revision:documentState.revision,settings:{...documentState.settings},worldSyncCompat:documentState.worldSyncCompat,removedIds:[...documentState.removedIds],entries:documentState.entries.map(choice),liveApplied:{...documentState.liveApplied},liveExtras:structuredClone(documentState.liveExtras),livePresets:structuredClone(documentState.livePresets)};}
  async function persist(){await remote('save',snapshot());}
  function revision(req){if(req.revision!==documentState.revision)throw Error('The draft changed. Reload saved items before trying again.');}
  window.modSettings={
    get:async()=>{await loaded;return {...manifest,enabled:true,context:{era:documentState.era,appVersion:`${documentState.era==='renewal'?'1.7.4':'1.7.6 pre-renewal'} items / 1.7.0 skills`,enabledMods:[]},settings:manifest.settings.map(s=>({...s,value:documentState.settings[s.key]}))};},
    set:async values=>{await loaded;for(const s of manifest.settings)if(typeof values[s.key]!=='boolean')throw Error('Invalid included-repair setting.');const previous=structuredClone(documentState);documentState.settings={...values};try{await persist();}catch(e){documentState=previous;throw e;}return {saved:true};},
    itemRepairs:async req=>{
      await loaded;
      if(req.op==='list')return {era:documentState.era,revision:documentState.revision,entries:documentState.entries,autocastSkills:skills,skillFeatures:4,removedIds:[...documentState.removedIds],worldSyncCompat:documentState.worldSyncCompat};
      if(req.op==='compatibility'){if(typeof req.enabled!=='boolean')throw Error('Invalid compatibility choice.');if(documentState.era!=='renewal')throw Error('World Sync Extras compatibility is for renewal only.');const previous=documentState.worldSyncCompat;documentState.worldSyncCompat=req.enabled;try{await persist();}catch(e){documentState.worldSyncCompat=previous;throw e;}return {enabled:documentState.worldSyncCompat};}
      if(req.op==='skills')return {skills,source:current.spec.skills};
      if(req.op==='search'){const q=String(req.query||'').trim().toLowerCase();return {items:[...base.values()].filter(i=>`${i.id} ${i.Name} ${i.AegisName}`.toLowerCase().includes(q)).slice(0,30).map(i=>({id:i.id,name:i.Name,type:i.Type}))};}
      if(req.op==='sync'){revision(req);await persist();return {revision:documentState.revision,entries:documentState.entries};}
      if(req.op==='liveInfo'){if(!Array.isArray(req.ids)||req.ids.length>20)throw Error('Invalid item list.');return {items:liveInfo(req.ids)};}
      if(req.op==='liveSend'){if(typeof req.text!=='string'||req.text.length>200)throw Error('Invalid live request.');return remote('live',req.text);}
      if(req.op==='liveMark'){const key=String(compiler.idOf(req.id));const previous={...documentState.liveApplied};const previousExtras=structuredClone(documentState.liveExtras);if(req.hash===null){delete documentState.liveApplied[key];delete documentState.liveExtras[key];}else if(typeof req.hash==='string'&&req.hash.length<64){documentState.liveApplied[key]=req.hash;documentState.liveExtras[key]=liveExtras(req.extras??{});}else throw Error('Invalid live mark.');try{await persist();}catch(e){documentState.liveApplied=previous;documentState.liveExtras=previousExtras;throw e;}return {saved:true};}
      if(req.op==='support')return remote('support');
      if(req.op==='display'){const v=req.value??null;if(v!==null&&typeof v!=='object')throw Error('Invalid display choice.');return remote('display',v);}
      if(req.op==='presets')return {presets:structuredClone(documentState.livePresets)};
      if(req.op==='presetSave'||req.op==='presetDelete'){
        const previous=structuredClone(documentState.livePresets);const name=String(req.op==='presetSave'?req.preset?.name??'':req.name??'').trim();
        if(!name||name.length>30)throw Error('Give the preset a name of up to 30 characters.');
        if(req.op==='presetSave'){
          const kept=HubEffects.cleanBonuses(req.preset);if(!kept.stats.length&&!kept.raw.trim())throw Error('A preset needs at least one stat.');
          if(kept.raw.trim()){const why=HubLiveGuard.guard(HubLiveGuard.normalize(kept.raw));if(why)throw Error('Not saved: '+why+'.');}
          const others=documentState.livePresets.filter(p=>p.name!==name);if(others.length>=20)throw Error('You can keep up to 20 presets. Delete one first.');
          documentState.livePresets=[...others,{name,...kept}];
        }else documentState.livePresets=documentState.livePresets.filter(p=>p.name!==name);
        try{await persist();}catch(e){documentState.livePresets=previous;throw e;}return {presets:structuredClone(documentState.livePresets)};
      }
      if(req.op==='itemInfo'){if(!Array.isArray(req.ids)||req.ids.length>40||!req.ids.every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid item list.');const got=await remote('item',req.ids);return {items:Array.isArray(got)?got.filter(m=>m&&Number.isSafeInteger(m.id)):[]};}
      // Keep in my saved edit: the stats join the item's saved edit (summed per stat), so they are exported.
      if(req.op==='keepBonuses'){
        const id=compiler.idOf(req.id),item=baseline(id);const add=HubEffects.cleanBonuses(req.bonuses);if(!add.stats.length&&!add.raw.trim())throw Error('Add some stats first.');
        const saved=documentState.entries.find(e=>e.id===id),now=HubEffects.cleanBonuses(saved?.bonuses??{}),stats=now.stats.map(s=>({...s}));
        for(const s of add.stats){const same=stats.find(x=>x.stat===s.stat);if(same)same.amount+=s.amount;else stats.push({...s});}
        const merged={stats:stats.filter(s=>s.amount!==0),raw:[now.raw,add.raw].filter(x=>x.trim()).join(' ')};const previous=structuredClone(documentState);
        try{const entry=compiler.validateEntry({...(saved?choice(saved):{id}),enabled:true,bonuses:merged},item);documentState.removedIds=documentState.removedIds.filter(n=>n!==id);documentState.entries=documentState.entries.filter(e=>e.id!==id).concat(entry);documentState.revision++;await persist();}
        catch(e){documentState=previous;throw e;}
        return {revision:documentState.revision,entries:documentState.entries};
      }
      const id=compiler.idOf(req.id??req.entry?.id),item=baseline(id);
      if(req.op==='lookup'){
        const response=await remote('probe',id);
        if(response!==`OK|${id}|${item.AegisName}`)throw Error('The running server item does not match this bundled baseline. No repair was added.');
        return {item,baseline:current.spec.label};
      }
      if(req.op==='preview'){const entry=compiler.validateEntry(HubCompat.choices(req.entry,compat(documentState)),item);return {yaml:compiler.compile([entry]),lua:compiler.compileLua([entry])};}
      revision(req);
      const previous=structuredClone(documentState);
      if(req.op==='save'){documentState.removedIds=documentState.removedIds.filter(n=>n!==id);const entry=compiler.validateEntry(req.entry,item);documentState.entries=documentState.entries.filter(e=>e.id!==id).concat(entry);}
      else if(req.op==='remove'){documentState.entries=documentState.entries.filter(e=>e.id!==id);documentState.removedIds=[...new Set([...documentState.removedIds,id])];}
      else throw Error('Unknown draft operation.');
      documentState.revision++;try{await persist();}catch(e){documentState=previous;throw e;}return {revision:documentState.revision,entries:documentState.entries};
    },
  };
  // The other era's saved draft, so one ZIP keeps both eras' repairs.
  async function otherState(){
    const name=other(documentState.era),d=await eraData(name);
    // A failed read stops the export: going on would drop that era's repairs from the ZIP.
    let draft=await remote('draft',name);
    if(draft&&(typeof draft!=='object'||draft.schema!==1||(draft.era??'renewal')!==name))draft=null;  // drafts from before v2.8.0 have no era: they are renewal's
    return {d,state:stateFrom(d,draft,await json('../'+d.spec.seed),{})};
  }
  async function exportZip(){
    await loaded;
    const eras=[{d:current,state:documentState},await otherState()];
    const byFolder=Object.fromEntries(eras.map(x=>[x.d.spec.folder,x]));
    const files=new Map();
    for(const [name,data] of Object.entries(packageFiles.static)){
      const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));
      const folder=/^(renewal|pre-renewal)\//.exec(name)?.[1],owner=byFolder[folder]||eras[0];
      const value=/^(?:(?:renewal|pre-renewal)\/)?db\/.*item_db\.yml$/.test(name)?HubCompat.filterTable(new TextDecoder().decode(bytes),/(^|\/)db\/when\/fx_/.test(name)?false:compat(owner.state),owner.state.removedIds):bytes;
      if(typeof value==='string'&&/^Body: \[\]$/m.test(value))continue;
      files.set('item-repair-hub/'+name,value);
    }
    for(const name of packageFiles.client){const r=await fetch(new URL(name,rootUrl));if(!r.ok)throw Error('Cannot read package component: '+name);files.set('item-repair-hub/client/'+name,new Uint8Array(await r.arrayBuffer()));}
    const outManifest=structuredClone(manifest);for(const s of outManifest.settings)s.default=documentState.settings[s.key]===true;
    files.set('item-repair-hub/mod.json',JSON.stringify(outManifest,null,2)+'\n');
    for(const {d,state} of eras){
      const entries=state.entries.map(e=>d.compiler.validateEntry(HubCompat.choices(choice(e),compat(state)),baselineIn(d,state,e.id)));
      files.set('item-repair-hub/client/'+d.spec.seed,JSON.stringify(strip({...state,entries:state.entries.map(choice)})));
      if(entries.length)files.set(`item-repair-hub/${d.spec.folder}/db/when/zz_native_exports/item_db.yml`,d.compiler.compile(entries));
      files.set(`item-repair-hub/${d.spec.folder}/npc/visible-falcon-v${VERSION}.txt`,d.compiler.compileFalcon(entries));
    }
    const bytes=HubZip.pack(files),url=URL.createObjectURL(new Blob([bytes],{type:'application/zip'}));
    const link=document.createElement('a');link.href=url;link.download=`ItemRepairHub-v${VERSION}-repairs-${documentState.revision}.zip`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    return {bytes:bytes.length,files:files.size};
  }
  window.HubNative={exportZip,snapshot:async()=>{await loaded;return snapshot();}};
  window.addEventListener('DOMContentLoaded',()=>{
    const button=document.getElementById('export-zip');button.onclick=async()=>{button.disabled=true;document.body.inert=true;window.HubGuide?.message('Saving your edits and preparing the ZIP…');try{if(typeof window.HubSaveDraftForExport!=='function')throw Error('Wait for the editor to load.');const saved=await window.HubSaveDraftForExport();if(saved!==true)throw Error('Draft saving failed; no ZIP was exported. Resolve the save error first.');const result=await exportZip();window.HubGuide?.exported(`ItemRepairHub-v${VERSION}-repairs-${documentState.revision}.zip`);let live='';try{const n=await window.HubLive?.syncAfterExport?.();if(n)live=` ${n} live item${n===1?' was':'s were'} brought up to date.`;}catch(e){live=' Live items could not be updated now; open Live changes in game to apply them.';}document.getElementById('status').textContent=`ZIP download requested (${result.files} files). Close Item Repairs, extract the ZIP and replace the installed item-repair-hub folder, then Apply & restart in the app.${live}`;}catch(e){document.getElementById('status').textContent=e.message;window.HubGuide?.error(e.message);}finally{document.body.inert=false;button.disabled=false;}};
  });
})();
