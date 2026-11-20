(() => {
  'use strict';
  // The floating card and the Language tab share the same lookup result and save controls.
  function mount({study,log,tools,result,explain,showDialogue,invalidate}){
    const bubble=document.createElement('aside'), close=document.createElement('button'), toggle=document.createElement('button');
    bubble.id='lq77-floating-lens';bubble.hidden=true;bubble.setAttribute('role','dialog');bubble.setAttribute('aria-label','Word lens');
    close.type='button';close.className='lq77-lens-close';close.textContent='×';close.setAttribute('aria-label','Close word lens');
    toggle.type='button';toggle.textContent='Tap words in dialogue';toggle.setAttribute('aria-pressed','false');
    tools.append(toggle);bubble.append(close);document.body.append(bubble);
    let enabled=false, anchor=null, returnFocus=null;
    function hide(){
      if(bubble.hidden)return;
      bubble.hidden=true;anchor=null;
      invalidate();
      study.insertBefore(result,tools.nextSibling);
      result.hidden=true;
      if(bubble.contains(document.activeElement)) returnFocus?.focus?.({preventScroll:true});
    }
    function align(){
      if(!anchor||bubble.hidden)return;
      const vw=window.visualViewport?.width||innerWidth,vh=window.visualViewport?.height||innerHeight;
      const dx=window.visualViewport?.offsetLeft||0,dy=window.visualViewport?.offsetTop||0;
      const w=bubble.offsetWidth,h=bubble.offsetHeight, pad=9;
      bubble.style.left=Math.max(dx+pad,Math.min(dx+vw-w-pad,anchor.left+anchor.width/2-w/2))+'px';
      const above=anchor.top-h-8; const below=anchor.bottom+8;
      bubble.style.top=Math.max(dy+pad,Math.min(dy+vh-h-pad,above>=dy+pad?above:below))+'px';
    }
    function open(text,rect){
      if(!text.trim()||!rect)return;
      anchor=rect;returnFocus=log.closest('#chat')?.querySelector('.inrow input');
      bubble.append(result);bubble.hidden=false;
      const pending=explain(text);
      align();
      Promise.resolve(pending).then(()=>{if(!bubble.hidden)align();});
    }
    function tapped(e){
      if(e.target.closest('button') || !e.target.closest('.lq77-line'))return;
      const x=e.clientX,y=e.clientY;
      const pos=document.caretPositionFromPoint?.(x,y);
      const range=!pos && document.caretRangeFromPoint?.(x,y);
      const node=pos?.offsetNode||range?.startContainer, offset=pos?.offset??range?.startOffset;
      if(node?.nodeType!==Node.TEXT_NODE || !log.contains(node))return;
      for(const match of node.data.matchAll(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g)){
        if(offset<match.index||offset>match.index+match[0].length)continue;
        const word=document.createRange();word.setStart(node,match.index);word.setEnd(node,match.index+match[0].length);
        open(match[0],word.getBoundingClientRect());return;
      }
    }
    log.addEventListener('click',e=>{if(enabled)tapped(e);});
    log.addEventListener('dblclick',e=>{
      if(enabled || e.target.closest('button'))return;
      const sel=window.getSelection(),text=String(sel||'').trim().slice(0,150);
      if(text&&sel.rangeCount&&log.contains(sel.anchorNode))open(text,sel.getRangeAt(0).getBoundingClientRect());
      else tapped(e);
    });
    toggle.addEventListener('click',()=>{
      enabled=!enabled;toggle.setAttribute('aria-pressed',String(enabled));toggle.textContent=enabled?'Turn off word lens':'Tap words in dialogue';
      log.classList.toggle('lq77-word-mode',enabled);if(enabled)showDialogue();else hide();
    });
    close.addEventListener('click',hide);
    document.addEventListener('pointerdown',e=>{if(!bubble.hidden && !bubble.contains(e.target) && !e.target.closest('.lq77-line'))hide();},true);
    bubble.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();hide();}e.stopPropagation();});
    log.addEventListener('scroll',hide,{passive:true});
    window.addEventListener('resize',hide,{passive:true});
    window.visualViewport?.addEventListener('resize',align,{passive:true});
    const sizeObserver=new ResizeObserver(align);sizeObserver.observe(bubble);
    return {hide};
  }
  window.LQ77Lens=Object.freeze({mount});
})();
