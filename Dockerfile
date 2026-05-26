# syntax=docker/dockerfile:1

# ─── Stage 1: deps ─── maximize layer cache for dependency installs ───────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# ─── Stage 2: builder ─── compile TS → dist/, then shrink node_modules ────────
FROM deps AS builder
WORKDIR /app
COPY tsconfig.json .sequelizerc ./
COPY src ./src
RUN npm run build \
  && npm prune --omit=dev

# ─── Stage 3: runtime ─── lean, non-root image with only prod artifacts ───────
FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache netcat-openbsd \
  && addgroup -g 1001 appgrp \
  && adduser -D -u 1001 -G appgrp appuser

COPY --from=builder /app/dist          ./dist
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/package.json  ./package.json
COPY --from=builder /app/.sequelizerc  ./.sequelizerc
COPY scripts ./scripts

RUN chmod +x ./scripts/entrypoint.sh \
  && chown -R appuser:appgrp /app

USER appuser
ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./scripts/entrypoint.sh"]
CMD ["node", "dist/server.js"]
