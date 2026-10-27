/* Reviewed World Sync Extras v2.1.5 release: Jobs-only overrides. */
(function(root){
const ids=new Set([18189, 28769, 470349, 470443, 470468, 490876, 490877, 491057, 500118, 510024, 510025, 510222, 520062, 550169, 590109, 600055]);
function overlap(id,enabled){return enabled===true&&ids.has(Number(id));}
function choices(entry,enabled){if(!overlap(entry.id,enabled))return entry;return {...entry,tiers:'keep',families:Object.fromEntries(Object.keys(entry.families||{}).map(k=>[k,'keep'])),permissions:Object.fromEntries(Object.keys(entry.permissions||{}).map(k=>[k,'keep']))};}
function filterTable(text,enabled,removed=[]){
 const excluded=new Set([...(enabled?ids:[]),...removed]);
 if(!excluded.size)return text;
 const chunks=text.split(/(?=^  - Id: )/m),header=chunks.shift();
 const kept=chunks.filter(row=>!excluded.has(Number(row.match(/^  - Id: (\d+)/)?.[1])));
 return kept.length?header+kept.join(''):header.replace(/^Body:.*$/m,'Body: []');
}
const api={ids:[...ids],overlap,choices,filterTable};if(typeof module!=='undefined')module.exports=api;else root.HubCompat=api;
})(globalThis);
