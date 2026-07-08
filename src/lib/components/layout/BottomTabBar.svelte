<script lang="ts">
  import { resolve } from "$app/paths";

  interface Props {
    currentPath: string;
  }

  let { currentPath }: Props = $props();

  const tabs = [
    { href: resolve("/dashboard"), label: "Dashboard" },
    { href: resolve("/profile"), label: "Profile" },
    { href: resolve("/keys"), label: "Keys" },
    { href: resolve("/about"), label: "About" }
  ];
</script>

<nav aria-label="Mobile navigation" class="bottom-tab-bar">
  {#each tabs as tab (tab.href)}
    <a
      href={tab.href}
      class="bottom-tab-bar__tab"
      aria-current={currentPath === tab.href ? "page" : undefined}
    >
      <span class="bottom-tab-bar__label">{tab.label}</span>
    </a>
  {/each}
</nav>

<style>
  .bottom-tab-bar {
    display: flex;
    position: fixed;
    inset-block-end: 0;
    inset-inline: 0;
    z-index: 200;
    background-color: var(--surface-card);
    border-block-start: 1px solid var(--border-color);
    box-shadow: 0 -2px 8px rgb(0 0 0 / 8%);
    padding-block-end: env(safe-area-inset-bottom, 0);
  }

  @media (width >= 768px) {
    .bottom-tab-bar {
      display: none;
    }
  }

  .bottom-tab-bar__tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-block: var(--space-2);
    min-block-size: 44px;
    text-decoration: none;
    color: var(--text-muted);
    font-size: var(--text-xs);
    font-weight: 500;
    transition:
      color var(--transition-base),
      background-color var(--transition-base);
    -webkit-tap-highlight-color: transparent;
  }

  .bottom-tab-bar__tab:hover {
    color: var(--color-primary-600);
    background-color: var(--color-primary-50);
  }

  .bottom-tab-bar__tab[aria-current="page"] {
    color: var(--color-primary-600);
  }

  @media (prefers-color-scheme: dark) {
    .bottom-tab-bar__tab:hover {
      background-color: rgb(129 140 248 / 10%);
    }
  }
</style>
