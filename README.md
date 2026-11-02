# ClipCut — Render deployment package

## Included files
- `index.html` — English website interface
- `server.js` — Express API and download handlers
- `package.json` — Node.js dependencies and start script
- `Dockerfile` — installs Node.js, Python, yt-dlp (with its default EJS components), and FFmpeg
- `.dockerignore` — excludes local development files from the Docker build

## Deploy on Render
1. Upload these files to the root of one GitHub repository.
2. In Render, create a **New → Web Service** and connect that repository.
3. Choose **Docker** as the runtime/environment.
4. Set the Dockerfile path to `./Dockerfile`.
5. Leave Build Command and Start Command empty; the Dockerfile installs and starts the app.
6. No custom environment variables are required. Render supplies `PORT` automatically.

Keep `index.html`, `server.js`, `package.json`, and `Dockerfile` together in the repository root.
