import type { Lang } from '#frontend/lib/i18n.ts'

type Action = { text: string; link: string; brand?: boolean; tutor?: boolean }
type Feature = { icon: string; title: string; details: string }

export type Home = {
	description: string
	name: string
	text: string
	tagline: string
	actions: Action[]
	features: Feature[]
}

/** Лендинги обоих языков: hero с кнопками и плитки возможностей под ним. */
export const home: Record<Lang, Home> = {
	en: {
		description:
			'51 optional extras and 40 plugin overrides for LazyVim — themes, motions, git workflow, Russian keyboard layout. Every extra is enabled piece by piece.',
		name: 'lazyvimx',
		text: 'An enhancement layer for LazyVim',
		tagline:
			'51 optional extras and 40 plugin overrides. LazyVim stays untouched — everything else is enabled piece by piece.',
		actions: [
			{ text: '🚀 Get Started', link: '/getting-started', brand: true },
			{ text: '🎬 Browse Extras', link: '/extras' },
			{ text: '⭐ GitHub', link: 'https://github.com/lazyvimx/nvim' },
			{ text: '⌨️ Try vim keys', link: '#tutor', tutor: true },
		],
		features: [
			{
				icon: '🎨',
				title: 'Deep theme customization',
				details:
					'Catppuccin, Tokyo Night, and Nord with hundreds of custom highlights, automatic light/dark switching, and one consistent UI style.',
			},
			{
				icon: '🚀',
				title: 'Smart navigation',
				details:
					'Subword motions that understand camelCase, syntax-tree movement and node swapping, VSCode-like peek preview for LSP locations.',
			},
			{
				icon: '🔧',
				title: 'Git workflow',
				details:
					'GitLab MR review inside the editor, visual conflict resolution, browsing remote repositories without leaving Neovim.',
			},
			{
				icon: '⌨️',
				title: 'Russian keyboard layout',
				details: 'Every keymap works on the Russian layout via langmapper — no switching back and forth.',
			},
			{
				icon: '📦',
				title: 'Opt-in by design',
				details:
					"Every extra is enabled individually via :LazyExtras. What you don't enable doesn't exist for lazy.nvim at all.",
			},
			{
				icon: '🧹',
				title: 'Quality of life',
				details:
					'Buffer groups and auto-cleanup, safe editing over sshfs, per-project configs, chezmoi sync, VSCode mode.',
			},
		],
	},
	ru: {
		description:
			'51 опциональная экстра и 40 оверрайдов плагинов для LazyVim — темы, движения, работа с git, русская раскладка. Каждая экстра включается отдельно.',
		name: 'lazyvimx',
		text: 'Слой улучшений для LazyVim',
		tagline:
			'51 опциональная экстра и 40 оверрайдов плагинов. LazyVim остаётся как есть — остальное включается по кусочкам.',
		actions: [
			{ text: '🚀 Быстрый старт', link: '/ru/getting-started', brand: true },
			{ text: '🎬 Смотреть экстры', link: '/ru/extras' },
			{ text: '⭐ GitHub', link: 'https://github.com/lazyvimx/nvim' },
			{ text: '⌨️ Попробовать vim-клавиши', link: '#tutor', tutor: true },
		],
		features: [
			{
				icon: '🎨',
				title: 'Глубокая кастомизация тем',
				details:
					'Catppuccin, Tokyo Night и Nord с сотнями кастомных хайлайтов, автопереключение светлой/тёмной темы, единый стиль интерфейса.',
			},
			{
				icon: '🚀',
				title: 'Умная навигация',
				details:
					'Движения по подсловам с пониманием camelCase, перемещение и перестановка узлов синтаксического дерева, peek-превью LSP-локаций как в VSCode.',
			},
			{
				icon: '🔧',
				title: 'Git-воркфлоу',
				details:
					'Ревью GitLab MR прямо в редакторе, визуальное разрешение конфликтов, просмотр удалённых репозиториев не выходя из Neovim.',
			},
			{
				icon: '⌨️',
				title: 'Русская раскладка',
				details:
					'Все кеймапы работают на русской раскладке через langmapper — переключаться туда-обратно не нужно.',
			},
			{
				icon: '📦',
				title: 'Всё опционально',
				details:
					'Каждая экстра включается отдельно через :LazyExtras. Что не включено — для lazy.nvim не существует вовсе.',
			},
			{
				icon: '🧹',
				title: 'Удобства',
				details:
					'Группы буферов и автоочистка, безопасная работа с sshfs, локальные конфиги проектов, синк в chezmoi, режим VSCode.',
			},
		],
	},
}
