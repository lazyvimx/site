# lazyvimx-site

> [!TIP]
> **🇬🇧 English version:** [README.md](README.md)

Сайт документации [lazyvimx](https://github.com/lazyvimx/nvim) на
[VitePress](https://vitepress.dev), живёт на
[lazyvimx.aimuzov.online](https://lazyvimx.aimuzov.online/ru/).

## 📄 Где контент

Тексты страниц живут в репозитории lazyvimx/nvim (`README*.md`, `docs/*.md`). Здесь только
оболочка: конфиг и тема VitePress, лендинги двух локалей (`index.md`, `ru/index.md`) и скрипты
сборки.

Править доки нужно в lazyvimx/nvim. `scripts/sync-docs.mjs` подтягивает их при каждой сборке и
подгоняет под сайт: переименовывает страницы, уводит ссылки на код на GitHub, меняет гифки демо
на mp4 с ленивой загрузкой. Сгенерированные страницы (`getting-started.md`, `extras.md`, … и их
копии в `ru/`) лежат в `.gitignore`, правки в них перетрёт следующий синк.

## 🛠️ Команды

```sh
npm run docs:sync     # подтянуть доки из lazyvimx/nvim
npm run docs:dev      # синк + дев-сервер
npm run docs:build    # синк + прод-сборка в .vitepress/dist
npm run docs:preview  # посмотреть прод-сборку
```

`docs:build` вдобавок запускает `scripts/inline-icons.mjs`: он встраивает `vp-icons.css` в
каждую страницу, чтобы не тратить на него блокирующий отрисовку запрос.

## 🔄 Откуда берутся доки

Синк берёт первый доступный источник:

1. путь из `LAZYVIMX_DIR`;
2. соседнюю рабочую копию `../nvim`;
3. неглубокий клон ветки `develop` в `.cache/lazyvimx`, так работает CI.

Ветка `develop`, потому что `main` отстаёт до ближайшего релиза.

## 🎬 Записи демо

Записи раздаются из ветки `assets` репозитория lazyvimx/nvim через jsDelivr (Fastly, запасной
вход через Cloudflare). Адрес закреплён на полный хеш коммита в
`.vitepress/theme/demo-base.js` ради годового immutable-кеша. После пересъёмки демо хеш нужно
обновить.

Список экстр с записью до включения (`withBefore` в `scripts/sync-docs.mjs`) повторяет
`docs/demo/tapes-before` в lazyvimx/nvim, пополнять нужно оба места.

## 🚀 Деплой

GitHub Actions собирает сайт и выкладывает на GitHub Pages при каждом пуше в `main`. После правки
доков в lazyvimx/nvim пересборка запускается кнопкой **Run workflow**, коммит сюда не нужен.
