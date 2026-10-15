<!-- Метки на видимых ссылках, как прыжки flash.nvim: набранная часть гаснет,
оставшаяся ведёт к переходу. -->
<script lang="ts">
	import type { Hint } from '#frontend/lib/vim-state.svelte.ts'

	let { items, typed }: { items: Hint[]; typed: string } = $props()
</script>

<div class="vim-hints" aria-hidden="true">
	{#each items as item (item.label)}
		{#if item.label.startsWith(typed)}
			<span class="vim-hints__hint" style:top="{item.top}px" style:left="{item.left}px"
				><span class="vim-hints__done">{typed}</span>{item.label.slice(typed.length)}</span
			>
		{/if}
	{/each}
</div>

<style>
	/* Слой прибит к вьюпорту, поэтому координаты меток -- те самые,
	   что вернул getBoundingClientRect. */
	.vim-hints {
		pointer-events: none;
		position: fixed;
		z-index: 100;
		inset: 0;

		&__hint {
			position: absolute;
			transform: translate(-2px, -1px);
			padding: 0 4px;
			font-size: 11px;
			font-weight: 700;
			line-height: 17px;
			color: var(--mode-fg);
			letter-spacing: 0.06em;
			background: var(--mode-command);
			box-shadow: 0 1px 5px rgb(0 0 0 / 40%);
		}

		/* Набранное гаснет, дотянуть остаётся яркое. */
		&__done {
			opacity: 0.4;
		}
	}
</style>
