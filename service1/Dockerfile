FROM node:24.0.0-alpine

WORKDIR /usr/src/service1

EXPOSE 8080

COPY . .

RUN npm install

CMD ["node", "index.ts"]