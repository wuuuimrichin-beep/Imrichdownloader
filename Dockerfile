FROM node:22-bookworm-slim

WORKDIR /app

# yt-dlp needs Python; FFmpeg is used to merge video/audio streams.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    ffmpeg \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install the latest yt-dlp plus its recommended YouTube EJS components.
RUN python3 -m pip install --break-system-packages --no-cache-dir "yt-dlp[default]"

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 10000
CMD ["node", "server.js"]
