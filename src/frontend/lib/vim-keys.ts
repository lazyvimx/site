// Раскладка меняет символ на клавише, но не саму клавишу: в ЙЦУКЕН под Slash
// приходит ".", под KeyJ -- "о". Нажатие даёт двух кандидатов, символ раскладки
// и символ позиции, а биндинг берёт того, кого знает.

type KeyLike = Pick<KeyboardEvent, 'key' | 'code' | 'shiftKey'>

/** Позиции, которые не вывести из имени кода: [символ, символ с Shift]. */
const PUNCT: Record<string, [string, string]> = {
	Slash: ['/', '?'],
	Semicolon: [';', ':'],
	BracketLeft: ['[', '{'],
	BracketRight: [']', '}'],
	Space: [' ', ' '],
}

export function qwertyChar(code: string, shift: boolean) {
	if (!code) return null

	if (code.length === 4 && code.startsWith('Key')) {
		const letter = code[3]

		return shift ? letter.toUpperCase() : letter.toLowerCase()
	}

	// Цифры с Shift дают знаки препинания, свои в каждой раскладке. Угадывать нечем,
	// да и незачем: счётчик читает только цифры.
	if (code.length === 6 && code.startsWith('Digit')) return shift ? null : code[5]

	const pair = PUNCT[code]

	return pair ? pair[shift ? 1 : 0] : null
}

export function keyCandidates(event: KeyLike) {
	const list: string[] = []

	if (event.key && event.key.length === 1) list.push(event.key)

	const fromCode = qwertyChar(event.code, event.shiftKey)

	if (fromCode && fromCode !== list[0]) list.push(fromCode)

	return list
}

/** Пока курсор в поле ввода, клавиши принадлежат полю, а не навигации. */
export function isEditingContent(event: Event) {
	const el = event.target as HTMLElement | null

	if (!el?.tagName) return false

	return el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA'
}

/** На тачскрине клавиатуры обычно нет, а есть -- так хоткеи всё равно негде показать. */
export function isTouchOnly() {
	return matchMedia('(hover: none)').matches
}
