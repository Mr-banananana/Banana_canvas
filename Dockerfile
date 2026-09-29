FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY launcher.js ./
COPY public ./public

ENV NODE_ENV=production
EXPOSE 5337

CMD ["npm", "start"]
