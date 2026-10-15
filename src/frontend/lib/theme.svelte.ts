export type Scheme = 'light' | 'dark'

/** Ключ общий со скриптом public/theme.js: тот применяет выбор до отрисовки. */
const KEY = 'theme'

const systemScheme = (): Scheme => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

function readScheme(): Scheme {
	const stored = document.documentElement.dataset.theme

	return stored === 'light' || stored === 'dark' ? stored : systemScheme()
}

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
	theme.scheme = readScheme()

	const sync = () => (theme.scheme = readScheme())

	matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sync)
	new MutationObserver(sync).observe(document.documentElement, { attributeFilter: ['data-theme'] })
}

/**
 * Ставит схему. Совпала с системной -- выбор забываем, и сайт снова идёт за системой,
 * как было на VitePress.
 */
export function setScheme(scheme: Scheme) {
	const root = document.documentElement
	const follow = scheme === systemScheme()

	if (follow) delete root.dataset.theme
	else root.dataset.theme = scheme

	try {
		if (follow) localStorage.removeItem(KEY)
		else localStorage.setItem(KEY, scheme)
	} catch {
		// Хранилище закрыто (приватный режим) -- тема продержится до перезагрузки.
	}
}

export function toggleScheme() {
	setScheme(readScheme() === 'dark' ? 'light' : 'dark')
}
