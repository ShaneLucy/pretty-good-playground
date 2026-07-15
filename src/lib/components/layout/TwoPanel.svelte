<script lang="ts">
  import type { Snippet } from "svelte";
  import { browser } from "$app/environment";

  type TabId = "instruction" | "workspace";

  interface Props {
    left: Snippet;
    right: Snippet;
  }

  let { left, right }: Props = $props();

  let activeTab = $state<TabId>("instruction");

  function handleTabClick(event: MouseEvent, tab: TabId): void {
    event.preventDefault();
    activeTab = tab;
  }
</script>

<div class="two-panel">
  <nav class="two-panel__tabs" aria-label="Lesson panels" role={browser ? "tablist" : undefined}>
    <a
      href="#instruction"
      class="two-panel__tab"
      role={browser ? "tab" : undefined}
      aria-selected={browser ? activeTab === "instruction" : undefined}
      aria-controls={browser ? "instruction" : undefined}
      onclick={(e) => handleTabClick(e, "instruction")}>Learn</a
    >
    <a
      href="#workspace"
      class="two-panel__tab"
      role={browser ? "tab" : undefined}
      aria-selected={browser ? activeTab === "workspace" : undefined}
      aria-controls={browser ? "workspace" : undefined}
      onclick={(e) => handleTabClick(e, "workspace")}>Do</a
    >
  </nav>

  <div class="two-panel__layout">
    <section
      id="instruction"
      class="two-panel__pane two-panel__pane--left"
      aria-label="Instruction panel"
      role={browser ? "tabpanel" : undefined}
      hidden={browser ? activeTab !== "instruction" : undefined}
    >
      {@render left()}
    </section>

    <section
      id="workspace"
      class="two-panel__pane two-panel__pane--right"
      aria-label="Workspace panel"
      role={browser ? "tabpanel" : undefined}
      hidden={browser ? activeTab !== "workspace" : undefined}
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
