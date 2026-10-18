import { schemeOf, toggleTheme, watchTheme as watch, type Scheme } from '@aimuzov-projects/infra-site-kit/theme.js'

// Логика темы в infra-site-kit, выбор до отрисовки ставит ThemeBoot в layouts/base.astro.
export type { Scheme }

/**
 * Схема, в которой нарисована страница, для компонентов, которым мало CSS:
 * записи демо берут файл своей палитры. На сервере схемы нет, там тёмная.
 */
export const theme = $state<{ scheme: Scheme }>({ scheme: 'dark' })

let watching = false

/** Начать следить за схемой: её меняет и переключатель, и сама система. */
export function watchTheme() {
	if (watching) return

	watching = true
	watch((current, system) => (theme.scheme = schemeOf(current, system)))
}

/** Совпала новая схема с системной -- выбор забываем, и сайт снова идёт за системой, как было на VitePress. */
export const toggleScheme = () => toggleTheme()
