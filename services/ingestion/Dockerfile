FROM node:20.19-alpine3.23@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
RUN apk upgrade --no-cache

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
