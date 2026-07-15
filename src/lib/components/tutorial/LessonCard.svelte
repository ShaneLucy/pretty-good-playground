<script lang="ts">
  import type { ResolvedPathname } from "$app/types";

  interface Lesson {
    title: string;
    challengeCount: number;
  }

  interface Props {
    lesson: Lesson;
    status: "locked" | "in-progress" | "completed";
    href: ResolvedPathname;
  }

  let { lesson, status, href }: Props = $props();

  const isLocked = $derived(status === "locked");
  const isCompleted = $derived(status === "completed");
</script>

<article class="lesson-card lesson-card--{status}">
  <div class="lesson-card__body">
    <div class="lesson-card__meta">
      <span class="lesson-card__count">{lesson.challengeCount} challenges</span>
      {#if isCompleted}
        <span class="lesson-card__status-icon" aria-label="Completed">✓</span>
      {:else if isLocked}
        <span class="lesson-card__status-icon" aria-label="Locked">🔒</span>
      {/if}
    </div>

    {#if isLocked}
      <h3 class="lesson-card__title">{lesson.title}</h3>
    {:else}
      <a {href} class="lesson-card__link">
        <h3 class="lesson-card__title">{lesson.title}</h3>
      </a>
    {/if}
  </div>

  {#if !isLocked}
    <div class="lesson-card__chevron" aria-hidden="true">›</div>
  {/if}
</article>

<style>
  .lesson-card {
    background-color: var(--surface-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    padding-block: var(--space-4);
    padding-inline: var(--space-6);
    display: flex;
    align-items: center;
    gap: var(--space-4);
    transition:
      box-shadow var(--transition-base),
      border-color var(--transition-base);
  }

  .lesson-card--locked {
    opacity: 0.55;
  }

  .lesson-card--completed {
    border-color: var(--color-success);
  }

  .lesson-card--in-progress {
    border-color: var(--color-primary-500);
  }

  .lesson-card:not(.lesson-card--locked):hover {
    box-shadow: var(--shadow-sm);
    border-color: var(--color-primary-500);
  }

  .lesson-card__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .lesson-card__meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .lesson-card__count {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .lesson-card__status-icon {
    font-size: var(--text-sm);
    line-height: 1;
    color: var(--color-success);
  }

  .lesson-card__link {
    text-decoration: none;
    color: inherit;
  }

  .lesson-card__title {
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    transition: color var(--transition-base);
  }

  .lesson-card__link:hover .lesson-card__title {
    color: var(--color-primary-600);
  }

  .lesson-card__chevron {
    font-size: var(--text-xl);
    color: var(--text-muted);
    flex-shrink: 0;
    line-height: 1;
  }
</style>
