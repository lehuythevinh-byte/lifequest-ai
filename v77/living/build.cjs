'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const parts = path.join(__dirname, '../parts');
const target = path.join(__dirname, '../game.html');
const files = fs.readdirSync(parts).filter(file => /^p\d{3}\.txt$/.test(file)).sort();
const joined = Buffer.concat(files.map(file => fs.readFileSync(path.join(parts, file))));
let html = joined.toString('utf8').replace(/\r\n/g, '\n');
if (crypto.createHash('sha256').update(html).digest('hex') !== 'a406c737942257140270081d87d5fd0d62af602df0c7c58e2f5fb8cae3b2013f') {
  throw Error('The assembled Beyond Conversation source differs from the published release.');
}
const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8').replace(/\r\n/g, '\n');
function replace(from, to) {
  const start=html.indexOf(from);
  if (start<0 || html.indexOf(from,start+1)>=0) throw Error('Expected one source anchor: '+from.slice(0,90));
  html=html.slice(0,start)+to+html.slice(start+from.length);
}
function section(left,right,body){
  const a=html.indexOf(left), b=html.indexOf(right,a+left.length);
  if(a<0||b<0)throw Error('Missing release block '+left.slice(0,60));
  replace(html.slice(a,b),body);
}
function css(name){
  return read(name).replace(/url\((['"]?)((?:art|title)\/[^()'"]+)\1\)/g,(_,quote,file)=>{
    const type=file.endsWith('.webp')?'webp':'png';
    return 'url("data:image/'+type+';base64,'+fs.readFileSync(path.join(__dirname,file)).toString('base64')+'")';
  });
}
// V77 uses the same-origin Gemini relay. Existing V76 saves can contain a
// personal key; none of the V77 learning entry points should read or send it.
section('/* Auto-repair:', '\n</script>', 'window.__lqModelReady = Promise.resolve();\n');
section('<!-- LIFEQUEST AI CONFIG:', '<script>\nwindow.LIFEQUEST_AI_CONFIG', '<!-- LifeQuest runtime and optional cloud-save settings. -->\n');
replace("  GEMINI_API_KEY: '', // <-- PASTE YOUR OWN KEY HERE ONLY FOR A PRIVATE LOCAL HTML FILE\n",'');
const keyReaders=/(?:saved|ai|obj|e)\.geminiKey\s*\|\|\s*window\.LIFEQUEST_AI_CONFIG\?\.GEMINI_API_KEY\s*\|\|\s*''/g;
if ((html.match(keyReaders)||[]).length!==6)throw Error('Review upstream Gemini configuration readers');
html=html.replace(keyReaders,"''");
replace('function proxyAvailable() {','function proxyAvailable(refresh = false) {\n          if (refresh) probe=null;');
section('        let obj = {};\n        try {\n          obj = JSON.parse(localStorage.getItem(\'english-town-ai\')', '\n      }\n      updateConnectionStatus();', "        window.LQGemini.proxyAvailable().then(ok => { status.textContent=ok?'Gemini connected through the game server':'Offline learning'; });");
replace('Existing AI settings are kept; no API key is required to enter the game.','Gemini connects through the game server. Offline conversations are available when the server is unavailable.');
replace('Open Settings > Test to check your key.','Open conversation settings to check the AI connection.');
replace('Enter your key in ⚙ AI (K) for free-form chat.','Connect to a game server with Gemini enabled for free-form chat.');
replace('Check the key in ⚙ AI (K).','Check the game server’s Gemini configuration.');
replace('Check your internet and the API key in ⚙ AI (K).','Check the connection to the game server.');
replace('enter a Gemini API key in ⚙ AI (K)','connect to the game server');
replace('<title>LIFEQUEST AI V77 — Beyond Conversation</title>','<title>LifeQuest AI V77 — Living World Interface</title>');
replace('name="viewport" content="width=device-width, initial-scale=1.0"','name="viewport" content="width=device-width, initial-scale=1.0, interactive-widget=resizes-content"');
replace('content="V56-accessible-entrances"','content="V77-living-world-interface"');
const tick=String.fromCharCode(96);
// Interiors use a fixed room camera. Keep it fitted when a phone rotates or the viewport resizes.
replace('this.inside || this.fitCamera();', 'if (this.inside) this.fitInteriorCamera(); else this.fitCamera();');
replace('            enterBuilding(e, floor = 0, preserved = null) {', [
  '            fitInteriorCamera() {',
  '              const { spec, k } = this.inside;',
  '              const width = spec.w * 32 * k, height = spec.h * 32 * k;',
  '              const camera = this.cameras.main;',
  '              camera.setZoom(Math.min(1, this.scale.width * 0.96 / width, this.scale.height * 0.94 / height));',
  '              camera.centerOn(Yr + width / 2, Xr + height / 2);',
  '            }',
  '            enterBuilding(e, floor = 0, preserved = null) {'
].join('\n'));
replace('cam.centerOn(Yr + (t.w * unit) / 2, Xr + (t.h * unit) / 2);', 'this.fitInteriorCamera();');
// The storage panel still handles V76 imports/exports; Gemini configuration belongs to the relay.
section('      <div hidden aria-hidden="true">\n        <input id="ai-key"', '      <div class="row"><button id="ai-close"', '');
section('    <!-- Technical inputs are retained for backwards compatibility', '    <div id="settings">', '');
section('            keyInput = this.root.querySelector('+tick+'#ai-key'+tick+');', '              let t = this.root.querySelector('+tick+'#save-file'+tick+');', [
  '            status = this.root.querySelector(".status");',
  '            constructor(store) {',
  '              this.store = store;',
  '              this.root.querySelector("#ai-close").addEventListener("click", () => this.toggle());',
  ''
].join('\n'));
section('              let e = vt();\n              ((this.keyInput.value', '            setStatus(e, t) {', [
  '              this.root.style.display = "block";',
  '              this.root.querySelector("#ai-close").focus();',
  '            }',
  ''
].join('\n'));
section('            save() {\n              (yt({\n                geminiKey:', 'var Bt = class {', '          };\n');
const landingStart='<canvas aria-hidden="true"></canvas><div class="glow"></div><div class="shade"></div>';
section(landingStart,'document.body.appendChild(el);',read('title/landing.html')+tick+';\n      ');
replace("const stop = startScene(el.querySelector('canvas'));","const stop = () => {};");
section("      const keyInput = el.querySelector('#lq-title-key');","      let done = false;",'');
replace('if (done || !saveTypedKey()) return;','if (done) return;');
replace("if (t !== btn && t && /^(INPUT|BUTTON|A)$/.test(t.tagName) && !(t === keyInput && ev.key === 'Enter')) return;","if (t !== btn && t && /^(INPUT|BUTTON|A)$/.test(t.tagName)) return;");
replace('const __lqOriginalNpcOpen = ft.prototype.open;',[
  'window.LQ77Learning = {',
  '  speak: text => speechService.speak(text),',
  '  level: () => cefrService.getLevel(),',
  '  async reconnect(chat) { await window.LQGemini.proxyAvailable(true); chat.setProvider(await pr()); return chat.currentProvider.label; },',
  '  saveWord(chat, word) { Ae(chat.store.game.stats, word); chat.store.save(); },',
  '  residents: () => re,',
  '  regionFor: id => Ee(id)?.name || ""',
  '};',
  'const __lqOriginalNpcOpen = ft.prototype.open;'
].join('\n'));
replace('if (this.npc !== e) return;\n              let s = lqNpcSafeText','if (this.npc !== e || !t.isConnected) return;\n              let s = lqNpcSafeText');
replace('speechService.stop();\n              this.npc &&','speechService.stop();\n              this.busy = false;\n              this.npc &&');
const pending='l = await this.provider.respond(e, this.history, t, n.goalDone, c);';
// High-confidence offline cues come before the existing general grammar rules.
replace('var sr = [',[
  'var sr = [',
  '            [/^(?:yesterday[, ]+(?:i|you|he|she|we|they) go\\b|(?:i|you|he|she|we|they) go (?:to|home|there|out|back)\\b[^.,;!?]{0,55}\\byesterday\\b)/i, '+
  '"Use went for a finished trip in the past. Example: She went to the market yesterday."],',
  '            [/\\bcoffe\\b/i, "Spelling tip: coffee ends in two e’s. Example: Could I have a coffee, please?"],'
].join('\n'));
replace('/\\b(he|she) (go|like|want|need|live|work)\\b(?! to)/i','/^(?:he|she) (go|like|want|need|live|work)\\b/i');
replace('/\\ba [aeiou]\\w+/i','/\\ba (?:apple|orange|egg|onion|idea|umbrella|answer|artist|engineer|office|hour|honour|honor)\\b/i');
section('              let v = cr(n);','            }\n          };\nvar ur = class {',[
  '              return {reply:l(m),topicStatus,correction:cr(n),goalDone:d && !lqNpcTopicBlocksQuest(topicStatus),affinityDelta:h};',''
].join('\n'));
replace(pending,pending+'\n                if (this.npc !== e || !this.logEl.contains(a)) return;\n                if (l.goalDone && (n.goalDone || !Array.isArray(e.goal?.keywords) || !Pe(t, e.goal.keywords))) l.goalDone = false;');
replace('} catch (e) {\n                (a.remove(),\n                  i.remove(),','} catch (e) {\n                if (!this.npc || !this.logEl.contains(a)) return;\n                (a.remove(),\n                  i.remove(),');
replace('let r = this.append('+tick+'npc'+tick+', '+tick+'Word helper is thinking...'+tick+');','const originalNpc = this.npc;\n              let r = this.append('+tick+'npc'+tick+', '+tick+'Word helper is thinking...'+tick+');');
replace('let e = await ct(this.provider, n);','let e = await ct(this.provider, n);\n                if (this.npc !== originalNpc || !r.isConnected) return;');
replace('(r.remove(), this.append('+tick+'fix'+tick+', '+tick+'📖 '+'$'+'{e.message}'+tick+'));','if (this.npc !== originalNpc || !r.isConnected) return;\n                (r.remove(), this.append('+tick+'fix'+tick+', '+tick+'📖 '+'$'+'{e.message}'+tick+'));');
replace(tick+'## Situation'+tick+',',tick+'## Situation'+tick+',\n              window.LQ77Atlas?.setting(e,n) || "",');
replace("if (name === 'maps') h = mapsPage(s);","if (name === 'maps') h = mapsPage(s);\n          else if (name === 'field') h = window.LQ77Atlas.field(s);");
replace('t.innerHTML = h;\n          selected = name;', "t.innerHTML = h;\n          if (name === 'field') window.LQ77Atlas.portraits(t,s.sc);\n          selected = name;");
replace('<button type="button" data-l11-page="quests">','<button type="button" data-l11-page="field">✎ Field journal</button><button type="button" data-l11-page="quests">');
replace("e.stopImmediatePropagation();\n                open();\n              }\n            },\n            true,\n          );\n          // Older visible shortcuts","e.stopImmediatePropagation();\n                document.getElementById('lq77-wheel-button').click();\n              }\n            },\n            true,\n          );\n          // Older visible shortcuts");
replace('aria-controls="l11-shell" aria-expanded="false">☰ Menu (G)</button>','aria-controls="l11-shell" aria-expanded="false">☰ Menu</button>');
replace("if (!scene.player?.active || !scene.cameras?.main || !scene.sys?.isActive?.()) return false;", "if (!scene.player?.active || !scene.cameras?.main || !scene.sys?.isActive?.()) return false;\n    if (['lq-cc','lq-auth','lq-device'].some(id => document.getElementById(id)?.offsetHeight)) return false;");
const atlasClass='<div class="l11-map-visual l11-map-'+'$'+'{region}"';
section('          const scale = Math.min((W - 17)', '          const tx = (x) => ox + x * scale,','          const {scale,ox,oy}=window.LQ77Atlas.projection(sc,inside,W,H,tilesW,tilesH);\n');
replace('<button id="v8-map-hide"','<button type="button" id="lq77-map-zoom" title="Change map zoom">1×</button><button id="v8-map-hide"');
replace("const navCard = $('v8-navigation'),","window.LQ77Atlas.bindMap();\n          const navCard = $('v8-navigation'),");
replace(atlasClass,'<div data-lq77-map="'+'$'+'{safeHTML(map.id)}" class="l11-map-visual l11-map-'+'$'+'{region}"');
replace('✦ LIFEQUEST AI · HUB','Travel journal');
replace('Select any existing map or open your quests, inventory and settings','Maps, people, quests and provisions');
// Use the maintained module for the existing replay, passport, newspaper and save hooks.
section('<!-- LQ77-MODULE-BEGIN -->','<!-- LQ77-MODULE-END -->',
  '<!-- LQ77-MODULE-BEGIN -->\n<script>\n'+read('../lq77-module.js')+'\n</script>\n');
const styles=['shell.css','atlas.css','ui.css','world.css'].map(css).join('\n');
const scripts=['atlas.js','world.js','interview.js','lens.js','dialogue.js'].map(n=>'<script id="lq77-'+path.basename(n,'.js')+'">\n'+read(n).replace(/<\/script/gi,'<\\/script')+'\n</script>').join('\n');
const end=html.lastIndexOf('</body>');
if(end<0) throw Error('Missing end of game document');
html=html.slice(0,end)+'<style id="lq77-style">'+styles+'</style>\n'+scripts+'\n'+html.slice(end);
fs.writeFileSync(target,html);
console.log(path.basename(target)+' · '+Buffer.byteLength(html)+' bytes · '+crypto.createHash('sha256').update(html).digest('hex'));
