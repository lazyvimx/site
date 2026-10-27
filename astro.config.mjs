import { satteri } from '@astrojs/markdown-satteri'
import sitemap from '@astrojs/sitemap'
import svelte from '@astrojs/svelte'
import latte from '@shikijs/themes/catppuccin-latte'
import { defineConfig } from 'astro/config'

import { withReadableTokens } from './src/sync/contrast.ts'
import { docPlugin } from './src/sync/doc-plugin.ts'

// Записи демо и постер hero раздаёт jsDelivr, подробности в lib/demo-base.ts.
const cdn = ['https://fastly.jsdelivr.net', 'https://cdn.jsdelivr.net']

export default defineConfig({
	// Сайт живёт в `src/frontend` для того чтобы рядом поместились `src/backend`
	// и `src/shared`, когда проекту понадобится своё API.
	srcDir: './src/frontend',
	// Абсолютные URL в canonical, og:url и sitemap.
	site: 'https://lazyvimx.aimuzov.online',
	// Адреса как на VitePress: страницы -- файлами `extras.html` и открываются
	// по `/extras`, а главные -- папками, чтобы русская осталась на `/ru/`.
	// CSS немного, и встроенный в HTML он не блокирует первую отрисовку
	// отдельным запросом.
	build: { format: 'preserve', inlineStylesheets: 'always' },
	// Английский в корне, русский под `/ru/`.
	i18n: { locales: ['en', 'ru'], defaultLocale: 'en', routing: { prefixDefaultLocale: false } },
	// Svelte для интерактивных островов, остальное -- статический HTML
	// с ванильными скриптами.
	integrations: [
		svelte(),
		sitemap({
			i18n: { defaultLocale: 'en', locales: { en: 'en-US', ru: 'ru-RU' } },
			// Русская главная живёт на `/ru/`, как и раньше, а не на `/ru` с редиректом.
			serialize(item) {
				const fix = (url) => url.replace(/\/ru$/, '/ru/')

				return {
					...item,
					url: fix(item.url),
					links: item.links?.map((link) => ({ ...link, url: fix(link.url) })),
				}
			},
		}),
	],
	markdown: {
		// Обе палитры сразу: цвет выбирает CSS через `light-dark()`, поэтому
		// переключение темы не перерисовывает код.
		syntaxHighlight: 'shiki',
		// Светлые блоки кода белые, и часть цветов latte на них не дотягивает до 4.5:1.
		shikiConfig: {
			themes: { light: withReadableTokens(latte, '#ffffff'), dark: 'catppuccin-macchiato' },
			defaultColor: false,
		},
		processor: satteri({ hastPlugins: [docPlugin] }),
	},
	// Astro кладёт в `<meta>` страницы CSP с хешами своих скриптов и стилей.
	// Компоненты Яндекс Метрики и Sentry из infra-site-kit сами добавляют свои хеши и источники.
	// `frame-ancestors` в `<meta>` не работает, встраивание блокирует Caddy
	// через `X-Frame-Options`.
	security: {
		csp: {
			// Поиск Pagefind компилирует свой индекс из WebAssembly.
			scriptDirective: { resources: ["'self'", "'wasm-unsafe-eval'"] },
			// Цвета подсветки Shiki приходят атрибутом `style` на каждом токене.
			styleDirective: { resources: [{ resource: "'unsafe-inline'", kind: 'attribute' }] },
			directives: [
				"default-src 'self'",
				// Repobeats -- картинка активности репозитория в README.
				`img-src 'self' data: ${cdn.join(' ')} https://repobeats.axiom.co`,
				`media-src ${cdn.join(' ')}`,
				// Мелкие подмножества шрифта Vite встраивает в CSS как data:.
				"font-src 'self' data:",
				"connect-src 'self'",
				"object-src 'none'",
				"base-uri 'self'",
				"form-action 'self'",
			],
		},
	},
})
