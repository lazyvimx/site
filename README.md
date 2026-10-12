# lazyvimx-site

<div align="center">

[![Deploy](https://img.shields.io/github/actions/workflow/status/lazyvimx/site/deploy.yml?branch=main&style=flat-square&label=deploy)](https://github.com/lazyvimx/site/actions/workflows/deploy.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Flazyvimx.aimuzov.online&style=flat-square&label=website)](https://lazyvimx.aimuzov.online/)
![VitePress](https://img.shields.io/github/package-json/dependency-version/lazyvimx/site/dev/vitepress?style=flat-square)
[![lazyvimx](https://img.shields.io/github/v/release/lazyvimx/nvim?style=flat-square&label=lazyvimx)](https://github.com/lazyvimx/nvim/releases)

</div>

> [!TIP]
> **🇷🇺 Русская версия:** [README.ru.md](README.ru.md)

Documentation site for [lazyvimx](https://github.com/lazyvimx/nvim), built with
[VitePress](https://vitepress.dev).

Page content lives in the lazyvimx repository (`docs/*.md`, `README*.md`) —
this repo is only the shell: config, landing pages for both locales and the
sync script. Edit the content there; `scripts/sync-docs.mjs` pulls it in on
every build.

## Commands

```sh
npm run docs:dev      # sync + dev server
npm run docs:build    # sync + production build into .vitepress/dist
npm run docs:preview  # preview the production build
```

The sync uses the sibling checkout `../nvim` (or the path from
`LAZYVIMX_DIR`), and without it clones the repository from GitHub — that's
how CI works.

## Deploy

The site lives on the projects server: nginx in the `lazyvimx-site`
container, while the domain and TLS are handled by the shared Caddy from
aimuzov-projects/server-infra. On every push to `main` GitHub Actions logs into
the server over SSH, where the key is bound to `deploy/remote.sh`: it pulls
`main` and rebuilds the image. After editing docs in lazyvimx, trigger a
rebuild with Run workflow.
