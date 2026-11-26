'use strict';
(function patchGrammar(){
 const fs=require('node:fs');
 const file=process.argv[2]||'game.html',bytes=fs.readFileSync(file);
 const start=bytes.indexOf('<script id="lq-offline-manifest51">'),end=bytes.indexOf(10,start);
 if(start<0||end-start<1000000)throw Error('Missing offline manifest');
 const marker='/*LQ107_GRAMMAR_GUARD_BOUNDARY*/';
 let src=bytes.subarray(0,start).toString('utf8')+marker+bytes.subarray(end+1).toString('utf8');
 function one(a,b){if(src.split(a).length!==2)throw Error('Missing or ambiguous anchor: '+a.slice(0,100));src=src.replace(a,b);}
 one("try{return localStorage.getItem('lq107-correction-mode')==='online';}catch{return false;}","try{return localStorage.getItem('lq107-correction-mode-v2')!=='offline';}catch{return true;}");
 one("localStorage.setItem('lq107-correction-mode',mode.value)","localStorage.setItem('lq107-correction-mode-v2',mode.value)");
 one("if (nounBase.has(v.toLowerCase()) || /^\\s+to\\b/i.test(rest)) return m;","if (nounBase.has(v.toLowerCase()) || (form===v.toLowerCase() && /^\\s+to\\b/i.test(rest))) return m;");
 one("const evaluate=(text,context,signal)=>core.evaluate(text,context,{mode:onlineEnabled()?'online':'offline',signal});",`const evaluate=async(text,context,signal)=>{
    const local=core.assessLocal(text,context);
    const online=onlineEnabled();
    if(!online)return local;
    const complex=local.validationStatus===core.S.PASS&&(/\\b(?:and|but|because|although|while|when|if|which|that|unless)\\b/i.test(text)||text.trim().split(/\\s+/).length>12);
    const checked=await core.evaluate(text,context,{mode:'online',forceOnline:complex,signal});
    if(complex&&checked.validationStatus===core.S.PROVIDER_ERROR)return {...local,validationMethod:'local rules only (online verification unavailable)',vietnameseExplanation:'Đã sửa các lỗi nhận diện được bằng quy tắc cục bộ; chưa kiểm chứng toàn bộ câu qua Claude.'};
    return checked;
  };`);
 one("const open=details(reveal,'Xem câu sửa tối thiểu');","const open=details(reveal,'Câu sửa tối thiểu');open.open=true;");
 one("const why=details(open,'Xem giải thích');","const why=details(open,'Xem giải thích');why.open=true;");
 one('if(correction.validationStatus!=="UNVERIFIED"||correction.detectedErrors.length){','{ // Always show the actual validation status, even when no safe correction was found.');
 one("state.dataset.status=r.validationStatus;",`state.dataset.status=r.validationStatus;
    if(r.validationMethod==='local rules only (online verification unavailable)')state.textContent='✓ Đã sửa lỗi nhận diện được · Chưa xác minh toàn câu qua Claude';`);
 one("vietnameseExplanation:'Lượt kiểm tra AI không trả về dữ liệu có thể sử dụng.'",`vietnameseExplanation:error.status===429?'Claude đang giới hạn số lượt gọi. Hãy thử lại sau hoặc kiểm tra hạn mức trên Render.':error.status===401||error.status===403?'Claude chưa được cấp quyền hoặc khóa API không hợp lệ.':error.name==='TimeoutError'?'Claude phản hồi quá thời gian cho phép. Hãy thử lại.':'Claude chưa trả về dữ liệu sửa câu hợp lệ. Hãy thử lại.'`);
 one('                  (this.input.value = t),\n                  (this.busy = !1),\n                  this.input.focus());\n                return;\n              }\n              this.root.querySelector',`                  (this.input.value = t),
                  (this.busy = !1),
                  this.input.focus());
                if(this.teacherOn&&correction){guardian.record(correction);this.logEl.append(guardian.render(correction,feedbackHooks));this.logEl.scrollTop=this.logEl.scrollHeight;}
                return;
              }
              this.root.querySelector`);
 const chunks=src.split(marker);if(chunks.length!==2)throw Error('Invalid manifest boundary');
 const tmp=file+'.grammar-guard.tmp',fd=fs.openSync(tmp,'w');try{fs.writeSync(fd,chunks[0]);fs.writeSync(fd,bytes.subarray(start,end+1));fs.writeSync(fd,chunks[1]);}finally{fs.closeSync(fd);}
 fs.renameSync(tmp,file);console.log('Meaning Guardian online-by-default, visible feedback, and grammar rule fix applied.');
})();
