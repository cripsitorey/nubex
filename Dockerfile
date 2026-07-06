FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.js ./
RUN npx prisma generate

FROM node:22-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home nodeapp

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json prisma.config.js ./
COPY src ./src
COPY --from=builder /app/src/generated ./src/generated

RUN mkdir -p uploads && chown -R nodeapp:nodeapp /app
USER nodeapp

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push && node --experimental-strip-types src/server.js"]
