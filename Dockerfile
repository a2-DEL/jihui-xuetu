# Local review packaging only. Do not publish this image or expose local-demo via a tunnel.
FROM node:22-bookworm-slim AS deps
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Avoid preinstall/npx downloads and other lifecycle scripts. Lockfile must be reproducible.
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS builder
COPY . .
ENV MODEL_EXTERNAL_CALLS_ENABLED=false
ENV ENABLE_DEMO_IDENTITY=true
RUN pnpm run build

FROM node:22-bookworm-slim AS release-locked
WORKDIR /app
ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    ENABLE_DEMO_IDENTITY=true \
    MODEL_EXTERNAL_CALLS_ENABLED=false
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir -p /app/.runtime && chown node:node /app/.runtime
USER node
EXPOSE 3000
CMD ["node", "server.js"]

FROM deps AS local-demo
COPY . .
ENV NODE_ENV=development \
    ENABLE_DEMO_IDENTITY=true \
    MODEL_EXTERNAL_CALLS_ENABLED=false \
    PORT=3000
RUN mkdir -p /app/.runtime /app/.next && chown node:node /app/.runtime /app/.next
USER node
EXPOSE 3000
CMD ["pnpm", "run", "dev", "--hostname", "0.0.0.0", "--port", "3000"]
