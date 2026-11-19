# V77 Render deployment

The game is stored in 53 byte-exact ordered parts. Build: `sh v77/build.sh`; start: `node v77/backend/server.cjs`. The build verifies the original SHA-256. Set GEMINI_API_KEY in Render Environment, never in Git.
