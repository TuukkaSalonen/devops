FROM node:24.0.0-alpine

WORKDIR /app

RUN apk add --no-cache openssh bash

COPY package*.json ./

RUN npm ci --production

COPY . .

EXPOSE 8083

CMD ["node", "index.js"]