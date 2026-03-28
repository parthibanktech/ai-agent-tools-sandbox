FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# If using Next.js standalone output, uncomment the build command below
# RUN npm run build
# Note: Ensure next.config.ts has output: "standalone"
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# The distDir was changed to .next_dev in next.config.ts
# Adjust to match the actual output directory
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next_dev
RUN chown nextjs:nodejs .next_dev

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next_dev/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next_dev/static ./.next_dev/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
