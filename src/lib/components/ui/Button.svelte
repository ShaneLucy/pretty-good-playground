<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		children: Snippet;
		[key: string]: unknown;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		children,
		...rest
	}: Props = $props();
</script>

<button {type} {disabled} class="btn btn--{variant} btn--{size}" {...rest}>
	{@render children()}
</button>
