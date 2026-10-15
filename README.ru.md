# lazyvimx-site

<div align="center">

[![Деплой](https://img.shields.io/github/actions/workflow/status/lazyvimx/site/deploy.yml?branch=main&style=flat-square&label=деплой)](https://github.com/lazyvimx/site/actions/workflows/deploy.yml)
[![Сайт](https://img.shields.io/website?url=https%3A%2F%2Flazyvimx.aimuzov.online&style=flat-square&label=сайт)](https://lazyvimx.aimuzov.online/)
![Astro](https://img.shields.io/github/package-json/dependency-version/lazyvimx/site/astro?style=flat-square)
[![lazyvimx](https://img.shields.io/github/v/release/lazyvimx/nvim?style=flat-square&label=lazyvimx)](https://github.com/lazyvimx/nvim/releases)

</div>

> [!TIP]
> **🇬🇧 English version:** [README.md](README.md)

Сайт документации [lazyvimx](https://github.com/lazyvimx/nvim) на
[Astro](https://astro.build) и [Svelte](https://svelte.dev) по стеку
[aimuzov-projects](https://github.com/aimuzov-projects): общие конфиги, проверки
и деплой из [infra-site-kit](https://github.com/aimuzov-projects/infra-site-kit).

Тексты страниц живут в репозитории lazyvimx (`docs/*.md`, `README*.md`). Здесь только
оболочка: раскладка, лендинги двух локалей, интерфейс в духе Neovim (статуслайн,
vim-клавиши, туториал, поиск) и синк-скрипт. Править контент нужно там:
`scripts/sync-docs.ts` подтягивает его при каждой сборке.

## Команды

```sh
npm run dev           # синк + дев-сервер
npm run build         # синк + прод-сборка в dist, потом индекс Pagefind
npm run preview       # посмотреть прод-сборку
npm run check         # синк + astro check + svelte-check
npm test              # юнит-тесты (node --test)
npm run test:e2e      # Playwright против свежей сборки
npm run format        # oxlint --fix + prettier
npm run lint:js       # oxlint
npm run lint:css      # stylelint
```

Синк берёт соседнюю рабочую копию `../nvim` (или путь из `LAZYVIMX_DIR`), а без неё
клонирует ветку `develop` с GitHub. Поиск работает только в собранном сайте: Pagefind
индексирует `dist` после `astro build`.

## Устройство

- `scripts/sync-docs.ts` — пишет `src/frontend/content/docs/{en,ru}/*.md`
  и `src/frontend/data/version.json`; оба сгенерированы и в git не попадают.
- `src/sync/` — чистые преобразования текста доков и плагин Sätteri для заголовков,
  блоков кода и внешних ссылок, с юнит-тестами.
- `src/frontend/` — страницы, лэйауты и компоненты; `components/vim/` — слой Neovim.

## Деплой

Сайт живёт на сервере проектов: nginx в контейнере `lazyvimx-site`, домен и TLS держит
общий Caddy из [aimuzov-projects/infra-server](https://github.com/aimuzov-projects/infra-server).

Мёрж в `main` обновляет релизный PR от release-please. Мёрж этого PR выпускает релиз,
и уже релиз уезжает на сервер: GitHub Actions заходит по SSH, ключ привязан
к `infra-server/deploy/site.sh`, тот переключается на тег и пересобирает образ. Образ
на каждой сборке берёт свежие доки из `lazyvimx/nvim@develop`, поэтому релизу lazyvimx
достаточно перезапустить деплой последнего тега сайта (`workflow_dispatch` с `tag`).

Пока у репозитория нет переменной `DEPLOY_ENABLED=true`, деплой пропускается.
