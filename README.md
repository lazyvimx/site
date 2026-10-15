# lazyvimx-site

<div align="center">

[![Deploy](https://img.shields.io/github/actions/workflow/status/lazyvimx/site/deploy.yml?branch=main&style=flat-square&label=deploy)](https://github.com/lazyvimx/site/actions/workflows/deploy.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Flazyvimx.aimuzov.online&style=flat-square&label=website)](https://lazyvimx.aimuzov.online/)
![Astro](https://img.shields.io/github/package-json/dependency-version/lazyvimx/site/astro?style=flat-square)
[![lazyvimx](https://img.shields.io/github/v/release/lazyvimx/nvim?style=flat-square&label=lazyvimx)](https://github.com/lazyvimx/nvim/releases)

</div>

> [!TIP]
> **🇷🇺 Русская версия:** [README.ru.md](README.ru.md)

Documentation site for [lazyvimx](https://github.com/lazyvimx/nvim), built with
[Astro](https://astro.build) and [Svelte](https://svelte.dev) on the
[aimuzov-projects](https://github.com/aimuzov-projects) site stack: shared configs,
checks and deploy from [infra-site-kit](https://github.com/aimuzov-projects/infra-site-kit).

Page content lives in the lazyvimx repository (`docs/*.md`, `README*.md`). This repo
is only the shell: layout, landing pages for both locales, the Neovim-style UI
(statusline, vim keys, tutor, search) and the sync script. Edit the content there:
`scripts/sync-docs.ts` pulls it in on every build.

## Commands

```sh
npm run dev           # sync + dev server
npm run build         # sync + production build into dist, then the Pagefind index
npm run preview       # preview the production build
npm run check         # sync + astro check + svelte-check
npm test              # unit tests (node --test)
npm run test:e2e      # Playwright against a fresh build
npm run format        # oxlint --fix + prettier
npm run lint:js       # oxlint
npm run lint:css      # stylelint
```

The sync uses the sibling checkout `../nvim` (or the path from `LAZYVIMX_DIR`), and
without it clones the `develop` branch from GitHub. Search works only in the built
site: Pagefind indexes `dist` after `astro build`.

## Layout

- `scripts/sync-docs.ts` — writes `src/frontend/content/docs/{en,ru}/*.md` and
  `src/frontend/data/version.json`; both are generated and ignored by git.
- `src/sync/` — pure text transforms of the docs and the Sätteri plugin for headings,
  code blocks and external links, with unit tests.
- `src/frontend/` — pages, layouts and components; `components/vim/` is the Neovim layer.

## Deploy

The site lives on the projects server: nginx in the `lazyvimx-site` container, while
the domain and TLS are handled by the shared Caddy from
[aimuzov-projects/infra-server](https://github.com/aimuzov-projects/infra-server).

A merge into `main` updates the release PR from release-please. Merging that PR cuts
a release, and the release goes to the server: GitHub Actions logs in over SSH, the key
is bound to `infra-server/deploy/site.sh`, which checks out the tag and rebuilds the
image. The image pulls fresh docs from `lazyvimx/nvim@develop` on every build, so a
lazyvimx release only has to re-run the deploy of the latest site tag
(`workflow_dispatch` with `tag`).

Deploys stay off until the repository variable `DEPLOY_ENABLED=true` is set.
