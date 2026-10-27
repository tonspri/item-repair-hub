/* Item Repair Hub v2.3.1 */
(function(g){'use strict';const rules=[["trade","Trading","NoTrade"],["storage","Personal storage","NoStorage"],["guild","Guild storage","NoGuildStorage"],["cart","Cart","NoCart"],["mail","Mail","NoMail"]],pageSize=8;
function mode(v,prefix,code){return v[prefix+'_'+code+'_block']?'block':v[prefix+'_'+code+'_allow']?'allow':'keep';}
function choose(v,prefix,code,mode){if(!rules.some(r=>r[0]===code)||!['allow','block','keep'].includes(mode))throw Error('Invalid permission choice');const a=prefix+'_'+code+'_allow',b=prefix+'_'+code+'_block';if(!(a in v)||!(b in v))throw Error('Missing permission setting');v[a]=mode==='allow';v[b]=mode==='block';}
function keys(item){return [...item.toggles.map(t=>t.key),...(item.permissions?rules.flatMap(([c])=>[item.permissions+'_'+c+'_allow',item.permissions+'_'+c+'_block']):[])];}
function changed(item,v,saved){return keys(item).some(k=>v[k]!==saved[k]);}
function state(item,v){if(item.customEntry&&!(item.toggles||[]).length&&!item.permissions)return item.customEntry.enabled?'enabled':'disabled';const own=keys(item);return own.some(k=>v[k]===true)?'enabled':'disabled';}
function matches(item,query){const q=query.trim().toLowerCase();if(!q)return true;if(/^https?:/i.test(q)){try{const u=new URL(q),m=u.pathname.match(/^\/database\/item\/(\d+)(?:\/|$)/);return ['divine-pride.net','www.divine-pride.net'].includes(u.hostname)&&!!m&&(item.id===Number(m[1])||(item.affected||[]).includes(Number(m[1])));}catch{return false;}}return [item.name,item.id,item.aliases,...(item.affected||[])].join(' ').toLowerCase().includes(q);}
function list(catalog,v,saved,query,category,filter){return catalog.filter(i=>matches(i,query)&&(category==='all'||i.category===category||(i.categories||[]).includes(category))&&(filter==='all'||filter==='changed'&&changed(i,v,saved)||filter===state(i,v))).sort((a,b)=>a.name.localeCompare(b.name));}
function paginate(items,page,size=pageSize){const pages=Math.max(1,Math.ceil(items.length/size));page=Math.min(Math.max(0,page),pages-1);return {page,pages,items:items.slice(page*size,(page+1)*size),total:items.length};}
function same(a,b){const ks=new Set([...Object.keys(a),...Object.keys(b)]);return [...ks].every(k=>a[k]===b[k]);}
function migrate(values,catalog){const v={...values};let count=0;if(v.individual_permissions_ready!==true){for(const item of catalog){if(item.migratedPermissionKey){v[item.migratedPermissionKey]=v.legacy_trade===true;count++;}}v.individual_permissions_ready=true;}return {values:v,count};}
const api={migrate,rules,pageSize,mode,choose,keys,changed,state,matches,list,paginate,same};if(typeof module!=='undefined')module.exports=api;else g.HubModel=api;})(globalThis);



