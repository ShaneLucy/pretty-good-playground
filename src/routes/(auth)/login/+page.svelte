<script lang="ts">
  import { enhance } from "$app/forms";
  import { resolveRoute } from "$app/paths";
  import type { ActionData } from "./$types";
  import MonoTextarea from "$lib/components/ui/MonoTextarea.svelte";
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    form: ActionData;
  }

  let { form }: Props = $props();
</script>

<svelte:head>
  <title>Sign In — PGP Playground</title>
</svelte:head>

<div class="auth-page">
  <header class="auth-page__header">
    <h1 class="auth-page__title">Sign in</h1>
    <p class="auth-page__subtitle">
      Paste your PGP public key. You'll sign a challenge nonce to prove you hold the private key.
    </p>
  </header>

  {#if form?.error}
    <p role="alert" class="form-error-banner">{form.error}</p>
  {/if}

  <form method="POST" use:enhance class="auth-form">
    <MonoTextarea
      name="publicKey"
      label="PGP public key"
      placeholder="-----BEGIN PGP PUBLIC KEY BLOCK-----"
      rows={12}
      required
    />

    <label class="checkbox-label">
      <input type="checkbox" name="rememberDevice" value="true" class="checkbox-input" />
      Remember this device for 30 days
    </label>

    <Button type="submit" variant="primary" size="lg">Continue to verification</Button>
  </form>

  <p class="auth-page__link">
    No account yet? <a href={resolveRoute("/register")}>Create one</a>
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

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-body);
    cursor: pointer;
    min-block-size: 44px;
  }

  .checkbox-input {
    inline-size: 18px;
    block-size: 18px;
    cursor: pointer;
    accent-color: var(--color-primary-600);
    flex-shrink: 0;
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
