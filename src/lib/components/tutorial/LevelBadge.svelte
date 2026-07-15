<script lang="ts">
  interface Props {
    level: number;
    title: string;
    variant?: "compact" | "large";
  }

  let { level, title, variant = "compact" }: Props = $props();
</script>

<div class="level-badge level-badge--{variant}" aria-label="Level {level}: {title}">
  <span class="level-badge__number" aria-hidden="true">{level}</span>
  <span class="level-badge__title">{title}</span>
</div>

<style>
  .level-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    background-color: var(--color-primary-50);
    border: 1px solid var(--color-primary-100);
    border-radius: var(--radius-full);
    color: var(--color-primary-700);
    font-weight: 600;
  }

  .level-badge--compact {
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
    font-size: var(--text-xs);
  }

  .level-badge--large {
    padding-block: var(--space-2);
    padding-inline: var(--space-4);
    font-size: var(--text-base);
  }

  .level-badge__number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-primary-600);
    color: var(--color-white);
    border-radius: var(--radius-full);
    font-weight: 700;
    flex-shrink: 0;
  }

  .level-badge--compact .level-badge__number {
    block-size: 18px;
    inline-size: 18px;
    font-size: var(--text-xs);
  }

  .level-badge--large .level-badge__number {
    block-size: 32px;
    inline-size: 32px;
    font-size: var(--text-sm);
  }

  .level-badge__title {
    white-space: nowrap;
  }

  @media (prefers-color-scheme: dark) {
    .level-badge {
      background-color: rgb(99 102 241 / 15%);
      border-color: rgb(99 102 241 / 30%);
      color: var(--color-primary-600);
    }
  }
</style>
