/* LifeQuest V77 · the live world remains owned by the original Phaser scene. */
(() => {
  'use strict';
  const regions = {
    'english-town':'town', 'mining-town':'mine', 'art-district':'art', 'tech-co':'tech',
    'old-oriaris':'oriaris', 'english-town-past':'oriaris', 'wish-valley':'wish',
    'vocalt-greedy-land':'vocalt', 'oriaris-camp':'wish'
  };
  const accents = {town:0xe5cc92, art:0xeeb4cf, tech:0xa1e1dd, oriaris:0xeac479, wish:0xc0e1a1, vocalt:0xf9cc81, mine:0xeab576};
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = () => document.body;
  const current = () => window.__lifequestGetScene?.();
  const quality = () => root()?.dataset.lqQuality || 'medium';
  const still = () => root()?.dataset.lqReducedMotion === 'true' || (root()?.dataset.lqReducedMotion !== 'false' && media.matches);
  const region = (sc) => regions[sc?.area?.id] || (/^oriaris-trail/.test(sc?.area?.id) ? 'wish' : 'town');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const canvas = (w,h) => Object.assign(document.createElement('canvas'), {width:w, height:h});
  const ctx2d = node => node.getContext('2d', {willReadFrequently:true});
  const getName = n => String(n?.short || n?.name || n?.id || '');
  const atmosphere = sc => {
    const minute = (sc?.store?.game?.minutes ?? 720) % 1440;
    return minute < 330 || minute > 1139 ? 'night' : minute < 510 ? 'dawn' : minute > 954 ? 'dusk' : 'day';
  };
  let active = null;
  let cameraReturn = null;
  let careerModal = null;
  const cache = new WeakMap();

  function emotionFor(line) {
    const v = String(line?.reply || line || '');
    const map = [
      ['anxious', /\b(?:worried|worry|nervous|frightened|afraid for)\b/i],
      ['sad', /\b(?:miss (?:him|her|them)|sad|grief|sorry to hear|lost someone)\b/i],
      ['disappointed', /\b(?:disappoint|hoped for better|what a shame|such a pity)/i],
      ['stern', /\b(?:respectful|unkind|stop that|speak kindly|rude|enough of)\b/i],
      ['surprised', /\b(?:what a surprise|unexpected|really\?|didn't expect|goodness)\b/i],
      ['excited', /\b(?:incredible|amazing|brilliant|wonderful|can't wait|fantastic)\b/i],
      ['proud', /\b(?:proud|well earned|well done|you did it|masterpiece)\b/i],
      ['confused', /\b(?:puzzl|could you explain|what do you mean|say that again|not quite following)/i],
      ['skeptical', /\b(?:are you sure|really think|not convinced|doubt)\b/i],
      ['thinking', /\b(?:perhaps|let me think|wonder|might mean|suppose|maybe)\b/i],
      ['focused', /\b(?:first|next step|carefully|focus|look closely)\b/i],
      ['happy', /\b(?:delighted|thank|happy|glad|welcome|lovely|nice to)\b/i],
      ['calm', /\b(?:peace|calm|breathe|quiet|no hurry|take your time)\b/i],
      ['curious', /\?\s*$/]
    ];
    return map.find(([,pattern])=>pattern.test(v))?.[0] || 'neutral';
  }

  function resolveSource(sc, npc, actor) {
    if (!sc || !npc) return null;
    const id = npc.id || npc.def?.id;
    const unit = actor || npc.sprite && npc || sc.npcs?.find(n=>n.def?.id === id);
    const sprite = unit?.sprite || unit?.image;
    const key = String(sprite?.texture?.key || '');
    const front = key.replace(/_(?:up|left|right|down|dside|uside|side)_\d+$/, '_down_0');
    const keys = ['ch_' + id + '_down_0', 'lq19_' + id + '_down_0', 'lq21_royal_' + id + '_down_0', front, key];
    for (const k of keys) {
      if (!k || k.startsWith('__') || !sc.textures?.exists(k)) continue;
      const source = sc.textures.get(k).getSourceImage();
      if (source?.width && source?.height) return {source,key:k,standard:k.startsWith('ch_')};
    }
    if (!unit?.graphics?.commandBuffer?.length) return null;
    // Wish Valley draws each citizen into their own world-space vector display
    // object. Replay those exact draw commands into a small local canvas once.
    const frame = canvas(48,68);
    const g = sc.make.graphics({x:0,y:0,add:false},false);
    try {
      g.translateCanvas(24-Math.round(unit.x),46-Math.round(unit.y));
      for (const value of unit.graphics.commandBuffer) g.commandBuffer.push(value);
      g.generateTexture(frame,48,68);
      return {source:frame,key:'vector/' + sc.area.id + '/' + id,standard:false};
    } finally { g.destroy(); }
  }

  function bust(sc,npc,actor) {
    const source = resolveSource(sc,npc,actor);
    if (!source) return null;
    let byKey = cache.get(sc);
    if (!byKey) { byKey = new Map(); cache.set(sc,byKey); }
    if (byKey.has(source.key)) return byKey.get(source.key);
    const raw = source.source;
    const sw = raw.width || 24, sh = raw.height || 38;
    const read = canvas(sw,sh), r = ctx2d(read);
    r.drawImage(raw, 0, 0);
    const rgba = r.getImageData(0,0,sw,sh).data;
    let top=sh, left=sw, right=0, bottom=0;
    for(let y=0;y<sh;y++) for(let x=0;x<sw;x++) {
      if(rgba[(y*sw+x)*4+3]<150) continue;
      left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
    }
    if(right<=left || bottom<=top) return null;
    const isStandard=source.standard && sw === 24;
    const end = Math.min(sh, isStandard ? 27 + Math.max(0,sh-38) : top+Math.ceil((bottom-top+1)*.72));
    const cropHeight = end-top;
    const w=right-left+1, portrait = canvas(w*2+10,cropHeight*2);
    const p = ctx2d(portrait); p.imageSmoothingEnabled=false;
    // Keep the source face, hair and accessories at their exact pixel proportions.
    // Gradually widen the lowest garment rows into a shoulder-length composition.
    for(let y=top;y<end;y++) {
      const spread = Math.round(5 * Math.max(0,(y-top)/cropHeight-.66)/.34);
      p.drawImage(raw,left,y,w,1,5-spread,(y-top)*2,w*2+spread*2,2);
    }
    const pix = (x,y) => Array.from(rgba.slice((y*sw+x)*4,(y*sw+x)*4+4));
    const pad = Math.max(0,sh-38);
    const skin = isStandard ? pix(12,16+pad) : null;
    const local = (x,y)=>[5+(x-left)*2,(y+pad-top)*2];
    const standardEyes = isStandard && [8,14].every(x=> {
      const eye=pix(x+1,14+pad);
      return eye[3]>210 && eye[0]+eye[1]+eye[2]+60<skin[0]+skin[1]+skin[2];
    });
    const mouth = isStandard ? pix(11,18+pad) : [];
    const animatedMouth = isStandard && Math.abs(mouth[0]-160)<9 && Math.abs(mouth[1]-81)<12 && Math.abs(mouth[2]-74)<12;
    const asset={portrait,skin,standardEyes,animatedMouth,local};
    if(byKey.size>=48) byKey.delete(byKey.keys().next().value);
    byKey.set(source.key,asset);
    return asset;
  }

  function paintFace(state,now) {
    const f=state.face;
    if(!f) return;
    const animate = quality()!=='low' && !still();
    const blink = animate && ((now-f.started+f.seed)%3960 < 150);
    const speaking = animate && now<state.speakingUntil;
    const openMouth = speaking && Math.floor(now/170)%3 === 1;
    const tag=[state.emotion,blink,openMouth].join('/');
    if(tag===f.last) return;
    f.last=tag;
    const {portrait,standardEyes,animatedMouth,skin,local} = f.asset;
    const p=f.ctx, mood=state.emotion;
    p.clearRect(0,0,f.node.width,f.node.height);p.drawImage(portrait,0,0);
    const skinInk=skin && 'rgb('+skin.slice(0,3).join(',')+')';
    const browInk=skin && 'rgb('+skin.slice(0,3).map(c=>Math.round(c*.55)).join(',')+')';
    if(standardEyes) for(const x of [8,14]) {
      const [ax,ay]=local(x,13);
      if(blink) {
        p.fillStyle=skinInk;p.fillRect(ax,ay,4,6);
        p.fillStyle=browInk;p.fillRect(ax,ay+3,4,1);
      }
      if(['curious','thinking','skeptical','confused','anxious','sad','stern','focused','proud','surprised','excited','disappointed'].includes(mood)) {
        const inner=x===8?ax+2:ax;
        const high=['curious','thinking','confused','surprised','excited'].includes(mood);
        p.fillStyle=browInk;p.fillRect(ax,ay-(high?3:1),4,1);
        if(mood==='stern'||mood==='focused'||mood==='skeptical') p.fillRect(inner,ay,2,1);
        if(mood==='anxious'||mood==='sad'||mood==='disappointed') p.fillRect(inner,ay-2,2,1);
      }
    }
    if(animatedMouth) {
      const [ax,ay]=local(11,18);
      p.fillStyle='#9f514a';
      if(openMouth) {p.fillRect(ax,ay,4,3);p.fillStyle='#d78478';p.fillRect(ax+1,ay+2,2,1);}
      else if(['happy','excited','proud'].includes(mood)){p.fillRect(ax-1,ay-1,1,2);p.fillRect(ax+4,ay-1,1,2);}
      else if(mood==='surprised'){p.fillRect(ax+1,ay-1,2,4);}
      else if(['sad','anxious','disappointed'].includes(mood)){p.fillRect(ax,ay+2,1,1);p.fillRect(ax+3,ay+2,1,1);}
    }
    f.node.dataset.mood=mood;
    f.node.classList.toggle('lq77-speaking',speaking);
    f.node.style.setProperty('--lq77-tilt',/curious|thinking|confused/.test(mood)?'-2deg':mood==='skeptical'?'2deg':'0deg');
  }

  function portraitStill(host,npc,sc=current()) {
    const asset=sc&&npc&&bust(sc,npc);
    if(!asset) return false;
    const node=canvas(asset.portrait.width,asset.portrait.height);
    ctx2d(node).drawImage(asset.portrait,0,0);
    host.replaceChildren(node);
    return true;
  }
  function mountPortrait(host,npc,sc=current(),actor) {
    if(!host || !npc || !sc) return false;
    host.setAttribute('data-lq77-portrait','');
    const def=npc.def || npc;
    const asset=bust(sc,def,actor || active?.actor);
    host.querySelector('.lq77-sprite-portrait')?.remove();
    if(!asset) return false;
    const node=canvas(asset.portrait.width,asset.portrait.height);
    node.className='lq77-sprite-portrait';
    node.setAttribute('role','img');node.setAttribute('aria-label',getName(def));
    host.appendChild(node);
    const face={node,ctx:ctx2d(node),asset,started:performance.now(),last:null,seed:[...getName(def)].reduce((s,ch)=>s+ch.charCodeAt(0),0)};
    const state=active || {emotion:'neutral',speakingUntil:0};
    state.face=face;paintFace(state,performance.now());
    return true;
  }

  function cameraState(sc) {
    const camera=sc.cameras?.main;
    if(!camera || camera._follow!==sc.player || !camera.followOffset || !camera.useBounds) return null;
    return {camera,zoom:camera.zoom,offsetX:camera.followOffset.x,offsetY:camera.followOffset.y,weight:0};
  }
  function cameraTick(state,dt) {
    const view=state.view, actor=state.actor;
    if (!view || !actor || view.camera._follow!==state.sc.player) return;
    const cam=view.camera, player=state.sc.player, p=actor.sprite || actor.image || actor;
    const target=state.mode==='quick' || still() || quality()==='low' ? 0 : 1;
    if(target===0 && view.weight===0) return;
    view.weight+=clamp(target-view.weight,-dt/420,dt/420);
    const w=view.weight*view.weight*(3-2*view.weight);
    if(cam.zoomEffect?.isRunning || cam.panEffect?.isRunning) return;
    const zoom=1+(quality()==='high'?.075:.04)*w;
    const x=clamp((p.x-player.x)*.46,-54,54);
    const y=clamp((p.y-player.y)*.46,-42,42)+Math.min(104,cam.height*.155)/view.zoom;
    cam.setZoom(view.zoom*zoom);
    cam.setFollowOffset(view.offsetX-x*w,view.offsetY-y*w);
  }
  function stopReturn(restore) {
    if(!cameraReturn) return;
    const {sc,view,tick}=cameraReturn;
    sc.events.off('postupdate',tick);
    if(restore && view.camera?._follow===sc.player) {
      view.camera.setZoom(view.zoom);
      view.camera.setFollowOffset(view.offsetX,view.offsetY);
    }
    cameraReturn=null;
  }
  function returnCamera(state,immediate) {
    const {view,sc}=state;
    if(!view || view.camera._follow!==sc.player || sc.area!==state.area || sc.inside!==state.inside) return;
    const c=view.camera, z=c.zoom, ox=c.followOffset.x,oy=c.followOffset.y;
    if(immediate || still() || view.weight===0 || !sc.sys?.isActive()) {
      c.setZoom(view.zoom);c.setFollowOffset(view.offsetX,view.offsetY);return;
    }
    let elapsed=0;
    const tick=(time,delta)=>{
      if(sc.area!==state.area || sc.inside!==state.inside || sc.switching || c._follow!==sc.player) {stopReturn(false);return;}
      elapsed+=Math.min(80,delta||16);
      const k=1-Math.pow(1-Math.min(1,elapsed/300),3);
      c.setZoom(z+(view.zoom-z)*k);c.setFollowOffset(ox+(view.offsetX-ox)*k,oy+(view.offsetY-oy)*k);
      if(k===1) stopReturn(false);
    };
    cameraReturn={sc,view,tick};sc.events.on('postupdate',tick);
  }

  function groundLight(state,time) {
    const g=state.fx,p=state.actor?.sprite || state.actor?.image || state.actor;
    if(!g||!p) return;
    g.clear();if(p.visible===false) return;
    const x=Math.round(p.x), y=Math.round(p.y+3*(p.scaleY||1)),tone=accents[state.region];
    const k=Math.max(1,Math.min(2,p.scaleX||1));
    // Two fine warm brackets at the speaker's feet. No tint on the map sprite.
    const r=v=>Math.round(v*k);
    g.fillStyle(0x302e27,.32);
    g.fillEllipse(x,y+r(1),r(31),r(7));
    g.fillStyle(tone,.87);
    for(const side of [-1,1]){
      g.fillRect(x+(side<0?-r(15):r(12)),y-1,r(4),r(2));
      g.fillRect(x+(side<0?-r(12):r(8)),y+r(1),r(4),r(1));
    }
    if(still() || quality()==='low' || state.mode==='quick') return;
    const count=quality()==='high'?9:4;
    const night=state.light==='night',inRoom=!!state.sc.inside,leaf=state.region==='wish'&&!inRoom;
    const colors=state.region==='art'?[0xfabf88,0xdbaac2,0xaddbd6]:
      leaf?[0xadc982,0xd8de9d,0x8db994]:[tone,0xffe7b3,0xd5b987];
    for(let i=0;i<count;i++){
      const phase=(time*.00013*(.76+(i%3)*.21)+i*.618)%1;
      const dx=Math.sin(i*7.13+phase*4)*11;
      const px=Math.round(x+(i*47%158)-79+dx);
      const py=Math.round(y-10-(i*29%74)+(leaf?phase:1-phase)*27);
      const alpha=Math.sin(phase*Math.PI)*(.24+(night?.24:.09));
      g.fillStyle(colors[i%3],alpha);
      if(leaf){g.fillRect(px,py,4,1);g.fillRect(px+1,py+1,2,1);}
      else {g.fillRect(px,py,i%4===0?2:1,1);if(night&&i%4===0)g.fillRect(px,py-1,1,3);}
    }
  }

  function positionBubble(state) {
    if(!state.bubble) return;
    const a=state.actor, sprite=a?.sprite||a?.image||a;
    const cam=state.sc.cameras.main, gameCanvas=state.sc.sys.game.canvas;
    if(!sprite || sprite.visible===false || !gameCanvas) {state.bubble.hidden=true;return;}
    const worldY=sprite.getTopCenter ? sprite.getTopCenter().y : sprite.y-36;
    const box=state.canvasRect || (state.canvasRect=gameCanvas.getBoundingClientRect());
    const world=cam.worldView, scalerX=box.width/state.sc.scale.width, scalerY=box.height/state.sc.scale.height;
    const x=box.left+(cam.x+(sprite.x-world.x)*cam.zoom)*scalerX;
    const y=box.top+(cam.y+(worldY-world.y)*cam.zoom)*scalerY-14;
    const node=state.bubble, half=node.offsetWidth/2, height=node.offsetHeight;
    const bx=clamp(x,Math.max(8,box.left)+half,Math.min(innerWidth-8,box.right)-half);
    const by=Math.max(height+10,y);
    node.hidden=x<box.left||x>box.right||y>box.bottom;
    node.style.left=Math.round(bx)+'px';node.style.top=Math.round(by)+'px';
    node.style.setProperty('--lq77-tail',clamp(x-bx+half,12,half*2-12)+'px');
  }
  function quick(text,duration) {
    const state=active;
    if(!state || !String(text||'').trim()) return false;
    clearTimeout(state.bubbleTimer);
    if(!state.bubble){
      const el=document.createElement('aside');el.className='lq77-world-bubble';el.setAttribute('role','status');
      document.body.appendChild(el);state.bubble=el;state.canvasRect=null;
    }
    state.bubble.textContent=String(text);state.bubble.hidden=false;positionBubble(state);
    state.bubbleTimer=setTimeout(()=>{state.bubble?.remove();state.bubble=null;},clamp(Number(duration)||6200,1200,30000));
    return true;
  }
  function faceTowards(face,dx,dy) {
    if(!face || typeof face!=='object' || Math.abs(dx)+Math.abs(dy)<1) return;
    const ax=Math.abs(dx),ay=Math.abs(dy);
    face.dir=ay<ax*.4?'side':ax<ay*.4?(dy<0?'up':'down'):(dy<0?'uside':'dside');face.flip=dx<0;
  }
  function close(immediate=false) {
    const s=active;if(!s) return;
    active=null;
    s.sc.events?.off('postupdate',s.tick);s.sc.events?.off('shutdown',s.shutdown);
    s.sc.scale?.off('resize',s.resize);window.removeEventListener('resize',s.resize);
    clearTimeout(s.bubbleTimer);s.bubble?.remove();s.fx?.destroy();
    root()?.removeAttribute('data-lq77-world-dialogue');
    returnCamera(s,immediate===true);
  }
  function update({npc,scene,mode,reply,actor,mood}={}) {
    const sc=scene || active?.sc || current();
    const def=npc?.def || npc || active?.npc;
    if(!sc || !def || !sc.player || !sc.events) return;
    const identity=def.id || getName(def);
    if(active && (active.sc!==sc || active.id!==identity || sc.area!==active.area)) close(true);
    if(!active){
      stopReturn(true);
      const a=actor || (npc?.sprite?npc:sc.npcs?.find(n=>n.def?.id===identity));
      const state={id:identity,sc,npc:def,actor:a,area:sc.area,inside:sc.inside,mode:mode||'deep',region:region(sc),
        light:atmosphere(sc),emotion:'neutral',speakingUntil:0,view:a?cameraState(sc):null,lastDraw:-Infinity,lastLight:0};
      active=state;
      if(a) {
        const p=a.sprite || a.image || a;
        faceTowards(sc.pFace,p.x-sc.player.x,p.y-sc.player.y);
        faceTowards(a.face,sc.player.x-p.x,sc.player.y-p.y);
        state.fx=sc.add.graphics().setDepth((p.depth || 9)-.005);
      }
      state.resize=()=>{state.canvasRect=null;};
      state.shutdown=()=>close(true);
      state.tick=(time,dt)=>{
        if(active!==state) return;
        if(sc.area!==state.area || sc.inside!==state.inside || sc.switching){close(true);return;}
        cameraTick(state,Math.min(64,dt||16));
        if(time-state.lastDraw>=(quality()==='low'?260:85)){
          state.lastDraw=time;
          if(time-state.lastLight>2000){state.light=atmosphere(sc);root().dataset.lq77Light=state.light;state.lastLight=time;}
          groundLight(state,time);paintFace(state,performance.now());positionBubble(state);
        }
      };
      sc.events.on('postupdate',state.tick);sc.events.once('shutdown',state.shutdown);
      sc.scale?.on('resize',state.resize);window.addEventListener('resize',state.resize,{passive:true});
      root().dataset.lqRegion=state.region;root().dataset.lq77Light=state.light;root().dataset.lq77WorldDialogue='true';
    }
    if(mode) active.mode=mode;
    if(active.mode!=='quick' && active.bubble) {clearTimeout(active.bubbleTimer);active.bubble.remove();active.bubble=null;}
    if(reply) {
      const line=String(reply.reply||reply);
      const expressions={happy:'happy',sad:'sad',confused:'confused',amused:'happy',curious:'curious',disagreeing:'skeptical',worried:'anxious',formal:'focused',calm:'calm'};
      active.emotion=Object.hasOwn(expressions,mood)?expressions[mood]:emotionFor(reply);
      active.speakingUntil=performance.now()+clamp(line.length*38,650,3900);
      paintFace(active,performance.now());
    }
  }

  // Tech-Co, Vocalt, Wish Valley and Old Oriaris own their mission checks and
  // citizen choices. Frame the existing panel and keep its controls attached.
  const normalized = value => String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  let careerPanel=null;
  let careerResultObserver=null;
  function careerSpeaker(sc,panel) {
    const heading=panel.querySelector('h2')?.textContent?.trim() || '';
    const name=heading.split(' · ')[0].trim();
    const list=window.LQCareerWorlds?.ASSIGNMENTS?.[sc.area.id] || [];
    const task=list.find(t=>normalized(t.name)===normalized(name));
    const civilian=sc.__wvLiving?.dialogNpc;
    if(civilian && normalized(name)===normalized(civilian.name)) return {npc:civilian,actor:civilian};
    const children=sc.areaObjs || [];
    const look=window.LQV46CharacterCatalog?.find(t=>normalized(t.name)===normalized(name));
    const images=children.filter(s=>s?.active!==false && s?.visible!==false && s?.type==='Image' && s.texture);
    const liveKey=task && [ 'lq19_'+task.id+'_', 'lq21_royal_'+task.id+'_'];
    let image=liveKey && images.find(s=>liveKey.some(k=>s.texture.key.startsWith(k)));
    if(sc.area.id==='vocalt-greedy-land') {
      // Market addActor creates each image immediately before its own nameplate.
      // This also identifies itinerant citizens whose look is shared by others.
      const index=children.findIndex(s=>s?.type==='Text' && normalized(s.text.replace(/\s*✦\s*$/,''))===normalized(name));
      const candidate=children[index-1];
      if(candidate?.type==='Image' && /^lqv/i.test(candidate.texture?.key)) image=candidate;
    }
    if(!image && look) {
      const key=window.LQV46TextureForLook?.(look.id,'down',0);
      const family=key?.replace(/_down_0$/,'');
      if(family) image=images.filter(s=>s.texture.key.startsWith(family+'_')).sort((a,b)=>
        Math.hypot(a.x-sc.player.x,a.y-sc.player.y)-Math.hypot(b.x-sc.player.x,b.y-sc.player.y))[0];
    }
    if(!image && task && sc.area.id==='vocalt-greedy-land') {
      const x=(task.x+.5)*32,y=(task.y+.5)*32;
      image=images.find(s=>/^lqv/i.test(s.texture.key)&&Math.hypot(x-s.x,y-s.y)<6);
    }
    if(image) return {npc:task||{id:'vocalt-'+(look?.id??name),name},actor:{image}};
    if(task && sc.area.id==='wish-valley') {
      const x=(task.x+.5)*32,y=(task.y+.5)*32;
      const label=children.findIndex(s=>s?.type==='Text' && s.text.startsWith(name) && Math.abs(s.x-x)<2);
      const graphics=label>0 && children[label-1]?.type==='Graphics' ? children[label-1] : null;
      return {npc:task,actor:{x,y,graphics}};
    }
    return {npc:task || {id:'regional-'+name,name},actor:null};
  }
  function refreshCareer(modal) {
    const sc=current(),panel=modal.querySelector('section.panel, .panel');
    if(modal.hidden || !sc?.area || !panel) {
      if(careerPanel) {
        careerResultObserver?.disconnect();careerResultObserver=null;
        if(active?.career) close();
        careerPanel=null;delete root().dataset.lq77Career;
      }
      return;
    }
    if(panel===careerPanel) return;
    careerResultObserver?.disconnect();
    careerPanel=panel;
    const {npc,actor}=careerSpeaker(sc,panel);
    update({npc,scene:sc,mode:'story',actor,reply:panel.querySelector('.prompt')?.textContent});
    if(active) active.career=true;
    root().dataset.lq77Career='true';
    const art=document.createElement('div');art.className='lq77-career-art';
    art.setAttribute('data-lq77-portrait','');
    if(actor) mountPortrait(art,npc,sc,actor);
    if(!art.childElementCount) art.setAttribute('aria-hidden','true');
    const content=document.createElement('div');content.className='lq77-career-copy';
    const focused=panel.contains(document.activeElement) ? document.activeElement : null;
    while(panel.firstChild) content.appendChild(panel.firstChild);
    panel.append(art,content);
    if(focused) focused.focus({preventScroll:true});
    const result=content.querySelector('[aria-live], #wv-civ-result');
    if(result) {
      careerResultObserver=new MutationObserver(()=>{
        if(active?.career && result.textContent.trim()) update({npc,scene:sc,reply:result.textContent});
      });
      careerResultObserver.observe(result,{childList:true,characterData:true,subtree:true});
    }
  }
  function bindCareer() {
    const modal=document.getElementById('lq-career-dialog');
    if(!modal || careerModal===modal) return false;
    careerModal=modal;
    new MutationObserver(()=>refreshCareer(modal)).observe(modal,{attributes:true,attributeFilter:['hidden'],childList:true});
    refreshCareer(modal);return true;
  }
  function bootCareer() {
    if(bindCareer()) return;
    const observer=new MutationObserver(()=>{if(bindCareer()) observer.disconnect();});
    observer.observe(document.body,{childList:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bootCareer,{once:true});
  else bootCareer();
  window.LQ77World=Object.freeze({update,close,mountPortrait,portraitStill,quick,region,emotionFor});
})();
