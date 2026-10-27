<p align="center">
	<img src="https://img.shields.io/badge/English-0066cc?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2MCAzMCI+PGNsaXBQYXRoIGlkPSJ0Ij48cGF0aCBkPSJNMzAsMTVoMzB2MTV6djE1aC0zMHpoLTMwdi0xNXp2LTE1aDMweiIvPjwvY2xpcFBhdGg+PHBhdGggZD0iTTAsMHYzMGg2MHYtMzB6IiBmaWxsPSIjMDEyMTY5Ii8+PHBhdGggZD0iTTAsMCA2MCwzME02MCwwIDAsMzAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSI2Ii8+PHBhdGggZD0iTTAsMCA2MCwzME02MCwwIDAsMzAiIGNsaXAtcGF0aD0idXJsKCN0KSIgc3Ryb2tlPSIjQzgxMDJFIiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBkPSJNMzAsMHYzME0wLDE1aDYwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMTAiLz48cGF0aCBkPSJNMzAsMHYzME0wLDE1aDYwIiBzdHJva2U9IiNDODEwMkUiIHN0cm9rZS13aWR0aD0iNiIvPjwvc3ZnPg==" alt="English">
	<a href="README.ru.md"><img src="https://img.shields.io/badge/%D0%A0%D1%83%D1%81%D1%81%D0%BA%D0%B8%D0%B9-555?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA5IDYiPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0wIDBoOXYzSDB6Ii8+PHBhdGggZmlsbD0iIzAwMzlhNiIgZD0iTTAgMmg5djJIMHoiLz48cGF0aCBmaWxsPSIjZDUyYjFlIiBkPSJNMCA0aDl2MkgweiIvPjwvc3ZnPg==" alt="Русский"></a>
</p>

<p align="center">
	<a href="https://lazyvimx.aimuzov.online"><img src=".github/assets/banner.en.jpg" alt="lazyvimx: an enhancement layer for LazyVim" width="100%"></a>
</p>

<p align="center">
	<a href="https://github.com/lazyvimx/site/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/lazyvimx/site/deploy.yml?branch=main&label=deploy" alt="Deploy"></a>
	<a href="https://lazyvimx.aimuzov.online"><img src="https://img.shields.io/website?url=https%3A%2F%2Flazyvimx.aimuzov.online&label=site" alt="Site status"></a>
	<a href="package.json"><img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Flazyvimx%2Fsite%2Fmain%2Fpackage.json&query=%24.engines.node&label=node&logo=nodedotjs&logoColor=white&color=5fa04e" alt="Node"></a>
	<a href="https://astro.build"><img src="https://img.shields.io/github/package-json/dependency-version/lazyvimx/site/astro?logo=astro&logoColor=white&color=bc52ee" alt="Astro"></a>
	<a href="https://svelte.dev"><img src="https://img.shields.io/github/package-json/dependency-version/lazyvimx/site/svelte?logo=svelte&logoColor=white&color=ff3e00" alt="Svelte"></a>
	<a href="https://github.com/lazyvimx/nvim/releases"><img src="https://img.shields.io/github/v/release/lazyvimx/nvim?label=lazyvimx" alt="lazyvimx release"></a>
	<a href="LICENSE"><img src="https://img.shields.io/github/license/lazyvimx/site" alt="License"></a>
</p>

<h3 align="center">The documentation site for lazyvimx, the enhancement layer for LazyVim</h3>
<p align="center">Docs in English and Russian, dressed up as Neovim: a statusline, vim keys, a tutor and site search</p>

<table>
	<tr>
		<td width="50%" align="center"><img src=".github/assets/home.jpg" alt="Landing page"><br><b>Landing</b> with a demo recording</td>
		<td width="50%" align="center"><img src=".github/assets/docs.jpg" alt="Documentation page"><br><b>Docs</b> with the file tree and the statusline</td>
	</tr>
</table>

<p>Lives at <a href="https://lazyvimx.aimuzov.online">lazyvimx.aimuzov.online</a>. A static site on <a href="https://astro.build">Astro</a> with <a href="https://svelte.dev">Svelte</a> islands, made from <a href="https://github.com/aimuzov-projects/infra-site-template">infra-site-template</a>.</p>

## What's inside

