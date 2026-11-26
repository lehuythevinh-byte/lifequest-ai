'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {pipeline}=require('node:stream/promises');
const key=(process.env.ANTHROPIC_API_KEY||'').trim();
const model=(process.env.CLAUDE_MODEL||'claude-haiku-4-5').trim();
const port=Number(process.env.PORT||8787), origin=(process.env.RENDER_EXTERNAL_URL||`http://localhost:${port}`).replace(/\/$/,'');
const file=path.join(__dirname,'game.html');
let day='',used=0,active=0;const clients=new Map();
const limit=Math.max(1,Math.min(500,Number(process.env.AI_DAILY_REQUEST_LIMIT)||50));
const hourlyLimit=Math.max(1,Math.min(500,Math.floor(Number(process.env.AI_HOURLY_REQUEST_LIMIT)||20)));
const reply=(res,n,o,headers={})=>{res.writeHead(n,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(o));};
function limited(res,status,code,message,seconds){
 const retryAfterSec=Math.max(1,Math.ceil(seconds));
 return reply(res,status,{error:{code,message,retryAfterSec}},{'Retry-After':String(retryAfterSec)});
}
function checkBudget(now,used,limit,active,client,hourlyLimit){
 if(used>=limit)return {status:429,code:'LOCAL_DAILY_LIMIT',message:'LifeQuest daily AI limit reached. Try again after the UTC daily reset or ask the administrator to review the request budget.',seconds:(Date.parse(new Date(now).toISOString().slice(0,10)+'T00:00:00Z')+86400000-now)/1000};
 if(client.n>=hourlyLimit)return {status:429,code:'LOCAL_HOURLY_LIMIT',message:'LifeQuest hourly AI limit reached. Wait for the hourly reset.',seconds:(client.start+3600000-now)/1000};
 if(active>=2)return {status:503,code:'LOCAL_BUSY',message:'LifeQuest AI is busy with other requests. Try again shortly.',seconds:5};
 return null;
}
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
function makeStructured(body, system, messages){
 const g=body.generationConfig||{};
 if(g.responseMimeType!=="application/json"){
  if(system.includes("## Now\nThe player has just walked up to you.")&&messages.length===1&&messages[0]?.role==="user"&&messages[0]?.content==="*The player walks up to you.*"){
   return {mode:"greeting",schema:{type:"object",properties:{reply:{type:"string",description:"Only the NPC's natural spoken greeting. No labels, metadata or Markdown."}},required:["reply"],additionalProperties:false}};
  }
  return null;
 }
 const str=()=>({type:"string"}), bool=()=>({type:"boolean"});
 const obj=(properties,required=Object.keys(properties))=>({type:"object",properties,required,additionalProperties:false});
 const strings=(...keys)=>obj(Object.fromEntries(keys.map(k=>[k,str()])));
 const arr=items=>({type:"array",items});
 function normalize(raw,depth=0){
  if(!raw||typeof raw!=="object"||Array.isArray(raw)||depth>12)throw Error("Unsupported JSON schema");
  const type=String(raw.type||"").toLowerCase();
  if(!["object","array","string","integer","number","boolean","null"].includes(type))throw Error("Unsupported JSON schema type");
  const out={type};
  if(typeof raw.description==="string")out.description=raw.description.slice(0,1000);
  if(Array.isArray(raw.enum)&&raw.enum.length&&raw.enum.length<=100&&raw.enum.every(v=>v===null||["string","number","boolean"].includes(typeof v)))out.enum=raw.enum;
  if(type==="object"){
   const props=Object.entries(raw.properties||{});
   if(!props.length||props.length>60)throw Error("Invalid JSON schema properties");
   out.properties=Object.fromEntries(props.map(([k,v])=>[k,normalize(v,depth+1)]));
   out.required=Array.isArray(raw.required)?raw.required.filter(k=>Object.hasOwn(out.properties,k)):props.map(([k])=>k);
   out.additionalProperties=false;
  }
  if(type==="array")out.items=normalize(raw.items,depth+1);
  if(raw.nullable===true&&type!=="null")return {anyOf:[out,{type:"null"}]};
  return out;
 }
 let schema,mode="direct";
 if(g.responseSchema){
  if(JSON.stringify(g.responseSchema).length>12000)throw Error("Schema too large");
  schema=normalize(g.responseSchema);
 }else if(system.startsWith("You are the English Teacher for LifeQuest.")){
  schema=obj({...Object.fromEntries(["minimalCorrection","naturalAlternative","vietnameseExplanation","englishExplanation","clarificationQuestion","errorType"].map(k=>[k,str()])),noCorrectionNeeded:bool(),clarificationOptions:arr(strings("label","sentence"))});
 }else if(system.startsWith("You independently examine a proposed English correction for LifeQuest.")){
  schema=obj(Object.fromEntries(["meaningPreserved","grammarCorrect","minimal","explanationCorrect","needsClarification"].map(k=>[k,bool()])));
 }else{
  const prompt=messages[0]?.content||"";
  if(prompt.startsWith("You are an English tutor.")&&prompt.includes("JSON array of three strings"))schema=arr(str());
  else if(prompt.startsWith("Create engaging English-learning RPG dialogue quest flavor."))schema=strings("title","summary_vi","instruction_en");
  else if(prompt.startsWith("You are an English-learning quest recommender for a fictional valley."))schema=strings("id","why");
  else if(prompt.startsWith("Return only a JSON array with exactly three objects, one for each of these IDs:")||prompt.startsWith("Roleplay an educational discussion between three fictional valley specialists."))schema=arr(strings("id","text"));
  else {schema=strings("json");mode="serialized";}
 }
 if(mode==="direct"&&schema.type!=="object"){schema=obj({result:schema});mode="wrapped";}
 return {schema,mode};
}
function decodeStructured(data,mode){
 if(data.stop_reason==="refusal")throw Object.assign(Error("Claude declined this request"),{code:"REFUSAL"});
 if(data.stop_reason==="max_tokens")throw Object.assign(Error("Claude response exceeded token budget"),{code:"MAX_TOKENS"});
 const raw=(data.content||[]).filter(x=>x.type==="text").map(x=>x.text).join("\n").trim();
 if(!raw)throw Object.assign(Error("Claude returned an empty response"),{code:"EMPTY_RESPONSE"});
 if(!mode)return raw;
 let parsed=JSON.parse(raw.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,""));
 if(mode==="greeting"){
  const clean=stripNpcMetadata(parsed?.reply);
  if(!clean)throw Object.assign(Error("Claude returned no usable greeting"),{code:"EMPTY_RESPONSE"});
  return clean;
 }
 if(mode==="wrapped"){if(!parsed||!Object.hasOwn(parsed,"result"))throw Error("Missing structured result");parsed=parsed.result;}
 if(mode==="serialized"){if(typeof parsed?.json!=="string")throw Error("Missing serialized JSON");parsed=JSON.parse(parsed.json);}
 if(parsed===null||typeof parsed!=="object")throw Error("Expected JSON object or array");
 if(!Array.isArray(parsed)&&typeof parsed.reply==="string"&&(Object.hasOwn(parsed,"topicStatus")||Object.hasOwn(parsed,"affinityDelta")||Object.hasOwn(parsed,"goalDone"))){
  parsed.reply=stripNpcMetadata(parsed.reply);
  if(!parsed.reply)throw Object.assign(Error("Claude returned no usable dialogue"),{code:"EMPTY_RESPONSE"});
 }
 return JSON.stringify(parsed);
}
function convert(body){
 if(!Array.isArray(body?.contents)||!body.contents.length||body.contents.length>40)throw Error('Invalid messages');
 let total=0;const parts=p=>{if(!Array.isArray(p)||!p.length||p.length>8||p.some(x=>typeof x?.text!=='string'||x.text.length>24000))throw Error('Only text is supported');const t=p.map(x=>x.text).join('\n');total+=t.length;if(total>60000)throw Error('Prompt too long');return t;};
 const messages=[];for(const c of body.contents){if(!['user','model'].includes(c.role))throw Error('Invalid role');const role=c.role==='model'?'assistant':'user',content=parts(c.parts);if(!content.trim())continue;const last=messages.at(-1);if(last?.role===role)last.content+='\n'+content;else messages.push({role,content});}
 if(messages[0]?.role!=='user')throw Error('First turn must be user');
 if(messages.at(-1)?.role!=='user')throw Error('Last turn must be user');
 const g=body.generationConfig||{};let system=body.systemInstruction?typeof body.systemInstruction==='string'?parts([{text:body.systemInstruction}]):parts(body.systemInstruction.parts):'';
 const structured=makeStructured(body,system,messages);
 if(structured){
   if(structured.mode==='greeting')system+='\nFINAL OUTPUT RULE FOR THIS GREETING: Only return the structured reply field. Earlier instructions about topicStatus, mood, affinityDelta, corrections, memory and quest fields do not apply to this greeting. Never put those fields inside reply.';
   else if(structured.mode==='wrapped')system+='\nReturn the requested output inside the result property. The result must be the requested JSON value.';
   else if(structured.mode==='serialized')system+='\nPut the complete requested JSON object or array, serialized as a JSON string, inside the json property. Do not add Markdown.';
   else system+='\nFollow the supplied JSON output schema. Preserve the learner meaning and use empty strings or arrays when the task specifies them.';
 }
 return {request:{model,messages,system,max_tokens:Math.min(8192,Math.max(structured?2048:128,Number(g.maxOutputTokens)||1536)),...(structured?{output_config:{format:{type:'json_schema',schema:structured.schema}}}:{}),...(Number.isFinite(g.temperature)?{temperature:Math.max(0,Math.min(1,g.temperature))}:{})},mode:structured?.mode||null};
}
async function handler(req,res){
 const p=new URL(req.url,'http://localhost').pathname;
 if(p==='/health')return reply(res,200,{status:'running',release:'V107-Claude.4-RateGuard',structuredOutput:true,provider:'Claude',configured:!!key,model});
 if(p==='/api/gemini'||p==='/api/claude'){
  if(req.method==='GET')return reply(res,200,{ok:!!key,provider:'Claude',model,models:[model]});
  if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
  if(![origin,`http://localhost:${port}`,`http://127.0.0.1:${port}`].includes(req.headers.origin)||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(res,403,{error:'Same-origin JSON required'});
  if(!key)return reply(res,503,{error:{message:'ANTHROPIC_API_KEY not configured in Render'}});
  let size=0,chunks=[];for await(const c of req){size+=c.length;if(size>125*1024)return reply(res,413,{error:'Request too large'});chunks.push(c);}
  let input,request,mode;try{input=JSON.parse(Buffer.concat(chunks));({request,mode}=convert(input.body));}catch(e){return reply(res,400,{error:e.message});}
  const now=Date.now(),today=new Date(now).toISOString().slice(0,10);if(day!==today){day=today;used=0;}
  for(const [k,v] of clients)if(now-v.start>=3600000)clients.delete(k);
  const ip=req.socket.remoteAddress||'unknown';const c=clients.get(ip)||{start:now,n:0};clients.set(ip,c);
  const blocked=checkBudget(now,used,limit,active,c,hourlyLimit);
  if(blocked)return limited(res,blocked.status,blocked.code,blocked.message,blocked.seconds);
  used++;c.n++;active++;
  try{const upstream=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01',...(process.env.ANTHROPIC_WORKSPACE_ID?{'anthropic-workspace-id':process.env.ANTHROPIC_WORKSPACE_ID}:{})},body:JSON.stringify(request),signal:AbortSignal.timeout(25000)});
   if(!upstream.ok){await upstream.body?.cancel();const status=upstream.status;
    if(status===429){const header=upstream.headers.get('retry-after');const numeric=Number(header);const date=Date.parse(header||'');const delay=header&&Number.isFinite(numeric)&&numeric>0?numeric:Number.isFinite(date)?Math.max(1,(date-Date.now())/1000):60;console.warn('[Claude upstream] 429',upstream.headers.get('request-id')||'');return limited(res,429,'ANTHROPIC_RATE_LIMIT','Claude API rate limit reached. Check Anthropic usage and rate limits if this continues.',delay);}
    const msg=({400:'Claude rejected request; check model and request format',401:'Claude API key invalid',403:'Claude API access denied',404:'Claude model not available; check CLAUDE_MODEL',429:'Claude rate limit or quota reached',529:'Claude service overloaded'})[status]||'Claude upstream HTTP '+status;console.warn('[Claude upstream]',status,upstream.headers.get('request-id')||'');return reply(res,status,{error:{message:msg,code:status}});}
   const data=await upstream.json();let text;
   try{text=decodeStructured(data,mode);}catch(err){const code=err.code||'INVALID_JSON';console.warn('[Claude output]',code,data.stop_reason||'unknown',upstream.headers.get('request-id')||'');return reply(res,code==='REFUSAL'?422:502,{error:{message:err.code?err.message:'Claude returned malformed structured JSON; retry the conversation',code}});}
   return reply(res,200,{candidates:[{content:{role:'model',parts:[{text}]},finishReason:data.stop_reason==='max_tokens'?'MAX_TOKENS':'STOP'}],modelVersion:data.model});
  }catch(err){const timed=err?.name==='TimeoutError'||err?.name==='AbortError';console.warn('[Claude transport]',err?.name||'unknown');return reply(res,timed?504:502,{error:{message:timed?'Claude request timed out':'Claude network connection failed',code:timed?'TIMEOUT':'UPSTREAM_NETWORK'}});}finally{active--;}
 }
 if(!['/','/index.html','/game.html'].includes(p)||!['GET','HEAD'].includes(req.method))return reply(res,404,{error:'Not found'});
 const stat=await fs.promises.stat(file);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();await pipeline(fs.createReadStream(file),res);
}
if(require.main===module)http.createServer((req,res)=>handler(req,res).catch(()=>{if(!res.headersSent&&!res.destroyed)reply(res,500,{error:'Internal error'});else res.destroy();})).listen(port,'0.0.0.0',()=>console.log('LifeQuest V107 ready; Claude configured:',!!key));
module.exports={convert,handler,makeStructured,decodeStructured,stripNpcMetadata,checkBudget};
