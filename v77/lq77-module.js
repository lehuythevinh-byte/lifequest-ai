/* LIFEQUEST AI V77 — BEYOND CONVERSATION (Phase 1)
   Adds: NPC mood chips (AI-reported), Conversation Replay + phrase notebook,
   Cultural Passport (stamps earned from real world state), The LifeQuest Herald
   (newspaper compiled from recorded events). Reads existing saves; never changes
   quests, money, unlocks or NPC memory. All data lives under store.game.v77. */
(() => {
'use strict';
const VERSION = '77.0-beyond-conversation';
const getScene = () => (typeof window.__lifequestGetScene === 'function' ? window.__lifequestGetScene() : null);
const valid = sc => !!(sc && sc.store && sc.store.game && sc.area);
const services = () => window.__lifequestServices || null;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MOOD_ICON = { happy: '😊', sad: '😔', confused: '😕', amused: '😄', curious: '🤔', disagreeing: '🤨', worried: '😟', formal: '🎩', calm: '😌', neutral: '🙂' };
const MOODS = new Set(Object.keys(MOOD_ICON));

function data(sc = getScene()) {
  if (!valid(sc)) return null;
  const g = sc.store.game;
  if (!g.v77 || typeof g.v77 !== 'object' || Array.isArray(g.v77)) g.v77 = { schema: 1 };
  const d = g.v77;
  d.schema = 1;
  if (!d.passport || typeof d.passport !== 'object') d.passport = {};
  if (!Array.isArray(d.favorites)) d.favorites = [];
  if (!d.names || typeof d.names !== 'object') d.names = {};
  if (!d.helped || typeof d.helped !== 'object') d.helped = {};
  if (!d.news || typeof d.news !== 'object') d.news = { lastReadAt: 0 };
  return d;
}
function persist(sc = getScene()) { try { sc?.store?.save?.(); } catch {} }
function level() { try { return services()?.cefr?.getLevel?.() || 'B1'; } catch { return 'B1'; } }
function speak(text) {
  const s = services()?.speech;
  if (s && typeof s.speak === 'function') { s.speak(String(text)); return; }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.lang = 'en-US'; u.rate = 0.95;
    window.speechSynthesis.speak(u);
  } catch {}
}
function timeLabel(minutes) {
  const m = Math.max(0, Math.min(1439, Number(minutes) || 0));
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
function affinityLabel(a) { return a < 0 ? 'Unfriendly' : a < 10 ? 'Stranger' : a < 30 ? 'Acquaintance' : a < 60 ? 'Friend' : 'Close friend'; }

/* ---------- names: learn NPC display names from the live scene ---------- */
function refreshNames(sc = getScene()) {
  const d = data(sc); if (!d) return;
  let changed = false;
  const add = (id, name) => { if (id && name && d.names[id] !== name) { d.names[id] = name; changed = true; } };
  try {
    for (const n of sc.npcs || []) add(n?.def?.id || n?.id, n?.def?.name || n?.name);
    const c = sc.chat?.npc; if (c) add(c.id, c.name);
  } catch {}
  if (changed) persist(sc);
}
const npcName = (d, id) => d?.names?.[id] || String(id || 'someone').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

/* ---------- helped: remember, per region, that the player fulfilled a resident's wish ----------
   The base game marks a resident's wish done in store.mem[id].goalDone, but it does not tie that
   to a region in the V60 world log. While the player is in a region we observe its residents and
   record the evidence under v77.helped[regionId], so the passport stamp survives leaving/reloading. */
function refreshHelped(sc = getScene()) {
  const d = data(sc); if (!d) return;
  const area = sc.area?.id; if (!area) return;
  if (d.helped[area]) return;
  let done = null;
  try {
    for (const n of sc.npcs || []) {
      const id = n?.def?.id || n?.id;
      if (id && sc.store.mem?.[id]?.goalDone) { done = id; break; }
    }
    const c = sc.chat?.npc;
    if (!done && c?.id && sc.store.mem?.[c.id]?.goalDone) done = c.id;
  } catch {}
  if (done) {
    d.helped[area] = { npc: done, day: sc.store.game.day || 1, at: Date.now() };
    persist(sc);
  }
}

/* ---------- shared UI ---------- */
const style = document.createElement('style');
style.textContent = `
.lq77-mood{display:inline-block;font-size:10px;line-height:1;padding:2px 7px;border-radius:9px;margin-right:6px;vertical-align:middle;border:1px solid #ffffff33;background:#ffffff14;color:#ffe9b8;text-transform:capitalize;letter-spacing:.3px}
.lq77-mood-happy,.lq77-mood-amused{color:#a8e6a1;border-color:#a8e6a155}
.lq77-mood-sad,.lq77-mood-worried{color:#9fc4e8;border-color:#9fc4e855}
.lq77-mood-confused,.lq77-mood-disagreeing{color:#e8c79f;border-color:#e8c79f55}
.lq77-mood-curious{color:#d9b8f0;border-color:#d9b8f055}
.lq77-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(680px,94vw);max-height:84vh;overflow:auto;z-index:9300;background:#131c2df7;border:2px solid #c69a54;border-radius:14px;color:#eef2ff;box-shadow:0 18px 60px #000c;padding:16px 18px;font-size:14px;line-height:1.55;box-sizing:border-box}
.lq77-panel h2{margin:0 0 4px;font-size:18px;color:#ffe9b8;letter-spacing:.4px}
.lq77-panel .lq77-sub{color:#9fb0cc;font-size:12px;margin-bottom:10px}
.lq77-close{position:sticky;top:0;float:right;background:#2a3550;border:1px solid #6f87b8;color:#fff;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:13px;z-index:2}
.lq77-close:hover{background:#3a4a70}
.lq77-panel button{font-family:inherit}
.lq77-row{display:flex;gap:8px;align-items:flex-start;padding:7px 8px;border-radius:8px;margin:4px 0;background:#ffffff08;border:1px solid #ffffff10}
.lq77-row.me{background:#3a5a8c22;border-color:#3a5a8c55}
.lq77-row .who{flex:0 0 auto;font-size:11px;color:#ffd98a;font-weight:700;min-width:86px}
.lq77-row .txt{flex:1 1 auto;word-break:break-word}
.lq77-row .ops{flex:0 0 auto;display:flex;gap:4px}
.lq77-mini{background:#22304c;border:1px solid #55719f;color:#dfe9ff;border-radius:7px;padding:2px 8px;cursor:pointer;font-size:12px}
.lq77-mini:hover{background:#31456e}
.lq77-word{cursor:pointer;border-bottom:1px dotted #7fa0d088}
.lq77-word:hover{color:#ffe9b8;border-bottom-color:#ffe9b8}
.lq77-select{background:#1b2740;color:#eef2ff;border:1px solid #55719f;border-radius:8px;padding:6px 9px;font-size:13px;max-width:100%}
.lq77-tabs{display:flex;gap:6px;margin:8px 0}
.lq77-tab{background:#1b2740;border:1px solid #55719f;color:#cfe0ff;border-radius:8px;padding:5px 12px;cursor:pointer;font-size:13px}
.lq77-tab.on{background:#c69a54;color:#1c1508;border-color:#c69a54;font-weight:700}
.lq77-empty{color:#93a3c0;font-style:italic;padding:14px 4px}
.lq77-page{display:flex;gap:14px;align-items:center;border:1px solid #ffffff1c;border-radius:12px;padding:12px;margin:8px 0;background:#ffffff07}
.lq77-page.locked{opacity:.62;filter:saturate(.35)}
.lq77-stamp{flex:0 0 auto;width:86px;height:86px;border-radius:50%;border:3px double #c69a54;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:10px;color:#ffe9b8;background:radial-gradient(circle at 50% 38%,#2c3c60,#17203a);transform:rotate(-7deg);padding:6px;box-sizing:border-box}
.lq77-stamp .ic{font-size:24px;line-height:1.1}
.lq77-page .info{flex:1 1 auto}
.lq77-page .info b{color:#ffe9b8;font-size:15px}
.lq77-page .meta{color:#9fb0cc;font-size:12px;margin-top:2px}
.lq77-earned{color:#a8e6a1;font-size:12px;margin-top:4px}
.lq77-hint{color:#c8b78f;font-size:12px;margin-top:4px}
.lq77-article{border-top:1px solid #ffffff1e;padding:10px 2px}
.lq77-article h3{margin:0 0 4px;font-size:15px;color:#ffd98a}
.lq77-article p{margin:4px 0}
.lq77-paper{background:#f5ecd7;color:#2c2416;border-radius:10px;padding:14px 16px;border:1px solid #b9a06a}
.lq77-paper h2{color:#4a3413;font-family:Georgia,'Times New Roman',serif;text-align:center;letter-spacing:1px}
.lq77-paper .lq77-sub{color:#6d5c3a;text-align:center;border-bottom:2px solid #4a3413;padding-bottom:8px}
.lq77-paper .lq77-article{border-top:1px solid #b9a06a}
.lq77-paper .lq77-article h3{color:#4a3413;font-family:Georgia,serif}
.lq77-paper .lq77-close{background:#4a3413;border-color:#4a3413;color:#f5ecd7}
.lq77-paper .lq77-mini{background:#e6d9ba;border-color:#a08b5c;color:#3a2f18}
.lq77-note{font-size:11px;color:#8b7a54;margin-top:10px;font-style:italic}
#lq77-toast{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:9350;background:#1d3150f5;border:1px solid #e7c174;color:#fff;border-radius:10px;padding:10px 16px;font-size:13px;box-shadow:0 7px 30px #000a;opacity:0;pointer-events:none;transition:opacity .25s;max-width:90vw;text-align:center}
#lq77-toast.show{opacity:1}
@media(max-width:700px){.lq77-panel{max-height:76vh;top:auto;bottom:64px;transform:translateX(-50%)}.lq77-row .who{min-width:64px}}
`;
document.head.appendChild(style);

const toastEl = document.createElement('div');
toastEl.id = 'lq77-toast';
document.body.appendChild(toastEl);
let toastTimer = 0;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 4200);
}

