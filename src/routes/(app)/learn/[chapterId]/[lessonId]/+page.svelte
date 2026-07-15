<script lang="ts">
  import type { PageData } from "./$types";
  import { resolve } from "$app/paths";
  import type { ResolvedPathname } from "$app/types";
  import TwoPanel from "$lib/components/layout/TwoPanel.svelte";
  import BreadcrumbTrail from "$lib/components/tutorial/BreadcrumbTrail.svelte";
  import LessonProgressBar from "$lib/components/tutorial/LessonProgressBar.svelte";
  import FeedbackPanel from "$lib/components/tutorial/FeedbackPanel.svelte";
  import SignWorkspace from "$lib/components/workspaces/SignWorkspace.svelte";
  import VerifyWorkspace from "$lib/components/workspaces/VerifyWorkspace.svelte";
  import EncryptWorkspace from "$lib/components/workspaces/EncryptWorkspace.svelte";
  import DecryptWorkspace from "$lib/components/workspaces/DecryptWorkspace.svelte";
  import QuizWorkspace from "$lib/components/workspaces/QuizWorkspace.svelte";
  import ExplainerWorkspace from "$lib/components/workspaces/ExplainerWorkspace.svelte";
  import { enhance } from "$app/forms";

  let { data }: { data: PageData } = $props();

  const {
    chapterId,
    chapterTitle,
    lessonTitle,
    lessonDescription,
    challenges,
    completedCount,
    lastResult,
    lastMessage,
    xpAwarded
  } = $derived(data);

  // The active challenge: first incomplete, or last if all done
  const activeChallenge = $derived(
    challenges.find((c) => !c.completed) ?? challenges[challenges.length - 1]
  );

  const nextLessonHref = $derived<ResolvedPathname | null>(null);

  let hintsUsed = $state(0);

  $effect(() => {
    // Reset hint count when the active challenge changes
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    activeChallenge?.id;
    hintsUsed = 0;
  });

  function handleHintToggle(event: ToggleEvent): void {
    if (event.newState === "open") {
      hintsUsed += 1;
    }
  }

  const breadcrumbs = $derived([
    {
      label: "Dashboard",
      href: "/dashboard" as ResolvedPathname
    },
    {
      label: chapterTitle,
      href: resolve("/(app)/learn/[chapterId]", { chapterId }) as ResolvedPathname
    },
    {
      label: lessonTitle,
      href: null
    }
  ]);
</script>

