'use strict';
// LifeQuest V75 — server-side Gemini relay. Never send GEMINI_API_KEY to the browser.
// Node.js built-ins only; no packages or build tooling required.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const partsDir = path.join(__dirname,'../dream-gate/parts');
const names = fs.readdirSync(partsDir).filter(n => /^p\d{3}\.txt$/.test(n)).sort();
if (names.length !== 53) throw new Error('Incomplete Dream Gate release');
const baseGame = Buffer.concat(names.map(n => fs.readFileSync(path.join(partsDir,n))));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
if (hash(baseGame) !== 'e38d3cc79dcab29f526ff1f22ae196623cd4c9d9814bb9d691a5ad0067267a5a') throw new Error('Dream Gate source integrity mismatch');
const releaseDir = path.join(__dirname, '../../v75');
const changes = ['patch-1.json','patch-2.json','patch-3.json'].flatMap(n => JSON.parse(fs.readFileSync(path.join(releaseDir,n),'utf8')));
const lines = baseGame.toString('utf8').split('\n');
let upper = lines.length;
for (const [start,end,replacement] of changes.sort((a,b) => b[0]-a[0])) {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end > upper || !Array.isArray(replacement) || replacement.some(s => typeof s !== 'string')) throw new Error('Invalid V75 release patch');
  lines.splice(start,end-start,...replacement);
  upper = start;
}
const game = Buffer.from(lines.join('\n'),'utf8');
const gameHash = hash(game);
if (gameHash !== 'cfca725459d8ae14b7a78314c47ccd4c2eebf1c487e366a9e535ed3fb400692a') throw new Error('V75 source integrity mismatch');
const ownOrigin = (process.env.RENDER_EXTERNAL_URL || 'https://lifequest-ai-v70-gemini.onrender.com').replace(/\/$/, '');

const PORT = Number(process.env.PORT || 10000);
const ORIGIN = (process.env.ALLOWED_ORIGIN || 'https://lifequest-ai-v70-apikey.onrender.com').replace(/\/$/, '');
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const GEMINI_MODEL = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
const MAX_DAILY = Math.min(100, Math.max(1, Number(process.env.AI_DAILY_REQUEST_LIMIT || 50)));
const MAX_PER_IP_HOUR = Math.min(30, Math.max(1, Number(process.env.AI_PER_IP_HOURLY_LIMIT || 12)));
const MAX_ACTIVE = 2;
const MAX_BODY_BYTES = 64 * 1024;
const GOOGLE_TIMEOUT_MS = 27000;
const WINDOW_HOUR = 60 * 60 * 1000;
let daily = { day: '', count: 0 };
let active = 0;
const ipCounters = new Map();

function respond(res, code, json) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, private',
    'X-Content-Type-Options': 'nosniff',
    'Vary': 'Origin',
  });
  res.end(JSON.stringify(json));
}

function allowCors(req, res) {
  const origin = req.headers.origin;
  if (origin !== ORIGIN && origin !== ownOrigin) return false;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '600');
  return true;
}

async function readJson(req) {
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    const error = new Error('Expected application/json'); error.httpStatus = 415; throw error;
  }
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.byteLength;
    if (bytes > MAX_BODY_BYTES) {
      const error = new Error('Request too large'); error.httpStatus = 413; throw error;
    }
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { const error = new Error('Invalid JSON'); error.httpStatus = 400; throw error; }
}

function sanitize(input) {
  const body = input && input.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Missing Gemini request body');
  if (!Array.isArray(body.contents) || !body.contents.length || body.contents.length > 50) {
    throw new Error('Gemini contents must contain 1–50 messages');
  }
  let characterCount = 0;
  function cleanParts(parts) {
    if (!Array.isArray(parts) || parts.length < 1 || parts.length > 12) throw new Error('Invalid message parts');
    return parts.map((part) => {
      if (!part || typeof part.text !== 'string' || part.text.length > 16000) throw new Error('Only text prompts are supported');
      characterCount += part.text.length;
      if (characterCount > 30000) throw new Error('Prompt too long');
      return { text: part.text };
    });
  }
  const contents = body.contents.map((msg) => {
    if (!msg || !['user', 'model'].includes(msg.role)) throw new Error('Invalid message role');
    return { role: msg.role, parts: cleanParts(msg.parts) };
  });
  const result = { contents };
  if (body.systemInstruction) {
    const system = body.systemInstruction;
    if (typeof system === 'string') {
      result.systemInstruction = { parts: cleanParts([{ text: system }]) };
    } else {
      result.systemInstruction = { parts: cleanParts(system.parts) };
    }
  }
  const gen = body.generationConfig || {};
  const config = {};
  if (Number.isFinite(gen.temperature)) config.temperature = Math.min(1.4, Math.max(0, gen.temperature));
  if (Number.isFinite(gen.topP)) config.topP = Math.min(1, Math.max(0, gen.topP));
  if (Number.isFinite(gen.topK)) config.topK = Math.min(50, Math.max(1, Math.round(gen.topK)));
  config.maxOutputTokens = Math.min(768, Math.max(16, Number(gen.maxOutputTokens) || 450));
  if (gen.responseMimeType === 'application/json') config.responseMimeType = 'application/json';
  if (gen.responseSchema && typeof gen.responseSchema === 'object' &&
      JSON.stringify(gen.responseSchema).length < 10000) {
    config.responseSchema = gen.responseSchema;
  }
  if (/^gemini-2\.5-/.test(GEMINI_MODEL)) config.thinkingConfig = { thinkingBudget: 0 };
  result.generationConfig = config;
  return result;
}

