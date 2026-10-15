<!-- Поиск по сайту на Pagefind. Индекс строится после сборки (`pagefind --site dist`),
отдельный на каждый язык по `<html lang>`, и грузится по кусочкам только при первом
поиске. Открывают его кнопка в шапке, Cmd/Ctrl-K, "/" и "<leader><leader>". -->
<script lang="ts">
	import { tick } from 'svelte'

	import { ui } from '#frontend/data/ui.ts'
	import type { Lang } from '#frontend/lib/i18n.ts'
	import { keyCandidates } from '#frontend/lib/vim-keys.ts'
	import { vim } from '#frontend/lib/vim-state.svelte.ts'

	let { lang }: { lang: Lang } = $props()

	const t = $derived(ui[lang])

	type Hit = { url: string; page: string; section?: string; excerpt: string }

	type PagefindResult = {
		url: string
		meta: { title?: string }
		excerpt: string
		sub_results?: { title: string; url: string; excerpt: string }[]
	}

	type Pagefind = {
		options(options: Record<string, unknown>): Promise<void>
		debouncedSearch(query: string): Promise<{ results: { data(): Promise<PagefindResult> }[] } | null>
	}

	let dialog: HTMLDialogElement
	let input = $state<HTMLInputElement>()
	let query = $state('')
	let hits = $state<Hit[]>([])
	let active = $state(0)
	let unavailable = $state(false)
	let pagefind: Promise<Pagefind> | undefined

	// Pagefind пишет адрес файла: `extras.html`, а сайт открывает страницы без расширения.
	const clean = (url: string) => url.replace(/\.html(?=#|$)/, '').replace(/\/index(?=#|$)/, '/')
	// Совпадения Pagefind размечает голым <mark>, а стилям нужен класс.
	const marked = (excerpt: string) => excerpt.replaceAll('<mark>', '<mark class="search__mark">')

	function load() {
		// Адрес собирается в рантайме, иначе Vite попытался бы найти индекс при сборке.
		const url = '/pagefind/pagefind.js'

		pagefind ??= import(/* @vite-ignore */ url).then(async (module: Pagefind) => {
			await module.options({ excerptLength: 16 })

			return module
		})

		return pagefind
	}

	async function run(text: string) {
		if (!text.trim()) {
			hits = []

			return
		}

		try {
			const search = await (await load()).debouncedSearch(text)

			// Пока шёл поиск, запрос успели дописать: этот ответ уже никому не нужен.
			if (!search || text !== query) return

			const pages = await Promise.all(search.results.slice(0, 8).map((result) => result.data()))

			hits = pages.flatMap((page) => {
				const title = page.meta.title ?? ''
				const sections = (page.sub_results ?? []).slice(0, 3)

				if (!sections.length) return [{ url: clean(page.url), page: title, excerpt: marked(page.excerpt) }]

				return sections.map((section) => ({
					url: clean(section.url),
					page: title,
					section: section.title === title ? undefined : section.title,
					excerpt: marked(section.excerpt),
				}))
			})

			active = 0
		} catch {
			// В `astro dev` индекса нет: он появляется только после сборки.
			unavailable = true
		}
	}

	$effect(() => {
		run(query)
	})

	$effect(() => {
		if (vim.search && !dialog.open) {
			dialog.showModal()
			// Прошлый запрос остаётся выделенным: набор поверх заменит его целиком.
			input?.focus()
			input?.select()
		}

		if (!vim.search && dialog.open) dialog.close()
	})

	function go(hit: Hit | undefined) {
		if (!hit) return

		vim.search = false
		location.assign(hit.url)
	}

	function move(delta: number) {
		if (!hits.length) return

		active = (active + delta + hits.length) % hits.length
		tick().then(() => dialog.querySelector('.search__hit--active')?.scrollIntoView({ block: 'nearest' }))
	}

	function onKeydown(event: KeyboardEvent) {
		const keys = keyCandidates(event)

		if (event.key === 'ArrowDown' || (event.ctrlKey && (keys.includes('j') || keys.includes('n')))) {
			event.preventDefault()

			return move(1)
		}

		if (event.key === 'ArrowUp' || (event.ctrlKey && (keys.includes('k') || keys.includes('p')))) {
			event.preventDefault()

			return move(-1)
		}

		if (event.key === 'Enter') {
			event.preventDefault()
			go(hits[active])
		}
	}

	// Клик мимо окна попадает в сам <dialog>, его подложку.
	function onClick(event: MouseEvent) {
		if (event.target === dialog) vim.search = false
	}
</script>

<dialog bind:this={dialog} class="search" aria-label={t.search} onclose={() => (vim.search = false)} onclick={onClick}>
	<div class="search__box">
		<div class="search__bar">
			<span class="search__prompt" aria-hidden="true">/</span>
			<input
				bind:this={input}
				bind:value={query}
				class="search__input"
				type="search"
				placeholder={t.searchPlaceholder}
				aria-label={t.searchPlaceholder}
				autocomplete="off"
				spellcheck="false"
				onkeydown={onKeydown}
			/>
		</div>

		{#if unavailable}
			<p class="search__note">{t.searchDev}</p>
		{:else if query.trim() && !hits.length}
			<p class="search__note">{t.searchEmpty} “<strong>{query}</strong>”</p>
		{:else if hits.length}
			<ul class="search__hits">
				{#each hits as hit, index (hit.url)}
					<li>
						<a
							class="search__hit"
							class:search__hit--active={index === active}
							href={hit.url}
							onmouseenter={() => (active = index)}
							onclick={() => (vim.search = false)}
						>
							<span class="search__title">
								{hit.page}{#if hit.section}<span class="search__sep">›</span>{hit.section}{/if}
							</span>
							<!-- Отрывок с <mark> собирает Pagefind из текста самого сайта. -->
							<span class="search__excerpt">{@html hit.excerpt}</span>
						</a>
					</li>
				{/each}
			</ul>
		{/if}

		<div class="search__footer">
			<span><kbd class="search__key">↵</kbd> {t.searchSelect}</span>
			<span><kbd class="search__key">↑</kbd><kbd class="search__key">↓</kbd> {t.searchNavigate}</span>
			<span><kbd class="search__key">esc</kbd> {t.searchClose}</span>
		</div>
	</div>
</dialog>

<style>
	.search {
		width: min(560px, calc(100vw - 32px));
		max-width: none;
		max-height: none;
		margin: 64px auto auto;
		padding: 0;
		border: 1px solid var(--divider);
		color: var(--text-1);
		background: var(--bg);
		box-shadow: 0 12px 32px rgb(0 0 0 / 30%);

		&::backdrop {
			background: rgb(0 0 0 / 60%);
		}

		&__box {
			display: flex;
			flex-direction: column;
			max-height: min(70dvh, 600px);
		}

		&__bar {
			display: flex;
			align-items: center;
			border-bottom: 1px solid var(--divider);
		}

		&__prompt {
			padding: 0 4px 0 16px;
			font-weight: 700;
			color: var(--mode-command);
		}

		&__input {
			flex: 1;
			min-width: 0;
			padding: 14px 16px 14px 8px;
			border: 0;
			font: inherit;
			color: inherit;
			background: transparent;
			outline: 0;
		}

		&__note {
			margin: 0;
			padding: 24px 16px;
			font-size: 14px;
			color: var(--text-2);
			text-align: center;
		}

		&__hits {
			overflow-y: auto;
			margin: 0;
			padding: 8px;
			list-style: none;
		}

		&__hit {
			display: block;
			padding: 8px 12px;
			border: 1px solid transparent;

			&--active {
				border-color: var(--brand);
				background: var(--cursorline);
			}
		}

		&__title {
			overflow: hidden;
			display: block;
			font-size: 14px;
			font-weight: 600;
			color: var(--brand);
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		&__sep {
			margin: 0 6px;
			color: var(--text-3);
		}

		&__excerpt {
			display: block;
			font-size: 13px;
			line-height: 20px;
			color: var(--text-2);

			& :global(.search__mark) {
				color: var(--text-1);
				background: var(--vim-visual-bg);
			}
		}

		&__footer {
			display: flex;
			gap: 16px;
			padding: 10px 16px;
			border-top: 1px solid var(--divider);
			font-size: 12px;
			color: var(--text-3);

			@media (--no-hover) {
				display: none;
			}
		}

		&__key {
			margin-right: 4px;
			padding: 0 4px;
			border: 1px solid var(--divider);
			font-family: inherit;
		}
	}
</style>
