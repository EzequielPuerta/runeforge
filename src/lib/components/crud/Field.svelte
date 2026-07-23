<script lang="ts" generics="T extends object = Record<string, unknown>">
  import { onMount } from 'svelte';
  import Avatar from '$lib/components/Avatar.svelte';
  import Label from '$lib/components/form/Label.svelte';
  import Select from '$lib/components/form/Select.svelte';
  import EmbeddedField from '$lib/components/crud/EmbeddedField.svelte';
  import { fieldLabel, initials } from '$lib/components/crud/utils/misc.js';
  import type { FieldDefinition } from '$lib/types/crud.js';
  import { getStrings } from '$lib/i18n/context.js';

  const strings = getStrings();

  onMount(() => {
    import('cally');
  });

  let {
    field,
    record = $bindable({} as Record<string, unknown>),
    error = '',
    readonly = false,
  }: {
    field: FieldDefinition<T>;
    record?: Record<string, unknown>;
    error?: string;
    readonly?: boolean;
  } = $props();

  const name = $derived(readonly ? undefined : field.attribute);
  const labelText = $derived(fieldLabel(field));
  let filePreview = $state<string | null>(null);

  function onFileChange(e: Event & { currentTarget: HTMLInputElement }) {
    const file = e.currentTarget.files?.[0];
    if (filePreview) URL.revokeObjectURL(filePreview);
    filePreview = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
  }

  $effect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
  });

  const saved = $derived(record[field.attribute]);
  const preview = $derived(filePreview ?? (typeof saved === 'string' && saved ? saved : null));
  const avatarInitials = $derived(initials(record.firstName as string, record.lastName as string));
  const displayValue = $derived(saved == null ? '' : String(saved));
  const selectOptions = $derived(field.dependentOptions ? field.dependentOptions(record) : (field.options ?? []));
  const fieldDisabled = $derived(field.disabled ? field.disabled(record) : false);

  $effect(() => {
    if (!field.dependentOptions) return;
    const current = record[field.attribute];
    if (current && !selectOptions.some((o) => o.value === String(current))) {
      record[field.attribute] = '';
    }
  });
</script>

<div class="flex flex-col gap-1">
  {#if field.type === 'file'}
    <div class="flex justify-center">
      <Avatar src={preview} text={avatarInitials} alt={labelText} class="w-20 rounded-full" textClass="text-xl" />
    </div>
  {/if}

  <Label
    text={labelText}
    for={field.attribute}
    capitalize={true}
    required={field.required && !readonly}
  />

  {#if field.type === 'boolean'}
    <input
      type="checkbox"
      id={field.attribute}
      {name}
      class="toggle toggle-primary"
      checked={!!saved}
      disabled={readonly || fieldDisabled}
      onchange={(e) => { record[field.attribute] = (e.currentTarget as HTMLInputElement).checked; }}
    />
  {:else if field.type === 'file'}
    {#if !readonly}
      <input
        type="file"
        id={field.attribute}
        {name}
        class="file-input file-input-bordered w-full"
        class:file-input-error={!!error}
        disabled={fieldDisabled}
        onchange={onFileChange}
      />
    {/if}
    <!-- read-only file value is shown as the avatar above -->
  {:else if field.type === 'select'}
    {#if readonly}
      <input
        type="text"
        id={field.attribute}
        class="input input-bordered w-full"
        value={selectOptions.find((o) => o.value === String(saved))?.label ?? displayValue}
        disabled
      />
    {:else}
      <Select
        name={field.attribute}
        bind:value={record[field.attribute] as string}
        options={selectOptions}
        search={field.search}
        placeholder={field.placeholder}
        disabled={fieldDisabled}
        {error}
      />
    {/if}
  {:else if field.type === 'datetime'}
    {#if readonly}
      <input
        type="text"
        id={field.attribute}
        class="input input-bordered w-full"
        value={displayValue}
        disabled
      />
    {:else}
      <input type="hidden" {name} value={String(record[field.attribute] ?? '')} disabled={fieldDisabled} />
      <calendar-date
        class="cally rounded-box border border-base-300 bg-base-100 shadow-sm {fieldDisabled ? 'pointer-events-none opacity-50' : ''}"
        value={String(record[field.attribute] ?? '')}
        onchange={(e: Event) => { if (fieldDisabled) return; record[field.attribute] = (e.currentTarget as HTMLElement & { value: string }).value; }}
      >
        <svg aria-label={strings.previous} class="fill-current size-4" {...{"slot": "previous"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M15.75 19.5 8.25 12l7.5-7.5"/></svg>
        <svg aria-label={strings.next} class="fill-current size-4" {...{"slot": "next"}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>
        <calendar-month></calendar-month>
      </calendar-date>
    {/if}
  {:else if field.type === 'textarea'}
    {#if readonly}
      <textarea id={field.attribute} class="textarea textarea-bordered bg-base-100 w-full" value={displayValue} disabled></textarea>
    {:else}
      <textarea
        id={field.attribute}
        {name}
        placeholder={field.placeholder ?? ''}
        bind:value={record[field.attribute]}
        class="textarea textarea-bordered bg-base-100 w-full"
        class:textarea-error={!!error}
        disabled={fieldDisabled}
      ></textarea>
    {/if}
  {:else if field.type === 'embedded'}
    <EmbeddedField {field} bind:record {readonly} />
  {:else if readonly}
    <input
      type={field.type ?? 'text'}
      id={field.attribute}
      class="input input-bordered w-full"
      value={displayValue}
      disabled
    />
  {:else}
    <input
      type={field.type ?? 'text'}
      id={field.attribute}
      {name}
      placeholder={field.placeholder ?? ''}
      bind:value={record[field.attribute]}
      autocomplete={field.autocomplete}
      step={field.type === 'number' ? 'any' : undefined}
      class="input input-bordered w-full"
      class:input-error={!!error}
      disabled={fieldDisabled}
    />
  {/if}

  {#if error}
    <span class="text-error text-xs">{error}</span>
  {/if}
</div>
