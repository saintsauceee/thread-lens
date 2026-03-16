FROM node:20-alpine AS builder

WORKDIR /app
COPY apps/client/package.json apps/client/package-lock.json ./
RUN npm ci
COPY apps/client/ .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
