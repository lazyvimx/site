import { fileURLToPath } from "node:url";

import { defineConfig } from "vitepress";

// Контент страниц генерирует scripts/sync-docs.mjs из репозитория lazyvimx/nvim —
// править тексты нужно там, здесь только оболочка сайта.

import { demoBase } from "./theme/demo-base.js";

const github = "https://github.com/lazyvimx/nvim";
const site = "https://lazyvimx.aimuzov.online";

const sidebarEn = [
	{
		text: "Guide",
		items: [
			{ text: "🚀 Getting Started", link: "/getting-started" },
			{ text: "🧩 Extras", link: "/extras" },
			{ text: "⚙️ Configuration", link: "/configuration" },
			{ text: "⌨️ Keybindings", link: "/keybindings" },
			{ text: "❓ FAQ", link: "/faq" },
			{ text: "🔧 Troubleshooting", link: "/troubleshooting" },
		],
	},
	{
		text: "Reference",
		items: [
			{ text: "🏗️ Architecture", link: "/architecture" },
			{ text: "🔌 API", link: "/api" },
		],
	},
];

const sidebarRu = [
	{
		text: "Руководство",
		items: [
			{ text: "🚀 Быстрый старт", link: "/ru/getting-started" },
			{ text: "🧩 Экстры", link: "/ru/extras" },
			{ text: "⚙️ Настройка", link: "/ru/configuration" },
			{ text: "⌨️ Кеймапы", link: "/ru/keybindings" },
			{ text: "❓ FAQ", link: "/ru/faq" },
			{ text: "🔧 Решение проблем", link: "/ru/troubleshooting" },
		],
	},
	{
		text: "Справочник",
		items: [
			{ text: "🏗️ Архитектура", link: "/ru/architecture" },
			{ text: "🔌 API", link: "/ru/api" },
		],
	},
];

