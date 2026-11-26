'use strict';
(function patchReplyOrder(){
 const fs=require('node:fs');
 const file=process.argv[2]||'game.html';
 const original=fs.readFileSync(file);
 const tag=Buffer.from('<script id="lq-offline-manifest51">');
 const start=original.indexOf(tag),end=original.indexOf(10,start);
 if(start<0||end<0||end-start<1000000)throw Error('Offline manifest boundary not found');
 const marker='/*LQ107_REPLY_FIRST_MANIFEST_BOUNDARY*/';
 let s=original.subarray(0,start).toString('utf8')+marker+original.subarray(end+1).toString('utf8');
 function replaceOnce(a,b){if(s.split(a).length!==2)throw Error('Missing or ambiguous anchor: '+a.slice(0,100));s=s.replace(a,b);}
 const feedback=`               if(this.teacherOn&&correction){
                 guardian.record(correction);
                 if(correction.validationStatus!=="UNVERIFIED"||correction.detectedErrors.length)i.insertAdjacentElement("afterend",guardian.render(correction,feedbackHooks));
               }
`;
 const reply=`              speechService.speak(l.reply);
              (LQ80.turnEnd(this,l),this.append(\x60npc\x60, \x60\${r}: \${l.reply}\x60, l.mood,l.moodSource),
                l.notice && this.append(\x60fix\x60, \x60⚠ \${l.notice}\x60));`;
 replaceOnce(feedback,'');
 replaceOnce(reply,reply+`\n              // Display the NPC's answer first, then the original Meaning Guardian feedback.\n              if(this.teacherOn&&correction){\n                guardian.record(correction);\n                if(correction.validationStatus!=="UNVERIFIED"||correction.detectedErrors.length){\n                  this.logEl.append(guardian.render(correction,feedbackHooks));\n                  this.logEl.scrollTop=this.logEl.scrollHeight;\n                }\n              }`);
 const chunks=s.split(marker);if(chunks.length!==2)throw Error('Manifest boundary corrupted');
 const tmp=file+'.reply-first.tmp',fd=fs.openSync(tmp,'w');try{fs.writeSync(fd,chunks[0]);fs.writeSync(fd,original.subarray(start,end+1));fs.writeSync(fd,chunks[1]);}finally{fs.closeSync(fd);}
 fs.renameSync(tmp,file);
 console.log('NPC response first; Meaning Guardian feedback after reply.');
})();
