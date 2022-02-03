# syntax=docker/dockerfile:1

FROM node:16-alpine

WORKDIR /

COPY ["package.json", "package-lock.json", "./"]
RUN npm ci

COPY . .

RUN npm run build:prod

EXPOSE ${PORT}

CMD ["npm", "run", "migrate-start"]
