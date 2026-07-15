<script lang="ts">
  import type { PageData } from "./$types";
  import { resolve } from "$app/paths";
  import type { ResolvedPathname } from "$app/types";
  import ChapterCard from "$lib/components/tutorial/ChapterCard.svelte";
  import LevelBadge from "$lib/components/tutorial/LevelBadge.svelte";
  import XPDisplay from "$lib/components/tutorial/XPDisplay.svelte";
  import FingerprintDisplay from "$lib/components/tutorial/FingerprintDisplay.svelte";
  import PageContainer from "$lib/components/layout/PageContainer.svelte";

  let { data }: { data: PageData } = $props();

  const { chapterSummaries, continueLesson, stats, user } = $derived(data);

  const continueHref = $derived(
    continueLesson
      ? (resolve("/(app)/learn/[chapterId]/[lessonId]", {
          chapterId: continueLesson.chapterId,
          lessonId: continueLesson.lessonId
        }) as ResolvedPathname)
      : null
  );
</script>

<main id="main-content" class="dashboard">
  <PageContainer variant="wide">
    <div class="dashboard__layout">
      <!-- Stats sidebar -->
      <aside class="dashboard__sidebar">
        <details class="dashboard__stats-details" open>
          <summary class="dashboard__stats-summary">Your Progress</summary>

          <div class="dashboard__stats-body">
            {#if user}
              <div class="dashboard__fingerprint">
                <FingerprintDisplay fingerprint={user.fingerprint} variant="short" />
              </div>
            {/if}

            <LevelBadge level={stats.level} title={stats.levelTitle} variant="large" />

            <XPDisplay
              xp={stats.xp}
              level={stats.level}
              xpToNextLevel={stats.xpToNextLevel}
              xpInCurrentLevel={stats.xpInCurrentLevel}
            />

            <div class="dashboard__meta">
              <div class="dashboard__meta-row">
                <span class="dashboard__meta-label">Streak</span>
                <span class="dashboard__meta-value">{stats.streakDays} days</span>
              </div>
              <div class="dashboard__meta-row">
                <span class="dashboard__meta-label">Achievements</span>
                <span class="dashboard__meta-value">{stats.achievementCount}</span>
              </div>
            </div>
          </div>
        </details>
      </aside>

      <!-- Course map -->
      <section class="dashboard__map" aria-label="Course chapters">
        <h1 class="dashboard__heading">Your Learning Journey</h1>

        {#if continueLesson && continueHref}
          <div class="dashboard__continue">
            <p class="dashboard__continue-label">Continue where you left off</p>
            <a href={continueHref} class="dashboard__continue-link">
              <span class="dashboard__continue-chapter">{continueLesson.chapterTitle}</span>
              <span class="dashboard__continue-lesson">{continueLesson.title}</span>
              <span class="dashboard__continue-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        {/if}

        <div class="dashboard__chapters">
          {#each chapterSummaries as chapter (chapter.id)}
            <ChapterCard
              chapter={{
                title: chapter.title,
                description: chapter.description,
                lessonCount: chapter.lessonCount
              }}
              status={chapter.status}
              percentComplete={chapter.percentComplete}
              href={resolve("/(app)/learn/[chapterId]", {
                chapterId: chapter.id
              }) as ResolvedPathname}
            />
          {/each}
        </div>

        <p class="dashboard__unlock-hint">Chapters unlock as you complete the previous one.</p>
      </section>
    </div>
  </PageContainer>
</main>

<style>
  .dashboard {
    padding-block: var(--space-8);
  }

  .dashboard__layout {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: var(--space-8);
    align-items: start;
  }

  .dashboard__sidebar {
    position: sticky;
    top: calc(64px + var(--space-8));
  }

  .dashboard__stats-details {
    background-color: var(--surface-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .dashboard__stats-summary {
    display: block;
    padding: var(--space-4) var(--space-6);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
    cursor: pointer;
    user-select: none;
    list-style: none;
  }

  .dashboard__stats-summary::-webkit-details-marker {
    display: none;
  }

  .dashboard__stats-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4) var(--space-6) var(--space-6);
    border-top: 1px solid var(--border-color);
  }

  .dashboard__fingerprint {
    display: flex;
    justify-content: center;
  }

  .dashboard__meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-block-start: var(--space-2);
    border-block-start: 1px solid var(--border-color);
  }

  .dashboard__meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dashboard__meta-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .dashboard__meta-value {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
  }

  .dashboard__heading {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    text-wrap: balance;
    margin-block-end: var(--space-6);
  }

  .dashboard__continue {
    background-color: var(--color-primary-50);
    border: 1px solid var(--color-primary-100);
    border-radius: var(--radius-lg);
    padding: var(--space-4) var(--space-6);
    margin-block-end: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .dashboard__continue-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-primary-700);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .dashboard__continue-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
    color: var(--color-primary-700);
    font-weight: 600;
    transition: color var(--transition-base);
  }

  .dashboard__continue-link:hover {
    color: var(--color-primary-900);
  }

  .dashboard__continue-chapter {
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-muted);
    background-color: var(--color-primary-100);
    padding-block: 2px;
    padding-inline: var(--space-2);
    border-radius: var(--radius-sm);
  }

  .dashboard__continue-lesson {
    font-size: var(--text-base);
    flex: 1;
  }

  .dashboard__continue-arrow {
    font-size: var(--text-lg);
    flex-shrink: 0;
  }

  .dashboard__chapters {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .dashboard__map {
    min-inline-size: 0;
  }

  .dashboard__unlock-hint {
    margin-block-start: var(--space-4);
    font-size: var(--text-sm);
    color: var(--text-muted);
    text-align: center;
  }

  @media (width <= 768px) {
    .dashboard__layout {
      grid-template-columns: 1fr;
    }

    .dashboard__sidebar {
      position: static;
      order: -1;
    }

    .dashboard__stats-details[open] .dashboard__stats-body {
      display: flex;
    }

    .dashboard__heading {
      font-size: var(--text-2xl);
    }
  }

  @media (prefers-color-scheme: dark) {
    .dashboard__continue {
      background-color: rgb(99 102 241 / 10%);
      border-color: rgb(99 102 241 / 25%);
    }

    .dashboard__continue-label {
      color: var(--color-primary-500);
    }

    .dashboard__continue-link {
      color: var(--color-primary-500);
    }

    .dashboard__continue-chapter {
      background-color: rgb(99 102 241 / 15%);
      color: var(--color-primary-500);
    }
  }
</style>
