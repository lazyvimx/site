<!-- Клавиши vim поверх сайта: движения, буферы-страницы, метки на ссылках,
командная строка и which-key. -->
<script lang="ts">
	import { onMount, tick } from 'svelte'

	import VimHints from '#frontend/components/vim/vim-hints.svelte'
	import VimWhichKey from '#frontend/components/vim/vim-which-key.svelte'
	import type { Lang } from '#frontend/lib/i18n.ts'
	import { theme, toggleScheme, watchTheme } from '#frontend/lib/theme.svelte.ts'
	import { isEditingContent, isTouchOnly, keyCandidates } from '#frontend/lib/vim-keys.ts'
	import {
		clearMessage,
		type Hint,
		type Page,
		type Panel,
		setMessage,
		startTutor,
		stopTutor,
		track,
		vim,
	} from '#frontend/lib/vim-state.svelte.ts'

	type Props = { lang: Lang; slug?: string; pages: Page[]; home: string; alternate: string; github: string }

	let { lang, slug, pages, home, alternate, github }: Props = $props()

	const ru = $derived(lang === 'ru')

	// ——— скролл ———————————————————————————————————————————————————————

	// Строка сетки -- 28px, за нажатие проходим две, иначе j ощущается вязко.
	const STEP = 56

	// Плавность своя, а не behavior: "smooth": на автоповторе браузер рвёт
	// очередь анимаций, и страница дёргается.
	let wanted: number | null = null
	let frame = 0

	const maxScroll = () => Math.max(0, document.documentElement.scrollHeight - innerHeight)
	const halfPage = () => Math.round(innerHeight / 2)
	const from = () => wanted ?? scrollY

	function scrollToY(y: number) {
		wanted = Math.max(0, Math.min(maxScroll(), y))

		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return settle()

		frame ||= requestAnimationFrame(glide)
	}

	function scrollByY(delta: number) {
		scrollToY(from() + delta)
	}

	function glide() {
		const rest = (wanted ?? scrollY) - scrollY

		if (Math.abs(rest) < 1) return settle()

		scrollTo(0, scrollY + rest * 0.3)
		frame = requestAnimationFrame(glide)
	}

	function settle() {
		if (frame) cancelAnimationFrame(frame)

		if (wanted !== null) scrollTo(0, wanted)

		frame = 0
		wanted = null
	}

	// Колесо и палец забирают скролл себе, анимацию бросаем на месте.
	function drop() {
		if (frame) cancelAnimationFrame(frame)

		frame = 0
		wanted = null
	}

	// ——— заголовки ————————————————————————————————————————————————————

	function headingTops() {
		const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0

		// Заголовок страницы пропускаем: до него доводит gg, а как остановка
		// для "}" он съедал бы первое нажатие.
		return [...document.querySelectorAll<HTMLElement>('.doc :where(h2, h3)')]
			.filter((el) => el.id)
			.map((el) => Math.round(scrollY + el.getBoundingClientRect().top - offset))
	}

	function jumpHeading(step: number) {
		const tops = headingTops()

		if (!tops.length) return

		if (step > 0) {
			const ahead = tops.filter((top) => top > from() + 1)

			return scrollToY(ahead.length ? ahead[Math.min(step, ahead.length) - 1] : maxScroll())
		}

		const behind = tops.filter((top) => top < from() - 1)

		scrollToY(behind.length ? behind[Math.max(0, behind.length + step)] : 0)
	}

	function gotoHeading(n: number) {
		const tops = headingTops()

		if (!tops.length) return setMessage('E486: Pattern not found')

		scrollToY(tops[Math.min(n, tops.length) - 1])
	}

	// ——— страницы —————————————————————————————————————————————————————

	// Соседние страницы берём из того же дерева, что рисует сайдбар, так порядок
	// один и на лендинге, где пейджера внизу нет.
	function toPage(delta: number) {
		const next = pages[pages.findIndex((page) => page.slug === slug) + delta]

		if (!next) {
			return setMessage(delta > 0 ? 'E87: Cannot go beyond last buffer' : 'E88: Cannot go before first buffer')
		}

		location.assign(next.link)
	}

	function editPage(name: string) {
		if (!name) return setMessage('E32: No file name')

		const match = pages.find((page) => page.slug.startsWith(name.toLowerCase()))

		if (!match) return setMessage(`E447: Can't find file "${name}" in path`)

		location.assign(match.link)
	}

	// ——— прочие действия ——————————————————————————————————————————————

	function openSearch() {
		vim.search = true
	}

	function focusFirst(selector: string) {
		const el = document.querySelector<HTMLElement>(selector)

		if (!el?.offsetParent) return setMessage('E444: Cannot close last window')

		el.focus()
		el.scrollIntoView({ block: 'nearest' })
	}

	function switchLang() {
		location.assign(alternate)
	}

	function openRepo() {
		open(github, '_blank', 'noopener')
	}

	// ——— раскладка ————————————————————————————————————————————————————

	type Key = { seq: string; group: string; en: string; ru: string; run: (count: number) => void }

	// Точку и запятую не занимаем: в кириллице они лежат на Slash, и биндинг на них
	// перехватил бы "/" раньше, чем тот дойдёт до поиска.
	const KEYS: Key[] = [
		{ seq: 'j', group: 'motion', en: 'line down', ru: 'строка вниз', run: (n) => scrollByY(STEP * n) },
		{ seq: 'k', group: 'motion', en: 'line up', ru: 'строка вверх', run: (n) => scrollByY(-STEP * n) },
		{
			seq: 'd',
			group: 'motion',
			en: 'half page down',
			ru: 'полстраницы вниз',
			run: (n) => scrollByY(halfPage() * n),
		},
		{
			seq: 'u',
			group: 'motion',
			en: 'half page up',
			ru: 'полстраницы вверх',
			run: (n) => scrollByY(-halfPage() * n),
		},
		{ seq: 'gg', group: 'motion', en: 'to the top', ru: 'в начало', run: () => scrollToY(0) },
		{ seq: 'G', group: 'motion', en: 'to the bottom', ru: 'в конец', run: () => scrollToY(maxScroll()) },
		{ seq: '}', group: 'motion', en: 'next heading', ru: 'следующий заголовок', run: (n) => jumpHeading(n) },
		{ seq: '{', group: 'motion', en: 'previous heading', ru: 'предыдущий заголовок', run: (n) => jumpHeading(-n) },
		{ seq: ']]', group: 'motion', en: 'next heading', ru: 'следующий заголовок', run: (n) => jumpHeading(n) },
		{ seq: '[[', group: 'motion', en: 'previous heading', ru: 'предыдущий заголовок', run: (n) => jumpHeading(-n) },

		{ seq: 'L', group: 'buffer', en: 'next page', ru: 'следующая страница', run: () => toPage(1) },
		{ seq: 'H', group: 'buffer', en: 'previous page', ru: 'предыдущая страница', run: () => toPage(-1) },
		{ seq: ']b', group: 'buffer', en: 'next page', ru: 'следующая страница', run: () => toPage(1) },
		{ seq: '[b', group: 'buffer', en: 'previous page', ru: 'предыдущая страница', run: () => toPage(-1) },
		{ seq: ']h', group: 'buffer', en: 'forward in history', ru: 'вперёд по истории', run: () => history.forward() },
		{ seq: '[h', group: 'buffer', en: 'back in history', ru: 'назад по истории', run: () => history.back() },
		{ seq: 'gh', group: 'buffer', en: 'home page', ru: 'на главную', run: () => location.assign(home) },

		{ seq: '/', group: 'find', en: 'search the site', ru: 'поиск по сайту', run: openSearch },
		{ seq: 'f', group: 'find', en: 'label the links', ru: 'метки на ссылках', run: () => startHints(false) },
		{ seq: 'F', group: 'find', en: 'labels, new tab', ru: 'метки, в новой вкладке', run: () => startHints(true) },
		{ seq: ':', group: 'find', en: 'command line', ru: 'командная строка', run: () => openCmdline() },
		{ seq: '?', group: 'find', en: 'all the keys', ru: 'все клавиши', run: () => (vim.sheet = true) },

		{ seq: '  ', group: 'leader', en: 'search the site', ru: 'поиск по сайту', run: openSearch },
		{ seq: ' e', group: 'leader', en: 'file tree', ru: 'дерево файлов', run: () => focusFirst('.sidebar__link') },
		{ seq: ' o', group: 'leader', en: 'outline', ru: 'оглавление', run: () => focusFirst('#toc .toc__link') },
		{ seq: ' l', group: 'leader', en: 'language', ru: 'язык', run: switchLang },
		{ seq: ' ut', group: 'leader', en: 'theme', ru: 'тема', run: toggleScheme },
		{ seq: ' gg', group: 'leader', en: 'repository', ru: 'репозиторий', run: openRepo },
		{ seq: ' ?', group: 'leader', en: 'all the keys', ru: 'все клавиши', run: () => (vim.sheet = true) },
	]

	const BY_SEQ = new Map(KEYS.map((key) => [key.seq, key]))
	const PREFIXES = new Set(KEYS.flatMap(({ seq }) => [...seq].slice(1).map((_, i) => seq.slice(0, i + 1))))

	// ——— подсказки ————————————————————————————————————————————————————

	let whichKey = $state(false)
	let whichKeyTimer: ReturnType<typeof setTimeout> | undefined

	const GROUPS: Record<string, { en: string; ru: string }> = {
		motion: { en: 'Motions', ru: 'Движение' },
		buffer: { en: 'Buffers', ru: 'Буферы' },
		find: { en: 'Find', ru: 'Поиск' },
		leader: { en: 'Leader', ru: 'Лидер' },
	}

	const pretty = (seq: string) => seq.replace(/ /g, '<space>').replace(/^<space>/, '<leader>')

	const panel: Panel | null = $derived.by(() => {
		const label = (key: Key) => ({ seq: pretty(key.seq), text: ru ? key.ru : key.en })

		if (vim.sheet) {
			return {
				title: ru ? 'Клавиши' : 'Keys',
				groups: Object.entries(GROUPS).map(([name, title]) => ({
					title: ru ? title.ru : title.en,
					items: KEYS.filter((key) => key.group === name).map(label),
				})),
			}
		}

		if (!whichKey || !vim.pending) return null

		return {
			title: pretty(vim.pending),
			groups: [{ items: KEYS.filter((key) => key.seq.startsWith(vim.pending)).map(label) }],
		}
	})

	// ——— метки на ссылках —————————————————————————————————————————————

	const HINT_KEYS = 'asdfghjkl'

	type HintTarget = Hint & { el: HTMLAnchorElement }

	let hints = $state<{ newTab: boolean; typed: string; items: HintTarget[] } | null>(null)

	// Метки одной длины: иначе короткая была бы началом длинной, и переход срабатывал бы
	// раньше, чем человек дотянет ярлык.
	function makeLabels(count: number) {
		let labels = [...HINT_KEYS]

		while (labels.length < count) labels = labels.flatMap((prefix) => [...HINT_KEYS].map((ch) => prefix + ch))

		return labels
	}

	function startHints(newTab: boolean) {
		const items = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
			.map((el) => ({ el, rect: el.getBoundingClientRect() }))
			.filter(({ el, rect }) => {
				if (!rect.width || !rect.height) return false

				if (rect.bottom < 0 || rect.top > innerHeight || rect.right < 0 || rect.left > innerWidth) return false

				return getComputedStyle(el).visibility !== 'hidden'
			})

		if (!items.length) return setMessage('E349: No identifier under cursor')

		const labels = makeLabels(items.length)

		hints = {
			newTab,
			typed: '',
			items: items.map(({ el, rect }, i) => ({ el, label: labels[i], top: rect.top, left: rect.left })),
		}

		addEventListener('scroll', closeHints, { passive: true })
		addEventListener('resize', closeHints)
	}

	function closeHints() {
		hints = null
		removeEventListener('scroll', closeHints)
		removeEventListener('resize', closeHints)
	}

	function feedHint(event: KeyboardEvent) {
		event.preventDefault()

		if (!hints || event.key === 'Escape') return closeHints()

		const ch = keyCandidates(event).find((candidate) => HINT_KEYS.includes(candidate.toLowerCase()))

		if (!ch) return closeHints()

		const typed = hints.typed + ch.toLowerCase()
		const match = hints.items.filter((item) => item.label.startsWith(typed))

		if (!match.length) return closeHints()

		if (match.length > 1) {
			hints.typed = typed

			return
		}

		const { el } = match[0]
		const newTab = hints.newTab

		closeHints()

		if (newTab || el.target === '_blank') {
			open(el.href, '_blank', 'noopener')

			return
		}

		el.click()
	}

	// ——— командная строка —————————————————————————————————————————————

	let cmd = $state<string | null>(null)
	let cmdInput = $state<HTMLInputElement>()
	const typedLines: string[] = []
	let typedAt = -1

	// Пока Tab листает меню, оно строится от набранного руками, а не от подставленного
	// кандидата, иначе список схлопнулся бы до одного пункта.
	let anchor = $state<string | null>(null)
	let selected = $state(-1)

	const COMMANDS = [
		{ word: 'edit', en: 'open a page', ru: 'открыть страницу' },
		{ word: 'help', en: 'key bindings', ru: 'клавиши' },
		{ word: 'set', en: 'set an option', ru: 'задать опцию' },
		{ word: 'lang', en: 'switch language', ru: 'сменить язык' },
		{ word: 'LazyExtras', en: 'list of extras', ru: 'список экстр' },
		{ word: 'Tutor', en: 'interactive tutorial', ru: 'интерактивный туториал' },
		{ word: 'q', en: 'go back', ru: 'назад' },
	]

	function argsFor(name: string) {
		switch (name) {
			case 'e':
			case 'edit':
				return pages.map((page) => ({ word: page.slug, desc: page.text }))

			case 'set':
				return [
					{ word: 'bg=dark', desc: ru ? 'тёмная тема' : 'dark theme' },
					{ word: 'bg=light', desc: ru ? 'светлая тема' : 'light theme' },
				]

			case 'lang':
				return [
					{ word: 'en', desc: 'English' },
					{ word: 'ru', desc: 'Русский' },
				]
		}

		return []
	}

	// Голова строки -- команда, хвост -- аргумент, дополняется то, что под курсором.
	function parseLine(line: string) {
		const text = line.trimStart()
		const space = text.search(/\s/)

		if (space < 0) return { name: null, arg: text }

		return { name: text.slice(0, space), arg: text.slice(space).trimStart() }
	}

	const menu = $derived.by(() => {
		if (cmd === null) return []

		const { name, arg } = parseLine(anchor ?? cmd)
		const needle = arg.toLowerCase()
		const items =
			name === null ? COMMANDS.map((item) => ({ word: item.word, desc: ru ? item.ru : item.en })) : argsFor(name)

		return items.filter((item) => item.word.toLowerCase().startsWith(needle))
	})

	function fill(item: { word: string }, { space = false } = {}) {
		const { name } = parseLine(anchor ?? cmd ?? '')
		const line = name === null ? item.word : `${name} ${item.word}`

		cmd = space && name === null ? `${line} ` : line
	}

	function cycle(delta: number) {
		if (!menu.length) return

		anchor ??= cmd

		const next = selected + delta

		selected = next < 0 ? menu.length - 1 : next % menu.length
		fill(menu[selected])
	}

	// Клик по команде сразу ставит пробел: следом откроется меню аргументов.
	function pick(index: number) {
		fill(menu[index], { space: true })
		dropMenu()
	}

	function dropMenu() {
		anchor = null
		selected = -1
	}

	function openCmdline() {
		reset()
		clearMessage()

		vim.mode = 'COMMAND'
		cmd = ''
		typedAt = -1
		dropMenu()

		tick().then(() => cmdInput?.focus())
	}

	function closeCmdline() {
		cmd = null
		vim.mode = 'NORMAL'
		dropMenu()
	}

	function onCmdKey(event: KeyboardEvent) {
		if (event.key === 'Escape' || (event.key === 'Backspace' && !cmd)) {
			event.preventDefault()

			return closeCmdline()
		}

		if (event.key === 'Enter') {
			event.preventDefault()

			const line = cmd ?? ''

			closeCmdline()

			return runCommand(line)
		}

		if (event.key === 'Tab' || (event.ctrlKey && (event.key === 'n' || event.key === 'p'))) {
			event.preventDefault()

			return cycle(event.shiftKey || event.key === 'p' ? -1 : 1)
		}

		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			event.preventDefault()

			return recall(event.key === 'ArrowUp' ? 1 : -1)
		}
	}

	function recall(delta: number) {
		typedAt = Math.max(-1, Math.min(typedLines.length - 1, typedAt + delta))
		cmd = typedLines[typedAt] ?? ''
		dropMenu()
	}

	function runCommand(raw: string) {
		const line = raw.trim()

		if (!line) return

		typedLines.unshift(line)

		const [name, ...rest] = line.split(/\s+/)
		const arg = rest.join(' ')

		if (/^\d+$/.test(name)) return gotoHeading(Number(name))

		track({ cmd: name, arg })

		switch (name) {
			case 'q':
			case 'q!':
			case 'qa':
				return history.back()

			case 'e':
			case 'edit':
				return editPage(arg)

			case 'h':
			case 'help':
				vim.sheet = true

				return

			case 'set':
				return setOption(arg)

			case 'lang':
				return setLang(arg)

			case 'LazyExtras':
				return editPage('extras')

			case 'Tutor':
				return startTutor()

			case 'w':
			case 'wq':
			case 'x':
				return setMessage("E45: 'readonly' option is set (add ! to override)")
		}

		setMessage(`E492: Not an editor command: ${line}`)
	}

	function setOption(arg: string) {
		const parsed = arg.match(/^(?:bg|background)=(dark|light)$/)

		if (!parsed) return setMessage(`E518: Unknown option: ${arg}`)

		if ((theme.scheme === 'dark') !== (parsed[1] === 'dark')) toggleScheme()
	}

	function setLang(arg: string) {
		if (arg !== 'ru' && arg !== 'en') return setMessage(`E474: Invalid argument: ${arg}`)

		if (arg !== lang) switchLang()
	}

	// ——— разбор нажатий ———————————————————————————————————————————————

	function reset() {
		clearTimeout(whichKeyTimer)

		vim.pending = ''
		vim.count = ''
		whichKey = false
		vim.sheet = false

		if (hints) closeHints()

		if (cmd !== null) closeCmdline()
	}

	function apply(seq: string) {
		const binding = BY_SEQ.get(seq)

		if (!binding) {
			vim.pending = seq
			clearTimeout(whichKeyTimer)

			whichKeyTimer = setTimeout(() => {
				whichKey = true
				track({ whichkey: seq })
			}, 250)

			return
		}

		const count = Number(vim.count) || 1

		reset()
		binding.run(count)
		track({ seq })
	}

	// Cmd/Ctrl-K в кириллице приходит как "л", и поиск по event.key молчал бы.
	function searchShortcut(event: KeyboardEvent) {
		if (!event.metaKey && !event.ctrlKey) return false

		if (event.altKey || vim.search || isEditingContent(event)) return false

		if (!keyCandidates(event).includes('k')) return false

		event.preventDefault()
		openSearch()

		return true
	}

	function onCtrl(event: KeyboardEvent) {
		// Внутри поиска Ctrl-j/k ходят по результатам, это его клавиши.
		if (vim.search || isEditingContent(event)) return

		const keys = keyCandidates(event)

		// Ctrl-f и Ctrl-o оставлены браузеру: там поиск по странице и диалог открытия
		// файла, ломать их ради полстраницы не стоит.
		if (!keys.includes('d') && !keys.includes('u')) return

		event.preventDefault()
		scrollByY(keys.includes('d') ? halfPage() : -halfPage())
	}

	function onKeydown(event: KeyboardEvent) {
		if (searchShortcut(event)) return

		if (event.metaKey || event.altKey) return

		if (event.ctrlKey) return onCtrl(event)

		if (hints) return feedHint(event)

		if (event.key === 'Escape') return reset()

		if (isEditingContent(event) || vim.search) return

		const keys = keyCandidates(event)

		// Пока идёт туториал и поверх ничего не открыто, q и n -- его клавиши:
		// в раскладке они свободны.
		if (vim.tutor !== null && !vim.overlay && !vim.pending && !vim.count) {
			if (keys.includes('q')) {
				event.preventDefault()

				return stopTutor()
			}

			if (keys.includes('n')) {
				event.preventDefault()

				return track({ tutor: 'skip' })
			}
		}

		// Счётчик набирается до последовательности: 3j, 5}
		if (!vim.pending) {
			const digit = keys.find((ch) => ch >= '0' && ch <= '9')

			if (digit && (vim.count || digit !== '0')) {
				event.preventDefault()
				vim.count += digit

				return
			}
		}

		// Оборвавшуюся последовательность начинаем заново с той же клавиши.
		const tries = keys.map((ch) => vim.pending + ch)

		if (vim.pending) tries.push(...keys)

		const seq = tries.find((candidate) => BY_SEQ.has(candidate) || PREFIXES.has(candidate))

		if (!seq) return reset()

		event.preventDefault()
		apply(seq)
	}

	// ——— жизненный цикл ———————————————————————————————————————————————

	// Командная строка ложится поверх статуслайна, как view = "cmdline" в noice.
	const barOpen = $derived(cmd !== null || !!vim.message)

	// Туториал прячет карточку, пока поверх страницы что-то открыто.
	$effect(() => {
		vim.overlay = cmd !== null || !!hints || !!panel
	})

	$effect(() => {
		if (selected < 0) return

		tick().then(() => document.querySelector('.cmdline__item--selected')?.scrollIntoView({ block: 'nearest' }))
	})

	onMount(() => {
		watchTheme()

		if (isTouchOnly()) return

		addEventListener('keydown', onKeydown)
		addEventListener('wheel', drop, { passive: true })
		addEventListener('touchmove', drop, { passive: true })

		return () => {
			removeEventListener('keydown', onKeydown)
			removeEventListener('wheel', drop)
			removeEventListener('touchmove', drop)
			closeHints()
		}
	})
