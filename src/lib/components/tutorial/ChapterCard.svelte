<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import ProgressBar from "$lib/components/ui/ProgressBar.svelte";

  interface Chapter {
    title: string;
    description: string;
    lessonCount: number;
  }

  interface Props {
    chapter: Chapter;
    status: "locked" | "in-progress" | "completed";
    percentComplete: number;
    href: ResolvedPathname;
  }

  let { chapter, status, percentComplete, href }: Props = $props();

  const isLocked = $derived(status === "locked");
  const isCompleted = $derived(status === "completed");
</script>

<article class="chapter-card chapter-card--{status}" aria-label="Chapter: {chapter.title}">
  <div class="chapter-card__header">
    <div class="chapter-card__meta">
      <span class="chapter-card__count">{chapter.lessonCount} lessons</span>
      {#if isCompleted}
        <span class="chapter-card__icon chapter-card__icon--completed" aria-label="Completed">
          ✓
        </span>
      {:else if isLocked}
        <span class="chapter-card__icon chapter-card__icon--locked" aria-label="Locked"> 🔒 </span>
      {/if}
    </div>

    {#if isLocked}
      <h2 class="chapter-card__title">{chapter.title}</h2>
    {:else}
      <a {href} class="chapter-card__title-link">
        <h2 class="chapter-card__title">{chapter.title}</h2>
      </a>
    {/if}
  </div>

  <p class="chapter-card__description">{chapter.description}</p>

  <div class="chapter-card__footer">
    <ProgressBar
      value={percentComplete}
      max={100}
      label="{chapter.title} progress"
      variant="chapter"
    />
    <span class="chapter-card__pct">{percentComplete}%</span>
  </div>
</article>

<style>
  .chapter-card {
    background-color: var(--surface-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    box-shadow: var(--shadow-sm);
    transition: box-shadow var(--transition-base);
  }

  .chapter-card--locked {
    opacity: 0.6;
  }

  .chapter-card--in-progress {
    border-color: var(--color-primary-500);
  }

  .chapter-card--completed {
    border-color: var(--color-success);
  }

  .chapter-card:not(.chapter-card--locked):hover {
    box-shadow: var(--shadow-md);
  }

  .chapter-card__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .chapter-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .chapter-card__count {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chapter-card__icon {
    font-size: var(--text-base);
    line-height: 1;
  }

  .chapter-card__icon--completed {
    color: var(--color-success);
    font-style: normal;
  }

  .chapter-card__title-link {
    text-decoration: none;
    color: inherit;
  }

  .chapter-card__title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    text-wrap: balance;
    transition: color var(--transition-base);
  }

  .chapter-card__title-link:hover .chapter-card__title {
    color: var(--color-primary-600);
  }

  .chapter-card__description {
    font-size: var(--text-sm);
    color: var(--text-body);
    line-height: 1.6;
    flex: 1;
  }

  .chapter-card__footer {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .chapter-card__pct {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-muted);
    white-space: nowrap;
    min-inline-size: 3ch;
    text-align: end;
  }
</style>
