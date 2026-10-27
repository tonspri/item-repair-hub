const fs=require('fs'),assert=require('assert/strict');
const root='mod/client/';
const source=fs.readFileSync(root+'editor/native-backend-v2.3.1.js','utf8');
const code=source.slice(source.indexOf('button.onclick=async()=>{')+'button.onclick='.length,source.lastIndexOf('\n  });')).replace(/;\s*$/,'');
(async()=>{for(const outcome of ['success','save-failure','export-failure']){const order=[],button={},status={},document={body:{},getElementById:()=>status};const window={HubSaveDraftForExport:async()=>{order.push('save');return outcome!=='save-failure';}};const exportZip=async()=>{order.push('export');if(outcome==='export-failure')throw Error('download failed');return {files:7};};const handler=Function('button','document','window','exportZip','return ('+code+')')(button,document,window,exportZip);await handler();assert.deepEqual(order,outcome==='save-failure'?['save']:['save','export']);assert.equal(button.disabled,false);assert.equal(document.body.inert,false);assert.match(status.textContent,outcome==='success'?/ZIP download requested/:outcome==='save-failure'?/no ZIP was exported/:/download failed/);}
const html=fs.readFileSync(root+'editor/index.html','utf8');const footer=html.match(/<footer>[\s\S]*?<\/footer>/)[0];assert.equal((footer.match(/<button /g)||[]).length,1);assert(footer.includes('Save &amp; Export'));assert(!fs.readFileSync(root+'index.js','utf8').includes('showDirectoryPicker'));console.log('PASS: single footer action; save precedes export; failed save prevents export; export failures restore controls; no folder picker');})().catch(e=>{console.error(e);process.exitCode=1;});





