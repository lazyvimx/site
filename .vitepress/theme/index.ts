// Палитра сайта — как у самого lazyvimx: catppuccin, тёмная — macchiato.
import DefaultTheme from "vitepress/theme";
import "@catppuccin/vitepress/theme/macchiato/blue.css";
import "./custom.css";

import { h } from "vue";

import DemoPlayer from "./DemoPlayer.vue";
import HeroDemo from "./HeroDemo.vue";
import HomeLandmark from "./HomeLandmark.vue";
import VimNav from "./VimNav.vue";
import VimStatusline from "./VimStatusline.vue";

export default {
	extends: DefaultTheme,

	// Статуслайн и хоткеи живут вне потока страницы — слотом в самый низ
	// layout. Запись под hero — слотом внутрь него самого.
	Layout: () =>
		h(DefaultTheme.Layout, null, {
			"home-hero-before": () => [h(HeroDemo), h(HomeLandmark)],
			"layout-bottom": () => [h(VimStatusline), h(VimNav)],
		}),

	enhanceApp({ app, router }) {
		app.component("DemoPlayer", DemoPlayer);

		// Первый хит Метрика шлёт сама при init, переходы внутри SPA — нет.
		// Хук зовётся и на старте, и на якорях, а это не новые просмотры —
		// отсюда сравнение адреса без хеша.
		if (!import.meta.env.SSR) {
			const page = () => location.origin + location.pathname + location.search;

			let from = page();
			router.onAfterRouteChange = () => {
				const to = page();
				if (to === from) return;

				(window as any).ym?.(112748414, "hit", to, { referer: from });
				from = to;
			};
		}
	},
};
