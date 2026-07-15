<script lang="ts">
  interface Props {
    name: string;
    label: string;
    accept: string;
    required?: boolean;
  }

  let { name, label, accept, required = false }: Props = $props();

  const fieldId = $derived(`field-${name}`);

  let isDragOver = $state(false);

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave() {
    isDragOver = false;
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragOver = false;
  }
</script>

<div class="form-field">
  <label for={fieldId} class="form-label">
    {label}
    {#if required}
      <span class="form-required" aria-hidden="true">*</span>
    {/if}
  </label>

  <div
    class="file-input__zone"
    class:file-input__zone--drag-over={isDragOver}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="presentation"
  >
    <input
      id={fieldId}
      type="file"
      {name}
      {accept}
      aria-required={required ? "true" : undefined}
      class="file-input__input"
    />

    <div class="file-input__label-content" aria-hidden="true">
      <span class="file-input__icon">📎</span>
      <span class="file-input__hint"> Choose a file or drag and drop here </span>
      <span class="file-input__accept">{accept}</span>
    </div>
  </div>
</div>

<style>
  .file-input__zone {
    position: relative;
    border: 2px dashed var(--border-color);
    border-radius: var(--radius-md);
    padding: var(--space-8);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      border-color var(--transition-base),
      background-color var(--transition-base);
    background-color: var(--color-gray-50);
    cursor: pointer;
    min-block-size: 120px;
  }

  .file-input__zone:hover,
  .file-input__zone--drag-over {
    border-color: var(--color-primary-600);
    background-color: var(--color-primary-50);
  }

  @media (prefers-color-scheme: dark) {
    .file-input__zone {
      background-color: rgb(255 255 255 / 3%);
    }

    .file-input__zone:hover,
    .file-input__zone--drag-over {
      background-color: rgb(99 102 241 / 10%);
    }
  }

  .file-input__input {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 1;
  }

  .file-input__input:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
    border-radius: var(--radius-md);
  }

  .file-input__label-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    pointer-events: none;
    text-align: center;
  }

  .file-input__icon {
    font-size: 2rem;
    line-height: 1;
  }

  .file-input__hint {
    font-size: var(--text-sm);
    color: var(--text-body);
    font-weight: 500;
  }

  .file-input__accept {
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }
</style>
