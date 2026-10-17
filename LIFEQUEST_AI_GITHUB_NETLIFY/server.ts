import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Handler for Gemini AI generation
async function handleGeminiProxy(req: Request, res: Response) {
  if (req.method === 'GET') {
    return res.json({ ok: true, hasKey: !!process.env.GEMINI_API_KEY });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: { code: 503, message: 'Server GEMINI_API_KEY is not configured.' }
    });
  }

  const { model, body } = req.body;
  const candidateModels = [
    model || 'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-flash-latest',
    'gemini-2.0-flash'
  ];

  for (const candidate of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
        signal: AbortSignal.timeout(25000)
      });

      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }

      if (response.status === 503 || response.status === 404) {
        continue;
      }

      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json(errData);
    } catch (err: any) {
      console.warn(`Error requesting ${candidate}:`, err.message);
    }
  }

  return res.status(503).json({
    error: {
      code: 503,
      message: 'All Gemini models are temporarily busy. Switching to offline rules.'
    }
  });
}

// Support both standard API route and Netlify function route
app.all('/api/gemini', handleGeminiProxy);
app.all('/.netlify/functions/gemini', handleGeminiProxy);

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
