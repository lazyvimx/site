<!-- Статуслайн в духе lualine внизу вьюпорта: режим меняется на VISUAL при выделении
текста, справа позиция прокрутки как позиция в файле. -->
<script lang="ts">
	import Credit from '@aimuzov/infra-site-kit/credit.svelte'
	import { onMount } from 'svelte'

	import type { Lang } from '#frontend/lib/i18n.ts'
	import { startTutor, vim } from '#frontend/lib/vim-state.svelte.ts'

	type Props = { lang: Lang; slug?: string; version: string; github: string }

	let { lang, slug, version, github }: Props = $props()

	const release = $derived(`${github}/releases/tag/v${version}`)
	const file = $derived(`~/lazyvimx/${slug ?? 'index'}.md`)

	let visual = $state(false)
	let mounted = $state(false)
	let percent = $state('Top')

	const command = $derived(vim.mode === 'COMMAND')
	const mode = $derived.by(() => {
		if (command) return 'COMMAND'

		if (visual) return 'VISUAL'

		return vim.tutor === null ? 'NORMAL' : 'TUTOR'
	})

	// До монтирования неизвестно, пройден ли туториал. Без этого кнопка мелькала бы
	// в статическом HTML у тех, кто его уже прошёл.
	const offerTutor = $derived(mounted && vim.tutor === null && !vim.tutorDone)

	// Эхо набранного, как showcmd: пробел лидера иначе выглядит пустотой.
	const showcmd = $derived((vim.count + vim.pending).replace(/ /g, '␣'))

	// Высоту документа держим в переменной: читать её на каждом событии скролла --
	// это принудительная компоновка посреди прокрутки. Меняется она только
	// от содержимого, за этим и следит наблюдатель.
	let max = 0
	let frame = 0

	function measure() {
		max = document.documentElement.scrollHeight - innerHeight
	}

	function update() {
		const y = scrollY

		if (max <= 0) percent = 'All'
		else if (y <= 0) percent = 'Top'
		else if (y >= max - 2) percent = 'Bot'
		else percent = `${Math.round((y / max) * 100)}%`
	}

	// Событий скролла приходит больше, чем кадров: считаем раз в кадр.
	function onScroll() {
		frame ||= requestAnimationFrame(() => {
			frame = 0
			update()
		})
	}

	function onResize() {
		measure()
		update()
	}

	function onSelection() {
		visual = !document.getSelection()?.isCollapsed
	}

	onMount(() => {
		mounted = true

		let observer: ResizeObserver | undefined

		// Первый замер -- следующим кадром: в момент монтирования страница ещё
		// достраивается, и чтение высоты остановило бы её ради пересчёта раскладки.
		const start = requestAnimationFrame(() => {
			observer = new ResizeObserver(onResize)
			observer.observe(document.documentElement)
			onResize()
		})

		return () => {
			observer?.disconnect()
			cancelAnimationFrame(frame)
			cancelAnimationFrame(start)
		}
	})
</script>

<svelte:window onscroll={onScroll} onresize={onResize} />
<svelte:document onselectionchange={onSelection} />

<div class="statusline" class:statusline--visual={visual} class:statusline--command={command}>
	<!-- Глифов Nerd Font в веб-шрифте нет: точка вместо иконки режима,
	     скошенные границы секций рисует clip-path. -->
	<span class="statusline__section statusline__section--mode">● {mode}</span>
	<a class="statusline__section statusline__section--version" href={release} target="_blank" rel="noopener"
		>● v{version}</a
	>
	<span class="statusline__file">{file}</span>
	<span class="statusline__spacer"></span>
	<span class="statusline__showcmd">{showcmd}</span>
	<!-- Про клавиши иначе никто не узнает, пусть о них напоминает сама полоса. -->
	{#if offerTutor}
		<button class="statusline__button statusline__button--tutor" type="button" onclick={startTutor}>▶ tutor</button>
	{/if}
	<button
		class="statusline__button"
		type="button"
		aria-label={lang === 'ru' ? 'Все клавиши' : 'All the keys'}
		onclick={() => (vim.sheet = !vim.sheet)}>?</button
	>
	<!-- Подпись из infra-site-kit: в полосе выглядывает лицо, строка выезжает по наведению. -->
	<span class="statusline__section statusline__section--credit">
		<Credit copyright={false} align="center" locale={lang} />
	</span>
	<span class="statusline__section statusline__section--percent">{percent}</span>
</div>

<style>
	/* Цвет режима красит всю полосу, как в lualine: заливку крайних секций и текст версии.
	   На светлой заливке секции чистые цвета режимов не тянут 4.5:1, текст берёт их
	   затемнённый вариант. */
	.statusline {
		--mode: var(--mode-normal);
		--mode-text: light-dark(color-mix(in srgb, var(--mode) 50%, #000), var(--mode));

		position: fixed;
		z-index: 60;
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

		&--visual {
			--mode: var(--mode-visual);
		}

		&--command {
			--mode: var(--mode-command);
		}

		/* Секции разделены косой гранью, как powerline-разделители в lualine. Сама секция
		   прямоугольная, скос выносится за её край отдельным треугольником, так что
		   на стыке не остаётся ни щели, ни нахлёста. */
		&__section {
			position: relative;
			padding: 0 16px;
			color: var(--bar-fg);
			background: var(--section-bg);

			&--mode::after,
			&--version::after {
				content: '';
				position: absolute;
				z-index: 1;
				top: 0;
				right: -10px;
				bottom: 0;
				width: 10px;
				background: inherit;
				clip-path: polygon(0 0, 100% 100%, 0 100%);
			}

			&--credit::before,
			&--percent::before {
				content: '';
				position: absolute;
				z-index: 1;
				top: 0;
				bottom: 0;
				left: -10px;
				width: 10px;
				background: inherit;
				clip-path: polygon(100% 0, 100% 100%, 0 100%);
			}

			&--mode {
				font-weight: 700;
				color: var(--mode-fg);
				letter-spacing: 0.06em;
				background: var(--mode);
			}

			/* Слева секцию поджимает скос предыдущей, добавляем его ширину. */
			&--version {
				padding-left: 26px;
				color: var(--mode-text);
				transition: color 0.25s;

				&:hover {
					color: var(--bar-fg);
				}
			}

			/* Справа секцию подпирает скос следующей, ей тоже нужен запас. */
			&--credit {
				--credit-hover: var(--vim-accent);

				padding-right: 26px;

				/* Путь к файлу и подпись первыми уходят на узких экранах. */
				@media (width <= 720px) {
					display: none;
				}
			}

			/* Ширина фиксирована, иначе секция дёргается на каждом проценте. */
			&--percent {
				width: 74px;
				color: var(--mode-fg);
				text-align: center;
				background: var(--mode);
			}
		}

		&__file {
			padding: 0 22px;
			color: var(--vim-dim);

			@media (width <= 720px) {
				display: none;
			}
		}

		&__spacer {
			flex: 1;
		}

		/* Эхо набранной последовательности, там же, где showcmd в vim. */
		&__showcmd {
			min-width: 42px;
			padding-right: 6px;
			font-weight: 700;
			color: var(--vim-accent);
			text-align: right;
		}

		&__button {
			padding: 0 12px;
			font-weight: 700;
			color: var(--vim-dim);
			transition: color 0.25s;

			&:hover {
				color: var(--vim-accent);
			}

			&--tutor {
				@media (--no-hover) {
					display: none;
				}
			}
		}
	}
</style>
