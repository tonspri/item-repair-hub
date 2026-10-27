/* Item Repair Hub v2.3.1 — contextual guide; no filesystem access. */
(() => {
  const card=document.createElement('section');card.className='repair-guide';card.setAttribute('aria-label','Repair assistant');
  const portrait=document.createElement('div');portrait.className='guide-portrait';
  const image=document.createElement('img');image.src='guide-character-v2.3.1.png';image.alt='Purple-haired repair assistant reading a book';portrait.append(image);
  const bubble=document.createElement('div');bubble.className='guide-bubble';
  const title=document.createElement('strong');title.textContent='Your repair assistant';
  const text=document.createElement('p');text.setAttribute('role','status');text.setAttribute('aria-live','polite');bubble.append(title,text);card.append(portrait,bubble);
  const tips={Classes:'Choose which class families may equip this item. Keep original preserves the existing repair. Job tiers controls access across job stages.',Transfer:'Allow or block trading and storage here. Keep original preserves existing rules. Consumables only need this tab.',Skills:'Choose an optional skill grant or attack autocast. Manual use uses bundled item scripts and may conflict with other script mods.',Add:'Enter an item ID, name or Divine Pride link, then click Add item. Select the item to edit its repair.'};
  let context='Classes',skillReminder='';
  function message(value,kind='tip'){text.textContent=value;card.dataset.kind=kind;}
  function showTip(){message(tips[context]+'\nWhen finished, use Save & Export, replace the installed mod folder with the ZIP contents, then Apply & restart.');}
  window.HubGuide={context(name){context=name;skillReminder='';showTip();},skill(value){skillReminder=value;message(value);},message,error(value){message('Export stopped: '+value+'\nNo ZIP was requested. Correct this and press Save & Export again.','error');},exported(filename){message('Download requested: '+filename+'\nCheck your browser/app download destination or any Save dialog. Then close Item Repairs, extract the ZIP, replace the installed item-repair-hub folder, and Apply & restart.','success');}};
  const tabs=document.querySelector('nav[aria-label="Repair collections"]');
  function place(){const adding=tabs?.firstElementChild?.getAttribute('aria-pressed')==='true';const host=document.querySelector(adding?'.custom-panel':'.workspace aside');if(host&&card.parentElement!==host)host.append(card);if(adding)context='Add';else context=document.querySelector('nav[aria-label="Item settings"] button[aria-pressed="true"]')?.textContent||'Classes';showTip();}
  if(tabs)new MutationObserver(place).observe(tabs,{attributes:true,subtree:true,attributeFilter:['aria-pressed']});
  new MutationObserver(()=>{const status=document.getElementById('status').textContent;if(/unsaved/i.test(status))message((skillReminder?skillReminder+'\n':'')+'You have changes to keep. Finish editing, then press Save & Export. Replace the installed mod folder with the exported ZIP contents before Apply & restart.','reminder');}).observe(document.getElementById('status'),{childList:true,subtree:true,characterData:true});
  document.addEventListener('change',event=>{if(event.target.id==='baseline-ack'&&event.target.checked){event.target.closest('label').classList.remove('needs-confirmation');message('Confirmation checked. Press Save & Export when your item changes are ready.');}});
  place();
})();
