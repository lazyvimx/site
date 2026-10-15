<!-- Демо-запись экстры: mp4 вместо гифки, вдвое легче при том же качестве. Палитра
берётся у темы, поэтому в разметке один <video>, а не пара скрытых друг за другом.
Тейпы, у которых записан ещё и вариант без экстры, получают табы "До | После".

Гифки никуда не делись: их показывает GitHub в README и EXTRAS.md, где <video>
не проигрывается. -->
<script lang="ts">
	import { onMount, tick } from 'svelte'

	import { demoSource, demoUnreachable } from '#frontend/lib/demo-source.svelte.ts'
	import type { Lang } from '#frontend/lib/i18n.ts'
	import { theme, watchTheme } from '#frontend/lib/theme.svelte.ts'

	type Props = { name: string; alt: string; before: boolean; width: number; height: number; lang: Lang }

	let { name, alt, before, width, height, lang }: Props = $props()

	const labels = $derived(lang === 'ru' ? ['До', 'После'] : ['Before', 'After'])
	let showBefore = $state(false)

	const src = $derived(
		`${demoSource()}/${name}${showBefore ? '-before' : ''}${theme.scheme === 'dark' ? '' : '-light'}.mp4`,
	)

	let video: HTMLVideoElement
	let visible = $state(false)
	// До первого кадра рамка пустая, и без спиннера непонятно, грузится ли там что-то.
	// Гасим и на canplay: если автоплей отклонят, playing не придёт, а вечно крутящийся
	// спиннер хуже никакого.
	let loading = $state(true)

	function play() {
		// Автоплей отклоняют по разным причинам (экономия батареи, политика браузера),
		// это не ошибка страницы, показываем как есть.
		video?.play().catch(() => {})
	}

	// У <video> нет loading="lazy", так что ленивость держим сами: пока запись за экраном,
	// у неё нет даже src, и браузеру нечего скачивать.
	onMount(() => {
		watchTheme()

		const observer = new IntersectionObserver(
			([entry]) => {
				visible = entry.isIntersecting

				if (!visible) return video.pause()

				// src проставит Svelte при следующем обновлении DOM, играть зовём после него.
				tick().then(play)
			},
			{ rootMargin: '200px' },
		)

		observer.observe(video)

		return () => observer.disconnect()
	})

	// Смена темы или таба меняет файл, и <video> нужно перезарядить руками.
	let loaded = ''

	$effect(() => {
		if (!visible || src === loaded) return

		const first = !loaded

		loaded = src

		if (first) return

		tick().then(() => {
			video.load()
			play()
		})
	})

	// Запись не доехала -- уходим на запасной вход CDN. Адрес сменится, и эффект выше
	// перезарядит <video>. Если и там ошибка, адрес останется прежним, второго круга
	// не будет, а значит и спиннер больше не нужен.
	function onError() {
		const was = src

		demoUnreachable()

		if (src === was) loading = false
	}
</script>

<div class="demo-player">
	{#if before}
		<div class="demo-player__tabs">
			<button
				class="demo-player__tab"
				class:demo-player__tab--active={showBefore}
				type="button"
				onclick={() => (showBefore = true)}>{labels[0]}</button
			>
			<button
				class="demo-player__tab"
				class:demo-player__tab--active={!showBefore}
				type="button"
				onclick={() => (showBefore = false)}>{labels[1]}</button
			>
		</div>
	{/if}
	<div class="demo-player__frame">
		<video
			bind:this={video}
			class="demo-player__video"
			src={visible ? src : undefined}
			{width}
			{height}
			aria-label={`${alt}: ${name}`}
			autoplay
			muted
			loop
			playsinline
			preload="none"
			onloadstart={() => (loading = true)}
			onwaiting={() => (loading = true)}
			oncanplay={() => (loading = false)}
			onplaying={() => (loading = false)}
			onerror={onError}
		></video>
		<span class="demo-player__loading" class:demo-player__loading--active={visible && loading} aria-hidden="true">
			<span class="demo-player__spinner"></span>
		</span>
	</div>
</div>

<style>
	.demo-player {
		&__tabs {
			display: inline-flex;
			gap: 4px;
			margin-top: 16px;
			padding: 3px;
			border: 1px solid var(--divider);
			background: var(--bg-soft);
		}

		&__tab {
			padding: 2px 14px;
			font-size: 13px;
			font-weight: 500;
			color: var(--text-2);
			transition:
				color 0.25s,
				background-color 0.25s;

			&--active {
				color: var(--text-1);
				background: var(--bg);
				box-shadow: 0 1px 3px rgb(0 0 0 / 12%);
			}
		}

		&__frame {
			position: relative;
			margin-top: 8px;
		}

		/* Рамка и тень отделяют запись от фона страницы. Место держат width и height
		   из тейпа, иначе страница прыгала бы на каждой подгрузке. */
		&__video {
			width: 100%;
			border: 1px solid var(--divider);
			background: var(--bg-soft);
			box-shadow: 0 6px 24px rgb(0 0 0 / 18%);
		}

		/* Затемнение со спиннером, пока запись грузится. Появляется с задержкой:
		   запись из кэша стартует мгновенно, и без неё рамка мигала бы на каждом возврате. */
		&__loading {
			pointer-events: none;
			position: absolute;
			inset: 0;
			display: flex;
			align-items: center;
			justify-content: center;
			opacity: 0;
			background: color-mix(in srgb, var(--bg-soft) 35%, transparent);
			transition: opacity 0.25s;

			&--active {
				opacity: 1;
				transition-delay: 0.15s;
			}
		}

		/* Скруглений на сайте нет, и крутящийся круг вышел бы квадратом, поэтому крутим
		   кадры, как в терминальных спиннерах. Лента кадров едет в окне шириной в один
		   символ, и кадры только ASCII: у запасного шрифта другая ширина, лента уползла бы. */
		&__spinner {
			overflow: hidden;
			width: 1ch;
			font-size: 32px;
			line-height: 1;
			color: var(--text-1);
			white-space: nowrap;

			&::before {
				content: '|/-\\';
				display: inline-block;
				animation: demo-spin 0.6s steps(4) infinite;

				/* Совсем не крутить нельзя, пропадёт сам смысл индикатора. */
				@media (--reduced-motion) {
					animation-duration: 2.4s;
				}
			}
		}
	}

	@keyframes demo-spin {
		to {
			transform: translateX(-4ch);
		}
	}
</style>
