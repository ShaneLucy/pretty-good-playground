<script lang="ts">
  import { enhance } from "$app/forms";
  import { resolveRoute } from "$app/paths";
  import type { ActionData } from "./$types";
  import TextInput from "$lib/components/ui/TextInput.svelte";
  import MonoTextarea from "$lib/components/ui/MonoTextarea.svelte";
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    form: ActionData;
  }

  let { form }: Props = $props();

  const displayNameError = $derived(form?.field === "displayName" ? form.error : undefined);
  const publicKeyError = $derived(
    form?.field === "publicKey" || (form != null && form.field == null) ? form?.error : undefined
  );
</script>

<svelte:head>
  <title>Register — PGP Playground</title>
</svelte:head>

<div class="auth-page">
  <header class="auth-page__header">
    <h1 class="auth-page__title">Create your account</h1>
    <p class="auth-page__subtitle">
      Paste your PGP public key to register. Your key is your identity — no password needed.
    </p>
  </header>

  {#if form?.error && form.field == null}
    <p role="alert" class="form-error-banner">{form.error}</p>
  {/if}

  <form method="POST" use:enhance class="auth-form">
    <TextInput
      name="displayName"
      label="Display name"
      placeholder="e.g. Alice"
      required
      error={displayNameError}
    />

    <MonoTextarea
      name="publicKey"
      label="PGP public key"
      placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
      rows={12}
      required
      error={publicKeyError}
    />

    <Button type="submit" variant="primary" size="lg">Create account</Button>
  </form>

  <p class="auth-page__link">
    Already registered? <a href={resolveRoute("/login")}>Sign in</a>
  </p>
</div>

<style>
  .auth-page {
    max-inline-size: 560px;
    margin-inline: auto;
    padding-block: var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .auth-page__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .auth-page__title {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--text-primary);
    text-wrap: balance;
  }

  .auth-page__subtitle {
    font-size: var(--text-sm);
    color: var(--text-muted);
    line-height: 1.6;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
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

  .auth-page__link {
    font-size: var(--text-sm);
    color: var(--text-muted);
    text-align: center;
  }

  .auth-page__link a {
    color: var(--color-primary-600);
    font-weight: 500;
  }
</style>
