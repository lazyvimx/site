# syntax=docker/dockerfile:1

# Сборка происходит внутри образа: новый контейнер стартует только с готовым `dist`,
# а старый продолжает отдавать сайт, пока образ собирается.

FROM node:26.11.1-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --loglevel=error
# Тексты страниц живут в lazyvimx/nvim, свежие -- в ветке develop. BuildKit сверяет
# её коммит на каждой сборке, так что слой и всё после него пересобираются ровно тогда,
# когда документация поменялась, а релиз сайта для этого не нужен.
ADD https://github.com/lazyvimx/nvim.git#develop /nvim
ENV LAZYVIMX_DIR=/nvim
COPY . .
# `.env` приходит секретом сборки: переменные нужны во время сборки,
# но сам файл не остаётся в слоях образа.
RUN --mount=type=secret,id=env,target=/app/.env npm run build

FROM nginx:1.29-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
