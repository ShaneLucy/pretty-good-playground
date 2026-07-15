<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import FingerprintDisplay from "$lib/components/tutorial/FingerprintDisplay.svelte";
  import AchievementBadge from "$lib/components/tutorial/AchievementBadge.svelte";
  import LevelBadge from "$lib/components/tutorial/LevelBadge.svelte";
  import ProgressBar from "$lib/components/ui/ProgressBar.svelte";
  import TextInput from "$lib/components/ui/TextInput.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import PageContainer from "$lib/components/layout/PageContainer.svelte";
  import { levelTitle } from "$lib/shared/progress-utils";

  import { untrack } from "svelte";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const { achievements, chapterProgresses, xp, level, streakDays } = $derived(data);

  const currentLevelTitle = $derived(levelTitle(level));

  let displayNameInput = $state(untrack(() => data.displayName));
  let profilePublicInput = $state(untrack(() => data.profilePublic));
</script>

<main id="main-content" class="profile-page">
  <PageContainer variant="default">
    <h1 class="profile-page__heading">Your Profile</h1>

    <!-- Profile header -->
    <section class="profile-page__section" aria-label="Identity">
      <div class="profile-page__identity">
        <div class="profile-page__fp">
          {#if data.user}
            <FingerprintDisplay fingerprint={data.user.fingerprint} variant="large" />
          {/if}
        </div>

        <div class="profile-page__meta">
          <div class="profile-page__name">{data.displayName}</div>
          <LevelBadge {level} title={currentLevelTitle} variant="large" />
          <div class="profile-page__stats">
            <span class="profile-page__stat">
              <span class="profile-page__stat-value">{xp.toLocaleString()}</span>
              <span class="profile-page__stat-label">XP</span>
            </span>
            <span class="profile-page__stat-sep" aria-hidden="true">·</span>
            <span class="profile-page__stat">
              <span class="profile-page__stat-value">{streakDays}</span>
              <span class="profile-page__stat-label">day streak</span>
            </span>
            <span class="profile-page__stat-sep" aria-hidden="true">·</span>
            <span class="profile-page__stat">
              <span class="profile-page__stat-value">{achievements.length}</span>
              <span class="profile-page__stat-label">achievements</span>
            </span>
          </div>
        </div>
      </div>
    </section>

    <hr class="profile-page__divider" />

    <!-- Display name edit -->
    <section class="profile-page__section" aria-label="Edit display name">
      <h2 class="profile-page__section-heading">Display Name</h2>
      <form method="POST" action="?/updateDisplayName" class="profile-page__name-form" use:enhance>
        <TextInput
          id="displayName"
          name="displayName"
          label="Display name"
          bind:value={displayNameInput}
          error={form?.updateNameError}
        />
        {#if form?.updateNameSuccess}
          <p class="profile-page__success" role="status">Display name updated.</p>
        {/if}
        <Button type="submit" variant="secondary" size="sm">Save name</Button>
      </form>
    </section>

    <hr class="profile-page__divider" />

    <!-- Profile visibility -->
    <section class="profile-page__section" aria-label="Profile visibility">
      <h2 class="profile-page__section-heading">Profile Visibility</h2>
      <p class="profile-page__section-desc">
        Make your profile public so others can see your progress and achievements.
      </p>
      <form
        method="POST"
        action="?/toggleVisibility"
        class="profile-page__visibility-form"
        use:enhance
      >
        <label class="profile-page__checkbox-label">
          <input
            type="checkbox"
            name="public"
            checked={profilePublicInput}
            onchange={(e) => {
              profilePublicInput = (e.target as HTMLInputElement).checked;
            }}
            class="profile-page__checkbox"
          />
          Make my profile public
        </label>
        <Button type="submit" variant="secondary" size="sm">Save</Button>
      </form>
      {#if data.profilePublic}
        <p class="profile-page__visibility-note">Your profile is public.</p>
      {:else}
        <p class="profile-page__visibility-note">Only you can see this page.</p>
      {/if}
    </section>

    <hr class="profile-page__divider" />

    <!-- Chapter progress -->
    <section class="profile-page__section" aria-label="Chapter progress">
      <h2 class="profile-page__section-heading">Chapter Progress</h2>
      <div class="profile-page__chapters">
        {#each chapterProgresses as chapter (chapter.id)}
          <div class="profile-page__chapter">
            <div class="profile-page__chapter-header">
              <span class="profile-page__chapter-title">{chapter.title}</span>
              <span class="profile-page__chapter-pct">{chapter.percentComplete}%</span>
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

    <hr class="profile-page__divider" />

    <!-- Achievements -->
    <section class="profile-page__section" aria-label="Achievements">
      <h2 class="profile-page__section-heading">Achievements</h2>
      {#if achievements.length === 0}
        <p class="profile-page__empty">
          No achievements yet. Complete your first lesson to get started.
        </p>
      {:else}
        <div class="profile-page__achievements">
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
  .profile-page {
    padding-block: var(--space-8);
  }

  .profile-page__heading {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-block-end: var(--space-6);
  }

  .profile-page__divider {
    border: none;
    border-block-start: 1px solid var(--border-color);
    margin-block: var(--space-8);
  }

  .profile-page__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .profile-page__section-heading {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .profile-page__section-desc {
    font-size: var(--text-sm);
    color: var(--text-body);
    line-height: 1.6;
  }

  .profile-page__identity {
    display: flex;
    align-items: flex-start;
    gap: var(--space-6);
    flex-wrap: wrap;
  }

  .profile-page__fp {
    flex-shrink: 0;
  }

  .profile-page__meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    flex: 1;
  }

  .profile-page__name {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .profile-page__stats {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .profile-page__stat {
    display: inline-flex;
    align-items: baseline;
    gap: var(--space-1);
  }

  .profile-page__stat-value {
    font-size: var(--text-xl);
    font-weight: 700;
    color: var(--text-primary);
    font-family: var(--font-display);
  }

  .profile-page__stat-label {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .profile-page__stat-sep {
    color: var(--text-muted);
  }

  .profile-page__name-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    max-inline-size: 400px;
  }

  .profile-page__success {
    font-size: var(--text-sm);
    color: var(--color-success);
    font-weight: 500;
  }

  .profile-page__visibility-form {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .profile-page__checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-body);
    cursor: pointer;
  }

  .profile-page__checkbox {
    inline-size: 18px;
    block-size: 18px;
    accent-color: var(--color-primary-600);
    cursor: pointer;
    flex-shrink: 0;
  }

  .profile-page__visibility-note {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .profile-page__chapters {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .profile-page__chapter {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .profile-page__chapter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2);
  }

  .profile-page__chapter-title {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  .profile-page__chapter-pct {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-muted);
  }

  .profile-page__achievements {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: var(--space-3);
  }

  .profile-page__empty {
    font-size: var(--text-sm);
    color: var(--text-muted);
  }
</style>
