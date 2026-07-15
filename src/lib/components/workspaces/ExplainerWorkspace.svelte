<script lang="ts">
  import type { Snippet } from "svelte";
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
</script>

<form method="POST" class="workspace">
  {#if children}
    <div class="workspace__content">
      {@render children()}
    </div>
  {/if}

  <div class="workspace__actions">
    <Button type="submit" variant="primary" size="lg">Mark as complete →</Button>
  </div>
</form>

<style>
  .workspace {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .workspace__content {
    font-size: var(--text-base);
    color: var(--text-body);
    line-height: 1.6;
  }

  .workspace__actions {
    display: flex;
    gap: var(--space-4);
  }
</style>
