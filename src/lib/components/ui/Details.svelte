<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		summary: string;
		open?: boolean;
		children: Snippet;
	}

	let { summary, open = false, children }: Props = $props();
</script>

<details {open} class="details">
	<summary class="details__summary">{summary}</summary>
	<div class="details__content">
		{@render children()}
	</div>
</details>

<style>
	.details {
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.details__summary {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-4);
		font-weight: 500;
		color: var(--text-primary);
		cursor: pointer;
		list-style: none;
		user-select: none;
		transition: background-color var(--transition-base);
	}

	.details__summary::before {
		content: '';
		display: inline-block;
		inline-size: 0;
		block-size: 0;
		border-block-start: 5px solid transparent;
		border-block-end: 5px solid transparent;
		border-inline-start: 8px solid var(--text-muted);
		transition: transform var(--transition-base);
		flex-shrink: 0;
	}

	.details[open] .details__summary::before {
		transform: rotate(90deg);
	}

	.details__summary::-webkit-details-marker {
		display: none;
	}

	.details__summary:hover {
		background-color: var(--color-gray-50);
	}

	@media (prefers-color-scheme: dark) {
		.details__summary:hover {
			background-color: rgba(255, 255, 255, 0.05);
		}
	}

	.details__content {
		padding: var(--space-4);
		border-block-start: 1px solid var(--border-color);
		font-size: var(--text-sm);
		line-height: 1.6;
		color: var(--text-body);
	}

	@media (prefers-reduced-motion: no-preference) {
		.details[open] .details__content {
			animation: details-open 150ms ease-out;
		}

		@keyframes details-open {
			from {
				opacity: 0;
				transform: translateY(-4px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
</style>
