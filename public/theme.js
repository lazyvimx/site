// Выбранную тему ставим до отрисовки, иначе страница мигнёт системной. Пара -- lib/theme.svelte.ts.
// Отдельный файл, а не инлайн: CSP разрешает только свои скрипты по адресу.
try {
	let theme = localStorage.getItem('theme')

	// Выбор, сделанный ещё на VitePress, переносим один раз.
	if (theme === null) {
		const legacy = localStorage.getItem('vitepress-theme-appearance')

		localStorage.removeItem('vitepress-theme-appearance')

		if (legacy === 'light' || legacy === 'dark') {
			theme = legacy
			localStorage.setItem('theme', theme)
		}
	}

	if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme
} catch {
	// Хранилище закрыто -- остаётся тема системы.
}
