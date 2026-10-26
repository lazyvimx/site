import { localeOfPath, localizePath, type Routing } from '@aimuzov/infra-site-kit/i18n.js'

export type Lang = 'en' | 'ru'

export const langs: Lang[] = ['en', 'ru']

/**
 * Схема языков для i18n из infra-site-kit: английский в корне, русский под `/ru/`.
 * У кита по умолчанию наоборот, поэтому её передают в `LangSwitch` и `I18nHead`.
 */
export const routing = { locales: langs, defaultLocale: 'en' } satisfies Routing

/** Язык страницы по её пути: всё под `/ru/` -- русское, остальное английское. */
export function langOf(path: string): Lang {
	return localeOfPath(path, routing) as Lang
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
	return localizePath(path, lang, routing)
}
