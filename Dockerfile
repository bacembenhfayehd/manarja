# Étape de build
FROM node:18-alpine AS builder

WORKDIR /a3mida_backend

# 1. Copie des fichiers de configuration
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# 2. Installation des dépendances et génération du client Prisma
RUN corepack enable && pnpm install
RUN pnpm exec prisma generate

# 3. Copie du code source
COPY . .

# 4. Build de l'application
RUN pnpm run build

# Étape de production
FROM node:18-alpine

WORKDIR /a3mida_backend

COPY --from=builder /a3mida_backend/node_modules ./node_modules
COPY --from=builder /a3mida_backend/package.json ./
COPY --from=builder /a3mida_backend/dist ./dist
COPY --from=builder /a3mida_backend/prisma ./prisma

EXPOSE 3000
CMD ["pnpm", "run", "start:prod"]