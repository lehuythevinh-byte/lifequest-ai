# LIFEQUEST AI — English Town

An English-learning RPG with interactive NPC conversations backed by Gemini AI.

## Deploy on GitHub + Netlify

1. Upload **all project files** (not the outer ZIP) to a new GitHub repository.
2. Open https://app.netlify.com/ and choose **Add new project → Import an existing project → GitHub**.
3. Select the LIFEQUEST AI repository. Netlify reads `netlify.toml` automatically (`npm run build`, output `dist`, serverless functions).
4. In Netlify **Project configuration → Environment variables**, add `GEMINI_API_KEY` with a Gemini API key from https://aistudio.google.com/apikey . Never put your API key in GitHub, HTML, React, or public environment variables.
5. Deploy (or trigger a new deploy after setting the secret).
6. Open `https://YOUR-SITE.netlify.app/api/gemini` and confirm `{"ok":true,"hasKey":true}`. Then open the game, approach an NPC and press **E** to chat. The game should show a Gemini provider instead of Offline.

**Important:** GitHub Pages by itself cannot run the included API proxy; deploy the repository to Netlify for real AI. AI usage may incur charges and quotas; keep an eye on your Gemini usage. The chat provider can fall back to offline responses when unavailable.

## Local development

- Install Node.js 22 or later.
- Run `npm install`.
- Copy `.env.example` to `.env` and set your real `GEMINI_API_KEY` (private).
- Run `npm run dev` and open http://localhost:3000 .

## Security

AI calls in production go through Netlify Functions. The game prefers the server-side proxy rather than asking visitors to insert their own key. Old game settings may still display a legacy key-entry field; **do not paste a secret API key into a public browser or share it with others**.
