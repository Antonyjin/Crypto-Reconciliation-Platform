FROM node:20.19-alpine3.23@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
RUN apk upgrade --no-cache

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/dashboard ./apps/dashboard

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

EXPOSE 3002

CMD ["sh", "-c", "cd apps/dashboard && npx next dev -p 3002"]
