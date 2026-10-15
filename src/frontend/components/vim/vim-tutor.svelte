<!-- Туториал в духе vimtutor: карточка над статуслайном, шаг засчитывается только
по настоящему действию. Запускает его сам человек -- кнопкой на лендинге, секцией
в статуслайне или :Tutor. Шаг переживает переход на другую страницу. -->
<script lang="ts">
	import { onMount, untrack } from 'svelte'

	import type { Lang } from '#frontend/lib/i18n.ts'
	import { isEditingContent, isTouchOnly, keyCandidates } from '#frontend/lib/vim-keys.ts'
	import { stopTutor, type VimEvent, vim } from '#frontend/lib/vim-state.svelte.ts'

	let { lang }: { lang: Lang } = $props()

	const ru = $derived(lang === 'ru')

	type Seen = { bottom?: boolean }

	// Тексты статичные и свои, поэтому {@html}: так клавиши остаются <kbd>.
	const STEPS: { en: string; ru: string; done: (event: VimEvent, seen: Seen) => boolean }[] = [
		{
			en: '<kbd>j</kbd> / <kbd>k</kbd> scroll a line down / up.',
			ru: '<kbd>j</kbd> / <kbd>k</kbd> — строка вниз / вверх.',
			done: (e) => e.seq === 'j' || e.seq === 'k',
		},
		{
			en: '<kbd>d</kbd> / <kbd>u</kbd> scroll half a page. Counts work too: <kbd>3j</kbd>.',
			ru: '<kbd>d</kbd> / <kbd>u</kbd> — полстраницы. Счётчик тоже работает: <kbd>3j</kbd>.',
			done: (e) => e.seq === 'd' || e.seq === 'u',
		},
		{
			en: '<kbd>G</kbd> jumps to the bottom, then <kbd>gg</kbd> back to the top.',
			ru: '<kbd>G</kbd> — в конец, затем <kbd>gg</kbd> — обратно в начало.',
			done: (e, seen) => {
				if (e.seq === 'G') seen.bottom = true

				return !!seen.bottom && e.seq === 'gg'
			},
		},
		{
			en: '<kbd>}</kbd> / <kbd>{</kbd> jump between headings; <kbd>L</kbd> / <kbd>H</kbd> flip pages.',
			ru: '<kbd>}</kbd> / <kbd>{</kbd> — по заголовкам; <kbd>L</kbd> / <kbd>H</kbd> листают страницы.',
			done: (e) => ['}', '{', ']]', '[['].includes(e.seq ?? ''),
		},
		{
			en: '<kbd>f</kbd> labels every link: type a label to follow it or <kbd>Esc</kbd> to cancel.',
			ru: '<kbd>f</kbd> — метки на ссылках: набери метку, чтобы перейти, или <kbd>Esc</kbd>.',
			done: (e) => e.seq === 'f' || e.seq === 'F',
		},
		{
			en: '<kbd>/</kbd> searches the whole site.',
			ru: '<kbd>/</kbd> — поиск по всему сайту.',
			done: (e) => e.seq === '/' || e.seq === '  ',
		},
		{
			en: '<kbd>:</kbd> opens the command line, <kbd>Tab</kbd> cycles completions. Run <kbd>:set bg=dark</kbd>.',
			ru: '<kbd>:</kbd> — командная строка, <kbd>Tab</kbd> листает варианты. Выполни <kbd>:set bg=dark</kbd>.',
			done: (e) => e.cmd === 'set' && /^(?:bg|background)=(?:dark|light)$/.test(e.arg ?? ''),
		},
		{
			en: 'Press <kbd>Space</kbd> and wait: which-key lists the leader commands.',
			ru: 'Нажми <kbd>Space</kbd> и подожди: which-key покажет leader-команды.',
			done: (e) => e.whichkey === ' ',
		},
		{
			en: '<kbd>?</kbd> shows every key at once.',
			ru: '<kbd>?</kbd> — все клавиши разом.',
			done: (e) => !!e.sheet,
		},
	]

	const DONE = {
		en: "That's all. <kbd>?</kbd> always shows every key.",
		ru: 'Вот и всё. <kbd>?</kbd> всегда покажет все клавиши.',
	}

	const KEY_STEP = 'vim-tutor-step'
	const KEY_DONE = 'vim-tutor-done'

	// В приватном окне или с заблокированными данными storage бросает,
	// туториал тогда просто работает без памяти.
	function read(storage: 'localStorage' | 'sessionStorage', key: string) {
		try {
			return window[storage].getItem(key)
		} catch {
			return null
		}
	}

	function write(storage: 'localStorage' | 'sessionStorage', key: string, value: string | null) {
		try {
			if (value === null) window[storage].removeItem(key)
			else window[storage].setItem(key, value)
		} catch {
			// Без памяти туториал всё равно работает.
		}
	}

	let enabled = $state(false)
	let passed = $state(false)
	let finished = $state(false)

	let seen: Seen = {}
	let flashTimer: ReturnType<typeof setTimeout> | undefined
	let finishTimer: ReturnType<typeof setTimeout> | undefined

	const step = $derived(vim.tutor === null ? null : STEPS[vim.tutor])
	const hidden = $derived(vim.overlay || vim.search)
	const visible = $derived(enabled && !hidden && (!!step || finished))

	const title = $derived(finished ? 'Tutor ✓' : `Tutor ${(vim.tutor ?? 0) + 1}/${STEPS.length}`)
	const text = $derived.by(() => {
		const source = finished ? DONE : step

		if (!source) return ''

		// Класс клавишам ставим здесь, чтобы не повторять его в каждом тексте шага.
		return (ru ? source.ru : source.en).replaceAll('<kbd>', '<kbd class="tutor__key">')
	})

	const hint = $derived.by(() => {
		if (finished) return ru ? 'q — закрыть' : 'q — close'

		if (passed) return '✓'

		return ru ? 'q — выйти · n — пропустить' : 'q — quit · n — skip'
	})

	function next() {
		seen = {}
		passed = false

		if (vim.tutor !== null && vim.tutor + 1 < STEPS.length) {
			vim.tutor += 1

			return
		}

		stopTutor()
		vim.tutorDone = true
		write('localStorage', KEY_DONE, '1')
		finished = true
	}

	// Галочка висит чуть-чуть, чтобы засчитанный шаг было видно.
	function pass() {
		passed = true
		clearTimeout(flashTimer)
		flashTimer = setTimeout(() => vim.tutor !== null && next(), 600)
	}

	function check(event: VimEvent | null) {
		if (!event || vim.tutor === null || passed) return

		if (event.tutor === 'skip') return next()

		if (STEPS[vim.tutor].done(event, seen)) pass()
	}

	// После финала туториал уже остановлен, и навигация q не ловит:
	// финальную карточку закрываем сами.
	function onKeydown(event: KeyboardEvent) {
		if (!finished || hidden || event.ctrlKey || event.metaKey || event.altKey) return

		if (isEditingContent(event) || !keyCandidates(event).includes('q')) return

		event.preventDefault()
		finished = false
	}

	function close() {
		if (finished) finished = false
		else stopTutor()
	}

	function onClick(event: MouseEvent) {
		const link = (event.target as Element).closest?.('a[href$="#tutor"]')

		if (!link) return

		event.preventDefault()
		event.stopPropagation()
		finished = false
		vim.tutor = 0
	}

	// Шаг проверяется только по новому действию. Без untrack смена шага перезапустила бы
	// проверку со старым событием, и "n" пропускал бы все шаги подряд.
	$effect(() => {
		const event = vim.last

		untrack(() => check(event))
	})

	$effect(() => {
		if (vim.sheet) untrack(() => check({ sheet: true }))
	})

	// Шаг живёт в sessionStorage, так что туториал продолжается на соседней странице.
	let restored = false

	$effect(() => {
		const index = vim.tutor

		if (!restored) return

		clearTimeout(flashTimer)
		passed = false
		seen = {}
		write('sessionStorage', KEY_STEP, index === null ? null : String(index))

		if (index !== null) finished = false
	})

	// Финальная карточка гаснет сама, но отсчёт идёт, только пока её видно.
	$effect(() => {
		clearTimeout(finishTimer)

		if (finished && !hidden) finishTimer = setTimeout(() => (finished = false), 8000)
	})

	onMount(() => {
		if (isTouchOnly()) return

		enabled = true
		vim.tutorDone = read('localStorage', KEY_DONE) === '1'

		const saved = Number(read('sessionStorage', KEY_STEP) ?? NaN)

		if (Number.isInteger(saved) && saved >= 0 && saved < STEPS.length) vim.tutor = saved

		restored = true
		addEventListener('keydown', onKeydown)
		document.addEventListener('click', onClick, true)

		return () => {
			removeEventListener('keydown', onKeydown)
			document.removeEventListener('click', onClick, true)
			clearTimeout(flashTimer)
			clearTimeout(finishTimer)
		}
	})
