<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'wide' | 'default' | 'narrow';
		children: Snippet;
	}

	let { variant = 'default', children }: Props = $props();
</script>

<div class="page-container page-container--{variant}">
	{@render children()}
</div>

<style>
	.page-container {
		margin-inline: auto;
		padding-inline: var(--space-4);
		inline-size: 100%;
	}

	@media (width >= 640px) {
		.page-container {
			padding-inline: var(--space-6);
		}
	}

	.page-container--wide {
		max-inline-size: 1200px;
	}

	.page-container--default {
		max-inline-size: 800px;
	}

	.page-container--narrow {
		max-inline-size: 640px;
	}
</style>
