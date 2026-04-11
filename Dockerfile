FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1024"

COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk upgrade --no-cache \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -rf /usr/local/lib/node_modules/corepack \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.env.production ./.env.production

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
