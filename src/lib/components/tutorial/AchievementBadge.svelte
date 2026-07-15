<script lang="ts">
  interface Props {
    name: string;
    description: string;
    earnedAt: string | null;
    variant: "earned" | "locked";
  }

  let { name, description, earnedAt, variant }: Props = $props();

  const isLocked = $derived(variant === "locked");

  const formattedDate = $derived(() => {
    if (!earnedAt) {
      return null;
    }
    try {
      return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(earnedAt));
    } catch {
      return null;
    }
  });
</script>

<div
  class="achievement-badge achievement-badge--{variant}"
  aria-label="Achievement: {name}{isLocked ? ', locked' : ''}"
>
  <div class="achievement-badge__icon" aria-hidden="true">
    {#if isLocked}
      🔒
    {:else}
      🏆
    {/if}
  </div>

  <div class="achievement-badge__body">
    <span class="achievement-badge__name">{name}</span>

    {#if !isLocked}
      <p class="achievement-badge__description">{description}</p>
    {/if}

    {#if formattedDate()}
      <time class="achievement-badge__date" datetime={earnedAt ?? ""}>{formattedDate()}</time>
    {:else if isLocked}
      <span class="achievement-badge__locked-label">Not yet earned</span>
    {/if}
  </div>
</div>

<style>
  .achievement-badge {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-4);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    background-color: var(--surface-card);
    transition: box-shadow var(--transition-base);
  }

  .achievement-badge--earned {
    background-color: var(--color-gold-100);
    border-color: var(--color-gold-600);
  }

  .achievement-badge--locked {
    opacity: 0.55;
  }

  .achievement-badge--earned:hover {
    box-shadow: var(--shadow-sm);
  }

  .achievement-badge__icon {
    font-size: 2rem;
    line-height: 1;
    flex-shrink: 0;
    block-size: 48px;
    inline-size: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .achievement-badge__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    flex: 1;
    min-inline-size: 0;
  }

  .achievement-badge__name {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
  }

  .achievement-badge__description {
    font-size: var(--text-xs);
    color: var(--text-body);
    line-height: 1.5;
  }

  .achievement-badge__date {
    font-size: var(--text-xs);
    color: var(--color-gold-600);
    font-weight: 500;
  }

  .achievement-badge__locked-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  @media (prefers-color-scheme: dark) {
    .achievement-badge--earned {
      background-color: rgb(217 119 6 / 15%);
      border-color: var(--color-gold-600);
    }
  }
</style>