- **Docs** (`/getting-started`, `/extras`, …, and the same under `/ru/`): page texts live in [lazyvimx/nvim](https://github.com/lazyvimx/nvim) (`README*.md`, `docs/*.md`). Edit them there, this repo only lays them out.
- **Landing pages** (`/`, `/ru/`): hero with the demo recording and the feature tiles from [`src/frontend/data/home.ts`](src/frontend/data/home.ts).
- **The Neovim layer** ([`src/frontend/components/vim`](src/frontend/components/vim)): lualine-style statusline, `j`/`k`/`gg`/`G`/`}`/`L`/`H` and friends, link hints on `f`, a command line on `:`, which-key, an interactive tutor. Keys work on the Russian layout too.
- **Search**: [Pagefind](https://pagefind.app) in the dialog from [infra-site-kit](https://github.com/aimuzov/infra-site-kit), a separate index per language. Opens with `/`, Cmd/Ctrl-K or the button in the header.
- **Demo recordings**: mp4 from the `assets` branch of lazyvimx/nvim via jsDelivr, loaded only once scrolled into view.
- **Analytics**: Yandex Metrika from [infra-site-kit](https://github.com/aimuzov-projects/infra-site-kit), it adds its own sources to the CSP.

## How it works

- [`scripts/sync-docs.ts`](scripts/sync-docs.ts) takes the docs from `../nvim`, from `LAZYVIMX_DIR` or from a fresh clone of the `main` branch and writes them to `src/frontend/content/docs/{en,ru}`. The lazyvimx version for the statusline goes to `src/frontend/data/version.json`. Both are generated and ignored by git; `dev`, `build` and `check` run the sync themselves.
- [`src/sync`](src/sync): pure text transforms of the docs and a Sätteri plugin for headings, code blocks and external links. Heading slugs follow VitePress, so links from the old site keep working.
- [`src/frontend`](src/frontend): the site itself, the `srcDir` in `astro.config.mjs`. Imports go through `#frontend/*`.

Everything about the server lives in [`deploy`](deploy): Dockerfile, compose and nginx. The image pulls the docs from `lazyvimx/nvim@main` on every build, so fresh docs don't need a site release.

## Running

Stack and layout come from [infra-site-template](https://github.com/aimuzov-projects/infra-site-template): Astro + Svelte 5, Prettier, oxlint, stylelint (BEM), `node --test` for unit tests, Playwright for e2e. Prettier, stylelint, oxlint and Playwright configs and the CI steps come from [infra-site-kit](https://github.com/aimuzov-projects/infra-site-kit). Node comes from [`mise.toml`](mise.toml).

```sh
cp .env.example .env   # may stay empty, but the file must exist
npm ci
npm run dev
```

Search works only in the built site: `npm run build && npm run preview`.

Before a commit, the same checks as CI:

```sh
npm run format:check && npm run lint:js && npm run lint:css && npm run check && npm test && npm run build
```

E2E tests in [`e2e`](e2e) build the site and open it in Chromium: every sitemap page answers without console errors and passes axe in both schemes, the theme switch and Metrika behave, the vim keys and search work in both languages.

```sh
npm run test:e2e
```

## Content Security Policy

The build puts a CSP with hashes of the Astro scripts and styles into every page (`security.csp` in `astro.config.mjs`). On top of the template the site allows jsDelivr for the demo recordings, Repobeats for the README activity image, WebAssembly for Pagefind and inline `style` attributes for the Shiki highlighting. In `npm run dev` there is no policy, so violations show up only after `npm run build && npm run preview`.

## Deploy

The projects server from [infra-server](https://github.com/aimuzov-projects/infra-server): merging the release PR that release-please keeps up to date starts `deploy.yml`, which runs the checks and logs in over SSH. There the key starts the shared [`deploy/site.sh`](https://github.com/aimuzov-projects/infra-server/blob/main/deploy/site.sh), which checks out the release tag and rebuilds the `lazyvimx-site` container (nginx with the static files). The domain and TLS are held by the shared Caddy.

The deploy job runs only when the repository variable `DEPLOY_ENABLED` is `true` and the SSH key is in the `DEPLOY_SSH_KEY` secret.

A lazyvimx release only needs to redeploy the latest site tag, the image picks up fresh docs by itself: `gh workflow run deploy.yml -R lazyvimx/site -f tag=v1.2.3`. The same command with an older tag rolls back.

## License

The code is under the [MIT](LICENSE) license. The site content (texts, images, names and contacts) is not covered by it: all rights reserved.
