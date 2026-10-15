import type { Lang } from '#frontend/lib/i18n.ts'

export type NavItem = { slug: string; icon: string; text: Record<Lang, string> }
export type NavGroup = { text: Record<Lang, string>; items: NavItem[] }

/**
 * Дерево страниц в сайдбаре. Тот же порядок листают `L` и `H`,
 * пейджер внизу страницы и `:edit` в командной строке.
 */
export const nav: NavGroup[] = [
	{
		text: { en: 'Guide', ru: 'Руководство' },
		items: [
			{ slug: 'getting-started', icon: '🚀', text: { en: 'Getting Started', ru: 'Быстрый старт' } },
			{ slug: 'extras', icon: '🧩', text: { en: 'Extras', ru: 'Экстры' } },
			{ slug: 'configuration', icon: '⚙️', text: { en: 'Configuration', ru: 'Настройка' } },
			{ slug: 'keybindings', icon: '⌨️', text: { en: 'Keybindings', ru: 'Кеймапы' } },
			{ slug: 'faq', icon: '❓', text: { en: 'FAQ', ru: 'FAQ' } },
			{ slug: 'troubleshooting', icon: '🔧', text: { en: 'Troubleshooting', ru: 'Решение проблем' } },
		],
	},
	{
		text: { en: 'Reference', ru: 'Справочник' },
		items: [
			{ slug: 'architecture', icon: '🏗️', text: { en: 'Architecture', ru: 'Архитектура' } },
			{ slug: 'api', icon: '🔌', text: { en: 'API', ru: 'API' } },
		],
	},
]

export const navPages = nav.flatMap((group) => group.items)
