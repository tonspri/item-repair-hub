const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve('mod'),ed=path.join(root,'client/editor'),events={};let saved,files,fail=false;
const ctx={console,Map,Set,URL:class extends URL{static createObjectURL(){return 'blob:test';}static revokeObjectURL(){}},Blob,TextEncoder,TextDecoder,Uint8Array,structuredClone,atob,btoa,setTimeout:(f,t)=>t===60000?0:setTimeout(f,t),clearTimeout,location:{href:'http://test/client/editor/index.html',origin:'http://test'},ItemRepairCompiler:require(path.join(ed,'compiler-v2.7.0.js')),HubCompat:require(path.join(ed,'compat-v2.7.0.js')),HubZip:{pack:f=>{files=f;return new Uint8Array([1]);}},document:{getElementById:()=>({checked:true}),body:{append(){}},createElement:()=>({click(){},remove(){}})}};
ctx.window={addEventListener:(n,f)=>events[n]=f,parent:{postMessage:r=>queueMicrotask(()=>events.message({source:ctx.window.parent,origin:'http://test',data:{type:'irh-native-reply',id:r.id,...(r.op==='save'&&fail?{error:'simulated persistence failure'}:{value:r.op==='load'?{parameters:{},draft:null}:(saved=r.value,{saved:true})})}}))}};
ctx.fetch=async url=>{const u=new URL(String(url),'http://test/client/editor/');const filename=path.join(root,u.pathname);const bytes=fs.readFileSync(filename);return {ok:true,json:async()=>JSON.parse(bytes),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
(async()=>{vm.runInNewContext(fs.readFileSync(path.join(ed,'native-backend-v2.7.0.js'),'utf8'),ctx);await ctx.window.modSettings.get();const api=ctx.window.modSettings.itemRepairs;
let state=await api({op:'list'});await api({op:'remove',id:450481,revision:state.revision});assert(saved.removedIds.includes(450481));await ctx.window.HubNative.exportZip();assert(![...files.keys()].some(k=>k.includes('lua/when/cocytus_base/')));for(const [k,v] of files)if(/^item-repair-hub\/db\/.*item_db.yml$/.test(k))assert(!/Id: 450481\b/.test(typeof v==='string'?v:new TextDecoder().decode(v)));
state=await api({op:'list'});fail=true;await assert.rejects(api({op:'remove',id:20939,revision:state.revision}),/persistence/);fail=false;assert(!(await api({op:'list'})).removedIds.includes(20939));
state=await api({op:'list'});await api({op:'save',entry:{id:450481},revision:state.revision});assert(!(await api({op:'list'})).removedIds.includes(450481));await ctx.window.HubNative.exportZip();{const raw=files.get('item-repair-hub/db/when/cocytus_base/item_db.yml'),row=typeof raw==='string'?raw:new TextDecoder().decode(raw);assert.match(row,/Id: 450481\b/);assert.equal((row.match(/bonus5 bAutoSpell,/g)||[]).length,2);}
state=await api({op:'list'});await api({op:'remove',id:450481,revision:state.revision});assert.equal((await api({op:'list'})).entries.length,0);
state=await api({op:'list'});
const casts=['MG_FIREBOLT','SM_MAGNUM','MG_COLDBOLT'].map((skill,i)=>({skill,enabled:true,manual:true,level:1,chance:10,trigger:'both',target:'auto',minRefine:i+10}));
await api({op:'save',revision:state.revision,entry:{id:500118,autocasts:casts,equipLevelMin:99}});
assert.equal(saved.entries.find(e=>e.id===500118).autocasts.length,3);
await ctx.window.HubNative.exportZip();
assert(![...files.keys()].some(k=>k.includes('custom-autocasts')),'no autocast Lua since v2.7.0');
// Agni Sword: the 3 custom rows sit in the IRH block; its iRO fix adds 2 more (+12 Fire Bolt and Magnum Break) after it.
const zz=files.get('item-repair-hub/db/when/zz_native_exports/item_db.yml'),block=zz.slice(zz.indexOf('IRH_TEMP_SKILL_BEGIN'),zz.indexOf('IRH_TEMP_SKILL_END'));
assert.equal((block.match(/bonus5 bAutoSpell,/g)||[]).length,3);
assert.equal((zz.match(/bonus5 bAutoSpell,/g)||[]).length,5);
assert.match(files.get('item-repair-hub/db/when/zz_native_exports/item_db.yml'),/EquipLevelMin: 99/);
console.log('PASS: real backend saves and exports all three skill rows and level setting.');
console.log('PASS: actual backend removal persists, removes built-in DB and Cocytus Lua in export, failed persistence rolls back, re-add restores templates, custom entry removed.');})().catch(e=>{console.error(e);process.exitCode=1;});


