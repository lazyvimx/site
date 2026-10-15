import type { Element, ElementContent } from 'hast'
import type { HastPluginInput } from 'satteri'

// Разметка страниц документации поверх обычного markdown: якоря заголовков
// и внешние ссылки в новой вкладке, как было на VitePress.

// Регулярки повторяют slugify из VitePress (@mdit-vue/shared) символ в символ.
// oxlint-disable-next-line no-control-regex -- управляющие символы и вырезаем
const rControl = /[\u0000-\u001f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
// У VitePress диапазон U+0300–U+036F, свойство шире, но в доках других диакритик нет.
const rCombining = /\p{Mn}/gu

/**
 * Слаг заголовка по правилам VitePress, а не GitHub: на старом сайте
 * `ui.better-colorcolumn` давал `#ui-better-colorcolumn`, и ссылки на него
 * уже разошлись по чатам и закладкам.
 */
export function slugify(text: string) {
	return text
		.normalize('NFKD')
		.replace(rCombining, '')
		.replace(rControl, '')
		.replace(rSpecial, '-')
		.replace(/-{2,}/g, '-')
		.replace(/^-+|-+$/g, '')
		.replace(/^(\d)/, '_$1')
		.toLowerCase()
}

const textOf = (node: ElementContent): string => {
	if (node.type === 'text') return node.value

	if (node.type === 'element') return node.children.map(textOf).join('')

	return ''
}

/** Явный якорь `{#id}` в конце заголовка ставит sync-docs у заголовков с эмодзи. */
function splitExplicitId(children: ElementContent[]) {
	const last = children.at(-1)
	const match = last?.type === 'text' ? last.value.match(/\s*\{#([^}]+)\}\s*$/) : null

	if (!match || last?.type !== 'text') return { children, id: undefined }

	const trimmed = { ...last, value: last.value.slice(0, match.index) }

	return { children: [...children.slice(0, -1), trimmed], id: match[1] }
}

/** Плагин Sätteri: Astro запускает его до своего, а тот оставляет уже проставленные id. */
export const docPlugin: HastPluginInput = () => {
	// Повторы слагов нумеруются в пределах одной страницы.
	const seen = new Map<string, number>()

	return {
		name: 'lazyvimx-doc',
		element: [
			{
				filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
				visit(node) {
					const { children, id: explicit } = splitExplicitId([...node.children])
					const text = children.map(textOf).join('').trim()
					const base = explicit ?? slugify(text)
					const count = seen.get(base) ?? 0
					const id = count ? `${base}-${count}` : base

					seen.set(base, count + 1)

					// Пустая ссылка: значок рисует CSS, а в оглавление и в поиск текст якоря не попадает.
					const anchor: Element = {
						type: 'element',
						tagName: 'a',
						properties: {
							className: ['header-anchor'],
							href: `#${id}`,
							ariaLabel: `Permalink to “${text}”`,
						},
						children: [],
					}

					return { ...node, properties: { ...node.properties, id }, children: [...children, anchor] }
				},
			},
			{
				// Блок кода -- в рамку с языком и кнопкой копирования, как на VitePress.
				// Сама кнопка заработает от скрипта страницы.
				filter: ['pre'],
				visit(node, ctx) {
					const lang = node.properties.dataLanguage

					if (typeof lang !== 'string') return

					ctx.wrapNode(node, {
						type: 'element',
						tagName: 'div',
						properties: { className: ['code-block'] },
						children: [
							{
								type: 'element',
								tagName: 'button',
								properties: { className: ['code-block__copy'], type: 'button', ariaLabel: 'Copy code' },
								children: [],
							},
							...(lang === 'plaintext'
								? []
								: [
										{
											type: 'element',
											tagName: 'span',
											properties: { className: ['code-block__lang'], ariaHidden: 'true' },
											children: [{ type: 'text', value: lang }],
										} satisfies Element,
									]),
						],
					})
				},
			},
			{
				filter: ['a'],
				visit(node, ctx) {
					const href = node.properties.href

					if (typeof href !== 'string' || !/^https?:\/\//.test(href)) return

					ctx.setProperty(node, 'target', '_blank')
					ctx.setProperty(node, 'rel', ['noreferrer'])
				},
			},
		],
	}
}