<div class="lesson-page">
  <div class="lesson-page__chrome">
    <div class="lesson-page__chrome-left">
      <BreadcrumbTrail crumbs={breadcrumbs} />
    </div>
    <div class="lesson-page__chrome-right">
      <LessonProgressBar total={challenges.length} completed={completedCount} />
    </div>
  </div>

  <TwoPanel>
    {#snippet left()}
      <div class="instruction-panel">
        <h1 class="instruction-panel__title">{lessonTitle}</h1>
        <p class="instruction-panel__description">{lessonDescription}</p>

        {#if activeChallenge?.hint}
          <details class="instruction-panel__hint" ontoggle={handleHintToggle}>
            <summary class="instruction-panel__hint-summary">Need a hint?</summary>
            <div class="instruction-panel__hint-body">
              <p>{activeChallenge.hint}</p>
            </div>
          </details>
        {/if}
      </div>
    {/snippet}

    {#snippet right()}
      <div class="workspace-panel">
        {#if lastResult !== null}
          <div class="workspace-panel__feedback">
            <FeedbackPanel
              result={lastResult}
              message={lastMessage ?? ""}
              {xpAwarded}
              nextHref={nextLessonHref}
            />
          </div>
        {/if}

        {#if activeChallenge}
          <div class="workspace-panel__challenge">
            <form
              method="POST"
              action="?/submit"
              class="workspace-panel__hidden-fields"
              use:enhance
            >
              <input type="hidden" name="challengeId" value={activeChallenge.id} />
              <input type="hidden" name="hintsUsed" value={hintsUsed} />
              <input type="hidden" name="attemptNumber" value="1" />
            </form>

            {#if activeChallenge.setup.type === "sign"}
              {@const setup = activeChallenge.setup}
              <form method="POST" action="?/submit" use:enhance>
                <input type="hidden" name="challengeId" value={activeChallenge.id} />
                <input type="hidden" name="hintsUsed" value={hintsUsed} />
                <input type="hidden" name="attemptNumber" value="1" />
                <SignWorkspace plaintext={setup.plaintext} />
              </form>
            {:else if activeChallenge.setup.type === "verify"}
              {@const setup = activeChallenge.setup}
              <form method="POST" action="?/submit" use:enhance>
                <input type="hidden" name="challengeId" value={activeChallenge.id} />
                <input type="hidden" name="hintsUsed" value={hintsUsed} />
                <input type="hidden" name="attemptNumber" value="1" />
                <VerifyWorkspace signedMessage={setup.signedMessage} />
              </form>
            {:else if activeChallenge.setup.type === "encrypt"}
              {@const setup = activeChallenge.setup}
              <form method="POST" action="?/submit" use:enhance>
                <input type="hidden" name="challengeId" value={activeChallenge.id} />
                <input type="hidden" name="hintsUsed" value={hintsUsed} />
                <input type="hidden" name="attemptNumber" value="1" />
                <EncryptWorkspace
                  recipientPublicKey={setup.recipientPublicKey}
                  plaintext={setup.plaintext}
                />
              </form>
            {:else if activeChallenge.setup.type === "decrypt"}
              {@const setup = activeChallenge.setup}
              <form method="POST" action="?/submit" use:enhance>
                <input type="hidden" name="challengeId" value={activeChallenge.id} />
                <input type="hidden" name="hintsUsed" value={hintsUsed} />
                <input type="hidden" name="attemptNumber" value="1" />
                <DecryptWorkspace ciphertext={setup.ciphertext} />
              </form>
            {:else if activeChallenge.setup.type === "quiz"}
              {@const setup = activeChallenge.setup}
              <form method="POST" action="?/submit" use:enhance>
                <input type="hidden" name="challengeId" value={activeChallenge.id} />
                <input type="hidden" name="hintsUsed" value={hintsUsed} />
                <input type="hidden" name="attemptNumber" value="1" />
                <QuizWorkspace question={setup.question} options={setup.options} />
              </form>
            {:else if activeChallenge.setup.type === "explainer"}
              <form method="POST" action="?/submit" use:enhance>
                <input type="hidden" name="challengeId" value={activeChallenge.id} />
                <input type="hidden" name="hintsUsed" value={hintsUsed} />
                <input type="hidden" name="attemptNumber" value="1" />
                <ExplainerWorkspace />
              </form>
            {/if}
          </div>
        {:else}
          <div class="workspace-panel__complete">
            <p class="workspace-panel__complete-text">
              All challenges in this lesson are complete!
            </p>
            <a
              href={resolve("/(app)/learn/[chapterId]", { chapterId }) as ResolvedPathname}
              class="btn btn--primary"
            >
              Back to chapter →
            </a>
          </div>
        {/if}
      </div>
    {/snippet}
  </TwoPanel>
</div>

<style>
  .lesson-page {
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .lesson-page__chrome {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding-block: var(--space-4);
    padding-inline: var(--space-6);
    border-block-end: 1px solid var(--border-color);
    background-color: var(--surface-card);
  }

  .lesson-page__chrome-left {
    flex: 1;
    min-inline-size: 0;
  }

  .lesson-page__chrome-right {
    flex-shrink: 0;
    inline-size: 160px;
  }

  .instruction-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .instruction-panel__title {
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    text-wrap: balance;
  }

  .instruction-panel__description {
    font-size: var(--text-base);
    color: var(--text-body);
    line-height: 1.6;
  }

  .instruction-panel__hint {
    border: 1px solid var(--color-info-tint, var(--border-color));
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .instruction-panel__hint-summary {
    display: block;
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--color-primary-600);
    cursor: pointer;
    list-style: none;
    user-select: none;
  }

  .instruction-panel__hint-summary::-webkit-details-marker {
    display: none;
  }

  .instruction-panel__hint-body {
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-sm);
    color: var(--text-body);
    line-height: 1.6;
    border-block-start: 1px solid var(--border-color);
    background-color: var(--color-gray-50, #f9fafb);
    white-space: pre-line;
  }

  .workspace-panel {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  /* The hidden-fields form is invisible — we only use it for non-JS contexts
     where each workspace form carries its own hidden inputs */
  .workspace-panel__hidden-fields {
    display: none;
  }

  .workspace-panel__complete {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-8);
    text-align: center;
  }

  .workspace-panel__complete-text {
    font-size: var(--text-base);
    color: var(--color-success);
    font-weight: 500;
  }

  @media (prefers-color-scheme: dark) {
    .instruction-panel__hint-body {
      background-color: rgb(255 255 255 / 3%);
    }
  }
</style>
