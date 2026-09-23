FROM node:22-bookworm-slim AS build

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run db:generate && npm run build

FROM node:22-bookworm-slim AS runtime

ARG YTDLP_VERSION=2026.8.19
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-pip && \
    python3 -m pip install --break-system-packages --no-cache-dir "yt-dlp==${YTDLP_VERSION}" && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=build --chown=node:node /app /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["sh", "-c", "npm run production:preflight && npm run db:deploy && npm start"]