function checkLimits(req) {
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  if (day !== daily.day) daily = { day, count: 0 };
  for (const [address, entry] of ipCounters) {
    if (now - entry.started >= WINDOW_HOUR) ipCounters.delete(address);
  }
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const address = (forwarded || req.socket.remoteAddress || 'unknown').slice(0, 70);
  let entry = ipCounters.get(address);
  if (!entry) { entry = { started: now, count: 0 }; ipCounters.set(address, entry); }
  if (daily.count >= MAX_DAILY) return 'Daily AI request limit reached; try tomorrow.';
  if (entry.count >= MAX_PER_IP_HOUR) return 'Hourly AI request limit reached; try later.';
  if (active >= MAX_ACTIVE) return 'AI service is busy; try again shortly.';
  daily.count++; entry.count++; active++;
  return null;
}

http.createServer(async (req, res) => {
  try {
    // Opening the service URL in a browser should take players to the game.
    if (['/','/index.html'].includes(req.url.split('?')[0]) && ['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(200, { 'Content-Type':'text/html; charset=utf-8', 'Content-Length':game.length, 'Cache-Control':'no-cache', 'X-Content-Type-Options':'nosniff', 'X-LifeQuest-Release':'V75-Context-Aware-NPC' });
      res.end(req.method === 'HEAD' ? undefined : game);
      return;
    }
    if (req.url === '/health') {
      respond(res, 200, { service: 'lifequest-gemini-proxy', status: 'running', release:'V75-Context-Aware-NPC', sha256:gameHash, configured: !!GEMINI_API_KEY });
      return;
    }
    if (req.url !== '/api/gemini') {
      respond(res, 404, { error: 'Not found' }); return;
    }
    // A direct browser visit can inspect configuration status. Actual AI use
    // still requires the configured frontend origin and the normal POST limits.
    if (req.method === 'GET' && !req.headers.origin) {
      respond(res, 200, { ok: !!GEMINI_API_KEY, provider: 'Gemini', managedBy: 'Render' }); return;
    }
    if (!allowCors(req, res)) { respond(res, 403, { error: 'Origin not permitted' }); return; }
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'Cache-Control': 'no-store' }); res.end(); return; }
    if (req.method === 'GET') {
      respond(res, 200, { ok: !!GEMINI_API_KEY, provider: 'Gemini', managedBy: 'Render' }); return;
    }
    if (req.method !== 'POST') { respond(res, 405, { error: 'Method not allowed' }); return; }
    if (!GEMINI_API_KEY) { respond(res, 503, { error: 'GEMINI_API_KEY is not configured in Render environment.' }); return; }
    let requestBody;
    try { requestBody = sanitize(await readJson(req)); }
    catch (err) { respond(res, err.httpStatus || 400, { error: err.message || 'Invalid request' }); return; }
    const limitError = checkLimits(req);
    if (limitError) { respond(res, 429, { error: limitError }); return; }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), GOOGLE_TIMEOUT_MS);
      let response;
      try {
        response = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/' +
            encodeURIComponent(GEMINI_MODEL) + ':generateContent',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
            body: JSON.stringify(requestBody),
            signal: controller.signal,
          }
        );
      } finally { clearTimeout(timer); }
      const upstreamJson = await response.json().catch(() => ({}));
      if (!response.ok) {
        // Do not echo Google request headers, credentials, or raw upstream stack traces.
        const safeMsg = response.status === 429 ? 'Gemini quota exceeded.'
          : response.status === 400 ? 'Gemini could not process this request.'
          : response.status === 401 || response.status === 403 ? 'Gemini credentials or permissions are invalid.'
          : 'Gemini returned an error.';
        respond(res, response.status >= 400 && response.status < 500 ? response.status : 502, {
          error: { message: safeMsg, code: response.status },
        });
        return;
      }
      respond(res, 200, upstreamJson);
    } catch (err) {
      respond(res, err && err.name === 'AbortError' ? 504 : 502, { error: { message: 'Gemini is temporarily unavailable.' } });
    } finally { active--; }
  } catch (err) {
    console.error('[lifequest-relay]', err?.message || 'unhandled error');
    if (!res.headersSent) respond(res, 500, { error: 'Internal server error' });
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log('[lifequest-relay] ready on port', PORT, 'key configured:', Boolean(GEMINI_API_KEY));
});
