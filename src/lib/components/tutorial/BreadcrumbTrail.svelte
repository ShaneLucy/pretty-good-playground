<script lang="ts">
  import type { ResolvedPathname } from "$app/types";

  interface Crumb {
    label: string;
    href: ResolvedPathname | null;
  }

  interface Props {
    crumbs: Crumb[];
  }

  let { crumbs }: Props = $props();
</script>

<nav aria-label="Breadcrumb" class="breadcrumb">
  <ol class="breadcrumb__list">
    {#each crumbs as crumb, index (crumb.label)}
      {@const isLast = index === crumbs.length - 1}
      <li class="breadcrumb__item">
        {#if isLast || !crumb.href}
          <span class="breadcrumb__current" aria-current={isLast ? "page" : undefined}
            >{crumb.label}</span
          >
        {:else}
          <a href={crumb.href} class="breadcrumb__link">{crumb.label}</a>
        {/if}

        {#if !isLast}
          <span class="breadcrumb__separator" aria-hidden="true">›</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .breadcrumb {
    display: flex;
    align-items: center;
  }

  .breadcrumb__list {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-1);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .breadcrumb__item {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }

  .breadcrumb__link {
    font-size: var(--text-sm);
    color: var(--color-primary-600);
    text-decoration: none;
    font-weight: 500;
    transition: color var(--transition-base);
  }

  .breadcrumb__link:hover {
    text-decoration: underline;
  }

  .breadcrumb__current {
    font-size: var(--text-sm);
    color: var(--text-muted);
    font-weight: 400;
  }

  .breadcrumb__separator {
    font-size: var(--text-sm);
    color: var(--text-muted);
    line-height: 1;
  }
</style>
