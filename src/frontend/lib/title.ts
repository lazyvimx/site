import { site } from '#frontend/data/site.ts'

/** Заголовок вкладки как на VitePress: "Страница | lazyvimx", у главной -- только сайт. */
export function pageTitle(title?: string) {
	return title && title !== site.name ? `${title} | ${site.name}` : site.name
}
