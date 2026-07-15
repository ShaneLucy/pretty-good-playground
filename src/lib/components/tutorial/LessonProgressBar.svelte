<script lang="ts">
  interface Props {
    total: number;
    completed: number;
  }

  let { total, completed }: Props = $props();

  const segments = $derived(
    Array.from({ length: total }, (_, index) => ({
      filled: index < completed
    }))
  );
</script>

<div class="lesson-progress" role="img" aria-label="{completed} of {total} challenges completed">
  <div class="lesson-progress__track">
    {#each segments as segment, index (index)}
      <div
        class="lesson-progress__segment"
        class:lesson-progress__segment--filled={segment.filled}
        aria-hidden="true"
        title="Challenge {index + 1}: {segment.filled ? 'completed' : 'not yet completed'}"
      ></div>
    {/each}
  </div>
  <span class="lesson-progress__label">{completed}/{total}</span>
</div>

<style>
  .lesson-progress {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .lesson-progress__track {
    display: flex;
    gap: 3px;
    flex: 1;
  }

  .lesson-progress__segment {
    flex: 1;
    block-size: 8px;
    border-radius: var(--radius-full);
    background-color: var(--color-gray-300);
    transition: background-color var(--transition-base);
  }

  .lesson-progress__segment--filled {
    background-color: var(--color-primary-600);
  }

  .lesson-progress__label {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-muted);
    white-space: nowrap;
    min-inline-size: 3ch;
    text-align: end;
  }

  @media (prefers-reduced-motion: reduce) {
    .lesson-progress__segment {
      transition: none;
    }
  }
</style>
