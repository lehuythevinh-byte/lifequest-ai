'use strict';
(function patchRateGuard(){
 const fs=require('node:fs'), file=process.argv[2]||'game.html',bytes=fs.readFileSync(file);
 const start=bytes.indexOf('<script id="lq-offline-manifest51">'),end=bytes.indexOf(10,start);
 if(start<0||end-start<1000000)throw Error('Missing offline manifest');
 const marker='/*LQ107_RATE_GUARD_BOUNDARY*/';
 let s=bytes.subarray(0,start).toString('utf8')+marker+bytes.subarray(end+1).toString('utf8');
 function one(a,b){if(s.split(a).length!==2)throw Error('Missing or ambiguous rate guard anchor: '+a.slice(0,100));s=s.replace(a,b);}
 one('this.lastRetryAfterSec = 0;\n              try {',`this.lastRetryAfterSec = 0;
              const retryHeader=Number(e.headers.get('Retry-After'));
              if(Number.isFinite(retryHeader)&&retryHeader>0)this.lastRetryAfterSec=Math.ceil(retryHeader);
              try {`);
 const old='`Claude request limit reached. Wait a minute and try again.`';
 one(old,'(t || `Claude request limit reached. Check the request budget or retry later.`) + (this.lastRetryAfterSec ? ` Retry in approximately ${this.lastRetryAfterSec>=60?Math.ceil(this.lastRetryAfterSec/60)+" min":this.lastRetryAfterSec+" s"}.` : ``)');
 one('let secs = Math.min(120, Math.max(20, err.retryAfterSec || 30));','let secs = Math.min(86400, Math.max(1, err.retryAfterSec || 60));');
 one('return `The AI is resting for about ${this.coolSecondsLeft()}s (Claude request limit reached), so this reply is offline. You can keep chatting.`;', 'return `AI request limit reached. This reply is offline; retry online in approximately ${this.coolSecondsLeft()>=60?Math.ceil(this.coolSecondsLeft()/60)+" min":this.coolSecondsLeft()+" s"}. You can keep chatting.`;');
 one('cooldown=Date.now()+Math.max(5000,Math.min(60000,Number.isFinite(delay)&&delay>0?delay*1000:10000));','cooldown=Date.now()+Math.max(1000,Math.min(86400000,Number.isFinite(delay)&&delay>0?delay*1000:60000));');
 one("if(!response.ok){const e=new Error('HTTP '+response.status);e.status=response.status;throw e;}",`if(!response.ok){const body=await response.json().catch(()=>({}));const e=new Error(body?.error?.message||'HTTP '+response.status);e.status=response.status;e.code=body?.error?.code;throw e;}`);
 one("error.status===429?'Claude đang giới hạn số lượt gọi. Hãy thử lại sau hoặc kiểm tra hạn mức trên Render.'","error.status===429?(error.message||'Đã đạt giới hạn lượt AI. Hãy kiểm tra hạn mức và thời gian đặt lại.')");
 one('var Rt = class {','const lq107WordCache = new Map();\nvar Rt = class {');
 one('async explain(e) {\n              return At(\n                await this.generate({','async explain(e) {\n              const word=String(e||"").trim();\n              const cacheKey=/^[A-Za-z][A-Za-z-]{0,39}$/.test(word)?this.model+"|"+word:null;\n              if(cacheKey&&lq107WordCache.has(cacheKey))return {...lq107WordCache.get(cacheKey)};\n              const result=At(\n                await this.generate({');
 one('responseSchema: Lt,\n                  },\n                }),\n              );\n            }\n            async test()',`responseSchema: Lt,
                  },
                }),
              );
              if(cacheKey&&result.term&&result.meaning&&result.vi){
                if(lq107WordCache.size>=300)lq107WordCache.delete(lq107WordCache.keys().next().value);
                lq107WordCache.set(cacheKey,{...result});
              }
              return result;
            }
            async test()`);
 const chunks=s.split(marker);if(chunks.length!==2)throw Error('Invalid manifest boundary');
 const tmp=file+'.rate-guard.tmp',fd=fs.openSync(tmp,'w');try{fs.writeSync(fd,chunks[0]);fs.writeSync(fd,bytes.subarray(start,end+1));fs.writeSync(fd,chunks[1]);}finally{fs.closeSync(fd);}
 fs.renameSync(tmp,file);console.log('Rate limit messages and session dictionary cache enabled.');
})();
