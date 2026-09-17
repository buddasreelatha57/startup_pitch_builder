FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN ./node_modules/.bin/tsc

ENV NODE_ENV=production

EXPOSE 4000

CMD ["npm", "start"]