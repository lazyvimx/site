// Общая шина vim-слоя: статуслайн, навигация, туториал и поиск -- соседи,
// пропсы между ними не протянуть.

export type VimEvent = {
	seq?: string
	cmd?: string
	arg?: string
	whichkey?: string
	tutor?: 'skip'
	sheet?: boolean
}

export const vim = $state({
	/** NORMAL или COMMAND, VISUAL статуслайн выводит сам из выделения. */
	mode: 'NORMAL' as 'NORMAL' | 'COMMAND',
	/** Набранное, но ещё не разрешённое -- showcmd в правом углу. */
	count: '',
	pending: '',
	/** Строка сообщений, как у vim под статуслайном. */
	message: '',
	/** Шпаргалка по всем клавишам: её открывают и "?", и кнопка в полосе. */
	sheet: false,
	/** Последнее действие. Каждый раз новый объект, чтобы эффект сработал и на повтор. */
	last: null as VimEvent | null,
	/** Открыт ли оверлей навигации: командная строка, метки, which-key. */
	overlay: false,
	/** Номер шага туториала или null, tutorDone -- пройден ли он целиком. */
	tutor: null as number | null,
	tutorDone: false,
	/** Открыт ли поиск по сайту. */
	search: false,
})

let timer: ReturnType<typeof setTimeout> | undefined

export function setMessage(text: string) {
	vim.message = text
	clearTimeout(timer)
	timer = setTimeout(() => (vim.message = ''), 4000)
}

export function clearMessage() {
	clearTimeout(timer)
	vim.message = ''
}

export function track(event: VimEvent) {
	vim.last = { ...event }
}

export function startTutor() {
	vim.tutor = 0
}

export function stopTutor() {
	vim.tutor = null
}

/** Страница документации для `L`/`H` и `:edit`. */
export type Page = { slug: string; text: string; link: string }

/** Метка на ссылке для `f` и её место во вьюпорте. */
export type Hint = { label: string; top: number; left: number }

/** Панель which-key: заголовок и группы пунктов. */
export type Panel = { title: string; groups: { title?: string; items: { seq: string; text: string }[] }[] }
