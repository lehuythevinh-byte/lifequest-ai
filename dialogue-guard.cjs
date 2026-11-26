'use strict';
function stripNpcMetadata(value){
 if(typeof value!=='string')return '';
 let s=value.replace(/\r\n?/g,'\n').trim();
 // Metadata is never spoken. Require a label at a line boundary or explicit divider;
 // also catch distinctive machine-only keys when an AI puts them on the same line.
 const labels='topic[_ ]?status|affinity[_ ]?delta|mood[_ ]?source|reply[_ ]?source|goal[_ ]?done|vietnamese[_ ]?tip|natural[_ ]?alternative|remember|correction|mood|vocabulary|notice|system[_ ]?instruction';
 const labelStart=new RegExp('(?:^|\\n|\\s+---+\\s*)[\\t ]*(?:[-*]\\s+)?[\\s*"\'`_]*(?:'+labels+')[\\s*"\'`_]*[:=]','im');
 const machineInline= /[ \t]+(?:["'`*_]*)(?:topicStatus|affinityDelta|goalDone|vietnameseTip|naturalAlternative|replySource|moodSource)(?:["'`*_]*)\s*[:=]/i;
 const cut=[s.search(labelStart),s.search(machineInline)].filter(i=>i>=0);
 if(cut.length)s=s.slice(0,Math.min(...cut));
 s=s.replace(/(?:\n|\s)(?:[-*_]{3,})\s*$/,'').trim();
 return s;
}

(function patch(){
 const fs=require('node:fs');
 const file=process.argv[2]||'game.html';
 const original=fs.readFileSync(file);
 const start=original.indexOf('<script id="lq-offline-manifest51">'),end=original.indexOf(10,start);
 if(start<0||end-start<1000000)throw Error('Offline manifest boundary not found');
 const marker='/*LQ107_DIALOGUE_GUARD_MANIFEST_BOUNDARY*/';
 let src=original.subarray(0,start).toString('utf8')+marker+original.subarray(end+1).toString('utf8');
 function one(a,b){if(src.split(a).length!==2)throw Error('Missing or ambiguous dialogue guard anchor: '+a.slice(0,100));src=src.replace(a,b);}
 one("function lqNpcSafeText(value, fallback = '') {",stripNpcMetadata.toString()+"\n        function lqNpcSafeText(value, fallback = '') {");
 one("// Sometimes the provider emits malformed JSON with a valid reply property.",`           raw=stripNpcMetadata(raw);
           if(!raw)return fallback;
// Sometimes the provider emits malformed JSON with a valid reply property.`);
 const chunks=src.split(marker);
 if(chunks.length!==2)throw Error('Manifest boundary corrupted');
 const tmp=file+'.dialogue-guard.tmp',fd=fs.openSync(tmp,'w');
 try{fs.writeSync(fd,chunks[0]);fs.writeSync(fd,original.subarray(start,end+1));fs.writeSync(fd,chunks[1]);}finally{fs.closeSync(fd);}
 fs.renameSync(tmp,file);
 console.log('Dialogue guard active: NPC text, history and speech are sanitized.');
})();
