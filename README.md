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

Синк берёт соседнюю рабочую копию `../lazyvimx` (или путь из
`LAZYVIMX_DIR`), а без неё клонирует репозиторий с GitHub — так работает CI.

## Деплой

GitHub Actions собирает и выкладывает сайт на Pages при пуше в `main`.
После правки доков в lazyvimx пересборка запускается кнопкой Run workflow.
