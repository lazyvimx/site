<!-- Запись под hero лендинга: mp4, а место держит постер первого кадра, двадцать килобайт.
Палитр две, но <video> один: адрес проставляет скрипт после монтирования, и только
своей палитры. Пара <video> с src качала бы обе записи разом, даже скрытую. -->
<script lang="ts">
	import { onMount } from 'svelte'

	import { demoSource, demoUnreachable } from '#frontend/lib/demo-source.svelte.ts'
	import { theme, watchTheme } from '#frontend/lib/theme.svelte.ts'

	let video: HTMLVideoElement
	let mounted = $state(false)

	onMount(() => {
		watchTheme()
		mounted = true
	})

	// Палитру переключают на ходу, а запасной вход включается при ошибке:
	// оба случая меняют адрес записи.
	$effect(() => {
		if (!mounted) return

		const palette = theme.scheme === 'dark' ? '' : '-light'
		const src = `${demoSource()}/hero${palette}.mp4`

		if (video.src === src) return

		video.poster = `${demoSource()}/hero${palette}-poster.webp`
		video.src = src
		video.play().catch(() => {})
	})
</script>

<div class="hero-demo">
	<video
		bind:this={video}
		class="hero-demo__video"
		width="1200"
		height="604"
		muted
		loop
		playsinline
		preload="none"
		aria-hidden="true"
		onerror={demoUnreachable}
	></video>
</div>

<style>
	/* Запись прижата вправо и подрезана по высоте hero, как раньше background-size: auto 100%. */
	.hero-demo {
		position: absolute;
		z-index: 0;
		inset: 0;
		overflow: hidden;

		&__video {
			position: absolute;
			top: 0;
			right: 0;
			width: auto;
			max-width: none;
			height: 100%;
		}
	}
</style>
