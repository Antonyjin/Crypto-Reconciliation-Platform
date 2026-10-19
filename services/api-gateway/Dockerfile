FROM node:20.19-alpine3.23@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
RUN apk upgrade --no-cache

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages/shared ./packages/shared
COPY services/api-gateway ./services/api-gateway

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

RUN pnpm --filter @app/shared build

RUN cd services/api-gateway && npx prisma generate

EXPOSE 3000

CMD ["sh", "-c", "cd services/api-gateway && npx prisma migrate deploy && cd /app && pnpm --filter @app/api-gateway dev"]
