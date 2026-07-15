<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import { enhance } from "$app/forms";
  import KeyDisplayBlock from "$lib/components/tutorial/KeyDisplayBlock.svelte";
  import FingerprintDisplay from "$lib/components/tutorial/FingerprintDisplay.svelte";
  import TextInput from "$lib/components/ui/TextInput.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import PageContainer from "$lib/components/layout/PageContainer.svelte";

  const DEREGISTER_CONFIRMATION = "DEREGISTER";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let confirmationInput = $state("");
  const confirmationMatches = $derived(confirmationInput === DEREGISTER_CONFIRMATION);
</script>

<main id="main-content" class="keys-page">
  <PageContainer variant="narrow">
    <h1 class="keys-page__heading">Key Management</h1>

    <!-- Section 1: your key -->
    <section class="keys-page__section" aria-label="Your public key">
      <h2 class="keys-page__section-heading">Your Key</h2>

      <div class="keys-page__fingerprint">
        <p class="keys-page__fp-label">Fingerprint</p>
        <FingerprintDisplay fingerprint={data.fingerprint} variant="full" />
      </div>

      <KeyDisplayBlock
        armoredKey={data.armoredPublicKey}
        fingerprint={data.fingerprint}
        downloadHref={`data:text/plain;charset=utf-8,${encodeURIComponent(data.armoredPublicKey)}` as import("$app/types").ResolvedPathname}
      />
    </section>

    <hr class="keys-page__divider" />

    <!-- Section 2: danger zone -->
    <section class="keys-page__danger" aria-label="Danger zone">
      <h2 class="keys-page__danger-heading">Danger Zone</h2>

      <p class="keys-page__danger-desc">
        Deregistering removes your progress from this app. It does not delete or change your PGP key
        in any way. Your key is yours — we are forgetting our end of the association.
      </p>

      <form method="POST" action="?/deregister" class="keys-page__deregister-form" use:enhance>
        <TextInput
          id="confirmation"
          name="confirmation"
          label="Type DEREGISTER to confirm"
          bind:value={confirmationInput}
          error={form?.deregisterError}
        />

        <Button type="submit" variant="danger" size="md" disabled={!confirmationMatches}>
          Deregister this key
        </Button>
      </form>
    </section>
  </PageContainer>
</main>

<style>
  .keys-page {
    padding-block: var(--space-8);
  }

  .keys-page__heading {
    font-family: var(--font-display);
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-block-end: var(--space-6);
  }

  .keys-page__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .keys-page__section-heading {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--text-primary);
    letter-spacing: -0.02em;
  }

  .keys-page__fingerprint {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .keys-page__fp-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .keys-page__divider {
    border: none;
    border-block-start: 1px solid var(--border-color);
    margin-block: var(--space-8);
  }

  .keys-page__danger {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    border: 1px solid var(--color-error);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
  }

  .keys-page__danger-heading {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 600;
    color: var(--color-error);
    letter-spacing: -0.02em;
  }

  .keys-page__danger-desc {
    font-size: var(--text-sm);
    color: var(--text-body);
    line-height: 1.6;
  }

  .keys-page__deregister-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    max-inline-size: 400px;
  }
</style>
