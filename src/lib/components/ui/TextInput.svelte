<script lang="ts">
	interface Props {
		name: string;
		id?: string;
		type?: string;
		placeholder?: string;
		value?: string;
		error?: string;
		required?: boolean;
		label: string;
		helper?: string;
	}

	let {
		name,
		id,
		type = 'text',
		placeholder,
		value = $bindable(''),
		error,
		required = false,
		label,
		helper
	}: Props = $props();

	const fieldId = $derived(id ?? `field-${name}`);
	const errorId = $derived(`${fieldId}-error`);
	const helperId = $derived(`${fieldId}-helper`);
	const describedBy = $derived(
		[error ? errorId : null, helper ? helperId : null].filter(Boolean).join(' ') || undefined
	);
</script>

<div class="form-field">
	<label for={fieldId} class="form-label">
		{label}
		{#if required}
			<span class="form-required" aria-hidden="true">*</span>
		{/if}
	</label>

	{#if helper}
		<p id={helperId} class="form-helper">{helper}</p>
	{/if}

	<input
		{name}
		id={fieldId}
		{type}
		{placeholder}
		bind:value
		class="form-input"
		class:form-input--error={!!error}
		aria-required={required ? 'true' : undefined}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
	/>

	{#if error}
		<p id={errorId} class="form-error" role="alert">{error}</p>
	{/if}
</div>
