<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		variant: 'unauthenticated' | 'authenticated' | 'minimal';
		user?: { displayName: string; fingerprint: string } | null;
	}

	let { variant, user = null }: Props = $props();
</script>

<header class="app-header">
	<div class="app-header__inner">
		<a href={resolve('/')} class="app-header__logo" aria-label="Pretty Good Playground — home">
			<span class="app-header__logo-text">PGP Playground</span>
		</a>

		{#if variant === 'unauthenticated'}
			<nav aria-label="Main navigation" class="app-header__nav">
				<a href={resolve('/about')} class="nav-link">About</a>
				<a href={resolve('/resources')} class="nav-link">Resources</a>
				<a href={resolve('/register')} class="btn btn--primary btn--sm">Get Started →</a>
			</nav>
		{:else if variant === 'authenticated'}
			<nav aria-label="Main navigation" class="app-header__nav">
				<a href={resolve('/dashboard')} class="nav-link">Dashboard</a>
				<a href={resolve('/profile')} class="nav-link">
					{#if user}
						<span class="nav-link__user">{user.displayName}</span>
					{:else}
						Profile
					{/if}
				</a>
				<a href={resolve('/keys')} class="nav-link">Keys</a>
				<a href={resolve('/about')} class="nav-link">About</a>
				<a href={resolve('/logout')} class="btn btn--ghost btn--sm">Sign Out</a>
			</nav>
		{/if}
	</div>
</header>

<style>
	.app-header {
		position: sticky;
		inset-block-start: 0;
		z-index: 100;
		background-color: var(--surface-card);
		border-block-end: 1px solid var(--border-color);
		box-shadow: var(--shadow-sm);
	}

	.app-header__inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-inline-size: 1200px;
		margin-inline: auto;
		padding-inline: var(--space-6);
		block-size: 64px;
		gap: var(--space-4);
	}

	.app-header__logo {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		text-decoration: none;
		color: var(--text-primary);
		font-family: var(--font-display);
		font-weight: 700;
		font-size: var(--text-lg);
		flex-shrink: 0;
	}

	.app-header__logo:hover {
		color: var(--color-primary-600);
	}

	.app-header__nav {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.nav-link {
		display: inline-flex;
		align-items: center;
		padding-block: var(--space-2);
		padding-inline: var(--space-4);
		border-radius: var(--radius-md);
		font-size: var(--text-sm);
		font-weight: 500;
		color: var(--text-body);
		text-decoration: none;
		transition:
			background-color var(--transition-base),
			color var(--transition-base);
		min-block-size: 44px;
	}

	.nav-link:hover {
		background-color: var(--color-gray-100);
		color: var(--text-primary);
	}

	@media (prefers-color-scheme: dark) {
		.nav-link:hover {
			background-color: rgb(255 255 255 / 8%);
		}
	}

	.nav-link__user {
		max-inline-size: 120px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (width <= 767px) {
		.app-header__nav .nav-link:not(.btn) {
			display: none;
		}
	}
</style>
