FROM node:24.0.0-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --production

COPY build/ ./build

COPY node_modules/ ./node_modules

EXPOSE 8080

CMD ["node", "build/server.js"]
