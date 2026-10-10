FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY launcher.js ./
COPY public ./public

ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 5337

CMD ["npm", "start"]
