/* Interviews are optional, bounded turns. Only the original chat awards quest progress. */
(() => {
  'use strict';
  const node = (tag,text) => {
    const el=document.createElement(tag);
    if (text) el.textContent=text;
    return el;
  };
  const short = def => String(def.name || def.id).replace(/\s*\([^)]*\)\s*$/, '');
  function guests(scene,lead,invited) {
    const actors=scene.npcs || [];
    const host=actors.find(a=>a.def?.id===lead.id);
    const point=host?.sprite || scene.player;
    if (!point) return [];
    return actors.filter(a=>a.def?.id && a.def!==lead && a.def.id!==lead.id && a.sprite?.visible && a.sprite.active!==false && !!a.inside===!!scene.inside)
      .map(a=>({def:a.def,dist:Math.hypot(a.sprite.x-point.x,a.sprite.y-point.y),fromPlayer:Math.hypot(a.sprite.x-scene.player.x,a.sprite.y-scene.player.y)}))
      .filter(a=>invited.has(a.def.id) || (a.dist<=150 && a.fromPlayer<=174))
      .sort((a,b)=>Number(invited.has(b.def.id))-Number(invited.has(a.def.id)) || a.dist-b.dist)
      .slice(0,3).map(a=>a.def);
  }
  function mount(parent,getSession){
    const box=node('details'), summary=node('summary','Interview'), cast=node('div'), choices=node('div'), guestList=node('fieldset'), legend=node('legend','Invite someone nearby');
    const history=node('div'), form=node('form'), question=node('input'), submit=node('button','Ask'), note=node('p');
    box.id='lq77-interview'; cast.className='lq77-cast'; choices.className='lq77-tools'; guestList.append(legend);
    history.className='lq77-interview-lines';history.setAttribute('role','log');history.setAttribute('aria-live','polite');
    question.type='text';question.maxLength=220;question.placeholder='Your interview question';question.setAttribute('aria-label',question.placeholder);
    submit.type='submit';note.className='lq77-interview-status';note.setAttribute('role','status');
    form.append(question,submit);box.append(summary,cast,guestList,choices,form,history,note);parent.append(box);
    let generation=0, turns=[], invited=new Set(), working=false;
    const drafts=['What do you do here?', 'Where are you from?', 'What do you like to do in your free time?'];
    for(const text of drafts){const button=node('button',text);button.type='button';button.addEventListener('click',()=>{question.value=text;question.focus();});choices.append(button);}
    function setBusy(value){working=value;submit.disabled=value;guestList.disabled=value;choices.inert=value;form.setAttribute('aria-busy',String(value));}
    function portraitStrip(scene,participants){
      cast.replaceChildren();
      for(const def of participants){
        const label=node('span'),head=node('span'), caption=node('span',short(def));head.className='lq77-cast-portrait';
        head.setAttribute('aria-hidden','true');if(window.LQ77World?.portraitStill(head,def,scene))label.append(head);
        label.dataset.speaker=def.id;label.append(caption);cast.append(label);
      }
    }
    function refresh(){
      const {scene,npc}=getSession(); if(!box.open||!npc||!scene)return;
      const near=guests(scene,npc,invited),ids=new Set(near.map(g=>g.id));
      invited=new Set([...invited].filter(id=>ids.has(id)));
      guestList.replaceChildren(legend);guestList.hidden=!near.length;
      for(const guest of near){
        const label=node('label'),check=node('input');check.type='checkbox';check.checked=invited.has(guest.id);
        check.addEventListener('change',()=>{if(check.checked)invited.add(guest.id);else invited.delete(guest.id);portraitStrip(scene,[npc,...near.filter(g=>invited.has(g.id))]);});
        label.append(check,document.createTextNode(short(guest)));guestList.append(label);
      }
      portraitStrip(scene,[npc,...near.filter(g=>invited.has(g.id))]);
    }
    function reset(){
      generation++;turns=[];invited.clear();setBusy(false);box.open=false;question.value='';history.replaceChildren();cast.replaceChildren();note.textContent='';
    }
    box.addEventListener('toggle',()=>{if(box.open)refresh();else {generation++;setBusy(false);note.textContent='';}});
    function addLine(who,text,def){
      const row=node('div'),speaker=node('b',who),line=node('span',text);
      row.append(speaker,line);history.append(row);
      turns.push({who,text,id:def?.id || ''});
      while(turns.length>16){turns.shift();history.firstElementChild?.remove();}
      history.scrollTop=history.scrollHeight;
    }
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const prompt=question.value.trim();
      if(!prompt||working||!box.open)return;
      const {scene,chat,npc}=getSession();if(!chat||!npc)return;
      refresh();
      const sequence=++generation, sessionHistory=chat.history, room=scene.inside, area=scene.area;
      const current=()=>sequence===generation && box.open && chat.npc===npc && chat.history===sessionHistory && scene.area===area && scene.inside===room;
      const selected=[npc,...guests(scene,npc,invited).filter(n=>invited.has(n.id))];
      const historyBefore=turns.slice();addLine('You',prompt);
      setBusy(true);question.value='';
      try{
        const responseRound=[];
        for(const def of selected){
          if(!current())return;
          if(def!==npc && !guests(scene,npc,invited).some(g=>g.id===def.id))continue;
          for(const chip of cast.children)chip.classList.toggle('speaking',chip.dataset.speaker===def.id);
          note.textContent=short(def)+' is answering…';
          const mem=chat.store.get(def.id);
          const context={...chat.situation(def),memory:mem,prior:[],gossip:[],stranger:'none',interview:true};
          // The provider receives a speaker's own history. Other speakers remain attributed in the context.
          const previous=historyBefore.filter(t=>!t.id || t.id===def.id).slice(-6).map(t=>({role:t.id?'npc':'user',text:t.text}));
          const heard=responseRound.map(t=>t.who+' said: '+t.text).join('\n').slice(-900);
          const provider=chat.currentProvider;
          const spokenQuestion=heard && !/^offline/i.test(provider.label) ? 'Other speakers in this round:\n'+heard+'\nThe player asks you: '+prompt : prompt;
          const reply=await provider.respond(def,previous,spokenQuestion,true,context);
          if(!current())return;
          const line=String(reply?.reply || '').trim();
          if(!line)throw Error('Empty reply');
          addLine(short(def),line,def);responseRound.push({who:short(def),text:line,id:def.id});
        }
        note.textContent='';
      }catch{
        if(current()){
          note.textContent='The interview stopped before the next reply. Your question is ready to edit.';
          question.value=prompt;
        }
      } finally{
        if(current()){
          setBusy(false);for(const chip of cast.children)chip.classList.remove('speaking');
        }
      }
    });
    return {reset,refresh};
  }
  window.LQ77Interview=Object.freeze({mount});
})();
