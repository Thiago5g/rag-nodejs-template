FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 mcp && \
    adduser --system --uid 1001 mcpuser
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=builder /app/dist ./dist
USER mcpuser

# Default to stdio transport
ENV MCP_TRANSPORT=stdio
ENV MCP_LOG_LEVEL=info

CMD ["node", "dist/index.js"]
