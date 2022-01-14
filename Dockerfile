# syntax=docker/dockerfile:1

FROM node:14-alpine

WORKDIR /

COPY ["package.json", "package-lock.json", "./"]
RUN npm ci

COPY . .

EXPOSE ${PORT}

CMD ["npm", "run", "start"]
