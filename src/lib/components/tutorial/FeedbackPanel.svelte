<script lang="ts">
  import type { ResolvedPathname } from "$app/types";

  interface Props {
    result: "correct" | "incorrect" | null;
    message: string;
    xpAwarded: number;
    nextHref: ResolvedPathname | null;
  }

  let { result, message, xpAwarded, nextHref }: Props = $props();

  const isCorrect = $derived(result === "correct");
  const isVisible = $derived(result !== null);
</script>

{#if isVisible}
  <div
    class="feedback-panel feedback-panel--{result}"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <div class="feedback-panel__icon" aria-hidden="true">
      {isCorrect ? "✓" : "✗"}
    </div>

    <div class="feedback-panel__body">
      <p class="feedback-panel__message">{message}</p>

      {#if isCorrect && xpAwarded > 0}
        <p class="feedback-panel__xp">+{xpAwarded} XP</p>
      {/if}

      {#if isCorrect && nextHref}
        <a href={nextHref} class="btn btn--primary btn--sm feedback-panel__next"> Next → </a>
      {/if}
    </div>
  </div>
{/if}

<style>
  .feedback-panel {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-4);
    border-radius: var(--radius-md);
    border-inline-start: 4px solid transparent;
  }

  .feedback-panel--correct {
    background-color: var(--color-success-tint);
    border-color: var(--color-success);
    color: #065f46;
  }

  .feedback-panel--incorrect {
    background-color: var(--color-error-tint);
    border-color: var(--color-error);
    color: #991b1b;
  }

  .feedback-panel__icon {
    font-size: var(--text-xl);
    font-weight: 700;
    line-height: 1;
    flex-shrink: 0;
    block-size: 32px;
    inline-size: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    background-color: currentcolor;
    color: white;
  }

  .feedback-panel--correct .feedback-panel__icon {
    background-color: var(--color-success);
  }

  .feedback-panel--incorrect .feedback-panel__icon {
    background-color: var(--color-error);
  }

  .feedback-panel__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
  }

  .feedback-panel__message {
    font-size: var(--text-sm);
    line-height: 1.6;
  }

  .feedback-panel__xp {
    font-size: var(--text-sm);
    font-weight: 700;
    color: var(--color-gold-600);
  }

  .feedback-panel__next {
    align-self: flex-start;
    margin-block-start: var(--space-2);
  }

  @media (prefers-color-scheme: dark) {
    .feedback-panel--correct {
      color: #6ee7b7;
    }

    .feedback-panel--incorrect {
      color: #fca5a5;
    }
  }
</style>
