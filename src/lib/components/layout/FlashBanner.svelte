<script lang="ts">
	import type { FlashMessage } from '$lib/shared/types';

	interface Props {
		flash: FlashMessage | null;
	}

	let { flash }: Props = $props();

	let visible = $state(true);

	$effect(() => {
		if (flash) {
			visible = true;
			const timer = setTimeout(() => {
				visible = false;
			}, 4000);
			return () => clearTimeout(timer);
		}
	});
</script>

{#if flash && visible}
	<div
		class="flash-banner flash-banner--{flash.type}"
		role={flash.type === 'error' ? 'alert' : 'status'}
		aria-live={flash.type === 'error' ? 'assertive' : 'polite'}
	>
		<div class="flash-banner__inner">
			<p class="flash-banner__message">{flash.message}</p>
		</div>
	</div>
{/if}

<style>
	.flash-banner {
		inline-size: 100%;
	}

	.flash-banner__inner {
		max-inline-size: 1200px;
		margin-inline: auto;
		padding-block: var(--space-2);
		padding-inline: var(--space-6);
	}

	.flash-banner__message {
		font-size: var(--text-sm);
		font-weight: 500;
	}

	.flash-banner--success {
		background-color: var(--color-success-tint);
		color: #065f46;
		border-block-end: 1px solid var(--color-success);
	}

	.flash-banner--error {
		background-color: var(--color-error-tint);
		color: #991b1b;
		border-block-end: 1px solid var(--color-error);
	}

	.flash-banner--warning {
		background-color: var(--color-warning-tint);
		color: #92400e;
		border-block-end: 1px solid var(--color-warning);
	}

	.flash-banner--info {
		background-color: var(--color-info-tint);
		color: #075985;
		border-block-end: 1px solid var(--color-info);
	}

	@media (prefers-color-scheme: dark) {
		.flash-banner--success { color: #6ee7b7; }
		.flash-banner--error { color: #fca5a5; }
		.flash-banner--warning { color: #fcd34d; }
		.flash-banner--info { color: #7dd3fc; }
	}
</style>