</script>

{#if hints}
	<VimHints items={hints.items} typed={hints.typed} />
{/if}

{#if panel}
	<VimWhichKey {panel} />
{/if}

{#if barOpen}
	<div class="cmdline">
		{#if cmd !== null && menu.length}
			<ul class="cmdline__menu">
				{#each menu as item, index (item.word)}
					<!-- Клавиатурой меню листают Tab и Ctrl-n/p из поля, мышь -- только дополнительный путь. -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<li
						class="cmdline__item"
						class:cmdline__item--selected={index === selected}
						onmousedown={(event) => {
							event.preventDefault()
							pick(index)
						}}
					>
						<span class="cmdline__word">{item.word}</span>
						<span class="cmdline__desc">{item.desc}</span>
					</li>
				{/each}
			</ul>
		{/if}

		{#if cmd !== null}
			<span class="cmdline__prompt">:</span>
			<input
				bind:this={cmdInput}
				bind:value={cmd}
				class="cmdline__input"
				type="text"
				aria-label={ru ? 'Командная строка' : 'Command line'}
				autocomplete="off"
				spellcheck="false"
				onblur={closeCmdline}
				oninput={dropMenu}
				onkeydown={onCmdKey}
			/>
		{:else}
			<span class="cmdline__message">{vim.message}</span>
		{/if}
	</div>
{/if}

<style>
	/* Командная строка и сообщения ложатся поверх статуслайна, а не выталкивают его
	   вверх, как view = "cmdline" в noice. */
	.cmdline {
		position: fixed;
		z-index: 61;
		right: 0;
		bottom: 0;
		left: 0;
		display: flex;
		align-items: center;
		height: var(--statusline-height);
		font-size: 12px;
		line-height: var(--statusline-height);
		color: var(--bar-fg);
		white-space: nowrap;
		background: var(--bar-bg);

		/* Иконка noice -- секция в цвет режима COMMAND с тем же скосом. */
		&__prompt {
			position: relative;
			padding: 0 16px;
			font-weight: 700;
			color: var(--mode-fg);
			background: var(--mode-command);

			/* Ширина ":" дробная, и стык встаёт на полпикселя: скос заходит на секцию
			   на 1px, чтобы в сглаженной кромке не просвечивал фон. */
			&::after {
				content: '';
				position: absolute;
				top: 0;
				right: -10px;
				bottom: 0;
				width: 11px;
				background: inherit;
				clip-path: polygon(0 0, 1px 0, 100% 100%, 0 100%);
			}
		}

		&__input {
			flex: 1;
			padding: 0 22px;
			border: 0;
			font: inherit;
			color: var(--text-1);
			background: transparent;
			outline: 0;
		}

		&__message {
			padding: 0 16px;
			color: var(--vim-error);
		}

		/* Меню автокомплита встаёт над строкой от начала ввода, как у cmp. */
		&__menu {
			position: absolute;
			bottom: 100%;
			left: 46px;
			overflow-y: auto;
			min-width: 280px;
			max-width: calc(100vw - 62px);
			max-height: calc(var(--statusline-height) * 10);
			margin: 0 0 4px;
			padding: 2px 0;
			border: 1px solid var(--divider);
			list-style: none;
			background: var(--panel-bg);
			box-shadow: 0 4px 14px rgb(0 0 0 / 18%);
		}

		&__item {
			cursor: pointer;
			display: flex;
			gap: 24px;
			justify-content: space-between;
			padding: 0 10px;
			line-height: 24px;

			&:hover {
				background: var(--cursorline);
			}

			&--selected,
			&--selected:hover {
				background: var(--vim-visual-bg);
			}
		}

		&__word {
			color: var(--text-1);
		}

		&__desc {
			overflow: hidden;
			color: var(--vim-dim);
			text-overflow: ellipsis;
		}
	}
</style>
