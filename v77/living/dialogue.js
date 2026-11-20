/* LifeQuest V77. The town scene continues to own the NPC, quest, speech and save lifecycle. */
(() => {
  'use strict';
  const settingsKey = 'lifequest-v77-dialogue-settings';
  const dayBookKey = 'v77DialogueNotes';
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const settings = { quality: 'medium', motion: 'system', typing: true };
  try {
    const saved = JSON.parse(localStorage.getItem(settingsKey) || '{}');
    if (['low', 'medium', 'high'].includes(saved.quality)) settings.quality = saved.quality;
    if (['system', 'reduce', 'full'].includes(saved.motion)) settings.motion = saved.motion;
    if (typeof saved.typing === 'boolean') settings.typing = saved.typing;
  } catch {}
  const regionNames = {
    town: 'English Town', art: 'Art District', tech: 'Tech-Co', oriaris: 'Old Oriaris',
    wish: 'Wish Valley', vocalt: 'Greedy Land', mine: 'The Mine'
  };
  const glosses = {
    bread: ['bánh mì', 'Food made by baking flour and water.', 'Could I have some fresh bread?', '/bred/'],
    town: ['thị trấn', 'A place where people live and work.', 'I am new in town.', '/taʊn/'],
    village: ['ngôi làng', 'A small community in the countryside.', 'Who lives in this village?', '/ˈvɪlɪdʒ/'],
    market: ['chợ', 'A place to buy and sell goods.', 'How do I get to the market?', '/ˈmɑːrkɪt/'],
    welcome: ['chào mừng', 'A greeting for someone who has just arrived.', 'Welcome to our town!', '/ˈwelkəm/'],
    coffee: ['cà phê', 'A drink made from roasted coffee beans.', 'I would like a coffee, please.', '/ˈkɔːfi/'],
    order: ['gọi món; đặt hàng', 'To ask for food, drink or goods.', 'May I order a cup of tea?', '/ˈɔːrdər/'],
    library: ['thư viện', 'A place where you can read and borrow books.', 'Is the library open today?', '/ˈlaɪbreri/'],
    borrow: ['mượn', 'To take something and return it later.', 'Could I borrow this map?', '/ˈbɑːroʊ/'],
    canvas: ['toan vẽ', 'Cloth stretched over a frame for painting.', 'I like the colors on this canvas.', '/ˈkænvəs/'],
    mural: ['tranh tường', 'A painting made on a wall.', 'Who painted this mural?', '/ˈmjʊrəl/'],
    rhythm: ['nhịp điệu', 'A pattern of sounds or beats.', 'The drums give the song its rhythm.', '/ˈrɪðəm/'],
    exhibition: ['triển lãm', 'A public display of work or objects.', 'When does the exhibition open?', '/ˌeksɪˈbɪʃən/'],
    meeting: ['buổi họp', 'A planned time to talk with other people.', 'Can we move our meeting?', '/ˈmiːtɪŋ/'],
    deadline: ['hạn chót', 'The latest time to finish something.', 'What is the deadline for this task?', '/ˈdedlaɪn/'],
    river: ['dòng sông', 'A natural flow of water across land.', 'Does this river lead to the village?', '/ˈrɪvər/'],
    waterfall: ['thác nước', 'Water falling from a height.', 'We heard the waterfall before we saw it.', '/ˈwɔːtərfɔːl/'],
    merchant: ['thương nhân', 'Someone who buys and sells goods.', 'Did the merchant give you a fair price?', '/ˈmɜːrtʃənt/'],
    price: ['giá tiền', 'The amount you pay for something.', 'Is this your best price?', '/praɪs/'],
    fortune: ['gia tài; số tiền rất lớn', 'A very large amount of money.', 'That coat costs a fortune.', '/ˈfɔːrtʃən/'],
    letter: ['lá thư', 'A written message sent to someone.', 'I delivered a letter to the guard.', '/ˈletər/'],
    messenger: ['người đưa tin', 'A person who carries messages.', 'The messenger is waiting at the gate.', '/ˈmesɪndʒər/'],
    ore: ['quặng', 'Rock containing a useful metal.', 'The miners found copper ore.', '/ɔːr/']
  };
  const subtextNotes = [
    [/costs? (?:a fortune|an arm and a leg)|rather steep|beyond my budget/i, 'High cost', 'Người nói có thể thấy giá quá cao hoặc muốn thương lượng.', 'That is more than I can spend.'],
    [/getting late|must be on my way|should let you go/i, 'Time to leave', 'Người nói có thể đang tìm cách kết thúc cuộc trò chuyện một cách lịch sự.', 'Perhaps we should say goodbye for now.'],
    [/had better days|been better/i, 'How someone feels', 'Người nói có thể đang trải qua một ngày khó khăn và chưa muốn kể chi tiết.', 'Today has been difficult.'],
    [/afraid (?:I|we)|wish I could/i, 'A softened response', 'Cách mở đầu này có thể làm cho lời từ chối hoặc tin không vui nhẹ nhàng hơn.', 'I would like to, but there may be a problem.'],
    [/if you (?:could|would)|would you mind|could you possibly/i, 'A polite request', 'Câu hỏi có thể là lời nhờ giúp đỡ. Hãy nhìn vào hành động được nhắc đến.', 'Could you help me with that?']
  ];
  function element(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }
  function action(label, id, handler) {
    const b = element('button', 'lq77-tool', label);
    b.type = 'button';
    if (id) b.id = id;
    if (handler) b.addEventListener('click', handler);
    return b;
  }
  function identified(tag, id) {
    const el = element(tag);
    el.id = 'lq77-' + id;
    return el;
  }
  function selectBox(id, options, onChange) {
    const input = identified('select', id);
    for (const [value, label] of Object.entries(options)) input.add(new Option(label, value));
    input.addEventListener('change', () => onChange(input.value));
    return input;
  }
  function settingRow(title, input) {
    const row = element('label', 'lq77-setting');
    row.htmlFor = input.id;
    row.append(element('span', '', title), input);
    return row;
  }
  function boot() {
    const root = document.getElementById('chat');
    if (!root || root.classList.contains('lq77-dialogue')) return;
    const find = (s) => root.querySelector(s);
    const name = find('.name'), goal = find('.goal'), log = find('.log'), input = find('.inrow input');
    const composer = find('.inrow'), hints = find('.npc-coach'), hintBar = find('.hint');
    const teacher = find('#teacher'), voice = find('#voice-toggle'), shop = find('#v10-npc-shop'), close = find('#chat-close');
    if (!name || !goal || !log || !input || !composer || !close) return;
    const viewport=window.visualViewport;
    if(viewport){
      const html=document.documentElement;
      function fitKeyboard(){
        const editing=document.activeElement?.matches('#chat :is(input,textarea),#lq-career-dialog textarea');
        const inset=Math.max(0,innerHeight-viewport.offsetTop-viewport.height);
        const raised=!!editing && viewport.scale===1 && inset>85;
        html.classList.toggle('lq77-keyboard',raised);
        if(raised){
          html.style.setProperty('--lq77-keyboard-inset',inset+'px');
          html.style.setProperty('--lq77-available-height',viewport.height+'px');
        }
      }
      viewport.addEventListener('resize',fitKeyboard,{passive:true});
      viewport.addEventListener('scroll',fitKeyboard,{passive:true});
      document.addEventListener('focusin',fitKeyboard);
      document.addEventListener('focusout',()=>requestAnimationFrame(fitKeyboard));
    }
    let scene, chat, npc, history, session = 0, lookupSequence = 0, mode = 'deep', tab = 'dialogue';
    let lastReply = '', hintStage = 0, currentAnimation, revealFrame = 0, pendingNote = null, visiblePast = 6;
    let confirmErase = false;
    const prepared = new WeakMap();
    const aside = identified('aside', 'aside'), portrait = identified('div', 'portrait');
    const region = identified('div', 'region'), role = identified('div', 'role'), activity = identified('div', 'activity');
    name.id = 'lq77-name';
    aside.append(region, portrait, name, role, activity);
    const main = identified('div', 'main'), top = identified('div', 'top'), tabs = identified('div', 'tabs');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Conversation pages');
    const views = {};
    for (const [key, label] of Object.entries({ dialogue: 'Dialogue', language: 'Language', memory: 'Memory' })) {
      const button = action(label, 'lq77-tab-' + key, () => showTab(key));
      button.setAttribute('role', 'tab');
      button.dataset.tab = key;
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const keys = Object.keys(views);
        let next = (keys.indexOf(key) + (event.key === 'ArrowLeft' ? 2 : 1)) % 3;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = 2;
        event.preventDefault();
        event.stopPropagation();
        showTab(keys[next]); tabs.children[next].focus();
      });
      tabs.append(button);
      const panel = identified('section', key === 'dialogue' ? 'dialogue-view' : key);
      panel.setAttribute('role', 'tabpanel'); panel.setAttribute('aria-labelledby', button.id);
      button.setAttribute('aria-controls', panel.id); views[key] = panel;
    }
    const options = action('Settings', 'lq77-options', () => showTab(tab === 'settings' ? 'dialogue' : 'settings'));
    options.title = 'Conversation settings'; options.setAttribute('aria-controls', 'lq77-settings');
    close.textContent = '×'; top.append(tabs, options, close);
    const send = action('Send', 'lq77-send', () => chat?.send());
    composer.append(send);
    input.setAttribute('aria-label', 'Your English reply');
    const quickActions = identified('div', 'quick-actions'), storyActions = identified('div', 'story-actions');
    const controls = identified('div', 'dialogue-actions'), reveal = action('Show full line', 'lq77-reveal', () => finishReveal());
    controls.className = quickActions.className = storyActions.className = 'lq77-tools';
    controls.append(reveal);
    if (shop) controls.append(shop);
    views.dialogue.append(goal, log, quickActions, storyActions, controls, composer);
    const study = views.language, tools = element('div', 'lq77-tools');
    const word = identified('input', 'lookup'); word.type = 'search'; word.maxLength = 150;
    word.placeholder = 'Word or phrase'; word.setAttribute('aria-label', 'Look up a word or phrase');
    const lookup = action('Look up', 'lq77-look-up', () => explain(word.value));
    const lookupForm = identified('form', 'lookup-form');
    lookupForm.addEventListener('submit', e => { e.preventDefault(); explain(word.value); });
    lookupForm.append(word, lookup);
    const lens = identified('div', 'lens-result'); lens.setAttribute('aria-live', 'polite'); lens.hidden = true;
    const lastMeaning = action('Explain last line', '', () => explain(lastReply));
    const decoder = action('Read the subtext', '', decode);
    const hintButton = action('Get a hint', 'lq77-hint', nextHint);
    const hintResult = identified('div', 'hint-result'); hintResult.className = 'lq77-note'; hintResult.hidden = true;
    tools.append(lastMeaning, decoder, hintButton);
    const languageNotes = identified('div', 'language-notes');
    study.append(lookupForm, tools, lens, hintResult, languageNotes);
    if (hints) {
      const choices = hints.querySelector('#npc-suggestions');
      choices?.addEventListener('click', event => {
        if (!event.target.closest('button')) return;
        showTab('dialogue'); input.focus();
      });
      study.append(hints);
    }
    const interview=window.LQ77Interview.mount(study,()=>({scene,chat,npc}));
    const floating=window.LQ77Lens.mount({study,log,tools,result:lens,explain,showDialogue:()=>showTab('dialogue'),invalidate:()=>{lookupSequence++;lookup.disabled=false;pendingNote=null;}});
    const memoryTools = element('div', 'lq77-tools');
    const remember = action('Save last line', 'lq77-save-line', saveLine);
    const memoryList = identified('div', 'memory-list');
    memoryTools.append(remember);
    const replay=document.getElementById('lq77-chat-replay');
    if(replay)memoryTools.append(replay);
    views.memory.append(memoryTools, memoryList);
    const preferences = identified('section', 'settings'); views.settings = preferences;
    preferences.setAttribute('aria-label', 'Conversation settings');
    const modeBox = selectBox('mode', { quick: 'Quick talk', deep: 'Deep conversation', story: 'Story dialogue' }, setMode);
    const quality = selectBox('quality', { low: 'Low', medium: 'Medium', high: 'High' }, v => { settings.quality = v; saveSettings(); });
    const motion = selectBox('motion', { system: 'Device setting', reduce: 'Reduced', full: 'Full motion' }, v => { settings.motion = v; saveSettings(); });
    const typing = selectBox('typing', { on: 'Animated', off: 'Instant' }, v => { settings.typing = v === 'on'; saveSettings(); });
    preferences.append(settingRow('Conversation mode', modeBox), settingRow('Visual detail', quality),
      settingRow('Motion', motion), settingRow('Dialogue text', typing));
    const connection=identified('div','connection');
    const connectionText=element('span','', ''), reconnect=action('Check connection','lq77-reconnect',async()=>{
      if(!chat) return;
      const source=chat, token=session;
      reconnect.disabled=true;connectionText.textContent='Checking game server…';
      try{await window.LQ77Learning.reconnect(source);}
      catch{}
      if(token===session && chat===source)connectionText.textContent=source.currentProvider.label;
      reconnect.disabled=false;
    });
    connection.append(connectionText,reconnect);preferences.append(connection);
    if (hintBar) {
      hintBar.replaceChildren();
      if (teacher) hintBar.append(teacher);
      if (voice) hintBar.append(voice);
      preferences.append(hintBar);
    }
    quality.value = settings.quality; motion.value = settings.motion; typing.value = settings.typing ? 'on' : 'off';
    function saveSettings(write = true) {
      if (write) try { localStorage.setItem(settingsKey, JSON.stringify(settings)); } catch {}
      document.body.dataset.lqQuality = settings.quality;
      document.body.dataset.lqReducedMotion = String(settings.motion === 'reduce' || (settings.motion === 'system' && reducedQuery.matches));
      if (!canAnimate()) finishReveal();
      window.dispatchEvent(new Event('lq77:preferences'));
    }
    function canAnimate() { return settings.typing && settings.quality !== 'low' && document.body.dataset.lqReducedMotion !== 'true'; }
    reducedQuery.addEventListener?.('change', () => saveSettings(false));
    saveSettings(false);
    main.append(top, views.dialogue, study, views.memory, preferences);
    root.append(aside, main); root.classList.add('lq77-dialogue');
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-labelledby', name.id);
    const usedKeyboard = (e) => {
      if (e.key === 'Escape' && chat?.isOpen) { e.preventDefault(); e.stopPropagation(); chat.close(); }
      else e.stopPropagation();
    };
    // The original text input handles its own English, microphone and Escape shortcuts.
    root.addEventListener('keydown', usedKeyboard);
    root.addEventListener('keyup', e => e.stopPropagation());
    function showTab(key) {
      if (!views[key]) return;
      floating.hide();
      if(key==='language')interview.refresh();
      tab = root.dataset.tab = key;
      for (const [k, view] of Object.entries(views)) view.hidden = k !== key;
      for (const b of tabs.children) {
        const active = b.dataset.tab === key;
        b.setAttribute('aria-selected', String(active)); b.tabIndex = active || key === 'settings' && b === tabs.firstChild ? 0 : -1;
      }
      options.setAttribute('aria-expanded', String(key === 'settings'));
      if(key==='settings' && chat)connectionText.textContent=chat.currentProvider.label;
      if (key === 'memory') renderMemory();
      if (key !== 'dialogue') finishReveal();
    }
    function setMode(value) {
      mode = root.dataset.mode = value; modeBox.value = value;
      quickActions.hidden = value !== 'quick'; storyActions.hidden = value !== 'story';
      if (!npc) return;
      window.LQ77World?.update({ scene, npc, mode });
      if (value === 'quick' && lastReply) window.LQ77World?.quick(lastReply);
    }
    function insertReply(text) { showTab('dialogue'); input.value = text; input.focus(); input.setSelectionRange?.(text.length, text.length); }
    quickActions.append(action('Ask directions', '', () => insertReply('Could you show me the way?')),
      action('Talk more', '', () => { setMode('deep'); input.focus(); }));
    function refreshCharacter() {
      if (!npc) return;
      const full = String(npc.name || npc.id);
      const parsed = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(full);
      const cleanName = parsed ? parsed[1] : full;
      if (name.textContent !== cleanName) name.textContent = cleanName;
      role.textContent = parsed?.[2] || npc.role || '';
      const current = chat.situation?.(npc);
      const active = current?.activity || '';
      if (activity.textContent !== active) activity.textContent = active;
      role.hidden = !role.textContent; activity.hidden = !active;
    }
    function getLatest() {
      const sc = window.__lifequestGetScene?.();
      return sc?.chat?.isOpen && root.style.display !== 'none' ? sc : null;
    }
    function checkSession() {
      const current = getLatest();
      if (current && current.chat.history === history && current.chat.npc === npc) return;
      if (!current && !npc) return;
      session++; lookupSequence++;
      interview.reset();
      floating.hide();
      finishReveal(); window.LQ77World?.close();
      scene = current; chat = current?.chat; npc = chat?.npc; history = chat?.history;
      root.toggleAttribute('data-lq77-open', !!npc);
      document.body.classList.toggle('lq77-in-dialogue', !!npc);
      if (!npc) return;
      lastReply = ''; pendingNote = null; hintStage = 0; visiblePast = 6; confirmErase = false;
      lens.hidden = hintResult.hidden = true; lens.replaceChildren(); hintResult.replaceChildren(); word.value = '';
      lookup.disabled = false; languageNotes.replaceChildren(); reveal.hidden = true;
      const slug = window.LQ77World?.region?.(scene, npc);
      region.textContent = scene.area?.name || regionNames[slug] || 'LifeQuest';
      refreshCharacter();
      const memory = chat.store?.mem?.[npc.id];
      const storyNPC = ['gusest', 'tombrown', 'morrow', 'rook', 'vex'].includes(npc.id);
      const defaultMode = memory?.goalDone ? 'quick' : storyNPC ? 'story' : 'deep';
      setMode(defaultMode); window.LQ77World?.mountPortrait(portrait, npc, scene);
      storyActions.replaceChildren();
      if (storyNPC) {
        const cue = {
          gusest: 'My lord, what happened in the village yesterday?', tombrown: 'What do you remember about home?',
          morrow: 'What does the wave on the old sign mean?', rook: 'What should I look for along the tracks?',
          vex: 'Who painted the signs near the workshop?'
        }[npc.id];
        storyActions.append(action('Ask about the story', '', () => insertReply(cue)));
      } else {
        storyActions.append(action('Ask about this place', '', () => insertReply('What story would you tell a newcomer about this place?')));
      }
      storyActions.append(action('Ask about their day', '', () => insertReply('What happened here earlier today?')));
      showTab('dialogue');
      for (const row of [...log.children]) processRow(row);
    }
    function finishReveal() {
      if (revealFrame) cancelAnimationFrame(revealFrame);
      revealFrame = 0;
      if (currentAnimation) {
        currentAnimation.node.data = currentAnimation.text;
        currentAnimation = null;
      }
      reveal.hidden = true;
    }
    function animate(span, text) {
      finishReveal();
      if (!text || !canAnimate() || tab !== 'dialogue' || mode === 'quick') return;
      const node = document.createTextNode('');
      span.replaceChildren(node);
      let count = 0, next = 0;
      currentAnimation = { node, text };
      reveal.hidden = false;
      const frame = time => {
        if (!node.isConnected || !npc) { finishReveal(); return; }
        if (time >= next) {
          count = Math.min(text.length, count + 3);
          node.data = text.slice(0, count);
          next = time + (/[,.!?;]$/.test(node.data) ? 75 : 16);
          if (count >= text.length) { finishReveal(); return; }
        }
        revealFrame = requestAnimationFrame(frame);
      };
      revealFrame = requestAnimationFrame(frame);
    }
    function processRow(row) {
      if (!npc || row.parentElement !== log) return;
      if ((row.matches('.fix') && /^✎/.test(row.textContent)) || row.matches('.voc-badge,.natural-alt,.wcard')) {
        // Keep native suggestion and pronunciation handlers attached to the original nodes.
        languageNotes.append(row);
        if (row.matches('.wcard')) showTab('language');
        if (row.matches('.voc-badge')) {
          const term = /type \?([^\s,;:)]+)/i.exec(row.textContent)?.[1];
          if (term) {
            row.tabIndex = 0; row.setAttribute('role', 'button');
            row.onclick = () => explain(term);
            row.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); explain(term); } });
          }
        }
        return;
      }
      if (!row.matches('.npc')) return;
      const directSpan = row.querySelector(':scope > .lq77-line');
      if (directSpan && prepared.get(row) === directSpan) return;
      const moodChip=row.querySelector(':scope > .lq77-mood');
      const content = [...row.childNodes].filter(n => n.nodeType === 3 || (n.nodeName === 'SPAN' && n !== moodChip)).map(n => n.textContent).join('').trim();
      if (!content || /(?:looks at you|is thinking|word helper is thinking)\.{2,}$/i.test(content)) return;
      const reply = content.replace(/^[^:\n]{1,70}:\s*/, '').trim();
      let span = row.querySelector(':scope > span:not(.lq77-mood)');
      if (!span) {
        span = element('span');
        for (const n of [...row.childNodes]) if (n.nodeType === 3) n.remove();
        row.prepend(span);
      }
      span.classList.add('lq77-line'); span.textContent = reply;
      prepared.set(row, span); lastReply = reply; row.dataset.line = reply;
      window.LQ77World?.update({ scene, npc, mode, reply, mood:moodChip?.textContent });
      if (mode === 'quick') window.LQ77World?.quick(reply);
      animate(span, reply);
      if (tab === 'memory') renderMemory();
    }
    function scanLog(records) {
      checkSession();
      if (!npc) return;
      const changed = new Set();
      for (const rec of records) {
        if (rec.target === log) {
          for (const n of rec.addedNodes) if (n.nodeType === 1) changed.add(n);
        } else if (rec.target.parentElement === log) changed.add(rec.target);
      }
      for (const row of changed) processRow(row);
      // Include prior lines via the saved transcript. Keep the live DOM short in long conversations.
      // Pending requests retain their native nodes until completion.
      if (!chat.busy && log.childElementCount > 64) {
        while (log.childElementCount > 48) log.firstElementChild.remove();
      }
      if (languageNotes.childElementCount > 30) languageNotes.firstElementChild.remove();
    }
    new MutationObserver(scanLog).observe(log, { childList: true, subtree: true });
    new MutationObserver(checkSession).observe(root, { attributes: true, attributeFilter: ['style'] });
    new MutationObserver(refreshCharacter).observe(name, { childList: true });
    function memoryState() { return chat?.store?.mem?.[npc?.id] || {}; }
    function noteKey() { return String(scene.area?.id || '') + ':' + String(npc.id); }
    function savedNotes() {
      const book = chat?.store?.game?.[dayBookKey];
      const list = book && book[noteKey()];
      return Array.isArray(list) ? list : [];
    }
    function updateNotes(list) {
      const game = chat.store.game;
      if (!game[dayBookKey] || typeof game[dayBookKey] !== 'object' || Array.isArray(game[dayBookKey])) game[dayBookKey] = {};
      game[dayBookKey][noteKey()] = list.slice(-40);
      chat.store.save(); renderMemory();
    }
    function saveLine() {
      if (!npc || !lastReply) return;
      const notes = savedNotes();
      if (!notes.some(n => n.text === lastReply)) updateNotes([...notes, { text: lastReply, day: Number(scene.store?.game?.day) || 1 }]);
    }
    function noteBlock(title, text) {
      const block = element('div', 'lq77-note');
      block.append(element('strong', '', title), element('p', '', text));
      return block;
    }
    function renderMemory() {
      if (!npc) return;
      const mem = memoryState(), notes = savedNotes(), fragment = document.createDocumentFragment();
      remember.disabled = !lastReply || notes.some(n => n.text === lastReply);
      remember.textContent = lastReply && remember.disabled ? 'Line saved' : 'Save last line';
      if (notes.length) {
        fragment.append(element('h3', 'lq77-heading', 'Keepsakes'));
        for (const n of [...notes].reverse()) {
          const card = noteBlock('Day ' + n.day, n.text);
          const row = element('div', 'lq77-tools');
          if (window.LQ77Learning?.speak) row.append(action('Listen', '', () => window.LQ77Learning.speak(n.text)));
          row.append(action('Remove', '', () => updateNotes(savedNotes().filter(v => v !== n))));
          card.append(row); fragment.append(card);
        }
      }
      if (mem.summary) fragment.append(noteBlock('What you discussed', mem.summary));
      for (const ev of (Array.isArray(mem.events) ? mem.events.slice(-3).reverse() : [])) {
        if (ev.text) fragment.append(noteBlock('Day ' + ev.day, ev.text));
      }
      const transcript = Array.isArray(mem.transcript) ? mem.transcript : [];
      if (transcript.length) {
        fragment.append(element('h3', 'lq77-heading', 'Conversation journal'));
        for (const turn of transcript.slice(-visiblePast).reverse()) {
          const block = noteBlock(turn.role === 'user' ? 'You' : name.textContent, turn.text);
          fragment.append(block);
        }
        if (transcript.length > visiblePast) fragment.append(action('Earlier lines', '', () => { visiblePast += 6; renderMemory(); }));
        if (!chat.busy) {
          const controls = element('div', 'lq77-tools');
          if (confirmErase) {
            controls.append(action('Erase these journal lines', '', () => {
              if (!npc || chat.busy) return;
              const current = memoryState();
              // Isolate any summary still in flight from the erased transcript.
              chat.store.mem[npc.id] = { ...current, transcript: [], summary: '', summarizedCounter: current.turnCounter || 0 };
              chat.prior = []; confirmErase = false; chat.store.save(); renderMemory();
            }), action('Keep lines', '', () => { confirmErase = false; renderMemory(); }));
          } else controls.append(action('Clear journal', '', () => { confirmErase = true; renderMemory(); }));
          fragment.append(controls);
        }
      }
      if (!fragment.childNodes.length) fragment.append(noteBlock('Your first conversation', 'Save a line you would like to revisit.'));
      memoryList.replaceChildren(fragment);
    }
    function setLens(title, text) {
      lens.replaceChildren(noteBlock(title, text)); lens.hidden = false;
    }
    async function explain(raw) {
      const text = String(raw || '').trim().slice(0, 600);
      if (!text || !npc) { word.focus(); return; }
      finishReveal();
      const ticket = ++lookupSequence, source = chat, token = session;
      word.value = text.slice(0, word.maxLength); pendingNote = null;
      setLens('Language lens', 'Looking up the expression…'); lookup.disabled = true;
      try {
        const local = glosses[text.toLowerCase().replace(/[.!?]+$/, '')];
        const previous = source.store?.game?.stats?.book?.find(v => v.term?.toLowerCase() === text.toLowerCase());
        let info;
        if (local) {
          info = { term: text, vi: local[0], meaning: local[1], example: local[2], ipa: local[3] };
        } else if (previous) {
          info = previous;
        } else {
          const provider = source.currentProvider;
          if (typeof provider?.explain !== 'function') throw new Error('This expression needs an AI connection. You can try a word such as “market” offline.');
          info = await provider.explain(text);
        }
        if (ticket !== lookupSequence || token !== session || !npc) return;
        if (!info || (!info.vi && !info.meaning)) throw new Error('No explanation was available for this expression.');
        const term = String(info.term || text), card = noteBlock(term, [info.ipa, info.vi, info.meaning].filter(Boolean).join(' · '));
        if (info.example) card.append(element('p', 'lq77-example', info.example));
        if (info.notes) card.append(element('p', '', info.notes));
        const row = element('div', 'lq77-tools'); pendingNote = info;
        if (window.LQ77Learning?.speak) row.append(action('Pronounce', '', () => window.LQ77Learning.speak(term)));
        if (window.LQ77Learning?.saveWord) {
          const save = action(previous ? 'Saved to word book' : 'Save to word book', '', () => {
            if (!chat || !pendingNote) return;
            window.LQ77Learning.saveWord(chat, { term, meaning: String(info.meaning || ''), vi: String(info.vi || '') });
            save.textContent = 'Saved to word book'; save.disabled = true;
          });
          save.disabled = !!previous; row.append(save);
        }
        card.append(row); lens.replaceChildren(card);
      } catch (error) {
        if (ticket !== lookupSequence || token !== session || !npc) return;
        setLens('Lookup unavailable', String(error?.message || 'Try again when your connection is ready.'));
        lens.append(action('Try again', '', () => explain(text)));
      } finally {
        if (ticket === lookupSequence && token === session) lookup.disabled = false;
      }
    }
    function decode() {
      if (!lastReply) return;
      lookupSequence++; lookup.disabled = false;
      const result = subtextNotes.find(([re]) => re.test(lastReply));
      lens.replaceChildren(noteBlock('Original line', lastReply));
      if (result) lens.append(noteBlock(result[1], result[2]), noteBlock('A more direct version', result[3]));
      else lens.append(noteBlock('Reading the situation', 'Chưa có dấu hiệu rõ về hàm ý. Bạn có thể hỏi nhân vật để biết họ muốn nói gì.'),
        action('Ask what they meant', '', () => insertReply('What did you mean by that?')));
      lens.hidden = false;
    }
    function nextHint() {
      if (!npc) return;
      hintStage = hintStage % 4 + 1;
      const keywords = (npc.goal?.keywords || []).slice(0, 4);
      const model = /drink|cafe|order/i.test(npc.goal?.id || '') ? 'I would like a drink, please. What do you recommend?'
        : /past|yesterday/i.test(npc.goal?.text || '') ? 'Yesterday I went into town. What did you do?'
        : /(?:prefer|opinion|idea)/i.test(npc.goal?.text || '') ? 'I think we could try something different. What do you think?'
        : 'Could you tell me more about ' + (keywords[0] || 'your work') + '?';
      const level = window.LQ77Learning?.level?.() || '';
      const structure = /^(A1|A2)$/.test(level) ? 'I would like… / Where is…?' : 'Could you tell me…? / I think… because…';
      const text = [keywords.join(' · ') || 'who · where · when', structure, npc.goal?.text || 'Ask about their work and add a follow-up question.', model][hintStage - 1];
      hintResult.replaceChildren(element('strong', '', ['Key words', 'Sentence starter', 'Reply idea', 'Sample response'][hintStage - 1]), element('p', '', text));
      if (hintStage === 4) hintResult.append(action('Use as a draft', '', () => insertReply(model)));
      hintResult.hidden = false;
    }
    showTab('dialogue'); reveal.hidden = true;
    checkSession();
    window.LQ77Dialogue = Object.freeze({
      getState: () => ({ open: !!npc, npcId: npc?.id || null, mode, tab, quality: settings.quality }),
      setMode: value => { if (npc && ['quick','deep','story'].includes(value)) setMode(value); },
      showTab: value => { if (npc && Object.hasOwn(views, value)) showTab(value); },
      lookup: text => { if (!npc) return false; showTab('language'); explain(text); return true; }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
