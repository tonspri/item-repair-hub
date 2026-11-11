// Item Repair Hub v2.12.0: native game window and Save & Export workflow.
import {badgeLauncher} from './launcher-v2.12.0.js';
// v2.12.0: the window frame and sizes, as in Item Collection UI. The client writes its own width and height on the
// window at every drag, so the player's size wins with !important and never passes the screen.
const FRAME_STYLE=`
.frame { background: #dfe6fa; border: 1px solid #7f97d8; border-radius: 12px; box-shadow: 0 10px 34px rgba(36, 44, 96, .45); }
.title { height: 30px; padding: 0 8px 0 14px; border: 0; color: #fff; font-size: 13px; letter-spacing: .3px; text-shadow: 0 1px 2px rgba(30, 40, 110, .7);
    background: linear-gradient(90deg, #4f74d6, #7b9cec 55%, #b7a4ec); }
.close { width: 18px; height: 18px; border: 1px solid rgba(255, 255, 255, .8); border-radius: 50%; background: rgba(255, 255, 255, .22); color: #fff;
    line-height: 15px; transition: transform .14s ease, background .14s ease; }
.close:hover { background: #ef7f8f; transform: scale(1.12); }
.close:active { transform: scale(.92); }
.body { overflow: hidden; }
:host { width: min(var(--irh-w, 780px), calc(100vw - 8px)) !important; height: min(var(--irh-h, 620px), calc(100vh - 8px)) !important; }
.frame.moving { will-change: transform; }
`;
export const WINDOW_SIZES={small:[680,540],normal:[780,620],large:[920,700],largest:[1080,800]};
const DISPLAY_KEY='display-v1',LEVELS=['small','normal','large','largest'];
const cleanDisplay=v=>({window:LEVELS.includes(v?.window)?v.window:'normal',text:LEVELS.includes(v?.text)?v.text:'normal',image:LEVELS.includes(v?.image)?v.image:'normal'});
export default function init(parameters,api){
  if(api?.version!==1)throw Error('Item Repair Hub requires Client API 1.');
  // One draft per era. The server says which era runs once the player is on a map (the page loads before login).
  const draftKey=era=>era==='pre-renewal'?'editor-draft-pre-renewal-v2.8.0':'editor-draft-v2.3.0';
  const onMap=new Promise(resolve=>{try{api.on('map:enter',()=>resolve(),{replay:true});}catch{resolve();}});
  async function serverEra(){await onMap;try{const r=await api.server.request('irhprobe','era',{timeout:5000});return r==='OK|era|pre-renewal'?'pre-renewal':r==='OK|era|renewal'?'renewal':null;}catch{return null;}}
  const win=api.ui.window({id:'item-repair-hub-editor',title:'Item Repair Hub',width:780,height:620,resizable:false});
  // The frame's look and the player's window size (gear menu). The frame lives in the window's shadow root.
  const shadow=win.body.getRootNode();
  if(shadow!==document&&shadow.append){const style=document.createElement('style');style.textContent=FRAME_STYLE;shadow.append(style);}
  const frameBox=shadow.querySelector?.('.frame');
  shadow.querySelector?.('.title')?.addEventListener('pointerdown',event=>{if(event.target.closest?.('.close')||!frameBox)return;frameBox.classList.add('moving');const done=()=>{frameBox.classList.remove('moving');removeEventListener('pointerup',done);removeEventListener('pointercancel',done);};addEventListener('pointerup',done);addEventListener('pointercancel',done);});
  let display=cleanDisplay(null);
  const applyWindow=()=>{const [w,h]=WINDOW_SIZES[display.window];shadow.host?.style.setProperty('--irh-w',w+'px');shadow.host?.style.setProperty('--irh-h',h+'px');};
  applyWindow();
  Promise.resolve(api.preferences.get(DISPLAY_KEY,null)).then(v=>{display=cleanDisplay(v);applyWindow();}).catch(()=>{});
  const frame=document.createElement('iframe');frame.src=new URL('./editor/index.html',import.meta.url).href;frame.title='Item Repair Hub editor';frame.style.cssText='width:100%;height:100%;border:0;display:block';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads');
  async function receive(event){
    if(event.source!==frame.contentWindow||event.origin!==location.origin||event.data?.type!=='irh-native-request')return;
    const {id,op,value}=event.data;if(!Number.isSafeInteger(id)||id<1)return;
    try{
      let result;
      if(op==='load'){const era=await serverEra();result={parameters,era,draft:era?await api.preferences.get(draftKey(era),null):null};}
      else if(op==='draft'){if(value!=='renewal'&&value!=='pre-renewal')throw Error('Invalid era.');result=await api.preferences.get(draftKey(value),null);}
      else if(op==='save'){if(!value||value.schema!==1||!Array.isArray(value.entries)||JSON.stringify(value).length>1024*1024)throw Error('Invalid or oversized draft.');await api.preferences.set(draftKey(value.era),value);result={saved:true};}
      else if(op==='probe'){if(!Number.isSafeInteger(value)||value<1||value>2147483647)throw Error('Invalid item ID.');result=await api.server.request('irhprobe',String(value),{timeout:5000});}
      else if(op==='live'){if(typeof value!=='string'||value.length>200)throw Error('Invalid live request.');result=await api.server.request('irhapply',value,{timeout:6000});}
      // Names, descriptions and icons from the client's own item tables (Live changes, Included repairs).
      else if(op==='item'){if(!Array.isArray(value)||value.length>40||!value.every(n=>Number.isSafeInteger(n)&&n>0))throw Error('Invalid item list.');result=[];for(const id of value){let it=null,icon=null;try{it=api.items?await api.items.get(id):null;}catch{}try{icon=api.items?await api.items.icon(id):null;}catch{}result.push({id,name:typeof it?.name==='string'?it.name:null,description:Array.isArray(it?.description)||typeof it?.description==='string'?it.description:null,icon:typeof icon==='string'?icon:null});}}
      // The Support the author button: this one fixed link. The desktop app denies new windows; the editor then copies it.
      // Window, text and picture sizes from the gear menu: null reads them, an object saves them.
      else if(op==='display'){if(value!==null&&(typeof value!=='object'||Array.isArray(value)))throw Error('Invalid display choice.');if(value){display=cleanDisplay(value);applyWindow();await api.preferences.set(DISPLAY_KEY,display);}result={...display};}
      else if(op==='support'){let page=null;try{page=window.open('https://buymeacoffee.com/miisteryap','_blank');if(page)page.opener=null;}catch{}result={opened:!!page};}
      else throw Error('Unknown editor request.');
      frame.contentWindow.postMessage({type:'irh-native-reply',id,value:result},location.origin);
    }catch(e){frame.contentWindow.postMessage({type:'irh-native-reply',id,error:e.message||String(e)},location.origin);}
  }
  window.addEventListener('message',receive);win.body.style.cssText='padding:0;display:flex;flex-direction:column;overflow:hidden';frame.style.flex='1';frame.style.minHeight='0';win.body.append(frame);
  // The IRH badge: only in game, left of the RODEX icon, draggable (v2.12.0).
  const pictures={};for(const state of ['rest','hover','down'])pictures[state]=new URL(`./launcher-badge-${state}.png`,import.meta.url).href;
  const launcher=badgeLauncher(api,()=>win.toggle(),pictures);
  // Escape menu: open the editor, and put the badge back by RODEX. api.ui.menuButton is absent in an older app.
  const menu=[];
  if(typeof api.ui?.menuButton==='function'){
    const add=(name,title,onClick)=>{try{menu.push(api.ui.menuButton({background:`esc_irh_${name}_a.bmp`,hover:`esc_irh_${name}_b.bmp`,down:`esc_irh_${name}_c.bmp`,title,onClick}));}catch{}};
    add('open','Item Repairs',()=>win.toggle());
    add('reset','Reset Item Repairs icon',()=>launcher.reset());
  }
  const dispose=()=>{launcher.dispose();for(const off of menu){try{off?.();}catch{}}window.removeEventListener('message',receive);win.hide();};api.cleanup(dispose);return dispose;
}
