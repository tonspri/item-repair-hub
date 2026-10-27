const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const root=path.resolve('mod'),ed=path.join(root,'client/editor');
async function loadWith(draft){
 const events={};
 const ctx={console,Map,Set,URL,Blob,TextEncoder,TextDecoder,Uint8Array,structuredClone,atob,btoa,setTimeout,clearTimeout,location:{href:'http://test/client/editor/index.html',origin:'http://test'},ItemRepairCompiler:require(path.join(ed,'compiler-v2.3.1.js')),HubCompat:require(path.join(ed,'compat-v2.3.1.js'))};
 ctx.window={addEventListener:(n,f)=>events[n]=f,parent:{postMessage:r=>queueMicrotask(()=>events.message({source:ctx.window.parent,origin:'http://test',data:{type:'irh-native-reply',id:r.id,value:r.op==='load'?{parameters:{},draft}:{saved:true}}}))}};
 ctx.fetch=async url=>{const u=new URL(String(url),'http://test/client/editor/');const bytes=fs.readFileSync(path.join(root,u.pathname));return {ok:true,json:async()=>JSON.parse(bytes),arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
 vm.runInNewContext(fs.readFileSync(path.join(ed,'native-backend-v2.3.1.js'),'utf8'),ctx);
 await ctx.window.modSettings.get();return ctx.window.modSettings.itemRepairs({op:'list'});
}
(async()=>{
 const fresh=await loadWith(null);assert.equal(fresh.entries.length,0);
 const draft={schema:1,revision:7,settings:{},removedIds:[450481],worldSyncCompat:true,entries:[{id:520062}]};
 const loaded=await loadWith(draft);assert.equal(loaded.revision,7);assert.equal(loaded.entries[0].id,520062);assert(loaded.removedIds.includes(450481));assert.equal(loaded.worldSyncCompat,true);
 assert(fs.readFileSync(path.join(root,'client/index.js'),'utf8').includes("api.preferences.get('editor-draft-v2.3.0'"));
 console.log('PASS: fresh seed and saved-draft precedence, removed items and compatibility retained; stable preference key. Simulated backend only.');
})().catch(e=>{console.error(e);process.exitCode=1;});
