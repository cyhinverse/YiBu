FROM node:20-alpine AS base
WORKDIR /app

FROM base AS dev-deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM dev-deps AS dev
ENV NODE_ENV=development
ENV PORT=5000
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node scripts ./scripts
RUN mkdir -p /app/logs && chown -R node:node /app
USER node
EXPOSE 5000
CMD ["node", "src/server.js"]
