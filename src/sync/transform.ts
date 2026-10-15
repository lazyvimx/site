// Адаптация документации lazyvimx под сайт. Источник истины -- md-файлы
// в репозитории nvim, здесь только другие имена страниц, ссылки на код
// уходят на GitHub, а языковые подсказки выпиливаются: их заменяет
// переключатель локали.

export const github = 'https://github.com/lazyvimx/nvim'

export type Lang = 'en' | 'ru'

/** Размер записи и есть ли у неё вариант "до" -- всё это знают тейпы в репозитории nvim. */
export type DemoInfo = { width: number; height: number; before: boolean }

/** Страница сайта: имя файла в репозитории nvim без `.md` и `.ru.md` и её адрес на сайте. */
export const pages = [
	{ source: 'README', slug: 'getting-started' },
	{ source: 'docs/EXTRAS', slug: 'extras' },
	{ source: 'docs/CONFIGURATION', slug: 'configuration' },
	{ source: 'docs/KEYBINDINGS', slug: 'keybindings' },
	{ source: 'docs/FAQ', slug: 'faq' },
	{ source: 'docs/TROUBLESHOOTING', slug: 'troubleshooting' },
	{ source: 'docs/ARCHITECTURE', slug: 'architecture' },
	{ source: 'docs/API', slug: 'api' },
] as const

const nameMap: Record<string, string> = {
	EXTRAS: 'extras',
	CONFIGURATION: 'configuration',
	KEYBINDINGS: 'keybindings',
	FAQ: 'faq',
	TROUBLESHOOTING: 'troubleshooting',
	ARCHITECTURE: 'architecture',
	API: 'api',
	README: 'getting-started',
}

const escapeAttr = (value: string) =>
	value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

/**
 * Слот под запись демо. Самого плеера в markdown нет: его монтирует скрипт страницы,
 * а разметка только держит место по размеру из тейпа, чтобы страница не прыгала.
 * Блочный HTML отдельной строкой, иначе markdown завернёт его в абзац.
 */
export function demoMarkup(name: string, alt: string, { width, height, before }: DemoInfo) {
	const attrs = [
		`class="demo-slot"`,
		`data-demo="${escapeAttr(name)}"`,
		`data-alt="${escapeAttr(alt)}"`,
		`data-width="${width}"`,
		`data-height="${height}"`,
		before ? 'data-before' : '',
	]

	return `<div ${attrs.filter(Boolean).join(' ')}></div>`
}

/** Тейп VHS задаёт размер записи строками `Set Width` и `Set Height`. */
export function tapeSize(tape: string | undefined) {
	return {
		width: Number(tape?.match(/^Set Width (\d+)$/m)?.[1] ?? 1200),
		height: Number(tape?.match(/^Set Height (\d+)$/m)?.[1] ?? 604),
	}
}

