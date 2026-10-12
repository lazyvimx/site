# Сборка живёт в образе: новый контейнер стартует только с готовым dist,
# старый отдаёт сайт, пока образ собирается.

FROM node:22-alpine AS build
# Синк клонирует доки lazyvimx: соседней рабочей копии в образе нет.
RUN apk add --no-cache git
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --loglevel=error
COPY . .
# Доки клонируются внутри этого шага, и Docker не видит, что они поменялись.
# Коммит lazyvimx в аргументе сбрасывает кеш шага, а npm ci выше остаётся в кеше.
ARG DOCS_REV
RUN npm run docs:build

FROM nginx:1.29-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.vitepress/dist /usr/share/nginx/html
