<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<footer class="site-footer">
	<div class="site-footer__inner">
		<p class="site-footer__brand">
			<a href={resolve('/')} class="site-footer__logo">PGP Playground</a>
		</p>

		<nav aria-label="Footer navigation" class="site-footer__nav">
			<a href={resolve('/about')}>About</a>
			<a href="https://github.com" rel="noopener noreferrer">
				GitHub
				<span class="sr-only">(opens in a new tab)</span>
			</a>
			<a href={resolve('/resources')}>Resources</a>
			<a href={resolve('/lost-my-key')}>Lost your key?</a>
		</nav>

		<p class="site-footer__privacy">
			No cookies except your session. No analytics. No third-party requests.
		</p>
	</div>
</footer>

<style>
	.site-footer {
		border-block-start: 1px solid var(--border-color);
		background-color: var(--surface-card);
		padding-block-end: var(--space-24);
	}

	@media (width >= 768px) {
		.site-footer {
			padding-block-end: var(--space-12);
		}
	}

	.site-footer__inner {
		max-inline-size: 1200px;
		margin-inline: auto;
		padding-block: var(--space-8);
		padding-inline: var(--space-6);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		text-align: center;
	}

	@media (width >= 640px) {
		.site-footer__inner {
			flex-direction: row;
			justify-content: space-between;
			text-align: start;
		}
	}

	.site-footer__logo {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: var(--text-sm);
		color: var(--text-primary);
		text-decoration: none;
	}

	.site-footer__logo:hover {
		color: var(--color-primary-600);
	}

	.site-footer__nav {
		display: flex;
		align-items: center;
		gap: var(--space-6);
		flex-wrap: wrap;
		justify-content: center;
	}

	.site-footer__nav a {
		font-size: var(--text-sm);
		color: var(--text-muted);
		text-decoration: none;
		transition: color var(--transition-base);
	}

	.site-footer__nav a:hover {
		color: var(--color-primary-600);
	}

	.site-footer__privacy {
		font-size: var(--text-xs);
		color: var(--text-muted);
		max-inline-size: 360px;
	}
</style>