export function transform(input: string, lang: Lang, demo: (name: string) => DemoInfo) {
	const prefix = lang === 'ru' ? '/ru/' : '/'
	let text = input

	// Блок "Русская версия/English version" -- на сайте есть переключатель.
	text = text.replace(/> \[!TIP\]\n> \*\*🇷🇺[^\n]*\n\n/g, '')
	text = text.replace(/> \[!TIP\]\n> \*\*🇬🇧[^\n]*\n\n/g, '')

	// Хвосты вида "([🇬🇧](docs/X.md))" в списках ссылок.
	text = text.replace(/ \(\[🇷🇺\]\([^)]*\)\)/g, '')
	text = text.replace(/ \(\[🇬🇧\]\([^)]*\)\)/g, '')

	// Баннер и бейджи из шапки README дублируют hero лендинга. Шапка -- это HTML-блоки
	// в самом начале файла: переключатель языка, баннер, бейджи, подзаголовок.
	text = text.replace(/^(?:<(p|h3)\b[^>]*>[\s\S]*?<\/\1>\s*)+/, '')
	// Шапка старого формата: картинка-баннер и бейджи в <div align="center">.
	text = text.replace(/^!\[[^\]]*\]\([^)]*banner[^)]*\)\n\n/, '')
	text = text.replace(/<div align="center">[\s\S]*?<\/div>\n\n/, '')

	// Взаимные ссылки доков -- на страницы сайта в своей локали.
	for (const [upper, lower] of Object.entries(nameMap)) {
		for (const from of ['docs/', './', '']) {
			text = text.replaceAll(`(${from}${upper}.ru.md`, `(${prefix}${lower}`)
			text = text.replaceAll(`(${from}${upper}.md`, `(${prefix}${lower}`)
		}
	}

	text = text.replaceAll('(../README.ru.md', `(${prefix}getting-started`)
	text = text.replaceAll('(../README.md', `(${prefix}getting-started`)

	// GitHub кладёт эмодзи заголовка в слаг, сайт его выбрасывает. Явный якорь
	// без эмодзи делает ссылки одинаковыми там и тут.
	text = text.replace(/^## (\p{Extended_Pictographic}️?) (.+)$/gmu, (_, emoji: string, name: string) => {
		const slug = name.toLowerCase().replaceAll('.', '').replace(/\s+/g, '-')

		return `## ${emoji} ${name} {#${slug}}`
	})

	text = text.replace(/\]\(#\p{Extended_Pictographic}️?-/gu, '](#')
	text = text.replace(/\]\((\/(?:ru\/)?[a-z-]+)#\p{Extended_Pictographic}️?-/gu, ']($1#')

	// В доках гифка, она нужна GitHub. Сайту отдаём mp4 той же записи:
	// вдвое легче и грузится только когда до неё доскроллили.
	text = text.replace(
		/!\[([^\]]*)\]\(https:\/\/raw\.githubusercontent\.com\/lazyvimx\/nvim\/assets\/demo\/([a-z0-9-]+)\.gif\)/g,
		(_, alt: string, name: string) => demoMarkup(name, alt, demo(name)),
	)

	// Всё, что живёт только в репозитории, -- на GitHub.
	for (const from of ['../lua/', './lua/', 'lua/']) text = text.replaceAll(`(${from}`, `(${github}/blob/main/lua/`)

	for (const from of ['../examples/', 'examples/'])
		text = text.replaceAll(`(${from}`, `(${github}/tree/main/examples/`)

	for (const from of ['../CONTRIBUTING', 'CONTRIBUTING'])
		text = text.replaceAll(`(${from}`, `(${github}/blob/main/CONTRIBUTING`)

	for (const from of ['../CHANGELOG.md', 'CHANGELOG.md'])
		text = text.replaceAll(`(${from}`, `(${github}/blob/main/CHANGELOG.md`)

	text = text.replaceAll('(./)', `(${github}/tree/main/docs)`)

	// Имя модуля в строке импорта экстры ведёт на её исходник в main, откуда берутся и доки.
	text = text.replace(
		/^(\*\*[^*]+:\*\* )`(lazyvimx\.extras\.[a-z0-9.-]+)`/gm,
		(_, label: string, mod: string) =>
			`${label}[\`${mod}\`](${github}/blob/main/lua/${mod.replaceAll('.', '/')}.lua)`,
	)

	return text
}

/** Заголовок страницы из первого h1. В README его нет: там шапку держат баннер и бейджи. */
export function extractTitle(text: string) {
	return text.match(/^# (.+)$/m)?.[1].trim()
}

/** README начинается без h1, а странице он нужен. */
export function withTitle(text: string) {
	return text.startsWith('# ') ? text : `# lazyvimx\n\n${text}`
}

/** Готовый файл коллекции: frontmatter с заголовком и источником, потом сам текст. */
export function toEntry(text: string, source: string) {
	const body = withTitle(text)
	const title = extractTitle(body) ?? 'lazyvimx'

	// JSON-строка -- валидный YAML, так что кавычки и двоеточия в заголовке не ломают frontmatter.
	return `---\ntitle: ${JSON.stringify(title)}\nsource: ${JSON.stringify(source)}\n---\n\n${body}`
}
