<script lang="ts">
  const SHORT_CHAR_COUNT = 8;

  interface Props {
    fingerprint: string;
    variant?: "full" | "short" | "large";
  }

  let { fingerprint, variant = "full" }: Props = $props();

  const displayValue = $derived(
    variant === "short" ? fingerprint.slice(-SHORT_CHAR_COUNT) : fingerprint
  );

  const formattedDisplay = $derived(
    displayValue
      .toUpperCase()
      .replace(/(.{4})/g, "$1 ")
      .trim()
  );
</script>

<span class="fingerprint fingerprint--{variant}" aria-label="PGP fingerprint: {formattedDisplay}">
  <code class="fingerprint__code">{formattedDisplay}</code>
  {#if variant === "short"}
    <span class="sr-only">(last 8 characters)</span>
  {/if}
</span>

<style>
  .fingerprint {
    display: inline-flex;
    align-items: center;
  }

  .fingerprint__code {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    letter-spacing: 0.05em;
    color: var(--text-primary);
    background-color: var(--color-gray-100);
    padding-block: var(--space-1);
    padding-inline: var(--space-2);
    border-radius: var(--radius-sm);
  }

  .fingerprint--large .fingerprint__code {
    font-size: var(--text-lg);
    padding-block: var(--space-2);
    padding-inline: var(--space-4);
    letter-spacing: 0.08em;
  }

  .fingerprint--short .fingerprint__code {
    font-size: var(--text-sm);
  }

  @media (prefers-color-scheme: dark) {
    .fingerprint__code {
      background-color: rgb(255 255 255 / 8%);
    }
  }
</style>
