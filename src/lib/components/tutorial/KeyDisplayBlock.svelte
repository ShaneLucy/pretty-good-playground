<script lang="ts">
  import type { ResolvedPathname } from "$app/types";

  interface Props {
    armoredKey: string;
    downloadHref: ResolvedPathname;
    fingerprint: string;
  }

  let { armoredKey, downloadHref, fingerprint }: Props = $props();
</script>

<div class="key-display-block">
  <details class="key-display-block__details">
    <summary class="key-display-block__summary">
      <span>Show public key</span>
      <span class="key-display-block__fingerprint">{fingerprint.slice(-8).toUpperCase()}</span>
    </summary>

    <div class="key-display-block__content">
      <pre class="key-display-block__pre"><code>{armoredKey}</code></pre>

      <div class="key-display-block__actions">
        <a
          href={downloadHref}
          download
          class="btn btn--secondary btn--sm"
          aria-label="Download public key as .asc file"
        >
          Download .asc
        </a>
      </div>
    </div>
  </details>
</div>

<style>
  .key-display-block {
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    overflow: hidden;
    background-color: var(--surface-card);
  }

  .key-display-block__details {
    inline-size: 100%;
  }

  .key-display-block__summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
    cursor: pointer;
    list-style: none;
    user-select: none;
    transition: background-color var(--transition-base);
  }

  .key-display-block__summary::-webkit-details-marker {
    display: none;
  }

  .key-display-block__summary::before {
    content: "";
    display: inline-block;
    inline-size: 0;
    block-size: 0;
    border-block-start: 5px solid transparent;
    border-block-end: 5px solid transparent;
    border-inline-start: 8px solid var(--text-muted);
    transition: transform var(--transition-base);
    flex-shrink: 0;
  }

  .key-display-block__details[open] .key-display-block__summary::before {
    transform: rotate(90deg);
  }

  .key-display-block__summary:hover {
    background-color: var(--color-gray-50);
  }

  @media (prefers-color-scheme: dark) {
    .key-display-block__summary:hover {
      background-color: rgb(255 255 255 / 5%);
    }
  }

  .key-display-block__fingerprint {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    letter-spacing: 0.05em;
    margin-inline-start: auto;
  }

  .key-display-block__content {
    border-block-start: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4);
    background-color: var(--color-gray-100);
  }

  @media (prefers-color-scheme: dark) {
    .key-display-block__content {
      background-color: #0d1117;
    }
  }

  .key-display-block__pre {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
    overflow-x: auto;
    white-space: pre;
    color: var(--text-primary);
  }

  .key-display-block__pre code {
    font-size: inherit;
    background: none;
    padding: 0;
  }

  .key-display-block__actions {
    display: flex;
    gap: var(--space-2);
  }

  @media (prefers-reduced-motion: no-preference) {
    .key-display-block__details[open] .key-display-block__content {
      animation: key-block-open 150ms ease-out;
    }

    @keyframes key-block-open {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  }
</style>
