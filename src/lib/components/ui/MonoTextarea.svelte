<script lang="ts">
	interface Props {
		name: string;
		id?: string;
		rows?: number;
		placeholder?: string;
		value?: string;
		error?: string;
		required?: boolean;
		label: string;
	}

	let {
		name,
		id,
		rows = 10,
		placeholder,
		value = $bindable(''),
		error,
		required = false,
		label
	}: Props = $props();

	const fieldId = $derived(id ?? `field-${name}`);
	const errorId = $derived(`${fieldId}-error`);
	const describedBy = $derived(error ? errorId : undefined);
</script>

<div class="form-field">
	<label for={fieldId} class="form-label">
		{label}
		{#if required}
			<span class="form-required" aria-hidden="true">*</span>
		{/if}
	</label>

	<textarea
		{name}
		id={fieldId}
		{rows}
		{placeholder}
		bind:value
		class="form-textarea mono-textarea"
		class:form-textarea--error={!!error}
		aria-required={required ? 'true' : undefined}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}></textarea>

	{#if error}
		<p id={errorId} class="form-error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.mono-textarea {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		min-block-size: 120px;
		resize: vertical;
		line-height: 1.6;
	}
</style>
