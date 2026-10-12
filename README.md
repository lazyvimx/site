> [!TIP]
> **🇷🇺 Русская версия:** [README.ru.md](README.ru.md)

# lazyvimx-site

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
