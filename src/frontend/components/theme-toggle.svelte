<script lang="ts">
	import '@aimuzov/infra-site-kit/theme-peek.css'
	import { themePeek } from '@aimuzov/infra-site-kit/theme-peek.js'
	import { onMount } from 'svelte'

	import { theme, toggleScheme, watchTheme } from '#frontend/lib/theme.svelte.ts'

	type Props = {
		label: string
		/** Круг с другой темой. В выпадающем меню шапки он только мешает. */
		peek?: boolean
	}

	let { label, peek = true }: Props = $props()
	let mounted = $state(false)

	onMount(() => {
		watchTheme()
		mounted = true
	})

	const dark = $derived(mounted && theme.scheme === 'dark')
	const attach = (node: HTMLElement) => (peek ? themePeek(node) : undefined)
</script>

<!-- Переключатель как у VitePress: дорожка с бегунком, на бегунке солнце или луна. -->
<button
	class="theme-toggle"
	class:theme-toggle--dark={dark}
	type="button"
	role="switch"
	aria-label={label}
	aria-checked={dark}
	onclick={toggleScheme}
	{@attach attach}
>
	<span class="theme-toggle__thumb">
		{#if dark}
			<svg class="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
				<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
			</svg>
		{:else}
			<svg class="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
				<circle cx="12" cy="12" r="4"></circle>
				<path
					d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"
				></path>
			</svg>
		{/if}
	</span>
</button>

<style>
	.theme-toggle {
		position: relative;
		flex-shrink: 0;
		width: 40px;
		height: 22px;
		border: 1px solid var(--divider);
		background-color: var(--bg-soft);
		transition: border-color 0.25s;

		&:hover {
			border-color: var(--brand);
		}

		&__thumb {
			position: absolute;
			top: 1px;
			left: 1px;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 18px;
			height: 18px;
			color: var(--text-2);
			background-color: var(--bg);
			box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
			transition: transform 0.25s;
		}

		&--dark &__thumb {
			transform: translateX(18px);
		}

		&__icon {
			width: 12px;
			height: 12px;
			fill: none;
			stroke: currentcolor;
			stroke-linecap: round;
			stroke-width: 2;
		}
	}
</style>
