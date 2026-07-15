<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<div class="learn-layout">
  {@render children()}
</div>

<style>
  .learn-layout {
    min-block-size: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
  }
</style>
