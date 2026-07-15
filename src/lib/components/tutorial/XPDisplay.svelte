<script lang="ts">
  import ProgressBar from "$lib/components/ui/ProgressBar.svelte";

  interface Props {
    xp: number;
    level: number;
    xpToNextLevel: number;
    xpInCurrentLevel: number;
  }

  let { xp, level, xpToNextLevel, xpInCurrentLevel }: Props = $props();

  const progressPct = $derived(
    xpToNextLevel > 0 ? Math.round((xpInCurrentLevel / xpToNextLevel) * 100) : 100
  );
</script>

<div class="xp-display" aria-label="Level {level} — {xp} XP total">
  <div class="xp-display__header">
    <span class="xp-display__label">XP</span>
    <span class="xp-display__total">{xp.toLocaleString()}</span>
  </div>

  <div class="xp-display__bar">
    <ProgressBar
      value={xpInCurrentLevel}
      max={xpToNextLevel}
      label="XP progress to level {level + 1}"
      variant="xp"
    />
  </div>

  <div class="xp-display__footer">
    <span class="xp-display__progress-label">{xpInCurrentLevel} / {xpToNextLevel} XP</span>
    <span class="xp-display__pct">{progressPct}%</span>
  </div>
</div>

<style>
  .xp-display {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .xp-display__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .xp-display__label {
    font-size: var(--text-xs);
    font-weight: 700;
    color: var(--color-gold-600);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .xp-display__total {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--color-gold-500);
    font-family: var(--font-display);
    letter-spacing: -0.02em;
  }

  .xp-display__bar {
    inline-size: 100%;
  }

  .xp-display__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .xp-display__progress-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  .xp-display__pct {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--color-gold-600);
  }
</style>
