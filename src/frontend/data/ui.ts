import type { Lang } from '#frontend/lib/i18n.ts'

/** Подписи интерфейса на обоих языках, тексты документации сюда не входят. */
export const ui = {
	en: {
		description: 'An enhancement layer on top of LazyVim: 52 optional extras and 40 plugin overrides',
		locale: 'en_US',
		search: 'Search',
		searchPlaceholder: 'Search docs',
		searchEmpty: 'No results for',
		searchDev: 'Search works in the built site: npm run build && npm run preview',
		searchSelect: 'to select',
		searchNavigate: 'to navigate',
		searchClose: 'to close',
		menu: 'Menu',
		outline: 'On this page',
		// Кнопки панелей дописывают это к "Hide" и "Show".
		sidebarPanel: 'the sidebar',
		outlinePanel: 'the outline',
		top: 'Return to top',
		prev: 'Previous page',
		next: 'Next page',
		theme: 'Toggle dark mode',
		mainNav: 'Main navigation',
		docsNav: 'Documentation',
		skip: 'Skip to content',
		notFound: 'Page not found',
		notFoundText:
			"But if you don't change your direction, and if you keep looking, you may end up where you are heading.",
		home: 'Take me home',
		back: 'Go back',
		suggest: 'Maybe you meant',
	},
	ru: {
		description: 'Слой улучшений поверх LazyVim: 52 опциональные экстры и 40 оверрайдов плагинов',
		locale: 'ru_RU',
		search: 'Поиск',
		searchPlaceholder: 'Поиск по документации',
		searchEmpty: 'Ничего не нашлось по запросу',
		searchDev: 'Поиск работает в собранном сайте: npm run build && npm run preview',
		searchSelect: 'выбрать',
		searchNavigate: 'перейти',
		searchClose: 'закрыть',
		menu: 'Меню',
		outline: 'На этой странице',
		// Кнопки панелей дописывают это к "Скрыть" и "Показать".
		sidebarPanel: 'навигацию',
		outlinePanel: 'оглавление',
		top: 'Наверх',
		prev: 'Предыдущая',
		next: 'Следующая',
		theme: 'Тема',
		mainNav: 'Основная навигация',
		docsNav: 'Документация',
		skip: 'Перейти к содержимому',
		notFound: 'Страница не найдена',
		notFoundText: 'Возможно, ссылка устарела или в ней опечатка.',
		home: 'На главную',
		back: 'Назад',
		suggest: 'Возможно, вы искали',
	},
} satisfies Record<Lang, Record<string, string>>

export type Ui = (typeof ui)['en']