const panels = {};
function makePanel(id, paper) {
  const el = document.createElement('div');
  el.id = id;
  el.className = 'lq77-panel' + (paper ? ' lq77-paper' : '');
  el.style.display = 'none';
  el.setAttribute('role', 'dialog');
  document.body.appendChild(el);
  panels[id] = el;
  return el;
}
function closePanels() { for (const el of Object.values(panels)) el.style.display = 'none'; }
function anyPanelOpen() { return Object.values(panels).some(el => el.style.display === 'block'); }
function baseOverlayOpen() {
  return ['chat', 'settings', 'briefing', 'helper', 'journal', 'quests'].some(id => {
    const el = document.getElementById(id);
    return el && el.style.display === 'block';
  });
}
function openPanel(el) { closePanels(); el.style.display = 'block'; el.querySelector('.lq77-close')?.focus({preventScroll:true}); }
function closeButton(el, extra) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'lq77-close'; b.textContent = '✕ Close';
  b.onclick = () => { el.style.display = 'none'; extra?.(); };
  el.appendChild(b);
  return b;
}
function openHelperWith(word) {
  if (window.LQ77Dialogue?.getState().open) {
    closePanels();
    if (window.LQ77Dialogue.lookup(word)) return;
  }
  const helper = document.getElementById('helper');
  const input = helper?.querySelector('input');
  const ask = document.getElementById('helper-ask');
  if (!helper || !input || !ask) { toast('Word helper is not ready yet.'); return; }
  closePanels();
  input.value = word;
  helper.style.display = 'block';
  ask.click();
}
function wordSpans(container, text) {
  const parts = String(text).split(/(\s+)/);
  for (const p of parts) {
    if (/^[A-Za-z][A-Za-z'-]{1,}$/.test(p)) {
      const s = document.createElement('span');
      s.className = 'lq77-word'; s.textContent = p; s.title = 'Look up "' + p + '" in the Word helper';
      s.onclick = () => openHelperWith(p.replace(/^['-]+|['-]+$/g, ''));
      container.appendChild(s);
    } else container.appendChild(document.createTextNode(p));
  }
}
function moodChip(mood) {
  if (!mood || !MOODS.has(mood) || mood === 'neutral') return null;
  const chip = document.createElement('span');
  chip.className = 'lq77-mood lq77-mood-' + mood;
  chip.textContent = (MOOD_ICON[mood] || '') + ' ' + mood;
  return chip;
}

/* ================= Conversation Replay + Notebook ================= */
const replayEl = makePanel('lq77-replay');
let replayNpc = '', replayTab = 'talk';
function openReplay(npcId) {
  const sc = getScene(); const d = data(sc);
  if (!d) { toast('Enter the town first, then open the replay.'); return; }
  refreshNames(sc);
  if (npcId) replayNpc = npcId;
  renderReplay();
  openPanel(replayEl);
}
function renderReplay() {
  const sc = getScene(); const d = data(sc);
  replayEl.innerHTML = '';
  closeButton(replayEl);
  const h = document.createElement('h2'); h.textContent = '🕮 Conversation Replay'; replayEl.appendChild(h);
  const sub = document.createElement('div'); sub.className = 'lq77-sub';
  sub.textContent = 'Re-read past talks, listen again, click any word to look it up, ★ save a line to your notebook.';
  replayEl.appendChild(sub);
  if (!d) { replayEl.appendChild(Object.assign(document.createElement('div'), { className: 'lq77-empty', textContent: 'The town is still loading.' })); return; }

  const tabs = document.createElement('div'); tabs.className = 'lq77-tabs';
  for (const [key, label] of [['talk', 'Past talks'], ['book', '★ Notebook (' + d.favorites.length + ')']]) {
    const b = document.createElement('button'); b.type = 'button';
    b.className = 'lq77-tab' + (replayTab === key ? ' on' : ''); b.textContent = label;
    b.onclick = () => { replayTab = key; renderReplay(); };
    tabs.appendChild(b);
  }
  replayEl.appendChild(tabs);

  if (replayTab === 'book') { renderFavorites(d); return; }

  const mem = sc.store.all().filter(([, m]) => Array.isArray(m.transcript) && m.transcript.length > 0);
  if (!mem.length) {
    replayEl.appendChild(Object.assign(document.createElement('div'), { className: 'lq77-empty', textContent: 'No conversations yet. Talk to a villager (E) and your history will appear here.' }));
    return;
  }
  if (!replayNpc || !mem.some(([id]) => id === replayNpc)) replayNpc = mem[mem.length - 1][0];
  const sel = document.createElement('select'); sel.className = 'lq77-select';
  for (const [id, m] of mem) {
    const o = document.createElement('option');
    o.value = id; o.textContent = npcName(d, id) + ' — ' + m.transcript.length + ' messages · ' + affinityLabel(m.affinity || 0);
    if (id === replayNpc) o.selected = true;
    sel.appendChild(o);
  }
  sel.onchange = () => { replayNpc = sel.value; renderReplay(); };
  replayEl.appendChild(sel);

  const m = sc.store.get(replayNpc);
  const list = document.createElement('div');
  for (const t of m.transcript) {
    const row = document.createElement('div');
    row.className = 'lq77-row' + (t.role === 'user' ? ' me' : '');
    const who = document.createElement('div'); who.className = 'who';
    who.textContent = (t.role === 'user' ? 'You' : npcName(d, replayNpc).split(' (')[0]) + '\nDay ' + (t.day ?? '?') + ' ' + timeLabel(t.minutes);
    who.style.whiteSpace = 'pre-line';
    const txt = document.createElement('div'); txt.className = 'txt';
    const chip = t.role !== 'user' ? moodChip(t.mood) : null;
    if (chip) { txt.appendChild(chip); txt.appendChild(document.createTextNode(' ')); }
    wordSpans(txt, t.text || '');
    row.append(who, txt);
    const ops = document.createElement('div'); ops.className = 'ops';
    if (t.role !== 'user') {
      const spk = document.createElement('button'); spk.type = 'button'; spk.className = 'lq77-mini'; spk.textContent = '🔊'; spk.title = 'Listen again';
      spk.onclick = () => speak(t.text);
      ops.appendChild(spk);
      const fav = document.createElement('button'); fav.type = 'button'; fav.className = 'lq77-mini'; fav.textContent = '★'; fav.title = 'Save this line to your notebook';
      fav.onclick = () => {
        const d2 = data(); if (!d2) return;
        if (d2.favorites.some(f => f.npc === replayNpc && f.text === t.text)) { toast('Already in your notebook.'); return; }
        d2.favorites.push({ npc: replayNpc, text: t.text, day: t.day ?? sc.store.game.day, at: Date.now() });
        if (d2.favorites.length > 60) d2.favorites.shift();
        persist(); toast('★ Saved to your notebook.'); renderReplay();
      };
      ops.appendChild(fav);
    }
    row.appendChild(ops);
    list.appendChild(row);
  }
  replayEl.appendChild(list);
  const note = document.createElement('div'); note.className = 'lq77-sub';
  note.textContent = 'The town remembers the most recent 80 messages per person. Older talks are kept as a short memory summary in your Journal (J).';
  replayEl.appendChild(note);
}
function renderFavorites(d) {
  if (!d.favorites.length) {
    replayEl.appendChild(Object.assign(document.createElement('div'), { className: 'lq77-empty', textContent: 'Your notebook is empty. In "Past talks", press ★ on a line you love.' }));
    return;
  }
  for (const f of [...d.favorites].reverse()) {
    const row = document.createElement('div'); row.className = 'lq77-row';
    const who = document.createElement('div'); who.className = 'who';
    who.textContent = npcName(d, f.npc).split(' (')[0] + '\nDay ' + f.day;
    who.style.whiteSpace = 'pre-line';
    const txt = document.createElement('div'); txt.className = 'txt';
    wordSpans(txt, f.text);
    const ops = document.createElement('div'); ops.className = 'ops';
    const spk = document.createElement('button'); spk.type = 'button'; spk.className = 'lq77-mini'; spk.textContent = '🔊';
    spk.onclick = () => speak(f.text);
    const del = document.createElement('button'); del.type = 'button'; del.className = 'lq77-mini'; del.textContent = '🗑'; del.title = 'Remove from notebook';
    del.onclick = () => { const d2 = data(); if (!d2) return; d2.favorites = d2.favorites.filter(x => x !== f && !(x.npc === f.npc && x.text === f.text && x.at === f.at)); persist(); renderReplay(); };
    ops.append(spk, del);
    row.append(who, txt, ops);
    replayEl.appendChild(row);
  }
}

/* ================= Cultural Passport ================= */
const passportEl = makePanel('lq77-passport');
const CORE_META = {
  'english-town': { name: 'English Town', icon: '🏘️', role: 'Home Town', level: 'A1–B1', building: 'Town Square', tone: '#ffd98a' },
  'mining-town': { name: 'Mining Town', icon: '⛏️', role: 'The Echoes Beneath', level: 'A2–B1', building: 'Crystal Cavern', tone: '#b9a7f0' },
};
const REGION_ICON = { 'art-district': '🎨', 'tech-co': '💡', 'old-oriaris': '👑', 'wish-valley': '🌿', 'vocalt-greedy-land': '⚖️' };
function passportRegions() {
  const out = [];
  const maps = window.LQWorldV60?.MAPS || {};
  const list = window.LQWorldMaps?.list?.() || [];
  const ids = new Set([...Object.keys(CORE_META), ...Object.keys(maps)]);
  for (const id of ids) {
    const area = list.find(a => a.id === id);
    if (!area && !CORE_META[id] && !maps[id]) continue;
    const m = maps[id] || {};
    out.push({
      id,
      name: CORE_META[id]?.name || m.name || area?.name || id,
      icon: CORE_META[id]?.icon || REGION_ICON[id] || '📍',
      role: CORE_META[id]?.role || m.role || 'Region',
      level: CORE_META[id]?.level || m.level || '',
      building: CORE_META[id]?.building || m.building || '',
      tone: CORE_META[id]?.tone || (typeof m.tone === 'number' ? '#' + m.tone.toString(16).padStart(6, '0') : '#c69a54'),
    });
  }
  return out;
}
function stampEvidence(sc, id) {
  const g = sc.store.game, v60 = g.v60;
  if (!v60) return null;
  const reg = v60.regions?.[id];
  const evs = (v60.events || []).filter(e => e.area === id);
  const first = list => list.length ? list[list.length - 1] : null;
  const quest = first(evs.filter(e => e.kind === 'quest' || e.kind === 'world-change'));
  if (reg?.complete || (reg?.progress || 0) > 0 || quest) return { reason: 'Completed a local mission', day: quest?.day || g.day };
  const echo = first(evs.filter(e => e.kind === 'echo-complete'));
  if (echo) return { reason: 'Restored a Time Echo memory', day: echo.day || g.day };
  const fest = first(evs.filter(e => e.kind === 'pulse' && /bắt đầu/.test(e.title || '')));
  if (fest || reg?.festival) return { reason: 'Joined a local festival', day: fest?.day || g.day };
  const helpedHere = g.v77?.helped?.[id];
  if (helpedHere) return { reason: 'Helped a resident with their wish', day: helpedHere.day || g.day };
  const helped = Object.keys(v60.people || {}).some(k => k.startsWith(id + '::') && sc.store.mem?.[k.split('::')[1]]?.goalDone);
  if (helped) return { reason: 'Helped a resident with their wish', day: g.day };
  const art = first(evs.filter(e => e.kind === 'companion' || e.kind === 'echo'));
  if (art) return { reason: 'Discovered a piece of local history', day: art.day || g.day };
  return null;
}
function checkStamps(quiet) {
  const sc = getScene(); const d = data(sc);
  if (!d) return;
  let earned = null;
  for (const r of passportRegions()) {
    if (d.passport[r.id]) continue;
    const ev = stampEvidence(sc, r.id);
    if (ev) {
      d.passport[r.id] = { day: ev.day, reason: ev.reason, at: Date.now() };
      earned = r;
    }
  }
  if (earned) {
    persist(sc);
    if (!quiet) toast('📔 Passport stamped: ' + earned.name + '!');
    if (passportEl.style.display === 'block') renderPassport();
  }
}
function openPassport() {
  const d = data();
  if (!d) { toast('Enter the town first, then open your passport.'); return; }
  refreshHelped();
  checkStamps(true);
  renderPassport();
  openPanel(passportEl);
}
function renderPassport() {
  const sc = getScene(); const d = data(sc);
  passportEl.innerHTML = '';
  closeButton(passportEl);
  const h = document.createElement('h2'); h.textContent = '📔 Cultural Passport'; passportEl.appendChild(h);
  const regions = passportRegions();
  const count = regions.filter(r => d?.passport?.[r.id]).length;
  const sub = document.createElement('div'); sub.className = 'lq77-sub';
  sub.textContent = count + ' / ' + regions.length + ' stamps collected. A stamp is earned by living the region\'s story — not by walking in.';
  passportEl.appendChild(sub);
  if (!d) return;
  for (const r of regions) {
    const got = d.passport[r.id];
    const page = document.createElement('div');
    page.className = 'lq77-page' + (got ? '' : ' locked');
    const stamp = document.createElement('div'); stamp.className = 'lq77-stamp';
    stamp.style.borderColor = r.tone;
    stamp.innerHTML = '<span class="ic">' + esc(r.icon) + '</span><span>' + esc(got ? 'STAMPED' : 'SEALED') + '</span>';
    const info = document.createElement('div'); info.className = 'info';
    const b = document.createElement('b'); b.textContent = r.name; info.appendChild(b);
    const meta = document.createElement('div'); meta.className = 'meta';
    meta.textContent = r.role + (r.level ? ' · English ' + r.level : '') + (r.building ? ' · Landmark: ' + r.building : '');
    info.appendChild(meta);
    if (got) {
      const e = document.createElement('div'); e.className = 'lq77-earned';
      e.textContent = '✔ ' + got.reason + ' — Day ' + got.day;
      info.appendChild(e);
    } else {
      const hint = document.createElement('div'); hint.className = 'lq77-hint';
      hint.textContent = 'To earn this stamp: complete a local mission, help a resident, join a festival, or restore a Time Echo here.';
      info.appendChild(hint);
    }
    page.append(stamp, info);
    passportEl.appendChild(page);
  }
}

/* ================= The LifeQuest Herald (world newspaper) ================= */
const newsEl = makePanel('lq77-news', true);
function regionName(id) {
  const maps = window.LQWorldV60?.MAPS || {};
  return CORE_META[id]?.name || maps[id]?.name || String(id || 'the town').replace(/[-_]/g, ' ');
}
function compileNews(sc) {
  const g = sc.store.game, d = data(sc);
  const v60 = g.v60 || { events: [], regions: {} };
  const evs = v60.events || [];
  const simple = /^A/.test(level());
  const day = g.day || 1;
  const arts = [];
  const recent = evs.filter(e => day - (e.day || 1) <= 3);
  const big = recent.find(e => ['quest', 'world-change', 'echo-complete', 'region-restored'].includes(e.kind));
  if (big) {
    const where = regionName(big.area);
    const what = big.kind === 'echo-complete' ? 'an old memory was pieced together'
      : big.kind === 'region-restored' || big.kind === 'world-change' ? 'the area changed for the better'
      : 'a local quest was completed';
    arts.push({
      title: simple ? 'Good news in ' + where : 'Progress in ' + where,
      body: simple
        ? 'A visitor helped in ' + where + '. Yesterday, ' + what + '. People are happy.'
        : 'Word from ' + where + ': ' + what + ', thanks to the efforts of our visiting friend. Residents say the town feels a little brighter.',
    });
  } else {
    arts.push({
      title: simple ? 'A quiet day' : 'A calm day across the regions',
      body: simple
        ? 'It is day ' + day + '. The towns are quiet. People work and talk. You can visit a new place today.'
        : 'Day ' + day + ' passes peacefully. Shops are open, neighbours chat, and travellers are welcome. Perhaps today is a good day to explore somewhere new.',
    });
  }
  const festRegions = Object.entries(v60.regions || {}).filter(([, r]) => r?.festival).map(([id]) => regionName(id));
  if (festRegions.length) {
    arts.push({
      title: simple ? 'Festival time!' : 'Festivities under way',
      body: simple
        ? 'There is a festival in ' + festRegions.join(' and ') + '. Go and join the fun. Talk to people there.'
        : 'Celebrations continue in ' + festRegions.join(' and ') + '. Visitors are invited to join the activities and meet the locals — a fine chance to practise English in a lively crowd.',
    });
  }
  const friends = sc.store.all().filter(([, m]) => (m.affinity || 0) >= 30).sort((a, b) => b[1].affinity - a[1].affinity).slice(0, 3);
  if (friends.length) {
    const names = friends.map(([id, m]) => npcName(d, id).split(' (')[0] + ' (' + affinityLabel(m.affinity).toLowerCase() + ')');
    arts.push({
      title: simple ? 'Our visitor makes friends' : 'The visitor builds friendships',
      body: simple
        ? 'People like the visitor. ' + names.join(', ') + ' are friends now. Say hello to them!'
        : 'This paper can report that ' + names.join(', ') + ' now count the visitor among their friends. Regular, polite conversation — not gifts — earned this trust.',
    });
  }
  const stats = g.stats || {};
  const bookN = Array.isArray(stats.book) ? stats.book.length : 0;
  arts.push({
    title: simple ? 'English corner' : 'From the learning desk',
    body: simple
      ? 'The visitor sent ' + (stats.messages || 0) + ' English messages. ' + bookN + ' words are in the word book. Keep going!'
      : 'Our correspondent notes ' + (stats.messages || 0) + ' English messages exchanged, ' + (stats.corrections || 0) + ' gentle corrections received, and ' + bookN + ' words collected in the personal word book. Small steps, every day.',
  });
  const learned = Object.keys(v60.learning?.words || {}).length;
  if (learned > 0) {
    arts.push({
      title: simple ? 'Words in the wild' : 'Vocabulary spotted in the wild',
      body: simple
        ? 'The visitor used ' + learned + ' different words in regional activities. Well done!'
        : 'Regional activities have recorded ' + learned + ' distinct words used by the visitor in real tasks — proof that English here is a tool, not a test.',
    });
  }
  return { day, arts };
}
function openNews() {
  const sc = getScene(); const d = data(sc);
  if (!d) { toast('Enter the town first, then read the Herald.'); return; }
  refreshNames(sc);
  renderNews();
  d.news.lastReadAt = Date.now();
  persist(sc);
  openPanel(newsEl);
  updateNewsBadge();
}
function renderNews() {
  const sc = getScene();
  newsEl.innerHTML = '';
  closeButton(newsEl);
  const h = document.createElement('h2'); h.textContent = '📰 THE LIFEQUEST HERALD'; newsEl.appendChild(h);
  if (!valid(sc)) { newsEl.appendChild(Object.assign(document.createElement('div'), { className: 'lq77-empty', textContent: 'The town is still loading.' })); return; }
  const { day, arts } = compileNews(sc);
  const sub = document.createElement('div'); sub.className = 'lq77-sub';
  sub.textContent = 'Day ' + day + ' · ' + regionName(sc.area.id) + ' edition · Level ' + level();
  newsEl.appendChild(sub);
  for (const a of arts) {
    const art = document.createElement('div'); art.className = 'lq77-article';
    const t = document.createElement('h3'); t.textContent = a.title; art.appendChild(t);
    const p = document.createElement('p'); wordSpans(p, a.body); art.appendChild(p);
    newsEl.appendChild(art);
  }
  const note = document.createElement('div'); note.className = 'lq77-note';
  note.textContent = 'Every story is compiled from your saved world state (events, friendships, learning). Nothing is invented. Click any word to look it up.';
  newsEl.appendChild(note);
}

/* ================= Menu, keys, chat button, timers ================= */
let newsBtn = null;
function updateNewsBadge() {
  if (!newsBtn) return;
  const sc = getScene(); const d = data(sc);
  const v60 = sc?.store?.game?.v60;
  const fresh = d && (v60?.events || []).some(e => (e.at || 0) > (d.news.lastReadAt || 0) && ['quest', 'world-change', 'echo-complete', 'festival', 'region-restored'].includes(e.kind));
  newsBtn.querySelector('span').textContent = (fresh ? '📰 Herald •' : '📰 Herald');
}
function installMenu() {
  // V11 "one-nav shell" hides the legacy #group-menu (display:none!important), so the
  // discoverable home for V77 features is the active hub nav #l11-nav. These buttons use
  // data-lq77-nav (not data-l11-page) so the shell's own page router ignores them.
  const nav = document.getElementById('l11-nav');
  if (nav && !nav.querySelector('[data-lq77-nav]')) {
    const closeShell = () => {
      document.getElementById('l11-close')?.click();
      const sh = document.getElementById('l11-shell');
      if (sh) sh.hidden = true;
      document.getElementById('l11-menu-btn')?.setAttribute('aria-expanded', 'false');
    };
    const mk = (label, kbd, fn) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('data-lq77-nav', '1');
      b.title = label + ' (shortcut: ' + kbd + ')';
      const s = document.createElement('span'); s.textContent = label;
      const k = document.createElement('kbd'); k.textContent = kbd;
      k.style.cssText = 'margin-left:auto;font-size:11px;opacity:.7;border:1px solid #6f87b866;border-radius:5px;padding:1px 6px';
      b.append(s, k);
      b.addEventListener('click', (e) => { e.stopPropagation(); closeShell(); fn(); });
      nav.appendChild(b);
      return b;
    };
    mk('📔 Passport', 'P', openPassport);
    newsBtn = mk('📰 Herald', 'T', openNews);
    mk('🕮 Replay talks', 'L', () => openReplay(getScene()?.chat?.npc?.id || ''));
  }
  const hint = document.querySelector('#lq77-memory .lq77-tools') || document.querySelector('#chat .hint');
  if (hint && !hint.querySelector('[data-lq77-replay]')) {
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'lq77-chat-replay'; b.className = 'lq77-tool'; b.setAttribute('data-lq77-replay', '1');
    b.title = 'Re-read your past conversations with this person';
    b.textContent = '🕮 Replay';
    b.onclick = () => openReplay(getScene()?.chat?.npc?.id || '');
    hint.appendChild(document.createTextNode(' '));
    hint.appendChild(b);
  }
}
window.addEventListener('keydown', e => {
  if (e.defaultPrevented || e.repeat) return;
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (anyPanelOpen()) {
    if (e.key === 'Escape') { closePanels(); e.preventDefault(); }
    return;
  }
  if (baseOverlayOpen()) return;
  const k = e.key.toLowerCase();
  if (k === 'p') { e.preventDefault(); openPassport(); }
  else if (k === 't') { e.preventDefault(); openNews(); }
  else if (k === 'l') { e.preventDefault(); openReplay(); }
});
function tick() {
  const sc = getScene();
  if (!valid(sc)) return;
  refreshNames(sc);
  refreshHelped(sc);
  checkStamps(false);
  updateNewsBadge();
}
function init() {
  installMenu();
  setInterval(tick, 12000);
  setTimeout(tick, 4000);
  const w = window.LQWorldV60;
  if (w?.subscribe) {
    for (const kind of ['festival', 'echo-complete', 'region-restored']) {
      try { w.subscribe(kind, () => setTimeout(() => checkStamps(false), 300)); } catch {}
    }
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();

window.LQBeyondV77 = Object.freeze({
  version: VERSION,
  openReplay, openPassport, openNews,
  data: () => data(),
  diagnostics: () => {
    const sc = getScene(); const d = data(sc);
    return {
      version: VERSION,
      sceneReady: valid(sc),
      stamps: d ? Object.keys(d.passport).length : 0,
      favorites: d ? d.favorites.length : 0,
      namesKnown: d ? Object.keys(d.names).length : 0,
      moodSchema: true,
    };
  },
});
})();
