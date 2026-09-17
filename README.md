# lazyvimx-site

> [!TIP]
> **🇷🇺 Русская версия:** [README.ru.md](README.ru.md)

Documentation site for [lazyvimx](https://github.com/lazyvimx/nvim), built with
[VitePress](https://vitepress.dev) and published at
[lazyvimx.aimuzov.online](https://lazyvimx.aimuzov.online).

## 📄 Where the content lives

Page texts live in the lazyvimx/nvim repository (`README*.md`, `docs/*.md`). This repository is
only the shell: VitePress config and theme, the landing pages of both locales (`index.md`,
`ru/index.md`) and build scripts.

Edit docs in lazyvimx/nvim. `scripts/sync-docs.mjs` pulls them in on every build and adapts them
for the site: renames pages, points code links to GitHub, swaps demo GIFs for lazy-loaded MP4.
Generated pages (`getting-started.md`, `extras.md`, … and their `ru/` copies) are git-ignored —
changes made to them here are overwritten by the next sync.

## 🛠️ Commands

```sh
npm run docs:sync     # pull docs from lazyvimx/nvim
npm run docs:dev      # sync + dev server
npm run docs:build    # sync + production build into .vitepress/dist
npm run docs:preview  # preview the production build
```

`docs:build` also runs `scripts/inline-icons.mjs`, which inlines `vp-icons.css` into every page
to save a render-blocking request.

## 🔄 Docs source

The sync script picks the first available source:

1. the path from `LAZYVIMX_DIR`;
2. the sibling working copy `../nvim`;
3. a shallow clone of the `develop` branch into `.cache/lazyvimx` — this is how CI works.

`develop` is used because `main` lags behind until the next release.

## 🎬 Demo recordings

Recordings are served from the `assets` branch of lazyvimx/nvim through jsDelivr (Fastly with
a Cloudflare fallback). The URL is pinned to a full commit hash in
`.vitepress/theme/demo-base.js` to get a year-long immutable cache — update the hash after
re-recording the demos.

The list of extras that have a "before" recording (`withBefore` in `scripts/sync-docs.mjs`)
mirrors `docs/demo/tapes-before` in lazyvimx/nvim — keep both in sync.

## 🚀 Deploy

GitHub Actions builds the site and publishes it to GitHub Pages on every push to `main`. After
editing docs in lazyvimx/nvim, trigger a rebuild with **Run workflow** — no commit here needed.
