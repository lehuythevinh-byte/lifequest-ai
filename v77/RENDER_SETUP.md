# V77 Render deployment

The existing service builds branch `deploy/lifequest-v77` from the repository root.

| Setting | Value |
| --- | --- |
| Build command | `sh v77/build.sh` |
| Start command | `node v77/backend/server.cjs` |
| Health endpoint | `/health` |

The build verifies the 53 Beyond Conversation source parts, incorporates the Living
World Interface and checks the final HTML against `v77/game.sha256`. The running
service reports `V77-Living-World-Interface` and the same hash at `/health`.
Online AI uses the service’s existing `GEMINI_API_KEY` environment variable.
