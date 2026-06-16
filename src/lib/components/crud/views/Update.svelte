<script lang="ts" generics="T extends object = Record<string, unknown>">
  import { untrack } from 'svelte';
  import { enhance } from '$app/forms';
  import Field from '$lib/components/crud/Field.svelte';
  import Button from '$lib/components/form/Button.svelte';
  import Header from '$lib/components/common/Header.svelte';
  import { getIconSet } from '$lib/icons/context.js';
  import { defaultIconSet } from '$lib/icons/sets/default.js';
  import { fieldLabel } from '$lib/components/crud/utils/misc.js';
  import type { ActionConfiguration, FieldDefinition } from '$lib/types/crud.js';
  import { getStrings } from '$lib/i18n/context.js';

  const strings = getStrings();

  let {
    labelOne = '',
    labelMany = '',
    icon,
    idKey = '_id',
    fields = [] as FieldDefinition<T>[],
    instance = {} as T,
    update = {} as ActionConfiguration<T>,
    serverError = '',
    onCancel,
    onSuccess,
  }: {
    labelOne?: string;
    labelMany?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any;
    idKey?: string;
    fields?: FieldDefinition<T>[];
    instance?: T;
    update?: ActionConfiguration<T>;
    serverError?: string;
    onCancel?: () => void;
    onSuccess?: () => void;
  } = $props();

  const icons = $derived(getIconSet() ?? defaultIconSet);
  const entityIcon = $derived(icon ?? icons.folder);

  let fieldErrors = $state<Record<string, string>>({});
  let internalError = $state('');

  function seedFromInstance(inst: Record<string, unknown>): Record<string, unknown> {
    const seeded: Record<string, unknown> = { ...inst };
    for (const f of fields) {
      if (f.type !== 'boolean' && f.type !== 'file') {
        seeded[f.attribute] = String(inst[f.attribute] ?? '');
      }
    }
    return seeded;
  }

  let record = $state<Record<string, unknown>>(
    untrack(() => seedFromInstance(instance as Record<string, unknown>))
  );

  $effect(() => {
    const id = (instance as Record<string, unknown>)[idKey];
    if (!id) return;
    untrack(() => { record = seedFromInstance(instance as Record<string, unknown>); });
  });

  function validateAll(formData: FormData): Record<string, string> {
    const errs: Record<string, string> = {};
    for (const field of fields) {
      if (field.required) {
        const val = String(formData.get(field.attribute) ?? '').trim();
        if (!val) errs[field.attribute] = strings.required(fieldLabel(field));
      }
    }
    return errs;
  }

  const hasFileField = $derived(fields.some((f) => f.type === 'file'));

  const errorEntries = $derived([
    ...((serverError || internalError) ? [['_global', internalError || serverError] as [string, string]] : []),
    ...Object.entries(fieldErrors),
  ]);
</script>

<div class="flex flex-col gap-6">

  <Header
    title={labelMany}
    breadcrumbs={[
      { label: labelMany, icon: entityIcon, link: { href: '#', onclick: (e) => { e.preventDefault(); onCancel?.(); } }, prominent: true },
      { label: update.label ?? labelOne, icon: icons.edit },
    ]}
  />

  {#if errorEntries.length > 0}
    <div role="alert" class="alert alert-error">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <ul class="list-disc list-inside text-sm">
        {#each errorEntries as [key, msg] (key)}
          <li>{msg}</li>
        {/each}
      </ul>
    </div>
  {/if}

  <form
    method="POST"
    action={update.endpoint ?? '?/update'}
    enctype={hasFileField ? 'multipart/form-data' : undefined}
    class="mx-auto flex w-full flex-col gap-4 px-4"
    use:enhance={({ formData, cancel }) => {
      fieldErrors = {};
      internalError = '';
      const errs = validateAll(formData);
      if (Object.keys(errs).length > 0) {
        fieldErrors = errs;
        cancel();
        return;
      }
      return async ({ result, update: updateForm }) => {
        if (result.type === 'success' || result.type === 'redirect') {
          await updateForm({ reset: false });
          onSuccess?.();
        } else if (result.type === 'error') {
          internalError = result.error?.message ?? strings.serverError;
        } else {
          await updateForm({ reset: false });
        }
      };
    }}
  >
    <input type="hidden" name="id" value={String(record[idKey] ?? '')} />

    {#each fields as field (field.attribute)}
      <Field {field} bind:record error={fieldErrors[field.attribute] ?? ''} />
    {/each}

    <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button variant="ghost" onclick={() => onCancel?.()}>
        {strings.cancel}
      </Button>
      <Button type="submit" variant="primary">
        {strings.save}
      </Button>
    </div>
  </form>
</div>

<style>
  form {
    max-width: var(--runeforge-form-max-width, 32rem);
  }
</style>
