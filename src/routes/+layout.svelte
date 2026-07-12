<script lang="ts">
  import "$lib/styles/app.css";
  import favicon from "$lib/assets/favicon.svg";
  import type { Snippet } from "svelte";
  import type { LayoutData } from "./$types";
  import AppHeader from "$lib/components/layout/AppHeader.svelte";
  import FlashBanner from "$lib/components/layout/FlashBanner.svelte";
  import Footer from "$lib/components/layout/Footer.svelte";
  import PageContainer from "$lib/components/layout/PageContainer.svelte";

  interface Props {
    data: LayoutData;
    children: Snippet;
  }

  let { data, children }: Props = $props();

  const headerVariant = $derived(data.user ? "authenticated" : "unauthenticated");
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<a href="#main-content" class="skip-link">Skip to main content</a>

<AppHeader variant={headerVariant} user={data.user} />
<FlashBanner flash={data.flash} />

<main id="main-content">
  <PageContainer>
    {@render children()}
  </PageContainer>
</main>

<Footer />

<style>
  .skip-link {
    position: absolute;
    inset-block-start: -100%;
    inset-inline-start: var(--space-4);
    z-index: 999;
    padding-block: var(--space-2);
    padding-inline: var(--space-4);
    background-color: var(--color-primary-600);
    color: #fff;
    font-weight: 600;
    font-size: var(--text-sm);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: inset-block-start var(--transition-base);
  }

  .skip-link:focus-visible {
    inset-block-start: var(--space-4);
  }

  main {
    min-block-size: calc(100dvh - 64px);
    padding-block: var(--space-8);
  }
</style>
