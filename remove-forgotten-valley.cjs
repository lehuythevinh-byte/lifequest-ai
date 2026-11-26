'use strict';
(function removeForgottenValley(){
 const fs = require('node:fs');
 const file = process.argv[2] || 'game.html';
 const bytes = fs.readFileSync(file);
 const start = bytes.indexOf('<script id="lq-offline-manifest51">');
 const end = bytes.indexOf('\n', start);
 if (start < 0 || end < 0 || end - start < 1000000) throw Error('Missing offline manifest boundary');
 const marker = '/*LQ_NO_VALLEY_MANIFEST_BOUNDARY*/';
 let src = bytes.subarray(0,start).toString('utf8') + marker + bytes.subarray(end+1).toString('utf8');
 function replaceOnce(from,to) {
   const pos = src.indexOf(from);
   if (pos < 0 || src.indexOf(from,pos+from.length) >= 0) throw Error('Missing or ambiguous anchor: '+from.slice(0,90));
   src = src.slice(0,pos)+to+src.slice(pos+from.length);
 }
 replaceOnce(`const lqValley = new ue(window.LQValleyContent.area);
        lqValley.obstacles = window.LQValleyContent.obstacles();
        LQPrecisePhysics.attachArea(lqValley);
        Se.unshift(lqValley);`, `// Retain a compatibility sentinel for shared scene hooks; do not construct or register this map.
        const lqValley = Object.freeze({id:'forgotten-valley'});`);
 replaceOnce(`if (window.LQFront && window.LQFront.areas) window.LQFront.areas.forEach((a) => Se.push(new ue(a)));`, `if (window.LQFront && window.LQFront.areas) window.LQFront.areas.filter(a=>a.id!==lqValley.id).forEach((a) => Se.push(new ue(a)));
        // Prevent any existing physical gate or interior portal from targeting the retired map.
        for (const area of Se) {
          area.warps = area.warps.filter(w=>w.to!==lqValley.id);
          area.portals = Object.fromEntries(Object.entries(area.portals).filter(([,p])=>p.to!==lqValley.id));
        }`);
 replaceOnce('const enteringValley = e.area === `english-town` &&\n                (!Object.hasOwn(e, `forgottenValley`) || e.forgottenValley?.schema === 1);\n              const startingArea = enteringValley ? lqValley.id : e.area;', `// Existing Valley saves return to English Town's normal spawn; preserve all learning/world history.
              if(e.area===lqValley.id)e.area='english-town';
              if(e.rpg?.lastPosition?.area===lqValley.id)delete e.rpg.lastPosition;
              if(e.rpg?.lastInterior?.area===lqValley.id)delete e.rpg.lastInterior;
              const startingArea=e.area;`);
 replaceOnce('switchArea(e, t, n) {\n              if (window.LQCareerWorlds', `switchArea(e, t, n) {
              if(e===lqValley.id)return;
              if (window.LQCareerWorlds`);
 replaceOnce("          'forgotten-valley': { icon: '🔔', label: 'ET · FORGOTTEN HAMLET', desc: 'Restore a hamlet beside the woods, learn from Arven and Lyra, and follow the sound of the bell.' },\n",'');
 replaceOnce("    ['Forgotten Valley','forgotten|valley-50','Viết kế hoạch xây cầu, nêu mốc thời gian và một điều kiện làm thay đổi kế hoạch.', ['conditional','perfect','modal']],\n",'');
 replaceOnce('if(globalThis.LQPrimary1056?.enabled){btn.disabled=true;const proceed=await globalThis.LQPrimary1056.beforeStart();if(!proceed){done=false;btn.disabled=false;return;}btn.disabled=false;}', '/* Retired Valley-only checkpoint prompt: old saved data remains intact. */');
 for(const id of ['lq1044-external-trade','lq-v1062-camera-fix']) {
  const tag='<script id="'+id+'">';
  const a=src.indexOf(tag),b=src.indexOf('</script>',a);
  if(a<0||b<0)throw Error('Missing Valley-only script '+id);
  src=src.slice(0,a)+src.slice(b+'</script>'.length);
 }
 if(src.includes('Se.unshift(lqValley)')||src.includes('new ue(window.LQValleyContent.area)')||src.includes('const startingArea = enteringValley'))throw Error('Valley registration still active');
 const chunks=src.split(marker);
 if(chunks.length!==2)throw Error('Manifest boundary corrupted');
 const tmp=file+'.no-valley.tmp';
 const fd=fs.openSync(tmp,'w');
 try{fs.writeSync(fd,chunks[0]);fs.writeSync(fd,bytes.subarray(start,end+1));fs.writeSync(fd,chunks[1]);}finally{fs.closeSync(fd);}
 fs.renameSync(tmp,file);
 console.log('Forgotten Valley removed from map registry, travel, startup and lesson catalogue; compatibility data preserved.');
})();
