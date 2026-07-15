<script lang="ts">
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    question: string;
    options: readonly string[];
  }

  let { question, options }: Props = $props();
</script>

<form method="POST" class="workspace">
  <fieldset class="workspace__fieldset">
    <legend class="workspace__question">{question}</legend>

    <div class="workspace__options">
      {#each options as option, index (index)}
        <label class="workspace__option">
          <input
            type="radio"
            name="selectedOption"
            value={String(index)}
            class="workspace__radio"
            required
          />
          <span class="workspace__option-text">{option}</span>
        </label>
      {/each}
    </div>
  </fieldset>

  <div class="workspace__actions">
    <Button type="submit" variant="primary" size="lg">Submit →</Button>
  </div>
</form>

<style>
  .workspace {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .workspace__fieldset {
    border: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .workspace__question {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    text-wrap: balance;
    line-height: 1.4;
    padding: 0;
  }

  .workspace__options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .workspace__option {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-4);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    cursor: pointer;
    background-color: var(--surface-card);
    transition:
      border-color var(--transition-base),
      background-color var(--transition-base);
    min-block-size: 44px;
  }

  .workspace__option:hover {
    border-color: var(--color-primary-500);
    background-color: var(--color-primary-50);
  }

  @media (prefers-color-scheme: dark) {
    .workspace__option:hover {
      background-color: rgb(99 102 241 / 10%);
    }
  }

  .workspace__radio {
    flex-shrink: 0;
    margin-block-start: 2px;
    accent-color: var(--color-primary-600);
    inline-size: 18px;
    block-size: 18px;
    cursor: pointer;
  }

  .workspace__option-text {
    font-size: var(--text-base);
    color: var(--text-body);
    line-height: 1.5;
  }

  .workspace__actions {
    display: flex;
    gap: var(--space-4);
  }
</style>
