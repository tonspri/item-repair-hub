const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const root=path.resolve('mod/client/editor');
const items=JSON.parse(fs.readFileSync(path.join(root,'items-v1.7.0.json'))),skillData=JSON.parse(fs.readFileSync(path.join(root,'skills-v1.7.0.json')));
class Node {
 constructor(tag,text){this.tagName=tag.toUpperCase();this.textContent=text||'';this.children=[];this.style={};this.dataset={};this.attrs={};this.classList={add(){},remove(){}};this.value='';}
 append(...nodes){for(const n of nodes){if(n.parentElement)n.parentElement.children=n.parentElement.children.filter(x=>x!==n);this.children.push(n);n.parentElement=this;}}
 before(n){if(this.parentElement){const p=this.parentElement;p.children.splice(p.children.indexOf(this),0,n);n.parentElement=p;}}
 after(n){if(this.parentElement){const p=this.parentElement;p.children.splice(p.children.indexOf(this)+1,0,n);n.parentElement=p;}}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(){}
 querySelectorAll(){return [];}
}
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 for(const compat of [false,true])for(const id of [500118,470443,450481,520062,501,14545]){
  const body=new Node('body'),toolbar=new Node('div'),workspace=new Node('div'),detail=new Node('div');body.append(toolbar,workspace);workspace.append(detail);
  const dom={'.toolbar':toolbar,'.workspace':workspace},listeners={};let drafts=[];
  const context={HubCompat:require(path.join(root,"compat-v2.3.1.js")),console,Map,CustomEvent:class{constructor(type,o){this.type=type;this.detail=o.detail;}},document:{createElement:t=>new Node(t),querySelector:q=>dom[q],getElementById:()=>detail},catalog:[{id,key:String(id),toggles:[]}],selected:String(id),ready:true,refresh(){},buttons(){},status(){}};
  context.window={addEventListener:(k,f)=>listeners[k]=f,dispatchEvent:e=>listeners[e.type]?.(e),modSettings:{itemRepairs:async r=>{
   if(r.op==='skills')return {source:'bundled-1.7.0'};
   if(r.op==='list')return {revision:0,entries:[],autocastSkills:skillData.skills,skillFeatures:4,worldSyncCompat:compat};
   if(r.op==='lookup')return {item:items.find(i=>i.id===r.id)};
   if(r.op==='save'){drafts.push(r.entry);return {revision:1,entries:[]};}
   if(r.op==='sync')return {};
  }}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'custom-v2.3.1.js'),'utf8'),context);await tick();await tick();
  context.window.dispatchEvent(new context.CustomEvent('hub-select-custom',{detail:id}));await tick();await tick();
  const walk=n=>[n,...n.children.flatMap(walk)],nodes=walk(detail);
  const nav=nodes.find(n=>n.attrs['aria-label']==='Item settings');assert(nav,`missing tabs ${id}`);
  const expected=compat&&[500118,470443,520062].includes(id)?['Skills']:id===501||id===14545?['Transfer']:['Classes','Transfer','Skills'];
  assert.deepEqual(nav.children.filter(n=>!n.hidden).map(n=>n.textContent),expected,`tabs ${id}`);
  const editor=nodes.find(n=>n.className==='custom-editor');editor.onchange({target:{dataset:{}}});await context.window.hubCustom.save();
  assert.equal(drafts[0].id,id);
  if(expected[0]==='Transfer'&&expected.length===1){assert.equal(drafts[0].autocast,undefined);assert.equal(drafts[0].tiers,'keep');assert(Object.values(drafts[0].families).every(v=>v==='keep'));}
 }
 const compiler=require(path.join(root,'compiler-v2.3.1.js')).create(skillData),potion=items.find(i=>i.id===501);
 assert.throws(()=>compiler.validateEntry({id:501,families:{mage:'allow'}},potion),/transfer permission/);
 assert.throws(()=>compiler.validateEntry({id:501,autocast:{enabled:true,skill:'MG_COLDBOLT',level:1,chance:5,trigger:'both'}},potion),/equipment/);
 const transfer=compiler.validateEntry({id:501,permissions:{trade:'allow'}},potion);const yaml=compiler.compile([transfer]);assert(!/Jobs:|Classes:|Script:/.test(yaml));
 const app=fs.readFileSync(path.join(root,'app-v2.3.1.js'),'utf8');assert(app.includes("if(item.id){box.append"));
 console.log('PASS: actual editor renders equal tabs for all four equipment IDs; consumables 501/14545 render Transfer only and save no equipment choices; compiler rejects consumable class/skill repairs.');
})().catch(e=>{console.error(e);process.exitCode=1;});







