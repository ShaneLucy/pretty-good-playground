<script lang="ts">
	interface Props {
		value: number;
		max: number;
		label: string;
		variant?: 'xp' | 'lesson' | 'chapter';
	}

	let { value, max, label, variant = 'xp' }: Props = $props();

	const pct = $derived(Math.round((value / max) * 100));
</script>

<div class="progress-wrapper">
	<progress
		class="progress-bar progress-bar--{variant}"
		{value}
		{max}
		aria-label="{label} — {pct}%"
	>
		{pct}%
	</progress>
</div>

<style>
	.progress-wrapper {
		inline-size: 100%;
	}

	.progress-bar {
		display: block;
		inline-size: 100%;
		block-size: 8px;
		appearance: none;
		-webkit-appearance: none;
		border: none;
		border-radius: var(--radius-full);
		background-color: var(--color-gray-100);
		overflow: hidden;
	}

	.progress-bar::-webkit-progress-bar {
		background-color: var(--color-gray-100);
		border-radius: var(--radius-full);
	}

	.progress-bar--xp::-webkit-progress-value {
		background-color: var(--color-gold-500);
		border-radius: var(--radius-full);
		transition: inline-size var(--transition-base);
	}

	.progress-bar--xp::-moz-progress-bar {
		background-color: var(--color-gold-500);
		border-radius: var(--radius-full);
	}

	:is(.progress-bar--lesson, .progress-bar--chapter)::-webkit-progress-value {
		background-color: var(--color-primary-600);
		border-radius: var(--radius-full);
		transition: inline-size var(--transition-base);
	}

	:is(.progress-bar--lesson, .progress-bar--chapter)::-moz-progress-bar {
		background-color: var(--color-primary-600);
		border-radius: var(--radius-full);
	}

	@media (prefers-reduced-motion: reduce) {
		.progress-bar::-webkit-progress-value {
			transition: none;
		}
	}
</style>
