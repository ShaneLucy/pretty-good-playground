<script lang="ts">
  interface Props {
    steps: string[];
    currentStep: number;
  }

  let { steps, currentStep }: Props = $props();
</script>

<nav aria-label="Progress steps" class="step-indicator">
  <ol class="step-indicator__list">
    {#each steps as step, index (index)}
      {@const isCompleted = index < currentStep}
      {@const isCurrent = index === currentStep}
      {@const stepNumber = index + 1}
      <li
        class="step-indicator__item"
        class:step-indicator__item--completed={isCompleted}
        class:step-indicator__item--current={isCurrent}
        aria-current={isCurrent ? "step" : undefined}
      >
        <div class="step-indicator__marker" aria-hidden="true">
          {#if isCompleted}
            ✓
          {:else}
            {stepNumber}
          {/if}
        </div>
        <span class="step-indicator__label">{step}</span>
        {#if index < steps.length - 1}
          <div class="step-indicator__connector" aria-hidden="true"></div>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .step-indicator__list {
    display: flex;
    align-items: flex-start;
    gap: 0;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .step-indicator__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    position: relative;
    flex: 1;
  }

  .step-indicator__marker {
    display: flex;
    align-items: center;
    justify-content: center;
    block-size: 32px;
    inline-size: 32px;
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 700;
    background-color: var(--color-gray-300);
    color: var(--color-gray-500);
    border: 2px solid var(--color-gray-300);
    transition:
      background-color var(--transition-base),
      border-color var(--transition-base),
      color var(--transition-base);
    position: relative;
    z-index: 1;
  }

  .step-indicator__item--completed .step-indicator__marker {
    background-color: var(--color-success);
    border-color: var(--color-success);
    color: white;
  }

  .step-indicator__item--current .step-indicator__marker {
    background-color: var(--color-primary-600);
    border-color: var(--color-primary-600);
    color: white;
  }

  .step-indicator__label {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-muted);
    text-align: center;
    line-height: 1.3;
  }

  .step-indicator__item--current .step-indicator__label {
    color: var(--color-primary-600);
    font-weight: 600;
  }

  .step-indicator__item--completed .step-indicator__label {
    color: var(--color-success);
  }

  .step-indicator__connector {
    position: absolute;
    inset-block-start: 16px;
    inset-inline-start: calc(50% + 16px);
    inline-size: calc(100% - 32px);
    block-size: 2px;
    background-color: var(--color-gray-300);
    z-index: 0;
  }

  .step-indicator__item--completed .step-indicator__connector {
    background-color: var(--color-success);
  }

  @media (prefers-reduced-motion: reduce) {
    .step-indicator__marker {
      transition: none;
    }
  }
</style>
