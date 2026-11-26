'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {pipeline}=require('node:stream/promises');
const key=(process.env.ANTHROPIC_API_KEY||'').trim();
const model=process.env.CLAUDE_MODEL||'claude-haiku-4-5';
const port=Number(process.env.PORT||8787), origin=(process.env.RENDER_EXTERNAL_URL||`http://localhost:${port}`).replace(/\/$/,'');
const file=path.join(__dirname,'game.html');
let day='',used=0,active=0;const clients=new Map();
const limit=Math.max(1,Math.min(500,Number(process.env.AI_DAILY_REQUEST_LIMIT)||50));
const reply=(res,n,o)=>{res.writeHead(n,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(o));};
function convert(body){
 if(!Array.isArray(body?.contents)||!body.contents.length||body.contents.length>40)throw Error('Invalid messages');
 let total=0;const parts=p=>{if(!Array.isArray(p)||!p.length||p.length>8||p.some(x=>typeof x?.text!=='string'||x.text.length>24000))throw Error('Only text is supported');const t=p.map(x=>x.text).join('\n');total+=t.length;if(total>60000)throw Error('Prompt too long');return t;};
 const messages=[];for(const c of body.contents){if(!['user','model'].includes(c.role))throw Error('Invalid role');const role=c.role==='model'?'assistant':'user',content=parts(c.parts);if(!content.trim())continue;const last=messages.at(-1);if(last?.role===role)last.content+='\n'+content;else messages.push({role,content});}
 if(messages[0]?.role!=='user')throw Error('First turn must be user');
 if(messages.at(-1)?.role!=='user')throw Error('Last turn must be user');
 const g=body.generationConfig||{};let system=body.systemInstruction?typeof body.systemInstruction==='string'?parts([{text:body.systemInstruction}]):parts(body.systemInstruction.parts):'';
 if(g.responseMimeType==='application/json'){const schema=JSON.stringify(g.responseSchema||{});if(schema.length>12000)throw Error('Schema too large');system+='\nReturn only valid JSON, no Markdown. Follow this schema: '+schema;}
 return {model,messages,system,max_tokens:Math.min(4096,Math.max(32,Number(g.maxOutputTokens)||1024)),...(Number.isFinite(g.temperature)?{temperature:Math.max(0,Math.min(1,g.temperature))}:{})};
}
async function handler(req,res){
 const p=new URL(req.url,'http://localhost').pathname;
 if(p==='/health')return reply(res,200,{status:'running',release:'V107',provider:'Claude',configured:!!key,model});
 if(p==='/api/gemini'||p==='/api/claude'){
  if(req.method==='GET')return reply(res,200,{ok:!!key,provider:'Claude',models:['gemini-2.5-flash',model]});
  if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
  if(![origin,`http://localhost:${port}`,`http://127.0.0.1:${port}`].includes(req.headers.origin)||!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(res,403,{error:'Same-origin JSON required'});
  if(!key)return reply(res,503,{error:'ANTHROPIC_API_KEY not configured'});
  let size=0,chunks=[];for await(const c of req){size+=c.length;if(size>125*1024)return reply(res,413,{error:'Request too large'});chunks.push(c);}
  let input,request;try{input=JSON.parse(Buffer.concat(chunks));request=convert(input.body);}catch(e){return reply(res,400,{error:e.message});}
  const now=Date.now(),today=new Date(now).toISOString().slice(0,10);if(day!==today){day=today;used=0;}
  for(const [k,v] of clients)if(now-v.start>=3600000)clients.delete(k);
  const ip=req.socket.remoteAddress||'unknown';const c=clients.get(ip)||{start:now,n:0};clients.set(ip,c);
  if(used>=limit||active>=2||c.n>=20)return reply(res,429,{error:'AI request limit reached'});used++;c.n++;active++;
  try{const upstream=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01',...(process.env.ANTHROPIC_WORKSPACE_ID?{'anthropic-workspace-id':process.env.ANTHROPIC_WORKSPACE_ID}:{})},body:JSON.stringify(request),signal:AbortSignal.timeout(25000)});
   if(!upstream.ok){await upstream.body?.cancel();return reply(res,upstream.status,{error:{message:'Claude returned HTTP '+upstream.status}});}
   const data=await upstream.json();let text=(data.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');
   if(input.body.generationConfig?.responseMimeType==='application/json'){text=text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');try{JSON.parse(text);}catch{return reply(res,502,{error:'Claude returned invalid JSON'});}}
   return reply(res,200,{candidates:[{content:{role:'model',parts:[{text}]},finishReason:data.stop_reason==='max_tokens'?'MAX_TOKENS':'STOP'}],modelVersion:data.model});
  }catch{return reply(res,502,{error:'Claude temporarily unavailable'});}finally{active--;}
 }
 if(!['/','/index.html','/game.html'].includes(p)||!['GET','HEAD'].includes(req.method))return reply(res,404,{error:'Not found'});
 const stat=await fs.promises.stat(file);res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});if(req.method==='HEAD')return res.end();await pipeline(fs.createReadStream(file),res);
}
if(require.main===module)http.createServer((req,res)=>handler(req,res).catch(()=>{if(!res.headersSent&&!res.destroyed)reply(res,500,{error:'Internal error'});else res.destroy();})).listen(port,'0.0.0.0',()=>console.log('LifeQuest V107 ready; Claude configured:',!!key));
module.exports={convert,handler};
