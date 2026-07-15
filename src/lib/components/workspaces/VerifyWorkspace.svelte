<script lang="ts">
  import CopyBlock from "$lib/components/ui/CopyBlock.svelte";
  import Button from "$lib/components/ui/Button.svelte";

  interface Props {
    signedMessage: string;
  }

  let { signedMessage }: Props = $props();
</script>

<form method="POST" class="workspace">
  <div class="workspace__section">
    <p class="workspace__instruction">Verify this signed message using your PGP tool:</p>
    <CopyBlock text={signedMessage} label="Signed message to verify" />
  </div>

  <p class="workspace__hint">
    Copy the block above and verify it with your PGP tool. Once you have confirmed the signature is
    valid, submit below.
  </p>

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

  .workspace__hint {
    font-size: var(--text-sm);
    color: var(--text-body);
    line-height: 1.6;
  }

  .workspace__actions {
    display: flex;
    gap: var(--space-4);
  }
</style>
