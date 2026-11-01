// Item Repair Hub v2.7.0: built-in iRO effect layer through the real editor backend (simulated client API).
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve('mod'),ed=path.join(root,'client/editor');
const text=v=>typeof v==='string'?v:new TextDecoder().decode(v);
const LAYER='item-repair-hub/db/when/fx_iro_effects/item_db.yml';

async function backend(draft){
  const events={};let files;
  const ctx={console,Map,Set,URL:class extends URL{static createObjectURL(){return 'blob:test';}static revokeObjectURL(){}},Blob,TextEncoder,TextDecoder,Uint8Array,structuredClone,atob,btoa,setTimeout:(f,t)=>t===60000?0:setTimeout(f,t),clearTimeout,location:{href:'http://test/client/editor/index.html',origin:'http://test'},ItemRepairCompiler:require(path.join(ed,'compiler-v2.7.0.js')),HubCompat:require(path.join(ed,'compat-v2.7.0.js')),HubZip:{pack:f=>{files=f;return new Uint8Array([1]);}},document:{getElementById:()=>({checked:true}),body:{append(){}},createElement:()=>({click(){},remove(){}})}};
  ctx.window={addEventListener:(n,f)=>events[n]=f,parent:{postMessage:r=>queueMicrotask(()=>events.message({source:ctx.window.parent,origin:'http://test',data:{type:'irh-native-reply',id:r.id,value:r.op==='load'?{parameters:{},draft}:{saved:true}}}))}};
  ctx.fetch=async url=>{const u=new URL(String(url),'http://test/client/editor/');const bytes=fs.readFileSync(path.join(root,u.pathname));return {ok:true,json:async()=>JSON.parse(bytes),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
  vm.runInNewContext(fs.readFileSync(path.join(ed,'native-backend-v2.7.0.js'),'utf8'),ctx);
  const manifest=await ctx.window.modSettings.get();
  return {api:ctx.window.modSettings.itemRepairs,set:ctx.window.modSettings.set,manifest,exportZip:async()=>{await ctx.window.HubNative.exportZip();return files;}};
}
const ids=t=>[...t.matchAll(/^  - Id: (\d+)$/gm)].map(m=>Number(m[1]));
const cast=(skill,minRefine)=>({skill,enabled:true,manual:false,level:1,chance:10,trigger:'both',target:'auto',minRefine});

(async()=>{
  // 1. Fresh install: one master switch, on by default, at most 40 settings, all 32 rows exported, no Cocytus Lua.
  let b=await backend(null);
  assert(b.manifest.settings.length<=40);
  assert.equal(JSON.stringify(b.manifest.settings.filter(s=>s.key.startsWith('fx_')).map(s=>[s.key,s.value])),'[["fx_iro_effects",true]]');
  let files=await b.exportZip();
  const all=ids(text(files.get(LAYER)));
  assert.equal(all.length,32);
  assert(![...files.keys()].some(k=>k.startsWith('item-repair-hub/lua/when/cocytus_base/')));

  // 2. World Sync compatibility drops Jobs rows for overlapping items but keeps the Script-only effects layer whole.
  await b.api({op:'compatibility',enabled:true});
  files=await b.exportZip();
  assert.deepEqual(ids(text(files.get(LAYER))),all);
  // An emptied layer is left out entirely: an item_db.yml with no rows blocked other mods' copy (Eden Rework).
  assert.equal(files.has('item-repair-hub/db/when/agni_family/item_db.yml'),false);
  assert(![...files.values()].some(v=>typeof v==='string'&&/^Body: \[\]$/m.test(v)),'no empty item_db layer exported');

  // 3. A player edit on top of the effects layer keeps the iRO script (baseline includes the layer, even with compat on).
  let s=await b.api({op:'list'});
  await b.api({op:'save',revision:s.revision,entry:{id:500118,autocasts:[{...cast('MG_COLDBOLT',10),manual:true}]}});
  files=await b.exportZip();
  let exported=text(files.get('item-repair-hub/db/when/zz_native_exports/item_db.yml'));
  assert.match(exported,/bonus5 bAutoSpell,"MG_FIREBOLT",10,500,BF_SHORT\|BF_WEAPON\|BF_NORMAL,1;/);
  assert.match(exported,/skill "MG_COLDBOLT",1,1;/);

  // 4. Turning one item off: Remove item drops only that row from the effects layer.
  s=await b.api({op:'list'});
  await b.api({op:'remove',revision:s.revision,id:491013});
  files=await b.exportZip();
  assert.deepEqual(ids(text(files.get(LAYER))),all.filter(id=>id!==491013));

  // 5. Switching the master off makes later edits start from the official script, and the exported default follows.
  const values=Object.fromEntries(b.manifest.settings.map(x=>[x.key,x.value]));
  await b.set({...values,fx_iro_effects:false});
  s=await b.api({op:'list'});
  await b.api({op:'save',revision:s.revision,entry:{id:500118,autocasts:[{...cast('MG_COLDBOLT',10),manual:true}]}});
  files=await b.exportZip();
  exported=text(files.get('item-repair-hub/db/when/zz_native_exports/item_db.yml'));
  assert.doesNotMatch(exported,/bAutoSpell,"MG_FIREBOLT"/);
  assert.equal(JSON.parse(text(files.get('item-repair-hub/mod.json'))).settings.find(x=>x.key==='fx_iro_effects').default,false);

  // 6. An old v2.4.x draft that ticked the retired test option still loads; the option is dropped and emits no Lua.
  const old={schema:1,revision:999,settings:{},worldSyncCompat:false,removedIds:[],entries:[
    {id:500118,enabled:true,restoreRefineEffects:true,autocasts:[cast('MG_COLDBOLT',10)]},
    {id:470349,enabled:true,restoreRefineEffects:true,autocasts:[]}]};
  b=await backend(old);
  s=await b.api({op:'list'});
  assert(s.entries.every(e=>e.restoreRefineEffects===false));
  assert.equal(b.manifest.settings.find(x=>x.key==='fx_iro_effects').value,true);
  files=await b.exportZip();
  assert(![...files.keys()].some(k=>k.includes('custom-autocasts')),'no autocast Lua since v2.7.0');
  const migrated=text(files.get('item-repair-hub/db/when/zz_native_exports/item_db.yml'));
  assert.equal((migrated.match(/bonus5 bAutoSpell,"MG_COLDBOLT"/g)||[]).length,1);
  assert.doesNotMatch(migrated,/AB_JUDEX|WL_SUMMON|WL_TETRAVORTEX/);
  assert.match(text(files.get(LAYER)),/"ABC_FROM_THE_ABYSS",4,100,BF_SHORT\|BF_LONG\|BF_WEAPON\|BF_NORMAL,0;/);
  console.log('PASS: one master switch (<=40 settings) with 32 rows on by default; World Sync compat keeps the layer; player edits build on the iRO script; Remove item drops only that row; master off restores the official baseline; old test-option drafts migrate without Lua.');
})().catch(e=>{console.error(e);process.exitCode=1;});
