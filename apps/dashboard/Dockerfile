FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY apps/dashboard ./apps/dashboard

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

EXPOSE 3002

CMD ["sh", "-c", "cd apps/dashboard && npx next dev -p 3002"]
