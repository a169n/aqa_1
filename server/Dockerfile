FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json

RUN npm ci
RUN apk add --no-cache iproute2

COPY server server

RUN npm run build --workspace server
RUN npm prune --omit=dev

WORKDIR /app/server

ENV NODE_ENV=production

EXPOSE 4000

CMD ["npm", "run", "start"]
