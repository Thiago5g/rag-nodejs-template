FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 rag && \
    adduser --system --uid 1001 raguser
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY migrations ./migrations
USER raguser

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/server.js"]
