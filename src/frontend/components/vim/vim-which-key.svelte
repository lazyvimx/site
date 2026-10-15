<!-- Панель which-key над статуслайном: продолжения набранной последовательности,
а по "?" -- вся раскладка сразу. -->
<script lang="ts">
	import type { Panel } from '#frontend/lib/vim-state.svelte.ts'

	let { panel }: { panel: Panel } = $props()
</script>

<div class="which-key" aria-hidden="true">
	<div class="which-key__head">{panel.title}</div>
	<!-- Заголовок группы занимает всю строку сетки, пункты текут колонками под ним. -->
	<div class="which-key__groups">
		{#each panel.groups as group, index (index)}
			{#if group.title}
				<div class="which-key__title">{group.title}</div>
			{/if}
			{#each group.items as item (item.seq)}
				<div class="which-key__row">
					<span class="which-key__seq">{item.seq}</span>
					<span class="which-key__arrow">→</span>
					<span class="which-key__text">{item.text}</span>
				</div>
			{/each}
		{/each}
	</div>
</div>

<style>
	.which-key {
		position: fixed;
		z-index: 59;
		right: 0;
		bottom: var(--statusline-height);
		left: 0;
		overflow-y: auto;
		max-height: 60vh;
		padding: 12px 24px 16px;
		border-top: 1px solid var(--divider);
		font-size: 12px;
		background: var(--panel-bg);

		&__head {
			margin-bottom: 10px;
			font-weight: 700;
			color: var(--vim-accent);
		}

		&__groups {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
			gap: 2px 24px;
		}

		&__title {
			grid-column: 1 / -1;
			margin: 10px 0 2px;
			color: var(--vim-dim);

			&:first-child {
				margin-top: 0;
			}
		}

		&__row {
			display: flex;
			gap: 8px;
			line-height: 22px;
			white-space: nowrap;
		}

		&__seq {
			flex: none;
			min-width: 84px;
			font-weight: 700;
			color: var(--vim-accent);
		}

		&__arrow {
			flex: none;
			color: var(--vim-dim);
		}

		&__text {
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}
</style>
