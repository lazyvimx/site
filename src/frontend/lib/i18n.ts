export type Lang = 'en' | 'ru'

export const langs: Lang[] = ['en', 'ru']

/** Язык страницы по её пути: всё под `/ru/` -- русское, остальное английское. */
export function langOf(path: string): Lang {
	return path === '/ru' || path.startsWith('/ru/') ? 'ru' : 'en'
}

/** Путь страницы на сайте. У главных слэш на конце, как было на VitePress. */
export function pagePath(lang: Lang, slug?: string) {
	const prefix = lang === 'ru' ? '/ru/' : '/'

	return slug ? `${prefix}${slug}` : prefix
}

/** Slug страницы по пути, у главной -- `undefined`. */
export function slugOf(path: string) {
	const rest = path.replace(/^\/(ru(\/|$))?/, '').replace(/(\.html|\/)$/, '')

	return rest || undefined
}

/** Та же страница на другом языке. */
export function alternatePath(path: string, lang: Lang) {
	return pagePath(lang, slugOf(path))
}
