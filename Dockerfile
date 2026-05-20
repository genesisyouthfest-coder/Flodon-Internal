# ═══════════════════════════════════════════════
#  FLODON INTERNAL — Multi-Stage Production Docker
# ═══════════════════════════════════════════════

# ─── Stage 1: Base & Core Package Setup ───
FROM node:20-alpine AS base
RUN apk add --no-cache wget
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core ./packages/core

# ─── Stage 2: Internal Software Service ───
FROM base AS internal-software
COPY apps/internal-software ./apps/internal-software
# Install workspace-specific dependencies including core
RUN npm ci --include=dev --workspace=packages/core --workspace=apps/internal-software
EXPOSE 10011
CMD ["npm", "start", "--workspace=apps/internal-software"]

# ─── Stage 3: Discord Bot Service ───
FROM base AS discord-bot
COPY apps/discord-bot ./apps/discord-bot
# Install workspace-specific dependencies including core
RUN npm ci --include=dev --workspace=packages/core --workspace=apps/discord-bot
EXPOSE 10010
CMD ["npm", "start", "--workspace=apps/discord-bot"]
