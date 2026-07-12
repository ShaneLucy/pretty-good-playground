<script lang="ts">
  import { enhance } from "$app/forms";
  import { resolveRoute } from "$app/paths";
  import type { PageData, ActionData } from "./$types";
  import CopyBlock from "$lib/components/ui/CopyBlock.svelte";
  import Details from "$lib/components/ui/Details.svelte";
  import MonoTextarea from "$lib/components/ui/MonoTextarea.svelte";
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    data: PageData;
    form: ActionData;
  }

  let { data, form }: Props = $props();

  const gpgCommand = $derived(`echo '${data.nonce}' | gpg --clearsign`);
</script>

<svelte:head>
  <title>Verify your key — PGP Playground</title>
</svelte:head>

<div class="verify-page">
  <header class="verify-page__header">
    <p class="verify-page__step" aria-label="Step 2 of 2">Step 2 of 2</p>
    <h1 class="verify-page__title">Sign the challenge</h1>
    <p class="verify-page__subtitle">
      Sign the nonce below with your private key to prove you own it.
    </p>
  </header>

  <section class="verify-page__nonce" aria-labelledby="nonce-label">
    <p id="nonce-label" class="nonce-label">Your challenge nonce</p>
    <CopyBlock text={data.nonce} label="Challenge nonce to sign" />
  </section>

  <Details summary="How to sign with GPG">
    <p>Run this command in your terminal:</p>
    <CopyBlock text={gpgCommand} label="GPG signing command" />
    <p class="details-note">
      Copy everything from <code>-----BEGIN PGP SIGNED MESSAGE-----</code> to
      <code>-----END PGP SIGNATURE-----</code> (inclusive) and paste it below.
    </p>
  </Details>

  {#if form?.error}
    <p role="alert" class="form-error-banner">{form.error}</p>
  {/if}

  <form method="POST" use:enhance class="verify-form">
    <MonoTextarea
      name="signature"
      label="Signed output"
      placeholder="-----BEGIN PGP SIGNED MESSAGE-----"
      rows={14}
      required
    />

    <Button type="submit" variant="primary" size="lg">Verify and sign in</Button>
  </form>

  <p class="verify-page__link">
    <a href={resolveRoute("/login")}>Start over</a>
  </p>
</div>

<style>
  .verify-page {
    max-inline-size: 640px;
    margin-inline: auto;
    padding-block: var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .verify-page__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .verify-page__step {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--color-primary-600);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .verify-page__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--text-primary);
    text-wrap: balance;
  }

  .verify-page__subtitle {
    font-size: var(--text-sm);
    color: var(--text-muted);
    line-height: 1.6;
  }

  .verify-page__nonce {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .nonce-label {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text-primary);
  }

  .form-error-banner {
    padding: var(--space-3) var(--space-4);
    background-color: var(--color-error-tint);
    color: #991b1b;
    border: 1px solid var(--color-error);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    font-weight: 500;
  }

  @media (prefers-color-scheme: dark) {
    .form-error-banner {
      color: #fca5a5;
    }
  }

  .verify-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .details-note {
    margin-block-start: var(--space-3);
    font-size: var(--text-sm);
    color: var(--text-muted);
  }

  .details-note code {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    background-color: var(--color-gray-100);
    padding-inline: var(--space-1);
    border-radius: var(--radius-sm);
  }

  @media (prefers-color-scheme: dark) {
    .details-note code {
      background-color: rgb(255 255 255 / 10%);
    }
  }

  .verify-page__link {
    font-size: var(--text-sm);
    color: var(--text-muted);
    text-align: center;
  }

  .verify-page__link a {
    color: var(--color-primary-600);
    font-weight: 500;
  }
</style>
