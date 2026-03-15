FROM node:20-alpine

WORKDIR /app

# Copier les fichiers du monorepo nécessaires
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared ./packages/shared
COPY services/ingestion ./services/ingestion

# Installer pnpm et les dépendances
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Build le shared package
RUN pnpm --filter @app/shared build

EXPOSE 3001

CMD ["pnpm", "--filter", "@app/ingestion-service", "dev"]
