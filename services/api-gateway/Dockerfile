FROM node:20-alpine

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
