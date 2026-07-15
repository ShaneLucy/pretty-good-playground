<script lang="ts">
  import CopyBlock from "$lib/components/ui/CopyBlock.svelte";
  import MonoTextarea from "$lib/components/ui/MonoTextarea.svelte";
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    ciphertext: string;
  }

  let { ciphertext }: Props = $props();
</script>

<form method="POST" class="workspace">
  <div class="workspace__section">
    <p class="workspace__instruction">Decrypt this message using your private key:</p>
    <CopyBlock text={ciphertext} label="Encrypted message to decrypt" />
  </div>

  <div class="workspace__section">
    <MonoTextarea
      name="plaintext"
      label="What does it say? Paste the decrypted text here"
      rows={6}
      placeholder="Type the decrypted message here"
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
