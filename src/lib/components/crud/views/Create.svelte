<script lang="ts" generics="T extends object = Record<string, unknown>">
  import { untrack } from 'svelte';
  import { enhance } from '$app/forms';
  import Field from '$lib/components/crud/Field.svelte';
  import Button from '$lib/components/form/Button.svelte';
  import Header from '$lib/components/common/Header.svelte';
  import { getIconSet } from '$lib/icons/context.js';
  import { defaultIconSet } from '$lib/icons/sets/default.js';
  import { validateAll } from '$lib/components/crud/utils/validation.js';
  import { groupFields } from '$lib/components/crud/utils/grouping.js';
  import { applyDuplicateOmit, emptyRecord, seedRecord } from '$lib/components/crud/utils/embedded.js';
  import type { ActionConfiguration, FieldDefinition } from '$lib/types/crud.js';
  import { getStrings } from '$lib/i18n/context.js';

  const strings = getStrings();

  let {
    labelOne = '',
    labelMany = '',
    icon,
    fields = [] as FieldDefinition<T>[],
    creation = {} as ActionConfiguration<T>,
    serverError = '',
    seed = undefined as Record<string, unknown> | undefined,
    onCancel,
    onSuccess,
  }: {
    labelOne?: string;
    labelMany?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon?: any;
    fields?: FieldDefinition<T>[];
    creation?: ActionConfiguration<T>;
    serverError?: string;
    /** Pre-fills the form from another instance's values — used when the
     * create view is reached via an Update form's "Duplicate" button. */
    seed?: Record<string, unknown>;
    onCancel?: () => void;
    onSuccess?: () => void;
  } = $props();

  const icons = $derived(getIconSet() ?? defaultIconSet);
  const entityIcon = $derived(icon ?? icons.folder);

  let fieldErrors = $state<Record<string, string>>({});
  let internalError = $state('');
  let successMessage = $state('');
  let successTimeout: ReturnType<typeof setTimeout> | undefined;
  let continueCreating = $state(false);
  let duplicating = $state(false);

  function flashSuccess() {
    successMessage = strings.saveSuccess;
    clearTimeout(successTimeout);
    successTimeout = setTimeout(() => (successMessage = ''), 4000);
  }

  let record = $state<Record<string, unknown>>(
    untrack(() => (seed ? seedRecord(fields, seed) : emptyRecord(fields)))
  );

  const groups = $derived(groupFields(fields));
  const hasFileField = $derived(fields.some((f) => f.type === 'file'));

  const continueEnabled = $derived(creation.continue?.enabled ?? true);
  const continueLabel = $derived(creation.continue?.label ?? strings.saveAndContinue);
  const continueClass = $derived(creation.continue?.class ?? '');

  const duplicationEnabled = $derived(creation.duplication?.enabled ?? false);
  const duplicationLabel = $derived(creation.duplication?.label ?? strings.duplicate);
  const duplicationClass = $derived(creation.duplication?.class ?? '');

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
      { label: creation.label ?? labelOne, icon: icons.create },
    ]}
  />

  {#if successMessage}
    <div role="alert" class="alert alert-success">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      <span class="text-sm">{successMessage}</span>
    </div>
  {/if}

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
    action={creation.endpoint ?? '?/create'}
    enctype={hasFileField ? 'multipart/form-data' : undefined}
    class="mx-auto flex w-full flex-col gap-4 px-4"
    use:enhance={({ formData, cancel }) => {
      fieldErrors = {};
      internalError = '';
      successMessage = '';
      clearTimeout(successTimeout);
      const errs = validateAll(fields, formData, strings);
      if (Object.keys(errs).length > 0) {
        fieldErrors = errs;
        cancel();
        return;
      }
      return async ({ result, update }) => {
        if (result.type === 'success' || result.type === 'redirect') {
          await update({ reset: false });
          if (continueCreating) {
            record = emptyRecord(fields);
            fieldErrors = {};
            internalError = '';
            flashSuccess();
          } else if (duplicating) {
            fieldErrors = {};
            internalError = '';
            flashSuccess();
            record = applyDuplicateOmit(fields, record, creation.duplication?.omit);
          } else {
            onSuccess?.();
          }
        } else if (result.type === 'error') {
          internalError = result.error?.message ?? strings.serverError;
        } else {
          await update({ reset: false });
        }
      };
    }}
  >
    {#each groups as group, i (group.title ?? `_ungrouped_${i}`)}
      {#if group.title}
        <fieldset class="fieldset border border-base-300 rounded-box p-4">
          <legend class="fieldset-legend px-2">{group.title}</legend>
          <div class="flex flex-col gap-4">
            {#each group.rows as row (row.map((f) => f.attribute).join('|'))}
              {#if row.length > 1}
                <div class="flex flex-col gap-4 md:flex-row">
                  {#each row as field (field.attribute)}
                    <Field {field} bind:record error={fieldErrors[field.attribute] ?? ''} class="md:min-w-0 md:flex-1" />
                  {/each}
                </div>
              {:else}
                <Field field={row[0]} bind:record error={fieldErrors[row[0].attribute] ?? ''} />
              {/if}
            {/each}
          </div>
        </fieldset>
      {:else}
        {#each group.rows as row (row.map((f) => f.attribute).join('|'))}
          {#if row.length > 1}
            <div class="flex flex-col gap-4 md:flex-row">
              {#each row as field (field.attribute)}
                <Field {field} bind:record error={fieldErrors[field.attribute] ?? ''} class="md:min-w-0 md:flex-1" />
              {/each}
            </div>
          {:else}
            <Field field={row[0]} bind:record error={fieldErrors[row[0].attribute] ?? ''} />
          {/if}
        {/each}
      {/if}
    {/each}

    <div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <Button variant="ghost" onclick={() => onCancel?.()}>
        {strings.cancel}
      </Button>
      {#if duplicationEnabled}
        <Button
          type="submit"
          variant="warning"
          class={duplicationClass}
          onclick={() => {
            continueCreating = false;
            duplicating = true;
          }}
        >
          {duplicationLabel}
        </Button>
      {/if}
      {#if continueEnabled}
        <Button
          type="submit"
          variant="secondary"
          class={continueClass}
          onclick={() => {
            continueCreating = true;
            duplicating = false;
          }}
        >
          {continueLabel}
        </Button>
      {/if}
      <Button
        type="submit"
        variant="primary"
        onclick={() => {
          continueCreating = false;
          duplicating = false;
        }}
      >
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
