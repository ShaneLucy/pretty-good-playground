<script lang="ts">
  interface Props {
    text: string;
    label?: string;
  }

  let { text, label }: Props = $props();

  let mounted = $derived(true);
  let copied = $state(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    } catch {
      /* clipboard API unavailable — user can select the text manually */
    }
  }
</script>

<div class="copy-block" aria-label={label}>
  <pre class="copy-block__content">{text}</pre>

  {#if mounted}
    <button
      class="copy-block__btn"
      onclick={copyToClipboard}
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
      aria-live="polite"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  {/if}
</div>

<style>
  .copy-block {
    position: relative;
    background-color: var(--color-gray-100);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  @media (prefers-color-scheme: dark) {
    .copy-block {
      background-color: #0d1117;
      border-color: #30363d;
    }
  }

  .copy-block__content {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
    padding: var(--space-4);
    padding-inline-end: var(--space-16);
    overflow-x: auto;
    color: var(--text-primary);
    white-space: pre;
  }

  .copy-block__btn {
    position: absolute;
    inset-block-start: var(--space-2);
    inset-inline-end: var(--space-2);
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
    background-color: var(--surface-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-body);
    cursor: pointer;
    transition:
      background-color var(--transition-base),
      color var(--transition-base);
    min-block-size: 32px;
  }

  .copy-block__btn:hover {
    background-color: var(--color-primary-50);
    color: var(--color-primary-600);
    border-color: var(--color-primary-600);
  }
</style>
