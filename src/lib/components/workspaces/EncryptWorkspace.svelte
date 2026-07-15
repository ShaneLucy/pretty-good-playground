<script lang="ts">
  import CopyBlock from "$lib/components/ui/CopyBlock.svelte";
  import MonoTextarea from "$lib/components/ui/MonoTextarea.svelte";
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    recipientPublicKey: string;
    plaintext: string;
  }

  let { recipientPublicKey, plaintext }: Props = $props();
</script>

<form method="POST" class="workspace">
  <div class="workspace__section">
    <p class="workspace__instruction">Encrypt to this public key:</p>
    <CopyBlock text={recipientPublicKey} label="Recipient public key" />
  </div>

  <div class="workspace__section">
    <p class="workspace__instruction">Encrypt this message:</p>
    <CopyBlock text={plaintext} label="Message to encrypt" />
  </div>

  <div class="workspace__section">
    <MonoTextarea
      name="ciphertext"
      label="Paste your encrypted output here"
      rows={10}
      placeholder="-----BEGIN PGP MESSAGE-----"
      required
    />
  </div>

  <div class="workspace__actions">
    <Button type="submit" variant="primary" size="lg">Submit →</Button>
  </div>
</form>

<style>
  .workspace {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .workspace__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .workspace__instruction {
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  .workspace__actions {
    display: flex;
    gap: var(--space-4);
  }
</style>
