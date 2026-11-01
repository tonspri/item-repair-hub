// Item Repair Hub v2.7.0: native game window and Save & Export workflow.
import {movableLauncher} from './launcher-v2.7.0.js';
export default function init(parameters,api){
  if(api?.version!==1)throw Error('Item Repair Hub requires Client API 1.');
  const win=api.ui.window({id:'item-repair-hub-editor',title:'Item Repair Hub',width:740,height:640,resizable:true});
  const frame=document.createElement('iframe');frame.src=new URL('./editor/index.html',import.meta.url).href;frame.title='Item Repair Hub editor';frame.style.cssText='width:100%;height:100%;border:0;display:block';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads');
  async function receive(event){
    if(event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.type!=='irh-native-request')return;
    const {id,op,value}=event.data;if(!Number.isSafeInteger(id)||id<1)return;
    try{
      let result;
      if(op==='load')result={parameters,draft:await api.preferences.get('editor-draft-v2.3.0',null)};
      else if(op==='save'){if(!value||value.schema!==1||!Array.isArray(value.entries)||JSON.stringify(value).length>1024*1024)throw Error('Invalid or oversized draft.');await api.preferences.set('editor-draft-v2.3.0',value);result={saved:true};}
      else if(op==='probe'){if(!Number.isSafeInteger(value)||value<1||value>2147483647)throw Error('Invalid item ID.');result=await api.server.request('irhprobe',String(value),{timeout:5000});}
      else if(op==='live'){if(typeof value!=='string'||value.length>200)throw Error('Invalid live request.');result=await api.server.request('irhapply',value,{timeout:6000});}
      // Names, descriptions and icons from the client's own item tables (Live changes, Included repairs).
      else if(op==='item'){if(!Array.isArray(value)||value.length>40||!value.every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid item list.');result=[];for(const id of value){let it=null,icon=null;try{it=api.items?await api.items.get(id):null;}catch{}try{icon=api.items?await api.items.icon(id):null;}catch{}result.push({id,name:typeof it?.name==='string'?it.name:null,description:Array.isArray(it?.description)||typeof it?.description==='string'?it.description:null,icon:typeof icon==='string'?icon:null});}}
      else throw Error('Unknown editor request.');
      frame.contentWindow.postMessage({type:'irh-native-reply',id,value:result},location.origin);
    }catch(e){frame.contentWindow.postMessage({type:'irh-native-reply',id,error:e.message||String(e)},location.origin);}
  }
  window.addEventListener('message',receive);win.body.style.cssText='padding:0;display:flex;flex-direction:column;overflow:hidden';frame.style.flex='1';frame.style.minHeight='0';win.body.append(frame);
  const button=document.createElement('button');button.textContent='Item Repairs';button.title='Open the repair draft/export editor';button.style.cssText='position:fixed;right:18px;bottom:28px;z-index:9000;padding:8px 12px;background:#173a46;color:white;border:1px solid #68d8cb;border-radius:5px;cursor:pointer';button.onclick=e=>{e.stopPropagation();win.toggle();};button.onpointerdown=e=>e.stopPropagation();document.body.append(button);
  button.title='Open Item Repair Hub';button.style.cssText='position:fixed;right:18px;bottom:28px;z-index:9000;font:11px Tahoma,sans-serif;padding:4px 8px;background:linear-gradient(#fff,#dbe4f5);color:#263e68;border:1px solid #9daed0;border-radius:3px;cursor:pointer';
  const stopLauncher=movableLauncher(button,api,()=>win.toggle());
  const dispose=()=>{stopLauncher();window.removeEventListener('message',receive);button.remove();win.hide();};api.cleanup(dispose);return dispose;
}
