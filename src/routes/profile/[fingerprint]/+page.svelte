<script lang="ts">
  import type { PageData } from "./$types";
  import AchievementBadge from "$lib/components/tutorial/AchievementBadge.svelte";
  import LevelBadge from "$lib/components/tutorial/LevelBadge.svelte";
  import FingerprintDisplay from "$lib/components/tutorial/FingerprintDisplay.svelte";
  import ProgressBar from "$lib/components/ui/ProgressBar.svelte";
  import PageContainer from "$lib/components/layout/PageContainer.svelte";
  import InfoBox from "$lib/components/ui/InfoBox.svelte";
  import { levelTitle } from "$lib/shared/progress-utils";

  const PUBLIC_PROFILE_NOTICE =
    "This is a public profile. Progress and achievements are shared by the profile owner.";

  let { data }: { data: PageData } = $props();

  const { displayName, fingerprint, achievements, chapterProgresses, xp, level, streakDays } =
    $derived(data);

  const currentLevelTitle = $derived(levelTitle(level));
</script>

<main id="main-content" class="public-profile">
  <PageContainer variant="default">
    <h1 class="public-profile__heading">{displayName}</h1>

    <div class="public-profile__notice">
      <InfoBox variant="info">
        {PUBLIC_PROFILE_NOTICE}
      </InfoBox>
    </div>

    <!-- Identity section -->
    <section class="public-profile__section" aria-label="Identity">
      <div class="public-profile__identity">
        <div class="public-profile__fp">
          <FingerprintDisplay {fingerprint} variant="large" />
        </div>

        <div class="public-profile__meta">
          <LevelBadge {level} title={currentLevelTitle} variant="large" />

          <div class="public-profile__stats">
            <span class="public-profile__stat">
              <span class="public-profile__stat-value">{xp.toLocaleString()}</span>
              <span class="public-profile__stat-label">XP</span>
            </span>
            <span class="public-profile__stat-sep" aria-hidden="true">·</span>
            <span class="public-profile__stat">
              <span class="public-profile__stat-value">{streakDays}</span>
              <span class="public-profile__stat-label">day streak</span>
            </span>
            <span class="public-profile__stat-sep" aria-hidden="true">·</span>
            <span class="public-profile__stat">
              <span class="public-profile__stat-value">{achievements.length}</span>
              <span class="public-profile__stat-label">achievements</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <hr class="public-profile__divider" />

    <!-- Chapter progress -->
    <section class="public-profile__section" aria-label="Chapter progress">
      <h2 class="public-profile__section-heading">Chapter Progress</h2>
      <div class="public-profile__chapters">
        {#each chapterProgresses as chapter (chapter.id)}
          <div class="public-profile__chapter">
            <div class="public-profile__chapter-header">
              <span class="public-profile__chapter-title">{chapter.title}</span>
              <span class="public-profile__chapter-pct">{chapter.percentComplete}%</span>
            </div>
            <ProgressBar
              value={chapter.percentComplete}
              max={100}
              label="{chapter.title} progress"
              variant="chapter"
            />
          </div>
        {/each}
      </div>
    </section>

    <hr class="public-profile__divider" />

    <!-- Achievements -->
    <section class="public-profile__section" aria-label="Achievements">
      <h2 class="public-profile__section-heading">Achievements</h2>
      {#if achievements.length === 0}
        <p class="public-profile__empty">No achievements earned yet.</p>
      {:else}
        <div class="public-profile__achievements">
          {#each achievements as achievementId (achievementId)}
            <AchievementBadge
              name={achievementId.replace(/_/g, " ")}
              description=""
              earnedAt={null}
              variant="earned"
            />
          {/each}
        </div>
      {/if}
    </section>
  </PageContainer>
</main>

<style>
  .public-profile {
    padding-block: var(--space-8);
  }

  .public-profile__heading {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-block-end: var(--space-4);
    text-wrap: balance;
  }

  .public-profile__notice {
    margin-block-end: var(--space-6);
  }

  .public-profile__divider {
    border: none;
    border-block-start: 1px solid var(--border-color);
    margin-block: var(--space-8);
  }

  .public-profile__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .public-profile__section-heading {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .public-profile__identity {
    display: flex;
    align-items: flex-start;
    gap: var(--space-6);
    flex-wrap: wrap;
  }

  .public-profile__fp {
    flex-shrink: 0;
  }

  .public-profile__meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1;
  }

  .public-profile__stats {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .public-profile__stat {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-1);
  }

  .public-profile__stat-value {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--text-primary);
    font-family: var(--font-display);
  }

  .public-profile__stat-label {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .public-profile__stat-sep {
    color: var(--text-muted);
  }

  .public-profile__chapters {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .public-profile__chapter {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .public-profile__chapter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2);
  }

  .public-profile__chapter-title {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  .public-profile__chapter-pct {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-muted);
  }

  .public-profile__achievements {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--space-3);
  }

  .public-profile__empty {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
</style>
