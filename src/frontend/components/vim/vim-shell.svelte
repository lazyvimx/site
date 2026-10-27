<!-- Интерфейс Neovim поверх сайта одним островом: статуслайн, клавиши, туториал
и поиск делят одно состояние, а острова Astro гидрируются каждый сам по себе. -->
<script lang="ts">
	import { onMount } from 'svelte'

	import Search from '#frontend/components/vim/search.svelte'
	import VimNav from '#frontend/components/vim/vim-nav.svelte'
	import VimStatusline from '#frontend/components/vim/vim-statusline.svelte'
	import VimTutor from '#frontend/components/vim/vim-tutor.svelte'
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
<Search {lang} />
