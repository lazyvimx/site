> [!TIP]
> **🇬🇧 English version:** [README.md](README.md)

# lazyvimx-site

Сайт документации [lazyvimx](https://github.com/lazyvimx/nvim) на
[VitePress](https://vitepress.dev).

Тексты страниц живут в репозитории lazyvimx (`docs/*.md`, `README*.md`) —
здесь только оболочка: конфиг, лендинги двух локалей и синк-скрипт.
Править контент нужно там; `scripts/sync-docs.mjs` подтягивает его при
каждой сборке.

## Команды

```sh
npm run docs:dev      # синк + дев-сервер
npm run docs:build    # синк + прод-сборка в .vitepress/dist
npm run docs:preview  # посмотреть прод-сборку
```

Синк берёт соседнюю рабочую копию `../nvim` (или путь из
`LAZYVIMX_DIR`), а без неё клонирует репозиторий с GitHub — так работает CI.

## Деплой

Сайт живёт на сервере projects: nginx в контейнере `lazyvimx-site`, домен
и TLS держит общий Caddy из aimuzov-projects/server-infra. При пуше в `main`
GitHub Actions заходит на сервер по SSH, а там ключ привязан к
`deploy/remote.sh`: он подтягивает `main` и пересобирает образ. После правки
доков в lazyvimx пересборка запускается кнопкой Run workflow.
