<!-- Интерфейс Neovim поверх сайта одним островом: статуслайн, клавиши, туториал
и поиск делят одно состояние, а острова Astro гидрируются каждый сам по себе. -->
<script lang="ts">
	import Search from '@aimuzov/infra-site-kit/ui/search.svelte'
	import { onMount } from 'svelte'

	import VimNav from '#frontend/components/vim/vim-nav.svelte'
	import VimStatusline from '#frontend/components/vim/vim-statusline.svelte'
	import VimTutor from '#frontend/components/vim/vim-tutor.svelte'
	import { ui } from '#frontend/data/ui.ts'
	import type { Lang } from '#frontend/lib/i18n.ts'
	import { type Page, vim } from '#frontend/lib/vim-state.svelte.ts'

	type Props = {
		lang: Lang
		/** Страница документации, у главной её нет. */
		slug?: string
		pages: Page[]
		home: string
		alternate: string
		version: string
		github: string
	}

	let { lang, slug, pages, home, alternate, version, github }: Props = $props()

	const t = $derived(ui[lang])
	const strings = $derived({
		[lang]: {
			'search.open': t.search,
			'search.placeholder': t.searchPlaceholder,
			'search.unavailable': t.searchDev,
			'search.select': t.searchSelect,
			'search.navigate': t.searchNavigate,
			'search.close': t.searchClose,
		},
	})

	let search: { open: () => void }

	// Флаг поиска читают туториал и клавиши: пока окно открыто, они молчат.
	$effect(() => {
		if (vim.search) search.open()
	})

	// Кнопка поиска в шапке -- статический HTML, она только просит открыть поиск.
	onMount(() => {
		const open = (event: MouseEvent) => {
			if ((event.target as Element).closest('[data-search-open]')) vim.search = true
		}

		document.addEventListener('click', open)

		return () => document.removeEventListener('click', open)
	})
</script>

<VimStatusline {lang} {slug} {version} {github} />
<VimNav {lang} {slug} {pages} {home} {alternate} {github} />
<VimTutor {lang} />
<div class="vim-search">
	<Search
		bind:this={search}
		locale={lang}
		{strings}
		button={false}
		closeButton={false}
		shortcut={false}
		trimHtml
		vimKeys
		onclose={() => (vim.search = false)}
	>
		{#snippet prompt()}<span class="vim-search__prompt" aria-hidden="true">/</span>{/snippet}
		{#snippet empty(query)}{t.searchEmpty} “<strong>{query}</strong>”{/snippet}
	</Search>
</div>

<style>
	/* Поиск из infra-site-kit в цветах редактора: выбранный результат -- строка
	   курсора в рамке, совпадения -- выделение Visual. */
	.vim-search {
		--ui-search-top: var(--nav-height);
		--ui-backdrop: rgb(0 0 0 / 60%);
		--ui-card-bg: var(--bg);
		--ui-menu-shadow: 0 12px 32px rgb(0 0 0 / 30%);
		--ui-hover-bg: var(--cursorline);
		--ui-hover-border: var(--brand);
		--ui-accent-soft: var(--vim-visual-bg);
		--ui-search-title: var(--brand);
		--ui-search-text: var(--text-2);
		--ui-search-hit-border: 1px;

		display: contents;

		&__prompt {
			padding-right: 4px;
			font-weight: 700;
			color: var(--mode-command);
		}
	}
</style>
