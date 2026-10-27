/* Item Repair Hub v2.3.1: ordinary-client draft/export backend; no Electron bridge. */
(function(){'use strict';
  const replies=new Map();let serial=0;
  window.addEventListener('message',event=>{
    if(event.source!==window.parent||event.origin!==location.origin||event.data?.type!=='irh-native-reply')return;
    const pending=replies.get(event.data.id);if(!pending)return;replies.delete(event.data.id);clearTimeout(pending.timer);
    event.data.error?pending.reject(Error(event.data.error)):pending.resolve(event.data.value);
  });
  function remote(op,value){return new Promise((resolve,reject)=>{const id=++serial;const timer=setTimeout(()=>{replies.delete(id);reject(Error('Open Item Repairs from the in-game button. The editor could not reach its ordinary client API.'));},6000);replies.set(id,{resolve,reject,timer});window.parent.postMessage({type:'irh-native-request',id,op,value},location.origin);});}
  async function json(file){const r=await fetch(file);if(!r.ok)throw Error('Missing editor file: '+file);return r.json();}
  const rootUrl=new URL('../',location.href);
  let compiler,base,manifest,skills,packageFiles,documentState,layerCache;
  const loaded=(async()=>{
    const [items,skillData,bundle,seed,host]=await Promise.all([json('items-v1.7.0.json'),json('skills-v1.7.0.json'),json('../package-files-v2.3.1.json'),json('../seed-config-v2.3.1.json'),remote('load')]);
    skills=skillData.skills;compiler=ItemRepairCompiler.create(skillData);base=new Map(items.map(i=>[i.id,i]));packageFiles=bundle;
    manifest=JSON.parse(decodeText(bundle.static['mod.json']));
    const initial=host.draft?.schema===1&&host.draft.revision>=seed.revision?host.draft:seed;
    const defaults=Object.fromEntries(manifest.settings.map(s=>[s.key,s.default]));
    documentState={schema:1,revision:Math.max(0,Number.isSafeInteger(initial.revision)?initial.revision:0),settings:{...defaults,...initial.settings,...host.parameters},worldSyncCompat:initial.worldSyncCompat===true,removedIds:Array.isArray(initial.removedIds)?initial.removedIds.filter(Number.isSafeInteger):[],entries:initial.entries||[]};
    for(const s of manifest.settings)documentState.settings[s.key]=documentState.settings[s.key]===true;
    layerCache=new Map();
    for(const [name,data] of Object.entries(bundle.static))if(/^db\/when\/[^/]+\/item_db.yml$/.test(name))layerCache.set(name,compiler.parseTable(decodeText(data)));
    documentState.entries=documentState.entries.map(e=>compiler.validateEntry(choice(e),baseline(e.id)));
    return host;
  })();
  function decodeText(b64){return new TextDecoder().decode(Uint8Array.from(atob(b64),c=>c.charCodeAt(0)));}
  function choice(e){return Object.fromEntries(['id','enabled','families','permissions','tiers','autocast'].filter(k=>e[k]!==undefined).map(k=>[k,e[k]]));}
  function baseline(id){
    id=compiler.idOf(id);const initial=base.get(id);if(!initial)throw Error('This item is not in the bundled official 1.7.0 definitions. A safe class/script baseline is required; no repair was added.');
    const selected=new Map([[id,structuredClone(initial)]]);
    for(const [name,map] of [...layerCache].sort(([a],[b])=>a.localeCompare(b))){const key=name.split('/')[2];if(documentState.settings[key]&&map.has(id)&&!HubCompat.overlap(id,documentState.worldSyncCompat))compiler.overlay(selected,new Map([[id,map.get(id)]]));}
    return selected.get(id);
  }
  function snapshot(){return {schema:1,revision:documentState.revision,settings:{...documentState.settings},worldSyncCompat:documentState.worldSyncCompat,removedIds:[...documentState.removedIds],entries:documentState.entries.map(choice)};}
  async function persist(){await remote('save',snapshot());}
  function revision(req){if(req.revision!==documentState.revision)throw Error('The draft changed. Reload saved items before trying again.');}
  window.modSettings={
    get:async()=>{await loaded;return {...manifest,enabled:true,context:{era:'renewal',appVersion:'1.7.0 baselines',enabledMods:[]},settings:manifest.settings.map(s=>({...s,value:documentState.settings[s.key]}))};},
    set:async values=>{await loaded;for(const s of manifest.settings)if(typeof values[s.key]!=='boolean')throw Error('Invalid included-repair setting.');const previous=structuredClone(documentState);documentState.settings={...values};try{await persist();}catch(e){documentState=previous;throw e;}return {saved:true};},
    itemRepairs:async req=>{
      await loaded;
      if(req.op==='list')return {revision:documentState.revision,entries:documentState.entries,autocastSkills:skills,skillFeatures:4,removedIds:[...documentState.removedIds],worldSyncCompat:documentState.worldSyncCompat};
      if(req.op==='compatibility'){if(typeof req.enabled!=='boolean')throw Error('Invalid compatibility choice.');const previous=documentState.worldSyncCompat;documentState.worldSyncCompat=req.enabled;try{await persist();}catch(e){documentState.worldSyncCompat=previous;throw e;}return {enabled:documentState.worldSyncCompat};}
      if(req.op==='skills')return {skills,source:'bundled-1.7.0'};
      if(req.op==='search'){const q=String(req.query||'').trim().toLowerCase();return {items:[...base.values()].filter(i=>`${i.id} ${i.Name} ${i.AegisName}`.toLowerCase().includes(q)).slice(0,30).map(i=>({id:i.id,name:i.Name,type:i.Type}))};}
      if(req.op==='sync'){revision(req);await persist();return {revision:documentState.revision,entries:documentState.entries};}
      const id=compiler.idOf(req.id??req.entry?.id),item=baseline(id);
      if(req.op==='lookup'){
        const response=await remote('probe',id);
        if(response!==`OK|${id}|${item.AegisName}`)throw Error('The running server item does not match this bundled baseline. No repair was added.');
        return {item,baseline:'bundled-1.7.0'};
      }
      if(req.op==='preview'){const entry=compiler.validateEntry(HubCompat.choices(req.entry,documentState.worldSyncCompat),item);return {yaml:compiler.compile([entry]),lua:compiler.compileLua([entry])};}
      revision(req);
      const previous=structuredClone(documentState);
      if(req.op==='save'){documentState.removedIds=documentState.removedIds.filter(n=>n!==id);const entry=compiler.validateEntry(req.entry,item);documentState.entries=documentState.entries.filter(e=>e.id!==id).concat(entry);}
      else if(req.op==='remove'){documentState.entries=documentState.entries.filter(e=>e.id!==id);documentState.removedIds=[...new Set([...documentState.removedIds,id])];}
      else throw Error('Unknown draft operation.');
      documentState.revision++;try{await persist();}catch(e){documentState=previous;throw e;}return {revision:documentState.revision,entries:documentState.entries};
    },
  };
  async function exportZip(){
    await loaded;
    const entries=documentState.entries.map(e=>compiler.validateEntry(HubCompat.choices(choice(e),documentState.worldSyncCompat),baseline(e.id)));
    const files=new Map();
    for(const [name,data] of Object.entries(packageFiles.static)){if(documentState.removedIds.includes(450481)&&name.startsWith('lua/when/cocytus_base/'))continue;const bytes=Uint8Array.from(atob(data),c=>c.charCodeAt(0));files.set('item-repair-hub/'+name,/^db\/.*item_db\.yml$/.test(name)?HubCompat.filterTable(new TextDecoder().decode(bytes),documentState.worldSyncCompat,documentState.removedIds):bytes);}
    for(const name of packageFiles.client){const r=await fetch(new URL(name,rootUrl));if(!r.ok)throw Error('Cannot read package component: '+name);files.set('item-repair-hub/client/'+name,new Uint8Array(await r.arrayBuffer()));}
    const outManifest=structuredClone(manifest);for(const s of outManifest.settings)s.default=documentState.settings[s.key]===true;
    files.set('item-repair-hub/mod.json',JSON.stringify(outManifest,null,2)+'\n');
    files.set('item-repair-hub/client/seed-config-v2.3.1.json',JSON.stringify(snapshot()));
    if(entries.length){files.set('item-repair-hub/db/when/zz_native_exports/item_db.yml',compiler.compile(entries));files.set('item-repair-hub/lua/when/zz_native_exports/custom-autocasts-v2.3.1.lua',compiler.compileLua(entries));}
    const bytes=HubZip.pack(files),url=URL.createObjectURL(new Blob([bytes],{type:'application/zip'}));
    const link=document.createElement('a');link.href=url;link.download=`ItemRepairHub-v2.3.1-repairs-${documentState.revision}.zip`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    return {bytes:bytes.length,files:files.size};
  }
  window.HubNative={exportZip,snapshot:async()=>{await loaded;return snapshot();}};
  window.addEventListener('DOMContentLoaded',()=>{
    const button=document.getElementById('export-zip');button.onclick=async()=>{button.disabled=true;document.body.inert=true;window.HubGuide?.message('Saving your edits and preparing the ZIP…');try{if(typeof window.HubSaveDraftForExport!=='function')throw Error('Wait for the editor to load.');const saved=await window.HubSaveDraftForExport();if(saved!==true)throw Error('Draft saving failed; no ZIP was exported. Resolve the save error first.');const result=await exportZip();window.HubGuide?.exported(`ItemRepairHub-v2.3.1-repairs-${documentState.revision}.zip`);document.getElementById('status').textContent=`ZIP download requested (${result.files} files). Close Item Repairs, extract the ZIP and replace the installed item-repair-hub folder, then Apply & restart in the app.`;}catch(e){document.getElementById('status').textContent=e.message;window.HubGuide?.error(e.message);}finally{document.body.inert=false;button.disabled=false;}};
  });
})();