</script>

{#if visible}
	<div class="tutor" role="status">
		<div class="tutor__head">
			<span>{title}</span>
			<button class="tutor__close" type="button" aria-label={ru ? 'Закрыть' : 'Close'} onclick={close}>×</button>
		</div>
		<p class="tutor__text">{@html text}</p>
		<div class="tutor__keys">{hint}</div>
	</div>
{/if}

<style>
	/* Карточка туториала в правом углу над статуслайном: страницу не закрывает и не затемняет. */
	.tutor {
		position: fixed;
		z-index: 59;
		right: 16px;
		bottom: calc(var(--statusline-height) + 12px);
		width: min(360px, calc(100vw - 32px));
		padding: 10px 16px 12px;
		border: 1px solid var(--divider);
		font-size: 12px;
		line-height: 20px;
		background: var(--panel-bg);
		box-shadow: 0 4px 14px rgb(0 0 0 / 18%);

		&__head {
			display: flex;
			justify-content: space-between;
			margin-bottom: 6px;
			font-weight: 700;
			color: var(--vim-accent);
		}

		&__close {
			font-size: 16px;
			color: var(--vim-dim);
			transition: color 0.25s;

			&:hover {
				color: var(--vim-accent);
			}
		}

		&__text {
			margin: 0;
			color: var(--text-1);

			& :global(.tutor__key) {
				padding: 0 5px;
				border: 1px solid var(--divider);
				font: inherit;
				font-weight: 700;
				background: var(--section-bg);
			}
		}

		&__keys {
			margin-top: 8px;
			color: var(--vim-dim);
		}
	}
</style>
