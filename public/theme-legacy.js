// Выбор темы, сделанный ещё на VitePress, переносим один раз под ключ ThemeBoot.
// Стоит перед ним в layouts/base.astro, чтобы перенесённый выбор встал до отрисовки.
try {
	const legacy = localStorage.getItem('vitepress-theme-appearance')

	if (legacy !== null) {
		localStorage.removeItem('vitepress-theme-appearance')

		if ((legacy === 'light' || legacy === 'dark') && localStorage.getItem('theme') === null)
			localStorage.setItem('theme', legacy)
	}
} catch {
	// Хранилище закрыто -- переносить нечего.
}
