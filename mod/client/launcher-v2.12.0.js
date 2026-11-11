// Item Repair Hub v2.12.0: the IRH badge launcher. Shown only in game, docked left of the RODEX icon, draggable.
// Ordinary client API only: map:enter / map:leave / exit, ui:append / ui:remove, preferences.
export const POSITION_KEY='launcher-position-v2';  // v1 held the old text button's corner spot; the badge starts by RODEX
const SIZE=40,GAP=4,FALLBACK={right:18,bottom:28};

export function badgeLauncher(api,toggle,pictures){
  const button=document.createElement('button');
  button.type='button';button.title='Item Repairs (drag to move; Escape menu resets it)';button.setAttribute('aria-label','Item Repairs');
  button.style.cssText=`position:fixed;z-index:9000;width:${SIZE}px;height:${SIZE}px;padding:0;margin:0;border:0;background:transparent no-repeat center/100% 100%;image-rendering:pixelated;cursor:grab;display:none;touch-action:none;user-select:none`;
  const picture=name=>{button.style.backgroundImage=`url("${pictures[name]}")`;};
  picture('rest');
  for(const name of Object.values(pictures)){const image=new Image();image.src=name;}  // no flicker on the first hover

  let inGame=false,disposed=false,saved=null,drag=null,moved=false,hover=false,rodex=null,timer=0;
  const clamp=(value,max)=>Math.max(0,Math.min(value,Math.max(0,max)));
  const visible=host=>{if(!host||!host.isConnected||host.style.display==='none')return null;const r=host.getBoundingClientRect();return r.width>0&&r.height>0?r:null;};
  const at=(x,y)=>Object.assign(button.style,{left:clamp(x,innerWidth-SIZE)+'px',top:clamp(y,innerHeight-SIZE)+'px',right:'auto',bottom:'auto'});
  function place(){
    if(drag||!inGame)return;
    if(saved){at(saved.x,saved.y);button.dataset.dock='saved';return;}
    const r=visible(rodex);
    if(r){at(r.left-GAP-SIZE,r.top+(r.height-SIZE)/2);button.dataset.dock='rodex';return;}
    Object.assign(button.style,{left:'auto',top:'auto',right:FALLBACK.right+'px',bottom:FALLBACK.bottom+'px'});button.dataset.dock='corner';
  }
  function show(on){
    inGame=on;button.style.display=on?'':'none';clearInterval(timer);timer=0;
    if(on){place();timer=setInterval(place,500);}  // RODEX can move with the window size or UI scale
  }

  Promise.resolve(api.preferences.get(POSITION_KEY,null)).then(value=>{if(!disposed&&!drag&&Number.isFinite(value?.x)&&Number.isFinite(value?.y)){saved={x:value.x,y:value.y};place();}}).catch(()=>{});
  api.on('ui:append',c=>{if(c?.name==='RodexIcon'){rodex=c.host||null;place();}});
  api.on('ui:remove',c=>{if(c?.name==='RodexIcon'&&(!c.host||c.host===rodex)){rodex=null;place();}});
  api.on('map:enter',()=>show(true));
  api.on('map:leave',()=>show(false),{replay:false});
  try{api.on('exit',()=>show(false),{replay:false});}catch{}  // absent in an older app

  button.addEventListener('pointerenter',()=>{hover=true;if(!drag)picture('hover');});
  button.addEventListener('pointerleave',()=>{hover=false;if(!drag)picture('rest');});
  button.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;event.stopPropagation();moved=false;picture('down');
    const r=button.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:r.left,top:r.top};button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;event.stopPropagation();
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!moved&&Math.hypot(dx,dy)<5)return;
    if(!moved){moved=true;picture(hover?'hover':'rest');button.style.cursor='grabbing';}
    at(drag.left+dx,drag.top+dy);
  });
  function finish(event){
    if(!drag||event.pointerId!==drag.id)return;event.stopPropagation();
    const r=button.getBoundingClientRect();drag=null;button.style.cursor='grab';picture(hover?'hover':'rest');
    if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);
    if(moved){saved={x:Math.round(r.left),y:Math.round(r.top)};at(saved.x,saved.y);button.dataset.dock='saved';
      Promise.resolve(api.preferences.set(POSITION_KEY,saved)).catch(()=>{button.title='Position could not be saved; drag again to retry';});}
  }
  button.addEventListener('pointerup',finish);button.addEventListener('pointercancel',finish);
  button.addEventListener('click',event=>{event.stopPropagation();if(moved){moved=false;return;}toggle();});
  addEventListener('resize',place);
  document.body.append(button);

  return {
    button,
    reset(){saved=null;place();return Promise.resolve(api.preferences.set(POSITION_KEY,null)).catch(()=>{});},
    dispose(){disposed=true;clearInterval(timer);removeEventListener('resize',place);button.remove();},
  };
}