export default defineConfig({
	title: "lazyvimx",
	description: "An enhancement layer on top of LazyVim: 50 optional extras and 39 plugin overrides",
	cleanUrls: true,

	// Весь сайт набран JetBrains Mono — как код в самом Neovim. Файлы
	// лежат в public/fonts, объявления в theme/fonts.css; предзагружаем
	// только латиницу обычного начертания — ею набрано почти всё.
	head: [
		["link", { rel: "icon", type: "image/png", href: "/favicon.png" }],
		["link", { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }],
		[
			"link",
			{
				rel: "preload",
				as: "font",
				type: "font/woff2",
				href: "/fonts/jetbrains-mono-latin-normal.woff2",
				crossorigin: "",
			},
		],
		// Яндекс.Метрика. Сайт — SPA: хиты при переходах между страницами
		// досылает тема (theme/index.ts).
		[
			"script",
			{},
			`(function(m,e,t,r,i,k,a){
				m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
				m[i].l=1*new Date();
				for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
				k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
			})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=112748414', 'ym');
			ym(112748414, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`,
		],
		[
			"noscript",
			{},
			'<div><img src="https://mc.yandex.ru/watch/112748414" style="position:absolute; left:-9999px;" alt="" /></div>',
		],
	],
	lastUpdated: true,
	sitemap: { hostname: site },
	// README описывают сам репозиторий сайта — это не страницы.
	srcExclude: ["README.md", "README.ru.md"],

	// Inter из штатного fonts.css уезжает в предзагрузку каждой
	// страницы, а сайт им не набран. Подменяем файл своим — тема просит
	// его относительным путём, поэтому не алиасом, а по импортёру.
	vite: {
		plugins: [
			{
				name: "lazyvimx-drop-inter",
				enforce: "pre",
				resolveId(source, importer) {
					if (source !== "./styles/fonts.css" || !importer?.includes("theme-default")) return null;
					return fileURLToPath(new URL("./theme/fonts.css", import.meta.url));
				},
			},
		],
	},

	// Штатный head одинаков для всех страниц. Canonical, языковые
	// альтернативы и карточку для соцсетей дописываем на каждой.
	transformPageData(pageData) {
		const ru = pageData.relativePath.startsWith("ru/");
		const path = pageData.relativePath.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");
		const url = `${site}/${path}`;
		const enUrl = ru ? `${site}/${path.slice(3)}` : url;
		const ruUrl = ru ? url : `${site}/ru/${path}`;

		const title = pageData.frontmatter.title || pageData.title || "lazyvimx";
		const description =
			pageData.frontmatter.description ||
			pageData.description ||
			(ru
				? "Слой улучшений поверх LazyVim: 50 опциональных экстр и 39 оверрайдов плагинов"
				: "An enhancement layer on top of LazyVim: 50 optional extras and 39 plugin overrides");

		pageData.frontmatter.head ??= [];

		// Постер hero — самый крупный элемент первого экрана лендинга, а
		// браузер добирается до него только через разметку. Палитру
		// отбираем через media, чтобы качать один файл, а не оба. Hero
		// есть только на лендинге, на доках эта пара была бы напрасной.
		if (pageData.frontmatter.layout === "home") {
			for (const theme of ["", "-light"]) {
				pageData.frontmatter.head.push([
					"link",
					{
						rel: "preload",
						as: "image",
						type: "image/webp",
						fetchpriority: "high",
						href: `${demoBase}/hero${theme}-poster.webp`,
						media: theme ? "(prefers-color-scheme: light)" : "(prefers-color-scheme: dark)",
					},
				]);
			}
		}

		pageData.frontmatter.head.push(
			["link", { rel: "canonical", href: url }],
			["link", { rel: "alternate", hreflang: "en", href: enUrl }],
			["link", { rel: "alternate", hreflang: "ru", href: ruUrl }],
			["link", { rel: "alternate", hreflang: "x-default", href: enUrl }],
			["meta", { property: "og:type", content: "website" }],
			["meta", { property: "og:site_name", content: "lazyvimx" }],
			["meta", { property: "og:url", content: url }],
			["meta", { property: "og:title", content: title }],
			["meta", { property: "og:description", content: description }],
			["meta", { property: "og:image", content: `${site}/og.png` }],
			["meta", { property: "og:locale", content: ru ? "ru_RU" : "en_US" }],
			["meta", { property: "og:locale:alternate", content: ru ? "en_US" : "ru_RU" }],
			["meta", { name: "twitter:card", content: "summary_large_image" }],
			["meta", { name: "twitter:title", content: title }],
			["meta", { name: "twitter:description", content: description }],
			["meta", { name: "twitter:image", content: `${site}/og.png` }],
		);
	},

	locales: {
		root: {
			label: "English",
			lang: "en",
			themeConfig: {
				sidebar: sidebarEn,
			},
		},
		ru: {
			label: "Русский",
			lang: "ru",
			link: "/ru/",
			description: "Слой улучшений поверх LazyVim: 50 опциональных экстр и 39 оверрайдов плагинов",
			themeConfig: {
				sidebar: sidebarRu,
				outline: { label: "На этой странице" },
				docFooter: { prev: "Предыдущая", next: "Следующая" },
				lastUpdatedText: "Обновлено",
				darkModeSwitchLabel: "Тема",
				sidebarMenuLabel: "Меню",
				returnToTopLabel: "Наверх",
			},
		},
	},

	themeConfig: {
		siteTitle: "~/lazyvimx",
		externalLinkIcon: true,
		socialLinks: [{ icon: "github", link: github }],
		// Локальный поиск не переводится сам — подписи задаём вручную.
		search: {
			provider: "local",
			options: {
				locales: {
					ru: {
						translations: {
							button: { buttonText: "Поиск", buttonAriaLabel: "Поиск" },
							modal: {
								displayDetails: "Показать подробности",
								resetButtonTitle: "Сбросить",
								backButtonTitle: "Назад",
								noResultsText: "Ничего не нашлось",
								footer: {
									selectText: "выбрать",
									selectKeyAriaLabel: "Enter",
									navigateText: "перейти",
									navigateUpKeyAriaLabel: "Вверх",
									navigateDownKeyAriaLabel: "Вниз",
									closeText: "закрыть",
									closeKeyAriaLabel: "Esc",
								},
							},
						},
					},
				},
			},
		},
	},
});
