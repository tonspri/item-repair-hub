const assert=require('assert/strict'),fs=require('fs');
const r='../mod/client/editor/';
const c=require(r+'compiler-v2.9.0.js').create(require(r+'skills-v1.7.0.json'));
const item=require(r+'items-v1.7.4.json').find(i=>i.id===500118);
const choice={skill:'MO_TRIPLEATTACK',level:10,chance:5,trigger:'both',target:'auto',enabled:false,manual:false,passive:true,minRefine:12};
const e=c.validateEntry({id:item.id,autocasts:[choice]},item);
assert(c.compile([e]).includes('if (getrefine() >= 12) skill "MO_TRIPLEATTACK",10,1;'));
assert(!c.compileLua([e]).includes('c:cast'));
assert.throws(()=>c.validateEntry({id:item.id,autocasts:[{...choice,enabled:true}]},item),/Passive while equipped/);
assert.throws(()=>c.validateEntry({id:item.id,autocasts:[{...choice,skill:'MG_COLDBOLT'}]},item),/not supported/);
const folder=require('path').resolve(__dirname,r);
for(const name of fs.readdirSync(folder).filter(n=>/\.(js|html|css)$/.test(n))){
 const t=fs.readFileSync(require('path').join(folder,name),'utf8');
 assert(!/[\u00c2\ufffd]|\u00e2\u20ac/.test(t),'Encoding corruption: '+name);
}
console.log('PASS native passive grant with refine, no ordinary autocast, invalid modes blocked, UI encoding scan');
