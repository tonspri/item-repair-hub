// Item Repair Hub v2.3.1 — movable launcher; ordinary client preferences only.
export function movableLauncher(button,api,toggle){
  const key='launcher-position-v1';let point=null,drag=null,moved=false,disposed=false,positionChanged=false;
  const clamp=(value,max)=>Math.max(0,Math.min(value,Math.max(0,max)));
  function place(){if(!point)return;point={x:clamp(point.x,innerWidth-button.offsetWidth),y:clamp(point.y,innerHeight-button.offsetHeight)};Object.assign(button.style,{left:point.x+'px',top:point.y+'px',right:'auto',bottom:'auto'});}
  Promise.resolve(api.preferences.get(key,null)).then(saved=>{if(!disposed&&!positionChanged&&Number.isFinite(saved?.x)&&Number.isFinite(saved?.y)){point=saved;place();}}).catch(()=>{});
  button.style.touchAction='none';button.style.userSelect='none';button.style.cursor='grab';button.title='Click to open Item Repairs; drag to move';
  button.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;event.stopPropagation();positionChanged=true;moved=false;
    const rect=button.getBoundingClientRect();drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;event.stopPropagation();
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!moved&&Math.hypot(dx,dy)<5)return;
    moved=true;button.style.cursor='grabbing';point={x:drag.left+dx,y:drag.top+dy};place();
  });
  function finish(event){
    if(!drag||event.pointerId!==drag.id)return;event.stopPropagation();drag=null;button.style.cursor='grab';
    if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);
    if(moved&&point)Promise.resolve(api.preferences.set(key,point)).catch(()=>{button.title='Position could not be saved; drag again to retry';});
  }
  button.addEventListener('pointerup',finish);button.addEventListener('pointercancel',finish);
  button.onclick=event=>{event.stopPropagation();if(moved){moved=false;return;}toggle();};
  window.addEventListener('resize',place);
  return ()=>{disposed=true;window.removeEventListener('resize',place);};
}
