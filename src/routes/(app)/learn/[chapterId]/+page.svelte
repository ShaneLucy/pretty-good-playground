<script lang="ts">
  import type { PageData } from "./$types";
  import { resolve } from "$app/paths";
  import type { ResolvedPathname } from "$app/types";
  import LessonCard from "$lib/components/tutorial/LessonCard.svelte";
  import BreadcrumbTrail from "$lib/components/tutorial/BreadcrumbTrail.svelte";
  import PageContainer from "$lib/components/layout/PageContainer.svelte";

  let { data }: { data: PageData } = $props();

  const { chapter, lessonSummaries } = $derived(data);

  const breadcrumbs = $derived([
    {
      label: "Dashboard",
      href: "/dashboard" as ResolvedPathname
    },
    {
      label: chapter.title,
      href: null
    }
  ]);
</script>

<main id="main-content" class="chapter-page">
  <PageContainer variant="default">
    <div class="chapter-page__breadcrumb">
      <BreadcrumbTrail crumbs={breadcrumbs} />
    </div>

    <header class="chapter-page__header">
      <h1 class="chapter-page__title">{chapter.title}</h1>
      <p class="chapter-page__description">{chapter.description}</p>
    </header>

    <section aria-label="Lessons">
      <h2 class="chapter-page__lessons-heading">Lessons</h2>
      <div class="chapter-page__lessons">
        {#each lessonSummaries as lesson (lesson.id)}
          <LessonCard
            lesson={{
              title: lesson.title,
              challengeCount: lesson.challengeCount
            }}
            status={lesson.status}
            href={resolve("/(app)/learn/[chapterId]/[lessonId]", {
              chapterId: chapter.id,
              lessonId: lesson.id
            }) as ResolvedPathname}
          />
        {/each}
      </div>
    </section>
  </PageContainer>
</main>

<style>
  .chapter-page {
    padding-block: var(--space-8);
  }

  .chapter-page__breadcrumb {
    margin-block-end: var(--space-6);
  }

  .chapter-page__header {
    margin-block-end: var(--space-8);
  }

  .chapter-page__title {
    font-family: var(--font-display);
    font-size: var(--text-4xl);
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    text-wrap: balance;
    margin-block-end: var(--space-4);
  }

  .chapter-page__description {
    font-size: var(--text-lg);
    color: var(--text-body);
    line-height: 1.6;
    max-inline-size: 60ch;
  }

  .chapter-page__lessons-heading {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-block-end: var(--space-4);
  }

  .chapter-page__lessons {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  @media (width <= 640px) {
    .chapter-page__title {
      font-size: var(--text-3xl);
    }
  }
</style>
