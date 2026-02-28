# ─── Stage 1: builder ───────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Copy monorepo config
COPY package.json package-lock.json tsconfig.base.json ./

# Copy only the package.json files first (layer caching)
COPY packages/shared/package.json ./packages/shared/
COPY backend/package.json          ./backend/
COPY frontend/package.json         ./frontend/
COPY extension/package.json        ./extension/

# Install all workspace deps
RUN npm ci

# Copy source
COPY packages/shared/ ./packages/shared/
COPY backend/          ./backend/

# Build shared then backend
RUN npm run build:shared && npm run build:backend

# ─── Stage 2: runner ────────────────────────────────────────────────────────
FROM node:20-slim

# System deps for code execution: C compiler + Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3 \
    make \
    && rm -rf /var/lib/apt/lists/*

# tsx globally for TypeScript exercise execution
RUN npm install -g tsx

WORKDIR /app

# Copy only runtime artifacts from builder
COPY --from=builder /app/node_modules         ./node_modules
COPY --from=builder /app/package.json         ./package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/backend/dist         ./backend/dist
COPY --from=builder /app/backend/package.json ./backend/package.json

EXPOSE 3001

CMD ["node", "backend/dist/index.js"]
