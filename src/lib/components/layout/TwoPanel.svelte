<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    left: Snippet;
    right: Snippet;
  }

  let { left, right }: Props = $props();
</script>

<div class="two-panel">
  <nav class="two-panel__tabs" aria-label="Lesson panels">
    <a href="#instruction" class="two-panel__tab">Learn</a>
    <a href="#workspace" class="two-panel__tab">Do</a>
  </nav>

  <div class="two-panel__layout">
    <section
      id="instruction"
      class="two-panel__pane two-panel__pane--left"
      aria-label="Instruction panel"
    >
      {@render left()}
    </section>

    <section
      id="workspace"
      class="two-panel__pane two-panel__pane--right"
      aria-label="Workspace panel"
    >
      {@render right()}
    </section>
  </div>
</div>

<style>
  .two-panel__tabs {
    display: none;
  }

  .two-panel__layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    min-block-size: 0;
  }

  .two-panel__pane {
    overflow-y: auto;
    padding: var(--space-6);
  }

  .two-panel__pane--left {
    border-inline-end: 1px solid var(--border-color);
  }

  @media (width <= 768px) {
    .two-panel__tabs {
      display: flex;
      border-block-end: 1px solid var(--border-color);
      background-color: var(--surface-card);
    }

    .two-panel__tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-block: var(--space-4);
      padding-inline: var(--space-4);
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      border-block-end: 2px solid transparent;
      transition:
        color var(--transition-base),
        border-color var(--transition-base);
      min-block-size: 44px;
    }

    .two-panel__tab:hover {
      color: var(--color-primary-600);
      border-color: var(--color-primary-100);
    }

    .two-panel__layout {
      grid-template-columns: 1fr;
    }

    .two-panel__pane--left {
      border-inline-end: none;
    }

    /* Default: show instruction, hide workspace */
    #workspace {
      display: none;
    }

    /* Show workspace when it is the :target */
    #workspace:target {
      display: block;
    }

    #instruction:target {
      display: block;
    }

    /* Show instruction when neither panel is targeted */
    #instruction:not(:target, :has(~ #workspace:target)) {
      display: block;
    }
  }
</style>
