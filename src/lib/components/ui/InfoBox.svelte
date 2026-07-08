<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'info' | 'warning' | 'success' | 'danger';
		children: Snippet;
	}

	let { variant = 'info', children }: Props = $props();
</script>

<div class="info-box info-box--{variant}">
	{@render children()}
</div>

<style>
	.info-box {
		padding: var(--space-4);
		border-radius: var(--radius-md);
		border-inline-start: 4px solid transparent;
		font-size: var(--text-sm);
		line-height: 1.6;
	}

	.info-box--info {
		background-color: var(--color-info-tint);
		border-color: var(--color-info);
		color: #075985;
	}

	.info-box--warning {
		background-color: var(--color-warning-tint);
		border-color: var(--color-warning);
		color: #92400e;
	}

	.info-box--success {
		background-color: var(--color-success-tint);
		border-color: var(--color-success);
		color: #065f46;
	}

	.info-box--danger {
		background-color: var(--color-error-tint);
		border-color: var(--color-error);
		color: #991b1b;
	}

	@media (prefers-color-scheme: dark) {
		.info-box--info {
			color: #7dd3fc;
		}

		.info-box--warning {
			color: #fcd34d;
		}

		.info-box--success {
			color: #6ee7b7;
		}

		.info-box--danger {
			color: #fca5a5;
		}
	}
</style>
